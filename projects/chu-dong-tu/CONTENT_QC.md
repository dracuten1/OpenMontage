# CONTENT_QC — Chử Đồng Tử (VN-Myth S2E03 · chu-dong-tu)

> Đối chiếu nội dung `drafts/script_draft.json` (32 sections, DỰ THẢO) với `research/v1/claim_ledger.json` + `raw_data.json` (numeric_whitelist) + `research_notes.md` §6. Lead sẽ kiểm lại độc lập. Ngày QC: 2026-10-19.

## 1. Bảng số hiển thị / đọc trong narration

| Số/datum | Section | Claim | Scope ghi trong kịch bản | Scope raw_data | Kết luận |
|---|---|---|---|---|---|
| 1492 | s20 | C11 | "chú thích bản dịch quy đổi… mốc của lời tựa… theo chú thích bản dịch… mốc văn bản, không phải tuổi của truyện" | "Lời tựa Vũ Quỳnh, theo chú thích bản dịch; không phải ngày sinh truyện/nhân vật" | **OK** |
| 1493 | s20 | C12 | "lời bạt của Kiều Phú… chú thích quy đổi 1493… mốc của lời tựa và lời bạt" | "Lời bạt Kiều Phú, theo chú thích bản dịch; không phải năm sinh truyện" | **OK** |
| 10–12 tháng Hai AL | s24 | C07 | "Theo lịch được cổng du lịch Hưng Yên đăng, hội mở vào khoảng 10–12 tháng Hai âm lịch" + overlay nhãn "lịch được đăng, không phải lịch năm nay" | "Khoảng hội theo cổng du lịch; lịch chi tiết sự kiện cũ không phải lịch năm 2026" | **OK** |
| 11/2 (ngày mười một tháng Hai) | s01, s24 | C08 | s01 "Theo lịch được cổng du lịch đăng, cứ đến ngày mười một tháng Hai"; s24 "Trong lịch được đăng ấy có ghi: sáng ngày 11/2" | "Nếu nêu ngày 11, phải nói theo lịch đăng trong nguồn" (C08) | **OK** |
| 9h sáng ("từ chín giờ sáng") | s01 | C08 | nằm trong cụm đã đóng khung "Theo lịch được cổng du lịch đăng" | có trong quote C08 ("sáng 9h đến 10h30′") nhưng **không có entry riêng trong numeric_whitelist** | **CẦN SỬA (tùy chọn)** — giữ (cùng claim, đã đóng khung) hoặc lược; owner quyết |
| 02/02/2023 | s22 | C09 | "theo Quyết định 153/QĐ-BVHTTDL ngày 02/02/2023" + "tôi dẫn theo bài công bố — tôi chưa đọc bản quyết định gốc" | "Ngày/số quyết định… được bài tin dẫn; chưa có bản quyết định gốc" | **OK** |
| 153/QĐ-BVHTTDL | s22 | C09 | như trên; provider_text spelled-out ("một trăm năm mươi ba, ký hiệu Q Đ, B V H T T D L") | như trên | **OK** |
| "bài tin năm 2023" | s22 | C09/C10 | "Một bài tin năm 2023 tường thuật…" — không đọc ngày 01/03/2023 thành lời | whitelist có "01/03/2023" (không dùng) — không sai phạm vi | **OK** |
| 9 làng (chín làng) | s22, s23, s24 (+ animation s01, s24) | C10 (s22/s23); C08 (s24 rước nước "9 làng tham dự") | s22 "chín làng trong Tổng Mễ xưa — địa danh theo thời điểm bài viết"; s24 gắn "trong lịch được đăng ấy có ghi" | C10 "quy mô hàng tổng được bài năm 2023 tường thuật; địa danh theo thời điểm bài" | **OK** |
| 3 năm một lần (ba năm một lần) | s22, s23 | C10 | "quy mô hàng tổng, ba năm một lần" (s22); lặp lại s23 trong cùng khung đã đính chính | như trên | **OK** |
| Hồng Đức 23 / 24 | s20 | C11/C12 | "lời tựa của Vũ Quỳnh đề năm Hồng Đức hai mươi ba… lời bạt… hai mươi bốn" | nằm trong quote C11/C12 nguyên văn | **OK** |
| "cả trăm năm" | s07 | — (biên tập) | "Cô giáo và trò nhỏ đã trả lời câu hỏi này cả trăm năm" — diễn đạt khái quát, không phải số liệu kiểm chứng | không có trong whitelist | **CẦN SỬA (tùy chọn)** — chuyển "đã bao đời nay" nếu muốn zero con số ngoài whitelist |
| "Tứ bất tử… kể ba", "bốn vị" | s28 | series bible | tease series, không phải datum nghiên cứu | ngoài phạm vi numeric_whitelist (không phải số liệu nguồn) | **OK** |
| "lớp ba" (bài tập đọc) | s07 | Q02 | "sách bài tập đọc lớp ba" — mô tả xuất xứ câu hỏi (trang VnDoc là tập đọc lớp 3) | khớp nguồn Q02 (VnDoc "Tập đọc lớp 3") | **OK** |

