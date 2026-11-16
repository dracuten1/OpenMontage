#!/usr/bin/env python
"""cc_pipeline_stall_watcher.py — interim stall watcher for CC pipeline runs
(Wave1 P0-4, item 5).

WATCHES: the project's latest evidence pointer
``<project>/artifacts/scene_workflow_evidence.json`` (which scene_orchestrator
keeps as a relative symlink to the current per-round stamped file
``scene_workflow_evidence_<session_id>.json``; a plain regular file under
OM_EVIDENCE_PER_ROUND=0). Stall signal = the pointed-to evidence content has
gone quiet: no mtime change AND no pointer retarget for ``--stall-seconds``.

================================================================================
600s WALL-CAP DOCTRINE (MANDATORY — read before running):
Long-running children MUST be shell-detached from an agent bash call. The
ensemble agent's open tool-call wait carries a fixed ~600s silent SIGKILL
wall cap (per-call timeout parameters are IGNORED — a recorded timeout=300
still dies at 600s; diagnosed 2026-11-15). This watcher is a LONG-RUNNING
loop, so NEVER run it as a blocking agent tool call. Detach it:

    nohup python3 tools/qc/cc_pipeline_stall_watcher.py \
        --project-dir projects/<slug> \
        > <project>/artifacts/stall_watcher.log 2>&1 &

then inspect the log / process with short poll calls. Any future wiring of
this script into a pipeline or agent MUST preserve the detach doctrine.
================================================================================

STALL ACTION: on first stall detection per stall-episode the watcher emits a
``stall_detected`` record to the job-event lane (tools/qc/job_events.py —
STUB/EMIT ONLY, same sink the launcher's fail_exit hook uses) and prints a
STALL line. In loop mode it keeps polling (the stall may clear if the
evidence moves again); a NEW stall episode (quiet again after activity) may
emit again. Exit codes (also used by ``--once``):
    0 healthy / no evidence yet   2 stalled

This watcher is intentionally DUMB: it does not read scene states, does not
kill anything, does not relaunch (the launcher's own P0-4 relaunch owns
relaunch policy). It only detects silence and emits.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tools.qc.job_events import emit_job_event  # noqa: E402

EVIDENCE_BASENAME = "scene_workflow_evidence.json"

STATUS_HEALTHY = "healthy"
STATUS_STALLED = "stalled"
STATUS_NO_EVIDENCE = "no_evidence"


def resolve_evidence_target(evidence_path: Path) -> Path | None:
    """The file the latest pointer actually names (symlinks followed by
    ``os.stat``/``read_text`` semantics; explicit readlink for clarity)."""
    if evidence_path.is_symlink():
        target = Path(os.readlink(evidence_path))
        if not target.is_absolute():
            target = evidence_path.parent / target
        return target
    return evidence_path


def evidence_status(evidence_path: Path, stall_seconds: float,
                    now: float | None = None) -> dict:
    """One stall check. Returns
    ``{"status", "seconds_quiet", "target", "summary", "overall_status"}``.

    - pointer missing entirely -> ``no_evidence`` (exit 0 semantics: the
      pipeline has not written anything yet; silence without a file is not a
      stall signal — the watcher cannot know the run started).
    - pointer present: quiet time = ``now - mtime`` of the pointed-to file
      (a per-scene atomic re-write and a symlink retarget both move this
      mtime). quiet > stall_seconds -> ``stalled``.
    """
    now = time.time() if now is None else now
    if not evidence_path.exists() and not evidence_path.is_symlink():
        return {"status": STATUS_NO_EVIDENCE, "seconds_quiet": None,
                "target": None, "summary": "no evidence pointer on disk yet",
                "overall_status": None}
    target = resolve_evidence_target(evidence_path)
    try:
        mtime = target.stat().st_mtime
    except OSError as e:
        return {"status": STATUS_NO_EVIDENCE, "seconds_quiet": None,
                "target": str(target), "summary": f"pointer target unreadable: {e}",
                "overall_status": None}
    seconds_quiet = max(0.0, now - mtime)
    overall = None
    try:
        payload = json.loads(target.read_text(encoding="utf-8"))
        if isinstance(payload, dict):
            overall = payload.get("overall_status")
    except Exception:
        overall = None  # evidence content stays best-effort context only
    stalled = seconds_quiet > stall_seconds
    return {
        "status": STATUS_STALLED if stalled else STATUS_HEALTHY,
        "seconds_quiet": seconds_quiet,
        "target": str(target),
        "summary": (f"evidence quiet {seconds_quiet:.0f}s "
                    f"(stall threshold {stall_seconds:.0f}s)"
                    f"{f'; overall_status={overall}' if overall else ''}"),
        "overall_status": overall,
    }


def check_once(evidence_path: Path, stall_seconds: float, sink: Path | None = None,
               now: float | None = None) -> tuple[str, dict]:
    """Single check (+ one stall_detected stub emit on a stall). Returns
    ``(status, detail)``; exit code for ``--once`` is 0 healthy/no_evidence
    else 2 stalled."""
    detail = evidence_status(evidence_path, stall_seconds, now=now)
    if detail["status"] == STATUS_STALLED:
        emit_job_event("stall_detected", {
            "evidence_pointer": str(evidence_path),
            "evidence_target": detail["target"],
            "seconds_quiet": detail["seconds_quiet"],
            "stall_threshold_s": stall_seconds,
            "overall_status": detail["overall_status"],
            "summary": detail["summary"],
        }, sink=sink)
        print(f"STALL: {detail['summary']} — evidence={detail['target']}")
    elif detail["status"] == STATUS_NO_EVIDENCE:
        print(f"NO EVIDENCE: {detail['summary']} — pointer={evidence_path}")
    else:
        print(f"HEALTHY: {detail['summary']}")
    return detail["status"], detail


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="cc_pipeline_stall_watcher",
        description="Interim stall watcher over the CC pipeline evidence "
                    "pointer (MUST be run shell-detached — see header).")
    ap.add_argument("--project-dir", default=None,
                    help="projects/<slug> (default derivation for --evidence)")
    ap.add_argument("--evidence", default=None,
                    help="Explicit evidence pointer path "
                         "(default: <project-dir>/artifacts/"
                         f"{EVIDENCE_BASENAME})")
    ap.add_argument("--stall-seconds", type=float,
                    default=float(os.environ.get("OM_CC_STALL_SECONDS", "1800")),
                    help="Quiet threshold before STALLED (env "
                         "OM_CC_STALL_SECONDS, default 1800)")
    ap.add_argument("--poll-seconds", type=float,
                    default=float(os.environ.get("OM_CC_STALL_POLL_SECONDS", "60")),
                    help="Loop poll interval (default 60)")
    ap.add_argument("--once", action="store_true",
                    help="Single check then exit (used by the test pack; "
                         "loop mode is the operational default)")
    ap.add_argument("--emit-sink", default=None,
                    help="Override the job-event sink (default "
                         "<project-dir>/artifacts/job_events.jsonl)")
    args = ap.parse_args(argv)

    if args.evidence:
        evidence = Path(args.evidence)
        project_dir = evidence.parents[2] if len(evidence.parents) > 2 else evidence.parent
    elif args.project_dir:
        project_dir = Path(args.project_dir)
        evidence = project_dir / "artifacts" / EVIDENCE_BASENAME
    else:
        ap.error("one of --project-dir / --evidence is required")

    sink = Path(args.emit_sink) if args.emit_sink else \
        project_dir / "artifacts" / "job_events.jsonl"

    if args.once:
        status, _ = check_once(evidence, args.stall_seconds, sink=sink)
        return 2 if status == STATUS_STALLED else 0

    # Loop mode — operational default. Shell-detach ONLY (600s wall cap).
    print(f"stall watcher: evidence={evidence} stall={args.stall_seconds:.0f}s "
          f"poll={args.poll_seconds:.0f}s sink={sink}")
    was_stalled = False
    while True:
        detail = evidence_status(evidence, args.stall_seconds)
        stalled = detail["status"] == STATUS_STALLED
        if stalled and not was_stalled:
            # edge-triggered emit: one stub record per stall episode
            check_once(evidence, args.stall_seconds, sink=sink)
        elif detail["status"] == STATUS_HEALTHY and was_stalled:
            print(f"RECOVERED: {detail['summary']}")
        elif detail["status"] == STATUS_NO_EVIDENCE:
            print(f"waiting: {detail['summary']}")
        was_stalled = stalled
        time.sleep(args.poll_seconds)


if __name__ == "__main__":
    sys.exit(main())
