"""ASR round-trip Gate C: trích 3 đoạn (đầu/giữa/cuối) từ MP4 render, ASR, so với narration canonical.
Usage: .venv/bin/python qc_gate_c_asr.py <mp4>"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, "/Users/tuyennguyen/project/OpenMontage")
from tools.analysis.transcriber import Transcriber  # type: ignore

mp4 = Path(sys.argv[1])
PROJ = Path("/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu")
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "csv=p=0", str(mp4)], capture_output=True, text=True).stdout.strip())
words = json.loads((PROJ / "assets/audio/transcripts/narration_words.json").read_text())
spans = {"early": (max(0.5, dur * 0.02), dur * 0.02 + 18), "mid": (dur * 0.5, dur * 0.5 + 18), "late": (max(0, dur - 20), dur - 1.5)}

def canon(a, b):
    out = []
    for sec, ws in words.items():
        for w in ws:
            if a <= w["start"] < b:
                out.append((w["start"], w["word"]))
    out.sort()
    return out

t = Transcriber()
results = {}
for name, (a, b) in spans.items():
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        wav = f.name
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(a), "-to", str(b), "-i", str(mp4),
                    "-vn", "-ac", "1", "-ar", "16000", wav], check=True)
    asr = t.execute({"input_path": wav, "language": "vi"})
    asr_words = [w for seg in asr.data["segments"] for w in seg.get("words", [])]
    asr_text = " ".join(w["word"] for w in asr_words).lower()
    canon_text = " ".join(w for _, w in canon(a, b)).lower()
    # token match (bỏ dấu câu)
    import re
    norm = lambda s: re.sub(r"[^\w\s]", "", s, flags=re.UNICODE).split()
    ca, cb = norm(asr_text), norm(canon_text)
    from collections import Counter
    inter = sum((Counter(ca) & Counter(cb)).values())
    prec = inter / max(1, len(ca))
    rec = inter / max(1, len(cb))
    results[name] = {"window": [round(a, 1), round(b, 1)], "asr_tokens": len(ca), "canon_tokens": len(cb),
                     "precision": round(prec, 3), "recall": round(rec, 3),
                     "asr_head": " ".join(ca[:12]), "canon_head": " ".join(cb[:12])}
    print(name, results[name])
json.dump({"mp4": str(mp4), "duration": dur, "spans": results},
          open(PROJ / "qc" / "gate_c_asr_roundtrip.json", "w"), ensure_ascii=False, indent=1)
ok = all(r["precision"] >= 0.45 and r["recall"] >= 0.45 for r in results.values())
print("GATE_C_ASR:", "PASS" if ok else "NEEDS_REVIEW")