## 2. Bảng quote (chuỗi ngoặc kép >6 từ trong script)

| Section | Chuỗi trích | Claim | Đúng chữ (vs ledger)? | Frame đúng? | Kết luận |
|---|---|---|---|---|---|
| s03 | "Cha từ, con hiếu… thay nhau mà mặc." | C01 | khớp nguyên văn (substring) | "Bản kể chép lại gia cảnh ấy" (truyện kể/sách chép) | **OK** |
| s03 | "Cha chết cứ để trần mà chôn, giữ khố lại cho con, để khỏi xấu hổ." | C01 | khớp nguyên văn | "ông dặn con" (truyện kể) | **OK** |
| s07 | "Vì sao công chúa Tiên Dung kết duyên cùng Chử Đồng Tử?" | Q02 | khớp nguyên văn | "in sẵn trong sách bài tập đọc lớp ba" (bài tập đọc) | **OK** |
| s09 | "Tiên Dung nghe sợ không dám về, bèn cùng Đồng Tử mở chợ búa, lập phố xá, cùng dân buôn bán." | C02 | khớp nguyên văn (cắt tại ranh giới câu) | "truyện rẽ sang đời sống, chép bằng những chữ rất tỉnh" | **OK** |
| s10 | "dần dần trở thành phố chợ lớn (nay là chợ Thám). Thương nhân nước ngoài… làm chủ." | C02 | khớp nguyên văn | nối tiếp quote s09, cùng khung bản kể | **OK** |
| s12 | "Đồng Tử bèn cùng lái buôn đi buôn bán. Đến núi Quỳnh Vi… lấy uống nước." | C03 | khớp nguyên văn | "Bản kể chép tiếp" | **OK** |
| s13 | "trong am có sư tên gọi Phu Quang truyền phép cho Đồng Tử, Đồng Tử ở lại học phép." | C03 | khớp nguyên văn | "bản kể giới thiệu rất gọn" | **OK** |
| s14 | "Sư bèn tặng… 'Linh thiêng ở những vật này đây'. Đồng Tử trở về, giảng đạo lại cho Tiên Dung." | C03 | khớp nguyên văn | "bản kể chép… tôi muốn đọc nguyên văn" | **OK** |
| s15 | "Phật-Quang tặng cho một cái gậy, một cái nón." | C05 | khớp nguyên văn (cắt tại "một cái nón.") | "Bản chép của Phan Kế Bính" | **OK** |
| s15 | "có tiểu tăng tên là Ngưỡng Quang truyền phép cho Đồng Tử" | C06 | khớp nguyên văn | "bài trên website bảo tàng dẫn" | **OK** |
| s17 | "Quan quân tới, đóng trại ở bãi Tự Nhiên… không kịp tiến quân." | C04 | khớp nguyên văn | "Sách chép:" | **OK** |
| s18 | "Nửa đêm, bỗng nhiên gió lớn nổi lên… sụt xuống thành cái đầm lớn." | C04 | khớp nguyên văn (substring) | "Bản kể tiếp:" | **OK** |
| s19 | "Ngày hôm sau, dân chúng không thấy thành quách đâu cả… nghĩa là đầm một đêm)." | C04 | khớp nguyên văn (substring) | "bản kể chép:" | **OK** |
| s22 | "Lễ hội đền Đa Hòa" (5 từ — kèm theo) | C09 | đúng tên theo bài 2023 | "bài tin năm 2023 tường thuật lễ công bố ghi danh" | **OK** |
| s24 | "Nhân dân làm gì để tưởng nhớ ông?" | Q03 | khớp nguyên văn | "câu hỏi bài tập đọc năm ấy" + nhãn overlay "bài tập đọc (VnDoc)" | **OK** |
| s26 | "giúp dân làm nhiều việc lợi ích như dạy cách trồng lúa, nuôi tằm, dệt vải" | C13 | khớp nguyên văn (substring) | "Trang bài tập đọc ghi thêm" + nhãn "lớp kể giáo dục" | **OK** |

