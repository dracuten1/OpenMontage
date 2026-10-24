#!/usr/bin/env python
"""Gom dữ liệu fix anchor: spec anchors + TSX calls fail + narration window cho từng scene fail."""
import json
import re
from pathlib import Path

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong")
audit = json.load(open(P / "artifacts" / "anchor_audit_strict.json"))
timing = json.load(open(P / "artifacts" / "scene_timing.json"))
words = json.load(open(P.parent.parent / "remotion-composer" / "public" / "thanh-giong" / "transcripts" / "narration_words.json"))

# words: dict theo section → list [{word,start,end}]
wlist = []
for _sid, ws in words.items():
    if isinstance(ws, list):
        wlist.extend(ws)

def words_in(a, b):
    return [(w["word"], w["start"], w["end"]) for w in wlist if a <= w["start"] and w["end"] <= b]

scenes = {s["sceneId"]: s for s in timing["scenes"]} if "scenes" in timing else {s["id"]: s for s in timing}

# map group file theo scene index
groups = {}
for g in "abcdef":
    spec = json.load(open(P / f"logs/parts/spec_{g}.json"))
    ss = spec["scenes"] if isinstance(spec, dict) and "scenes" in spec else spec
    for sc in ss:
        groups[sc.get("sceneId") or sc.get("id")] = (g, sc)

out = []
for s in audit["scenes"]:
    if s.get("pass", True):
        continue
    sid = s["sceneId"]
    g, sc = groups[sid]
    a0, a1 = s["window"]
    narr = " ".join(x[0] for x in words_in(a0 + 0.15, a1 - 0.1))[:220]
    fails = [c for c in s["calls"] if not (c.get("spanOk", True) and c.get("fractionOk", True))]
    oks = [c for c in s["calls"] if c.get("spanOk", True) and c.get("fractionOk", True)]
    out.append({
        "scene": sid, "group": g, "window": s["window"],
        "fail_calls": [(c["phrase"], c.get("occ", 1), c.get("rawFraction")) for c in fails],
        "ok_calls": [c["phrase"] for c in oks],
        "spec_anchors": [a if isinstance(a, str) else a.get("phrase", "") for a in sc.get("anchors", [])],
        "narration_in_window": narr,
    })

print(json.dumps(out, ensure_ascii=False, indent=1))
json.dump(out, open(P / "artifacts" / "anchor_fix_inputs.json", "w"), ensure_ascii=False, indent=1)
print("saved anchor_fix_inputs.json")
