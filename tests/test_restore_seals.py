"""Phase 4C tests — non-destructive re-mint, seal restore, evidence retention.

Covers (plan 4C.1):
- ``tools/qc/restore_seals.py`` CLI: --dry-run reports the sealable set and
  exits 0; missing evidence exits non-zero listing the missing scenes;
  restore re-seals clobbered ``packet_{scene_id}.json`` from prior-round
  evidence + current file hashes; --force re-seals already-preserved packets.
- ``is_scene_preserved`` / ``get_preserved_scenes``: approved + hash-matched
  scenes detected; modified files detected; ``OM_REMINT_PRESERVE=0`` disables.
- ``mint_project_pipeline.py`` preserve mode: ``history/cc_findings/
  {scene_id}_latest.md`` of preserved scenes survives the mint purge;
  ``--force`` / ``OM_REMINT_PRESERVE=0`` purge everything.
- ``scene_orchestrator.py`` per-round evidence retention: stamped
  ``scene_workflow_evidence_<session_id>.json`` per round + unsuffixed
  ``scene_workflow_evidence.json`` as the latest symlink;
  ``OM_EVIDENCE_PER_ROUND=0`` disables suffixing; consecutive rounds retain
  every prior suffixed file and carry forward scenes not targeted this round.
"""

from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

import pytest

import tools.qc.scene_orchestrator as som
from tools.qc.mint_project_pipeline import (
    MANIFEST_NAME,
    PRESERVE_ENV,
    main as mint_main,
    purge_findings,
)
from tools.qc.restore_seals import (
    PRESERVE_ENV as RS_PRESERVE_ENV,
    get_preserved_scenes,
    infer_packet_episode_dir,
    is_scene_preserved,
    main as restore_main,
    scene_seal_payload,
)
from tools.qc.scene_orchestrator import CallableAgentRunner, orchestrate_episode
from tests.test_scene_orchestrator import make_test_episode
from tests.test_episode_gate import packet as make_packet

SCENE_IDS = ["scene-1", "scene-2"]


# ==============================================================================
# Helpers
# ==============================================================================

@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    """Isolate the 4C gates from the developer environment."""
    monkeypatch.delenv("OM_EVIDENCE_PER_ROUND", raising=False)
    monkeypatch.delenv("OM_REMINT_PRESERVE", raising=False)
    monkeypatch.delenv("OM_WRAPPER_TEMPLATE_STRICT", raising=False)


def _clobber_packet(pkt_path: Path) -> None:
    """Simulate a destructive re-mint: the packet survives but its seal
    metadata (writer/reviewer blocks, integration status) is wiped."""
    p = json.loads(pkt_path.read_text(encoding="utf-8"))
    p["writer"] = {"instance_id": "", "timestamp": "", "token": ""}
    p["writer_token"] = ""
    p["reviewer"] = {
        "instance_id": "", "timestamp": "", "verdict": "pending",
        "findings_ref": "", "findings_hash": "", "token": "", "reviewed_hashes": {},
    }
    p["reviewer_token"] = ""
    p["integration_status"] = "pending"
    pkt_path.write_text(json.dumps(p, indent=2), encoding="utf-8")


