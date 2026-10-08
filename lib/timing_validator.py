"""Timing re-lock validator for edit decisions against measured audio and word alignments.

Enforces that edit stage cut boundaries match measured audio durations from
asset_manifest.json (and narration_full.wav if present) before allowing the pipeline
to advance from edit to compose stage.

Degradation model (documented for stage gates):
- If asset_manifest does not exist or has no narration assets with durations,
  the validator degrades to a clear WARNING (allowing earlier pipeline scaffolding/testing).
- If a narration asset's audio file is missing or unprobeable, the staleness check
  degrades to a WARNING and falls back to the manifest duration.
- If word alignment (narration_words.json) is missing, the word-level check is gracefully
  skipped (no-op), and only the primary manifest-based check runs.
- The word-alignment check is an ENHANCEMENT and is fail-safe by design: a shape it
  cannot unambiguously interpret, or a cut it cannot map to a speech span, degrades
  to a skip-with-WARNING — never a hard error. Only the primary manifest + ffprobe
  checks carry enforcement load.
- If edit_decisions cut boundaries mismatch measured audio beyond tolerance, a manifest
  duration disagrees with the file it names, or a word start mismatches beyond tolerance,
  it raises a HARD CheckpointValidationError at the gate.

Supported narration_words.json shapes (fail-safe word-alignment enhancement):
1. Flat list of word dicts (aivn style): each carries scene_id and/or
   script_section_id plus global_start/clip_start timestamps.
2. Section-keyed dict (bach-viet-bien-mat / co-loa-no-than / vua-hung-trong-dong /
   con-rong-chau-tien / nguon-goc-dan-toc-v2 series): {"s01": {"global_start": X,
   "words": [...]}}. Per the producer convention (projects/*/scripts/build_transcripts.py),
   each word's "start"/"end" fields are ALREADY global-timeline seconds and
   "local_start"/"local_end" are section-local; entry "global_start" is the section
   offset. Global resolution order: word.global_start, else entry.global_start +
   word.local_start, else word.start used as-is (NEVER re-added to the section offset).
3. Dict with a single top-level "words" list and no per-word scene attribution
   (gh6-20261007 / btc-tradingagents-20261008 style): cuts cannot be mapped to
   speech spans unambiguously → whole check SKIPPED with an explicit warning.

Cut→speech-span mapping rule (stable, documented, two-tier): the last alphanumeric
token of the cut id (e.g. "cut-s01" → ("s", 1), "cut_02" → ("", 2)) is resolved
against section keys / scene ids — tier 1: identical prefix AND number; tier 2:
unique number-only match (covers the real cross-convention pair cut 'cut-s01' ↔
word record 'scene_01'). Zero matches → unmapped; more than one number-match →
ambiguous. Both are mapping failures → skip-with-WARNING (never an error).
"""

from __future__ import annotations

import json
import logging
import re
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

# Manifest-vs-file staleness tolerance: ±0.30s, anchored on CUT_BOUNDARY_TOLERANCE_SECONDS.
# The manifest duration is written from the same probe at asset-generation time, so honest
# disagreement is bounded by codec/container round-trip (≪50ms for WAV header math; ~1-2
# frames for MP3 estimates). A disagreement beyond ±0.30s cannot be rounding — it means the
# audio file was re-synthesized after the manifest was written (the aivn d-011 failure
# mode: re-TTS then forget the manifest). This is the check that closes the per-scene
# re-TTS evasion hole: cuts, manifest, and a stale narration_full.wav can agree with each
# other and all be wrong; the files themselves are ground truth.
MANIFEST_STALENESS_TOLERANCE_SECONDS = 0.30


@dataclass
class TimingValidationResult:
    valid: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    info: list[str] = field(default_factory=list)


def _load_word_alignment(project_dir: Path) -> dict[str, Any] | list[dict[str, Any]] | None:
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


# ---------------------------------------------------------------------------
# Word-alignment shape handling (fail-safe enhancement — never hard-fails).
# See the module docstring for the supported shapes and the cut→span mapping rule.
# ---------------------------------------------------------------------------

def _classify_word_shape(word_data: Any) -> str:
    """Classify a narration_words.json payload into a supported shape name."""
    if isinstance(word_data, list):
        return "flat-list"
    if isinstance(word_data, dict):
        if "words" in word_data and isinstance(word_data["words"], list):
            return "top-level-words-dict"
        if any(isinstance(v, dict) for v in word_data.values()):
            return "section-dict"
    return "unknown"


def _section_id_token(section_id: str) -> tuple[str, int] | None:
    """Split a section id into (alphabetic prefix, numeric value), e.g. 's01' -> ('s', 1)."""
    m = re.fullmatch(r"\s*([A-Za-z]*)[-_ ]?0*(\d+)\s*", str(section_id))
    if not m:
        return None
    return (m.group(1).lower(), int(m.group(2)))


