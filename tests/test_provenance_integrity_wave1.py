"""Wave1 P0-2 — provenance integrity chain (items 1-6).

Covers:
- item 1: writer instance id + writer_token + findings hash minted INTO
  packet frozen_inputs at packet creation (scene_orchestrator) and
  cross-checked by the integration gate (scene_packet).
- item 2: scaffolder seeds NO empty writer provenance blocks; reviewer_pass
  backfills from on-disk evidence only (see test_reviewer_pass_evidence_only.py).
- item 4: integrate_scene_packet re-verifies scene .tsx hashes against
  reviewer reviewed_hashes at integration time.
- item 3: episode_gate scenes/ layout probe (tests/test_episode_gate_provenance.py).
- item 5: see tests/test_restore_seals_redispatch.py.
- item 6: see tests/test_render_episode_overrides.py.
"""
from __future__ import annotations

import json

from tools.qc.scene_orchestrator import (
    CallableAgentRunner,
    load_existing_packet_or_template,
    orchestrate_episode,
)
from tools.qc.scene_packet import (
    PROVENANCE_KEY,
    SCENE_TSX_HASH_MISMATCH,
    integrate_scene_packet,
)
from tests.test_scene_orchestrator import make_test_episode


# ==============================================================================
# Item 1 — frozen_inputs provenance minting
# ==============================================================================

