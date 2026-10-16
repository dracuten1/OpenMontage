# REPORT_TURN6 — USER VETO v5 → v6 (2 fixes, mọi thứ khác giữ nguyên)

Task: user veto trên `kids_ep1_remake_v5.mp4` — (1) "Giây thứ 12, rùa sao lại bị
phóng to?" (2) "Giây thứ 20, khung hình này thấy thỏ đã về tới vạch đích =>
không nên, dễ gây hiểu lầm". File sửa: `remotion-composer/src/KidsStoryEp1Remake.tsx`
(2 patch) + bg plate mới `ep1_v2/bg6_walk_v2.png`. Output:
`remotion-composer/out/kids_ep1_remake_v6.mp4` (12,414,120 B).

## Fix 1 — S2b close-up 10.9-12.4s BỎ (camera identity)

Chẩn đoán (độc lập, khớp veto): window 1.22 @430,800 label "thỏ thách đấu" nhưng
camera toàn-cục scale MỌI sprite ×1.22 → rùa H260→317px màn hình + đẩy sang phải
foreground → đọc là "phóng to rùa" (probe f_11.5/12.0/12.3 + vision xác nhận).
Camera toàn cục KHÔNG THỂ phóng thỏ mà không phóng rùa (crop rùa ra khỏi khung
cần z≥2.4 — cực đoan, vẫn "rùa khổng lồ" ở mép) → chọn phương án user cho phép:
BỎ HẲN zoom. Scene 1 giờ: 0–15.3 ONE static shot identity; duy nhất 1 close-up
còn lại: S3b 1.18 @660,800 15.3–17.79 (rùa nói "Chậm mà chắc" = đúng người nói,
user bảo GIỮ NGUYÊN). Diff code: `camAt()` bỏ 2 dòng (t<10.9 / t<12.4) gộp về
identity; 0 sprite/staging/audio/timeline đổi.

## Fix 2 — gate đỏ bg6_walk @18.9-20.9s xóa (surgical i2i)

Chẩn đoán: bg6_walk.png (RGBA 1254x1254) có VẼ SẴN 1 cổng (vải đỏ + 2 cột gỗ)
ngang đường ở trung cảnh — thỏ sprint 18.9-20.9 chạy TỚI và xuyên qua ~20.2s
(f_20.5: gate đã ra sau lưng) → đọc là vạch đích giữa chừng. Đích chỉ được gợi
ý ở S7 (bg8_finish @33.9+). Không phải cổng START (START = bg1_start, đứng ở đó
17.79-18.9 rồi CUT sang bg6).

Fix theo method surgical-bg (skill): crop vùng gate x[300,980) y[140,560) →
i2i `cx/gpt-5.6-luna-image` (sunburst đang 9router-blocked "reset after 30m")
"remove banner + posts + ropes, keep everything else identical" → paste lại
CHỈ trong zone feather 16px. `bg6_walk_v2.png`: plate diff NGOÀI zone = 0.0000,
alpha channel bit-identical từ gốc (RGBA alpha thay đổi 38-250 — mất alpha là
lệch composite toàn frame, đã bắt và sửa trước render cuối), red-cloth px zone
33963→2631 (phần còn = màu đất đường), mép border-ring diff 0.0000. Path SPX/SPY
+ sprite regs KHÔNG đổi. BG_SEG dòng 500: src → bg6_walk_v2.png.

## QC turn6 (qc_v6.py — 10 gate PASS toàn bộ)

| Gate | Kết quả |
|---|---|
| G1 identity ngoài 2 cửa sửa (f0100/f0190/f0780/f0920/f1150) | **0.0000** ×5 PASS — 2 QC diff 0.0000 của turn5 giữ nguyên |
| G2 close-up S3b giữ (f0470/f0527) | **0.0000** ×2 PASS |
| G3 fix là thật (f0340 ex-zoom 61.04; f0600 gate 6.43) | PASS (>5) |
| G3b f0600 diff giới hạn vùng gate | in-box 83.45 / ngoài **0.0222** PASS |
| G4 camera tĩnh window 9.91-15.3 (sky f0330~f0450) | **0.0000** PASS |
| G5 ffprobe | 1230f · 41.045s · 1080x1080 · 30fps · aac 48k stereo PASS |
| G6 banner đỏ biến mất @19.5/20.0/20.5 | red-cloth px 34374/34374/34125 → **0/0/0** PASS |

Vision verify v6: @12.0 "không có dấu hiệu zoom cận vào rùa, khung tĩnh bình
thường"; @19.5/20.0 "không còn banner/cổng nào phía trước, đường thông thoáng,
không vết chỉnh sửa" (viền mờ quanh thỏ = 2 ghost speed trail đã duyệt turn5).

Render: tsc RC=0; render v6 lần 1 11:13 (12,416,644 B — plate RGB sai alpha,
DISCARD), lần 2 sau fix RGBA 11:18 RC=0 (12,414,120 B). Stills 11 file
turn6/v6_stills + 6 mp4-frame extract turn6/evidence + 2 board before|after.

## Deliver
Telegram DM (chat 615761638): video + board_12s + board_20s, awaiting_human.