def _write_findings_file(ep: Path, sid: str) -> None:
    """Canonical findings file carrying the approved verdict + reviewed_hashes
    (the reviewer wrapper writes both in production)."""
    pkt = json.loads((ep / f"packet_{sid}.json").read_text(encoding="utf-8"))
    fdir = ep / "packets"
    fdir.mkdir(parents=True, exist_ok=True)
    payload = {
        "scene_id": sid,
        "verdict": "approved",
        "reviewed_hashes": pkt["reviewer"]["reviewed_hashes"],
        "issues": [],
    }
    (fdir / f"{sid}_findings.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _seal_entry(sid: str, pkt_path: Path, writer_token: str, reviewer_token: str) -> dict:
    """A successful attempt record shaped exactly like the orchestrator's
    evidence (see the real tai-chinh evidence file)."""
    return {
        "scene_id": sid,
        "status": "success",
        "attempts": [{
            "attempt_number": 1,
            "writer_result": {
                "instance_id": f"writer_{sid}_aaa111", "token": writer_token,
                "role": "writer", "exit_code": 0,
                "started_at": "2026-11-13T00:00:00+00:00",
                "finished_at": "2026-11-13T00:01:00+00:00",
                "duration_seconds": 60.0, "stdout": "ok", "stderr": "",
                "outputs": {}, "error": None,
            },
            "reviewer_result": {
                "instance_id": f"reviewer_{sid}_bbb222", "token": reviewer_token,
                "role": "reviewer", "exit_code": 0,
                "started_at": "2026-11-13T00:01:00+00:00",
                "finished_at": "2026-11-13T00:02:00+00:00",
                "duration_seconds": 60.0,
                "stdout": f"reviewer {sid}: cc_exit=0 verdict=approved",
                "stderr": "", "outputs": {}, "error": None,
            },
            "ownership": {
                "writer_scope_valid": True, "writer_modified_files": [],
                "reviewer_canonical_mutation": False, "reviewer_mutated_files": [],
                "error_message": None,
            },
            "packet_valid": True, "packet_reasons": [],
            "packet_path": str(pkt_path), "packet_hash": "0" * 64,
            "success": True, "error": None,
        }],
        "final_packet_path": str(pkt_path), "final_packet_hash": "0" * 64,
        "error": None,
    }


def build_restore_fixture(
    tmp_path: Path,
    scene_ids: list[str] | None = None,
    clobber: tuple[str, ...] = (),
    evidence_scene_ids: list[str] | None = None,
) -> tuple[Path, Path]:
    """Episode with sealed packets + canonical findings files + session
    evidence JSON. ``clobber`` simulates a destructive re-mint on those
    scenes' packets; ``evidence_scene_ids`` limits which scene records the
    evidence carries (to exercise the missing-evidence path)."""
    scene_ids = scene_ids or SCENE_IDS
    ep = make_test_episode(tmp_path, scene_ids=list(scene_ids))
    records: dict[str, dict] = {}
    for sid in scene_ids:
        pkt_path = ep / f"packet_{sid}.json"
        _write_findings_file(ep, sid)
        want = evidence_scene_ids or scene_ids
        if sid in want:
            records[sid] = _seal_entry(sid, pkt_path, f"wt_{sid}_wtok", f"rt_{sid}_rtok")
    for sid in clobber:
        _clobber_packet(ep / f"packet_{sid}.json")
    evidence = {
        "session_id": "session-20261113T000000Z-cafe0001",
        "episode_dir": str(ep),
        "scenes": records,
        "overall_status": "pass",
    }
    ev_file = tmp_path / "artifacts" / "scene_workflow_evidence.json"
    ev_file.parent.mkdir(parents=True, exist_ok=True)
    ev_file.write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    return ep, ev_file


def build_mint_layout(tmp_path: Path, scene_ids: list[str] | None = None):
    """Real layout: <tmp>/remotion-composer/src/<slug> episode + <tmp>/projects/<slug>."""
    scene_ids = scene_ids or SCENE_IDS
    ep = make_test_episode(tmp_path, scene_ids=list(scene_ids))
    src_root = tmp_path / "remotion-composer" / "src"
    src_root.mkdir(parents=True)
    moved = src_root / ep.name
    shutil.move(str(ep), str(moved))
    project = tmp_path / "projects" / ep.name
    project.mkdir(parents=True)
    return moved, project


# ==============================================================================
# restore_seals CLI
# ==============================================================================

def test_dry_run_reports_sealable_set_and_exits_zero(tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path, clobber=("scene-2",))
    rc = restore_main([
        "--from-evidence", str(ev_file),
        "--episode-dir", str(ep),
        "--dry-run",
    ])
    assert rc == 0
    out = capsys.readouterr().out
    assert "sealable (2): scene-1, scene-2" in out
    assert "already preserved (1): scene-1" in out
    assert "dry-run: no packets written" in out
    # dry-run is non-destructive: the clobbered packet stays clobbered
    pkt = json.loads((ep / "packet_scene-2.json").read_text(encoding="utf-8"))
    assert pkt["integration_status"] == "pending"


def test_missing_evidence_exits_nonzero_listing_scenes(tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path, evidence_scene_ids=["scene-1"])
    rc = restore_main([
        "--from-evidence", str(ev_file),
        "--episode-dir", str(ep),
        "--scenes", "scene-1,scene-9",
    ])
    assert rc == 1
    out = capsys.readouterr().out
    assert "ERROR: Missing evidence for scenes: scene-9" in out
    # and with default targets (all evidence scenes): the recorded-but-failed
    # scene is missing too
    rc = restore_main(["--from-evidence", str(ev_file), "--episode-dir", str(ep),
                       "--scenes", "scene-2,scene-8"])
    assert rc == 1
    out = capsys.readouterr().out
    assert "ERROR: Missing evidence for scenes: scene-2, scene-8" in out


def test_dry_run_with_missing_evidence_exits_nonzero(tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path, evidence_scene_ids=["scene-1"])
    rc = restore_main([
        "--from-evidence", str(ev_file),
        "--episode-dir", str(ep),
        "--scenes", "scene-1,scene-9",
        "--dry-run",
    ])
    assert rc == 1
    assert "ERROR: Missing evidence for scenes: scene-9" in capsys.readouterr().out


def test_restore_reseals_clobbered_packets_from_evidence(tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path, clobber=("scene-1", "scene-2"))
    rc = restore_main(["--from-evidence", str(ev_file), "--episode-dir", str(ep)])
    assert rc == 0
    out = capsys.readouterr().out
    assert "re-sealed scene-1" in out and "re-sealed scene-2" in out
    findings = json.loads((ep / "packets" / "scene-1_findings.json").read_text(encoding="utf-8"))
    for sid in SCENE_IDS:
        pkt = json.loads((ep / f"packet_{sid}.json").read_text(encoding="utf-8"))
        assert pkt["integration_status"] == "integrated"
        assert pkt["reviewer"]["verdict"] == "approved"
        assert pkt["reviewer"]["token"] == f"rt_{sid}_rtok"  # from evidence, not the clobbered stub
        assert pkt["writer"]["token"] == f"wt_{sid}_wtok"
        assert pkt["reviewer"]["reviewed_hashes"] == findings["reviewed_hashes"]
        # every reviewed hash matches the CURRENT on-disk file (gate-grade)
        from lib.production_provenance import hash_file
        for rel, expected in pkt["reviewer"]["reviewed_hashes"].items():
            assert hash_file(ep / rel) == expected


def test_restore_skips_already_preserved_without_force(tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path, clobber=("scene-2",))
    before = (ep / "packet_scene-1.json").read_text(encoding="utf-8")
    rc = restore_main(["--from-evidence", str(ev_file), "--episode-dir", str(ep)])
    assert rc == 0
    out = capsys.readouterr().out
    assert "skipped scene-1: packet already preserved" in out
    assert (ep / "packet_scene-1.json").read_text(encoding="utf-8") == before  # byte-identical
    assert "re-sealed scene-2" in out


def test_force_reseals_already_preserved_packet(tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path)
    rc = restore_main(["--from-evidence", str(ev_file), "--episode-dir", str(ep), "--force"])
    assert rc == 0
    out = capsys.readouterr().out
    assert "re-sealed scene-1" in out and "re-sealed scene-2" in out
    pkt = json.loads((ep / "packet_scene-1.json").read_text(encoding="utf-8"))
    assert pkt["integration_status"] == "integrated"
    assert pkt["writer"]["token"] == "wt_scene-1_wtok"  # re-stamped from evidence


def test_restore_refuses_hash_drifted_scene(tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path, clobber=("scene-1",))
    # scene-1's file drifted after review — re-sealing would bind a stale hash
    (ep / "scene" / "audio.wav").write_text("drifted content", encoding="utf-8")
    rc = restore_main(["--from-evidence", str(ev_file), "--episode-dir", str(ep)])
    assert rc == 3  # W8: refusals in a non-dry-run restore exit non-zero
    out = capsys.readouterr().out
    assert "hash drift" in out and "REFUSED scene-1" in out
    pkt = json.loads((ep / "packet_scene-1.json").read_text(encoding="utf-8"))
    assert pkt["integration_status"] == "pending"  # untouched


# ==============================================================================
# is_scene_preserved / get_preserved_scenes
# ==============================================================================

def test_is_scene_preserved_detects_approved_and_hash_match(tmp_path):
    ep, _ = build_restore_fixture(tmp_path)
    ok, why = is_scene_preserved(ep / "packet_scene-1.json", ep)
    assert ok is True
    assert "approved" in why and "match" in why


def test_is_scene_preserved_detects_modified_file(tmp_path):
    ep, _ = build_restore_fixture(tmp_path)
    (ep / "scene" / "style.json").write_text("tampered", encoding="utf-8")
    ok, why = is_scene_preserved(ep / "packet_scene-1.json", ep)
    assert ok is False
    assert "changed since review" in why


def test_is_scene_preserved_rejects_missing_packet(tmp_path):
    ep, _ = build_restore_fixture(tmp_path)
    ok, why = is_scene_preserved(ep / "packet_scene-404.json", ep)
    assert ok is False and why == "packet missing"


def test_is_scene_preserved_kill_switch(tmp_path, monkeypatch):
    ep, _ = build_restore_fixture(tmp_path)
    monkeypatch.setenv("OM_REMINT_PRESERVE", "0")
    ok, why = is_scene_preserved(ep / "packet_scene-1.json", ep)
    assert ok is False
    assert "OM_REMINT_PRESERVE=0" in why


def test_scene_seal_payload_requires_all_fields(tmp_path):
    ep, ev_file = build_restore_fixture(tmp_path)
    evidence = json.loads(ev_file.read_text(encoding="utf-8"))
    payload = scene_seal_payload(evidence, "scene-1", ep)
    assert payload is not None
    assert payload["writer_token"] == "wt_scene-1_wtok"
    assert payload["reviewer_token"] == "rt_scene-1_rtok"
    assert payload["verdict"] == "approved"
    assert payload["reviewed_hashes"]
    # a rejected (unsuccessful) attempt record is NOT usable evidence
    evidence["scenes"]["scene-1"]["attempts"][0]["success"] = False
    assert scene_seal_payload(evidence, "scene-1", ep) is None
    # a scene absent from the evidence is missing
    assert scene_seal_payload(evidence, "scene-404", ep) is None


def test_get_preserved_scenes_infers_episode_dir(tmp_path):
    ep, project = build_mint_layout(tmp_path)
    assert get_preserved_scenes(project) == {"scene-1", "scene-2"}
    _clobber_packet(ep / "packet_scene-2.json")
    assert get_preserved_scenes(project) == {"scene-1"}


def test_get_preserved_scenes_explicit_episode_dir_and_kill_switch(tmp_path, monkeypatch):
    ep, _ = build_restore_fixture(tmp_path)
    project = tmp_path / "projects" / ep.name
    project.mkdir(parents=True)
    # flat layout has no sibling episode dir — the explicit arg carries it
    assert get_preserved_scenes(project, episode_dir=ep) == {"scene-1", "scene-2"}
    monkeypatch.setenv("OM_REMINT_PRESERVE", "0")
    assert get_preserved_scenes(project, episode_dir=ep) == set()


# ==============================================================================
# mint_project_pipeline — preserve mode
# ==============================================================================

def _seed_findings(project: Path, scene_ids) -> dict[str, Path]:
    files = {}
    for sid in scene_ids:
        f = project / "history" / "cc_findings" / f"{sid}_latest.md"
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(f"REVIEWER ISSUES for {sid}", encoding="utf-8")
        files[sid] = f
    return files


def test_mint_preserve_mode_keeps_preserved_findings(tmp_path, capsys):
    ep, project = build_mint_layout(tmp_path)
    findings = _seed_findings(project, SCENE_IDS)
    seeded = {sid: f.read_text(encoding="utf-8") for sid, f in findings.items()}
    _clobber_packet(ep / "packet_scene-2.json")  # scene-2 not preserved

    assert mint_main(["--project-dir", str(project), "--scenes", "2"]) == 0
    out = capsys.readouterr().out
    assert "preserve mode: ON" in out
    assert findings["scene-1"].exists()  # preserved scene: findings MUST survive
    # AC1d: byte-identity, not just existence — the preserved file is untouched
    assert findings["scene-1"].read_text(encoding="utf-8") == seeded["scene-1"]
    assert not findings["scene-2"].exists()  # non-preserved: purged
    manifest = json.loads((project / "scripts" / "cc_pipeline" / MANIFEST_NAME).read_text(encoding="utf-8"))
    assert manifest["preserved_scenes"] == ["scene-1"]
    assert manifest["force"] is False


def test_mint_force_purges_everything(tmp_path, capsys):
    ep, project = build_mint_layout(tmp_path)
    findings = _seed_findings(project, SCENE_IDS)
    assert mint_main(["--project-dir", str(project), "--scenes", "2", "--force"]) == 0
    assert "preserve mode: OFF (--force / OM_REMINT_PRESERVE=0)" in capsys.readouterr().out
    assert not findings["scene-1"].exists()
    assert not findings["scene-2"].exists()


def test_mint_env_kill_switch_purges_everything(tmp_path, monkeypatch):
    ep, project = build_mint_layout(tmp_path)
    findings = _seed_findings(project, SCENE_IDS)
    monkeypatch.setenv("OM_REMINT_PRESERVE", "0")
    assert mint_main(["--project-dir", str(project), "--scenes", "2"]) == 0
    assert not findings["scene-1"].exists()
    assert not findings["scene-2"].exists()


def test_purge_findings_preserve_set_direct(tmp_path):
    project = tmp_path / "proj"
    findings = _seed_findings(project, ["scene-1", "scene-2"])
    purged = purge_findings(project, preserve_scenes={"scene-1"})
    assert purged == 1
    assert findings["scene-1"].exists()
    assert not findings["scene-2"].exists()


# ==============================================================================
# scene_orchestrator — per-round evidence retention
# ==============================================================================

def _run_round(episode: Path, scene_ids: list[str] | None = None):
    return orchestrate_episode(
        episode,
        max_concurrency=1,
        max_retries=0,
        runner=CallableAgentRunner(),
        scene_ids=scene_ids,
    )


def _stamped_files(episode: Path) -> list[Path]:
    art = episode / "artifacts"
    return sorted(art.glob("scene_workflow_evidence_session-*.json"))


def test_evidence_round_writes_stamped_file_and_latest_symlink(tmp_path):
    ep = make_test_episode(tmp_path, scene_ids=["cut-1"])
    session = _run_round(ep)
    latest = ep / "artifacts" / "scene_workflow_evidence.json"
    stamped = _stamped_files(ep)
    assert len(stamped) == 1
    assert stamped[0].name == f"scene_workflow_evidence_{session.session_id}.json"
    assert latest.is_symlink()  # latest pointer, not a data file
    assert os.readlink(latest) == stamped[0].name  # RELATIVE link
    data = json.loads(latest.read_text(encoding="utf-8"))
    assert data["session_id"] == session.session_id


def test_evidence_per_round_kill_switch_disables_suffixing(tmp_path, monkeypatch):
    monkeypatch.setenv("OM_EVIDENCE_PER_ROUND", "0")
    ep = make_test_episode(tmp_path, scene_ids=["cut-1"])
    session = _run_round(ep)
    latest = ep / "artifacts" / "scene_workflow_evidence.json"
    assert _stamped_files(ep) == []  # no suffixed file
    assert latest.is_file() and not latest.is_symlink()  # legacy direct write
    data = json.loads(latest.read_text(encoding="utf-8"))
    assert data["session_id"] == session.session_id


def test_consecutive_rounds_retain_both_suffixed_files_and_merge(tmp_path, monkeypatch):
    ep = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])
    latest = ep / "artifacts" / "scene_workflow_evidence.json"

    r1 = _run_round(ep)  # round 1: all scenes
    r2 = _run_round(ep, scene_ids=["cut-2"])  # round 2: subset re-run
    art = ep / "artifacts"
    f_r1 = art / f"scene_workflow_evidence_{r1.session_id}.json"
    f_r2 = art / f"scene_workflow_evidence_{r2.session_id}.json"
    assert f_r1.is_file() and f_r2.is_file()  # previous round's evidence file still exists
    # latest points at the newest round, relative
    assert os.readlink(latest) == f_r2.name
    # round 2's payload still records round-1's non-targeted scene (cut-1)
    r2_data = json.loads(f_r2.read_text(encoding="utf-8"))
    assert set(r2_data["scenes"]) == {"cut-1", "cut-2"}
    assert r2_data["scenes"]["cut-1"]["scene_id"] == "cut-1"
    # round 1's stamped file is untouched by round 2
    r1_data = json.loads(f_r1.read_text(encoding="utf-8"))
    assert r1_data["session_id"] == r1.session_id

    # kill-switch after a symlinked round: legacy write must not clobber the
    # stamped target through the link
    monkeypatch.setenv("OM_EVIDENCE_PER_ROUND", "0")
    r3 = _run_round(ep, scene_ids=["cut-1"])
    assert latest.is_file() and not latest.is_symlink()
    assert f_r1.is_file() and f_r2.is_file()  # both suffixed files survive
    assert _stamped_files(ep) == sorted([f_r1, f_r2])  # and no new stamped file
    r3_data = json.loads(latest.read_text(encoding="utf-8"))
    assert r3_data["session_id"] == r3.session_id
    assert set(r3_data["scenes"]) == {"cut-1", "cut-2"}  # cut-2 carried forward


