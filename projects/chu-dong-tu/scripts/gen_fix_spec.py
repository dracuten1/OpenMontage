"""Sinh fix-spec per group từ artifacts/anchor_audit_strict.json:
mỗi call lỗi: window, phrase sai, spoken span, candidates nguyên văn TRONG window."""
import json
from pathlib import Path

PROJ = Path("/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu")
words = json.loads((PROJ / "assets/audio/transcripts/narration_words.json").read_text())
audit = json.loads((PROJ / "artifacts/anchor_audit_strict.json").read_text())

def candidates(sec, w0, w1, focus, n=8):
    ws = words[sec]
    inside = [w for w in ws if w0 - 0.1 <= w["start"] and w["end"] <= w1 + 0.1]
    keys = [k.lower() for k in focus if len(k) > 2]
    out = []
    for i in range(len(inside)):
        for ln in (7, 6, 5, 4, 3):
            j = i + ln
            if j > len(inside):
                break
            span = inside[i:j]
            ph = " ".join(w["word"] for w in span)
            score = sum(1 for k in keys if k in ph.lower())
            if score:
                out.append((score, -i, ph, span[0]["start"], span[-1]["end"]))
    out.sort(key=lambda x: (-x[0], x[1]))
    seen, uniq = set(), []
    for s, _, ph, a, b in out:
        if ph in seen:
            continue
        seen.add(ph)
        uniq.append({"phrase": ph, "start": round(a, 2), "end": round(b, 2)})
        if len(uniq) >= n:
            break
    return uniq

import re
out = {}
for sc in audit["scenes"]:
    bad = [c for c in sc["calls"] if not (c.get("spanOk") and c.get("fractionOk"))]
    if not bad:
        continue
    sid = sc["sceneId"]
    w0, w1 = sc["window"]
    n = int(sid[2:])
    g = "a" if n <= 11 else "b" if n <= 21 else "c" if n <= 32 else "d" if n <= 42 else "e" if n <= 52 else "f"
    entry = out.setdefault(g, {})
    entry[sid] = {
        "section": sc["sectionId"],
        "window": [round(w0, 2), round(w1, 2)],
        "file": f"remotion-composer/src/chu-dong-tu/scenes-{g}.tsx",
        "calls": [{
            "phrase": c["phrase"],
            "occ": c.get("occ", 1),
            "spoken": [c.get("start"), c.get("end")],
            "rawFraction": c.get("rawFraction"),
            "problem": ("overflow" if c.get("overflowSec", 0) > 0.2 else "underflow" if c.get("underflowSec", 0) > 0.2 else "fraction" if c.get("start") is not None else "anchor_miss") + (f" (spoken {c.get('start')}-{c.get('end')}s, window {round(w0,2)}-{round(w1,2)}s)" if c.get("start") is not None else f" (không tìm thấy occurrence — phrase sai nguyên văn, window {round(w0,2)}-{round(w1,2)}s)"),
            "candidates": candidates(sc["sectionId"], w0, w1, re.findall(r"\w{3,}", c["phrase"])),
        } for c in bad],
    }

for g, data in out.items():
    (PROJ / "logs" / "parts" / f"fix_spec_{g}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))
    ncalls = sum(len(d["calls"]) for d in data.values())
    print(f"fix_spec_{g}.json: {len(data)} scenes, {ncalls} bad calls")
