import json
import pytest
from lib.production_provenance import (compute_scene_fingerprint, compute_stage_fingerprint, hash_bytes, hash_json_data,
    verify_provenance_freshness, detect_stale_dependencies)
from lib.production_validation import (EvidenceRecord, ProductionValidationReport, ValidationStatus,
    validate_checkpoint_production_gate, ProductionValidationError, recompute_checkpoint_fingerprint)


def test_canonical_hashing():
    assert hash_json_data({"a": 1, "b": 2}) == hash_json_data({"b": 2, "a": 1})
    left = {"outer": {"middle": {"leaf": "xin chào 🌍", "none": None}}, "empty_dict": {}, "empty_list": []}
    right = {"empty_list": [], "empty_dict": {}, "outer": {"middle": {"none": None, "leaf": "xin chào 🌍"}}}
    assert hash_json_data(left) == hash_json_data(right)
    assert hash_json_data(left) != hash_json_data({**right, "outer": {"middle": {"none": None, "leaf": "xin chào 🌎"}}})
    assert hash_bytes(b"a") != hash_bytes(b"b")


def test_missing_required_upstream_is_stale():
    audio = compute_stage_fingerprint("audio", {})
    results = detect_stale_dependencies({"audio": audio}, {"audio": ["script"]})
    assert not results["audio"].is_fresh
    assert any("upstream dependency script missing" in reason for reason in results["audio"].stale_reasons)


def test_identical_duration_audio_byte_swap_is_stale():
    old = compute_stage_fingerprint("audio", {"s1": compute_scene_fingerprint("s1", audio_path_or_bytes=b"a" * 1000)})
    new = compute_stage_fingerprint("audio", {"s1": compute_scene_fingerprint("s1", audio_path_or_bytes=b"b" * 1000)})
    result = verify_provenance_freshness(new, old)
    assert not result.is_fresh
    assert any("audio_bytes" in reason for reason in result.stale_reasons)


def test_upstream_mutation_cascades_and_history_remains():
    script_old = compute_stage_fingerprint("script", {"s1": compute_scene_fingerprint("s1", text="old")})
    script_new = compute_stage_fingerprint("script", {"s1": compute_scene_fingerprint("s1", text="new")})
    historical = script_old.to_dict()
    stale = verify_provenance_freshness(script_new, script_old)
    downstream = {name: compute_stage_fingerprint(name, {}) for name in ("audio", "alignment", "compose")}
    results = detect_stale_dependencies({"script": script_new, **downstream}, {"audio": ["script"], "alignment": ["audio", "script"], "compose": ["alignment", "audio"]}, {"script": script_old})
    assert not stale.is_fresh
    assert all(not results[name].is_fresh for name in ("audio", "alignment", "compose"))
    assert historical["scene_fingerprints"]["s1"]["text_sha256"] != script_new.scene_fingerprints["s1"].text_sha256


def test_visual_and_alignment_mutations_are_stale(tmp_path):
    asset = tmp_path / "image.png"
    asset.write_bytes(b"one")
    old = compute_stage_fingerprint("compose", {"s1": compute_scene_fingerprint("s1", visual_asset_paths_or_hashes=[asset], alignment_config={"rate": 1})})
    asset.write_bytes(b"two")
    new = compute_stage_fingerprint("compose", {"s1": compute_scene_fingerprint("s1", visual_asset_paths_or_hashes=[asset], alignment_config={"rate": 2})})
    result = verify_provenance_freshness(new, old)
    assert not result.is_fresh
    assert any("visual_assets" in x for x in result.stale_reasons)
    assert any("alignment_config" in x for x in result.stale_reasons)


