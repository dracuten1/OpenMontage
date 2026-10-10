# hexpix_extract2.py - STEALTH hue-band marker decode (markers look like natural ink tones
# to the eye but occupy hue families absent from the scene (ink-wash = warm hues + true greys).
# Decode: HSV gate (hue band + min saturation) - robust to gen-model color drift.
# Modes: sprite (cut RGBA + inpaint hole) | path (centerline polyline).
import sys, json
import numpy as np
import cv2
from PIL import Image

def hsv_gate(bgr, hue_deg_band, sat_min=0.12, sat_max=1.0, val_min=30):
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[:, :, 0].astype(int), hsv[:, :, 1].astype(int) / 255.0, hsv[:, :, 2].astype(int)
    lo, hi = hue_deg_band
    inb = ((h >= lo) & (h <= hi)) if lo <= hi else ((h >= lo) | (h <= hi))
    return ((inb) & (s >= sat_min) & (s <= sat_max) & (v >= val_min)).astype(np.uint8) * 255

def clean(m, k=5):
    ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    return cv2.morphologyEx(cv2.morphologyEx(m, cv2.MORPH_CLOSE, ker), cv2.MORPH_OPEN, ker)

def extract_sprite(img_rgb, mask, pad=8):
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    if n <= 1: return None, None, None
    i = 1 + int(stats[1:, cv2.CC_STAT_AREA].argmax())
    x, y, w, h, area = stats[i]
    sub = (labels[y:y+h, x:x+w] == i)
    sprite = np.zeros((h + 2*pad, w + 2*pad, 4), dtype=np.uint8)
    sprite[pad:pad+h, pad:pad+w, :3] = img_rgb[y:y+h, x:x+w]
    sprite[pad:pad+h, pad:pad+w, 3] = (sub * 255).astype(np.uint8)
    return sprite, dict(bbox=[int(x), int(y), int(w), int(h)], area=int(area)), (x, y, sub)

def path_polyline(mask, n_bins=36):
    ys, xs = np.nonzero(mask)
    if len(xs) < 50: return None
    pts = np.stack([xs, ys], 1).astype(np.float32)
    mean = pts.mean(0); d = pts - mean
    axis = np.linalg.svd(d, full_matrices=False)[2][0]
    t = d @ axis
    qs = np.quantile(t, np.linspace(0, 1, n_bins + 1))
    line = []
    for b in range(n_bins):
        sel = (t >= qs[b]) & (t <= qs[b+1])
        if sel.sum() >= 3:
            line.append([float(pts[sel,0].mean()), float(pts[sel,1].mean())])
    return dict(axis=[float(axis[0]), float(axis[1])], points=line)

def main(img_path, spec_path, out_prefix):
    img = np.asarray(Image.open(img_path).convert('RGB'))
    bgr = img[:, :, ::-1].copy()
    spec = json.load(open(spec_path))
    result = {}
    bg = img.copy()
    sprites = {}
    for r in spec:
        m = clean(hsv_gate(bgr, r['hue'], r.get('sat_min', 0.12), r.get('sat_max', 1.0)))
        cov = (m > 0).sum()
        if cov == 0:
            result[r['region']] = {'found': False}; continue
        entry = {'found': True, 'pixels': int(cov)}
        if r.get('kind') == 'sprite':
            sprite, meta, hole = extract_sprite(img, m)
            if sprite is not None:
                p = f"{out_prefix}_{r['region']}.png"
                Image.fromarray(sprite).save(p)
                # inpaint the hole in the background copy
                hm = np.zeros(bgr.shape[:2], np.uint8)
                x, y, sub = hole
                hm[y:y+sub.shape[0], x:x+sub.shape[1]] = (sub * 255).astype(np.uint8)
                hm = cv2.dilate(hm, np.ones((7,7), np.uint8))
                bg[:, :, ::-1] = cv2.inpaint(bgr, hm, 5, cv2.INPAINT_TELEA)
                entry.update(meta, sprite=p)
                sprites[r['region']] = sprite
        elif r.get('kind') == 'path':
            entry['polyline'] = path_polyline(m)
        result[r['region']] = entry
    if sprites:
        p = f"{out_prefix}_bg_inpainted.png"
        Image.fromarray(bg).save(p)
        result['_background'] = p
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
