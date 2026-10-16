#!/usr/bin/env python3
"""Turtle-pixel-only diff in window 1: mask = gold shell + olive body, eroded."""
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

def turtle_mask(im, box):
    x0, y0, x1, y1 = box
    z = im[y0:y1, x0:x1].astype(float)
    r, g, b = z[..., 0], z[..., 1], z[..., 2]
    gold = (r > 185) & (g > 140) & (b < 140) & (r > b*1.5)
    olive = (g > 100) & (g >= r*1.02) & (r > 60) & (b < 130) & (g > b*1.2)
    m = gold | olive
    m = erode(m, 2)
    return m

TT = (590, 590, 890, 890)
for f in [327, 331, 361, 371]:
    a = arr(seq('v6', f)); b = arr(seq('v7', f))
    m = turtle_mask(b, TT)
    x0, y0, _, _ = TT
    d = np.abs(a[y0:y0+m.shape[0], x0:x0+m.shape[1]] - b[y0:y0+m.shape[0], x0:x0+m.shape[1]]).mean(axis=2)
    on = d[m]
    print(f'f{f}: mask px={int(m.sum())} mean={on.mean():.3f} p95={np.percentile(on,95):.1f} max={on.max()} frac>10={float((on>10).mean()):.4f}')
