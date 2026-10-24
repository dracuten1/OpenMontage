# VietJet WFO 251,6 triệu USD — scene_index (timing THẬT từ scene_timing.json, tổng 162,67s / 4880 frames @30fps)

| Scene | Section | Start–End (s) | Nội dung | Elements chính |
|---|---|---|---|---|
| s01 | S1 Hook (đã duyệt nguyên văn) | 0,0–5,9 | Hook: nợ 7 triệu USD COVID → tòa Anh đóng băng 251 triệu | badge VIETJET·TÒA ANH·10/2026, title ĐÓNG BĂNG 251 TRIỆU USD, chip1, sub WFO 15/10/2026 |
| s02 | S2 Gốc rễ | 5,9–18,7 | COVID, 4 Airbus A321 thuê, nợ ~7,4 triệu USD, chấm dứt cuối 2021 | GỐC RỄ, 4 AIRBUS A321, chip nợ thuê, chip chấm dứt sớm |
| s03 | S3 Cơ chế 1/4 | 18,7–29,3 | Điều khoản chuyển nhượng nợ → FitzWalter mua nợ, hết đường giãn nợ | CHUYỂN NHƯỢNG NỢ, 2 chips flow |
| s04 | S4 Cơ chế 2/4+3/4 | 29,3–43,0 | Chấm dứt vẫn phải đền: 181,5 triệu (4/2025, theo phân tích phán quyết) + kiện "phạt vô lý" bị bác | 181,5 TRIỆU USD, qualifier chip, chip tòa bác |
| s05 | S5 Cơ chế 4/4 | 43,0–51,0 | Lãi chậm trả cộng dồn + chi phí pháp lý; trả máy bay từ 2022 | LÃI CỘNG DỒN, chip 2022 |
| s06 | S6 Tổng 3 bản án | 51,0–56,8 | Tương phản: 251,6 triệu TRẦN vs ~2 triệu đã trả | stat1 251,6 (amber), stat2 ~2 triệu |
| s07 | S7 Leo thang | 56,8–70,7 | 12/2024 chuyển giá trị ~300 máy bay cho AHL Cayman (LIÊN QUAN tới VietJet); Singapore thu 9 máy bay không thành | ~300 MÁY BAY → CAYMAN, AHL chip, Singapore chip |
| s08 | S8 WFO | 70,7–81,9 | 15/10/2026 thẩm phán Saini ra WFO 251,6 triệu — "bằng chứng chắc chắn về nguy cơ tẩu tán" | WFO ĐÓNG BĂNG, Saini, quote chip |
| s09 | S9 Lời thẩm phán | 81,9–88,7 | 3 trích dẫn song ngữ + "chưa phải kết luận cuối cùng" | wholly illusory / bizarre / won't pay + note |
| s10 | S10 Phản bác | 88,7–94,9 | VietJet: tài trợ thông thường, không tẩu tán; được kháng án | 3 chips trung tính |
| s11 | S11 CHART bar | 94,9–105,5 | Bar zero-based triệu USD: 7,4 → 18,8 → 181,5 → 18,3 → 251,6 (TRẦN); lãi+chi phí đẩy vượt 250 | 5 cột + note TRẦN |
| s12 | S12 CHART anatomy | 105,5–117,9 | Bóc tách 251,6 (ƯỚC TÍNH THEO PHÂN TÍCH PHÁN QUYẾT): ~164,8 + 16,7 + còn lại | QUAL banner + 3 đoạn |
| s13 | S13 CHART timeline | 117,9–132,3 | Ngang 6 mốc: 2018 → 2021 → 2022 → 2024 → 12/2024 AHL → 15/10/2026 WFO | 6 nodes, node cuối amber |
| s14 | S14 Phạm vi đóng băng | 132,3–141,6 | Icon: ~300 máy bay đặt trước, PDP, động cơ, tiền vé đại lý — VẪN BAY BÌNH THƯỜNG | 4 icon cards + box xanh |
| s15 | S15 Ảnh hưởng | 141,6–151,2 | VJC ~128.600 đồng (theo giao dịch gần đây) không sàn; Úc 10 Boeing 737 khó hơn; lịch bay không đổi | 3 cards |
| s16 | S16 NHẬN ĐỊNH (badge riêng) | 151,2–159,5 | Không có "khoan nhượng COVID"; 7 triệu → hơn 250 triệu nghĩa vụ; còn dài | badge coral persists + 3 lines |
| s17 | S17 CTA | 159,5–162,7 | Theo dõi: VietJet kháng án đến đâu? | THEO DÕI + sub |

QC gates: speech_window PASS (0 overflow) · asr_roundtrip PASS (min head 0,48 — có lexicon-fold numeral) · audio_batch PASS 17/17 · elements 75/75 matched, 57 captions.

QA flags đã giữ: AHL "liên quan tới VietJet" (không nói công ty con) · "won't pay" là LỜI thẩm phán + kèm "chưa phải kết luận cuối cùng" · 251,6 = TRẦN đóng băng, chưa thu hồi · VJC kèm "theo giao dịch gần đây" · split 164,8/16,7 luôn kèm "ước tính theo phân tích phán quyết" · "lãi chậm trả cộng dồn" (không "lãi kép") · 反 bác VietJet luôn có mặt (s10) · không số ngoài whitelist.

Duration note: 162,67s > đích 120–150s (owner cho phép dài hơn để làm rõ cơ chế 4 lớp) — trong hạn 180s của policy news; awaiting owner.
