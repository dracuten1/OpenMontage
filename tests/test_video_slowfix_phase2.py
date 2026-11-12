"""Phase 2 tests — video-slowfix throughput & concurrency scaling (tasks 2.1, 2.2, 2.4).

Covers:
- Task 2.1 ConcurrencyGovernor: safe permit tracking acceptance (plan
  Verification §1), cooldown window, sub-tier4 burst no-op, exception mid
  critical-section (try/finally discipline), orchestrator governor wiring.
- Task 2.1 startup tier probe matrix: tier4 -> 6, oauth/unknown -> 4,
  OM_MAX_CONCURRENCY override wins, probe never raises.
- Task 2.2 writer backoff: transient detection, jittered retry (mock sleep),
  exhaustion, non-transient no-retry, watchdog kill, on_retry sandbox reset.
- Task 2.4 shim import resolution: wrappers import `from tools.qc...` with
  parents[4] repo-root injection, never `from OpenMontage...`.
"""

from __future__ import annotations

import importlib.util
import io
import subprocess
import sys
import threading
import time
from pathlib import Path

import pytest

import tools.qc.concurrency_governor as cg
import tools.qc.scene_orchestrator as scene_orchestrator_module
import tools.qc.writer_runner as writer_runner_module
from tools.qc.concurrency_governor import (
    ANTHROPIC_TIER_PROBE_TIMEOUT_S,
    ConcurrencyGovernor,
    probe_anthropic_tier,
    resolve_max_concurrency,
)
from tools.qc.scene_orchestrator import AgentRunResult, WriterContext
from tools.qc.scene_orchestrator import (
    CallableAgentRunner,
    orchestrate_episode,
)
from tools.qc.writer_runner import (
    execute_writer_with_backoff,
    is_transient_api_error,
)
from tests.test_scene_orchestrator import make_test_episode

REPO_ROOT = Path(__file__).resolve().parents[1]
CC_PIPELINE = REPO_ROOT / "projects" / "tai-chinh-3tin-20261111" / "scripts" / "cc_pipeline"


# ==============================================================================
# Task 2.1 — ConcurrencyGovernor: safe permit tracking
# ==============================================================================

def test_governor_safe_permit_tracking_acceptance():
    """Plan Verification §1: burst reserves 2 permits, cooldown release restores
    exactly max_concurrency, permits_reserved reset, no ValueError anywhere."""
    gov = ConcurrencyGovernor(max_concurrency=6, cooldown_seconds=0.1)

    # Test safe burst handling when some permits are already held
    gov.acquire()  # holds 1 permit, 5 remain
    gov.handle_rate_limit_burst()  # reserves 2 permits, 3 remain
    assert gov.permits_reserved == 2
    assert gov.sem._value == 3

    time.sleep(0.15)  # elapse cooldown
    gov.release()  # checks restore and releases: 3 + 1 (release) + 2 (restore) = 6
    assert gov.sem._value == 6
    assert gov.permits_reserved == 0
    assert gov.throttled is False

    # BoundedSemaphore invariant intact: full acquisition succeeds cleanly.
    acquired = [gov.sem.acquire(blocking=False) for _ in range(6)]
    assert all(acquired)
    for _ in range(6):
        gov.sem.release()


def test_governor_burst_waits_for_cooldown_before_restore():
    """check_restore must not restore before cooldown_seconds elapse."""
    gov = ConcurrencyGovernor(max_concurrency=6, cooldown_seconds=60.0)
    gov.handle_rate_limit_burst()
    assert gov.throttled is True
    assert gov.permits_reserved == 2
    assert gov.sem._value == 4

    gov.release()  # cooldown NOT elapsed: only the worker permit is released
    assert gov.throttled is True
    assert gov.permits_reserved == 2
    assert gov.sem._value == 5


def test_governor_burst_noop_when_below_tier4_and_idempotent():
    """handle_rate_limit_burst is a no-op below max_concurrency 6 (rollback
    config, e.g. OM_MAX_CONCURRENCY=2) and latches after the first burst."""
    low = ConcurrencyGovernor(max_concurrency=4)
    low.acquire()
    low.handle_rate_limit_burst()
    assert low.throttled is False
    assert low.permits_reserved == 0
    assert low.sem._value == 3

    gov = ConcurrencyGovernor(max_concurrency=6)
    gov.acquire()
    gov.handle_rate_limit_burst()
    gov.handle_rate_limit_burst()  # already throttled: no second reservation
    assert gov.permits_reserved == 2
    assert gov.sem._value == 3


