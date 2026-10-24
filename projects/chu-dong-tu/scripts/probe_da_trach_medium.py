"""Kiểm độc lập clip da_trach bằng whisper medium (gate A S2E03)."""
import json
from pathlib import Path
from faster_whisper import WhisperModel

OUT = Path("projects/chu-dong-tu/artifacts/probes")
m = WhisperModel("medium", device="cpu", compute_type="int8")
res = {}
for key in ["da_trach", "nhat_da", "tu_nhien"]:  # đích + 2 control
    segs, _ = m.transcribe(str(OUT / f"g3_{key}.wav"), language="vi", beam_size=5)
    res[key] = " ".join(s.text.strip() for s in segs)
    print(key, "->", res[key])
Path("/Users/tuyennguyen/.hermes/profiles/video/cache/scratch/s2e03/da_trach_medium.json").write_text(
    json.dumps(res, ensure_ascii=False, indent=1))
