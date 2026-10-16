"""RACE FIX1 QC — measured on real renders (stills f9/18/36/51/63/87, cam f8/95).

A1 (f18/51/87): per-frame pin-math bboxes (exact geometry the comp renders,
prior QC proved <=0.6% err) give wR/wT/dx; real-still corroboration:
 (a) rabbit bbox measured from still = pixels differing >25 from an expected
     bg+turtle composite, EXCLUDING both sprites' shadow zones (comp shadow
     rect dilated 30px);
 (b) zero sprite pixels outside bbox+/-6px dilation (rows top-4..feet+6).
A2 (f9/36/63/87): dirt ratio in 12px band starting 40px below feet, across
per-frame content columns, sampled on the STILL. Both predicates reported:
literal fix3 ranges AND bg6-calibrated ranges (fix3 ranges measure 0 on bg6).
A3: cam f8 vs f95 sky patch mean|diff|.
"""
import json
from PIL import Image
import numpy as np

ROOT = "/Users/tuyennguyen/project/OpenMontage"
OUT = f"{ROOT}/remotion-composer/out"
REMAKE = f"{ROOT}/remotion-composer/public/character-performer/kids/remake"
BG = f"{ROOT}/remotion-composer/public/character-performer/kids/ep1_v2/bg6_walk.png"

REGALL = json.load(open(f"{REMAKE}/reg.json"))
REG = {k: REGALL[k] for k in ("rig_rabbit_run", "rig_turtle_walk")}
X = [556, 524, 508, 572, 540]
Y = [972, 810, 648, 518, 400]
LR, LT, CAP = 95, -135, 0.62  # FIX1 params
TUR_X = [v + LT for v in X]
RAB_X = [v + LR for v in X]


def clamp01(x):
    return min(1.0, max(0.0, x))


