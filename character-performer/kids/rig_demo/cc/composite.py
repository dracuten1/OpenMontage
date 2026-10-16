#!/usr/bin/env python3
"""BUOC 5b — composite 1080x1080 (.venv PIL) + ffmpeg 2 shot + concat + QC stills + ffprobe.

FIX5/C — keep squash-stretch visible: FIXED CROP WINDOW + constant scale k per shot
(replaces the old crop-bbox-then-resize-to-fixed-H normalization which erased dH).
  k_run  = 443/723 (run rest raw H = 723px)  -> sprite H varies per frame
  k_talk = 443/817 (talk rest raw H = 817px) -> both shots 443px tall AT REST (dH = 0)
Windows are RAW rows/cols AFTER FLIP_TOP_BOTTOM (same as previous code).
Anchor: rest-feet row (run 781, talk 861) -> POLY cy feet line; talk feet cy = 0.88*1080.
X: window center -> previous cx. Shot2 keeps cx 0.32 / cy 0.88. Shadow handling unchanged.

Usage:
  .venv/bin/python cc/composite.py                 # full run (frames 1..216 + ffmpeg + QC)
  .venv/bin/python cc/composite.py --frames 116,117  # subset: composite only, no ffmpeg
"""
import json, math, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
FR = os.path.join(OUT, 'frames')
COMP = os.path.join(OUT, 'comp')
os.makedirs(COMP, exist_ok=True)
QC = os.path.join(OUT, 'qc_self')
os.makedirs(QC, exist_ok=True)
WAV = os.path.abspath(os.path.join(ROOT, '..', 'dialogue_v2', 'd0_rabbit.wav'))
BG = os.path.join(ROOT, '..', 'assets', 'scenes', 'sc2_race.png')

from PIL import Image, ImageDraw, ImageFilter

bg = Image.open(BG).convert('RGB').resize((1080, 1080), Image.LANCZOS)

# polyline shot1: (frame, (x%, y%)) — % cua 1080 (FIX3-B: feet do color-mask)
POLY = [(1, (10.19, 91.94)), (10, (20.0, 91.94)), (21, (30.0, 91.94)), (35, (40.0, 93.33)),
        (60, (55.0, 92.59)), (76, (70.0, 90.0)), (87, (80.0, 90.09)), (99, (89.81, 90.09)),
        (108, (97.0, 90.09))]

# ---- FIX5/C constants (verified diagnostic) ----
K_RUN = 443.0 / 723.0     # 0.61245
K_TALK = 443.0 / 817.0    # 0.54223
# RAW crop windows (after FLIP_TOP_BOTTOM): (left, top, right, bottom)
WIN = {'run': (485, 55, 943, 995), 'talk': (485, 40, 943, 870)}
# rest-pose feet row inside each window (after flip)
FEET_ROW = {'run': 781, 'talk': 861}
# POLISH 2026-10-13: rotation euler live (QUATERNION->XYZ) + lean/stride/ears
# -> run content wider/taller; run_guard() re-measures window+feet+k from disk,
# same invariant as FIX5/C: fixed crop window per shot + constant k (no H normalize).


def pos_at(f):
    for i in range(len(POLY) - 1):
        f0, p0 = POLY[i]
        f1, p1 = POLY[i + 1]
        if f0 <= f <= f1:
            t = (f - f0) / (f1 - f0)
            return (p0[0] + t * (p1[0] - p0[0])) * 10.8, (p0[1] + t * (p1[1] - p0[1])) * 10.8
    return POLY[-1][1][0] * 10.8, POLY[-1][1][1] * 10.8


