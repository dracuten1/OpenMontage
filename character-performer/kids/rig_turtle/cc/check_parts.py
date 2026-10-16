import numpy as np
from PIL import Image
from scipy import ndimage
import json, os

BASE = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle'
PARTS = os.path.join(BASE, 'out', 'parts')
m0 = np.array(Image.open(os.path.join(BASE, '..', 'assets', 'depth_demo', 'turtle_m0.png')).convert('RGBA')).astype(int)
alpha = m0[:, :, 3] > 10
R, G, B = m0[:, :, 0], m0[:, :, 1], m0[:, :, 2]

names = ['tail', 'leg_far_hind', 'leg_far_front', 'shell', 'head', 'leg_near_hind', 'leg_near_front']
M = {}
for n in names:
    M[n] = np.array(Image.open(os.path.join(PARTS, n + '.png')).convert('RGBA'))[:, :, 3] > 10
for n in names:
    ys, xs = np.nonzero(M[n])
    print('%-15s bbox=[%d,%d,%d,%d]' % (n, xs.min(), ys.min(), xs.max(), ys.max()))

print('--- overlap (px chung giua cac part) ---')
front_order = names  # z-order tu xa den gan
for i in range(len(names)):
    for j in range(i + 1, len(names)):
        ov = int((M[names[i]] & M[names[j]]).sum())
        if ov:
            print('%s & %s = %d' % (names[i], names[j], ov))

# kiem tra mat xa voi erosion 4
head_er4 = ndimage.binary_erosion(M['head'], iterations=4)
dark4 = head_er4 & (((R < 160) & (G < 120)) | ((R < 110) & (G < 80)))
lab_e, ne = ndimage.label(dark4, np.ones((3, 3)))
print('--- erosion=4 eye comps >=1200 ---')
for cid in range(1, ne + 1):
    m_ = lab_e == cid
    if m_.sum() >= 1200:
        ys, xs = np.nonzero(m_)
        print(' comp px=%d bbox=[%d,%d,%d,%d]' % (m_.sum(), xs.min(), ys.min(), xs.max(), ys.max()))

# zone repair: shell co px nao trung voi head/nf/nh KHONG?
rep = M['shell'] & (M['head'] | M['leg_near_front'] | M['leg_near_hind'])
print('shell ∩ front-parts =', int(rep.sum()), 'px')
# shell mask o vung dau/chan co bi "lo" khong: dome bbox
ys, xs = np.nonzero(M['shell'])
print('shell bbox=[%d,%d,%d,%d]' % (xs.min(), ys.min(), xs.max(), ys.max()))
