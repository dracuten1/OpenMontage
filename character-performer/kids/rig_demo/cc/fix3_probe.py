#!/usr/bin/env python3
"""FIX3 — road probe: dải 12px DƯỚI chân sprite (t=1.0, t=3.2) phải có ≥60% pixel dirt-color
(R150-205, G105-155, B65-110, R-B>45) — xác nhận thỏ đứng trên đường. → out/qc_self/fix3_road_probe.json"""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
FR, QC = os.path.join(OUT, 'frames'), os.path.join(OUT, 'qc_self')

# POLY đo color-mask v2 — đồng bộ composite.py / out/fix3_path.json
POLY = [(1, (10.19, 91.94)), (10, (20.0, 91.94)), (21, (30.0, 91.94)), (35, (40.0, 93.33)),
        (60, (55.0, 92.59)), (76, (70.0, 90.0)), (87, (80.0, 90.09)), (99, (89.81, 90.09)),
        (108, (97.0, 90.09))]


def pos_at(f):
    for i in range(len(POLY) - 1):
        f0, p0 = POLY[i]
        f1, p1 = POLY[i + 1]
        if f0 <= f <= f1:
            t = (f - f0) / (f1 - f0)
            return (p0[0] + t * (p1[0] - p0[0])) * 10.8, (p0[1] + t * (p1[1] - p0[1])) * 10.8
    return POLY[-1][1][0] * 10.8, POLY[-1][1][1] * 10.8


def dirt(a):
    R, G, B = a[:, :, 0].astype(np.int16), a[:, :, 1].astype(np.int16), a[:, :, 2].astype(np.int16)
    return (R >= 150) & (R <= 205) & (G >= 105) & (G <= 155) & (B >= 65) & (B <= 110) & ((R - B) > 45)


res = {}
for t in (1.0, 3.2):
    f = round(t * 24)
    im = Image.open(os.path.join(FR, 'f%04d.png' % f)).convert('RGBA').transpose(Image.FLIP_TOP_BOTTOM)
    sp = im.crop(im.getbbox())
    Ht = 367
    w = round(sp.width * Ht / sp.height)
    cx, cy = pos_at(f)
    x, y = round(cx - w / 2), round(cy - Ht)
    feet = y + Ht
    jpg = np.array(Image.open(os.path.join(QC, 'fix3_t%s.jpg' % t)).convert('RGB'))
    band = jpg[feet:feet + 12, x:x + w]  # dải 12px dưới chân, rộng bằng sprite
    d = dirt(band)
    ratio = float(d.mean())
    res['t=%.1f' % t] = {'frame': f, 'sprite_w': w, 'x': x, 'feet_y': feet,
                         'band_px': band.shape[0] * band.shape[1], 'dirt_px': int(d.sum()),
                         'dirt_ratio': round(ratio, 4), 'pass': bool(ratio >= 0.60)}

ok = all(v['pass'] for v in res.values())
json.dump(res | {'ok': bool(ok)}, open(os.path.join(QC, 'fix3_road_probe.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
print('ROAD_PROBE_OK' if ok else 'ROAD_PROBE_FAIL')
raise SystemExit(0 if ok else 1)
