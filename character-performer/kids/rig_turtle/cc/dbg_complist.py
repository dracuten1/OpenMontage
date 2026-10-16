import numpy as np
from PIL import Image
from scipy import ndimage
import os

BASE = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids'
m0 = np.array(Image.open(os.path.join(BASE, 'assets', 'depth_demo', 'turtle_m0.png')).convert('RGBA')).astype(int)
alpha = m0[:, :, 3] > 10
R, G, B = m0[:, :, 0], m0[:, :, 1], m0[:, :, 2]
shellish = alpha & ((R - G) > 25) & ((R + G + B) > 150)
lab, n = ndimage.label(shellish, np.ones((3, 3)))
print('shellish comps >=1000:')
for cid in range(1, n + 1):
    m_ = lab == cid
    if m_.sum() >= 1000:
        ys, xs = np.nonzero(m_)
        print(' px=%6d centroid=(%d,%d) bbox=[%d,%d,%d,%d]' % (
            m_.sum(), xs.mean(), ys.mean(), xs.min(), ys.min(), xs.max(), ys.max()))

head = np.array(Image.open(os.path.join(BASE, 'rig_turtle', 'out', 'parts', 'head.png')).convert('RGBA'))[:, :, 3] > 10
he = ndimage.binary_erosion(head, iterations=4)
dark = he & (((R < 160) & (G < 120)) | ((R < 110) & (G < 80)))
print('--- dark comps trong head (erode4) >=400, w/h<=250 ---')
lab2, n2 = ndimage.label(dark, np.ones((3, 3)))
for cid in range(1, n2 + 1):
    m_ = lab2 == cid
    if m_.sum() >= 400:
        ys, xs = np.nonzero(m_)
        w_, h_ = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
        if w_ <= 250 and h_ <= 250:
            print(' px=%5d bbox=[%d,%d,%d,%d]' % (m_.sum(), xs.min(), ys.min(), xs.max(), ys.max()))
