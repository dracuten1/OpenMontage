import json
from pathlib import Path
import pytest

from lib.production_validation import (
    ValidationStatus,
    EvidenceRecord,
    ProductionValidationReport,
    validate_pre_render,
    validate_post_render,
    validate_checkpoint_production_gate,
    resolve_validation_mode,
    ProductionValidationError,
    create_evidence_record,
    GATE_LAYOUT,
    GATE_TIMING_AUDIO,
    GATE_SEMANTIC_EVENTS,
    GATE_SFX_MIX,
    GATE_PROVENANCE_FRESHNESS,
    VALID_PRE_RENDER_GATES,
)


def _strict_completion_report(records=None):
    return ProductionValidationReport(
        project_id="test-proj",
        pipeline_type="animated-explainer",
        mode="strict",
        records=records or [
            EvidenceRecord(
                gate_name="compose_evidence",
                scope="compose",
                status=ValidationStatus.PASS,
                scene_coverage=["scene-1", "scene-2", "scene-3", "scene-4"],
                expected_scenes=["scene-1", "scene-2", "scene-3", "scene-4"],
            )
        ],
    )


def test_strict_completion_requires_authoritative_scene_set():
    report = _strict_completion_report()
    assert not report.can_complete("compose")
    assert report.can_complete("compose", authoritative_scenes=["scene-1", "scene-2", "scene-3", "scene-4"])


def test_forged_subset_expected_scenes_rejected():
    record = EvidenceRecord(
        gate_name="compose_evidence",
        scope="compose",
        status=ValidationStatus.PASS,
        scene_coverage=["scene-1"],
        expected_scenes=["scene-1"],
    )
    report = _strict_completion_report([record])
    assert not report.can_complete(
        "compose", authoritative_scenes=["scene-1", "scene-2", "scene-3", "scene-4"]
    )


def test_mismatched_expected_sets_between_records_rejected():
    records = [
        EvidenceRecord("one", "compose", ValidationStatus.PASS,
                       scene_coverage=["s1"], expected_scenes=["s1", "s2"]),
        EvidenceRecord("two", "post_render", ValidationStatus.PASS,
                       scene_coverage=["s2"], expected_scenes=["s1"]),
    ]
    assert not _strict_completion_report(records).can_complete(
        "compose", authoritative_scenes=["s1", "s2"]
    )


def test_empty_expected_set_on_one_record_rejected():
    records = [
        EvidenceRecord("one", "compose", ValidationStatus.PASS,
                       scene_coverage=["s1"], expected_scenes=["s1"]),
        EvidenceRecord("two", "post_render", ValidationStatus.PASS,
                       scene_coverage=["s2"], expected_scenes=[]),
    ]
    assert not _strict_completion_report(records).can_complete("compose", authoritative_scenes=["s1", "s2"])


def test_disjoint_partial_coverage_union_rejected():
    records = [
        EvidenceRecord("one", "compose", ValidationStatus.PASS,
                       scene_coverage=["s1"], expected_scenes=["s1", "s2", "s3"]),
        EvidenceRecord("two", "post_render", ValidationStatus.PASS,
                       scene_coverage=["s3"], expected_scenes=["s1", "s2", "s3"]),
    ]
    assert not _strict_completion_report(records).can_complete(
        "compose", authoritative_scenes=["s1", "s2", "s3"]
    )


def test_empty_status_rejected_in_both_modes(tmp_path, monkeypatch):
    from tools.video.video_compose import VideoCompose
    from tools.base_tool import ToolResult

    tool = VideoCompose()
    output = tmp_path / "output.mp4"
    output.write_bytes(b"video")
    for mode in ("strict", "legacy"):
        result = tool._enforce_render_completion(
            render_result=ToolResult(success=True, data={"production_validation_report": {"status": "pass"}}),
            final_review={"production_validation_report": {"status": "pass"}},
            output_path=output,
            mode=mode,
            renderer_name="test",
        )
        assert not result.success
        assert "unknown status" in result.error.lower()


def test_absent_report_fails_strict_and_legacy_passes():
    from tools.video.video_compose import VideoCompose
    from tools.base_tool import ToolResult

    tool = VideoCompose()
    result = tool._enforce_render_completion(
        render_result=ToolResult(success=True, data={}),
        final_review={"status": "pass"},
        output_path=Path("/missing/output.mp4"),
        mode="strict",
        renderer_name="test",
    )
    assert not result.success
    assert "report missing" in result.error.lower()


def test_legacy_happy_path_still_completes():
    report = ProductionValidationReport(
        project_id="test-proj",
        pipeline_type="animated-explainer",
        mode="legacy",
        records=[EvidenceRecord("legacy", "compose", ValidationStatus.PASS)],
    )
    assert report.can_complete("compose")


    assert ValidationStatus.PASS.value == "pass"
    assert ValidationStatus.REVISE.value == "revise"
    assert ValidationStatus.BLOCKED.value == "blocked"
    assert ValidationStatus.NOT_MEASURED.value == "not_measured"


def test_missing_report_blocks_completion():
    report = ProductionValidationReport(
        project_id="test-proj",
        pipeline_type="editorial-explainer",
        mode="strict",
        records=[],
    )
    # Empty records in strict mode cannot complete
    assert report.status == ValidationStatus.BLOCKED
    assert not report.can_render()
    assert not report.can_complete("compose")
    assert any("no evidence records" in r.lower() for r in report.blocking_reasons)


def test_unmeasured_fields_cannot_pass_strict():
    rec = EvidenceRecord(
        gate_name="audio_spotcheck",
        scope="post_render",
        status=ValidationStatus.NOT_MEASURED,
        severity="critical",
        evidence_paths=[],
        scene_coverage=[],
        expected_scenes=["s01"],
        issues=["Narration presence unmeasured"],
    )
    report = ProductionValidationReport(
        project_id="test-proj",
        pipeline_type="editorial-explainer",
        mode="strict",
        records=[rec],
    )
    assert report.status == ValidationStatus.BLOCKED
    assert not report.can_complete("compose")


