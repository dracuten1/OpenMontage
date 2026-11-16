"""Wave1 P0-2 item 5 — hash drift forces writer+reviewer re-dispatch.

restore_seals used to merely refuse drifted scenes; the re-dispatch trigger
now runs orchestrate_episode with an explicit scene_ids list (the pinned
dispatch-everything path) unless --no-redispatch keeps the legacy refusal.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from tools.qc.scene_packet import PROVENANCE_KEY
from tests.test_restore_seals import build_restore_fixture
import tools.qc.restore_seals as restore_seals


# ==============================================================================
# Item 5 — drift forces writer+reviewer re-dispatch
# ==============================================================================

def test_redispatch_drifted_scenes_calls_orchestrator_with_explicit_ids(monkeypatch, tmp_path):
    captured = {}

    def fake_orchestrate(episode_dir, scene_ids=None, runner=None, max_retries=1, **kw):
        captured["episode_dir"] = episode_dir
        captured["scene_ids"] = list(scene_ids or [])
        class _Rec:
            success = True
        class _Session:
            scenes = {"scene-1": _Rec()}
        return _Session()

    monkeypatch.setattr("tools.qc.scene_orchestrator.orchestrate_episode", fake_orchestrate)
    session = restore_seals.redispatch_drifted_scenes(
        ["scene-1", "../evil"], tmp_path / "ep")
    assert captured["scene_ids"] == ["scene-1"]  # invalid id filtered
    assert captured["episode_dir"] == tmp_path / "ep"
    assert restore_seals.redispatch_succeeded(session) is True


def test_redispatch_succeeded_false_on_failed_record(monkeypatch):
    class _Rec:
        success = False
    class _Session:
        scenes = {"scene-1": _Rec()}
    assert restore_seals.redispatch_succeeded(_Session()) is False
    assert restore_seals.redispatch_succeeded(None) is False
    class _Empty:
        scenes = {}
    assert restore_seals.redispatch_succeeded(_Empty()) is False


def test_cli_default_redispatches_drifted_scenes(monkeypatch, tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path, clobber=("scene-1",))
    # drift the SHARED narration file — both scenes' reviewed bindings go
    # stale, so BOTH must be force re-dispatched (never re-sealed).
    (ep / "scene" / "audio.wav").write_text("drifted content", encoding="utf-8")

    calls = []

    def fake_redispatch(scene_ids, episode_dir, runner=None, max_retries=1):
        calls.append((list(scene_ids), str(episode_dir)))
        class _Rec:
            success = True
        class _Session:
            scenes = {sid: _Rec() for sid in scene_ids}
        return _Session()

    monkeypatch.setattr(restore_seals, "redispatch_drifted_scenes", fake_redispatch)
    rc = restore_seals.main([
        "--from-evidence", str(ev_file),
        "--episode-dir", str(ep),
    ])
    assert rc == 0
    assert calls and calls[0][0] == ["scene-1", "scene-2"]
    out = capsys.readouterr().out
    assert "re-dispatch" in out
    # drifted scenes were never re-sealed from stale evidence
    for sid in ("scene-1", "scene-2"):
        pkt = json.loads((ep / f"packet_{sid}.json").read_text(encoding="utf-8"))
        assert pkt["integration_status"] == "pending"


def test_cli_no_redispatch_keeps_legacy_refusal(tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path, clobber=("scene-1",))
    (ep / "scene" / "audio.wav").write_text("drifted content", encoding="utf-8")
    rc = restore_seals.main([
        "--from-evidence", str(ev_file),
        "--episode-dir", str(ep),
        "--no-redispatch",
    ])
    assert rc == 3
    out = capsys.readouterr().out
    assert "hash drift (scene-1)" in out
    assert "REFUSED scene-1" in out


def test_cli_failed_redispatch_exits_nonzero(monkeypatch, tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path, clobber=("scene-1",))
    (ep / "scene" / "audio.wav").write_text("drifted content", encoding="utf-8")

    def fake_redispatch(scene_ids, episode_dir, runner=None, max_retries=1):
        class _Rec:
            success = False
            scene_id = scene_ids[0]
        class _Session:
            scenes = {sid: _Rec() for sid in scene_ids}
        return _Session()

    monkeypatch.setattr(restore_seals, "redispatch_drifted_scenes", fake_redispatch)
    rc = restore_seals.main([
        "--from-evidence", str(ev_file),
        "--episode-dir", str(ep),
    ])
    assert rc == 3


def test_cli_dry_run_never_redispatches(monkeypatch, tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path, clobber=("scene-1",))
    (ep / "scene" / "audio.wav").write_text("drifted content", encoding="utf-8")
    calls = []

    def fake_redispatch(scene_ids, episode_dir, runner=None, max_retries=1):
        calls.append(list(scene_ids))
        return None

    monkeypatch.setattr(restore_seals, "redispatch_drifted_scenes", fake_redispatch)
    rc = restore_seals.main([
        "--from-evidence", str(ev_file),
        "--episode-dir", str(ep),
        "--dry-run",
    ])
    assert rc == 0
    assert calls == []
    out = capsys.readouterr().out
    assert "dry-run: no packets written" in out


def test_restored_seal_backfills_provenance_from_evidence(tmp_path):
    """build_sealed_packet carries the minted provenance block, backfilled
    from verified evidence (item 1 + 2 together)."""
    ep, ev_file = build_restore_fixture(tmp_path, clobber=("scene-1",))
    evidence = json.loads(ev_file.read_text(encoding="utf-8"))
    status, payload, _ = restore_seals.scene_seal_status(evidence, "scene-1", ep)
    assert status == "ok"
    sealed = restore_seals.build_sealed_packet(payload, "scene-1", ep, None)
    prov = sealed["frozen_inputs"].get(PROVENANCE_KEY)
    assert prov["writer_instance_id"] == payload["writer_instance_id"]
    assert prov["writer_token"] == payload["writer_token"]
    assert prov["findings_hash"] == payload["findings_hash"]


# ==============================================================================
# Wave1 security cycle-1 CRITICAL-2 — provenance drift forces re-dispatch too
# ==============================================================================

def _strip_provenance(ep: Path, sid: str) -> None:
    pkt = json.loads((ep / f"packet_{sid}.json").read_text(encoding="utf-8"))
    pkt.get("frozen_inputs", {}).pop(PROVENANCE_KEY, None)
    (ep / f"packet_{sid}.json").write_text(json.dumps(pkt, indent=2), encoding="utf-8")


def _empty_writer_token(ep: Path, ev_file: Path, sid: str) -> None:
    """Empty writer_token is drift only when UNRECOVERABLE — blank the packet
    binding AND the evidence record's writer_result token."""
    pkt = json.loads((ep / f"packet_{sid}.json").read_text(encoding="utf-8"))
    pkt["writer_token"] = ""
    pkt["writer"]["token"] = ""
    (ep / f"packet_{sid}.json").write_text(json.dumps(pkt, indent=2), encoding="utf-8")
    evd = json.loads(Path(ev_file).read_text(encoding="utf-8"))
    for att in evd["scenes"][sid]["attempts"]:
        att["writer_result"]["token"] = ""
    Path(ev_file).write_text(json.dumps(evd, indent=2), encoding="utf-8")