def test_exception_mid_critical_section_preserves_semaphore_count():
    """REQUIRED (task 2.1): an exception raised between acquire and release
    must not corrupt the BoundedSemaphore count — try/finally release
    discipline keeps the pool usable afterwards (no ValueError)."""
    gov = ConcurrencyGovernor(max_concurrency=6, cooldown_seconds=0.0)

    def bad_worker():
        gov.acquire()
        try:
            raise RuntimeError("scene worker exploded mid-critical-section")
        finally:
            gov.release()

    for _ in range(20):
        with pytest.raises(RuntimeError, match="exploded mid-critical-section"):
            bad_worker()

    assert gov.sem._value == 6  # count intact after every failure
    # The pool still grants the full budget (a leaked permit would hang/ValueError here).
    held = [gov.sem.acquire(blocking=False) for _ in range(6)]
    assert all(held)
    for _ in range(6):
        gov.sem.release()


def test_concurrent_worker_exceptions_keep_semaphore_balanced():
    """Many concurrent workers, some failing mid-section: acquires always
    paired with releases; afterwards the full permit budget is available."""
    gov = ConcurrencyGovernor(max_concurrency=6)
    failures: list[int] = []

    def critical_section(i: int):
        """Acquire -> (maybe raise) -> release, with try/finally discipline."""
        gov.acquire()
        try:
            if i % 3 == 0:
                raise RuntimeError(f"worker {i} failed")
            time.sleep(0.01)
        finally:
            gov.release()

    def worker(i: int):
        try:
            critical_section(i)
        except RuntimeError:
            failures.append(i)

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(24)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=10)

    assert len(failures) == 8  # every 3rd worker failed mid-critical-section
    assert gov.sem._value == 6
    held = [gov.sem.acquire(blocking=False) for _ in range(6)]
    assert all(held)
    for _ in range(6):
        gov.sem.release()


def test_orchestrator_scene_workers_use_governor_with_release_discipline(tmp_path, monkeypatch):
    """Task 2.1 wiring: every scene worker passes through the governor and an
    exception inside a scene cannot leak a permit from the shared semaphore."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2", "cut-3"])

    created: list[ConcurrencyGovernor] = []

    class _SpyGovernor(ConcurrencyGovernor):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            created.append(self)

    calls = {"n": 0}

    def _exploding_scene(sid, *args, **kwargs):
        calls["n"] += 1
        raise RuntimeError(f"scene {sid} exploded")

    monkeypatch.setattr(scene_orchestrator_module, "ConcurrencyGovernor", _SpyGovernor)
    monkeypatch.setattr(scene_orchestrator_module, "execute_scene_with_retries", _exploding_scene)

    session = orchestrate_episode(episode, max_concurrency=2, max_retries=0,
                                  runner=CallableAgentRunner())

    # All scenes recorded as failed (exception contained per-scene)
    assert calls["n"] == 3
    assert len(session.scenes) == 3
    assert all(r.status == "failed" for r in session.scenes.values())

    # Exactly one governor was created; every acquire got its release even
    # though every scene raised mid-flight.
    assert len(created) == 1
    gov = created[0]
    assert calls["n"] == 3  # three workers entered the critical section
    assert gov.sem._value == 2  # full budget restored: no leaked permits
    held = [gov.sem.acquire(blocking=False) for _ in range(2)]
    assert all(held)


def test_orchestrator_logs_ceiling_once_and_records_source(tmp_path, monkeypatch, caplog):
    """The chosen concurrency ceiling is logged once at orchestrator startup
    and the resolution source lands in the session config."""
    import logging

    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])
    runner = CallableAgentRunner()
    monkeypatch.setenv("OM_MAX_CONCURRENCY", "2")

    with caplog.at_level(logging.INFO, logger="tools.qc.scene_orchestrator"):
        session = orchestrate_episode(episode, runner=runner)  # no explicit -c

    assert session.config["max_concurrency"] == 2
    assert session.config["concurrency_source"] == "env:OM_MAX_CONCURRENCY"
    ceiling_logs = [r for r in caplog.records if "Concurrency ceiling" in r.getMessage()]
    assert len(ceiling_logs) == 1
    assert "2" in ceiling_logs[0].getMessage()
    assert "env:OM_MAX_CONCURRENCY" in ceiling_logs[0].getMessage()


def test_orchestrator_resolves_ceiling_from_probe_when_no_env(tmp_path, monkeypatch):
    """Without -c and without OM_MAX_CONCURRENCY, orchestrate_episode resolves
    the ceiling via the credential probe (probe says oauth -> 4)."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])
    monkeypatch.delenv("OM_MAX_CONCURRENCY", raising=False)
    monkeypatch.setattr(scene_orchestrator_module, "resolve_max_concurrency",
                        lambda: (4, "probe:oauth"))

    session = orchestrate_episode(episode, runner=CallableAgentRunner())
    assert session.config["max_concurrency"] == 4
    assert session.config["concurrency_source"] == "probe:oauth"