def run_guard():
    """POLISH: measure RUN raw content over f0001..f0108 (canvas = flipped coords).
    Re-derive window (symmetric around OLD center 714, margin 6px), FEET_ROW =
    rest bottom (f1), k_run = 443 / rest content H  (same-size invariant as FIX5/C)."""
    global K_RUN
    info = {'window': list(WIN['run']), 'k_run': K_RUN, 'feet_row': FEET_ROW['run'],
            'triggered': False}
    H = 1024
    boxes = []
    for f in range(1, 109):
        p = os.path.join(FR, 'f%04d.png' % f)
        if not os.path.exists(p):
            continue
        with Image.open(p) as im:
            b = im.convert('RGBA').getbbox()
            if b:
                x0, y0, x1, y1 = b
                boxes.append((x0, H - 1 - y1, x1, H - 1 - y0))  # flip to canvas rows
    if not boxes:
        return info
    c0 = min(b[0] for b in boxes); r0 = min(b[1] for b in boxes)
    c1 = max(b[2] for b in boxes); r1 = max(b[3] for b in boxes)
    rest = boxes[0]                                    # f1 = rest (crouch baseline)
    rest_h = rest[3] - rest[1] + 1
    rest_w = rest[2] - rest[0] + 1
    # POLISH: lean/stride day content sang phai trong canvas -> doi xung theo
    # TAM CONTENT REST (giu nhan vat tren path), khong phai tam window cu 714
    old_cx = (rest[0] + rest[2]) / 2.0
    half = max(c1 - old_cx, old_cx - c0) + 6.0
    l, r = round(old_cx - half), round(old_cx + half)
    t = max(0, r0 - 6)
    btm = 995
    info.update({'content_bbox': [c0, r0, c1, r1], 'rest_bbox_f1': list(rest),
                 'rest_h': rest_h, 'rest_w': rest_w,
                 'new_window': [l, t, r, btm], 'feet_row': rest[3],
                 'k_run': 443.0 / rest_h})
    if (l, t, r, btm) != tuple(WIN['run']):
        info['triggered'] = True
        WIN['run'] = (l, t, r, btm)
        FEET_ROW['run'] = rest[3]
    K_RUN = 443.0 / rest_h
    info['k_run'] = K_RUN
    info['content_w_k'] = rest_w * K_RUN
    print('[composite] RUN GUARD: content %s rest_f1 %s -> window %s feet %d k_run %.5f'
          % (info['content_bbox'], info['rest_bbox_f1'], info['new_window'],
             info['feet_row'], K_RUN))
    return info


def talk_guard():
    """FIX5/C guard: measure talk raw content bbox over existing f0109..f0216.
    If content exceeds the window, expand symmetrically and recompute
    k_talk = 443/(817 * talk_H_raw/817). Returns guard info + effective k_talk."""
    info = {'k_talk': K_TALK, 'window': list(WIN['talk']), 'triggered': False,
            'measured_frames': 0}
    bboxes = []
    for f in range(109, 217):
        p = os.path.join(FR, 'f%04d.png' % f)
        if not os.path.exists(p):
            continue
        with Image.open(p) as im:
            b = im.convert('RGBA').getbbox()
            if b:
                bboxes.append(b)
    info['measured_frames'] = len(bboxes)
    if not bboxes:
        info['note'] = 'no talk frames on disk yet; spec window/k_talk kept'
        return info
    c0 = min(b[0] for b in bboxes); r0 = min(b[1] for b in bboxes)
    c1 = max(b[2] for b in bboxes); r1 = max(b[3] for b in bboxes)
    talk_h_raw = r1 - r0 + 1
    info['content_bbox'] = [c0, r0, c1, r1]
    info['talk_H_raw'] = talk_h_raw
    l, t, r, btm = WIN['talk']
    dx = max(l - c0, c1 - r, 0)          # px content exceeds window horizontally
    dy = max(t - r0, r1 - btm, 0)        # vertically
    if dx > 0 or dy > 0:
        win2 = (l - dx, t - dy, r + dx, btm + dy)
        k2 = 443.0 / (817.0 * talk_h_raw / 817.0)
        info.update({'triggered': True, 'new_window': list(win2), 'k_talk_recomputed': k2,
                     'expand_px': {'x': dx, 'y': dy},
                     'formula': '443/(817*talk_H_raw/817)'})
        WIN['talk'] = win2
        info['k_talk'] = k2
        print('[composite] TALK WINDOW GUARD TRIGGERED: content bbox %s exceeds %s -> '
              'window %s, k_talk %.4f' % (info['content_bbox'], info['window'], list(win2), k2))
    return info


def comp_frame(f, k_talk_eff):
    # FIX1: render pipeline V-flip global -> un-flip here
    im = Image.open(os.path.join(FR, 'f%04d.png' % f)).convert('RGBA').transpose(Image.FLIP_TOP_BOTTOM)
    shot = 'run' if f <= 108 else 'talk'
    box = WIN[shot]
    k = K_RUN if shot == 'run' else k_talk_eff
    sp = im.crop(box)                       # FIXED window, no per-frame bbox
    w = max(1, round(sp.width * k))
    h = max(1, round(sp.height * k))
    sp = sp.resize((w, h), Image.LANCZOS)   # constant k only — H varies per frame
    if shot == 'run':
        cx, cy = pos_at(f)
    else:
        cx, cy = 0.32 * 1080, 0.88 * 1080
    feet_off = (FEET_ROW[shot] - box[1]) * k        # rest-feet row -> feet line
    x, y = round(cx - w / 2), round(cy - feet_off)
    canvas = bg.copy().convert('RGBA')
    # shadow truoc sprite: ellipse duoi chan — POLISH: width theo CONTENT (box run
    # rong them bien trong suot sau khi mo window), khong theo box
    cw = (CONTENT_W_K if shot == 'run' else w * 0.96)
    sw = 0.52 * cw * (1.06 - 0.12 * abs(math.sin(math.pi * f / 6)))
    sh = Image.new('RGBA', (1080, 1080), (0, 0, 0, 0))
    d = ImageDraw.Draw(sh)
    ex, ey = cx, cy + 20
    d.ellipse((ex - sw / 2, ey - 12, ex + sw / 2, ey + 12), fill=(60, 40, 25, 70))
    sh = sh.filter(ImageFilter.GaussianBlur(10))
    canvas.alpha_composite(sh)
    canvas.paste(sp, (x, y), sp)
    canvas.convert('RGB').save(os.path.join(COMP, 'c%04d.png' % f))


