# S1c2 SCENE_PLAN — thanh-giong (VN-Myth S2E02, fresh session, FULL plan)

Bạn là Scene Director cho S2E02. Repo root: /Users/tuyennguyen/project/OpenMontage. NHIỆM VỤ DUY NHẤT: viết `projects/thanh-giong/artifacts/scene_plan.json` (60–70 scenes phủ 28 sections) + validate PASS. KHÔNG checkpoint (Hermes viết), KHÔNG TTS/ảnh/render.

## STATE (Hermes đã verify 2026-10-17 — KHÔNG re-verify, không đọc artifact khác ngoài input dưới)
- script.json HOÀN TẤT + checkpoint (28 sections, 3.861 từ, audit 0 issues).
- 13 ảnh + f07 silhouette ĐÃ GEN xong (bảng id trong input) — KHÔNG mô tả ảnh mới.
- d-000 full-run authorization (owner dispatch 2026-10-17): không hỏi user.

## INPUT DUY NHẤT (đọc 1 file)
`projects/thanh-giong/scripts/s1c2_input.json` — chứa: _task, _rules, _sample_scene (keys chuẩn), _structure (map khối), _images, _whitelist, full 28 section texts + cues. ĐỌC FILE NÀY THÔI (không đọc script.json/digest — mọi thứ đã nén trong đó).

## VIỆC
1. Read s1c2_input.json (1 lần).
2. Write `artifacts/scene_plan.json` THEO _rules + _sample_scene: version "1.0", style_playbook "ink-genome", scenes[] sc001..scNNN. VIẾT CHIA NHỎ: Write phần mở (header + metadata placeholder + sc001–sc015) rồi Edit append từng nhóm ~12–15 scenes. KHÔNG viết cả file trong 1 response (stream truncation chết session).
3. Sau khi đủ 60–70 scenes: update metadata {scene_count, scene_types_breakdown, speech_lock_note (mẫu: "Mọi scene khóa anchor từ theo ASR narration_words.json ±0,3s — KHÔNG ước lượng số từ; start/end_seconds provisional 870s, snap theo offset từ ASR ở edit")}.
4. Chạy validate: `.venv/bin/python projects/thanh-giong/scripts/validate_sp.py` — INVALID thì sửa rồi chạy lại đến VALID.
5. In tổng kết ≤5 dòng: tổng scenes, breakdown, sections phủ, anchor substring check, VALID.

## RÀNG BUỘC
- Ngân sách 22 turns. Không WebSearch/WebFetch. Không đọc file ảnh. Chỉ ghi trong projects/thanh-giong/.
- Anchors PHẢI là substring NGUYÊN VĂN của section text (validate bắt lỗi này).
- Số liệu chỉ trong _whitelist. Quote nguyên văn đúng chữ + "sách chép".
- Nếu gateway error giữa chừng: để file nguyên, in progress.