#!/usr/bin/env python3
"""Inspect window frames: diff bbox v6 vs v7 + side-by-side board."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

D = Path('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/turn7')
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 26)
def seq(v, f): return D/f'lossless/{v}/element-{f:04d}.png'
def arr(p): return np.asarray(Image.open(p).convert('RGB'))

info = {}
sel = [327, 331, 355, 361, 371, 459, 463, 486, 508, 527, 533]
board = Image.new('RGB', (1100, 345*len(sel)), '#eee')
dr = ImageDraw.Draw(board)
for i, f in enumerate(sel):
    a = arr(seq('v6', f)); b = arr(seq('v7', f))
    d = np.abs(a.astype(np.int16) - b.astype(np.int16))
    ys, xs = np.where(np.any(d > 0, axis=2))
    bbox = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(ys) else None
    info[f] = {'nz': int(np.count_nonzero(d)), 'bbox': bbox,
               'bbox_frac': None if not bbox else round((bbox[2]-bbox[0])*(bbox[3]-bbox[1])/(1080*1080), 3)}
    y = 345*i
    dr.text((20, y+6), f'f{f} = {f/30:.2f}s  nz={info[f]["nz"]} bbox={bbox}', font=font, fill='black')
    im6 = Image.open(seq('v6', f)).convert('RGB').resize((540, 540))
    im7 = Image.open(seq('v7', f)).convert('RGB').resize((540, 540))
    board.paste(im6, (10, y+40)); board.paste(im7, (560, y+40))
board.save(D/'diag_windows.jpg', quality=92)
print(json.dumps(info, indent=1))
print('board:', D/'diag_windows.jpg')
