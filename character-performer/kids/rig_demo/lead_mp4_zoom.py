#!/usr/bin/env python3
"""Crop-zoom mat tho trong MP4 full-res tai 3 thoi diem de vision chan kep."""
from PIL import Image
import subprocess, os

os.chdir(os.path.join(os.path.dirname(__file__), "out"))
tmp = "/tmp/mp4zoom"; os.makedirs(tmp, exist_ok=True)
for t in ["5.12", "5.30", "6.20"]:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", t, "-i", "rabbit_rig_demo_1080.mp4",
                    "-frames:v", "1", f"{tmp}/t{t}.png"], check=True)
    im = Image.open(f"{tmp}/t{t}.png").convert("RGB")
    # sprite talk: cx~0.32*1080=346, cy 0.88*1080=950; mat ~ (346, 760) -> crop rong
    crop = im.crop((200, 660, 560, 900)).resize((720, 480), Image.Resampling.NEAREST)
    crop.save(f"qc_self/fix5_mp4zoom_t{t}.jpg", quality=95)
    print("saved", t)
