# Production report — news-daily-20261023

Status: **APPROVED & DELIVERED** (owner đã duyệt qua Telegram, master final đã bàn giao).

## Deliverables (real, verified on disk)
- Master sạch (ĐÃ GIAO TELEGRAM): `out/news-daily-20261023.mp4` — 1080x1920, 30fps, h264+aac, 61.525s (1844 frames), 4,920,664 bytes. Telegram msg #456.
- DRAFT HUD (bản duyệt Telegram): `out/news-daily-20261023-draft-HUD-720p.mp4` — 720x1280, 30fps, 4,407,355 bytes. HUD: mono `S{n} f{frame} {sec}s [f_in_scene/dur]`.
- Standalone Thumbnail (SSOT contract): `projects/news-daily-20261023/exports/thumbnails/news-daily-20261023-tiktok.png` — 1080x1920 PNG, 1,223,782 bytes. Background AI art (9router free) + overlay chữ Việt PIL (Helvetica bold, diacritics chuẩn 100%), đã pass vision QC v2 (chip coral + scrim).
- Caption: `out/news-daily-20261023-caption.txt` (dễ copy, bọc hook thi lớp 10).
- Description: `out/news-daily-20261023-description.txt` (timestamps từ scene_timing.json thật).
- Composition: `remotion-composer/src/news-daily-20261023/` (NewsDaily20261023Full sạch / NewsDaily20261023Debug HUD).
- Voice-only, không BGM → không credit nhạc.

## QC numbers (lead-verified trên artifact thật)
- `npx tsc --noEmit`: exit 0.
- Scene sweep (Debug, 16 stills): PASS edge=0 panel=0 dense=0.
- Element reveal audit: PASS 32/32 in-window. Speech-window: PASS 0 overflow (tolerance 0.2s).
- ASR round-trip: PASS 8/8 (head/tail ratio 1.0, threshold 0.45).
- Lexicon coverage: PASS 8/8 (11 entries, 0 residual digits).
- Vision QC master f200/f420/f1400: PASS — "Chưa phải quy định chính thức" viền vàng, "0,2%" coral, "NHẬN ĐỊNH" badge persist, KHÔNG HUD.
- Vision QC draft f200: PASS — HUD `S1 f200 6.7s [200/208]`.
- ffprobe: cả 2 bản 61.525s khớp timeline 1844 frames.
- Cost: $0 (vieneu local + faster_whisper local + 9router free image + CC gateway free + Remotion local).

## 5 tin đã chọn (xếp giảm dần độ ấn tượng, theo mandate 19/10):
1. **S1 (Hook):** Bộ GD&ĐT đề xuất thi lớp 10 chỉ còn 2 môn Toán và Văn (chưa phải quy định chính thức).
2. **S2:** Chính phủ trình Quốc hội đề xuất thuế 0,2% với đất bỏ hoang (toàn bộ diện tích, không hạn mức).
3. **S3:** Khởi tố đường dây gần 1.500 văn bằng giả — 10 bị can, 2 giảng viên ĐH, thu lời gần 3 tỷ.
4. **S4:** TP.HCM hơn 40.000 ca tay chân miệng từ đầu năm — tăng 32,2% trong 1 tuần.
5. **S5:** Sân bay Long Thành có 4 gói thầu nguy cơ trễ hẹn (thiếu nhân lực, chậm thanh toán) trước ngày dự kiến khai thác 24/12.
6. **S6a+S6b:** NHẬN ĐỊNH cho người đi làm (chi phí giữ đất nếu thông qua; áp lực thi cử vs đề xuất; theo dõi trẻ nhỏ).
7. **S7:** Outro hẹn gặp lại.

## Checkpoints
idea/script/scene_plan/assets/edit/compose/publish = completed. Human approved qua Telegram DM, master video delivered (msg #456, caption msg #457). Owner tự upload, KHÔNG auto-post.
