# Task: v3.1 — thêm kính tròn + sách cho rùa (đúng design sheet C đã duyệt)

## Vấn đề (lead QC phát hiện)
Design sheet `design_C_kawaii.png` vẽ rùa bà kể chuyện **đeo kính tròn + cầm sách mở** — rig v3 thiếu cả 2 → chưa đúng nhân vật đã duyệt.

## Yêu cầu
1. **Kính tròn**: 2 vòng tròn viền nâu đậm quanh mắt rùa (không che sparkle — kính chỉ là ring, mắt vẫn thấy qua), cầu nối + càng cong ra sau tai. Khi blink: kính giữ nguyên, mắt thu nhỏ phía trong
2. **Sách**: rùa cầm sách mở nhỏ phía trước bụng (2 trang be + viền, vài dòng "chữ" gợi ý bằng đường kẻ mảnh — KHÔNG chữ thật). Tay trước đặt trên mép sách. Khi đi (walk i5): sách vẫn giữ (tay ôm); khi clap S5: thả sách xuống cạnh chân TRƯỚC khi vỗ tay (hoặc đổi celebration thành giơ sách — chọn tự nhiên hơn)
3. Rig mechanics khác giữ nguyên. Chỉnh cẩn thận draw order: kính trên mắt, sách trên bụng dưới cằm
4. Render `kids_story_multiscene_v31.mp4` (1188f). QC: crop mặt rùa (kính hiện rõ 2 mắt, blink vẫn hoạt động) + 1 frame đi + 1 frame celebration + mid-cue lip-sync. FAIL → fix → re-render
5. Append "v3.1 glasses+book" vào REPORT_MULTISCENE.md
