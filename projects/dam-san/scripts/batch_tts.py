#!/usr/bin/env python3
"""Batch TTS for dam-san: 1 WAV/section + macOS C++ teardown WAV fallback + qc/tts_durations.json."""
import json
import sys
import time
import wave
from pathlib import Path


def wav_duration(p: Path) -> float:
    with wave.open(str(p), "rb") as w:
        return round(w.getnframes() / float(w.getframerate()), 2)

OM = Path("/Users/tuyennguyen/project/OpenMontage")
sys.path.insert(0, str(OM))
from tools.tool_registry import registry  # noqa: E402

registry.discover()
tts = registry._tools["vieneu_tts"]

P = OM / "projects" / "dam-san"
OUT = P / "assets" / "audio" / "sections"
OUT.mkdir(parents=True, exist_ok=True)
(P / "qc").mkdir(parents=True, exist_ok=True)
script = json.loads((P / "artifacts" / "script.json").read_text(encoding="utf-8"))

durs_path = P / "qc" / "tts_durations.json"
durs = json.loads(durs_path.read_text(encoding="utf-8")) if durs_path.exists() else {}
fails = []

for s in script["sections"]:
    sid = s["id"]
    out = OUT / f"{sid}.wav"
    if out.exists() and out.stat().st_size > 8000:
        if sid not in durs or not isinstance(durs[sid], dict) or not durs[sid].get("audio_seconds"):
            durs[sid] = {"audio_seconds": wav_duration(out), "wav": str(out), "bytes": out.stat().st_size}
            durs_path.write_text(json.dumps(durs, ensure_ascii=False, indent=2), encoding="utf-8")
            print(sid, "recovered valid WAV", durs[sid]["audio_seconds"], flush=True)
        else:
            print(sid, "skip (exists)", durs[sid].get("audio_seconds"), flush=True)
        continue

    txt = s["delivery_cues"]["provider_text"]
    t0 = time.time()
    r = tts.execute({"text": txt, "output_path": str(out), "threads": 4})
    if r.success and out.exists() and out.stat().st_size > 8000:
        durs[sid] = {
            "audio_seconds": (r.data or {}).get("audio_seconds"),
            "wav": str(out),
            "bytes": out.stat().st_size,
        }
        print(sid, "OK", durs[sid]["audio_seconds"], f"{time.time() - t0:.1f}s", flush=True)
    elif out.exists() and out.stat().st_size > 8000:
        durs[sid] = {
            "audio_seconds": wav_duration(out),
            "wav": str(out),
            "bytes": out.stat().st_size,
            "recovered_after_teardown_exit": True,
        }
        print(sid, "RECOVERED (saved before teardown crash)", durs[sid]["audio_seconds"], flush=True)
    else:
        fails.append(sid)
        print(sid, "FAIL", r.error, flush=True)
    durs_path.write_text(json.dumps(durs, ensure_ascii=False, indent=2), encoding="utf-8")

total = round(
    sum((v.get("audio_seconds") or 0) for k, v in durs.items() if k.startswith("s") and isinstance(v, dict)),
    2,
)
durs["_total_audio_seconds"] = total
durs_path.write_text(json.dumps(durs, ensure_ascii=False, indent=2), encoding="utf-8")
done_count = sum(1 for k, v in durs.items() if k.startswith("s") and isinstance(v, dict))
print(f"TTS BATCH {'PASS' if not fails else 'FAIL ' + str(fails)}: {done_count}/{len(script['sections'])} sections, total {total}s")
sys.exit(1 if fails else 0)
