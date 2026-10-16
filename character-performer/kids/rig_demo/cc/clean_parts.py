#!/usr/bin/env python3
"""BUOC 1 — alpha cleanup + do lua part (bbox, PCA axis, assembly preview).
DEVIEATION (do luong): ear/arm scale trong rig_pivots.json vuot khung (ear_up tip -> py-405);
fit lai theo chinh sach cua json ("tai dai ~dau x1.0", "tay ~180") + m0 ref (ear tip py16-23).
ear_near DUNG LAI ear_tilt.png (ear_up 901px dai-mong, moi scale deu hong)."""
import json, math, os, time
from collections import deque
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS = os.path.join(ROOT, 'parts')
OUT = os.path.join(ROOT, 'out')
CLEAN = os.path.join(OUT, 'parts_clean')
os.makedirs(CLEAN, exist_ok=True)

EXCLUDE = {'_m0_ref.png', 'mO_full.png', 'blink_full.png'}
# name(file) -> (pivot_part, pivot_puppet, scale, rest_angle_deg, angle_mode)
SPEC = {
    'head':     ((880, 641), (770, 520), 1.00, None, None),
    'ear_tilt': ((875, 510), (820, 245), 0.4624, -25, 'up'),   # fit: tip py~22 (m0=16..23)
    'ear_near': ((875, 510), (872, 252), 0.4364, -8, 'up'),    # ALIAS ear_tilt.png
    'body':     ((932, 300), (770, 470), 0.71, None, None),
    'arm_far':  ((715, 510), (798, 565), 0.5473, 20, 'down'),  # fit: 185px theo policy "tay ~180"
    'arm_near': ((826, 591), (845, 588), 0.6752, 25, 'down'),
    'leg_left': ((716, 574), (700, 798), 0.50, None, None),
    'leg_right': ((716, 574), (830, 798), 0.50, None, None),
}


def ramp(a):
    r = np.zeros_like(a, dtype=np.uint8)
    mid = (a >= 70) & (a <= 190)
    r[mid] = np.clip(((a[mid].astype(np.float32) - 70) * 255.0 / 120.0), 0, 255).astype(np.uint8)
    r[a > 190] = 255
    return r


def label_components(mask):
    try:
        from scipy import ndimage
        lab, n = ndimage.label(mask)
        return lab, n
    except Exception:
        pass
    H, W = mask.shape
    lab = np.zeros((H, W), dtype=np.int32)
    nxt = 0
    for yy in range(H):
        for xx in range(W):
            if mask[yy, xx] and lab[yy, xx] == 0:
                nxt += 1
                q = deque([(yy, xx)])
                lab[yy, xx] = nxt
                while q:
                    y, x = q.popleft()
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx_ = y + dy, x + dx
                        if 0 <= ny < H and 0 <= nx_ < W and mask[ny, nx_] and lab[ny, nx_] == 0:
                            lab[ny, nx_] = nxt
                            q.append((ny, nx_))
    return lab, nxt


def remove_small(mask, min_px=30):
    lab, n = label_components(mask)
    if n == 0:
        return mask, 0, 0
    sizes = np.bincount(lab.ravel())
    sizes[0] = 0
    keep_ids = np.nonzero(sizes >= min_px)[0]
    return np.isin(lab, keep_ids), n, len(keep_ids)


def axis_measure(alpha, pivot):
    ys, xs = np.nonzero(alpha > 16)
    w = alpha[ys, xs].astype(np.float32)
    cx, cy = float((xs * w).sum() / w.sum()), float((ys * w).sum() / w.sum())
    X = (xs - cx).astype(np.float32)
    Y = (ys - cy).astype(np.float32)
    cov = np.array([[float((X * X * w).sum()), float((X * Y * w).sum())],
                    [float((X * Y * w).sum()), float((Y * Y * w).sum())]])
    evals, evecs = np.linalg.eigh(cov)
    d = evecs[:, int(np.argmax(evals))]
    if (cx - pivot[0]) * d[0] + (cy - pivot[1]) * d[1] < 0:
        d = -d
    theta = math.degrees(math.atan2(float(d[0]), -float(d[1])))
    return theta, float((X * d[0] + Y * d[1]).max() - (X * d[0] + Y * d[1]).min())


def world_bbox(bb, piv_part, piv_pup, scale):
    x0, y0, x1, y1 = bb
    return [piv_pup[0] + (x0 - piv_part[0]) * scale,
            piv_pup[1] + (y0 - piv_part[1]) * scale,
            piv_pup[0] + (x1 - piv_part[0]) * scale,
            piv_pup[1] + (y1 - piv_part[1]) * scale]


def union_paste(union, alpha, piv_part, piv_pup, scale, delta):
    mimg = Image.fromarray((alpha > 16).astype(np.uint8) * 255, 'L')
    if abs(delta) > 0.05:
        mimg = mimg.rotate(-delta, center=piv_part, resample=Image.BILINEAR, fillcolor=0)
    bb = mimg.getbbox()
    crop = mimg.crop(bb)
    sw = max(1, int(round((bb[2] - bb[0]) * scale)))
    sh = max(1, int(round((bb[3] - bb[1]) * scale)))
    crop = crop.resize((sw, sh), Image.NEAREST)
    wbb = world_bbox(bb, piv_part, piv_pup, scale)
    canvas = Image.new('L', (1536, 1024), 0)
    canvas.paste(crop, (int(round(wbb[0])), int(round(wbb[1]))))
    union |= np.array(canvas) > 0
    return mimg.getbbox()


