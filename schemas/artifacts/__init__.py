"""Artifact schema loading and validation utilities."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import jsonschema

SCHEMA_DIR = Path(__file__).parent


class ArtifactValidationError(jsonschema.ValidationError):
    """Artifact schema failure with a terse message.

    Subclasses jsonschema.ValidationError so existing
    ``except jsonschema.ValidationError`` handlers keep working, but the
    string form carries one short line per violation instead of the full
    schema dump (jsonschema's default str() can exceed 70KB, which a retry
    loop then re-reads on every failed run).
    """

    def __init__(self, message: str) -> None:
        super().__init__(message)

ARTIFACT_NAMES = [
    "research_brief",
    "proposal_packet",
    "brief",
    "script",
    "character_design",
    "rig_plan",
    "pose_library",
    "scene_plan",
    "action_timeline",
    "asset_manifest",
    "edit_decisions",
    "render_report",
    "publish_log",
    "review",
    "cost_log",
    "decision_log",
    "source_media_review",
    "final_review",
    "character_qa_report",
    "video_analysis_brief",
]


def load_schema(name: str) -> dict:
    """Load a JSON schema by artifact name."""
    path = SCHEMA_DIR / f"{name}.schema.json"
    if not path.exists():
        raise FileNotFoundError(f"Schema not found: {path}")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def validate_artifact(name: str, data: dict[str, Any]) -> None:
    """Validate artifact data against its schema. Raises on failure.

    Raises ArtifactValidationError carrying ALL violations in one terse
    message (path + message per error, schema never embedded) so a pipeline
    agent can fix every field in a single retry instead of discovering one
    violation per run — each jsonschema str() dump of the full schema costs
    tens of KB of model context.
    """
    schema = load_schema(name)
    validator = jsonschema.Draft202012Validator(schema)
    errors = sorted(
        validator.iter_errors(data),
        key=lambda e: [str(p) for p in e.absolute_path],
    )
    if not errors:
        return
    parts = []
    for err in errors[:5]:
        path = "$" + "".join(
            f"[{i}]" if isinstance(i, int) else f".{i}" for i in err.absolute_path
        )
        msg = " ".join(str(err.message).split())
        if len(msg) > 200:
            msg = msg[:197] + "..."
        parts.append(f"{path}: {msg}")
    remaining = len(errors) - len(parts)
    line = f"{name}: {len(errors)} schema error(s)"
    if remaining:
        line += f" (first {len(parts)} shown, +{remaining} more)"
    line += " -> " + " | ".join(parts)
    raise ArtifactValidationError(line)


def list_schemas() -> list[str]:
    """List all available artifact schema names."""
    return [p.stem.replace(".schema", "") for p in SCHEMA_DIR.glob("*.schema.json")]
