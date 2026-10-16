#!/usr/bin/env python3
"""Locate S5 turtle bbox in v6seq/v7seq/v6mp4/v7mp4 at diagnostic frames."""
import subprocess
import tempfile
from pathlib import Path
import numpy as np
from PIL import Image

R = Path('/Users/tuyennguyen/project/OpenMontage')
D = R/'character-performer/kids/turn7'
def arr(p): return np.asarray(Image.open(p).convert('RGB'))
def seq(folder, f): return folder/f'element-{f:04d}.png'
def mp4f(mp4, f):
    with tempfile.NamedTemporaryFile(suffix='.png', dir=str(D), delete=False) as tf:
        p = Path(tf.name)
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(mp4),'-vf',f'select=eq(n\\,{f})','-frames:v','1',str(p)], check=True)
    a = arr(p); p.unlink(); return a

def turtle_bbox(im):
    # back-view turtle: green body on dirt road, top half of frame; exclude tree (right, dark green)
    z = im.astype(float)
    r, g, b = z[...,0], z[...,1], z[...,2]
    m = (g > 95) & (g > r*1.06) & (g > b*1.02) & (r > 60)
    m[:280,:] = False; m[:, 1050:] = False  # tree zone off
    m[900:,:] = False
    lab = np.argwhere(m)
    if not len(lab):
        return None
    y0, x0 = lab.min(axis=0); y1, x1 = lab.max(axis=0)
    if (x1-x0) > 500 or (y1-y0) > 500:  # noise
        return None
    return (int(x0), int(y0), int(x1), int(y1))

for f in [730, 750, 780, 812, 845, 886]:
    row = {'f': f}
    for tag, im in [('v6s', arr(seq(D/'lossless/v6', f))), ('v7s', arr(seq(D/'lossless/v7', f))),
                    ('v6m', mp4f(R/'remotion-composer/out/kids_ep1_remake_v6.mp4', f)),
                    ('v7m', mp4f(R/'remotion-composer/out/kids_ep1_remake_v7.mp4', f))]:
        row[tag] = turtle_bbox(im)
    def cx(b): return None if b is None else round((b[0]+b[2])/2, 1)
    def w(b): return None if b is None else b[2]-b[0]
    print(f"f{f}: v6s={row['v6s']} cx={cx(row['v6s'])} | v7s={row['v7s']} cx={cx(row['v7s'])} | v6m={row['v6m']} cx={cx(row['v6m'])} | v7m={row['v7m']} cx={cx(row['v7m'])}")
    print(f"     widths: v6s={w(row['v6s'])} v7s={w(row['v7s'])} v6m={w(row['v6m'])} v7m={w(row['v7m'])}")