def test_swallowed_child_nonzero_blocks():
    rec = EvidenceRecord(
        gate_name="pre_render_layout",
        scope="pre_render",
        status=ValidationStatus.BLOCKED,
        severity="critical",
        evidence_paths=["/tmp/evidence.json"],
        scene_coverage=["s01"],
        expected_scenes=["s01"],
        issues=["Child process exited with code 1"],
    )
    report = ProductionValidationReport(
        project_id="test-proj",
        pipeline_type="editorial-explainer",
        mode="strict",
        records=[rec],
    )
    assert not report.can_render()
    assert any("child process" in r.lower() for r in report.blocking_reasons)


def test_revise_final_blocks_completion():
    rec = EvidenceRecord(
        gate_name="final_review",
        scope="post_render",
        status=ValidationStatus.REVISE,
        severity="critical",
        evidence_paths=["/tmp/final_review.json"],
        scene_coverage=["s01"],
        expected_scenes=["s01"],
        issues=["Clipped audio tail"],
    )
    report = ProductionValidationReport(
        project_id="test-proj",
        pipeline_type="editorial-explainer",
        mode="strict",
        records=[rec],
    )
    assert report.status == ValidationStatus.REVISE
    assert not report.can_complete("compose")
    assert not report.can_complete("publish")


def test_zero_scenes_blocks():
    report = validate_pre_render(
        project_dir=Path("/tmp/nonexistent-project-xyz"),
        edit_decisions={"cuts": []},
        mode="strict",
        expected_scenes=[],
    )
    assert report.status == ValidationStatus.BLOCKED
    assert not report.can_render()


def test_unknown_project_or_pipeline_blocks(tmp_path):
    report = validate_pre_render(
        project_dir=tmp_path / "unknown-dir",
        edit_decisions={"cuts": [{"id": "s01", "in_seconds": 0, "out_seconds": 5}]},
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="unknown-pipeline-name",
    )
    assert report.status == ValidationStatus.BLOCKED


def test_full_valid_pre_render_and_post_render(tmp_path):
    # Setup a minimal valid project layout
    proj = tmp_path / "valid-proj"
    artifacts = proj / "artifacts"
    assets = proj / "assets"
    renders = proj / "renders"
    artifacts.mkdir(parents=True)
    assets.mkdir(parents=True)
    renders.mkdir(parents=True)

    evidence_file = artifacts / "layout_evidence.json"
    evidence_file.write_text(json.dumps({"verified": True}), encoding="utf-8")

    video_file = renders / "final.mp4"
    video_file.write_bytes(b"dummy mp4 content")

    rec1 = EvidenceRecord(
        gate_name="pre_render_timing",
        scope="pre_render",
        status=ValidationStatus.PASS,
        severity="info",
        evidence_paths=[str(evidence_file)],
        scene_coverage=["s01", "s02"],
        expected_scenes=["s01", "s02"],
        fingerprint="a" * 64,
    )
    report = ProductionValidationReport(
        project_id="valid-proj",
        pipeline_type="animated-explainer",
        mode="strict",
        records=[rec1],
    )
    assert report.status == ValidationStatus.PASS
    assert report.can_render()


def test_all_renderer_branches_hit_pre_render_gate(tmp_path):
    from tools.video.video_compose import VideoCompose
    tool = VideoCompose()

    # Invalid project dir with zero scenes
    proj = tmp_path / "test-branches-proj"
    proj.mkdir()
    renders = proj / "renders"
    renders.mkdir()
    out = renders / "output.mp4"

    # 1. Atelier branch
    res_atelier = tool.execute({
        "operation": "render",
        "output_path": str(out),
        "validation_mode": "strict",
        "edit_decisions": {
            "render_runtime": "remotion",
            "composition_mode": "atelier",
            "bespoke": {"entry": "dummy.tsx", "composition_id": "Dummy"},
            "cuts": [],
        },
    })
    assert not res_atelier.success
    assert "pre-render production validation gate failed" in res_atelier.error.lower()

    # 2. HyperFrames branch
    res_hf = tool.execute({
        "operation": "render",
        "output_path": str(out),
        "validation_mode": "strict",
        "edit_decisions": {
            "render_runtime": "hyperframes",
            "composition_mode": "atelier",
            "bespoke": {"entry": "index.html"},
            "cuts": [],
        },
    })
    assert not res_hf.success
    assert "pre-render production validation gate failed" in res_hf.error.lower()

    # 3. Standard cut branch
    res_cut = tool.execute({
        "operation": "render",
        "output_path": str(out),
        "validation_mode": "strict",
        "asset_manifest": {"version": "1.0", "assets": []},
        "edit_decisions": {
            "render_runtime": "remotion",
            "cuts": [],
        },
    })
    assert not res_cut.success
    assert "pre-render production validation gate failed" in res_cut.error.lower()



def test_checkpoint_production_gate_integration(tmp_path):
    proj = tmp_path / "test-proj"
    artifacts = proj / "artifacts"
    artifacts.mkdir(parents=True)

    # When compose checkpoint has status "completed" but lacks evidence report, it must fail in strict mode
    ckpt = {
        "version": "1.0",
        "project_id": "test-proj",
        "pipeline_type": "animated-explainer",
        "stage": "compose",
        "status": "completed",
        "timestamp": "2026-11-08T12:00:00Z",
        "artifacts": {
            "render_report": {"version": "1.0", "status": "pass"}
        },
        "metadata": {"validation_mode": "strict"},
    }
    with pytest.raises(Exception) as exc_info:
        validate_checkpoint_production_gate(ckpt, pipeline_dir=tmp_path, project_id="test-proj")
    assert "production validation" in str(exc_info.value).lower()