def _cut_id_token(cut_id: Any) -> tuple[str, int] | None:
    """Extract the section token from a cut id: last alphanumeric run's (prefix, number).

    'cut-s01' -> ('s', 1); 'cut_02' -> ('', 2); 'cut-sc01' -> ('sc', 1).
    """
    if not isinstance(cut_id, str):
        return None
    runs = re.findall(r"[A-Za-z]*\d+", cut_id)
    if not runs:
        return None
    return _section_id_token(runs[-1])


def _resolve_token_match(
    cut_tok: tuple[str, int] | None,
    keyed: list[tuple[str, Any]],
) -> tuple[Any | None, str]:
    """Two-tier token resolution over (key, payload) candidates.

    Tier 1: identical prefix AND number ('cut-s01' vs key 's01').
    Tier 2: unique number-only match — covers the real cross-convention pairs
    ('cut-s01' vs 'scene_01' / '1'), because producer conventions disagree on the
    alphabetic prefix while the number is the identity.
    Exactly one tier-1 match wins immediately; otherwise a unique tier-2 match wins;
    multiple tier-2 matches are AMBIGUOUS (fail-safe: caller skips with a warning).

    Returns (payload_or_None, 'matched' | 'ambiguous' | 'unmapped').
    """
    if cut_tok is None:
        return None, "unmapped"

    def _tok(key: str) -> tuple[str, int] | None:
        return _section_id_token(key)

    if cut_tok[0]:
        tier1 = [(k, v) for k, v in keyed
                 if (t := _tok(k)) is not None and t[0] == cut_tok[0] and t[1] == cut_tok[1]]
        if len(tier1) == 1:
            return tier1[0][1], "matched"
    tier2 = [(k, v) for k, v in keyed if (t := _tok(k)) is not None and t[1] == cut_tok[1]]
    if len(tier2) == 1:
        return tier2[0][1], "matched"
    if len(tier2) > 1:
        return None, "ambiguous"
    return None, "unmapped"


def _first_word_global_start(entry: dict[str, Any]) -> float | None:
    """Resolve the first word's GLOBAL start from one section entry, per the producer
    convention documented in the module docstring. Word 'start' values in the
    section-dict shape are already global-timeline seconds — they are NEVER re-added
    to the section offset (that double-count is a proven bogus-hard-fail source)."""
    words = entry.get("words", [])
    if not words or not isinstance(words[0], dict):
        return None
    w0 = words[0]
    # 1) Explicit per-word global timestamp (producer convention).
    if w0.get("global_start") is not None:
        return float(w0["global_start"])
    # 2) Local word timestamp + the section's global offset.
    if w0.get("local_start") is not None and entry.get("global_start") is not None:
        return float(entry["global_start"]) + float(w0["local_start"])
    # 3) Plain 'start' — treated AS GLOBAL per the build_transcripts.py series
    #    convention. Deliberately NOT offset by entry.global_start.
    if w0.get("start") is not None:
        return float(w0["start"])
    return None


def _match_section_entry(
    word_data: dict[str, Any], cut: dict[str, Any], idx: int,
) -> tuple[dict[str, Any] | None, str]:
    """Map one cut to its section entry in the section-dict shape.

    Returns (entry, status): ('matched' | 'unmapped' | 'ambiguous').
    """
    cut_tok = _cut_id_token(cut.get("id"))
    if cut_tok is not None:
        entries = [(k, v) for k, v in word_data.items() if isinstance(v, dict)]
        # A cut id that CARRIES a token but matches nothing is unmapped — do NOT
        # silently fall back to position (that would guess across a real mismatch).
        return _resolve_token_match(cut_tok, entries)

    # Token-less cut ids (e.g. 'cut-hook'): positional mapping only when unambiguous —
    # exactly one section sits at position idx in document order. Otherwise: failure.
    entries = [(k, v) for k, v in word_data.items() if isinstance(v, dict)]
    if 1 <= idx <= len(entries):
        return entries[idx - 1][1], "matched"
    return None, "unmapped"


