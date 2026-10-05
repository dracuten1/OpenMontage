"""Write projects/news-20261004/artifacts/edit_decisions.json + append decision_log entries (idempotent)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
A = ROOT / "projects" / "news-20261004" / "artifacts"
timing = json.loads((A / "scene_timing.json").read_text())
plan = {s["id"]: s for s in json.loads((A / "scene_plan.json").read_text())["scenes"]}

cuts = []
for t in timing:
    sid = t["scene_id"]
    cuts.append({
        "id": f"cut-{sid}",
        "source": f"bespoke:remotion-composer/src/news-20261004/scenes/{sid.upper()}.tsx",
        "in_seconds": t["start_seconds"],
        "out_seconds": t["end_seconds"],
        "layer": "primary",
        "transition_in": "cut",
        "transition_out": "cut",
        "reason": f"Scene {sid} ({plan.get(sid, {}).get('type', '')}) hand-authored Remotion scene, speech-locked to narration_words.json; "
                  f"frames {t['start_frame']}-{t['end_frame']} @30fps.",
    })

edit = {
    "version": "1.0",
    "renderer_family": "explainer-data",
    "render_runtime": "remotion",
    "composition_mode": "atelier",
    "bespoke": {
        "entry": "remotion-composer/src/index.tsx",
        "composition_id": "News20261004",
        "art_direction": "Dark editorial finance desk (#0D1117 slate, blue #2563EB primary, green growth / red warning / amber caution accents), "
                         "Be Vietnam Pro, speech-locked reveals fired from narration_words.json, zero-based charts, concept illustrations badged 'Hình minh họa'.",
        "crf": 18,
    },
    "cuts": cuts,
    "audio": {
        "narration": {
            "segments": [
                {"asset_id": f"narration-{t['scene_id']}", "start_seconds": t["start_seconds"],
                 "end_seconds": round(t["start_seconds"] + t["audio_duration"], 3)}
                for t in timing
            ]
        },
        "music": {
            "asset_id": "bgm-main",
            "volume": 0.13,
            "fade_in_seconds": 1.0,
            "fade_out_seconds": 3.0,
            "ducking": False,
        },
    },
    "subtitles": {
        "enabled": True,
        "style": "word-by-word",
        "source": "remotion-composer/public/news-20261004/words.json",
        "font": "Be Vietnam Pro",
        "position": "bottom-center",
        "max_words_per_line": 7,
    },
    "metadata": {
        "fps": 30,
        "width": 1920,
        "height": 1080,
        "total_frames": timing[-1]["end_frame"],
        "total_seconds": timing[-1]["end_seconds"],
        "narration_track": "remotion-composer/public/news-20261004/narration_full.wav",
        "bgm_track": "remotion-composer/public/news-20261004/bgm.mp3",
        "bgm_note": "volume 0.13 constant (already under narration; no dynamic ducking), fade-in 30 frames, fade-out 90 frames, looped if shorter than video",
        "approval_policy": "full_run_authorization",
    },
}
(A / "edit_decisions.json").write_text(json.dumps(edit, ensure_ascii=False, indent=2))

# --- decision log (append-only) ---
dl_path = A / "decision_log.json"
dl = json.loads(dl_path.read_text())
existing = {(d["category"], d["subject"], d["stage"]) for d in dl["decisions"]}
n = len(dl["decisions"])
new = []
subj_rt = "Lựa chọn render runtime kỹ thuật (Remotion vs HyperFrames vs FFmpeg)"
if ("render_runtime_selection", subj_rt, "compose") not in existing:
    n += 1
    new.append({
        "decision_id": f"d-{n:03d}",
        "stage": "compose",
        "category": "render_runtime_selection",
        "subject": subj_rt,
        "options_considered": [
            {"option_id": "remotion", "label": "Remotion (React, component hand-authored, atelier)", "score": 0.97,
             "reason": "Đã khóa ở proposal (d-004); 14 scene bespoke, CountUp/biểu đồ cột zero-based và caption word-level đều cần React + spring."},
            {"option_id": "hyperframes", "label": "HyperFrames (HTML/CSS/GSAP)", "score": 0.6,
             "reason": "Khả dụng nhưng không mang lại lợi thế cho bộ biểu đồ số liệu.",
             "rejected_because": "Đã khóa Remotion từ proposal; không có lý do đổi runtime."},
            {"option_id": "ffmpeg", "label": "FFmpeg concat", "score": 0.2,
             "reason": "Chỉ phù hợp bản dựng đơn giản.",
             "rejected_because": "Không dựng được đồ họa động và đồng bộ speech-locked."},
        ],
        "selected": "remotion",
        "reason": "Khóa trong edit_decisions.render_runtime=remotion, composition_mode=atelier, composition id News20261004 (remotion-composer/src/news-20261004).",
        "user_visible": True, "user_approved": True, "confidence": 0.98,
    })
if not any(d["category"] == "approval_policy" for d in dl["decisions"]):
    n += 1
    new.append({
        "decision_id": f"d-{n:03d}",
        "stage": "compose",
        "category": "approval_policy",
        "subject": "Chính sách phê duyệt (full-run authorization)",
        "options_considered": [
            {"option_id": "full_run_authorization", "label": "Ủy quyền chạy toàn bộ pipeline không dừng ở từng cổng", "score": 0.95,
             "reason": "Người dùng đã cấp ủy quyền toàn diện qua Hermes (ghi nhận từ d-002)."},
            {"option_id": "manual_gates", "label": "Dừng chờ duyệt tại từng cổng (proposal, script, scene_plan, assets, publish)", "score": 0.5,
             "reason": "An toàn hơn nhưng chậm.",
             "rejected_because": "Người dùng đã chọn full-run authorization."},
        ],
        "selected": "full_run_authorization",
        "reason": "Người dùng cấp full-run authorization qua Hermes; các cổng phê duyệt được ghi nhận theo ủy quyền này, không giả lập human_approved.",
        "user_visible": True, "user_approved": True, "confidence": 0.95,
    })
dl["decisions"].extend(new)
txt = json.dumps(dl, ensure_ascii=False, indent=2)
dl_path.write_text(txt)
(A.parent / "decision_log.json").write_text(txt)  # mirror (was byte-identical before)
print("appended", [d["decision_id"] for d in new])
