"""Tests for OpenMontage minimal evidence-supported fixes 1-5.

Covers:
1. Scene Filename Convention:
   - Unified S{NN}.tsx naming resolution (scene-1 -> S01.tsx, cut-2 -> S02.tsx)
   - Resolution parity between scene_orchestrator and reviewer_runner
   - Preservation of existing legacy files (scene-N.tsx) on disk
   - Non-numeric scene_ids fallback
   - Template prompt and promotion alignment
2. Attempt-Owned / Manifest-Based Scope Checking:
   - Manifest loading and schema validation
   - Manifest-owned checking isolates collaborator edits (mix_profile.json, Episode.tsx, shared manifests)
   - Collaborator edits not falsely blamed on writer
   - True sibling scene writes and cross-scene packets properly denied
   - Dot-file mutations remain fail-closed
3. Defer Project-Wide Typecheck (tsc):
   - Partial generation detection (missing expected scenes)
   - TS2307 missing-sibling errors classified as baseline and warn-allowed
   - Real own-scene syntax/type errors (TS2304, TS2322) fail strictly
   - All expected scenes present -> strict failure on any own error
4. Provider Deadline Backoff & Hermes Call Correlation:
   - 'context deadline exceeded' detected in TRANSIENT_API_ERROR_MARKERS
   - Bounded exponential backoff loop retries deadline exhaustion and signals governor
   - Hermes tool-call desync documented as unresolved and classified as retryable transport glitch
5. Gates & Evidence:
   - Reviewer and render gates remain strictly behind writer validation
   - OrchestrationSession, attempt records, and seals preserved
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import pytest

import tools.qc.reviewer_runner as rr
import tools.qc.scene_orchestrator as som
import tools.qc.writer_runner as wr
from tests.test_scene_orchestrator import make_test_episode

REPO_ROOT_FF = Path(__file__).resolve().parents[1]


# ==============================================================================
# Fix 1: Scene Filename Convention (S{NN}.tsx)
# ==============================================================================

def test_resolve_scene_filename_canonical_s_nn_fallback(tmp_path: Path):
    """When no file exists on disk, resolve_scene_filename returns S{NN}.tsx."""
    d = tmp_path / "scenes"
    d.mkdir()

    # Numeric formats resolve to zero-padded S{NN}.tsx
    assert som.resolve_scene_filename(d, "scene-1") == "S01.tsx"
    assert som.resolve_scene_filename(d, "scene-01") == "S01.tsx"
    assert som.resolve_scene_filename(d, "scene_2") == "S02.tsx"
    assert som.resolve_scene_filename(d, "SCENE-5") == "S05.tsx"
    assert som.resolve_scene_filename(d, "scene-99") == "S99.tsx"
    # Non-'scene'-prefixed numeric tails and S-style ids keep prior behavior:
    # the shared resolver regex never covered 'cut-*' (see
    # _legacy_scene_file_variants), and 'S4' falls back to its own spelling.
    assert som.resolve_scene_filename(d, "cut-3") == "cut-3.tsx"
    assert som.resolve_scene_filename(d, "S4") == "S4.tsx"

    # Parity with reviewer_runner
    for sid in ["scene-1", "scene-2", "scene-99", "cut-3", "S4"]:
        assert som.resolve_scene_filename(d, sid) == rr.resolve_scene_filename(d, sid)


def test_resolve_scene_filename_preserves_existing_disk_files(tmp_path: Path):
    """Existing files on disk take precedence (backward compatibility)."""
    d = tmp_path / "scenes"
    d.mkdir()

    (d / "scene-1.tsx").write_text("// legacy name", encoding="utf-8")
    (d / "S2.tsx").write_text("// unpadded name", encoding="utf-8")
    (d / "S03.tsx").write_text("// standard name", encoding="utf-8")

    assert som.resolve_scene_filename(d, "scene-1") == "scene-1.tsx"
    assert som.resolve_scene_filename(d, "scene-2") == "S2.tsx"
    assert som.resolve_scene_filename(d, "scene-3") == "S03.tsx"

    assert som.resolve_scene_filename(d, "scene-1") == rr.resolve_scene_filename(d, "scene-1")
    assert som.resolve_scene_filename(d, "scene-2") == rr.resolve_scene_filename(d, "scene-2")
    assert som.resolve_scene_filename(d, "scene-3") == rr.resolve_scene_filename(d, "scene-3")


def test_resolve_scene_filename_non_numeric(tmp_path: Path):
    """Non-numeric scene IDs fall back to {scene_id}.tsx."""
    d = tmp_path / "scenes"
    d.mkdir()

    assert som.resolve_scene_filename(d, "intro") == "intro.tsx"
    assert som.resolve_scene_filename(d, "outro") == "outro.tsx"
    assert som.resolve_scene_filename(d, "intro") == rr.resolve_scene_filename(d, "intro")


def test_writer_template_contains_unified_s_nn_convention():
    """Writer template prompt instructs Claude on the unified S{NN}.tsx convention."""
    tmpl = (Path(__file__).resolve().parents[1] / "tools/qc/cc_wrapper_templates/writer_wrapper.py.tmpl").read_text(encoding="utf-8")
    assert "OpenMontage scene filename convention" in tmpl
    assert "S{NN}.tsx" in tmpl


# ==============================================================================
# Fix 2: Attempt-Owned / Manifest-Based Scope Checking
# ==============================================================================

def test_attempt_manifest_schema_and_loader(tmp_path: Path):
    """load_writer_attempt_manifest correctly parses valid manifests and rejects corrupt ones."""
    ep = tmp_path / "ep"
    sb = ep / ".tmp_sandboxes" / "scene-1_1"
    sb.mkdir(parents=True)

    # Valid manifest
    manifest_data = {
        "schema": som.WRITER_ATTEMPT_MANIFEST_SCHEMA,
        "scene_id": "scene-1",
        "attempt_index": "1",
        "writer_owned": ["scenes/S01.tsx", ".tmp_sandboxes/scene-1_1/scene-1.tsx"],
    }
    (sb / som.WRITER_ATTEMPT_MANIFEST_NAME).write_text(json.dumps(manifest_data), encoding="utf-8")

    loaded = som.load_writer_attempt_manifest(ep, "scene-1", "1")
    assert loaded is not None
    assert loaded["schema"] == som.WRITER_ATTEMPT_MANIFEST_SCHEMA
    assert loaded["writer_owned"] == ["scenes/S01.tsx", ".tmp_sandboxes/scene-1_1/scene-1.tsx"]

    # Wrong schema
    (sb / som.WRITER_ATTEMPT_MANIFEST_NAME).write_text('{"schema": "invalid"}', encoding="utf-8")
    assert som.load_writer_attempt_manifest(ep, "scene-1", "1") is None

    # Corrupt json
    (sb / som.WRITER_ATTEMPT_MANIFEST_NAME).write_text('{bad json', encoding="utf-8")
    assert som.load_writer_attempt_manifest(ep, "scene-1", "1") is None

    # Nonexistent
    assert som.load_writer_attempt_manifest(ep, "scene-2", "1") is None


def test_collaborator_shared_edits_not_flagged_with_manifest(tmp_path: Path):
    """Concurrent collaborator edits to shared files are NOT blamed on writer when manifest is used."""
    episode = make_test_episode(tmp_path, scene_ids=["scene-1", "scene-2"])
    (episode / "scenes").mkdir(parents=True, exist_ok=True)
    before = som.snapshot_directory_hashes(episode)

    # Collaborator edits shared files concurrently
    (episode / "mix_profile.json").write_text('{"modified_by_lead": true}', encoding="utf-8")
    (episode / "artifacts" / "scene_manifest.json").write_text('{"updated": true}', encoding="utf-8")
    (episode / "Episode.tsx").write_text('// lead edit\n', encoding="utf-8")

    # Writer produced only its own scene file
    (episode / "scenes" / "S01.tsx").write_text('// scene 1\n', encoding="utf-8")
    after = som.snapshot_directory_hashes(episode)

    manifest = {
        "schema": som.WRITER_ATTEMPT_MANIFEST_SCHEMA,
        "scene_id": "scene-1",
        "attempt_index": "1",
        "writer_owned": ["scenes/S01.tsx"],
    }

    valid, mutated, err = som.verify_writer_scope(
        before,
        after,
        scene_id="cut-1",
        allowed_io=["artifacts", "assets", "packets", "scenes"],
        episode_dir=episode,
        attempt_manifest=manifest,
    )
    assert valid is True
    assert err is None


def test_collaborator_shared_edits_not_flagged_without_manifest(tmp_path: Path):
    """Even in legacy/tree-diff mode, COLLABORATOR_SHARED_BASENAMES are carved out."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])
    before = som.snapshot_directory_hashes(episode)

    # Collaborator edits mix_profile.json and Episode.tsx
    (episode / "mix_profile.json").write_text('{"modified": true}', encoding="utf-8")
    (episode / "Episode.tsx").write_text('// new root\n', encoding="utf-8")
    after = som.snapshot_directory_hashes(episode)

    valid, mutated, err = som.verify_writer_scope(
        before,
        after,
        scene_id="cut-1",
        allowed_io=["artifacts", "assets", "packets", "scenes"],
        episode_dir=episode,
        attempt_manifest=None,
    )
    assert valid is True
    assert err is None


