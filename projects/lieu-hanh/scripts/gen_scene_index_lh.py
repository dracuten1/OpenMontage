#!/usr/bin/env python3
"""Generate scene_index_S2E04.md from REAL scene_timing.json + scene_plan + captions."""
import json
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
P = OM / "projects" / "lieu-hanh"
FPS = 30

timing = json.loads((P / "artifacts" / "scene_timing.json").read_text(encoding="utf-8"))
plan = {s["id"]: s for s in json.loads((P / "artifacts" / "scene_plan.json").read_text(encoding="utf-8"))["scenes"] if isinstance(s, dict)}
caps = json.loads((OM / "remotion-composer/public/lieu-hanh/captions.json").read_text(encoding="utf-8"))

def mmss(sec):
    m, s = divmod(int(round(sec)), 60)
    return f"{m:02d}:{s:02d}"

lines = ["# S2E04 Liễu Hạnh — scene index (speech-locked timing thật)", "",
         f"Tổng: 900.10s (27003 frames @30fps) · 50 scenes · audio thật 898.07s", ""]
for t in timing["scenes"]:
    sid = t["sceneId"]
    sc = plan.get(sid, {})
    s0 = t["startFrame"] / FPS
    s1 = (t["startFrame"] + t["durationInFrames"]) / FPS
    dur = t["durationInFrames"] / FPS
    kind = sc.get("type", "?")
    desc = (sc.get("description") or "").replace("\n", " ")[:110]
    cues = caps.get(sid, {}).get("cues", [])
    narr = (cues[0]["text"][:80] + "…") if cues else ""
    anchor = t.get("firstAnchor") or ""
    lines.append(
        f"**{sid}** · f{t['startFrame']}–{t['startFrame']+t['durationInFrames']} · "
        f"{mmss(s0)}→{mmss(s1)} · {dur:.1f}s · {kind}"
        + (" · HERO" if sc.get("hero_moment") else ""))
    lines.append(f"  - anchor «{anchor}» | {desc}")
    if narr:
        lines.append(f"  - narration: {narr}")
    lines.append("")

out = P / "scene_index_S2E04.md"
out.write_text("\n".join(lines), encoding="utf-8")
print(f"scene_index written: {out} ({len(timing['scenes'])} scenes)")
