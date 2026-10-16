#!/usr/bin/env python3
"""FIX1b clip check — alpha bbox moi frame vs canh canvas 1536x1024.
PASS khi 0/216 frame cham canh (bbox == full canvas). Ghi out/clipcheck_fix1.json."""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FR = os.path.join(ROOT, 'out', 'frames')
W, H = 1536, 1024

touch, zmin, zmax = [], 1e9, -1e9
for f in range(1, 217):
    a = np.asarray(Image.open(os.path.join(FR, 'f%04d.png' % f)).convert('RGBA'))[:, :, 3]
    ys, xs = np.nonzero(a > 8)
    if not len(xs):
        touch.append(f); continue
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    zmin, zmax = min(zmin, y0), max(zmax, y1)
    if x0 == 0 or y0 == 0 or x1 == W - 1 or y1 == H - 1:
        touch.append(f)

z_sweep_m = [(H - 1 - zmax) * 13.9 / H, (H - 1 - zmin) * 13.9 / H]  # canvas z=0 o duoi
res = {'n_touch': len(touch), 'touch_frames': touch, 'y0min_y1max': [int(zmin), int(zmax)]}
json.dump(res, open(os.path.join(ROOT, 'out', 'clipcheck_fix1.json'), 'w'), indent=1)
print(json.dumps(res))
print('CLIP_OK' if not touch else 'CLIP_FAIL')
