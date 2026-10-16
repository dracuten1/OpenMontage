# REPORT_DEMO_DEPTH — Demo 1 phân cảnh "xa gần 2D" bằng AI images (luna)

Ngày: 2026-10-11 · Task: `TASK_DEMO_DEPTH.md` (cùng thư mục)
Model duy nhất: **cx/gpt-5.6-luna-image** qua 9router `http://127.0.0.1:20128/v1`.
Gen script: `character-performer/kids/assets/depth_demo/gen_assets.py` (pattern reuse từ `~/.hermes/cache/scratch/luna_probe.py`: header `Accept: text/event-stream`, dual parse JSON → regex `b64_json` → `data:image/png;base64`, `"background":"transparent"` cho sprite/strip).
Đối chiếu: `gen_log.json` + `<tên>.prompt.txt` (mỗi ảnh) trong `assets/depth_demo/`.

## 1. Bảng assets (9/9 pass, 0 retry cần dùng)

| file | nguồn | size trả về | giây | alpha |
|---|---|---|---|---|
| bg_far.png | T2I, opaque | 1916x821 | 58.4 | RGB (opaque, đúng ý) |
| strip_mid.png | T2I, transparent | 2048x768 | 35.5 | 46.0% transparent |
| strip_fg.png | T2I, transparent | 2172x724 | 90.1 | 72.3% transparent |
| tree_sleep.png | T2I, transparent | 1223x1286 | 91.5 | 37.0% transparent |
| turtle_base.png | T2I, transparent (identity anchor) | 1536x1024 | 309.7 | 48.2% |
| rabbit_sleep.png | T2I, transparent | 1536x1024 | 432.9 | 50.4% |
| turtle_walk.png | **img2img** ← turtle_base (512px embed) | 1536x1024 | 128.5 | 50.1% |
| turtle_m0.png | **img2img** ← turtle_walk (512px embed) | 1312x1199 | 82.4 | 59.9% |
| turtle_mO.png | **img2img** ← turtle_walk (512px embed) | 1536x1024 | 114.5 | 41.6% |

Tổng gen ≈ 22.5 phút (luna hôm nay chậm hơn ước tính 40–70s: turtle_base 310s, rabbit 433s).

## 2. Đường identity đã dùng

- **Thỏ**: prompt khoá theo con thỏ probe (`kawaii white rabbit with soft cream highlights wearing a red vest with a single yellow button, thick dark-brown outline`) + pose "sleeping curled, eyes closed, NO z letters". Không dùng ảnh base64 (T2I thuần) — identity giữ qua mô tả khoá.
- **Rùa**: KHÔNG dùng turnaround cũ. Sinh `turtle_base` bằng prompt mô tả đầy đủ (golden turtle, warm yellow dome, olive-green skin, side view) → mọi biến thể (walk/m0/mO) img2img từ chính base/walk với "keep character design and colors EXACTLY". Kết quả 3 sprite đồng nhất (xem stills).
- Style lock string xuất hiện đúng nguyên văn trong cả 9 prompt.

## 3. Lỗi gặp & cách xử

1. **img2img full-size 1024 (~2MB b64) làm gateway SSE abort** (`event: error` ngay sau progress đầu) — turtle_walk fail 2 lần, kéo theo m0/mO fail dây chuyền (FileNotFoundError). **Fix đã verify**: downscale source về 512px trước khi embed (~300KB b64) → img2img chạy ổn, identity vẫn khoá được.
2. **Gateway tự chọn size**: request 1536x1024 nhưng bg_far về 1916x821 (2.33:1), strip_mid 2048x768 (2.67:1), strip_fg 2172x724 (3:1), m0 về 1312x1199, tree về 1223x1286. Hệ quả: (a) composition ban đầu ép 3:2 làm cảnh bị kéo dọc — đã sửa hiển thị theo true-aspect; (b) các canvas sprite KHÔNG đồng nhất → nguy cơ miệng swap bị nhảy. **Fix**: đo alpha-bbox từng sprite bằng PIL, đăng ký mỗi sprite bằng (aspect, top, bottom, cx), ghim content bottom-center vào điểm sân khấu + chuẩn hoá content-height như nhau giữa walk/m0/mO → swap ổn định.
3. **bg_far về mode RGB** — check đầu tiên của script sai yêu cầu RGBA cho mọi ảnh (đã fail 1 lần bg_far vô ích trước khi kill+sửa): tách 3 chế độ check (opaque / loose transparent ≥5% cho tree / strip-sprite ≥25%).
4. BGM 404 lúc render đầu: wav chưa copy sang public (mới copy png/txt) — copy thêm 2 wav là xong.