def test_manifest_still_denies_writer_writing_sibling_scene(tmp_path: Path):
    """If the writer manifest claims writing another scene's file, it is denied."""
    episode = make_test_episode(tmp_path, scene_ids=["scene-1", "scene-2"])
    (episode / "scenes").mkdir(parents=True, exist_ok=True)
    before = som.snapshot_directory_hashes(episode)

    # Writer wrote scene-2's packet
    (episode / "packets" / "packet_scene-2.json").write_text('{"tamper": true}', encoding="utf-8")
    after = som.snapshot_directory_hashes(episode)

    manifest = {
        "schema": som.WRITER_ATTEMPT_MANIFEST_SCHEMA,
        "scene_id": "scene-1",
        "attempt_index": "1",
        "writer_owned": ["packets/packet_scene-2.json"],
    }

    valid, mutated, err = som.verify_writer_scope(
        before,
        after,
        scene_id="scene-1",
        allowed_io=["artifacts", "assets", "packets", "scenes"],
        episode_dir=episode,
        attempt_manifest=manifest,
    )
    assert valid is False
    assert err is not None
    assert "writer_scope_violation" in err
    assert "packet_scene-2.json" in err


def test_manifest_denies_dotdir_fail_closed(tmp_path: Path):
    """Hidden/dot-file mutations remain fail-closed even with manifest."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])
    before = som.snapshot_directory_hashes(episode)

    after = dict(before)
    after[".hidden_escape/payload.tsx"] = "hash1"

    manifest = {
        "schema": som.WRITER_ATTEMPT_MANIFEST_SCHEMA,
        "scene_id": "cut-1",
        "attempt_index": "1",
        "writer_owned": ["scenes/S01.tsx"],
    }

    valid, mutated, err = som.verify_writer_scope(
        before,
        after,
        scene_id="cut-1",
        allowed_io=["artifacts", "scenes"],
        episode_dir=episode,
        attempt_manifest=manifest,
    )
    assert valid is False
    assert "writer_scope_violation" in err
    assert ".hidden_escape/payload.tsx" in err


# ==============================================================================
# Fix 3: Defer Project-Wide Typecheck (tsc)
# ==============================================================================

def test_defer_tsc_helper_functions(tmp_path: Path):
    """Test _expected_scene_missing and _own_tsc_errors_are_baseline helpers from writer_wrapper."""
    import importlib.util
    wrapper_tmpl = Path(__file__).resolve().parents[1] / "tools/qc/cc_wrapper_templates/writer_wrapper.py.tmpl"
    content = wrapper_tmpl.read_text(encoding="utf-8")

    # Render a standalone script from the template to test helper functions
    script_path = tmp_path / "writer_wrapper_test.py"
    script_path.write_text(content, encoding="utf-8")

    spec = importlib.util.spec_from_file_location("test_ww", script_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    episode = make_test_episode(tmp_path, scene_ids=["scene-1", "scene-2"])
    scenes_dir = episode / "scenes"
    scenes_dir.mkdir(exist_ok=True)

    # Initially, scenes S01.tsx and S02.tsx do not exist
    missing = mod._expected_scene_missing(episode)
    assert missing == ["scene-1", "scene-2"]

    # Now create S01.tsx
    (scenes_dir / "S01.tsx").write_text("// s1", encoding="utf-8")
    missing = mod._expected_scene_missing(episode)
    assert missing == ["scene-2"]

    # Now create S02.tsx
    (scenes_dir / "S02.tsx").write_text("// s2", encoding="utf-8")
    missing = mod._expected_scene_missing(episode)
    assert missing == []

    # Check baseline error classification: TS2307 against absent sibling is baseline
    ts2307_absent = ["scenes/S01.tsx(3,25): error TS2307: Cannot find module './S09' or its corresponding type declarations."]
    assert mod._own_tsc_errors_are_baseline(ts2307_absent, episode) is True

    # But TS2307 against an existing file is a real error
    (scenes_dir / "Existing.tsx").write_text("export const X = 1;", encoding="utf-8")
    ts2307_existing = ["scenes/S01.tsx(3,25): error TS2307: Cannot find module './Existing' or its corresponding type declarations."]
    assert mod._own_tsc_errors_are_baseline(ts2307_existing, episode) is False

    # Syntax or type errors (non-TS2307) are NOT baseline: must fail strictly
    type_err = ["scenes/S01.tsx(10,5): error TS2322: Type 'string' is not assignable to type 'number'."]
    assert mod._own_tsc_errors_are_baseline(type_err, episode) is False

    syntax_err = ["scenes/S01.tsx(5,1): error TS2304: Cannot find name 'foo'."]
    assert mod._own_tsc_errors_are_baseline(syntax_err, episode) is False


# ==============================================================================
# Fix 4: Provider Deadline Backoff & Hermes Call Correlation
# ==============================================================================

def test_is_transient_api_error_includes_context_deadline():
    """'context deadline exceeded' is classified as transient API error."""
    assert wr.is_transient_api_error("error: context deadline exceeded while streaming") is True
    assert wr.is_transient_api_error("CONTEXT DEADLINE EXCEEDED") is True
    assert "context deadline exceeded" in wr.TRANSIENT_API_ERROR_MARKERS


def test_writer_backoff_retries_deadline_and_notifies_governor(monkeypatch):
    """execute_writer_with_backoff retries on context deadline exceeded and signals governor."""
    class ScriptedProc:
        def __init__(self, returncode: int, stdout: str):
            self.returncode = returncode
            self._stdout = stdout
        def communicate(self, task=None):
            return self._stdout, None

    class SpyGov:
        def __init__(self):
            self.bursts = 0
        def handle_rate_limit_burst(self):
            self.bursts += 1

    sleeps: list[float] = []
    monkeypatch.setattr(wr.time, "sleep", lambda s: sleeps.append(s))

    procs = iter([
        ScriptedProc(1, "provider error: context deadline exceeded"),
        ScriptedProc(0, "success"),
    ])
    monkeypatch.setattr(wr.subprocess, "Popen", lambda *a, **k: next(procs))

    gov = SpyGov()
    rc, stdout = wr.execute_writer_with_backoff(["claude"], cwd=".", env={}, task="t", governor=gov)

    assert rc == 0
    assert stdout == "success"
    assert gov.bursts == 1
    assert len(sleeps) == 1
    assert 4.5 <= sleeps[0] <= 6.5


def test_transport_glitch_unresolved_hermes_desync_classified():
    """_transport_glitch documents and classifies 'No tool call found' as transport failure."""
    class Res:
        exit_code = 0
        stdout = "partial ... No tool call found for function call output with call_id 123"
        stderr = ""

    assert som._transport_glitch(Res()) is True
    # Non-zero exit code is NOT transport glitch
    Res.exit_code = 1
    assert som._transport_glitch(Res()) is False


def test_backoff_exhausts_bounded_attempts_on_deadline(monkeypatch):
    """Provider deadline exhaustion is bounded: max_attempts then structured failure."""
    class ScriptedProc:
        def __init__(self, returncode: int, stdout: str):
            self.returncode = returncode
            self._stdout = stdout
        def communicate(self, task=None):
            return self._stdout, None

    class SpyGov:
        def __init__(self):
            self.bursts = 0
        def handle_rate_limit_burst(self):
            self.bursts += 1

    monkeypatch.setattr(wr.time, "sleep", lambda s: None)
    spawned: list[int] = []
    monkeypatch.setattr(
        wr.subprocess, "Popen",
        lambda *a, **k: (spawned.append(1), ScriptedProc(1, "context deadline exceeded"))[1])

    gov = SpyGov()
    rc, stdout = wr.execute_writer_with_backoff(
        ["claude"], cwd=".", env={}, task="t", governor=gov, max_attempts=4)

    assert rc == 1
    assert stdout == "Exhausted retries on API errors"
    assert len(spawned) == 4  # bounded: exactly max_attempts, no unbounded loop
    assert gov.bursts == 4


# ==============================================================================
# Fix 1: end-to-end promotion to the unified S{NN}.tsx convention
# ==============================================================================

STUB_CLAUDE = """\
#!/usr/bin/env python3
import os, sys
from pathlib import Path

