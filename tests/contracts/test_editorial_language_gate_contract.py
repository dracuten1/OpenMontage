"""Contract tests for the editorial-language pre-render gate.

Covers:
- gate calibration on committed synthetic fixtures (reference PASS / regression
  FAIL / missing-contract FAIL + design-H adversarial cases),
- lane wiring regressions: non-editorial byte-identity golden (captured at
  3d538b6 semantics BEFORE the lib edit), C1-widened union intersection,
  singleton narrowing bug reproduction, producer-not-invoked pin (M2),
  producer-crash semantics (M7), scene-coverage id alignment (M5),
- the framework A-2 hash flip on a stripped-hashes PASS record,
- optional skipif integration against the real on-disk fixtures.

The producer resolves its composition source under
``remotion-composer/src/<project_id>/`` in production; committed synthetic
fixtures carry their composition under ``<case>/comp/`` and pass it via the
producer's explicit ``composition_root_override`` audit seam (CLI + compose
wiring never pass it).
"""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from lib.production_validation import (
    GATE_EDITORIAL_LANGUAGE,
    GATE_LAYOUT,
    GATE_PROVENANCE_FRESHNESS,
    GATE_SEMANTIC_EVENTS,
    GATE_SFX_MIX,
    GATE_TIMING_AUDIO,
    REQUIRED_PRE_RENDER_GATES,
    EvidenceRecord,
    ValidationStatus,
    create_evidence_record,
    hash_file,
    validate_pre_render,
)
from tools.qc.editorial_language_gate import (
    analyze_project,
    build_gate_artifacts,
    resolve_manifest_path,
    run_editorial_language_gate,
)

FIXTURE_ROOT = REPO_ROOT / "tests" / "fixtures" / "editorial_language_gate"


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _dir_hash(root: Path) -> dict[str, str]:
    out = {}
    for p in sorted(root.rglob("*")):
        if p.is_file():
            out[str(p.relative_to(root))] = hashlib.sha256(p.read_bytes()).hexdigest()
    return out


def _materialize(case: str, tmp_path: Path) -> Path:
    """Copy a committed fixture to tmp (the gate writes qc/ + artifacts/ into
    the project dir — committed fixtures must never be mutated)."""
    src = FIXTURE_ROOT / case
    work = tmp_path / case
    shutil.copytree(src, work)
    return work


def _run_gate(project: Path, force: bool = False):
    """Test harness: analyze with the comp override seam (analyze_project only —
    run_editorial_language_gate has NO override, MINOR 7), then build the
    producer artifacts from the report."""
    comp = project / "comp"
    report = analyze_project(
        project,
        force_editorial=force,
        composition_root_override=comp if comp.is_dir() else None,
    )
    return build_gate_artifacts(report, project, write_outputs=True)


def _cli(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, "tools/qc/editorial_language_gate.py", *args],
        cwd=REPO_ROOT, capture_output=True, text=True,
    )


def _findings(qc: dict, rule: str | None = None, status: str | None = None) -> list[dict]:
    out = []
    for f in qc["findings"]:
        if rule is not None and f["rule"] != rule:
            continue
        if status is not None and f["status"] != status:
            continue
        out.append(f)
    return out


# ---------------------------------------------------------------------------
# calibration on committed synthetic fixtures
# ---------------------------------------------------------------------------

def test_case01_reference_pass(tmp_path):
    project = _materialize("case01-pass-xd-shape", tmp_path)
    before = _dir_hash(FIXTURE_ROOT / "case01-pass-xd-shape")
    qc, record = _run_gate(project, force=True)

    assert qc["activated"] is True
    assert qc["pass"] is True
    assert qc["errors"] == []
    assert qc["stats"]["scenes"] == 4
    # m1 vocabulary: findings are pass/blocked + advisory revise (a REVISE
    # EvidenceRecord would flip can_render() — the record below stays PASS).
    statuses = {f["status"] for f in qc["findings"]}
    assert statuses <= {"pass", "blocked", "revise"}
    revise = [f for f in qc["findings"] if f["status"] == "revise"]
    for rv in revise:
        assert rv["code"] == "EL-DATA-VIZ-ADVISORY"
        assert any("advisory" in w and rv["scene_id"] in w for w in qc["warnings"])
    # C2 explicit asserts: s1 cutout credited at step 1, s2 multi-term annotation at step 4
    s1 = next(f for f in _findings(qc, "graphic-native-required") if f["scene_id"] == "scene_s1")
    assert "cutout" in s1["message"]
    s2 = next(f for f in _findings(qc, "graphic-native-required") if f["scene_id"] == "scene_s2")
    assert "role+method credit" in s2["message"]
    # MAJOR 3 pin: Mixed.tsx holds ONE chart body AND ONE card body — the chart
    # layer credits GENUINE, the card layer is vetoed, from the SAME file.
    assert "MixedChart declares genuine chart structure" in s2["message"]
    assert "card-stack" in s2["message"] and "MixedCard" in s2["message"]
    # C3: the s1 advisory rides in warnings[], findings[] stays pass/blocked
    assert any("scene_s1" in w and "data_viz" in w for w in qc["warnings"])
    assert {f["status"] for f in qc["findings"]} <= {"pass", "blocked", "revise"}

    assert record.status == ValidationStatus.PASS
    assert record.gate_name == "editorial-language"
    assert record.scope == "pre_render"
    # M5: coverage from the manifest scene_id universe, verbatim
    assert record.scene_coverage == ["scene_s1", "scene_s2", "scene_s3", "scene_s4"]
    assert record.expected_scenes == record.scene_coverage
    assert record.fingerprint
    rel = "artifacts/editorial_language_evidence.json"
    assert record.artifact_hashes == {rel: hash_file(project / rel)}
    assert "scene_manifest.json" in record.metadata["input_hashes"]

    # qc + evidence outputs written, committed fixture untouched
    assert (project / "qc" / "editorial_language.json").is_file()
    assert _dir_hash(FIXTURE_ROOT / "case01-pass-xd-shape") == before


def test_case02_regression_fail(tmp_path):
    project = _materialize("case02-fail-ml-shape", tmp_path)
    qc, record = _run_gate(project)

    assert qc["pass"] is False
    assert record.status == ValidationStatus.BLOCKED
    assert record.severity == "critical"

    # R1: all four contract sections absent
    r1 = _findings(qc, "contract-sections", "blocked")
    assert len(r1) == 4

    # R2: card-stack components matched as NOT genuine — exactly the 7 bad content scenes
    r2_blocked = {f["scene_id"] for f in _findings(qc, "graphic-native-required", "blocked")}
    assert r2_blocked == {"scene-1", "scene-2", "scene-4", "scene-5", "scene-6", "scene-7", "scene-9"}
    r2_pass = {f["scene_id"] for f in _findings(qc, "graphic-native-required", "pass")}
    assert r2_pass == {"scene-3", "scene-8"}
    # scene-10 is closing (last position, signature subset) — exempt from R2
    assert "scene-10" not in r2_blocked | r2_pass
    joined = json.dumps(qc["findings"], ensure_ascii=False)
    assert "card-stack" in joined and "StatChipRow" in joined
    assert "VerdictCardStack" in joined
    # genuine chart structure credited for the two real charts
    assert "BarChartCountUp" in joined and "HBarChartExclusive" in joined

    # R3: full-frame heroes/background_texture blocked on all 10 scenes
    r3_blocked = [f for f in _findings(qc, "photo-frame-dominance", "blocked")]
    assert len(r3_blocked) == 10
    assert any("photo-as-hero" in f["message"] for f in r3_blocked)

    # R4: anchor leaf count pinned by the fixture README (N=3), spread across
    # sfx trigger_frame + layers motion + an UNKNOWN top-level key so a
    # fixed-field scan under-counts (MAJOR 4)
    r4 = _findings(qc, "unresolved-anchor", "blocked")
    assert len(r4) == 3
    assert any("sfx_cues" in f["message"] for f in r4)
    assert any("motion/enter/start_frame" in f["message"] for f in r4)
    assert any("production_notes" in f["message"] for f in r4)

    assert record.issues  # per-finding EL-* codes on the blocked record


