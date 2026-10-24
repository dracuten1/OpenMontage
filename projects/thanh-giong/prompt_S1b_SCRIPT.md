# S1b SCRIPT — thanh-giong (VN-Myth S2E02, fresh session)

Bạn là Script Director cho S2E02 series vn-myth (ink-genome). Repo: /Users/tuyennguyen/project/OpenMontage, đứng ở repo root. NHIỆM VỤ DUY NHẤT: viết `projects/thanh-giong/artifacts/script.json` (validate pass) — KHÔNG checkpoint (Hermes viết), KHÔNG scene_plan, KHÔNG TTS/ảnh.

## STATE (Hermes đã verify 2026-10-17 — KHÔNG re-verify, không đọc checkpoint/project khác)
- Proposal HOÀN TẤT: `projects/thanh-giong/artifacts/proposal_packet.json` (VALID, concept c1 "Vật thể làm chứng" — timeline ngược hôm nay → 3 hồi → climax diễn giải).
- `research_digest.json` = SSOT nội dung (sealed) — research ĐÃ XONG, KHÔNG WebSearch/WebFetch.
- d-000 full-run authorization (owner dispatch 2026-10-17): không hỏi user.
- Gate A phát âm ĐÃ PASS (d-004, probe 18 clip): mọi địa danh (Phù Đổng, Võ Giàng, Kiến Sơ, Vệ Linh, Đằng Ngà, Ninh Sóc, Soi Bia, Mộc Dục, cầu húc, Tiên Du, Gia Bình, hai trượng, thiên tướng) GIỮ NGUYÊN VĂN trong provider_text — KHÔNG respell.

## READ WHITELIST (≤6 file, không hơn)
1. `projects/thanh-giong/research_digest.json` — đọc ĐẦU TIÊN, kỹ: target_structure, quotes_verbatim, numbers_allowed_on_screen, narrative_anti_rules, characters_standard_descs.
2. `projects/thanh-giong/tts_lexicon.json` — quy tắc provider_text (số đọc chữ, không '/', không ';', không viết tắt ĐVSKTT/LNCQ/VĐULT).
3. `projects/thanh-giong/scripts/spec_script_format_sample.json` — SHAPE section + delivery_cues (copy shape, KHÔNG copy nội dung).
4. `projects/thanh-giong/artifacts/proposal_packet.json` — chỉ đọc selected_concept + production_plan.stages[script].
5. `projects/thanh-giong/artifacts/research_brief.json` — CHỈ khi cần data_points chi tiết.
6. (chỉ nếu validate lỗi) `schemas/artifacts/script.schema.json`.