def test_validation_fingerprint_round_trip_and_stale_gate(tmp_path):
    rec = EvidenceRecord("gate", "compose", ValidationStatus.PASS, fingerprint="abc")
    assert EvidenceRecord.from_dict(rec.to_dict()).fingerprint == "abc"
    report = ProductionValidationReport("p", "pipeline", records=[rec], fingerprint="fp")
    assert ProductionValidationReport.from_dict(report.to_dict()).fingerprint == "fp"
    checkpoint, recorded = build_provenance_artifacts(tmp_path, ["s1"])
    audio = tmp_path / "p" / "assets" / "s1.wav"
    audio.write_bytes(b"audio-mutated")
    checkpoint["metadata"].update({"validation_mode":"strict", "recorded_fingerprints":recorded.to_dict(), "stage_fingerprint":{"current":recorded.to_dict(), "recorded":recorded.to_dict()},
        "production_validation_report":{"status":"pass", "project_id":"p", "pipeline_type":"pipeline", "mode":"strict",
        "records":[EvidenceRecord("gate", "compose", ValidationStatus.PASS, scene_coverage=["s1"], expected_scenes=["s1"]).to_dict()]}})
    with pytest.raises(ProductionValidationError, match="audio_bytes changed"):
        validate_checkpoint_production_gate(checkpoint, pipeline_dir=tmp_path)

@pytest.mark.parametrize("shape", [
    pytest.param([], id="empty-list"), pytest.param({"is_fresh": True}, id="missing-freshness-fields"),
    pytest.param("", id="empty-string"), pytest.param(None, id="none-shape"), pytest.param({}, id="empty-dict"),
    pytest.param({"is_fresh": "yes"}, id="truthy-string"),
    pytest.param({"is_fresh": 1}, id="integer-bool"), pytest.param({"is_fresh": None}, id="null-bool"),
    pytest.param({"is_fresh": "true"}, id="string-bool"),
    pytest.param({"is_fresh": True, "unexpected": {}}, id="unknown-top-level"),
    pytest.param({"scene_fingerprints": {"s": []}}, id="unknown-nested-shape"),
    pytest.param({"current": {}, "recorded": {}, "extra": 1}, id="pair-extra-key"),
])
def test_strict_gate_rejects_malformed_provenance_shapes(shape):
    valid_report = {"status": "pass", "project_id": "p", "pipeline_type": "pipeline", "mode": "strict", "records": [
        EvidenceRecord("gate", "compose", ValidationStatus.PASS, scene_coverage=["s1"], expected_scenes=["s1"]).to_dict()]}
    checkpoint = {"stage": "compose", "status": "completed", "project_id": "p", "metadata": {
        "validation_mode": "strict", "stage_fingerprint": shape, "production_validation_report": valid_report,
        "edit_decisions": {"cuts": [{"id": "s1"}]}}}
    with pytest.raises(ProductionValidationError):
        validate_checkpoint_production_gate(checkpoint)

@pytest.mark.parametrize("freshness", [
    pytest.param({"is_fresh": True, "stale_stages": [], "stale_reasons": [], "mismatched_fingerprints": {"x": {"scene": {}}}}, id="fresh-with-mismatches"),
    pytest.param({"is_fresh": True, "stale_stages": [], "stale_reasons": ["stale"], "mismatched_fingerprints": {}}, id="fresh-with-reasons"),
    pytest.param({"is_fresh": False, "stale_stages": [], "stale_reasons": [], "mismatched_fingerprints": {}}, id="stale-without-evidence"),
    pytest.param({"is_fresh": True, "stale_stages": [], "stale_reasons": [], "mismatched_fingerprints": {"x": "garbage"}}, id="mismatch-string-value"),
    pytest.param({"is_fresh": True, "stale_stages": [], "stale_reasons": [], "mismatched_fingerprints": {"x": [1, 2]}}, id="mismatch-list-value"),
    pytest.param({"is_fresh": True, "stale_stages": [], "stale_reasons": [1, 2], "mismatched_fingerprints": {}}, id="reason-non-string"),
])
def test_strict_gate_rejects_malformed_freshness_result(freshness):
    valid_report = {"status": "pass", "project_id": "p", "pipeline_type": "pipeline", "mode": "strict", "records": [
        EvidenceRecord("gate", "compose", ValidationStatus.PASS, scene_coverage=["s1"], expected_scenes=["s1"]).to_dict()]}
    checkpoint = {"stage": "compose", "status": "completed", "project_id": "p", "metadata": {
        "validation_mode": "strict", "stage_fingerprint": freshness, "production_validation_report": valid_report,
        "edit_decisions": {"cuts": [{"id": "s1"}]}}}
    with pytest.raises(ProductionValidationError):
        validate_checkpoint_production_gate(checkpoint)


