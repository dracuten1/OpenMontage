#!/usr/bin/env python3
from PIL import Image
im = Image.open('out/patches/mouth_open.png').convert('RGBA')
REF = (0xE8, 0x83, 0x7A); TOL = 30
n = sum(1 for r, g, b, a in im.getdata() if a > 200 and abs(r-REF[0]) <= TOL and abs(g-REF[1]) <= TOL and abs(b-REF[2]) <= TOL)
print('out/patches/mouth_open.png pink_px:', n, 'size:', im.size)
alpha = im.split()[3]
print('alpha bbox:', alpha.getbbox())
