# Hidden-region encoding test — do gen models respect pixel-color region codes?
# Usage: python3 hexpix_test.py <gen_image.png> <spec.json>
# spec.json: [{"region": "A", "hex": "#FF0000", "desc": "inner citadel"}, ...]
# Output: per-region coverage %, purity %, centroid/bbox, saved debug overlay map.
import sys, json
import numpy as np
from PIL import Image, ImageDraw

def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def main(path, spec_path):
    img = Image.open(path).convert('RGB')
    W, H = img.size
    arr = np.asarray(img).astype(int)
    spec = json.load(open(spec_path))
    out = {"image": path, "size": [W, H], "regions": []}
    overlay = Image.new('RGB', (W, H), (0, 0, 0))
    dr = ImageDraw.Draw(overlay)
    palette = [(255, 255, 0), (0, 255, 255), (255, 0, 255), (0, 128, 255)]
    for i, r in enumerate(spec):
        rgb = hex2rgb(r['hex'])
        dist = np.abs(arr - np.array(rgb)).sum(axis=2)
        mask = dist <= 60  # tolerance 20/channel
        n = int(mask.sum())
        cov = n / (W * H)
        purity = None
        bbox = None
        centroid = None
        if n > 0:
            ys, xs = np.nonzero(mask)
            x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
            bbox = [x0, y0, x1, y1]
            centroid = [float(xs.mean()) / W, float(ys.mean()) / H]
            # purity: sample bbox region, what fraction of bbox is this color
            sub = dist[y0:y1 + 1, x0:x1 + 1]
            purity = float((sub <= 60).mean())
            dr.rectangle([x0, y0, x1, y1], outline=palette[i % 4], width=6)
        out['regions'].append({
            "region": r['region'], "desc": r['desc'], "hex": r['hex'],
            "pixels": n, "coverage_pct": round(cov * 100, 3),
            "purity_in_bbox_pct": round(purity * 100, 1) if purity is not None else None,
            "bbox": bbox, "centroid_norm": centroid,
        })
    dbg = path.rsplit('.', 1)[0] + '_debug.png'
    ov = Image.blend(img, overlay, 0.35)
    ov.save(dbg)
    out['debug_map'] = dbg
    print(json.dumps(out, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