# ==============================================================================
# Review round 2 — security containment, classification split, exit codes
# ==============================================================================

def _failed_entry(sid: str, pkt_path: Path) -> dict:
    """Record shaped like the real tai-chinh scene-7 evidence: 2 attempts,
    zero successful (rejected + writer-scope violation)."""
    attempts = []
    for n, err in ((1, "reviewer_canonical_mutation"), (2, "writer_scope_violation")):
        attempts.append({
            "attempt_number": n,
            "writer_result": {"instance_id": f"writer_{sid}_{n}", "token": f"wt_{sid}_{n}",
                              "role": "writer", "exit_code": 0, "started_at": "t", "finished_at": "t",
                              "duration_seconds": 1.0, "stdout": "ok", "stderr": "", "outputs": {}, "error": None},
            "reviewer_result": {"instance_id": f"reviewer_{sid}_{n}", "token": f"rt_{sid}_{n}",
                                "role": "reviewer", "exit_code": 0, "started_at": "t", "finished_at": "t",
                                "duration_seconds": 1.0, "stdout": "rejected", "stderr": "",
                                "outputs": {}, "error": None},
            "ownership": None, "packet_valid": False, "packet_reasons": [],
            "packet_path": None, "packet_hash": None, "success": False, "error": err,
        })
    return {"scene_id": sid, "status": "failed", "attempts": attempts,
            "final_packet_path": None, "final_packet_hash": None, "error": None}


