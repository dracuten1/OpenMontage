#!/usr/bin/env python3
"""Validate drafts/scene_plan.json: schema + contiguity + section coverage + dignity words ban."""
import json, sys
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
sys.path.insert(0, str(OM))
from schemas.artifacts import validate_artifact

P = OM / "projects" / "lieu-hanh"
sp = json.loads((P / "drafts" / "scene_plan.json").read_text(encoding="utf-8"))
raw = (P / "drafts" / "scene_plan.json").read_text(encoding="utf-8")
errs = []
if "__APPEND_MARKER__" in raw:
    errs.append("marker still present")
try:
    validate_artifact("scene_plan", sp)
except Exception as e:
    errs.append(f"schema: {e}")

scenes = sp.get("scenes", [])
prev_end = None
covered = set()
for sc in scenes:
    if prev_end is not None and abs(sc["start_seconds"] - prev_end) > 0.01:
        errs.append(f'{sc["id"]}: gap/overlap start {sc["start_seconds"]} vs prev end {prev_end}')
    if sc["end_seconds"] <= sc["start_seconds"]:
        errs.append(f'{sc["id"]}: end<=start')
    prev_end = sc["end_seconds"]
    sid = sc.get("script_section_id")
    if sid:
        covered.add(sid)
script = json.loads((P / "artifacts" / "script.json").read_text(encoding="utf-8"))
need = {s["id"] for s in script["sections"]}
missing = sorted(need - covered)
if missing:
    errs.append(f"sections uncovered: {missing}")
banned = ["gợi cảm", "khiêu dâm", "mê tín"]
blob = json.dumps(sp, ensure_ascii=False).lower()
for b in banned:
    if b in blob:
        errs.append(f"banned word: {b}")

d = {}
for sc in scenes:
    d[sc["type"]] = d.get(sc["type"], 0) + 1
heroes = [sc["id"] for sc in scenes if sc.get("hero_moment")]
print(f"scenes={len(scenes)} types={d} heroes={heroes}")
print(f"total_provisional_duration={scenes[-1]['end_seconds'] if scenes else 0:.1f}s")
if errs:
    print("FAIL:")
    for e in errs[:20]:
        print(" -", e)
    sys.exit(1)
print("SCENE PLAN VALID (provisional timing; audio re-lock at assets stage)")