def main():
    t0 = time.time()
    meta = {'parts': {}, 'canvas': [1536, 1024]}
    union = np.zeros((1024, 1536), dtype=bool)

    for fn in sorted(os.listdir(PARTS)):
        if not fn.endswith('.png') or fn in EXCLUDE:
            continue
        name = fn[:-4]
        im = Image.open(os.path.join(PARTS, fn)).convert('RGBA')
        assert im.size == (1536, 1024), f'{fn}: size {im.size}'
        arr = np.array(im)
        a = arr[:, :, 3]
        before_pct = float((a > 0).mean() * 100)
        a2 = ramp(a)
        m, ncomp, nkeep = remove_small(a2 > 0, 30)
        a3 = np.where(m, a2, 0).astype(np.uint8)
        after_pct = float((a3 > 0).mean() * 100)
        Image.fromarray(np.dstack([arr[:, :, :3], a3]), 'RGBA').save(os.path.join(CLEAN, fn))
        bbox = Image.fromarray(a3).getbbox()

        rec = {'file': fn, 'alpha_before_pct': round(before_pct, 2),
               'alpha_after_pct': round(after_pct, 2), 'bbox_clean': list(bbox),
               'n_components': [nkeep, ncomp]}

        if name in SPEC and name != 'leg_right' and name != 'ear_near':
            piv_part, piv_pup, scale, rest_ang, mode = SPEC[name]
            rec.update({'pivot_part': list(piv_part), 'pivot_puppet': list(piv_pup),
                        'scale': scale})
            if rest_ang is None:
                delta = 0.0
                rb = bbox
                rec['theta_deg'] = None
            else:
                theta, axlen = axis_measure(a3, piv_part)
                target = rest_ang if mode == 'up' else 180.0 - rest_ang
                delta = target - theta
                rec['theta_deg'] = round(theta, 2)
                rec['axlen_px'] = round(axlen, 1)
                mimg = Image.fromarray((a3 > 16).astype(np.uint8) * 255, 'L')
                rb = (mimg.rotate(-delta, center=piv_part, resample=Image.BILINEAR, fillcolor=0)
                      ).getbbox() if abs(delta) > 0.05 else bbox
            rec['delta_deg'] = round(delta, 2)
            rec['world_bbox'] = [round(v, 1) for v in world_bbox(rb, piv_part, piv_pup, scale)]
            union_paste(union, a3, piv_part, piv_pup, scale, delta)
        elif name in SPEC:  # leg_right
            piv_part, piv_pup, scale, _, _ = SPEC[name]
            rec.update({'pivot_part': list(piv_part), 'pivot_puppet': list(piv_pup),
                        'scale': scale, 'delta_deg': 0.0,
                        'world_bbox': [round(v, 1) for v in world_bbox(bbox, piv_part, piv_pup, scale)]})

        meta['parts'][name] = rec
        print(f"[clean] {name:9s} alpha {before_pct:5.2f}% -> {after_pct:5.2f}%  bbox={bbox}"
              + (f"  theta={rec.get('theta_deg')} delta={rec.get('delta_deg')}" if rec.get('theta_deg') is not None else ""))

    # ALIAS ear_near = ear_tilt.png, rest -8deg, pivot (875,510)->(872,252), scale 0.4364
    piv_part, piv_pup, scale, rest_ang, _ = SPEC['ear_near']
    a3 = np.array(Image.open(os.path.join(CLEAN, 'ear_tilt.png')))[:, :, 3]
    theta = meta['parts']['ear_tilt']['theta_deg']
    delta = rest_ang - theta
    rb = union_paste(union, a3, piv_part, piv_pup, scale, delta)
    meta['parts']['ear_near'] = {
        'file': 'ear_tilt.png', 'pivot_part': list(piv_part), 'pivot_puppet': list(piv_pup),
        'scale': scale, 'theta_deg': theta, 'delta_deg': round(delta, 2),
        'world_bbox': [round(v, 1) for v in world_bbox(rb, piv_part, piv_pup, scale)],
        'note': 'alias ear_tilt (ear_up 901px qua dai/mong cho canvas)'}
    print(f"[clean] ear_near  ALIAS ear_tilt delta={meta['parts']['ear_near']['delta_deg']}")

    # body/head/legs union paste (khong xoay)
    for nm in ('head', 'body', 'leg_left'):
        rec = meta['parts'][nm]
        a3 = np.array(Image.open(os.path.join(CLEAN, rec['file'])))[:, :, 3]
        union_paste(union, a3, tuple(rec['pivot_part']), tuple(rec['pivot_puppet']),
                    rec['scale'], 0.0)

    ys, xs = np.nonzero(union)
    meta['assembly_bbox'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    meta['assembly_centroid'] = [round(float(xs.mean()), 1), round(float(ys.mean()), 1)]
    meta['assembly_area_px'] = int(union.sum())
    meta['elapsed_s'] = round(time.time() - t0, 2)
    json.dump(meta, open(os.path.join(OUT, 'clean_meta.json'), 'w'), indent=1)
    print(f"[clean] ASSEMBLY bbox={meta['assembly_bbox']} centroid={meta['assembly_centroid']} "
          f"area={meta['assembly_area_px']}px  t={meta['elapsed_s']}s")


if __name__ == '__main__':
    main()
