#!/usr/bin/env python
"""S2E02 — Chuẩn bị input nén cho S1c2 (scene_plan FULL, không phải nửa sau):
task + rules + sample scene keys + full text sections + structure map + image inventory.
Output: projects/thanh-giong/scripts/s1c2_input.json. Chạy từ repo root:
  .venv/bin/python projects/thanh-giong/scripts/make_s1c2_input.py
"""
import json
from pathlib import Path

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong")

script = json.loads((P / "artifacts" / "script.json").read_text())
digest = json.loads((P / "research_digest.json").read_text())

secs = []
for s in script["sections"]:
    secs.append({
        "id": s["id"],
        "text": s["text"],
        "start_seconds": s.get("start_seconds"),
        "end_seconds": s.get("end_seconds"),
        "source_ref": s.get("source_ref", ""),
        "cues": [
            {"desc": c.get("description", "")[:180], "anchor": c.get("keyword_anchor", ""),
             "ts": c.get("timestamp_seconds")}
            for c in s.get("enhancement_cues", []) if isinstance(c, dict)
        ],
    })

inp = {
    "_task": (
        "Viết TOÀN BỘ projects/thanh-giong/artifacts/scene_plan.json: "
        "60–70 scene objects sc001..scNNN (object, đúng keys như sample dưới) phủ 28 sections s01–s28 "
        "theo thứ tự thời gian, 2–3 scenes/section, 8–30 giây/scene. "
        "Viết CHIA NHỎ: Write phần mở (metadata + 15 scenes đầu) rồi Edit/append từng nhóm ~12–15 scenes — "
        "KHÔNG viết cả file trong 1 response. Sau khi xong: update metadata.scene_count + scene_types_breakdown, "
        "rồi chạy validate (lệnh ở _validate)."
    ),
    "_rules": [
        "Mỗi scene object ĐÚNG keys S2E01: {id, type, description, start_seconds, end_seconds, script_section_id, framing, movement, transition_in, transition_out, overlay_notes, shot_language{shot_size,camera_movement,lighting_key,depth_of_field,color_temperature}, shot_intent, narrative_role, information_role, hero_moment, texture_keywords[], required_assets[]}.",
        "type enum dùng: text_card / quote_card / stat_card / image_scene / map_scene / diagram / compare / end_card.",
        "description: 2–4 câu mô tả nội dung + 'Render template intent:' + 'Subject:' + 'Subject motion:' + 'Scene:' (format S2E01).",
        "overlay_notes: 'anchors: «cụm từ» · «cụm từ»' — anchors = CỤM TỪ 2–5 từ lấy NGUYÊN VĂN substring của section text (speech-lock phrase-match); anchor đầu = mốc mở scene; kèm ghi chú timing speech-lock ±0,3s.",
        "start/end_seconds: provisional theo budget section (liên tục, không chồng lấn, tổng khớp 870s).",
        "required_assets: id ảnh trong _images nếu scene dùng focal image (VD 'img-04-nong-com'); [] nếu thuần TSX.",
        "Số liệu trong description/overlay_notes CHỈ từ _whitelist; mọi số khác cấm.",
        "quote_card: description chứa NGUYÊN VĂN câu trích đúng chữ + nguồn 'sách chép'.",
        "Scene chứa câu 'Cả làng nuôi nó lớn.' (s23) = 1 scene riêng, type quote_card, hero_moment true, giữ màn hết câu.",
        "60–70 scenes; 2–3 scenes/section theo độ dài (25s→2, 34s→2–3, 50s→3).",
    ],
    "_validate": (
        ".venv/bin/python projects/thanh-giong/scripts/validate_sp.py "
        "(viết file này trước nếu chưa có: load scene_plan.json + json schema kiểm tra keys/enum/id liên tục/phủ 28 sections — "
        "in VALID hoặc lỗi đầu tiên)"
    ),
    "_sample_scene": {
        "id": "sc001",
        "type": "text_card",
        "description": "MỞ TẬP — HERO TITLE: 'Thánh Gióng: vì sao người cứu nước lại là một đứa trẻ?' mực kem trên nền tối, cụm 'một đứa trẻ' accent amber; ba vật thể neo (trang giấy dó, hạt gạo vàng, mái đền) hiện tuần tự theo ba mệnh đề điểm danh 'Một thanh gươm. Một con ngựa. Một roi sắt.'. Render template intent: hero_title + reveal tuần tự. Subject: tiêu đề + 3 vật thể. Subject motion: title spring-down → từng vật thể fade-in theo mệnh đề. Scene: tối, grain film mỏng. Camera: N/A — Remotion native.",
        "start_seconds": 0.0,
        "end_seconds": 12.0,
        "script_section_id": "s01",
        "framing": "Khối tiêu đề giữa trên, 3 vật thể so le dưới",
        "movement": "Title spring-down → vật thể fade-in theo narration",
        "transition_in": "fade",
        "transition_out": "dissolve",
        "overlay_notes": "anchors: «một roi sắt» · «Thánh Gióng» — hiện đúng lúc đọc. Speech-lock ±0,3s theo ASR narration_words.",
        "shot_language": {"shot_size": "medium_close", "camera_movement": "static", "lighting_key": "low_key", "depth_of_field": "deep", "color_temperature": "warm"},
        "shot_intent": "Gieo nghịch lý đứa trẻ im lặng xin vũ khí ngay giây đầu",
        "narrative_role": "establish_context",
        "information_role": "Khán giả nắm chủ đề + 3 vật thể chứng cứ sẽ theo cả tập",
        "hero_moment": False,
        "texture_keywords": ["myth_amber", "nền tối", "mực kem", "accent vàng đồng", "grain film mỏng"],
        "required_assets": [],
    },
    "_structure": {
        "hook": "s01 (title + device)",
        "setup": "s02–s04 (hội hôm nay → SGK → câu hỏi; callback S1 đền Hùng silhouette s03)",
        "act1_ba_trang_sach": "s05–s09 (lật ngược 1697/1479 → 1492 → 1329; 3 trang cổ thư là 3 focal img-07/08/09)",
        "act2_hat_gao": "s10–s15 (SCENE TRUNG TÂM img-04 nong gạo s10–s11; tráng sĩ img-05; tre img-06; bay về trời img-12 s14)",
        "act3_hai_ngoi_den": "s16–s20 (đền Phù Đổng img-10; đền Sóc img-11; UNESCO s20)",
        "climax": "s21–s23 (S2-C2 quote-card 'Cả làng nuôi nó lớn.' s23)",
        "landing": "s24–s26 (ca dao, hội hôm nay img-13, Tứ bất tử callback S2E01 s25)",
        "cta": "s27–s28 (tease S2E03 + end_card)",
    },
    "_images": (
        ["img-01-giong-tre", "img-02-cu-gia", "img-03-su-gia", "img-04-nong-com",
         "img-05-giong-trang-si", "img-06-tre-dang-nga", "img-07-co-thu-vdult",
         "img-08-co-thu-lncq", "img-09-co-thu-dvsktt", "img-10-den-phu-dong",
         "img-11-den-soc", "img-12-bay-ve-troi", "img-13-hoi-hom-nay",
         "f07-hung-vuong (CHỈ silhouette, đúng 1 scene ở setup)"]
    ),
    "_whitelist": digest["numbers_allowed_on_screen"]["legend"],
    "sections": secs,
}

out = P / "scripts" / "s1c2_input.json"
out.write_text(json.dumps(inp, ensure_ascii=False, indent=1) + "\n")
print(f"s1c2_input.json: {len(secs)} sections, {out.stat().st_size // 1024}KB")
