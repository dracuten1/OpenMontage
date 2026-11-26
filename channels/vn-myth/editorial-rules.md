# VN-Myth — Channel Editorial & Visual Contract

- **Platform:** YouTube (`1920x1080`, 16:9, 30 fps)
- **Playbook / Theme:** `ink-genome` / `vn-myth` (Warm Archival Diorama)

## Visual & Storytelling Rules

1. **Palette:** Bazan Đêm (`#1A1512`), Sáp Đen (`#100C0A`), Giấy Dó Ngà (`#F2EAD8`), Đồng Chiêng (`#D49B38`), Gỗ Trầm (`#6B4226`).
   - **Layer A (Sử thi / Folklore):** Thổ cẩm đỏ đô (`#9E3B24`)
   - **Layer B (Ngôn ngữ & Thiết chế):** Xanh đại ngàn (`#38665E`)
   - **Layer C (Khảo cổ & Dữ liệu):** Đồng chiêng (`#D49B38`)
2. **Typography:** `Playfair Display` / `Noto Serif` (display headings), `Be Vietnam Pro` / `Noto Sans` (body & captions), `JetBrains Mono` (archival metadata/coordinates).
3. **16:9 Safe Zone:** Margin `96px` horizontal, `54px` vertical; content band `y: 140..910` (`maxW: 1728`), burned-in subtitles in `y: 940..1030` (`maxW: 1600`).
4. **Diorama & Tracked Callouts:** Use shared `remotion-composer/src/channels/vn-myth/diorama.tsx` (`CrossfadeLoopVideo`, `SceneTrackedCallouts`) for Blender loop clips and 3D-to-2D screen-tracked callouts instead of duplicating per-episode `common.tsx`.
5. **Audio & Lexicon:** Documentary pacing (`speed: 1.0`, target `-14.0 LUFS`). Maintain canonical Vietnamese folklore & historical chronicle respellings in `tts_lexicon.json`.
6. **Audience & Debate Framing (Vietnamese Perspective):** Kênh hướng tới khán giả Việt Nam; mọi câu hỏi mở hoặc góc phản biện văn hóa – lịch sử – dân gian đều xoay quanh góc nhìn, ký ức, bản sắc và giá trị đối với người Việt, không đặt câu hỏi chọn phe theo lợi ích của quốc gia hoặc khán giả khác.
