# Ký Chủ Pháp Luật — Channel Editorial & Visual Contract

- **Platform:** TikTok (`1080x1920`, 9:16, 30 fps)
- **Playbook / Theme:** `archival-editorial` / `ky-chu-phap-luat` (**Legal Dossier — Công báo hiện đại**, TikTok Safe Zone v3.2)
- **Audio:** VieNeu Turbo 48kHz (`voice: null`, `speed: 1.1`), Master `-11.0 LUFS`, BGM ducking `15–20 dB`.

## 1. Chiến lược nội dung 2 chế độ (Dual-Mode Content Strategy)

1. **Chế độ A — Tin Pháp Luật & Nghị Định Nóng (Ưu tiên hằng ngày):**
   - Bao phủ Luật, Nghị định (`NĐ-CP`), Thông tư, Nghị quyết, Quyết định mới ban hành trong `24–72 giờ`, sắp có hiệu lực trong `7–30 ngày tới`, hoặc thay đổi mức phạt / nghĩa vụ / quyền lợi tác động trực tiếp đến người dân và cộng đồng.
   - Đủ mạnh để lên tập khi trả lời rõ: *Ai bị ảnh hưởng? Mức phạt / quyền lợi cụ thể đổi gì? Áp dụng từ ngày nào?*
2. **Chế độ B — Series "Luật Cần Biết Đời Sống" (Fallback tự động):**
   - Khi ngày đó **không có văn bản/tin pháp luật mới** đủ sức nặng thực tiễn, hệ thống tự động chuyển sang chọn 1 chủ đề `status: pending` tiếp theo trong `channels/ky-chu-phap-luat/series_backlog.yaml` (ưu tiên `priority: high`, luân phiên mảng chủ đề giữa các ngày).
   - Tập trung các tình huống thường gặp của cộng đồng: giao thông, lao động & BHXH, thuê trọ & đất đai, tài chính/thuế/chuyển khoản, hôn nhân gia đình, đời sống công dân.

## 2. Kiểm chứng pháp lý & Chống bịa điều khoản (Legal Verification Gate)

1. **Nguồn gốc bắt buộc (Primary-First):**
   - Văn bản quy phạm phải kiểm chứng từ cổng chính thống: `vanban.chinhphu.vn`, `xaydungchinhsach.chinhphu.vn`, `baochinhphu.vn`, `quochoi.vn`, `vbpl.vn`, cổng bộ/ngành `.gov.vn`, hoặc PDF ký số `datafiles.chinhphu.vn`.
   - `thuvienphapluat.vn` và báo chí chính thống dùng để phát hiện lead và đối chiếu, nhưng số hiệu văn bản, điều/khoản và mức phạt **phải xác minh còn hiệu lực hiện hành tại ngày sản xuất** (tuyệt đối không dẫn văn bản cũ đã hết hiệu lực hoặc bị thay thế).
2. **Ràng buộc `fact_whitelist.json`:**
   - Mọi văn bản được nhắc tên phải có đủ: số hiệu văn bản (`Số .../202X/NĐ-CP`), điều/khoản (`Điều X, Khoản Y`), và ngày hiệu lực (`DD/MM/YYYY`).
   - Toàn bộ con số trên hình (`Mức phạt`, `Số ngày`, `Tỷ lệ %`, `Năm`) phải khớp `fact_whitelist.json` và có `narration_form` tiếng Việt đọc tự nhiên.
3. **Chuẩn mực & Tuyên bố miễn trừ (Neutral Legal Disclaimer):**
   - Giọng điệu điềm tĩnh, trung tính, dễ hiểu cho người không chuyên; giải thích thuật ngữ pháp lý ngay trong lời nói.
   - Không tư vấn lách luật, không kích động đối đầu cơ quan chức năng. Luôn gắn disclaimer ngắn ở cuối tập: *"Thông tin phổ biến pháp luật mang tính tham khảo theo văn bản hiện hành tại thời điểm phát hành."*