def test_nonempty_scene_with_no_evidence_blocks_strict(tmp_path):
    """Nonempty scene with no layout/audio/semantic/SFX evidence must block in strict mode."""
    proj = tmp_path / "test-no-evidence"
    proj.mkdir()
    (proj / "artifacts").mkdir()

    report = validate_pre_render(
        project_dir=proj,
        edit_decisions={
            "cuts": [
                {"id": "scene-1", "in_seconds": 0, "out_seconds": 5},
                {"id": "scene-2", "in_seconds": 5, "out_seconds": 10},
            ]
        },
        mode="strict",
        expected_scenes=["scene-1", "scene-2"],
        pipeline_type="animated-explainer",
    )
    assert report.status == ValidationStatus.BLOCKED
    assert not report.can_render()
    assert any("evidence" in r.lower() for r in report.blocking_reasons)


def test_missing_scene_coverage_blocks(tmp_path):
    """Missing scene coverage in evidence must block strict pre-render."""
    proj = tmp_path / "test-coverage"
    proj.mkdir()
    art = proj / "artifacts"
    art.mkdir()
    ev_path = art / "evidence.json"
    ev_path.write_text(json.dumps({"verified": True}))

    # Evidence only covers scene-1, but expected is scene-1 and scene-2
    partial_rec = EvidenceRecord(
        gate_name="layout_verification",
        scope="pre_render",
        status=ValidationStatus.PASS,
        evidence_paths=[str(ev_path)],
        scene_coverage=["scene-1"],
        expected_scenes=["scene-1", "scene-2"],
    )
    report = validate_pre_render(
        project_dir=proj,
        edit_decisions={
            "cuts": [
                {"id": "scene-1", "in_seconds": 0, "out_seconds": 5},
                {"id": "scene-2", "in_seconds": 5, "out_seconds": 10},
            ]
        },
        mode="strict",
        expected_scenes=["scene-1", "scene-2"],
        pipeline_type="animated-explainer",
        evidence_records=[partial_rec],
    )
    assert report.status == ValidationStatus.BLOCKED
    assert not report.can_render()
    assert any("scene-2" in r for r in report.blocking_reasons)


def test_wrong_scope_report_blocks_stage_completion():
    """A pre_render report cannot complete compose or publish stage."""
    rec = EvidenceRecord(
        gate_name="pre_render_contract",
        scope="pre_render",
        status=ValidationStatus.PASS,
        evidence_paths=["/tmp/ev.json"],
        scene_coverage=["s01"],
        expected_scenes=["s01"],
    )
    report = ProductionValidationReport(
        project_id="test-proj",
        pipeline_type="animated-explainer",
        mode="strict",
        records=[rec],
    )
    # Status may be PASS for rendering, but can_complete("compose") must be False
    assert report.can_render()
    assert not report.can_complete("compose")
    assert not report.can_complete("publish")


def test_stage_coverage_aggregates_passing_records_against_authoritative_expected_set():
    rec1 = EvidenceRecord(
        gate_name="final_review", scope="post_render", status=ValidationStatus.PASS,
        scene_coverage=["s01"], expected_scenes=["s01", "s02"],
        metadata={"stage_scope_complete": True},
    )
    rec2 = EvidenceRecord(
        gate_name="audio_review", scope="compose", status=ValidationStatus.PASS,
        scene_coverage=["s02"], expected_scenes=["s01", "s02"],
    )
    report = ProductionValidationReport(
        project_id="test-proj", pipeline_type="animated-explainer", mode="strict", records=[rec1, rec2]
    )
    assert not report.can_complete("compose")


def test_planted_marker_does_not_grant_completion_without_authoritative_coverage():
    rec = EvidenceRecord(
        gate_name="final_review", scope="post_render", status=ValidationStatus.PASS,
        scene_coverage=["s01"], metadata={"stage_scope_complete": True},
    )
    report = ProductionValidationReport(
        project_id="test-proj", pipeline_type="animated-explainer", mode="strict", records=[rec]
    )
    assert not report.can_complete("compose")


def test_stage_coverage_must_match_expected_set_exactly():
    rec = EvidenceRecord(
        gate_name="final_review", scope="post_render", status=ValidationStatus.PASS,
        scene_coverage=["s01", "s02"], expected_scenes=["s01", "s02"],
    )
    report = ProductionValidationReport(
        project_id="test-proj", pipeline_type="animated-explainer", mode="strict", records=[rec]
    )
    assert report.can_complete("compose", authoritative_scenes=["s01", "s02"])


def test_partial_stage_evidence_blocks_completion():
    rec = EvidenceRecord(
        gate_name="final_review",
        scope="post_render",
        status=ValidationStatus.PASS,
        scene_coverage=["s01"],
        expected_scenes=["s01", "s02"],
    )
    report = ProductionValidationReport(
        project_id="test-proj", pipeline_type="animated-explainer", mode="strict", records=[rec]
    )
    assert not report.can_complete("compose")


def test_legacy_stage_completion_keeps_compatibility():
    rec = EvidenceRecord(
        gate_name="legacy_review", scope="post_render", status=ValidationStatus.PASS
    )
    report = ProductionValidationReport(
        project_id="test-proj", pipeline_type="animated-explainer", mode="legacy", records=[rec]
    )
    assert report.can_complete("compose")


def test_missing_evidence_path_blocks_strict(tmp_path):
    """Evidence record pointing to missing file on disk must block in strict mode."""
    proj = tmp_path / "test-missing-path"
    proj.mkdir()
    (proj / "artifacts").mkdir()

    missing_path = str(proj / "artifacts" / "nonexistent_evidence.json")
    rec = EvidenceRecord(
        gate_name="layout_verification",
        scope="pre_render",
        status=ValidationStatus.PASS,
        evidence_paths=[missing_path],
        scene_coverage=["scene-1"],
        expected_scenes=["scene-1"],
    )
    report = validate_pre_render(
        project_dir=proj,
        edit_decisions={"cuts": [{"id": "scene-1", "in_seconds": 0, "out_seconds": 5}]},
        mode="strict",
        expected_scenes=["scene-1"],
        pipeline_type="animated-explainer",
        evidence_records=[rec],
    )
    assert report.status == ValidationStatus.BLOCKED
    assert not report.can_render()
    assert any("missing or empty" in r.lower() or "not exist" in r.lower() for r in report.blocking_reasons)


