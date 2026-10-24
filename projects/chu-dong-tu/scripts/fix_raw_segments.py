"""Chuyển raw transcript sXX (words[]) sang shape align DTW cần: segments[].words[]."""
import json
from pathlib import Path

AUD = Path("projects/chu-dong-tu/assets/audio")
n = 0
for p in sorted(AUD.glob("s??_transcript.json")):
    d = json.loads(p.read_text())
    if "segments" not in d:
        words = d.get("words") or d.get("word_timestamps") or []
        d["segments"] = [{"words": words}]
        p.write_text(json.dumps(d, ensure_ascii=False, indent=1))
        n += 1
print("converted", n, "raw transcripts (segments[].words)")
