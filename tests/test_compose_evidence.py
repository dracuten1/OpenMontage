"""Tests for compose evidence loading, strict pre-render gate, and bypass closure (finding F1)."""

import hashlib
import json
from pathlib import Path
import pytest

from lib.production_validation import (
    GATE_LAYOUT,
    GATE_PROVENANCE_FRESHNESS,
    GATE_SEMANTIC_EVENTS,
    GATE_SFX_MIX,
    GATE_TIMING_AUDIO,
    EvidenceRecord,
    ValidationStatus,
    create_evidence_record,
    hash_file,
)
from lib.checkpoint import (
    CheckpointValidationError,
    get_completed_stages,
    get_latest_checkpoint,
    init_project,
    read_checkpoint,
    validate_checkpoint,
    write_checkpoint,
)
from tools.base_tool import ToolResult
from tools.video.video_compose import VideoCompose


def _sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _setup_project(tmp_path: Path, project_name: str = "proj-f1"):
    proj = tmp_path / project_name
    artifacts = proj / "artifacts"
    assets = proj / "assets"
    renders = proj / "renders"
    artifacts.mkdir(parents=True, exist_ok=True)
    assets.mkdir(parents=True, exist_ok=True)
    renders.mkdir(parents=True, exist_ok=True)

    # Input file to track in input_hashes
    voice_file = assets / "voice.wav"
    voice_file.write_bytes(b"RIFFdummywavdata")
    voice_hash = _sha256(b"RIFFdummywavdata")

    # Evidence files on disk
    layout_ev = artifacts / "layout_evidence.json"
    layout_ev.write_text(json.dumps({"verified": True}), encoding="utf-8")
    timing_ev = artifacts / "timing_evidence.json"
    timing_ev.write_text(json.dumps({"timing_verified": True}), encoding="utf-8")
    semantic_ev = artifacts / "semantic_evidence.json"
    semantic_ev.write_text(json.dumps({"events_verified": True}), encoding="utf-8")
    sfx_ev = artifacts / "sfx_evidence.json"
    sfx_ev.write_text(json.dumps({"mix_verified": True}), encoding="utf-8")
    prov_ev = artifacts / "provenance_evidence.json"
    prov_ev.write_text(json.dumps({"provenance_verified": True}), encoding="utf-8")

    # Asset manifest
    manifest_file = artifacts / "asset_manifest.json"
    manifest_data = {
        "version": "1.0",
        "assets": [{"id": "a1", "path": str(voice_file)}],
    }
    manifest_file.write_text(json.dumps(manifest_data), encoding="utf-8")

    out_file = renders / "output.mp4"

    cuts = [{"id": "cut-1", "source": "a1", "in_seconds": 0, "out_seconds": 2}]
    edit_decisions = {
        "version": "1.0",
        "render_runtime": "remotion",
        "renderer_family": "explainer-data",
        "delivery_promise": "60s explainer",
        "cuts": cuts,
    }

    return {
        "proj": proj,
        "artifacts": artifacts,
        "assets": assets,
        "renders": renders,
        "voice_file": voice_file,
        "voice_hash": voice_hash,
        "layout_ev": layout_ev,
        "timing_ev": timing_ev,
        "semantic_ev": semantic_ev,
        "sfx_ev": sfx_ev,
        "prov_ev": prov_ev,
        "out_file": out_file,
        "edit_decisions": edit_decisions,
        "manifest_data": manifest_data,
    }


