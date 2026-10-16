import os
import numpy as np
from PIL import Image

COMP = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/out/comp'
SCR = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/out/scratch'


def upper_cx(f):
    a = np.array(Image.open('%s/c%04d.png' % (COMP, f)).convert('RGB')).astype(int)
    # sprite vung: dung chenh lech mau so voi bg khong de dang — dung RAW frames
    return None


def raw_upper(f):
    with Image.open('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/out/frames/f%04d.png' % f) as im:
        a = np.array(im.convert('RGBA'))
    am = a[:, :, 3] > 0.1
    H = am.shape[0]
    top = am[:int(H * 0.45), 500:1150]      # nha tren (tai+dau) vung x cua content
    ys, xs = np.nonzero(top)
    return float(xs.mean()) + 500 if len(xs) else -1


# lean phase: th = 2pi(f-1)/12, osc = 3*sin -> max lean fwd tai th=90 (f4), min tai f10
for f in (4, 10, 16, 22):
    print('f%03d upper_cx=%.1f' % (f, raw_upper(f)))
c4, c10 = raw_upper(4), raw_upper(10)
print('lean sway pk-pk = %.1f px (ky vong >=40)' % abs(c4 - c10))

# ear tip x: tai region = rows<250 canvas -> raw rows > 774; track max-x cua tai
def ear_tip(f):
    with Image.open('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/out/frames/f%04d.png' % f) as im:
        a = np.array(im.convert('RGBA'))
    am = a[:, :, 3] > 0.1
    ear = am[774:1000, :]                  # raw rows (canvas top)
    ys, xs = np.nonzero(ear)
    return (int(xs.min()), int(xs.max())) if len(xs) else None


for f in (1, 4, 7, 10):
    print('f%03d ear tip x-range=%s' % (f, ear_tip(f)))

# filmstrip 1 chu ky (f1,f4,f7,f10) de doc motion
tiles = []
for f in (1, 4, 7, 10):
    with Image.open('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/out/frames/f%04d.png' % f) as im:
        t = im.convert('RGBA').transpose(Image.FLIP_TOP_BOTTOM).crop((450, 0, 1150, 1024))
        bg = Image.new('RGBA', t.size, (120, 160, 120, 255))
        bg.alpha_composite(t)
        tiles.append(bg.convert('RGB').resize((350, 358)))
strip = Image.new('RGB', (350 * 4 + 30, 358), 'white')
for i, t in enumerate(tiles):
    strip.paste(t, (i * 360, 0))
strip.save('%s/polish_filmstrip.jpg' % SCR, quality=90)
print('filmstrip saved')
