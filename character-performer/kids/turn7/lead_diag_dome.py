#!/usr/bin/env python3
"""Turtle dome-only diff (solid shell center, no gaps) + spatial split."""
import numpy as np
from PIL import Image
from pathlib import Path

def erode(mask, it=2):
    m = mask.copy()
    for _ in range(it):
        m = m & np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1)
    return m

D = Path('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/turn7')
def seq(v, f): return D/f'lossless/{v}/element-{f:04d}.png'
def arr(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)

def dome_mask(im, box):
    x0, y0, x1, y1 = box
    z = im[y0:y1, x0:x1].astype(float)
    r, g, b = z[..., 0], z[..., 1], z[..., 2]
    gold = (r > 185) & (g > 140) & (b < 140) & (r > b*1.5) & (g < r*1.02)
    return erode(gold, 3)

# solid dome center: sprite box x[481,939] y[625,885]; dome occupies upper-middle
DOME = (560, 640, 870, 790)
for f in [327, 331, 361]:
    a = arr(seq('v6', f)); b = arr(seq('v7', f))
    m = dome_mask(b, DOME)
    x0, y0 = DOME[:2]
    h, w = m.shape
    d = np.abs(a[y0:y0+h, x0:x0+w] - b[y0:y0+h, x0:x0+w]).mean(axis=2)
    on = d[m]
    # where are the diffs? split mask into left/mid/right thirds
    n = m.shape[1]
    lm = m[:, :n//3]; mm = m[:, n//3:2*n//3]; rm = m[:, 2*n//3:]
    print(f'f{f}: dome px={int(m.sum())} mean={on.mean():.3f} p95={np.percentile(on,95):.1f} '
          f'| thirds mean L={d[:, :n//3][lm].mean():.2f} M={d[:, n//3:2*n//3][mm].mean():.2f} R={d[:, 2*n//3:][rm].mean():.2f}')
