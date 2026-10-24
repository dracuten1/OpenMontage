# PROPOSAL — VN-Myth S2E04: Liễu Hạnh (lieu-hanh)

## Ghi chú QC cập nhật 2026-10-20

SCRIPT_REVIEW.md là bản timing section mới nhất: 32 section, 3848 đơn vị whitespace; 960 giây chỉ là dự kiến, không phải audio đã đo. Bảng 9 khối bên dưới là outline, không dùng để khóa production. Runtime Remotion trong JSON là candidate bắt buộc bởi schema, KHÔNG đã duyệt/locked. Tình trạng runtime thay thế chưa probe lại lượt này; không cam kết HyperFrames available từ lịch sử mùa.

BGM mới kiểm local catalog provenance, KHÔNG chạy listening QC cho tập này; catalog ghi listening review pending. Credit đề xuất: "Mesmerize" Kevin MacLeod (incompetech.com). Licensed under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ . Source: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500005 . Không coi các ghi chú đã QC mùa trước bên dưới là QC mới của S2E04.

## 1. Trạng thái

**PENDING — chờ owner duyệt Gate B.** Scoped authorization d-000 (giống S2E03): dừng ở awaiting_human, KHÔNG TTS/ảnh/render. Research sealed v1 đã import (14/14 sha256 khớp manifest, QA pass_with_declared_limits); checkpoint research = completed. Cần owner duyệt: research + proposal này + script draft (SCRIPT_REVIEW.md kèm theo). Sau duyệt: demo 1 cảnh → TTS probe Gate A (địa danh) → batch → draft HUD 720p → final sau APPROVE.

## 2. Câu hỏi trung tâm + hook

**Vì sao một người phụ nữ được đứng trong hàng Tứ bất tử?** (roadmap §3)

Hook: *"Một người phụ nữ trở lại trần gian — vì sao người đời tiếp tục gọi bà là Mẫu?"*
— đúng hook roadmap §3; mở từ tháng Ba hôm nay (hội Phủ Dầy 3/3, C12) rồi đi ngược vào bản kể; callback nhẹ E01–E03 (Sơn Tinh – Gióng – Chử Đồng Tử) tại nhịp Tứ bất tử (C08 — danh sách phổ biến đương đại, không nói "cố định từ ngàn xưa").

## 3. Ba concept (đều từ research_brief angles, grounded claims)

**c1 — "Người con gái trở về"** (story, trục vật thể → đền → danh xưng) — KHUYẾN NGHỊ
Mở từ HÔM NAY (hội Phủ Dầy, C12) → đi ngược: chén ngọc sứt góc (C02) → mất 3/3 tuổi 21 (C03) → trở về: đối đáp Trạng Bùng (C04) → phố Cát: trừng trị + bị «tiễu» → dân cầu khấn → phong vương (C05, tông phẩm giá) → lớp đền thờ: Nam Giao (C07) → vì sao gọi là Mẫu: hai chiều dân + triều đình (C15) → UNESCO 2016 ghi danh thực hành (C10). Ba lớp kể TÁCH BẠCH xuyên suốt bằng 3 tuyến màu.
Mạnh: trả lời thẳng câu hỏi trung tâm; visual đúng mùa S2 (vật thể + đền, không DNA); hoàn tất cụm Tứ bất tử. Yếu: cần kỷ luật để ba lớp không bị dồn về cuối — giải pháp: mỗi hồi kể xong có ngay nhịp kiểm chứng ngắn.

**c2 — "Ba lớp sự thật: bản kể, đền thờ, di sản"** (data_narrative, evidence-stratigraphy)
Ba lớp tài liệu chồng nhau trên giấy dó — mỗi hồi "bóc" một lớp (C01/C06 dị bản → C07 đền → C10/C11 di sản → C13/C14 diễn giải).
Mạnh: rèn đúng kỹ năng kiểm chứng chất series; đây là trục BẮT BUỘC của tập. Yếu: cả tập thành bài học phương pháp luận — mất sweep huyền sử của nhân vật; phù hợp làm NHỊP bên trong c1 hơn là trục chính.

**c3 — "Tháng Ba giỗ Mẹ"** (journey, practice-first)
Mở từ hội Phủ Dầy hôm nay (C12) đi ngược: UNESCO 2016 (C10) → đền Nam Giao (C07) → bản kể 3/3 (C03) → chén ngọc (C02).
Mạnh: đúng ràng buộc "mở từ thứ khán giả còn gặp hôm nay" của bible. Yếu: rủi ro cao nhất về "cảnh huyền bí câu view"; mạch nhân vật bị nén. GHI CHÚ: hook gốc của góc này trong research ("Hàng triệu người…") KHÔNG dùng — con số ngoài whitelist.

