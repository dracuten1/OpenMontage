"""RACE SHOT QC v2 (Phase B). Fixes over v1:
- sprite heights: occlusion-aware. Build a PIL label composite (BGREF + turtle
  pasted at exact pin-math geometry, rabbit pasted on top) -> per-sprite
  expected VISIBLE footprint. Measured top = topmost still row where >=8 of
  that sprite's own label columns differ from BGREF by >30. Avoids cross-
  sprite contamination and bg-resample false positives.
- seam: classify band columns as INTERIOR (source opaque above AND below the
  band -> a real hole) vs SILHOUETTE MARGIN (source transparent -> bg shows
  by design). Bleed verdict counts interior only.
"""

import json
from PIL import Image

ROOT = "/Users/tuyennguyen/project/OpenMontage"
OUT = f"{ROOT}/remotion-composer/out"
REMAKE = f"{ROOT}/remotion-composer/public/character-performer/kids/remake"
BG = f"{ROOT}/remotion-composer/public/character-performer/kids/ep1_v2/bg6_walk.png"

with open(f"{REMAKE}/reg.json") as f:
    REGALL = json.load(f)
REG = {k: REGALL[k] for k in ("rig_rabbit_run", "rig_turtle_walk")}

FPS = 30.0
X = [556, 524, 508, 572, 540]
Y = [972, 810, 648, 518, 400]
TUR_X = [v - 55 for v in X]
RAB_X = [v + 40 for v in X]


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
    for i in range(len(rng) - 1):
        if rng[i] <= x <= rng[i + 1]:
            f = (x - rng[i]) / (rng[i + 1] - rng[i])
            return out[i] + (out[i + 1] - out[i]) * f
    return out[-1]


