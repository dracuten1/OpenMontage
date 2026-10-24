#!/usr/bin/env python3
"""ASR cross-check probe WAVs (faster-whisper) — verify proper names audible & pronounced."""
import json, sys
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
sys.path.insert(0, str(OM))
from tools.tool_registry import registry

registry.discover()
asr = registry._tools["transcriber"]
P = OM / "projects" / "lieu-hanh"
report = json.loads((P / "qc" / "probe_report.json").read_text(encoding="utf-8"))
out = []
for e in report:
    if e["id"] == "s01":
        continue
    r = asr.execute({"input_path": e["wav"], "language": "vi"})
    if r.success:
        text = " ".join(s.get("text", "") for s in r.data.get("segments", [])).strip()
        out.append({"id": e["id"], "tts_text": e["text"], "asr_text": text})
        print(f'{e["id"]}: TTS="{e["text"]}" ASR="{text}"')
    else:
        out.append({"id": e["id"], "tts_text": e["text"], "asr_error": r.error})
        print(f'{e["id"]}: ASR FAIL {r.error}')
(P / "qc" / "probe_asr.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print("ASR CROSS-CHECK WRITTEN")
