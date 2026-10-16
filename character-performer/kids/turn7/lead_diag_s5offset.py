#!/usr/bin/env python3
"""Measure turtle displacement v6seq vs v7seq via SAD template search in the diff region."""
from pathlib import Path
import numpy as np
from PIL import Image

D = Path('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/turn7')
def seq(folder, f): return folder/f'element-{f:04d}.png'
def arr(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)

def best_offset(a6, a7, box, pad=24):
    x0, y0, x1, y1 = box
    tpl = a7[y0+4:y1-4, x0+4:x1-4]
    best = (1e18, None)
    for dy in range(-pad, pad+1):
        for dx in range(-pad, pad+1):
            yy0, yy1 = y0+4+dy, y1-4+dy
            xx0, xx1 = x0+4+dx, x1-4+dx
            if yy0 < 0 or xx0 < 0 or yy1 > a6.shape[0] or xx1 > a6.shape[1]:
                continue
            sad = np.abs(a6[yy0:yy1, xx0:xx1] - tpl).mean()
            if sad < best[0]:
                best = (sad, (dx, dy))
    return best

cases = [730, 731, 750, 752, 780, 812, 845, 869, 886]
for f in cases:
    # localize diff bbox first
    d = np.abs(arr(seq(D/'lossless/v6', f)) - arr(seq(D/'lossless/v7', f)))
    ys, xs = np.where(np.any(d > 0, axis=2))
    if not len(ys):
        print(f'f{f}: identical'); continue
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    a6 = arr(seq(D/'lossless/v6', f)); a7 = arr(seq(D/'lossless/v7', f))
    sad, off = best_offset(a6, a7, (int(x0), int(y0), int(x1), int(y1)))
    print(f'f{f}: diffbox=({x0},{y0},{x1},{y1}) size {x1-x0}x{y1-y0} | best offset (dx,dy)={off} residual SAD={sad:.2f}')
