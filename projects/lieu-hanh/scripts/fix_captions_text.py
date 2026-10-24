#!/usr/bin/env python3
"""Post-process captions.json:
1) Re-align every cue's TEXT to the section's provider_text (fixes ASR duplicate
   words like 'Yên-thái, yên thái' and 'u nét cô' -> 'UNESCO') using difflib
   longest-match, keeping real timestamps untouched.
2) Split any cue that would wrap >2 lines (46 chars/line) at the word boundary
   closest to the middle, timestamps from the real word grid when available.
Run AFTER gen_captions.py. Idempotent.
"""
import json, re
from difflib import SequenceMatcher
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
CAP = OM / "remotion-composer/public/lieu-hanh/captions.json"
TIMING = OM / "projects/lieu-hanh/artifacts/scene_timing.json"
SCRIPT = OM / "projects/lieu-hanh/artifacts/script.json"

timing = json.loads(TIMING.read_text(encoding="utf-8"))
scene_sec = {t["sceneId"]: t["sectionId"] for t in timing["scenes"]}
script = json.loads(SCRIPT.read_text(encoding="utf-8"))
ptext = {s["id"]: (s.get("delivery_cues") or {}).get("provider_text") or "" for s in script["sections"]}

caps = json.loads(CAP.read_text(encoding="utf-8"))
MAXLEN = 92
stats = {"replaced": 0, "unchanged": 0, "split": 0}

# TTS phonetic spellings -> display spellings (captions must show the real name)
DISP = [
    (re.compile(r"\bu nét cô\b", re.I), "UNESCO"),
    (re.compile(r"\bu-nét-cô\b", re.I), "UNESCO"),
    (re.compile(r"\bU nét cô\b"), "UNESCO"),
]

def disp(t: str) -> str:
    for rx, out in DISP:
        t = rx.sub(out, t)
    return t

for sid, v in caps.items():
    sec = scene_sec.get(sid)
    src = ptext.get(sec)
    cues = v["cues"]
    if src:
        pos = 0
        for c in cues:
            window = src[pos: pos + len(c["text"]) * 3 + 200]
            sm = SequenceMatcher(None, c["text"], window, autojunk=False)
            m = sm.find_longest_match(0, len(c["text"]), 0, len(window))
            if m.size >= max(8, int(len(c["text"]) * 0.55)):
                # expand to word boundaries in the source window
                i, j = m.b, m.b + m.size
                while i > 0 and window[i - 1] not in " \n":
                    i -= 1
                while j < len(window) and window[j] not in " \n":
                    j += 1
                new = window[i:j].strip()
                if 0.75 <= len(new) / max(1, len(c["text"])) <= 1.4:
                    if new != c["text"]:
                        stats["replaced"] += 1
                    else:
                        stats["unchanged"] += 1
                    c["text"] = new
                    pos += j
                else:
                    pos += m.b + m.size
                    stats["unchanged"] += 1
            else:
                stats["unchanged"] += 1
    # split cues still > 2 lines
    out = []
    for c in cues:
        t = c["text"]
        while len(t) > MAXLEN:
            words_ = t.split(" ")
            if len(words_) < 3:
                break
            half = len(t) // 2
            acc, best, bestk = 0, None, 1
            for k in range(1, len(words_)):
                acc += len(words_[k - 1]) + 1
                if best is None or abs(acc - half) < abs(best - half):
                    best, bestk = acc, k
            t1 = " ".join(words_[:bestk]).strip()
            t2 = " ".join(words_[bestk:]).strip()
            mid = c["start"] + (c["end"] - c["start"]) * (len(t1) / max(1, len(t1) + len(t2)))
            out.append({"start": c["start"], "end": round(mid, 2), "text": t1})
            c = {"start": round(mid, 2), "end": c["end"], "text": t2}
            t = t2
            stats["split"] += 1
        out.append(c)
    v["cues"] = [{**c, "text": disp(c["text"])} for c in out]

CAP.write_text(json.dumps(caps, ensure_ascii=False, indent=1), encoding="utf-8")
n = sum(len(v["cues"]) for v in caps.values())
over = [(k, c["text"]) for k, v in caps.items() for c in v["cues"] if len(c["text"]) > 92]
print(f"cues: {n}; replaced: {stats['replaced']}, unchanged: {stats['unchanged']}, split: {stats['split']}")
print("still > 92 chars:", len(over))
for k, t in over[:5]:
    print(" ", k, t[:70])
