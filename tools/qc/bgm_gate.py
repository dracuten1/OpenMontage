#!/usr/bin/env python3
"""bgm_gate.py — fail-closed BGM duration gate for OpenMontage episodes.

FAIL-CLOSED rule: a BGM source shorter than the episode duration is a FAIL
unless the composition declares the `loop` prop on the <Audio> element that
references it. Short-and-not-looped BGM renders a silent tail
(20261112 defect: 27s BGM.mp3 on a ~140s composition).

Inputs mirror the existing pipeline consumers: episode duration comes from
projects/<slug>/assets/scene_timing.json (total_seconds, else
total_frames/fps — same source gen_stems.py and master_audio.sh read), and the
BGM duration is measured with ffprobe.

Kill-switch: OM_BGM_DURATION_GATE=0 disables the gate (exit 0, verdict
'disabled').

Exit codes: 0 pass/disabled, 1 fail, 2 input/gate error (fail-closed: an
unmeasurable gate is a non-zero exit, never a silent pass).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

KILL_SWITCH_ENV = "OM_BGM_DURATION_GATE"


class GateError(ValueError):
    pass


class InputError(GateError):
    pass


def probe_duration(path, ffprobe=None):
    """Duration of an audio/video file in seconds via ffprobe."""
    ffprobe = ffprobe or shutil.which("ffprobe")
    if not ffprobe:
        raise InputError("ffprobe not found; BGM duration unmeasured")
    try:
        p = subprocess.run(
            [ffprobe, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)],
            capture_output=True, text=True, timeout=60,
        )
    except subprocess.TimeoutExpired as e:
        raise InputError(f"ffprobe timed out for {path}") from e
    out = (p.stdout or "").strip()
    try:
        return float(out.splitlines()[-1])
    except (IndexError, ValueError):
        raise InputError(f"ffprobe duration unavailable for {path}: {p.stderr[-300:]}")


def episode_duration(timing):
    """Episode duration in seconds from parsed scene_timing.json."""
    if not isinstance(timing, dict):
        raise InputError("invalid scene_timing.json: expected JSON object")
    total = timing.get("total_seconds")
    if total is not None:
        try:
            return float(total)
        except (TypeError, ValueError) as e:
            raise InputError(f"invalid total_seconds: {e}") from e
    frames = timing.get("total_frames", timing.get("video_total_frames"))
    fps = timing.get("fps", 30)
    try:
        frames, fps = float(frames), float(fps)
    except (TypeError, ValueError) as e:
        raise InputError("scene_timing.json has neither usable total_seconds "
                         f"nor total_frames/fps: {e}") from e
    if fps <= 0:
        raise InputError(f"invalid fps: {fps}")
    return round(frames / fps, 3)


_AUDIO_RE = re.compile(r"<Audio\b(.*?)/>", re.DOTALL)


_LOOP_FALSE_RE = re.compile(r"loop\s*=\s*\{\s*false\s*\}", re.IGNORECASE)


def loop_declared(comp_text, bgm_hint):
    """True if any <Audio .../> element referencing bgm_hint carries the `loop` prop.

    Explicit `loop={false}` counts as NOT looped (fail-closed direction).
    """
    for m in _AUDIO_RE.finditer(comp_text):
        block = m.group(1)
        if bgm_hint not in block:
            continue
        if _LOOP_FALSE_RE.search(block):
            continue
        if re.search(r"\bloop\b", block):
            return True
    return False


def gate(timing_path, bgm_path, comp_path, *, probe=None):
    """Run the gate. Returns a verdict dict; raises InputError on unusable inputs."""
    if str(os.environ.get(KILL_SWITCH_ENV, "1")).strip() == "0":
        return {
            "gate": "bgm-duration", "verdict": "disabled", "valid": True,
            "reason": f"{KILL_SWITCH_ENV}=0 disables the gate",
        }
    try:
        timing = json.loads(Path(timing_path).read_text(encoding="utf-8"),
                            parse_constant=lambda x: float(x))
    except (OSError, json.JSONDecodeError) as e:
        raise InputError(f"unreadable scene_timing.json: {e}") from e
    duration = episode_duration(timing)
    bgm_seconds = (probe or probe_duration)(bgm_path)
    try:
        comp_text = Path(comp_path).read_text(encoding="utf-8")
    except OSError as e:
        raise InputError(f"unreadable composition: {e}") from e
    hint = Path(bgm_path).name
    looped = loop_declared(comp_text, hint)
    errors = []
    if bgm_seconds < duration and not looped:
        errors.append(
            f"BGM {bgm_seconds:.3f}s is shorter than episode {duration:.3f}s "
            f"and no loop prop is declared on the <Audio> element referencing "
            f"{hint} — silent tail of {duration - bgm_seconds:.3f}s"
        )
    return {
        "gate": "bgm-duration",
        "verdict": "pass" if not errors else "fail",
        "valid": not errors,
        "errors": errors,
        "episode_seconds": duration,
        "bgm_seconds": bgm_seconds,
        "loop_declared": looped,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description="Fail-closed BGM duration gate.")
    ap.add_argument("--timing", required=True, help="assets/scene_timing.json")
    ap.add_argument("--bgm", required=True, help="BGM source file (mp3/wav)")
    ap.add_argument("--composition", required=True, help="Episode composition .tsx")
    args = ap.parse_args(argv)
    try:
        verdict = gate(args.timing, args.bgm, args.composition)
    except GateError as e:
        print(json.dumps({"gate": "bgm-duration", "verdict": "error",
                          "valid": False, "errors": [str(e)]}, indent=1))
        return 2
    print(json.dumps(verdict, indent=1))
    return 0 if verdict["valid"] else 1


if __name__ == "__main__":
    sys.exit(main())
