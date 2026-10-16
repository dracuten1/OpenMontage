#!/usr/bin/env python3
"""Quet mau LUOI HONG (chi ton tai khi mo mieng) tren raw + mp4 de tim offset va doan mo that."""
from PIL import Image
import subprocess, os

os.chdir(os.path.join(os.path.dirname(__file__), "out"))
REF = (0xE8, 0x83, 0x7A); TOL = 30

def pink_px(im, box):
    n = 0
    for r, g, b in im.crop(box).getdata():
        if abs(r-REF[0]) <= TOL and abs(g-REF[1]) <= TOL and abs(b-REF[2]) <= TOL:
            n += 1
    return n

# RAW: box vung mat (saved coords, mieng ~ (895,546))
RAW_BOX = (830, 470, 980, 620)
raw_open = []
print("RAW frames 109-216 tongue_px:")
for f in range(109, 217):
    im = Image.open(f"frames/f{f:04d}.png").convert("RGB")
    n = pink_px(im, RAW_BOX)
    if n > 150: raw_open.append(f)
print("RAW_OPEN:", raw_open)

# MP4: moi frame 4.5-9.0s
tmp = "/tmp/mp4pink"; os.makedirs(tmp, exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "4.5", "-to", "9.0",
                "-i", "rabbit_rig_demo_1080.mp4", f"{tmp}/m%03d.png"], check=True)
MP_BOX = (180, 620, 560, 820)
mp_open = []
files = sorted(os.listdir(tmp))
for i, fn in enumerate(files):
    t = 4.5 + i/24
    n = pink_px(Image.open(f"{tmp}/{fn}").convert("RGB"), MP_BOX)
    if n > 100: mp_open.append(round(t, 3))
print("MP4_OPEN_t:", mp_open)