## 4. Khuyến nghị: c1

c1 giữ mạch kể nhân vật (câu trả lời "vì sao được thờ") + gắn c2 làm khung kiểm chứng 3 lớp xuyên suốt (trục bắt buộc của tập) + mở/đóng vòng kết cấu theo c3 (hội Phủ Dầy hôm nay) — cả ba góc nghiên cứu đều sống trong c1. Climax đọc canon đề xuất S2-C4, đóng khung "có thể đọc là", KHÔNG kết luận độc quyền.

## 5. Cấu trúc 9 khối — đề xuất timing (tổng 960s / ~32 sections / ~3700 từ)

| Khối | Nội dung | Timing |
|---|---|---|
| Hook | Tháng Ba hôm nay: hội Phủ Dầy (C12) + callback Tứ bất tử E01–E03 (C08) + câu hỏi trung tâm | 0:00–0:50 (~50s) |
| Setup | Khung đọc bắt buộc: ba lớp bản kể ≠ đền thờ ≠ ghi danh; bản Phan Kế Bính mở ở Vân Cát, Yên Thái, cha Lê Thái công "hay làm phúc" (C01) | 0:50–2:20 (~90s) |
| Hồi 1 — Chén ngọc | Vỡ chén ngọc, biển "Sắc-giáng", đày xuống trần (C02); đời sống Vân Cát; mất 3/3 vô bệnh, 21 tuổi (C03) | 2:20–4:30 (~130s) |
| Hồi 2 — Trở về | Tiên chúa trở lại; đối đáp chữ/thơ với Phùng Khắc Khoan ở Lạng Sơn rồi biến mất (C04); nhịp teal: mỗi bản gọi khác — tên gọi/village dị bản (C06) | 4:30–6:20 (~110s) |
| Hồi 3 — Phố Cát | Hiển thánh đèo Ngang–phố Cát: trừng trị kẻ đùa bỡn (ngôn từ bản kể, phẩm giá) → triều đình đem quân "tiễu" → dân dịch tễ cầu khấn → phong Mã-vàng công chúa → Chế-thắng; đền Sùng Sơn "đến giờ vẫn còn" (C05); nhịp teal: đền thờ = dấu hiệu thực hành | 6:20–9:00 (~160s) |
| Hồi 4 — Lớp đền thờ | Vũ trung tùy bút: đền "bà công chúa Liễu Hạnh" ở nền Nam Giao, dân + đồng cốt lập từ khi nhà Lê mất (C07); hội Phủ Dầy 3/3 + 3 nghi thức (C12) | 9:00–11:10 (~130s) |
| Climax — Vì sao là Mẫu | Nghiên cứu 2010: đạo Mẫu từ Nữ thần bản địa + Đạo giáo, Liễu Hạnh là một thần chủ — không đánh đồng mọi nữ thần (C13); dân tôn "Mẫu nghi thiên hạ" + triều đình tôn phong thượng đẳng thần = HAI CHIỀU (C15); UNESCO 1/12/2016 ghi danh THỰC HÀNH, phiên 11, hồ sơ 14 tỉnh (C10/C11); S2-C4 đóng khung | 11:10–13:30 (~140s) |
| Landing | Trở về tháng Ba hôm nay; cẩn thận với mốc: 1557/1577 chỉ "theo cách kể/bách khoa" (C09), lớp văn bản 1781 (C14); Tứ bất tử — danh sách đương đại (C08) | 13:30–15:10 (~100s) |
| CTA | Tease S2E05 Hai Bà Trưng (không spoil); mời xem lại cụm Tứ bất tử | 15:10–16:00 (~50s) |

Duration: mục tiêu biên tập 15–17' (960s, range 900–1020 đo lại bằng audio thật); bible cho 12–20' — KHÔNG kéo filler.

## 6. Các quyết định chờ owner duyệt

1. **Concept**: khuyến nghị c1 (c2/c3 ở §3).
2. **S2-C4 (đề xuất canon, KHÔNG tự sửa bible)**: "Danh xưng «Mẫu» đến từ hai chiều — dân thờ trước, triều đình chính danh sau — và UNESCO 2016 ghi danh thực hành thờ Mẫu Tam phủ, không chứng thực truyền thuyết nhân vật; ba lớp bản kể/đền thờ/ghi danh là ba câu chuyện khác nhau, phải kể tách bạch." Đóng khung "có thể đọc là".
3. **Runtime**: Remotion (KHUYẾN NGHỊ — continuation S2E01–S2E03) vs HyperFrames (available; runtime mới, phải viết lại theme + QC).
4. **Duration**: 15–17' / 960s target.
5. **BGM**: reuse "Mesmerize" — Kevin MacLeod (CC BY 4.0), provenance đã kiểm + credit (đã dùng S2E01–S2E03); hoặc chọn track mới từ media-library (phải listening QC lại). KHÔNG kế thừa track chưa kiểm.
6. **Demo gate**: 1 cảnh duyệt trước batch ảnh/TTS.

