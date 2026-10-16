#!/usr/bin/env python3
"""sprite_register — PIL asset registration for the sprite-story-pipeline (v3 spec §3).

Measures every generated asset immediately after generation and merges an
entry into registration.json:

  canvas_size, content_bbox, feet_y, center_x, head_box, transparency_pct,
  variant_of, drift_vs_m0_pct, registered_at

Guards (per spec §2.1 / §2.5):
  - alpha guard: sprites need transparency_pct >= 40 (native-alpha path);
    backgrounds are exempt (opaque by design, content_bbox = full canvas).
  - pixel-drift gate: a variant (--variant-of) must keep
    max(delta_w, delta_h, delta_feet) <= 0.5% of canvas, unless
    --allow-lateral-expansion exempts delta_w only (arm raise poses).

Head box = alpha bounds of the top 22% slice of content height. Heuristic:
sprites with raised arms/ears overhead may widen it — Gate B catches the
perceptual fallout; re-measure with --head-slice if needed.

Usage:
  .venv/bin/python tools/qc/sprite_register.py --asset PATH --type sprite \
      [--variant-of PATH] [--allow-lateral-expansion] --reg registration.json

Exit codes: 0 = registered, 1 = guard failed (asset must NOT be referenced).
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image
import numpy as np

ALPHA_TRANSPARENT = 10    # alpha < 10 counts as transparent (spec §2.1)
ALPHA_CONTENT = 16        # alpha >= 16 counts as content (spec §3.2)
MIN_SPRITE_TRANSPARENCY_PCT = 40.0
MAX_DRIFT_PCT = 0.5
HEAD_SLICE_FRAC = 0.22


def measure_asset(image_path: str, head_slice_frac: float = HEAD_SLICE_FRAC) -> dict:
    img = Image.open(image_path).convert("RGBA")
    w_a, h_a = img.size
    alpha = np.array(img)[:, :, 3]

    transparency_pct = round(float((alpha < ALPHA_TRANSPARENT).sum()) / (w_a * h_a) * 100.0, 2)

    ys, xs = np.where(alpha >= ALPHA_CONTENT)
    if len(xs) == 0 or len(ys) == 0:
        raise ValueError(f"Asset {image_path} is completely transparent.")

    x_min, x_max = int(xs.min()), int(xs.max())
    y_min, y_max = int(ys.min()), int(ys.max())
    content_h = y_max - y_min

    head_y_max = int(round(y_min + head_slice_frac * content_h))
    head_slice = alpha[y_min:head_y_max + 1, :]
    h_ys, h_xs = np.where(head_slice >= ALPHA_CONTENT)
    hx_min = int(h_xs.min()) if len(h_xs) else x_min
    hx_max = int(h_xs.max()) if len(h_xs) else x_max

    return {
        "canvas_size": [w_a, h_a],
        "content_bbox": [x_min, y_min, x_max, y_max],
        "feet_y": y_max,
        "center_x": round((x_min + x_max) / 2.0, 2),
        "head_box": [hx_min, y_min, hx_max, head_y_max],
        "transparency_pct": transparency_pct,
    }


def drift_pct(variant: dict, base: dict, allow_lateral: bool) -> dict:
    vw = variant["canvas_size"][0]
    vh = variant["canvas_size"][1]
    bx0, by0, bx1, by1 = base["content_bbox"]
    vx0, vy0, vx1, vy1 = variant["content_bbox"]
    d_w = abs((vx1 - vx0) - (bx1 - bx0)) / vw * 100.0
    d_h = abs((vy1 - vy0) - (by1 - by0)) / vh * 100.0
    d_feet = abs(variant["feet_y"] - base["feet_y"]) / vh * 100.0
    worst = d_h if allow_lateral else max(d_w, d_h)
    return {"delta_w_pct": round(d_w, 3), "delta_h_pct": round(d_h, 3),
            "delta_feet_pct": round(d_feet, 3), "worst_pct": round(max(worst, d_feet), 3),
            "passed": max(worst, d_feet) <= MAX_DRIFT_PCT}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--asset", required=True, help="path to the generated PNG")
    ap.add_argument("--type", choices=["sprite", "background"], default="sprite")
    ap.add_argument("--variant-of", default=None, help="canonical m0 path (for drift gate)")
    ap.add_argument("--allow-lateral-expansion", action="store_true",
                    help="exempt delta_w from the drift gate (arm-raise poses)")
    ap.add_argument("--head-slice", type=float, default=HEAD_SLICE_FRAC)
    ap.add_argument("--reg", required=True, help="registration.json to merge into")
    args = ap.parse_args()

    asset_path = Path(args.asset)
    reg_path = Path(args.reg)

    try:
        metrics = measure_asset(str(asset_path), args.head_slice)
    except ValueError as e:
        print(json.dumps({"error": str(e)}))
        return 1

    reg = {}
    if reg_path.exists():
        reg = json.loads(reg_path.read_text())
    reg_key = str(asset_path)

    entry = {"asset_type": args.type, **metrics,
             "variant_of": args.variant_of, "drift_vs_m0_pct": 0.0,
             "registered_at": datetime.now(timezone.utc).isoformat(timespec="seconds")}

    report = {"asset": reg_key, "asset_type": args.type, **metrics, "guards": {}}

    # --- alpha guard (sprites only) ------------------------------------------
    if args.type == "sprite":
        ok = metrics["transparency_pct"] >= MIN_SPRITE_TRANSPARENCY_PCT
        report["guards"]["alpha_guard"] = {
            "transparency_pct": metrics["transparency_pct"],
            "threshold": MIN_SPRITE_TRANSPARENCY_PCT, "passed": ok}
        if not ok:
            report["guards"]["alpha_guard"]["action"] = (
                "opaque sprite: run fallback cutout then re-register, or regenerate")
            print(json.dumps(report, indent=2))
            return 1

    # --- pixel-drift gate (variants only) -------------------------------------
    if args.variant_of:
        base_key = args.variant_of
        base_entry = reg.get(base_key)
        if base_entry is None and Path(base_key).exists():
            base_entry = measure_asset(base_key)
        if base_entry is None:
            print(json.dumps({"error": f"variant-of {base_key} not registered and not on disk"}))
            return 1
        d = drift_pct(metrics, base_entry, args.allow_lateral_expansion)
        d["allow_lateral_expansion"] = args.allow_lateral_expansion
        report["guards"]["pixel_drift"] = d
        if not d["passed"]:
            report["guards"]["pixel_drift"]["action"] = "discard variant and regenerate"
            print(json.dumps(report, indent=2))
            return 1
        entry["drift_vs_m0_pct"] = d["worst_pct"]
        entry["variant_of"] = base_key

    reg[reg_key] = entry
    reg_path.parent.mkdir(parents=True, exist_ok=True)
    reg_path.write_text(json.dumps(reg, indent=2))
    report["registered"] = True
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
