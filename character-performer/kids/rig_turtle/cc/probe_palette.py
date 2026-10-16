import numpy as np
from PIL import Image

SRC = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/assets/depth_demo/turtle_m0.png'
im = Image.open(SRC).convert('RGBA')
a = np.array(im)
print('size', im.size)
alpha = a[:, :, 3] > 10
ys, xs = np.nonzero(alpha)
print('content bbox', xs.min(), ys.min(), xs.max(), ys.max(), 'alpha_px', int(alpha.sum()))

# sample mau tai cac vung theo vision
regions = {
    'shell_dome_top': (500, 200), 'shell_mid': (400, 450), 'shell_rim': (600, 740),
    'scute_line': (300, 300), 'underside': (550, 790),
    'head_top': (1180, 280), 'head_mid': (1250, 430), 'snout': (1440, 420),
    'leg_nf': (900, 760), 'leg_ff': (1200, 760), 'leg_nh': (200, 780), 'leg_fh': (480, 820),
    'tail': (140, 600), 'eye_L': (1150, 470), 'mouth_area': (1300, 530),
}
for name, (x, y) in regions.items():
    px = a[y, x]
    print('%-16s (%4d,%4d) RGBA=%s' % (name, x, y, tuple(int(v) for v in px)))

# phan loai mau: dem ty le pixel theo he (R-G, R-B) trong toan content
rg = a[:, :, 0].astype(int) - a[:, :, 1].astype(int)
rb = a[:, :, 0].astype(int) - a[:, :, 2].astype(int)
gb = a[:, :, 1].astype(int) - a[:, :, 2].astype(int)
m = alpha & (rg > 25) & (rb > 40)          # vang/cam (shell)
print('shell-ish px (R-G>25, R-B>40):', int(m.sum()))
m2 = alpha & (gb > 15) & (rg < 20)         # xanh la (skin)
print('skin-ish px (G-B>15, R-G<20):', int(m2.sum()))
