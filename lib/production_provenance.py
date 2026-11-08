"""Cryptographic fingerprints for production-stage artifacts."""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional, Union


def hash_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def hash_file(path: Union[str, Path]) -> str:
    try:
        data = Path(path).read_bytes()
    except (OSError, TypeError, ValueError):
        return ""
    return hash_bytes(data) if data else ""


def hash_json_data(obj: Any) -> str:
    encoded = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hash_bytes(encoded)


@dataclass
class SceneFingerprint:
    text_sha256: str = ""
    audio_bytes_sha256: str = ""
    alignment_config_sha256: str = ""
    words_sha256: str = ""
    timing_sha256: str = ""
    visual_assets_sha256: str = ""
    scene_config_sha256: str = ""
    events_sha256: str = ""
    composition_deps_sha256: str = ""
    composite_sha256: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {k: getattr(self, k) for k in self.__dataclass_fields__}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SceneFingerprint:
        return cls(**{k: str(data.get(k, "")) for k in cls.__dataclass_fields__})

    def compute_composite(self) -> str:
        fields = {k: getattr(self, k) for k in self.__dataclass_fields__ if k != "composite_sha256"}
        return hash_json_data(fields)


@dataclass
class StageFingerprint:
    stage: str
    scene_fingerprints: dict[str, SceneFingerprint] = field(default_factory=dict)
    shared_contracts_sha256: str = ""
    stage_composite_sha256: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {"stage": self.stage, "scene_fingerprints": {k: v.to_dict() for k, v in sorted(self.scene_fingerprints.items())},
                "shared_contracts_sha256": self.shared_contracts_sha256, "stage_composite_sha256": self.stage_composite_sha256}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> StageFingerprint:
        return cls(stage=str(data.get("stage", "")), scene_fingerprints={str(k): SceneFingerprint.from_dict(v) for k, v in data.get("scene_fingerprints", {}).items()},
                   shared_contracts_sha256=str(data.get("shared_contracts_sha256", "")), stage_composite_sha256=str(data.get("stage_composite_sha256", "")))

    def compute_composite(self) -> str:
        return hash_json_data({"stage": self.stage, "scene_fingerprints": {k: v.composite_sha256 or v.compute_composite() for k, v in sorted(self.scene_fingerprints.items())}, "shared_contracts_sha256": self.shared_contracts_sha256})


@dataclass
class FreshnessResult:
    is_fresh: bool
    stale_stages: list[str] = field(default_factory=list)
    stale_reasons: list[str] = field(default_factory=list)
    mismatched_fingerprints: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {"is_fresh": self.is_fresh, "stale_stages": self.stale_stages, "stale_reasons": self.stale_reasons, "mismatched_fingerprints": self.mismatched_fingerprints}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> FreshnessResult:
        return cls(bool(data.get("is_fresh", False)), list(data.get("stale_stages", [])), list(data.get("stale_reasons", [])), dict(data.get("mismatched_fingerprints", {})))


def _hash_input(value: Any) -> str:
    return hash_json_data(value) if value is not None else ""


def compute_scene_fingerprint(scene_id: str, text: Optional[str] = None, audio_path_or_bytes: Optional[Union[str, Path, bytes]] = None,
                              alignment_config: Optional[Any] = None, words_data: Optional[Any] = None, timing_data: Optional[Any] = None,
                              visual_asset_paths_or_hashes: Optional[Union[list, dict]] = None, scene_config: Optional[Any] = None,
                              events_data: Optional[Any] = None, composition_deps: Optional[Any] = None) -> SceneFingerprint:
    if isinstance(audio_path_or_bytes, bytes):
        audio_hash = hash_bytes(audio_path_or_bytes) if audio_path_or_bytes else ""
    elif audio_path_or_bytes is not None:
        audio_hash = hash_file(audio_path_or_bytes)
    else:
        audio_hash = ""
    visual_hashes: Any = None
    if isinstance(visual_asset_paths_or_hashes, dict):
        visual_hashes = {str(k): (str(v) if isinstance(v, str) and len(v) == 64 else hash_file(v)) for k, v in visual_asset_paths_or_hashes.items()}
    elif isinstance(visual_asset_paths_or_hashes, list):
        visual_hashes = [str(v) if isinstance(v, str) and len(v) == 64 else hash_file(v) for v in visual_asset_paths_or_hashes]
    result = SceneFingerprint(text_sha256=hash_bytes(text.encode("utf-8")) if text is not None else "", audio_bytes_sha256=audio_hash,
        alignment_config_sha256=_hash_input(alignment_config), words_sha256=_hash_input(words_data), timing_sha256=_hash_input(timing_data),
        visual_assets_sha256=_hash_input(visual_hashes), scene_config_sha256=_hash_input(scene_config),
        events_sha256=_hash_input(events_data), composition_deps_sha256=_hash_input(composition_deps))
    result.composite_sha256 = result.compute_composite()
    return result


