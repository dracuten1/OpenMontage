"""Wave1 P0-2 item 2 — reviewer_pass.py may ONLY backfill provenance from
on-disk evidence, never mint unverified provenance.

The lead-pass tool (projects/tin-nong-5tin-20261115/scripts/cc_pipeline/
reviewer_pass.py) previously synthesized ``reviewed_hashes`` from the CURRENT
on-disk hash and fabricated reviewer tokens unrelated to any evidence. These
tests pin the evidence-only contract:
- no reviewer-produced reviewed_hashes in findings -> refuse integration;
- reviewer hash differing from on-disk -> refuse;
- matching evidence -> reviewer block backfilled from the findings file,
  identity derived from the findings bytes, frozen provenance re-pointed at
  the new findings evidence, writer identity untouched.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
REVIEWER_PASS = REPO_ROOT / "projects/tin-nong-5tin-20261115/scripts/cc_pipeline/reviewer_pass.py"


def load_reviewer_pass():
    spec = importlib.util.spec_from_file_location("reviewer_pass_under_test", REVIEWER_PASS)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["reviewer_pass_under_test"] = mod
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture()
def rp(tmp_path):
    """Module instance with its episode/project globals pointed at tmp dirs."""
    mod = load_reviewer_pass()
    episode = tmp_path / "episode"
    episode.mkdir()
    mod.EPISODE = episode
    mod.PACKETS_DIR = episode / "packets"
    mod.PROJ = tmp_path / "proj"
    (mod.PROJ / "artifacts").mkdir(parents=True)  # production layout has artifacts/
    return mod


def seed_packet(episode: Path, scene_id: str = "scene-1") -> Path:
    pkt_path = episode / f"packet_{scene_id}.json"
    pkt_path.write_text(json.dumps({
        "packet_type": "openmontage.scene-packet",
        "scene_id": scene_id,
        "writer": {"instance_id": "writer_scene-1_orig", "timestamp": "t", "token": "wt_orig"},
        "writer_token": "wt_orig",
        "reviewer": {"instance_id": "", "verdict": "pending"},
        "reviewer_token": "",
        "integration_status": "pending",
        "frozen_inputs": {},
    }, indent=2), encoding="utf-8")
    return pkt_path


def seed_scene_file(rp, scene_id: str = "scene-1", content: str = "// v1\n") -> tuple[Path, str]:
    scenes = rp.EPISODE / "scenes"
    scenes.mkdir(parents=True, exist_ok=True)
    tsx = scenes / f"{scene_id}.tsx"
    tsx.write_text(content, encoding="utf-8")
    return tsx, hashlib.sha256(tsx.read_bytes()).hexdigest()


def test_refuses_when_findings_carry_no_reviewed_hashes(rp, capsys):
    seed_packet(rp.EPISODE)
    seed_scene_file(rp)
    assert rp.integrate("scene-1", "approved", {"verdict": "approved", "reviewed_hashes": {}}) is False
    out = capsys.readouterr().out
    assert "NO REVIEWER reviewed_hashes BINDING" in out
    pkt = json.loads((rp.EPISODE / "packet_scene-1.json").read_text(encoding="utf-8"))
    assert pkt["integration_status"] == "pending"  # untouched


def test_refuses_when_findings_are_none(rp):
    seed_packet(rp.EPISODE)
    seed_scene_file(rp)
    assert rp.integrate("scene-1", "approved", None) is False


def test_refuses_when_reviewer_bound_other_content(rp, capsys):
    seed_packet(rp.EPISODE)
    _tsx, on_disk = seed_scene_file(rp)
    findings = {"verdict": "approved", "reviewed_hashes": {"scenes/scene-1.tsx": "f" * 64}}
    assert rp.integrate("scene-1", "approved", findings) is False
    assert "HASH MISMATCH" in capsys.readouterr().out


def test_backfills_from_matching_evidence(rp):
    pkt_path = seed_packet(rp.EPISODE)
    _tsx, on_disk = seed_scene_file(rp)
    findings = {
        "verdict": "approved",
        "reviewed_hashes": {"scenes/scene-1.tsx": on_disk},
        "issues": [],
    }
    assert rp.integrate("scene-1", "approved", findings) is True

    pkt = json.loads(pkt_path.read_text(encoding="utf-8"))
    # binding comes from the REVIEWER's findings map — never re-synthesized
    assert pkt["reviewer"]["reviewed_hashes"] == {"scenes/scene-1.tsx": on_disk}
    assert pkt["reviewer"]["verdict"] == "approved"
    # identity derived from the findings evidence bytes, not a bare fabrication
    assert pkt["reviewer"]["instance_id"] == "reviewer_scene-1_leadpass"
    assert pkt["reviewer_token"].startswith("rt_scene-1_leadpass_")
    findings_bytes = (rp.PACKETS_DIR / "scene-1_findings.json").read_bytes()
    digest = hashlib.sha256(findings_bytes).hexdigest()
    assert pkt["reviewer_token"].endswith(digest[:12])
    assert pkt["reviewer"]["findings_hash"] == hashlib.sha256(findings_bytes).hexdigest()
    # frozen provenance re-pointed at the new findings evidence; writer
    # identity backfilled from the packet's own writer block
    prov = pkt["frozen_inputs"]["_provenance"]
    assert prov["writer_instance_id"] == "writer_scene-1_orig"
    assert prov["writer_token"] == "wt_orig"
    assert prov["findings_hash"] == pkt["reviewer"]["findings_hash"]
    assert pkt["integration_status"] == "integrated"


def test_backfill_never_invents_writer_identity(rp):
    """A packet without a writer block gets empty writer provenance strings,
    NOT fabricated ones — the downstream gate rejects empties (fail-closed)."""
    pkt_path = seed_packet(rp.EPISODE)
    pkt = json.loads(pkt_path.read_text(encoding="utf-8"))
    del pkt["writer"]
    del pkt["writer_token"]
    pkt_path.write_text(json.dumps(pkt), encoding="utf-8")
    _tsx, on_disk = seed_scene_file(rp)
    findings = {"verdict": "approved", "reviewed_hashes": {"scenes/scene-1.tsx": on_disk}}
    assert rp.integrate("scene-1", "approved", findings) is True
    pkt = json.loads(pkt_path.read_text(encoding="utf-8"))
    prov = pkt["frozen_inputs"]["_provenance"]
    assert prov["writer_instance_id"] == ""
    assert prov["writer_token"] == ""


def test_packet_missing_refuses(rp):
    assert rp.integrate("scene-1", "approved", {"reviewed_hashes": {}}) is False


# ------------------------------------------------------------------------------
# Wave1 security cycle-1 CRITICAL-1 — verify-on-disk + non-empty evidence gates
# ------------------------------------------------------------------------------

def test_refuses_when_scene_file_missing_on_disk(rp, capsys):
    """A missing scene .tsx can never be hash-verified: integrate must refuse
    EXPLICITLY (False + printed reason), not crash with FileNotFoundError
    from sha256() (the pre-CRITICAL-1 behavior)."""
    seed_packet(rp.EPISODE)
    # NO scene file seeded on disk
    findings = {"verdict": "approved", "reviewed_hashes": {"scenes/scene-1.tsx": "a" * 64}}
    assert rp.integrate("scene-1", "approved", findings) is False
    out = capsys.readouterr().out
    assert "SCENE FILE MISSING" in out
    pkt = json.loads((rp.EPISODE / "packet_scene-1.json").read_text(encoding="utf-8"))
    assert pkt["integration_status"] == "pending"  # untouched


def test_refuses_when_evidence_findings_hash_empty(rp, capsys):
    """An explicitly-present-but-EMPTY findings_hash in the evidence entry is
    incomplete/tampered evidence — refuse instead of backfilling provenance
    (CRITICAL-1: evidence must carry BOTH non-empty bindings)."""
    seed_packet(rp.EPISODE)
    _tsx, on_disk = seed_scene_file(rp)
    findings = {
        "verdict": "approved",
        "reviewed_hashes": {"scenes/scene-1.tsx": on_disk},
        "findings_hash": "",
    }
    assert rp.integrate("scene-1", "approved", findings) is False
    out = capsys.readouterr().out
    assert "EMPTY findings_hash in evidence entry" in out
    pkt = json.loads((rp.EPISODE / "packet_scene-1.json").read_text(encoding="utf-8"))
    assert "frozen_inputs" in pkt and pkt["frozen_inputs"].get("_provenance") is None


def test_refuses_when_reviewer_entry_hash_is_empty_string(rp, capsys):
    """A reviewed_hashes entry bound to the empty string is no binding at all
    — refuse (never integrate on an empty hash claim)."""
    seed_packet(rp.EPISODE)
    seed_scene_file(rp)
    findings = {"verdict": "approved", "reviewed_hashes": {"scenes/scene-1.tsx": ""}}
    assert rp.integrate("scene-1", "approved", findings) is False
    assert "NO REVIEWER reviewed_hashes BINDING" in capsys.readouterr().out


def test_backfill_writes_nonempty_provenance_bindings(rp):
    """CRITICAL-1 invariant: the _provenance backfill always lands with BOTH
    a non-empty findings_hash AND the verified reviewed_hashes scene hash."""
    pkt_path = seed_packet(rp.EPISODE)
    _tsx, on_disk = seed_scene_file(rp)
    findings = {"verdict": "approved", "reviewed_hashes": {"scenes/scene-1.tsx": on_disk}}
    assert rp.integrate("scene-1", "approved", findings) is True
    pkt = json.loads(pkt_path.read_text(encoding="utf-8"))
    prov = pkt["frozen_inputs"]["_provenance"]
    assert prov["findings_hash"] == hashlib.sha256(
        (rp.PACKETS_DIR / "scene-1_findings.json").read_bytes()).hexdigest()
    assert len(prov["findings_hash"]) == 64