def test_strict_gate_valid_stale_freshness_result_rejected_as_stale(tmp_path):
    checkpoint, baseline = build_provenance_artifacts(tmp_path, ["s1"])
    (tmp_path / "p" / "assets" / "s1.wav").write_bytes(b"stale-audio")
    checkpoint["metadata"].update({"validation_mode":"strict", "recorded_fingerprints":baseline.to_dict(), "stage_fingerprint":{"is_fresh":False,"stale_stages":["compose"],"stale_reasons":["audio_bytes changed"],"mismatched_fingerprints":{}}, "production_validation_report":{"status":"pass", "project_id":"p", "pipeline_type":"pipeline", "mode":"strict", "records":[EvidenceRecord("gate", "compose", ValidationStatus.PASS, scene_coverage=["s1"], expected_scenes=["s1"]).to_dict()]}})
    with pytest.raises(ProductionValidationError, match="recomputed stale provenance"):
        validate_checkpoint_production_gate(checkpoint, pipeline_dir=tmp_path)

@pytest.mark.parametrize("field", ["events_data", "composition_deps"])
def test_events_and_composition_dependencies_are_fingerprinted(field):
    kwargs = {field: {"value": "old"}}
    old = compute_scene_fingerprint("s", **kwargs)
    kwargs[field] = {"value": "new"}
    new = compute_scene_fingerprint("s", **kwargs)
    assert old.composite_sha256 != new.composite_sha256
    result = verify_provenance_freshness(compute_stage_fingerprint("compose", {"s": new}), compute_stage_fingerprint("compose", {"s": old}))
    assert not result.is_fresh
    expected = "events" if field == "events_data" else "composition_deps"
    assert any(expected in reason for reason in result.stale_reasons)

def test_caller_supplied_dag_scopes_staleness_to_dependents():
    old_a = compute_stage_fingerprint("A", {"s": compute_scene_fingerprint("s", text="old")})
    new_a = compute_stage_fingerprint("A", {"s": compute_scene_fingerprint("s", text="new")})
    b = compute_stage_fingerprint("B", {})
    c = compute_stage_fingerprint("C", {})
    # Dependency graph is caller-supplied; only declared downstream stages inherit staleness.
    results = detect_stale_dependencies({"A": new_a, "B": b, "C": c}, {"B": ["A"]}, {"A": old_a})
    assert not results["A"].is_fresh and not results["B"].is_fresh
    assert results["C"].is_fresh


def build_provenance_artifacts(project_root, scene_ids, *, audio=b"audio-original"):
    import json
    from pathlib import Path
    from lib.production_validation import _compute_checkpoint_stage_fingerprint
    project_root = Path(project_root)
    artifact_dir = project_root / "p" / "artifacts"
    artifact_dir.mkdir(parents=True, exist_ok=True)
    audio_path = project_root / "p" / "assets" / "s1.wav"
    audio_path.parent.mkdir(parents=True, exist_ok=True)
    audio_path.write_bytes(audio)
    script = {"sections": [{"id": sid, "text": f"text-{sid}"} for sid in scene_ids]}
    timing = {sid: {"start": i, "end": i + 1} for i, sid in enumerate(scene_ids)}
    manifest = {"assets": [{"id": f"a-{sid}", "type": "narration", "path": "assets/s1.wav", "scene_id": sid} for sid in scene_ids]}
    for name, data in (("script.json", script), ("scene_timing.json", timing), ("asset_manifest.json", manifest)):
        (artifact_dir / name).write_text(json.dumps(data))
    checkpoint = {"stage": "compose", "status": "completed", "project_id": "p", "metadata": {"edit_decisions": {"cuts": [{"id": sid} for sid in scene_ids]}}}
    return checkpoint, _compute_checkpoint_stage_fingerprint(checkpoint, project_root, "p")


