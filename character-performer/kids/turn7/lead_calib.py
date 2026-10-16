#!/usr/bin/env python3
"""Sample turtle/shell colors (v6 f361) + banner widths to calibrate gates."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

D = Path('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/turn7')
def seq(v, f): return D/f'lossless/{v}/element-{f:04d}.png'
def arr(p): return np.asarray(Image.open(p).convert('RGB'))

# 1) turtle region colors in v6 f361 (turtle ~x560-920 y560-900 per vision boards)
z = arr(seq('v6', 361))[560:900, 560:920].reshape(-1, 3).astype(float)
for lo, hi, name in [(0, 60, 'dark'), (60, 120, 'mid'), (120, 200, 'bright'), (200, 256, 'very bright')]:
    sel = z[(z.mean(axis=1) >= lo) & (z.mean(axis=1) < hi)]
    if len(sel):
        print(f'{name}: n={len(sel)} mean rgb={sel.mean(axis=0).round(0)}')
# golden candidates
gold = z[(z[:,0] > 180) & (z[:,1] > 120) & (z[:,2] < 140)]
print('gold px:', len(gold), 'mean', gold.mean(axis=0).round(0) if len(gold) else None)
olive = z[(z[:,1] > 90) & (z[:,1] > z[:,0]*1.05) & (z[:,0] > 50) & (z[:,2] < 120)]
print('olive px:', len(olive), 'mean', olive.mean(axis=0).round(0) if len(olive) else None)

# 2) banner widths (turn5 method)
def banner_width(im):
    a = im.astype(float)
    band = a[80:420, :, :]
    r, g, b = band[..., 0], band[..., 1], band[..., 2]
    red = (r > 130) & (r > g*1.6) & (r > b*1.6)
    cols = red.sum(axis=0)
    idx = np.where(cols > 8)[0]
    return (int(idx[0]), int(idx[-1]), int(idx[-1]-idx[0]+1)) if len(idx) else None

for f in [326, 327, 331, 361, 371, 372, 450, 459, 463, 486, 508, 527, 533, 534]:
    print(f'f{f} v6={banner_width(arr(seq("v6", f)))} v7={banner_width(arr(seq("v7", f)))}')
