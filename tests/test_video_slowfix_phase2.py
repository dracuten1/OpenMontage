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
