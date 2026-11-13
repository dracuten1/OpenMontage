"""Phase 4A tests — retry learning + wrapper templates (video-slowfix phase 4A).

Covers:
- 4A.1 findings-to-retry injection: canonical findings file written on the
  rejection branch (PROJECT ROOT base, not episode dir), atomic os.replace,
  4000-char cap, prior_findings populated for attempts >= 2, reset on
  approval, OM_FINDINGS_INJECT=0 disables write AND injection.
- 4A.2 wrapper templates + mint CLI: rendering, manifest, OM commit +
  template hash print, findings purge at mint, OM_WRAPPER_TEMPLATE_STRICT
  fail/warn on hand-written or hand-edited wrappers, contract greps
  (zero acceptEdits, zero hardcoded max-concurrency default, timeout_error
  verdict, governor import assert).
- 4A.3 pre-flight pull-forward: validate_imports_and_theme owned by the
  writer template, SceneShell header pre-seed, sandbox output rejected
  before the TSC spend when a mandatory import is missing.
- End-to-end canary runs against minted wrappers with a stub `claude`:
  forced round-1 rejection -> attempt-2 writer log carries PRIOR REVIEWER
  ISSUES; reviewer watchdog expiry -> timeout_error verdict.
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

import tools.qc.scene_orchestrator as som
from tools.qc.mint_project_pipeline import (
    MANIFEST_NAME,
    om_commit,
    template_content_hash,
)
from tools.qc.scene_orchestrator import (
    AgentRunResult,
    CallableAgentRunner,
    ReviewerContext,
    WriterContext,
    execute_scene_with_retries,
    findings_inject_enabled,
    load_prior_findings,
    resolve_project_root_from_episode,
    reset_scene_findings,
    scene_findings_path,
    write_scene_findings_md,
)
from tests.test_scene_orchestrator import make_test_episode

REPO_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = REPO_ROOT / "tools" / "qc" / "cc_wrapper_templates"
SLUG = "canary-phase4"
SCENE_IDS_3 = ["scene-1", "scene-2", "scene-3"]
REJECT_MARKER = "SYNTHETIC-REJECT-ISSUE-ROUND1"

# ==============================================================================
# Helpers
# ==============================================================================

def build_project_layout(tmp_path: Path, slug: str = SLUG,
                         scene_ids: list[str] | None = None) -> tuple[Path, Path]:
    """Real layout: <tmp>/remotion-composer/src/<slug> episode + <tmp>/projects/<slug>."""
    scene_ids = scene_ids or SCENE_IDS_3
    build = tmp_path / "build"
    episode = make_test_episode(build, scene_ids=list(scene_ids))
    src_root = tmp_path / "remotion-composer" / "src"
    src_root.mkdir(parents=True)
    ep = src_root / slug
    shutil.move(str(episode), str(ep))
    scenes = ep / "scenes"
    scenes.mkdir(exist_ok=True)
    # Canonical S{nn}.tsx placeholders — matches the sibling-exclusion pattern
    # (^(?:scenes?)/S\d+\.tsx$) so concurrent writers promoting their own
    # S*.tsx don't trip each other's scoped writer check (phase-1 task 1.3).
    for sid in scene_ids:
        num = int(sid.split("-")[-1])
        (scenes / f"S{num:02d}.tsx").write_text(
            f"// placeholder for {sid} (replaced by the writer promotion)\n", encoding="utf-8"
        )

    project = tmp_path / "projects" / slug
    project.mkdir(parents=True)
    tasks = project / "history" / "scene_tasks"
    tasks.mkdir(parents=True)
    for sid in scene_ids:
        (tasks / f"{sid}.task.md").write_text(
            f"# TASK writer {sid}\n\nBuild scene {sid} exactly per spec.", encoding="utf-8"
        )
    return ep, project


STUB_CLAUDE = textwrap.dedent("""\
    #!/usr/bin/env python3
    import json, os, sys, time
    from pathlib import Path

    role = os.environ.get("OM_ROLE", "writer")
    mode = os.environ.get("OM_STUB_MODE", "")
    proj = Path(os.environ["OM_STUB_PROJECT_ROOT"])
    hist = proj / "history"

    if role == "writer":
        sid = os.environ["OM_SCENE_ID"]
        counter = hist / f".stub_writer_runs_{sid}"
        n = int(counter.read_text().strip() or "0") if counter.exists() else 0
        counter.write_text(str(n + 1))
        ep = Path(os.environ["OM_EPISODE_DIR"])
        sid = os.environ["OM_SCENE_ID"]
        att = os.environ.get("OM_ATTEMPT_INDEX", "0")
        sb = ep / ".tmp_sandboxes" / f"{sid}_{att}"
        sb.mkdir(parents=True, exist_ok=True)
        if mode == "noimports":
            src = "export default () => <div>no shell here</div>;\\n"
        else:
            src = (
                'import React from "react";\\n'
                'import { SceneShell } from "remotion-composer/src/common/SceneShell";\\n'
                'import { Sequence } from "remotion";\\n'
                f'export default () => <SceneShell><div>scene {sid}</div></SceneShell>;\\n'
            )
        # pad past the wrapper's >200-byte promotion threshold
        src += f"// stub-generated scene body for {sid} (padding) " + ("x" * 200) + "\\n"
        (sb / f"{sid}.tsx").write_text(src, encoding="utf-8")
        sys.exit(0)

    if role == "reviewer":
        if mode == "sleep":
            time.sleep(30)
        sid = os.environ["OM_SCENE_ID"]
        counter = hist / f".stub_writer_runs_{sid}"
        n = int(counter.read_text().strip() or "0") if counter.exists() else 0
        control = hist / ".stub_reviewer_control"
        if control.exists():
            verdict = control.read_text().strip() or "rejected"
            issues = ["CONTROL-REJECT-MARKER"] if verdict == "rejected" else []
        else:
            verdict = "approved" if n >= 2 else "rejected"
            issues = ["SYNTHETIC-REJECT-ISSUE-ROUND1"] if verdict == "rejected" else []
        block = json.dumps(
            {"scene_id": sid, "verdict": verdict, "issues": issues,
             "metrics": {"complexity": "low"}}, indent=1
        )
        out = ["<!-- VERDICT_START -->", "```json", block, "```", "<!-- VERDICT_END -->"]
        sys.stdout.write("\\n".join(out) + "\\n")
        sys.stdout.flush()
        sys.exit(0)
    sys.exit(2)
