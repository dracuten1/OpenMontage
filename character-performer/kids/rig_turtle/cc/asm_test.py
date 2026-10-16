import numpy as np
from PIL import Image
import os

BASE = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle'
PARTS = os.path.join(BASE, 'out', 'parts')
m0 = Image.open(os.path.join(BASE, '..', 'assets', 'depth_demo', 'turtle_m0.png')).convert('RGBA')

Z = ['leg_far_hind', 'leg_far_front', 'shell', 'tail', 'head', 'leg_near_hind', 'leg_near_front']
canvas = Image.new('RGBA', m0.size, (0, 0, 0, 0))
for n in Z:
    canvas.alpha_composite(Image.open(os.path.join(PARTS, n + '.png')).convert('RGBA'))
canvas.save(os.path.join(BASE, 'out', 'asm_test.png'))

a = np.array(canvas).astype(int)
b = np.array(m0).astype(int)
diffpx = (np.abs(a - b).max(axis=2) > 12)
print('asm diff px:', int(diffpx.sum()), '/', int((b[:, :, 3] > 10).sum()))
ys, xs = np.nonzero(diffpx)
if len(ys):
    print('diff bbox: [%d,%d,%d,%d]' % (xs.min(), ys.min(), xs.max(), ys.max()))
# crop vung diff de nhin
Image.fromarray((np.hstack([b[:, :, :3], a[:, :, :3]])[max(ys.min()-40,0):ys.max()+40, max(xs.min()-40,0):xs.max()+40]).astype(np.uint8)).save(os.path.join(BASE, 'out', 'asm_diffcrop.png'))
print('ASM_OK')