def _create_valid_evidence_records(ctx):
    proj = ctx["proj"]
    voice_file = ctx["voice_file"]
    voice_hash = ctx["voice_hash"]

    records = [
        create_evidence_record(
            gate_name=GATE_LAYOUT,
            scene_coverage=["cut-1"],
            expected_scenes=["cut-1"],
            evidence_paths=[str(ctx["layout_ev"])],
            status=ValidationStatus.PASS,
            artifact_hashes={str(ctx["layout_ev"]): hash_file(ctx["layout_ev"])},
            fingerprint="fp-layout",
            metadata={"input_hashes": {str(voice_file): voice_hash}},
        ),
        create_evidence_record(
            gate_name=GATE_TIMING_AUDIO,
            scene_coverage=["cut-1"],
            expected_scenes=["cut-1"],
            evidence_paths=[str(ctx["timing_ev"])],
            status=ValidationStatus.PASS,
            artifact_hashes={str(ctx["timing_ev"]): hash_file(ctx["timing_ev"])},
            fingerprint="fp-timing",
            metadata={"input_hashes": {str(voice_file): voice_hash}},
        ),
        create_evidence_record(
            gate_name=GATE_SEMANTIC_EVENTS,
            scene_coverage=["cut-1"],
            expected_scenes=["cut-1"],
            evidence_paths=[str(ctx["semantic_ev"])],
            status=ValidationStatus.PASS,
            artifact_hashes={str(ctx["semantic_ev"]): hash_file(ctx["semantic_ev"])},
            fingerprint="fp-semantic",
            metadata={"input_hashes": {str(voice_file): voice_hash}},
        ),
        create_evidence_record(
            gate_name=GATE_SFX_MIX,
            scene_coverage=["cut-1"],
            expected_scenes=["cut-1"],
            evidence_paths=[str(ctx["sfx_ev"])],
            status=ValidationStatus.PASS,
            artifact_hashes={str(ctx["sfx_ev"]): hash_file(ctx["sfx_ev"])},
            fingerprint="fp-sfx",
            metadata={"input_hashes": {str(voice_file): voice_hash}},
        ),
        create_evidence_record(
            gate_name=GATE_PROVENANCE_FRESHNESS,
            scene_coverage=[],
            expected_scenes=[],
            evidence_paths=[str(ctx["prov_ev"])],
            status=ValidationStatus.PASS,
            artifact_hashes={str(ctx["prov_ev"]): hash_file(ctx["prov_ev"])},
            fingerprint="fp-prov",
            metadata={"input_hashes": {str(voice_file): voice_hash}},
        ),
    ]
    return records


def test_public_compose_positive_fully_valid_evidence_proceeds(tmp_path, monkeypatch):
    """1. POSITIVE: fully valid evidence (all required gates, correct hashes, current inputs) -> compose PROCEEDS."""
    ctx = _setup_project(tmp_path, "proj-positive")
    records = _create_valid_evidence_records(ctx)

    # Write canonical artifacts/production_evidence.json
    ev_path = ctx["artifacts"] / "production_evidence.json"
    ev_path.write_text(json.dumps([r.to_dict() for r in records]), encoding="utf-8")

    tool = VideoCompose()
    # Stub downstream rendering engine and final review
    monkeypatch.setattr(
        tool,
        "_remotion_render",
        lambda inputs: ToolResult(
            success=True,
            data={"rendered": True, "output": str(ctx["out_file"])},
            artifacts=[str(ctx["out_file"])],
        ),
    )
    monkeypatch.setattr(
        tool,
        "_run_final_review",
        lambda *args, **kwargs: {"status": "pass", "issues": []},
    )
    # Fake output file existence for render completion
    ctx["out_file"].write_bytes(b"dummy mp4")

    # Run public compose entrypoint
    result = tool.execute({
        "operation": "render",
        "output_path": str(ctx["out_file"]),
        "validation_mode": "strict",
        "edit_decisions": ctx["edit_decisions"],
        "asset_manifest": ctx["manifest_data"],
    })

    assert result.success, f"Expected compose to proceed but failed: {result.error}"


def test_public_compose_negative_missing_evidence_file_blocked(tmp_path):
    """2a. NEGATIVE: missing evidence file -> BLOCKED."""
    ctx = _setup_project(tmp_path, "proj-neg-missing")
    # Explicitly ensure no production_evidence.json exists
    ev_path = ctx["artifacts"] / "production_evidence.json"
    if ev_path.exists():
        ev_path.unlink()

    tool = VideoCompose()
    result = tool.execute({
        "operation": "render",
        "output_path": str(ctx["out_file"]),
        "validation_mode": "strict",
        "edit_decisions": ctx["edit_decisions"],
        "asset_manifest": ctx["manifest_data"],
    })

    assert not result.success
    assert "pre-render production validation gate failed" in result.error.lower()
    assert (
        "no verified production evidence" in result.error.lower()
        or "production evidence" in result.error.lower()
    )


