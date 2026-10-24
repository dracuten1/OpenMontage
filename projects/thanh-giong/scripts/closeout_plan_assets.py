#!/usr/bin/env python
"""Closeout S2E02: checkpoint scene_plan + assets (đúng số liệu thật thanh-giong)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, "/Users/tuyennguyen/project/OpenMontage")
from lib.checkpoint import write_checkpoint
from schemas.artifacts import validate_artifact

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong")

# 1. scene_plan checkpoint
sp = json.loads((P / "artifacts" / "scene_plan.json").read_text())
validate_artifact("scene_plan", sp)
cp_sp = write_checkpoint(
    Path("projects"), project_id="thanh-giong", stage="scene_plan",
    status="completed", artifacts={"scene_plan": sp},
    pipeline_type="animated-explainer", style_playbook="ink-genome",
    human_approval_required=True, human_approved=True,
    metadata={"notes": "d-000 full-run. S1c2 CC viết 70 scenes trong 1 session (hết turns sau khi xong file; Hermes normalize type-enum + required_assets objects). 28/28 sections phủ; anchors 100% substring nguyên văn; climax s23 quote 'Cả làng nuôi nó lớn.'; breakdown 15 text_card / 35 diagram / 20 generated."},
)
print("checkpoint_scene_plan:", cp_sp)

# 2. asset_manifest: thêm images + f07 + BGM Floating Cities (schema strict: id/type/path/source_tool/scene_id)
manifest = json.loads((P / "artifacts" / "asset_manifest.json").read_text())
items = manifest.get("assets", manifest.get("items", []))
existing_ids = {it.get("id") or it.get("asset_id") for it in items}

img_names = [f"img-{i:02d}" for i in range(1, 14)]
for name in img_names:
    files = list((P / "assets/images").glob(f"{name}-*.png"))
    if files and name not in existing_ids:
        f = files[0]
        items.append({
            "id": name,
            "type": "image",
            "path": str(f.relative_to(P)),
            "source_tool": "gen_s2b_images.py (9router ag/gemini-3.1-flash-image, $0)",
            "scene_id": "multiple",
            "generation_summary": "ink-genome plate, style suffix S1, PIL-verified PNG",
        })

if "f07-hung-vuong" not in existing_ids:
    items.append({
        "id": "f07-hung-vuong",
        "type": "image",
        "path": "assets/reference/f07-hung-vuong.png",
        "source_tool": "reuse vn-myth S1 (nguon-goc-dan-toc capture)",
        "scene_id": "setup-callback",
        "generation_summary": "silhouette/tranh cổ only — 1 lần thoáng, không vẽ lại",
    })

if "bgm-floating-cities" not in existing_ids:
    items.append({
        "id": "bgm-floating-cities",
        "type": "music",
        "path": "assets/music/background_music.mp3",
        "source_tool": "ffmpeg build_bgm.py (loop acrossfade 4s, loudnorm I=-24 TP=-2, fade-out 4s)",
        "scene_id": "all",
        "duration_seconds": 944.0,
        "license": "CC BY 4.0",
        "provider": "Kevin MacLeod (incompetech.com) — media-library catalog",
        "generation_summary": "Floating Cities 3:04 body loop — d-005; credit vào youtube.json",
    })

manifest["assets"] = items
validate_artifact("asset_manifest", manifest)
(P / "artifacts" / "asset_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

cp_assets = write_checkpoint(
    Path("projects"), project_id="thanh-giong", stage="assets",
    status="completed", artifacts={"asset_manifest": manifest},
    pipeline_type="animated-explainer", style_playbook="ink-genome",
    human_approval_required=True, human_approved=True,
    metadata={"notes": "d-000 full-run. S2a audio (28 sections, 941.5s narration, 661 srt cues, vieneu v3 local), BGM 'Floating Cities' (Kevin MacLeod CC BY 4.0, 944.0s, I=-24 TP=-2, d-005), 13 PNG via 9router ag/gemini $0 (4 vision-QC pass no-text: img-01/04/05/12) + f07 reuse. Duration giữ tự nhiên (d-007)."},
)
print("checkpoint_assets:", cp_assets)

dl = json.loads((P / "decision_log.json").read_text())
ids = {d["decision_id"] for d in dl["decisions"]}
if "d-008" not in ids:
    dl["decisions"].append({
        "decision_id": "d-008",
        "stage": "scene_plan",
        "category": "scene_architecture",
        "subject": "70 scenes (15 text_card, 35 diagram, 20 generated), 28/28 sections, anchors substring 100%",
        "options_considered": [
            {"option_id": "70_scenes", "label": "70 scenes (~13.5s/scene) — upper band target", "score": 0.9,
             "reason": "Phủ dày trục vật thể 3 hồi; đúng range 60–70; anchors đều nguyên văn section text (validate_sp PASS)."},
        ],
        "selected": "70_scenes",
        "reason": "S1c2 1 session sống (hết turns sau khi đủ file); Hermes normalize type-enum (quote_card/stat_card/…→ text_card/diagram/generated) + required_assets object hóa cho khớp schema.",
        "user_visible": True, "user_approved": False, "confidence": 0.9,
    })
    (P / "decision_log.json").write_text(json.dumps(dl, ensure_ascii=False, indent=2) + "\n")
    print("d-008 appended")
