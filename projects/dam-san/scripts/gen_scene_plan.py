#!/usr/bin/env python3
"""Generate Stage 4 scene_plan.json + scene_manifest mapping s01..s30 -> 10 Blender 3D shots (20 renders) + 12 Remotion diagrams."""
from __future__ import annotations

import json
import sys
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
sys.path.insert(0, str(OM))

from lib.checkpoint import write_checkpoint  # noqa: E402
from schemas.artifacts import validate_artifact  # noqa: E402

PROJECT_ID = "dam-san"
P = OM / "projects" / PROJECT_ID

# Map each section id -> (blender_shot_or_primary_visual, diagram_id_or_None, archetype, narrative_role, lens_mm, cam_move, lighting_key)
SCENE_LAYOUTS = {
    "s01": ("blender/B3D-01-wide.png", None, "full_bleed_3d", "establish_context", 35, "dolly_in", "golden_hour"),
    "s02": ("blender/B3D-01-detail.png", "D01", "split_3d_diagram", "introduce_subject", 50, "pan_right", "natural"),
    "s03": ("blender/B3D-02-wide.png", None, "full_bleed_3d_callout", "establish_context", 35, "orbital", "tungsten_warm"),
    "s04": ("blender/B3D-02-detail.png", "D02", "diagram_focus", "introduce_subject", 50, "zoom_in", "natural"),
    "s05": ("blender/B3D-03-wide.png", None, "full_bleed_3d", "build_tension", 50, "tracking_right", "rim_lit"),
    "s06": ("blender/B3D-04-wide.png", None, "full_bleed_3d_callout", "evidence", 35, "dolly_in", "tungsten_warm"),
    "s07": ("blender/B3D-04-detail.png", "D03", "diagram_split_3d", "deliver_payload", 50, "zoom_in", "natural"),
    "s08": ("blender/B3D-03-detail.png", None, "archival_quote_3d", "evidence", 85, "pan_left", "tungsten_warm"),
    "s09": ("blender/B3D-05-wide.png", None, "full_bleed_3d", "build_tension", 24, "dolly_out", "low_key"),
    "s10": ("blender/B3D-06-wide.png", None, "full_bleed_3d_callout", "build_tension", 35, "dolly_in", "rim_lit"),
    "s11": ("blender/B3D-06-detail.png", None, "full_bleed_3d", "emotional_beat", 85, "dolly_out", "tungsten_warm"),
    "s12": ("blender/B3D-05-detail.png", "D04", "diagram_focus", "comparison", 50, "static", "natural"),
    "s13": ("blender/B3D-07-wide.png", None, "full_bleed_3d_callout", "transition", 35, "pan_right", "tungsten_warm"),
    "s14": ("blender/B3D-07-detail.png", "D05", "diagram_split_3d", "deliver_payload", 50, "zoom_in", "natural"),
    "s15": ("blender/B3D-02-wide.png", None, "full_bleed_3d", "evidence", 24, "tracking_left", "golden_hour"),
    "s16": ("blender/B3D-02-detail.png", "D06", "diagram_focus", "deliver_payload", 35, "zoom_in", "natural"),
    "s17": ("blender/B3D-08-wide.png", None, "full_bleed_3d_callout", "deliver_payload", 24, "orbital", "natural"),
    "s18": ("blender/B3D-08-detail.png", "D07", "diagram_split_3d", "evidence", 35, "pan_right", "natural"),
    "s19": ("blender/B3D-08-wide.png", None, "archival_quote_3d", "comparison", 50, "dolly_in", "golden_hour"),
    "s20": ("blender/B3D-09-wide.png", None, "full_bleed_3d", "establish_context", 35, "dolly_in", "rim_lit"),
    "s21": ("blender/B3D-09-detail.png", "D08", "diagram_focus", "evidence", 85, "zoom_in", "tungsten_warm"),
    "s22": ("blender/B3D-08-detail.png", "D09", "diagram_focus", "evidence", 50, "static", "natural"),
    "s23": ("blender/B3D-10-wide.png", None, "full_bleed_3d_callout", "deliver_payload", 35, "dolly_in", "tungsten_warm"),
    "s24": ("blender/B3D-10-detail.png", "D10", "diagram_focus", "deliver_payload", 50, "zoom_in", "natural"),
    "s25": ("blender/B3D-04-detail.png", "D11", "diagram_focus", "comparison", 50, "static", "natural"),
    "s26": ("blender/B3D-04-wide.png", "D12", "diagram_split_3d", "evidence", 35, "pan_left", "natural"),
    "s27": ("blender/B3D-09-detail.png", None, "archival_quote_3d", "emotional_beat", 85, "dolly_in", "tungsten_warm"),
    "s28": ("blender/B3D-10-detail.png", None, "full_bleed_3d_callout", "comparison", 50, "dolly_out", "low_key"),
    "s29": ("blender/B3D-01-detail.png", None, "full_bleed_3d", "resolution", 50, "dolly_out", "golden_hour"),
    "s30": ("blender/B3D-01-wide.png", "D01", "end_card_3d", "call_to_action", 35, "crane_up", "golden_hour"),
}


