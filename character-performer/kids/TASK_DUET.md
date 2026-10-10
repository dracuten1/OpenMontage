# Task: Bộ đôi Thỏ + Rùa — video đối thoại 2 nhân vật code-drawn (mở rộng từ KidsRabbitCode)

## Context
Trong repo này đã có `remotion-composer/src/KidsRabbitCode.tsx` — thỏ trắng SVG parametric code-drawn, lip-sync viseme interpolate, hop theo closed-run. Task: **thêm nhân vật Rùa + dựng video đối thoại 2 nhân vật** theo cùng kỹ thuật.

## REQUIRED READING
1. `remotion-composer/src/KidsRabbitCode.tsx` — đọc kỹ toàn bộ, TÁI DỤNG mọi helper/param viseme có thể (không copy-sửa tùy tiện, tách phần dùng chung nếu sạch)
2. `.agents/skills/javascript-animation/SKILL.md` — deliver-and-verify loop bắt buộc như lần trước
3. `character-performer/kids/REPORT_CODE.md` — các params đã QC pass (viseme table, hop closed-run, blink)

## Assets (đã chuẩn bị, trong `remotion-composer/public/character-performer/kids/dialogue/`)
- `timeline.json` — 8 câu: `{lines:[{i, who:"rabbit"|"turtle", text, start, dur}], total: 28.4}` — `start` là thời điểm câu bắt đầu trong timeline chung
- `d{i}_rabbit.wav` / `d{i}_turtle.wav` (8 files) + `d{i}_cues.json` — mouthCues của TỪNG CÂU (t=0 = đầu file wav, KHÔNG phải timeline chung — phải cộng `start`)
- `bgm_dialogue.wav` — BGM 32s đã fade (volume ~0.3)
- Background: `../k_bg_clean.png` (đồng cỏ, tái dùng)

## Yêu cầu
1. **Rig Rùa Vàng mới** (code-drawn, đồng phong cách thỏ): mai vàng-đỏ tròn với hoa văn, đầu to xanh olive, mắt to hiền, má hồng nhạt, 4 chân mập, kid-friendly. Idle riêng: đầu thò thụt nhẹ (peek cycle), chậm và đều (turtle personality) — KHÔNG hop như thỏ. Nháy mắt chậm hơn thỏ (cycle ~4s). Khi nói: gật nhẹ nhàng (không speech-nod dồn như thỏ).
2. **Staging 2 nhân vật** 1080x1080: Thỏ đứng x~0.32 trái, Rùa x~0.68 phải, nhìn hướng nhau (thỏ mirror, hoặc pupil/whisker hướng vào giữa). Nhân vật KHÔNG nói → miệng closed-smile + idle (chỉ nhân vật nói mới lip-sync theo cues của câu + start offset). scale: thỏ ~0.78, rùa ~0.62 (rùa lùn hơn).
3. **Lip-sync 2 track**: miệng nhân vật nói animate theo `d{i}_cues.json` dịch-offset `start`. Giữa các câu giữ closed-smile. Transition giữa các frame vẫn interpolate 70ms easeOutCubic.
4. **Reaction poses** (tùy chọn nhưng đáng làm): khi thỏ nói câu 4 ("ngủ chút đã") → thỏ gục đầu/zZz; câu 6 thỏ giật mình (tai dựng); câu 7 rùa mỉm cười tự hào. Nếu phức tạp quá thì tối thiểu: idle-attentive cho người nghe (nhìn về người nói, gật nhẹ theo nhịp câu).
5. **Comp mới** `KidsRabbitTurtleDuet` trong `remotion-composer/src/KidsRabbitDuet.tsx`, register Root.tsx. Duration = total 28.4s + 1.2s đuôi → 30s = 900 frames @30fps. KHÔNG đụng comp cũ.
6. **Audio**: 8 file wav ghép đúng `start` (Remotion `<Audio startFrom>`/`volume` hoặc concat bằng ffmpeg trước rồi 1 file — chọn cách sạch). BGM volume 0.3. **Kiểm tra không chồng tiếng**: các câu không giao nhau (đã có gap 0.45s).
7. **Render + deliver-and-verify loop**: extract ≥8 frames (mỗi nhân vật ≥3 khoảnh khắc đang nói + 1 frame cả hai idle + 1 frame end), crop mặt mỗi nhân vật kiểm tra miệng. FAIL → fix → re-render.
8. Output: `character-performer/renders/kids_duet.mp4`. Tiêu đề "Rùa và Thỏ 🐰🐢" top, không đè đầu nhân vật.

## Báo cáo: `character-performer/kids/REPORT_DUET.md` — staging, offset cues math, QC từng frame pass/fail, duration/size.
