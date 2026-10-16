#!/usr/bin/env python3
"""TACH LOP RUA v2 (2026-10-13) — EDT nearest-part assignment.

v1 bug: part = chi pixel 'mau da' -> mat/vien/nam roi vao shell, part thanh
'cheese'. v2: 7 comps (6 skin + shell-yellow lon nhat), moi pixel alpha gan
comp nao (scipy EDT) thuoc comp do -> vien/mat/nam dung cho. Repair shell phia
sau head/near-legs bang horizontal smear. Mouth patch = diff mO-m0 GIOI HAN
vung mieng + comp lon nhat (mO drift nhe toan cuc). Eyelid = PIL-drawn tren
2 mat (blob toi trong head eroded, cach vien >=8px).

Out: out/parts/{tail,leg_far_hind,leg_far_front,shell,head,leg_near_hind,
leg_near_front,mouth_open,eyelid}.png + out/parts_meta.json + out/split_sheet.jpg
"""
import json
import os
import time

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, '..', 'assets', 'depth_demo')
OUT = os.path.join(ROOT, 'out')
PARTS = os.path.join(OUT, 'parts')
os.makedirs(PARTS, exist_ok=True)
t0 = time.time()

m0 = np.array(Image.open(os.path.join(ASSETS, 'turtle_m0.png')).convert('RGBA')).astype(int)
mO = np.array(Image.open(os.path.join(ASSETS, 'turtle_mO.png')).convert('RGBA')).astype(int)
H, W = m0.shape[:2]

alpha = m0[:, :, 3] > 10
R, G, B = m0[:, :, 0], m0[:, :, 1], m0[:, :, 2]
skin = alpha & (np.abs(R - G) < 18) & ((G - B) > 50)
# shellish PHAI SANG: vien dau nau dam (R-G>30 nhung sum<150) tung noi iris
# -> coi -> dome thanh 1 comp, mat xa bi shell gianh mat
shellish = alpha & ((R - G) > 25) & ((R + G + B) > 150)

# ---- comps: 6 skin + shell (lon nhat, da fill holes) ----
lab_skin, n1 = ndimage.label(skin, structure=np.ones((3, 3)))
sizes = ndimage.sum(skin, lab_skin, range(1, n1 + 1))
order = np.argsort(sizes)[::-1] + 1

PART_RECTS = {
    'head':           (900, 150, 1535, 700),
    'leg_near_front': (700, 560, 1160, 960),
    'leg_far_front':  (1040, 600, 1400, 928),
    'leg_near_hind':  (0, 580, 420, 960),
    'leg_far_hind':   (360, 720, 640, 928),
    'tail':           (0, 480, 300, 700),
}
comp_of = {}
for cid in order:
    if sizes[cid - 1] < 400:
        continue
    ys, xs = np.nonzero(lab_skin == cid)
    cx, cy = xs.mean(), ys.mean()
    for name, (x0, y0, x1, y1) in PART_RECTS.items():
        if name in comp_of:
            continue
        rcx, rcy = (x0 + x1) / 2.0, (y0 + y1) / 2.0
        inter = not (xs.max() < x0 or xs.min() > x1 or ys.max() < y0 or ys.min() > y1)
        if inter and x0 - 60 <= cx <= x1 + 60 and y0 - 60 <= cy <= y1 + 60:
            comp_of[name] = cid
            break
assert len(comp_of) == 6, 'thieu skin comp: %s' % comp_of

# shell comps = MOI comp shellish >= 3000px (dome + underside tach nhau vi
# vien dam; iris/blush nho o lai cho EDT gan ve head)
lab_shell, ns = ndimage.label(shellish, np.ones((3, 3)))
ssizes = ndimage.sum(lab_shell > 0, lab_shell, range(1, ns + 1))
shell_cid = int(np.argmax(ssizes) + 1)
comp_of['shell'] = -1

# ---- label map: 1..6 skin ids, 7 shell, 0 unknown ----
# v2.2: comp da NHO (b bi vien den co lap: vung mat xa, mom, blotch) KE THUA
# nhan cua part da gan nhat truoc khi EDT — neu de EDT quyet thi chung bi
# vanh rim nau (shellish, lien mang voi dome) gianh mat.
L = np.zeros((H, W), dtype=int)
for name, cid in comp_of.items():
    if name == 'shell':
        continue
    mskin = lab_skin == cid
    print('[dbg] skin %-15s cid=%s px=%d' % (name, cid, int(mskin.sum())))
    L[mskin] = list(comp_of).index(name) + 1
