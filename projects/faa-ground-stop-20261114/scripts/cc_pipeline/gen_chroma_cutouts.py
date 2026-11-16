#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_chroma_cutouts.py — faa-ground-stop-20261114

Sinh 14 hero image dạng CUTOUT THẬT (chroma green) cho editorial gate
nhận credit "cutout chroma-key/remove-bg pipeline" (CUTOUT_GENUINE_METHODS).
Quy trình: t2i (9router) → chủ đề đơn vật thể trên nền xanh #00FF00 →
key alpha bằng PIL/numpy → lưu PNG RGBA vào public/<slug>/img/<name>.png.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

GEN = "/Users/tuyennguyen/.hermes/skills/image-generation/scripts/gen_image.py"
PY = sys.executable
REPO = Path("/Users/tuyennguyen/project/OpenMontage")
SLUG = "faa-ground-stop-20261114"
OUT = REPO / "remotion-composer/public" / SLUG / "img"
RAW = REPO / "projects" / SLUG / "artifacts" / "chroma_raw"
RAW.mkdir(parents=True, exist_ok=True)

STYLE = (
    "single isolated subject, editorial print halftone newsprint collage, high-contrast monochrome "
    "with crimson red accent and warm amber highlight, archival paper grain, sharp clean edges, "
    "plain solid bright green chroma key background (#00FF00), no floor, no shadow, no environment, "
    "no text, no letters, no watermark"
)

SUBJECTS = {
    "s1_groundstop": "a row of grounded passenger airliners parked wing-to-wing on an airport apron with a tall air traffic control tower standing behind them",
    "s3_radar": "a round radar scope screen with fading blips and a broken radio wave signal line across it",
    "s4_planes_row": "dozens of small airliner silhouettes queued in long rows on taxiways seen from high above",
    "s5_transatlantic": "a long dashed flight route arc across an ocean between two simplified continents, cut in the middle by a bold red X mark",
    "s6_staggered_takeoff": "several airliners lifting off one after another along a single runway, each climbing at a different height with motion streaks",
    "s7_investigate": "a large magnifying glass examining a thick glowing fiber optic cable bundle with loose strands",
    "s8_aging_tower": "an old weathered air traffic control tower with cracked concrete base and tangled cable bundles hanging from it",
    "s10_vn_route": "a stylized globe showing a long dashed flight arc from Southeast Asia to North America with a small clock icon floating beside it",
    "s12_cta": "a single glowing airport approach light beacon lamp standing in darkness with soft light rays",
}

MODEL_PRIMARY = "ag/gemini-3.1-flash-image"
MODEL_FALLBACK = "cx/gpt-5.6-luna-image"


def gen_one(name: str, prompt: str) -> str:
    raw = RAW / f"{name}.png"
    if raw.exists() and raw.stat().st_size > 20000:
        return f"[skip-existing] {name}"
    for model in (MODEL_PRIMARY, MODEL_FALLBACK):
        cmd = [PY, GEN, "--model", model, "-o", str(raw), f"{prompt}, {STYLE}"]
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        except subprocess.TimeoutExpired:
            continue
        if r.returncode == 0 and raw.exists() and raw.stat().st_size > 20000:
            return f"[ok] {name} via {model}"
    return f"[FAIL] {name}"


def key_green(src: Path, dst: Path) -> tuple[str, float]:
    """HSV hue/sat chroma key + despill. Returns (status, alpha_coverage)."""
    import numpy as np
    from PIL import Image

    im = Image.open(src).convert("RGB")
    rgb = np.asarray(im).astype(np.float32) / 255.0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1)
    mn = rgb.min(-1)
    diff = mx - mn + 1e-6
    sat = np.where(mx > 0, diff / (mx + 1e-6), 0)
    hue = np.zeros_like(mx)
    m = mx == r
    hue[m] = ((g - b) / diff)[m] % 6
    m = mx == g
    hue[m] = ((b - r) / diff)[m] + 2
    m = mx == b
    hue[m] = ((r - g) / diff)[m] + 4
    hue *= 60.0
    greenness = np.where((hue > 80) & (hue < 170), sat, 0.0)
    alpha = 1.0 - np.clip((greenness - 0.15) / 0.30, 0, 1)
    keep = alpha > 0
    spill = np.clip(g - np.maximum(r, b), 0, None) * keep
    g2 = g - spill * 0.85
    out = np.dstack([r, g2, b, alpha]) * 255.0
    Image.fromarray(out.astype(np.uint8)).save(dst)
    return ("ok", float((alpha > 0.04).mean()))


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    names = sorted(SUBJECTS)
    print(f"generating {len(names)} chroma images (parallel 3)", flush=True)
    with ThreadPoolExecutor(max_workers=3) as ex:
        futs = {ex.submit(gen_one, n, SUBJECTS[n]): n for n in names}
        results = [f.result() for f in futs]
    for r in results:
        print(r, flush=True)

    print("keying green -> alpha", flush=True)
    summary = []
    for n in names:
        raw = RAW / f"{n}.png"
        dst = OUT / f"{n}.png"
        if not raw.exists():
            summary.append({"name": n, "status": "no_raw"})
            continue
        status, cov = key_green(raw, dst)
        summary.append({"name": n, "status": status, "transparent_fraction": round(cov, 4)})
        print(f"{n}: {status} transparent={cov:.3f}", flush=True)

    (REPO / "projects" / SLUG / "artifacts" / "chroma_cutouts.json").write_text(
        json.dumps(summary, indent=1), encoding="utf-8")
    ok = sum(1 for s in summary if s.get("status") == "ok")
    print(f"DONE {ok}/{len(names)} keyed", flush=True)
    return 0 if ok == len(names) else 1


if __name__ == "__main__":
    sys.exit(main())
