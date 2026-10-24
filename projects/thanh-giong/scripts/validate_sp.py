#!/usr/bin/env python
"""Validate scene_plan.json S2E02 thanh-giong: keys/enum/id liên tục/phủ sections/anchors substring."""
import json
import sys

sys.path.insert(0, "/Users/tuyennguyen/project/OpenMontage")
from schemas.artifacts import validate_artifact

P = "/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong"
sp = json.load(open(f"{P}/artifacts/scene_plan.json"))
script = json.load(open(f"{P}/artifacts/script.json"))
text_by_sec = {s["id"]: s["text"] for s in script["sections"]}

errs = []
try:
    validate_artifact("scene_plan", sp)
except Exception as e:
    errs.append(f"SCHEMA: {e}")

scenes = sp.get("scenes", [])
if not (60 <= len(scenes) <= 70):
    errs.append(f"scene count {len(scenes)} ngoài 60–70")

prev_sec_idx = -1
sec_order = [f"s{i:02d}" for i in range(1, 29)]
for i, sc in enumerate(scenes, 1):
    sid = sc.get("id", "")
    if sid != f"sc{i:03d}":
        errs.append(f"{sid}: id không tuần tự (mong đợi sc{i:03d})")
    sec = sc.get("script_section_id", "")
    if sec not in text_by_sec:
        errs.append(f"{sid}: section lạ {sec}")
        continue
    idx = sec_order.index(sec)
    if idx < prev_sec_idx:
        errs.append(f"{sid}: section lùi thứ tự ({sec} sau {sec_order[prev_sec_idx]})")
    prev_sec_idx = idx
    for key in ("type", "description", "start_seconds", "end_seconds", "framing", "movement",
                "overlay_notes", "shot_language", "shot_intent", "narrative_role",
                "information_role", "texture_keywords", "required_assets"):
        if key not in sc:
            errs.append(f"{sid}: thiếu key {key}")
    if sc.get("end_seconds", 0) <= sc.get("start_seconds", 0):
        errs.append(f"{sid}: end<=start")

# anchors substring check (overlay_notes chứa «...»)
import re
for sc in scenes:
    sec = sc.get("script_section_id", "")
    if sec not in text_by_sec:
        continue
    anchors = re.findall(r"«([^»]+)»", sc.get("overlay_notes", ""))
    if not anchors:
        errs.append(f"{sc['id']}: không có anchor «...» trong overlay_notes")
    for a in anchors:
        if a not in text_by_sec[sec]:
            errs.append(f"{sc['id']}: anchor '{a}' KHÔNG phải substring của {sec}")

covered = {sc.get("script_section_id") for sc in scenes}
missing = [s for s in sec_order if s not in covered]
if missing:
    errs.append(f"sections chưa phủ: {missing}")

# climax scene quote_card (type đã normalize → tìm trong description)
clim = [sc for sc in scenes if sc.get("script_section_id") == "s23"]
if not any("Cả làng nuôi" in sc.get("description", "") for sc in clim):
    errs.append("s23: thiếu scene quote 'Cả làng nuôi nó lớn.'")

md = sp.get("metadata", {})
if md.get("scene_count") != len(scenes):
    errs.append(f"metadata.scene_count {md.get('scene_count')} != {len(scenes)}")

print(f"scenes={len(scenes)} sections phủ={len(covered)}/28 anchors-check xong")
if errs:
    print("INVALID:")
    for e in errs[:20]:
        print("  !", e)
    sys.exit(1)
print("VALID")
