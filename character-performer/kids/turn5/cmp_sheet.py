#!/usr/bin/env python3
"""turn5: before/after comparison sheet — v4 (trái) vs v5 (phải) cho các frame
zoom đã bỏ (f0100 S0b, f0190 S1b) và giữ (f0340 S2b, f0470 S3b). Mỗi cell 540px."""
from PIL import Image, ImageDraw, ImageFont

R = "/Users/tuyennguyen/project/OpenMontage"
BASE = f"{R}/character-performer/kids/turn5/baseline"
V5 = f"{R}/character-performer/kids/turn5/v5_stills"
OUT = f"{R}/character-performer/kids/turn5/cmp_v4_v5.jpg"

ROWS = [
    ("f0100", "3.3s  S0b  BỎ zoom 1.08 (giờ 1.00)"),
    ("f0190", "6.3s  S1b  BỎ punch 1.18 (giờ 1.00)"),
    ("f0340", "11.3s  S2b  GIỮ close 1.22 (thách đấu d2)"),
    ("f0470", "15.7s  S3b  GIỮ close 1.18 (quyết tâm d3)"),
]
S = 540
H = 46
RESAMPLE = getattr(getattr(Image, "Resampling", Image), "LANCZOS")
sheet = Image.new("RGB", (S * 2 + 12, (S + H) * len(ROWS) + 12), (24, 28, 24))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 24)
except Exception:
    font = ImageFont.load_default()

for i, (f, label) in enumerate(ROWS):
    y = 6 + i * (S + H)
    a = Image.open(f"{BASE}/{f}.png").convert("RGB").resize((S, S), RESAMPLE)
    b = Image.open(f"{V5}/{f}.png").convert("RGB").resize((S, S), RESAMPLE)
    sheet.paste(a, (6, y + H))
    sheet.paste(b, (6 + S + 6, y + H))
    d.text((10, y + 8), f"v4 | {label}", font=font, fill=(255, 210, 120))
    d.text((6 + S + 16, y + 8), "v5", font=font, fill=(140, 255, 160))

sheet.save(OUT, quality=88)
print(OUT, sheet.size)
