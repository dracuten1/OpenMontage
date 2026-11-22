#!/usr/bin/env python3
"""Concatenate s01..s30 WAV + 0.55s pauses using stdlib wave -> public/dam-san/narration_full.wav + narration_words.json + scene_timing.json."""
import json
import wave
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
P = OM / "projects" / "dam-san"
SEC = P / "assets" / "audio" / "sections"
AL = P / "qc" / "align"
PUB = OM / "remotion-composer" / "public" / "dam-san"
PUB.mkdir(parents=True, exist_ok=True)
PAUSE = 0.55
FPS = 30

script = json.loads((P / "artifacts" / "script.json").read_text(encoding="utf-8"))
order = [s["id"] for s in script["sections"]]

params = None
raw_pcm_parts = []
offsets = {}
timing_sections = []
acc = 0.0
start_frame = 0

for idx, s in enumerate(script["sections"], 1):
    sid = s["id"]
    sc_id = f"sc{idx:03d}"
    wav_path = SEC / f"{sid}.wav"
    with wave.open(str(wav_path), "rb") as w:
        nch, sampwidth, sr, nframes, _, _ = w.getparams()
        pcm = w.readframes(nframes)
    if params is None:
        params = (nch, sampwidth, sr)
    else:
        assert (nch, sampwidth, sr) == params, f"{sid} param mismatch {(nch, sampwidth, sr)} vs {params}"

    pad_s = PAUSE if idx < len(order) else 1.2
    raw_len_s = (nframes / float(sr)) + pad_s
    frames = max(30, int(round(raw_len_s * FPS)))
    exact_samples = int(round((frames / float(FPS)) * sr))
    target_bytes = exact_samples * nch * sampwidth

    if len(pcm) >= target_bytes:
        seg = pcm[:target_bytes]
    else:
        seg = pcm + b"\x00" * (target_bytes - len(pcm))
    raw_pcm_parts.append(seg)

    offsets[sid] = acc
    dur_s = frames / float(FPS)
    timing_sections.append({
        "id": sid,
        "scene": sc_id,
        "label": s["label"],
        "start": round(acc, 4),
        "end": round(acc + dur_s, 4),
        "duration": round(dur_s, 4),
        "start_frame": start_frame,
        "frames": frames,
    })
    acc += dur_s
    start_frame += frames

nch, sampwidth, sr = params
out = PUB / "narration_full.wav"
with wave.open(str(out), "wb") as wo:
    wo.setnchannels(nch)
    wo.setsampwidth(sampwidth)
    wo.setframerate(sr)
    for part in raw_pcm_parts:
        wo.writeframes(part)

dur = start_frame / float(FPS)
print(f"narration_full.wav: {dur:.3f}s @ {sr}Hz ({start_frame} frames @ {FPS}fps) -> {out}")

words_out = {}
for sid in order:
    t = json.loads((AL / f"{sid}_transcript.json").read_text(encoding="utf-8"))
    ws = t.get("word_timestamps", [])
    off = offsets[sid]
    words_out[sid] = [
        {"word": w["word"], "start": round(w["start"] + off, 3), "end": round(w["end"] + off, 3)}
        for w in ws
    ]

(PUB / "narration_words.json").write_text(json.dumps(words_out, ensure_ascii=False), encoding="utf-8")
scene_timing = {
    "fps": FPS,
    "total_frames": start_frame,
    "total_seconds": round(dur, 4),
    "sample_rate": sr,
    "sections": timing_sections,
}
(P / "artifacts" / "scene_timing.json").write_text(json.dumps(scene_timing, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"words={sum(len(v) for v in words_out.values())} timing_end={timing_sections[-1]['end']:.3f}s")
