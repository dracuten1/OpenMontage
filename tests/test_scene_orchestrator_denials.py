"""Tests for Plan Task 3 real-path denial enforcement.

Residual acceptance cases:
  (a) MISSING PACKET REJECTION: required scene packet absent must be rejected.
  (b) EXTRA / UNKNOWN PACKET REJECTION: packet for unexpected/unknown scene must be rejected.
  (c) CROSS-SCENE WRITE DENIAL: writer attempting to write outside assigned scene scope must be denied.
"""

from __future__ import annotations

import json
from pathlib import Path
import pytest

from tools.qc.scene_orchestrator import (
    AgentRunResult,
    CallableAgentRunner,
    orchestrate_episode,
    verify_writer_scope,
    snapshot_directory_hashes,
)
from tools.qc.episode_gate import validate_episode
from tools.qc.scene_packet import integrate_scene_packet
from tests.test_scene_orchestrator import make_test_episode


# ==============================================================================
# Case (a): MISSING PACKET REJECTION
# ==============================================================================

def test_missing_packet_rejected_by_episode_gate(tmp_path: Path):
    """Episode gate must fail-closed with scene_packet_missing when an authoritative packet is absent."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])
    
    # Remove required packet for cut-2
    target = episode / "packet_cut-2.json"
    assert target.is_file()
    target.unlink()

    reasons = validate_episode(episode)
    codes = [r.get("code") for r in reasons]
    assert "scene_packet_missing" in codes
    missing_msg = [r.get("message") for r in reasons if r.get("code") == "scene_packet_missing"]
    assert any("cut-2" in m for m in missing_msg)


def test_missing_packet_rejected_by_scene_orchestrator(tmp_path: Path):
    """Scene orchestrator must fail session when an authoritative scene has no packet generated."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])

    # Remove packet for cut-2 before orchestration
    (episode / "packet_cut-2.json").unlink()

    # Orchestrate only cut-1, leaving cut-2 absent
    session = orchestrate_episode(
        episode_dir=episode,
        scene_ids=["cut-1"],
        max_concurrency=1,
        max_retries=0,
        runner=CallableAgentRunner(),
    )
    assert session.overall_status == "fail"
    gate_res = session.episode_gate_result
    assert gate_res.get("valid") is False
    codes = [r.get("code") for r in gate_res.get("reasons", [])]
    assert "scene_packet_missing" in codes


# ==============================================================================
# Case (b): EXTRA / UNKNOWN PACKET REJECTION
# ==============================================================================

def test_extra_unknown_packet_rejected_by_episode_gate(tmp_path: Path):
    """Episode gate must fail-closed with scene_packet_extra when an unknown packet is present."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])

    # Forge an extra packet for an unauthoritative scene
    p1 = json.loads((episode / "packet_cut-1.json").read_text(encoding="utf-8"))
    p_extra = dict(p1)
    p_extra["scene_id"] = "unknown-cut-99"
    (episode / "packet_unknown-cut-99.json").write_text(json.dumps(p_extra, indent=2), encoding="utf-8")

    reasons = validate_episode(episode)
    codes = [r.get("code") for r in reasons]
    assert "scene_packet_extra" in codes
    extra_msg = [r.get("message") for r in reasons if r.get("code") == "scene_packet_extra"]
    assert any("unknown-cut-99" in m for m in extra_msg)


def test_extra_unknown_packet_rejected_by_scene_orchestrator(tmp_path: Path):
    """Scene orchestrator must fail session when an unexpected packet is present."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])

    p1 = json.loads((episode / "packet_cut-1.json").read_text(encoding="utf-8"))
    p_extra = dict(p1)
    p_extra["scene_id"] = "rogue-scene-x"
    (episode / "packet_rogue-scene-x.json").write_text(json.dumps(p_extra, indent=2), encoding="utf-8")

    session = orchestrate_episode(
        episode_dir=episode,
        max_concurrency=1,
        max_retries=0,
        runner=CallableAgentRunner(),
    )
    assert session.overall_status == "fail"
    gate_res = session.episode_gate_result
    assert gate_res.get("valid") is False
    codes = [r.get("code") for r in gate_res.get("reasons", [])]
    assert "scene_packet_extra" in codes


