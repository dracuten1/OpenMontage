#!/usr/bin/env python3
"""FIX5 — patch textures in SOURCE coordinates (head part canvas, 1536x1024).

Patches are now COPIES OF THE HEAD MESH (cc/fix5_patches.py) sharing the head's
UV space, so textures must be drawn where the features live in the head part
texture itself: mouth (1066,538), eyelid/eye (977,483). No puppet-delta math.

Alpha mask = drawn art INTERSECT (head alpha eroded 4px) INTERSECT rect.
Head texture source = out/parts_clean/head.png (the texture the head mesh
actually displays; same UV space as parts/head.png).
"""
import json, os, time
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
PATCH = os.path.join(OUT, 'patches')
os.makedirs(PATCH, exist_ok=True)

HEAD_TEX = os.path.join(OUT, 'parts_clean', 'head.png')

# ---- FIX5 exact numbers (verified diagnostic) ----
MOUTH_AT, MOUTH_W, MOUTH_H, MOUTH_TILT = (1066, 538), 62, 48, -8
MOUTH_FILL, TONGUE_FILL, MOUTH_LINE = (58, 27, 18), (232, 131, 122), (43, 22, 8)  # #3a1b12 #e8837a #2b1608
MOUTH_RECT = [1026, 506, 1104, 572]          # right edge <= 1104

EYE_C = (977, 483)
EL_W, EL_H = 78, 64                          # must cover eye bbox [938,441,1017,525]
EYE_BBOX = [938, 441, 1017, 525]
EL_RECT = [930, 435, 1025, 532]

COUNT_RANGE = {'mouth': (1200, 5000), 'eyelid': (3000, 9000)}
ERODE_PX = 4


def head_eroded_mask():
    """alpha>128 of head texture eroded ERODE_PX."""
    a = np.array(Image.open(HEAD_TEX).convert('RGBA').getchannel('A'))
    m = Image.fromarray(((a > 128) * 255).astype('uint8'))
    m = m.filter(ImageFilter.MinFilter(2 * ERODE_PX + 1))
    return np.array(m) > 0


def rect_mask(rect):
    yy, xx = np.mgrid[0:1024, 0:1536]
    return ((xx >= rect[0]) & (xx <= rect[2]) & (yy >= rect[1]) & (yy <= rect[3]))


def apply_mask(canvas, allow):
    arr = np.array(canvas)
    arr[:, :, 3] = np.where(allow, arr[:, :, 3], 0).astype('uint8')
    return Image.fromarray(arr)


def stats(canvas):
    a = np.array(canvas)[:, :, 3]
    ys, xs = np.nonzero(a > 128)
    if len(xs) == 0:
        return None, 0
    return [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())], int((a > 128).sum())


def sample_fur_line():
    """Ring around the eye (annulus dist 30..50, head alpha>200) — old method, new center."""
    H = np.array(Image.open(HEAD_TEX).convert('RGBA'))
    yy, xx = np.mgrid[0:1024, 0:1536]
    dist = np.sqrt((xx - EYE_C[0]) ** 2 + (yy - EYE_C[1]) ** 2)
    ann = (dist >= 30) & (dist <= 50) & (H[:, :, 3] > 200)
    ys, xs = np.nonzero(ann)
    if len(ys) == 0:
        raise RuntimeError('empty fur annulus around eye %s' % (EYE_C,))
    px = H[ys, xs, :3].astype('float32')
    fur = [int(round(float(np.median(px[:, c])))) for c in range(3)]
    lum = px[:, 0] * 0.299 + px[:, 1] * 0.587 + px[:, 2] * 0.114
    li = int(np.argmin(lum))
    line = [int(v) for v in H[ys[li], xs[li], :3]]
    return fur, line, int(ann.sum())


