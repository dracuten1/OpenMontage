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
- Wave1 P0-4 (2026-11-16): bounded fail-exit supervision — a non-zero pass
  relaunches at most OM_RELAUNCH_MAX_ATTEMPTS total attempts (default 2)
  with doubling backoff (OM_RELAUNCH_BACKOFF_S, default 30; every backoff
  wait — base included — is capped at RELAUNCH_BACKOFF_MAX_S = 3600s so a
  huge-finite or heavily-doubled value can never overflow time.sleep); on
  final failure the fail_exit + owner_approval_request notification stubs
  emit to the job-event lane (tools/qc/job_events.py — STUB/EMIT ONLY, no
  real channel; platform lane wires transport later). Truthful-proc print
  (item 7, backported from faa deployed copy at OM 53449df): every agent
  dispatch logs role/scene/exit/duration/byte-counts.
Re-scope note (4C.1, review round 2): per-scene task/packet generation stays
in per-project mint_director_inputs.py GENERATED artifacts — no shared 4th
template in 4C scope; this carrier ships wrappers + scene-id selection only.
"""
from __future__ import annotations
import math, os, sys
import json
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
        # Child wrappers are trusted host code, but still pass only their
        # documented per-role OM contract plus essentials. Keep OM_TOKEN and
        # OM_INSTANCE_ID in env_extra for wrapper-side AgentRunResult metadata;
        # the wrappers' own allowlists exclude them before Claude/tsc exec.
        env = {k: v for k, v in os.environ.items()
               if k in ("PATH", "HOME", "USER", "SHELL", "TMPDIR")}
        env.update(env_extra)
        t0 = time.time()
        iso = datetime.now(timezone.utc).isoformat()
        try:
            proc = subprocess.run(cmd, cwd=str(cwd), env=env, capture_output=True,
                                  text=True, timeout=timeout)
            # Truthful-proc print (Wave1 item 7, backported from the faa
            # deployed copy carried pre-re-mint at OM 53449df): every agent
            # dispatch prints its own exit/duration/byte counts so a crashed
            # child can never silently vanish from the launcher log.
            print(f"[agent] {env_extra.get('OM_ROLE')} {env_extra.get('OM_SCENE_ID')} "
                  f"exit={proc.returncode} dur={time.time()-t0:.0f}s "
                  f"out={len(proc.stdout or '')}B err={(proc.stderr or '')[:120]!r}", flush=True)
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
    return run_pipeline_supervised()


# --- Wave1 P0-4: bounded fail-exit relaunch + notification stub hooks --------
# Supervision contract (CONSERVATIVE by design — infra-vs-content failure
# gating comes LATER and is deliberately NOT built here): when a full
# pipeline pass exits non-zero, the launcher relaunches the whole pass,
# capped at OM_RELAUNCH_MAX_ATTEMPTS TOTAL attempts (default 2 = the initial
# pass + at most ONE relaunch; hard-clamped to RELAUNCH_HARD_CAP = 3 so an
# env override can NEVER exceed three total attempts; non-integer env values
# warn + fall back to the default instead of crashing at import), sleeping
# OM_RELAUNCH_BACKOFF_S * 2**(k-1) seconds before relaunch k (doubling
# backoff; every wait is clamped to RELAUNCH_BACKOFF_MAX_S = 3600s — a
# huge-finite env value or a doubled overflow never reaches time.sleep).
# Once the cap is spent, the notification hook fires on the
# job-event lane (STUB/EMIT ONLY — see tools/qc/job_events.py; the platform
# lane wires real channels later) for BOTH fail_exit and
# owner_approval_request, and the launcher exits non-zero.
RELAUNCH_HARD_CAP = 3
# Numeric hardening: cap for the backoff base AND every computed wait. A
# huge-finite OM_RELAUNCH_BACKOFF_S (e.g. 1e308) or the doubling of a large
# base must never reach time.sleep — sleep(inf) raises OverflowError and
# kills the supervision loop mid-relaunch. 3600s = "wait at most an hour
# before retrying", well above the 30s default and far below any sleep
# overflow (doubling is additionally bounded in relaunch_backoff_s).
RELAUNCH_BACKOFF_MAX_S = 3600.0


def _parse_relaunch_max_attempts(raw: str | None) -> int:
    default = 2
    if raw is None:
        return default
    try:
        val = int(raw)
    except (TypeError, ValueError):
        print(f"[supervision] WARN: invalid OM_RELAUNCH_MAX_ATTEMPTS={raw!r}; using default {default}")
        return default
    return min(RELAUNCH_HARD_CAP, max(1, val))


def _parse_relaunch_backoff_base_s(raw: str | None) -> float:
    default = 30.0
    if raw is None:
        return default
    try:
        val = float(raw)
    except (TypeError, ValueError):
        print(f"[supervision] WARN: invalid OM_RELAUNCH_BACKOFF_S={raw!r}; using default {default}")
        return default
    if not math.isfinite(val):
        # Wave1 security cycle-1 hygiene: "inf"/"-inf"/"nan" parse as floats
        # but poison the supervision loop — time.sleep(inf) raises
        # OverflowError and a nan base silently corrupts the doubling backoff
        # (every wait becomes nan). Fall back to the default instead.
        print(f"[supervision] WARN: non-finite OM_RELAUNCH_BACKOFF_S={raw!r}; using default {default}")
        return default
    if val > RELAUNCH_BACKOFF_MAX_S:
        # Huge-finite (e.g. 1e308) parses cleanly but the base and its
        # doublings would overflow the sleep call — clamp, never crash.
        print(f"[supervision] WARN: OM_RELAUNCH_BACKOFF_S={raw!r} exceeds cap "
              f"{RELAUNCH_BACKOFF_MAX_S:g}s; clamped to {RELAUNCH_BACKOFF_MAX_S:g}s")
        return RELAUNCH_BACKOFF_MAX_S
    return max(0.0, val)


RELAUNCH_MAX_ATTEMPTS = _parse_relaunch_max_attempts(os.environ.get("OM_RELAUNCH_MAX_ATTEMPTS"))
RELAUNCH_BACKOFF_BASE_S = _parse_relaunch_backoff_base_s(os.environ.get("OM_RELAUNCH_BACKOFF_S"))


def relaunch_backoff_s(base_s: float, relaunch_index: int) -> float:
    """Doubling backoff before relaunch ``relaunch_index`` (1-based):
    base, 2*base, 4*base, ... Relaunch 1 of a cap-2 run waits ``base_s``.

    Numeric hardening: the result is always a finite wait <=
    RELAUNCH_BACKOFF_MAX_S — a huge-finite base or an oversized exponent
    must overflow neither the float nor the subsequent time.sleep (both
    would abort the supervision loop instead of retrying). The exponent is
    bounded so ``base_s * 2**k`` can never reach inf; a non-finite or
    non-positive ``base_s`` degenerates safely (0.0 = no wait; the
    RELAUNCH_MAX_ATTEMPTS cap still bounds total relaunches)."""
    if relaunch_index < 1:
        return 0.0
    base = float(base_s) if base_s and math.isfinite(base_s) else 0.0
    if base <= 0.0:
        return 0.0
    exponent = min(relaunch_index - 1, 16)   # 2**16 * base already dwarfs the cap
    wait = base * float(2 ** exponent)       # finite: base finite, exponent bounded
    return min(wait, RELAUNCH_BACKOFF_MAX_S)


def emit_pipeline_event(event_type: str, detail: dict) -> None:
    """Wave1 P0-4 notification hook point — STUB/EMIT ONLY. Appends a JSONL
    record to the project artifacts job-event lane via tools.qc.job_events
    and prints a stdout line. NO real transport is built here; never raises
    into the supervision path (a broken notification lane must not mask the
    pipeline's own exit code)."""
    try:
        from tools.qc.job_events import emit_job_event
        record = emit_job_event(
            event_type, detail,
            sink=REPO / "projects/canary-phase4/artifacts/job_events.jsonl",
        )
        print(f"[job-event] {event_type} emitted: {record.get('event_id')}")
    except Exception as _emit_err:
        print(f"[job-event] emit FAILED for {event_type} (supervision continues): {_emit_err}")


def _evidence_scene_context(evidence: Path) -> str:
    """Wave1 W2 (security fix cycle): best-effort one-line scene-status
    context from the latest evidence file, for the run_pipeline_once
    exception summary. Never raises — missing/corrupt/unrecognized evidence
    yields an empty string (diagnostic context must never mask the failure)."""
    try:
        data = json.loads(evidence.read_text(encoding="utf-8"))
        scenes = data.get("scenes") if isinstance(data, dict) else None
        if not isinstance(scenes, dict) or not scenes:
            return ""
        parts = []
        for sid, rec in sorted(scenes.items()):
            status = rec.get("status", "?") if isinstance(rec, dict) else "?"
            parts.append(f"{sid}:{status}")
        return "scenes=" + ",".join(parts)
    except Exception:
        return ""


def run_pipeline_once() -> tuple[int, str]:
    """One full orchestrate_episode pass + its report block.
    Returns ``(exit_code, one-line summary)``.

    Wave1 W2 (security fix cycle): the body is exception-wrapped — a raise
    inside orchestrate_episode (or the report block) is converted to a
    failed pass ``(1, summary)`` with a printed failure summary (exception
    type + message + best-effort scene context) instead of crashing the
    launcher with NO fail_exit/owner_approval_request emit. The supervision
    loop's bounded-relaunch semantics (default 2 attempts, RELAUNCH_HARD_CAP
    clamp, doubling backoff) and the post-loop emit path are unchanged: an
    exception pass is just a failed pass."""
    ep = Path(os.environ.get("OM_EPISODE_DIR_OVERRIDE")
              or (REPO / "remotion-composer/src/canary-phase4"))
    evidence = REPO / "projects/canary-phase4/artifacts/scene_workflow_evidence.json"
    try:
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
        return (0 if session.overall_status == "pass" else 1), \
            f"Session {session.session_id} overall={session.overall_status}"
    except Exception as exc:
        summary = f"run_pipeline_once raised {type(exc).__name__}: {exc}"
        scene_ctx = _evidence_scene_context(evidence)
        print(f"[launcher] run_pipeline_once FAILED (exception): {summary}; "
              f"episode_dir={ep}" + (f"; {scene_ctx}" if scene_ctx else ""))
        return 1, summary


def run_pipeline_supervised() -> int:
    """P0-4 fail-exit supervision: bounded relaunch loop around
    ``run_pipeline_once`` (cap 2 total attempts, doubling backoff), then the
    fail_exit + owner_approval_request notification stubs on final failure."""
    attempt = 0
    exit_code = 1
    summary = ""
    while True:
        attempt += 1
        exit_code, summary = run_pipeline_once()
        if exit_code == 0:
            return 0
        if attempt >= RELAUNCH_MAX_ATTEMPTS:
            break
        wait_s = relaunch_backoff_s(RELAUNCH_BACKOFF_BASE_S, attempt)
        print(f"[relaunch] pass {attempt}/{RELAUNCH_MAX_ATTEMPTS} failed (exit {exit_code}); "
              f"relaunch {attempt + 1} in {wait_s:.0f}s "
              f"(cap {RELAUNCH_MAX_ATTEMPTS} total attempts, doubling backoff)")
        time.sleep(wait_s)
    detail = {
        "reason": "pipeline_fail_exit",
        "attempts_used": attempt,
        "attempts_cap": RELAUNCH_MAX_ATTEMPTS,
        "exit_code": exit_code,
        "summary": summary,
    }
    emit_pipeline_event("fail_exit", detail)
    emit_pipeline_event("owner_approval_request", {
        **detail,
        "request": "owner decision required: inspect infra vs content failure "
                   "before any further relaunch (supervision cap spent)",
        "requires_owner": True,
    })
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