def test_orchestration_mints_provenance_into_frozen_inputs(tmp_path):
    """A successful orchestrated scene carries _provenance in frozen_inputs,
    bound to the packet's writer block and reviewer findings hash."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])
    runner = CallableAgentRunner()
    session = orchestrate_episode(episode, max_concurrency=1, max_retries=0, runner=runner)
    assert session.overall_status == "pass"

    pkt = json.loads((episode / "packet_cut-1.json").read_text(encoding="utf-8"))
    prov = pkt["frozen_inputs"].get(PROVENANCE_KEY)
    assert isinstance(prov, dict)
    assert prov["writer_instance_id"] == pkt["writer"]["instance_id"]
    assert prov["writer_instance_id"].startswith("writer_cut-1_")
    assert prov["writer_token"] == pkt["writer"]["token"] == pkt["writer_token"]
    assert prov["findings_hash"] == pkt["reviewer"]["findings_hash"]
    # findings hash is the REAL hash of the canonical findings bytes
    from lib.production_provenance import hash_file
    findings_path = episode / pkt["reviewer"]["findings_ref"]
    assert hash_file(findings_path) == prov["findings_hash"]


def test_gate_rejects_packet_without_provenance_block(tmp_path):
    from tests.test_scene_packet import make
    p = make(tmp_path)
    del p["frozen_inputs"][PROVENANCE_KEY]
    res = integrate_scene_packet(p, packet_path=tmp_path / "p.json",
                                 writer_token="wt", reviewer_token="rt")
    assert res["valid"] is False
    assert "provenance_missing" in [r["code"] for r in res["reasons"]]


def test_gate_rejects_incomplete_provenance_block(tmp_path):
    from tests.test_scene_packet import make
    p = make(tmp_path)
    p["frozen_inputs"][PROVENANCE_KEY] = {"writer_instance_id": "w"}
    res = integrate_scene_packet(p, packet_path=tmp_path / "p.json",
                                 writer_token="wt", reviewer_token="rt")
    codes = [r["code"] for r in res["reasons"]]
    assert "provenance_incomplete" in codes


def test_gate_rejects_provenance_writer_mismatch(tmp_path):
    from tests.test_scene_packet import make
    p = make(tmp_path)
    p["frozen_inputs"][PROVENANCE_KEY]["writer_token"] = "wt_someone_else"
    res = integrate_scene_packet(p, packet_path=tmp_path / "p.json",
                                 writer_token="wt", reviewer_token="rt")
    codes = [r["code"] for r in res["reasons"]]
    assert "provenance_writer_mismatch" in codes


def test_gate_rejects_provenance_findings_mismatch(tmp_path):
    from tests.test_scene_packet import make
    p = make(tmp_path)
    p["frozen_inputs"][PROVENANCE_KEY]["findings_hash"] = "f" * 64
    res = integrate_scene_packet(p, packet_path=tmp_path / "p.json",
                                 writer_token="wt", reviewer_token="rt")
    codes = [r["code"] for r in res["reasons"]]
    assert "provenance_findings_mismatch" in codes


def test_provenance_block_is_not_treated_as_a_file_input(tmp_path):
    """The reserved _provenance key must never be hashed as a path."""
    from tests.test_scene_packet import make
    p = make(tmp_path)
    res = integrate_scene_packet(p, packet_path=tmp_path / "p.json",
                                 writer_token="wt", reviewer_token="rt")
    codes = [r["code"] for r in res["reasons"]]
    assert "frozen_input_mismatch" not in codes
    assert "frozen_input_path_escape" not in codes


# ==============================================================================
# Item 2 — scaffolder seeds no empty writer provenance blocks
# ==============================================================================

def test_scaffolder_template_has_no_provenance_blocks(tmp_path):
    template = load_existing_packet_or_template(tmp_path, "scene-1")
    for key in ("writer", "writer_token", "reviewer", "reviewer_token"):
        assert key not in template, f"scaffolder must not seed empty block: {key}"
    assert template["integration_status"] == "pending"
    assert "approved" not in json.dumps(template), \
        "scaffolder must never seed a fabricated approved verdict"


def test_scaffolder_still_prefers_existing_packet(tmp_path):
    ep = make_test_episode(tmp_path, scene_ids=["cut-1"])
    loaded = load_existing_packet_or_template(ep, "cut-1")
    assert loaded["scene_id"] == "cut-1"


def test_gate_rejects_empty_writer_identity(tmp_path):
    """Empty provenance blocks (the old scaffolder shape) never integrate."""
    from tests.test_scene_packet import make
    p = make(tmp_path)
    p["writer"] = {"instance_id": "", "timestamp": "", "token": ""}
    p["writer_token"] = ""
    p["frozen_inputs"][PROVENANCE_KEY] = {
        "writer_instance_id": "", "writer_token": "", "findings_hash": "x" * 64,
    }
    res = integrate_scene_packet(p, packet_path=tmp_path / "p.json",
                                 writer_token="", reviewer_token="rt")
    codes = [r["code"] for r in res["reasons"]]
    assert "writer_token_invalid" in codes
    assert "provenance_incomplete" in codes


# ==============================================================================
# Item 4 — integration-time scene .tsx hash re-verify
# ==============================================================================

def _tsx_packet(tmp_path, reviewed_hash: str | None = None):
    import hashlib
    from tests.test_scene_packet import make
    scenes = tmp_path / "scenes"
    scenes.mkdir(exist_ok=True)
    tsx = scenes / "scene-1.tsx"
    tsx.write_text("// scene body\n", encoding="utf-8")
    p = make(tmp_path)
    actual = hashlib.sha256(tsx.read_bytes()).hexdigest()
    p["reviewer"]["reviewed_hashes"] = {"scenes/scene-1.tsx": reviewed_hash or actual}
    # freeze the tsx so output/frozen checks stay green; we are testing the
    # reviewed_hashes re-verify path, not the frozen path
    p["frozen_inputs"]["scenes/scene-1.tsx"] = actual
    return p, tsx


def test_integrate_reverifies_scene_tsx_hash_ok(tmp_path):
    p, _tsx = _tsx_packet(tmp_path)
    res = integrate_scene_packet(p, packet_path=tmp_path / "p.json",
                                 writer_token="wt", reviewer_token="rt")
    assert SCENE_TSX_HASH_MISMATCH not in [r["code"] for r in res["reasons"]]
    assert res["valid"] is True


def test_integrate_reverifies_scene_tsx_hash_stale(tmp_path):
    p, tsx = _tsx_packet(tmp_path, reviewed_hash="a" * 64)
    tsx.write_text("// hand-edited after review\n", encoding="utf-8")
    res = integrate_scene_packet(p, packet_path=tmp_path / "p.json",
                                 writer_token="wt", reviewer_token="rt")
    codes = [r["code"] for r in res["reasons"]]
    assert SCENE_TSX_HASH_MISMATCH in codes
    assert res["valid"] is False


def test_integrate_reverifies_scene_tsx_missing_file(tmp_path):
    p, tsx = _tsx_packet(tmp_path, reviewed_hash="a" * 64)
    tsx.unlink()
    res = integrate_scene_packet(p, packet_path=tmp_path / "p.json",
                                 writer_token="wt", reviewer_token="rt")
    codes = [r["code"] for r in res["reasons"]]
    assert SCENE_TSX_HASH_MISMATCH in codes


def test_integrate_reverifies_rejects_outside_tsx_path(tmp_path):
    p, _tsx = _tsx_packet(tmp_path, reviewed_hash="a" * 64)
    p["reviewer"]["reviewed_hashes"] = {"../outside/scene-1.tsx": "a" * 64}
    res = integrate_scene_packet(p, packet_path=tmp_path / "p.json",
                                 writer_token="wt", reviewer_token="rt")
    codes = [r["code"] for r in res["reasons"]]
    assert "reviewed_scene_path_escape" in codes