def test_failed_scene_is_not_missing_evidence(tmp_path, capsys):
    """W6: a record with only rejected/failed attempts is NOT 'missing
    evidence' — a mixed-round episode still gets dry-run exit 0."""
    ep, ev_file = build_restore_fixture(tmp_path, evidence_scene_ids=["scene-1"])
    evidence = json.loads(ev_file.read_text(encoding="utf-8"))
    evidence["scenes"]["scene-2"] = _failed_entry("scene-2", ep / "packet_scene-2.json")
    ev_file.write_text(json.dumps(evidence, indent=2), encoding="utf-8")

    rc = restore_main(["--from-evidence", str(ev_file), "--episode-dir", str(ep), "--dry-run"])
    assert rc == 0
    out = capsys.readouterr().out
    assert "no successful attempt" in out and "scene-2" in out
    assert "ERROR: Missing evidence" not in out
    assert "sealable (1): scene-1" in out


def test_incomplete_evidence_reported_not_fatal(tmp_path, capsys):
    """A successful attempt whose verdict/hash artifacts are gone is reported
    ('evidence incomplete'), not conflated with missing evidence."""
    ep, ev_file = build_restore_fixture(tmp_path, evidence_scene_ids=["scene-1"])
    evidence = json.loads(ev_file.read_text(encoding="utf-8"))
    evidence["scenes"]["scene-2"] = _seal_entry("scene-2", ep / "packet_scene-2.json",
                                                "wt_x", "rt_x")
    ev_file.write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    _clobber_packet(ep / "packet_scene-2.json")
    # no findings file for scene-2 -> no verdict/hash source at all
    (ep / "packets" / "scene-2_findings.json").unlink()

    rc = restore_main(["--from-evidence", str(ev_file), "--episode-dir", str(ep), "--dry-run"])
    assert rc == 0
    out = capsys.readouterr().out
    assert "evidence incomplete for scene-2" in out
    assert "approved verdict" in out
    assert "ERROR: Missing evidence" not in out


