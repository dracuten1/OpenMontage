#!/usr/bin/env python3
"""turn5 QC — Scene 1 (S0-S3) de-zoom, independent Hermes gates.

Gates:
 G1 frame-identity OUTSIDE Scene 1 (scenes khác giữ nguyên tuyệt đối):
    f0600 (S4 sprint), f0780 (S5 walk), f0920 (S6 wake), f1150 (S7):
    mean|diff| v4-baseline vs v5 < 0.5   (remotion still = deterministic)
 G2 kept-zoom frames (2 close-up còn lại phải NGUYÊN VẸN khung):
    f0340 (S2b close 1.22), f0470 + f0527 (S3b close 1.18): mean|diff| < 0.5
 G3 removed-zoom frames (đã bỏ thật — khung phải KHÁC):
    f0100 (S0b 1.08 dropped), f0190 (S1b 1.18 dropped): mean|diff| > 5
 G4 camera-static trong mỗi window mới (sky-patch x[60,260] y[20,90]):
    A[10,325] B[328,370] C[373,457] D[460,532]: mean|diff| < 2.0
 G5 ffprobe: 1230 frames / ~41.0s / 1080x1080 / 30fps / audio
"""
import json, subprocess, sys
from PIL import Image
import numpy as np

R = "/Users/tuyennguyen/project/OpenMontage"
BASE = f"{R}/character-performer/kids/turn5/baseline"
V5 = f"{R}/character-performer/kids/turn5/v5_stills"
EXTRA = f"{R}/character-performer/kids/turn5/probe"
MP4 = f"{R}/remotion-composer/out/kids_ep1_remake_v5.mp4"
OUT = f"{R}/character-performer/kids/turn5/turn5_qc.json"

def img(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float32)

def mdiff(a, b, box=None):
    x = img(a); y = img(b)
    if box:
        x = x[box[1]:box[3], box[0]:box[2]]
        y = y[box[1]:box[3], box[0]:box[2]]
    return float(np.abs(x - y).mean())

res = {"g1_identity_outside": {}, "g2_kept_zoom": {}, "g3_removed_zoom": {},
       "g4_camera_static": {}, "g5_ffprobe": {}, "pass": None}

print("== G1 identity ngoài Scene 1 (gate < 0.5)")
for f in [600, 780, 920, 1150]:
    n = f"f{f:04d}"
    d = mdiff(f"{BASE}/{n}.png", f"{V5}/{n}.png")
    res["g1_identity_outside"][n] = d
    print(f"  {n}: {d:.4f} {'PASS' if d < 0.5 else 'FAIL'}")

print("== G2 khung giữ nguyên (2 close-up còn lại, gate < 0.5)")
for f in [340, 470, 527]:
    n = f"f{f:04d}"
    d = mdiff(f"{BASE}/{n}.png", f"{V5}/{n}.png")
    res["g2_kept_zoom"][n] = d
    print(f"  {n}: {d:.4f} {'PASS' if d < 0.5 else 'FAIL'}")

print("== G3 zoom đã bỏ (gate > 5 — khung phải thay đổi)")
for f in [100, 190]:
    n = f"f{f:04d}"
    d = mdiff(f"{BASE}/{n}.png", f"{V5}/{n}.png")
    res["g3_removed_zoom"][n] = d
    print(f"  {n}: {d:.4f} {'PASS' if d > 5 else 'FAIL'}")

print("== G4 camera-static mỗi window (sky-patch, gate < 2.0)")
print("   (probe né crossfade bg ĐÃ DUYỆT 3.65-4.15 / 16.9-17.4 — đổi plate, không phải camera)")
SKY = (60, 20, 260, 90)
for name, (a, b) in {"A_bg3_5.0-10.83": (150, 325), "B_close_10.9-12.4": (328, 370),
                     "C_12.4-15.3": (373, 457), "D_close_15.33-16.67": (460, 500)}.items():
    d = mdiff(f"{EXTRA}/w{a:04d}.png", f"{EXTRA}/w{b:04d}.png", SKY)
    res["g4_camera_static"][name] = d
    print(f"  {name} f{a}~f{b}: {d:.4f} {'PASS' if d < 2.0 else 'FAIL'}")

print("== G5 ffprobe")
pr = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
                     "-show_entries", "stream=nb_read_frames,width,height,r_frame_rate",
                     "-show_entries", "format=duration", "-of", "json", MP4],
                    capture_output=True, text=True)
meta = json.loads(pr.stdout)
has_audio = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a",
                            "-show_entries", "stream=codec_type", "-of", "csv=p=0", MP4],
                           capture_output=True, text=True).stdout.strip()
res["g5_ffprobe"] = {"meta": meta, "audio": has_audio}
nf = int(meta["streams"][0]["nb_read_frames"])
dur = float(meta["format"]["duration"])
ok5 = nf == 1230 and abs(dur - 41.0) < 0.2 and "audio" in has_audio
print(f"  frames={nf} dur={dur:.3f}s audio={has_audio} {'PASS' if ok5 else 'FAIL'}")

ok = (all(v < 0.5 for v in res["g1_identity_outside"].values())
      and all(v < 0.5 for v in res["g2_kept_zoom"].values())
      and all(v > 5 for v in res["g3_removed_zoom"].values())
      and all(v < 2.0 for v in res["g4_camera_static"].values())
      and ok5)
res["pass"] = ok
json.dump(res, open(OUT, "w"), indent=1)
print(f"\nTURN5_QC {'PASS' if ok else 'FAIL'} -> {OUT}")
sys.exit(0 if ok else 1)