## NỘI DUNG (bám digest target_structure — budget đã reconcile ~870s, d-002)
- **~3.650 từ (3.400–3.900) / 28–31 section** id s01..sNN liên tục. Map khối (cho phép ±1 section/khối, giữ tổng 28–31): Hook s01 (25s) · Setup s02–s04 (150s: mở từ mùng 9 tháng Tư hôm nay → lớp SGK khán giả nhớ → câu hỏi mùa) · Hồi 1 "Ba trang sách" s05–s09 (170s: lật NGƯỢC 1697/1479 ĐVSKTT → 1492 LNCQ → 1329 VĐULT) · Hồi 2 "Hạt gạo" s10–s15 (190s, scene trung tâm nong gạo, thiết lập S2-C2) · Hồi 3 "Hai ngôi đền" s16–s20 (140s) · Climax s21–s23 (100s) · Landing s24–s26 (70s) · CTA s27–s28 (25s).
- Mỗi section: text (canonical — trích dẫn hiện ĐÚNG CHỮ), delivery_cues.provider_text (bản TTS), enhancement_cues (visual cues + keyword anchor 2–5 từ nằm ĐÚNG trong text — dùng cho speech-lock), pronunciation_guides, source_ref (A_hook/B_setup/C_act1/D_act2/E_act3/F_climax/G_landing/H_cta).
- **Nguyên văn bắt buộc dùng** (digest quotes_verbatim, giữ ĐÚNG chữ trong `text`, đóng khung "sách chép"): (1) ĐVSKTT "Hơn ba tuổi, ăn uống, to béo, không biết nói cười."; (2) ĐVSKTT "Xin cho một thanh gươm, một con ngựa và một roi sắt, nhà vua không phải lo gì cả!"; (3) ĐVSKTT "Giặc tự quay giáo đánh lẫn nhau." + "Đứa trẻ nhảy ngựa lên không mà đi."; (4) LNCQ "Gia đình cậu tuy giàu có nhưng không đủ gạo cho cậu ăn no, không đủ vải để may áo quần. Xóm làng phải chung góp gạo vải với gia đình để nuôi cậu."; (5) LNCQ "Ta là thiên tướng nhà Trời đây!"; (6) VĐULT "Theo truyện Báo Cực chép trong Việt Điện U Linh Tập, thần vốn là vị thần Thổ địa bên chùa Kiến Sơ, hương Phù Đổng, huyện Tiên Du."; (7) "cao hơn hai trượng".
- **Canon S2-C2 chốt Climax NGUYÊN VĂN Ý** (bắt buộc): "sức mạnh anh hùng = cả làng nuôi lớn" — câu chốt phải chứa "cả làng nuôi" + trước đó phải có "không đủ gạo" (nguyên văn LNCQ) ở Hồi 2. Climax giữ đóng khung diễn giải ("có thể đọc là…", "truyện không nói trắng").
- **Anti-rules (luật cứng — digest narrative_anti_rules)**: "giặc Ân" luôn đóng khung "truyện kể"; không khẳng định nhân vật có thật; lễ hội/đền/UNESCO KHÔNG chứng minh trận đánh (chỉ nói về người thờ + điều họ chọn ghi nhớ); roi sắt/ngựa sắt CHỈ là câu hỏi đóng khung về thế giới NGƯỜI CHÉP (TK XIV–XV), không gán niên đại hai chiều; Gióng KHÔNG chết ("cởi áo bào để lại, cưỡi ngựa bay lên Trời"); "7 nong cơm / 3 chum cà / 3 vò rượu" KHÔNG dùng (thay bằng nguyên văn LNCQ xóm làng góp gạo); không DNA; không lặp luận điểm S2-C1.
- **Whitelist số** (display): CHỈ số trong digest numbers_allowed_on_screen.legend. "350 năm" KHÔNG lên màn hình (nói "ba trăm năm mươi năm" bằng chữ trong provider, KHÔNG display). Provider_text đọc mọi số bằng chữ ("một nghìn ba trăm hai mươi chín", "ngày mười sáu tháng mười một năm hai nghìn không trăm mười").
- Callback S1: ĐÚNG 1 lần thoáng (đền Hùng HOẶC trống đồng — silhouette, setup). Callback S2E01: ĐÚNG 1 lần nhẹ (Tứ bất tử nhắc Tản Viên, Phù Đổng thứ hai — landing).
- No visual-only text: mọi element chữ trong enhancement_cues phải có câu narration đọc lên trong cùng section.
- CTA tease S2E03 đúng hook digest: "Người được thờ tiếp theo còn nghèo hơn — nghèo đến mức không có nổi một chiếc khố." (không spoil tên Chử Đồng Tử).
- Giọng: ấm, tôn trọng, tò mò; câu ngắn đọc đều; mở từ thứ khán giả GẶP HÔM NAY (trống hội làng, mâm cỗ, hạt gạo, đền) đi ngược vào thần thoại.

## SAU KHI VIẾT — VALIDATE (bắt buộc)
`.venv/bin/python -c "import json,sys; sys.path.insert(0,'.'); from schemas.artifacts import validate_artifact; d=json.load(open('projects/thanh-giong/artifacts/script.json')); validate_artifact('script', d); print('VALID')"`
(lệnh -c nếu bị chặn: viết projects/thanh-giong/scripts/_validate_script.py rồi chạy). Validate lỗi → đọc lỗi, sửa field, validate lại.

## RÀNG BUỘC
- Chỉ ghi trong projects/thanh-giong/. Không WebSearch/WebFetch. Không sửa repo code/project khác. Không TTS/ảnh.
- Ngân sách 30 turns: viết script.json TRỰC TIẾP một lần Write (chia 2 lần nếu quá dài: Write nửa đầu + Edit thêm sections — không draft rải rác).

## EXIT CHECKLIST (in tổng kết)
1. script.json VALID — N sections, tổng từ, tổng giây ước lượng
2. Xác nhận: S2-C2 nguyên văn ý ở Climax (chứa "cả làng nuôi")? nguyên văn LNCQ "không đủ gạo...xóm làng" ở Hồi 2? mọi số display trong whitelist? provider_text đã áp lexicon (số chữ, không '/', không ';', không viết tắt)? 9 quotes verbatim đã dùng mục nào?
3. Blocker (nếu có).