def test_final_revise_or_not_measured_blocks_compose_caller(tmp_path, monkeypatch):
    """When final review status is revise or not_measured, caller must be blocked."""
    from tools.video.video_compose import VideoCompose
    from tools.base_tool import ToolResult
    tool = VideoCompose()

    proj = tmp_path / "test-revise-caller"
    renders = proj / "renders"
    renders.mkdir(parents=True)
    out_video = renders / "output.mp4"
    out_video.write_bytes(b"dummy video content")

    # Mock _compose to succeed
    monkeypatch.setattr(
        tool,
        "_compose",
        lambda *args, **kwargs: ToolResult(success=True, data={"output": str(out_video)}),
    )
    # Mock _run_final_review to return revise
    monkeypatch.setattr(
        tool,
        "_run_final_review",
        lambda *args, **kwargs: {
            "status": "revise",
            "issues_found": ["Audio speech desync detected"],
            "recommended_action": "adjust_timings",
        },
    )

    res = tool._render_via_ffmpeg(
        inputs={"validation_mode": "strict", "output_path": str(out_video)},
        edit_decisions={"cuts": [{"id": "s1", "source": str(out_video), "in_seconds": 0, "out_seconds": 2}]},
        resolved_cuts=[{"id": "s1", "source": str(out_video), "in_seconds": 0, "out_seconds": 2}],
        output_path=out_video,
        profile=None,
    )
    assert not res.success
    assert "revise" in res.error.lower() or "not presentable" in res.error.lower() or "blocked" in res.error.lower()

    # Legacy mode deliberately preserves pass-through for revise reviews.
    monkeypatch.setattr(
        tool,
        "_run_final_review",
        lambda *args, **kwargs: {
            "status": "revise",
            "issues_found": ["Audio speech desync detected"],
            "recommended_action": "adjust_timings",
        },
    )
    legacy_revise_res = tool._render_via_ffmpeg(
        inputs={"validation_mode": "legacy", "output_path": str(out_video)},
        edit_decisions={"cuts": [{"id": "s1", "source": str(out_video), "in_seconds": 0, "out_seconds": 2}]},
        resolved_cuts=[{"id": "s1", "source": str(out_video), "in_seconds": 0, "out_seconds": 2}],
        output_path=out_video,
        profile=None,
    )
    assert legacy_revise_res.success
    assert legacy_revise_res.data["final_review_status"] == "revise"

    for status in ("not_measured", "", None):
        monkeypatch.setattr(tool, "_run_final_review", lambda *args, _status=status, **kwargs: {"status": _status})
        strict_res = tool._render_via_ffmpeg(
            inputs={"validation_mode": "strict", "output_path": str(out_video)},
            edit_decisions={"cuts": [{"id": "s1", "source": str(out_video), "in_seconds": 0, "out_seconds": 2}]},
            resolved_cuts=[{"id": "s1", "source": str(out_video), "in_seconds": 0, "out_seconds": 2}],
            output_path=out_video,
            profile=None,
        )
        assert not strict_res.success
        legacy_res = tool._render_via_ffmpeg(
            inputs={"validation_mode": "legacy", "output_path": str(out_video)},
            edit_decisions={"cuts": [{"id": "s1", "source": str(out_video), "in_seconds": 0, "out_seconds": 2}]},
            resolved_cuts=[{"id": "s1", "source": str(out_video), "in_seconds": 0, "out_seconds": 2}],
            output_path=out_video,
            profile=None,
        )
        if status in ("", None):
            assert not legacy_res.success
        else:
            assert legacy_res.success

    # Unknown statuses fail in both strict and legacy modes.
    for mode in ("strict", "legacy"):
        unknown = tool._enforce_render_completion(
            render_result=ToolResult(success=True, data={}),
            final_review={"status": "mystery"},
            output_path=out_video,
            mode=mode,
            renderer_name="FFmpeg",
        )
        assert not unknown.success
        assert "unknown status" in unknown.error.lower()


def test_ffmpeg_success_without_output_fails_and_preserves_review(monkeypatch, tmp_path):
    from tools.video.video_compose import VideoCompose
    from tools.base_tool import ToolResult

    tool = VideoCompose()
    out_video = tmp_path / "renders" / "missing.mp4"
    out_video.parent.mkdir()
    review_calls = []
    monkeypatch.setattr(tool, "_compose", lambda *args, **kwargs: ToolResult(success=True, data={}))
    monkeypatch.setattr(tool, "_run_final_review", lambda *args, **kwargs: review_calls.append(True) or {"status": "pass"})

    result = tool._render_via_ffmpeg(
        inputs={"validation_mode": "strict", "output_path": str(out_video)},
        edit_decisions={"cuts": [{"id": "s1", "source": str(out_video), "in_seconds": 0, "out_seconds": 1}]},
        resolved_cuts=[{"id": "s1", "source": str(out_video), "in_seconds": 0, "out_seconds": 1}],
        output_path=out_video,
        profile=None,
    )
    assert not result.success
    assert "output file missing" in result.error.lower()
    assert review_calls == []
    assert result.data == {}


def test_strict_empty_production_report_status_fails():
    from tools.video.video_compose import VideoCompose
    from tools.base_tool import ToolResult

    result = VideoCompose()._enforce_render_completion(
        render_result=ToolResult(success=True, data={"production_validation_report": {"status": ""}}),
        final_review={"status": "pass", "production_validation_report": {"status": ""}},
        output_path=Path("/tmp/nonexistent-output.mp4"),
        mode="strict",
        renderer_name="test",
    )
    assert not result.success
    assert "production validation gate failed" in result.error.lower()


def test_pipeline_discovery_derives_from_definitions(tmp_path):
    """Pipeline definitions are derived dynamically from pipeline_defs, not hardcoded."""
    from lib.production_validation import get_known_pipelines

    known = get_known_pipelines()
    # documentary-montage exists in pipeline_defs/
    assert "documentary-montage" in known
    assert "animated-explainer" in known
    # Invented pipeline must not be present
    assert "invented-fake-pipeline" not in known


