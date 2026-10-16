#!/usr/bin/env python3
"""Quet cavity mieng tren CHINH MP4 (every frame 4.4-6.6s) + doc d0_cues.json de doi chieu sync."""
from PIL import Image
import subprocess, os, json

os.chdir(os.path.join(os.path.dirname(__file__), "out"))
REF = (0x3A, 0x1B, 0x12); TOL = 40
# Vung mat sprite trong composite: probe CC dung face [226,680,466,790]
BOX = (226, 660, 500, 800)

tmp = "/tmp/mp4scan"
os.makedirs(tmp, exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "4.4", "-to", "6.6",
                "-i", "rabbit_rig_demo_1080.mp4", f"{tmp}/s%03d.png"], check=True)

def cavity_px(path):
    im = Image.open(path).convert("RGB")
    n = 0
    for r, g, b in im.crop(BOX).getdata():
        if abs(r-REF[0]) <= TOL and abs(g-REF[1]) <= TOL and abs(b-REF[2]) <= TOL:
            n += 1
    return n

print("t_s cavity_px")
segs = []
for i in range(1, 54):
    t = 4.4 + (i-1)/24
    n = cavity_px(f"{tmp}/s{i:03d}.png")
    if n > 1200: segs.append(t)
    print(f"{t:.3f} {n}")

print("OPEN_TIMES_MP4:", [f'{t:.3f}' for t in segs])

cj = json.load(open("/Users/tuyennguyen/project/OpenMontage/character-performer/kids/dialogue_v2/d0_cues.json"))
print("CUES_JSON:", json.dumps(cj)[:600])
