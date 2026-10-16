#!/usr/bin/env python3
"""turn6 QC (USER VETO v5 -> v6) — 2 fixes: (1) S2b close-up 10.9-12.4 removed
(camera identity), (2) bg6 gate removed (bg6_walk_v2). Everything else must be
bit-identical to v5.

Gates (vs turn5/v5_stills remotion stills, deterministic):
 G1 identity outside the 2 fix windows: f0100 f0190 (S0/S1) f0780 f0920 f1150
    (S5/S6/S7) -> mean|diff| < 0.5 (expect 0.0000)   [turn5's 2 diff-0 gates]
 G2 kept close-up S3b: f0470 f0527 -> < 0.5 (expect 0.0000)
 G3 fixes are real: f0340 (ex-zoom 11.33s) diff > 5; f0600 (20.0s gate) diff > 5
    AND f0600 diff confined check: diff outside gate screen box must be ~0
 G4 camera-static new identity window 9.91-15.3: sky-patch f0330 vs f0450 < 2.0
 G5 ffprobe: 1230 frames / ~41.045s / 1080x1080 / 30fps / aac stereo
 G6 banner-gone on v6 mp4 @19.5/20.0/20.5: red-cloth px in screen box ~0
    (v5 measured for comparison)
 G7 S3b close-up still zooming (kept): sky-patch diff f0470 vs f0527 region
    shows non-identity => just report f0340 diff number (camera table in report)
"""
import json, subprocess
from PIL import Image
import numpy as np

R = "/Users/tuyennguyen/project/OpenMontage"
V5 = f"{R}/character-performer/kids/turn5/v5_stills"
V6 = f"{R}/character-performer/kids/turn6/v6_stills"
V5MP4 = f"{R}/remotion-composer/out/kids_ep1_remake_v5.mp4"
V6MP4 = f"{R}/remotion-composer/out/kids_ep1_remake_v6.mp4"
OUT = f"{R}/character-performer/kids/turn6/turn6_qc.json"

def img(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float32)

def mdiff(a, b, box=None):
    x = img(a); y = img(b)
    if box:
        x = x[box[1]:box[3], box[0]:box[2]]
        y = y[box[1]:box[3], box[0]:box[2]]
    return float(np.abs(x - y).mean())

res = {"g1_identity_outside": {}, "g2_kept_s3b_closeup": {}, "g3_fixes_real": {},
       "g3b_f0600_confined": {}, "g4_camera_static": {}, "g5_ffprobe": {},
       "g6_banner_gone": {}, "pass": None}
ok = True

print("== G1 identity ngoài 2 cửa sửa (gate < 0.5, expect 0.0000)")
for f in [100, 190, 780, 920, 1150]:
    n = f"f{f:04d}"
    d = mdiff(f"{V5}/{n}.png", f"{V6}/{n}.png")
    res["g1_identity_outside"][n] = d
    p = d < 0.5
    ok = ok and p
    print(f"  {n}: {d:.4f} {'PASS' if p else 'FAIL'}")

print("== G2 close-up S3b giữ nguyên (gate < 0.5, expect 0.0000)")
for f in [470, 527]:
    n = f"f{f:04d}"
    d = mdiff(f"{V5}/{n}.png", f"{V6}/{n}.png")
    res["g2_kept_s3b_closeup"][n] = d
    p = d < 0.5
    ok = ok and p
    print(f"  {n}: {d:.4f} {'PASS' if p else 'FAIL'}")

print("== G3 2 fix là thật (gate > 5)")
for f, why in [(340, "ex-zoom 11.33s"), (600, "gate 20.0s")]:
    n = f"f{f:04d}"
    d = mdiff(f"{V5}/{n}.png", f"{V6}/{n}.png")
    res["g3_fixes_real"][n] = d
    p = d > 5
    ok = ok and p
    print(f"  {n} ({why}): {d:.4f} {'PASS' if p else 'FAIL'}")