def test_public_compose_negative_forged_evidence_blocked(tmp_path):
    """2b. NEGATIVE: forged evidence (unrelated gate PASS / fabricated record) -> BLOCKED."""
    ctx = _setup_project(tmp_path, "proj-neg-forged")

    # Forged record: unknown gate identity
    forged_record = create_evidence_record(
        gate_name="unrelated_fabricated_gate",
        scene_coverage=["cut-1"],
        expected_scenes=["cut-1"],
        evidence_paths=[str(ctx["layout_ev"])],
        status=ValidationStatus.PASS,
    )
    ev_path = ctx["artifacts"] / "production_evidence.json"
    ev_path.write_text(json.dumps([forged_record.to_dict()]), encoding="utf-8")

    tool = VideoCompose()
    result = tool.execute({
        "operation": "render",
        "output_path": str(ctx["out_file"]),
        "validation_mode": "strict",
        "edit_decisions": ctx["edit_decisions"],
        "asset_manifest": ctx["manifest_data"],
    })

    assert not result.success
    assert "pre-render production validation gate failed" in result.error.lower()
    assert (
        "unrecognized/forged gate identity" in result.error.lower()
        or "missing" in result.error.lower()
    )


def test_public_compose_negative_stale_evidence_blocked(tmp_path):
    """2c. NEGATIVE: stale evidence (inputs mutated after record) -> BLOCKED."""
    ctx = _setup_project(tmp_path, "proj-neg-stale")
    records = _create_valid_evidence_records(ctx)

    # Mutate the input file so it no longer matches the fingerprint hash
    ctx["voice_file"].write_bytes(b"MUTATED_VOICE_DATA_AFTER_VALIDATION")

    ev_path = ctx["artifacts"] / "production_evidence.json"
    ev_path.write_text(json.dumps([r.to_dict() for r in records]), encoding="utf-8")

    tool = VideoCompose()
    result = tool.execute({
        "operation": "render",
        "output_path": str(ctx["out_file"]),
        "validation_mode": "strict",
        "edit_decisions": ctx["edit_decisions"],
        "asset_manifest": ctx["manifest_data"],
    })

    assert not result.success
    assert "pre-render production validation gate failed" in result.error.lower()
    assert "changed since validation" in result.error.lower() or "stale" in result.error.lower()


def test_bypass_a_production_workspace_rejects_legacy_mode(tmp_path, monkeypatch):
    """Bypass (a): production workspace cannot bypass strict evidence via validation_mode='legacy'."""
    init_project("prod-legacy-bypass", title="Prod Bypass", pipeline_type="animated-explainer", pipeline_dir=tmp_path)
    ctx = _setup_project(tmp_path, "prod-legacy-bypass")

    # Missing evidence: strict mode should block.
    # Attempting to bypass using validation_mode='legacy' in inputs must NOT bypass production.
    tool = VideoCompose()
    # Stub render to succeed if gate is bypassed
    monkeypatch.setattr(
        tool,
        "_remotion_render",
        lambda inputs: ToolResult(
            success=True,
            data={"rendered": True, "output": str(ctx["out_file"])},
            artifacts=[str(ctx["out_file"])],
        ),
    )
    monkeypatch.setattr(
        tool,
        "_run_final_review",
        lambda *args, **kwargs: {"status": "pass", "issues": []},
    )
    ctx["out_file"].write_bytes(b"dummy mp4")

    result = tool.execute({
        "operation": "render",
        "output_path": str(ctx["out_file"]),
        "validation_mode": "legacy",
        "edit_decisions": ctx["edit_decisions"],
        "asset_manifest": ctx["manifest_data"],
    })

    # Must be BLOCKED because this is a production workspace: legacy mode cannot bypass strict pre-render gate
    assert not result.success
    assert "pre-render production validation gate failed" in result.error.lower()


def test_bypass_b_checkpoint_validation_omitted_args_fails_closed():
    """Bypass (b): omitting pipeline_dir/project_id on strict checkpoint must FAIL CLOSED, not silently pass."""
    ckpt = {
        "version": "1.0",
        "project_id": "test-project-omitted",
        "pipeline_type": "animated-explainer",
        "stage": "compose",
        "status": "completed",
        "timestamp": "2026-11-08T00:00:00Z",
        "human_approval_required": True,
        "human_approved": True,
        "artifacts": {
            "render_report": {
                "version": "1.0",
                "outputs": [{
                    "path": "renders/output.mp4",
                    "format": "mp4",
                    "resolution": "1920x1080",
                    "duration_seconds": 10.0,
                }],
            }
        },
        "metadata": {
            "validation_mode": "strict",
            # Note: NO production_validation_report
        },
    }

    # Calling validate_checkpoint with omitted pipeline_dir must fail closed (raise CheckpointValidationError)
    with pytest.raises(CheckpointValidationError):
        validate_checkpoint(ckpt)


