"""Wave1 P0-2 item 5 — hash drift forces writer+reviewer re-dispatch.

restore_seals used to merely refuse drifted scenes; the re-dispatch trigger
now runs orchestrate_episode with an explicit scene_ids list (the pinned
dispatch-everything path) unless --no-redispatch keeps the legacy refusal.
"""
from __future__ import annotations

import json

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
