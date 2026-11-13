#!/usr/bin/env python
"""Launcher: orchestrate canary-phase4 with real CC writer/reviewer dispatch —
MINTED from tools/qc/cc_wrapper_templates (phase 4A.2).

Do not hand-edit: re-mint via ``python -m tools.qc.mint_project_pipeline``.
Subclasses SubprocessAgentRunner to (a) call the CC wrappers instead of the
built-in stub, (b) lift the hard-coded 120s subprocess timeout via
OM_AGENT_TIMEOUT (env, default 900). No repo modification.
Run from OM repo root: .venv/bin/python <this file>

Phase 4A.2 contract:
- startup asserts the phase-2 ConcurrencyGovernor is importable — a stale OM
  checkout fails LOUD instead of silently degrading to unconcurrency.
- max_concurrency passes through as None when OM_MAX_CONCURRENCY is unset
  (orchestrate_episode resolves via the credential tier probe). NO hardcoded
  ceiling anywhere in this file.
- OM_EPISODE_DIR_OVERRIDE (optional): run against a different episode dir
  (canary / synthetic-episode verification); default is this project's
  remotion-composer episode.
Re-scope note (4C.1, review round 2): per-scene task/packet generation stays
in per-project mint_director_inputs.py GENERATED artifacts — no shared 4th
template in 4C scope; this carrier ships wrappers + scene-id selection only.
"""
from __future__ import annotations
import os, sys
from pathlib import Path

# Task 2.4 shim pattern: resolve the repo root statically so the launcher
# dispatches through THIS checkout's tools.qc (worktrees included).
REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO))

# Phase 4A.2: fail-loud governor import assert — never run against a stale OM
# checkout where the phase-2 concurrency governor is missing.
try:
    from tools.qc.concurrency_governor import ConcurrencyGovernor, parse_env_max_concurrency  # noqa: E402,F401
except Exception as _governor_import_error:  # pragma: no cover - stale checkout
    raise ImportError(
        "FATAL: cannot import tools.qc.concurrency_governor from this OM checkout "
        f"({_governor_import_error}). The phase-2 ConcurrencyGovernor is REQUIRED "
        "by this pipeline; re-mint from a current OM checkout instead of running stale."
    ) from _governor_import_error

from tools.qc.scene_orchestrator import (  # noqa: E402
    SubprocessAgentRunner, WriterContext, ReviewerContext, AgentRunResult,
    orchestrate_episode,
)
from datetime import datetime, timezone  # noqa: E402
import subprocess, time  # noqa: E402

HERE = Path(__file__).resolve().parent
PROJECT_SLUG = "canary-phase4"
ENV_TIMEOUT = int(os.environ.get("OM_AGENT_TIMEOUT", "900"))


def resolve_launcher_concurrency(env=None):
    """Launcher ceiling (phase2 review fix 4 + phase 4A.2): OM_MAX_CONCURRENCY
    set -> int; unset/malformed/<1 -> None so orchestrate_episode resolves via
    the credential tier probe (Anthropic Tier 4+ -> 6, OAuth/unknown -> 4).
    NO hardcoded default ceiling — the None pass-through is the contract."""
    return parse_env_max_concurrency(env)


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


def resolve_scene_ids(ep: Path) -> list[str]:
    """OM_SCENE_LIST set -> dispatch verbatim (operator explicitly targeted
    those scenes). Unset -> the default full-episode list MINUS scenes whose
    seals are intact (4C.1 re-round preserve: approved + reviewed_hashes match
    on disk; OM_REMINT_PRESERVE=0 restores dispatch-everything). Detection is
    PINNED to this episode dir (episode_dir=ep, mirroring the orchestrator's
    call) so sibling/other-root packets can never over-subtract. Detection
    failures degrade LOUD to the full list — never silently dispatch nothing."""
    raw = os.environ.get("OM_SCENE_LIST", "")
    if raw.strip():
        return [s.strip() for s in raw.split(",") if s.strip()]
    ids = [f"scene-{i}" for i in range(1, 15 + 1)]
    try:
        from tools.qc.restore_seals import get_preserved_scenes, preserve_enabled
        if preserve_enabled():
            preserved = get_preserved_scenes(REPO / "projects/canary-phase4", episode_dir=ep)
            remaining = [s for s in ids if s not in preserved]
            if preserved and remaining:
                print(f"[launcher] re-round preserve: skipping {len(preserved)} "
                      f"preserved scene(s): {', '.join(sorted(preserved))}")
                ids = remaining
            elif preserved:
                print(f"[launcher] re-round preserve: all {len(ids)} scene(s) already "
                      "preserved; dispatching the full list anyway")
    except Exception as _preserve_err:
        print(f"[launcher] re-round preserve detection unavailable "
              f"({_preserve_err}); dispatching full default list")
    return ids


def main() -> int:
    ep = Path(os.environ.get("OM_EPISODE_DIR_OVERRIDE")
              or (REPO / "remotion-composer/src/canary-phase4"))
    evidence = REPO / "projects/canary-phase4/artifacts/scene_workflow_evidence.json"
    session = orchestrate_episode(
        episode_dir=ep,
        max_concurrency=resolve_launcher_concurrency(),
        max_retries=int(os.environ.get("OM_MAX_RETRIES", "1")),
        runner=CCRunner(),
        evidence_file=evidence,
        scene_ids=resolve_scene_ids(ep),
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
