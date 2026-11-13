"""Perf R1-R5 tests (perf/cc-pipeline-r1-r5) — R2, R3, R4, R5.

Covers (R1 concurrency governor is owned by another coder — not tested here):
- R2 reviewer-style brief: single-source constant in scene_orchestrator,
  appended to the writer task from ATTEMPT 1 by the minted writer wrapper
  (end-to-end against a stub `claude` that dumps its stdin task).
- R3 infra vs content: transport glitches + reviewer turn-cap/watchdog
  ``timeout_error`` verdicts retry IN PLACE (attempt ordinal unchanged, no
  full rewrite); content rejections still consume attempts; infra budget
  (OM_INFRA_RETRY_CAP) exhaustion escalates to a bounded content attempt.
- R4 pre-render input validation: missing/trivial packets, scene files,
  narration and word refs fail fast with ``pre_render_*`` codes BEFORE the
  episode gate runs (gate skipped when inputs are not render-ready; full gate
  still runs when they are).
- R5 reviewer turn cap: default 30 -> 45 and an explicit ``timeout_error``
  verdict when the reviewer stream carries no verdict block (the exact string
  contract between the wrapper template and the orchestrator).
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

import tools.qc.scene_orchestrator as som
from tools.qc.reviewer_runner import (
    DEFAULT_REVIEW_MAX_TURNS,
    REVIEW_TIMEOUT_VERDICT,
    build_reviewer_cmd,
)
from tools.qc.scene_orchestrator import (
    AgentRunResult,
    CallableAgentRunner,
    REVIEWER_STYLE_BRIEF,
    ReviewerContext,
    WriterContext,
    execute_scene_with_retries,
    prevalidate_render_inputs,
)
from tests.test_scene_orchestrator import make_test_episode

REPO_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = REPO_ROOT / "tools" / "qc" / "cc_wrapper_templates"
SLUG = "perf-r1-r5-canary"


# ==============================================================================
# Helpers
# ==============================================================================

def _make_layout_with_project(tmp_path, scene_ids=("scene-1",)):
    """Episode + sibling projects/<slug> (canonical findings base)."""
    ep = make_test_episode(tmp_path, scene_ids=list(scene_ids))
    project = tmp_path / "projects" / ep.name
    project.mkdir(parents=True)
    return ep, project


def _writer_result(ctx: WriterContext, exit_code=0, stdout="ok", stderr="") -> AgentRunResult:
    return AgentRunResult(instance_id=ctx.instance_id, token=ctx.token, role="writer",
                          exit_code=exit_code, started_at="t", finished_at="t",
                          duration_seconds=0.0, stdout=stdout, stderr=stderr)


def _reviewer_result(ctx: ReviewerContext, exit_code=0, stdout="verdict delivered",
                     stderr="") -> AgentRunResult:
    return AgentRunResult(instance_id=ctx.instance_id, token=ctx.token, role="reviewer",
                          exit_code=exit_code, started_at="t", finished_at="t",
                          duration_seconds=0.0, stdout=stdout, stderr=stderr)


def _approve(ctx: ReviewerContext) -> AgentRunResult:
    fdir = ctx.sandbox_dir / "packets"
    fdir.mkdir(parents=True, exist_ok=True)
    (fdir / f"{ctx.scene_id}_findings.json").write_text(json.dumps({
        "scene_id": ctx.scene_id, "verdict": "approved",
        "reviewed_hashes": ctx.output_hashes,
    }))
    return _reviewer_result(ctx)


def _verdict(ctx: ReviewerContext, verdict: str, issues: list[str] | None = None) -> AgentRunResult:
    fdir = ctx.sandbox_dir / "packets"
    fdir.mkdir(parents=True, exist_ok=True)
    payload = {"scene_id": ctx.scene_id, "verdict": verdict}
    if issues is not None:
        payload["issues"] = issues
    if verdict == "approved":
        payload["reviewed_hashes"] = ctx.output_hashes
    (fdir / f"{ctx.scene_id}_findings.json").write_text(json.dumps(payload))
    return _reviewer_result(ctx)


class ScriptedRunner(CallableAgentRunner):
    """CallableAgentRunner with scripted per-call writer/reviewer behaviors."""

    def __init__(self, writer_fns, reviewer_fns):
        self._writer_scripts = list(writer_fns)
        self._reviewer_scripts = list(reviewer_fns)
        self.writer_ctxs: list[WriterContext] = []
        self.reviewer_ctxs: list[ReviewerContext] = []
        super().__init__(writer_fn=self._scripted_writer, reviewer_fn=self._scripted_reviewer)

    def _scripted_writer(self, ctx: WriterContext) -> AgentRunResult:
        self.writer_ctxs.append(ctx)
        fn = self._writer_scripts.pop(0) if self._writer_scripts else self._writer_scripts_last
        return fn(ctx)

    def _scripted_reviewer(self, ctx: ReviewerContext) -> AgentRunResult:
        self.reviewer_ctxs.append(ctx)
        fn = self._reviewer_scripts.pop(0) if self._reviewer_scripts else self._reviewer_last
        return fn(ctx)


# ==============================================================================
# R2 — reviewer-style brief from attempt 1
# ==============================================================================

REJECT_RULE_SNIPPETS = (
    "CountUp frame match",
    "Currency whitelist",
    "Coordinate placement",
    "No placeholder components",
    "SAFE.*",
    "No invented vars",
    "No raw image leakage",
)


def test_r2_brief_constant_covers_all_reject_classes():
    """Single source of truth: the orchestrator constant carries every generic
    tin-nong reject class (CountUp frames, currency whitelist, coordinates,
    no placeholders, SAFE.* props, no invented vars, no raw image leakage)."""
    for snippet in REJECT_RULE_SNIPPETS:
        assert snippet in REVIEWER_STYLE_BRIEF, f"brief missing rule: {snippet}"
    # It is a reviewer-style brief: framed as auto-reject rules, bounded size
    # (writer-context protection parity with FINDINGS_MAX_CHARS' spirit).
    assert "REVIEWER STYLE BRIEF" in REVIEWER_STYLE_BRIEF
    assert len(REVIEWER_STYLE_BRIEF) < 4000


def test_r2_writer_template_appends_brief_from_attempt_1():
    """Template contract: the wrapper imports the constant (no duplicated text
    in the template) and appends it in BOTH mains — legacy and sandboxed —
    unconditionally, so attempt 1 carries it too."""
    tmpl = (TEMPLATE_DIR / "writer_wrapper.py.tmpl").read_text(encoding="utf-8")
    assert "REVIEWER_STYLE_BRIEF" in tmpl
    assert "from tools.qc.scene_orchestrator import" in tmpl
    # exactly the two append sites (legacy + sandboxed main), no scatter
    assert len(re.findall(r"^    task = task \+ REVIEWER_STYLE_BRIEF$", tmpl, re.M)) == 2
    # the raw rule TEXT must NOT be duplicated in the template (a docstring
    # naming the rules is fine; the rules' operative sentences live only in
    # the orchestrator constant)
    assert "must land inside the scene window" not in tmpl
    assert "y330-1440" not in tmpl
    assert "auto-rejects" not in tmpl
    # attempt-1 injection: the append is NOT gated on any attempt/env condition
    for line in tmpl.splitlines():
        if "REVIEWER_STYLE_BRIEF" in line and "task + " in line:
            assert "attempt" not in line.lower()  # unconditional
            assert "if " not in line


def test_r2_minted_writer_wrapper_injects_brief_into_task(tmp_path, monkeypatch):
    """End-to-end: minted writer wrapper feeds the brief to `claude` on stdin
    from ATTEMPT 1 (stub dumps its task)."""
    bindir = tmp_path / "stubbin"
    bindir.mkdir()
    stub = bindir / "claude"
    stub.write_text(textwrap.dedent("""\
        #!/usr/bin/env python3
        import os, sys
        from pathlib import Path
        proj = Path(os.environ["OM_STUB_PROJECT_ROOT"])
        hist = proj / "history"
        if os.environ.get("OM_ROLE", "writer") == "writer":
            task = sys.stdin.read()
            (hist / "r1r5_writer_task_dump.txt").write_text(task, encoding="utf-8")
            sid = os.environ["OM_SCENE_ID"]
            ep = Path(os.environ["OM_EPISODE_DIR"])
            att = os.environ.get("OM_ATTEMPT_INDEX", "0")
            sb = ep / ".tmp_sandboxes" / f"{sid}_{att}"
            sb.mkdir(parents=True, exist_ok=True)
            src = (
                'import React from "react";\\n'
                'import { SceneShell } from "remotion-composer/src/common/SceneShell";\\n'
                f'export default () => <SceneShell><div>scene {sid}</div></SceneShell>;\\n'
            )
            src += f"// stub body for {sid} " + ("x" * 220) + "\\n"
            (sb / f"{sid}.tsx").write_text(src, encoding="utf-8")
            sys.exit(0)
        sys.exit(2)
    """), encoding="utf-8")
    stub.chmod(0o755)
    monkeypatch.setenv("PATH", f"{bindir}:{os.environ.get('PATH', '')}")

    ep = make_test_episode(tmp_path / "build", scene_ids=["scene-1"])
    (ep / "scenes").mkdir(exist_ok=True)  # promotion target for the wrapper
    project = tmp_path / "projects" / ep.name
    project.mkdir(parents=True)
    tasks = project / "history" / "scene_tasks"
    tasks.mkdir(parents=True)
    (tasks / "scene-1.task.md").write_text("# TASK writer scene-1\n\nBuild scene-1.", encoding="utf-8")

    from tools.qc.mint_project_pipeline import main as mint_main
    monkeypatch.setenv("OM_WRAPPER_TEMPLATE_STRICT", "0")
    assert mint_main(["--project-dir", str(project)]) == 0
    monkeypatch.setenv("OM_STUB_PROJECT_ROOT", str(project))
    monkeypatch.setenv("OM_SCENE_ID", "scene-1")
    monkeypatch.setenv("OM_EPISODE_DIR", str(ep))
    monkeypatch.setenv("OM_ATTEMPT_INDEX", "1")
    monkeypatch.setenv("OM_ROLE", "writer")
    env = dict(os.environ)
    env["PATH"] = f"{bindir}:{env.get('PATH', '')}"
    env["PYTHONPATH"] = str(REPO_ROOT)
    wrapper = project / "scripts" / "cc_pipeline" / "writer_wrapper.py"
    proc = subprocess.run([sys.executable, str(wrapper)], capture_output=True,
                          text=True, env=env, cwd=REPO_ROOT, timeout=60)
    assert proc.returncode == 0, proc.stdout + proc.stderr
    task = (project / "history" / "r1r5_writer_task_dump.txt").read_text(encoding="utf-8")
    assert "REVIEWER STYLE BRIEF" in task
    for snippet in REJECT_RULE_SNIPPETS:
        assert snippet in task, f"brief rule missing from injected task: {snippet}"
    # the brief arrives on ATTEMPT 1 (this run was OM_ATTEMPT_INDEX=1... prove
    # ordinal independence with a fresh attempt-0 run: the stub dump is the
    # attempt-1 one overwritten; assert the PRIOR findings block is absent —
    # the brief must not depend on it)
    assert "PRIOR REVIEWER ISSUES" not in task


# ==============================================================================
# R3 — infra failures vs content rejections
# ==============================================================================

@pytest.fixture(autouse=True)
def _fast_infra_backoff(monkeypatch):
    """Zero the in-place infra backoff for unit tests (env is read at call time)."""
    monkeypatch.setenv(som.INFRA_RETRY_DELAY_ENV, "0")


def test_r3_writer_transport_glitch_retries_in_place(tmp_path, monkeypatch):
    """Writer transport glitch (exit 0, empty stdout) on attempt 1 retries IN
    PLACE: attempt ordinal stays 1, the glitch attempt is marked infra, and the
    scene succeeds WITHOUT consuming a content attempt (max_retries=0)."""
    monkeypatch.delenv("OM_FINDINGS_INJECT", raising=False)
    ep = make_test_episode(tmp_path, scene_ids=["cut-1"])

    def glitch(ctx):
        return _writer_result(ctx, stdout="   ")  # empty stdout = transport glitch

    def ok(ctx):
        return _writer_result(ctx)

    runner = ScriptedRunner([glitch, ok], [_approve])
    rec = execute_scene_with_retries("cut-1", ep, runner=runner, max_retries=0)
    assert rec.status == "success"
    assert [a.attempt_number for a in rec.attempts] == [1, 1]  # ordinal NOT consumed
    assert rec.attempts[0].infra is True
    assert rec.attempts[1].infra is False
    assert rec.attempts[1].success is True
    assert len(runner.writer_ctxs) == 2  # writer ran twice despite max_retries=0
    # infra retries never trigger a full rewrite: no prior findings injected
    assert all(ctx.prior_findings is None for ctx in runner.writer_ctxs)


def test_r3_reviewer_timeout_verdict_is_infra_retry(tmp_path, monkeypatch):
    """Reviewer turn-cap verdict (R5's ``timeout_error`` contract string) is an
    INFRA failure: in-place retry, ordinal unchanged, scene succeeds."""
    monkeypatch.delenv("OM_FINDINGS_INJECT", raising=False)
    ep = make_test_episode(tmp_path, scene_ids=["cut-1"])

    def timeout_verdict(ctx):
        return _verdict(ctx, REVIEW_TIMEOUT_VERDICT,
                        [f"Reviewer delivered no verdict block (turn cap 45 exhausted)"])

    runner = ScriptedRunner([_writer_result, _writer_result],
                            [timeout_verdict, _approve])
    rec = execute_scene_with_retries("cut-1", ep, runner=runner, max_retries=0)
    assert rec.status == "success"
    assert [a.attempt_number for a in rec.attempts] == [1, 1]
    assert rec.attempts[0].infra is True
    assert REVIEW_TIMEOUT_VERDICT in (rec.attempts[0].error or "")


def test_r3_reviewer_cli_crash_is_infra_retry(tmp_path, monkeypatch):
    """Reviewer process crash (exit != 0, no findings) = INFRA: in-place retry,
    ordinal unchanged."""
    monkeypatch.delenv("OM_FINDINGS_INJECT", raising=False)
    ep = make_test_episode(tmp_path, scene_ids=["cut-1"])

    def crash(ctx):
        return _reviewer_result(ctx, exit_code=1, stdout="", stderr="spawn fail")

    runner = ScriptedRunner([_writer_result, _writer_result], [crash, _approve])
    rec = execute_scene_with_retries("cut-1", ep, runner=runner, max_retries=0)
    assert rec.status == "success"
    assert [a.attempt_number for a in rec.attempts] == [1, 1]
    assert rec.attempts[0].infra is True


def test_r3_content_rejection_still_consumes_attempt(tmp_path, monkeypatch):
    """Content rejections keep the legacy contract: ordinals [1, 2], no infra
    marks, findings injected into attempt 2."""
    monkeypatch.delenv("OM_FINDINGS_INJECT", raising=False)
    ep, project = _make_layout_with_project(tmp_path)

    def reject(ctx):
        return _verdict(ctx, "rejected", ["SYNTHETIC-REJECT-ISSUE"])

    runner = ScriptedRunner([_writer_result, _writer_result], [reject, _approve])
    rec = execute_scene_with_retries("scene-1", ep, runner=runner, max_retries=1)
    assert rec.status == "success"
    assert [a.attempt_number for a in rec.attempts] == [1, 2]
    assert all(a.infra is False for a in rec.attempts)
    assert runner.writer_ctxs[0].prior_findings is None
    assert runner.writer_ctxs[1].prior_findings is not None  # content learning intact


def test_r3_mixed_infra_then_rejection_then_approval(tmp_path, monkeypatch):
    """Glitch (infra, ordinal 1 kept) -> content rejection (ordinal -> 2) ->
    approval: ordinals [1, 1, 2]. Only the ordinal-2 writer context learns."""
    monkeypatch.delenv("OM_FINDINGS_INJECT", raising=False)
    ep, project = _make_layout_with_project(tmp_path)

    def glitch(ctx):
        return _writer_result(ctx, stdout="")

    def reject(ctx):
        return _verdict(ctx, "rejected", ["MIXED-REJECT"])

    runner = ScriptedRunner([glitch, _writer_result, _writer_result],
                            [reject, _approve])
    rec = execute_scene_with_retries("scene-1", ep, runner=runner, max_retries=1)
    assert rec.status == "success"
    assert [a.attempt_number for a in rec.attempts] == [1, 1, 2]
    assert [a.infra for a in rec.attempts] == [True, False, False]
    assert all(ctx.prior_findings is None for ctx in runner.writer_ctxs[:2])
    assert runner.writer_ctxs[2].prior_findings is not None


def test_r3_infra_retry_budget_exhaustion_escalates(tmp_path, monkeypatch):
    """Persistent writer glitches burn OM_INFRA_RETRY_CAP in-place retries,
    then ESCALATE to consuming a content attempt — bounded, scene fails."""
    monkeypatch.delenv("OM_FINDINGS_INJECT", raising=False)
    monkeypatch.setenv(som.INFRA_RETRY_CAP_ENV, "1")
    ep = make_test_episode(tmp_path, scene_ids=["cut-1"])

    def glitch(ctx):
        return _writer_result(ctx, stdout="")

    runner = ScriptedRunner([], [])  # everything glitches
    runner._writer_scripts_last = glitch
    runner._reviewer_last = _approve
    rec = execute_scene_with_retries("cut-1", ep, runner=runner, max_retries=0)
    assert rec.status == "failed"
    # retry 1: in place (ordinal 1 kept); retry 2: budget exhausted -> ordinal
    # consumed -> while-loop exits (max_retries=0 allows only ordinal 1)
    assert [a.attempt_number for a in rec.attempts] == [1, 1]
    assert all(a.infra is True for a in rec.attempts)
    assert len(runner.writer_ctxs) == 2
    assert "infra retry in place" in (rec.attempts[0].error or "")


def test_r3_infra_backoff_delay_contract(monkeypatch):
    """Backoff doubles from the env-tunable base and caps at 30s."""
    monkeypatch.setenv(som.INFRA_RETRY_DELAY_ENV, "2.0")
    assert som.infra_backoff_delay(1) == 2.0
    assert som.infra_backoff_delay(2) == 4.0
    assert som.infra_backoff_delay(9) == 30.0  # capped


# ==============================================================================
# R4 — pre-validate render inputs before the gate
# ==============================================================================

def test_r4_prevalidate_clean_packet_only_episode(tmp_path):
    """Packet-hash-only episode (no scene files): packet + narration + words
    checks pass -> no pre-render reasons."""
    ep = make_test_episode(tmp_path, scene_ids=["cut-1"])
    assert prevalidate_render_inputs(ep, ["cut-1"]) == []


def test_r4_prevalidate_flags_missing_packet(tmp_path):
    ep = make_test_episode(tmp_path, scene_ids=["cut-1"])
    (ep / "packet_cut-1.json").unlink()
    reasons = prevalidate_render_inputs(ep, ["cut-1"])
    assert [r["code"] for r in reasons] == ["pre_render_packet_missing"]


def test_r4_prevalidate_flags_corrupt_packet(tmp_path):
    ep = make_test_episode(tmp_path, scene_ids=["cut-1"])
    (ep / "packet_cut-1.json").write_text("{not json", encoding="utf-8")
    reasons = prevalidate_render_inputs(ep, ["cut-1"])
    assert [r["code"] for r in reasons] == ["pre_render_packet_corrupt"]


def test_r4_prevalidate_flags_missing_narration_ref(tmp_path):
    ep = make_test_episode(tmp_path, scene_ids=["cut-1"])
    (ep / "assets" / "audio" / "voice_cut-1.wav").unlink()
    reasons = prevalidate_render_inputs(ep, ["cut-1"])
    assert [r["code"] for r in reasons] == ["pre_render_narration_missing"]


def test_r4_prevalidate_scene_file_checks_in_scene_layouts(tmp_path):
    """Scene-file-based layout (scenes/*.tsx exist): missing + trivial scene
    files are flagged; a real (>200B) scene file passes clean."""
    ep = make_test_episode(tmp_path, scene_ids=["scene-1", "scene-2"])
    scenes = ep / "scenes"
    scenes.mkdir()
    (scenes / "S01.tsx").write_text("// placeholder scene-1\n", encoding="utf-8")  # trivial

    reasons = prevalidate_render_inputs(ep, ["scene-1", "scene-2"])
    codes = {r["code"] for r in reasons}
    assert codes == {"pre_render_scene_file_missing", "pre_render_scene_file_trivial"}
    assert any("scene-2" in r["message"] for r in reasons if r["code"] == "pre_render_scene_file_missing")

    # render-ready layout: real scene files for both scenes -> clean
    (scenes / "S01.tsx").write_text("// real scene 1\n" + "x" * 300, encoding="utf-8")
    (scenes / "S02.tsx").write_text("// real scene 2\n" + "x" * 300, encoding="utf-8")
    assert prevalidate_render_inputs(ep, ["scene-1", "scene-2"]) == []


def test_r4_gate_fails_fast_skipping_full_gate_on_trivial_scene(tmp_path, monkeypatch):
    """Trivial scene file -> gate result carries the pre_render code and the
    full episode gate is NEVER invoked (fail fast before the gate thrash)."""
    ep = make_test_episode(tmp_path, scene_ids=["scene-1"])
    scenes = ep / "scenes"
    scenes.mkdir()
    (scenes / "S01.tsx").write_text("// placeholder\n", encoding="utf-8")

    def _gate_must_not_run(episode_dir):
        raise AssertionError("validate_episode must be skipped when pre-render inputs are invalid")

    monkeypatch.setattr(som, "validate_episode", _gate_must_not_run)
    session = som.orchestrate_episode(ep, max_concurrency=1, max_retries=0,
                                      runner=CallableAgentRunner())
    assert session.overall_status == "fail"
    codes = [r.get("code") for r in session.episode_gate_result.get("reasons", [])]
    assert "pre_render_scene_file_trivial" in codes


def test_r4_gate_runs_full_gate_when_inputs_render_ready(tmp_path, monkeypatch):
    """Packet-only episode with clean pre-render inputs -> the full gate still
    runs (spy asserts it was invoked) — R4 only short-circuits bad inputs."""
    ep, _ = _make_layout_with_project(tmp_path, scene_ids=["cut-1"])
    calls: list[Path] = []
    real_gate = som.validate_episode

    def spy(episode_dir):
        calls.append(Path(episode_dir))
        return real_gate(episode_dir)

    monkeypatch.setattr(som, "validate_episode", spy)
    session = som.orchestrate_episode(ep, max_concurrency=1, max_retries=0,
                                      runner=CallableAgentRunner())
    assert calls and calls[0] == ep.resolve()  # full gate ran
    codes = [r.get("code") for r in session.episode_gate_result.get("reasons", [])]
    assert all(not c.startswith("pre_render_") for c in codes)  # no pre-render short-circuit


# ==============================================================================
# R5 — reviewer turn cap + timeout_error contract
# ==============================================================================

def test_r5_reviewer_turn_cap_raised_to_45():
    assert DEFAULT_REVIEW_MAX_TURNS == "45"
    cmd = build_reviewer_cmd()
    assert "--max-turns" in cmd
    assert cmd[cmd.index("--max-turns") + 1] == "45"


def test_r5_timeout_error_contract_synced_between_sides():
    """The exact string is the template <-> orchestrator contract: one constant,
    imported by both (no literal drift)."""
    assert REVIEW_TIMEOUT_VERDICT == "timeout_error"
    tmpl = (TEMPLATE_DIR / "reviewer_wrapper.py.tmpl").read_text(encoding="utf-8")
    assert "REVIEW_TIMEOUT_VERDICT" in tmpl
    assert "from tools.qc.reviewer_runner import" in tmpl
    assert "VERDICT_DELIMITER_RE" in tmpl
    src = Path(som.__file__).read_text(encoding="utf-8")
    assert "from tools.qc.reviewer_runner import REVIEW_TIMEOUT_VERDICT" in src
    # the orchestrator classifies against the constant, not a literal
    assert '== "timeout_error"' not in src


def test_r5_minted_reviewer_wrapper_emits_timeout_error_on_missing_verdict(tmp_path, monkeypatch):
    """Reviewer stream with NO verdict block (turn cap exhausted / truncation)
    -> findings + verdict carry ``timeout_error`` (infra), not a rejection."""
    bindir = tmp_path / "stubbin"
    bindir.mkdir()
    stub = bindir / "claude"
    stub.write_text(textwrap.dedent("""\
        #!/usr/bin/env python3
        import os, sys
        mode = os.environ.get("OM_STUB_MODE", "")
        if os.environ.get("OM_ROLE", "reviewer") == "reviewer":
            if mode == "no-verdict":
                sys.stdout.write("partial thoughts, no delimiter block\\n")
                sys.stdout.flush()
                sys.exit(0)
            sys.stdout.write(
                "<!-- VERDICT_START -->\\n```json\\n"
                '{"scene_id": "scene-1", "verdict": "approved", "issues": [],'
                ' "metrics": {"complexity": "low"}}\\n```\\n'
                "<!-- VERDICT_END -->\\n")
            sys.stdout.flush()
            sys.exit(0)
        sys.exit(2)
    """), encoding="utf-8")
    stub.chmod(0o755)

    ep = make_test_episode(tmp_path / "build", scene_ids=["scene-1"])
    (ep / "scenes").mkdir(exist_ok=True)  # promotion target for the wrapper
    project = tmp_path / "projects" / ep.name
    project.mkdir(parents=True)
    from tools.qc.mint_project_pipeline import main as mint_main
    monkeypatch.setenv("OM_WRAPPER_TEMPLATE_STRICT", "0")
    assert mint_main(["--project-dir", str(project)]) == 0

    for mode, expected in (("no-verdict", REVIEW_TIMEOUT_VERDICT), ("approved", "approved")):
        sandbox = ep / f"sandbox-{mode}"
        (sandbox / "scenes").mkdir(parents=True)
        (sandbox / "scenes" / "scene-1.tsx").write_text(
            "// reviewed scene body\n" + "y" * 300, encoding="utf-8")
        monkeypatch.setenv("OM_STUB_MODE", mode)
        env = os.environ.copy()
        env.update({
            "PATH": f"{bindir}:{env.get('PATH', '')}",
            "OM_ROLE": "reviewer",
            "OM_SCENE_ID": "scene-1",
            "OM_SANDBOX_DIR": str(sandbox),
            "OM_CANONICAL_DIR": str(ep),
            "PYTHONPATH": str(REPO_ROOT),
        })
        wrapper = project / "scripts" / "cc_pipeline" / "reviewer_wrapper.py"
        proc = subprocess.run([sys.executable, str(wrapper)], capture_output=True,
                              text=True, env=env, cwd=REPO_ROOT, timeout=60)
        assert proc.returncode == 0, proc.stdout + proc.stderr
        findings = json.loads((sandbox / "packets" / "scene-1_findings.json").read_text(encoding="utf-8"))
        verdict = json.loads((sandbox / "packets" / "scene-1_cc_verdict.json").read_text(encoding="utf-8"))
        assert findings["verdict"] == expected, mode
        assert verdict["verdict"] == expected, mode
        if expected == REVIEW_TIMEOUT_VERDICT:
            assert "turn cap" in findings["issues"][0]
            assert "not a content rejection" in findings["issues"][0]
