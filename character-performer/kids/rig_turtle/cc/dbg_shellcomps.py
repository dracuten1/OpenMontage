import numpy as np
from PIL import Image
from scipy import ndimage
import os

PARTS = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle/out/parts'
BASE = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids'
sh = np.array(Image.open(os.path.join(PARTS, 'shell.png')).convert('RGBA'))[:, :, 3] > 10
m0 = np.array(Image.open(os.path.join(BASE, 'assets', 'depth_demo', 'turtle_m0.png')).convert('RGBA')).astype(int)

zone = np.zeros(sh.shape, bool)
zone[150:750, 800:1535] = True
cl = sh & zone
lab, n = ndimage.label(cl, np.ones((3, 3)))
print('comps shell trong vung dau:', n)
sizes = []
for cid in range(1, n + 1):
    m_ = lab == cid
    if m_.sum() >= 200:
        ys, xs = np.nonzero(m_)
        sizes.append((int(m_.sum()), int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())))
sizes.sort(reverse=True)
for s in sizes[:12]:
    px, x0, y0, x1, y1 = s
    reg = m0[y0:y1 + 1, x0:x1 + 1]
    mm = lab[y0:y1 + 1, x0:x1 + 1] == (sizes.index(s) + 1)
    rgbs = m0[y0:y1 + 1, x0:x1 + 1, :3][mm] if False else None
    # mau trung binh cua comp
    cid = [i + 1 for i, t in enumerate(sizes) if t == s][0]
    mm = lab == cid
    cols = m0[:, :, :3][mm]
    print('px=%6d bbox=[%d,%d,%d,%d] meanRGB=%s' % (px, x0, y0, x1, y1,
          tuple(int(v) for v in cols.mean(axis=0))))
