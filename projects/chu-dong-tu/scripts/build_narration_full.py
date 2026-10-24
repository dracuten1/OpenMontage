"""Ghép 32 section wav thành narration_full.wav đúng offset narration_words:
mỗi section + pause_after_seconds (từ script.json delivery_cues). Output 48kHz 16-bit mono."""
import json
import wave
from pathlib import Path

PROJ = Path("/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu")
PUB = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/public/chu-dong-tu")
sections = json.loads((PROJ / "artifacts" / "script.json").read_text())["sections"]

params = None
out_frames = []
total = 0.0
for i, sec in enumerate(sections):
    sid = sec["id"]
    with wave.open(str(PROJ / "assets" / f"audio" / f"{sid}.wav"), "rb") as w:
        p = (w.getnchannels(), w.getsampwidth(), w.getframerate())
        if params is None:
            params = p
        assert p == params, f"{sid}: params {p} != {params}"
        frames = w.readframes(w.getnframes())
        dur = w.getnframes() / w.getframerate()
    out_frames.append(frames)
    total += dur
    if i < len(sections) - 1:
        pause = float(sec["delivery_cues"].get("pause_after_seconds", 0.0))
        if pause > 0:
            out_frames.append(b"\x00" * int(pause * params[2]) * params[1] * params[0])
            total += pause

PUB.mkdir(parents=True, exist_ok=True)
with wave.open(str(PUB / "narration_full.wav"), "wb") as w:
    w.setnchannels(params[0])
    w.setsampwidth(params[1])
    w.setframerate(params[2])
    for fr in out_frames:
        w.writeframes(fr)
print(f"narration_full.wav: {total:.2f}s, {params[0]}ch {params[2]}Hz {params[1]*8}bit")
