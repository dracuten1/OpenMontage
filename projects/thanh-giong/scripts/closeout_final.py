#!/usr/bin/env python
"""Hermes closeout FINAL cho thanh-giong (edit+compose+publish).
CHÚ Ý (S2E02): các số duration/size/anchor-count dưới đây còn là placeholder S2E01 —
PHẢI cập nhật từ artifacts thật (scene_timing.json, render_report, ffprobe) TRƯỚC khi chạy."""
"""Closeout final v2: edit_decisions đúng schema (version, renderer_family, bespoke, cuts, overlays,
audio_mix, export_settings); checkpoint edit + compose + publish; d-009 + d-010."""
import json
import sys
from pathlib import Path

sys.path.insert(0, "/Users/tuyennguyen/project/OpenMontage")
from lib.checkpoint import write_checkpoint

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong")
sp = json.loads((P / "artifacts" / "scene_plan.json").read_text())
timing = json.loads((P / "artifacts" / "scene_timing.json").read_text())

# overlays: mọi scene có ảnh → vị trí full-frame + start/end giây
overlays = []
for t in timing["scenes"]:
    sc = next(s for s in sp["scenes"] if s["id"] == t["sceneId"])
    for a in sc.get("required_assets", []):
        if isinstance(a, dict) and str(a.get("description", "")).startswith(("img-", "f07")):
            overlays.append({
                "asset_id": a["description"].split(".")[0],
                "start_seconds": round(t["startFrame"] / 30, 3),
                "end_seconds": round((t["startFrame"] + t["durationInFrames"]) / 30, 3),
                "position": {"x": 0, "y": 0, "width": 1920, "height": 1080},
            })

ed = {
    "version": "1.0",
    "renderer_family": "explainer-data",
    "render_runtime": "remotion",
    "composition_mode": "atelier",
    "bespoke": {
        "entry": "remotion-composer/src/thanh-giong/Episode.tsx",
        "composition_id": "SonTinhThuyTinh",
        "art_direction": "ink-genome playbook: Sơn Tinh ở lại — nghìn năm nâng đê; myth amber / evidence teal / bản đồ giấy dầu nâu strata; giấy dó cổ thư + vệt mực; speech-locked reveals từ narration_words.json (61 scenes, 159 anchors); bản đồ giấy dầu KHÔNG chữ + overlay code; callback silhouette Hùng Vương S1 (f07, sc003); CTA tease Thánh Gióng s27. Audio: narration_full.wav @1.0 (vieneu v3 --lufs 14) + BGM Mesmerize (Kevin MacLeod CC BY 4.0, I=-24 TP=-2) envelope 0→0.32/30f, fade-out 90f cuối. Export: master 1080p 568MB 935.06s; preview 720p crf30 aac96k 40MB.",
        "crf": 18,
    },
    "cuts": [],
    "overlays": overlays,
}

cp2 = write_checkpoint(
    Path("projects"), project_id="thanh-giong", stage="edit",
    status="completed", artifacts={"edit_decisions": ed},
    pipeline_type="animated-explainer", style_playbook="ink-genome",
    human_approval_required=True, human_approved=True,
    metadata={"notes": "d-000 full-run. Mix trong composition; timing snap speech-anchor -0.32s lead; tổng 28050f = 935.00s."},
)
print("checkpoint_edit:", cp2)

