# TASK_DEMO_DEPTH.md — Demo 1 phân cảnh "xa gần 2D" bằng AI images (cx/gpt-5.6-luna-image ONLY)

## Bối cảnh
User đã duyệt hướng: thay rig SVG bằng AI-generated images, test 1 phân cảnh TRƯỚC rồi mới làm cả Ep.01.
Phân cảnh demo = **câu 5 (line index 5)** trong `character-performer/kids/dialogue_v2/timeline.json`:
> Rùa (Mỹ Duyên): "Thỏ ngủ ngon nha. Mình đi chậm rãi, đều đều, hết đường này nữa…" (start 23.27s, dur 6.15s)
— Rùa bò chậm rãi trên đường đua từ xa tới gần; Thỏ ngủ dưới cây bên phải. Đây là cảnh showcase chiều sâu.

## Quy tắc bất di bất dịch
1. **Model: CHỈ `cx/gpt-5.6-luna-image`** qua 9router `http://127.0.0.1:20128/v1` (key trong `.env`, load_dotenv(".env") từ repo root). KHÔNG dùng ag/gemini hay model khác.
2. Endpoint: POST `/v1/images/generations`, header `Accept: text/event-stream` (endpoint ĐÔI KHI trả JSON thuần — parse cả hai: json.loads trước, fallback regex `"b64_json":"..."` hoặc `data:image/png;base64,`).
3. Sprite/strip cần nền trong suốt: thêm field `"background": "transparent"` (đã verify luna trả RGBA thật, ~58% alpha sạch, 40-70s/ảnh).
4. **Style lock** — mọi prompt phải chứa đúng chuỗi này:
   `flat kawaii children's picture-book style, thick dark-brown outlines, soft pastel colors, gentle cel shading, no text, no watermark`
5. **Identity & Style Reference**:
   - Thỏ: dùng prompt khoá theo con thỏ mẫu vừa probe thành công (kawaii white rabbit, red vest with yellow button, dark-brown outline, soft cream highlights, side view). Có thể dùng ảnh mẫu `/Users/tuyennguyen/.hermes/cache/scratch/luna_probe.png` làm reference.
   - Rùa: KHÔNG dùng ảnh turnaround cũ làm anchor vì đó là capsule vector đơn giản, sẽ kéo tụt phong cách tranh. Hãy sinh Rùa bằng prompt mô tả đầy đủ: `cute kawaii golden turtle with warm yellow dome shell and olive-green skin, friendly big brown eyes, smiling, side view, crawling pose, thick dark-brown outlines, flat pastel children's picture-book style, gentle cel shading, no text, isolated subject`. Sau khi sinh được 1 con rùa ưng ý (`turtle_base.png`), DÙNG CHÍNH NÓ làm img2img anchor để sinh các biến thể (bò bước khác, mở miệng, khép miệng) với prompt "keep character design and colors EXACTLY, same golden turtle...".
   - Luôn kiểm tra % alpha: sprite phải có nền trong suốt (>25% transparent).
6. Ảnh lưu vào `character-performer/kids/assets/depth_demo/` (tạo mới), coppy sang `remotion-composer/public/character-performer/kids/depth_demo/` để staticFile() đọc được. Mỗi ảnh kèm `<tên>.prompt.txt` ghi prompt + params.
7. KHÔNG sửa rig SVG cũ, KHÔNG đụng KidsStoryEp1V8.tsx. Component mới hoàn toàn.

## Assets cần gen (~10 ảnh, toàn bộ luna)
| file | loại | nội dung |
|---|---|---|
| `bg_far.png` | full-bleed 1536x1024 | bầu trời xanh nhạt + đồi cỏ xa + hàng cây xa mờ nhạt (atmospheric: nhạt màu, ít chi tiết), mặt đất đua ở dưới. KHÔNG trong suốt. |
| `strip_mid.png` | transparent | hàng cây bụi gần hơn + BÃI ĐƯỜNG ĐUA đất nâu chiếm ~40% dưới, mép trên trong suốt để bg_far lộ. Chạy ngang full width. |
| `strip_fg.png` | transparent | các cụm cỏ hoa cao dưới cùng, gần camera, đậm màu nhất. |
| `tree_sleep.png` | transparent | một gốc cây to tán lá xum xê BÊN PHẢI, đủ rộng để thỏ ngủ dưới gốc. |
| `turtle_walk.png` | transparent | rùa side-view pose bò, img2img từ turtle_side_090.png. |
| `turtle_m0.png` | transparent | biến thể miệng KHÉP (mắt mở bình thường), img2img từ turtle_walk.png, "keep everything else unchanged, only mouth closed". |
| `turtle_mO.png` | transparent | biến thể miệng MỞ tròn (như đang nói "ơ"), cùng cách. |
| `rabbit_sleep.png` | transparent | thỏ trắng vest đỏ ngủ cuộn, mắt nhắm, zZz KHÔNG vẽ (code vẽ), dựa lưng gốc cây phải. |

