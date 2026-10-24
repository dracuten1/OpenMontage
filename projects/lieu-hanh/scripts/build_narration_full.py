#!/usr/bin/env python3
"""Concat 32 section WAVs -> remotion-composer/public/lieu-hanh/narration_full.wav (no gaps)
and build global-timestamp narration_words.json (offset = exact sample count of prior files)."""
import json, sys
import numpy as np
import soundfile as sf
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
P = OM / "projects" / "lieu-hanh"
SEC = P / "assets" / "audio" / "sections"
AL = P / "qc" / "align"
PUB = OM / "remotion-composer" / "public" / "lieu-hanh"
(PUB).mkdir(parents=True, exist_ok=True)
TR = P / "assets" / "audio" / "transcripts"
TR.mkdir(parents=True, exist_ok=True)

script = json.loads((P / "artifacts" / "script.json").read_text(encoding="utf-8"))
order = [s["id"] for s in script["sections"]]

sr = None
chunks = []
offsets = {}
acc = 0.0
for sid in order:
    wav = SEC / f"{sid}.wav"
    y, this_sr = sf.read(str(wav))
    if y.ndim > 1:
        y = y.mean(axis=1)
    if sr is None:
        sr = this_sr
    assert this_sr == sr, f"{sid}: sr mismatch {this_sr} vs {sr}"
    chunks.append(y.astype(np.float32))
    offsets[sid] = acc
    acc += len(y) / sr

full = np.concatenate(chunks)
out = PUB / "narration_full.wav"
sf.write(str(out), full, sr, subtype="PCM_16")
dur = len(full) / sr
print(f"narration_full.wav: {dur:.2f}s @ {sr}Hz -> {out}")

words_out = {}
for sid in order:
    t = json.loads((AL / f"{sid}_transcript.json").read_text(encoding="utf-8"))
    ws = t.get("word_timestamps", [])
    off = offsets[sid]
    words_out[sid] = [{"word": w["word"], "start": round(w["start"] + off, 3),
                       "end": round(w["end"] + off, 3)} for w in ws]
    print(sid, f"offset={off:.2f}", f"words={len(ws)}")

(TR / "narration_words.json").write_text(json.dumps(words_out, ensure_ascii=False, indent=1), encoding="utf-8")
print("narration_words.json written (global seconds)")
print(f"TOTAL audio {dur:.2f}s; suggested TOTAL_FRAMES = {int(np.ceil((dur + 2.0) * 30))}")
