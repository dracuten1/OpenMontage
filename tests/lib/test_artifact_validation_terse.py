"""Regression: validate_artifact failures must be terse, not schema dumps.

2026-11-10: a pipeline agent burned ~128K tokens re-running 01_plan.py because
jsonschema's str(ValidationError) embedded the ENTIRE scene_plan schema
(22KB+/run) and only surfaced one violation per run. Lock in the fix:
all violations in one short message, schema never embedded.
"""

import jsonschema
import pytest

from schemas.artifacts import ArtifactValidationError, validate_artifact

BAD_SCENE_PLAN = {
    "version": "1.0",
    "style_playbook": "editorial-explainer-manifest",
    "manifest_ref": "extra-prop-not-in-schema",
    "scenes": [{"id": "s1"}],
}


def test_invalid_artifact_raises_artifact_validation_error():
    with pytest.raises(ArtifactValidationError):
        validate_artifact("scene_plan", BAD_SCENE_PLAN)


def test_error_is_still_a_jsonschema_validation_error():
    """Existing `except jsonschema.ValidationError` handlers must keep working."""
    with pytest.raises(jsonschema.ValidationError):
        validate_artifact("scene_plan", BAD_SCENE_PLAN)


def test_message_lists_all_violations_at_once():
    with pytest.raises(ArtifactValidationError) as ei:
        validate_artifact("scene_plan", BAD_SCENE_PLAN)
    msg = str(ei.value)
    assert "manifest_ref" in msg  # the extra-prop violation
    assert "'type' is a required property" in msg  # missing-field violation
    assert "schema error(s)" in msg


def test_message_is_terse_and_schema_free():
    with pytest.raises(ArtifactValidationError) as ei:
        validate_artifact("scene_plan", BAD_SCENE_PLAN)
    msg = str(ei.value)
    assert len(msg) < 2000, f"terse message expected, got {len(msg)} chars"
    assert "Failed validating" not in msg
    assert "$schema" not in msg


def test_valid_artifact_passes():
    validate_artifact(
        "scene_plan",
        {
            "version": "1.0",
            "style_playbook": "news_blocks",
            "scenes": [
                {
                    "id": "s1",
                    "type": "talking_head",
                    "description": "d",
                    "start_seconds": 0,
                    "end_seconds": 10,
                }
            ],
        },
    )
