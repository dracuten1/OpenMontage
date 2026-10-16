#!/usr/bin/env python3
"""Diagnose the 31 differing frames OUTSIDE the two edit windows."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

D = Path('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/turn7')
V6S = D/'lossless/v6'; V7S = D/'lossless/v7'
def seq(folder, f): return folder/f'element-{f:04d}.png'
def arr(p): return np.asarray(Image.open(p).convert('RGB'))

in_win = lambda f: (327 <= f < 372) or (459 <= f < 534)
bad = []
for f in range(1230):
    if in_win(f):
        continue
    d = np.abs(arr(seq(V6S, f)).astype(np.int16) - arr(seq(V7S, f)).astype(np.int16))
    nz = np.count_nonzero(d)
    if nz:
        ys, xs = np.where(np.any(d > 0, axis=2))
        bad.append({'frame': f, 'px': int(nz), 'bbox': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]})
print(json.dumps(bad, indent=1))
print('seconds:', [round(b['frame']/30, 2) for b in bad])
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 22)
sel = [b['frame'] for b in bad[:4]] + [b['frame'] for b in bad[len(bad)//2:len(bad)//2+2]]
board = Image.new('RGB', (1100, 345*len(sel)), '#eee')
dr = ImageDraw.Draw(board)
for i, f in enumerate(sel):
    a6 = Image.open(seq(V6S, f)).convert('RGB').resize((540, 540))
    a7 = Image.open(seq(V7S, f)).convert('RGB').resize((540, 540))
    y = 345*i
    dr.text((20, y+8), f'f{f} = {f/30:.2f}s  LEFT v6 | RIGHT v7', font=font, fill='black')
    board.paste(a6, (10, y+40)); board.paste(a7, (560, y+40))
board.save(D/'diag_outside_diff.jpg', quality=92)
print('board:', D/'diag_outside_diff.jpg')