def main() -> None:
    script = json.loads((P / "artifacts" / "script.json").read_text(encoding="utf-8"))
    scenes = []
    manifest_rows = []
    for idx, s in enumerate(script["sections"], 1):
        sid = s["id"]
        sc_id = f"sc{idx:03d}"
        blender_img, diag_id, archetype, role, lens, move, light = SCENE_LAYOUTS[sid]
        stype = "diagram" if (diag_id and archetype == "diagram_focus") else "animation"
        req_assets = [
            {
                "type": "image",
                "description": f"Blender 5.2.2 LTS Cycles render: {blender_img}",
                "source": "generate",
            }
        ]
        if diag_id:
            req_assets.append({
                "type": "diagram",
                "description": f"Remotion Atelier infographic {diag_id}",
                "source": "generate",
            })
        scenes.append({
            "id": sc_id,
            "type": stype,
            "script_section_id": sid,
            "description": f"[{s['label']}] {archetype} | 3D={blender_img}" + (f" | Infographic={diag_id}" if diag_id else ""),
            "start_seconds": s["start_seconds"],
            "end_seconds": s["end_seconds"],
            "framing": archetype,
            "movement": move,
            "transition_in": "cross_dissolve",
            "transition_out": "cross_dissolve",
            "overlay_notes": f"Diagram={diag_id}" if diag_id else "Minimal editorial chapter tag only (no toast pill)",
            "shot_language": {
                "shot_size": "wide" if "wide" in blender_img else "medium_close",
                "camera_movement": move,
                "lens_mm": lens,
                "lighting_key": light,
                "depth_of_field": "shallow" if lens >= 50 else "medium",
                "color_temperature": "warm" if light in ("tungsten_warm", "golden_hour", "rim_lit") else "neutral",
            },
            "shot_intent": s["label"],
            "narrative_role": role,
            "information_role": f"Claim ref {s['source_ref']}",
            "hero_moment": sid in ("s01", "s06", "s11", "s16", "s17", "s20", "s24", "s29"),
            "texture_keywords": ["basalt", "ironwood", "beeswax", "antique_brass", "warm_archival_paper"],
            "required_assets": req_assets,
        })
        manifest_rows.append({
            "scene_id": sc_id,
            "section_id": sid,
            "label": s["label"],
            "archetype": archetype,
            "blender_asset": blender_img,
            "diagram_id": diag_id,
            "source_ref": s["source_ref"],
        })

    scene_plan = {
        "version": "1.0",
        "style_playbook": "ink-genome",
        "scenes": scenes,
        "metadata": {
            "episode": "S3E02-dam-san",
            "blender_hero_shots": 10,
            "blender_total_renders": 20,
            "remotion_diagrams": 12,
        },
    }
    validate_artifact("scene_plan", scene_plan)
    (P / "artifacts" / "scene_plan.json").write_text(json.dumps(scene_plan, indent=2, ensure_ascii=False), encoding="utf-8")
    (P / "scene_manifest.json").write_text(json.dumps({"scenes": manifest_rows}, indent=2, ensure_ascii=False), encoding="utf-8")
    cp = write_checkpoint(
        OM / "projects",
        PROJECT_ID,
        "scene_plan",
        "completed",
        {"scene_plan": scene_plan},
        pipeline_type="animated-explainer",
        style_playbook="ink-genome",
        checkpoint_policy="guided",
        human_approved=True,
    )
    print(f"PASS scene_plan.json: {len(scenes)} scenes -> {cp}")


if __name__ == "__main__":
    main()
