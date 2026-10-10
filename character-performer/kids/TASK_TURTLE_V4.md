# TASK_TURTLE_V4.md — Rùa v4: rig side-view bò ngang (để duyệt still, KHÔNG render video)

## Bối cảnh
User feedback v3.3 (front-view): "Mai rùa to quá, nên làm rùa đang bò ngang thấy 2 bên chân và đuôi, 1 phần bụng dưới mai."
→ Hướng đi mới: **side profile** — góc nhìn đi ngang tự nhiên như truyện tranh thiếu nhi, thay front-view.

## Rig side-view (rùa Vàng kawaii style C, palette giữ nguyên)
1. **Proportion**: mai chiếm ~55-60% chiều dài thân (v3.3 front-view nhìn như 80% — mai nhỏ lại rõ), đầu side-profile to tròn hiền (kawaii), cổ ngắn cong nhẹ.
2. **Chân**: 4 chân nhìn thấy từ side (2 gần đậm, 2 xa nhạt 15% để hiểu chiều sâu), chân dẹt rộng kiểu mái chèo bò, pivot vai/hông — cách nhau theo nhịp bò chéo (gần-trái + xa-phải đồng pha).
3. **Đuôi**: nón ngắn thuôn nhọn ở phía sau, cùng màu da đầu.
4. **Bụng dưới mai**: dải kem #f5e6c8 thấy rõ dưới mép mai (như v3.3 nhưng giờ nhìn side — belly band chạy dọc đáy, 1 phần bị mai che là đúng giải phẫu).
5. **Mai**: dome side-view với hoa văn hexagon, rim mảnh #c9821e — KHÔNG đè lên đầu/chân; đầu nhô ra TRƯỚC mai, chân mọc THÂN DƯỚI (giữ bài học silhouette: 1 khối liền, không outline nội thất chia cắt).
6. **Face side-profile**: kính tròn 1 bên thấy rõ (1 lens + gọng cong qua mặt), mắt sparkle, má hồng, miệng mở side (viseme ellipse xoay nhẹ theo hướng nhìn).
7. **Props**: sách mở đặt trước/mặt dưới khi bò (chân trước giữ mép như v3.3 walk-hold) — proud pose không sách.
8. **Mechanics**: crawl cycle (chân chéo nhịp ~1.1s), head bob nhẹ khi nói, peek/blink giữ, bookFall giữ.

## Deliverable (CHỈ still để duyệt — design gate)
3 PNG nền trắng 1080² từ comp `TurtleStill` mới (đừng đụng comp cũ):
- `turtle_v4_crawl_idle.png` — đứng nói, 4 chân đặt, kính + sách
- `turtle_v4_crawl_walk.png` — giữa nhịp bò (chân chéo抬起), giữ sách
- `turtle_v4_proud.png` — ngẩng đầu ăn mừng, không sách

QC numeric giữ nguyên quy tắc: silhouette liền 1 khối (dark-run scan), 0 outline nội, mai KHÔNG che chân/đầu, bụng thấy dưới mai. Evidence vào `qc_turtle_v4/`.

## Ghi chú
- `GoldenTurtle.tsx` (rig module vừa tách) là nơi sửa — component side-view thay front-view, props API (`frame pose spec cues`) giữ nguyên để comp multiscene không phải đổi gọi.
- KHÔNG re-render video multiscene. Sau khi user duyệt 3 still sẽ làm tiếp (dialogue mới + scenes tự nhiên).