def test_case03_missing_contract_fail(tmp_path):
    project = _materialize("case03-missing-contract", tmp_path)
    qc, _record = _run_gate(project, force=True)

    assert qc["pass"] is False
    blocked = _findings(qc, status="blocked")
    assert len(blocked) == 1  # isolation — no cross-rule masking
    assert blocked[0]["code"] == "EL-CONTRACT-SECTION-MISSING"
    assert "speech_lock_contract" in blocked[0]["message"]
    for rule in ("graphic-native-required", "photo-frame-dominance", "unresolved-anchor"):
        assert not _findings(qc, rule, "blocked")


def test_case04_unlocatable_source(tmp_path):
    project = _materialize("case04-no-source", tmp_path)
    qc, record = _run_gate(project)  # auto-activates via manifest lane key

    assert qc["pass"] is False
    codes = [f["code"] for f in _findings(qc, status="blocked")]
    assert "EL-SOURCE-ROOT-MISSING" in codes
    assert record.status == ValidationStatus.BLOCKED

    # CLI surface on the same shape: exit 1 (blocked findings)
    result = _cli(["--project", str(project)])
    assert result.returncode == 1


def test_case05_bad_manifest_exit_2(tmp_path):
    project = _materialize("case05-bad-manifest", tmp_path)
    result = _cli(["--project", str(project), "--force-editorial"])
    assert result.returncode == 2
    assert "EL-MANIFEST-UNPARSEABLE" in result.stderr
    # abort BEFORE rules: zero findings, no partial evidence accepted
    assert not (project / "qc" / "editorial_language.json").exists()
    assert not (project / "artifacts" / "editorial_language_evidence.json").exists()


def test_case06_ambiguous_map(tmp_path):
    project = _materialize("case06-ambiguous-map", tmp_path)
    qc, _record = _run_gate(project)

    assert qc["pass"] is False
    amb = [f for f in _findings(qc, status="blocked") if f["code"] == "EL-MAP-AMBIGUOUS"]
    assert len(amb) == 1
    assert "S03.tsx" in amb[0]["message"] and "S03_v2.tsx" in amb[0]["message"]


def test_case07_graphless_mid_scene_scoped(tmp_path):
    project = _materialize("case07-graphless-mid", tmp_path)
    qc, _record = _run_gate(project)

    assert qc["pass"] is False
    r2_blocked = {f["scene_id"] for f in _findings(qc, "graphic-native-required", "blocked")}
    assert r2_blocked == {"scene-3"}  # scope precision — only the graphic-less mid scene
    r2_pass = {f["scene_id"] for f in _findings(qc, "graphic-native-required", "pass")}
    assert r2_pass == {"scene-1", "scene-2", "scene-4", "scene-5"}


def test_case08_closing_cap_breach(tmp_path):
    project = _materialize("case08-closing-cap", tmp_path)
    qc, _record = _run_gate(project)

    assert qc["pass"] is False
    cap = [f for f in _findings(qc, status="blocked") if f["code"] == "EL-CLOSING-CAP-BREACH"]
    assert len(cap) == 1
    assert "scene-1" in cap[0]["message"] and "scene-2" in cap[0]["message"]


def test_case09_hero_only_blocked(tmp_path):
    project = _materialize("case09-hero-only", tmp_path)
    qc, _record = _run_gate(project)

    assert qc["pass"] is False
    r3 = [f for f in _findings(qc, "photo-frame-dominance", "blocked") if f["scene_id"] == "scene-1"]
    assert len(r3) == 1
    assert "photo-as-hero" in r3[0]["message"]


def test_lane_mismatch_only_when_declared_and_contradicting(tmp_path):
    # M3 (a): --force-editorial on a NON-declaring project must NOT fire EL-LANE-MISMATCH
    project = _materialize("case01-pass-xd-shape", tmp_path)
    qc, _record = _run_gate(project, force=True)
    assert not [f for f in qc["findings"] if f["code"] == "EL-LANE-MISMATCH"]

    # M3 (b): declaring manifest + contradicting project.json pipeline_type fires
    project2 = _materialize("case04-no-source", tmp_path / "b")
    (project2 / "project.json").write_text(
        json.dumps({"pipeline_type": "cinematic"}), encoding="utf-8")
    qc2, _record2 = _run_gate(project2)
    mismatch = [f for f in qc2["findings"] if f["code"] == "EL-LANE-MISMATCH"]
    assert len(mismatch) == 1
    assert "cinematic" in mismatch[0]["message"]


# ---------------------------------------------------------------------------
# wiring regression — non-editorial byte identity (M2 golden, 3d538b6 semantics)
# ---------------------------------------------------------------------------

def _golden_report(tmp_path: Path):
    work = tmp_path / "case00-non-editorial-golden"
    shutil.copytree(FIXTURE_ROOT / "case00-non-editorial-golden", work)
    evidence = {
        GATE_LAYOUT: "layout_evidence.json",
        GATE_TIMING_AUDIO: "timing_evidence.json",
        GATE_SEMANTIC_EVENTS: "semantic_evidence.json",
        GATE_SFX_MIX: "sfx_evidence.json",
    }
    records = []
    for gate, fname in evidence.items():
        rel = f"artifacts/{fname}"
        records.append(create_evidence_record(
            gate_name=gate, scene_coverage=["s1", "s2"], evidence_paths=[rel],
            artifact_hashes={rel: hash_file(work / rel)},
        ))
    prov_rel = "artifacts/provenance_evidence.json"
    records.append(create_evidence_record(
        gate_name=GATE_PROVENANCE_FRESHNESS, scene_coverage=[], evidence_paths=[prov_rel],
        artifact_hashes={prov_rel: hash_file(work / prov_rel)},
    ))
    edit_decisions = json.loads((work / "edit_decisions.json").read_text(encoding="utf-8"))
    # required_gates kwarg ABSENT — the non-editorial path
    return validate_pre_render(
        project_dir=work, edit_decisions=edit_decisions, mode="strict",
        pipeline_type="animation", evidence_records=records,
    )


def test_non_editorial_byte_identity_golden(tmp_path):
    """Kids-shaped fixture, required_gates=None: report serialization must equal
    the committed golden captured at 3d538b6 (pre-lib-edit) semantics."""
    report = _golden_report(tmp_path)
    blob = json.dumps(report.to_dict(), sort_keys=True, ensure_ascii=False, indent=1)
    golden = (FIXTURE_ROOT / "case00-non-editorial-golden" / "golden_validate_report.json").read_text(encoding="utf-8")
    assert blob + "\n" == golden
    assert report.status == ValidationStatus.PASS
    assert report.can_render() is True


# ---------------------------------------------------------------------------
# wiring regression — required_gates intersection (C1)
# ---------------------------------------------------------------------------

def _canonical_records(project: Path, scene_ids: list[str]) -> list[EvidenceRecord]:
    files = {
        GATE_LAYOUT: "layout_evidence.json",
        GATE_TIMING_AUDIO: "timing_evidence.json",
        GATE_SEMANTIC_EVENTS: "semantic_evidence.json",
        GATE_SFX_MIX: "sfx_evidence.json",
    }
    records = []
    for gate, fname in files.items():
        rel = f"artifacts/{fname}"
        records.append(create_evidence_record(
            gate_name=gate, scene_coverage=list(scene_ids), evidence_paths=[rel],
            artifact_hashes={rel: hash_file(project / rel)},
        ))
    prov_rel = "artifacts/provenance_evidence.json"
    records.append(create_evidence_record(
        gate_name=GATE_PROVENANCE_FRESHNESS, scene_coverage=[], evidence_paths=[prov_rel],
        artifact_hashes={prov_rel: hash_file(project / prov_rel)},
    ))
    return records


