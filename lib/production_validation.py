"""Production validation contract and evidence gates for OpenMontage.

Enforces valid editorial scene content/layout, audio/visual/SFX synchronization,
and verified production evidence before compose render and checkpoint completion.
"""

from __future__ import annotations

import enum
import json
from lib.production_provenance import (
    compute_scene_fingerprint,
    compute_stage_fingerprint,
    verify_provenance_freshness,
    FreshnessResult,
    StageFingerprint,
    SceneFingerprint,
    hash_bytes,
    hash_file,
    hash_json_data,
)
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

GATE_LAYOUT = "layout"
GATE_TIMING_AUDIO = "timing-audio"
GATE_SEMANTIC_EVENTS = "semantic-events"
GATE_SFX_MIX = "sfx-mix"
GATE_PROVENANCE_FRESHNESS = "provenance-freshness"

VALID_PRE_RENDER_GATES = {
    GATE_LAYOUT,
    GATE_TIMING_AUDIO,
    GATE_SEMANTIC_EVENTS,
    GATE_SFX_MIX,
    GATE_PROVENANCE_FRESHNESS,
}

REQUIRED_PRE_RENDER_SCENE_GATES = {
    GATE_LAYOUT,
    GATE_TIMING_AUDIO,
    GATE_SEMANTIC_EVENTS,
    GATE_SFX_MIX,
}

REQUIRED_PRE_RENDER_EPISODE_GATES = {
    GATE_PROVENANCE_FRESHNESS,
}

REQUIRED_PRE_RENDER_GATES = REQUIRED_PRE_RENDER_SCENE_GATES | REQUIRED_PRE_RENDER_EPISODE_GATES

GATE_ALIASES = {
    "pre_render_layout": GATE_LAYOUT,
    "layout_verification": GATE_LAYOUT,
    "pre_render_timing": GATE_TIMING_AUDIO,
    "audio": GATE_TIMING_AUDIO,
    "timing": GATE_TIMING_AUDIO,
    "semantic": GATE_SEMANTIC_EVENTS,
    "events": GATE_SEMANTIC_EVENTS,
    "sfx": GATE_SFX_MIX,
    "mix": GATE_SFX_MIX,
    "provenance": GATE_PROVENANCE_FRESHNESS,
    "provenance_freshness": GATE_PROVENANCE_FRESHNESS,
}


class ValidationStatus(str, enum.Enum):
    PASS = "pass"
    REVISE = "revise"
    BLOCKED = "blocked"
    NOT_MEASURED = "not_measured"


class ProductionValidationError(Exception):
    """Raised when production validation gate fails in strict mode."""
    pass