def test_checkpoint_gate_production_workspace_rejects_legacy_mode(tmp_path):
    """1a. Production workspace compose checkpoint carrying validation_mode='legacy' must be rejected."""
    init_project("prod-legacy-ckpt", title="Prod Legacy Ckpt", pipeline_type="animated-explainer", pipeline_dir=tmp_path)
    ckpt = {
        "version": "1.0",
        "project_id": "prod-legacy-ckpt",
        "pipeline_type": "animated-explainer",
        "stage": "compose",
        "status": "completed",
        "timestamp": "2026-11-08T00:00:00Z",
        "human_approval_required": True,
        "human_approved": True,
        "artifacts": {
            "render_report": {
                "version": "1.0",
                "outputs": [{
                    "path": "renders/output.mp4",
                    "format": "mp4",
                    "resolution": "1920x1080",
                    "duration_seconds": 10.0,
                }],
            }
        },
        "metadata": {
            "validation_mode": "legacy",
        },
    }
    with pytest.raises(CheckpointValidationError) as exc_info:
        validate_checkpoint(ckpt, pipeline_dir=tmp_path, project_id="prod-legacy-ckpt")
    assert "production workspace" in str(exc_info.value).lower()
    assert "legacy" in str(exc_info.value).lower()


def test_checkpoint_gate_consumes_non_production_bypass_stamps(tmp_path):
    """1b. Compose checkpoint with render_report production_acceptable=False or non_production_bypass=True rejected."""
    init_project("prod-stamped-ckpt", title="Prod Stamped Ckpt", pipeline_type="animated-explainer", pipeline_dir=tmp_path)

    # Subcase 1: production_acceptable is False in render_report.metadata
    ckpt_unacceptable = {
        "version": "1.0",
        "project_id": "prod-stamped-ckpt",
        "pipeline_type": "animated-explainer",
        "stage": "compose",
        "status": "completed",
        "timestamp": "2026-11-08T00:00:00Z",
        "human_approval_required": True,
        "human_approved": True,
        "artifacts": {
            "render_report": {
                "version": "1.0",
                "metadata": {
                    "production_acceptable": False,
                },
                "outputs": [{
                    "path": "renders/output.mp4",
                    "format": "mp4",
                    "resolution": "1920x1080",
                    "duration_seconds": 10.0,
                }],
            }
        },
        "metadata": {
            "validation_mode": "legacy",
        },
    }
    with pytest.raises(CheckpointValidationError) as exc_info1:
        validate_checkpoint(ckpt_unacceptable, pipeline_dir=tmp_path, project_id="prod-stamped-ckpt")
    assert "production_acceptable" in str(exc_info1.value).lower() or "legacy-rendered" in str(exc_info1.value).lower()

    # Subcase 2: non_production_bypass is True in render_report.metadata
    ckpt_bypassed = {
        "version": "1.0",
        "project_id": "prod-stamped-ckpt",
        "pipeline_type": "animated-explainer",
        "stage": "compose",
        "status": "completed",
        "timestamp": "2026-11-08T00:00:00Z",
        "human_approval_required": True,
        "human_approved": True,
        "artifacts": {
            "render_report": {
                "version": "1.0",
                "metadata": {
                    "non_production_bypass": True,
                },
                "outputs": [{
                    "path": "renders/output.mp4",
                    "format": "mp4",
                    "resolution": "1920x1080",
                    "duration_seconds": 10.0,
                }],
            }
        },
        "metadata": {
            "validation_mode": "legacy",
        },
    }
    with pytest.raises(CheckpointValidationError) as exc_info2:
        validate_checkpoint(ckpt_bypassed, pipeline_dir=tmp_path, project_id="prod-stamped-ckpt")
    assert "non_production_bypass" in str(exc_info2.value).lower() or "legacy-rendered" in str(exc_info2.value).lower()