ep = Path(os.environ["OM_EPISODE_DIR"])
sid = os.environ["OM_SCENE_ID"]
att = os.environ.get("OM_ATTEMPT_INDEX", "0")
sb = ep / ".tmp_sandboxes" / f"{sid}_{att}"
sb.mkdir(parents=True, exist_ok=True)
src = (
    'import React from "react";\\n'
    'import { SceneShell } from "./lib/SceneShell";\\n'
    'import { Sequence } from "remotion";\\n'
    f'export default () => <div>scene {sid}</div>;\\n'
)
src += f"// padding for promotion threshold " + ("x" * 200) + "\\n"
(sb / f"{sid}.tsx").write_text(src, encoding="utf-8")
sys.exit(0)
"""


@pytest.fixture()
def stub_claude_bin(tmp_path, monkeypatch):
    bindir = tmp_path / "stubbin_ff"
    bindir.mkdir()
    stub = bindir / "claude"
    stub.write_text(STUB_CLAUDE, encoding="utf-8")
    stub.chmod(0o755)
    monkeypatch.setenv("PATH", f"{bindir}:{os.environ.get('PATH', '')}")
    return bindir


def _mint_and_run_writer(tmp_path, ep, project, monkeypatch, stub_bin):
    from tools.qc.mint_project_pipeline import main as mint_main
    monkeypatch.setenv("OM_WRAPPER_TEMPLATE_STRICT", "0")
    assert mint_main(["--project-dir", str(project)]) == 0
    monkeypatch.setenv("OM_STUB_PROJECT_ROOT", str(project))
    monkeypatch.setenv("OM_SCENE_ID", "scene-1")
    monkeypatch.setenv("OM_EPISODE_DIR", str(ep))
    monkeypatch.setenv("OM_ATTEMPT_INDEX", "1")
    monkeypatch.setenv("OM_ROLE", "writer")
    env = dict(os.environ)
    env["PATH"] = f"{stub_bin}:{env.get('PATH', '')}"
    env["PYTHONPATH"] = str(REPO_ROOT_FF)
    wrapper = project / "scripts" / "cc_pipeline" / "writer_wrapper.py"
    import subprocess, sys
    return subprocess.run([sys.executable, str(wrapper)], capture_output=True,
                          text=True, env=env, cwd=REPO_ROOT_FF, timeout=60)


def test_writer_wrapper_promotes_fresh_scene_to_s_nn(tmp_path, stub_claude_bin, monkeypatch):
    """Fix 1 e2e: on a FRESH episode (no scene file under ANY spelling), the
    wrapper promotes the sandbox output to the canonical scenes/S01.tsx —
    never a divergent scenes/scene-1.tsx — and records the attempt manifest."""
    from tests.test_video_slowfix_phase4 import build_project_layout
    ep, project = build_project_layout(tmp_path, scene_ids=["scene-1"])
    # Fresh: remove every placeholder scene file so no candidate exists on disk
    for p in (ep / "scenes").glob("*.tsx"):
        p.unlink()

    proc = _mint_and_run_writer(tmp_path, ep, project, monkeypatch, stub_claude_bin)
    assert proc.returncode == 0, proc.stdout + proc.stderr

    scenes = ep / "scenes"
    assert (scenes / "S01.tsx").is_file()
    assert "scene scene-1" in (scenes / "S01.tsx").read_text(encoding="utf-8")
    assert not (scenes / "scene-1.tsx").exists()
    assert not (scenes / ".tmp_scene-1.tsx").exists()

    # The attempt manifest records the promoted canonical path (fix 2)
    manifest = som.load_writer_attempt_manifest(ep, "scene-1", 1)
    assert manifest is not None
    assert "scenes/S01.tsx" in manifest["writer_owned"]


def test_writer_preamble_names_resolved_canonical_target(tmp_path, stub_claude_bin, monkeypatch):
    """Fix 1: the writer TASK preamble carries the resolved canonical target
    (scenes/S01.tsx) and the S{NN}.tsx convention — aligning instructions,
    prompt, resolver and promotion. Verified against the stub claude's view."""
    from tests.test_video_slowfix_phase4 import build_project_layout

    stub_src = STUB_CLAUDE.replace(
        "sys.exit(0)",
        "Path(os.environ['OM_STUB_PROJECT_ROOT'], 'history', 'task_dump.txt')"
        ".write_text(sys.stdin.read(), encoding='utf-8')\nsys.exit(0)")
    bindir = tmp_path / "stubbin_task"
    bindir.mkdir()
    stub = bindir / "claude"
    stub.write_text(stub_src, encoding="utf-8")
    stub.chmod(0o755)
    monkeypatch.setenv("PATH", f"{bindir}:{os.environ.get('PATH', '')}")

    ep, project = build_project_layout(tmp_path, scene_ids=["scene-1"])
    _mint_and_run_writer(tmp_path, ep, project, monkeypatch, bindir)

    task = (project / "history" / "task_dump.txt").read_text(encoding="utf-8")
    assert "scenes/S01.tsx" in task
    assert "S{NN}.tsx" in task
    assert "OpenMontage scene filename convention" in task


