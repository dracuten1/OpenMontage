import numpy as np
from PIL import Image

SCR = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/out/scratch'
OLD = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/out/qc_self'


def stats(p):
    im = Image.open(p).convert('RGBA')
    a = np.array(im)
    am = a[:, :, 3] > 0.1
    ys, xs = np.nonzero(am)
    return im.size, (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())), int(am.sum())


for p in ('bisect_pre.png', 'bisect_post.png'):
    size, bb, n = stats('%s/%s' % (SCR, p))
    print('%s size=%s bbox=%s alpha_px=%d' % (p, size, bb, n))
im1 = np.array(Image.open('%s/bisect_pre.png' % SCR).convert('RGBA')).astype(int)
im2 = np.array(Image.open('%s/bisect_post.png' % SCR).convert('RGBA')).astype(int)
d = np.abs(im1 - im2).max(axis=2)
print('diff px>25:', int((d > 25).sum()))