def test_compatibility_policy_rejects_silent_legacy_in_production(tmp_path):
    """Production project with project.json cannot silently select legacy on absent metadata."""
    from lib.checkpoint import init_project
    from lib.production_validation import (
        ProductionValidationError,
        validate_checkpoint_production_gate,
    )

    proj_dir = init_project(
        "prod-hardening-test",
        title="Production Hardening Test",
        pipeline_type="animated-explainer",
        pipeline_dir=tmp_path,
    )

    ckpt = {
        "version": "1.0",
        "project_id": "prod-hardening-test",
        "pipeline_type": "animated-explainer",
        "stage": "compose",
        "status": "completed",
        "timestamp": "2026-11-08T12:00:00Z",
        "artifacts": {
            "render_report": {"version": "1.0", "status": "pass"}
        },
        "metadata": {},  # No explicit validation_mode passed
    }
    # In a production project workspace (with project.json), absent metadata must enforce strict
    with pytest.raises(ProductionValidationError) as exc_info:
        validate_checkpoint_production_gate(
            ckpt, pipeline_dir=tmp_path, project_id="prod-hardening-test"
        )
    assert "strict mode requires verified production_validation_report" in str(exc_info.value).lower()

    # Explicit legacy marker in metadata or project allows historic read/pass
    ckpt_legacy = dict(ckpt, metadata={"validation_mode": "legacy"})
    # Must not raise
    validate_checkpoint_production_gate(
        ckpt_legacy, pipeline_dir=tmp_path, project_id="prod-hardening-test"
    )




def _checkpoint_with_report(*, cuts, coverage=None, expected=None, tmp_path=None):
    scenes = [cut["id"] for cut in cuts]
    record = EvidenceRecord("compose_evidence", "compose", ValidationStatus.PASS,
        scene_coverage=coverage if coverage is not None else scenes,
        expected_scenes=expected if expected is not None else scenes)
    report = ProductionValidationReport(project_id="checkpoint-test", pipeline_type="animated-explainer", mode="strict", records=[record]).to_dict()
    artifacts = None
    if tmp_path is not None:
        import json
        artifacts = tmp_path / "checkpoint-test" / "artifacts"
        artifacts.mkdir(parents=True, exist_ok=True)
        (artifacts / "script.json").write_text(json.dumps({"sections": [{"id": x["id"], "text": "text"} for x in cuts]}))
        (artifacts / "scene_timing.json").write_text(json.dumps({}))
        (artifacts / "asset_manifest.json").write_text(json.dumps({"assets": []}))
    return {"stage":"compose", "status":"completed", "project_id":"checkpoint-test", "metadata":{
        "validation_mode":"strict", "edit_decisions":{"cuts":cuts},
        "stage_fingerprint":{"is_fresh":True,"stale_stages":[],"stale_reasons":[],"mismatched_fingerprints":{}},
        "production_validation_report":report}}

def test_unrecognized_validation_mode_rejected():
    for mode in ("bogus", "unknown"):
        with pytest.raises(ValueError, match="Unrecognized validation mode"):
            resolve_validation_mode({"metadata": {"validation_mode": mode}})


def test_authority_mismatch_error_message_contains_scene_ids(tmp_path):
    ckpt = _modern_checkpoint(tmp_path, ["authoritative-scene"])
    report = ckpt["metadata"]["production_validation_report"]
    report["records"][0]["scene_coverage"] = ["declared-scene"]
    report["records"][0]["expected_scenes"] = ["declared-scene"]
    with pytest.raises(ProductionValidationError) as exc_info:
        validate_checkpoint_production_gate(ckpt, pipeline_dir=tmp_path)
    message = str(exc_info.value)
    assert "authoritative-scene" in message
    assert "declared-scene" in message
def test_checkpoint_gate_completes_valid_strict_report_from_cut_manifest(tmp_path):
    ckpt = _modern_checkpoint(tmp_path, ["s1", "s2"])
    validate_checkpoint_production_gate(ckpt, pipeline_dir=tmp_path)


def test_checkpoint_gate_blocks_strict_report_when_scene_manifest_absent(tmp_path):
    ckpt = _modern_checkpoint(tmp_path, ["s1"])
    from lib.production_validation import recompute_checkpoint_fingerprint
    ckpt["metadata"].pop("edit_decisions")
    ckpt["metadata"].pop("scene_manifest", None)
    ckpt["metadata"]["recorded_fingerprints"] = recompute_checkpoint_fingerprint(ckpt, tmp_path, "checkpoint-test").to_dict()
    from lib.production_validation import recompute_checkpoint_fingerprint
    ckpt["metadata"]["recorded_fingerprints"] = recompute_checkpoint_fingerprint(ckpt, tmp_path, "checkpoint-test").to_dict()
    with pytest.raises(Exception, match="requires authoritative scene manifest"):
        validate_checkpoint_production_gate(ckpt, pipeline_dir=tmp_path)


def test_checkpoint_gate_rejects_forged_subset_against_cut_manifest(tmp_path):
    ckpt = _modern_checkpoint(tmp_path, ["s1", "s2"])
    ckpt["metadata"]["production_validation_report"]["records"][0]["scene_coverage"] = ["s1"]
    ckpt["metadata"]["production_validation_report"]["records"][0]["expected_scenes"] = ["s1"]
    with pytest.raises(Exception, match="cannot complete stage"):
        validate_checkpoint_production_gate(ckpt, pipeline_dir=tmp_path)