# ==============================================================================
# Task 2.1 — startup credential tier probe matrix
# ==============================================================================

def _probe_with_header(header, monkeypatch, env=None):
    monkeypatch.setattr(cg, "_fetch_rate_limit_header",
                        lambda api_key, timeout: header)
    base_env = {"ANTHROPIC_API_KEY": "sk-test"}
    if env:
        base_env.update(env)
    return probe_anthropic_tier(env=base_env)


def test_probe_matrix(monkeypatch):
    # No API key -> OAuth subscription path (claude CLI)
    assert probe_anthropic_tier(env={}) == "oauth"

    # API key, tier header parsing
    assert _probe_with_header("4000", monkeypatch) == "tier4"
    assert _probe_with_header("8000", monkeypatch) == "tier4"
    assert _probe_with_header("2000", monkeypatch) == "api-key"   # lower tier
    assert _probe_with_header("abc", monkeypatch) == "unknown"    # unparseable
    assert _probe_with_header(None, monkeypatch) == "unknown"     # header missing
    assert _probe_with_header("  ", monkeypatch) == "unknown"     # blank

    # Probe failure (network error, blocked socket, ...) -> unknown, never raises
    def _boom(api_key, timeout):
        raise OSError("network unavailable")
    monkeypatch.setattr(cg, "_fetch_rate_limit_header", _boom)
    assert probe_anthropic_tier(env={"ANTHROPIC_API_KEY": "sk-test"}) == "unknown"


def test_probe_has_hard_timeout_default():
    """Probe is best-effort with a bounded timeout; a slow endpoint cannot
    stall orchestrator startup."""
    assert ANTHROPIC_TIER_PROBE_TIMEOUT_S == 3.0
    import inspect
    sig = inspect.signature(probe_anthropic_tier)
    assert sig.parameters["timeout"].default == ANTHROPIC_TIER_PROBE_TIMEOUT_S


@pytest.mark.parametrize(
    "env,probe_tier,expected_value,expected_source",
    [
        ({}, "tier4", 6, "probe:tier4"),
        ({}, "oauth", 4, "probe:oauth"),
        ({}, "unknown", 4, "probe:unknown"),
        ({}, "api-key", 4, "probe:api-key"),
        ({"OM_MAX_CONCURRENCY": "2"}, "tier4", 2, "env:OM_MAX_CONCURRENCY"),  # rollback value
        ({"OM_MAX_CONCURRENCY": "7"}, "oauth", 7, "env:OM_MAX_CONCURRENCY"),  # explicit override
        ({"OM_MAX_CONCURRENCY": "abc"}, "tier4", 6, "probe:tier4"),           # invalid -> probe
        ({"OM_MAX_CONCURRENCY": "0"}, "oauth", 4, "probe:oauth"),             # out of range -> probe
    ],
)
def test_resolve_max_concurrency_env_overrides_probe(env, probe_tier, expected_value, expected_source):
    value, source = resolve_max_concurrency(env=env, probe=lambda: probe_tier)
    assert value == expected_value
    assert source == expected_source


# ==============================================================================
# Task 2.2 — writer transient-error detection + jittered backoff
# ==============================================================================

class _ScriptedProc:
    def __init__(self, returncode: int, stdout: str):
        self.returncode = returncode
        self._stdout = stdout

    def communicate(self, task=None):
        return self._stdout, None


class _SpyGovernor:
    def __init__(self):
        self.bursts = 0

    def handle_rate_limit_burst(self):
        self.bursts += 1


@pytest.mark.parametrize(
    "output,expected",
    [
        ("API error: rate_limit_error (request id x)", True),
        ("429 Too Many Requests", True),
        ("overloaded_error while streaming", True),
        ("529 Site Overloaded", True),
        ("ServiceUnavailable", True),
        ("model capacity exceeded", True),
        ("RATE_LIMIT_ERROR", True),  # case-insensitive
        ("syntax error in generated scene", False),
        ("", False),
    ],
)
def test_is_transient_api_error_markers(output, expected):
    assert is_transient_api_error(output) is expected


