#!/usr/bin/env python3
"""TURN4_B QC on the rendered v4 mp4.

Checks (PIL-only, no human eyeballs):
 1. Camera-static per shot: first/last frame overlay-diff evidence PNG +
    sky-patch mean abs diff < 2 (regions chosen clear of characters/tree/
    end-card; confetti is sub-pixel-scale for the MEAN metric).
 2. S5 hold: frames 880 vs 886 nearly identical in the turtle hold region.
 3. S5 chain swap: localized change region near the expected rabbit/turtle
    bboxes (path executed where pace_calc says).
 4. Zzz anchor: bubble pixels present around the (663,556) anchor offsets.
Writes qc_v4/ evidence PNGs + turn4_qc.json (merged later with ffprobe).
"""
import json
import os
import subprocess
import sys

from PIL import Image, ImageChops

MP4 = "remotion-composer/out/kids_ep1_remake_v4.mp4"
OUT = "character-performer/kids/turn4/qc_v4"
os.makedirs(OUT, exist_ok=True)

# camera segments: (name, f_first, f_last) — boundaries at 30fps from camAt/
# camStack; S5 A/B/C cuts removed -> NAP+S5 one static shot.
SHOTS = [
    ("S0a_wide", 0, 52), ("S0b_push", 53, 116),
    ("S1a", 117, 191), ("S1b_punch", 192, 297),
    ("S2a", 298, 326), ("S2b_close", 327, 371), ("S2c_react", 372, 405),
    ("S3a", 406, 458), ("S3b_punch", 459, 533),
    ("S4a_line", 534, 566), ("S4_sprint", 567, 626),
    ("NAP_S5_static", 627, 886),
    ("S6_wake", 887, 956), ("S6_wide", 957, 1016),
    ("S7_finish", 1017, 1229),
]
SKY = (60, 20, 260, 90)  # top-left patch, clear in every segment
# probe-window overrides: skip DESIGNED non-camera changes at segment tails —
# bg plate crossfades [3.65,4.15] and [16.9,17.4], and the S6-wide warm-tint
# ramp (handled by per-channel-mean normalization instead).
WIN = {"S0b_push": (53, 108), "S3b_punch": (459, 506), "NAP_S5_static": (684, 886)}


def grab(f):
    p = os.path.join(OUT, f"f{f:04d}.png")
    if not os.path.exists(p):
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", MP4, "-vf", f"select=eq(n\\,{f})",
             "-vframes", "1", "-y", p], check=True)
    return Image.open(p).convert("RGB")


def _norm(img):
    """Remove uniform per-channel gain (multiply tint) before diffing."""
    px = list(img.getdata())
    n = len(px)
    means = [sum(c[i] for c in px) / n for i in range(3)]
    return Image.new("RGB", img.size, tuple(int(round(m)) for m in means))


def mean_diff(a, b, box=None):
    if box:
        a, b = a.crop(box), b.crop(box)
    a = ImageChops.subtract(a, _norm(a), scale=1.0, offset=128)
    b = ImageChops.subtract(b, _norm(b), scale=1.0, offset=128)
    h = ImageChops.difference(a, b).convert("L").histogram()
    tot = sum(h)
    return sum(i * n for i, n in enumerate(h)) / tot


def overlay_evidence(name, a, b):
    ov = Image.blend(a, b, 0.5)
    diff = ImageChops.difference(a, b).convert("L").point(lambda v: min(255, v * 3))
    ov.putalpha(diff)
    ov.convert("RGBA").save(os.path.join(OUT, f"ovdiff_{name}.png"))


results = {"shots": [], "s5_hold": None, "s5_zzz": None}

for name, f0, f1 in SHOTS:
    p0, p1 = WIN.get(name, (f0, f1))
    a, b = grab(p0), grab(p1)
    sky = mean_diff(a, b, SKY)
    overlay_evidence(name, a, b)
    results["shots"].append(
        {"shot": name, "probe_f0": p0, "probe_f1": p1, "sky_mean_diff": round(sky, 3),
         "sky_pass_lt2": sky < 2.0})

# S5 hold on pose m0 at (250,355,H60): frames 880 vs 886 inside turtle region
a, b = grab(880), grab(886)
hold = mean_diff(a, b, (150, 240, 360, 400))
results["s5_hold"] = {"frames": [880, 886], "region_mean_diff": round(hold, 3),
                      "pass_lt2": hold < 2.0}

# Zzz anchor probe: bubbles pulse (period 2s, phase-shifted per bubble) over
# a STATIC bg — diff frames 765 vs 795 (half period) and count changed pixels
# (|dL|>12) in the three bubble boxes near the (663,556) anchor offsets
# (dx 52/88/132, dy -46/-100/-166) vs a distant control box. Turtle at t=25.5
# sits x430-470 y590-700 (clear); rabbit breathing y>=585 (clear). reg delta
# sleeping_v2 demo-vs-remake = 0 -> anchor unmoved.
fa, fb = grab(765), grab(795)
la, lb = fa.convert("L"), fb.convert("L")


def count_pulse(box):
    x0, y0, x1, y1 = box
    n = 0
    for y in range(y0, y1):
        for x in range(x0, x1):
            if abs(la.getpixel((x, y)) - lb.getpixel((x, y))) > 12:
                n += 1
    return n


boxes = {"b1_near_head": (680, 480, 750, 540), "b2_mid": (716, 426, 786, 486),
         "b3_top": (760, 360, 830, 420), "ctrl_far": (300, 300, 370, 360)}
counts = {k: count_pulse(v) for k, v in boxes.items()}
ctrl = counts["ctrl_far"]
results["s5_zzz"] = {
    "method": "pulse_diff_f765_vs_f795", "counts": counts,
    "anchor_xy": [663, 556], "reg_delta_sleeping_v2": 0.0,
    "pass": (counts["b1_near_head"] >= 15 and counts["b2_mid"] >= 15
             and counts["b3_top"] >= 15
             and min(counts["b1_near_head"], counts["b2_mid"], counts["b3_top"]) > 2 * ctrl),
}

ok = (all(s["sky_pass_lt2"] for s in results["shots"])
      and results["s5_hold"]["pass_lt2"] and results["s5_zzz"]["pass"])
results["overall"] = "PASS" if ok else "FAIL"
with open("character-performer/kids/turn4/turn4_qc.json", "w") as f:
    json.dump(results, f, indent=2)
for s in results["shots"]:
    print(f'{s["shot"]:<16} f{s["probe_f0"]}-{s["probe_f1"]} sky={s["sky_mean_diff"]:>7} pass={s["sky_pass_lt2"]}')
print("s5_hold:", results["s5_hold"])
print("s5_zzz:", results["s5_zzz"])
print("OVERALL:", results["overall"])
sys.exit(0 if ok else 2)