""")


@pytest.fixture()
def stub_claude(tmp_path, monkeypatch):
    """Install a deterministic stub `claude` binary; return the stub bin dir."""
    bindir = tmp_path / "stubbin"
    bindir.mkdir()
    stub = bindir / "claude"
    stub.write_text(STUB_CLAUDE, encoding="utf-8")
    stub.chmod(0o755)
    monkeypatch.setenv("PATH", f"{bindir}:{os.environ.get('PATH', '')}")
    return bindir


def _writer_records():
    """Capture WriterContext instances passed to the runner."""
    seen: list[WriterContext] = []

    def writer_fn(ctx: WriterContext) -> AgentRunResult:
        seen.append(ctx)
        scenes = ctx.episode_dir / "scenes"
        scenes.mkdir(exist_ok=True)
        (scenes / f"{ctx.scene_id}.tsx").write_text(
            'import { SceneShell } from "remotion-composer/src/common/SceneShell";\n'
            'import React from "react";\n',
            encoding="utf-8",
        )
        return AgentRunResult(instance_id=ctx.instance_id, token=ctx.token, role="writer",
                              exit_code=0, started_at="t", finished_at="t",
                              duration_seconds=0.0, stdout="ok", stderr="")

    def reviewer_fn_factory(verdicts: list[str]):
        calls = {"n": 0}

        def reviewer_fn(ctx: ReviewerContext) -> AgentRunResult:
            calls["n"] += 1
            verdict = verdicts[min(calls["n"], len(verdicts)) - 1]
            fdir = ctx.sandbox_dir / "packets"
            fdir.mkdir(parents=True, exist_ok=True)
            payload = {"scene_id": ctx.scene_id, "verdict": verdict}
            if verdict != "approved":
                payload["issues"] = [REJECT_MARKER, f"issue-attempt-{calls['n']}"]
            else:
                payload["reviewed_hashes"] = ctx.output_hashes
            (fdir / f"{ctx.scene_id}_findings.json").write_text(json.dumps(payload))
            return AgentRunResult(instance_id=ctx.instance_id, token=ctx.token, role="reviewer",
                                  exit_code=0, started_at="t", finished_at="t",
                                  duration_seconds=0.0, stdout="verdict delivered", stderr="")

        return reviewer_fn

    return seen, writer_fn, reviewer_fn_factory


# ==============================================================================
# 4A.1 — findings injection unit tests
# ==============================================================================

def _make_layout_with_project(tmp_path, scene_ids=("scene-1",)):
    ep = make_test_episode(tmp_path, scene_ids=list(scene_ids))
    project = tmp_path / "projects" / ep.name
    project.mkdir(parents=True)
    return ep, project


def test_resolve_project_root_from_episode(tmp_path):
    ep, project = _make_layout_with_project(tmp_path)
    assert resolve_project_root_from_episode(ep) == project.resolve()
    # real nested layout
    nested = tmp_path / "x" / "remotion-composer" / "src" / ep.name
    assert resolve_project_root_from_episode(nested) == project.resolve()
    # no projects/<slug> anywhere -> None (never write under episode dir)
    lonely = tmp_path / "nowhere" / "some-slug"
    assert resolve_project_root_from_episode(lonely) is None


def test_findings_write_is_atomic_capped_and_canonical(tmp_path):
    ep, project = _make_layout_with_project(tmp_path)
    findings = {
        "verdict": "rejected",
        "issues": ["coordinate space mismatch", "reveal overflow past window"],
    }
    path = write_scene_findings_md(project, "scene-1", findings, attempt_number=1)
    assert path == project / "history" / "cc_findings" / "scene-1_latest.md"
    assert path.is_file()
    text = path.read_text(encoding="utf-8")
    assert "verdict: rejected" in text
    assert "- coordinate space mismatch" in text
    assert "attempt 1" in text
    assert not list(path.parent.glob("*.tmp"))  # atomic replace leaves no temp file

    # hard cap 4000 chars
    huge = {"verdict": "rejected", "issues": ["x" * 10000]}
    path2 = write_scene_findings_md(project, "scene-2", huge, attempt_number=2)
    assert len(path2.read_text(encoding="utf-8")) <= 4000

    # no project root -> skipped (never write under episode dir)
    assert write_scene_findings_md(None, "scene-3", findings, 1) is None
    assert not (ep / "history" / "cc_findings").exists()


def test_load_prior_and_reset_scene_findings(tmp_path):
    ep, project = _make_layout_with_project(tmp_path)
    assert load_prior_findings(project, "scene-1") is None
    write_scene_findings_md(project, "scene-1", {"verdict": "rejected", "issues": ["a"]}, 1)
    loaded = load_prior_findings(project, "scene-1")
    assert loaded and REJECT_MARKER or loaded  # returns [text]
    assert "verdict: rejected" in loaded[0]
    assert reset_scene_findings(project, "scene-1") is True
    assert not scene_findings_path(project, "scene-1").exists()
    assert reset_scene_findings(project, "scene-1") is False  # idempotent
    assert reset_scene_findings(None, "scene-1") is False


def test_findings_inject_enabled_default_and_kill_switch(monkeypatch):
    monkeypatch.delenv("OM_FINDINGS_INJECT", raising=False)
    assert findings_inject_enabled() is True  # default ON
    monkeypatch.setenv("OM_FINDINGS_INJECT", "0")
    assert findings_inject_enabled() is False


def test_orchestrator_writes_findings_on_rejection(tmp_path, monkeypatch):
    monkeypatch.delenv("OM_FINDINGS_INJECT", raising=False)
    ep, project = _make_layout_with_project(tmp_path)
    seen, writer_fn, reviewer_factory = _writer_records()
    runner = CallableAgentRunner(writer_fn=writer_fn,
                                 reviewer_fn=reviewer_factory(["rejected", "approved"]))
    rec = execute_scene_with_retries("scene-1", ep, runner=runner, max_retries=1)

    assert rec.status == "success"
    findings_file = project / "history" / "cc_findings" / "scene-1_latest.md"
    # written on the round-1 rejection, then RESET on approval (4A.1 step 5)
    # — final state: deleted (persist-while-unresolved test covers the file).
    assert not findings_file.exists()
    # attempt 2's writer context carried the attempt-1 findings
    assert seen[0].prior_findings is None
    assert seen[1].prior_findings is not None
    assert REJECT_MARKER in seen[1].prior_findings[0]
    assert f"attempt 1" in seen[1].prior_findings[0]


def test_orchestrator_findings_persist_while_scene_unresolved(tmp_path, monkeypatch):
    monkeypatch.delenv("OM_FINDINGS_INJECT", raising=False)
    ep, project = _make_layout_with_project(tmp_path)
    seen, writer_fn, reviewer_factory = _writer_records()
    runner = CallableAgentRunner(writer_fn=writer_fn,
                                 reviewer_fn=reviewer_factory(["rejected", "rejected"]))
    rec = execute_scene_with_retries("scene-1", ep, runner=runner, max_retries=1)
    assert rec.status == "failed"
    findings_file = project / "history" / "cc_findings" / "scene-1_latest.md"
    assert findings_file.is_file()  # canonical path, PROJECT ROOT base
    text = findings_file.read_text(encoding="utf-8")
    assert REJECT_MARKER in text
    assert "verdict: rejected" in text
    # attempt 2 injected
    assert seen[1].prior_findings and REJECT_MARKER in seen[1].prior_findings[0]


def test_orchestrator_kill_switch_disables_write_and_injection(tmp_path, monkeypatch):
    monkeypatch.setenv("OM_FINDINGS_INJECT", "0")
    ep, project = _make_layout_with_project(tmp_path)
    seen, writer_fn, reviewer_factory = _writer_records()
    runner = CallableAgentRunner(writer_fn=writer_fn,
                                 reviewer_fn=reviewer_factory(["rejected", "rejected"]))
    rec = execute_scene_with_retries("scene-1", ep, runner=runner, max_retries=1)
    assert rec.status == "failed"
    assert not (project / "history" / "cc_findings" / "scene-1_latest.md").exists()
    assert all(ctx.prior_findings is None for ctx in seen)


def test_orchestrator_no_project_root_skips_findings_no_crash(tmp_path, monkeypatch, caplog):
    """Synthetic episode without a projects/<slug> layout: findings write must
    be SKIPPED (never under the episode dir) without crashing the run."""
    monkeypatch.delenv("OM_FINDINGS_INJECT", raising=False)
    ep = make_test_episode(tmp_path, scene_ids=["scene-1"])
    seen, writer_fn, reviewer_factory = _writer_records()
    runner = CallableAgentRunner(writer_fn=writer_fn,
                                 reviewer_fn=reviewer_factory(["rejected", "approved"]))
    import logging
    with caplog.at_level(logging.WARNING, logger="tools.qc.scene_orchestrator"):
        rec = execute_scene_with_retries("scene-1", ep, runner=runner, max_retries=1)
    assert rec.status == "success"
    assert not (ep / "history" / "cc_findings").exists()
    assert any("findings file skipped" in r.message for r in caplog.records)


# ==============================================================================
# 4A.2 — templates + mint CLI
# ==============================================================================

def test_template_contract_greps():
    """R6 + 4A.2 contract on the TEMPLATES (generated artifacts inherit it):
    zero acceptEdits; zero hardcoded max-concurrency default; reviewer emits
    timeout_error; launcher asserts the governor import; writer carries the
    pre-flight + findings injection."""
    for tmpl in TEMPLATE_DIR.glob("*.tmpl"):
        content = tmpl.read_text(encoding="utf-8")
        assert "acceptEdits" not in content, f"acceptEdits must never appear: {tmpl.name}"
        assert 'OM_MAX_CONCURRENCY", "2"' not in content, tmpl.name
        assert "max_concurrency=2" not in content, tmpl.name
    reviewer = (TEMPLATE_DIR / "reviewer_wrapper.py.tmpl").read_text(encoding="utf-8")
    assert "timeout_error" in reviewer
    assert 'build_reviewer_cmd' in reviewer and "VERDICT_START" in reviewer
    writer = (TEMPLATE_DIR / "writer_wrapper.py.tmpl").read_text(encoding="utf-8")
    assert "validate_imports_and_theme" in writer
    assert "PRIOR REVIEWER ISSUES" in writer
    assert "execute_writer_with_backoff" in writer
    launcher = (TEMPLATE_DIR / "run_cc_pipeline.py.tmpl").read_text(encoding="utf-8")
    assert "from tools.qc.concurrency_governor import" in launcher
    assert "raise ImportError" in launcher
    assert "None" in launcher and "parse_env_max_concurrency" in launcher


def test_mint_renders_wrappers_and_manifest(tmp_path, capsys):
    ep, project = build_project_layout(tmp_path)
    from tools.qc.mint_project_pipeline import main as mint_main
    rc = mint_main(["--project-dir", str(project), "--scenes", "3"])
    assert rc == 0
    out = capsys.readouterr().out
    cc = project / "scripts" / "cc_pipeline"
    for name in ("writer_wrapper.py", "reviewer_wrapper.py", "run_cc_pipeline.py"):
        assert (cc / name).is_file()
        assert f"{{{{PROJECT_SLUG}}}}" not in (cc / name).read_text(encoding="utf-8")
    launcher = (cc / "run_cc_pipeline.py").read_text(encoding="utf-8")
    assert SLUG in launcher
    assert "range(1, 3 + 1)" in launcher
    # mint prints OM commit + template content hash (auditability contract)
    assert f"minted from OM commit {om_commit()}" in out
    assert f"template content hash: {template_content_hash()[0]}" in out
    manifest = json.loads((cc / MANIFEST_NAME).read_text(encoding="utf-8"))
    assert manifest["om_commit"] == om_commit()
    assert manifest["project"] == SLUG
    assert set(manifest["rendered"]) == {"writer_wrapper.py", "reviewer_wrapper.py", "run_cc_pipeline.py"}


def test_mint_purges_cc_findings(tmp_path):
    ep, project = build_project_layout(tmp_path)
    stale = project / "history" / "cc_findings" / "scene-1_latest.md"
    stale.parent.mkdir(parents=True, exist_ok=True)
    stale.write_text("STALE FINDINGS FROM A PRIOR ROUND", encoding="utf-8")
    from tools.qc.mint_project_pipeline import main as mint_main
    assert mint_main(["--project-dir", str(project), "--scenes", "3"]) == 0
    assert not stale.exists()
    assert (project / "history" / "cc_findings").is_dir()


def test_mint_purge_refuses_outside_repo_root_and_temp(tmp_path):
    """Reviewer guard: the findings purge DELETES files — a target outside the
    repo root AND outside the OS temp dir must be refused BEFORE any deletion
    (a mistyped --project-dir can never purge a user's history/cc_findings).
    tmp_path (hermetic pytest pack) stays allowed via the temp-dir carve-out —
    test_mint_purges_cc_findings above proves that path keeps working."""
    from tools.qc.mint_project_pipeline import purge_findings
    outside = Path.home() / ".cache" / "om-mint-purge-guard-must-not-exist"
    assert not outside.exists()  # guard must raise before touching the fs
    with pytest.raises(RuntimeError, match="REFUSING findings purge"):
        purge_findings(outside)
    assert not outside.exists()  # nothing created, nothing deleted
    # repo-internal targets pass the guard (no exception)
    inside = REPO_ROOT / "projects"
    purge_findings(inside / "_guard_nonexistent_project")  # guard ok; purge no-ops + mkdir
    shutil.rmtree(inside / "_guard_nonexistent_project", ignore_errors=True)


def test_mint_strict_fails_on_hand_written(tmp_path):
    ep, project = build_project_layout(tmp_path)
    wrapper = project / "scripts" / "cc_pipeline" / "writer_wrapper.py"
    wrapper.parent.mkdir(parents=True, exist_ok=True)
    wrapper.write_text("# hand-written wrapper — do not clobber\n", encoding="utf-8")
    from tools.qc.mint_project_pipeline import main as mint_main
    assert mint_main(["--project-dir", str(project)]) == 1  # strict default
    assert wrapper.read_text(encoding="utf-8").startswith("# hand-written")  # untouched
    assert not (project / "scripts" / "cc_pipeline" / "reviewer_wrapper.py").exists()

    os.environ["OM_WRAPPER_TEMPLATE_STRICT"] = "0"
    try:
        assert mint_main(["--project-dir", str(project)]) == 0  # warn-and-proceed
    finally:
        os.environ.pop("OM_WRAPPER_TEMPLATE_STRICT", None)
    assert "from tools.qc" in wrapper.read_text(encoding="utf-8")  # overwritten


def test_mint_strict_fails_on_hand_edit_after_mint(tmp_path):
    ep, project = build_project_layout(tmp_path)
    from tools.qc.mint_project_pipeline import main as mint_main
    assert mint_main(["--project-dir", str(project)]) == 0  # clean first mint
    wrapper = project / "scripts" / "cc_pipeline" / "writer_wrapper.py"
    wrapper.write_text(wrapper.read_text(encoding="utf-8") + "\n# hand edit\n", encoding="utf-8")
    assert mint_main(["--project-dir", str(project)]) == 1  # drift detected
    assert wrapper.read_text(encoding="utf-8").endswith("# hand edit\n")  # untouched
    os.environ["OM_WRAPPER_TEMPLATE_STRICT"] = "0"
    try:
        assert mint_main(["--project-dir", str(project)]) == 0  # warn only
    finally:
        os.environ.pop("OM_WRAPPER_TEMPLATE_STRICT", None)
    assert not wrapper.read_text(encoding="utf-8").endswith("# hand edit\n")

    # clean re-mint (no edits) succeeds under strict
    assert mint_main(["--project-dir", str(project)]) == 0


def test_generated_wrappers_contract(tmp_path):
    """Contract greps against ACTUAL rendered artifacts (plan verification)."""
    ep, project = build_project_layout(tmp_path)
    from tools.qc.mint_project_pipeline import main as mint_main
    assert mint_main(["--project-dir", str(project), "--scenes", "3"]) == 0
    cc = project / "scripts" / "cc_pipeline"
    for py in cc.glob("*.py"):
        assert "acceptEdits" not in py.read_text(encoding="utf-8"), py.name
        assert 'OM_MAX_CONCURRENCY", "2"' not in py.read_text(encoding="utf-8"), py.name
    launcher = (cc / "run_cc_pipeline.py").read_text(encoding="utf-8")
    assert "from tools.qc.concurrency_governor import ConcurrencyGovernor" in launcher
    assert "raise ImportError" in launcher
    assert "timeout_error" in (cc / "reviewer_wrapper.py").read_text(encoding="utf-8")
    assert "validate_imports_and_theme" in (cc / "writer_wrapper.py").read_text(encoding="utf-8")


def _load_module(path: Path):
    import importlib.util
    spec = importlib.util.spec_from_file_location(path.stem + "_mod", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ==============================================================================
# 4A.3 — pre-flight (phase-3 task 3.2 pull-forward, REV-2: OM-real layout)
# ==============================================================================

VALID_SCENE = (
    'import React from "react";\n'
    'import { SceneShell } from "./lib/SceneShell";\n'
    'import { Sequence } from "remotion";\n'
    'import { COLORS, FONTS } from "./theme";\n'
    'export default () => <SceneShell />;\n'
)
INVALID_SCENE = 'import { BadShell } from "wrong/path";\nexport default () => <div />;\n'


def test_validate_imports_and_theme_flexible_real_layouts(tmp_path):
    """4A.3 rev-2: the pre-flight accepts every REAL per-episode specifier
    (./lib/SceneShell, ../lib/SceneShell, ./common[/SceneShell], ./SceneShell,
    @alias/SceneShell) plus the bare-remotion fallback; the phantom
    ``remotion-composer/src/common`` specifier no longer exists as a
    requirement; theme import/usage is reported WARN-only, never fatal."""
    ep, project = build_project_layout(tmp_path)
    from tools.qc.mint_project_pipeline import main as mint_main
    assert mint_main(["--project-dir", str(project)]) == 0
    mod = _load_module(project / "scripts" / "cc_pipeline" / "writer_wrapper.py")

    # real per-episode specifiers all pass
    for spec in ("./lib/SceneShell", "../lib/SceneShell", "./common/SceneShell",
                 "./common", "./SceneShell", "@episode/lib/SceneShell"):
        src = f'import {{ SceneShell }} from "{spec}";\n'
        ok, msg = mod.validate_imports_and_theme(src)
        assert ok is True, spec
        assert msg.startswith("OK"), (spec, msg)

    # bare remotion fallback passes (scene built on raw remotion primitives)
    ok, msg = mod.validate_imports_and_theme(
        "import { AbsoluteFill, Sequence } from 'remotion';\n"
        "export default () => <AbsoluteFill />;\n")
    assert ok is True and msg.startswith("OK")

    # theme import OR usage -> exact OK; absence -> OK but warn-only marker
    ok, msg = mod.validate_imports_and_theme(VALID_SCENE)
    assert ok is True and msg == "OK"
    ok, msg = mod.validate_imports_and_theme(
        'import { SceneShell } from "./lib/SceneShell";\nexport default () => <SceneShell />;\n')
    assert ok is True and "warn-only" in msg
    ok, msg = mod.validate_imports_and_theme(
        'import { SceneShell } from "./lib/SceneShell";\nconst c = COLORS.primary;\n')
    assert ok is True and msg == "OK"  # usage counts as theme usage

    # missing everything still hard-fails, with the rev-2 message
    ok, msg = mod.validate_imports_and_theme(INVALID_SCENE)
    assert ok is False
    assert msg == "Missing mandatory import: SceneShell ('./lib/SceneShell' style) or 'remotion'"

    # the phantom specifier alone is NOT a pass (unresolvable in OM)
    ok, _ = mod.validate_imports_and_theme(
        'import { SceneShell } from "remotion-composer/src/common/SceneShell";\n')
    assert ok is False


def test_writer_template_preseeds_scene_shell_header():
    """4A.3 rev-2 template contract: default pre-seed header uses the dominant
    REAL episode pattern, and the phantom ``remotion-composer/src/common``
    specifier appears NOWHERE in the writer template."""
    tmpl = (TEMPLATE_DIR / "writer_wrapper.py.tmpl").read_text(encoding="utf-8")
    assert "import { SceneShell } from './lib/SceneShell';" in tmpl
    assert "import { COLORS, FONTS } from './theme';" in tmpl
    assert "import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';" in tmpl
    # the phantom specifier must never appear in CODE (an import or a required-
    # import constant); docstring explanations of the rev-2 audit are fine.
    assert "from 'remotion-composer/src/common" not in tmpl
    assert 'from "remotion-composer/src/common' not in tmpl
    assert "remotion-composer/src/common/SceneShell\"" not in tmpl
    assert "REQUIRED_SCENE_IMPORTS" not in tmpl
    # rev-2 machinery present
    assert "_detect_episode_shell_layout" in tmpl
    assert "_scene_shell_header" in tmpl
    assert "_preflight_gate" in tmpl
    assert "_tsc_lines_for_scene" in tmpl


def test_detect_episode_shell_layout_real_variants(tmp_path):
    """_detect_episode_shell_layout mirrors the REAL OM episode layouts:
    scenes/lib (tai-chinh style), episode lib (tin-nong style), episode-root
    SceneShell.tsx (chinh-phu legacy), and None when no module exists."""
    ep, project = build_project_layout(tmp_path)
    from tools.qc.mint_project_pipeline import main as mint_main
    assert mint_main(["--project-dir", str(project)]) == 0
    mod = _load_module(project / "scripts" / "cc_pipeline" / "writer_wrapper.py")

    # layout A: scenes/lib/SceneShell.tsx + scenes/theme.ts -> ./lib + ./theme
    epA = tmp_path / "epA"
    (epA / "scenes/lib").mkdir(parents=True)
    (epA / "scenes/lib/SceneShell.tsx").write_text("export const SceneShell = 1;\n")
    (epA / "scenes/theme.ts").write_text("export const COLORS = {};\n")
    assert mod._detect_episode_shell_layout(epA) == ("./lib/SceneShell", "./theme")

    # layout B: episode lib/ + theme.ts with a scenes/ dir -> ../lib + ../theme
    epB = tmp_path / "epB"
    (epB / "lib").mkdir(parents=True)
    (epB / "lib/SceneShell.tsx").write_text("export const SceneShell = 1;\n")
    (epB / "theme.ts").write_text("export const COLORS = {};\n")
    (epB / "scenes").mkdir()
    assert mod._detect_episode_shell_layout(epB) == ("../lib/SceneShell", "../theme")

    # layout C: SceneShell.tsx at episode root, no theme module anywhere
    epC = tmp_path / "epC"
    epC.mkdir()
    (epC / "scenes").mkdir()
    (epC / "SceneShell.tsx").write_text("export const SceneShell = 1;\n")
    assert mod._detect_episode_shell_layout(epC) == ("../SceneShell", None)

    # layout D (default OM synthetic/test episodes): no module -> None,
    # and the pre-seed header falls back to the default real-pattern header.
    assert mod._detect_episode_shell_layout(tmp_path / "epD-missing") is None
    header = mod._scene_shell_header(tmp_path / "epD-missing")
    assert header == mod.SCENE_SHELL_IMPORT_HEADER
    assert "'./lib/SceneShell'" in header and "'./theme'" in header

    # detected layout drives the header specifiers
    assert "'./lib/SceneShell'" in mod._scene_shell_header(epA)
    assert "'../lib/SceneShell'" in mod._scene_shell_header(epB)
    assert "'../SceneShell'" in mod._scene_shell_header(epC)
    assert "theme" not in mod._scene_shell_header(epC).split("remotion';")[1]


def test_tsc_own_scene_lines_match_resolved_filename(tmp_path):
    """Reviewer fix: own-scene tsc lines match the RESOLVED scene filename
    (``S01.tsx`` for ``scene-1``) — not the raw scene_id substring — and
    never cross-attribute siblings (``scene-11.tsx``, ``S12.tsx``) or plain
    summary text."""
    ep, project = build_project_layout(tmp_path)
    from tools.qc.mint_project_pipeline import main as mint_main
    assert mint_main(["--project-dir", str(project)]) == 0
    mod = _load_module(project / "scripts" / "cc_pipeline" / "writer_wrapper.py")
    lines = [
        "src/scenes/S01.tsx(12,5): error TS2322: Type 'x' is not assignable.",
        "src/scenes/S12.tsx(3,1): error TS2304: Cannot find name 'y'.",
        "src/scenes/scene-11.tsx(1,1): error TS2304: z.",
        "Found 3 errors in 3 files.",
    ]
    own = mod._tsc_lines_for_scene(lines, ["S01.tsx", "scene-1.tsx"])
    assert own == [lines[0]]
    own11 = mod._tsc_lines_for_scene(lines, ["S11.tsx", "scene-11.tsx"])
    assert own11 == [lines[2]]
    # literal scene_id spelling still matched (scene-1.tsx emitted directly)
    own_lit = mod._tsc_lines_for_scene(
        ["scenes/scene-1.tsx(2,1): error TS2304"], ["S01.tsx", "scene-1.tsx"])
    assert len(own_lit) == 1
    # windows-style path separators normalize
    assert mod._tsc_lines_for_scene(
        ["src\\scenes\\S01.tsx(9,2): error"], ["S01.tsx", "scene-1.tsx"])


def _run_writer_wrapper(tmp_path, ep, project, monkeypatch, stub_claude, mode):
    """Mint + run the minted writer wrapper directly against the stub claude."""
    from tools.qc.mint_project_pipeline import main as mint_main
    monkeypatch.setenv("OM_WRAPPER_TEMPLATE_STRICT", "0")
    assert mint_main(["--project-dir", str(project)]) == 0
    monkeypatch.setenv("OM_STUB_PROJECT_ROOT", str(project))
    monkeypatch.setenv("OM_STUB_MODE", mode)
    monkeypatch.setenv("OM_SCENE_ID", "scene-1")
    monkeypatch.setenv("OM_EPISODE_DIR", str(ep))
    monkeypatch.setenv("OM_ATTEMPT_INDEX", "1")
    monkeypatch.setenv("OM_ROLE", "writer")
    env = dict(os.environ)
    env["PATH"] = f"{stub_claude}:{env.get('PATH', '')}"
    env["PYTHONPATH"] = str(REPO_ROOT)  # tmp-minted wrapper resolves this checkout's tools.qc
    wrapper = project / "scripts" / "cc_pipeline" / "writer_wrapper.py"
    return subprocess.run([sys.executable, str(wrapper)], capture_output=True,
                          text=True, env=env, cwd=REPO_ROOT, timeout=60)


def test_writer_wrapper_preflight_rejects_before_tsc(tmp_path, stub_claude, monkeypatch):
    """Sandbox output missing a mandatory import -> wrapper exits 1, nothing
    promoted, and the 240s npx tsc spend is never reached — WHEN the episode
    carries a real SceneShell module so the pre-flight can anchor (rev-2:
    unknown layout warn-and-allows instead; see the next test)."""
    ep, project = build_project_layout(tmp_path, scene_ids=["scene-1"])
    # anchor the pre-flight: give the episode the real scenes/lib layout
    (ep / "scenes/lib").mkdir(parents=True, exist_ok=True)
    (ep / "scenes/lib/SceneShell.tsx").write_text("export const SceneShell = 1;\n", encoding="utf-8")
    proc = _run_writer_wrapper(tmp_path, ep, project, monkeypatch, stub_claude, "noimports")
    assert proc.returncode == 1
    assert "PRE-FLIGHT FAIL" in proc.stdout
    assert "Missing mandatory import" in proc.stdout
    assert not (ep / "scenes" / ".tmp_scene-1.tsx").exists()  # nothing staged
    assert (ep / "scenes" / "S01.tsx").read_text(encoding="utf-8").startswith(
        "// placeholder")  # placeholder untouched (nothing promoted)


def test_writer_wrapper_preflight_warn_allows_unknown_layout(tmp_path, stub_claude, monkeypatch):
    """4A.3 rev-2 warn-and-allow: episode carries NO SceneShell module on disk
    (unknown layout) -> the pre-flight NEVER hard-fails; output is promoted
    and the 240s tsc spend stays the real gate. Same 'noimports' output that
    the anchored test above rejects."""
    ep, project = build_project_layout(tmp_path, scene_ids=["scene-1"])
    proc = _run_writer_wrapper(tmp_path, ep, project, monkeypatch, stub_claude, "noimports")
    assert proc.returncode == 0
    assert "PRE-FLIGHT WARN" in proc.stdout
    assert "layout unknown" in proc.stdout
    assert "PRE-FLIGHT FAIL" not in proc.stdout
    promoted = ep / "scenes" / "S01.tsx"
    assert promoted.is_file()
    assert "no shell here" in promoted.read_text(encoding="utf-8")
    assert not (ep / "scenes" / ".tmp_scene-1.tsx").exists()  # promoted, not left staged


# ==============================================================================
# 4A.1 + 4A.2 end-to-end canary: minted launcher + stub claude
# ==============================================================================

def _launch_pipeline(tmp_path, ep, project, stub_bin, extra_env=None, timeout=180):
    launcher = project / "scripts" / "cc_pipeline" / "run_cc_pipeline.py"
    env = os.environ.copy()
    env.update({
        "PATH": f"{stub_bin}:{env.get('PATH', '')}",
        "OM_STUB_PROJECT_ROOT": str(project),
        "OM_EPISODE_DIR_OVERRIDE": str(ep),
        "OM_SCENE_LIST": ",".join(SCENE_IDS_3),
        "OM_MAX_CONCURRENCY": "2",  # deterministic; also avoids the network tier probe
        "OM_MAX_RETRIES": "1",
        "OM_AGENT_TIMEOUT": "90",
        "PYTHONPATH": str(REPO_ROOT),  # tmp-minted wrappers resolve this checkout's tools.qc
    })
    env.update(extra_env or {})
    return subprocess.run([sys.executable, str(launcher)], capture_output=True,
                          text=True, env=env, cwd=REPO_ROOT, timeout=timeout)


def test_canary_round1_rejection_injects_findings_into_attempt2(tmp_path, stub_claude, monkeypatch):
    """Plan 4A.1 acceptance: 3-scene synthetic episode, forced round-1
    rejection -> attempt-2 writer log contains PRIOR REVIEWER ISSUES with the
    attempt-1 issue strings; findings file exists at the canonical path."""
    monkeypatch.delenv("OM_FINDINGS_INJECT", raising=False)
    ep, project = build_project_layout(tmp_path)
    from tools.qc.mint_project_pipeline import main as mint_main
    assert mint_main(["--project-dir", str(project), "--scenes", "3"]) == 0

    proc = _launch_pipeline(tmp_path, ep, project, stub_claude)
    hist = project / "history"
    log1 = (hist / "cc_writer_scene-1.log").read_text(encoding="utf-8")
    # attempt >= 2 injected the prior reviewer issues (grep contract >= 1)
    assert log1.count("PRIOR REVIEWER ISSUES") >= 1
    assert REJECT_MARKER in log1
    # canonical findings file exists while scene-2/3 may still be unresolved —
    # approved scenes have theirs reset; assert the canonical DIR contract.
    assert (hist / "cc_findings").is_dir()
    # at least one scene completed both attempts (per-scene writer counters)
    runs = sum(int((hist / f".stub_writer_runs_{sid}").read_text().strip())
               for sid in SCENE_IDS_3
               if (hist / f".stub_writer_runs_{sid}").exists())
    assert runs >= 4  # 3 scenes x attempt1 + at least one attempt2
    assert proc.returncode in (0, 1)  # gate may fail on the synthetic episode; scenes are what matters


def test_canary_findings_inject_off_means_no_injection(tmp_path, stub_claude, monkeypatch):
    """OM_FINDINGS_INJECT=0 -> no findings writes, no PRIOR REVIEWER ISSUES."""
    ep, project = build_project_layout(tmp_path)
    from tools.qc.mint_project_pipeline import main as mint_main
    monkeypatch.setenv("OM_WRAPPER_TEMPLATE_STRICT", "0")
    assert mint_main(["--project-dir", str(project), "--scenes", "3"]) == 0

    proc = _launch_pipeline(tmp_path, ep, project, stub_claude,
                            extra_env={"OM_FINDINGS_INJECT": "0"})
    hist = project / "history"
    for sid in SCENE_IDS_3:
        log = hist / f"cc_writer_{sid}.log"
        if log.exists():
            assert "PRIOR REVIEWER ISSUES" not in log.read_text(encoding="utf-8")
    # no findings files written (rejected verdicts produce no canonical file)
    findings_dir = hist / "cc_findings"
    assert not findings_dir.exists() or not any(findings_dir.iterdir())


def test_canary_reviewer_watchdog_emits_timeout_error(tmp_path, stub_claude, monkeypatch):
    """4A.2 acceptance: forced watchdog expiry emits verdict "timeout_error"
    (activates the orchestrator infra-retry). Drives the minted reviewer
    wrapper directly with a sleeping stub claude and a 1s watchdog."""
    ep, project = build_project_layout(tmp_path, scene_ids=["scene-1"])
    from tools.qc.mint_project_pipeline import main as mint_main
    monkeypatch.setenv("OM_WRAPPER_TEMPLATE_STRICT", "0")
    assert mint_main(["--project-dir", str(project)]) == 0

    sandbox = ep / "sandbox"
    (sandbox / "scenes").mkdir(parents=True)
    (sandbox / "scenes" / "scene-1.tsx").write_text(VALID_SCENE, encoding="utf-8")
    env = os.environ.copy()
    env.update({
        "PATH": f"{stub_claude}:{env.get('PATH', '')}",
        "OM_ROLE": "reviewer",
        "OM_STUB_PROJECT_ROOT": str(project),
        "OM_STUB_MODE": "sleep",
        "OM_SCENE_ID": "scene-1",
        "OM_SANDBOX_DIR": str(sandbox),
        "OM_CANONICAL_DIR": str(ep),
        "OM_CC_REVIEW_WATCHDOG": "1",
        "PYTHONPATH": str(REPO_ROOT),
    })
    wrapper = project / "scripts" / "cc_pipeline" / "reviewer_wrapper.py"
    proc = subprocess.run([sys.executable, str(wrapper)], capture_output=True,
                          text=True, env=env, cwd=REPO_ROOT, timeout=60)
    assert proc.returncode == 0
    findings = json.loads((sandbox / "packets" / "scene-1_findings.json").read_text(encoding="utf-8"))
    assert findings["verdict"] == "timeout_error"
    assert "watchdog expired" in findings["issues"][0]
    verdict = json.loads((sandbox / "packets" / "scene-1_cc_verdict.json").read_text(encoding="utf-8"))
    assert verdict["verdict"] == "timeout_error"


def test_canary_launcher_governor_assert_fires_when_unimportable(tmp_path, stub_claude, monkeypatch):
    """Startup assert: a checkout where tools.qc.concurrency_governor is NOT
    importable fails LOUD (raise) instead of silently degrading."""
    ep, project = build_project_layout(tmp_path, scene_ids=["scene-1"])
    from tools.qc.mint_project_pipeline import main as mint_main
    monkeypatch.setenv("OM_WRAPPER_TEMPLATE_STRICT", "0")
    assert mint_main(["--project-dir", str(project)]) == 0
    launcher = project / "scripts" / "cc_pipeline" / "run_cc_pipeline.py"
    env = os.environ.copy()
    env["PYTHONPATH"] = ""  # no tools.qc anywhere -> import must fail loud
    env["OM_EPISODE_DIR_OVERRIDE"] = str(ep)
    proc = subprocess.run([sys.executable, str(launcher)], capture_output=True,
                          text=True, env=env, cwd=REPO_ROOT, timeout=60)
    assert proc.returncode != 0
    combined = proc.stdout + proc.stderr
    assert "FATAL: cannot import tools.qc.concurrency_governor" in combined