def test_backoff_retries_transient_then_succeeds(monkeypatch):
    sleeps: list[float] = []
    monkeypatch.setattr(writer_runner_module.time, "sleep", lambda s: sleeps.append(s))
    procs = iter([
        _ScriptedProc(1, "error: rate_limit_error, try again"),
        _ScriptedProc(0, "writer done"),
    ])
    spawned: list[int] = []
    monkeypatch.setattr(writer_runner_module.subprocess, "Popen",
                        lambda *a, **k: (spawned.append(1), next(procs))[1])
    gov = _SpyGovernor()

    rc, stdout = execute_writer_with_backoff(["claude"], cwd=".", env={}, task="t", governor=gov)

    assert (rc, stdout) == (0, "writer done")
    assert len(spawned) == 2              # retried exactly once
    assert gov.bursts == 1                # 429 burst reported to the governor
    assert len(sleeps) == 1
    # attempt 1: (2**1)*2.0 + uniform(0.5, 2.5) -> [4.5, 6.5]
    assert 4.5 <= sleeps[0] <= 6.5


def test_backoff_sleep_grows_exponentially(monkeypatch):
    sleeps: list[float] = []
    monkeypatch.setattr(writer_runner_module.time, "sleep", lambda s: sleeps.append(s))
    procs = iter([_ScriptedProc(1, "429 Too Many Requests")] * 3 + [_ScriptedProc(0, "ok")])
    monkeypatch.setattr(writer_runner_module.subprocess, "Popen",
                        lambda *a, **k: next(procs))
    gov = _SpyGovernor()

    rc, _ = execute_writer_with_backoff(["claude"], cwd=".", env={}, task="t", governor=gov)

    assert rc == 0
    assert gov.bursts == 3
    # attempt 2: (2**2)*2.0 -> [8.5, 10.5]; attempt 3: (2**3)*2.0 -> [16.5, 18.5]
    assert 8.5 <= sleeps[1] <= 10.5
    assert 16.5 <= sleeps[2] <= 18.5
    assert sleeps[0] < sleeps[1] < sleeps[2]


def test_backoff_exhausts_max_attempts(monkeypatch):
    sleeps: list[float] = []
    monkeypatch.setattr(writer_runner_module.time, "sleep", lambda s: sleeps.append(s))
    spawned: list[int] = []
    monkeypatch.setattr(writer_runner_module.subprocess, "Popen",
                        lambda *a, **k: (spawned.append(1), _ScriptedProc(1, "overloaded_error"))[1])
    gov = _SpyGovernor()

    rc, stdout = execute_writer_with_backoff(["claude"], cwd=".", env={}, task="t",
                                             governor=gov, max_attempts=4)
    assert rc == 1
    assert stdout == "Exhausted retries on API errors"
    assert len(spawned) == 4              # default max_attempts=4
    assert gov.bursts == 4
    assert len(sleeps) == 4


def test_backoff_non_transient_failure_returns_immediately(monkeypatch):
    sleeps: list[float] = []
    monkeypatch.setattr(writer_runner_module.time, "sleep", lambda s: sleeps.append(s))
    spawned: list[int] = []
    monkeypatch.setattr(writer_runner_module.subprocess, "Popen",
                        lambda *a, **k: (spawned.append(1), _ScriptedProc(1, "tsc: TS2304 not found"))[1])
    gov = _SpyGovernor()

    rc, stdout = execute_writer_with_backoff(["claude"], cwd=".", env={}, task="t", governor=gov)
    assert rc == 1
    assert stdout == "tsc: TS2304 not found"
    assert len(spawned) == 1              # content failure: no retry
    assert gov.bursts == 0
    assert sleeps == []


def test_backoff_watchdog_kills_hung_session(monkeypatch):
    """Per-attempt watchdog (phase1 task 1.4 heritage) survives inside the
    retry loop: a hung CLI session is killed after watchdog_seconds."""
    class _HangingProc:
        def __init__(self):
            self.returncode = None
            self._killed = threading.Event()
            self.was_killed = False

        def poll(self):
            return 1 if self._killed.is_set() else None

        def kill(self):
            self.was_killed = True
            self._killed.set()

        def communicate(self, task=None):
            self._killed.wait(timeout=5)
            self.returncode = 1
            return "", None

    proc = _HangingProc()
    monkeypatch.setattr(writer_runner_module.subprocess, "Popen", lambda *a, **k: proc)
    monkeypatch.setattr(writer_runner_module.time, "sleep", lambda s: None)
    gov = _SpyGovernor()

    rc, _ = execute_writer_with_backoff(["claude"], cwd=".", env={}, task="t",
                                        governor=gov, watchdog_seconds=0.05)
    assert proc.was_killed is True
    assert rc == 1