## 7. Anti-rules (tóm tắt luật cứng)

- BA LỚP TÁCH BẠCH: bản kể ≠ đền thờ (thực hành) ≠ ghi danh di sản — không trộn thành một "sự thật"; lớp diễn giải nghiên cứu (C13–C15) luôn gắn nhãn "một cách hiểu của nghiên cứu".
- Tứ bất tử = danh sách phổ biến ĐƯƠNG ĐẠI (C08) — callback E01–E03 nhưng không nói "cố định từ ngàn xưa".
- Mốc 1557/1577 (C09) chỉ kèm khung "theo cách kể/bách khoa"; UNESCO (C10) = ghi danh THỰC HÀNH, không chứng thực nhân vật.
- Phố Cát (C05): ngôn từ bản kể, tông phẩm giá, zero nhục cảm/khoái khí; không "mê tín"; không cảnh huyền bí câu view; tắm/hiện hình không trực diện.
- Nữ thần ≠ đều là Liễu Hạnh (misconception #1); hệ Mẫu nhiều vị, Liễu Hạnh là một thần chủ (C13).
- Tên dị bản KHÔNG hợp nhất: An Thái vs Yên Thái; Giáng Tiên vs Quỳnh Hoa — kể "mỗi bản gọi khác".
- Số trên màn hình CHỈ trong whitelist raw_data.json (1557 · 3/3 · 21 tuổi · 40 tuổi · 07/09/1557+21/03/1577 kèm khung · 1781 · 1/12/2016 · lần 11 · 14 tỉnh · 3 nghi thức); thiếu → needs_input, không bịa.
- "Hàng triệu người về Phủ Dầy" (hook gốc góc c3 trong research) KHÔNG dùng — con số ngoài whitelist.
- 7 nguồn ≠ 7 chứng cứ lịch sử độc lập (3 văn bản wikisource + 3 bách khoa + 1 nghiên cứu); Q01–Q03 là câu hỏi biên tập editor-derived, không phải khảo sát.
- Mọi trích dẫn khớp nguyên văn claim_ledger.json + hiện nguồn; không thêm nguồn mới sau seal.

## 8. Claim IDs dùng trong c1

| Nhóm | Claims | Dùng ở đâu |
|---|---|---|
| Bản kể Phan Kế Bính (amber) | C01 Vân Cát/Yên Thái, Lê Thái công · C02 vỡ chén ngọc, Sắc-giáng · C03 mất 3/3 tuổi 21 · C04 Phùng Khắc Khoan · C05 phố Cát → phong vương → đền Sùng Sơn | Setup, Hồi 1–3 |
| Dị bản (teal) | C06 bản dân gian: "năm Thiêu Hựu (1557)", An Thái, "xuống trần lần thứ hai" | Hồi 2 — mỗi bản gọi khác |
| Thực hành/đền thờ (teal) | C07 đền Nam Giao (Vũ trung tùy bút) · C12 hội Phủ Dầy 3/3 + 3 nghi thức | Hook, Hồi 4 |
| Ghi danh di sản (nâu) | C10 UNESCO 1/12/2016 phiên 11 · C11 hồ sơ 14 tỉnh | Climax, Landing |
| Danh mục đương đại | C08 Tứ bất tử (Sơn Tinh – Chử Đồng Tử – Thánh Gióng – Liễu Hạnh) | Hook + Climax |
| Mốc cẩn thận | C09 1557/1577 kèm khung "theo cách kể/bách khoa" | Landing |
| Diễn giải nghiên cứu | C13 đạo Mẫu từ Nữ thần bản địa + Đạo giáo · C14 văn bản 1781, hai lần giáng sinh · C15 "Mẫu nghi thiên hạ" + thượng đẳng thần | Climax, Landing |
| Câu hỏi khán giả | Q01 vì sao được thờ · Q02 con gái Ngọc Hoàng hay người thật · Q03 truyền thuyết vs thờ Mẫu | Hook (Q01), Hồi 1 (Q02), Climax (Q03) — gắn nhãn "câu hỏi biên tập" |

---
*Artifact: artifacts/proposal_packet.json (schema-valid, approval=pending) · checkpoint_proposal.json=awaiting_human · decision_log d-000…d-003. Lexicon TTS kế thừa chuỗi S2E03, Gate A probe địa danh SAU khi duyệt.*
