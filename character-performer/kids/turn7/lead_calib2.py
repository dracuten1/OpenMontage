#!/usr/bin/env python3
"""Calibrated masks: golden-shell turtle bbox + white-fur rabbit bbox per frame."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

D = Path('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/turn7')
def seq(v, f): return D/f'lossless/{v}/element-{f:04d}.png'
def arr(p): return np.asarray(Image.open(p).convert('RGB'))

def bbox(im, box, kind):
    x0, y0, x1, y1 = box
    z = im[y0:y1, x0:x1].astype(float)
    r, g, b = z[..., 0], z[..., 1], z[..., 2]
    if kind == 'shell':
        m = (r > 190) & (g > 145) & (b < 130) & (r > b*1.7) & (g > b*1.35) & (g < r)
    elif kind == 'fur':
        m = (r > 205) & (g > 205) & (b > 200) & (np.abs(r-g) < 28)
    cols = np.where(m.sum(axis=0) > 8)[0]
    rows = np.where(m.sum(axis=1) > 8)[0]
    if not len(cols):
        return None
    return {'x': int(cols[0])+x0, 'X': int(cols[-1])+x0, 'w': int(cols[-1]-cols[0]+1),
            'y': int(rows[0])+y0, 'Y': int(rows[-1])+y0}

TB = (540, 540, 980, 930)
RB = (150, 540, 640, 930)
res = {}
for f in [326, 327, 331, 346, 361, 371, 372, 450, 459, 463, 486, 508, 527, 533, 534]:
    a6 = arr(seq('v6', f)); a7 = arr(seq('v7', f))
    res[f] = {'t_v6': bbox(a6, TB, 'shell'), 't_v7': bbox(a7, TB, 'shell'),
              'r_v6': bbox(a6, RB, 'fur'), 'r_v7': bbox(a7, RB, 'fur')}
    t6, t7 = res[f]['t_v6'], res[f]['t_v7']
    r6, r7 = res[f]['r_v6'], res[f]['r_v7']
    print(f"f{f}: TURTLE v6={t6 and (t6['w'], t6['x'], t6['X'])} v7={t7 and (t7['w'], t7['x'], t7['X'])} | RABBIT v6={r6 and (r6['w'], r6['x'], r6['X'])} v7={r7 and (r7['w'], r7['x'], r7['X'])}")
(D/'calib_masks.json').write_text(json.dumps({str(k): v for k, v in res.items()}, indent=1))