def test_scene_id_traversal_is_skipped_and_reported(tmp_path, capsys):
    """C2: crafted scene ids ('..', embedded '/') never reach path
    interpolation — skipped with a loud warning, nothing written outside."""
    ep, ev_file = build_restore_fixture(tmp_path)
    escape = tmp_path / "escape"
    rc = restore_main([
        "--from-evidence", str(ev_file), "--episode-dir", str(ep),
        "--scenes", "../escape,a/b,..", "--dry-run",
    ])
    assert rc == 2  # no valid targets remain after the invalid ones are dropped
    assert "invalid scene id(s)" in capsys.readouterr().out
    assert not escape.exists()
    # partial list: valid ids still processed, invalid ones dropped
    rc = restore_main([
        "--from-evidence", str(ev_file), "--episode-dir", str(ep),
        "--scenes", "../escape,scene-1", "--dry-run",
    ])
    assert rc == 0
    assert "invalid scene id(s)" in capsys.readouterr().out
    assert not (tmp_path / "escape").exists()
    # '..' alone traverses by literal: rejected
    rc = restore_main(["--from-evidence", str(ev_file), "--episode-dir", str(ep), "--scenes", ".."])
    assert rc == 2


def test_recorded_packet_path_outside_episode_is_clamped(tmp_path, capsys):
    """C1: a crafted absolute attempt.packet_path outside the episode dir
    must NOT become the restore write target (arbitrary file overwrite PoC) —
    the canonical episode-contained path is written instead and the outside
    file stays byte-identical."""
    ep, ev_file = build_restore_fixture(tmp_path, evidence_scene_ids=["scene-1"])
    outside = tmp_path / "outside" / "packet_scene-1.json"
    outside.parent.mkdir(parents=True, exist_ok=True)
    outside_payload = {"packet_type": "openmontage.scene-packet", "evil": "overwrite-me"}
    outside.write_text(json.dumps(outside_payload), encoding="utf-8")
    evidence = json.loads(ev_file.read_text(encoding="utf-8"))
    evidence["scenes"]["scene-1"]["attempts"][0]["packet_path"] = str(outside)
    evidence["scenes"]["scene-1"]["final_packet_path"] = str(outside)
    ev_file.write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    # exact post-re-mint scenario: canonical packet absent
    (ep / "packet_scene-1.json").unlink()
    _clobber_packet  # noqa: B018 (not used here; canonical absent by design)

    rc = restore_main(["--from-evidence", str(ev_file), "--episode-dir", str(ep)])
    assert rc == 0
    # the write landed INSIDE the episode dir (rebuilt from the skeleton)
    restored = json.loads((ep / "packet_scene-1.json").read_text(encoding="utf-8"))
    assert restored["integration_status"] == "integrated"
    assert restored["writer"]["token"] == "wt_scene-1_wtok"
    # the evidence-controlled outside path was never read as the packet body
    # nor written to
    assert json.loads(outside.read_text(encoding="utf-8")) == outside_payload