def polyLerp(ks, p):
    n = len(ks) - 1
    u = clamp01(p) * n
    i = min(n - 1, int(u // 1))
    e = 1 - (1 - (u - i)) ** 3
    return ks[i] + (ks[i + 1] - ks[i]) * e


def ip(v, rng, out):
    x = min(max(v, rng[0]), rng[-1])
    f = (x - rng[0]) / (rng[1] - rng[0])
    return out[0] + (out[1] - out[0]) * f


def geom(spr, t):
    if spr == "turtle":
        u = CAP * clamp01(t / 3.4)
        g, ks, Hrng, nf = REG["rig_turtle_walk"], TUR_X, [205, 120], 97
        idx = 1 + int(t * 24 // 1)
    else:
        u = clamp01((t - 0.3) / 3.0)
        g, ks, Hrng, nf = REG["rig_rabbit_run"], RAB_X, [400, 170], 108
        idx = 1 + int((t - 0.3) * 24 // 1)
    H = ip(u, [0, 1], Hrng)
    x, y = polyLerp(ks, u), polyLerp(Y, u)
    imgH = H / g["chf"]
    imgW = imgH * (g["w"] / g["h"])
    left, top = x - imgW * g["cx"], y - imgH * g["b"]
    return {"u": u, "idx": min(nf, max(1, idx)), "x": x, "y": y, "H": H,
            "imgW": imgW, "imgH": imgH, "left": left, "top": top, "g": g}


def sprite_layer(ridx, spr, t):
    g = geom(spr, t)
    src = Image.open(
        f"{REMAKE}/{'rig_turtle_walk' if spr == 'turtle' else 'rig_rabbit_run'}"
        f"/f{g['idx']:04d}.png").convert("RGBA")
    w, h = max(1, round(g["imgW"])), max(1, round(g["imgH"]))
    rs = src.resize((w, h), Image.BILINEAR)
    layer = Image.new("RGBA", (1080, 1080), (0, 0, 0, 0))
    layer.paste(rs, (round(g["left"]), round(g["top"])), rs)
    return layer, g


def bbox_of(layer):
    a = np.array(layer.getchannel("A"))
    ys, xs = np.where(a > 60)
    return int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())


BGIMG = Image.open(BG).convert("RGB").resize((1620, 1080), Image.BILINEAR) \
    .crop((270, 0, 1350, 1080))
BGREF = np.asarray(BGIMG).astype(np.int16)


def dirt_fix3(a):
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    return ((R >= 150) & (R <= 205) & (G >= 105) & (G <= 155) &
            (B >= 65) & (B <= 110) & ((R - B) > 45))


def dirt_bg6(a):
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    return ((R >= 195) & (R <= 255) & (G >= 95) & (G <= 185) &
            (B >= 35) & (B <= 130) & ((R - B) > 45) & ((R - G) >= 35))


def shadow_zone(g):
    """comp shadow rect (viewport px) dilated — 70px below (CSS blur(8px)
    tail measured up to 56px past the rect bottom), 40px sideways/above"""
    sw = g["imgW"] * g["g"]["cwf"] * 0.72
    cx = g["left"] + (g["imgW"] - sw) / 2
    cy = g["top"] + g["imgH"] * g["g"]["b"] - sw * 0.09
    return (cx - 40, cy - 40, cx + sw + 40, cy + sw * 0.18 + 70)


res = {"params": {"rabbit_lane": LR, "turtle_lane": LT, "turtle_uT_cap": CAP,
                  "turtle_H": [205, 120], "rabbit_H": [400, 170],
                  "delays_s": {"rabbit": 0.30, "turtle": 0.0}}}

# ---- A3 camera static -------------------------------------------------------
f8 = np.asarray(Image.open(f"{OUT}/race_cam_f8.png").convert("RGB")).astype(np.int16)
f95 = np.asarray(Image.open(f"{OUT}/race_cam_f95.png").convert("RGB")).astype(np.int16)
md = float(np.abs(f8[40:160, 60:180] - f95[40:160, 60:180]).mean())
res["A3_camera_static"] = {"frames": [8, 95], "patch": "x60..180 y40..160",
                           "mean_abs_diff": round(md, 4), "threshold": 2.0,
                           "pass": md < 2.0}

# ---- A1 separation ----------------------------------------------------------
A1 = {}
for fno, si in ((18, 1), (51, 2), (87, 3)):
    t = fno / 30.0
    lt_, gt = sprite_layer(None, "turtle", t)
    lr_, gr = sprite_layer(None, "rabbit", t)
    tx0, tx1, ty0, ty1 = bbox_of(lt_)
    rx0, rx1, ry0, ry1 = bbox_of(lr_)
    wT, wR = tx1 - tx0 + 1, rx1 - rx0 + 1
    dx = gr["x"] - gt["x"]
    thr = 0.5 * (wR + wT) - 0.25 * min(wR, wT)
    ov = max(0.0, (wR + wT) / 2 - dx)
    # edge-based bbox overlap + true pixel co-occupancy (both sprites opaque
    # in the same column, shared rows) — the "rabbit covers turtle" measure
    ov_edge = max(0, min(tx1, rx1) - max(tx0, rx0) + 1)
    ta = np.array(lt_.getchannel("A")) > 60
    ra = np.array(lr_.getchannel("A")) > 60
    co_cols = int((ta & ra).any(axis=0).sum())
    co_px = int((ta & ra).sum())
    co = ta & ra
    co_rows = np.where(co.any(axis=1))[0] if co_px else np.array([])
    # turtle head = topmost cluster (top 15% of turtle content rows)
    tt_rows = np.where(ta.any(axis=1))[0]
    head_bottom = tt_rows.min() + int(0.15 * (tt_rows.max() - tt_rows.min()))
    co_head = int(co[:head_bottom + 1, :].sum()) if co_px else 0
    # real-still corroboration. Texture noise (browser vs PIL bg resample)
    # can exceed 25 in grass regions, so: bounded search window + per-column
    # row-hit count >=4 (speckle kill), shadows excluded geometrically.
    still = np.asarray(
        Image.open(f"{OUT}/race_still_{si}.jpg").convert("RGB")).astype(np.int16)
    base = Image.alpha_composite(BGIMG.convert("RGBA"), lt_)
    base = Image.alpha_composite(base, lr_).convert("RGB")
    exp_all = np.asarray(base).astype(np.int16)
    d = np.abs(still - exp_all).max(axis=2)  # still vs bg+turtle+rabbit
    d_bt = np.abs(still - np.asarray(
        Image.alpha_composite(BGIMG.convert("RGBA"), lt_).convert("RGB")
    ).astype(np.int16)).max(axis=2)  # still vs bg+turtle -> rabbit+shadows
    zt, zr = shadow_zone(gt), shadow_zone(gr)

    def zone_mask(xs, ys):
        m = np.ones(len(xs), bool)
        for (zx0, zy0, zx1, zy1) in (zt, zr):
            m &= ~((xs >= zx0) & (xs <= zx1) & (ys >= zy0) & (ys <= zy1))
        return m

    def col_hits(dm, wx0, wx1, wy0, wy1):
        win = dm[wy0:wy1 + 1, wx0:wx1 + 1] > 25
        return wx0 + np.where(win.sum(axis=0) >= 4)[0]

    # rabbit presence at expected position: expected rabbit alpha>60 pixels
    # where the still actually differs from bg+turtle (rabbit visible there)
    ra_mask = np.array(lr_.getchannel("A")) > 60
    pres = float((d_bt[ra_mask] > 25).mean())
    # unexpected sprite content in the turtle<->rabbit gap region (the only
    # zone that affects the separation read): pixels differing from bg+turtle
    # AND not explained by the full expected composite; shadows excluded
    # geometrically. Global scan is meaningless: browser-vs-PIL bg resample
    # disagrees >25 in grass texture (measured, frame-edge columns included).
    gx0, gx1 = tx1 + 7, rx0 - 7
    if gx1 >= gx0:
        # rows restricted to the sprite vertical band: outside it, the
        # browser-vs-PIL bg reconstruction itself differs (sky gradient,
        # frame bottom) — measured, not sprite content.
        gy0 = max(0, min(ty0, ry0) - 15)
        gy1 = min(1079, int(round(max(gt["y"], gr["y"]))) + 80)
        ysg, xsg = np.mgrid[gy0:gy1 + 1, gx0:gx1 + 1]
        zm = zone_mask(xsg.ravel(), ysg.ravel()).reshape(xsg.shape)
        dnx = np.where(zm & (d[gy0:gy1 + 1, gx0:gx1 + 1] > 25),
                       d_bt[gy0:gy1 + 1, gx0:gx1 + 1], 0)
        # 40 not 25: JPEG chroma + browser-vs-PIL bg offsets reach ~30 in
        # red-flower regions (measured row 264); sprite-on-grass edges are
        # >60.
        gap_cols = [int(c) for c in np.where(
            (dnx > 40).sum(axis=0) >= 4)[0] + gx0]
        gap_note = f"rows {gy0}..{gy1}, thr 40"
    else:
        gap_cols = []
        gap_note = "bboxes touch/overlap: no gap region"
    viol = len(gap_cols)
    A1[f"t={t}"] = {
        "frame": fno, "turtle_src": gt["idx"], "rabbit_src": gr["idx"],
        "wT": wT, "wR": wR, "dx": round(dx, 1),
        "thr": round(thr, 1), "margin": round(dx - thr, 1),
        "bbox_overlap_px": round(ov, 1),
        "overlap_pct_of_narrower": round(ov / min(wR, wT) * 100, 1),
        "bbox_overlap_edge_px": ov_edge,
        "bbox_overlap_edge_pct_of_narrower": round(
            ov_edge / min(wR, wT) * 100, 1),
        "pixel_cooccupancy_cols": co_cols,
        "pixel_cooccupancy_px": co_px,
        "cooccupancy_rows": [int(co_rows.min()), int(co_rows.max())]
        if co_px else None,
        "turtle_head_rows": [int(tt_rows.min()), int(head_bottom)],
        "cooccupancy_px_in_turtle_head": co_head,
        "turtle_bbox": [tx0, tx1], "rabbit_bbox": [rx0, rx1],
        "rabbit_presence_at_expected_pct": round(pres * 100, 1),
        "unexpected_gap_content_cols": viol,
        "gap_cols": gap_cols, "gap_note": gap_note,
        "pass_dx": bool(dx >= thr),
        "pass_overlap50": bool(ov <= 0.5 * min(wR, wT)),
    }
res["A1_separation"] = A1

# ---- A2 on-road --------------------------------------------------------------
A2 = {}
for fno, fn in ((9, "race_fix1_f9.jpg"), (36, "race_fix1_f36.jpg"),
                (63, "race_fix1_f63.jpg"), (87, "race_still_3.jpg")):
    t = fno / 30.0
    still = np.asarray(Image.open(f"{OUT}/{fn}").convert("RGB")).astype(np.int16)
    ent = {}
    for spr in ("turtle", "rabbit"):
        g = geom(spr, t)
        layer, _ = sprite_layer(None, spr, t)
        x0s, x1s, _, _ = bbox_of(layer)
        feet = int(round(g["y"]))
        y0 = feet + 40
        x0, x1 = max(0, x0s), min(1080, x1s + 1)
        band = still[y0:y0 + 12, x0:x1]
        # shadow extent below feet along center columns (measured)
        cx = int(round(g["x"]))
        col = still[:, max(0, cx - 6):cx + 6, :]
        bgc = BGREF[:, max(0, cx - 6):cx + 6, :]
        dv = np.abs(col - bgc).max(axis=2).max(axis=1)
        below = np.where(dv[feet:feet + 80] > 8)[0]
        shad = int(below.max()) + feet if len(below) else feet
        ent[spr] = {
            "src_frame": g["idx"], "feet_y": feet, "band_y": [y0, y0 + 12],
            "cols": [x0, x1],
            "dirt_ratio_fix3_literal": round(float(dirt_fix3(band).mean()), 4),
            "dirt_ratio_bg6_calibrated": round(float(dirt_bg6(band).mean()), 4),
            "shadow_bottom_measured": shad,
            "pass_bg6": bool(dirt_bg6(band).mean() >= 0.45),
        }
    A2[f"t={t}"] = {"frame": fno, "still": fn, **ent}
res["A2_on_road"] = A2

out_path = f"{OUT}/race_shot_qc_partial_fix1.json"
json.dump(res, open(out_path, "w"), indent=1)
print(json.dumps(res, indent=1))
