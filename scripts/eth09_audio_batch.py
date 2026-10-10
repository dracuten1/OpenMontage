#!/usr/bin/env python3
"""eth-tradingagents-20261009 — ASSETS stage audio batch.
TTS 10 sections (vieneu) -> voice_sXX.wav + tts_batch_summary.json + narration_full.wav.
atempo 1.15 only if raw total (voice + gaps) > 130s.
"""
import json, os, subprocess, sys, time, wave
from datetime import datetime, timezone, timedelta

ROOT = "/Users/tuyennguyen/project/OpenMontage"
PROJ = f"{ROOT}/projects/eth-tradingagents-20261009"
AUD = f"{PROJ}/assets/audio"
TTS_PY = "/Users/tuyennguyen/project/vietnamese-tts/.venv/bin/python"
TTS_CLI = "/Users/tuyennguyen/project/vietnamese-tts/vieneu_cli.py"
GAP = 0.65
ATEMPO_THRESHOLD = 130.0

os.makedirs(f"{AUD}/transcripts", exist_ok=True)
script = json.load(open(f"{PROJ}/artifacts/script.json"))
sections = script["sections"]


def wav_info(p):
    with wave.open(p, "rb") as w:
        return w.getnframes() / float(w.getframerate()), w.getframerate(), w.getnchannels(), w.getsampwidth()


def ffprobe_dur(p):
    r = subprocess.run(["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
                        "-of", "csv=p=0", p], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except Exception:
        return None


results = []
for s in sections:
    sid, txt = s["id"], s["delivery_cues"]["provider_text"]
    out = f"{AUD}/voice_{sid}.wav"
    t0 = time.time()
    r = subprocess.run([TTS_PY, TTS_CLI, "--text", txt, "--output", out],
                       capture_output=True, text=True, timeout=300)
    wall = time.time() - t0
    info = {}
    for line in (r.stdout or "").splitlines():
        line = line.strip()
        if line.startswith("{"):
            try:
                info = json.loads(line)
            except Exception:
                pass
    ok = bool(info.get("ok")) and os.path.exists(out) and os.path.getsize(out) > 1000
    dur = sr = None
    if os.path.exists(out):
        try:
            dur, sr, ch, sw = wav_info(out)
        except Exception:
            dur = ffprobe_dur(out)
    results.append({
        "id": sid, "label": s["label"], "text_chars": len(txt),
        "planned_seconds": round(s["end_seconds"] - s["start_seconds"], 1),
        "duration_seconds": round(dur, 3) if dur else None,
        "raw_duration_seconds": round(dur, 3) if dur else None,
        "gen_seconds": info.get("gen_seconds"), "sample_rate": sr,
        "gen_wall_seconds": round(wall, 1), "ok": ok,
    })
    print(f"{sid}: ok={ok} dur={dur} gen={info.get('gen_seconds')} wall={wall:.1f}s")
    if not ok:
        print(f"  STDERR: {(r.stderr or '')[:300]}")
        sys.exit(f"FATAL: TTS failed for {sid}")

# ---- concat: sections + GAP silence, pure-python wave concat ----
first = f"{AUD}/voice_{sections[0]['id']}.wav"
_, SR, CH, SW = wav_info(first)
gap_frames = int(GAP * SR)
silence = b"\x00" * (gap_frames * CH * SW)
raw_path = f"{AUD}/narration_full_raw.wav"
with wave.open(raw_path, "wb") as outw:
    outw.setnchannels(CH); outw.setsampwidth(SW); outw.setframerate(SR)
    offsets_raw, cur = [], 0.0
    for i, s in enumerate(sections):
        with wave.open(f"{AUD}/voice_{s['id']}.wav", "rb") as w:
            assert (w.getframerate(), w.getnchannels(), w.getsampwidth()) == (SR, CH, SW), s["id"]
            frames = w.readframes(w.getnframes())
        offsets_raw.append(cur)
        outw.writeframes(frames)
        cur += len(frames) / (SR * CH * SW)
        if i < len(sections) - 1:
            outw.writeframes(silence)
            cur += GAP

raw_total = cur
apply_tempo = raw_total > ATEMPO_THRESHOLD
k = 1.0 / 1.15 if apply_tempo else 1.0
final_path = f"{AUD}/narration_full.wav"
if apply_tempo:
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw_path,
                    "-filter:a", "atempo=1.15", final_path], check=True)
else:
    os.replace(raw_path, final_path)
if os.path.exists(raw_path) and apply_tempo:
    os.remove(raw_path)

final_dur = ffprobe_dur(final_path) or (raw_total * k)
voice_total = sum(x["duration_seconds"] for x in results)
summary = {
    "version": "1.0",
    "project_id": "eth-tradingagents-20261009",
    "generated_at": datetime.now(timezone(timedelta(hours=7))).isoformat(),
    "provider": "vieneu (local) default voice, 48kHz, voice=None",
    "atempo": 1.15 if apply_tempo else 1.0,
    "tempo_applied": apply_tempo,
    "time_scale": round(k, 6),
    "gap_seconds": GAP,
    "total_voice_seconds": round(voice_total, 3),
    "total_gap_seconds": round(GAP * (len(results) - 1), 3),
    "total_duration_seconds": round(final_dur, 3),
    "raw_total_seconds": round(raw_total, 3),
    "sections": [],
    "section_offsets_final": {},
}
for x, off in zip(results, offsets_raw):
    after = round(x["raw_duration_seconds"] * k, 3)
    x["duration_after_tempo"] = after
    x["deviation_pct"] = round((after - x["planned_seconds"]) / x["planned_seconds"] * 100, 1)
    summary["sections"].append(x)
    summary["section_offsets_final"][x["id"]] = round(off * k, 3)

json.dump(summary, open(f"{AUD}/tts_batch_summary.json", "w"), indent=1, ensure_ascii=False)
print(f"\nRAW TOTAL {raw_total:.2f}s | tempo_applied={apply_tempo} | FINAL {final_dur:.2f}s")
print("offsets:", summary["section_offsets_final"])