def test_strict_gate_emitted_report_fingerprint_roundtrip_and_audio_mutation(tmp_path):
    import json
    from lib.production_validation import validate_post_render

    project = tmp_path / "p"
    artifact_dir = project / "artifacts"
    artifact_dir.mkdir(parents=True)
    (project / "assets").mkdir()
    audio = project / "assets" / "voice.wav"
    audio.write_bytes(b"audio-one")
    for name, data in (
        ("script.json", {"sections": [{"id": "s1", "text": "hello"}]}),
        ("scene_timing.json", {"s1": {"start": 0, "end": 1}}),
        ("asset_manifest.json", {"assets": [{"type": "narration", "path": "assets/voice.wav", "scene_id": "s1"}]}),
    ):
        (artifact_dir / name).write_text(json.dumps(data))
    output = tmp_path / "render.mp4"
    output.write_bytes(b"render")
    report = validate_post_render(project, output, {"status": "pass"})
    report.records[0].scene_coverage = ["s1"]
    report.records[0].expected_scenes = ["s1"]
    baseline = report.metadata["stage_fingerprints"]["compose"]
    assert baseline == __import__("lib.production_validation", fromlist=["recompute_checkpoint_fingerprint"]).recompute_checkpoint_fingerprint(
        {"stage": "compose", "metadata": {}}, tmp_path, "p"
    ).to_dict()
    checkpoint = {"stage": "compose", "status": "completed", "project_id": "p", "metadata": {
        "validation_mode": "strict", "edit_decisions": {"cuts": [{"id": "s1"}]},
        "production_validation_report": report.to_dict()}}
    validate_checkpoint_production_gate(checkpoint, pipeline_dir=tmp_path)
    audio.write_bytes(b"audio-two")
    with pytest.raises(ProductionValidationError, match="audio_bytes changed"):
        validate_checkpoint_production_gate(checkpoint, pipeline_dir=tmp_path)


def test_strict_gate_missing_required_artifact_fails_closed(tmp_path):
    report = {"status": "pass", "project_id": "p", "pipeline_type": "pipeline", "mode": "strict", "records": [
        EvidenceRecord("gate", "compose", ValidationStatus.PASS, scene_coverage=["s1"], expected_scenes=["s1"]).to_dict()]}
    checkpoint = {"stage": "compose", "status": "completed", "project_id": "p", "metadata": {
        "validation_mode": "strict", "recorded_fingerprints": compute_stage_fingerprint("compose", {"s1": compute_scene_fingerprint("s1")}).to_dict(),
        "production_validation_report": report, "edit_decisions": {"cuts": [{"id": "s1"}]}}}
    with pytest.raises(ProductionValidationError, match="artifacts directory missing|script.json"):
        validate_checkpoint_production_gate(checkpoint, pipeline_dir=tmp_path)


def test_legacy_report_only_ignores_stale_artifacts_and_verdict(tmp_path):
    checkpoint, baseline = build_provenance_artifacts(tmp_path, ["s1"])
    (tmp_path / "p" / "assets" / "s1.wav").write_bytes(b"changed")
    checkpoint["metadata"].update({"validation_mode": "legacy", "recorded_fingerprints": baseline.to_dict(),
        "provenance_freshness": {"is_fresh": True, "stale_stages": [], "stale_reasons": [], "mismatched_fingerprints": {}},
        "production_validation_report": {"status": "pass", "project_id": "p", "pipeline_type": "pipeline", "mode": "legacy", "records": [
            EvidenceRecord("gate", "compose", ValidationStatus.PASS, scene_coverage=["s1"], expected_scenes=["s1"]).to_dict()]}})
    validate_checkpoint_production_gate(checkpoint, pipeline_dir=tmp_path)


