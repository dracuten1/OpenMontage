#!/usr/bin/env python3
"""FIX5 QC cua lead: trich still dung frame mid-open cue + cap frame run."""
from PIL import Image
import os

os.chdir(os.path.join(os.path.dirname(__file__), "out"))
os.makedirs("qc_self", exist_ok=True)

for name, f in [("fix5_f123_mouth", 123), ("fix5_f124", 124), ("fix5_f48", 48), ("fix5_f54", 54)]:
    im = Image.open(f"frames/f{f:04d}.png").convert("RGB").transpose(Image.FLIP_TOP_BOTTOM)
    im.save(f"qc_self/{name}.jpg", quality=92)
    print(name, im.size)
