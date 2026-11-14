"""Tests for hermes-video-run-slowfix Phase 1 (OpenMontage side).

Covers tasks 1.1-1.4 + 1.6:
- 1.1 reviewer read-only lockdown: acceptEdits mode + Read/Glob/Grep CLI scoping,
  delimited verdict extraction,
  code-fence stripping, missing-delimiter / decode-failure fallbacks
- 1.2 scene dir/filename resolvers, scoped reviewer ownership 3-tuple
  (sibling/artifact/packet/history exclusions + plan acceptance example),
  per-file chmod 444 lock during review
- 1.3 scoped writer hash diffing (.tmp_sandboxes/, history/, siblings) +
  atomic sandbox promotion + OM_LEGACY_QUARANTINE kill-switch dispatch
- 1.4 watchdog timeout_error distinction (wrapper findings + orchestrator
  infrastructure retry)
- 1.6 gate-name normalization + repo-root path resolution
"""

from __future__ import annotations

import json
import threading
from pathlib import Path

import pytest

from tools.qc.reviewer_runner import (
    DEFAULT_REVIEW_WATCHDOG_S,
    build_reviewer_cmd,
    extract_verdict,
    get_scenes_dir as rr_get_scenes_dir,
    resolve_scene_filename as rr_resolve_scene_filename,
)
from tools.qc.scene_orchestrator import (
    AgentRunResult,
    CallableAgentRunner,
    ReviewerContext,
    execute_scene_with_retries,
    get_scenes_dir,
    resolve_scene_filename,
    snapshot_directory_hashes,
    verify_reviewer_ownership,
    verify_writer_scope,
)
from lib.production_validation import (
    GATE_EDITORIAL_LANGUAGE,
    GATE_TIMING_AUDIO,
    REPO_ROOT,
    canonical_gate,
    normalize_gate_name,
    resolve_evidence_path,
)
from tools.qc.episode_gate import _contained_path
from tests.test_scene_orchestrator import make_test_episode

REVIEWER_WRAPPER_DIR = Path(__file__).resolve().parents[1] / "projects" / "tai-chinh-3tin-20261111" / "scripts" / "cc_pipeline"


# ==============================================================================
# Task 1.1 — reviewer CLI lockdown + verdict extraction
# ==============================================================================

def test_build_reviewer_cmd_is_read_only():
    cmd = build_reviewer_cmd("30")
    assert cmd[0] == "claude"
    assert "--permission-mode" in cmd
    # Reviewer-timeout hotfix: acceptEdits (plan/default modes return EMPTY
    # stdout with --dangerously-skip-permissions); write-containment comes
    # from --allowedTools Read,Glob,Grep scoping, not the mode.
    assert cmd[cmd.index("--permission-mode") + 1] == "acceptEdits"
    assert cmd[cmd.index("--allowedTools") + 1] == "Read,Glob,Grep"
    assert cmd[cmd.index("--max-turns") + 1] == "30"


def test_extract_verdict_clean_json():
    stdout = 'blah\n<!-- VERDICT_START -->\n{"scene_id": "scene-1", "verdict": "approved", "issues": [], "metrics": {"complexity": "low"}}\n<!-- VERDICT_END -->\n'
    verdict, issues, data = extract_verdict(stdout)
    assert verdict == "approved"
    assert issues == []
    assert data["metrics"] == {"complexity": "low"}


def test_extract_verdict_strips_code_fences():
    stdout = (
        "<!-- VERDICT_START -->\n```json\n"
        '{"scene_id": "scene-2", "verdict": "rejected", "issues": ["overflow"], "metrics": {"complexity": "high"}}\n'
        "```\n<!-- VERDICT_END -->"
    )
    verdict, issues, _ = extract_verdict(stdout)
    assert verdict == "rejected"
    assert issues == ["overflow"]


def test_extract_verdict_missing_delimiter():
    verdict, issues, data = extract_verdict("The scene looks fine to me.")
    assert verdict == "rejected"
    assert issues == ["Delimiter <!-- VERDICT_START --> not found in reviewer output"]
    assert data == {}


def test_extract_verdict_json_decode_failure():
    stdout = "<!-- VERDICT_START -->\n```json\n{not json}\n```\n<!-- VERDICT_END -->"
    verdict, issues, _ = extract_verdict(stdout)
    assert verdict == "rejected"
    assert issues and issues[0].startswith("Verdict JSON decode failure:")


