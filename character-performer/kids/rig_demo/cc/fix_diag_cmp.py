#!/usr/bin/env python3
"""FIX1 diag — so head_pre.png voi 3 gia thuyet: upright / in-place vflip / global canvas vflip."""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
DIAG = os.path.join(OUT, 'fix_diag')
META = json.load(open(os.path.join(OUT, 'clean_meta.json')))
P = META['parts']

H = P['head']
bb_src = H['bbox_clean']            # [695,332,1108,646] trong canvas part
bb_want = [int(round(v)) for v in H['world_bbox']]  # [585,211,998,525] puppet canvas
W, Hc = 1536, 1024

src = Image.open(os.path.join(OUT, 'parts_clean', 'head.png')).convert('RGBA')
crop = src.crop(bb_src)
w, h = bb_want[2] - bb_want[0], bb_want[3] - bb_want[1]
if abs(crop.width - w) > 2 or abs(crop.height - h) > 2:
    crop = crop.resize((w, h), Image.LANCZOS)
    print(f'[diag] head resize {bb_src} -> {w}x{h} (scale~{H["scale"]})')


def paste_on(c, x, y):
    cv = Image.new('RGBA', (W, Hc), (0, 0, 0, 0))
    cv.paste(c, (x, y), c)
    return cv


def vflip_canvas(im):
    return im.transpose(Image.FLIP_TOP_BOTTOM)


cands = {
    'A_upright': paste_on(crop, bb_want[0], bb_want[1]),
    'B_inplace_vflip': paste_on(crop.transpose(Image.FLIP_TOP_BOTTOM), bb_want[0], bb_want[1]),
    'C_global_vflip': vflip_canvas(paste_on(crop, bb_want[0], bb_want[1])),
}

ren = Image.open(os.path.join(DIAG, 'head_pre.png')).convert('RGBA')
ra = np.asarray(ren).astype(np.int16)


def bbox_alpha(im, th=128):
    a = np.asarray(im)[:, :, 3]
    ys, xs = np.nonzero(a > th)
    return [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None


rb = bbox_alpha(ren)
print(f'[diag] render bbox (PIL, y-down) = {rb}')
print(f'[diag] world_bbox meta           = {bb_want}')
print(f'[diag] V(world_bbox)             = {[bb_want[0], Hc - bb_want[3], bb_want[2], Hc - bb_want[1]]}')

for name, im in cands.items():
    ca = np.asarray(im).astype(np.int16)
    m = (ra[:, :, 3] > 128) | (ca[:, :, 3] > 128)
    d = np.abs(ra[:, :, :3] - ca[:, :, :3])[m]
    print(f'{name}: mean|diff| = {d.mean():.2f}/255  (n={m.sum()})')

print('DIAG_CMP_OK')
