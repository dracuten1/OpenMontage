"""Wave1 P0-4 — ensemble job-event lane STUB (STUB/EMIT ONLY).

This module is the single emit point for pipeline supervision notifications
(fail_exit, owner_approval_request, stall_detected). It deliberately builds
NO real channel: records are appended as newline-delimited JSON to a sink
file (default: the project's ``artifacts/job_events.jsonl``) and returned to
the caller. The ensemble job-event transport (platform-owner lane) will
consume these records later; until then this file lane IS the stub.

Record shape (stable contract for the future transport):
    {"event_id": "jev_<12hex>", "timestamp": "<utc iso>",
     "event_type": "<str>", "payload": {...}}

Emission is best-effort by design: callers (run_cc_pipeline.py.tmpl
supervision, cc_pipeline_stall_watcher.py) treat emit failures as non-fatal
so a broken notification lane can never mask the pipeline's own status.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

EVENT_ID_PREFIX = "jev"


def emit_job_event(event_type: str, payload: dict | None = None,
                   sink: Path | str | None = None) -> dict:
    """Append one job-event record to the sink lane and return it.

    - ``sink`` None -> record is built and returned, nothing written.
    - ``sink`` given -> parent dirs are created; the record is appended as
      one JSON line (crash-safe enough for a stub: a torn final line is
      detectable by the future transport via JSON parse failure per line).
    """
    record = {
        "event_id": f"{EVENT_ID_PREFIX}_{uuid.uuid4().hex[:12]}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": str(event_type),
        "payload": dict(payload or {}),
    }
    if sink is not None:
        sink_path = Path(sink)
        sink_path.parent.mkdir(parents=True, exist_ok=True)
        with open(sink_path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
    return record


def read_job_events(sink: Path | str) -> list[dict]:
    """Read all parseable records back from a sink lane (diagnostics/tests).
    Unparseable (torn) lines are skipped, not raised."""
    sink_path = Path(sink)
    if not sink_path.is_file():
        return []
    records: list[dict] = []
    with open(sink_path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except Exception:
                continue
            if isinstance(rec, dict):
                records.append(rec)
    return records
