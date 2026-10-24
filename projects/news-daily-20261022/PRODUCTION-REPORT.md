# Production report — news-daily-20261022

Status: **APPROVED + FINAL DELIVERED** (owner duyệt draft HUD qua Telegram).

## Final delivered (2026-10-22 21:27 +07)
- Master `out/news-daily-20261022.mp4` (6,710,367 bytes, mtime 21:16 — KHÔNG re-render sau duyệt, ffprobe verified 21:25) DM owner: Telegram msg #428 (video + description rút gọn), msg #429 (caption ngắn hook + description đầy đủ).
- checkpoint publish: status=approved, human_approved=true, receipt = TG msg #428/#429.
- TikTok: owner tự upload — KHÔNG auto-post.

## Run 2026-10-22 (backup run — bản bù cron 18h00 timeout)
Brief: video tin tức ngày 22/10/2026 từ bản tin 17h40–17h42. Whitelist = 2 file sealed (inputs/20261022T204219+0700, sha256 trong brief.json). Owner chỉ định hook Champi + não mô cầu.

5 tin (giảm dần ấn tượng): Champi → não mô cầu TPHCM → 7 tàu dầu Hormuz → xăng/dầu 15h → Nasdaq/IBM. Segment NHẬN ĐỊNH riêng (S6a/S6b, badge coral persist) trước outro.

## Deliverables (real, verified)
- Master sạch: `out/news-daily-20261022.mp4` — 1080x1920, 30fps, h264+aac 48kHz, 79.133s (2374 frames), 6,710,367 bytes.
- DRAFT HUD (bản duyệt Telegram): `out/news-daily-20261022-draft-HUD-720p.mp4` — 720x1280, 5,866,457 bytes.
- Caption: `out/news-daily-20261022-caption.txt`; Description: `out/news-daily-20261022-description.txt` (timestamps từ scene_timing.json thật).
- Composition: `remotion-composer/src/news-daily-20261022/` (NewsDaily20261022Full sạch / NewsDaily20261022Debug HUD).
- Voice-only, không BGM → không credit nhạc.

## QC numbers (lead-verified trên artifact thật)
- `npx tsc --noEmit`: exit 0 (fresh sau fix).
- Scene sweep (Debug, 16 stills ×2 vòng): PASS edge=0 panel=0 dense=0.
- Element reveal: PASS 34/34 in-window. Speech-window: PASS 0 overflow (±0.2s).
- ASR round-trip: PASS 8/8 (head/tail 1.0; tên riêng phonetic = noise, mapped). Lexicon coverage: PASS 8/8 (27 entry).
- Vision QC master f360/f1230/f2040: PASS — 210 km/h coral nguyên văn, caption đủ 2 dòng, NHẬN ĐỊNH persist, KHÔNG HUD. Draft f360: HUD đúng format `S1 f360 12.0s [360/536]`.
- Defect bắt & fix trong run: caption pill clamp 2 dòng cắt dòng 3 với chunk 57–90 ký tự → adaptive fontSize clamp(28..48, floor(2843/len)) → sweep2 + stills verify PASS.
- ffprobe: cả 2 bản 79.133s khớp timeline. Cost: $0 (vieneu local + faster_whisper local + CC gateway free + Remotion local).

## Checkpoints
idea/script/scene_plan/assets/edit/compose = completed (owner brief 2026-10-22 ủy quyền draft-run). publish = awaiting_human (owner tự upload).

## Iterate sau duyệt
Owner phản hồi theo `S# f####` (xem scene_index.md / HUD). Final sạch = render từ đúng nguồn này với mọi fix được duyệt; KHÔNG regenerate TTS/audio.