def _modern_checkpoint(tmp_path, scene_ids, *, verdict=True, audio=b"audio-original"):
    from lib.production_validation import recompute_checkpoint_fingerprint
    from lib.production_provenance import FreshnessResult
    import json
    root = tmp_path
    project = root / "checkpoint-test"
    artifacts = project / "artifacts"
    artifacts.mkdir(parents=True, exist_ok=True)
    (project / "assets").mkdir(exist_ok=True)
    (project / "assets" / "s1.wav").write_bytes(audio)
    (artifacts / "script.json").write_text(json.dumps({"sections":[{"id":sid,"text":f"text-{sid}"} for sid in scene_ids]}))
    (artifacts / "scene_timing.json").write_text(json.dumps({}))
    (artifacts / "asset_manifest.json").write_text(json.dumps({"assets":[]}))
    cuts = [{"id":sid} for sid in scene_ids]
    record = EvidenceRecord("compose_evidence", "compose", ValidationStatus.PASS, scene_coverage=scene_ids, expected_scenes=scene_ids)
    report = ProductionValidationReport(project_id="checkpoint-test", pipeline_type="animated-explainer", mode="strict", records=[record]).to_dict()
    ckpt = {"stage":"compose","status":"completed","project_id":"checkpoint-test","metadata":{"validation_mode":"strict","edit_decisions":{"cuts":cuts},"production_validation_report":report}}
    baseline = recompute_checkpoint_fingerprint(ckpt, root, "checkpoint-test")
    ckpt["metadata"]["recorded_fingerprints"] = baseline.to_dict()
    if verdict is not None:
        ckpt["metadata"]["stage_fingerprint"] = FreshnessResult(verdict).to_dict()
    return ckpt


def test_f2_unrelated_forged_pass_record_rejected(tmp_path):
    proj = tmp_path / "forged-proj"
    proj.mkdir()
    (proj / "artifacts").mkdir()

    forged_rec = EvidenceRecord(
        gate_name="unrelated_forgery",
        scope="pre_render",
        status=ValidationStatus.PASS,
        scene_coverage=["s01"],
        expected_scenes=["s01"],
        evidence_paths=[],
    )
    report = validate_pre_render(
        project_dir=proj,
        edit_decisions={"cuts": [{"id": "s01", "in_seconds": 0, "out_seconds": 5}]},
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="animated-explainer",
        evidence_records=[forged_rec],
    )
    assert report.status == ValidationStatus.BLOCKED
    assert not report.can_render()
    assert any("unrelated_forgery" in r or "layout" in r for r in report.blocking_reasons)


def test_f2_tampered_evidence_artifact_hash_mismatch_rejected(tmp_path):
    proj = tmp_path / "tampered-proj"
    art = proj / "artifacts"
    art.mkdir(parents=True)
    ev_file = art / "layout.json"
    ev_file.write_text(json.dumps({"verified": True}), encoding="utf-8")

    rec = create_evidence_record(
        gate_name=GATE_LAYOUT,
        scene_coverage=["s01"],
        evidence_paths=[str(ev_file)],
        status=ValidationStatus.PASS,
        expected_scenes=["s01"],
        artifact_hashes={str(ev_file): "0000000000000000000000000000000000000000000000000000000000000000"},
    )
    report = validate_pre_render(
        project_dir=proj,
        edit_decisions={"cuts": [{"id": "s01", "in_seconds": 0, "out_seconds": 5}]},
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="animated-explainer",
        evidence_records=[rec],
        required_gates=[GATE_LAYOUT],
    )
    assert report.status == ValidationStatus.BLOCKED
    assert any("tampered" in r.lower() or "hash mismatch" in r.lower() for r in report.blocking_reasons)


def test_f2_stale_input_hash_mismatch_rejected(tmp_path):
    proj = tmp_path / "stale-input-proj"
    art = proj / "artifacts"
    art.mkdir(parents=True)
    ev_file = art / "layout.json"
    ev_file.write_text(json.dumps({"verified": True}), encoding="utf-8")
    input_file = art / "script.json"
    input_file.write_text(json.dumps({"sections": []}), encoding="utf-8")

    rec = create_evidence_record(
        gate_name=GATE_LAYOUT,
        scene_coverage=["s01"],
        evidence_paths=[str(ev_file)],
        status=ValidationStatus.PASS,
        expected_scenes=["s01"],
        fingerprint="fp123",
        metadata={"input_hashes": {str(input_file): "stale_hash_that_does_not_match"}},
    )
    report = validate_pre_render(
        project_dir=proj,
        edit_decisions={"cuts": [{"id": "s01", "in_seconds": 0, "out_seconds": 5}]},
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="animated-explainer",
        evidence_records=[rec],
        required_gates=[GATE_LAYOUT],
    )
    assert report.status == ValidationStatus.BLOCKED
    assert any("stale evidence" in r.lower() or "changed since validation" in r.lower() for r in report.blocking_reasons)


def test_f2_partial_required_gate_missing_blocked(tmp_path):
    proj = tmp_path / "partial-proj"
    art = proj / "artifacts"
    art.mkdir(parents=True)
    ev1 = art / "layout.json"
    ev1.write_text(json.dumps({"verified": True}), encoding="utf-8")
    ev2 = art / "timing.json"
    ev2.write_text(json.dumps({"verified": True}), encoding="utf-8")

    # Only layout and timing-audio provided; semantic-events and sfx-mix are missing
    rec_layout = create_evidence_record(
        gate_name=GATE_LAYOUT,
        scene_coverage=["s01"],
        evidence_paths=[str(ev1)],
        status=ValidationStatus.PASS,
        expected_scenes=["s01"],
    )
    rec_timing = create_evidence_record(
        gate_name=GATE_TIMING_AUDIO,
        scene_coverage=["s01"],
        evidence_paths=[str(ev2)],
        status=ValidationStatus.PASS,
        expected_scenes=["s01"],
    )
    report = validate_pre_render(
        project_dir=proj,
        edit_decisions={"cuts": [{"id": "s01", "in_seconds": 0, "out_seconds": 5}]},
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="animated-explainer",
        evidence_records=[rec_layout, rec_timing],
    )
    assert report.status == ValidationStatus.BLOCKED
    assert not report.can_render()
    reasons_str = " ".join(report.blocking_reasons)
    assert "semantic-events" in reasons_str
    assert "sfx-mix" in reasons_str


