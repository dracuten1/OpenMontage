#!/usr/bin/env python3
"""PHASE-A finish_probe — PIL motion probe + filmstrip + seam/halo (turtle).
Frames: out/frames_t/f0001..f0248.png (1535x1024, stored V-FLIPPED).
Adapted from rig_demo/cc/fix5_probe_full.py conventions (never open PNG by eye).
Outputs: out/qc_probe.json, out/rig_cycle_strip.jpg, merged out/qc_rig.json.
"""
import json, os, time
import numpy as np
from PIL import Image, ImageDraw

T0 = time.time()
ROOT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle'
FR = os.path.join(ROOT, 'out', 'frames_t')
OUT = os.path.join(ROOT, 'out')

# upright-canvas leg bands (parts_meta bboxes); shell bottom y=808 -> track below 820
BANDS = {
    'leg_near_hind':  (49, 354),
    'leg_far_hind':   (381, 604),
    'leg_near_front': (755, 1109),
    'leg_far_front':  (1110, 1349),   # trimmed: near_front overlaps 1030..1109
}
Y0, Y1 = 820, 1010
SAMPLE = [1, 7, 13, 19]


def load(f):
    im = Image.open(os.path.join(FR, 'f%04d.png' % f)).convert('RGBA')
    return im.transpose(Image.FLIP_TOP_BOTTOM)   # un-flip -> upright


res = {'bands': {k: list(v) for k, v in BANDS.items()}, 'y_band': [Y0, Y1],
       'sample_frames': SAMPLE}

# ---------- leg tip tracking, one 24f walk cycle ----------
tips, cxs, bands_px = {}, {}, {}
whole = []
for f in range(1, 25):
    a = np.array(load(f).getchannel('A'))
    for k, (x0, x1) in BANDS.items():
        band = a[Y0:Y1, x0:x1] > 128
        rows = np.nonzero(band.any(axis=1))[0]
        if len(rows):
            ytip = int(Y0 + rows.max())
            lo = max(rows.max() - 29, 0)
            ys, xs_ = np.nonzero(band[lo:])
            xc = float(xs_.mean() + x0)
        else:
            ytip, xc = -1, float('nan')
        tips.setdefault(k, []).append(ytip)
        cxs.setdefault(k, []).append(xc)
        bands_px.setdefault(k, {}).setdefault(f, int(band.sum()))
    bb = a > 128
    cols = np.nonzero(bb.any(axis=0))[0]
    rws = np.nonzero(bb.any(axis=1))[0]
    whole.append([int(cols.min()), int(rws.min()), int(cols.max()), int(rws.max())])

legdet = {}
for k in BANDS:
    t = tips[k]
    legdet[k] = {
        'y_tip_series': t,
        'tip_disp_px_y': int(max(t) - min(t)),
        'x_centroid_disp_px': round(float(np.nanmax(cxs[k]) - np.nanmin(cxs[k])), 1),
        'band_px_f1_f7_f13_f19': [bands_px[k][f] for f in SAMPLE],
    }
# phase relations (only meaningful with >=2px motion)
def arglift(k):
    return int(np.argmin(tips[k]))

phase = {}
for a, b in (('leg_near_front', 'leg_far_hind'), ('leg_near_hind', 'leg_far_front'),
             ('leg_near_front', 'leg_near_hind'), ('leg_far_front', 'leg_far_hind')):
    ma = legdet[a]['tip_disp_px_y'] >= 2
    mb = legdet[b]['tip_disp_px_y'] >= 2
    phase['%s_vs_%s' % (a, b)] = {
        'lift_frame_a': arglift(a), 'lift_frame_b': arglift(b),
        'phase_diff_f': (arglift(b) - arglift(a)) % 24,
        'measurable': bool(ma and mb)}
res['leg_probe'] = legdet
res['leg_phase'] = phase
res['expected_diagonal'] = {'leg_near_front_vs_leg_far_hind': 0,
                            'leg_near_hind_vs_leg_far_front': 0,
                            'leg_near_front_vs_leg_near_hind': 12}
wb = np.array(whole)
res['whole_sprite_bbox_drift_px_1_24'] = {
    'left': int(wb[:, 0].max() - wb[:, 0].min()), 'top': int(wb[:, 1].max() - wb[:, 1].min()),
    'right': int(wb[:, 2].max() - wb[:, 2].min()), 'bottom': int(wb[:, 3].max() - wb[:, 3].min())}

# ---------- frame diff f1 vs f7 (motion energy) ----------
def arr_rgb(f):
    return np.array(load(f).convert('RGB'), dtype='int16')

d17 = np.abs(arr_rgb(1) - arr_rgb(7)).max(axis=2)
res['frame_diff_f1_f7_px_gt25'] = int((d17 > 25).sum())
for k, (x0, x1) in BANDS.items():
    res.setdefault('leg_band_diff_f1_f7', {})[k] = int((d17[Y0:Y1, x0:x1] > 25).sum())

# ---------- seam / halo (joint caps), differential vs f1 ----------
REGIONS = {'neck': (850, 1160, 380, 760), 'leg_roots': (370, 1360, 560, 850)}

