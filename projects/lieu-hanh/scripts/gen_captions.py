#!/usr/bin/env python3
"""Generate public/lieu-hanh/captions.json: per-scene caption cues from REAL word
timestamps (global seconds). Cue = sentence; start = first word start; dur = min(next
sentence start, scene end + grace) - start. Two-line wrapping done in TSX. Speech-locked:
cues only appear inside their scene window (clipped at scene bounds)."""
import json, re, sys
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
P = OM / "projects" / "lieu-hanh"
FPS = 30

words_all = json.loads((P / "assets" / "audio" / "transcripts" / "narration_words.json").read_text(encoding="utf-8"))
timing = json.loads((P / "artifacts" / "scene_timing.json").read_text(encoding="utf-8"))
SENT = re.compile(r"[.!?…]")

out = {}
for t in timing["scenes"]:
    sid = t["sceneId"]
    sec = t["sectionId"]
    w0 = t["startFrame"] / FPS
    w1 = (t["startFrame"] + t["durationInFrames"]) / FPS
    words = words_all[sec]
    # sentences fully/partially inside window
    sents = []
    start_idx = None
    for i, w in enumerate(words):
        if start_idx is None and w["start"] >= w0 - 0.25:
            start_idx = i
        if start_idx is not None and SENT.search(w["word"]):
            sents.append((start_idx, i))
            start_idx = None
    if start_idx is not None:
        sents.append((start_idx, len(words) - 1))
    cues = []
    for a, b in sents:
        seg = words[a:b + 1]
        if not seg:
            continue
        cs = seg[0]["start"]
        ce = seg[-1]["end"]
        text = " ".join(x["word"] for x in seg).strip()
        if not text:
            continue
        # split long sentences so every cue wraps to <= 2 lines (46 chars/line)
        if len(text) > 92 and len(seg) >= 2:
            half = len(seg) // 2
            best = min(range(1, len(seg)), key=lambda k: abs(k - half)) if len(seg) > 2 else 1
            t1 = " ".join(x["word"] for x in seg[:best]).strip()
            t2 = " ".join(x["word"] for x in seg[best:]).strip()
            if t1 and t2:
                cues.append({"start": round(cs, 2), "end": round(seg[best - 1]["end"], 2), "text": t1})
                cues.append({"start": round(seg[best]["start"], 2), "end": round(ce, 2), "text": t2})
                continue
        cues.append({"start": round(cs, 2), "end": round(ce, 2), "text": text})
    # dedupe overlapping cues across scene seams: keep cues whose start is within [w0, w1)
    cues = [c for c in cues if w0 - 0.3 <= c["start"] < w1]
    out[sid] = {"window": [round(w0, 2), round(w1, 2)], "cues": cues}

dst = OM / "remotion-composer" / "public" / "lieu-hanh" / "captions.json"
dst.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
n = sum(len(v["cues"]) for v in out.values())
print(f"captions.json: {len(out)} scenes, {n} cues -> {dst}")
empty = [k for k, v in out.items() if not v["cues"]]
print("scenes with 0 cues:", empty if empty else "none")