def _empty_findings_hash(ep: Path, ev_file: Path, sid: str) -> None:
    """Remove findings evidence and clear all packet hash pointers."""
    pkt = json.loads((ep / f"packet_{sid}.json").read_text(encoding="utf-8"))
    pkt["reviewer"]["findings_hash"] = ""
    provenance = pkt.get("frozen_inputs", {}).get("_provenance")
    if isinstance(provenance, dict):
        provenance["findings_hash"] = ""
    pkt["frozen_inputs"].pop(f"packets/{sid}_findings.json", None)
    evd = json.loads(Path(ev_file).read_text(encoding="utf-8"))
    for att in evd["scenes"][sid]["attempts"]:
        att.get("reviewer_result", {}).pop("findings_hash", None)
    Path(ev_file).write_text(json.dumps(evd, indent=2), encoding="utf-8")
    (ep / f"packet_{sid}.json").write_text(json.dumps(pkt, indent=2), encoding="utf-8")
    findings_path = ep / "packets" / f"{sid}_findings.json"
    if findings_path.is_file():
        findings_path.unlink()


def _empty_reviewed_hashes(ep: Path, sid: str) -> None:
    pkt = json.loads((ep / f"packet_{sid}.json").read_text(encoding="utf-8"))
    pkt["reviewer"]["reviewed_hashes"] = {}
    pkt["reviewer_token"] = ""
    # Strip reviewer binding from findings fixture, then refresh its hash and
    # frozen binding. Hash remains complete; only reviewed_hashes is incomplete.
    fdir = ep / "packets"
    findings_path = fdir / f"{sid}_findings.json"
    if findings_path.is_file():
        findings = json.loads(findings_path.read_text(encoding="utf-8"))
        findings["reviewed_hashes"] = {}
        findings_path.write_text(json.dumps(findings, indent=2), encoding="utf-8")
        import hashlib
        digest = hashlib.sha256(findings_path.read_bytes()).hexdigest()
        pkt["reviewer"]["findings_hash"] = digest
        pkt["frozen_inputs"]["_provenance"]["findings_hash"] = digest
        pkt["frozen_inputs"][f"packets/{sid}_findings.json"] = digest
    (ep / f"packet_{sid}.json").write_text(json.dumps(pkt, indent=2), encoding="utf-8")


