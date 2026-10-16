# TASK_EP1_AI_ASSETS.md — Batch gen assets Ep.01 "Rùa và Thỏ" (luna ONLY)

## Bối cảnh (đã verify bởi Hermes, ĐỪNG re-verify)
- Demo phân cảnh 5 đã duyệt: `remotion-composer/out/kids_depth_demo.mp4`, pattern hoạt động.
- Asset bank hiện có (DÙNG LẠI, không gen lại): `remotion-composer/public/character-performer/kids/depth_demo/`
  `turtle_base.png, turtle_walk.png, turtle_m0.png, turtle_mO.png, rabbit_sleep.png, tree_sleep.png, bg_far.png, strip_mid.png, strip_fg.png, d5_turtle.wav, k_bgm_v2.wav` + prompt.txt từng ảnh.
- Audio 8 câu + cues: `character-performer/kids/dialogue_v2/` (d0..d7 wav + *_cues.json, timeline.json).
- Script gen đã verify: `character-performer/kids/assets/depth_demo/gen_assets.py` (mở rộng list, KHÔNG viết lại từ đầu).

## QUY TẮC SỐNG CÒN (từ session chết lần 5)
1. **TUYỆT ĐỐI KHÔNG Read file .png/.jpg** — verify ảnh CHỈ bằng script PIL (size/mode/alpha%/bbox). Vision QC là việc của Hermes.
2. Img2img: ảnh reference nằm ở field `image` (data URI `data:image/png;base64,...`), KHÔNG nhét vào prompt. **Downscale ref về ≤1024px trước** (>2MB b64 làm SSE abort).
3. Model CHỈ `cx/gpt-5.6-luna-image`, gateway `http://127.0.0.1:20128/v1`, key trong `.env`, header `Accept: text/event-stream`, dual parse JSON/regex.
4. Sprite: `"background": "transparent"`. Luna trả size tùy ý → sau MỖI ảnh chạy script đo alpha-bbox, ghi vào `registration.json` (không hardcode).
5. Style lock mọi prompt: `flat kawaii children's picture-book style, thick dark-brown outlines, soft pastel colors, gentle cel shading, no text, no watermark`
6. Retry tối đa 1 lần/ảnh. Ảnh fail → ghi log, tiếp ảnh khác, báo cuối task.
7. Latency luna 35–430s/ảnh là BÌNH THƯỜNG. Chạy tuần tự, timeout request 600s.

## Assets cần gen (11 ảnh mới)

Identity anchor thỏ = `/Users/tuyennguyen/.hermes/cache/scratch/luna_probe.png` (downscale 1024 trước dùng). Chuỗi img2img: mỗi pose sinh trước, biến thể miệng img2img từ chính pose đó "keep character design and colors EXACTLY, only change the mouth...".

| file | ref | prompt chính (thêm style lock) |
|---|---|---|
| rabbit_greet.png | probe | same rabbit standing, facing LEFT, one paw waving hello, big smile, mouth CLOSED, full body side view |
| rabbit_greet_mO.png | greet | ...only change mouth to open O shape as if speaking |
| rabbit_taunt.png | probe | same rabbit standing facing LEFT, smug teasing smirk, paws on hips, mouth CLOSED, full body |
| rabbit_taunt_mO.png | taunt | ...only change mouth to open O shape |
| rabbit_run1.png | probe | same rabbit sprinting FACING RIGHT, body stretched, ears swept back, mid-leap, full speed |
| rabbit_run2.png | run1 | same running rabbit, next stride phase, legs swapped positions |
| rabbit_shock.png | probe | same rabbit startled awake, eyes wide, ears bolt upright, mouth open small, facing RIGHT, full body |
| rabbit_shock_m0.png | shock | ...only change mouth to CLOSED |
| turtle_proud.png | depth_demo/turtle_walk.png | same golden turtle, head held high, proud smile, mouth CLOSED, facing RIGHT, full body side view |
| turtle_proud_mO.png | proud | ...only change mouth to open O |
| finish_bg.png | (T2I, opaque) | wide sunny meadow FINISH LINE: red banner "ribbon" between two wooden poles across a dirt road, colorful flags, distant hills, NO characters, no letters on banner (plain red ribbon) |

Lưu: `character-performer/kids/assets/ep1_ai/` + copy sang `remotion-composer/public/character-performer/kids/ep1_ai/`. Mỗi ảnh kèm `.prompt.txt`. Ghi `gen_log.json` (file, giây, size trả về, alpha%).

## Deliverables
1. 11 ảnh + prompt.txt + log (nêu rõ ảnh nào fail sau 1 retry)
2. `registration.json`: với MỖI ảnh mới + 5 sprite rùa/thỏ cũ (walk/m0/mO/sleep + tree): {size, ar, t, b, cx, content_h_frac} đo bằng PIL alpha-bbox
3. `REPORT_ASSETS_EP1.md`: bảng assets, tổng giây gen, lỗi gặp

## Checklist (đúng thứ tự, KHÔNG đọc lại ảnh đã gen)
- [ ] extend gen_assets.py → chạy batch tuần tự
- [ ] PIL QC + registration.json
- [ ] copy public + REPORT_ASSETS_EP1.md
