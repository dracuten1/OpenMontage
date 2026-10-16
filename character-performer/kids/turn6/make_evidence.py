#!/usr/bin/env python3
"""Evidence pack: extract 11.5/12.0/12.3/19.5/20.0/20.5 from v6 mp4,
build before(v5)|after(v6) side-by-side boards for 12.0s and 20.0s."""
import subprocess, os
from PIL import Image, ImageDraw

R = "/Users/tuyennguyen/project/OpenMontage"
V6 = f"{R}/remotion-composer/out/kids_ep1_remake_v6.mp4"
OUT = f"{R}/character-performer/kids/turn6/evidence"
os.makedirs(OUT, exist_ok=True)

for ts in ["11.5", "12.0", "12.3", "19.5", "20.0", "20.5"]:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", ts, "-i", V6,
                    "-frames:v", "1", f"{OUT}/v6_{ts}.png"], check=True)
print("extracted v6 frames")

def board(v5p, v6p, out, label_top, label_bot):
    a = Image.open(v5p).convert("RGB"); b = Image.open(v6p).convert("RGB")
    W = 540; Hh = 540
    a = a.resize((W, Hh), Image.Resampling.LANCZOS); b = b.resize((W, Hh), Image.Resampling.LANCZOS)
    bd = Image.new("RGB", (W * 2 + 24, Hh + 70), "#1a1a1a")
    bd.paste(a, (8, 60)); bd.paste(b, (W + 16, 60))
    d = ImageDraw.Draw(bd)
    d.text((12, 18), label_top, fill="#ff8888")
    d.text((W + 20, 18), label_bot, fill="#88ff88")
    bd.save(out)
    print("board:", out)

board("/tmp/v5probe/f_12.0.jpg", f"{OUT}/v6_12.0.png", f"{OUT}/board_12s.jpg",
      "V5 BEFORE 12.0s — zoom 1.22 dang phong RUA (audio: THO thach dau)",
      "V6 AFTER 12.0s — camera identity, rua H260, khong phong")
board("/tmp/v5probe/f_20.0.jpg", f"{OUT}/v6_20.0.png", f"{OUT}/board_20s.jpg",
      "V5 BEFORE 20.0s — cong do gia-dich truoc mat tho",
      "V6 AFTER 20.0s — cong da xoa, duong trongtruoc mat")
