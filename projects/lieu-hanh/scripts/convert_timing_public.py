#!/usr/bin/env python3
"""Convert artifacts/scene_timing.json (engine camelCase) -> public/lieu-hanh/scene_timing.json
snake_case (scene_sweep Ep.05 format: scene_id/section_id/start_frame/duration_frames/
start_seconds/end_seconds/duration_seconds)."""
import json
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
src = json.loads((OM / "projects/lieu-hanh/artifacts/scene_timing.json").read_text(encoding="utf-8"))
FPS = src.get("fps", 30)
out = {"fps": FPS, "generated": src.get("generated"), "scenes": []}
for t in src["scenes"]:
    sf, df = t["startFrame"], t["durationInFrames"]
    out["scenes"].append({
        "scene_id": t["sceneId"],
        "section_id": t["sectionId"],
        "start_frame": sf,
        "duration_frames": df,
        "start_seconds": round(sf / FPS, 3),
        "end_seconds": round((sf + df) / FPS, 3),
        "duration_seconds": round(df / FPS, 3),
    })
dst = OM / "remotion-composer/public/lieu-hanh/scene_timing.json"
dst.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"written {dst}: {len(out['scenes'])} scenes")
