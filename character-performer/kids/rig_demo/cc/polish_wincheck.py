import os
import numpy as np
from PIL import Image

FR = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/out/frames'
WIN = {'run': (485, 55, 943, 995), 'talk': (485, 40, 943, 870)}


def bbox(f):
    with Image.open('%s/f%04d.png' % (FR, f)) as im:
        return im.convert('RGBA').getbbox()


for shot, rng in (('run', range(1, 109)), ('talk', range(110, 217))):
    bbs = [b for b in (bbox(f) for f in rng) if b]
    c0 = min(b[0] for b in bbs); r0 = min(b[1] for b in bbs)
    c1 = max(b[2] for b in bbs); r1 = max(b[3] for b in bbs)
    l, t, r, btm = WIN[shot]
    dx = max(l - c0, c1 - r, 0)
    dy = max(t - r0, r1 - btm, 0)
    print('%s: content [%d,%d,%d,%d] window %s -> dx=%d dy=%d %s'
          % (shot, c0, r0, c1, r1, WIN[shot], dx, dy,
             'INSIDE' if dx == dy == 0 else 'EXCEEDS'))
    print('   rest f1 bbox: %s   H_content=%d' % (bbox(1), r1 - r0 + 1))
