#!/usr/bin/env python
"""S2E02 — sinh scene_timing_sweep.json (key snake) cho tools/qc/scene_sweep.py."""
import json
from pathlib import Path

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong")
t = json.load(open(P / "artifacts" / "scene_timing.json"))
out = {
    "project_id": "thanh-giong",
    "fps": t["fps"],
    "scenes": [
        {
            "scene_id": sc["sceneId"],
            "section_id": sc["sectionId"],
            "start_frame": sc["startFrame"],
            "duration_frames": sc["durationInFrames"],
            "start_seconds": sc["startFrame"] / t["fps"],
            "end_seconds": (sc["startFrame"] + sc["durationInFrames"]) / t["fps"],
            "duration_seconds": sc["durationInFrames"] / t["fps"],
        }
        for sc in t["scenes"]
    ],
}
(P / "artifacts" / "scene_timing_sweep.json").write_text(json.dumps(out, indent=2) + "\n")
print("scenes:", len(out["scenes"]))
