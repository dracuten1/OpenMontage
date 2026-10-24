#!/usr/bin/env python
"""Build specs A–F cho S3 scene workers: sceneId, exportName, sectionId, startFrame, durationInFrames,
type, description, framing, movement, hero_moment, anchors, required_assets, narration_sections.
Mirror format spec_*.json Ep.06. Groups a–f khớp stub files scenes-a..f.tsx (round-robin scaffold)."""
import json
import re
from pathlib import Path

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong")
SRC = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/src/thanh-giong")

sp = json.loads((P / "artifacts" / "scene_plan.json").read_text())
script = json.loads((P / "artifacts" / "script.json").read_text())
timing = json.loads((P / "artifacts" / "scene_timing.json").read_text())
tmap = {t["sceneId"]: t for t in timing["scenes"]}
texts = {s["id"]: s["text"] for s in script["sections"]}

# group membership từ stub files (scaffold round-robin)
groups = {}
for f in sorted(SRC.glob("scenes-?.tsx")):
    g = f.stem.split("-")[1]
    ids = re.findall(r"/\*\* (sc\d+) \(", f.read_text())
    groups[g] = ids
print({g: len(v) for g, v in groups.items()})

def anchors_of(scene):
    m = re.search(r"anchors?:\s*(.+)", scene.get("overlay_notes", "") or "")
    return re.findall(r"«([^»]+)»", m.group(1)) if m else []

def assets_of(scene):
    out = []
    for a in scene.get("required_assets", []):
        if isinstance(a, dict):
            desc = a.get("description", "")
            for name in [f"img-{i:02d}" for i in range(1, 14)] + ["f07-hung-vuong"]:
                if desc.startswith(name):
                    out.append(name)
    return out

(P / "logs" / "parts").mkdir(parents=True, exist_ok=True)
for g, ids in groups.items():
    scenes_out = []
    for sid in ids:
        sc = next(s for s in sp["scenes"] if s["id"] == sid)
        t = tmap[sid]
        n = int(re.search(r"\d+", sid).group())
        scenes_out.append({
            "sceneId": sid,
            "exportName": f"Sc{n:03d}",
            "sectionId": sc["script_section_id"],
            "startFrame": t["startFrame"],
            "durationInFrames": t["durationInFrames"],
            "type": sc["type"],
            "description": sc["description"],
            "framing": sc.get("framing", ""),
            "movement": sc.get("movement", ""),
            "overlay_notes": sc.get("overlay_notes", ""),
            "hero_moment": sc.get("hero_moment", ""),
            "anchors": anchors_of(sc),
            "required_assets": assets_of(sc),
        })
    sec_ids = sorted(set(s["sectionId"] for s in scenes_out))
    spec = {
        "_read": [
            "KHÔNG đọc gì thêm — API embed trong prompt. File này là input duy nhất.",
        ],
        "project": "thanh-giong",
        "narration_sections": {k: texts[k] for k in sec_ids},
        "scenes": scenes_out,
    }
    out = P / "logs" / "parts" / f"spec_{g}.json"
    out.write_text(json.dumps(spec, ensure_ascii=False, indent=1) + "\n")
    print(f"spec_{g}.json: {len(scenes_out)} scenes, sections {sec_ids[0]}..{sec_ids[-1]}")
