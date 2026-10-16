"""RACE FIX1 — pin-math param evaluator (pre-render).

Predicts, per candidate (L_r, L_t, CAP):
- A1 at t=0.6/1.7/2.9: per-frame content widths wR/wT (alpha bbox of the
  actual source frame), center dx, threshold 0.5*(wR+wT)-0.25*min, margin,
  bbox gap (dx - (wR+wT)/2).
- A2 at t=0.3/1.2/2.1/2.9: dirt ratio of a 12px band starting 34px below
  each sprite's feet (past shadow blur reach), across the sprite's per-frame
  content columns, sampled on BGREF (bg-only; render check follows later).
- Road geometry: dirt run width around centerline at probed feet rows.
"""
import json
from PIL import Image
import numpy as np

ROOT = "/Users/tuyennguyen/project/OpenMontage"
REMAKE = f"{ROOT}/remotion-composer/public/character-performer/kids/remake"
BG = f"{ROOT}/remotion-composer/public/character-performer/kids/ep1_v2/bg6_walk.png"

REGALL = json.load(open(f"{REMAKE}/reg.json"))
REG = {k: REGALL[k] for k in ("rig_rabbit_run", "rig_turtle_walk")}
X = [556, 524, 508, 572, 540]
Y = [972, 810, 648, 518, 400]


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


_frame_cache = {}


def frame_bbox(rid, idx):
    """per-frame alpha bbox (x0,x1) in source px, cached"""
    key = (rid, idx)
    if key not in _frame_cache:
        im = Image.open(f"{REMAKE}/{rid}/f{idx:04d}.png").convert("RGBA")
        a = np.array(im.getchannel("A"))
        ys, xs = np.where(a > 10)
        _frame_cache[key] = (int(xs.min()), int(xs.max()))
    return _frame_cache[key]


def geom(spr, t, L, CAP, Hrng):
    if spr == "turtle":
        u = CAP * clamp01(t / 3.4)
        g = REG["rig_turtle_walk"]
        ks = [v + L for v in X]
        idx = 1 + int(t * 24 // 1)
    else:
        u = clamp01((t - 0.3) / 3.0)
        g = REG["rig_rabbit_run"]
        ks = [v + L for v in X]
        idx = 1 + int((t - 0.3) * 24 // 1)
        Hrng = [400, 170]
    H = ip(u, [0, 1], Hrng)
    x, y = polyLerp(ks, u), polyLerp(Y, u)
    imgH = H / g["chf"]
    imgW = imgH * (g["w"] / g["h"])
    left = x - imgW * g["cx"]
    top = y - imgH * g["b"]
    idx = min(97 if spr == "turtle" else 108, max(1, idx))
    bx0, bx1 = frame_bbox("rig_turtle_walk" if spr == "turtle" else "rig_rabbit_run", idx)
    cx0 = left + imgW * (bx0 / g["w"])
    cx1 = left + imgW * (bx1 / g["w"])
    return {"u": u, "idx": idx, "x": x, "y": y, "H": H, "imgW": imgW,
            "left": left, "top": top, "w": cx1 - cx0, "c0": cx0, "c1": cx1}


BGREF = np.asarray(
    Image.open(BG).convert("RGB").resize((1620, 1080), Image.BILINEAR)
    .crop((270, 0, 1350, 1080))
).astype(np.int16)


def dirt(a):
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    return ((R >= 150) & (R <= 205) & (G >= 105) & (G <= 155) &
            (B >= 65) & (B <= 110) & ((R - B) > 45))


def dirt_bg6(a):
    """bg6-calibrated dirt predicate (see report: fix3 ranges don't cover
    bg6's road, measured R 210..250). Keeps the fix3 STRUCTURE (R>G>B,
    strong R-B) with bg6-measured ranges; rejects grass (G>=R)."""
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    return ((R >= 195) & (R <= 255) & (G >= 95) & (G <= 185) &
            (B >= 35) & (B <= 130) & ((R - B) > 45) & ((R - G) >= 35))


def band_ratio(g):
    y0 = int(round(g["y"])) + BAND0
    x0 = max(0, int(round(g["c0"])))
    x1 = min(1080, int(round(g["c1"])))
    band = BGREF[y0:y0 + 12, x0:x1]
    if band.size == 0:
        return 0.0, 0.0, x0, x1, y0
    return (float(dirt(band).mean()), float(dirt_bg6(band).mean()),
            x0, x1, y0)


def road_width_at(cx, y):
    row = dirt_bg6(BGREF[y:y + 1, :])[0]
    x = int(round(cx))
    if not row[x]:
        # nearest dirt px
        xs = np.where(row)[0]
        if len(xs) == 0:
            return None
        x = int(xs[np.argmin(np.abs(xs - x))])
    lo = x
    while lo > 0 and row[lo - 1]:
        lo -= 1
    hi = x
    while hi < 1079 and row[hi + 1]:
        hi += 1
    return lo, hi, hi - lo + 1


CANDS = [
    # (L_r, L_t, CAP, turtle H schedule)
    (95, -135, 0.62, [205, 120]),
    (90, -130, 0.62, [205, 120]),
    (95, -135, 0.55, [205, 120]),
]

# band start below feet (clear of shadow reach); report shadow extent later
BAND0 = 40

for (Lr, Lt, CAP, Ht) in CANDS:
    print(f"\n=== L_r={Lr} L_t={Lt} CAP={CAP} turtleH={Ht} ===")
    for t in (0.6, 1.7, 2.9):
        gt = geom("turtle", t, Lt, CAP, Ht)
        gr = geom("rabbit", t, Lr, CAP, Ht)
        wR, wT = gr["w"], gt["w"]
        dx = gr["x"] - gt["x"]
        thr = 0.5 * (wR + wT) - 0.25 * min(wR, wT)
        print(f" t={t}: wR={wR:.0f} wT={wT:.0f} dx={dx:.0f} thr={thr:.0f} "
              f"margin={dx - thr:.0f} bboxgap={dx - (wR + wT) / 2:.0f} "
              f"rab_right={gr['c1']:.0f} tur_right={gt['c1']:.0f}")
    for t in (0.3, 1.2, 2.1, 2.9):
        for spr, L in (("turtle", Lt), ("rabbit", Lr)):
            g = geom(spr, t, L, CAP, Ht)
            rfix, rbg6, x0, x1, y0 = band_ratio(g)
            rw = road_width_at(g["x"], min(1075, int(round(g["y"])) + 40))
            print(f" t={t} {spr}: dirt_fix3={rfix:.3f} dirt_bg6={rbg6:.3f} "
                  f"cols=[{x0},{x1}] bandY={y0} "
                  f"feet=({g['x']:.0f},{g['y']:.0f}) H={g['H']:.0f} "
                  f"road_fix3={rw}")