def test_checkpoint_gate_ambiguous_mode_defaults_strict_and_fails_closed():
    """2. Compose/publish checkpoint with NO validation_mode metadata and unresolvable pipeline_dir fails closed."""
    ckpt = {
        "version": "1.0",
        "project_id": "unresolvable-project",
        "pipeline_type": "animated-explainer",
        "stage": "compose",
        "status": "completed",
        "timestamp": "2026-11-08T00:00:00Z",
        "human_approval_required": True,
        "human_approved": True,
        "artifacts": {
            "render_report": {
                "version": "1.0",
                "outputs": [{
                    "path": "renders/output.mp4",
                    "format": "mp4",
                    "resolution": "1920x1080",
                    "duration_seconds": 10.0,
                }],
            }
        },
        "metadata": {
            # NO validation_mode metadata
        },
    }
    # With unresolvable pipeline_dir (omitted/None, not in PROJECTS_DIR), must fail closed
    with pytest.raises(CheckpointValidationError) as exc_info:
        validate_checkpoint(ckpt)
    assert "strict mode requires" in str(exc_info.value).lower() or "production validation" in str(exc_info.value).lower()


def test_checkpoint_gate_verified_non_production_legacy_honored(tmp_path):
    """Verified non-production workspace with explicit legacy marker stays honored."""
    proj_dir = init_project("nonprod-legacy-ckpt", title="Nonprod Legacy", pipeline_type="animated-explainer", pipeline_dir=tmp_path)
    # Set explicit legacy marker on project.json
    marker_path = proj_dir / "project.json"
    marker_data = json.loads(marker_path.read_text(encoding="utf-8"))
    marker_data["legacy"] = True
    marker_path.write_text(json.dumps(marker_data), encoding="utf-8")

    ckpt = {
        "version": "1.0",
        "project_id": "nonprod-legacy-ckpt",
        "pipeline_type": "animated-explainer",
        "stage": "compose",
        "status": "completed",
        "timestamp": "2026-11-08T00:00:00Z",
        "human_approval_required": True,
        "human_approved": True,
        "artifacts": {
            "render_report": {
                "version": "1.0",
                "outputs": [{
                    "path": "renders/output.mp4",
                    "format": "mp4",
                    "resolution": "1920x1080",
                    "duration_seconds": 10.0,
                }],
            }
        },
        "metadata": {
            "validation_mode": "legacy",
        },
    }
    # Must not raise on verified non-production legacy workspace
    validate_checkpoint(ckpt, pipeline_dir=tmp_path, project_id="nonprod-legacy-ckpt")


def test_checkpoint_gate_publish_stage_enforces_same_rules(tmp_path):
    """Publish stage enforces same strict mode and production workspace rules."""
    init_project("prod-publish-ckpt", title="Prod Publish", pipeline_type="animated-explainer", pipeline_dir=tmp_path)
    ckpt = {
        "version": "1.0",
        "project_id": "prod-publish-ckpt",
        "pipeline_type": "animated-explainer",
        "stage": "publish",
        "status": "completed",
        "timestamp": "2026-11-08T00:00:00Z",
        "human_approval_required": True,
        "human_approved": True,
        "artifacts": {
            "publish_log": {
                "version": "1.0",
                "entries": [{
                    "platform": "youtube",
                    "status": "exported",
                    "timestamp": "2026-11-08T00:00:00Z",
                }],
            }
        },
        "metadata": {
            "validation_mode": "legacy",
        },
    }
    with pytest.raises(CheckpointValidationError) as exc_info:
        validate_checkpoint(ckpt, pipeline_dir=tmp_path, project_id="prod-publish-ckpt")
    assert "production workspace enforces strict validation" in str(exc_info.value).lower()


# ---------------------------------------------------------------------------
# A-4 regression: bare validate_checkpoint call sites in lib/checkpoint.py
# ---------------------------------------------------------------------------
# wave-2 strict-default regression: read_checkpoint(), get_latest_checkpoint()
# and the prerequisite loop in _enforce_stage_prerequisites() call
# validate_checkpoint() WITHOUT pipeline_dir/project_id. For a legitimate
# non-production (legacy) workspace outside PROJECTS_DIR, mode resolution then
# classifies compose/publish as strict-on-ambiguous and raises:
#   - read_checkpoint / get_completed_stages raise on any compose checkpoint
#   - publish write deadlocks at "PREREQUISITE VIOLATION ... ['compose']"
# These tests pin the expected behavior: workspace context must propagate so
# mode resolution classifies legacy (honored) / production (strict) correctly.
# The negative control proves production workspaces keep hard-failing.