def _editorial_project(tmp_path: Path) -> Path:
    """Minimal editorial project: lane-declared manifest, clean 2-scene shape,
    compositions under <project>/comp (passed via the override seam)."""
    project = tmp_path / "elg-wiring-editorial"
    (project / "artifacts").mkdir(parents=True)
    comp = project / "comp"
    (comp / "scenes").mkdir(parents=True)
    manifest = {
        "project_id": "elg-wiring-editorial",
        "lane": "news-editorial-motion",
        "canvas": {"width": 1080, "height": 1920, "fps": 30},
        "speech_lock_contract": "contract",
        "camera_rig": {"action": "drift"},
        "physics": {"rule": "no bounce"},
        "global_overlays": [{"type": "grain"}],
        "scenes": [
            {"scene_id": "scene-1", "layers": [
                {"layer_id": "bg", "role": "background", "pipeline": {"method": "t2i", "file": "bp.png"}},
                {"layer_id": "cut", "role": "document_cutout",
                 "pipeline": {"method": "t2i_chroma_key", "file": "cut.png"}},
            ]},
            {"scene_id": "scene-2", "layers": [
                {"layer_id": "bg", "role": "background", "pipeline": {"method": "t2i", "file": "bp.png"}},
                {"layer_id": "cut", "role": "document_cutout",
                 "pipeline": {"method": "t2i_chroma_key", "file": "cut.png"}},
            ]},
        ],
    }
    (project / "scene_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    for i, sid in enumerate(("1", "2"), start=1):
        (comp / "scenes" / f"S{i:02d}.tsx").write_text(
            f"export const Scene{i:02d}: React.FC = () => <div />;\n", encoding="utf-8")
    for fname, payload in (
        ("layout_evidence.json", {"verified": True}),
        ("timing_evidence.json", {"timing_verified": True}),
        ("semantic_evidence.json", {"events_verified": True}),
        ("sfx_evidence.json", {"mix_verified": True}),
        ("provenance_evidence.json", {"provenance_verified": True}),
    ):
        (project / "artifacts" / fname).write_text(json.dumps(payload), encoding="utf-8")
    return project


def test_union_required_gates_preserves_canonical_plus_editorial(tmp_path):
    """C1-widened intersection: the UNION kwarg enforces all 5 canonical gates
    PLUS editorial-language; missing editorial evidence => exactly one synthetic
    BLOCKED naming editorial-language; canonical coverage stays satisfied."""
    project = _editorial_project(tmp_path)

    # union + editorial evidence present (real producer) -> PASS, zero synthetic records
    qc, record = _run_gate(project)
    assert record.status == ValidationStatus.PASS
    # M5 id alignment on the record: producer coverage == manifest scene ids verbatim
    assert record.scene_coverage == ["scene-1", "scene-2"]
    assert record.expected_scenes == ["scene-1", "scene-2"]
    report = validate_pre_render(
        project_dir=project,
        edit_decisions={"cuts": [{"id": "scene-1"}, {"id": "scene-2"}]},
        mode="strict",
        pipeline_type="animated-explainer",
        evidence_records=_canonical_records(project, ["scene-1", "scene-2"]) + [record],
        required_gates=sorted(REQUIRED_PRE_RENDER_GATES | {GATE_EDITORIAL_LANGUAGE}),
    )
    synthetic = [r for r in report.records if r.gate_name == GATE_EDITORIAL_LANGUAGE
                 and "missing verified PASS coverage" in "".join(r.issues)]
    assert synthetic == []
    assert report.status == ValidationStatus.PASS
    assert report.can_render() is True

    # union WITHOUT the editorial record -> synthetic BLOCKED for editorial-language only
    report2 = validate_pre_render(
        project_dir=project,
        edit_decisions={"cuts": [{"id": "scene-1"}, {"id": "scene-2"}]},
        mode="strict",
        pipeline_type="animated-explainer",
        evidence_records=_canonical_records(project, ["scene-1", "scene-2"]),
        required_gates=sorted(REQUIRED_PRE_RENDER_GATES | {GATE_EDITORIAL_LANGUAGE}),
    )
    editorial_blocked = [r for r in report2.records
                         if r.gate_name == GATE_EDITORIAL_LANGUAGE and r.status == ValidationStatus.BLOCKED
                         and any(i.startswith("Required gate 'editorial-language' missing verified PASS coverage")
                                 for i in r.issues)]
    assert len(editorial_blocked) == 1
    assert report2.can_render() is False


def test_singleton_required_gates_narrowing_pinned(tmp_path):
    """Post-C1 bug-reproduction pin: a singleton kwarg enforces editorial-language
    but narrows away the canonical gates (documented kwarg semantics — callers
    must always pass the union)."""
    project = _editorial_project(tmp_path)
    report = validate_pre_render(
        project_dir=project,
        edit_decisions={"cuts": [{"id": "scene-1"}, {"id": "scene-2"}]},
        mode="strict",
        pipeline_type="animated-explainer",
        evidence_records=_canonical_records(project, ["scene-1", "scene-2"]),
        required_gates=[GATE_EDITORIAL_LANGUAGE],
    )
    synthetic = [r for r in report.records
                 if any(i.startswith("Required gate") for i in r.issues)]
    assert {r.gate_name for r in synthetic} == {GATE_EDITORIAL_LANGUAGE}
    assert report.can_render() is False


# ---------------------------------------------------------------------------
# compose wiring (M2 producer-not-invoked pin, M7 crash semantics, M5 alignment)
# ---------------------------------------------------------------------------

def _compose_inputs(project: Path) -> dict:
    records = _canonical_records(project, ["scene-1", "scene-2"])
    return {
        "operation": "render",
        "project_dir": str(project),
        "output_path": str(project / "renders" / "output.mp4"),
        "validation_mode": "strict",
        "pipeline_type": "animated-explainer",
        "edit_decisions": {
            "version": "1.0",
            "render_runtime": "remotion",
            "renderer_family": "explainer-data",
            "cuts": [{"id": "scene-1"}, {"id": "scene-2"}],
        },
        "asset_manifest": {"version": "1.0", "assets": []},
        "evidence_records": [r.to_dict() for r in records],
    }


def _stub_render(tool, project: Path, monkeypatch) -> None:
    from tools.base_tool import ToolResult
    out_file = project / "renders" / "output.mp4"
    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_bytes(b"dummy mp4")
    monkeypatch.setattr(tool, "_remotion_render", lambda inputs: ToolResult(
        success=True, data={"rendered": True, "output": str(out_file)},
        artifacts=[str(out_file)],
    ))
    monkeypatch.setattr(tool, "_run_final_review", lambda *a, **k: {"status": "pass", "issues": []})


def test_producer_not_invoked_when_lane_not_detected(tmp_path, monkeypatch):
    """M2 caller-level pin: kids-shaped project => detection None => the producer
    is never invoked and the compose result is byte-identical in behavior."""
    from tools.video.video_compose import VideoCompose
    import tools.qc.editorial_language_gate as elg

    project = tmp_path / "elg-kids"
    shutil.copytree(FIXTURE_ROOT / "case00-non-editorial-golden", project)

    calls: list = []
    real = elg.run_editorial_language_gate

    def spy(*args, **kwargs):
        calls.append((args, kwargs))
        return real(*args, **kwargs)

    monkeypatch.setattr(elg, "run_editorial_language_gate", spy)

    tool = VideoCompose()
    _stub_render(tool, project, monkeypatch)
    result = tool.execute(_compose_inputs_kids(project))
    assert result.success is True, f"compose should proceed: {result.error}"
    assert calls == []  # producer never invoked on the non-editorial path


def _compose_inputs_kids(project: Path) -> dict:
    records = _canonical_records(project, ["s1", "s2"])
    return {
        "operation": "render",
        "project_dir": str(project),
        "output_path": str(project / "renders" / "output.mp4"),
        "validation_mode": "strict",
        "pipeline_type": "animation",
        "edit_decisions": {
            "version": "1.0",
            "render_runtime": "remotion",
            "renderer_family": "explainer-data",
            "cuts": [{"id": "s1"}, {"id": "s2"}],
        },
        "asset_manifest": {"version": "1.0", "assets": []},
        "evidence_records": [r.to_dict() for r in records],
    }


def _compose_op_inputs(project: Path) -> dict:
    """operation='compose' inputs — the path M-B guards (no render stage)."""
    return {
        "operation": "compose",
        "project_dir": str(project),
        "output_path": str(project / "renders" / "output.mp4"),
        "validation_mode": "strict",
        "pipeline_type": "animated-explainer",
        "edit_decisions": {
            "version": "1.0",
            "render_runtime": "ffmpeg",
            "cuts": [{"id": "scene-1"}, {"id": "scene-2"}],
        },
    }

def _append_photo_only_scene(project: Path) -> None:
    """Append a content scene whose ONLY photo layer is unmeasurable and whose
    cutout-role layer claims plain `t2i` (not genuine) — R3 fail-close case."""
    manifest_path = project / "scene_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["scenes"].append({
        "scene_id": "scene-3", "narrative_beat": "photo-only scene",
        "duration_frames": 90, "start_frame_global": 300,
        "layers": [
            {"layer_id": "phx", "z_index": 10, "role": "background_texture",
             "pipeline": {"method": "t2i", "prompt": "documentary backdrop"}},
            {"layer_id": "cutfail", "z_index": 40, "role": "document_cutout",
             "pipeline": {"method": "t2i", "file": "cut.png"}},
        ],
    })
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

