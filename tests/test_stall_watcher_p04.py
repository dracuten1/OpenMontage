"""Wave1 P0-4 item 5 — interim stall watcher (tools/qc/cc_pipeline_stall_watcher.py).

Pins: mtime + latest-pointer stall logic (per-round symlink semantics from
scene_orchestrator's evidence persistence), the 600s wall-cap shell-detach
doctrine in the script header, exit-code contract, and the stall_detected
stub emission to the job-event lane.
"""
from __future__ import annotations

import os
import time
from pathlib import Path

import pytest

from tools.qc import cc_pipeline_stall_watcher as sw
from tools.qc.job_events import read_job_events

STALL_S = 1800.0


def _backdate(path: Path, seconds: float) -> None:
    st = path.stat()
    os.utime(path, (st.st_atime - seconds, st.st_mtime - seconds))


def _write_evidence(path: Path, overall: str = "partial") -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        '{"session_id": "sess-1", "overall_status": "%s", "scenes": {}}' % overall,
        encoding="utf-8")
    return path


def _project(tmp_path: Path) -> tuple[Path, Path]:
    project = tmp_path / "projects" / "stall-canary"
    evidence = project / "artifacts" / "scene_workflow_evidence.json"
    return project, evidence


# ------------------------------------------------------------------------------
# Doctrine: shell-detach, no blocking agent use
# ------------------------------------------------------------------------------

def test_header_carries_600s_wall_cap_detach_doctrine():
    doc = sw.__doc__ or ""
    assert "600s WALL-CAP DOCTRINE" in doc
    assert "nohup" in doc
    assert "shell-detached" in doc.lower() or "shell-detach" in doc.lower()
    assert "SIGKILL" in doc  # names the failure mode the doctrine avoids


# ------------------------------------------------------------------------------
# mtime + latest-pointer logic
# ------------------------------------------------------------------------------

def test_missing_evidence_is_no_evidence_not_stall(tmp_path):
    _, evidence = _project(tmp_path)
    status, detail = sw.check_once(evidence, STALL_S, sink=None)
    assert status == sw.STATUS_NO_EVIDENCE
    assert detail["seconds_quiet"] is None


def test_fresh_evidence_is_healthy(tmp_path):
    _, evidence = _project(tmp_path)
    _write_evidence(evidence)
    status, detail = sw.check_once(evidence, STALL_S, sink=None,
                                   now=time.time() + 60)
    assert status == sw.STATUS_HEALTHY
    assert detail["seconds_quiet"] <= 60 + 1


def test_quiet_evidence_is_stalled_and_emits_stub(tmp_path):
    project, evidence = _project(tmp_path)
    _write_evidence(evidence, overall="running")
    _backdate(evidence, STALL_S + 300)
    sink = project / "artifacts" / "job_events.jsonl"
    now = time.time() + 10
    status, detail = sw.check_once(evidence, STALL_S, sink=sink, now=now)
    assert status == sw.STATUS_STALLED
    assert detail["seconds_quiet"] > STALL_S
    assert detail["overall_status"] == "running"
    records = read_job_events(sink)
    assert [r["event_type"] for r in records] == ["stall_detected"]
    assert records[0]["payload"]["evidence_pointer"].endswith(
        "artifacts/scene_workflow_evidence.json")
    assert records[0]["payload"]["seconds_quiet"] > STALL_S


def test_latest_pointer_symlink_target_moves_mtime(tmp_path):
    """Per-round evidence: the pointer is a symlink to the stamped file; the
    stamped file's mtime (not the pointer dir) is the freshness signal. A
    retarget to a fresh stamped file clears the stall."""
    project, evidence = _project(tmp_path)
    evidence.parent.mkdir(parents=True, exist_ok=True)
    stamped_old = evidence.parent / "scene_workflow_evidence_sess-1.json"
    stamped_new = evidence.parent / "scene_workflow_evidence_sess-2.json"
    stamped_old.write_text('{"session_id": "sess-1", "overall_status": "partial"}', encoding="utf-8")
    stamped_new.write_text('{"session_id": "sess-2", "overall_status": "partial"}', encoding="utf-8")
    evidence.symlink_to(stamped_old.name)
    now = time.time() + 10
    _backdate(stamped_old, STALL_S + 600)
    status, detail = sw.check_once(evidence, STALL_S, sink=None, now=now)
    assert status == sw.STATUS_STALLED
    assert detail["target"].endswith("_sess-1.json")
    # retarget: latest pointer now names the fresh stamped round
    evidence.unlink()
    evidence.symlink_to(stamped_new.name)
    status2, detail2 = sw.check_once(evidence, STALL_S, sink=None, now=now)
    assert status2 == sw.STATUS_HEALTHY
    assert detail2["target"].endswith("_sess-2.json")
    assert detail2["seconds_quiet"] <= 10 + 1