**Quote ngoài ledger:** không có — mọi chuỗi >6 từ đều truy được về C01–C13/Q02/Q03. Chi tiết kể tự do (s05–s06 cảnh gặp gỡ, s11 đoạn sông) đều KHÔNG đóng ngoặc nguyên văn, kể lại trong khung "truyện kể" → đúng phương pháp. Q01 có trong ledger nhưng không trích (không sai phạm vi).

## 3. Checklist anti-rules

| # | Luật | Kết luận | Section liên quan |
|---|---|---|---|
| 1 | Không xác nhận nhân vật lịch sử | **OK** — "Tôi sẽ không khẳng định…" (s04); "Ta không biết. Cũng không cần biết" (s27) | s04, s21, s23, s27 |
| 2 | Không khai sinh thương mại/Phật giáo/nghề nông | **OK** — "suy từ đó ra một danh xưng lớn hơn thì là chuyện khác" (s10); "không lớp nào là lịch sử kỹ thuật" (s26); C06 chỉ dùng đối chiếu tên, không tiếp nhận luận điểm Phật giáo thời Hùng | s10, s15, s26 |
| 3 | Hóa đầm ≠ địa chất | **OK** — "không phải báo cáo về một biến cố địa chất; đó là tên dân gian gắn cho mặt nước" | s18–s19 |
| 4 | Không UNESCO (chỉ "Lễ hội đền Đa Hòa" theo bài 2023) | **OK** — "đây không phải ghi danh UNESCO" + overlay đính chính | s22 |
| 5 | Lịch 2018 ≠ 2026, phải nói "theo lịch được đăng" | **OK** — khung "theo lịch được đăng/đăng" xuất hiện cả narration lẫn overlay ("lịch được đăng, không phải lịch năm nay") | s01, s24 |
| 6 | Địa danh theo năm bài viết | **OK** — "địa danh theo thời điểm bài viết" + nhãn overlay "địa danh theo năm bài viết" | s22 |
| 7 | 6 URL ≠ 6 chứng cứ độc lập | **OK** — "sáu trang web không đồng nghĩa sáu chứng cứ độc lập… có thể chung một nguồn cũ" | s16 |
| 8 | Q01–Q03 là bài tập đọc (không phải survey) | **OK** — "sách bài tập đọc lớp ba" (s07); nhãn "bài tập đọc (VnDoc)" (s24); "Cô giáo và trò nhỏ… trả lời" khôngclaimed là số liệu phổ biến | s07, s24 |
| 9 | Tên sư không hợp nhất; tổng hợp = "một vị sư" | **OK** — kể tổng hợp: "một vị sư" (s13, s16); trích dẫn: đúng tên từng bản Phu Quang/Phật-Quang/Ngưỡng Quang (s13, s15) | s13, s15, s16 |
| 10 | 1492/1493 ≠ tuổi truyện | **OK** — "đó là mốc văn bản, không phải tuổi của truyện" | s20 |
| 11 | PDF = bản dịch hiện đại (không phải thủ bản XV) | **OK** — "Ta vừa đọc theo một bản dịch hiện đại — không phải ảnh chụp thủ bản cổ" | s20 |
| 12 | Bình giải ≠ nguyên văn truyện | **OK** — "phần bình của người dịch hiện đại thì là lời bình hôm nay — không nằm trong truyện" | s20 |
| 13 | Cảnh tắm chỉ qua lau/màn/cát/nước, giữ phẩm giá | **OK** — s05 "Chỉ có màn, cát, nước"; s06 kể qua "vùi mình vào cát, nấp sau bụi lau" + phản ứng (không thoại, không tả thân thể); visual "chỉ dáng bóng" | s05–s07 |
| 14 | S2-C3 đóng khung "có thể đọc là", không nói trắng | **OK** — "Xâu lại, có thể đọc là… Tôi nói là 'có thể đọc' — vì đây là cách đọc biên tập, một đề xuất còn chờ duyệt" + overlay "cách đọc biên tập — còn chờ duyệt" | s21 |
| 15 | No visual-only text (mỗi cue chữ có narration) | **OK** — mọi overlay đồng bộ narration; ngoại lệ duy nhất s30 (card nguồn liệt kê tĩnh) có narration câu tóm tương ứng ("Tất cả những gì tôi kể tối nay đều có nguồn…") — card là phụ đề tự đọc, không mang thông tin mới | toàn bộ; s30 |
| 16 | provider_text: số đọc chữ | **OK** — "một nghìn bốn trăm chín mươi hai/ba" (s20); "hai nghìn lẻ hai mươi ba", "một trăm năm mươi ba, ký hiệu Q Đ, B V H T T D L, ngày mùng hai tháng hai" (s22); "mười đến mười hai", "mười một" (s24) | s20, s22, s24 |
| 17 | Không '/', không ';' 3 vế, không viết tắt tên sách (provider) | **OK** — provider_text không chứa '/' (số quyết định spelled; "10–12" đọc "mười đến mười hai"; "11/2" đọc "mười một tháng Hai"); không cấu trúc ';' 3 vế; "Lĩnh Nam chích quái" mở đủ tên (s15) | s15, s20, s22, s24 |
| 18 | Không vẽ bản đồ chốt núi Quỳnh Vi/Quỳnh Viên như địa điểm đã xác minh | **OK** — visual s12/s15 là trang giấy đối chiếu tên (ba tông màu), không phải bản đồ định vị lịch sử | s12, s15 |

## 4. needs_input

Metadata script: `needs_input: []`. Đối chiếu: không có chỗ nào trong kịch bản đòi dữ liệu ngoài gói research v1 — mọi số/trích đều truy về ledger/whitelist. Hai điểm dưới đây là **tùy chọn biên tập cho owner** (không phải thiếu dữ liệu):
1. s01 "từ chín giờ sáng" — chi tiết giờ có trong quote C08 nhưng chưa có entry whitelist riêng → giữ hoặc lược.
2. s07 "cả trăm năm" — diễn đạt khái quát của biên tập → giữ hoặc chuyển "đã bao đời nay".

## 5. Kết luận tổng

**PASS_WITH_NOTES** — toàn bộ 16 chuỗi trích khớp nguyên văn claim_ledger với frame đúng lớp kể; mọi số thuộc whitelist trừ 2 điểm tùy chọn (s01 "chín giờ sáng" cùng claim C08 đã đóng khung; s07 "cả trăm năm" biên tập khái quát); 18/18 anti-rules đạt; không có needs_input ngoài gói.