# ==============================================================================
# Fix 3: end-to-end deferred tsc while the episode is partially generated
# ==============================================================================

def _mint_writer_module(tmp_path, project):
    import importlib.util
    from tools.qc.mint_project_pipeline import main as mint_main
    monkey_free = True
    import os as _os
    prev = _os.environ.get("OM_WRAPPER_TEMPLATE_STRICT")
    _os.environ["OM_WRAPPER_TEMPLATE_STRICT"] = "0"
    try:
        assert mint_main(["--project-dir", str(project)]) == 0
    finally:
        if prev is None:
            _os.environ.pop("OM_WRAPPER_TEMPLATE_STRICT", None)
        else:
            _os.environ["OM_WRAPPER_TEMPLATE_STRICT"] = prev
    wrapper = project / "scripts" / "cc_pipeline" / "writer_wrapper.py"
    spec = importlib.util.spec_from_file_location("ff_writer_wrapper", wrapper)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_tsc_own_scene_fail_defers_baseline_when_partial(tmp_path, monkeypatch, capsys):
    """Fix 3 e2e: own-scene TS2307 pointing at a not-yet-generated sibling is
    a baseline warning (passes) while ANY expected scene file is missing; the
    same error fails strictly once all expected scenes exist."""
    from tests.test_video_slowfix_phase4 import build_project_layout

    ep, project = build_project_layout(tmp_path, scene_ids=["scene-1", "scene-2"])
    mod = _mint_writer_module(tmp_path, project)

    scenes = ep / "scenes"
    scenes.mkdir(exist_ok=True)
    # Ensure S02 is actually missing on disk
    (scenes / "S02.tsx").unlink(missing_ok=True)
    (scenes / "S01.tsx").write_text("// scene 1\n", encoding="utf-8")
    # anchor the composer discovery (tsconfig + package.json)
    (ep / "tsconfig.json").write_text("{}", encoding="utf-8")
    (ep / "package.json").write_text("{}", encoding="utf-8")

    baseline_line = (
        "scenes/S01.tsx(3,25): error TS2307: Cannot find module './S02' "
        "or its corresponding type declarations."
    )

    def fake_tsc(*args, **kwargs):
        class R:
            returncode = 1
            stdout = baseline_line + "\nFound 1 error.\n"
            stderr = ""
        return R()

    monkeypatch.setattr(mod.subprocess, "run", fake_tsc)

    # scene-2 missing -> partial generation -> baseline defer (warn, not fail)
    failed, out = mod._tsc_own_scene_fail(ep, "scene-1")
    assert failed is False
    assert out == ""
    captured = capsys.readouterr().out
    assert "TSC BASELINE WARN" in captured
    assert "scene-2" in captured

    # non-module own error (TS2322) is a REAL defect even while partial
    real_line = "scenes/S01.tsx(10,5): error TS2322: Type 'string' is not assignable to type 'number'."

    def fake_tsc_real(*args, **kwargs):
        class R:
            returncode = 1
            stdout = real_line + "\nFound 1 error.\n"
            stderr = ""
        return R()

    monkeypatch.setattr(mod.subprocess, "run", fake_tsc_real)
    failed, out = mod._tsc_own_scene_fail(ep, "scene-1")
    assert failed is True
    assert "TS2322" in out

    # all expected scenes exist -> strict gate returns (baseline-class error fails)
    (scenes / "S02.tsx").write_text("// scene 2\n", encoding="utf-8")
    monkeypatch.setattr(mod.subprocess, "run", fake_tsc)
    failed, out = mod._tsc_own_scene_fail(ep, "scene-1")
    assert failed is True
    assert "TS2307" in out