def main():
    argv = [a for a in sys.argv[1:]]
    subset = None
    if '--frames' in argv:
        subset = [int(x) for x in argv[argv.index('--frames') + 1].split(',')]
    global CONTENT_W_K
    rg = run_guard()
    CONTENT_W_K = rg.get('content_w_k', 280.0)
    guard = talk_guard()
    k_talk_eff = guard['k_talk']
    frames = subset if subset else list(range(1, 109)) + list(range(110, 217))
    for f in frames:
        comp_frame(f, k_talk_eff)
    print('[composite] k_run=%.5f k_talk_eff=%.5f frames=%s guard=%s'
          % (K_RUN, k_talk_eff, ('subset:' + ','.join(map(str, subset))) if subset else '1..216',
             json.dumps(guard)))
    if subset:
        print('COMPOSITE_SUBSET_OK')
        return
    FF = ['ffmpeg', '-y', '-loglevel', 'error']
    r1 = subprocess.run(FF + ['-framerate', '24', '-start_number', '1', '-i', os.path.join(COMP, 'c%04d.png'),
                              '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', '4.5',
                              '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
                              os.path.join(OUT, 'shot1.mp4')]).returncode
    r2 = subprocess.run(FF + ['-framerate', '24', '-start_number', '110', '-i', os.path.join(COMP, 'c%04d.png'),
                              '-i', WAV, '-af', 'apad', '-t', '%.6f' % (107 / 24),
                              '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '44100',
                              os.path.join(OUT, 'shot2.mp4')]).returncode
    with open(os.path.join(OUT, 'concat.txt'), 'w') as fh:
        fh.write("file 'shot1.mp4'\nfile 'shot2.mp4'\n")
    r3 = subprocess.run(FF + ['-f', 'concat', '-safe', '0', '-i', os.path.join(OUT, 'concat.txt'),
                              '-c', 'copy', os.path.join(OUT, 'rabbit_rig_demo_1080.mp4')]).returncode
    mp4 = os.path.join(OUT, 'rabbit_rig_demo_1080.mp4')
    for name, t in (('t6.08', 6.08), ('t7.87', 7.87), ('t1.0', 1.0), ('t3.2', 3.2)):
        subprocess.run(FF + ['-ss', '%.4f' % t, '-i', mp4, '-frames:v', '1',
                             os.path.join(QC, 'fix5_%s.jpg' % name)])
    probe = subprocess.run(['ffprobe', '-v', 'quiet', '-print_format', 'json',
                            '-show_format', '-show_streams', mp4],
                           capture_output=True, text=True).stdout
    info = json.loads(probe)
    dur = float(info['format']['duration'])
    vid = next(s for s in info['streams'] if s['codec_type'] == 'video')
    aud = [s for s in info['streams'] if s['codec_type'] == 'audio']
    ok = (r1 == r2 == r3 == 0 and os.path.exists(mp4) and 8.5 <= dur <= 9.5
          and vid['width'] == 1080 and vid['height'] == 1080 and len(aud) >= 1)
    json.dump({'rc': [r1, r2, r3], 'duration_s': round(dur, 3), 'size': [vid['width'], vid['height']],
               'has_audio': len(aud) >= 1, 'k_run': K_RUN, 'k_talk': k_talk_eff,
               'talk_guard': guard, 'ok': bool(ok)},
              open(os.path.join(OUT, 'comp_meta.json'), 'w'), indent=1)
    print('[composite]', json.dumps({'rc': [r1, r2, r3], 'dur': round(dur, 3),
                                     'aud': len(aud), 'k_run': round(K_RUN, 5),
                                     'k_talk': round(k_talk_eff, 5), 'ok': bool(ok)}))
    print('COMPOSITE_OK' if ok else 'COMPOSITE_FAIL')


if __name__ == '__main__':
    main()
