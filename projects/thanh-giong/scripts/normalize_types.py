#!/usr/bin/env python
"""S2E02 — normalize scene types về enum schema + required_assets thành object + metadata (một lần)."""
import json
from collections import Counter

P = "/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong/artifacts/scene_plan.json"
sp = json.load(open(P))
M = {"end_card": "text_card", "quote_card": "text_card", "image_scene": "generated",
     "map_scene": "diagram", "stat_card": "diagram", "compare": "diagram"}
for sc in sp["scenes"]:
    sc["type"] = M.get(sc["type"], sc["type"])
    fixed = []
    for a in sc.get("required_assets", []):
        if isinstance(a, str):
            src = "provided" if a.startswith("f07") else "generate"
            fixed.append({"type": "image", "description": f"{a}.png — focal (xem scene description)", "source": src})
        else:
            fixed.append(a)
    sc["required_assets"] = fixed
cnt = Counter(sc["type"] for sc in sp["scenes"])
sp["metadata"]["scene_types_breakdown"] = dict(cnt)
sp["metadata"]["scene_types_used"] = sorted(cnt)
json.dump(sp, open(P, "w"), ensure_ascii=False, indent=2)
print("normalized:", dict(cnt), "| asset objects:", sum(len(sc["required_assets"]) for sc in sp["scenes"]))
