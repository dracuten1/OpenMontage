#!/usr/bin/env python3
"""Drift chuẩn cho matched pairs: chỉ vùng ĐẶC (alpha>150 cả 2 ảnh), loại vùng thay đổi chủ đích.
- mO_full/blink_full vs m0: loại vùng miệng/mắt; vùng đặc ngoài đó phải ≤0.5%.
- head_mO/head_blink vs head: tương tự trên canvas head part."""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.expanduser("~/project/OpenMontage/character-performer/kids/rig_demo")

def drift_masked(a_path, b_path, exclude_boxes=None, athr=150):
    A = np.asarray(Image.open(a_path).convert("RGBA")).astype(np.int16)
    B = np.asarray(Image.open(b_path).convert("RGBA")).astype(np.int16)
    m = (A[..., 3] > athr) & (B[..., 3] > athr)
    for (x0, y0, x1, y1) in (exclude_boxes or []):
        m[y0:y1, x0:x1] = False
    d = np.abs(A - B).mean(axis=2)[m]
    return float(d.mean() / 255 * 100), int(m.sum())

R = {}
# cặp canvas-m0 (tham khảo)
M0 = f"{ROOT}/parts/_m0_ref.png"
R["mO_full_vs_m0_solid_excl_mouth"], R["mO_pixels"] = drift_masked(
    M0, f"{ROOT}/parts/mO_full.png", exclude_boxes=[(950, 430, 1180, 600)])
R["blink_full_vs_m0_solid_excl_eyes"], R["blink_pixels"] = drift_masked(
    M0, f"{ROOT}/parts/blink_full.png", exclude_boxes=[(920, 380, 1060, 470)])
# cặp head-part (dùng cho patch)
HEAD = f"{ROOT}/parts/head.png"
if os.path.exists(f"{ROOT}/parts2/head_mO.png"):
    R["head_mO_vs_head_solid_excl_mouth"], R["hmO_pixels"] = drift_masked(
        HEAD, f"{ROOT}/parts2/head_mO.png", exclude_boxes=[(960, 480, 1170, 620)])
if os.path.exists(f"{ROOT}/parts2/head_blink.png"):
    R["head_blink_vs_head_solid_excl_eyes"], R["hb_pixels"] = drift_masked(
        HEAD, f"{ROOT}/parts2/head_blink.png", exclude_boxes=[(920, 380, 1060, 480)])
print(json.dumps(R, indent=1))
json.dump(R, open(f"{ROOT}/drift_report.json", "w"), indent=1)

# annulus quanh miệng/mắt: vùng quyết định seam của patch
def annulus(a_path, b_path, cx, cy, r0, r1, athr=150):
    A = np.asarray(Image.open(a_path).convert("RGBA")).astype(np.int16)
    B = np.asarray(Image.open(b_path).convert("RGBA")).astype(np.int16)
    m = (A[..., 3] > athr) & (B[..., 3] > athr)
    yy, xx = np.mgrid[0:1024, 0:1536]
    rr = np.hypot(xx - cx, yy - cy)
    m &= (rr >= r0) & (rr <= r1)
    return round(float(np.abs(A - B).mean(axis=2)[m].mean() / 255 * 100), 3), int(m.sum())

R["mouth_annulus_45_100_pct_px"] = annulus(f"{ROOT}/parts/head.png", f"{ROOT}/parts2/head_mO.png", 1065, 548, 45, 100)
R["eye_annulus_40_90_pct_px"] = annulus(f"{ROOT}/parts/head.png", f"{ROOT}/parts2/head_blink.png", 985, 430, 40, 90)
print(json.dumps(R, indent=1))
json.dump(R, open(f"{ROOT}/drift_report.json", "w"), indent=1)

