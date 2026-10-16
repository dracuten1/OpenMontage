#!/usr/bin/env python3
"""Gait pixel measure v2: shell-free leg bands. The composite shell bottom
edge is y~899, so v1 bands (y 820+) were shell-contaminated. v2 measures
x-centroid + tip in y 905..1010 (below shell edge) and re-runs pairwise lag
correlations. Writes out/gait_lag2.json."""
import json, os
import numpy as np
from PIL import Image

ROOT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle'
FR = os.path.join(ROOT, 'out', 'frames_t')
N = 24
BANDS = {
    'leg_near_hind':  (49, 354),
    'leg_far_hind':   (381, 604),
    'leg_near_front': (755, 1109),
    'leg_far_front':  (1110, 1349),
}

def load(f):
    im = Image.open(os.path.join(FR, 'f%04d.png' % f)).convert('RGBA')
    return im.transpose(Image.FLIP_TOP_BOTTOM)

# 1. shell bottom edge per band column (f1) to justify band top
a1 = np.array(load(1).getchannel('A'))
edges = {}
for k, (x0, x1) in BANDS.items():
    e = []
    for x in range(x0, x1, 8):
        ys = np.nonzero(a1[760:960, x] > 200)[0]
        e.append(int(760 + ys.max()) if len(ys) else -1)
    edges[k] = {'shell_edge_max': max(v for v in e if v > 0),
                'shell_edge_min': min(v for v in e if v > 0)}

Y0, Y1 = 905, 1010
cx, ty = {}, {}
for k, (x0, x1) in BANDS.items():
    s, t = [], []
    for f in range(1, N + 1):
        a = np.array(load(f).getchannel('A'))[Y0:Y1, x0:x1] > 128
        ys, xs = np.nonzero(a)
        s.append(float(xs.mean() + x0) if len(xs) else float('nan'))
        t.append(int(Y0 + ys.max()) if len(xs) else -1)
    cx[k], ty[k] = s, t

def lagr(a, b):
    A = np.array([0.0 if v != v else v for v in cx[a]])
    B = np.array([0.0 if v != v else v for v in cx[b]])
    A -= A.mean()
    B -= B.mean()
    best = (-2, None)
    for L in range(-N + 1, N):
        BB = np.concatenate([B[L:], np.zeros(L)]) if L >= 0 else np.concatenate([np.zeros(-L), B[:L]])
        r = float(np.corrcoef(A, BB)[0, 1])
        if r > best[0]:
            best = (r, L)
    return best[1], round(best[0], 4)

pairs = [('leg_near_front', 'leg_far_hind'), ('leg_near_hind', 'leg_far_front'),
         ('leg_near_front', 'leg_near_hind'), ('leg_far_front', 'leg_far_hind')]
lag = {}
for a, b in pairs:
    L, r = lagr(a, b)
    lag['%s_vs_%s' % (a, b)] = {'lag_f': L, 'r': r}

swing = {}
for k in cx:
    A = np.array([0.0 if v != v else v for v in cx[k]])
    A -= A.mean()
    swing[k] = {'x_max_f': int(np.argmax(A)) + 1, 'x_min_f': int(np.argmin(A)) + 1,
                'amp_px': round(float(np.max(A) - np.min(A)), 1),
                'tip_disp_px_y': int(max(ty[k]) - min(ty[k])),
                'n_frames_no_px_below_905': int(sum(1 for v in cx[k] if v != v))}

res = {'band_y': [Y0, Y1], 'shell_edges_f1': edges, 'cx_series': cx,
       'lag': lag, 'expected_lag': {'%s_vs_%s' % p: e for p, e in
                                    zip(pairs, (0, 0, 12, 12))},
       'swing': swing,
       'diagonal_pass': bool(lag['leg_near_front_vs_leg_far_hind']['lag_f'] == 0
                             and lag['leg_near_hind_vs_leg_far_front']['lag_f'] == 0
                             and lag['leg_near_front_vs_leg_near_hind']['lag_f'] in (10, 11, 12, 13, 14)
                             and lag['leg_far_front_vs_leg_far_hind']['lag_f'] in (10, 11, 12, 13, 14))}
json.dump(res, open(os.path.join(ROOT, 'out', 'gait_lag2.json'), 'w'), indent=1)
print('shell edges f1:', json.dumps(edges))
print('lag:', json.dumps(lag, indent=1))
print('swing:', json.dumps(swing, indent=1))
print('DIAGONAL_PASS' if res['diagonal_pass'] else 'DIAGONAL_FAIL')
