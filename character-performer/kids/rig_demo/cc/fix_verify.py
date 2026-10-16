#!/usr/bin/env python3
"""FIX1 verify — 10/10 sprite: render solo (pipeline V-flip) vs V(place(source_png)).
PASS khi: bbox trong ±8px cua V(world_bbox) VA content mean|diff| <= 12/255."""
import json, math, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
SOLO = os.path.join(OUT, 'solo_fix')
META = json.load(open(os.path.join(OUT, 'clean_meta.json')))
P = META['parts']
W, H = 1536, 1024

SPRITES = {  # name -> (png, meta_key) — copy rig_build
    'head': ('head.png', 'head'), 'ear_far': ('ear_tilt.png', 'ear_tilt'),
    'ear_near': ('ear_tilt.png', 'ear_near'), 'body': ('body.png', 'body'),
    'arm_far': ('arm_far.png', 'arm_far'), 'arm_near': ('arm_near.png', 'arm_near'),
    'leg_far': ('leg_left.png', 'leg_left'), 'leg_near': ('leg_left.png', 'leg_right'),
    'mouth': ('../patches/mouth_open.png', 'head'),
    'eyelid': ('../patches/eyelid.png', 'head')}


def place(png_path, mkey):
    """expected canvas (pre-camera): p' = pup + s*M(delta)*(p - piv), y-down."""
    rec = P[mkey]
    piv, pup = rec['pivot_part'], rec['pivot_puppet']
    s, d = rec['scale'], math.radians(rec.get('delta_deg', 0.0) or 0.0)
    cd, sd = math.cos(d), math.sin(d)
    src = Image.open(png_path).convert('RGBA')
    # output->input: src = (1/s) * M^T * (dst - pup) + piv
    a, b, d_, e = cd / s, sd / s, -sd / s, cd / s
    c = piv[0] - (a * pup[0] + b * pup[1])
    f = piv[1] - (d_ * pup[0] + e * pup[1])
    return src.transform((W, H), Image.AFFINE, (a, b, c, d_, e, f), resample=Image.BICUBIC)


def bbox_alpha(arr, th=128):
    ys, xs = np.nonzero(arr[:, :, 3] > th)
    return [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None


rows, n_pass = [], 0
for name, (png, mkey) in SPRITES.items():
    src_path = os.path.join(OUT, 'parts_clean', png)
    exp = place(src_path, mkey).transpose(Image.FLIP_TOP_BOTTOM)  # pipeline V-flip
    ren = Image.open(os.path.join(SOLO, f'solo_{name}.png')).convert('RGBA')
    ra, ea = np.asarray(ren).astype(np.int16), np.asarray(exp).astype(np.int16)

    # bbox ky vọng = alpha bbox cua canvas DA DAT (dung art + transform cua sprite do)
    eb = bbox_alpha(ea)
    rb = bbox_alpha(ra)
    bbox_ok = rb is not None and eb is not None and all(abs(rb[i] - eb[i]) <= 8 for i in range(4))

    m = (ra[:, :, 3] > 128) | (ea[:, :, 3] > 128)
    diff = np.abs(ra[:, :, :3] - ea[:, :, :3])[m].mean() if m.sum() else 255.0
    ok = bool(bbox_ok and diff <= 12.0)
    n_pass += ok
    rows.append((name, rb, eb, diff, ok))

print(f"{'sprite':10} {'render_bbox':18} {'expected_bbox':18} {'mean|diff|':>10}  verdict")
for name, rb, eb, diff, ok in rows:
    print(f"{name:10} {str(rb):18} {str(eb):18} {diff:10.2f}  {'PASS' if ok else 'FAIL'}")
print(f'RESULT: {n_pass}/10 PASS')
print('VERIFY_OK' if n_pass == 10 else 'VERIFY_FAIL')