def mouth_patch(allow_head):
    lay = Image.new('RGBA', (256, 192), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    cx, cy = 128, 96
    rx, ry = MOUTH_W // 2, MOUTH_H // 2
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(*MOUTH_FILL, 255),
              outline=(*MOUTH_LINE, 255), width=7)
    # tongue 38x14 in lower half
    d.ellipse([cx - 19, cy + 3, cx + 19, cy + 17], fill=(*TONGUE_FILL, 255))
    lay = lay.rotate(MOUTH_TILT, resample=Image.BICUBIC, expand=True)
    canvas = Image.new('RGBA', (1536, 1024), (0, 0, 0, 0))
    canvas.alpha_composite(lay, (MOUTH_AT[0] - lay.width // 2, MOUTH_AT[1] - lay.height // 2))
    canvas = apply_mask(canvas, allow_head & rect_mask(MOUTH_RECT))
    path = os.path.join(PATCH, 'mouth_open.png')
    canvas.save(path)

    bbox, n = stats(canvas)
    lo, hi = COUNT_RANGE['mouth']
    exp = [MOUTH_RECT[i] + (-10 if i < 2 else 10) for i in range(4)]
    ok_bbox = bbox is not None and all(bbox[i] >= exp[i] if i < 2 else bbox[i] <= exp[i] for i in range(4))
    return {'bbox_alpha_gt128': bbox, 'px_alpha_gt128': n,
            'range': [lo, hi], 'verify_bbox': bool(ok_bbox),
            'verify_count': bool(lo <= n <= hi), 'path': path}


def eyelid_patch(allow_head, fur, line):
    canvas = Image.new('RGBA', (1536, 1024), (0, 0, 0, 0))
    dr = ImageDraw.Draw(canvas)
    cx, cy = EYE_C
    rx, ry = EL_W // 2, EL_H // 2
    dr.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(*fur, 255))
    # happy closed-eye arc curving UP, 7px border, +3 outset
    dr.arc([cx - rx - 3, cy - ry - 3, cx + rx + 3, cy + ry + 3], 180, 360,
           fill=(*line, 255), width=7)

    def lash(x0_, y0_, x1_, y1_):
        dr.line([x0_, y0_, x1_, y1_], fill=(*line, 255), width=4)
    lash(cx - rx + 1, cy - 2, cx - rx - 8, cy + 8)
    lash(cx + rx - 1, cy - 2, cx + rx + 8, cy + 8)
    lash(cx, cy - ry - 4, cx - 3, cy - ry - 13)
    canvas = apply_mask(canvas, allow_head & rect_mask(EL_RECT))
    path = os.path.join(PATCH, 'eyelid.png')
    canvas.save(path)

    bbox, n = stats(canvas)
    lo, hi = COUNT_RANGE['eyelid']
    exp = [EL_RECT[i] + (-10 if i < 2 else 10) for i in range(4)]
    ok_bbox = bbox is not None and all(bbox[i] >= exp[i] if i < 2 else bbox[i] <= exp[i] for i in range(4))
    # informational only (ellipse geometry is fixed by spec): cover check of eye bbox
    yy, xx = np.mgrid[0:1024, 0:1536]
    ell = (((xx - EYE_C[0]) / rx) ** 2 + ((yy - EYE_C[1]) / ry) ** 2) <= 1.0
    eye = (xx >= EYE_BBOX[0]) & (xx <= EYE_BBOX[2]) & (yy >= EYE_BBOX[1]) & (yy <= EYE_BBOX[3])
    cover = float((ell & eye).sum()) / float(eye.sum())
    return {'bbox_alpha_gt128': bbox, 'px_alpha_gt128': n, 'fur_rgb': fur, 'line_rgb': line,
            'range': [lo, hi], 'verify_bbox': bool(ok_bbox),
            'verify_count': bool(lo <= n <= hi),
            'info_ellipse_cover_of_eye_bbox_pct': round(100 * cover, 1), 'path': path}


if __name__ == '__main__':
    t0 = time.time()
    allow_head = head_eroded_mask() & rect_mask([0, 0, 1535, 1023])
    fur, line, ann_px = sample_fur_line()
    r1 = mouth_patch(allow_head)
    print('[mouth_open]', json.dumps(r1))
    r2 = eyelid_patch(allow_head, fur, line)
    print('[eyelid]', json.dumps(r2))
    meta = {'mouth_open': r1, 'eyelid': r2, 'head_tex': os.path.relpath(HEAD_TEX, ROOT),
            'fur_annulus_px': ann_px, 'erode_px': ERODE_PX,
            'coordinate_space': 'SOURCE (head part canvas 1536x1024, = head mesh UV space)',
            'elapsed_s': round(time.time() - t0, 2)}
    json.dump(meta, open(os.path.join(OUT, 'patch_meta.json'), 'w'), indent=1)
    ok = r1['verify_bbox'] and r1['verify_count'] and r2['verify_bbox'] and r2['verify_count']
    print('PATCHES_OK' if ok else 'PATCHES_FAIL')
    raise SystemExit(0 if ok else 1)