def test_pair_current_forgery_rejected_against_recomputed_artifacts(tmp_path):
    checkpoint, baseline = build_provenance_artifacts(tmp_path, ["s1"])
    forged = compute_stage_fingerprint("compose", {"s1": compute_scene_fingerprint("s1", text="forged")})
    checkpoint["metadata"].update({"validation_mode": "strict", "stage_fingerprint": {"current": forged.to_dict(), "recorded": baseline.to_dict()},
        "production_validation_report": {"status": "pass", "project_id": "p", "pipeline_type": "pipeline", "mode": "strict", "records": [
            EvidenceRecord("gate", "compose", ValidationStatus.PASS, scene_coverage=["s1"], expected_scenes=["s1"]).to_dict()]}})
    with pytest.raises(ProductionValidationError, match="provided current contradicts recomputed current"):
        validate_checkpoint_production_gate(checkpoint, pipeline_dir=tmp_path)


def test_f5_narration_swap_with_later_sfx_fails_freshness(tmp_path):
    project = tmp_path / "proj"
    artifacts = project / "artifacts"
    assets = project / "assets"
    artifacts.mkdir(parents=True)
    assets.mkdir(parents=True)

    voice = assets / "voice.wav"
    voice.write_bytes(b"original-narration-bytes-version-1")
    sfx = assets / "hit.wav"
    sfx.write_bytes(b"sfx-hit-bytes-constant")

    (artifacts / "script.json").write_text(json.dumps({"sections": [{"id": "s1", "text": "hello"}]}))
    (artifacts / "scene_timing.json").write_text(json.dumps({"s1": {"start": 0, "end": 2}}))
    (artifacts / "asset_manifest.json").write_text(json.dumps({
        "assets": [
            {"id": "a1", "type": "narration", "path": "assets/voice.wav", "scene_id": "s1", "duration_seconds": 2.0},
            {"id": "a2", "type": "sfx", "path": "assets/hit.wav", "scene_id": "s1", "duration_seconds": 0.5},
        ]
    }))

    ckpt = {"stage": "compose", "status": "completed", "project_id": "proj", "metadata": {"edit_decisions": {"cuts": [{"id": "s1"}]}}}
    baseline = recompute_checkpoint_fingerprint(ckpt, tmp_path, "proj")

    # Same-duration narration replacement
    voice.write_bytes(b"replaced-narration-bytes-version-2")
    current = recompute_checkpoint_fingerprint(ckpt, tmp_path, "proj")

    freshness = verify_provenance_freshness(current, baseline)
    assert not freshness.is_fresh
    assert any("audio" in r or "narration" in r for r in freshness.stale_reasons)


def test_f5_tsx_and_config_mutation_detected(tmp_path):
    project = tmp_path / "proj"
    artifacts = project / "artifacts"
    assets = project / "assets"
    artifacts.mkdir(parents=True)
    assets.mkdir(parents=True)

    voice = assets / "voice.wav"
    voice.write_bytes(b"voice-bytes")
    tsx_file = project / "Episode.tsx"
    tsx_file.write_text("export const Episode = () => <div>v1</div>;")
    config_file = project / "mix_profile.json"
    config_file.write_text(json.dumps({"version": 1, "target_lufs": -16}))

    (artifacts / "script.json").write_text(json.dumps({"sections": [{"id": "s1", "text": "hello"}]}))
    (artifacts / "scene_timing.json").write_text(json.dumps({"s1": {"start": 0, "end": 2}}))
    (artifacts / "asset_manifest.json").write_text(json.dumps({
        "assets": [
            {"id": "a1", "type": "narration", "path": "assets/voice.wav", "scene_id": "s1", "duration_seconds": 2.0},
        ]
    }))

    ckpt = {"stage": "compose", "status": "completed", "project_id": "proj", "metadata": {"edit_decisions": {"cuts": [{"id": "s1"}]}}}
    baseline = recompute_checkpoint_fingerprint(ckpt, tmp_path, "proj")

    # Mutate TSX
    tsx_file.write_text("export const Episode = () => <div>v2-mutated</div>;")
    current_tsx_mutated = recompute_checkpoint_fingerprint(ckpt, tmp_path, "proj")
    freshness_tsx = verify_provenance_freshness(current_tsx_mutated, baseline)
    assert not freshness_tsx.is_fresh
    assert any("composition_deps" in r for r in freshness_tsx.stale_reasons)

    # Restore TSX, mutate config
    tsx_file.write_text("export const Episode = () => <div>v1</div>;")
    config_file.write_text(json.dumps({"version": 2, "target_lufs": -14}))
    current_config_mutated = recompute_checkpoint_fingerprint(ckpt, tmp_path, "proj")
    freshness_config = verify_provenance_freshness(current_config_mutated, baseline)
    assert not freshness_config.is_fresh
    assert any("composition_deps" in r for r in freshness_config.stale_reasons)