def geom(spr, t):
    if spr == "turtle":
        u = 0.72 * clamp01(t / 3.4)
        g = REG["rig_turtle_walk"]
        ks_x, nf = TUR_X, 97
        H = ip(u, [0, 1], [205, 120])
    else:
        u = clamp01((t - 0.3) / 3.0)
        g = REG["rig_rabbit_run"]
        ks_x, nf = RAB_X, 108
        H = ip(u, [0, 1], [400, 170])
    x, y = polyLerp(ks_x, u), polyLerp(Y, u)
    imgH = H / g["chf"]
    imgW = imgH * (g["w"] / g["h"])
    idx = 1 + int((t * 24 if spr == "turtle" else (t - 0.3) * 24) // 1)
    return {"u": u, "idx": min(nf, max(1, idx)), "x": x, "y": y, "H": H,
            "imgH": imgH, "imgW": imgW, "g": g,
            "left": x - imgW * g["cx"], "top": y - imgH * g["b"]}


bgsrc = Image.open(BG).convert("RGB")
BGREF = bgsrc.resize((1620, 1080), Image.BILINEAR).crop((270, 0, 1350, 1080))
res = {}

# camera-static (unchanged from v1, recomputed)
f8 = Image.open(f"{OUT}/race_cam_f8.png").convert("RGB")
f95 = Image.open(f"{OUT}/race_cam_f95.png").convert("RGB")
a, b = f8.crop((60, 40, 180, 160)).load(), f95.crop((60, 40, 180, 160)).load()
md = sum(
    abs(a[x, y][c] - b[x, y][c])
    for y in range(120)
    for x in range(120)
    for c in range(3)
) / (120 * 120 * 3)
res["camera_static"] = {
    "frames": [8, 95], "patch": "x60..180 y40..160 (120x120)",
    "mean_abs_diff_rgb": round(md, 4), "threshold": 2.0, "pass": md < 2.0,
}

# ---- label composite + measured tops at the 3 stills ------------------------
heights = {"stills": [18, 51, 87]}
for si, fno in enumerate((18, 51, 87)):
    t = fno / FPS
    gt = geom("turtle", t)
    gr = geom("rabbit", t)
    st = Image.open(f"{REMAKE}/rig_turtle_walk/f{gt['idx']:04d}.png").convert("RGBA")
    sr = Image.open(f"{REMAKE}/rig_rabbit_run/f{gr['idx']:04d}.png").convert("RGBA")
    comp = BGREF.copy()
    label = [[0] * 1080 for _ in range(1080)]
    for sid, g, s in ((1, gt, st), (2, gr, sr)):
        w, h = max(1, round(g["imgW"])), max(1, round(g["imgH"]))
        rs = s.resize((w, h), Image.BILINEAR)
        ox, oy = round(g["left"]), round(g["top"])
        comp.paste(rs, (ox, oy), rs)
        lp = rs.load()
        for yy in range(h):
            cy = oy + yy
            if not (0 <= cy < 1080):
                continue
            for xx in range(w):
                cx = ox + xx
                if 0 <= cx < 1080 and lp[xx, yy][3] > 128:
                    label[cy][cx] = sid
    still = Image.open(f"{OUT}/race_still_{si + 1}.jpg").convert("RGB")
    sp, cp = still.load(), comp.load()
    entry = {"frame": fno, "t_s": round(t, 3)}
    for sid, name, g in ((1, "turtle", gt), (2, "rabbit", gr)):
        rows_cols = {}
        for y in range(1080):
            cols = [x for x in range(1080) if label[y][x] == sid]
            if cols:
                rows_cols[y] = cols
        exp_top = min(rows_cols)
        hit_rows = [
            y
            for y, cols in rows_cols.items()
            if sum(1 for x in cols if max(abs(sp[x, y][c] - cp[x, y][c]) for c in range(3)) > 30) >= 8
        ]
        meas_top = min(hit_rows) if hit_rows else None
        occl = exp_top > round(g["y"] - g["H"]) + 3
        entry[name] = {
            "src_frame": g["idx"],
            "spec_H": round(g["H"], 1),
            "expected_visible_top": exp_top,
            "measured_top": meas_top,
            "feet_y": round(g["y"], 1),
            "expected_visible_H": round(g["y"] - exp_top + 1, 1),
            "measured_H_head_to_feet": (round(g["y"] - meas_top + 1) if meas_top else None),
            "occluded_at_top": occl,
        }
        if meas_top:
            errv = (g["y"] - meas_top + 1 - (g["y"] - exp_top + 1)) / (g["y"] - exp_top + 1) * 100
            errs = (g["y"] - meas_top + 1 - g["H"]) / g["H"] * 100
            entry[name]["err_vs_expected_visible_pct"] = round(errv, 1)
            entry[name]["err_vs_specH_pct"] = round(errs, 1)
            entry[name]["pass_15pct_vs_visible"] = abs(errv) <= 15
    heights[f"still_{si + 1}"] = entry
res["sprite_heights"] = heights

# ---- seam, interior-vs-margin ----------------------------------------------
t16 = 16 / FPS
gt = geom("turtle", t16)
src = Image.open(f"{REMAKE}/rig_turtle_walk/f{gt['idx']:04d}.png").convert("RGBA")
W0, H0 = src.size
sa = src.getchannel("A").load()
xw = range(1038, 1061)
rows_content = [any(sa[x, y] > 10 for x in xw) for y in range(H0)]
gaps, y = [], 0
while y < H0:
    if not rows_content[y]:
        y0 = y
        while y < H0 and not rows_content[y]:
            y += 1
        gaps.append((y0, y - 1))
    else:
        y += 1
band = max(gaps, key=lambda ab: ab[1] - ab[0])
by0, by1 = band
left, top, imgW, imgH = gt["left"], gt["top"], gt["imgW"], gt["imgH"]
still = Image.open(f"{OUT}/race_still_seam.jpg").convert("RGB")
seam = {
    "comp_frame": 16, "t_s": round(t16, 4), "turtle_src_frame": gt["idx"],
    "src_band_rows": [by0, by1], "src_band_h": by1 - by0 + 1,
    "comp_band_rows": [int(round(top + imgH * (by0 / H0))), int(round(top + imgH * (by1 / H0)))],
}
# comp rows to scan: band +/- 2px
cy0 = max(0, int(round(top + imgH * (by0 / H0))) - 2)
cy1 = min(1079, int(round(top + imgH * (by1 / H0))) + 2)
sp = still.load()
interior, margin = [], []
cx_left = int(round(left))
for xc in range(int(round(left)), int(round(left + imgW))):
    sx = (xc - left) / imgW * W0
    sxi = min(W0 - 1, max(0, int(sxi if False else round(sx))))
    above = any(sa[x, y] > 10 for y in range(max(0, by0 - 12), by0) for x in (sxi,))
    below = any(sa[x, y] > 10 for y in range(by1 + 1, min(H0, by1 + 13)) for x in (sxi,))
    # diff of still vs BGREF over the scanned rows at this column
    med = sorted(
        max(abs(sp[xc, y][c] - BGREF.load()[xc, y][c]) for c in range(3))
        for y in range(cy0, cy1 + 1)
    )[ (cy1 - cy0 + 1) // 2 ]
    if med < 15:
        (interior if (above and below) else margin).append(xc - cx_left)


def runs_of(cols):
    r = []
    for x in cols:
        if r and x == r[-1][1] + 1:
            r[-1][1] = x
        else:
            r.append([x, x])
    return [[a, b, b - a + 1] for a, b in r]


seam.update({
    "bleed_threshold": 15,
    "interior_bleed_total_comp_px": len(interior),
    "interior_bleed_runs": runs_of(interior),
    "silhouette_margin_bleed_comp_px": len(margin),
    "silhouette_margin_runs": runs_of(margin),
    "verdict": "ACCEPT" if len(interior) <= 8 else "FLAG",
})
res["seam"] = seam

with open(f"{OUT}/race_shot_qc_partial2.json", "w") as f:
    json.dump(res, f, indent=2)
print(json.dumps(res, indent=2))
