"""Timing re-lock validator for edit decisions against measured audio and word alignments.

Enforces that edit stage cut boundaries match measured audio durations from
asset_manifest.json (and narration_full.wav if present) before allowing the pipeline
to advance from edit to compose stage.

Degradation model (documented for stage gates):
- If asset_manifest does not exist or has no narration assets with durations,
  the validator degrades to a clear WARNING (allowing earlier pipeline scaffolding/testing).
- If word alignment (narration_words.json) is missing, the word-level check is gracefully
  skipped (no-op), and only the primary manifest-based check runs.
- If edit_decisions cut boundaries mismatch measured audio beyond tolerance (or word start
  mismatches beyond tolerance), it raises a HARD CheckpointValidationError at the gate.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from tools.audio.refresh_manifest import probe_audio_duration

logger = logging.getLogger(__name__)

# Tolerances:
# Boundary tolerance: ±0.30s per cut boundary covers legitimate decimal rounding,
# frame-quantization (1-2 frames @ 30fps = 33-66ms), and subtle audio boundary padding.
CUT_BOUNDARY_TOLERANCE_SECONDS = 0.30

# Word alignment tolerance: ±0.40s. ASR speech start timestamps have small onset variations
# and speech-lock anchors typically require ±0.3s-0.5s tolerance.
WORD_ALIGNMENT_TOLERANCE_SECONDS = 0.40

# Narration full wav tolerance vs sum of cuts: 1.0s to accommodate visual hold/tail padding (e.g. 0.44s - 0.5s tail pad).
FULL_AUDIO_TOLERANCE_SECONDS = 1.00


@dataclass
class TimingValidationResult:
    valid: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    info: list[str] = field(default_factory=list)


def _load_word_alignment(project_dir: Path) -> list[dict] | dict | None:
    """Look for narration_words.json in standard project paths."""
    candidates = [
        project_dir / "artifacts" / "narration_words.json",
        project_dir / "assets" / "audio" / "transcripts" / "narration_words.json",
        project_dir / "assets" / "audio" / "narration_words.json",
    ]
    for c in candidates:
        if c.is_file():
            try:
                with open(c, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning("Failed to load word alignment from %s: %s", c, e)
    return None


def _get_first_word_start(word_data: Any, scene_idx: int, scene_id: str | None = None) -> float | None:
    """Extract first word start timestamp for a given scene from narration_words.json data."""
    if not word_data:
        return None

    # Shape 1: Flat list of word entries
    if isinstance(word_data, list):
        # Match by scene_id (e.g. 'scene_01', 's01', 'scene-1', or index)
        matching_words = []
        for w in word_data:
            w_scene = str(w.get("scene_id") or w.get("script_section_id") or "")
            if scene_id and (w_scene == scene_id or w_scene.lower() == scene_id.lower()):
                matching_words.append(w)
            elif not scene_id and f"{scene_idx}" in w_scene:
                matching_words.append(w)

        if matching_words:
            first_w = matching_words[0]
            start = first_w.get("global_start")
            if start is None:
                start = first_w.get("clip_start")
            if start is not None:
                return float(start)

    # Shape 2: Dict keyed by section/scene id (e.g. 's01', 's1', 'scene-1')
    elif isinstance(word_data, dict):
        if "words" in word_data and isinstance(word_data["words"], list):
            # Dict with top-level words list (e.g. gh6 style)
            # Find words in this scene
            return None

        # Dict keyed by section id (e.g. bach-viet style: {'s01': {'words': [...]}})
        possible_keys = [
            f"s{scene_idx:02d}",
            f"s{scene_idx}",
            f"scene_{scene_idx:02d}",
            f"scene_{scene_idx}",
            f"scene-{scene_idx}",
        ]
        if scene_id:
            possible_keys.insert(0, scene_id)

        for k in possible_keys:
            if k in word_data:
                entry = word_data[k]
                if isinstance(entry, dict):
                    ws = entry.get("words", [])
                    if ws and isinstance(ws[0], dict):
                        w0 = ws[0]
                        start = w0.get("global_start")
                        if start is None:
                            start = w0.get("start")
                        if start is not None:
                            g_offset = float(entry.get("global_start", 0.0))
                            # If start is local and global_offset exists
                            if "global_start" in w0:
                                return float(w0["global_start"])
                            return g_offset + float(start)
    return None


def validate_edit_timing_against_audio(
    edit_decisions: dict[str, Any],
    project_dir: Path,
    *,
    asset_manifest: dict[str, Any] | None = None,
) -> TimingValidationResult:
    """Validate edit_decisions cut boundaries against measured audio.

    Args:
        edit_decisions: The edit_decisions artifact dictionary.
        project_dir: Path to the project root directory.
        asset_manifest: Optional asset_manifest dictionary. If None, tries reading
                        from project_dir/artifacts/asset_manifest.json.

    Returns:
        TimingValidationResult with validity, errors, warnings, and info.
    """
    errors: list[str] = []
    warnings: list[str] = []
    info: list[str] = []

    cuts = edit_decisions.get("cuts", [])
    if not cuts:
        info.append("No cuts defined in edit_decisions (overlays-only or bespoke layout).")
        return TimingValidationResult(valid=True, info=info)

    # Load asset manifest if not provided
    if asset_manifest is None:
        manifest_path = project_dir / "artifacts" / "asset_manifest.json"
        if manifest_path.is_file():
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    asset_manifest = json.load(f)
            except Exception as e:
                warnings.append(f"Failed to read asset_manifest.json: {e}")
        else:
            warnings.append(
                "asset_manifest.json does not exist yet at edit gate; skipping audio duration comparison."
            )
            return TimingValidationResult(valid=True, warnings=warnings)

    if not asset_manifest:
        warnings.append("Empty asset manifest; cannot verify measured audio durations.")
        return TimingValidationResult(valid=True, warnings=warnings)

    assets = asset_manifest.get("assets", [])
    narration_assets = [
        a for a in assets
        if a.get("type") == "narration" and a.get("scene_id") != "all" and "probe" not in str(a.get("id", ""))
    ]

    # Check if narration assets carry duration_seconds
    assets_with_duration = [a for a in narration_assets if a.get("duration_seconds") is not None]
    if not assets_with_duration:
        warnings.append("No per-scene narration assets with duration_seconds found in asset_manifest.")
        return TimingValidationResult(valid=True, warnings=warnings)

    # 1. Primary Check: Per-cut boundaries vs measured audio durations
    # Handle two common timeline paradigms:
    # (a) Sequential contiguous cuts (e.g. cut[0].in=0, cut[1].in=cut[0].out)
    # (b) Inter-scene paused cuts (e.g. cut[i].in >= cut[i-1].out + pause_duration)
    # Both require: cut_duration >= audio_duration (within tolerance) or cut_boundaries matching audio segments.

    num_cuts = len(cuts)
    num_narr = len(assets_with_duration)

    info.append(f"Evaluating {num_cuts} cut(s) against {num_narr} measured narration asset(s).")

    # If 1:1 mapping between cuts and narration assets
    if num_cuts == num_narr:
        for idx, (cut, narr) in enumerate(zip(cuts, assets_with_duration), start=1):
            cut_id = cut.get("id", f"cut-{idx}")
            in_s = float(cut.get("in_seconds", 0.0))
            out_s = float(cut.get("out_seconds", 0.0))
            cut_dur = out_s - in_s
            measured_dur = float(narr["duration_seconds"])

            is_last_cut = (idx == num_cuts)
            diff = cut_dur - measured_dur

            # For intermediate cuts, cut_duration should match measured duration closely
            # (allowing small rounding tolerance). For the last cut, visual tail padding (e.g. 0.44s)
            # is common and allowed up to FULL_AUDIO_TOLERANCE_SECONDS.
            max_allowed_surplus = FULL_AUDIO_TOLERANCE_SECONDS if is_last_cut else CUT_BOUNDARY_TOLERANCE_SECONDS

            # Error if cut is shorter than measured audio by more than tolerance
            if diff < -CUT_BOUNDARY_TOLERANCE_SECONDS:
                errors.append(
                    f"Scene {idx} ({cut_id}): cut duration ({cut_dur:.3f}s) is shorter than "
                    f"measured audio ({measured_dur:.3f}s) by {-diff:.3f}s "
                    f"(source of truth: manifest asset {narr.get('id')}). Visual will cut off narration."
                )
            # Error if cut is longer than measured audio by more than allowed surplus
            elif diff > max_allowed_surplus:
                errors.append(
                    f"Scene {idx} ({cut_id}): cut duration ({cut_dur:.3f}s) exceeds "
                    f"measured audio ({measured_dur:.3f}s) by {diff:.3f}s "
                    f"(source of truth: manifest asset {narr.get('id')}, tolerance ±{max_allowed_surplus:.2f}s). "
                    f"Unsynchronized planned duration detected."
                )
    else:
        # Decision: warning-only fallback.
        # Real artifacts (e.g. projects/gh6-20261007, btc-tradingagents-20261008) use cuts[].id like
        # 'cut-s01' while edit_decisions cuts schema has no standard scene_id property. Without a stable
        # explicit scene_id contract across cuts, grouping cuts per scene risks false-positive boundary errors.
        # Emitting an explicit warning ensures count mismatch cannot pass silently while preserving full-audio check.
        warnings.append(
            f"Cut count ({num_cuts}) does not match narration asset count ({num_narr}). "
            f"Source of truth: asset_manifest.json. "
            f"Per-cut boundary check was SKIPPED for this reason; "
            f"only the full-audio total check applies."
        )

    # 2. Cumulative boundary and Narration Full WAV consistency check
    full_wav_path = project_dir / "assets" / "audio" / "narration_full.wav"
    if full_wav_path.is_file():
        actual_full_dur = probe_audio_duration(full_wav_path)
        if actual_full_dur is not None:
            total_edit_dur = float(cuts[-1].get("out_seconds", 0.0))
            full_diff = total_edit_dur - actual_full_dur
            info.append(f"narration_full.wav duration: {actual_full_dur:.3f}s, edit total: {total_edit_dur:.3f}s")
            if full_diff < -CUT_BOUNDARY_TOLERANCE_SECONDS:
                errors.append(
                    f"Total edit duration ({total_edit_dur:.3f}s) is shorter than "
                    f"actual full audio ({actual_full_dur:.3f}s) by {-full_diff:.3f}s "
                    f"(source of truth: ffprobe/wave probe on assets/audio/narration_full.wav)."
                )
            elif full_diff > FULL_AUDIO_TOLERANCE_SECONDS:
                errors.append(
                    f"Total edit duration ({total_edit_dur:.3f}s) exceeds "
                    f"actual full audio ({actual_full_dur:.3f}s) by {full_diff:.3f}s "
                    f"(source of truth: ffprobe/wave probe on assets/audio/narration_full.wav, "
                    f"max allowed tail padding {FULL_AUDIO_TOLERANCE_SECONDS:.2f}s)."
                )

    # 3. Enhanced check: Word alignment verification (if narration_words.json exists)
    word_alignment = _load_word_alignment(project_dir)
    if word_alignment is not None:
        info.append("Word-alignment artifact detected (narration_words.json); running enhanced speech-lock check.")
        for idx, cut in enumerate(cuts, start=1):
            cut_id = cut.get("id", f"cut-{idx}")
            in_s = float(cut.get("in_seconds", 0.0))
            first_word_s = _get_first_word_start(word_alignment, idx, cut.get("id"))
            if first_word_s is not None:
                # The cut in_seconds should be very close to (or slightly before) the first spoken word
                delta = abs(in_s - first_word_s)
                if delta > WORD_ALIGNMENT_TOLERANCE_SECONDS:
                    errors.append(
                        f"Scene {idx} ({cut_id}): cut start ({in_s:.3f}s) does not match "
                        f"first spoken word timestamp ({first_word_s:.3f}s, delta={delta:.3f}s, "
                        f"tolerance ±{WORD_ALIGNMENT_TOLERANCE_SECONDS:.2f}s). "
                        f"Source of truth: word alignment narration_words.json."
                    )
    else:
        info.append("No word-alignment artifact found; skipping enhanced word-level check (graceful no-op).")

    is_valid = len(errors) == 0
    return TimingValidationResult(
        valid=is_valid,
        errors=errors,
        warnings=warnings,
        info=info,
    )
