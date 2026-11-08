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
    if runs:
        return _section_id_token(runs[-1])
    if cut_id:
        return cut_id.lower(), 0
    return None


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

    # Prefix-only variants (e.g. intro vs intro_title) share identity even
    # when IDs omit numeric suffixes; ambiguity must not silently prove silence.
    cut_prefix = re.sub(r"\d+$", "", str(cut_tok[0])).lower()
    if cut_tok[1] == 0 and cut_prefix:
        prefix_matches = [(k, v) for k, v in keyed
                         if re.sub(r"\d+$", "", str(k)).lower().startswith(cut_prefix)]
        if len(prefix_matches) > 1:
            return None, "ambiguous"
        if len(prefix_matches) == 1:
            return prefix_matches[0][1], "matched"

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
    cut_tok = _cut_id_token(cut.get("scene_id") or cut.get("id"))
    if cut_tok is None:
        return None, "unmapped"
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


def _attributed_words_for_cut(
    word_data: dict[str, Any] | list[dict[str, Any]],
    shape: str,
    cut: dict[str, Any],
    idx: int,
) -> tuple[list[dict[str, Any]], str]:
    """Resolve a cut's attributed word group using the primary token resolver."""
    if shape == "flat-list":
        cut_token = _cut_id_token(cut.get("scene_id") or cut.get("id"))
        keyed: dict[str, list[dict[str, Any]]] = {}
        for word in word_data:
            if not isinstance(word, dict):
                continue
            key = str(word.get("scene_id") or word.get("script_section_id") or "")
            if key:
                keyed.setdefault(key, []).append(word)
        match, status = _resolve_token_match(cut_token, [(key, words) for key, words in keyed.items()])
        if status == "unmapped":
            # Recognized artifact with zero words can prove silence only when it
            # contains scene attribution; empty/unattributed lists cannot.
            if not keyed:
                return [], "unmapped"
            return [], "matched"
        return (match if status == "matched" and isinstance(match, list) else []), status
    if shape == "section-dict":
        cut_tok = _cut_id_token(cut.get("scene_id") or cut.get("id"))
        if cut_tok is None:
            return [], "unmapped"
        entries = [(key, value) for key, value in word_data.items() if isinstance(value, dict)]
        matched, status = _resolve_token_match(cut_tok, entries)
        if status == "unmapped":
            if not entries:
                return [], "unmapped"
            return [], "matched"
        if status != "matched" or not isinstance(matched, dict):
            return [], status
        words = matched.get("words", [])
        if not isinstance(words, list):
            return [], "unmapped"
        return [word for word in words if isinstance(word, dict)], "matched"
    # Unsupported payload cannot establish a scene-level silence claim.
    return [], "unmapped"

def _word_starts(words: list[dict[str, Any]]) -> list[float]:
    starts: list[float] = []
    for word in words:
        value = word.get("global_start", word.get("clip_start", word.get("local_start", word.get("start"))))
        if value is not None:
            starts.append(float(value))
    return starts

def _match_flat_words(
    word_data: list[dict[str, Any]], cut: dict[str, Any], idx: int,
) -> tuple[float | None, str]:
    """Map one cut to its first spoken word in the flat-list shape.

    Returns (global_start_or_None, status): ('matched' | 'unmapped' | 'ambiguous').
    Groups flat words by scene identity (scene_id / script_section_id) first,
    so multiple words per scene do not trigger false ambiguity.
    """
    cut_tok = _cut_id_token(cut.get("scene_id") or cut.get("id"))
    if cut_tok is None:
        return None, "unmapped"
    grouped: dict[str, list[dict[str, Any]]] = {}
    for w in word_data:
        key = str(w.get("scene_id") or w.get("script_section_id") or "")
        if key:
            grouped.setdefault(key, []).append(w)

    keyed = [(k, words) for k, words in grouped.items()]
    matched_words, status = _resolve_token_match(cut_tok, keyed)
    if status != "matched" or not isinstance(matched_words, list) or not matched_words:
        return None, status
    first = matched_words[0]
    start = first.get("global_start", first.get("clip_start", first.get("start")))
    return (float(start) if start is not None else None), "matched"


