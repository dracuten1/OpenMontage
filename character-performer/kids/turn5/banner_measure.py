#!/usr/bin/env python3
"""Đo bề rộng banner đỏ (bg3_duel) trên các frame — kiểm chứng camZ thực tế.
Kỳ vọng: width(close)/width(identity) ≈ camZ (1.22 / 1.18)."""
import numpy as np
from PIL import Image

R = "/Users/tuyennguyen/project/OpenMontage/character-performer/kids/turn5"

def banner_width(path):
    a = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)
    band = a[80:420, :, :]  # vùng banner trên nền trời
    r, g, b = band[..., 0], band[..., 1], band[..., 2]
    red = (r > 130) & (r > g * 1.6) & (r > b * 1.6)  # đỏ banner (tránh trời xanh/cỏ xanh)
    cols = red.sum(axis=0)
    idx = np.where(cols > 8)[0]
    if len(idx) == 0:
        return None, 0
    return (int(idx[0]), int(idx[-1])), int(idx[-1] - idx[0] + 1)

frames = {
    "w0150  identity 5.0s (bg3)": f"{R}/probe/w0150.png",
    "w0373  identity 12.43s (bg3)": f"{R}/probe/w0373.png",
    "w0328  CLOSE 1.22 10.93s": f"{R}/probe/w0328.png",
    "f0340  CLOSE 1.22 11.33s": f"{R}/v5_stills/f0340.png",
    "mp4f361 CLOSE 1.22 12.03s": f"{R}/probe/mouth_f0361.png",
    "f0470  CLOSE 1.18 15.67s": f"{R}/v5_stills/f0470.png",
    "f0190  identity 6.33s": f"{R}/v5_stills/f0190.png",
}
res = {}
for k, p in frames.items():
    bbox, w = banner_width(p)
    res[k] = (bbox, w)
    print(f"{k:34s} bbox={bbox} width={w}px")

wid = res["w0150  identity 5.0s (bg3)"][1]
wid2 = res["w0373  identity 12.43s (bg3)"][1]
for k in ["w0328  CLOSE 1.22 10.93s", "f0340  CLOSE 1.22 11.33s", "mp4f361 CLOSE 1.22 12.03s"]:
    print(f"ratio {k}: {res[k][1]/wid:.3f} (ky vong ~1.22)")
print(f"ratio f0470 CLOSE 1.18: {res['f0470  CLOSE 1.18 15.67s'][1]/wid2:.3f} (ky vong ~1.18)")
print(f"identity check f0190/w0150: {res['f0190  identity 6.33s'][1]/wid:.3f} (ky vong ~1.00)")