def test_drift_refusal_cannot_be_bypassed_by_force(tmp_path, capsys):
    """Spec-critical invariant: --force re-seals preserved packets but can
    NEVER override hash-drift refusal."""
    ep, ev_file = build_restore_fixture(tmp_path)
    (ep / "scene" / "audio.wav").write_text("drifted", encoding="utf-8")  # both scenes drift
    before = {sid: (ep / f"packet_{sid}.json").read_text(encoding="utf-8") for sid in SCENE_IDS}
    rc = restore_main(["--from-evidence", str(ev_file), "--episode-dir", str(ep), "--force"])
    assert rc == 3
    out = capsys.readouterr().out
    assert "REFUSED scene-1" in out and "REFUSED scene-2" in out
    for sid in SCENE_IDS:
        assert (ep / f"packet_{sid}.json").read_text(encoding="utf-8") == before[sid]


def test_restore_cli_rc2_paths(tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path)
    # missing evidence file
    assert restore_main(["--from-evidence", str(tmp_path / "nope.json")]) == 2
    # unparsable evidence JSON
    bad = tmp_path / "bad.json"
    bad.write_text("{not json", encoding="utf-8")
    assert restore_main(["--from-evidence", str(bad)]) == 2
    # unresolvable episode dir
    noep = tmp_path / "ev_no_episode.json"
    noep.write_text(json.dumps({"scenes": {}}), encoding="utf-8")
    assert restore_main(["--from-evidence", str(noep)]) == 2