def test_backoff_on_retry_resets_sandbox(monkeypatch):
    """on_retry fires before each re-attempt so retries start from a fresh
    sandbox (phase1 task 1.3: retries start fresh)."""
    monkeypatch.setattr(writer_runner_module.time, "sleep", lambda s: None)
    procs = iter([
        _ScriptedProc(1, "429 Too Many Requests"),
        _ScriptedProc(0, "ok"),
    ])
    monkeypatch.setattr(writer_runner_module.subprocess, "Popen", lambda *a, **k: next(procs))
    resets = {"n": 0}
    gov = _SpyGovernor()

    execute_writer_with_backoff(["claude"], cwd=".", env={}, task="t", governor=gov,
                                on_retry=lambda: resets.__setitem__("n", resets["n"] + 1))
    assert resets["n"] == 1


# ==============================================================================
# Task 2.4 — project shim sys.path resolution
# ==============================================================================

def _load_wrapper(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.mark.parametrize(
    "wrapper_name,import_probe,expected_symbol",
    [
        ("writer_wrapper.py", "tools/qc/writer_runner.py", "execute_writer_with_backoff"),
        ("reviewer_wrapper.py", "tools/qc/reviewer_runner.py", "extract_verdict"),
    ],
)
def test_shim_resolves_tools_qc_imports(wrapper_name, import_probe, expected_symbol):
    """Plan Verification §3: wrappers inject repo root via parents[4] and
    import `from tools.qc...` cleanly — no ModuleNotFoundError."""
    mod = _load_wrapper(CC_PIPELINE / wrapper_name, f"phase2_{wrapper_name}")
    assert mod.REPO_ROOT == REPO_ROOT  # parents[4] lands exactly on repo root
    assert str(REPO_ROOT) in sys.path
    assert hasattr(mod, expected_symbol)
    assert (REPO_ROOT / import_probe).is_file()


@pytest.mark.parametrize("wrapper_name", ["writer_wrapper.py", "reviewer_wrapper.py"])
def test_shim_wrapper_subprocess_imports_without_module_not_found(wrapper_name):
    """Run each wrapper as a real subprocess (plan Verification §3 shape):
    the sys.path shim must resolve tools.qc — failure must not be
    ModuleNotFoundError (missing env vars later is expected and fine)."""
    result = subprocess.run(
        [sys.executable, str(CC_PIPELINE / wrapper_name)],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        timeout=60,
        env={"PATH": "/usr/bin:/bin:/usr/local/bin", "HOME": str(REPO_ROOT)},
    )
    combined = result.stdout + result.stderr
    assert "ModuleNotFoundError" not in combined
    assert "No module named" not in combined


@pytest.mark.parametrize("wrapper_name", ["writer_wrapper.py", "reviewer_wrapper.py"])
def test_shim_never_imports_openmontage_package_path(wrapper_name):
    """Plan rule: strictly `from tools.qc...` — never `from OpenMontage.tools.qc...`."""
    source = (CC_PIPELINE / wrapper_name).read_text(encoding="utf-8")
    assert "from OpenMontage" not in source
    assert "import OpenMontage" not in source


# ==============================================================================
# Review iteration 1 — FIX 1: shared-governor burst signal from writer results
# ==============================================================================

def test_writer_429_burst_throttles_shared_governor_pool(tmp_path, monkeypatch):
    """Review fix 1 acceptance: a transient-API writer failure seen by the
    orchestrator must throttle the SHARED pool governor (not just the wrapper
    subprocess's private governor): throttled True, pool value drops, second
    burst is a no-op, cooldown restore returns the pool to full."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])
    created: list[ConcurrencyGovernor] = []

    class _FrozenCooldownGovernor(ConcurrencyGovernor):
        def __init__(self, *args, **kwargs):
            kwargs["cooldown_seconds"] = 9999.0  # keep the latch observable
            super().__init__(*args, **kwargs)
            created.append(self)

    def transient_writer(ctx: WriterContext) -> AgentRunResult:
        return AgentRunResult(
            instance_id=ctx.instance_id, token=ctx.token, role="writer",
            exit_code=1, started_at="2026-11-12T00:00:00Z",
            finished_at="2026-11-12T00:00:01Z", duration_seconds=1.0,
            stdout="API error: rate_limit_error", stderr="",
        )

    monkeypatch.setattr(scene_orchestrator_module, "ConcurrencyGovernor", _FrozenCooldownGovernor)
    session = orchestrate_episode(
        episode, max_concurrency=6, max_retries=0,
        runner=CallableAgentRunner(writer_fn=transient_writer),
    )

    assert session.scenes["cut-1"].status == "failed"
    gov = created[0]
    # Worker held 1 permit (6->5); burst reserved 2 -> pool value 3; release -> 4
    assert gov.throttled is True
    assert gov.permits_reserved == 2
    assert gov.sem._value == 4

    # Second burst is a no-op (latch)
    gov.handle_rate_limit_burst()
    assert gov.permits_reserved == 2
    assert gov.sem._value == 4

    # Cooldown elapses -> next acquire restores exactly the reserved permits
    gov.last_throttled_at -= 10000.0
    gov.acquire()
    assert gov.permits_reserved == 0
    assert gov.throttled is False
    gov.release()
    assert gov.sem._value == 6  # pool back to full, no ValueError


# ==============================================================================
# Review iteration 1 — FIX 2: structured spawn failure (phase 1 parity)
# ==============================================================================

def test_backoff_spawn_failure_returns_structured_no_retry(monkeypatch):
    """Review fix 2: Popen FileNotFoundError/OSError must NOT escape as a
    traceback — structured (1, "Writer spawn failed: ..."), single attempt,
    no backoff sleep, no burst signal (phase 1 _spawn_claude parity)."""
    spawned: list[int] = []

    def _boom(*a, **k):
        spawned.append(1)
        raise FileNotFoundError("[Errno 2] claude binary missing")

    monkeypatch.setattr(writer_runner_module.subprocess, "Popen", _boom)
    sleeps: list[float] = []
    monkeypatch.setattr(writer_runner_module.time, "sleep", lambda s: sleeps.append(s))
    gov = _SpyGovernor()

    rc, stdout = execute_writer_with_backoff(["claude"], cwd=".", env={}, task="t", governor=gov)

    assert rc == 1
    assert stdout == "Writer spawn failed: [Errno 2] claude binary missing"
    assert len(spawned) == 1       # no pointless retry storm
    assert sleeps == []
    assert gov.bursts == 0


def test_backoff_spawn_failure_logged_to_history(monkeypatch, tmp_path):
    log_path = tmp_path / "cc_writer_x.log"
    with open(log_path, "w", encoding="utf-8") as fp:
        monkeypatch.setattr(writer_runner_module.subprocess, "Popen",
                            lambda *a, **k: (_ for _ in ()).throw(OSError("spawn boom")))
        rc, _ = execute_writer_with_backoff(["claude"], cwd=".", env={}, task="t",
                                            governor=_SpyGovernor(), log_handle=fp)
    assert rc == 1
    content = log_path.read_text(encoding="utf-8")
    assert "WRITER SPAWN FAIL: spawn boom" in content


# ==============================================================================
# Review iteration 1 — FIX 3: history log preserves every attempt (streamed)
# ==============================================================================

class _StreamingProc:
    """Fake CLI proc with real-pipe semantics: stdin sink + line-iterable stdout."""

    def __init__(self, returncode: int, stdout_lines: list[str]):
        self.returncode = None
        self._rc = returncode
        self._lines = stdout_lines
        self.stdin = _StdinSink()
        self.stdout = io.StringIO("".join(stdout_lines))
        self._closed = threading.Event()

    def poll(self):
        return self._rc if self._closed.is_set() else None

    def kill(self):
        self._closed.set()

    def wait(self, timeout=None):
        self._closed.set()
        self.returncode = self._rc
        return self.returncode


class _StdinSink:
    def write(self, data):
        return len(data)

    def close(self):
        pass


def test_backoff_history_log_preserves_all_attempts(monkeypatch, tmp_path):
    """Review fix 3: with log_handle, every attempt is delimited in the history
    log and earlier attempts' output survives (the buffered variant kept only
    the last attempt's output)."""
    monkeypatch.setattr(writer_runner_module.time, "sleep", lambda s: None)
    procs = iter([
        _StreamingProc(1, ["rate_limit_error: slow down\n", "please retry\n"]),
        _StreamingProc(0, ["writer done\n"]),
    ])
    monkeypatch.setattr(writer_runner_module.subprocess, "Popen", lambda *a, **k: next(procs))
    gov = _SpyGovernor()
    log_path = tmp_path / "cc_writer_s1.log"

    with open(log_path, "w", encoding="utf-8") as fp:
        rc, stdout = execute_writer_with_backoff(["claude"], cwd=".", env={}, task="t",
                                                 governor=gov, log_handle=fp)

    assert rc == 0
    assert stdout == "writer done\n"
    content = log_path.read_text(encoding="utf-8")
    assert "===== attempt 1/4 =====" in content
    assert "===== attempt 2/4 =====" in content
    assert "rate_limit_error: slow down" in content  # attempt 1 output preserved
    assert "writer done" in content


def test_writer_wrapper_history_log_preserves_attempts(tmp_path, monkeypatch):
    """Wrapper-level: the history log is written live with attempt delimiters
    while the sandbox promotion path keeps its phase 1 behavior intact."""
    from tests.test_video_slowfix_phase1 import _make_writer_episode

    ep = _make_writer_episode(tmp_path)
    spec = importlib.util.spec_from_file_location(
        "om_writer_wrapper_fix3", CC_PIPELINE / "writer_wrapper.py"
    )
    mod = importlib.util.module_from_spec(spec)
    monkeypatch.setenv("OM_SCENE_ID", "scene-1")
    monkeypatch.setenv("OM_EPISODE_DIR", str(ep))
    monkeypatch.setenv("OM_ATTEMPT_INDEX", "1")
    monkeypatch.delenv("OM_LEGACY_QUARANTINE", raising=False)
    monkeypatch.setattr(cg, "_TIER_CACHE", "oauth")  # no network probe in test
    spec.loader.exec_module(mod)

    sandbox_file = ep / ".tmp_sandboxes" / "scene-1_1" / "scene-1.tsx"

    class _SceneWritingProc(_StreamingProc):
        """Fake claude session: streams output AND writes the sandbox scene
        (phase 1 promotion path needs the artifact, like the phase1 fake)."""

        def __init__(self):
            super().__init__(0, ["writer session output line\n"])
            self._sandbox_file = sandbox_file

        def wait(self, timeout=None):
            rc = super().wait(timeout)
            self._sandbox_file.parent.mkdir(parents=True, exist_ok=True)
            self._sandbox_file.write_text(
                "export default () => <div>sandboxed scene</div>;" + "// " + "x" * 220,
                encoding="utf-8",
            )
            return rc

    fake = _SceneWritingProc()
    monkeypatch.setattr("subprocess.Popen", lambda *a, **k: fake)
    monkeypatch.setattr(mod, "_tsc_own_scene_fail", lambda episode, scene_id: (False, ""))

    rc = mod.main()
    assert rc == 0
    history = mod.PROJ_ROOT / "history" / "cc_writer_scene-1.log"
    content = history.read_text(encoding="utf-8")
    assert "===== attempt 1/4 =====" in content
    assert "writer session output line" in content
    # phase 1 promotion behavior intact
    assert "sandboxed scene" in (ep / "scenes" / "S01.tsx").read_text(encoding="utf-8")
    assert sandbox_file.is_file()


# ==============================================================================
# Review iteration 1 — FIX 4: launcher default = credential probe (auto)
# ==============================================================================

def _load_launcher():
    # tools.qc.scene_orchestrator is already imported at this module's top, so
    # the launcher's sys.path.insert of another checkout resolves to the cached
    # worktree modules.
    spec = importlib.util.spec_from_file_location(
        "om_run_cc_pipeline_fix4",
        CC_PIPELINE / "run_cc_pipeline.py",
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_launcher_repo_root_is_not_hardcoded():
    mod = _load_launcher()
    assert mod.REPO == REPO_ROOT  # static parents[4], no absolute checkout pin


def test_launcher_concurrency_default_is_probe_auto(monkeypatch):
    """Review fix 4 acceptance: launcher with OM_MAX_CONCURRENCY unset must
    pass None (orchestrator probes: tier4->6, oauth/unknown->4); env set wins."""
    from types import SimpleNamespace

    mod = _load_launcher()
    assert mod.resolve_launcher_concurrency(env={}) is None
    assert mod.resolve_launcher_concurrency(env={"OM_MAX_CONCURRENCY": "2"}) == 2
    assert mod.resolve_launcher_concurrency(env={"OM_MAX_CONCURRENCY": "6"}) == 6

    fake_session = SimpleNamespace(
        session_id="s", overall_status="fail", scenes={}, episode_gate_result={"valid": False},
    )
    captured: dict = {}

    def _fake_orchestrate(**kwargs):
        captured.update(kwargs)
        return fake_session

    monkeypatch.setattr(mod, "orchestrate_episode", _fake_orchestrate)

    monkeypatch.delenv("OM_MAX_CONCURRENCY", raising=False)
    mod.main()
    assert captured["max_concurrency"] is None  # -> orchestrator tier probe

    monkeypatch.setenv("OM_MAX_CONCURRENCY", "2")  # explicit override still wins
    mod.main()
    assert captured["max_concurrency"] == 2


# ==============================================================================
# Review iteration 1 — FIX 5: probe cache + true concurrency source
# ==============================================================================

def test_probe_tier_cached_per_process(monkeypatch):
    """Review fix 5: default-path resolve runs the network probe at most once
    per process; the env check stays live so OM_MAX_CONCURRENCY keeps winning
    dynamically. Explicit probe args bypass the cache."""
    monkeypatch.setattr(cg, "_TIER_CACHE", None)
    calls = {"n": 0}

    def _counting_probe():
        calls["n"] += 1
        return "tier4"

    monkeypatch.setattr(cg, "probe_anthropic_tier", _counting_probe)

    assert resolve_max_concurrency() == (6, "probe:tier4")   # first: real probe call
    assert calls["n"] == 1
    assert resolve_max_concurrency() == (6, "probe:tier4")   # cached
    assert resolve_max_concurrency() == (6, "probe:tier4")
    assert calls["n"] == 1

    monkeypatch.setenv("OM_MAX_CONCURRENCY", "3")  # env stays live, no probe
    assert resolve_max_concurrency() == (3, "env:OM_MAX_CONCURRENCY")
    assert calls["n"] == 1

    monkeypatch.delenv("OM_MAX_CONCURRENCY")                    # back to probe path
    assert resolve_max_concurrency(env={}, probe=lambda: "oauth") == (4, "probe:oauth")  # bypass cache
    assert calls["n"] == 1                                      # cached probe untouched


def test_orchestrator_concurrency_source_is_threaded_not_mislabeled(tmp_path):
    """Review fix 5: a caller that resolved the ceiling itself passes the true
    source; config must not say 'arg' for an env/probe-resolved ceiling."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])
    runner = CallableAgentRunner()

    session = orchestrate_episode(episode, max_concurrency=4, runner=runner)
    assert session.config["concurrency_source"] == "arg"  # bare int: honest label

    session = orchestrate_episode(episode, max_concurrency=4,
                                  concurrency_source="probe:tier4", runner=runner)
    assert session.config["concurrency_source"] == "probe:tier4"


# ==============================================================================
# Review iteration 1 — FIX 6: partial reservation + burst/release stress
# ==============================================================================

def test_partial_reservation_releases_only_acquired_permits():
    """Review fix 6: saturated pool (1 permit left) -> burst reserves exactly 1
    (acquired==1 path); restore releases only that permit — the historical
    over-release ValueError must stay impossible."""
    gov = ConcurrencyGovernor(max_concurrency=6, cooldown_seconds=0.0)
    held = [gov.sem.acquire(blocking=False) for _ in range(5)]
    assert all(held)
    assert gov.sem._value == 1

    gov.handle_rate_limit_burst()
    assert gov.permits_reserved == 1  # only 1 was actually available
    assert gov.sem._value == 0

    time.sleep(0.05)
    gov.release()  # release worker permit + restore the 1 reserved -> no ValueError
    assert gov.permits_reserved == 0
    assert gov.throttled is False

    for _ in range(4):
        gov.sem.release()
    assert gov.sem._value == 6  # exact accounting: full pool, nothing invented


def test_stress_burst_and_concurrent_release_no_corruption():
    """Review fix 6: mixed burst + concurrent acquire/release storm — the
    BoundedSemaphore must end balanced (value == max, reserved drained,
    throttled cleared) with zero ValueError anywhere."""
    gov = ConcurrencyGovernor(max_concurrency=6, cooldown_seconds=0.05)
    stop = threading.Event()
    errors: list[BaseException] = []

    def worker():
        try:
            while not stop.is_set():
                gov.acquire()
                try:
                    time.sleep(0.001)
                finally:
                    gov.release()
        except BaseException as e:  # ValueError here = corruption caught
            errors.append(e)

    def burster():
        try:
            for _ in range(3):
                gov.handle_rate_limit_burst()
                time.sleep(0.01)
        except BaseException as e:
            errors.append(e)

    threads = [threading.Thread(target=worker) for _ in range(12)]
    burst_thread = threading.Thread(target=burster)
    for t in threads:
        t.start()
    burst_thread.start()
    time.sleep(0.3)
    stop.set()
    for t in threads:
        t.join(timeout=10)
    burst_thread.join(timeout=5)

    assert errors == []
    time.sleep(0.06)  # elapse cooldown
    gov.acquire()      # triggers check_restore -> drains reserved permits
    gov.release()
    assert gov.sem._value == 6
    assert gov.permits_reserved == 0
    assert gov.throttled is False