def test_mab_compose_op_blocked_before_any_output(tmp_path, monkeypatch):
    """M-B: a BLOCKED editorial-language gate on operation='compose' aborts
    BEFORE output_path.mkdir — zero compose output, no renders/ dir."""
    from tools.video.video_compose import VideoCompose
    import tools.qc.editorial_language_gate as elg

    project = _editorial_project(tmp_path)
    _append_photo_only_scene(project)
    comp = project / "comp"
    (comp / "scenes" / "S03.tsx").write_text(
        "export const Scene03: React.FC = () => <div />;\n", encoding="utf-8")
    monkeypatch.setattr(
        elg, "_composition_root",
        lambda project_dir, manifest, override=None: comp,
    )

    tool = VideoCompose()
    result = tool.execute(_compose_op_inputs(project))
    assert result.success is False
    assert "editorial-language" in result.error
    assert not (project / "renders").exists(), "renders/ dir must NOT exist — gate aborted before mkdir"
    assert not (project / "renders" / "output.mp4").exists()

def test_mab_compose_op_producer_crash_blocks_before_output(tmp_path, monkeypatch):
    """M-B + M7 at the compose point: producer crash => BLOCKED (validation
    still runs) and NO compose output."""
    from tools.video.video_compose import VideoCompose
    import tools.qc.editorial_language_gate as elg

    project = _editorial_project(tmp_path)
    comp = project / "comp"
    monkeypatch.setattr(
        elg, "_composition_root",
        lambda project_dir, manifest, override=None: comp,
    )

    def boom(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(elg, "run_editorial_language_gate", boom)

    tool = VideoCompose()
    result = tool.execute(_compose_op_inputs(project))
    assert result.success is False
    assert "EL-PRODUCER-CRASHED" in result.error
    assert "production_validation" in (result.data or {})
    assert not (project / "renders").exists(), "renders/ dir must NOT exist on producer crash"

def test_mab_compose_op_compliant_editorial_proceeds_past_preflight(tmp_path, monkeypatch):
    """M-B positive: a compliant editorial compose passes the preflight and
    reaches the normal compose flow (output dir created by mkdir)."""
    from tools.video.video_compose import VideoCompose
    import tools.qc.editorial_language_gate as elg

    project = _editorial_project(tmp_path)
    comp = project / "comp"
    monkeypatch.setattr(
        elg, "_composition_root",
        lambda project_dir, manifest, override=None: comp,
    )

    tool = VideoCompose()
    result = tool.execute(_compose_op_inputs(project))
    # preflight passed (gate PASS) — compose proceeds past mkdir into cut
    # handling (cuts reference no real media here, so it fails LATER, at the
    # cut-source check, exactly like any non-editorial compose would).
    assert (project / "renders").is_dir()
    assert "editorial-language" not in (result.error or "")

def test_mab_compose_op_non_editorial_preflight_noop(tmp_path):
    """M-B: non-editorial compose op — the preflight is a no-op (editorial lane
    not detected) and the compose flow proceeds unchanged into mkdir + cut
    handling."""
    from tools.video.video_compose import VideoCompose

    project = tmp_path / "elg-kids-compose"
    shutil.copytree(FIXTURE_ROOT / "case00-non-editorial-golden", project)

    tool = VideoCompose()
    result = tool.execute(_compose_op_inputs(project))
    assert (project / "renders").is_dir()
    assert "editorial-language" not in (result.error or "")

def test_producer_crash_blocked_and_validation_still_runs(tmp_path, monkeypatch):
    """M7: producer exception => BLOCKED record (EL-PRODUCER-CRASHED) AND
    validate_pre_render still executes (synthetic missing-coverage record)."""
    from tools.video.video_compose import VideoCompose
    import tools.qc.editorial_language_gate as elg

    project = _editorial_project(tmp_path)

    def boom(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(elg, "run_editorial_language_gate", boom)

    tool = VideoCompose()
    result = tool.execute(_compose_inputs(project))
    assert result.success is False
    assert "EL-PRODUCER-CRASHED" in result.error
    records = result.data["production_validation"]["records"]
    el_records = [r for r in records if r["gate_name"] == GATE_EDITORIAL_LANGUAGE]
    assert el_records, "editorial-language records must be present"
    assert any("EL-PRODUCER-CRASHED: boom" in i for r in el_records for i in r["issues"])
    # validation was NOT skipped: the framework synthetic record also fired
    assert any(i.startswith("Required gate 'editorial-language' missing verified PASS coverage")
               for r in el_records for i in r["issues"])


def test_editorial_compose_proceeds_and_ids_align(tmp_path, monkeypatch):
    """M5 + positive wiring: the REAL producer runs through the compose path,
    coverage ids align with the manifest scene universe, and compose proceeds."""
    from tools.video.video_compose import VideoCompose
    import tools.qc.editorial_language_gate as elg

    project = _editorial_project(tmp_path)
    comp = project / "comp"
    monkeypatch.setattr(
        elg, "_composition_root",
        lambda project_dir, manifest, override=None: comp,
    )

    tool = VideoCompose()
    _stub_render(tool, project, monkeypatch)
    result = tool.execute(_compose_inputs(project))
    assert result.success is True, f"compose should proceed: {result.error}"

    qc = json.loads((project / "qc" / "editorial_language.json").read_text(encoding="utf-8"))
    assert qc["pass"] is True
    qc, record = run_editorial_language_gate(project)
    # M5: producer coverage == manifest scene_id array == compose target_scenes universe
    manifest_ids = [s["scene_id"] for s in json.loads(
        (project / "scene_manifest.json").read_text(encoding="utf-8"))["scenes"]]
    assert record.scene_coverage == manifest_ids == ["scene-1", "scene-2"]
    assert record.metadata["input_hashes"].get("scene_manifest.json")


# ---------------------------------------------------------------------------
# framework A-2 flip (case10) — stripped hashes on a PASS record
# ---------------------------------------------------------------------------

def test_stripped_hashes_pass_record_flips_blocked(tmp_path):
    project = _editorial_project(tmp_path)
    ev_rel = "artifacts/layout_evidence.json"
    stripped = create_evidence_record(
        gate_name=GATE_LAYOUT, scene_coverage=["scene-1", "scene-2"],
        evidence_paths=[ev_rel], status=ValidationStatus.PASS,
        artifact_hashes={},  # existence-only evidence — forgery surface
    )
    report = validate_pre_render(
        project_dir=project,
        edit_decisions={"cuts": [{"id": "scene-1"}, {"id": "scene-2"}]},
        mode="strict",
        pipeline_type="animated-explainer",
        evidence_records=[stripped],
        required_gates=[GATE_LAYOUT],
    )
    assert stripped.status == ValidationStatus.BLOCKED
    assert any("lacks artifact hash" in i for i in stripped.issues)
    assert report.can_render() is False


def test_case11_background_only_last_scene_cli_blocks_photo_dominance(tmp_path):
    project = _materialize("case11-background-only-last-scene", tmp_path)
    result = _cli(["--project", str(project)])
    assert result.returncode == 1
    qc = json.loads((project / "qc" / "editorial_language.json").read_text(encoding="utf-8"))
    matching = [f for f in qc["findings"]
                if f.get("status") == "blocked" and f.get("code") == "EL-PHOTO-FRAME-DOMINANCE"]
    assert matching and any("p" in f.get("message", "") for f in matching), (
        f"expected blocked EL-PHOTO-FRAME-DOMINANCE naming layer p; all findings: {qc['findings']!r}"
    )


@pytest.mark.skipif(
    not (REPO_ROOT / "projects" / "xang-dau-demo-20261107").exists(),
    reason="real PASS reference fixture not on this machine",
)
def test_cli_compose_preflight_parity(tmp_path):
    from tools.video.video_compose import VideoCompose

    def check_case(name, project, expected_block, expected_cli, expected_warning=False):
        output = tmp_path / f"{name}-compose" / "output.mp4"
        inputs = {"project_dir": str(project), "output_path": str(output), "validation_mode": "strict"}
        decisions = {"cuts": [{"id": "scene-1"}]}
        force = name == "reference"
        if force:
            inputs["force_editorial"] = True
        cli_args = ["--project", str(project)]
        if force:
            cli_args.append("--force-editorial")
        if name == "reference":
            cli_args.extend(["--manifest", str(project / "scene_manifest.json")])
        cli = _cli(cli_args)
        try:
            from tools.qc.editorial_language_gate import analyze_project, build_gate_artifacts
            from tools.qc.editorial_language_gate import read_json_if_valid
            import tools.qc.editorial_language_gate as elg
            monkeypatch = pytest.MonkeyPatch()
            comp_root = project / "comp"
            monkeypatch.setattr(elg, "_composition_root", lambda *a, **k: comp_root)
            try:
                if name == "reference":
                    monkeypatch.setattr(elg, "run_editorial_language_gate",
                                        lambda project_dir, force=False, **kwargs: (
                                            elg.build_gate_artifacts(
                                                elg.analyze_project(project_dir, force_editorial=force,
                                                                    composition_root_override=comp_root),
                                                project_dir, write_outputs=False)))
                compose = VideoCompose()._editorial_compose_preflight(inputs, decisions, output)
            finally:
                monkeypatch.undo()
        except Exception as exc:
            compose = exc
        compose_block = compose is not None
        assert (compose_block, cli.returncode in (1, 2)) == (expected_block, expected_block), (
            f"{name}: CLI={cli.returncode}, compose={compose!r}"
        )
        assert cli.returncode == expected_cli, f"{name}: CLI output={cli.stdout} {cli.stderr}"
        if expected_block:
            assert not output.exists()
        else:
            assert compose is None
        if expected_warning:
            pytest.fail("preflight has no warning surface")
        return cli, compose

    missing = tmp_path / "missing-manifest"
    missing.mkdir()
    (missing / "project.json").write_text(json.dumps({"style_playbook": "editorial-explainer-manifest"}))
    check_case("missing", missing, True, 1)

    corrupt = tmp_path / "corrupt-manifest"
    corrupt.mkdir()
    (corrupt / "project.json").write_text(json.dumps({"style_playbook": "editorial-explainer-manifest"}))
    (corrupt / "scene_manifest.json").write_text("{invalid json")
    check_case("corrupt", corrupt, True, 2)

    undeclared = tmp_path / "undeclared-empty"
    undeclared.mkdir()
    p = undeclared
    cli, compose = check_case("undeclared-empty", p, False, 0)
    assert "warning" not in cli.stderr.lower() and "warning" not in cli.stdout.lower()

    flat = tmp_path / "undeclared-flat"
    flat.mkdir()
    (flat / "project.json").write_text(json.dumps({"style_playbook": "flat-motion-graphics"}))
    cli, compose = check_case("undeclared-flat", flat, False, 0)
    assert "warning" not in cli.stderr.lower() and "warning" not in cli.stdout.lower()

    reference = tmp_path / "xang-dau-demo-20261107"
    reference.mkdir()
    for filename in ("scene_manifest.json", "project.json"):
        shutil.copy(REPO_ROOT / "projects" / "xang-dau-demo-20261107" / filename,
                    reference / filename)
    reference_output = tmp_path / "reference-compose" / "output.mp4"
    reference_inputs = {"project_dir": str(reference), "output_path": str(reference_output),
                        "validation_mode": "strict", "force_editorial": True}
    cli = _cli(["--project", str(reference), "--force-editorial"])
    compose = VideoCompose()._editorial_compose_preflight(
        reference_inputs, {"cuts": [{"id": "scene-1"}]}, reference_output
    )
    assert cli.returncode == 0 and "RESULT: PASS" in cli.stdout
    assert compose is None


def test_m1_real_closing_and_content_classification(tmp_path):
    required = [REPO_ROOT / "projects" / slug / name
                for slug in ("xang-dau-demo-20261107", "mua-lu-trung-bo-2026-11-09")
                for name in ("scene_manifest.json", "project.json")]
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        pytest.skip("real fixtures unavailable; missing required source(s): " + ", ".join(missing))
    pass_result = _real_fixture_tmp_copy("xang-dau-demo-20261107", tmp_path, force=True)
    assert pass_result.returncode == 0
    pass_qc = json.loads((tmp_path / "xang-dau-demo-20261107" / "qc" / "editorial_language.json").read_text())
    assert pass_qc["stats"]["closing_scenes"] >= 1
    result = _real_fixture_tmp_copy("mua-lu-trung-bo-2026-11-09", tmp_path)
    assert result.returncode == 1
    qc = json.loads((tmp_path / "mua-lu-trung-bo-2026-11-09" / "qc" / "editorial_language.json").read_text())
    graphic = [f for f in qc["findings"] if f["rule"] == "graphic-native-required"]
    assert not any(f.get("scene_id") == "scene-10" for f in graphic)
    assert any(f.get("scene_id") == "scene-9" for f in graphic)



def _assert_optional_repo_report(real_slug: str, expected_pass: bool) -> None:
    project = REPO_ROOT / "projects" / real_slug
    report_path = project / "qc" / "editorial_language.json"
    assert report_path.is_relative_to(REPO_ROOT / "projects")
    if not report_path.exists():
        return
    actual_rel = report_path.relative_to(REPO_ROOT).as_posix()
    ignored = subprocess.run(["git", "check-ignore", "-v", "--", actual_rel], cwd=REPO_ROOT,
                             capture_output=True, text=True)
    assert ignored.returncode == 0, ignored.stdout + ignored.stderr
    _assert_report_schema(json.loads(report_path.read_text(encoding="utf-8")), expected_pass)

def _assert_report_schema(report: dict, expected_pass: bool) -> None:
    project_key = "project" if "project" in report else "project_id"
    assert project_key in report
    assert "lane" in report
    expected_base = {project_key, "lane", "pass", "findings", "errors", "warnings", "stats"}
    allowed_keys = expected_base | {"activated", "blocked_findings", "revise_findings"}
    assert expected_base <= set(report) <= allowed_keys
    assert isinstance(report["pass"], bool) and report["pass"] is expected_pass
    assert isinstance(report["findings"], list)
    allowed = {"pass", "blocked", "revise"}
    assert all(isinstance(f, dict) and set(f) == {"rule", "scene_id", "status", "code", "message"}
               and f["status"] in allowed for f in report["findings"])
    counts = {status: sum(f["status"] == status for f in report["findings"])
              for status in allowed}
    stats = report["stats"]
    assert stats["blocked_findings"] == counts["blocked"]
    assert stats["revise_findings"] == counts["revise"]
    if "blocked_findings" in report:
        assert report["blocked_findings"] == counts["blocked"]
    if "revise_findings" in report:
        assert report["revise_findings"] == counts["revise"]
    assert report["pass"] is (counts["blocked"] == 0)

def test_cli_report_output_schema(tmp_path):
    project = _materialize("case11-background-only-last-scene", tmp_path)
    result = _cli(["--project", str(project)])
    assert result.returncode == 1
    report_path = project / "qc" / "editorial_language.json"
    assert report_path.is_file()
    _assert_report_schema(json.loads(report_path.read_text(encoding="utf-8")), False)

def test_repo_fixture_reports_and_evidence_paths_are_ignored_without_writes():
    paths = [
        "projects/xang-dau-demo-20261107/qc/editorial_language.json",
        "projects/xang-dau-demo-20261107/artifacts/editorial_language_evidence.json",
        "projects/mua-lu-trung-bo-2026-11-09/qc/editorial_language.json",
        "projects/mua-lu-trung-bo-2026-11-09/artifacts/editorial_language_evidence.json",
    ]
    for path in paths:
        result = subprocess.run(["git", "check-ignore", "-v", "--", path], cwd=REPO_ROOT,
                                capture_output=True, text=True)
        assert result.returncode == 0, f"{path}: {result.stdout}{result.stderr}"

def _real_fixture_tmp_copy(real_slug: str, tmp_path: Path, force: bool = False) -> subprocess.CompletedProcess:
    """Copy only required inputs to tmp; fail clearly if source fixture incomplete."""
    work = tmp_path / real_slug
    work.mkdir()
    missing = []
    for name in ("scene_manifest.json", "project.json"):
        src = REPO_ROOT / "projects" / real_slug / name
        if not src.is_file():
            missing.append(str(src))
        else:
            shutil.copy(src, work / name)
    if missing:
        pytest.skip("real fixture unavailable; missing required source(s): " + ", ".join(missing))
    args = ["--project", str(work)]
    if force:
        args.append("--force-editorial")
    return _cli(args)


@pytest.mark.skipif(
    not (REPO_ROOT / "projects" / "xang-dau-demo-20261107").exists(),
    reason="real PASS reference fixture not on this machine",
)
def test_graphic_native_clean_ab_pairs(tmp_path):
    cases = [
        ("case12-graphic-native-green-base", "case13-graphic-native-cardstack-variant",
         "CardStack", "component 'CardStack' is not referenced by the mapped scene source — an unmounted claim cannot carry the graphic-native rule (fail-closed)"),
        ("case14-single-token-green-base", "case15-single-token-rename-variant",
         "OtherChart", "component 'OtherChart' is not referenced by the mapped scene source — an unmounted claim cannot carry the graphic-native rule (fail-closed)"),
    ]
    for base_case, variant_case, defect_token, expected_clause in cases:
        base_src = FIXTURE_ROOT / base_case
        variant_src = FIXTURE_ROOT / variant_case
        base = _materialize(base_case, tmp_path)
        variant = _materialize(variant_case, tmp_path)
        base_scene = (base / "comp/scenes/S02.tsx").read_text(encoding="utf-8")
        assert "<NativeBarChart" in base_scene
        assert defect_token not in base_scene
        base_qc = analyze_project(base, force_editorial=True,
                                  composition_root_override=base / "comp").to_qc_dict()
        variant_qc = analyze_project(variant, force_editorial=True,
                                     composition_root_override=variant / "comp").to_qc_dict()
        base_blocked = [f for f in base_qc["findings"] if f["status"] == "blocked"]
        variant_blocked = [f for f in variant_qc["findings"] if f["status"] == "blocked"]
        assert base_qc["pass"] is True and base_blocked == []
        assert variant_qc["pass"] is False
        assert len(variant_blocked) == 1
        hit = variant_blocked[0]
        assert hit["code"] == "EL-GRAPHIC-NATIVE-MISSING"
        expected_full = ("no genuine graphic-native layer in content scene: data_viz layer "
                         f"(component '{defect_token}'): {expected_clause}; evidence_annotation layer "
                         "(component 'HighlighterStroke + chip'): role+method fallback denied: "
                         "mapped scene source carries no native-graphic markers "
                         "(role='evidence_annotation', method='remotion_native')")
        assert hit["message"] == expected_full
        assert expected_clause in hit["message"]

        # Byte-level pair contract: only manifest claim may differ.
        base_files = {p.relative_to(base_src): p.read_bytes() for p in base_src.rglob("*") if p.is_file()}
        variant_files = {p.relative_to(variant_src): p.read_bytes() for p in variant_src.rglob("*") if p.is_file()}
        assert base_files.keys() == variant_files.keys()
        differing = {rel for rel in base_files if base_files[rel] != variant_files[rel]}
        assert differing == {Path("scene_manifest.json")}
        bman = json.loads(base_files[Path("scene_manifest.json")])
        vman = json.loads(variant_files[Path("scene_manifest.json")])
        assert bman["project_id"] == vman["project_id"]
        assert [s["scene_id"] for s in bman["scenes"]] == [s["scene_id"] for s in vman["scenes"]]
        assert [len(s["layers"]) for s in bman["scenes"]] == [len(s["layers"]) for s in vman["scenes"]]
        for bm, vm in zip(bman["scenes"], vman["scenes"]):
            assert bm["scene_id"] == vm["scene_id"]
            assert [l["layer_id"] for l in bm["layers"]] == [l["layer_id"] for l in vm["layers"]]
            for bl, vl in zip(bm["layers"], vm["layers"]):
                if bl["layer_id"] == "chart":
                    assert bl["pipeline"]["component"] == "NativeBarChart"
                    assert vl["pipeline"]["component"] == defect_token
                else:
                    assert bl == vl
        assert len(base_qc["findings"]) == len(variant_qc["findings"])
        def without_target(qc):
            return [f for f in qc["findings"] if not (f["rule"] == "graphic-native-required" and f["scene_id"] == "scene_s2")]
        assert without_target(base_qc) == without_target(variant_qc)


def test_mounted_but_unresolvable_token_is_blocked(tmp_path):
    """A claimed identifier must be mounted in mapped scene source AND resolve
    within that source/import closure. Mounted OtherChart resolves to a card-stack
    declaration, so it remains blocked for the card-stack reason."""
    project = _materialize("case16-single-token-mounted-variant", tmp_path)
    source = (project / "comp/scenes/S02.tsx").read_text(encoding="utf-8")
    assert "<OtherChart />" in source
    qc = analyze_project(project, force_editorial=True,
                         composition_root_override=project / "comp").to_qc_dict()
    hit = next(f for f in qc["findings"] if f["code"] == "EL-GRAPHIC-NATIVE-MISSING"
               and f["status"] == "blocked" and f["scene_id"] == "scene_s2")
    assert "OtherChart resolves to a presentation card-stack body in lib/Charts.tsx " in hit["message"]
    assert "(flex display, no axis math / bar-slot construction) — vetoed" in hit["message"]


def test_token_mounted_outside_mapped_scene_is_unresolvable(tmp_path):
    """A token rendered in S03 is not resolvable for scene_s2 mapped to S02."""
    project = _materialize("case17-single-token-unresolvable-variant", tmp_path)
    s03 = (project / "comp/scenes/S03.tsx").read_text(encoding="utf-8")
    s02 = (project / "comp/scenes/S02.tsx").read_text(encoding="utf-8")
    assert "<OtherChart />" in s03
    assert "OtherChart" not in s02
    tree_sources = "\n".join(p.read_text(encoding="utf-8") for p in (project / "comp").rglob("*.tsx"))
    assert "<OtherChart />" in tree_sources
    qc = analyze_project(project, force_editorial=True,
                         composition_root_override=project / "comp").to_qc_dict()
    hit = next(f for f in qc["findings"] if f["code"] == "EL-GRAPHIC-NATIVE-MISSING"
               and f["status"] == "blocked" and f["scene_id"] == "scene_s2")
    assert ("component 'OtherChart' is not referenced by the mapped scene source — "
            "an unmounted claim cannot carry the graphic-native rule (fail-closed)") in hit["message"]


def test_real_pass_reference_passes(tmp_path):
    result = _real_fixture_tmp_copy("xang-dau-demo-20261107", tmp_path, force=True)
    assert result.returncode == 0
    qc = json.loads((tmp_path / "xang-dau-demo-20261107" / "qc" / "editorial_language.json")
                    .read_text(encoding="utf-8"))
    assert qc["pass"] is True
    passed = [f for f in qc["findings"] if f["status"] == "pass"]
    assert len(passed) == 12  # 4 R1 + 3 R2 + 4 R3 + 1 R4 (verified after MAJOR 2)
    # m1: advisories report as revise findings + warnings[] entries — never
    # blocking, EvidenceRecord stays PASS (final fix round).
    revise = [f for f in qc["findings"] if f["status"] == "revise"]
    assert len(revise) == 2  # s1 no-data_viz advisory + /speech_lock_contract prose mention
    assert any(r["code"] == "EL-DATA-VIZ-ADVISORY" for r in revise)
    assert any(r["rule"] == "unresolved-anchor" and "speech_lock_contract" in r["message"]
               for r in revise)
    assert qc["stats"]["anchor_leaves"] == 0  # landing check: ZERO blocked anchors
    assert qc["stats"]["advisory_anchor_leaves"] == 1
    assert qc["stats"]["revise_findings"] == 2
    # exit 0 with advisory revise reported — the CLI PASS line names them
    assert "RESULT: PASS" in result.stdout and "revise=2" in result.stdout
    # Repo artifact may be operator-owned; if present, validate ignore + report shape.
    _assert_optional_repo_report("xang-dau-demo-20261107", expected_pass=True)


@pytest.mark.skipif(
    not (REPO_ROOT / "projects" / "mua-lu-trung-bo-2026-11-09").exists(),
    reason="real FAIL regression fixture not on this machine",
)
def test_real_regression_fails(tmp_path):
    result = _real_fixture_tmp_copy("mua-lu-trung-bo-2026-11-09", tmp_path)
    assert result.returncode == 1
    assert "FAIL — editorial language gate rejected" in result.stdout
    qc = json.loads((tmp_path / "mua-lu-trung-bo-2026-11-09" / "qc" / "editorial_language.json")
                    .read_text(encoding="utf-8"))
    # MAJOR 4: full breakdown census on the real fixture
    from collections import Counter
    blocked_by_rule = Counter(f["rule"] for f in qc["findings"] if f["status"] == "blocked")
    assert blocked_by_rule["contract-sections"] == 4
    assert blocked_by_rule["graphic-native-required"] == 7
    assert blocked_by_rule["photo-frame-dominance"] == 10
    assert blocked_by_rule["unresolved-anchor"] == 35
    assert qc["stats"]["anchor_leaves"] == 35
    assert qc["stats"]["blocked_findings"] == 56
    # prose-key routing (final fix round): exact anchor census and advisory breakdown.
    anchor_findings = [f for f in qc["findings"] if f["rule"] == "unresolved-anchor"]
    anchor_blocked = [f for f in anchor_findings if f["status"] == "blocked"]
    anchor_revise = [f for f in anchor_findings if f["status"] == "revise"]
    assert len(anchor_blocked) == 35
    assert len(anchor_revise) == 1
    assert qc["stats"]["anchor_leaves"] == 35
    assert qc["stats"]["advisory_anchor_leaves"] == 1
    assert qc["stats"]["revise_findings"] == 1
    assert any("timing_lock" in f["message"] for f in anchor_revise)
    assert any("timing_lock" in w for w in qc["warnings"])
    _assert_optional_repo_report("mua-lu-trung-bo-2026-11-09", expected_pass=False)


# ---------------------------------------------------------------------------
# CLI exit-code floor (non-editorial skip => 0)
# ---------------------------------------------------------------------------

def test_cli_skips_non_editorial_project(tmp_path):
    project = _materialize("case00-non-editorial-golden", tmp_path)
    result = _cli(["--project", str(project)])
    assert result.returncode == 0
    assert "SKIP" in result.stdout
    assert not (project / "qc" / "editorial_language.json").exists()


def test_cli_missing_project_dir_exit_2():
    result = _cli(["--project", str(REPO_ROOT / "projects" / "does-not-exist-elg")])
    assert result.returncode == 2


# ---------------------------------------------------------------------------
# review round 2 pins
# ---------------------------------------------------------------------------

def test_unresolvable_single_token_blocked(tmp_path):
    """MAJOR 1 remedy 5: a single-token component claim that appears in neither
    the mapped scene source nor its import closure is BLOCKED — no fall-through
    to the role+method credit."""
    project = _materialize("case01-pass-xd-shape", tmp_path)
    manifest_path = project / "scene_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    scene_s2 = manifest["scenes"][1]
    scene_s2["layers"].append({
        "layer_id": "typo_viz", "z_index": 48, "role": "data_viz",
        "pipeline": {"method": "remotion_native", "component": "TotallyUnknownChartz"},
    })
    # the unresolvable claim is the ONLY graphic-native layer of a new content
    # scene — the scene cannot borrow credit from a sibling layer
    manifest["scenes"].append({
        "scene_id": "scene_s5", "narrative_beat": "typo scene", "duration_frames": 90,
        "start_frame_global": 860,
        "layers": [{
            "layer_id": "typo_viz", "z_index": 48, "role": "data_viz",
            "pipeline": {"method": "remotion_native", "component": "TotallyUnknownChartz"},
        }],
    })
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    qc, record = _run_gate(project, force=True)
    assert qc["pass"] is False
    s5 = next(f for f in _findings(qc, "graphic-native-required", "blocked")
              if f["scene_id"] == "scene_s5")
    assert "TotallyUnknownChartz" in s5["message"]
    assert "not referenced by the mapped scene source" in s5["message"]
    assert record.status == ValidationStatus.BLOCKED


def test_r1_rejects_bool_and_number_sections(tmp_path):
    """MINOR 5: bool/number contract sections count as ABSENT."""
    project = _materialize("case01-pass-xd-shape", tmp_path)
    manifest_path = project / "scene_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["physics"] = False
    manifest["camera_rig"] = 0
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    qc, _record = _run_gate(project, force=True)
    r1_blocked = {f["message"] for f in _findings(qc, "contract-sections", "blocked")}
    assert len(r1_blocked) == 2
    assert any("'physics'" in m for m in r1_blocked)
    assert any("'camera_rig'" in m for m in r1_blocked)


def test_r3_canvas_zero_or_bool_invalid(tmp_path):
    """MINOR 6: zero/negative/bool canvases make the R3 denominator unevaluable."""
    project = _materialize("case09-hero-only", tmp_path)
    manifest_path = project / "scene_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["canvas"]["width"] = 0
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    qc, _record = _run_gate(project)
    assert any(f["code"] == "EL-CANVAS-INVALID" for f in _findings(qc, status="blocked"))


def test_run_editorial_language_gate_has_no_composition_root_override():
    """MINOR 7: the producer/CLI path accepts NO composition-root override; the
    seam exists only on the pure analyzer."""
    import inspect
    assert "composition_root_override" not in inspect.signature(
        run_editorial_language_gate).parameters
    assert "composition_root_override" in inspect.signature(analyze_project).parameters


def test_auto_detected_pass_without_force(tmp_path):
    """MINOR 16: a manifest that DECLARES the editorial playbook auto-activates
    and PASSes without --force-editorial."""
    project = _materialize("case10-auto-declared-pass", tmp_path)
    qc, record = _run_gate(project, force=False)
    assert qc["activated"] is True
    assert qc["pass"] is True
    assert record.status == ValidationStatus.PASS


def test_non_editorial_compose_passes_required_gates_none(tmp_path, monkeypatch):
    """MINOR 10: pin the non-editorial compose path — validate_pre_render MUST
    receive required_gates=None. A regression to [] would silently drop ALL
    canonical gate enforcement for every lane."""
    import lib.production_validation as pv
    from tools.video.video_compose import VideoCompose

    project = tmp_path / "elg-kids-pinning"
    shutil.copytree(FIXTURE_ROOT / "case00-non-editorial-golden", project)

    captured: dict = {}
    real = pv.validate_pre_render

    def spy(*args, **kwargs):
        captured["kwargs"] = kwargs
        return real(*args, **kwargs)

    monkeypatch.setattr(pv, "validate_pre_render", spy)

    tool = VideoCompose()
    _stub_render(tool, project, monkeypatch)
    result = tool.execute(_compose_inputs_kids(project))
    assert result.success is True, f"compose should proceed: {result.error}"
    assert captured["kwargs"].get("required_gates") is None


# ---------------------------------------------------------------------------
# adversarial pins B1–B5 — 2026-11-10 independent acceptance, bypass round 2.
# Each pin reproduces a CONFIRMED bypass fixture from
# /tmp/adv_gate_probe_20261110a inside the committed suite, so the holes stay
# closed at the code/author layer (no external /tmp dependency).
# ---------------------------------------------------------------------------

def _adv_canvas(project: Path) -> dict:
    manifest = json.loads((project / "scene_manifest.json").read_text(encoding="utf-8"))
    w, h = manifest["canvas"]["width"], manifest["canvas"]["height"]
    return {"x": 0, "y": 0, "w": w, "h": h}


def _adv_cutout(lid: str = "cut1") -> dict:
    return {"layer_id": lid, "z_index": 40, "role": "document_cutout",
            "pipeline": {"method": "t2i_chroma_key", "file": "cutout.png"}}


_UNSET = object()


def _adv_photo(lid: str, role: str, canvas: dict, method: str = "t2i",
               prompt: str = "a calm documentary backdrop",
               transform: "dict | None | object" = _UNSET) -> dict:
    layer = {"layer_id": lid, "z_index": 10, "role": role,
             "pipeline": {"method": method, "prompt": prompt}}
    if transform is _UNSET:
        layer["transform"] = dict(canvas)  # default: full canvas
    elif transform is not None:
        layer["transform"] = transform
    return layer


def _adv_append_scene(project: Path, scene_id: str, layers: list,
                      narration: str | None = None) -> None:
    manifest_path = project / "scene_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    scene: dict = {"scene_id": scene_id, "narrative_beat": f"{scene_id} adversarial pin",
                   "duration_frames": 90, "start_frame_global": 950, "layers": layers}
    if narration is not None:
        scene["narration"] = narration
    manifest["scenes"].append(scene)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2),
                             encoding="utf-8")


