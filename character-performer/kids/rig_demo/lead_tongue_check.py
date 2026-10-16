#!/usr/bin/env python3
"""Kiem tra pink trong mouth_open.png + zoom crop f123 raw (flip) 4x quanh mieng."""
from PIL import Image
import os

os.chdir(os.path.join(os.path.dirname(__file__)))
REF = (0xE8, 0x83, 0x7A); TOL = 30

for p in ["cc/mouth_open.png", "parts2/head_mO.png"]:
    if not os.path.exists(p): print(p, "KHONG TON TAI"); continue
    im = Image.open(p).convert("RGBA")
    n = sum(1 for r, g, b, a in im.getdata() if a > 200 and abs(r-REF[0]) <= TOL and abs(g-REF[1]) <= TOL and abs(b-REF[2]) <= TOL)
    print(p, "pink_px:", n, "size:", im.size)

# zoom f123 (saved) quanh mieng (895,546) -> flip cho dung chieu
f = Image.open("out/frames/f0123.png").convert("RGB")
crop = f.crop((820, 480, 980, 620)).transpose(Image.FLIP_TOP_BOTTOM)
crop = crop.resize((640, 560), Image.Resampling.NEAREST)
crop.save("out/qc_self/fix5_f123_mouthzoom.jpg", quality=95)
print("zoom saved")
