"""Reusable QC guard for timing relock validation across OpenMontage projects.

Validates that edit_decisions cut boundaries and word alignment strictly match
measured audio assets on disk, preventing visual cutoff and unsynchronized cuts.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from lib.timing_validator import TimingValidationResult, validate_edit_timing_against_audio



def check_project_timing(
    project_dir: Path | str,
    mode: str = "strict",
) -> TimingValidationResult:
    """Validate project timing against actual audio files on disk."""
    project_path = Path(project_dir).resolve()
    artifacts_dir = project_path / "artifacts"
    ed_path = artifacts_dir / "edit_decisions.json"

    if not ed_path.is_file():
        return TimingValidationResult(
            valid=False,
            errors=[f"Missing edit_decisions artifact: {ed_path}"],
        )

    try:
        with open(ed_path, "r", encoding="utf-8") as f:
            edit_decisions = json.load(f)
    except Exception as e:
        return TimingValidationResult(
            valid=False,
            errors=[f"Failed to parse edit_decisions JSON: {e}"],
        )

    manifest_path = artifacts_dir / "asset_manifest.json"
    manifest: dict | None = None
    if manifest_path.is_file():
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)
        except Exception as e:
            if mode == "strict":
                return TimingValidationResult(
                    valid=False,
                    errors=[f"Failed to parse asset_manifest JSON: {e}"],
                )

    return validate_edit_timing_against_audio(
        edit_decisions=edit_decisions,
        project_dir=project_path,
        asset_manifest=manifest,
        mode=mode,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Timing re-lock QC guard.")
    parser.add_argument("project_dir", type=Path, help="Path to project directory")
    parser.add_argument(
        "--mode",
        choices=["strict", "legacy"],
        default="strict",
        help="Validation mode (strict=fail on missing/mismatched audio, legacy=warn)",
    )
    args = parser.parse_args()

    result = check_project_timing(args.project_dir, mode=args.mode)
    out = {
        "valid": result.valid,
        "mode": args.mode,
        "errors": result.errors,
        "warnings": result.warnings,
        "info": result.info,
    }
    print(json.dumps(out, indent=2, ensure_ascii=False))

    if not result.valid:
        print(f"\nTIMING RELOCK FAILED ({len(result.errors)} errors):", file=sys.stderr)
        for err in result.errors:
            print(f"  • {err}", file=sys.stderr)
        return 1

    print("\nTIMING RELOCK PASSED", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())

