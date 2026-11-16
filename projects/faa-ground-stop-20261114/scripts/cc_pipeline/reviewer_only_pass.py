#!/usr/bin/env python
"""Reviewer-only pass for already-written scenes (faa-ground-stop-20261114).

Scenes scene-1, scene-2, scene-10, scene-11, scene-12 were written in a prior
CC session but never reviewed (reviewer invocation was broken: planOnly flag).
This driver reuses orchestrate_episode with a writer no-op (scene files stay
on disk untouched) so the REAL CC reviewer + packet materialization +
integration run through the exact orchestrator path.

Usage (repo root): .venv/bin/python projects/faa-ground-stop-20261114/scripts/cc_pipeline/reviewer_only_pass.py
Env: OM_CC_REVIEW_MAX_TURNS, OM_CC_WATCHDOG/OM_CC_REVIEW_WATCHDOG, OM_MAX_CONCURRENCY.
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from run_cc_pipeline import CCRunner  # noqa: E402
from tools.qc.scene_orchestrator import (  # noqa: E402
    AgentRunResult, orchestrate_episode,
)

EPISODE = REPO / "remotion-composer/src/faa-ground-stop-20261114"
_env = os.environ.get("OM_REVIEWER_ONLY_SCENES", "")
TARGETS = (
    [s.strip() for s in _env.split(",") if s.strip()]
    or ["scene-1", "scene-2", "scene-10", "scene-11", "scene-12"]
)


class ReviewerOnlyRunner(CCRunner):
    def run_writer(self, context) -> AgentRunResult:  # type: ignore[override]
        iso = datetime.now(timezone.utc).isoformat()
        return AgentRunResult(
            instance_id=context.instance_id,
            token=context.token,
            role="writer",
            exit_code=0,
            started_at=iso,
            finished_at=iso,
            duration_seconds=0.0,
            stdout="noop (reviewer-only pass: scene file already on disk, not rewritten)",
            stderr="",
            error=None,
        )


def main() -> int:
    # Mechanical grep-gate (directive step 3) BEFORE dispatching reviewers.
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from grep_gate import check_scene_file
    blocked = []
    for sid in TARGETS:
        n = int(sid.split("-")[1])
        p = EPISODE / "scenes" / f"S{n:02d}.tsx"
        issues = check_scene_file(p)
        if issues:
            blocked.append((sid, issues))
    if blocked:
        print("GREP-GATE FAIL — fix these scene files before reviewer pass:")
        for sid, iss in blocked:
            print(f"- {sid}: " + "; ".join(iss))
        return 2

    evidence = REPO / "projects/faa-ground-stop-20261114/artifacts/scene_workflow_evidence_reviewer_only.json"
    session = orchestrate_episode(
        episode_dir=EPISODE,
        max_concurrency=int(os.environ.get("OM_MAX_CONCURRENCY", "4")),
        max_retries=int(os.environ.get("OM_MAX_RETRIES", "1")),
        runner=ReviewerOnlyRunner(),
        evidence_file=evidence,
        scene_ids=TARGETS,
        strict=False,
    )
    print(f"\nSession {session.session_id} overall={session.overall_status}")
    for sid, rec in session.scenes.items():
        print(f"- {sid}: {rec.status}" + (f" ({rec.error})" if rec.error else ""))
    gate = session.episode_gate_result
    print("gate:", gate.get("valid"), [r.get("code") for r in gate.get("reasons", [])][:8])
    return 0 if session.overall_status == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