# ==============================================================================
# Task 1.2 — resolvers + scoped reviewer ownership
# ==============================================================================

def test_get_scenes_dir_prefers_scenes(tmp_path):
    (tmp_path / "scenes").mkdir()
    assert get_scenes_dir(tmp_path).name == "scenes"
    assert rr_get_scenes_dir(tmp_path).name == "scenes"
    assert get_scenes_dir(tmp_path / "elsewhere").name == "scene"


def test_resolve_scene_filename_mappings(tmp_path):
    d = tmp_path / "scenes"
    d.mkdir()
    (d / "S01.tsx").write_text("x")
    assert resolve_scene_filename(d, "scene-1") == "S01.tsx"
    assert resolve_scene_filename(d, "scene-1") == rr_resolve_scene_filename(d, "scene-1")
    (d / "S2.tsx").write_text("x")
    assert resolve_scene_filename(d, "scene-2") == "S2.tsx"
    (d / "scene-3.tsx").write_text("x")
    assert resolve_scene_filename(d, "scene-3") == "scene-3.tsx"
    # no candidates -> deterministic fallback
    assert resolve_scene_filename(d, "scene-99") == "scene-99.tsx"


def test_reviewer_ownership_plan_acceptance_example():
    """Plan acceptance cmd 2: sibling scene + artifacts mutations are ignored."""
    before = {"scenes/S01.tsx": "hash1", "scenes/S02.tsx": "hash2"}
    after = {"scenes/S01.tsx": "hash1", "scenes/S02.tsx": "hash2_modified",
             "artifacts/evidence_S02.json": "h"}
    ok, violations, err = verify_reviewer_ownership(before, after, "scene-1", Path("."))
    assert ok is True
    assert err is None
    assert violations == []


def test_reviewer_ownership_target_mutation_flagged():
    before = {"scenes/S01.tsx": "hash1", "scenes/S02.tsx": "hash2"}
    after = dict(before)
    after["scenes/S01.tsx"] = "hash1_mutated"
    ok, violations, err = verify_reviewer_ownership(before, after, "scene-1", Path("."))
    assert ok is False
    assert err is not None
    assert "Reviewer modified canonical files" in err
    # target identified across scene-dir spellings (scene-1 <-> S01.tsx)
    assert any("was mutated during review" in v for v in violations)


def test_reviewer_ownership_infrastructure_paths_excluded():
    before = {"scenes/S01.tsx": "hash1"}
    after = dict(before)
    after["history/cc_reviewer_scene-1.log"] = "log"
    after["packets/scene-1_cc_verdict.json"] = "v"
    after[".tmp_sandboxes/scene-1_1/scene-1.tsx"] = "t"
    after["audio_stems/scene-1.wav"] = "a"
    ok, violations, err = verify_reviewer_ownership(before, after, "scene-1", Path("."))
    assert ok is True
    assert err is None
    assert violations == []


def test_reviewer_ownership_unexpected_file_flagged():
    before = {"scenes/S01.tsx": "hash1"}
    after = dict(before)
    after["mix_profile.json"] = "tampered"
    ok, violations, err = verify_reviewer_ownership(before, after, "scene-1", Path("."))
    assert ok is False
    assert any("Unexpected file mutated: mix_profile.json" in v for v in violations)


# ==============================================================================
# Task 1.2 — per-file chmod lock during review
# ==============================================================================

def test_orchestrator_locks_target_scene_readonly_during_review(tmp_path):
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])
    scene_file = episode / "scene" / "cut-1.tsx"
    scene_file.write_text("export default () => null;", encoding="utf-8")
    observed_modes = []

    def reviewer_fn(ctx: ReviewerContext) -> AgentRunResult:
        observed_modes.append(scene_file.stat().st_mode & 0o777)
        findings_dir = ctx.sandbox_dir / "packets"
        findings_dir.mkdir(parents=True, exist_ok=True)
        (findings_dir / f"{ctx.scene_id}_findings.json").write_text(json.dumps({
            "scene_id": ctx.scene_id,
            "verdict": "approved",
            "reviewed_hashes": {"scene/cut-1.tsx": "deadbeef"},
        }))
        return AgentRunResult(
            instance_id=ctx.instance_id, token=ctx.token, role="reviewer",
            exit_code=0, started_at="t", finished_at="t", duration_seconds=0.0,
            stdout="reviewer approved", stderr="",
        )

    rec = execute_scene_with_retries(
        "cut-1", episode, runner=CallableAgentRunner(reviewer_fn=reviewer_fn), max_retries=0
    )
    assert observed_modes == [0o444]
    assert rec.status == "success"
    assert (scene_file.stat().st_mode & 0o777) == 0o644