PIPELINE_TYPE_A4 = "animated-explainer"
A4_TIMESTAMP = "2026-11-08T00:00:00Z"


def _setup_legacy_workspace_a4(tmp_path: Path, name: str = "a4-legacy") -> dict:
    """Build a NON-PROJECTS_DIR workspace with the explicit legacy marker.

    This is the sanctioned non-production route: project.json with legacy
    flags in a verified non-projects dir, checkpoints carrying
    metadata.validation_mode='legacy'. Strict production evidence must NOT
    apply here.
    """
    pipeline_dir = tmp_path / name / "pipeline"
    project_id = f"{name}-proj"
    proj_dir = pipeline_dir / project_id
    (proj_dir / "artifacts").mkdir(parents=True, exist_ok=True)
    (proj_dir / "renders").mkdir(parents=True, exist_ok=True)
    (proj_dir / "project.json").write_text(json.dumps({
        "project_id": project_id,
        "title": "A-4 legacy fixture (non-production)",
        "legacy": True,
        "contract": "legacy",
        "validation_mode": "legacy",
    }, indent=2), encoding="utf-8")
    return {
        "pipeline_dir": pipeline_dir,
        "project_id": project_id,
        "proj_dir": proj_dir,
        "artifacts": proj_dir / "artifacts",
    }


def _a4_metadata() -> dict:
    return {"validation_mode": "legacy"}


def _a4_artifacts(stage: str) -> dict:
    """Minimal schema-valid canonical artifact per stage (legacy fixture data)."""
    if stage == "research":
        return {"research_brief": {
            "version": "1.0",
            "topic": "A-4 legacy fixture topic",
            "research_date": "2026-11-08",
            "landscape": {
                "existing_content": [
                    {"title": f"Existing {i}", "source": "youtube", "angle": "tutorial",
                     "what_it_covers": "Basics", "what_it_misses": "Pipeline depth"}
                    for i in range(1, 4)
                ],
                "saturated_angles": ["basic demos"],
                "underserved_gaps": ["end-to-end gate integrity"],
            },
            "data_points": [
                {"claim": f"Claim {i}", "source_url": "https://example.com/src",
                 "credibility": "primary_source"}
                for i in range(1, 4)
            ],
            "audience_insights": {
                "common_questions": ["How do gates stay strict?", "Why does context matter?", "What is a legacy marker?"],
                "misconceptions": [{"myth": "Gates block everything", "reality": "Gates block only unevidenced claims"}],
                "knowledge_level": "Familiar with pipelines",
            },
            "angles_discovered": [
                {"name": f"Angle {i}", "hook": f"Hook {i}", "type": "evergreen",
                 "why_now": "Gate hardening just shipped"}
                for i in range(1, 4)
            ],
            "sources": [
                {"url": f"https://example.com/src{i}", "title": f"Source {i}",
                 "used_for": "landscape"}
                for i in range(1, 6)
            ],
        }}
    if stage == "proposal":
        return {"proposal_packet": {
            "version": "1.0",
            "concept_options": [
                {"id": f"c{i}", "title": f"Concept {i}", "hook": f"Hook {i}",
                 "narrative_structure": "problem_solution", "visual_approach": "motion graphics",
                 "target_duration_seconds": 60, "why_this_works": "Research-grounded rationale"}
                for i in range(1, 4)
            ],
            "selected_concept": {"concept_id": "c1", "rationale": "Strongest research grounding"},
            "production_plan": {
                "pipeline": PIPELINE_TYPE_A4,
                "stages": [
                    {"stage": s, "tools": [], "approach": "fixture synthetic data"}
                    for s in ("research", "proposal", "script", "scene_plan",
                              "assets", "edit", "compose", "publish")
                ],
                "render_runtime": "remotion",
            },
            "cost_estimate": {
                "total_estimated_usd": 1.0,
                "line_items": [{"tool": "tts", "operation": "narration", "estimated_usd": 1.0}],
                "budget_verdict": "within_budget",
            },
            "approval": {"status": "approved"},
        }}
    if stage == "script":
        return {"script": {
            "version": "1.0",
            "title": "A-4 legacy fixture script",
            "total_duration_seconds": 10.0,
            "sections": [
                {"id": "s1", "text": "Legacy fixture narration.", "start_seconds": 0, "end_seconds": 10.0},
            ],
        }}
    if stage == "scene_plan":
        return {"scene_plan": {
            "version": "1.0",
            "scenes": [
                {"id": "scene-1", "type": "animation", "description": "Fixture scene",
                 "start_seconds": 0, "end_seconds": 10.0},
            ],
        }}
    if stage == "assets":
        return {"asset_manifest": {
            "version": "1.0",
            "assets": [
                {"id": "a1", "type": "image", "path": "assets/images/a1.png",
                 "source_tool": "fixture", "scene_id": "scene-1"},
            ],
        }}
    if stage == "edit":
        return {"edit_decisions": {
            "version": "1.0",
            "cuts": [],
            "render_runtime": "remotion",
        }}
    if stage == "compose":
        return {"render_report": {
            "version": "1.0",
            "outputs": [{
                "path": "renders/output.mp4",
                "format": "mp4",
                "resolution": "1920x1080",
                "duration_seconds": 10.0,
            }],
        }}
    if stage == "publish":
        return {"publish_log": {
            "version": "1.0",
            "entries": [{
                "platform": "youtube",
                "status": "draft",
                "timestamp": A4_TIMESTAMP,
            }],
        }}
    raise ValueError(f"No A-4 fixture artifact for stage {stage!r}")


