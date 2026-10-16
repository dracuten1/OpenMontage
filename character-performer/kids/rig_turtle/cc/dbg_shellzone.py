import numpy as np
from PIL import Image
import os

PARTS = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle/out/parts'
sh = np.array(Image.open(os.path.join(PARTS, 'shell.png')).convert('RGBA'))
A = sh[:, :, 3] > 10
print('shell tong px:', int(A.sum()))
# vung dau
regions = {
    'head_bbox [852,224,1487,671]': (852, 224, 1487, 671),
    'eye (1074,380,1239,550)': (1074, 380, 1239, 550),
    'near_front [761,601,1082,914]': (761, 601, 1082, 914),
    'tail [78,569,202,645]': (78, 569, 202, 645),
    'vung be (underside y>830)': (0, 830, 1535, 960),
}
for name, (x0, y0, x1, y1) in regions.items():
    print('%-32s shell px = %d' % (name, int(A[y0:y1, x0:x1].sum())))
# shell px NGOAI dome du kien (x<1030): phan ben phai la gi?
right = A.copy()
right[:, :1030] = False
ys, xs = np.nonzero(right)
print('shell px x>1030:', int(right.sum()), 'bbox=[%d,%d,%d,%d]' % (xs.min(), ys.min(), xs.max(), ys.max()) if right.sum() else '')
# luu crop shell vung dau de nhin
crop = Image.fromarray(sh[150:750, 800:1535]).convert('RGBA')
bg = Image.new('RGBA', crop.size, (255, 255, 255, 255))
bg.alpha_composite(crop)
bg.convert('RGB').save('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle/out/dbg_shell_headzone.png')
print('DBG_OK')