# ==============================================================================
# Task 1.3 — scoped writer hash diffing
# ==============================================================================

def _snap_with(episode: Path, extra: dict[str, str]) -> dict[str, str]:
    snap = snapshot_directory_hashes(episode)
    snap.update(extra)
    return snap


def test_writer_scope_ignores_sandbox_history_and_siblings(tmp_path):
    episode = make_test_episode(tmp_path, scene_ids=["scene-1"])
    (episode / "scenes").mkdir()
    (episode / "scenes" / "S01.tsx").write_text("own", encoding="utf-8")
    (episode / "scenes" / "S02.tsx").write_text("sibling", encoding="utf-8")
    before = snapshot_directory_hashes(episode)

    # own scene path + sibling + infrastructure paths all mutated/added
    (episode / "scenes" / "S01.tsx").write_text("own v2", encoding="utf-8")
    (episode / "scenes" / "S02.tsx").write_text("sibling v2", encoding="utf-8")
    (episode / "history").mkdir()
    (episode / "history" / "cc_writer_scene-1.log").write_text("log", encoding="utf-8")
    sb = episode / ".tmp_sandboxes" / "scene-1_1"
    sb.mkdir(parents=True)
    (sb / "scene-1.tsx").write_text("sandbox", encoding="utf-8")
    after = snapshot_directory_hashes(episode)

    valid, mutated, err = verify_writer_scope(
        before, after, "scene-1", ["artifacts", "assets", "packets", "scenes"], episode
    )
    assert valid is True
    assert err is None


def test_writer_scope_still_flags_out_of_scope(tmp_path):
    episode = make_test_episode(tmp_path, scene_ids=["s1"])
    before = snapshot_directory_hashes(episode)
    (episode / "unauthorized_root.txt").write_text("bad", encoding="utf-8")
    after = snapshot_directory_hashes(episode)
    valid, mutated, err = verify_writer_scope(
        before, after, "s1", ["artifacts", "assets", "packets", "scene"], episode
    )
    assert valid is False
    assert "writer_scope_violation" in err


# ==============================================================================
# Task 1.3 — writer wrapper: atomic promotion + legacy kill-switch
# ==============================================================================

class _FakeClaudeProc:
    """Fake `claude` subprocess: optionally writes the sandbox scene file."""

    def __init__(self, episode: Path, scene_id: str, attempt_idx: str, sandbox_file: Path | None):
        self.returncode = 0
        self._episode = episode
        self._scene_id = scene_id
        self._attempt_idx = attempt_idx
        self._sandbox_file = sandbox_file

    def poll(self):
        return 0

    def kill(self):
        pass

    def communicate(self, task=None):
        if self._sandbox_file is not None:
            self._sandbox_file.parent.mkdir(parents=True, exist_ok=True)
            self._sandbox_file.write_text(
                "export default () => <div>sandboxed scene</div>;" + "// " + "x" * 220,
                encoding="utf-8",
            )
        return "writer done", None


def _make_writer_episode(tmp_path: Path) -> Path:
    ep = tmp_path / "ep"
    (ep / "scenes").mkdir(parents=True)
    (ep / "scenes" / "S01.tsx").write_text("old", encoding="utf-8")
    return ep