def _adv_blocked(qc: dict, rule: str, scene_id: str) -> list[dict]:
    return [f for f in _findings(qc, rule, "blocked") if f["scene_id"] == scene_id]


def test_adv_b1_background_role_full_canvas_photo_blocks(tmp_path):
    """B1: a raster photo under role `background` with an explicit full-canvas
    transform is DOMINANT regardless of role (>=85% canvas)."""
    project = _materialize("case01-pass-xd-shape", tmp_path)
    canvas = _adv_canvas(project)
    _adv_append_scene(project, "scene_s5",
                      [_adv_photo("bgx", "background", canvas), _adv_cutout()])
    qc, _ = _run_gate(project, force=True)
    hits = _adv_blocked(qc, "photo-frame-dominance", "scene_s5")
    assert hits and "bgx" in hits[0]["message"] and "background" in hits[0]["message"]


def test_adv_b2_unmeasurable_photo_without_genuine_credit_blocks(tmp_path):
    """B2 fail-close: a photo layer with NO usable w/h in a content scene with
    NO genuine graphic-native credit is unmeasurable-DOMINATING. Final-fix
    ruling: the scene-bound R2 credit is the ONLY exemption — no role-based
    carve-out (role `background` included)."""
    project = _materialize("case01-pass-xd-shape", tmp_path)
    # a document_cutout claimed via plain `t2i` is NOT genuine (cutout credit
    # requires t2i_chroma_key / web_plus_i2i+remove_bg) — it breaks the closing
    # signature WITHOUT granting the R2 credit, isolating the fail-close case.
    _adv_append_scene(project, "scene_s5",
                      [_adv_photo("phx", "background_texture", _adv_canvas(project),
                                  transform=None),
                       {"layer_id": "cutfail", "z_index": 40, "role": "document_cutout",
                        "pipeline": {"method": "t2i", "file": "cut.png"}}])
    qc, _ = _run_gate(project, force=True)
    hits = _adv_blocked(qc, "photo-frame-dominance", "scene_s5")
    assert hits and "unmeasurable" in hits[0]["message"] and "phx" in hits[0]["message"]