print("== G3b f0600 diff confined to gate screen area x[180,900] y[140,430]")
x = img(f"{V5}/f0600.png"); y = img(f"{V6}/f0600.png")
dmap = np.abs(x - y).mean(axis=2)
inbox = dmap[170:280, 220:860]
outside = dmap.copy()
outside[140:430, 180:900] = 0  # full gate area: cloth y186-263 + posts feet to screen y~400
d_out = float(outside.mean())
d_in = float(inbox.mean())
res["g3b_f0600_confined"] = {"in_box": d_in, "outside_box": d_out}
p = d_out < 2.0
ok = ok and p
print(f"  in-box {d_in:.2f} | outside {d_out:.4f} {'PASS' if p else 'FAIL'} (gate < 2.0)")

print("== G4 camera tĩnh window identity 9.91-15.3 (sky-patch, gate < 2.0)")
SKY = (60, 20, 260, 90)
d = mdiff(f"{V6}/f0330.png", f"{V6}/f0450.png", SKY)
res["g4_camera_static"]["f0330~f0450"] = d
p = d < 2.0
ok = ok and p
print(f"  f0330~f0450 sky: {d:.4f} {'PASS' if p else 'FAIL'}")

print("== G5 ffprobe")
pr = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
                     "-show_entries", "stream=nb_read_frames,width,height,r_frame_rate",
                     "-show_entries", "format=duration", "-of", "json", V6MP4],
                    capture_output=True, text=True)
meta = json.loads(pr.stdout)
has_audio = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a",
                            "-show_entries", "stream=codec_type,sample_rate,channels",
                            "-of", "csv=p=0", V6MP4], capture_output=True, text=True).stdout.strip()
nf = int(meta["streams"][0]["nb_read_frames"])
w = meta["streams"][0]["width"]; h = meta["streams"][0]["height"]
dur = float(meta["format"]["duration"])
p = nf == 1230 and w == 1080 and h == 1080 and abs(dur - 41.045) < 0.1 and "audio" in has_audio
ok = ok and p
res["g5_ffprobe"] = {"frames": nf, "w": w, "h": h, "duration": dur, "audio": has_audio}
print(f"  {nf} frames {w}x{h} {dur:.3f}s audio={has_audio} {'PASS' if p else 'FAIL'}")

print("== G6 banner đỏ biến mất @19.5/20.0/20.5 (mp4 extract, red-cloth box)")
import os
SCR = "/Users/tuyennguyen/.hermes/profiles/video/cache/scratch/turn6_frames"
os.makedirs(SCR, exist_ok=True)
for ts in ["19.5", "20.0", "20.5"]:
    for tag, mp4 in [("v5", V5MP4), ("v6", V6MP4)]:
        out = f"{SCR}/{tag}_{ts}.png"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", ts, "-i", mp4,
                        "-frames:v", "1", out], check=True)
def redbox(p, box):
    a = img(p)
    x0, y0, x1, y1 = box
    a = a[y0:y1, x0:x1]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return int(((r > 120) & (r > g * 1.55) & (r > b * 1.55)).sum())
BOX = (240, 180, 850, 268)  # cloth screen box @camZ 1.02
for ts in ["19.5", "20.0", "20.5"]:
    v5c = redbox(f"{SCR}/v5_{ts}.png", BOX)
    v6c = redbox(f"{SCR}/v6_{ts}.png", BOX)
    p = v6c < 2000
    ok = ok and p
    res["g6_banner_gone"][ts] = {"v5": v5c, "v6": v6c}
    print(f"  t={ts}s red-cloth px v5={v5c} -> v6={v6c} {'PASS' if p else 'FAIL'}")

res["pass"] = bool(ok)
json.dump(res, open(OUT, "w"), indent=1)
print(f"\nOVERALL: {'PASS' if ok else 'FAIL'}  -> {OUT}")
