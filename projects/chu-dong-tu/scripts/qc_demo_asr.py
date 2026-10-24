"""ASR round-trip từ MP4 render (demo s03) — xác nhận audio nhúng là demo_s03.wav."""
import subprocess, json
from pathlib import Path
from faster_whisper import WhisperModel

mp4 = "remotion-composer/out/chu_dong_tu_demo_s03_draft_720p.mp4"
tmp = "/Users/tuyennguyen/.hermes/profiles/video/cache/scratch/s2e03/demo_render_audio.wav"
subprocess.run(["ffmpeg", "-y", "-i", mp4, "-vn", "-ac", "1", "-ar", "16000", tmp],
               check=True, capture_output=True)
m = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = m.transcribe(tmp, language="vi", word_timestamps=True)
words = []
for s in segs:
    for w in s.words or []:
        words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})
txt = " ".join(x["w"] for x in words)
print("words:", len(words), "| first:", words[0], "| last:", words[-1])
# audio offset trong comp = +1.0s
for probe_w, expect in [("Trước", 1.0), ("khố", None), ("chôn", None), ("liệm", None)]:
    hit = next((x for x in words if probe_w.lower() in x["w"].lower()), None)
    print(probe_w, "->", hit)
first = next(x for x in words if "trước" in x["w"].lower())
last = words[-1]
print(f"speech span in mp4: {first['s']} -> {last['e']} (kỳ vọng ~1.0 -> ~31.4)")
print("tail after last word:", round(34.05 - last["e"], 2), "s")