def test_f5_staged_audio_mutation_detected(tmp_path):
    project = tmp_path / "stems-proj"
    artifacts = project / "artifacts"
    assets = project / "assets"
    stems = project / "audio_stems"
    artifacts.mkdir(parents=True)
    assets.mkdir(parents=True)
    stems.mkdir(parents=True)

    voice = assets / "voice.wav"
    voice.write_bytes(b"voice-bytes")
    stem_mix = stems / "mix.wav"
    stem_mix.write_bytes(b"mix-wav-bytes-v1")

    (artifacts / "script.json").write_text(json.dumps({"sections": [{"id": "s1", "text": "hello"}]}))
    (artifacts / "scene_timing.json").write_text(json.dumps({"s1": {"start": 0, "end": 2}}))
    (artifacts / "asset_manifest.json").write_text(json.dumps({
        "assets": [
            {"id": "a1", "type": "narration", "path": "assets/voice.wav", "scene_id": "s1", "duration_seconds": 2.0},
        ]
    }))

    ckpt = {"stage": "compose", "status": "completed", "project_id": "stems-proj", "metadata": {"edit_decisions": {"cuts": [{"id": "s1"}]}}}
    baseline = recompute_checkpoint_fingerprint(ckpt, tmp_path, "stems-proj")

    # Mutate staged audio stem
    stem_mix.write_bytes(b"mix-wav-bytes-v2-mutated")
    current = recompute_checkpoint_fingerprint(ckpt, tmp_path, "stems-proj")
    freshness = verify_provenance_freshness(current, baseline)
    assert not freshness.is_fresh
    assert any("composition_deps" in r for r in freshness.stale_reasons)


def test_f5_upstream_mutation_keeps_history_and_fails_current(tmp_path):
    checkpoint, baseline = build_provenance_artifacts(tmp_path, ["s1"])
    # Record baseline as historical approval in checkpoint metadata
    checkpoint["metadata"].update({
        "validation_mode": "strict",
        "recorded_fingerprints": baseline.to_dict(),
        "stage_fingerprint": {"current": baseline.to_dict(), "recorded": baseline.to_dict()},
        "production_validation_report": {
            "status": "pass",
            "project_id": "p",
            "pipeline_type": "pipeline",
            "mode": "strict",
            "records": [
                EvidenceRecord("layout", "compose", ValidationStatus.PASS, scene_coverage=["s1"], expected_scenes=["s1"]).to_dict()
            ],
        },
    })
    # Verify baseline passes initially
    validate_checkpoint_production_gate(checkpoint, pipeline_dir=tmp_path)

    # Mutate script text upstream (same audio, but script changed)
    script_path = tmp_path / "p" / "artifacts" / "script.json"
    script_path.write_text(json.dumps({"sections": [{"id": "s1", "text": "mutated-text"}]}))

    # Current recomputed will mismatch historical recorded_fingerprints
    with pytest.raises(ProductionValidationError, match="recomputed stale provenance|provided current contradicts recomputed current"):
        validate_checkpoint_production_gate(checkpoint, pipeline_dir=tmp_path)

    # Historical recorded approval remains recorded and unmutated in metadata
    assert checkpoint["metadata"]["recorded_fingerprints"] == baseline.to_dict()