def test_f2_full_required_gates_pass(tmp_path):
    import hashlib
    proj = tmp_path / "full-pass-proj"
    art = proj / "artifacts"
    art.mkdir(parents=True)
    (art / "script.json").write_text(json.dumps({"sections": [{"id": "s01", "text": "hello"}]}))
    (art / "scene_timing.json").write_text(json.dumps({}))
    (art / "asset_manifest.json").write_text(json.dumps({"assets": []}))

    recs = []
    for g in (GATE_LAYOUT, GATE_TIMING_AUDIO, GATE_SEMANTIC_EVENTS, GATE_SFX_MIX):
        p = art / f"{g}.json"
        content = json.dumps({"gate": g, "ok": True}).encode("utf-8")
        p.write_bytes(content)
        recs.append(
            create_evidence_record(
                gate_name=g,
                scene_coverage=["s01"],
                evidence_paths=[str(p)],
                status=ValidationStatus.PASS,
                expected_scenes=["s01"],
                artifact_hashes={str(p): hashlib.sha256(content).hexdigest()},
            )
        )

    # Episode-level provenance-freshness
    p_prov = art / "provenance.json"
    prov_content = json.dumps({"gate": "provenance", "ok": True}).encode("utf-8")
    p_prov.write_bytes(prov_content)
    recs.append(
        create_evidence_record(
            gate_name=GATE_PROVENANCE_FRESHNESS,
            scene_coverage=["s01"],
            evidence_paths=[str(p_prov)],
            status=ValidationStatus.PASS,
            expected_scenes=["s01"],
            artifact_hashes={str(p_prov): hashlib.sha256(prov_content).hexdigest()},
        )
    )

    report = validate_pre_render(
        project_dir=proj,
        edit_decisions={"cuts": [{"id": "s01", "in_seconds": 0, "out_seconds": 5}]},
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="animated-explainer",
        evidence_records=recs,
    )
    assert report.status == ValidationStatus.PASS
    assert report.can_render()


def test_f2_evidence_record_api_and_validation():
    rec = create_evidence_record(
        gate_name="layout",
        scene_coverage=["s1"],
        evidence_paths=["artifacts/layout.json"],
        status=ValidationStatus.PASS,
        expected_scenes=["s1"],
        fingerprint="fp-test",
        artifact_hashes={"artifacts/layout.json": "hash123"},
    )
    assert rec.gate_name == "layout"
    assert rec.canonical_gate_name == "layout"
    assert rec.is_valid_gate()
    d = rec.to_dict()
    assert d["artifact_hashes"] == {"artifacts/layout.json": "hash123"}
    restored = EvidenceRecord.from_dict(d)
    assert restored.artifact_hashes == {"artifacts/layout.json": "hash123"}
    assert restored.canonical_gate_name == "layout"


# ==============================================================================
# A-1 / A-2 Review Hardening Tests (F2 Forgery Class Reopened)
# ==============================================================================

def test_a1_strict_mode_edit_decisions_cannot_shrink_required_gates(tmp_path):
    """A-1 RED: edit_decisions declaring required_gates=['layout'] must not bypass missing gates in strict mode."""
    import hashlib
    proj = tmp_path / "a1-shrink-attempt"
    art = proj / "artifacts"
    art.mkdir(parents=True)

    # Only layout evidence provided; semantic-events, timing-audio, sfx-mix, provenance missing
    layout_file = art / "layout.json"
    layout_content = json.dumps({"verified": True}).encode("utf-8")
    layout_file.write_bytes(layout_content)

    rec_layout = create_evidence_record(
        gate_name=GATE_LAYOUT,
        scene_coverage=["s01"],
        evidence_paths=[str(layout_file)],
        status=ValidationStatus.PASS,
        expected_scenes=["s01"],
        artifact_hashes={str(layout_file): hashlib.sha256(layout_content).hexdigest()},
    )

    # Edit decisions maliciously attempts to declare a reduced gate set (layout only)
    edit_decisions = {
        "required_gates": ["layout"],
        "cuts": [{"id": "s01", "in_seconds": 0, "out_seconds": 5}],
    }

    report = validate_pre_render(
        project_dir=proj,
        edit_decisions=edit_decisions,
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="animated-explainer",
        evidence_records=[rec_layout],
    )
    # Must still BLOCK on missing required gates (semantic-events, timing-audio, sfx-mix, provenance-freshness)
    assert report.status == ValidationStatus.BLOCKED
    assert not report.can_render()
    reasons_str = " ".join(report.blocking_reasons)
    assert "semantic-events" in reasons_str
    assert "timing-audio" in reasons_str
    assert "sfx-mix" in reasons_str
    assert "provenance-freshness" in reasons_str


def test_a1_explicit_caller_kwarg_can_narrow_required_gates(tmp_path):
    """A-1: explicit caller kwarg validate_pre_render(required_gates=...) is honored."""
    import hashlib
    proj = tmp_path / "a1-explicit-kwarg"
    art = proj / "artifacts"
    art.mkdir(parents=True)

    layout_file = art / "layout.json"
    layout_content = json.dumps({"verified": True}).encode("utf-8")
    layout_file.write_bytes(layout_content)

    rec_layout = create_evidence_record(
        gate_name=GATE_LAYOUT,
        scene_coverage=["s01"],
        evidence_paths=[str(layout_file)],
        status=ValidationStatus.PASS,
        expected_scenes=["s01"],
        artifact_hashes={str(layout_file): hashlib.sha256(layout_content).hexdigest()},
    )

    report = validate_pre_render(
        project_dir=proj,
        edit_decisions={"cuts": [{"id": "s01", "in_seconds": 0, "out_seconds": 5}]},
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="animated-explainer",
        evidence_records=[rec_layout],
        required_gates=[GATE_LAYOUT],
    )
    assert report.status == ValidationStatus.PASS
    assert report.can_render()


