import numpy as np
from PIL import Image
from scipy import ndimage

SRC = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/assets/depth_demo/turtle_m0.png'
PARTS = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle/out/parts'
m0 = np.array(Image.open(SRC).convert('RGBA')).astype(int)
alpha = m0[:, :, 3] > 10
R, G = m0[:, :, 0], m0[:, :, 1]
skin = alpha & (np.abs(R - G) < 18) & ((m0[:, :, 1] - m0[:, :, 2]) > 50)
lab_skin, n1 = ndimage.label(skin, np.ones((3, 3)))
print('head comp id (1150,470)?', lab_skin[470, 1150], 'alpha', alpha[470, 1150])
for (x, y) in ((1150, 470), (1180, 470), (1390, 440), (1150, 440), (1170, 500)):
    print('(%d,%d): lab_skin=%d alpha=%s' % (x, y, lab_skin[y, x], bool(alpha[y, x])))
# vung mat: bao quanh (1150,470) ban kinh 60 — co bao nhieu px skin?
reg = lab_skin[410:530, 1090:1210]
print('skin px trong vung mat 120x120:', int((reg > 0).sum()))
import collections
print(collections.Counter(reg[reg > 0].tolist()).most_common(5))
for name in ('head', 'shell', 'leg_far_front'):
    mm = np.array(Image.open('%s/%s.png' % (PARTS, name)).convert('RGBA'))[:, :, 3] > 10
    print('%s contains (1150,470): %s ; (1390,440): %s' % (name, bool(mm[470, 1150]), bool(mm[440, 1390])))
