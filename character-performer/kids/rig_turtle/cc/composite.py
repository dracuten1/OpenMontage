#!/usr/bin/env python3
"""TURTLE BUOC 6 — composite FIX5/C + probes.

Raw frames V-FLIPPED (FIX1) → load flipud. WIN fixed = union bbox (do 1 lan
tren 248f) pad 12px; k = 443/win_h (const, KHONG normalize H per-frame).
Canvas out 960x540, bottom-center anchor + contact shadow ellipse.
Probes: (a) mouth open diff cue, (b) blink diff, (c) leg tip pk-pk + head sway
px, (d) khong clip window (content trong WIN moi frame), (e) edge trang o
mep WIN.
"""
import json
import os
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FR = os.path.join(ROOT, 'out', 'frames_t')
COMP = os.path.join(ROOT, 'out', 'comp_t')
os.makedirs(COMP, exist_ok=True)
META = json.load(open(os.path.join(ROOT, 'out', 'parts_meta.json')))
ANIM = json.load(open(os.path.join(ROOT, 'out', 'anim_meta.json')))
N = 248
t0 = time.time()

# ---------- pass 1: do union bbox (sau un-flip) ----------
bboxes = []
for f in range(1, N + 1):
    a = np.array(Image.open(os.path.join(FR, 'f%04d.png' % f)).convert('RGBA'))[:, :, 3]
    ys, xs = np.nonzero(a > 10)
    bboxes.append((int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())))
ux0 = min(b[0] for b in bboxes); uy0 = min(b[1] for b in bboxes)
ux1 = max(b[2] for b in bboxes); uy1 = max(b[3] for b in bboxes)
PAD = 12
WIN = (max(0, ux0 - PAD), max(0, uy0 - PAD), min(1535, ux1 + PAD), min(1023, uy1 + PAD))
K = 443.0 / (WIN[3] - WIN[1])
print('[comp] union bbox [%d,%d,%d,%d] WIN=%s K=%.5f' % (ux0, uy0, ux1, uy1, WIN, K))

# ---------- pass 2: composite ----------
OW, OH = 960, 540
ANCHOR = (OW // 2, int(0.9 * OH))
out_meta = {'win': WIN, 'k': K, 'canvas': [OW, OH], 'anchor': ANCHOR}
comp_frames = []
for f in range(1, N + 1):
    im = Image.open(os.path.join(FR, 'f%04d.png' % f)).convert('RGBA').transpose(Image.FLIP_TOP_BOTTOM)
    crop = im.crop(WIN)
    w2, h2 = int(round(crop.width * K)), int(round(crop.height * K))
    sp = crop.resize((w2, h2), Image.LANCZOS)
    canvas = Image.new('RGBA', (OW, OH), (0, 0, 0, 0))
    # shadow: ellipse duoi chan
    d = ImageDraw.Draw(canvas)
    sw, sh = int(w2 * 0.52), int(h2 * 0.055)
    cx, cy = ANCHOR
    d.ellipse((cx - sw // 2, cy - sh // 2 + 6, cx + sw // 2, cy + sh // 2 + 6), fill=(30, 26, 18, 90))
    canvas = canvas.filter(ImageFilter.GaussianBlur(3))
    canvas.alpha_composite(sp, (cx - w2 // 2, cy - h2))
    canvas.save(os.path.join(COMP, 'c%04d.png' % f))
    comp_frames.append((f, canvas))
print('[comp] %d frames, %.1fs' % (N, time.time() - t0))

# ---------- probes ----------
A = lambda f: np.array(Image.open(os.path.join(COMP, 'c%04d.png' % f)).convert('RGBA')).astype(int)


def diffpx(fa, fb, region=None):
    a, b = A(fa), A(fb)
    d = np.abs(a - b).max(axis=2) > 25
    if region:
        d[:region[1], :] = False; d[region[3]:, :] = False
        d[:, :region[0]] = False; d[:, region[2]:] = False
    ys, xs = np.nonzero(d)
    return int(d.sum()), ([int(xs.mean()), int(ys.mean())] if len(xs) else None)

probes = {}
# (a) mouth: frame closed vs open trong talk — dung opens[0] tu anim
opens = []
raw = json.load(open(os.path.join(ROOT, '..', 'dialogue_v2', 'd5_cues.json')))['mouthCues']
F0 = ANIM['f_talk0']
for c in raw:
    if c['value'] in ('X', 'C'):
        continue
    a = round(c['start'] * 24) + F0; b = round(c['end'] * 24) + F0
    if opens and a <= opens[-1][1] + 1:
        opens[-1] = (opens[-1][0], max(opens[-1][1], b))
    else:
        opens.append((a, max(b, a + 3)))
mx = 0
for a, b in opens:
    mx = max(mx, b)
face = [ANCHOR[0] - 260, 0, ANCHOR[0] + 260, OH]
d_a, c_a = diffpx(opens[0][0], opens[0][0] + 2, face)
probes['mouth_open_px'] = d_a
# (b) blink
BLINKS = (124, 172, 216)
d_b, c_b = diffpx(BLINKS[0] + 1, BLINKS[0] - 1, [ANCHOR[0] - 200, 0, ANCHOR[0] + 200, int(0.75 * OH)])
probes['blink_px'] = d_b
# (c) motion: leg tip pk-pk + head sway — do tren RAW (un-flip), canvas coords
feet_rows = [b[3] for b in bboxes[:96]]
heads = []
for f in (1, 7, 13, 19):
    a = np.array(Image.open(os.path.join(FR, 'f%04d.png' % f)).convert('RGBA')).transpose(Image.FLIP_TOP_BOTTOM)
    al = a[:, :, 3] > 10
    reg = al[200:560, 900:1500]
    ys, xs = np.nonzero(reg)
    heads.append((xs.mean(), ys.mean()) if len(xs) else (0, 0))
sway = max(h[0] for h in heads) - min(h[0] for h in heads)
probes['head_sway_px'] = round(sway, 1)
h_min = min(b[3] - b[1] for b in bboxes[:96])
h_max = max(b[3] - b[1] for b in bboxes[:96])
probes['walk_h_ratio'] = round(h_max / h_min, 3)
# (d) clip: moi frame content nam trong WIN (pass 1 da do union — pass)
probes['clip'] = False
# (e) edge: 2px tai ria WIN phai trong suot moi frame
edge_ok = True
for f in range(1, N + 1, 8):
    a = np.array(Image.open(os.path.join(FR, 'f%04d.png' % f)).convert('RGBA'))
    for sl in (slice(None),):
        if a[:, WIN[0]:WIN[0] + 2, 3].max() > 10 or a[:, WIN[2] - 2:WIN[2], 3].max() > 10:
            edge_ok = False
probes['win_margin_ok'] = bool(edge_ok)
ok = (300 <= d_a <= 9000) and d_b > 300 and sway > 4 and h_max / h_min >= 1.02 and edge_ok
probes['pass'] = bool(ok)
json.dump({**out_meta, 'probes': probes}, open(os.path.join(ROOT, 'out', 'comp_t_meta.json'), 'w'), indent=1)
print('[probe]', json.dumps(probes))
print('COMPOSITE_OK' if ok else 'COMPOSITE_FAIL')
