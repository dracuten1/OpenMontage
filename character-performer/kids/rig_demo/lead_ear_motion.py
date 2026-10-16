#!/usr/bin/env python3
"""Do bien do TAI: diff alpha vung dinh dau (tren dung tai) giua cac cap frame run."""
from PIL import Image, ImageChops
import os

os.chdir(os.path.join(os.path.dirname(__file__), "out"))

def ear_motion(fa, fb):
    a = Image.open(f"frames/f{fa:04d}.png").convert("RGBA")
    b = Image.open(f"frames/f{fb:04d}.png").convert("RGBA")
    # vung tai: nua tren cua sprite (alpha bbox cua frame chuan)
    bbox = a.split()[3].getbbox()
    x0, y0, x1, y1 = bbox
    top_h = int((y1 - y0) * 0.38)  # 38% phan tren = tai + dinh dau
    box = (x0, y0, x1, y0 + top_h)
    aa = a.crop(box).split()[3]
    bb = b.crop(box).split()[3]
    diff = ImageChops.difference(aa, bb)
    return sum(1 for v in diff.getdata() if v > 40), box

pairs = [(46, 50), (48, 54), (50, 58), (60, 66), (72, 78), (90, 96)]
print("fa fb ear_diff_px (vung tai+ dinh dau)")
for fa, fb in pairs:
    n, box = ear_motion(fa, fb)
    print(fa, fb, n, box)

# bien do tai TOI DA: quet moi cap cach 4 frame trong 40..108
best = (0, None)
for fa in range(40, 105, 4):
    for fb in range(fa+4, min(fa+16, 109), 4):
        n, _ = ear_motion(fa, fb)
        if n > best[0]: best = (n, (fa, fb))
print("MAX_EAR_DIFF:", best)