def _assert_redispatched(monkeypatch, ep, ev_file, expected_ids, capsys):
    calls = []

    def fake_redispatch(scene_ids, episode_dir, runner=None, max_retries=1):
        calls.append(list(scene_ids))
        class _Rec:
            success = True
        class _Session:
            scenes = {sid: _Rec() for sid in scene_ids}
        return _Session()

    monkeypatch.setattr(restore_seals, "redispatch_drifted_scenes", fake_redispatch)
    rc = restore_seals.main(["--from-evidence", str(ev_file), "--episode-dir", str(ep)])
    assert rc == 0
    assert calls and calls[0] == expected_ids
    out = capsys.readouterr().out
    assert "provenance drift" in out
    return out


def test_provenance_drift_missing_provenance_block(monkeypatch, tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path)
    _strip_provenance(ep, "scene-1")
    _assert_redispatched(monkeypatch, ep, ev_file, ["scene-1"], capsys)
    pkt = json.loads((ep / "packet_scene-1.json").read_text(encoding="utf-8"))
    assert pkt["integration_status"] == "pending"  # never re-sealed from drift


def test_provenance_drift_empty_writer_token(monkeypatch, tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path)
    _empty_writer_token(ep, ev_file, "scene-1")
    _assert_redispatched(monkeypatch, ep, ev_file, ["scene-1"], capsys)


def test_provenance_drift_empty_findings_hash(monkeypatch, tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path)
    _empty_findings_hash(ep, ev_file, "scene-1")
    _assert_redispatched(monkeypatch, ep, ev_file, ["scene-1"], capsys)


def test_provenance_drift_empty_reviewed_hashes_with_tsx_on_disk(monkeypatch, tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path)
    _empty_reviewed_hashes(ep, "scene-1")
    # the drift condition fires ONLY when the scene .tsx exists on disk
    scenes = ep / "scenes"
    scenes.mkdir(parents=True, exist_ok=True)
    (scenes / "scene-1.tsx").write_text("// v1\n", encoding="utf-8")
    _assert_redispatched(monkeypatch, ep, ev_file, ["scene-1"], capsys)


def test_empty_reviewed_hashes_in_existing_packet_is_provenance_drift(tmp_path, capsys):
    """Existing packet with empty reviewed_hashes must fail closed and redispatch."""
    ep, ev_file = build_restore_fixture(tmp_path)
    _empty_reviewed_hashes(ep, "scene-1")
    rc = restore_seals.main(["--from-evidence", str(ev_file), "--episode-dir", str(ep)])
    assert rc == 3  # no redispatch stub; empty packet binding remains unsafe
    out = capsys.readouterr().out
    assert "provenance drift (scene-1)" in out
    assert "empty provenance reviewed_hashes" in out


def test_cli_no_redispatch_refuses_provenance_drift_with_exit3(tmp_path, capsys):
    ep, ev_file = build_restore_fixture(tmp_path)
    _strip_provenance(ep, "scene-1")
    rc = restore_seals.main([
        "--from-evidence", str(ev_file),
        "--episode-dir", str(ep),
        "--no-redispatch",
    ])
    assert rc == 3
    out = capsys.readouterr().out
    assert "provenance drift (scene-1)" in out
    assert "REFUSED (--no-redispatch)" in out


def test_scene_seal_status_provenance_drift_reason_names_all_four(tmp_path):
    """Unit pin on the classification: every CRITICAL-2 condition names
    itself in the drift reason."""
    ep, ev_file = build_restore_fixture(tmp_path)
    _strip_provenance(ep, "scene-1")
    _empty_writer_token(ep, ev_file, "scene-1")
    _empty_findings_hash(ep, ev_file, "scene-1")
    evidence = restore_seals.load_evidence(ev_file)
    status, _payload, reason = restore_seals.scene_seal_status(evidence, "scene-1", ep)
    assert status == "provenance_drift"
    assert "missing frozen_inputs._provenance block" in reason
    assert "empty writer_token" in reason
    assert "empty findings_hash" in reason


def test_empty_findings_hash_without_review_evidence_is_incomplete(tmp_path):
    """Mutable findings JSON cannot recover a missing reviewer hash pointer."""
    ep, ev_file = build_restore_fixture(tmp_path)
    pkt = json.loads((ep / "packet_scene-1.json").read_text(encoding="utf-8"))
    pkt["reviewer"]["findings_hash"] = ""
    pkt["frozen_inputs"]["_provenance"]["findings_hash"] = ""
    (ep / "packet_scene-1.json").write_text(json.dumps(pkt, indent=2), encoding="utf-8")
    status, _payload, reason = restore_seals.scene_seal_status(
        restore_seals.load_evidence(ev_file), "scene-1", ep)
    assert status == "provenance_drift"
    assert "findings_hash" in reason