# ==============================================================================
# Case (c): CROSS-SCENE WRITE DENIAL
# ==============================================================================

def test_cross_scene_root_packet_write_denied(tmp_path: Path):
    """Writer for cut-1 modifying cut-2 packet at nested sub-path must trigger writer_scope_violation via basename check."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])
    (episode / "packets" / "sub").mkdir(parents=True, exist_ok=True)
    before = snapshot_directory_hashes(episode)

    # Writer for cut-1 writes to nested packets/sub/packet_cut-2.json
    (episode / "packets" / "sub" / "packet_cut-2.json").write_text('{"tamper": true}', encoding="utf-8")
    after = snapshot_directory_hashes(episode)

    valid, mutated, err = verify_writer_scope(
        before,
        after,
        scene_id="cut-1",
        allowed_io=["artifacts", "assets", "packets", "scene"],
        episode_dir=episode,
    )
    assert valid is False
    assert err is not None
    assert "writer_scope_violation" in err
    assert "packets/sub/packet_cut-2.json" in mutated


def test_cross_scene_packets_dir_write_denied(tmp_path: Path):
    """Writer for cut-1 modifying packets/packet_cut-2.json must be denied despite allowed_io containing 'packets'."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])
    before = snapshot_directory_hashes(episode)

    # Writer for cut-1 attempts to modify cut-2 packet inside packets/
    target = episode / "packets" / "packet_cut-2.json"
    target.write_text('{"cross_scene_tamper": true}', encoding="utf-8")
    after = snapshot_directory_hashes(episode)

    valid, mutated, err = verify_writer_scope(
        before,
        after,
        scene_id="cut-1",
        allowed_io=["artifacts", "assets", "packets", "scene"],
        episode_dir=episode,
    )
    assert valid is False
    assert err is not None
    assert "writer_scope_violation" in err
    assert "packets/packet_cut-2.json" in err


def test_cross_scene_findings_write_denied(tmp_path: Path):
    """Writer for cut-1 modifying packets/cut-2_findings.json must be denied."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])
    before = snapshot_directory_hashes(episode)

    target = episode / "packets" / "cut-2_findings.json"
    target.write_text('{"verdict": "approved"}', encoding="utf-8")
    after = snapshot_directory_hashes(episode)

    valid, mutated, err = verify_writer_scope(
        before,
        after,
        scene_id="cut-1",
        allowed_io=["artifacts", "assets", "packets", "scene"],
        episode_dir=episode,
    )
    assert valid is False
    assert err is not None
    assert "writer_scope_violation" in err
    assert "packets/cut-2_findings.json" in err


def test_cross_scene_directory_write_denied(tmp_path: Path):
    """Writer for cut-1 modifying scene/cut-2/ audio must be denied despite allowed_io containing 'scene'."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])
    (episode / "scene" / "cut-2").mkdir(parents=True, exist_ok=True)
    before = snapshot_directory_hashes(episode)

    target = episode / "scene" / "cut-2" / "audio.wav"
    target.write_text("rogue audio", encoding="utf-8")
    after = snapshot_directory_hashes(episode)

    valid, mutated, err = verify_writer_scope(
        before,
        after,
        scene_id="cut-1",
        allowed_io=["artifacts", "assets", "packets", "scene"],
        episode_dir=episode,
    )
    assert valid is False
    assert err is not None
    assert "writer_scope_violation" in err
    assert "scene/cut-2/audio.wav" in err