def _write_chain_a4(ws, stages) -> None:
    """Write legacy checkpoints for the given stages via write_checkpoint.

    write_checkpoint already passes pipeline_dir/project_id, so every one of
    these writes must succeed both before and after the A-4 fix — the chain
    itself is not under test, only the bare read/re-validate sites.
    """
    for stage in stages:
        write_checkpoint(
            ws["pipeline_dir"], ws["project_id"], stage, "completed",
            artifacts=_a4_artifacts(stage),
            pipeline_type=PIPELINE_TYPE_A4,
            human_approved=True,
            metadata=_a4_metadata(),
        )


def _write_compose_a4(ws) -> None:
    _write_chain_a4(ws, ["compose"])


def test_a4_legacy_compose_readable_via_read_checkpoint(tmp_path):
    """A-4 (1): legacy compose checkpoint must be readable via read_checkpoint.

    RED (pre-fix): read_checkpoint calls validate_checkpoint() bare; the
    strict-on-ambiguous default raises
    "strict mode requires resolvable pipeline_dir and project_id".
    GREEN (post-fix): workspace context propagates, legacy is honored, the
    record returns.
    """
    ws = _setup_legacy_workspace_a4(tmp_path)
    _write_chain_a4(ws, ["research", "proposal", "script", "scene_plan", "assets", "edit"])
    _write_compose_a4(ws)

    ckpt = read_checkpoint(ws["pipeline_dir"], ws["project_id"], "compose")
    assert ckpt is not None, "legacy compose checkpoint must be readable"
    assert ckpt.get("stage") == "compose"
    assert ckpt.get("status") == "completed"
    assert ckpt.get("project_id") == ws["project_id"]


def test_a4_legacy_completed_stages_and_latest_checkpoint(tmp_path):
    """A-4 (2): get_completed_stages / get_latest_checkpoint must not raise.

    RED (pre-fix): get_completed_stages -> read_checkpoint -> bare validate
    raises once a compose checkpoint exists on disk; get_latest_checkpoint
    likewise returns the compose checkpoint and raises.
    GREEN (post-fix): both succeed and report compose as completed.
    """
    from lib.checkpoint import get_completed_stages, get_latest_checkpoint

    ws = _setup_legacy_workspace_a4(tmp_path)
    _write_chain_a4(ws, ["research", "proposal", "script", "scene_plan", "assets", "edit"])
    _write_compose_a4(ws)

    completed = get_completed_stages(ws["pipeline_dir"], ws["project_id"], PIPELINE_TYPE_A4)
    assert "compose" in completed, f"compose must be reported completed, got {completed}"

    latest = get_latest_checkpoint(ws["pipeline_dir"], ws["project_id"])
    assert latest is not None
    assert latest.get("stage") == "compose"