named_ids = [comp_of[n_] for n_ in comp_of if n_ != 'shell']
for cid in range(1, n1 + 1):
    if cid in named_ids:
        continue
    m_ = lab_skin == cid
    if m_.sum() < 30:
        continue
    ys, xs = np.nonzero(m_)
    cx, cy = xs.mean(), ys.mean()
    # part gan nhat theo khoang centroid
    best, bd = None, 1e18
    for name in comp_of:
        if name == 'shell':
            continue
        cid2 = comp_of[name]
        ys2, xs2 = np.nonzero(lab_skin == cid2)
        d2 = ((xs2 - cx) ** 2 + (ys2 - cy) ** 2).min()
        if d2 < bd:
            bd, best = d2, name
    if best and bd < 150 ** 2:  # trong ban kinh 150px moi ke thua
        L[m_] = list(comp_of).index(best) + 1
mshell = np.zeros((H, W), bool)
for cid in range(1, ns + 1):
    if ssizes[cid - 1] >= 3000:
        ys2, xs2 = np.nonzero(lab_shell == cid)
        cx, cy = xs2.mean(), ys2.mean()
        # loai comp nam trong vung dau/mat (cam 4275px @1123,576; blush):
        # shell chi nhan comp o trai (x<1000) hoac duoi dau (y>640)
        if cx < 1000 or cy > 640:
            mshell |= lab_shell == cid
L[mshell] = 7
print('[dbg] L sau skin-inherit:', dict(zip(*[v.tolist() for v in np.unique(L, return_counts=True)])))
# KHONG gan shellish nho lam shell: iris nau (R-G>25) se bi keo sang shell va
# EDT cuon ca vung mat. Comp nho de EDT gan theo part gan nhat.

# ---- EDT: moi pixel alpha gan part nao ----
unk = (L == 0) & alpha
dist, (iy, ix) = ndimage.distance_transform_edt(L == 0, return_indices=True)
L[unk] = L[iy[unk], ix[unk]]
# pixel ngoai alpha (trong suot): bo qua
final = {}
names = [n for n in comp_of if n != 'shell'] + ['shell']
for i, name in enumerate(names, start=1):
    final[name] = alpha & (L == i) if name != 'shell' else alpha & (L == 7)
# phan alpha chua gan (ko xay ra) -> shell
leftover = alpha & (L == 0)
final['shell'] |= leftover
vals, cnts = np.unique(L[alpha], return_counts=True)
print('[split] L histogram (alpha only):', dict(zip(vals.tolist(), cnts.tolist())))
print('[split] names order:', names)

# ---- repair shell phia sau head/nf/nh: closing shell roi occluded ----
# v2.1: loai TAT CA part khac khoi repair (closing 41 da phu mat duoi + chan
# xa o vung hop loi); closing 25 chi lap o khoang <=12px
shell_base = final['shell'].copy()
front = np.zeros(alpha.shape, bool)
for n_ in names:
    if n_ != 'shell':
        front |= final[n_]
shell_closed = ndimage.binary_closing(shell_base, structure=np.ones((25, 25)))
repair_zone = shell_closed & ~shell_base & ~front          # chi phia sau cac part
shell_rgb = m0[:, :, :3].copy()
ys, xs = np.nonzero(repair_zone)
for y, x in zip(ys, xs):
    xl = x
    while xl > 0 and not shell_base[y, xl]:
        xl -= 1
    xr = x
    while xr < W - 1 and not shell_base[y, xr]:
        xr += 1
    if shell_base[y, xl] and shell_base[y, xr]:
        wdt = xr - xl
        shell_rgb[y, x] = ((xr - x) * shell_rgb[y, xl] + (x - xl) * shell_rgb[y, xr]) // max(wdt, 1)
    else:
        repair_zone[y, x] = False
final['shell'] = shell_base | repair_zone
print('[split] shell repair px:', int(repair_zone.sum()))

# ---- xuat layers ----
meta = {'canvas': [W, H], 'parts': {}}


def save_layer(name, mask, rgb):
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[:, :, :3] = rgb
    rgba[:, :, 3] = (m0[:, :, 3] * mask).astype(np.uint8)  # giu feather goc
    Image.fromarray(rgba, 'RGBA').save(os.path.join(PARTS, name + '.png'))
    ys, xs = np.nonzero(mask)
    return {'bbox': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
            'px': int(mask.sum())}


for name in names:
    rgb = shell_rgb if name == 'shell' else m0[:, :, :3]
    meta['parts'][name] = save_layer(name, final[name], rgb)

