#!/usr/bin/env python3
"""Write validated Stage 5 (asset_manifest) and Stage 6 (edit_decisions) artifacts & checkpoints for dam-san."""
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
PUB = OM / "remotion-composer" / "public" / PROJECT_ID


def main() -> None:
    st = json.loads((P / "artifacts" / "scene_timing.json").read_text(encoding="utf-8"))
    mf = json.loads((P / "scene_manifest.json").read_text(encoding="utf-8"))
    pp = json.loads((P / "artifacts" / "proposal_packet.json").read_text(encoding="utf-8"))
    durs = json.loads((P / "qc" / "tts_durations.json").read_text(encoding="utf-8"))

    assets = []
    # 1. All 20 Blender 5.2.2 LTS PNGs + 10 .blend source scenes
    for b_png in sorted((PUB / "blender").glob("*.png")):
        assets.append({
            "id": f"img-{b_png.stem}",
            "type": "image",
            "path": str(b_png),
            "source_tool": "blender",
            "scene_id": "global",
            "resolution": "1920x1080",
            "format": "png",
            "cost_usd": 0.0,
            "provider": "Blender 5.2.2 LTS Cycles (Apple M4 Metal GPU)",
        })
    for b_mp4 in sorted((PUB / "blender" / "video").glob("B3D-*-clip.mp4")):
        assets.append({
            "id": f"vid-{b_mp4.stem}",
            "type": "video",
            "path": str(b_mp4),
            "source_tool": "blender",
            "scene_id": "global",
            "resolution": "1920x1080",
            "duration_seconds": 10.0,
            "format": "mp4",
            "cost_usd": 0.0,
            "provider": "Blender 5.2.2 LTS EEVEE Animated + BlenderKit (AgX 1080p)",
        })
    for b_blend in sorted((P / "assets" / "blender").glob("*.blend")):
        assets.append({
            "id": f"3d-{b_blend.stem}",
            "type": "3d_asset",
            "path": str(b_blend),
            "source_tool": "blender",
            "scene_id": "global",
            "format": "blend",
            "cost_usd": 0.0,
        })
    for a_blend in sorted((P / "assets" / "blender_anim").glob("*.blend")):
        assets.append({
            "id": f"3d-anim-{a_blend.stem}",
            "type": "3d_asset",
            "path": str(a_blend),
            "source_tool": "blender",
            "scene_id": "global",
            "subtype": "animated_scene",
            "format": "blend",
            "cost_usd": 0.0,
        })
    bk_mf = P / "assets" / "blenderkit_assets" / "blenderkit_manifest.json"
    if bk_mf.exists():
        assets.append({
            "id": "3d-blenderkit-manifest",
            "type": "3d_asset",
            "path": str(bk_mf),
            "source_tool": "blenderkit_catalog",
            "scene_id": "global",
            "subtype": "provenance_manifest",
            "format": "json",
            "provider": "blenderkit",
            "cost_usd": 0.0,
        })

    # 2. All 30 TTS narration WAVs
    for sec in st["sections"]:
        sid = sec["id"]
        assets.append({
            "id": f"tts-{sid}",
            "type": "narration",
            "path": str(P / "assets" / "audio" / "sections" / f"{sid}.wav"),
            "source_tool": "vieneu",
            "scene_id": sec["scene"],
            "duration_seconds": durs[sid]["audio_seconds"],
            "format": "wav",
            "cost_usd": 0.0,
            "voice_performance": {
                "source_section_id": sid,
                "delivery_cues_applied": True,
                "provider_text_used": True,
                "sample_approved": True,
            },
        })

    # 3. Full concatenated narration, prepared BGM, and SRT captions
    assets.append({
        "id": "narration-full",
        "type": "narration",
        "path": str(PUB / "narration_full.wav"),
        "source_tool": "ffmpeg",
        "scene_id": "global",
        "duration_seconds": st["total_seconds"],
        "format": "wav",
        "cost_usd": 0.0,
    })
    assets.append({
        "id": "bgm-the-complex",
        "type": "music",
        "path": str(PUB / "background_music.mp3"),
        "source_tool": "media_library",
        "scene_id": "global",
        "duration_seconds": st["total_seconds"],
        "format": "mp3",
        "license": "CC-BY-4.0",
        "original_url": "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300025",
        "cost_usd": 0.0,
    })
    assets.append({
        "id": "captions-srt",
        "type": "subtitle",
        "path": str(PUB / "captions.srt"),
        "source_tool": "transcriber",
        "scene_id": "global",
        "format": "srt",
        "cost_usd": 0.0,
    })

    asset_manifest = {
        "version": "1.0",
        "assets": assets,
        "total_cost_usd": 0.0,
        "metadata": {
            "blender_pngs": len(list((PUB / "blender").glob("*.png"))),
            "blender_videos": len(list((PUB / "blender" / "video").glob("B3D-*-clip.mp4"))),
            "blend_files": len(list((P / "assets" / "blender").glob("*.blend"))),
            "blend_anim_files": len(list((P / "assets" / "blender_anim").glob("*.blend"))),
            "tts_sections": len(st["sections"]),
        },
    }
    validate_artifact("asset_manifest", asset_manifest)
    (P / "artifacts" / "asset_manifest.json").write_text(json.dumps(asset_manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    cp_a = write_checkpoint(
        OM / "projects", PROJECT_ID, "assets", "completed", {"asset_manifest": asset_manifest},
        pipeline_type="animated-explainer", style_playbook="ink-genome", human_approved=True,
    )
    print(f"PASS asset_manifest ({len(assets)} assets) -> {cp_a}")

    # Stage 6 edit_decisions
    by_sc = {r["scene_id"]: r for r in mf["scenes"]}
    cuts = []
    for sec in st["sections"]:
        row = by_sc[sec["scene"]]
        b3d_asset = row["blender_asset"]
        clip_prefix = Path(b3d_asset).name[:6]
        src_path = PUB / "blender" / "video" / f"{clip_prefix}-clip.mp4" if row["diagram_id"] is None else PUB / b3d_asset
        cuts.append({
            "id": sec["scene"],
            "source": str(src_path),
            "in_seconds": sec["start"],
            "out_seconds": sec["end"],
            "layer": "primary",
            "transition_in": "cross_dissolve",
            "transition_out": "cross_dissolve",
            "transition_duration": 0.5,
            "reason": f"{row['archetype']} ({row['label']})",
        })

    edit_decisions = {
        "version": "1.0",
        "render_runtime": "remotion",
        "renderer_family": "documentary-montage",
        "composition_mode": "atelier",
        "cuts": cuts,
        "bespoke": {
            "entry": "src/dam-san/index.tsx",
            "composition_id": "dam-san-FINAL",
            "art_direction": pp["production_plan"]["art_direction"],
            "public_dir": str(PUB),
            "scale": 1.0,
            "crf": 18,
            "concurrency": 4,
        },
        "audio": {
            "narration": {
                "segments": [{"asset_id": "narration-full", "start_seconds": 0.0, "end_seconds": st["total_seconds"]}],
            },
            "music": {
                "asset_id": "bgm-the-complex",
                "volume": 0.115,
                "fade_in_seconds": 2.0,
                "fade_out_seconds": 5.0,
                "ducking": True,
            },
        },
        "subtitles": {
            "enabled": False,
            "style": "sidecar_srt",
            "source": str(PUB / "captions.srt"),
            "position": "bottom-center",
        },
        "music": {
            "asset_id": "bgm-the-complex",
            "volume": 0.115,
            "ducking": True,
            "fade_in_seconds": 2.0,
            "fade_out_seconds": 5.0,
        },
    }
    validate_artifact("edit_decisions", edit_decisions)
    (P / "artifacts" / "edit_decisions.json").write_text(json.dumps(edit_decisions, indent=2, ensure_ascii=False), encoding="utf-8")
    cp_e = write_checkpoint(
        OM / "projects", PROJECT_ID, "edit", "completed", {"edit_decisions": edit_decisions},
        pipeline_type="animated-explainer", style_playbook="ink-genome", human_approved=True,
    )
    print(f"PASS edit_decisions ({len(cuts)} cuts, atelier remotion) -> {cp_e}")


if __name__ == "__main__":
    main()
