#!/usr/bin/env python3
"""Batch TTS: one WAV per script section (provider_text), plus durations JSON.
Idempotent: skips existing wavs. Output: assets/audio/sections/s##.wav + qc/tts_durations.json"""
import json, sys, time
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
sys.path.insert(0, str(OM))
from tools.tool_registry import registry

registry.discover()
tts = registry._tools["vieneu_tts"]

P = OM / "projects" / "lieu-hanh"
OUT = P / "assets" / "audio" / "sections"
OUT.mkdir(parents=True, exist_ok=True)
script = json.loads((P / "artifacts" / "script.json").read_text(encoding="utf-8"))

durs_path = P / "qc" / "tts_durations.json"
durs = json.loads(durs_path.read_text(encoding="utf-8")) if durs_path.exists() else {}
fails = []
for s in script["sections"]:
    sid = s["id"]
    out = OUT / f"{sid}.wav"
    if sid in durs and out.exists() and out.stat().st_size > 1000:
        print(sid, "skip (exists)")
        continue
    txt = s["delivery_cues"]["provider_text"]
    t0 = time.time()
    r = tts.execute({"text": txt, "output_path": str(out), "threads": 6})
    if r.success:
        durs[sid] = {"audio_seconds": (r.data or {}).get("audio_seconds"), "wav": str(out), "bytes": out.stat().st_size}
        print(sid, "OK", durs[sid]["audio_seconds"], f"{time.time()-t0:.0f}s")
    else:
        fails.append(sid)
        print(sid, "FAIL", r.error)
    durs_path.write_text(json.dumps(durs, ensure_ascii=False, indent=1), encoding="utf-8")

total = round(sum(v["audio_seconds"] or 0 for k, v in durs.items() if k.startswith("s") and isinstance(v, dict)), 2)
print(f"TTS BATCH {'PASS' if not fails else 'FAIL ' + str(fails)}: {sum(1 for k, v in durs.items() if k.startswith('s') and isinstance(v, dict))}/{len(script['sections'])} sections, total {total}s")
durs["_total_audio_seconds"] = total
durs_path.write_text(json.dumps(durs, ensure_ascii=False, indent=1), encoding="utf-8")
sys.exit(1 if fails else 0)
