#!/usr/bin/env python3
"""Word-level forced alignment for lieu-hanh section WAVs (faster-whisper, word_timestamps).
Output: qc/align/s##_transcript.json per section + qc/alignment_index.json summary.
Idempotent: skips existing transcripts."""
import json, sys
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
sys.path.insert(0, str(OM))
from tools.tool_registry import registry

registry.discover()
asr = registry._tools["transcriber"]

P = OM / "projects" / "lieu-hanh"
SEC = P / "assets" / "audio" / "sections"
AL = P / "qc" / "align"
AL.mkdir(parents=True, exist_ok=True)

script = json.loads((P / "artifacts" / "script.json").read_text(encoding="utf-8"))
index = {}
errs = []
for s in script["sections"]:
    sid = s["id"]
    wav = SEC / f"{sid}.wav"
    tjson = AL / f"{sid}_transcript.json"
    if tjson.exists() and tjson.stat().st_size > 200:
        d = json.loads(tjson.read_text(encoding="utf-8"))
        words = d.get("word_timestamps", [])
        index[sid] = {"words": len(words), "duration": d.get("duration_seconds"),
                      "first_start": words[0]["start"] if words else None,
                      "last_end": words[-1]["end"] if words else None}
        print(sid, "skip", len(words), "words")
        continue
    r = asr.execute({"input_path": str(wav), "language": "vi", "output_dir": str(AL)})
    if not r.success:
        errs.append((sid, r.error))
        print(sid, "FAIL", r.error)
        continue
    words = r.data.get("word_timestamps", [])
    index[sid] = {"words": len(words), "duration": r.data.get("duration_seconds"),
                  "first_start": words[0]["start"] if words else None,
                  "last_end": words[-1]["end"] if words else None}
    print(sid, "OK", len(words), "words", r.data.get("duration_seconds"), "s")

(P / "qc" / "alignment_index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
zero = [k for k, v in index.items() if v["words"] == 0]
print(f"ALIGN {'PASS' if not errs and not zero else 'ISSUES'}: {len(index)} sections, zero-word: {zero}, errors: {errs}")
sys.exit(1 if (errs or zero) else 0)