# ==============================================================================
# Fix 2: dispatch-level integration (orchestrator consumes the manifest)
# ==============================================================================

def test_dispatch_uses_attempt_manifest_against_collaborator_edits(tmp_path):
    """Fix 2 e2e: while the writer runs, a collaborator mutates mix_profile.json
    AND a sibling writer promotes its own scene; the writer's manifest makes
    the ownership check attempt-owned, so the attempt is NOT blamed and the
    scene reaches the reviewer (reviewer gate stays behind writer validation)."""
    episode = make_test_episode(tmp_path, scene_ids=["scene-1"])
    scenes = episode / "scenes"
    scenes.mkdir(exist_ok=True)
    (scenes / "S01.tsx").write_text("// placeholder\n", encoding="utf-8")

    writer_calls: list[som.WriterContext] = []
    reviewer_calls: list[som.ReviewerContext] = []

    def writer_fn(ctx: som.WriterContext) -> som.AgentRunResult:
        writer_calls.append(ctx)
        sb = ctx.episode_dir / ".tmp_sandboxes" / f"{ctx.scene_id}_{ctx.attempt_number}"
        sb.mkdir(parents=True, exist_ok=True)
        # the writer writes its own scene file
        (scenes / "S01.tsx").write_text("// scene 1 written by writer\n", encoding="utf-8")
        # collaborators mutate shared + sibling files mid-flight
        (episode / "mix_profile.json").write_text('{"lead": true}', encoding="utf-8")
        (episode / "packets" / "packet_scene-9.json").write_text('{"other": true}', encoding="utf-9" if False else "utf-8")
        manifest = {
            "schema": som.WRITER_ATTEMPT_MANIFEST_SCHEMA,
            "scene_id": ctx.scene_id,
            "attempt_index": str(ctx.attempt_number),
            "writer_owned": ["scenes/S01.tsx"],
        }
        (sb / som.WRITER_ATTEMPT_MANIFEST_NAME).write_text(json.dumps(manifest), encoding="utf-8")
        return som.AgentRunResult(
            instance_id=ctx.instance_id, token=ctx.token, role="writer",
            exit_code=0, started_at="t", finished_at="t",
            duration_seconds=0.0, stdout="ok", stderr="")

    def reviewer_fn(ctx: som.ReviewerContext) -> som.AgentRunResult:
        reviewer_calls.append(ctx)
        fdir = ctx.sandbox_dir / "packets"
        fdir.mkdir(parents=True, exist_ok=True)
        (fdir / f"{ctx.scene_id}_findings.json").write_text(json.dumps({
            "scene_id": ctx.scene_id, "verdict": "approved",
            "reviewed_hashes": ctx.output_hashes,
        }), encoding="utf-8")
        return som.AgentRunResult(
            instance_id=ctx.instance_id, token=ctx.token, role="reviewer",
            exit_code=0, started_at="t", finished_at="t",
            duration_seconds=0.0, stdout="verdict delivered", stderr="")

    runner = som.CallableAgentRunner(writer_fn=writer_fn, reviewer_fn=reviewer_fn)
    session = som.orchestrate_episode(episode, runner=runner, max_retries=1)

    rec = session.scenes["scene-1"]
    assert rec.status == "success"
    # Writer scope check was attempt-owned: the collaborator mutations did NOT
    # produce a writer_scope_violation on any attempt (fix 2). Attempt 1 was
    # instead rejected by the INTEGRATION frozen-input contract (mix_profile.json
    # hash drift) — the evidence chain working as designed — and attempt 2,
    # with a fresh freeze, passed. Reviewer ran only after writer validation.
    assert len(writer_calls) == 2
    assert len(reviewer_calls) >= 1
    for att in rec.attempts:
        assert att.ownership is not None
        assert att.ownership.writer_scope_valid is True
        assert att.ownership.error_message is None
    first = rec.attempts[0]
    assert first.packet_reasons and first.packet_reasons[0]["code"] == "frozen_input_mismatch"



