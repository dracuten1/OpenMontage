"""Convert artifacts/scene_timing.json (engine format) -> public/chu-dong-tu/scene_timing.json
(snake_case format cho tools/qc/scene_sweep.py)."""
import json
from pathlib import Path

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu")
t = json.loads((P / "artifacts" / "scene_timing.json").read_text())
rows = t["scenes"] if isinstance(t, dict) else t
out = []
for r in rows:
    sf, dur = r["startFrame"], r["durationInFrames"]
    out.append({
        "scene_id": r["sceneId"],
        "section_id": r["sectionId"],
        "start_frame": sf,
        "duration_frames": dur,
        "start_seconds": round(sf / 30, 4),
        "end_seconds": round((sf + dur) / 30, 4),
        "duration_seconds": round(dur / 30, 4),
    })
pub = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/public/chu-dong-tu/scene_timing.json")
pub.write_text(json.dumps({"fps": 30, "project_id": "chu-dong-tu", "scenes": out}, ensure_ascii=False, indent=1))
print("wrote", pub, len(out), "scenes")
