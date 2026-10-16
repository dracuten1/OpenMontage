"""RACE SHOT QC (Phase B). Pure PIL measurements on rendered stills.

- camera-static proof: mean|diff| of a 120x120 sky patch (x 60..180, y 40..160)
  between comp frame 8 and frame 95 (must be < 2.0).
- seam check: carry-forward turtle neck seam (source f13, src x~1049+-11,
  head-bottom<->shell-top band). Comp frame 16 (t=0.533, turtle src f13).
  BG-bleed columns = columns in the band whose pixels match the BG reference
  (static cover-fit bg6 render, reconstructed in PIL) rather than turtle.
- sprite heights at stills 18/51/87 (t=0.6/1.7/2.9): mask = |still-bgref|>30,
  measured head-to-feet height vs expected H (V2 pin math mirrored).
"""

import json
from PIL import Image, ImageFilter

ROOT = "/Users/tuyennguyen/project/OpenMontage"
OUT = f"{ROOT}/remotion-composer/out"
REMAKE = f"{ROOT}/remotion-composer/public/character-performer/kids/remake"
BG = f"{ROOT}/remotion-composer/public/character-performer/kids/ep1_v2/bg6_walk.png"

with open(f"{REMAKE}/reg.json") as f:
    REG = json.load(f)
REG = {k: REG[k] for k in ("rig_rabbit_run", "rig_turtle_walk")}

FPS = 30.0


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


# BG reference: bg6 (1254x1254) drawn at 1620x1080 in a div at left:-270 ->
# viewport = crop x 270..1350 of the resized image.
_bg = Image.open(BG).convert("RGB")
BGREF = _bg.resize((1620, 1080), Image.BILINEAR).crop((270, 0, 1350, 1080))
assert BGREF.size == (1080, 1080)