Sau khi gen xong mỗi ảnh: mở bằng PIL kiểm tra mode RGBA + % alpha (strip/sprite phải >25% transparent, trừ bg_far/tree có thể thấp hơn) — fail thì gen lại 1 lần.

## Composition — `KidsDepthDemo.tsx` (mới) + register `KidsDepthDemo` trong Root.tsx
- 1080x1080, 30fps, duration = 9s (270 frames).
- Stack: bg_far (pan 0.2×) → strip_mid (pan 0.6×, chứa đường đua) → tree_sleep (đứng yên, góc phải, đáy chạm lane gần) → rabbit_sleep (dưới gốc cây, thở nhẹ scale 1±0.8% chu kỳ 3s) → turtle (đi trên lane đường đua) → strip_fg (pan 1.3×, chậm hơn 1.5× tốc rùa di chuyển thực). Pan = translate trái khi rùa tiến phải, lượng dịch khác nhau theo hệ số trên.
- **Depth ramp rùa**: bắt đầu x≈15% khung, y≈72% (xa: scale 0.45), kết thúc x≈55%, y≈88% (gần: scale 1.0). scale = interpolate THEO y (hàm mũ: scale = 0.45 * (1.55^((y-0.72)/0.16)) clamp 1.0, hoặc tương đương) — KHÔNG tuyến tính theo thời gian. Bóng ellipse dưới bụng, opacity + kích thước theo scale.
- Di chuyển rùa: tốc độ story-world KHÔNG ĐỔI — spacing trên màn hình tự nở dần do scale ramp (đây chính là điểm cần đúng).
- **Lip-sync**: cues từ `character-performer/kids/dialogue_v2/d5_cues.json` (t=0 = đầu wav d5). Map X→turtle_m0, còn lại (A..G)→turtle_mO, swap trực tiếp sprite (không crossfade). Idle giữa các cue: turtle_walk.
- Audio: `staticFile('character-performer/kids/depth_demo/d5_turtle.wav')` (copy từ dialogue_v2) + BGM `assets/k_bgm_v2.wav` volume 0.25 nếu dễ, không thì bỏ BGM.
- zZz thỏ: 3 chữ "z" bay lên fade-out chu kỳ 2.5s, vị trí trên đầu thỏ (code vẽ, font tròn dễ thương).
- KHÔNG dùng interpolate với input array giảm dần; mọi mảng input strictly increasing, dài bằng output.

## QC tự làm trước khi kết thúc (bắt buộc)
1. `npx tsc --noEmit` trong remotion-composer: 0 error.
2. Render 3 stills `npx remotion still KidsDepthDemo /tmp/dd_<n>.png --frame=N`:
   - frame 30 (rùa xa, nhỏ, bg hiện rõ depth)
   - frame 150 (rùa giữa đường, scale trung bình)
   - frame 235 (rùa gần, miệng mở nếu trúng cue)
   Mở stills bằng PIL xác认 không trắng trống, rùa có mặt ở cả 3.
3. Render video: `npx remotion render KidsDepthDemo out/kids_depth_demo.mp4 --concurrency=4 --log=error`.

## Report
Ghi `REPORT_DEMO_DEPTH.md` cùng thư mục TASK: bảng assets (file, nguồn gen/img2img, giây, %alpha), đường identity nào đã dùng, các thông số depth ramp cuối cùng, kết quả tsc/stills/render, mọi lỗi và cách xử.

## Checklist kết thúc (làm đúng thứ tự, KHÔNG re-verify assets đã QC)
- [ ] 9 ảnh gen + prompt.txt + PIL check
- [ ] KidsDepthDemo.tsx + Root register + tsc 0 error
- [ ] 3 stills QC tự kiểm
- [ ] render out/kids_depth_demo.mp4
- [ ] REPORT_DEMO_DEPTH.md
