import numpy as np
from PIL import Image

FR = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/out/frames'
H = 1024
worst = []
for f in range(1, 109):
    with Image.open('%s/f%04d.png' % (FR, f)) as im:
        b = im.convert('RGBA').getbbox()
    if b:
        top_canvas = H - 1 - b[3]   # raw y1 -> canvas top
        worst.append((top_canvas, f, b))
worst.sort()
for top, f, b in worst[:6]:
    print('f%03d top_canvas=%d raw_bbox=%s' % (f, top, b))
