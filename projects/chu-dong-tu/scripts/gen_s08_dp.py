"""s08 canonical alignment bằng DP (fallback có bằng chứng) — vì DTW từ chối
mapping canonical↔provider ở khác biệt dấu câu ('buôn bán.' vs 'buôn.').
Words DP trên (canonical ↔ raw ASR) — cùng chuẩn demo đã verify."""
import hashlib
import json
import re
import unicodedata
import wave
from pathlib import Path

import numpy as np

REPO = Path("/Users/tuyennguyen/project/OpenMontage")
PROJ = REPO / "projects" / "chu-dong-tu"
SID = "s08"
METHOD = "dp_nw_canonical_vs_raw_asr"
VERSION = 3

script = json.loads((PROJ / "artifacts" / "script.json").read_text())
sec = next(s for s in script["sections"] if s["id"] == SID)
canon = sec["text"]

def norm(s):
    s = unicodedata.normalize("NFD", s.lower().replace("đ", "d"))
    return "".join(c for c in s if c.isalnum() and not unicodedata.combining(c))

def lexical(text):
    return [w for w in text.split() if norm(w)]

canon_words = lexical(canon)  # giữ nguyên văn có dấu
raw = json.loads((PROJ / "assets" / "audio" / f"{SID}_transcript.json").read_text())
raw_words = [w for seg in raw["segments"] for w in seg.get("words", []) if norm(w["word"])]

cs = [norm(w) for w in canon_words]
rs = [norm(w["word"]) for w in raw_words]
n, m = len(cs), len(rs)
SC = np.zeros((n + 1, m + 1), dtype=np.int32)
TB = np.zeros((n + 1, m + 1), dtype=np.int8)
for i in range(1, n + 1):
    SC[i][0] = SC[i-1][0] - 1; TB[i][0] = 1
for j in range(1, m + 1):
    SC[0][j] = SC[0][j-1] - 1; TB[0][j] = 2
for i in range(1, n + 1):
    for j in range(1, m + 1):
        d = SC[i-1][j-1] + (2 if cs[i-1] == rs[j-1] else -1)
        u = SC[i-1][j] - 1
        l = SC[i][j-1] - 1
        best = max(d, u, l)
        SC[i][j] = best
        TB[i][j] = 0 if best == d else (1 if best == u else 2)
raw_of = [None] * n
i, j = n, m
while i > 0 or j > 0:
    if i > 0 and j > 0 and TB[i][j] == 0:
        raw_of[i-1] = j-1
        i, j = i-1, j-1
    elif i > 0 and (j == 0 or TB[i][j] == 1):
        i -= 1
    else:
        j -= 1
matched = sum(1 for k in range(n) if raw_of[k] is not None and cs[k] == rs[raw_of[k]])
print(f"DP: {matched}/{n} = {matched/n:.0%} exact stripped match")

# timestamps: matched → raw thật; unmatched → nội suy tuyến tính giữa 2 matched kề
def ts(k):
    return (raw_words[raw_of[k]]["start"], raw_words[raw_of[k]]["end"])

anchors = [(k, *ts(k)) for k in range(n) if raw_of[k] is not None]
words_out = []
for k in range(n):
    if raw_of[k] is not None:
        s, e = ts(k)
        prob = float(raw_words[raw_of[k]].get("probability", 0.6) or 0.6)
    else:
        prev = max((a for a in anchors if a[0] < k), default=None)
        nxt = min((a for a in anchors if a[0] > k), default=None)
        if prev and nxt:
            t = (k - prev[0]) / (nxt[0] - prev[0])
            s = prev[1] + t * (nxt[1] - prev[1])
            e = nxt[2] if k + 1 == nxt[0] else s + 0.18
        elif prev:
            s, e = prev[1] + 0.05, prev[2] + 0.18
        elif nxt:
            s, e = max(0.0, nxt[1] - 0.22), nxt[1]
        prob = 0.6
    words_out.append({
        "word": canon_words[k], "start": round(float(s), 5), "end": round(float(e), 5),
        "probability": round(prob, 3), "method": "dp_interpolated" if raw_of[k] is None else "dp_exact",
        "confidence": "medium", "confidence_flags": [], "spoken_word_count": 1,
    })

# enforce monotonic + within duration (validation DTW đòi hỏi)
with wave.open(str(PROJ / "assets" / "audio" / f"{SID}.wav"), "rb") as w:
    duration = w.getnframes() / w.getframerate()
prev_end = 0.0
for wd in words_out:
    s, e = wd["start"], wd["end"]
    s = max(s, prev_end)
    e = max(e, s + 0.04)
    e = min(e, duration)
    s = min(s, e)
    wd["start"], wd["end"] = round(s, 5), round(e, 5)
    prev_end = wd["end"]
hashes = {
    "audio_sha256": hashlib.sha256((PROJ / "assets" / "audio" / f"{SID}.wav").read_bytes()).hexdigest(),
    "raw_asr_sha256": hashlib.sha256((PROJ / "assets" / "audio" / f"{SID}_transcript.json").read_bytes()).hexdigest(),
    "text_sha256": hashlib.sha256(sec["text"].encode()).hexdigest(),
    "provider_text_sha256": hashlib.sha256(sec["delivery_cues"]["provider_text"].encode()).hexdigest(),
}
transcript = {
    "section_id": SID, "language": "vi", "duration_seconds": duration,
    "model_size": "base", "device": "cpu", "compute_type": "int8",
    "alignment_method": METHOD, "alignment_version": VERSION,
    **hashes, "raw_asr_path": f"projects/chu-dong-tu/assets/audio/{SID}_transcript.json",
    "chunk_evidence_paths": [], "chunk_boundary_mapping_edits": [],
    "canonical_text": canon,
    "words": words_out,
    "word_timestamps": [{k: w[k] for k in ("word", "start", "end", "probability", "method", "confidence", "confidence_flags")} for w in words_out],
}
out = PROJ / "qc" / "audio-alignment" / "sections" / f"{SID}.json"
out.write_text(json.dumps(transcript, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("wrote", out, "| words:", len(words_out), "| match:", f"{matched/n:.0%}")