@dataclass
class EvidenceRecord:
    gate_name: str
    scope: str  # "pre_render" | "compose" | "post_render" | "final" | "export"
    status: ValidationStatus
    severity: str = "info"  # "critical" | "important" | "warning" | "info"
    evidence_paths: list[str] = field(default_factory=list)
    scene_coverage: list[str] = field(default_factory=list)
    expected_scenes: list[str] = field(default_factory=list)
    fingerprint: str = ""
    issues: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    artifact_hashes: dict[str, str] = field(default_factory=dict)

    VALID_GATES = VALID_PRE_RENDER_GATES
    REQUIRED_GATES = REQUIRED_PRE_RENDER_GATES

    @property
    def canonical_gate_name(self) -> str:
        return GATE_ALIASES.get(self.gate_name, self.gate_name)

    def is_valid_gate(self) -> bool:
        return self.canonical_gate_name in VALID_PRE_RENDER_GATES

    def to_dict(self) -> dict[str, Any]:
        return {
            "gate_name": self.gate_name,
            "scope": self.scope,
            "status": self.status.value,
            "severity": self.severity,
            "evidence_paths": self.evidence_paths,
            "scene_coverage": self.scene_coverage,
            "expected_scenes": self.expected_scenes,
            "fingerprint": self.fingerprint,
            "issues": self.issues,
            "metadata": self.metadata,
            "artifact_hashes": self.artifact_hashes,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> EvidenceRecord:
        return cls(
            gate_name=str(data.get("gate_name", "")),
            scope=str(data.get("scope", "pre_render")),
            status=ValidationStatus(data.get("status", "not_measured")),
            severity=str(data.get("severity", "info")),
            evidence_paths=list(data.get("evidence_paths", [])),
            scene_coverage=list(data.get("scene_coverage", [])),
            expected_scenes=list(data.get("expected_scenes", [])),
            fingerprint=str(data.get("fingerprint", "")),
            issues=list(data.get("issues", [])),
            metadata=dict(data.get("metadata", {})),
            artifact_hashes=dict(
                data.get("artifact_hashes", data.get("metadata", {}).get("artifact_hashes", {}))
            ),
        )


def create_evidence_record(
    gate_name: str,
    scene_coverage: list[str],
    evidence_paths: list[str],
    status: ValidationStatus = ValidationStatus.PASS,
    scope: str = "pre_render",
    expected_scenes: list[str] | None = None,
    fingerprint: str = "",
    artifact_hashes: dict[str, str] | None = None,
    issues: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
    severity: str = "info",
) -> EvidenceRecord:
    """Canonical helper for constructing validated EvidenceRecord instances."""
    canonical = GATE_ALIASES.get(gate_name, gate_name)
    return EvidenceRecord(
        gate_name=canonical,
        scope=scope,
        status=status,
        severity=severity,
        evidence_paths=list(evidence_paths),
        scene_coverage=list(scene_coverage),
        expected_scenes=list(expected_scenes or scene_coverage),
        fingerprint=str(fingerprint),
        issues=list(issues or []),
        metadata=dict(metadata or {}),
        artifact_hashes=dict(artifact_hashes or {}),
    )


@dataclass
class ProductionValidationReport:
    project_id: str
    pipeline_type: str
    mode: str = "strict"  # "strict" | "legacy"
    records: list[EvidenceRecord] = field(default_factory=list)
    version: str = "1.0"
    metadata: dict[str, Any] = field(default_factory=dict)
    fingerprint: str = ""

    @property
    def status(self) -> ValidationStatus:
        if not self.records:
            return ValidationStatus.BLOCKED
        statuses = {r.status for r in self.records}
        if ValidationStatus.BLOCKED in statuses:
            return ValidationStatus.BLOCKED
        if ValidationStatus.REVISE in statuses:
            return ValidationStatus.REVISE
        if ValidationStatus.NOT_MEASURED in statuses:
            return ValidationStatus.BLOCKED if self.mode == "strict" else ValidationStatus.NOT_MEASURED
        if all(s == ValidationStatus.PASS for s in statuses):
            return ValidationStatus.PASS
        return ValidationStatus.BLOCKED

    @property
    def blocking_reasons(self) -> list[str]:
        reasons: list[str] = []
        if not self.records:
            reasons.append("No evidence records found in validation report.")
            return reasons
        for r in self.records:
            if r.status == ValidationStatus.BLOCKED:
                if r.issues:
                    reasons.extend([f"[{r.gate_name}] {iss}" for iss in r.issues])
                else:
                    reasons.append(f"[{r.gate_name}] Gate failed with status BLOCKED")
            elif r.status == ValidationStatus.REVISE and r.severity in {"critical", "important"}:
                reasons.extend([f"[{r.gate_name}] Needs revision: {iss}" for iss in r.issues])
            elif r.status == ValidationStatus.NOT_MEASURED and self.mode == "strict":
                reasons.append(f"[{r.gate_name}] Required measurement missing (not_measured) in strict mode")
        return reasons

    def can_render(self) -> bool:
        if self.mode != "strict":
            return True
        if self.status in {ValidationStatus.BLOCKED, ValidationStatus.REVISE}:
            return False
        pre_records = [r for r in self.records if r.scope == "pre_render"]
        if not pre_records:
            return False
        return all(r.status == ValidationStatus.PASS for r in pre_records)

    def can_complete(
        self, stage: str, authoritative_scenes: list[str] | set[str] | tuple[str, ...] | None = None
    ) -> bool:
        self._completion_failure_reasons: list[str] = []
        if self.mode != "strict":
            return self.status != ValidationStatus.BLOCKED
        if self.status != ValidationStatus.PASS or not self.records:
            self._completion_failure_reasons = self.blocking_reasons or [
                f"Report status is {self.status.value!r}; strict completion requires pass"
            ]
            return False

        stage_scopes = {
            "edit": {"pre_render", "edit"},
            "compose": {"compose", "post_render"},
            "publish": {"publish", "post_render", "export"},
        }
        allowed = stage_scopes.get(stage)
        if not allowed:
            return True
        stage_records = [r for r in self.records if r.scope in allowed]
        if not stage_records:
            self._completion_failure_reasons = [f"No passing evidence records cover stage {stage!r}"]
            return False
        failed_records = [r for r in stage_records if r.status != ValidationStatus.PASS]
        if failed_records:
            self._completion_failure_reasons = [
                f"Evidence record {record.gate_name!r} has status {record.status.value!r}"
                for record in failed_records
            ]
            return False

        if self.fingerprint:
            expected = self.metadata.get("expected_stage_fingerprint")
            recorded = self.metadata.get("recorded_stage_fingerprint")
            if expected is not None and recorded is not None:
                from lib.production_provenance import StageFingerprint, verify_provenance_freshness
                freshness = verify_provenance_freshness(StageFingerprint.from_dict(expected), StageFingerprint.from_dict(recorded))
                if not freshness.is_fresh:
                    self._completion_failure_reasons = ["Provenance stale: " + "; ".join(freshness.stale_reasons)]
                    return False

        # Strict completion requires authoritative scope and matching declarations on every record.
        if authoritative_scenes is None:
            self._completion_failure_reasons = ["Authoritative scenes were not provided"]
            return False
        expected_scenes = set(authoritative_scenes)
        if not expected_scenes:
            self._completion_failure_reasons = ["Authoritative scene set is empty"]
            return False
        for record in stage_records:
            declared_list = list(record.expected_scenes)
            declared = set(declared_list)
            duplicates = sorted(scene for scene in declared if declared_list.count(scene) > 1)
            if duplicates:
                self._completion_failure_reasons = [f"Duplicate declared scenes: {duplicates}"]
                return False
            if not declared:
                self._completion_failure_reasons = [
                    f"No scenes declared by evidence record {record.gate_name!r}; authoritative scenes: {sorted(expected_scenes)}"
                ]
                return False
            if declared != expected_scenes:
                missing = sorted(expected_scenes - declared)
                extra = sorted(declared - expected_scenes)
                self._completion_failure_reasons = [
                    f"Authoritative scenes {sorted(expected_scenes)} do not match declared {sorted(declared)}; "
                    f"missing scenes: {missing}; extra scenes: {extra}"
                ]
                return False
        covered_scenes = set().union(*(set(r.scene_coverage) for r in stage_records))
        if covered_scenes != expected_scenes:
            missing = sorted(expected_scenes - covered_scenes)
            extra = sorted(covered_scenes - expected_scenes)
            self._completion_failure_reasons = [
                f"Scene coverage mismatch; missing scenes: {missing}; extra scenes: {extra}"
            ]
            return False
        self._completion_failure_reasons = []
        return True

    def to_dict(self) -> dict[str, Any]:
        return {
            "version": self.version,
            "project_id": self.project_id,
            "pipeline_type": self.pipeline_type,
            "mode": self.mode,
            "status": self.status.value,
            "blocking_reasons": self.blocking_reasons,
            "records": [r.to_dict() for r in self.records],
            "metadata": self.metadata,
            "fingerprint": self.fingerprint,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ProductionValidationReport:
        return cls(project_id=str(data.get("project_id", "")), pipeline_type=str(data.get("pipeline_type", "")),
                   mode=str(data.get("mode", "strict")), records=[EvidenceRecord.from_dict(r) for r in data.get("records", []) if isinstance(r, dict)],
                   version=str(data.get("version", "1.0")), metadata=dict(data.get("metadata", {})), fingerprint=str(data.get("fingerprint", "")))


def get_known_pipelines(defs_dir: Path | None = None) -> set[str]:
    """Derive known pipeline IDs from real pipeline definitions."""
    try:
        from lib.pipeline_loader import list_pipelines
        return set(list_pipelines(defs_dir=defs_dir))
    except Exception:
        # Fallback to scanning PIPELINE_DEFS_DIR directly
        base = defs_dir or (Path(__file__).resolve().parent.parent / "pipeline_defs")
        if base.exists() and base.is_dir():
            return {p.stem for p in base.glob("*.yaml")}
        return set()


VALID_MODES = {"strict", "legacy"}


def _validate_mode(mode: Any) -> str:
    """Return canonical validation mode or fail closed for unknown values."""
    value = str(mode)
    if value not in VALID_MODES:
        raise ValueError(f"Unrecognized validation mode: {value!r}; expected one of {sorted(VALID_MODES)}")
    return value


def resolve_validation_mode(
    checkpoint: dict[str, Any] | None = None,
    pipeline_dir: Path | None = None,
    project_id: str | None = None,
) -> str:
    """Resolve validation mode ('strict' vs 'legacy') based on real project/run contract.

    Compatibility policy:
    1. If explicit validation_mode is set in checkpoint metadata, honor it.
    2. If project marker (project.json) has validation_mode, honor it.
    3. If project marker exists without explicit mode (real production workspace created via init_project)
       or project is under repo projects/ directory: new production defaults to STRICT.
    4. Outside projects/ with no project.json marker and no explicit metadata:
       treated as legacy test fixture for backward compatibility.
    """
    if checkpoint is not None:
        meta = checkpoint.get("metadata", {})
        if isinstance(meta, dict) and "validation_mode" in meta:
            return _validate_mode(meta["validation_mode"])

    if pipeline_dir is not None and project_id is not None:
        marker_path = Path(pipeline_dir) / project_id / "project.json"
        if marker_path.exists():
            try:
                with open(marker_path, encoding="utf-8") as f:
                    marker = json.load(f)
                if isinstance(marker, dict):
                    if "validation_mode" in marker:
                        return _validate_mode(marker["validation_mode"])
                    if marker.get("legacy") or marker.get("contract") == "legacy":
                        return "legacy"
                    return "strict"
            except (json.JSONDecodeError, OSError):
                pass
        try:
            from lib.checkpoint import PROJECTS_DIR
            p_dir = Path(pipeline_dir).resolve()
            if p_dir == PROJECTS_DIR.resolve() or PROJECTS_DIR.resolve() in p_dir.parents:
                return "strict"
        except Exception:
            pass

    return "legacy"


def _lookup_artifact_hash(ev: EvidenceRecord, raw_path: str, resolved_path: Path) -> str | None:
    """Resolve the declared artifact hash for an evidence path.

    Looks in ``ev.artifact_hashes`` first, then in ``ev.metadata['artifact_hashes']``.
    Accepts the raw declared path, its absolute resolved form, and the path as
    declared relative to the project directory.
    """
    candidates = [raw_path, str(resolved_path)]
    try:
        candidates.append(str(Path(raw_path)))
    except (TypeError, ValueError):
        pass
    sources = [ev.artifact_hashes]
    meta_hashes = ev.metadata.get("artifact_hashes")
    if isinstance(meta_hashes, dict):
        sources.append(meta_hashes)
    for source in sources:
        if not isinstance(source, dict):
            continue
        for cand in candidates:
            found = source.get(cand)
            if found:
                return str(found)
    return None


def validate_pre_render(
    project_dir: Path,
    edit_decisions: dict[str, Any],
    mode: str = "strict",
    expected_scenes: list[str] | None = None,
    pipeline_type: str = "animated-explainer",
    asset_manifest: dict[str, Any] | None = None,
    evidence_records: list[EvidenceRecord] | None = None,
    defs_dir: Path | None = None,
    required_gates: list[str] | set[str] | None = None,
) -> ProductionValidationReport:
    """Pre-render validation gate. Must pass before any render branch runs."""
    records: list[EvidenceRecord] = []
    project_dir = Path(project_dir)

    # 1. Project directory check
    if not project_dir.exists() or not project_dir.is_dir():
        rec = EvidenceRecord(
            gate_name="project_structure",
            scope="pre_render",
            status=ValidationStatus.BLOCKED,
            severity="critical",
            issues=[f"Project directory does not exist: {project_dir}"],
        )
        return ProductionValidationReport(
            project_id=project_dir.name,
            pipeline_type=pipeline_type,
            mode=mode,
            records=[rec],
        )

    # 2. Pipeline type validity from real definitions
    known_pipelines = get_known_pipelines(defs_dir)
    if known_pipelines and pipeline_type not in known_pipelines:
        rec = EvidenceRecord(
            gate_name="pipeline_type",
            scope="pre_render",
            status=ValidationStatus.BLOCKED,
            severity="critical",
            issues=[f"Unknown pipeline type: {pipeline_type!r}"],
        )
        return ProductionValidationReport(
            project_id=project_dir.name,
            pipeline_type=pipeline_type,
            mode=mode,
            records=[rec],
        )

    # 3. Scene coverage check
    cuts = edit_decisions.get("cuts", [])
    bespoke = edit_decisions.get("bespoke", {})
    scenes_declared: list[str] = []
    if cuts:
        scenes_declared = [c.get("id") or f"cut-{i+1}" for i, c in enumerate(cuts)]
    elif bespoke:
        scenes_declared = list(bespoke.get("scenes", []))
    if expected_scenes is not None:
        target_scenes = expected_scenes
    else:
        target_scenes = scenes_declared

    if not target_scenes:
        rec = EvidenceRecord(
            gate_name="scene_coverage",
            scope="pre_render",
            status=ValidationStatus.BLOCKED,
            severity="critical",
            issues=["Zero scenes declared in edit decisions or expected scenes."],
        )
        return ProductionValidationReport(
            project_id=project_dir.name,
            pipeline_type=pipeline_type,
            mode=mode,
            records=[rec],
        )

    # 4. Mandatory evidence verification in strict mode
    if mode == "strict":
        supplied_records = list(evidence_records or [])
        if not supplied_records:
            rec = EvidenceRecord(
                gate_name="scene_evidence",
                scope="pre_render",
                status=ValidationStatus.BLOCKED,
                severity="critical",
                scene_coverage=[],
                expected_scenes=target_scenes,
                issues=[
                    f"Nonempty scenes declared ({target_scenes}) but no verified production "
                    "evidence (layout/audio/semantic/SFX) found."
                ],
            )
            return ProductionValidationReport(
                project_id=project_dir.name,
                pipeline_type=pipeline_type,
                mode=mode,
                records=[rec],
            )

        # Validate each supplied record
        for ev in supplied_records:
            canonical_gate = GATE_ALIASES.get(ev.gate_name, ev.gate_name)
            if canonical_gate not in VALID_PRE_RENDER_GATES:
                ev.status = ValidationStatus.BLOCKED
                ev.severity = "critical"
                ev.issues.append(
                    f"Unrecognized/forged gate identity {ev.gate_name!r}; "
                    f"required one of {sorted(VALID_PRE_RENDER_GATES)}"
                )

            if ev.scope != "pre_render":
                ev.status = ValidationStatus.BLOCKED
                ev.severity = "critical"
                ev.issues.append(
                    f"Invalid scope {ev.scope!r} for pre-render gate {ev.gate_name!r}; expected 'pre_render'"
                )

            # Scene coverage validation for scene-scoped gates
            if canonical_gate in REQUIRED_PRE_RENDER_SCENE_GATES:
                if not ev.scene_coverage:
                    ev.status = ValidationStatus.BLOCKED
                    ev.severity = "critical"
                    ev.issues.append(f"Gate {ev.gate_name!r} has empty scene_coverage")
                extra_scenes = set(ev.scene_coverage) - set(target_scenes)
                if extra_scenes:
                    ev.status = ValidationStatus.BLOCKED
                    ev.severity = "critical"
                    ev.issues.append(
                        f"Gate {ev.gate_name!r} declared scene_coverage {sorted(list(extra_scenes))} not in target scenes"
                    )

            # Evidence paths and artifact disk verification
            unhashed_paths: list[str] = []
            if not ev.evidence_paths and ev.status == ValidationStatus.PASS:
                ev.status = ValidationStatus.BLOCKED
                ev.severity = "critical"
                ev.issues.append(f"Gate {ev.gate_name!r} has no evidence paths declared on disk")
            else:
                missing_paths = []
                hash_mismatches = []
                for ep in ev.evidence_paths:
                    p = Path(ep)
                    if not p.is_absolute():
                        p = project_dir / p
                    expected_hash = _lookup_artifact_hash(ev, ep, p)
                    if ev.status == ValidationStatus.PASS and not expected_hash:
                        # A-2: existence-only evidence is a forgery surface. Strict mode
                        # requires a content hash for EVERY declared evidence path.
                        unhashed_paths.append(ep)
                    if not p.exists() or p.stat().st_size == 0:
                        missing_paths.append(str(p))
                    elif expected_hash:
                        actual_hash = hash_file(p)
                        if actual_hash != expected_hash:
                            hash_mismatches.append(f"{ep} (expected {expected_hash}, got {actual_hash})")

                if missing_paths:
                    ev.status = ValidationStatus.BLOCKED
                    ev.severity = "critical"
                    ev.issues.extend([f"Evidence file missing or empty: {mp}" for mp in missing_paths])
                if hash_mismatches:
                    ev.status = ValidationStatus.BLOCKED
                    ev.severity = "critical"
                    ev.issues.extend([f"Evidence artifact hash mismatch / tampered: {hm}" for hm in hash_mismatches])

            # Input fingerprint verification against current inputs
            if ev.status == ValidationStatus.PASS and ev.fingerprint:
                input_hashes = ev.metadata.get("input_hashes", {})
                for in_path, expected_in_hash in input_hashes.items():
                    ip = Path(in_path)
                    if not ip.is_absolute():
                        ip = project_dir / ip
                    if not ip.exists():
                        ev.status = ValidationStatus.BLOCKED
                        ev.severity = "critical"
                        ev.issues.append(f"Referenced input file missing: {ip}")
                    elif hash_file(ip) != expected_in_hash:
                        ev.status = ValidationStatus.BLOCKED
                        ev.severity = "critical"
                        ev.issues.append(f"Referenced input file {ip} changed since validation (stale evidence)")

            # A-2: existence-only evidence is a forgery surface — strict mode requires
            # a content hash for EVERY declared evidence path.
            if unhashed_paths and ev.status == ValidationStatus.PASS:
                ev.status = ValidationStatus.BLOCKED
                ev.severity = "critical"
                ev.issues.extend(
                    [
                        f"Evidence path lacks artifact hash — content unverified: {up}"
                        for up in unhashed_paths
                    ]
                )

            records.append(ev)

        # Enforce REQUIRED Gate Set per scene / episode.
        #
        # A-1: strict mode enforces a SUPERSET of the canonical required gate sets.
        # Narrowing is permitted ONLY via the explicit caller kwarg ``required_gates``.
        # Validated-side metadata (edit_decisions / packets / project files) may only
        # WIDEN enforcement (union) — never shrink it.
        if required_gates is not None:
            active_req = {GATE_ALIASES.get(g, g) for g in required_gates}
            req_scene_gates = active_req & REQUIRED_PRE_RENDER_SCENE_GATES
            req_episode_gates = active_req & REQUIRED_PRE_RENDER_EPISODE_GATES
        else:
            req_scene_gates = set(REQUIRED_PRE_RENDER_SCENE_GATES)
            req_episode_gates = set(REQUIRED_PRE_RENDER_EPISODE_GATES)
            # Metadata may only widen (union) the enforced gate set.
            meta_req = edit_decisions.get("required_gates")
            if meta_req is not None:
                meta_canon = {GATE_ALIASES.get(g, g) for g in meta_req}
                req_scene_gates |= meta_canon & REQUIRED_PRE_RENDER_SCENE_GATES
                req_episode_gates |= meta_canon & REQUIRED_PRE_RENDER_EPISODE_GATES

        for g in sorted(req_scene_gates):
            passing_scenes: set[str] = set()
            for r in records:
                if r.status == ValidationStatus.PASS and GATE_ALIASES.get(r.gate_name, r.gate_name) == g:
                    passing_scenes.update(r.scene_coverage)
            missing = set(target_scenes) - passing_scenes
            if missing:
                records.append(
                    EvidenceRecord(
                        gate_name=g,
                        scope="pre_render",
                        status=ValidationStatus.BLOCKED,
                        severity="critical",
                        scene_coverage=sorted(list(passing_scenes)),
                        expected_scenes=target_scenes,
                        issues=[
                            f"Required gate {g!r} missing verified PASS coverage for scene(s): {sorted(list(missing))}"
                        ],
                    )
                )

        for eg in sorted(req_episode_gates):
            has_passing_episode = any(
                r.status == ValidationStatus.PASS and GATE_ALIASES.get(r.gate_name, r.gate_name) == eg
                for r in records
            )
            if not has_passing_episode:
                records.append(
                    EvidenceRecord(
                        gate_name=eg,
                        scope="pre_render",
                        status=ValidationStatus.BLOCKED,
                        severity="critical",
                        issues=[
                            f"Required episode gate {eg!r} missing verified PASS evidence"
                        ],
                    )
                )
    else:
        # Legacy mode: create basic record
        records.append(
            EvidenceRecord(
                gate_name="pre_render_contract",
                scope="pre_render",
                status=ValidationStatus.PASS,
                severity="info",
                scene_coverage=scenes_declared,
                expected_scenes=target_scenes,
                evidence_paths=[str(project_dir / "artifacts" / "edit_decisions.json")],
            )
        )

    return ProductionValidationReport(
        project_id=project_dir.name,
        pipeline_type=pipeline_type,
        mode=mode,
        records=records,
        metadata={"stage_fingerprints": _report_stage_fingerprints(project_dir, records, mode).get("stage_fingerprints", {})},
    )


def validate_post_render(
    project_dir: Path,
    output_path: Path,
    final_review: dict[str, Any],
    mode: str = "strict",
    pipeline_type: str = "animated-explainer",
) -> ProductionValidationReport:
    """Post-render completion validation gate. Must pass before compose checkpoint or publish."""
    records: list[EvidenceRecord] = []
    project_dir = Path(project_dir)
    output_path = Path(output_path)

    # Check output file exists and is non-empty
    if not output_path.exists() or output_path.stat().st_size == 0:
        rec = EvidenceRecord(
            gate_name="render_output",
            scope="post_render",
            status=ValidationStatus.BLOCKED,
            severity="critical",
            evidence_paths=[str(output_path)],
            issues=[f"Render output file missing or empty: {output_path}"],
        )
        return ProductionValidationReport(
            project_id=project_dir.name,
            pipeline_type=pipeline_type,
            mode=mode,
            records=[rec],
        )

    # Check final review status
    fr_status = final_review.get("status", "not_measured")
    issues = list(final_review.get("issues_found", final_review.get("issues", [])))
    if fr_status == "pass":
        rec_status = ValidationStatus.PASS
        severity = "info"
    elif fr_status == "revise":
        rec_status = ValidationStatus.REVISE
        severity = "critical"
    elif fr_status == "fail":
        rec_status = ValidationStatus.BLOCKED
        severity = "critical"
    else:
        rec_status = ValidationStatus.NOT_MEASURED
        severity = "critical"

    records.append(
        EvidenceRecord(
            gate_name="final_review",
            scope="post_render",
            status=rec_status,
            severity=severity,
            evidence_paths=[str(output_path)],
            issues=issues,
            metadata={"final_review": final_review},
        )
    )

    return ProductionValidationReport(
        project_id=project_dir.name,
        pipeline_type=pipeline_type,
        mode=mode,
        records=records,
        metadata=_report_stage_fingerprints(project_dir, records, mode),
    )


def _report_stage_fingerprints(project_dir: Path, records: list[EvidenceRecord], mode: str) -> dict[str, Any]:
    """Pin canonical artifact fingerprints only when strict validation passed."""
    if mode != "strict" or not records or any(record.status != ValidationStatus.PASS for record in records):
        return {}
    checkpoint = {"stage": "compose", "metadata": {}}
    try:
        fingerprint = recompute_checkpoint_fingerprint(checkpoint, project_dir.parent, project_dir.name)
    except ProductionValidationError:
        return {}
    return {"stage_fingerprints": {fingerprint.stage: fingerprint.to_dict()}}



def recompute_checkpoint_fingerprint(checkpoint: dict[str, Any], pipeline_dir: Path | None, project_id: str | None) -> StageFingerprint:
    """Compute canonical checkpoint fingerprint from artifacts; shared by fixtures and gate."""
    if pipeline_dir is None or not project_id:
        raise ProductionValidationError("strict provenance recomputation failed: pipeline_dir/project_id unresolved")
    root = Path(pipeline_dir)
    direct = root / "artifacts"
    project_dir = root if direct.is_dir() else root / str(project_id)
    artifacts_dir = project_dir / "artifacts"
    if not artifacts_dir.is_dir():
        raise ProductionValidationError(f"strict provenance recomputation failed: artifacts directory missing: {artifacts_dir}")
    def load_required(name):
        path = artifacts_dir / name
        try: return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc: raise ProductionValidationError(f"strict provenance recomputation failed: required artifact {name} missing/unreadable/invalid: {exc}") from exc
    script, timing, manifest = (load_required(name) for name in ("script.json", "scene_timing.json", "asset_manifest.json"))
    cuts = checkpoint.get("metadata", {}).get("edit_decisions", {}).get("cuts", [])
    ids = {str(x["id"]) for x in cuts if isinstance(x, dict) and x.get("id")}
    ids.update(str(x["id"]) for x in checkpoint.get("metadata", {}).get("scene_manifest", {}).get("scenes", []) if isinstance(x, dict) and x.get("id"))
    sections = {str(x["id"]): x for x in script.get("sections", []) if isinstance(x, dict) and x.get("id")}
    ids.update(sections)
    if not ids: raise ProductionValidationError("strict provenance recomputation failed: checkpoint has no authoritative scene IDs")
    optional = {}
    for name in ("words.json", "scene_elements.json", "edit_decisions.json", "captions.json", "scene_plan.json"):
        path = artifacts_dir / name
        if path.is_file():
            try: optional[name] = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, ValueError): optional[name] = None

    # TSX and component composition dependencies
    tsx_deps: dict[str, str] = {}
    for ext in ("*.tsx", "*.ts"):
        for p in project_dir.glob(ext):
            if p.is_file():
                tsx_deps[p.name] = hash_file(p)
    for sub in ("components", "remotion", "src", "source"):
        sdir = project_dir / sub
        if sdir.is_dir():
            for ext in ("**/*.tsx", "**/*.ts"):
                for p in sdir.glob(ext):
                    if p.is_file():
                        tsx_deps[str(p.relative_to(project_dir))] = hash_file(p)

    repo_root = Path(__file__).resolve().parent.parent
    remotion_composer = repo_root / "remotion-composer"
    if remotion_composer.is_dir():
        proj_name = str(project_id)
        candidates = [remotion_composer / "src" / proj_name]
        if project_dir.name != proj_name:
            candidates.append(remotion_composer / "src" / project_dir.name)
        for cdir in candidates:
            if cdir.is_dir():
                for p in cdir.glob("**/*.tsx"):
                    if p.is_file():
                        tsx_deps[str(p.relative_to(remotion_composer))] = hash_file(p)
                for p in cdir.glob("**/*.ts"):
                    if p.is_file():
                        tsx_deps[str(p.relative_to(remotion_composer))] = hash_file(p)

    # Config dependencies
    config_deps: dict[str, str] = {}
    for cname in ("project.json", "mix_profile.json", "scene_layout_spec.json", "event_spec.json", "mix_manifest.json", "scene_manifest.json"):
        cp = project_dir / cname
        if cp.is_file():
            config_deps[cname] = hash_file(cp)

    # Staged audio dependencies (audio_stems)
    staged_audio: dict[str, str] = {}
    stems_dir = project_dir / "audio_stems"
    if stems_dir.is_dir():
        for sp in sorted(stems_dir.iterdir()):
            if sp.is_file() and not sp.name.startswith("."):
                staged_audio[sp.name] = hash_file(sp)

    scenes = {}
    assets = manifest.get("assets", [])
    for sid in sorted(ids):
        audio_by_type: dict[str, list[dict[str, Any]]] = {
            "narration": [],
            "music": [],
            "sfx": [],
            "audio": [],
        }
        visuals = []
        for asset in assets if isinstance(assets, list) else []:
            if not isinstance(asset, dict) or str(asset.get("scene_id")) != sid:
                continue
            rel = asset.get("path")
            if not isinstance(rel, str):
                continue
            path = project_dir / rel
            atype = asset.get("type")
            if atype in {"audio", "narration", "music", "sfx"}:
                try:
                    data = path.read_bytes()
                except OSError as exc:
                    raise ProductionValidationError(
                        f"strict provenance recomputation failed: declared audio missing/unreadable: {path}: {exc}"
                    ) from exc
                if not data:
                    raise ProductionValidationError(f"strict provenance recomputation failed: declared audio empty: {path}")
                audio_by_type[atype].append({
                    "id": asset.get("id", ""),
                    "path": rel,
                    "sha256": hash_bytes(data),
                })
            elif atype in {"image", "video", "diagram", "animation", "3d_asset"} and path.is_file():
                visuals.append(path)

        # Select primary audio per type hierarchy: narration -> audio -> music -> sfx
        if audio_by_type["narration"]:
            if len(audio_by_type["narration"]) == 1:
                primary_audio = project_dir / audio_by_type["narration"][0]["path"]
            else:
                primary_audio = b"".join(
                    project_dir.joinpath(a["path"]).read_bytes() for a in audio_by_type["narration"]
                )
        elif audio_by_type["audio"]:
            if len(audio_by_type["audio"]) == 1:
                primary_audio = project_dir / audio_by_type["audio"][0]["path"]
            else:
                primary_audio = b"".join(
                    project_dir.joinpath(a["path"]).read_bytes() for a in audio_by_type["audio"]
                )
        elif audio_by_type["music"]:
            primary_audio = project_dir / audio_by_type["music"][0]["path"]
        elif audio_by_type["sfx"]:
            primary_audio = project_dir / audio_by_type["sfx"][0]["path"]
        else:
            primary_audio = None

        def per_scene(data):
            if isinstance(data, dict): return data.get(sid, data)
            if isinstance(data, list): return [x for x in data if isinstance(x, dict) and str(x.get("scene_id", x.get("id", ""))) == sid]
            return data

        scene_comp_deps = {k: per_scene(v) for k, v in optional.items()}
        audio_assets_present = {k: v for k, v in audio_by_type.items() if v}
        if audio_assets_present:
            scene_comp_deps["audio_assets"] = audio_assets_present
        if tsx_deps:
            scene_comp_deps["tsx"] = tsx_deps
        if config_deps:
            scene_comp_deps["config"] = config_deps
        if staged_audio:
            scene_comp_deps["staged_audio"] = staged_audio

        scenes[sid] = compute_scene_fingerprint(
            sid,
            text=sections.get(sid, {}).get("text"),
            audio_path_or_bytes=primary_audio,
            words_data=per_scene(optional.get("words.json")),
            timing_data=per_scene(timing),
            visual_asset_paths_or_hashes=visuals,
            scene_config=manifest,
            events_data=per_scene(optional.get("scene_elements.json")),
            composition_deps=scene_comp_deps,
        )
    return compute_stage_fingerprint(str(checkpoint.get("stage", "")), scenes)


def _compute_checkpoint_stage_fingerprint(checkpoint: dict[str, Any], pipeline_dir: Path | None, project_id: str | None):
    """Test-facing alias for the gate's canonical mapping."""
    return recompute_checkpoint_fingerprint(checkpoint, pipeline_dir, project_id)

def validate_checkpoint_production_gate(
    checkpoint: dict[str, Any],
    pipeline_dir: Path | None = None,
    project_id: str | None = None,
) -> None:
    """Stage gate hook for lib/checkpoint.py enforcing production validation evidence."""
    stage = checkpoint.get("stage")
    status = checkpoint.get("status")
    metadata = checkpoint.get("metadata", {})
    resolved_proj = project_id or checkpoint.get("project_id")
    mode = resolve_validation_mode(checkpoint, pipeline_dir, resolved_proj)

    if status in {"completed", "awaiting_human"} and stage in {"compose", "publish"}:
        if mode == "strict":
            evidence_report = metadata.get("production_validation_report")
            if not evidence_report or not isinstance(evidence_report, dict):
                raise ProductionValidationError(
                    f"Production validation gate failed for stage {stage!r}: "
                    f"strict mode requires verified production_validation_report in metadata"
                )
            provenance_sources = (
                ("metadata.stage_fingerprint", metadata, "stage_fingerprint"),
                ("metadata.recorded_fingerprints", metadata, "recorded_fingerprints"),
                ("metadata.provenance_freshness", metadata, "provenance_freshness"),
                ("evidence_report.provenance_freshness", evidence_report, "provenance_freshness"),
                ("evidence_report.metadata.stage_fingerprints", evidence_report.get("metadata", {}), "stage_fingerprints"),
            )
            present = [(label, source[key]) for label, source, key in provenance_sources if key in source]
            # Strict checkpoints require provenance evidence; absence is not proof of freshness.
            if not present:
                raise ProductionValidationError(f"Production validation gate failed for stage {stage!r}: strict mode requires provenance evidence")

            def malformed(label: str, value: Any, reason: str) -> ProductionValidationError:
                return ProductionValidationError(f"Production validation gate failed for stage {stage!r}: malformed {label}: {reason}; received {type(value).__name__} {value!r}")

            def validate_stage(label: str, value: Any) -> StageFingerprint:
                if not isinstance(value, dict):
                    raise malformed(label, value, "expected dict")
                allowed = {"stage", "scene_fingerprints", "shared_contracts_sha256", "stage_composite_sha256"}
                extra = set(value) - allowed
                if extra:
                    raise malformed(label, value, f"unknown keys {sorted(extra)!r}")
                if not isinstance(value.get("stage"), str):
                    raise malformed(label + ".stage", value.get("stage"), "expected str")
                scenes = value.get("scene_fingerprints")
                if not isinstance(scenes, dict):
                    raise malformed(label + ".scene_fingerprints", scenes, "expected dict")
                for scene, fp in scenes.items():
                    if not isinstance(fp, dict):
                        raise malformed(f"{label}.scene_fingerprints[{scene!r}]", fp, "expected dict")
                    allowed_scene = set(SceneFingerprint.__dataclass_fields__)
                    if set(fp) - allowed_scene:
                        raise malformed(f"{label}.scene_fingerprints[{scene!r}]", fp, f"unknown keys {sorted(set(fp)-allowed_scene)!r}")
                    for field_name, field_value in fp.items():
                        if not isinstance(field_value, str):
                            raise malformed(f"{label}.scene_fingerprints[{scene!r}].{field_name}", field_value, "expected str")
                for field_name in ("shared_contracts_sha256", "stage_composite_sha256"):
                    if field_name in value and not isinstance(value[field_name], str):
                        raise malformed(label + "." + field_name, value[field_name], "expected str")
                return StageFingerprint.from_dict(value)

            def recompute_from_artifacts() -> StageFingerprint:
                try:
                    return recompute_checkpoint_fingerprint(checkpoint, pipeline_dir, resolved_proj)
                except ProductionValidationError as exc:
                    raise ProductionValidationError(f"Production validation gate failed for stage {stage!r}: {exc}") from exc

            def validate_shape(label: str, value: Any) -> FreshnessResult:
                if label == "evidence_report.metadata.stage_fingerprints" and isinstance(value, dict) and value:
                    for fingerprint_stage, fingerprint_value in value.items():
                        validate_stage(label + f"[{fingerprint_stage}]", fingerprint_value)
                    return FreshnessResult(True)
                if not isinstance(value, dict) or not value:
                    raise malformed(label, value, "expected non-empty dict")
                if "is_fresh" in value:
                    allowed = {"is_fresh", "stale_stages", "stale_reasons", "mismatched_fingerprints"}
                    if set(value) != allowed:
                        raise malformed(label, value, f"expected exactly required fields; missing {sorted(allowed-set(value))!r}")
                    if type(value["is_fresh"]) is not bool:
                        raise malformed(label + ".is_fresh", value["is_fresh"], "expected literal bool")
                    for field_name in ("stale_stages", "stale_reasons"):
                        field_value = value.get(field_name, [])
                        if not isinstance(field_value, list):
                            raise malformed(label + "." + field_name, field_value, "expected list[str]")
                        if any(not isinstance(item, str) for item in field_value):
                            raise malformed(label + "." + field_name, field_value, "expected list[str]")
                    mismatches = value.get("mismatched_fingerprints", {})
                    if not isinstance(mismatches, dict):
                        raise malformed(label + ".mismatched_fingerprints", mismatches, "expected dict[str, dict]")
                    for scene, mismatch in mismatches.items():
                        if not isinstance(scene, str) or not isinstance(mismatch, dict):
                            raise malformed(label + ".mismatched_fingerprints", mismatches, "expected dict[str, dict]")
                    if value["is_fresh"] and (value["stale_stages"] or value["stale_reasons"] or mismatches):
                        raise malformed(label, value, "fresh verdict with non-empty stale evidence")
                    if not value["is_fresh"] and not (value["stale_stages"] or value["stale_reasons"] or mismatches):
                        raise malformed(label, value, "stale verdict with zero evidence")
                    return FreshnessResult.from_dict(value)
                if "current" in value or "recorded" in value:
                    if set(value) == {"current", "recorded"}:
                        provided_current = validate_stage(label + ".current", value["current"])
                        if provided_current.stage_composite_sha256:
                            recomputed = recompute_from_artifacts()
                            if provided_current.stage_composite_sha256 != recomputed.stage_composite_sha256:
                                mismatch = verify_provenance_freshness(recomputed, provided_current)
                                raise ProductionValidationError(f"Production validation gate failed for stage {stage!r}: provided current contradicts recomputed current: {label}; mismatches={mismatch.mismatched_fingerprints}; stale reasons={mismatch.stale_reasons}")
                        return validate_stage(label + ".recorded", value["recorded"])
                    if "recorded" in value:
                        return validate_stage(label + ".recorded", value["recorded"])
                    raise malformed(label, value, "expected recorded baseline")
                if "scene_fingerprints" in value:
                    return validate_stage(label, value)
                raise malformed(label, value, "unrecognized provenance shape")

            recorded = []
            verdicts = []
            for label, value in present:
                validate_shape(label, value)
                if label == "evidence_report.metadata.stage_fingerprints" and isinstance(value, dict) and value:
                    for fingerprint_stage, fingerprint_value in value.items():
                        recorded.append((label + f"[{fingerprint_stage}]", validate_stage(label + f"[{fingerprint_stage}]", fingerprint_value)))
                elif isinstance(value, dict) and set(value) == {"current", "recorded"}:
                    provided_current = validate_stage(label + ".current", value["current"])
                    if provided_current.stage_composite_sha256:
                        current_check = recompute_from_artifacts()
                        if provided_current.stage_composite_sha256 != current_check.stage_composite_sha256:
                            raise ProductionValidationError(f"Production validation gate failed for stage {stage!r}: provided current contradicts recomputed current: {label}")
                    recorded.append((label, validate_stage(label + ".recorded", value["recorded"])))
                elif isinstance(value, dict) and "recorded" in value:
                    baseline = validate_stage(label + ".recorded", value["recorded"])
                    recorded.append((label, baseline))
                elif isinstance(value, dict) and "scene_fingerprints" in value:
                    recorded.append((label, validate_stage(label, value)))
                elif isinstance(value, dict) and "is_fresh" in value:
                    verdicts.append((label, value["is_fresh"], value.get("stale_reasons", [])))
            if not recorded:
                raise ProductionValidationError(f"Production validation gate failed for stage {stage!r}: strict provenance unverifiable: verdict-only provenance has no recorded baseline")
            current = recompute_from_artifacts()
            for label, baseline in recorded:
                freshness = verify_provenance_freshness(current, baseline)
                for verdict_label, verdict, reasons in verdicts:
                    if verdict != freshness.is_fresh:
                        raise ProductionValidationError(f"Production validation gate failed for stage {stage!r}: provided verdict contradicts recomputed result: {verdict_label} is_fresh={verdict}, recomputed is_fresh={freshness.is_fresh}; provided reasons={reasons}; recomputed stale reasons={freshness.stale_reasons}; mismatches={freshness.mismatched_fingerprints}")
                if not freshness.is_fresh:
                    raise ProductionValidationError(f"Production validation gate failed for stage {stage!r}: recomputed stale provenance from {label}: {freshness.stale_reasons}; mismatches: {freshness.mismatched_fingerprints}")
            rep_status = evidence_report.get("status")
            if rep_status != "pass":
                reasons = evidence_report.get("blocking_reasons", [])
                raise ProductionValidationError(
                    f"Production validation gate failed for stage {stage!r}: "
                    f"report status is {rep_status!r}. Reasons: {reasons}"
                )
            rep_obj = ProductionValidationReport(
                project_id=str(evidence_report.get("project_id", resolved_proj or "")),
                pipeline_type=str(evidence_report.get("pipeline_type", checkpoint.get("pipeline_type", ""))),
                mode=str(evidence_report.get("mode", mode)),
                records=[
                    EvidenceRecord.from_dict(record)
                    for record in evidence_report.get("records", [])
                    if isinstance(record, dict)
                ],
                version=str(evidence_report.get("version", "1.0")),
                metadata=dict(evidence_report.get("metadata", {})),
            )
            # The checkpoint's edit decisions are the authority for scene identity;
            # never trust evidence-record declarations as the authoritative set.
            edit_decisions = checkpoint.get("edit_decisions")
            if not isinstance(edit_decisions, dict):
                edit_decisions = metadata.get("edit_decisions")
            cuts = edit_decisions.get("cuts") if isinstance(edit_decisions, dict) else None
            authoritative_scenes = None
            if isinstance(cuts, list) and cuts:
                authoritative_scenes = [
                    str(cut.get("id") or f"cut-{i + 1}")
                    for i, cut in enumerate(cuts)
                    if isinstance(cut, dict)
                ]
            else:
                scene_manifest = checkpoint.get("scene_manifest", metadata.get("scene_manifest"))
                if isinstance(scene_manifest, dict):
                    scenes = scene_manifest.get("scenes")
                    if isinstance(scenes, list) and scenes:
                        authoritative_scenes = [
                            str(scene.get("id") if isinstance(scene, dict) else scene)
                            for scene in scenes
                        ]
            if authoritative_scenes is None:
                raise ProductionValidationError(
                    f"Production validation gate failed for stage {stage!r}: "
                    "strict completion requires authoritative scene manifest from checkpoint edit_decisions.cuts "
                    "or scene_manifest.scenes"
                )
            if not rep_obj.can_complete(stage, authoritative_scenes=authoritative_scenes):
                reasons = rep_obj.blocking_reasons or getattr(rep_obj, "_completion_failure_reasons", [])
                if not reasons:
                    reasons = ["Authoritative scene declarations or coverage do not match checkpoint scenes"]
                raise ProductionValidationError(
                    f"Production validation gate failed for stage {stage!r}: "
                    f"evidence report cannot complete stage {stage!r} with status {rep_obj.status.value!r}. "
                    f"Reasons: {reasons}"
                )

