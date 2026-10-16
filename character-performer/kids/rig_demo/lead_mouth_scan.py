#!/usr/bin/env python3
"""Lead doc-lap: quet khoang mieng (mau #3a1b12) tren raw frames 100-160 + xuat frame MP4 tai mid-cue."""
from PIL import Image
import subprocess, os

os.chdir(os.path.join(os.path.dirname(__file__), "out"))
REF = (0x3A, 0x1B, 0x12)  # long mieng
TOL = 40

def cavity_px(im, box):
    crop = im.crop(box)
    px = crop.getdata()
    n = 0
    for r, g, b in px:
        if abs(r - REF[0]) <= TOL and abs(g - REF[1]) <= TOL and abs(b - REF[2]) <= TOL:
            n += 1
    return n

# Vung mieng tren anh SAVED (y chua flip: mouth display (895,478) -> saved y=546)
BOX = (850, 500, 960, 600)
print("frame cavity_px")
rows = []
for f in range(100, 161):
    im = Image.open(f"frames/f{f:04d}.png").convert("RGB")
    n = cavity_px(im, BOX)
    rows.append((f, n))
    print(f, n)

openc = [f for f, n in rows if n > 1200]
print("OPEN_FRAMES(mau long mieng >1200px):", openc)

# Trich 3 frame MP4 quanh 5.0-5.3s
for t in ["5.00", "5.12", "5.25"]:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", t, "-i", "rabbit_rig_demo_1080.mp4",
                    "-frames:v", "1", f"qc_self/fix5_mp4_t{t}.jpg"], check=True)
print("mp4 frames xong")