def diffmax(still, ref, box=None):
    a = still.crop(box) if box else still
    b = ref.crop(box) if box else ref
    pa, pb = a.load(), b.load()
    w, h = a.size
    out = [[0] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r1, g1, b1 = pa[x, y]
            r2, g2, b2 = pb[x, y]
            out[y][x] = max(abs(r1 - r2), abs(g1 - g2), abs(b1 - b2))
    return out, w, h


res = {}

# ---- 1. camera-static proof ------------------------------------------------
f8 = Image.open(f"{OUT}/race_cam_f8.png").convert("RGB")
f95 = Image.open(f"{OUT}/race_cam_f95.png").convert("RGB")
patch = (60, 40, 180, 160)
d, w, h = diffmax(f8, f95, patch)
mean_diff = sum(sum(r) for r in d) / (w * h)
res["camera_static"] = {
    "patch": "x60..180 y40..160 (120x120)", "frames": [8, 95],
    "mean_abs_diff": round(mean_diff, 4), "threshold": 2.0,
    "pass": mean_diff < 2.0,
}

# ---- 2. turtle geometry helper (mirror of comp math) ------------------------
X = [556, 524, 508, 572, 540]
Y = [972, 810, 648, 518, 400]
TUR_X = [v - 55 for v in X]
RAB_X = [v + 40 for v in X]


def turtle_geom(t):
    uT = 0.72 * clamp01(t / 3.4)
    x = polyLerp(TUR_X, uT)
    y = polyLerp(Y, uT)
    H = ip(uT, [0, 1], [205, 120])
    g = REG["rig_turtle_walk"]
    imgH = H / g["chf"]
    imgW = imgH * (g["w"] / g["h"])
    return {
        "idx": min(97, max(1, 1 + int(t * 24 // 1))), "x": x, "y": y, "H": H,
        "imgH": imgH, "imgW": imgW,
        "left": x - imgW * g["cx"], "top": y - imgH * g["b"], "g": g,
    }


def rabbit_geom(t):
    u4 = clamp01((t - 0.3) / 3.0)
    x = polyLerp(RAB_X, u4)
    y = polyLerp(Y, u4)
    H = ip(u4, [0, 1], [400, 170])
    g = REG["rig_rabbit_run"]
    imgH = H / g["chf"]
    imgW = imgH * (g["w"] / g["h"])
    return {
        "idx": min(108, max(1, 1 + int((t - 0.3) * 24 // 1))), "x": x, "y": y,
        "H": H, "imgH": imgH, "imgW": imgW,
        "left": x - imgW * g["cx"], "top": y - imgH * g["b"], "g": g,
    }

# ---- 3. seam check at comp frame 16 ----------------------------------------
t16 = 16 / FPS
tg = turtle_geom(t16)
src = Image.open(f"{REMAKE}/rig_turtle_walk/f{tg['idx']:04d}.png").convert("RGBA")
W0, H0 = src.size
sa = src.getchannel("A").load()
# band rows on the source: rows in src x window [1038,1060] that are see-through
# (alpha<10 across the window) but have content above and below in that window.
xw = (1038, 1061)
rows_content = [any(sa[x, y] > 10 for x in range(*xw)) for y in range(H0)]
top_c = next((y for y, c in enumerate(rows_content) if c), None)
bot_c = next((y for y in range(H0 - 1, -1, -1) if rows_content[y]), None)
gaps = []
y = top_c
while y is not None and y <= bot_c:
    if not rows_content[y]:
        y0 = y
        while y <= bot_c and not rows_content[y]:
            y += 1
        gaps.append((y0, y - 1))
    else:
        y += 1
band = max(gaps, key=lambda ab: ab[1] - ab[0]) if gaps else None

seam = {"comp_frame": 16, "t_s": round(t16, 4), "turtle_src_frame": tg["idx"],
        "src_gap_candidates": [(a, b, b - a + 1) for a, b in gaps]}
if band:
    # map band rows + full bbox to comp px
    left, top, imgW, imgH = tg["left"], tg["top"], tg["imgW"], tg["imgH"]
    cy0 = top + imgH * (band[0] / H0)
    cy1 = top + imgH * (band[1] / H0)
    cx0 = int(round(left))
    cx1 = int(round(left + imgW))
    cy0i = int(round(cy0))
    cy1i = max(cy0i + 1, int(round(cy1)))
    still = Image.open(f"{OUT}/race_still_seam.jpg").convert("RGB")
    d, w, h = diffmax(still, BGREF, (cx0, cy0i, cx1, cy1i))
    TH = 15
    rows = range(h)
    bleed_cols = []
    for x in range(w):
        med = sorted(d[y][x] for y in rows)[len(rows) // 2]
        if med < TH:
            bleed_cols.append(x)
    runs = []
    for x in bleed_cols:
        if runs and x == runs[-1][1] + 1:
            runs[-1][1] = x
        else:
            runs.append([x, x])
    runs = [[a, b, b - a + 1] for a, b in runs]
    # seam window (src x 1038..1060) mapped to comp cols relative to crop
    sw0 = int(round(left + imgW * (1038 / W0))) - cx0
    sw1 = int(round(left + imgW * (1060 / W0))) - cx0
    in_win = [c for c in bleed_cols if sw0 <= c <= sw1]
    total = len(bleed_cols)
    worst = max((r[2] for r in runs), default=0)
    seam.update({
        "src_band_rows": [band[0], band[1]],
        "src_band_height_px": band[1] - band[0] + 1,
        "comp_band_rows": [cy0i, cy1i],
        "scan_cols": [cx0, cx1],
        "bleed_threshold": TH,
        "bleed_total_comp_px": total,
        "bleed_runs_comp_px": runs,
        "worst_run_comp_px": worst,
        "bleed_in_seam_window": len(in_win),
        "seam_window_comp_cols_rel": [sw0, sw1],
        "verdict": "ACCEPT" if total <= 8 else "FLAG",
    })
else:
    seam["verdict"] = "NO-GAP-FOUND (seam closed in f13)"
res["seam"] = seam

# ---- 4. sprite heights at stills 18/51/87 -----------------------------------
heights = {"stills": [18, 51, 87], "t_s": [0.6, 1.7, 2.9]}
for name, path, geom_fn in (
    ("rabbit", "race_still_%d.jpg", rabbit_geom),
    ("turtle", "race_still_%d.jpg", turtle_geom),
):
    entries = []
    for si, frame_no in enumerate((18, 51, 87)):
        t = frame_no / FPS
        g = geom_fn(t)
        still = Image.open(f"{OUT}/{path % (si + 1)}").convert("RGB")
        d, w, h = diffmax(still, BGREF)
        pad = 130
        x0 = max(0, int(g["left"]) - pad)
        x1 = min(1080, int(g["left"] + g["imgW"]) + pad)
        ytop = max(0, int(g["top"]) - pad)
        ybot = min(1080, int(g["y"]) + 30)
        rowcounts = []
        for y in range(ytop, ybot):
            c = sum(1 for x in range(x0, x1) if d[y][x] > 30)
            rowcounts.append((y, c))
        content_rows = [y for y, c in rowcounts if c >= 10]
        if content_rows:
            mtop = min(content_rows)
            mbot_feet = max(y for y in content_rows if y <= g["y"] + 2)
            mbot_all = max(content_rows)
            head_to_feet = mbot_feet - mtop + 1
            full = mbot_all - mtop + 1
            expH = g["H"]
            err = (head_to_feet - expH) / expH * 100
            entries.append({
                "frame": frame_no, "src_frame": g["idx"],
                "expected_H": round(expH, 1),
                "measured_head_to_feet": head_to_feet,
                "measured_full_incl_shadow": full,
                "err_pct": round(err, 1),
                "pass_15pct": abs(err) <= 15,
                "present": True,
            })
        else:
            entries.append({"frame": frame_no, "present": False})
    heights[name] = entries
res["sprite_heights"] = heights

with open(f"{OUT}/race_shot_qc_partial.json", "w") as f:
    json.dump(res, f, indent=2)
print(json.dumps(res, indent=2))
