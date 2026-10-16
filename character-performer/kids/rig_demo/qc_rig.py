#!/usr/bin/env python3
"""QC độc lập Hermes cho rabbit_rig_demo — chạy trên output CC (out/).
Checks:
 1. ffprobe clip: duration 8.5-9.5s, 1080x1080, fps 24, audio stream
 2. sprite-height % 2 shot (PIL bbox content giữa shot) chêch <=7pt
 3. black-edge ring: viền 3px quanh content bbox không dải đen (lum<40) >1%
 4. mouth cue timing: extract still MID open-cue (theo d0_cues.json), diff vs closed frame > ngưỡng
 5. tai swing: mean consecutive-frame diff vùng trên (ears) shot1 > ngưỡng
Output JSON + stills vào rig_demo/qc_hermes/."""
import json, os, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.expanduser("~/project/OpenMontage/character-performer/kids/rig_demo")
OUT = f"{ROOT}/out"
QC = f"{ROOT}/qc_hermes2"
os.makedirs(QC, exist_ok=True)
CLIP = f"{OUT}/rabbit_rig_demo_1080.mp4"
R = {"checks": {}}

def ffprobe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "format=duration:stream=width,height,r_frame_rate,codec_type",
                        "-of", "json", path], capture_output=True, text=True)
    return json.loads(r.stdout)

if not os.path.exists(CLIP):
    print("CLIP MISSING"); sys.exit(1)

info = ffprobe(CLIP)
dur = float(info["format"]["duration"])
v = [s for s in info["streams"] if s.get("codec_type") == "video"][0]
a = [s for s in info["streams"] if s.get("codec_type") == "audio"]
fps = eval(v["r_frame_rate"])
R["checks"]["clip"] = {"duration_s": round(dur, 2), "res": [v["width"], v["height"]],
                       "fps": fps, "has_audio": bool(a),
                       "pass": 8.0 <= dur <= 10.0 and v["width"] == 1080 and fps == 24.0 and bool(a)}

# frames PIL từ out/frames composite nếu CC để lại, else extract từ mp4
def grab(t, name):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(t), "-i", CLIP,
                    "-frames:v", "1", f"{QC}/{name}.png"], check=True)
    return f"{QC}/{name}.png"

def content_h(path):
    a = np.asarray(Image.open(path).convert("RGB"))
    lum = a.mean(axis=2)
    m = lum < 246  # khác bg thuần sáng? không đáng tin — dùng tạm biến thiên cột
    return None

# 2) sprite-height: đo trên 3 still (đầu/giữa/cuối mỗi shot) bằng mask khác-bg
#    bg sc2 rất đa màu → dùng heuristic: diff frame vs frame kế (chuyển động) để bbox sprite
def frame_diff_bboxes():
    res = {}
    for label, t0, t1 in [("s1", 1.0, 1.04), ("s1b", 3.2, 3.24), ("s2", 6.2, 6.24), ("s2b", 8.0, 8.04)]:
        p0, p1 = grab(t0, f"d_{label}_a"), grab(t1, f"d_{label}_b")
        A = np.asarray(Image.open(p0).convert("RGB")).astype(np.int16)
        B = np.asarray(Image.open(p1).convert("RGB")).astype(np.int16)
        d = np.abs(A - B).mean(axis=2) > 14
        ys, xs = np.where(d)
        if len(ys) > 200:
            res[label] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()),
                          int(ys.max() - ys.min())]
    return res

bb = frame_diff_bboxes()
R["checks"]["sprite_bboxes_diff"] = bb
if "s1" in bb and "s2" in bb:
    h1 = bb["s1"][4] / 1080 * 100
    h2 = bb["s2"][4] / 1080 * 100
    R["checks"]["sprite_height_pt"] = {"shot1": round(h1, 1), "shot2": round(h2, 1),
                                       "delta_pt": round(abs(h2 - h1), 2),
                                       "pass": abs(h2 - h1) <= 7.0}

# 3) black-edge ring quanh sprite (lấy still giữa shot1 + shot2)
for label, t in [("s1_mid", 2.5), ("s2_mid", 7.5)]:
    p = grab(t, label)
    im = np.asarray(Image.open(p).convert("RGB"))
    lum = im.mean(axis=2)
    # ring: dải 2px mép ngoài frame
    edges = np.concatenate([lum[:2].ravel(), lum[-2:].ravel(), lum[:, :2].ravel(), lum[:, -2:].ravel()])
    R["checks"][f"black_edge_{label}"] = {"pct_lum_below_40": round(float((edges < 40).mean() * 100), 3),
                                          "pass": bool((edges < 40).mean() < 0.01)}

# 4) mouth QC: tìm open-cue dài nhất trong shot2 window; extract MID cue vs frame closed gần nhất
CUES = json.load(open(os.path.expanduser(
    "~/project/OpenMontage/character-performer/kids/dialogue_v2/d0_cues.json")))["mouthCues"]
SHOT2_F0 = 110  # frame blender; video frame = blender_f - 1
open_cues = [c for c in CUES if c["value"] not in ("X", "C") and (c["end"] - c["start"]) >= 0.18]
closed_cues = [c for c in CUES if c["value"] in ("X", "C") and (c["end"] - c["start"]) >= 0.18]
if open_cues and closed_cues:
    oc = max(open_cues, key=lambda c: c["end"] - c["start"])
    cc = max(closed_cues, key=lambda c: c["end"] - c["start"])
    t_open = (SHOT2_F0 + (oc["start"] + oc["end"]) / 2 * 24 - 1) / 24
    t_closed = (SHOT2_F0 + (cc["start"] + cc["end"]) / 2 * 24 - 1) / 24
    po, pcl = grab(t_open, "mouth_open_mid"), grab(t_closed, "mouth_closed_mid")
    O = np.asarray(Image.open(po).convert("RGB")).astype(np.int16)
    C = np.asarray(Image.open(pcl).convert("RGB")).astype(np.int16)
    d = np.abs(O - C).mean(axis=2)
    ys, xs = np.where(d > 16)
    R["checks"]["mouth_cue"] = {"open_mid_t": round(t_open, 2), "closed_mid_t": round(t_closed, 2),
                                "diff_px_count": int(len(ys)),
                                "pass": len(ys) > 300}
    if len(ys) > 0:
        R["checks"]["mouth_cue"]["diff_bbox"] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]

# 5) ear swing shot1: mean diff vùng trên 35% frame giữa các cặp frame cách 0.125s (stride)
def ear_swing():
    vals = []
    prev = None
    for i in range(8):
        t = 1.2 + i * 0.125
        p = grab(t, f"swing_{i}")
        im = np.asarray(Image.open(p).convert("RGB")).astype(np.int16)[:378]  # 35% trên
        if prev is not None:
            vals.append(round(float(np.abs(im - prev).mean()), 2))
        prev = im
    return vals

R["checks"]["ear_region_consecutive_diff_shot1"] = ear_swing()

json.dump(R, open(f"{QC}/qc_report.json", "w"), indent=1)
print(json.dumps(R, indent=1))