def test_a4_legacy_publish_write_passes_compose_prerequisite(tmp_path):
    """A-4 (3): publish must pass its prerequisite re-validation of compose.

    RED (pre-fix): the prerequisite loop in _enforce_stage_prerequisites
    re-validates the compose predecessor bare; strict-on-ambiguous raises,
    the exception is swallowed into "incomplete", and the publish write dies
    with "PREREQUISITE VIOLATION ... incomplete or missing: ['compose']".
    GREEN (post-fix): compose re-validates as legacy, publish writes, and the
    publish checkpoint is readable.
    """
    ws = _setup_legacy_workspace_a4(tmp_path)
    _write_chain_a4(ws, ["research", "proposal", "script", "scene_plan", "assets", "edit"])
    _write_compose_a4(ws)

    publish_path = write_checkpoint(
        ws["pipeline_dir"], ws["project_id"], "publish", "completed",
        artifacts=_a4_artifacts("publish"),
        pipeline_type=PIPELINE_TYPE_A4,
        human_approved=True,
        metadata=_a4_metadata(),
    )
    assert publish_path.exists()

    publish_ckpt = read_checkpoint(ws["pipeline_dir"], ws["project_id"], "publish")
    assert publish_ckpt is not None
    assert publish_ckpt.get("stage") == "publish"
    assert publish_ckpt.get("status") == "completed"


def test_a4_negative_production_compose_without_evidence_still_raises(tmp_path):
    """A-4 NEGATIVE control: production workspace must keep hard-failing.

    A compose checkpoint in a production workspace (project.json marker
    WITHOUT legacy flags) with no production evidence must still be rejected
    on the read path after the A-4 context propagation — proving the fix
    supplies workspace context only and does not weaken the gate.
    """
    prod_pipeline_dir = tmp_path / "a4-prod" / "pipeline"
    project_id = "a4-prod-proj"
    init_project(
        project_id, title="A-4 prod negative control",
        pipeline_type=PIPELINE_TYPE_A4, pipeline_dir=prod_pipeline_dir,
    )  # marker written WITHOUT legacy flags -> production workspace

    strict_ckpt = {
        "version": "1.0",
        "project_id": project_id,
        "pipeline_type": PIPELINE_TYPE_A4,
        "stage": "compose",
        "status": "completed",
        "timestamp": A4_TIMESTAMP,
        "human_approval_required": True,
        "human_approved": True,
        "artifacts": {
            "render_report": {
                "version": "1.0",
                "outputs": [{
                    "path": "renders/output.mp4",
                    "format": "mp4",
                    "resolution": "1920x1080",
                    "duration_seconds": 10.0,
                }],
            }
        },
        "metadata": {
            "validation_mode": "strict",
            # Note: NO production_validation_report -> strict gate must reject
        },
    }
    ckpt_path = prod_pipeline_dir / project_id / "checkpoint_compose.json"
    ckpt_path.write_text(json.dumps(strict_ckpt), encoding="utf-8")

    # Read path must raise (no silent success, no evidence bypass).
    with pytest.raises(CheckpointValidationError) as exc_info:
        read_checkpoint(prod_pipeline_dir, project_id, "compose")
    assert "production validation gate failed" in str(exc_info.value).lower()

    # Predicate path must raise too, not silently drop the stage.
    with pytest.raises(CheckpointValidationError):
        get_completed_stages(prod_pipeline_dir, project_id, PIPELINE_TYPE_A4)

    # Bypass-stamped record must also be rejected on the read path. The exact
    # message differs pre-fix (ambiguous-context raise) vs post-fix (Issue-1b
    # stamp consumption), but rejection is the invariant that must hold.
    stamped = json.loads(json.dumps(strict_ckpt))
    stamped["artifacts"]["render_report"]["metadata"] = {"non_production_bypass": True}
    ckpt_path.write_text(json.dumps(stamped), encoding="utf-8")
    with pytest.raises(CheckpointValidationError):
        read_checkpoint(prod_pipeline_dir, project_id, "compose")


