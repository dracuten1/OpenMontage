#!/usr/bin/env python3
"""FIX5 smoke QC — numeric face-region diffs on composite frames (PIL only).

Pairs (adjacent frames, so idle body motion is negligible):
  mouth: c0116 (closed) vs c0117 (open)   -> face region, expect > 300 px
  blink: c0133 (lid full) vs c0134 (lid open) -> eye region, expect > 500 px
Regions are fixed around the talk anchor (cx 0.32*1080, feet cy 0.88*1080);
head sits ~100-170px above the feet line.
"""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMP = os.path.join(ROOT, 'out', 'comp')

CX = round(0.32 * 1080)          # 346
# Bands anchored on MEASURED feature positions in composite space
# (lid comp x 397-434 y 709-744; mouth comp x 438-463 y 742-764;
#  raw file coords are V-flipped, composite un-flips them)
FACE = (196, 680, 496, 790)   # (l, t, r, b) window around mouth+eye
EYE = (196, 695, 496, 760)
THR = 25


def diff_count(fa, fb, region):
    a = np.array(Image.open(os.path.join(COMP, 'c%04d.png' % fa)).convert('RGB'), dtype='int16')
    b = np.array(Image.open(os.path.join(COMP, 'c%04d.png' % fb)).convert('RGB'), dtype='int16')
    d = np.abs(a - b).max(axis=2)
    l, t, r, bt = region
    m = d[t:bt, l:r] > THR
    n = int(m.sum())
    ys, xs = np.nonzero(m)
    cen = [int(xs.mean()) + l, int(ys.mean()) + t] if n else None
    return n, cen


def main():
    res = {}
    n, cen = diff_count(116, 117, FACE)
    res['mouth_116vs117_face_px'] = n
    res['mouth_diff_centroid'] = cen
    n2, cen2 = diff_count(133, 134, EYE)
    res['blink_133vs134_eye_px'] = n2
    res['blink_diff_centroid'] = cen2
    # control: two frames both lid-open, mouth closed (no patch change expected)
    n3, _ = diff_count(133, 133, EYE)  # sanity zero
    res['sanity_selfdiff'] = n3
    ok = res['mouth_116vs117_face_px'] > 300 and res['blink_133vs134_eye_px'] > 500
    res['regions'] = {'face': list(FACE), 'eye': list(EYE), 'thr': THR}
    res['ok'] = bool(ok)
    json.dump(res, open(os.path.join(ROOT, 'out', 'fix5_smoke.json'), 'w'), indent=1)
    print('[fix5_smoke]', json.dumps(res))
    print('FIX5_SMOKE_OK' if ok else 'FIX5_SMOKE_FAIL')


if __name__ == '__main__':
    main()