def test_adv_b2_unmeasurable_photo_with_genuine_credit_exempt(tmp_path):
    """Final-fix ruling: an unmeasurable photo in a scene that DOES carry
    genuine graphic-native credit (scene-bound R2 procedure) is a backplate
    texture / cutout subject — NOT dominating. A scene with only a photo and
    no genuine graphic-native still blocks (pin above)."""
    project = _materialize("case01-pass-xd-shape", tmp_path)
    _adv_append_scene(project, "scene_s5",
                      [_adv_photo("phx", "background_texture", _adv_canvas(project),
                                  transform=None), _adv_cutout()])
    qc, _ = _run_gate(project, force=True)
    assert not _adv_blocked(qc, "photo-frame-dominance", "scene_s5")
    assert any(f["scene_id"] == "scene_s5" and f["status"] == "pass"
               for f in _findings(qc, "photo-frame-dominance"))

def test_adv_b2_background_backplate_without_transform_exempt(tmp_path):
    """Unmeasurable `background` backplate in a scene WITH genuine graphic-native
    credit is exempt — via the scene-bound R2 CREDIT (not the role): the scene
    must NOT be R3-blocked (no over-block)."""
    project = _materialize("case01-pass-xd-shape", tmp_path)
    _adv_append_scene(project, "scene_s5",
                      [_adv_photo("plate", "background", _adv_canvas(project),
                                  transform=None), _adv_cutout()])
    qc, _ = _run_gate(project, force=True)
    assert not _adv_blocked(qc, "photo-frame-dominance", "scene_s5")
    assert any(f["scene_id"] == "scene_s5" and f["status"] == "pass"
               for f in _findings(qc, "photo-frame-dominance"))