def test_writer_wrapper_promotes_sandbox_atomically(tmp_path, monkeypatch):
    import importlib.util

    ep = _make_writer_episode(tmp_path)
    spec = importlib.util.spec_from_file_location(
        "om_writer_wrapper", REVIEWER_WRAPPER_DIR / "writer_wrapper.py"
    )
    mod = importlib.util.module_from_spec(spec)
    # Hermetic PROJ_ROOT: the wrapper's task-file lookup must not depend on
    # untracked tai-chinh runtime state (history/scene_tasks) that only exists
    # in the main repo working dir — fresh worktrees fail otherwise.
    proj = tmp_path / "proj"
    (proj / "history" / "scene_tasks").mkdir(parents=True)
    (proj / "history" / "scene_tasks" / "scene-1.task.md").write_text(
        "# TASK writer scene-1\n", encoding="utf-8"
    )
    monkeypatch.setenv("OM_SCENE_ID", "scene-1")
    monkeypatch.setenv("OM_EPISODE_DIR", str(ep))
    monkeypatch.setenv("OM_ATTEMPT_INDEX", "1")
    monkeypatch.delenv("OM_LEGACY_QUARANTINE", raising=False)
    spec.loader.exec_module(mod)
    # patch AFTER exec_module: the module-level PROJ_ROOT assignment runs during load
    monkeypatch.setattr(mod, "PROJ_ROOT", proj)

    sandbox_file = ep / ".tmp_sandboxes" / "scene-1_1" / "scene-1.tsx"
    monkeypatch.setattr(
        "subprocess.Popen",
        lambda *a, **k: _FakeClaudeProc(ep, "scene-1", "1", sandbox_file),
    )
    monkeypatch.setattr(mod, "_tsc_own_scene_fail", lambda episode, scene_id: (False, ""))

    rc = mod.main()
    assert rc == 0
    canonical = ep / "scenes" / "S01.tsx"
    assert "export default () => <div>sandboxed scene</div>;" in canonical.read_text(encoding="utf-8")
    # staged tmp file consumed by the atomic replace
    assert not (ep / "scenes" / ".tmp_scene-1.tsx").exists()
    # sandbox output preserved for audit
    assert sandbox_file.is_file()


def test_writer_wrapper_legacy_kill_switch_dispatch(tmp_path, monkeypatch):
    import importlib.util

    ep = _make_writer_episode(tmp_path)
    spec = importlib.util.spec_from_file_location(
        "om_writer_wrapper_legacy", REVIEWER_WRAPPER_DIR / "writer_wrapper.py"
    )
    mod = importlib.util.module_from_spec(spec)
    monkeypatch.setenv("OM_SCENE_ID", "scene-1")
    monkeypatch.setenv("OM_EPISODE_DIR", str(ep))
    spec.loader.exec_module(mod)

    calls = {}

    def _sentinel(tag: str, code: int):
        def _fn(*a, **k):
            calls[tag] = a
            return code
        return _fn

    monkeypatch.setattr(mod, "_legacy_main", _sentinel("legacy", 42))
    monkeypatch.setattr(mod, "_sandboxed_main", _sentinel("sandbox", 43))

    monkeypatch.setenv("OM_LEGACY_QUARANTINE", "1")
    assert mod.main() == 42
    monkeypatch.delenv("OM_LEGACY_QUARANTINE", raising=False)
    assert mod.main() == 43
    # legacy dispatch receives the same episode dir; no promotion happened
    assert (ep / "scenes" / "S01.tsx").read_text(encoding="utf-8") == "old"


# ==============================================================================
# Task 1.1 + 1.4 — reviewer wrapper stdout capture, timeout_error findings
# ==============================================================================

class _FakeReviewerProc:
    def __init__(self, stdout_text: str, delay_until_kill: bool):
        self.returncode = 0
        self._stdout = stdout_text
        self._delay = delay_until_kill
        self._killed = threading.Event()

    def poll(self):
        return 0 if self._killed.is_set() else None

    def kill(self):
        self._killed.set()

    def communicate(self, task=None):
        if self._delay:
            self._killed.wait(timeout=10)
        return self._stdout, None


def _load_reviewer_wrapper(monkeypatch, ep: Path, sandbox: Path, watchdog: str):
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "om_reviewer_wrapper", REVIEWER_WRAPPER_DIR / "reviewer_wrapper.py"
    )
    mod = importlib.util.module_from_spec(spec)
    monkeypatch.setenv("OM_SCENE_ID", "scene-1")
    monkeypatch.setenv("OM_SANDBOX_DIR", str(sandbox))
    monkeypatch.setenv("OM_CANONICAL_DIR", str(ep))
    monkeypatch.setenv("OM_CC_REVIEW_WATCHDOG", watchdog)
    spec.loader.exec_module(mod)
    return mod


