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
import math
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
        seconds = float(out.splitlines()[-1])
    except (IndexError, ValueError):
        raise InputError(f"ffprobe duration unavailable for {path}: {p.stderr[-300:]}")
    # Mirror of the timing-side CRITICAL: nan/inf defeat every comparison
    # (bgm_seconds < duration is False for nan) and 0/negative BGM would
    # silently PASS — fail-closed instead.
    if not math.isfinite(seconds) or seconds <= 0:
        raise InputError(f"ffprobe duration non-finite or non-positive for "
                         f"{path}: {seconds}")
    return seconds


def episode_duration(timing):
    """Episode duration in seconds from parsed scene_timing.json."""
    if not isinstance(timing, dict):
        raise InputError("invalid scene_timing.json: expected JSON object")

    def _checked(value, label):
        # Fail-closed: JSON NaN/Infinity parse through parse_constant into
        # float('nan')/inf, and NaN defeats every comparison (nan <= 0 is
        # False), which would silently PASS the gate. Reject explicitly.
        try:
            f = float(value)
        except (TypeError, ValueError) as e:
            raise InputError(f"invalid {label}: {e}") from e
        if not math.isfinite(f):
            raise InputError(f"invalid {label}: non-finite value {value!r}")
        return f

    total = timing.get("total_seconds")
    if total is not None:
        duration = _checked(total, "total_seconds")
        if duration <= 0:
            raise InputError(
                f"invalid total_seconds: must be positive, got {duration}")
        return duration
    frames = _checked(timing.get("total_frames",
                                 timing.get("video_total_frames")),
                      "total_frames")
    fps = _checked(timing.get("fps", 30), "fps")
    if fps <= 0:
        raise InputError(f"invalid fps: {fps}")
    duration = round(frames / fps, 3)
    if not math.isfinite(duration) or duration <= 0:
        raise InputError(f"invalid episode duration: frames={frames} fps={fps}")
    return duration


_AUDIO_RE = re.compile(r"<Audio\b(.*?)/>", re.DOTALL)


# Truthy-loop falsy forms: explicit loop={false} / loop={0} / null / undefined
# is a fail-closed NOT-looped, never a false PASS (F4 + review major #2).
_LOOP_FALSE_RE = re.compile(
    r"loop\s*=\s*\{\s*(?:false|0|null|undefined)\s*\}", re.IGNORECASE)


_SRC_ATTR_RE = re.compile(r"(?<![\w.$-])src\s*=\s*")

# Standalone `loop` token only: no path segments (…/loop/…), no stems
# (theme-loop.mp3), no `data-loop-*` / `loopCount` identifiers.
_LOOP_PROP_RE = re.compile(r"(?<![\w.$-])loop(?![\w.$-])")

_QUOTED_RE = re.compile(r"\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'")

# JSX comments ({/* ... */}) are not props: a `{/* loop */}` comment must
# never flip loop_declared to True. Stripped in _split_src before the prop
# scan (DOTALL so multi-line comments go too).
_JSX_COMMENT_RE = re.compile(r"\{/\*.*?\*/\}", re.DOTALL)


def _split_src(block):
    """Split an <Audio> block into (props_text, src_text), removing the src
    attribute value from props_text.

    The JSX `loop` prop must never be scanned for inside src content —
    src={staticFile(`${BASE}/loop/bgm.mp3`)} or src="theme-loop.mp3" flipped
    loop_declared to True without any loop prop (review major #2). `{...}`
    values are consumed with brace counting so nested `${BASE}` template
    braces don't cut the value short. JSX comments (`{/* loop */}`) are
    stripped first: they are commentary, not props, and their text must not
    leak into the loop scan.
    """
    block = _JSX_COMMENT_RE.sub(" ", block)
    m = _SRC_ATTR_RE.search(block)
    if not m:
        return block, ""
    i = m.end()
    opener = block[i] if i < len(block) else ""
    if opener in "\"'":
        end = block.find(opener, i + 1)
        end = len(block) if end == -1 else end + 1
        return block[:m.start()] + " " + block[end:], block[i:end]
    if opener == "{":
        depth = 0
        for j in range(i, len(block)):
            if block[j] == "{":
                depth += 1
            elif block[j] == "}":
                depth -= 1
                if depth == 0:
                    return block[:m.start()] + " " + block[j + 1:], block[i:j + 1]
        return block[:m.start()] + " " + block[i:], block[i:]
    return block[:m.start()] + " " + block[i:], ""


def loop_declared(comp_text, bgm_hint):
    """True if any <Audio .../> element referencing bgm_hint carries a truthy
    `loop` prop.

    Explicit `loop={false}` / `loop={0}` counts as NOT looped (fail-closed
    direction). The src attribute value is stripped before prop scanning, so a
    path like /loop/bgm.mp3 is never mistaken for the loop prop.
    """
    for m in _AUDIO_RE.finditer(comp_text):
        block = m.group(1)
        if bgm_hint not in block:
            continue
        props_text, _src = _split_src(block)
        # Remaining quoted literals (other string props) can't hide a loop
        # token either; comments/strings stay out of the prop scan.
        props_text = _QUOTED_RE.sub(" ", props_text)
        if _LOOP_FALSE_RE.search(props_text):
            continue
        if _LOOP_PROP_RE.search(props_text):
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
    except (OSError, json.JSONDecodeError, UnicodeDecodeError) as e:
        raise InputError(f"unreadable scene_timing.json: {e}") from e
    duration = episode_duration(timing)
    bgm_seconds = (probe or probe_duration)(bgm_path)
    try:
        comp_text = Path(comp_path).read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as e:
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