def test_a1_metadata_declared_can_widen_required_gates(tmp_path):
    """A-1: metadata/edit_decisions may widen enforcement (union), never shrink it."""
    import hashlib
    proj = tmp_path / "a1-widen"
    art = proj / "artifacts"
    art.mkdir(parents=True)

    recs = []
    for g in (GATE_LAYOUT, GATE_TIMING_AUDIO, GATE_SEMANTIC_EVENTS, GATE_SFX_MIX):
        p = art / f"{g}.json"
        content = json.dumps({"gate": g}).encode("utf-8")
        p.write_bytes(content)
        recs.append(
            create_evidence_record(
                gate_name=g,
                scene_coverage=["s01"],
                evidence_paths=[str(p)],
                status=ValidationStatus.PASS,
                expected_scenes=["s01"],
                artifact_hashes={str(p): hashlib.sha256(content).hexdigest()},
            )
        )
    p_prov = art / "provenance.json"
    prov_content = json.dumps({"gate": "provenance"}).encode("utf-8")
    p_prov.write_bytes(prov_content)
    recs.append(
        create_evidence_record(
            gate_name=GATE_PROVENANCE_FRESHNESS,
            scene_coverage=["s01"],
            evidence_paths=[str(p_prov)],
            status=ValidationStatus.PASS,
            expected_scenes=["s01"],
            artifact_hashes={str(p_prov): hashlib.sha256(prov_content).hexdigest()},
        )
    )

    # Edit decisions declares the full set using ALIASES; the union must still
    # enforce the canonical gates (alias normalization) and must not shrink them.
    edit_decisions = {
        "required_gates": ["layout_verification", "timing", "events", "mix", "provenance"],
        "cuts": [{"id": "s01", "in_seconds": 0, "out_seconds": 5}],
    }
    report = validate_pre_render(
        project_dir=proj,
        edit_decisions=edit_decisions,
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="animated-explainer",
        evidence_records=recs,
    )
    assert report.status == ValidationStatus.PASS

    # Same alias metadata, but one canonical gate's evidence is missing:
    # the alias declaration must NOT let the missing canonical gate slip through.
    recs_wo_mix = [r for r in recs if r.canonical_gate_name != GATE_SFX_MIX]
    report_missing = validate_pre_render(
        project_dir=proj,
        edit_decisions=edit_decisions,
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="animated-explainer",
        evidence_records=recs_wo_mix,
    )
    assert report_missing.status == ValidationStatus.BLOCKED
    assert "sfx-mix" in " ".join(report_missing.blocking_reasons)


def test_a2_pass_record_without_artifact_hashes_rejected_in_strict(tmp_path):
    """A-2 RED: strict PASS record with evidence_paths but NO artifact_hashes must be REJECTED."""
    proj = tmp_path / "a2-unhashed"
    art = proj / "artifacts"
    art.mkdir(parents=True)
    ev_file = art / "layout.json"
    ev_file.write_text(json.dumps({"verified": True}), encoding="utf-8")

    # Valid path on disk, non-empty, but artifact_hashes dict is empty
    rec = create_evidence_record(
        gate_name=GATE_LAYOUT,
        scene_coverage=["s01"],
        evidence_paths=[str(ev_file)],
        status=ValidationStatus.PASS,
        expected_scenes=["s01"],
        artifact_hashes={},  # No hash provided!
    )
    report = validate_pre_render(
        project_dir=proj,
        edit_decisions={"cuts": [{"id": "s01", "in_seconds": 0, "out_seconds": 5}]},
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="animated-explainer",
        evidence_records=[rec],
        required_gates=[GATE_LAYOUT],
    )
    # Must be BLOCKED with named issue
    assert report.status == ValidationStatus.BLOCKED
    assert not report.can_render()
    reasons_str = " ".join(report.blocking_reasons).lower()
    assert "artifact hash" in reasons_str or "unverified" in reasons_str


def test_a2_hash_in_metadata_artifact_hashes_is_accepted(tmp_path):
    """A-2: a hash supplied via metadata['artifact_hashes'] satisfies the per-path hash requirement."""
    import hashlib
    proj = tmp_path / "a2-metadata-hash"
    art = proj / "artifacts"
    art.mkdir(parents=True)
    ev_file = art / "layout.json"
    content = json.dumps({"verified": True}).encode("utf-8")
    ev_file.write_bytes(content)

    rec = create_evidence_record(
        gate_name=GATE_LAYOUT,
        scene_coverage=["s01"],
        evidence_paths=[str(ev_file)],
        status=ValidationStatus.PASS,
        expected_scenes=["s01"],
        artifact_hashes={},
        metadata={"artifact_hashes": {str(ev_file): hashlib.sha256(content).hexdigest()}},
    )
    report = validate_pre_render(
        project_dir=proj,
        edit_decisions={"cuts": [{"id": "s01", "in_seconds": 0, "out_seconds": 5}]},
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="animated-explainer",
        evidence_records=[rec],
        required_gates=[GATE_LAYOUT],
    )
    assert report.status == ValidationStatus.PASS


def test_a2_partial_hash_coverage_blocked(tmp_path):
    """A-2: every evidence path needs its own hash — one hashed + one unhashed must BLOCK."""
    import hashlib
    proj = tmp_path / "a2-partial"
    art = proj / "artifacts"
    art.mkdir(parents=True)
    hashed_file = art / "hashed.json"
    hashed_content = json.dumps({"a": 1}).encode("utf-8")
    hashed_file.write_bytes(hashed_content)
    unhashed_file = art / "unhashed.json"
    unhashed_file.write_text(json.dumps({"b": 2}), encoding="utf-8")

    rec = create_evidence_record(
        gate_name=GATE_LAYOUT,
        scene_coverage=["s01"],
        evidence_paths=[str(hashed_file), str(unhashed_file)],
        status=ValidationStatus.PASS,
        expected_scenes=["s01"],
        artifact_hashes={str(hashed_file): hashlib.sha256(hashed_content).hexdigest()},
    )
    report = validate_pre_render(
        project_dir=proj,
        edit_decisions={"cuts": [{"id": "s01", "in_seconds": 0, "out_seconds": 5}]},
        mode="strict",
        expected_scenes=["s01"],
        pipeline_type="animated-explainer",
        evidence_records=[rec],
        required_gates=[GATE_LAYOUT],
    )
    assert report.status == ValidationStatus.BLOCKED
    reasons_str = " ".join(report.blocking_reasons)
    assert "unhashed.json" in reasons_str
    assert "lacks artifact hash" in reasons_str