## 4. Thông số depth ramp cuối cùng

- Story-world speed **không đổi**: `u = t/9` tuyến tính; `y = 0.72 + 0.16·u` (72%→88%).
- `scale = min(1.0, 0.45 · k^((y−0.72)/0.16))` với **k = 1/0.45 = 2.2222** (dạng "tương đương" của công thức 1.55 trong task: giữ family số mũ theo y nhưng base chọn sao cho ramp chạm đúng scale 1.0 tại y=0.88 — base 1.55 chỉ tới 0.70).
- `x = 0.15 + 0.40·(scale−0.45)/0.55` → screen-x gắn vào scale nên spacing trên màn hình tự nở dần thuần do ramp (tốc độ story không đổi).
- Bóng ellipse: w = 1.12·turtleH, h = 0.20·turtleH, opacity 0.10→0.25 theo scale.
- Pan (translate trái, rùa tiến phải): tốc rùa trung bình trên màn = 0.40·1080/9 = 48 px/s. Base P = 48/1.5/1.3 ≈ 24.6 px/s → **bg 0.2P ≈ 4.9 px/s (44px/9s) · mid 0.6P ≈ 14.8 px/s (133px) · fg 1.3P = 32 px/s (288px) = chậm hơn 1.5× tốc rùa** đúng note trong task.
- Hiển thị true-aspect: bg 2520x1080 · mid 1600x600 (top y=480) · fg 1700x567 (top y=513) — đủ rộng phủ toàn bộ pan travel.
- Lip-sync: `d5_cues.json`, t=0 = đầu wav; X→m0, A..G→mO, gap/idle→walk, swap trực tiếp. WAV 6.14s; sau đó rùa giữ walk.
- zZz: 3 chữ z chu kỳ 2.5s lệch pha 1/3, bay lên 72px fade sin(πp), trên đầu thỏ (code vẽ, font tròn). Thở thỏ: scale 1±0.8%, chu kỳ 3s.
- Không dùng interpolate array nào (toàn bộ closed-form) — không vi phạm luật strictly-increasing.

## 5. Kết quả QC

| mục | kết quả |
|---|---|
| `npx tsc --noEmit` (remotion-composer) | **0 error** |
| Still f30 (rùa xa x≈17.8%, y≈73.8%, s≈0.49) | rùa nhỏ rõ, depth readable, thỏ+zZz dưới cây ✓ std=71.8 (không trắng) |
| Still f150 (rùa giữa đường s≈0.73) | ✓ std=72.0 — trúng cue "A" 4.98–5.06s → **miệng mở đúng** (mO) |
| Still f235 (rùa gần x≈55%, y≈88%, s=1.0) | ✓ std=71.7, rùa lớn; t=7.83s > wav 6.14s → idle walk (không trúng cue) |
| Thỏ hiện diện 3 frame (numeric) | white-px vùng thỏ 4.2/4.6/4.6% — ổn định, cỏ chỉ che dưới y≈883 |
| Render `out/kids_depth_demo.mp4` | 1080x1080, 9.045s, video+audio (d5 + BGM 0.25), 7.7MB ✓ |

## 6. Checklist

- [x] 9 ảnh gen + prompt.txt + PIL check (mọi sprite/strip ≥25% transparent, bg_far opaque)
- [x] KidsDepthDemo.tsx mới hoàn toàn + register `KidsDepthDemo` trong Root.tsx + tsc 0 error
- [x] 3 stills QC tự kiểm (multimodal + numeric)
- [x] render `remotion-composer/out/kids_depth_demo.mp4`
- [x] REPORT_DEMO_DEPTH.md
- [x] Không đụng rig cũ (KawaiiRabbit/GoldenTurtle), KidsStoryEp1V8.tsx, hay file ngoài phạm vi task (KawaiiRabbit.tsx modified trong git là thay đổi có TRƯỚC session này)

## 7. Files mới

```
character-performer/kids/assets/depth_demo/   gen_assets.py, gen_log.json,
  9×png + 9×prompt.txt, d5_turtle.wav, k_bgm_v2.wav (copy)
remotion-composer/public/character-performer/kids/depth_demo/  (copy của trên, staticFile)
remotion-composer/src/KidsDepthDemo.tsx       (component mới)
remotion-composer/src/Root.tsx                (+import +Composition KidsDepthDemo, 270f)
remotion-composer/out/kids_depth_demo.mp4     (deliverable)
character-performer/kids/REPORT_DEMO_DEPTH.md (file này)
```