def test_adv_b3_non_t2i_photo_method_blocks(tmp_path):
    """B3: photo signal is METHOD-based and role-agnostic — `web_plus_i2i`
    WITHOUT remove_bg is a raster photo even under role `background`."""
    project = _materialize("case01-pass-xd-shape", tmp_path)
    canvas = _adv_canvas(project)
    _adv_append_scene(project, "scene_s5",
                      [_adv_photo("wpx", "background", canvas, method="web_plus_i2i"),
                       _adv_cutout()])
    qc, _ = _run_gate(project, force=True)
    hits = _adv_blocked(qc, "photo-frame-dominance", "scene_s5")
    assert hits and "wpx" in hits[0]["message"]


def test_adv_b4_single_token_imported_from_outside_closure_blocks(tmp_path):
    """B4: single-token `remotion_native` component that maps to a scene source
    importing it from OUTSIDE the composition root resolves to ZERO
    declarations — no role+method fallback credit (fail-closed)."""
    project = _materialize("case01-pass-xd-shape", tmp_path)
    (project / "comp" / "scenes").mkdir(parents=True, exist_ok=True)
    (project / "comp" / "scenes" / "S09.tsx").write_text(
        'import { NativeBarChart } from "../charts/NativeBarChart";\n'
        "export const Scene09: React.FC = () => (\n"
        "  <div><NativeBarChart /></div>\n"
        ");\n", encoding="utf-8")
    manifest_path = project / "scene_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["scenes"].append({
        "scene_id": "scene_s9", "narrative_beat": "b4 pin",
        "duration_frames": 90, "start_frame_global": 950,
        "composition_source": "scenes/S09.tsx",
        "layers": [{"layer_id": "viz9", "z_index": 40, "role": "data_viz",
                    "pipeline": {"method": "remotion_native",
                                 "component": "NativeBarChart"}}],
    })
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2),
                             encoding="utf-8")
    qc, _ = _run_gate(project, force=True)
    hits = _adv_blocked(qc, "graphic-native-required", "scene_s9")
    assert hits and "NativeBarChart" in hits[0]["message"]
    assert "no declaration" in hits[0]["message"]


