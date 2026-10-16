#!/usr/bin/env python3
"""FIX-LOOP5 numeric probes (PIL/numpy, no image reads by agent).

(a) talk mouth-open: mid open-cue comp frame vs nearest preceding closed frame
    (<=0.3s earlier), face window = sprite_cx +/-120px x face rows. PASS 300..6000.
    Mouth keys (rig_animate): first open seg (116,131): f116=0 closed, 117..131=1 open.
    Mid cue 123; nearest preceding closed = 116 (7f = 0.292s <= 0.3s).
(b) run raw heights: f1..f108 raw (V-flipped) alpha-bbox content H min/max. PASS >=1.15.
(c) blink: c0133 (lid full) vs c0134 (lid open) eye window. PASS > 500.
Diff metric = smoke convention: max-channel |diff| > 25.
"""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
FR = os.path.join(OUT, 'frames')
COMP = os.path.join(OUT, 'comp')

CX = round(0.32 * 1080)                 # sprite_cx talk = 346
FACE = (CX - 120, 680, CX + 120, 790)   # sprite_cx +/-120, face rows
EYE = (196, 695, 496, 760)              # smoke convention band on eyes
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
    res = {'thr': THR, 'regions': {'face': list(FACE), 'eye': list(EYE)}}

    # (a) mouth open: mid-cue 123 vs closed 116 (+ adjacent pair 116/117 as diagnostic)
    n_mid, cen_mid = diff_count(116, 123, FACE)
    n_adj, _ = diff_count(116, 117, FACE)
    res['talk_mouth'] = {
        'open_seg_frames': [116, 131], 'mid_frame': 123, 'closed_frame': 116,
        'gap_s': round((123 - 116) / 24, 4), 'changed_px': n_mid,
        'centroid': cen_mid, 'pass': bool(300 <= n_mid <= 6000),
        'diag_adjacent_pair_116_117_px': n_adj}

    # (b) run raw content heights f1..f108 (flipped, alpha bbox)
    hs = {}
    for f in range(1, 109):
        with Image.open(os.path.join(FR, 'f%04d.png' % f)) as im:
            b = im.convert('RGBA').transpose(Image.FLIP_TOP_BOTTOM).getchannel('A').getbbox()
        hs[f] = (b[3] - b[1] + 1) if b else 0
    hmin, hmax = min(hs.values()), max(hs.values())
    fmin = min(hs, key=hs.get); fmax = max(hs, key=hs.get)
    res['run_raw_heights'] = {
        'n_frames': len(hs), 'h_min': hmin, 'h_min_frame': fmin,
        'h_max': hmax, 'h_max_frame': fmax, 'ratio': round(hmax / hmin, 4),
        'pass': bool(hmax / hmin >= 1.15)}

    # (c) blink c0133 (lid full) vs c0134 (open); blink keys 131:0 132:1 133:1 134:0
    n_b, cen_b = diff_count(133, 134, EYE)
    res['blink'] = {'frames': [133, 134], 't_s': [5.458, 5.5], 'changed_px': n_b,
                    'centroid': cen_b, 'pass': bool(n_b > 500)}

    meta = json.load(open(os.path.join(OUT, 'comp_meta.json')))
    res['fps'] = 24
    res['total_frames'] = 216
    res['mp4_duration_s'] = meta.get('duration_s')
    res['k_run'] = round(meta.get('k_run', 0), 5)
    res['k_talk'] = round(meta.get('k_talk', 0), 5)
    res['talk_guard_triggered'] = bool(meta.get('talk_guard', {}).get('triggered'))
    res['all_pass'] = bool(res['talk_mouth']['pass'] and res['run_raw_heights']['pass']
                           and res['blink']['pass'])
    json.dump(res, open(os.path.join(OUT, 'fix5_probe.json'), 'w'), indent=1)
    print(json.dumps(res))
    print('FIX5_PROBE_OK' if res['all_pass'] else 'FIX5_PROBE_FAIL')


if __name__ == '__main__':
    main()
