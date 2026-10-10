# Task: Rebuild the kids character animation using iart-ai javascript-animation skill (code-drawn frames)

## Context
Folder: `character-performer/kids/` trong repo này. Hiện đã có 3 phiên bản: sprite-swap, layered sprites, rigged SVG (`KidsRiggedRabbit.tsx`). User muốn làm lại theo kỹ thuật "every frame drawn in JavaScript" của iart-ai motion-skills.

## REQUIRED READING (before any code)
1. `.agents/skills/javascript-animation/SKILL.md` + references của nó — kỹ thuật code-drawn animation, làm theo deliver-and-verify loop (render frame → screenshot → check)
2. `.agents/skills/generative-illustration/SKILL.md` — cách vẽ illustration bằng code
3. `.agents/skills/motion-art-direction/SKILL.md` + `.agents/skills/color-motion/SKILL.md` — motion fundamentals: easing, timing, squash-stretch

## Assets có sẵn (TÁI DỤNG, không gen thêm)
- Background: `character-performer/kids/assets/k_bg_clean.png` (đồng cỏ children's book, KHÔNG nhân vật)
- Narration: `remotion-composer/public/character-performer/kids/k_narration_v2.wav` (15.28s tiếng Việt)
- Mouth cues: `remotion-composer/public/character-performer/kids/k_mouthcues_v2.json` — format `{metadata, mouthCues:[{start,end,value}]}`, value A-X (94 cues)
- BGM: `remotion-composer/public/character-performer/kids/k_bgm_v2.wav` (volume ~0.32)

## Yêu cầu
1. **Character 100% vẽ bằng code** (SVG/Canvas trong React): thỏ trắng mascot kid-friendly — đầu to, tai dài hồng, má hồng, áo đỏ vest, children's-book style nét dày. Theo đúng craft trong skill (easing chuyên nghiệp, không linear).
2. **Lip-sync theo mouth cues**: miệng parametric theo viseme A-X (nhưng MỚI hơn bản cũ: thêm chuyển tiếp mượt giữa viseme — interpolate rx/ry trong ~70ms thay vì hard swap)
3. **Idle life**: blink có duyên (đôi khi double-blink), tai flop lag, breathing, head tilt; squash-stretch khi nhảy cuối câu (cue gaps >350ms)
4. **Composition mới** trong `remotion-composer/src/` (id `KidsRabbitCode`), 1080x1080@30fps, duration khớp audio (17s = 510 frames). Register trong Root.tsx. KHÔNG đụng các comp cũ.
5. **Render + self-QC theo deliver-and-verify loop của skill**: render xong extract ≥4 frames tại các A-cue times + 1 frame blink + 1 frame end, tự inspect (crop zoom mặt) — nếu mắt/miệng lệch, fix rồi render lại. Tiêu đề "Rùa và Thỏ 🐰🐢" không đè chân nhân vật.
6. Output: `character-performer/renders/kids_rabbit_code.mp4`
7. Constraint: KHÔNG video model, KHÔNG image-gen (character thuần code), render bằng Remotion đã có sẵn trong `remotion-composer/`.

## Báo cáo cuối (viết vào character-performer/kids/REPORT_CODE.md)
- Kỹ thuật dùng từ skill nào, điểm khác biệt vs bản rigged SVG cũ
- QC frames pass/fail từng mục
- Duration + size + các viseme interpolation params