def test_adv_b5_midstring_anchor_in_scene_blocks_and_prose_advises(tmp_path):
    """B5 + R4 prose-key routing (final fix round): a mid-string `anchor:`
    token under a NON-prose key (scene narration field, unknown top-level key)
    BLOCKS; a hit under a prose-key subtree (notes/…) or a contract section is
    an advisory — revise finding + warnings[] entry (m1) — never counted in
    the blocked census."""
    project = _materialize("case01-pass-xd-shape", tmp_path)
    _adv_append_scene(project, "scene_s5",
                      [_adv_photo("bgx", "background", _adv_canvas(project),
                                  transform=None), _adv_cutout()],
                      narration="Data per anchor:market-share-q3 was verified")
    manifest_path = project / "scene_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    # mid-string mentions under NON-prose keys: unknown top-level key + scene
    # narration field — both BLOCK (every non-prose hit blocks).
    manifest["advisory_note"] = "Hợp đồng khớp nói: anchor: bar/tile mang SỐ — non-prose key"
    # hit under a prose-key subtree (notes/…) -> advisory revise + warnings[]
    manifest["notes"] = {"timing_lock": "Mọi trigger_frame dạng 'anchor:<phrase>' là PLACEHOLDER"}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2),
                             encoding="utf-8")
    qc, _ = _run_gate(project, force=True)
    blocked = [f for f in _findings(qc, "unresolved-anchor", "blocked")]
    assert any(f["scene_id"] == "scene_s5" and "narration" in f["message"] for f in blocked)
    assert any("advisory_note" in f["message"] for f in blocked)
    assert qc["stats"]["anchor_leaves"] == len(blocked)  # census counts BLOCKED only
    # prose-subtree hit: advisory revise finding + warnings[] entry, NOT blocked
    advisory_finding = [f for f in _findings(qc, "unresolved-anchor", "revise")
                        if "timing_lock" in f["message"]]
    assert advisory_finding and advisory_finding[0]["scene_id"] is None  # top-level prose
    assert any("timing_lock" in w for w in qc["warnings"])
    assert not any("timing_lock" in f["message"]
                   for f in _findings(qc, "unresolved-anchor", "blocked"))