def test_once_exit_codes(tmp_path, capsys):
    project, evidence = _project(tmp_path)
    # healthy -> 0
    _write_evidence(evidence)
    assert sw.main(["--evidence", str(evidence), "--stall-seconds", str(STALL_S),
                    "--once", "--emit-sink", str(project / "artifacts" / "job_events.jsonl")]) == 0
    # stalled -> 2
    _backdate(evidence, STALL_S + 60)
    assert sw.main(["--evidence", str(evidence), "--stall-seconds", str(STALL_S),
                    "--once", "--emit-sink", str(project / "artifacts" / "job_events.jsonl")]) == 2
    out = capsys.readouterr().out
    assert "HEALTHY:" in out and "STALL:" in out


# ------------------------------------------------------------------------------
# Security review finding 4: planted-symlink read-out containment
# ------------------------------------------------------------------------------

def test_symlink_target_outside_artifacts_is_refused(tmp_path):
    """A planted pointer aiming OUTSIDE the artifacts dir must never be
    stat/read by the watcher: resolve_evidence_target refuses (None) and
    evidence_status reports a loud no_evidence, not a healthy/stalled read."""
    project, evidence = _project(tmp_path)
    outside = tmp_path / "elsewhere" / "secret_evidence.json"
    outside.parent.mkdir(parents=True, exist_ok=True)
    outside.write_text('{"overall_status": "partial"}', encoding="utf-8")
    evidence.parent.mkdir(parents=True, exist_ok=True)
    evidence.symlink_to(outside)  # absolute escape
    assert sw.resolve_evidence_target(evidence) is None
    detail = sw.evidence_status(evidence, STALL_S, now=time.time())
    assert detail["status"] == sw.STATUS_NO_EVIDENCE
    assert detail["target"] is None
    assert "REFUSED" in detail["summary"]


def test_symlink_relative_escape_is_refused(tmp_path):
    """The ../../ relative-spelling escape gets the same refusal."""
    project, evidence = _project(tmp_path)
    evidence.parent.mkdir(parents=True, exist_ok=True)
    evidence.symlink_to("../../planted.json")
    assert sw.resolve_evidence_target(evidence) is None
    detail = sw.evidence_status(evidence, STALL_S, now=time.time())
    assert detail["status"] == sw.STATUS_NO_EVIDENCE
    assert "REFUSED" in detail["summary"]


def test_symlink_sibling_inside_artifacts_still_allowed(tmp_path):
    """Containment must not break the per-round contract: a stamped sibling
    INSIDE artifacts/ resolves and mtime logic works as before."""
    project, evidence = _project(tmp_path)
    evidence.parent.mkdir(parents=True, exist_ok=True)
    stamped = evidence.parent / "scene_workflow_evidence_sess-9.json"
    stamped.write_text('{"overall_status": "partial"}', encoding="utf-8")
    evidence.symlink_to(stamped.name)
    resolved = sw.resolve_evidence_target(evidence)
    assert resolved is not None and resolved.name == stamped.name
    status, _ = sw.check_once(evidence, STALL_S, sink=None, now=time.time() + 5)
    assert status == sw.STATUS_HEALTHY


# ------------------------------------------------------------------------------
# Security review finding 5: emit is best-effort — watcher never dies on sink
# ------------------------------------------------------------------------------

def test_stall_emit_failure_does_not_kill_watcher(tmp_path, monkeypatch, capsys):
    """A broken job-event sink (OSError etc.) must not crash check_once: the
    STALL print still fires and the STALLED status still returns."""
    project, evidence = _project(tmp_path)
    _write_evidence(evidence, overall="running")
    _backdate(evidence, STALL_S + 300)

    def boom(event_type, payload, sink=None):
        raise OSError("sink unwritable")

    monkeypatch.setattr(sw, "emit_job_event", boom)
    status, detail = sw.check_once(evidence, STALL_S, sink=tmp_path / "nope" / "lane.jsonl",
                                   now=time.time() + 10)
    assert status == sw.STATUS_STALLED
    assert detail["seconds_quiet"] > STALL_S
    out = capsys.readouterr().out
    assert "STALL:" in out                      # the signal survives the sink
    assert "emit FAILED" in out                 # the failure is loud, not silent


def test_default_stall_seconds_env_conservative():
    """Default quiet threshold reads OM_CC_STALL_SECONDS, default 1800s —
    pinned conservative (a stall is declared only after 30 quiet minutes)."""
    src = Path(sw.__file__).read_text(encoding="utf-8")
    assert 'os.environ.get("OM_CC_STALL_SECONDS", "1800")' in src
