"""Ghi checkpoint edit + compose + decision_log cho batch toàn tập S2E03 (Gate C pass-to-render)."""
import json
from datetime import datetime, timezone
from pathlib import Path

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu")
now = datetime.now(timezone.utc).isoformat(timespec="seconds") + "Z"
STAMP = now

def add_ck(name, payload):
    p = P / f"checkpoint_{name}.json"
    old = json.loads(p.read_text()) if p.exists() else None
    entry = {"id": f"ck_{name}_{STAMP}", "ts": STAMP, **payload}
    if old:
        old.setdefault("history", []).append(entry)
        obj = {"current": entry, "history": old["history"] + [old.get("current", old)]}
    else:
        obj = {"current": entry, "history": []}
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=1))
    print("checkpoint", name, "→", entry["id"])

add_ck("edit", {
    "stage": "edit",
    "scope": "audio alignment 63/63 scenes + phrase-lock",
    "sections": 32, "scenes": 63,
    "narration_full_seconds": 867.24, "total_words": 3571,
    "dp_min": 0.85, "zero_overlap": 0, "long_gap_max": 0,
    "outputs": [
        "assets/audio/narration_full.wav",
        "assets/audio/transcripts/narration_words.json",
        "qc/audio_alignment_report.json",
    ],
    "audit": "anchor_audit_strict.json: 203/203 PASS, 0 overflow, 0 bad fraction",
})

add_ck("compose", {
    "stage": "compose",
    "scope": "63 scenes TSX scaffold-first (CC 4 nhóm), speech-window strict, HUD draft",
    "tsc_noemit": "exit 0",
    "scenes_files": ["scenes-a..f.tsx", "63 scene components, Root.tsx ChuDongTuDraft"],
    "retention_cuts": [
        {"boundary": "sc005→sc006", "note": "câu '...chiếc khố vải duy nhất, cha con thay nhau mà mặc' chia giữa 2 scene; 0.58s đuôi câu nằm ở sc006 — element kế speech-locked, không mất chữ"},
        {"boundary": "sc026→sc027", "note": "câu giới thiệu sư Phu Quang kéo dài 2.27s qua boundary; sc027 mở bằng đúng đoạn đó — speech-locked, không mất chữ"},
    ],
    "images_used": 13, "images_missing": 0,
    "bgm": "Mesmerize (approved) 870s loudnorm -24LUFS, credit trong exports/metadata/youtube.json",
    "hud": "draft-hud.tsx overlay: S{scene} f{frame} {s}s [{in}/{total}]",
})

dl = json.loads((P / "decision_log.json").read_text())
dl["decisions"].append({
    "id": "batch_full_production", "ts": STAMP,
    "context": "Sau demo s03 approved — batch toàn tập 32 section",
    "decisions": [
        "TTS: engine/style/lexicon giữ nguyên bản demo (18/18 probe pass); s08 DP 89% = floor thấp nhất được duyệt, không re-gen",
        "Ảnh: 13 plates (12 batch + demo_s03_kho.jpg reuse); KHÔNG DNA theo BRIEF; mô-tả vật-thể theo S2-BIBLE §4",
        "Anchor fix vòng 1-3: 25 A() phrase đổi sang occurrences in-window; 1 tham chiếu ảnh .png→.jpg (demo_s03_kho)",
        "2 retention cuts (sc005/sc026) chấp nhận + khai báo: câu chia giữa 2 scene, element kế speech-locked — không mất chữ, không overflow",
        "scene_timing public export format dict {fps, scenes} cho scene_sweep",
        "Draft HUD render 720p (--scale 0.6667) crf 26 nếu >50MB",
    ],
})
(P / "decision_log.json").write_text(json.dumps(dl, ensure_ascii=False, indent=1))
print("decision_log updated:", len(dl["decisions"]), "entries")
