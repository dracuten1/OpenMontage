#!/usr/bin/env python3
"""FIX3-B (v2) — đo path shot1 bằng color-mask, chọn feet bằng CHÍNH tiêu chí probe:
dải 12px dưới feet phải tối đa % pixel dirt (R150-205, G105-155, B65-110, R-B>45),
cửa sổ 200px quanh x_vp, quét y>430. Đổi từ công thức v1 (tâm dải−28) vì shading
sẫm bên trái làm dải "liên tục ≥30px" không tồn tại / rơi vào gap → probe FAIL.
Cột best-ratio <0.45 → fallback lân cận (spec cho phép). → out/fix3_path.json"""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG = os.path.join(ROOT, '..', 'assets', 'scenes', 'sc2_race.png')

bg = np.array(Image.open(BG).convert('RGB').resize((1080, 1080), Image.LANCZOS), dtype=np.int16)
R, G, B = bg[:, :, 0], bg[:, :, 1], bg[:, :, 2]
DIRT = (R >= 150) & (R <= 205) & (G >= 105) & (G <= 155) & (B >= 65) & (B <= 110) & ((R - B) > 45)

COLS = [110, 216, 324, 432, 594, 756, 864, 970]


def strip_ratio(x, y, w=200):
    a, b = max(0, x - w // 2), min(1080, x + w // 2)
    return float(DIRT[y:y + 12, a:b].mean())


def feet_argmax(x):
    """argmax strip_ratio theo y; cụm y liền (r≥0.9·best) → lấy midpoint cho ổn định."""
    best_y, best_r = None, -1.0
    for y in range(431, 1056):
        r = strip_ratio(x, y)
        if r > best_r:
            best_y, best_r = y, r
    lo = hi = best_y
    while lo > 431 and strip_ratio(x, lo - 1) >= 0.9 * best_r:
        lo -= 1
    while hi < 1055 and strip_ratio(x, hi + 1) >= 0.9 * best_r:
        hi += 1
    return (lo + hi) // 2, round(best_r, 3), (lo, hi)


pts = []
for x in COLS:
    y, r, cl = feet_argmax(x)
    pts.append({'x_vp': x, 'feet': float(y), 'best_ratio': r, 'cluster': list(cl),
                'fallback_from': None})

# fallback cột best_ratio < 0.45 (không có đường dirt rộng dưới cửa sổ)
known = [i for i, p in enumerate(pts) if p['best_ratio'] >= 0.45]
for i, p in enumerate(pts):
    if p['best_ratio'] < 0.45:
        j = min(known, key=lambda k: abs(k - i))
        pts[i] = dict(p, feet=pts[j]['feet'], fallback_from=COLS[j])

# POLY: frame theo timing x↔frame CŨ (giữ tốc độ), y% = feet/10.8
OLD = [(1, 12), (27, 35), (60, 55), (81, 75), (108, 97)]  # (frame, x%)


def frame_for_x(xp):
    if xp <= OLD[0][1]:
        return OLD[0][0]
    for k in range(len(OLD) - 1):
        f0, x0 = OLD[k]
        f1, x1 = OLD[k + 1]
        if x0 <= xp <= x1:
            return round(f0 + (xp - x0) / (x1 - x0) * (f1 - f0))
    return OLD[-1][0]


raw = [(p['x_vp'] / 10.8, p['feet'] / 10.8) for p in pts]
poly = [(max(1, frame_for_x(round(xp, 2))), (round(xp, 2), round(yp, 2))) for xp, yp in raw]
poly.sort(key=lambda t: t[0])
# endpoint f108: path chạy tiếp tới x=97% như cũ; y ngoại suy từ 2 điểm cuối
(x1, y1), (x0, y0) = raw[-1], raw[-2]
y108 = min(max(y0 + (y1 - y0) * (97 - x0) / (x1 - x0), 40.0), 95.0)
poly.append((108, (97.0, round(y108, 2))))

out = {'method': 'v2 strip-argmax (probe criterion, dirt windows theo spec)',
       'columns': pts, 'poly': poly, 'poly_line': 'POLY = %r' % (poly,)}
json.dump(out, open(os.path.join(ROOT, 'out', 'fix3_path.json'), 'w'), indent=1)
print(json.dumps(out, indent=1))
print('MEASURE_OK')