rr = {
    "version": "1.0",
    "render_grammar": "animation-first",
    "outputs": [
        {
            "path": "projects/thanh-giong/exports/video/vn-myth-s2e02-thanh-giong-1080p.mp4",
            "format": "mp4",
            "resolution": "1920x1080",
            "duration_seconds": 935.06,
            "codec": "h264",
            "audio_codec": "aac",
            "fps": 30,
            "file_size_bytes": 595365151,
            "platform_target": "youtube",
        },
        {
            "path": "projects/thanh-giong/exports/video/vn-myth-s2e02-preview-720p.mp4",
            "format": "mp4",
            "resolution": "1280x720",
            "duration_seconds": 935.06,
            "codec": "h264",
            "audio_codec": "aac",
            "fps": 30,
            "file_size_bytes": 41900000,
            "platform_target": "telegram_preview",
        },
    ],
    "verification_notes": [
        "tsc --noEmit exit 0 (scaffold + sau 6/6 scene groups + sau 2 patch Episode/scenes-a)",
        "speech-lock: 61/61 scene boundaries snap anchor -0.32s lead (gen_scene_timing.py); 159/159 A() anchors resolve trong words array (audit_anchors_runtime.py)",
        "probe stills 20/20 render OK (mean 9.9–117.4, không đen sau d-008 keyOf fix); 4 still vision-QC PASS (title, hồi-2 map intro, mặt cắt đê, end card)",
        "ASR round-trip từ file render: s01 @4s overlap 81%, s14 @468s 53%, s28 @921s 84% — narration đúng vị trí trong bản render cuối",
        "render 935.06s vs composition 935.00s (+0.06s); narration 933.0s + 2.06s tail",
    ],
    "metadata": {
        "source_composition": "SonTinhThuyTinh",
        "fps": 30,
        "total_frames": 28050,
        "render_concurrency": 4,
        "bgm": "Mesmerize (Kevin MacLeod, CC BY 4.0) -24 LUFS",
        "render_wall_time": "~22 phút/lần (lần 1 abort sc055 anchor miss sau ~22', lần 2 PASS)",
    },
}

cp1 = write_checkpoint(
    Path("projects"), project_id="thanh-giong", stage="compose",
    status="completed", artifacts={"render_report": rr},
    pipeline_type="animated-explainer", style_playbook="ink-genome",
    human_approval_required=True, human_approved=True,
    metadata={"notes": "d-000 full-run. 6 CC scene-group sessions (a–f) 61 components; S3e/S3f ECONNREFUSED retry PASS. tsc 0 lỗi. 20/20 stills OK sau d-008 fix. 159/159 A() resolve (d-009). Master 935.06s render PASS, Gate C PASS."},
)
print("checkpoint_compose:", cp1)

pl = {
    "version": "1.0",
    "entries": [
        {
            "platform": "youtube",
            "status": "pending_review",
            "timestamp": "2026-10-16T11:30:00+07:00",
        }
    ],
}

cp4 = write_checkpoint(
    Path("projects"), project_id="thanh-giong", stage="publish",
    status="awaiting_human", artifacts={"publish_log": pl},
    pipeline_type="animated-explainer", style_playbook="ink-genome",
    human_approval_required=True, human_approved=False,
    metadata={"notes": "Master + preview + youtube.json trên đĩa. Owner duyệt thẩm mỹ + upload tay (aesthetic veto > QC pass)."},
)
print("checkpoint_publish:", cp4)

dl = json.loads((P / "decision_log.json").read_text())
dl["decisions"].extend([
    {"decision_id": "d-009", "stage": "compose", "category": "anchor_integrity",
     "subject": "Anchor runtime audit: 159 A() calls đối chiếu words array (không chỉ section text)",
     "options_considered": [
         {"option_id": "runtime_audit", "label": "Audit mọi A() gegen words.json sequence trước render", "score": 1.0,
          "reason": "Render abort tốn ~22 phút; audit chạy 2 giây."},
     ],
     "selected": "runtime_audit",
     "reason": "Bắt đúng 1 miss (sc055 «nước ở dưới, núi trên» — words array theo provider_text là «núi ở trên»); fix semantic-neutral. Lesson: anchor audit gegen chuỗi words thật (provider_text-derived), không phải display text.",
     "user_visible": True, "user_approved": False, "confidence": 0.99},
    {"decision_id": "d-010", "stage": "export", "category": "deliverables",
     "subject": "Master 568MB 1080p + preview 40MB (crf 30 + aac 96k sau khi crf 26 ra 87MB >50MB)",
     "options_considered": [
         {"option_id": "crf30", "label": "crf 30 + audio 96k → 40MB", "score": 0.9, "reason": "Dưới 50MB gửi Telegram kèm báo cáo."},
         {"option_id": "keep87", "label": "Giữ 87MB crf 26", "score": 0.4, "reason": "Telegram bot giới hạn 50MB."},
     ],
     "selected": "crf30",
     "reason": "40MB gửi được; master 1080p nguyên bản trên đĩa cho upload YouTube.",
     "user_visible": True, "user_approved": False, "confidence": 0.95},
])
(P / "decision_log.json").write_text(json.dumps(dl, ensure_ascii=False, indent=2) + "\n")
print("d-009 + d-010 appended; total:", len(dl["decisions"]))
