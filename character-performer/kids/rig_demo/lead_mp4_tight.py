#!/usr/bin/env python3
"""Tim offset mp4<->raw: dem px cavity (nau dam) trong hop chat quanh mieng composite + pink looser."""
from PIL import Image
import subprocess, os

os.chdir(os.path.join(os.path.dirname(__file__), "out"))
CAV = (0x3A, 0x1B, 0x12); CTOL = 45
PNK = (0xE8, 0x83, 0x7A); PTOL = 55

tmp = "/tmp/mp4tight"; os.makedirs(tmp, exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "4.4", "-to", "6.6",
                "-i", "rabbit_rig_demo_1080.mp4", f"{tmp}/f%03d.png"], check=True)

print("t_s cavity_px pink_px")
for i, fn in enumerate(sorted(os.listdir(tmp))):
    t = 4.4 + i/24
    im = Image.open(f"{tmp}/{fn}").convert("RGB")
    cav = sum(1 for r, g, b in im.crop((300, 690, 470, 800)).getdata()
              if abs(r-CAV[0]) <= CTOL and abs(g-CAV[1]) <= CTOL and abs(b-CAV[2]) <= CTOL)
    pnk = sum(1 for r, g, b in im.crop((300, 690, 470, 800)).getdata()
              if abs(r-PNK[0]) <= PTOL and abs(g-PNK[1]) <= PTOL and abs(b-PNK[2]) <= PTOL)
    mark = " <== OPEN" if cav > 260 and pnk > 25 else ""
    print(f"{t:.3f} {cav} {pnk}{mark}")