def test_reviewer_wrapper_writes_verdict_and_findings_from_stdout(tmp_path, monkeypatch):
    ep = _make_writer_episode(tmp_path)
    sandbox = ep / "sandbox"
    (sandbox / "scenes").mkdir(parents=True)
    scene_bytes = b"export default () => <div>reviewed</div>;"
    (sandbox / "scenes" / "S01.tsx").write_bytes(scene_bytes)

    import hashlib
    stdout = (
        "<!-- VERDICT_START -->\n```json\n"
        '{"scene_id": "scene-1", "verdict": "approved", "issues": [], "metrics": {"complexity": "low"}}\n'
        "```\n<!-- VERDICT_END -->"
    )
    mod = _load_reviewer_wrapper(monkeypatch, ep, sandbox, watchdog="30")
    monkeypatch.setattr(
        "subprocess.Popen", lambda *a, **k: _FakeReviewerProc(stdout, delay_until_kill=False)
    )

    rc = mod.main()
    assert rc == 0
    verdict = json.loads((sandbox / "packets" / "scene-1_cc_verdict.json").read_text())
    assert verdict["verdict"] == "approved"
    assert verdict["metrics"] == {"complexity": "low"}
    findings = json.loads((sandbox / "packets" / "scene-1_findings.json").read_text())
    assert findings["verdict"] == "approved"
    assert findings["reviewed_hashes"] == {
        "scenes/S01.tsx": hashlib.sha256(scene_bytes).hexdigest()
    }
    # raw stdout teed to the canonical episode history dir
    assert (ep / "history" / "cc_reviewer_scene-1.log").read_text(encoding="utf-8") == stdout


def test_reviewer_wrapper_watchdog_timeout_error(tmp_path, monkeypatch):
    ep = _make_writer_episode(tmp_path)
    sandbox = ep / "sandbox"
    (sandbox / "scenes").mkdir(parents=True)
    (sandbox / "scenes" / "S01.tsx").write_text("x", encoding="utf-8")

    mod = _load_reviewer_wrapper(monkeypatch, ep, sandbox, watchdog="1")
    assert mod.WATCHDOG_S == 1
    monkeypatch.setattr(
        "subprocess.Popen", lambda *a, **k: _FakeReviewerProc("", delay_until_kill=True)
    )

    rc = mod.main()
    assert rc == 0
    findings = json.loads((sandbox / "packets" / "scene-1_findings.json").read_text())
    assert findings["verdict"] == "timeout_error"
    assert findings["issues"] == ["Reviewer watchdog expired after 1s"]
    verdict = json.loads((sandbox / "packets" / "scene-1_cc_verdict.json").read_text())
    assert verdict["verdict"] == "timeout_error"


def test_review_wrapper_watchdog_default_is_360(monkeypatch):
    monkeypatch.delenv("OM_CC_REVIEW_WATCHDOG", raising=False)
    monkeypatch.delenv("OM_CC_WATCHDOG", raising=False)
    assert DEFAULT_REVIEW_WATCHDOG_S == 360


# ==============================================================================
# Task 1.4 — orchestrator treats timeout_error as infrastructure retry
# ==============================================================================

def test_orchestrator_timeout_error_triggers_infrastructure_retry(tmp_path, caplog):
    episode = make_test_episode(tmp_path, scene_ids=["s1"])
    calls = {"n": 0}

    def reviewer_fn(ctx: ReviewerContext) -> AgentRunResult:
        calls["n"] += 1
        findings_dir = ctx.sandbox_dir / "packets"
        findings_dir.mkdir(parents=True, exist_ok=True)
        if calls["n"] == 1:
            payload = {
                "scene_id": ctx.scene_id,
                "verdict": "timeout_error",
                "issues": ["Reviewer watchdog expired after 360s"],
            }
        else:
            payload = {
                "scene_id": ctx.scene_id,
                "verdict": "approved",
                "reviewed_hashes": ctx.output_hashes,
            }
        (findings_dir / f"{ctx.scene_id}_findings.json").write_text(json.dumps(payload))
        return AgentRunResult(
            instance_id=ctx.instance_id, token=ctx.token, role="reviewer",
            exit_code=0, started_at="t", finished_at="t", duration_seconds=0.0,
            stdout="reviewer verdict delivered", stderr="",
        )

    import logging
    with caplog.at_level(logging.WARNING, logger="tools.qc.scene_orchestrator"):
        rec = execute_scene_with_retries(
            "s1", episode, runner=CallableAgentRunner(reviewer_fn=reviewer_fn), max_retries=1
        )
    assert calls["n"] == 2  # first attempt retried on timeout, second approved
    assert rec.status == "success"
    assert any("Reviewer timed out on s1" in r.message for r in caplog.records)
    assert "timeout_error" in (rec.attempts[0].error or "")