def test_restore_cli_ignores_preserve_env_for_preserved_skip(tmp_path, capsys, monkeypatch):
    """W7: OM_REMINT_PRESERVE=0 must not flip the restore CLI's
    already-preserved skip into a silent re-seal."""
    ep, ev_file = build_restore_fixture(tmp_path)  # both packets intact+preserved
    before = {sid: (ep / f"packet_{sid}.json").read_text(encoding="utf-8") for sid in SCENE_IDS}
    monkeypatch.setenv("OM_REMINT_PRESERVE", "0")
    rc = restore_main(["--from-evidence", str(ev_file), "--episode-dir", str(ep)])
    assert rc == 0
    out = capsys.readouterr().out
    assert "skipped scene-1" in out and "skipped scene-2" in out  # env-independent skip
    for sid in SCENE_IDS:
        assert (ep / f"packet_{sid}.json").read_text(encoding="utf-8") == before[sid]
    # --force is still the explicit way to re-seal preserved packets
    rc = restore_main(["--from-evidence", str(ev_file), "--episode-dir", str(ep), "--force"])
    assert rc == 0
    pkt = json.loads((ep / "packet_scene-1.json").read_text(encoding="utf-8"))
    assert pkt["writer"]["token"] == "wt_scene-1_wtok"


def test_nested_packets_episode_layout_is_discovered(tmp_path):
    """W4: packets under packets/episode/ (real test-production-hardening
    layout) must be found and their refs resolved against their OWN root."""
    ep, _ = build_restore_fixture(tmp_path)
    project = tmp_path / "projects" / "proj"
    nested = project / "packets" / "episode"
    nested.mkdir(parents=True)
    p = make_packet(project, scene_id="cut-9")  # refs live at the project root
    (nested / "packet_cut-9.json").write_text(json.dumps(p), encoding="utf-8")
    assert get_preserved_scenes(project) == {"cut-9"}
    ok, why = is_scene_preserved(nested / "packet_cut-9.json")
    assert ok is True and "match" in why  # per-packet episode-dir inference


