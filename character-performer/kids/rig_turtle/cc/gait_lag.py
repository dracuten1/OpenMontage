#!/usr/bin/env python3
"""Render-2 gait rigor: x-centroid lag correlation per leg pair (decisive
diagonal-phase measure) + neck-gap geometry f1 vs f13 (where, and what
coverage exists in the source sprites). Writes out/gait_lag.json."""
import json, os
import numpy as np
from PIL import Image

ROOT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle'
FR = os.path.join(ROOT, 'out', 'frames_t')
OUT = os.path.join(ROOT, 'out', 'gait_lag.json')

BANDS = {
    'leg_near_hind':  (49, 354),
    'leg_far_hind':   (381, 604),
    'leg_near_front': (755, 1109),
    'leg_far_front':  (1110, 1349),
}
Y0, Y1 = 820, 1010
N = 24

def load(f):
    im = Image.open(os.path.join(FR, 'f%04d.png' % f)).convert('RGBA')
    return im.transpose(Image.FLIP_TOP_BOTTOM)

# ---- 1. x-centroid series f1..24 per band (threshold-insensitive: use
#         alpha-weighted centroid over band) ----
cx = {}
for k, (x0, x1) in BANDS.items():
    s = []
    for f in range(1, N + 1):
        a = np.array(load(f).getchannel('A'), dtype='float32')[Y0:Y1, x0:x1]
        m = a > 128
        ys, xs = np.nonzero(m)
        s.append(float(xs.mean() + x0))
    cx[k] = s

def detrend(s):
    s = np.array(s) - np.mean(s)
    return s

def best_lag(a, b):
    """lag L maximizing corr(a, roll(b, L)); returns (L, r). L>0: b delayed by L."""
    a, b = detrend(cx[a]), detrend(cx[b])
    best = (-1, None)
    for L in range(-N + 1, N):
        if L >= 0:
            bb = np.concatenate([b[L:], np.zeros(L)])
        else:
            bb = np.concatenate([np.zeros(-L), b[:L]])
        r = float(np.corrcoef(a, bb)[0, 1])
        if r > best[0]:
            best = (r, L)
    return best[1], round(best[0], 4)

pairs = [('leg_near_front', 'leg_far_hind'),
         ('leg_near_hind', 'leg_far_front'),
         ('leg_near_front', 'leg_near_hind'),
         ('leg_far_front', 'leg_far_hind')]
lag = {}
for a, b in pairs:
    L, r = best_lag(a, b)
    lag['%s_vs_%s' % (a, b)] = {'lag_f': L, 'r': r}

# also argmax |x| swing frame per leg (stride phase directly)
swing_peak = {}
for k in cx:
    s = detrend(cx[k])
    swing_peak[k] = {'x_max_frame_1based': int(np.argmax(s)) + 1,
                     'x_min_frame_1based': int(np.argmin(s)) + 1,
                     'amp_px': round(float(s.max() - s.min()), 1)}

res = {'x_centroid_series': {k: [round(v, 2) for v in cx[k]] for k in cx},
       'lag_corr': lag,
       'expected_lag': {('%s_vs_%s' % (a, b)): e for (a, b), e in
                        zip(pairs, (0, 0, 12, 12))},
       'swing_peak': swing_peak}

# ---- 2. neck gap geometry: f1 vs f13, columns + y-ranges; sprite coverage ----
NX0, NX1, NYT, NYB = 850, 1160, 380, 760

def gaps(f):
    a = np.array(load(f).getchannel('A'))
    out = []
    for x in range(NX0, NX1):
        col = a[NYT:NYB, x]
        op = np.nonzero(col > 200)[0]
        if len(op) < 2:
            continue
        lo, hi = int(op.min()), int(op.max())
        seg = col[lo:hi] < 10
        # longest run
        best = cur = 0
        best_ys = None
        cur_y0 = None
        for i, v in enumerate(seg):
            if v:
                if cur == 0:
                    cur_y0 = i
                cur += 1
                if cur > best:
                    best, best_ys = cur, (NYT + cur_y0, NYT + cur_y0 + cur - 1)
            else:
                cur = 0
        if best >= 8:
            out.append({'x': x, 'gap_px': best, 'y': best_ys})
    return out

g1, g13 = gaps(1), gaps(13)
res['neck_gap_f1'] = {'n_cols_ge8px': len(g1), 'worst': max(g1, key=lambda d: d['gap_px']) if g1 else None}
res['neck_gap_f13'] = {'n_cols_ge8px': len(g13), 'worst': max(g13, key=lambda d: d['gap_px']) if g13 else None,
                       'cols': sorted({d['x'] for d in g13})}

# sprite coverage in the f13 gap columns (upright part-space == canvas space)
head_c = np.array(Image.open(os.path.join(ROOT, 'out', 'parts', 'head.png')).convert('RGBA'))
shell_c = np.array(Image.open(os.path.join(ROOT, 'out', 'parts', 'shell.png')).convert('RGBA'))
cov = []
for d in g13:
    x = d['x']
    y0, y1 = d['y']
    cov.append({'x': x, 'gap_y': [y0, y1], 'gap_px': d['gap_px'],
                'head_a_gap_min': int(head_c[y0:y1 + 1, x, 3].min()),
                'shell_a_gap_min': int(shell_c[y0:y1 + 1, x, 3].min())})
res['neck_gap_f13_coverage'] = cov[:60]

json.dump(res, open(OUT, 'w'), indent=1)
print('LAG:', json.dumps(lag, indent=1))
print('SWING PEAKS:', json.dumps(swing_peak))
print('neck f1 cols>=8px:', res['neck_gap_f1']['n_cols_ge8px'], 'f13:', res['neck_gap_f13']['n_cols_ge8px'])
print('f13 worst:', res['neck_gap_f13']['worst'])
print('GAIT_LAG_OK')