def test_orchestrator_timeout_error_exhausts_retries(tmp_path, monkeypatch):
    """R3: reviewer timeout_error is an INFRA failure — retries IN PLACE within
    the OM_INFRA_RETRY_CAP budget (default 3) without consuming content
    attempts, then escalates. At max_retries=0 the escalation finds no content
    budget left, so the scene fails with 4 same-ordinal infra attempts.
    (Contract of record: test_r3_reviewer_timeout_verdict_is_infra_retry.)"""
    # Zero the in-place infra backoff (env is read at call time) — same
    # approach as the _fast_infra_backoff autouse fixture in test_perf_r1_r5.py.
    monkeypatch.setenv("OM_INFRA_RETRY_DELAY_S", "0")
    episode = make_test_episode(tmp_path, scene_ids=["s1"])

    def reviewer_fn(ctx: ReviewerContext) -> AgentRunResult:
        findings_dir = ctx.sandbox_dir / "packets"
        findings_dir.mkdir(parents=True, exist_ok=True)
        (findings_dir / f"{ctx.scene_id}_findings.json").write_text(json.dumps({
            "scene_id": ctx.scene_id, "verdict": "timeout_error",
        }))
        return AgentRunResult(
            instance_id=ctx.instance_id, token=ctx.token, role="reviewer",
            exit_code=0, started_at="t", finished_at="t", duration_seconds=0.0,
            stdout="reviewer timed out", stderr="",
        )

    rec = execute_scene_with_retries(
        "s1", episode, runner=CallableAgentRunner(reviewer_fn=reviewer_fn), max_retries=0
    )
    # Escalation after infra budget exhaustion leaves no content attempts
    # (max_retries=0) -> scene still fails, but WITHOUT a full rewrite:
    # 4 infra rounds, all pinned to content ordinal 1.
    assert rec.status == "failed"
    assert [a.attempt_number for a in rec.attempts] == [1, 1, 1, 1]
    assert all(a.infra is True for a in rec.attempts)
    assert all("timeout_error" in (a.error or "") for a in rec.attempts)


# ==============================================================================
# Task 1.6 — gate schema normalization + path resolution
# ==============================================================================

def test_normalize_gate_name():
    assert normalize_gate_name("  LAYOUT ") == "layout"
    assert normalize_gate_name("TIMING_AUDIO") == "timing-audio"
    assert normalize_gate_name("Editorial_Language") == "editorial-language"
    assert normalize_gate_name("sfx-mix") == "sfx-mix"


def test_canonical_gate_aliases():
    assert canonical_gate("timing_audio") == GATE_TIMING_AUDIO
    assert canonical_gate("TIMING-AUDIO") == GATE_TIMING_AUDIO
    assert canonical_gate("editorial_language") == GATE_EDITORIAL_LANGUAGE
    assert canonical_gate("sfx") == "sfx-mix"
    assert canonical_gate("provenance_freshness") == "provenance-freshness"
    # unknown names pass through normalized
    assert canonical_gate("  Weird_Gate ") == "weird-gate"


def test_resolve_evidence_path_project_relative_then_repo_root(tmp_path):
    project = tmp_path / "episode"
    project.mkdir()
    (project / "artifacts").mkdir()
    local = project / "artifacts" / "layout_evidence.json"
    local.write_text("{}", encoding="utf-8")

    # project-relative existing file -> project dir
    assert resolve_evidence_path("artifacts/layout_evidence.json", project) == local.resolve()
    # absolute path passes through
    assert resolve_evidence_path(str(local), project) == local.resolve()
    # non-existing relative path maps to repo root
    assert resolve_evidence_path("lib/production_validation.py", project) == (
        REPO_ROOT / "lib" / "production_validation.py"
    ).resolve()


def test_contained_path_repo_root_fallback_and_containment(tmp_path, monkeypatch):
    import tools.qc.episode_gate as episode_gate_mod

    fake_repo = tmp_path / "repo"
    (fake_repo / "lib").mkdir(parents=True)
    monkeypatch.setattr(episode_gate_mod, "REPO_ROOT", fake_repo)
    root = tmp_path / "other" / "ep"
    root.mkdir(parents=True)
    # episode-relative stays contained
    assert _contained_path("artifacts/x.json", root) == (root / "artifacts" / "x.json").resolve()
    # escaping episode but landing inside the repo -> repo-root resolution
    assert _contained_path("../repo/lib/mod.py", root) == (fake_repo / "lib" / "mod.py").resolve()
    # escaping both -> None
    assert _contained_path("../../outside.txt", root) is None
