import hashlib, json
from pathlib import Path
from tools.qc.episode_gate import _check_scene_tsx_provenance, _check_composition_dims, _episode_compositions


def _pkt(root, sid, verdict="approved", reviewed=None):
    tsx = root / "scene" / f"{sid}.tsx"
    tsx.parent.mkdir(parents=True, exist_ok=True)
    tsx.write_text(f"// {sid}\n")
    h = hashlib.sha256(tsx.read_bytes()).hexdigest()
    rh = reviewed if reviewed is not None else {f"scene/{sid}.tsx": h}
    (root / f"packet_{sid}.json").write_text(json.dumps({
        "packet_type": "openmontage.scene-packet", "scene_id": sid,
        "reviewer": {"verdict": verdict, "reviewed_hashes": rh},
    }))
    return tsx


def codes(reasons):
    return [r["code"] for r in reasons]


def test_provenance_ok(tmp_path):
    _pkt(tmp_path, "scene-1")
    assert _check_scene_tsx_provenance(tmp_path) == []


def test_provenance_missing_packet(tmp_path):
    (tmp_path / "scene").mkdir(parents=True)
    (tmp_path / "scene" / "scene-1.tsx").write_text("// x")
    assert codes(_check_scene_tsx_provenance(tmp_path)) == ["scene_provenance_missing"]


def test_provenance_not_approved(tmp_path):
    _pkt(tmp_path, "scene-1", verdict="rejected")
    assert codes(_check_scene_tsx_provenance(tmp_path)) == ["scene_provenance_not_approved"]


def test_provenance_unbound(tmp_path):
    _pkt(tmp_path, "scene-1", reviewed={"scene/other.tsx": "deadbeef"})
    assert codes(_check_scene_tsx_provenance(tmp_path)) == ["scene_provenance_unbound"]


def test_provenance_stale_after_hand_edit(tmp_path):
    tsx = _pkt(tmp_path, "scene-1")
    tsx.write_text("// hand-edited after review\n")
    assert codes(_check_scene_tsx_provenance(tmp_path)) == ["scene_provenance_stale"]


def test_legacy_single_file_lane_skipped(tmp_path):
    (tmp_path / "Episode.tsx").write_text("// single-file episode")
    assert _check_scene_tsx_provenance(tmp_path) == []


def _register_root(src, slug, comps):
    parts = []
    for cid, w, h in comps:
        parts.append(
            '<Composition id="%s" component={X} durationInFrames={100} fps={30} '
            'width={%d} height={%d} defaultProps={{ hud: false }} />' % (cid, w, h)
        )
    (src / "Root.tsx").write_text("export const R = () => (<>%s</>);" % "\n".join(parts))


def test_dims_mismatch_caught(tmp_path):
    src = tmp_path / "src"
    ep = src / "my-slug"
    ep.mkdir(parents=True)
    _register_root(src, "my-slug", [("my-slug-DRAFT", 720, 1280), ("my-slug-FINAL", 1080, 1920)])
    assert codes(_check_composition_dims(ep)) == ["composition_dims_mismatch"]


def test_dims_consistent_ok(tmp_path):
    src = tmp_path / "src"
    ep = src / "my-slug"
    ep.mkdir(parents=True)
    _register_root(src, "my-slug", [("my-slug-DRAFT", 1080, 1920), ("my-slug-FINAL", 1080, 1920)])
    assert _check_composition_dims(ep) == []


def test_dims_other_episodes_ignored(tmp_path):
    src = tmp_path / "src"
    ep = src / "my-slug"
    ep.mkdir(parents=True)
    _register_root(src, "my-slug", [("my-slug-DRAFT", 1080, 1920), ("other-slug-DRAFT", 720, 1280)])
    assert _check_composition_dims(ep) == []
    assert len(_episode_compositions(ep)) == 2