def test_nested_packets_refs_under_packets_episode_root(tmp_path):
    """BLOCKING round-2 repro: the REAL nested shape keeps the packet's ref
    tree under packets/episode/ itself (live tree:
    test-production-hardening-20261109-0114/packets/episode/ carries its own
    artifacts/, assets/, packets/, scene/). The packets/episode name-walkup
    lands on the project root where the refs are missing -> empty preserve
    set -> a default-flag mint purges ALL findings. Ref-resolution must pick
    the packet's own dir."""
    project = tmp_path / "projects" / "proj"
    episode_root = project / "packets" / "episode"  # the packet's own dir IS its episode root
    episode_root.mkdir(parents=True)
    p = make_packet(episode_root, scene_id="cut-9")  # refs created under episode_root/
    (episode_root / "packet_cut-9.json").write_text(json.dumps(p), encoding="utf-8")

    assert infer_packet_episode_dir(episode_root / "packet_cut-9.json") == episode_root
    ok, why = is_scene_preserved(episode_root / "packet_cut-9.json")
    assert ok is True and "match" in why
    assert get_preserved_scenes(project) == {"cut-9"}


def test_get_preserved_scenes_ignores_sandbox_copies(tmp_path):
    ep, project = build_mint_layout(tmp_path)
    sandbox = ep / ".tmp_sandboxes" / "sandbox_scene-2_abc"
    (sandbox / "packets").mkdir(parents=True)
    p = make_packet(sandbox, scene_id="scene-2")
    (sandbox / "packets" / "packet_scene-2.json").write_text(json.dumps(p), encoding="utf-8")
    assert get_preserved_scenes(project) == {"scene-1", "scene-2"}  # sandbox copy adds nothing


def test_mint_warns_when_preserve_on_but_nothing_found(tmp_path, capsys):
    """W4: preserve ON + 0 preserved scenes + findings present -> loud
    warning (silent purge-all is the exact failure mode to avoid)."""
    ep, project = build_mint_layout(tmp_path)
    findings = _seed_findings(project, ["scene-1"])
    (ep / "scene" / "audio.wav").write_text("drifted", encoding="utf-8")  # nothing preserved
    assert mint_main(["--project-dir", str(project), "--scenes", "2"]) == 0
    out = capsys.readouterr().out
    assert "WARNING: preserve mode ON" in out
    assert "0 preserved scenes detected" in out
    assert "--episode-dir" in out
    assert not findings["scene-1"].exists()  # purge proceeded (loudly)


def test_mint_episode_dir_passthrough(tmp_path, capsys):
    """W4: --episode-dir lets preserve detection reach packets outside the
    default remotion-composer/src/<slug> inference."""
    ep, project = build_mint_layout(tmp_path)
    findings = _seed_findings(project, SCENE_IDS)
    # break the default inference: move the episode OUT of the walk's reach
    moved = tmp_path / "custom-location" / ep.name
    moved.parent.mkdir(parents=True)
    shutil.move(str(ep), str(moved))
    assert get_preserved_scenes(project) == set()  # inference can no longer see it
    assert mint_main(["--project-dir", str(project), "--scenes", "2",
                      "--episode-dir", str(moved)]) == 0
    assert findings["scene-1"].exists()  # preserved via the explicit episode dir
    assert findings["scene-2"].exists()  # both packets intact -> both preserved
    manifest = json.loads((project / "scripts" / "cc_pipeline" / MANIFEST_NAME).read_text(encoding="utf-8"))
    assert manifest["preserved_scenes"] == ["scene-1", "scene-2"]
