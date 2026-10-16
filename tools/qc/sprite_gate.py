#!/usr/bin/env python3
"""sprite_gate — Gate A deterministic layout verification for sprite-story-pipeline (v3 spec §5.1).

Evaluates a scene manifest against measured asset registration using exact
arithmetic only (zero token cost, runs every iteration):

  A1 registration integrity (every source registered; sprites >= 40% alpha;
     variants drift <= 0.5%)
  A2 visible staging band (staging_asset_x in 20%..80% of background width)
  A3 grounding (actor feet y == ground_plane_y within 2px)
  A4 conversational gaze flips (speaker/listener face each other)
  A5 measured bubble-intersects-padded-head collision + exact minimal fix
  A6 safe margins (bubbles + head boxes inside safe area)
  A7 overlapping actor depth z-order

Gate B (vision) is NEVER invoked here — it only adjudicates perceptual rules
(style/lighting/in-asset defects) after Gate A passes with zero CRITICAL.

Usage:
  .venv/bin/python tools/qc/sprite_gate.py --manifest scene.json \
      --reg registration.json [--out report.json]

Exit codes: 0 = approved / approved_with_warnings, 1 = blocked (CRITICAL), 2 = error.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

GROUND_TOL_PX = 2
HEAD_PAD_X = 10
HEAD_PAD_TOP = 20
HEAD_PAD_BOTTOM = 10
BAND_LO, BAND_HI = 0.20, 0.80


def cover_params(wa: int, ha: int, wv: int, hv: int, zoom: float) -> dict:
    """object-fit: cover scale + centered crop offsets (spec §4.2), zoom >= 1.0."""
    s = max(wv / wa, hv / ha) * zoom
    return {"effective_scale": s,
            "offset_x": (wa * s - wv) / 2.0,
            "offset_y": (ha * s - hv) / 2.0}


def asset_to_viewport(x_a: float, y_a: float, cp: dict) -> tuple:
    return (x_a * cp["effective_scale"] - cp["offset_x"],
            y_a * cp["effective_scale"] - cp["offset_y"])


def actor_viewport_boxes(layer: dict, meta: dict) -> dict:
    """Placement math per spec §4.5 — returns css top-left, actor bbox, head box."""
    t = layer["transform"]
    sigma = t.get("scale", 1.0)
    flip = t.get("flip_x", False)
    wa, ha = meta["canvas_size"]
    x0, y0, x1, y1 = meta["content_bbox"]
    feet_y = meta["feet_y"]
    hx0, hy0, hx1, hy1 = meta["head_box"]

    cx_eff = (wa - meta["center_x"]) if flip else meta["center_x"]
    x_css = t["x"] - cx_eff * sigma
    y_css = t["y"] - feet_y * sigma

    ex0, ex1 = ((wa - x1), (wa - x0)) if flip else (x0, x1)
    ehx0, ehx1 = ((wa - hx1), (wa - hx0)) if flip else (hx0, hx1)

    bbox = [x_css + ex0 * sigma, y_css + y0 * sigma,
            x_css + ex1 * sigma, y_css + feet_y * sigma]
    head = [x_css + ehx0 * sigma, y_css + hy0 * sigma,
            x_css + ehx1 * sigma, y_css + hy1 * sigma]
    return {"css_top_left": [x_css, y_css], "bbox": bbox, "head_box": head}


def overlap_area(a: list, b: list) -> float:
    ix = min(a[2], b[2]) - max(a[0], b[0])
    iy = min(a[3], b[3]) - max(a[1], b[1])
    return max(0.0, ix) * max(0.0, iy)


def main() -> int:
    ap = argparse.ArgumentParser(description="Gate A deterministic checks (spec §5.1)")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--reg", default=None, help="registration.json fallback for asset_meta")
    ap.add_argument("--out", default=None, help="write report JSON here")
    args = ap.parse_args()

    manifest = json.loads(Path(args.manifest).read_text())
    reg = {}
    if args.reg and Path(args.reg).exists():
        reg = json.loads(Path(args.reg).read_text())
    meta_all = dict(manifest.get("asset_meta", {}))
    meta_all.update({k: v for k, v in reg.items() if k not in meta_all})

    canvas = manifest["canvas"]
    wv, hv = canvas["width"], canvas["height"]
    env = manifest.get("environment", {})
    bc = env.get("background_cover", {})
    cp = cover_params(bc.get("asset_width", wv), bc.get("asset_height", hv),
                      wv, hv, bc.get("camera_zoom", 1.0))
    margins = manifest.get("safe_margins", {"top": 80, "bottom": 100, "left": 100, "right": 100})
    ground_y = env.get("ground_plane_y")

    defects = []
    computed = {"effective_scale": round(cp["effective_scale"], 4),
                "offset_x": round(cp["offset_x"], 2), "offset_y": round(cp["offset_y"], 2),
                "actors": {}}

    def crit(rule, layer_id, detail, fix=None):
        defects.append({"rule": rule, "layer_id": layer_id, "severity": "CRITICAL",
                        "detail": detail, **({"fix": fix} if fix else {})})

    def warn(rule, layer_id, detail, fix=None):
        defects.append({"rule": rule, "layer_id": layer_id, "severity": "WARNING",
                        "detail": detail, **({"fix": fix} if fix else {})})

    layers = manifest.get("layers", [])
    actors, bubbles = {}, {}

    for layer in layers:
        lid, src = layer["layer_id"], layer.get("source")
        if src and src not in meta_all:
            crit("A1_RegistrationIntegrity", lid, f"{src} has no registration entry")
            continue
        meta = meta_all.get(src)
        # alpha + drift thresholds are enforced by sprite_register.py at
        # registration time (failing assets never enter registration.json);
        # Gate A only verifies integrity: every source must be registered.
        if layer["type"] == "sprite":
            actors[lid] = {"layer": layer, "meta": meta,
                           **actor_viewport_boxes(layer, meta)}
            computed["actors"][lid] = {"bbox": [round(v, 1) for v in actors[lid]["bbox"]],
                                       "head_box": [round(v, 1) for v in actors[lid]["head_box"]]}
        if layer["type"] == "speech_bubble":
            bubbles[lid] = layer

    # A2 — visible staging band on background anchors
    wa_bg = bc.get("asset_width")
    for layer in layers:
        sax = layer.get("staging_asset_x")
        if sax is not None and wa_bg:
            if not (BAND_LO * wa_bg <= sax <= BAND_HI * wa_bg):
                vx, _ = asset_to_viewport(sax, 0, cp)
                crit("A2_StagingBand", layer["layer_id"],
                     f"staging_asset_x {sax} outside {BAND_LO:.0%}-{BAND_HI:.0%} of bg width "
                     f"{wa_bg} (viewport x={vx:.0f} risks crop/safe-margin)")

    # A3 — grounding
    if ground_y is not None:
        for lid, a in actors.items():
            y = a["layer"]["transform"]["y"]
            if a["layer"].get("anchor", "bottom-center") == "bottom-center" \
                    and "elevated_prop_id" not in a["layer"]:
                if abs(y - ground_y) > GROUND_TOL_PX:
                    crit("A3_Grounding", lid,
                         f"feet y={y} vs ground_plane_y={ground_y} (>{GROUND_TOL_PX}px)",
                         {"action": "viewport_delta", "dx": 0, "dy": round(ground_y - y, 1)})

    # A4 — conversational gaze flips
    for bid, bub in bubbles.items():
        spk = bub.get("target_actor")
        if spk not in actors:
            crit("A4_Gaze", bid, f"target_actor '{spk}' is not a registered actor layer")
            continue
        sx = actors[spk]["layer"]["transform"]["x"]
        listeners = [(abs(actors[o]["layer"]["transform"]["x"] - sx), o)
                     for o in actors if o != spk]
        if not listeners:
            continue
        _, oid = min(listeners)
        ox = actors[oid]["layer"]["transform"]["x"]
        want_spk = sx > ox  # speaker on the right -> face left
        want_lst = not want_spk
        got_spk = actors[spk]["layer"]["transform"].get("flip_x", False)
        got_lst = actors[oid]["layer"]["transform"].get("flip_x", False)
        if got_spk != want_spk:
            crit("A4_Gaze", spk, f"speaker should flip_x={want_spk} to face listener '{oid}'",
                 {"action": "flip_toggle"})
        if got_lst != want_lst:
            crit("A4_Gaze", oid, f"listener should flip_x={want_lst} to face speaker '{spk}'",
                 {"action": "flip_toggle"})

    # A5 — bubble ∩ padded head (+ exact minimal fix) ; A6 — safe margins
    safe = [margins["left"], margins["top"], wv - margins["right"], hv - margins["bottom"]]

    def pad_head(h):
        return [h[0] - HEAD_PAD_X, h[1] - HEAD_PAD_TOP, h[2] + HEAD_PAD_X, h[3] + HEAD_PAD_BOTTOM]

    for bid, bub in bubbles.items():
        t = bub["transform"]
        box = [t["x"], t["y"], t["x"] + t["w"], t["y"] + t["h"]]
        for aid, a in actors.items():
            hp = pad_head(a["head_box"])
            if overlap_area(box, hp) > 0:
                dy = round((hp[1]) - box[3], 1)  # move bubble bottom above padded head top
                fix = {"action": "viewport_delta", "dx": 0, "dy": dy}
                if box[1] + dy < safe[1]:  # dy would breach top margin -> clear sideways
                    d_left = round((hp[0]) - box[2], 1)
                    d_right = round((hp[2]) - box[0], 1)
                    dx = d_left if abs(d_left) <= abs(d_right) else d_right
                    fix = {"action": "viewport_delta", "dx": dx, "dy": 0,
                           "note": "vertical fix would breach top safe margin "
                                   "(oscillation risk vs A6 — bounded to 1 sideways attempt)"}
                crit("A5_BubbleHeadCollision", bid,
                     f"bubble overlaps padded head box of '{aid}'", fix)
        for name, b in [(bid, box)] + [(f"{aid}:head", a["head_box"]) for aid, a in actors.items()]:
            if b[0] < safe[0] or b[1] < safe[1] or b[2] > safe[2] or b[3] > safe[3]:
                (crit if ":head" not in name else warn)("A6_SafeMargins", name,
                                                        f"box {b} outside safe area {safe}")

    # A7 — overlapping actor depth z-order
    ids = list(actors)
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            bi, bj = actors[ids[i]]["bbox"], actors[ids[j]]["bbox"]
            if overlap_area(bi, bj) > 0:
                zi, zj = actors[ids[i]]["layer"]["z_index"], actors[ids[j]]["layer"]["z_index"]
                if zi == zj:
                    crit("A7_DepthZOrder", f"{ids[i]},{ids[j]}", "overlapping actors share z_index",
                         {"action": "z_swap"})
                else:
                    yi, yj = bi[3], bj[3]  # feet (bottom of bbox)
                    near, far = (ids[i], ids[j]) if yi > yj else (ids[j], ids[i])
                    znear = actors[near]["layer"]["z_index"]
                    zfar = actors[far]["layer"]["z_index"]
                    if not znear > zfar:
                        crit("A7_DepthZOrder", near,
                             f"closer actor must have higher z than '{far}' "
                             f"({znear} <= {zfar})", {"action": "z_swap"})

    n_crit = sum(1 for d in defects if d["severity"] == "CRITICAL")
    n_warn = len(defects) - n_crit
    status = "blocked" if n_crit else ("approved_with_warnings" if n_warn else "approved")
    report = {"manifest": args.manifest, "status": status,
              "critical": n_crit, "warnings": n_warn,
              "computed": computed, "defects": defects}
    out = json.dumps(report, indent=2)
    print(out)
    if args.out:
        Path(args.out).write_text(out)
    return 1 if n_crit else 0


if __name__ == "__main__":
    sys.exit(main())