def _match_asset_for_cut(
    cut: dict[str, Any],
    assets: list[dict[str, Any]],
    idx: int,
    mode: str = "legacy",
) -> tuple[dict[str, Any] | None, str]:
    """Match a cut to its narration asset by scene token, with fallback to positional."""
    cut_key = str(cut.get("scene_id") or cut.get("id") or "")
    cut_tok = _cut_id_token(cut_key) or _cut_id_token(cut.get("source"))
    if cut_tok is None and mode == "strict":
        return None, f"tokenless scene {cut_key or f'scene-{idx}'}"
    if cut_tok is not None:
        keyed = [
            (str(a.get("scene_id") or a.get("id") or Path(str(a.get("path", ""))).stem), a)
            for a in assets
        ]
        match, status = _resolve_token_match(cut_tok, keyed)
        if status == "matched" and isinstance(match, dict):
            return match, "matched"
        if mode == "strict":
            scene_id = str(cut.get("scene_id") or cut.get("id") or f"scene-{idx}")
            return None, f"unmatched scene {scene_id!r}: {status}"
    if 1 <= idx <= len(assets):
        return assets[idx - 1], "positional"
    return None, "unmapped"




def validate_edit_timing_against_audio(
    edit_decisions: dict[str, Any],
    project_dir: Path,
    *,
    asset_manifest: dict[str, Any] | None = None,
    mode: str = "legacy",
) -> TimingValidationResult:
    """Validate edit_decisions cut boundaries against measured audio.

    Args:
        edit_decisions: The edit_decisions artifact dictionary.
        project_dir: Path to the project root directory.
        asset_manifest: Optional asset_manifest dictionary. If None, tries reading
                        from project_dir/artifacts/asset_manifest.json.
        mode: "legacy" (lenient, warnings) or "strict" (hard errors on missing audio/contract).

    Returns:
        TimingValidationResult with validity, errors, warnings, and info.
    """
    errors: list[str] = []
    warnings: list[str] = []
    info: list[str] = []

    cuts = edit_decisions.get("cuts", [])
    if not cuts:
        bespoke = edit_decisions.get("bespoke", {})
        bespoke_scenes = bespoke.get("scenes", [])
        if not bespoke_scenes:
            if mode == "strict":
                errors.append("No cuts or bespoke scenes defined in edit_decisions — no scene timeline contract.")
                return TimingValidationResult(valid=False, errors=errors)
            info.append("No cuts defined in edit_decisions (overlays-only or bespoke layout).")
            return TimingValidationResult(valid=True, info=info)

        # Adapt bespoke scenes into cuts timeline for actual validation
        adapted_cuts: list[dict[str, Any]] = []
        curr_time = 0.0
        for i, bs in enumerate(bespoke_scenes):
            if isinstance(bs, dict):
                sid = str(bs.get("scene_id") or bs.get("id") or f"scene-{i+1}")
                in_s = float(bs.get("in_seconds", curr_time))
                dur = float(bs.get("duration_seconds", bs.get("duration", 0.0)))
                out_s = float(bs.get("out_seconds", in_s + dur))
                if out_s <= in_s and mode == "strict":
                    errors.append(f"Bespoke scene {sid} has invalid timing (in={in_s}, out={out_s}).")
                adapted_cuts.append({
                    "id": sid,
                    "scene_id": sid,
                    "in_seconds": in_s,
                    "out_seconds": out_s,
                    "has_narration": bs.get("has_narration", True),
                })
                curr_time = max(curr_time, out_s)
            elif isinstance(bs, str):
                adapted_cuts.append({"id": bs, "scene_id": bs, "has_narration": True})
            else:
                if mode == "strict":
                    errors.append(f"Bespoke scene item {i} is invalid type: {type(bs)}")

        if not adapted_cuts and mode == "strict":
            errors.append("Bespoke scenes list contains no valid scene definitions.")
            return TimingValidationResult(valid=False, errors=errors)
        cuts = adapted_cuts


    narrated_cuts = [
        c for c in cuts
        if c.get("has_narration", True) is not False and c.get("type") != "no_narration"
    ]
    if not narrated_cuts:
        # Strict no-narration scenes must still have trusted scene-level silence proof.
        word_alignment = _load_word_alignment(project_dir)
        if mode == "strict":
            if word_alignment is None:
                return TimingValidationResult(valid=False, errors=["Strict no-narration validation requires narration_words.json."])
            shape = _classify_word_shape(word_alignment)
            if shape not in {"flat-list", "section-dict"}:
                return TimingValidationResult(valid=False, errors=[f"Strict no-narration validation requires recognized, scene-attributed alignment (shape={shape})."])
            for idx, cut in enumerate(cuts, start=1):
                words, status = _attributed_words_for_cut(word_alignment, shape, cut, idx)
                if status == "ambiguous":
                    errors.append(f"Cut {cut.get('id', idx)!r}: ambiguous word attribution in strict no-narration validation.")
                elif status != "matched":
                    errors.append(f"Cut {cut.get('id', idx)!r}: no attributable scene alignment in strict no-narration validation (status={status}).")
                elif words:
                    errors.append(f"Cut {cut.get('id', idx)!r} is declared no-narration but has attributable words.")
            if errors:
                return TimingValidationResult(valid=False, errors=errors, info=info)
        elif word_alignment is not None:
            shape = _classify_word_shape(word_alignment)
            for idx, cut in enumerate(cuts, start=1):
                words, status = _attributed_words_for_cut(word_alignment, shape, cut, idx)
                if status == "matched" and words:
                    in_s, out_s = float(cut.get("in_seconds", 0.0)), float(cut.get("out_seconds", 0.0))
                    if any(in_s <= t <= out_s for t in _word_starts(words)):
                        errors.append(f"Cut {cut.get('id', idx)!r} is declared no-narration but has attributable words inside its timeline.")
            if errors:
                return TimingValidationResult(valid=False, errors=errors, info=info)
        info.append("All cuts declared no-narration — skipping audio timing checks.")
        return TimingValidationResult(valid=True, info=info)

    # Load asset manifest if not provided
    if asset_manifest is None:
        manifest_path = project_dir / "artifacts" / "asset_manifest.json"
        if manifest_path.is_file():
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    asset_manifest = json.load(f)
            except Exception as e:
                if mode == "strict":
                    errors.append(f"Failed to read asset_manifest.json: {e}")
                    return TimingValidationResult(valid=False, errors=errors)
                warnings.append(f"Failed to read asset_manifest.json: {e}")
        else:
            if mode == "strict":
                errors.append("asset_manifest.json does not exist at edit gate (strict mode requires manifest).")
                return TimingValidationResult(valid=False, errors=errors)
            warnings.append(
                "asset_manifest.json does not exist yet at edit gate; skipping audio duration comparison."
            )
            return TimingValidationResult(valid=True, warnings=warnings)

    if not asset_manifest:
        if mode == "strict":
            errors.append("Empty asset manifest with narrated cuts; cannot verify measured audio durations.")
            return TimingValidationResult(valid=False, errors=errors)
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
    missing_durations = [a.get("id", "<unnamed>") for a in narration_assets if a.get("duration_seconds") is None]
    if missing_durations:
        msg = f"Narration assets missing duration_seconds in manifest: {missing_durations}"
        if mode == "strict":
            errors.append(msg)
        else:
            warnings.append(msg)

    assets_with_duration = [a for a in narration_assets if a.get("duration_seconds") is not None]
    if not assets_with_duration:
        msg = "No per-scene narration assets with duration_seconds found in asset_manifest."
        if mode == "strict":
            errors.append(msg)
            return TimingValidationResult(valid=False, errors=errors)
        warnings.append(msg)
        return TimingValidationResult(valid=True, warnings=warnings)


    # 1. Primary Check: Per-cut boundaries vs measured audio durations
    # Handle two common timeline paradigms:
    # (a) Sequential contiguous cuts (e.g. cut[0].in=0, cut[1].in=cut[0].out)
    # (b) Inter-scene paused cuts (e.g. cut[i].in >= cut[i-1].out + pause_duration)
    # Both require: cut_duration >= audio_duration (within tolerance) or cut_boundaries matching audio segments.

    num_cuts = len(cuts)
    num_narr = len(assets_with_duration)

    info.append(f"Evaluating {num_cuts} cut(s) against {num_narr} measured narration asset(s).")

    if num_cuts != num_narr and mode != "strict":
        warnings.append(
            f"Cut count ({num_cuts}) does not match narration asset count ({num_narr}). "
            f"Source of truth: asset_manifest.json. "
            f"Per-cut boundary check was SKIPPED for this reason; "
            f"only the full-audio total check applies."
        )
    else:
        # Match each cut to its narration asset using stable scene ID token
        for idx, cut in enumerate(cuts, start=1):
            if cut.get("has_narration", True) is False or cut.get("type") == "no_narration":
                continue
            cut_id = cut.get("id", f"cut-{idx}")
            in_s = float(cut.get("in_seconds", 0.0))
            out_s = float(cut.get("out_seconds", 0.0))
            cut_dur = out_s - in_s

            narr, match_status = _match_asset_for_cut(cut, assets_with_duration, idx, mode=mode)
            if narr is None:
                if mode == "strict":
                    errors.append(f"Scene {idx} ({cut_id}): {match_status}; no matching narration asset found in manifest.")
                else:
                    warnings.append(f"Scene {idx} ({cut_id}): could not map to narration asset.")
                continue

            measured_dur = float(narr["duration_seconds"])
            info.append(f"Scene {idx} ({cut_id}) narration asset match status: {match_status}.")
            max_out = max((float(c.get("out_seconds", 0.0)) for c in cuts), default=0.0)
            is_last_cut = (idx == num_cuts) or (abs(out_s - max_out) < 0.05)
            diff = cut_dur - measured_dur

            max_allowed_surplus = FULL_AUDIO_TOLERANCE_SECONDS if is_last_cut else CUT_BOUNDARY_TOLERANCE_SECONDS


            if diff < -CUT_BOUNDARY_TOLERANCE_SECONDS:
                errors.append(
                    f"Scene {idx} ({cut_id}): cut duration ({cut_dur:.3f}s) is shorter than "
                    f"measured audio ({measured_dur:.3f}s) by {-diff:.3f}s "
                    f"(source of truth: manifest asset {narr.get('id')}). Visual will cut off narration."
                )
            elif diff > max_allowed_surplus:
                errors.append(
                    f"Scene {idx} ({cut_id}): cut duration ({cut_dur:.3f}s) exceeds "
                    f"measured audio ({measured_dur:.3f}s) by {diff:.3f}s "
                    f"(source of truth: manifest asset {narr.get('id')}, tolerance ±{max_allowed_surplus:.2f}s). "
                    f"Unsynchronized planned duration detected."
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
                msg = f"Manifest asset {asset_id} has no path; cannot probe file"
                if mode == "strict":
                    errors.append(f"{msg} (strict mode requires audio path).")
                else:
                    warnings.append(f"{msg} — staleness check skipped for it (source of truth: asset_manifest.json).")
                continue
            file_path = Path(raw_path)
            if not file_path.is_absolute():
                file_path = project_dir / file_path
            if not file_path.is_file():
                msg = f"Manifest asset {asset_id} path {asset.get('path')!r} does not exist on disk"
                if mode == "strict":
                    errors.append(f"{msg} (strict mode requires audio file to exist).")
                else:
                    warnings.append(f"{msg}; falling back to manifest duration for it (source of truth: asset_manifest.json).")
                continue
            probed_dur = probe_audio_duration(file_path)
            if probed_dur is None:
                msg = f"Could not probe audio file for manifest asset {asset_id} ({asset.get('path')!r})"
                if mode == "strict":
                    errors.append(f"{msg} (strict mode requires valid probeable audio).")
                else:
                    warnings.append(f"{msg}; falling back to manifest duration (source of truth: asset_manifest.json).")
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
    narrated_cuts_for_alignment = [
        c for c in cuts
        if c.get("has_narration", True) is not False and c.get("type") != "no_narration"
    ]
    if word_alignment is None:
        msg = "No word-alignment artifact found; skipping enhanced word-level check."
        if mode == "strict" and narrated_cuts_for_alignment:
            errors.append(msg + " Strict mode requires narration_words.json for narrated cuts.")
        else:
            info.append(msg + " (graceful no-op).")
    else:
        shape = _classify_word_shape(word_alignment)
        if shape == "top-level-words-dict":
            msg = "narration_words.json uses a top-level words-list shape without per-scene attribution; word-alignment check SKIPPED."
            if mode == "strict" and narrated_cuts_for_alignment:
                errors.append(msg + " Strict mode requires scene attribution.")
            else:
                warnings.append(msg + " (cannot map cuts to speech spans unambiguously). Source: narration_words.json.")
        elif shape == "unknown":
            msg = "narration_words.json shape not recognized; word-alignment check SKIPPED."
            if mode == "strict" and narrated_cuts_for_alignment:
                errors.append(msg + " Strict mode requires recognized alignment.")
            else:
                warnings.append(msg + " (fail-safe). Source: narration_words.json.")
        else:
            info.append(
                f"Word-alignment artifact detected (narration_words.json, shape={shape}); "
                f"running enhanced speech-lock check."
            )
            for idx, cut in enumerate(cuts, start=1):
                cut_id = cut.get("id", f"cut-{idx}")
                in_s = float(cut.get("in_seconds", 0.0))
                out_s = float(cut.get("out_seconds", 0.0))
                declared_no_narration = cut.get("has_narration", True) is False or cut.get("type") == "no_narration"
                if declared_no_narration:
                    # Check contradictory evidence separately; never attempt scene mapping
                    # for a declared silent cut.
                    attributed, attribution_status = _attributed_words_for_cut(word_alignment, shape, cut, idx)
                    if attribution_status == "ambiguous" and mode == "strict":
                        errors.append(f"Cut {cut_id!r}: ambiguous word attribution in strict no-narration validation.")
                    elif attribution_status == "matched":
                        has_inside_word = any(in_s <= t <= out_s for t in _word_starts(attributed))
                        if has_inside_word:
                            errors.append(f"Cut {cut_id!r} is declared no-narration but has attributable words inside its timeline.")
                    elif mode == "strict":
                        errors.append(f"Cut {cut_id!r}: no attributable scene alignment in strict no-narration validation (status={attribution_status}).")
                    continue
                first_word_s: float | None = None
                if shape == "flat-list":
                    first_word_s, status = _match_flat_words(word_alignment, cut, idx)
                else:  # section-dict
                    entry, status = _match_section_entry(word_alignment, cut, idx)
                    if status == "matched" and entry is not None:
                        first_word_s = _first_word_global_start(entry)
                if first_word_s is None:
                    if mode == "strict" and cut.get("has_narration", True) is not False and cut.get("type") != "no_narration":
                        errors.append(
                            f"Cut {cut_id!r}: word-alignment mapping failed in strict mode (shape={shape}, "
                            f"status={status}). Source: narration_words.json."
                        )
                    else:
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
    is_valid = len(errors) == 0
    return TimingValidationResult(
        valid=is_valid,
        errors=errors,
        warnings=warnings,
        info=info,
    )