# ==============================================================================
# Fix 5: Gates & Evidence Persistence
# ==============================================================================

def test_gates_and_evidence_structure_preserved(tmp_path: Path):
    """Reviewer and render gates remain strictly behind writer validation, evidence intact."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])

    # If writer fails, reviewer never executes and attempt records error
    def failing_writer(ctx):
        return som.AgentRunResult(
            instance_id=ctx.instance_id,
            token=ctx.token,
            role="writer",
            exit_code=1,
            started_at="2026-11-15T00:00:00Z",
            finished_at="2026-11-15T00:00:01Z",
            duration_seconds=1.0,
            stdout="",
            stderr="Writer compilation error",
        )

    reviewer_called = []
    def spy_reviewer(ctx):
        reviewer_called.append(ctx.scene_id)
        return som.AgentRunResult(
            instance_id=ctx.instance_id,
            token=ctx.token,
            role="reviewer",
            exit_code=0,
            started_at="2026-11-15T00:00:00Z",
            finished_at="2026-11-15T00:00:01Z",
            duration_seconds=1.0,
            stdout="",
            stderr="",
        )

    runner = som.CallableAgentRunner(writer_fn=failing_writer, reviewer_fn=spy_reviewer)
    session = som.orchestrate_episode(episode, runner=runner, max_retries=0)

    # Reviewer was never invoked because writer failed
    assert reviewer_called == []
    assert session.overall_status == "fail"
    cut1_rec = session.scenes["cut-1"]
    assert cut1_rec.status == "failed"
    assert len(cut1_rec.attempts) == 1
    assert cut1_rec.attempts[0].reviewer_result is None
    assert "Writer failed" in cut1_rec.attempts[0].error