def interior_gap(a, x0, x1, ytop, ybot):
    worst, worst_x, cols_with_gap = 0, None, 0
    for x in range(x0, x1):
        col = a[ytop:ybot, x]
        op = np.nonzero(col > 200)[0]
        if len(op) < 2:
            continue
        lo, hi = op.min(), op.max()
        g = int((col[lo:hi] < 10).sum())
        if g >= 2:
            cols_with_gap += 1
        if g > worst:
            worst, worst_x = g, x
    return worst, worst_x, cols_with_gap

seam = {}
al = {}
for f in SAMPLE:
    im = load(f)
    a = np.array(im.getchannel('A'))
    al[f] = (im, a)
    seam[f] = {}
    for r, (x0, x1, yt, yb) in REGIONS.items():
        seam[f][r] = interior_gap(a, x0, x1, yt, yb)
seam_exposed = any(seam[f][r][0] - seam[1][r][0] >= 2
                   for f in SAMPLE[1:] for r in REGIONS)
res['seam'] = {'per_frame': {str(f): {r: seam[f][r] for r in REGIONS} for f in SAMPLE},
               'baseline_f1': {r: seam[1][r] for r in REGIONS},
               'growth_threshold_px': 2, 'seam_exposed': bool(seam_exposed)}

def halo(a, rgb):
    solid = a >= 250
    fringe = (a > 8) & (a < 250)
    near_solid = solid.copy()
    for ax in (0, 1):
        for s in (1, -1):
            near_solid |= np.roll(solid, s, axis=ax)
    ring = fringe & near_solid
    L = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2])
    return {'fringe_px': int(fringe.sum()), 'ring_px': int(ring.sum()),
            'ring_max_L': round(float(L[ring].max()), 1) if ring.any() else None,
            'solid_max_L': round(float(L[solid].max()), 1),
            'solid_mean_L': round(float(L[solid].mean()), 1)}

im1, a1 = al[1]
rgb1 = np.array(im1.convert('RGB'), dtype='float32')
h = halo(a1, rgb1)
h['halo_detected'] = bool(h['ring_max_L'] is not None and
                          h['ring_max_L'] - h['solid_max_L'] > 15)
res['halo_f1'] = h

# ---------- filmstrip: 4 samples upright on pale green + 2x crops ----------
GREEN = (208, 232, 208)
NECK_CROP = (882, 480, 1122, 720)     # 240x240, head/shell joint zone
ROOT_CROP = (812, 540, 1052, 780)     # 240x240, near_front leg root zone
GAP, LBL = 12, 22
TH_W, TH_H = 537, 358                 # full frames scaled 0.35
strip = Image.new('RGB', (4 * TH_W + 5 * GAP, TH_H + 2 * 480 + 4 * GAP + 3 * LBL + 2 * GAP), GREEN)
dr = ImageDraw.Draw(strip)

def composite_green(im):
    bg = Image.new('RGBA', im.size, GREEN + (255,))
    return Image.alpha_composite(bg, im).convert('RGB')

y_cur = LBL
for i, f in enumerate(SAMPLE):
    th = composite_green(al[f][0]).resize((TH_W, TH_H), Image.LANCZOS)
    strip.paste(th, (GAP + i * (TH_W + GAP), y_cur))
    dr.text((GAP + i * (TH_W + GAP) + 4, y_cur - LBL + 4), 'f%04d upright' % f, fill=(30, 60, 30))
y_cur += TH_H + GAP + LBL
for i, f in enumerate(SAMPLE):
    c = composite_green(al[f][0]).crop(NECK_CROP).resize((480, 480), Image.NEAREST)
    strip.paste(c, (GAP + i * (480 + GAP), y_cur))
    dr.text((GAP + i * (480 + GAP) + 4, y_cur - LBL + 4), 'f%04d neck 2x' % f, fill=(30, 60, 30))
y_cur += 480 + GAP + LBL
for i, f in enumerate(SAMPLE):
    c = composite_green(al[f][0]).crop(ROOT_CROP).resize((480, 480), Image.NEAREST)
    strip.paste(c, (GAP + i * (480 + GAP), y_cur))
    dr.text((GAP + i * (480 + GAP) + 4, y_cur - LBL + 4), 'f%04d leg-root 2x' % f, fill=(30, 60, 30))
STRIP = os.path.join(OUT, 'rig_cycle_strip.jpg')
strip.save(STRIP, quality=88)
res['filmstrip'] = {'path': STRIP, 'size': list(strip.size),
                    'crops': {'neck': list(NECK_CROP), 'leg_root': list(ROOT_CROP)}}

# ---------- merge qc ----------
res['t_probe_s'] = round(time.time() - T0, 2)
json.dump(res, open(os.path.join(OUT, 'qc_probe.json'), 'w'), indent=1)
qc_path = os.path.join(OUT, 'qc_rig.json')
qc = json.load(open(os.path.join(OUT, 'qc_rig_verify.json')))
qc['motion_probe'] = res
qc['rerender'] = {'happened': True,
                  'reason': 'Phase-B rig fix (legs->own bones, diagonal gait, '
                            'euler[2] in-plane, coverage to 248) required fresh frames',
                  'render_rc': 0, 'render_s': 100.9}
json.dump(qc, open(qc_path, 'w'), indent=1)
print('leg tip disp y:', {k: legdet[k]['tip_disp_px_y'] for k in legdet})
print('seam_exposed:', seam_exposed, 'halo:', h['halo_detected'])
print('FINISH_PROBE_OK')