def test_cross_scene_audio_asset_write_denied(tmp_path: Path):
    """Writer for cut-1 modifying assets/audio/voice_cut-2.wav must be denied."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])
    before = snapshot_directory_hashes(episode)

    target = episode / "assets" / "audio" / "voice_cut-2.wav"
    target.write_text("tampered wav", encoding="utf-8")
    after = snapshot_directory_hashes(episode)

    valid, mutated, err = verify_writer_scope(
        before,
        after,
        scene_id="cut-1",
        allowed_io=["artifacts", "assets", "packets", "scene"],
        episode_dir=episode,
    )
    assert valid is False
    assert err is not None
    assert "writer_scope_violation" in err
    assert "assets/audio/voice_cut-2.wav" in err


def test_cross_scene_orchestrator_dispatch_denial_e2e(tmp_path: Path):
    """Orchestrator dispatch catching a cross-scene writer must record violation and fail overall."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])

    def malicious_writer(ctx):
        if ctx.scene_id == "cut-1":
            # Attempt cross-scene write
            (ctx.episode_dir / "packets" / "packet_cut-2.json").write_text('{"hacked": true}', encoding="utf-8")
        return AgentRunResult(
            instance_id=ctx.instance_id,
            token=ctx.token,
            role="writer",
            exit_code=0,
            started_at="2026-11-09T00:00:00Z",
            finished_at="2026-11-09T00:00:01Z",
            duration_seconds=1.0,
            stdout="Malicious writer executed",
            stderr="",
        )

    runner = CallableAgentRunner(writer_fn=malicious_writer)
    session = orchestrate_episode(episode, runner=runner, max_retries=0)

    assert session.overall_status == "fail"
    cut1_rec = session.scenes["cut-1"]
    assert cut1_rec.status == "failed"
    assert len(cut1_rec.attempts) == 1
    att = cut1_rec.attempts[0]
    assert att.ownership is not None
    assert att.ownership.writer_scope_valid is False
    assert "writer_scope_violation" in att.ownership.error_message


def test_scene_packet_integrate_cross_scene_io_denied(tmp_path: Path):
    """integrate_scene_packet must reject io_operations targeting another scene."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])
    pkt = json.loads((episode / "packet_cut-1.json").read_text(encoding="utf-8"))

    # IO operation attempting cross-scene write to cut-2
    res = integrate_scene_packet(
        pkt,
        packet_path=episode / "packet_cut-1.json",
        writer_token=pkt.get("writer_token"),
        reviewer_token=pkt.get("reviewer_token"),
        io_operations=[{"path": "scene/cut-2/audio.wav"}],
    )
    assert res["valid"] is False
    codes = [r["code"] for r in res["reasons"]]
    assert "io_outside_allowlist" in codes


def test_fail_closed_when_scene_discovery_empty(tmp_path: Path):
    """When scene discovery returns empty, verify_writer_scope must fail-closed on non-scene-own paths."""
    from tools.qc.scene_orchestrator import discover_authoritative_scenes

    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2"])
    # Delete manifests and packets so discover_authoritative_scenes returns empty
    for f in episode.glob("**/scene_manifest.json"):
        f.unlink()
    for f in episode.glob("**/edit_decisions.json"):
        f.unlink()
    for f in episode.glob("**/*.json"):
        if f.name.startswith("packet_"):
            f.unlink()

    assert discover_authoritative_scenes(episode) == []

    before = snapshot_directory_hashes(episode)

    # Attempt to write an asset file (not explicitly cut-1's own packet/findings/scene dir)
    target = episode / "assets" / "audio" / "voice_cut-2.wav"
    target.write_text("rogue wav", encoding="utf-8")
    after = snapshot_directory_hashes(episode)

    valid, mutated, err = verify_writer_scope(
        before,
        after,
        scene_id="cut-1",
        allowed_io=["artifacts", "assets", "packets", "scene"],
        episode_dir=episode,
    )
    assert valid is False
    assert err is not None
    assert "writer_scope_violation" in err
    assert "assets/audio/voice_cut-2.wav" in mutated

    # Conversely, writing cut-1's own packet file must still be allowed
    before_own = snapshot_directory_hashes(episode)
    (episode / "packets" / "packet_cut-1.json").write_text('{"scene_id": "cut-1"}', encoding="utf-8")
    after_own = snapshot_directory_hashes(episode)
    valid_own, _, err_own = verify_writer_scope(
        before_own,
        after_own,
        scene_id="cut-1",
        allowed_io=["artifacts", "assets", "packets", "scene"],
        episode_dir=episode,
    )
    assert valid_own is True
    assert err_own is None