def _match_flat_words(
    word_data: list[dict[str, Any]], cut: dict[str, Any], idx: int,
) -> tuple[float | None, str]:
    """Map one cut to its first spoken word in the flat-list shape.

    Returns (global_start_or_None, status): ('matched' | 'unmapped' | 'ambiguous').
    Word records are keyed by their scene_id / script_section_id and resolved with the
    same two-tier token rule (real aivn pair: cut 'cut-s01' ↔ words 'scene_01').
    """
    cut_tok = _cut_id_token(cut.get("id"))
    if cut_tok is None:
        return None, "unmapped"
    keyed = [
        (str(w.get("scene_id") or w.get("script_section_id") or ""), w)
        for w in word_data
    ]
    first, status = _resolve_token_match(cut_tok, keyed)
    if status != "matched" or not isinstance(first, dict):
        return None, status
    start = first.get("global_start", first.get("clip_start"))
    return (float(start) if start is not None else None), "matched"


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
    # scene_id "all" is the full-program concat (narration_full), not a per-scene
    # segment; ids containing "probe" are sample/probe clips (e.g. news-20261006
    # probe_sXX.wav) that no cut maps to. Both must stay out of the per-cut check.
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

    # 2. Manifest-vs-file staleness check (Fix A — closes the per-scene re-TTS evasion
    # hole): probe each narration asset's actual audio file and compare against the
    # manifest's duration_seconds. Cuts, manifest, and a stale narration_full.wav can
    # agree with each other and all be stale; the files are ground truth.
    if asset_manifest is not None:
        for asset in assets_with_duration:
            asset_id = asset.get("id", "<unnamed>")
            manifest_dur = float(asset["duration_seconds"])
            raw_path = asset.get("path", "")
            if not raw_path:
                warnings.append(
                    f"Manifest asset {asset_id} has no path; cannot probe file — "
                    f"staleness check skipped for it (source of truth: asset_manifest.json)."
                )
                continue
            file_path = Path(raw_path)
            if not file_path.is_absolute():
                file_path = project_dir / file_path
            if not file_path.is_file():
                warnings.append(
                    f"Manifest asset {asset_id} path {asset.get('path')!r} does not exist on "
                    f"disk; falling back to manifest duration for it "
                    f"(source of truth: asset_manifest.json)."
                )
                continue
            probed_dur = probe_audio_duration(file_path)
            if probed_dur is None:
                warnings.append(
                    f"Could not probe audio file for manifest asset {asset_id} "
                    f"({asset.get('path')!r}); falling back to manifest duration "
                    f"(source of truth: asset_manifest.json)."
                )
                continue
            staleness = probed_dur - manifest_dur
            if abs(staleness) > MANIFEST_STALENESS_TOLERANCE_SECONDS:
                errors.append(
                    f"Manifest asset {asset_id}: manifest duration says {manifest_dur:.3f}s, "
                    f"file probes {probed_dur:.3f}s (delta {staleness:+.3f}s, tolerance "
                    f"±{MANIFEST_STALENESS_TOLERANCE_SECONDS:.2f}s) — manifest is stale; "
                    f"run 'python tools/audio/refresh_manifest.py <manifest>' and re-lock cuts "
                    f"(source of truth: ffprobe/wave probe on {asset.get('path')})."
                )

    # 3. Cumulative boundary and Narration Full WAV consistency check
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

    # 4. Enhanced check: Word alignment verification (if narration_words.json exists).
    # This is an ENHANCEMENT and is FAIL-SAFE: shape ambiguity or cut→span mapping
    # failure degrades to skip-with-WARNING, never a hard error. Enforcement load is
    # carried by checks 1-3 (manifest per-cut, file-probe staleness, full-wav total).
    word_alignment = _load_word_alignment(project_dir)
    if word_alignment is not None:
        shape = _classify_word_shape(word_alignment)
        if shape == "top-level-words-dict":
            # gh6/btc08 style: one global word list, no per-word scene attribution —
            # cuts cannot be mapped to speech spans unambiguously. Skip, don't guess.
            warnings.append(
                "narration_words.json uses a top-level words-list shape without per-scene "
                "attribution; word-alignment check SKIPPED (cannot map cuts to speech spans "
                "unambiguously). Source: narration_words.json."
            )
        elif shape == "unknown":
            warnings.append(
                "narration_words.json shape not recognized; word-alignment check SKIPPED "
                "(fail-safe). Source: narration_words.json."
            )
        else:
            info.append(
                f"Word-alignment artifact detected (narration_words.json, shape={shape}); "
                f"running enhanced speech-lock check."
            )
            for idx, cut in enumerate(cuts, start=1):
                cut_id = cut.get("id", f"cut-{idx}")
                in_s = float(cut.get("in_seconds", 0.0))
                first_word_s: float | None = None
                if shape == "flat-list":
                    first_word_s, status = _match_flat_words(word_alignment, cut, idx)
                else:  # section-dict
                    entry, status = _match_section_entry(word_alignment, cut, idx)
                    if status == "matched" and entry is not None:
                        first_word_s = _first_word_global_start(entry)
                if first_word_s is None:
                    # Mapping failure / no usable timestamp → skip this cut with a
                    # warning. NEVER a bogus hard fail on a shape we don't understand.
                    warnings.append(
                        f"Cut {cut_id!r}: word-alignment mapping failed (shape={shape}, "
                        f"status={status}); enhanced speech-lock check SKIPPED for it. "
                        f"Source: narration_words.json."
                    )
                    continue
                # The cut in_seconds should be very close to (or slightly before) the
                # first spoken word of its span.
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
