import numpy as np
from PIL import Image

FR = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/out/frames'


def arr(f):
    return np.array(Image.open('%s/f%04d.png' % (FR, f)).convert('RGBA')).astype(int)


a1, a7, a13 = arr(1), arr(7), arr(13)
d17 = np.abs(a1 - a7).max(axis=2)
d713 = np.abs(a7 - a13).max(axis=2)
d113 = np.abs(a1 - a13).max(axis=2)
for name, d in (('f1-f7', d17), ('f7-f13', d713), ('f1-f13', d113)):
    n = int((d > 25).sum())
    print('%s: px>25 %d' % (name, n))
    if n:
        ys, xs = np.nonzero(d > 25)
        print('   bbox [%d,%d,%d,%d]' % (xs.min(), ys.min(), xs.max(), ys.max()))
# ear region = rows < 300 (canvas raw, chua flip); leg region rows > 700
for name, d in (('f1-f7', d17),):
    for tag, sl in (('ear(rows<300)', d[:300, :]), ('mid(300-700)', d[300:700, :]),
                    ('legs(rows>700)', d[700:, :])):
        print('%s %s px>25: %d' % (name, tag, int((sl > 25).sum())))