def compute_stage_fingerprint(stage: str, scenes: dict[str, SceneFingerprint], shared_contracts: Optional[Any] = None) -> StageFingerprint:
    result = StageFingerprint(stage, dict(scenes), _hash_input(shared_contracts))
    result.stage_composite_sha256 = result.compute_composite()
    return result


def verify_provenance_freshness(current: StageFingerprint, recorded: StageFingerprint) -> FreshnessResult:
    reasons, mismatches = [], {}
    if current.shared_contracts_sha256 != recorded.shared_contracts_sha256:
        reasons.append("shared_contracts changed")
        mismatches["shared_contracts_sha256"] = {"current": current.shared_contracts_sha256, "recorded": recorded.shared_contracts_sha256}
    fields = [f for f in SceneFingerprint.__dataclass_fields__ if f != "composite_sha256"]
    for scene in sorted(set(current.scene_fingerprints) | set(recorded.scene_fingerprints)):
        cur, old = current.scene_fingerprints.get(scene), recorded.scene_fingerprints.get(scene)
        if cur is None or old is None:
            reasons.append(f"scene {scene} added or removed")
            mismatches[scene] = {"current": cur.to_dict() if cur else None, "recorded": old.to_dict() if old else None}
            continue
        for name in fields:
            if getattr(cur, name) != getattr(old, name):
                component = name.removesuffix("_sha256")
                reasons.append(f"scene {scene} {component} changed")
                mismatches.setdefault(scene, {})[name] = {"current": getattr(cur, name), "recorded": getattr(old, name)}
    return FreshnessResult(not reasons, [current.stage] if reasons else [], reasons, mismatches)


def detect_stale_dependencies(stages: dict[str, StageFingerprint], dependency_graph: dict[str, list[str]], recorded_stages: Optional[dict[str, StageFingerprint]] = None) -> dict[str, FreshnessResult]:
    results: dict[str, FreshnessResult] = {}
    recorded_stages = recorded_stages or {}
    for stage, fingerprint in stages.items():
        if stage in recorded_stages:
            results[stage] = verify_provenance_freshness(fingerprint, recorded_stages[stage])
        else:
            results[stage] = FreshnessResult(True)
    changed = True
    while changed:
        changed = False
        for stage, dependencies in dependency_graph.items():
            if stage not in results:
                results[stage] = FreshnessResult(True)
            for dependency in dependencies:
                if dependency not in stages:
                    reason = f"upstream dependency {dependency} missing"
                    if reason not in results[stage].stale_reasons:
                        results[stage].is_fresh = False
                        results[stage].stale_stages = sorted(set(results[stage].stale_stages + [stage]))
                        results[stage].stale_reasons.append(reason)
                        changed = True
                    continue
                upstream = results.get(dependency)
                if upstream and not upstream.is_fresh:
                    reason = f"upstream dependency {dependency} is stale"
                    if reason not in results[stage].stale_reasons:
                        results[stage].is_fresh = False
                        results[stage].stale_stages = sorted(set(results[stage].stale_stages + [stage]))
                        results[stage].stale_reasons.append(reason)
                        changed = True
    return results