## 3. Nhận diện hình ảnh — Legal Dossier (TikTok Safe Zone v3.2)

1. **Bảng màu & Chất liệu:**
   - Sân khấu giấy công báo ấm: `#F6F2E9` (`paper`) → `#EBE4D5` (`paperWarm`), chữ mực `#0D1B2A`.
   - Dải masthead (`y: 0..332`) & cinema lower-third (`y: 1444..1920`): Statutory Navy `#0D1B2A` → `#162A3E`.
   - Màu nhấn: Legal Forest Green `#145A4A` (nhấn chính / quyền lợi / quy trình hợp lệ), Official Seal Crimson `#B91C1C` (cảnh báo / mức phạt / hành vi cấm), Gazette Brass Gold `#C58B16` & Highlighter `#F2C94C` (badge số hiệu điều khoản & số liệu nổi bật).
   - Giữ grain phim 35mm 12fps (`public/textures/film_grain_1..3.png`).
2. **Typography & Chống tràn chữ:**
   - `Barlow Condensed` (headline 58–82px, số liệu `>= 44px`, nhãn `>= 27px`) + `Plus Jakarta Sans` / `Be Vietnam Pro` (body & phụ đề `42–45px`). Cấm chữ `< 24px` trên khung 1080p.
   - **Anti-AI:** Cấm bệnh xếp hộp Card-itis (`border: 1px`), cấm hộp đen toast phụ đề, cấm `JetBrains Mono` gắn dấu `·`, cấm neon glow / glassmorphism.
3. **Safe Zone v3.2:**
   - **Scene 1 (`t=0`) là Cover + Hook:** 2–5 từ punchy + 1 từ khóa highlight `#F2C94C` hoặc `#145A4A`/`#B91C1C`. `<BrandBumper />` tắt mặc định (`bumper_enabled: false`) hoặc chỉ đặt ở outro nếu bật sau này.
   - Nội dung chính nằm trong band `y: 350..1420`, `x: 90..940` (`maxW: 850`, chừa rail phải `>= 140px`).
   - Phụ đề burned-in đặt không viền trong dải cinema đáy `y: 1480..1600`, `<= 2` dòng, `<= 64` ký tự/chunk, tự highlight số liệu bằng `#F2C94C`.
4. **Cấu trúc tập chuẩn & Visual hóa:**
   - Cấm video text thuần. Ưu tiên ảnh thật đã kiểm chứng (`NGUỒN: ...`), bảng so sánh `ComparisonSplit` (Quy định Cũ vs Mới), `FlowTimeline` (Quy trình xử lý / bước làm), `EditorialBarChart` (Khung mức phạt theo mức độ), hoặc minh họa gắn nhãn `MINH HỌA AI / <Concept>`.
   - **Dàn cảnh chuẩn 7 Scene:**
     - `S1`: Cover + Hook tình huống đời thường / con số giật mình.
     - `S2`: Căn cứ pháp lý (Số hiệu Nghị định/Luật + Ngày hiệu lực).
     - `S3–S5`: Bóc tách đối tượng áp dụng, mức phạt / quyền lợi cụ thể, so sánh Cũ vs Mới.
     - `S6`: Hiểu lầm phổ biến (*"Đừng nhầm lẫn…"*).
     - `S7`: Checklist việc cần làm ngay + `NHẬN ĐỊNH` + Disclaimer + CTA bình luận tình huống.

## 4. TikTok SEO & Publish

- 80–100 ký tự đầu caption đặt thẳng tên Nghị định/Luật + tác động trực tiếp đến người dân.
- Tối đa `5` hashtag liên quan (`#phapluat`, `#nghidinh`, `#luatvietnam`, hashtag chủ đề cụ thể); tuyệt đối cấm `#fyp`, `#foryou`, `#xuhuong`.
- Kết description bằng CTA mời người xem lưu video hoặc bình luận tình huống thực tế đang gặp.
