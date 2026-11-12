#!/usr/bin/env python
"""Launcher: orchestrate tai-chinh-3tin-20261111 with real CC writer/reviewer dispatch.

Subclasses SubprocessAgentRunner to (a) call the CC wrappers instead of the
built-in stub, (b) lift the hard-coded 120s subprocess timeout via
OM_AGENT_TIMEOUT (env, default 900). No repo modification.
Run from OM repo root: .venv/bin/python <this file>
"""
from __future__ import annotations
import os, sys
from pathlib import Path

REPO = Path("/Users/tuyennguyen/project/OpenMontage")
sys.path.insert(0, str(REPO))
from tools.qc.scene_orchestrator import (  # noqa: E402
    SubprocessAgentRunner, WriterContext, ReviewerContext, AgentRunResult,
    orchestrate_episode,
)
from datetime import datetime, timezone  # noqa: E402
import subprocess, time  # noqa: E402

HERE = Path(__file__).resolve().parent
ENV_TIMEOUT = int(os.environ.get("OM_AGENT_TIMEOUT", "900"))


class CCRunner(SubprocessAgentRunner):
    def _run(self, cmd, cwd, env_extra, timeout):
        env = os.environ.copy()
        env.update(env_extra)
        t0 = time.time()
        iso = datetime.now(timezone.utc).isoformat()
        try:
            proc = subprocess.run(cmd, cwd=str(cwd), env=env, capture_output=True,
                                  text=True, timeout=timeout)
            return AgentRunResult(
                instance_id=env_extra.get("OM_INSTANCE_ID", ""),
                token=env_extra.get("OM_TOKEN", ""),
                role=env_extra.get("OM_ROLE", ""),
                exit_code=proc.returncode, started_at=iso,
                finished_at=datetime.now(timezone.utc).isoformat(),
                duration_seconds=time.time() - t0,
                stdout=proc.stdout[-4000:], stderr=proc.stderr[-4000:],
                error=None if proc.returncode == 0 else f"exit {proc.returncode}",
            )
        except subprocess.TimeoutExpired:
            return AgentRunResult(
                instance_id=env_extra.get("OM_INSTANCE_ID", ""),
                token=env_extra.get("OM_TOKEN", ""), role=env_extra.get("OM_ROLE", ""),
                exit_code=1, started_at=iso,
                finished_at=datetime.now(timezone.utc).isoformat(),
                duration_seconds=time.time() - t0, stdout="", stderr="",
                error=f"timeout after {timeout}s",
            )

    def run_writer(self, context: WriterContext) -> AgentRunResult:
        return self._run(
            [sys.executable, str(HERE / "writer_wrapper.py")],
            cwd=context.episode_dir,
            env_extra={
                "OM_ROLE": "writer", "OM_SCENE_ID": context.scene_id,
                "OM_INSTANCE_ID": context.instance_id, "OM_TOKEN": context.token,
                "OM_EPISODE_DIR": str(context.episode_dir),
                "OM_ATTEMPT_INDEX": str(getattr(context, "attempt_number", 0)),
            },
            timeout=ENV_TIMEOUT,
        )

    def run_reviewer(self, context: ReviewerContext) -> AgentRunResult:
        return self._run(
            [sys.executable, str(HERE / "reviewer_wrapper.py")],
            cwd=context.sandbox_dir,
            env_extra={
                "OM_ROLE": "reviewer", "OM_SCENE_ID": context.scene_id,
                "OM_INSTANCE_ID": context.instance_id, "OM_TOKEN": context.token,
                "OM_SANDBOX_DIR": str(context.sandbox_dir),
                "OM_CANONICAL_DIR": str(context.canonical_dir),
            },
            timeout=ENV_TIMEOUT,
        )


def main() -> int:
    ep = REPO / "remotion-composer/src/tai-chinh-3tin-20261111"
    evidence = REPO / "projects/tai-chinh-3tin-20261111/artifacts/scene_workflow_evidence.json"
    session = orchestrate_episode(
        episode_dir=ep,
        max_concurrency=int(os.environ.get("OM_MAX_CONCURRENCY", "2")),
        max_retries=int(os.environ.get("OM_MAX_RETRIES", "1")),
        runner=CCRunner(),
        evidence_file=evidence,
        scene_ids=[s.strip() for s in os.environ.get("OM_SCENE_LIST", "").split(",") if s.strip()]
                  or [f"scene-{i}" for i in range(1, 15)],
        strict=False,
    )
    print(f"\nSession {session.session_id} overall={session.overall_status}")
    for sid, rec in session.scenes.items():
        print(f"- {sid}: {rec.status}"
              + (f" ({rec.error})" if rec.error else ""))
    gate = session.episode_gate_result
    print("gate:", gate.get("valid"), [r.get("code") for r in gate.get("reasons", [])][:8])
    return 0 if session.overall_status == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