ys, xs = np.nonzero(alpha)
meta['assembly_bbox'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
meta['assembly_centroid'] = [float(xs.mean()), float(ys.mean())]
recon = np.zeros(alpha.shape, bool)
for name in names:
    recon |= final[name]
meta['coverage'] = {'alpha_px': int(alpha.sum()), 'recon_px': int(recon.sum()),
                    'exact': bool((recon == alpha).all())}

# ---- mouth patch: diff mO-m0 trong vung mieng, comp lon nhat ----
MR = (1150, 430, 1520, 650)
diff = (np.abs(mO - m0).max(axis=2) > 25) & (mO[:, :, 3] > 10)
diff[:MR[1], :] = False
diff[MR[3]:, :] = False
diff[:, :MR[0]] = False
diff[:, MR[2]:] = False
lab_d, nd_ = ndimage.label(diff, np.ones((3, 3)))
if nd_:
    dsizes = ndimage.sum(diff, lab_d, range(1, nd_ + 1))
    mouth_cid = int(np.argmax(dsizes) + 1)
    diff = lab_d == mouth_cid
ys, xs = np.nonzero(diff)
mb = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
mouth = mO.copy()
mouth[:, :, 3] = np.where(diff, mO[:, :, 3], 0).astype(np.uint8)
Image.fromarray(mouth.astype(np.uint8), 'RGBA').save(os.path.join(PARTS, 'mouth_open.png'))
meta['mouth_patch'] = {'bbox': mb, 'px': int(diff.sum())}
print('[split] mouth patch bbox:', mb, 'px', int(diff.sum()))

# ---- eyelid: 2 mat = blob nau/toi trong head eroded ----
head_er = ndimage.binary_erosion(final['head'], iterations=8)
dark = head_er & (((R < 160) & (G < 120)) | ((R < 110) & (G < 80)))
lab_e, ne = ndimage.label(dark, np.ones((3, 3)))
eyes = []
for cid in range(1, ne + 1):
    m_ = lab_e == cid
    if m_.sum() < 600:
        continue
    ys, xs = np.nonzero(m_)
    w_, h_ = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
    # loai blob vien dau khong lo (keo dai ca head) — mat phai goni: w,h<=250
    if w_ > 250 or h_ > 250 or m_.sum() / (w_ * h_) < 0.25:
        continue
    # loai vach mieng (y0>500) — mat nam nua tren cua dau
    if ys.min() > 500:
        continue
    eyes.append({'x0': int(xs.min()), 'y0': int(ys.min()),
                 'x1': int(xs.max()), 'y1': int(ys.max()), 'px': int(m_.sum())})
# chi giu blob lon nhat (mat gan); mat xa o ria bi erosion cat — bo qua
eyes = sorted(eyes, key=lambda e: -e['px'])[:1]
eyes.sort(key=lambda e: (e['x0'] + e['x1']) / 2)
print('[split] eyes:', eyes)
assert len(eyes) >= 1, 'khong tim thay mat'
lid = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(lid)
SKIN = (191, 193, 92, 255)
LINE = (60, 62, 24, 255)
for e in eyes:
    cx, cy = (e['x0'] + e['x1']) // 2, (e['y0'] + e['y1']) // 2
    rx, ry = (e['x1'] - e['x0']) // 2 + 7, (e['y1'] - e['y0']) // 2 + 7
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=SKIN)
    d.arc((cx - rx, cy - ry, cx + rx, cy + ry), 200, 340, fill=LINE, width=5)
lid.save(os.path.join(PARTS, 'eyelid.png'))
meta['eyelids'] = eyes

# ---- contact sheet: crop bbox moi part + 48px margin ----
tiles = []
for name in names:
    im = Image.open(os.path.join(PARTS, name + '.png')).convert('RGBA')
    bb = meta['parts'][name]['bbox']
    crop = im.crop((max(0, bb[0] - 48), max(0, bb[1] - 48),
                    min(W, bb[2] + 48), min(H, bb[3] + 48)))
    bg = Image.new('RGBA', crop.size, (110, 150, 120, 255))
    bg.alpha_composite(crop)
    h_ = 300
    w_ = int(crop.width * h_ / crop.height)
    tiles.append((name, bg.convert('RGB').resize((w_, h_))))
tot_w = sum(t.width for _, t in tiles) + 10 * (len(tiles) + 1)
sheet = Image.new('RGB', (tot_w, 340), 'white')
dr = ImageDraw.Draw(sheet)
x = 10
for name, t in tiles:
    sheet.paste(t, (x, 30))
    dr.text((x + 4, 8), name, fill='black')
    x += t.width + 10
sheet.save(os.path.join(OUT, 'split_sheet.jpg'), quality=90)

meta['t_s'] = round(time.time() - t0, 1)
json.dump(meta, open(os.path.join(OUT, 'parts_meta.json'), 'w'), indent=1)
print('[split] coverage:', meta['coverage'])
print('[split] done %.1fs' % meta['t_s'])
print('SPLIT_OK')
