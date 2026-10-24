#!/usr/bin/env python
"""Gate C — ASR round-trip từ file RENDER (S2E02): cắt 3 clip (đầu s01 / giữa / cuối),
ASR, so position+structure với narration sections (không so exact match — whisper-small
garble VN). Đối chiếu duration render vs composition + narration."""
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

sys.path.insert(0, "/Users/tuyennguyen/project/OpenMontage")
PROJ = Path("/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong")
MASTER = Path(sys.argv[1]) if len(sys.argv) > 1 else PROJ / "renders/master-1080p.mp4"
SCRATCH = Path("/Users/tuyennguyen/.hermes/profiles/video/cache/scratch")

script = json.loads((PROJ / "artifacts" / "script.json").read_text())
texts = {s["id"]: s["text"] for s in script["sections"]}
timing = json.loads((PROJ / "artifacts" / "scene_timing.json").read_text())
_last = timing["scenes"][-1]
comp_s = (_last["start_frame"] + _last["duration_frames"]) / 30.0
narr = PROJ / "assets" / "audio" / "narration_full.wav"
with wave.open(str(narr), "rb") as w:
    narr_s = w.getnframes() / w.getframerate()

# duration render
probe = subprocess.run(
    ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(MASTER)],
    capture_output=True, text=True,
)
dur_render = float(json.loads(probe.stdout)["format"]["duration"])

# 3 điểm: s01 đầu, section giữa, section cuối — tính động theo narration offsets
nw = json.loads((PROJ / "assets/audio/transcripts/narration_words.json").read_text())
sec_ids = list(nw.keys())
mid_sec = sec_ids[len(sec_ids) // 2]
def _sec_start(sid):
    arr = nw[sid]
    return arr[0]["start"] if arr else 0.0
points = [
    ("s01", 4.0),
    (mid_sec, _sec_start(mid_sec) + 1.0),
    (sec_ids[-1], max(_sec_start(sec_ids[-1]) + 0.5, narr_s - 8.0)),
]
results = []
for sec, t in points:
    clip = SCRATCH / f"gatec2_{sec}.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(t), "-t", "6", "-i", str(MASTER), "-vn", "-ac", "1", "-ar", "16000", str(clip)], check=True)
    from tools.analysis.transcriber import Transcriber
    res = Transcriber().execute({"input_path": str(clip), "language": "vi"})
    data = res.data if hasattr(res, "data") else (res if isinstance(res, dict) else {})
    segs = data.get("segments", [])
    hyp = " ".join(s.get("text", "") for s in segs) if segs else (data.get("text", "") or "")
    results.append({"section": sec, "t": t, "hyp": hyp[:220]})

def norm(w):
    return re.sub(r"[^\w\s]", "", w.lower(), flags=re.UNICODE).strip()

print(f"render duration: {dur_render:.2f}s | narration {narr_s:.2f}s | composition {comp_s:.2f}s | diff vs narration: {dur_render-narr_s:+.2f}s")
ok_dur = abs(dur_render - comp_s) < 2.5
ok_narr = abs(dur_render - narr_s) <= max(2.5, dur_render - narr_s + 2.5)  # tail allowed, không cắt narration
print(f"duration check vs composition {comp_s:.2f}s: {'PASS' if ok_dur else 'FAIL'} ({dur_render-comp_s:+.2f}s)")
print(f"duration vs narration ±2s (tail ok): {'PASS' if dur_render >= narr_s - 0.5 and dur_render - narr_s <= 4.0 else 'FAIL'} ({dur_render-narr_s:+.2f}s)")

all_pass = ok_dur and dur_render >= narr_s - 0.5 and dur_render - narr_s <= 4.0
for r in results:
    canon = norm(texts[r["section"]])
    hn = norm(r["hyp"])
    toks = [t for t in hn.split() if len(t) > 2]
    if not toks:
        print(f"{r['section']} @ {r['t']}s: NO WORDS — FAIL"); all_pass = False; continue
    hits = sum(1 for t in toks if t in canon)
    ratio = hits / len(toks)
    status = "PASS" if ratio >= 0.25 else "CHECK"
    print(f"{r['section']} @ {r['t']}s: overlap {ratio:.0%} — {status} | hyp: {r['hyp'][:120]}")
    if status == "CHECK":
        all_pass = False

print("GATE_C_ASR:", "PASS" if all_pass else "REVIEW")
