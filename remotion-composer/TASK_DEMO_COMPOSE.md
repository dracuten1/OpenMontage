# TASK DEMO COMPOSE — KidsStoryEp1RemakeDemo (REMAKE Ep.01, cảnh d5 demo)

Workdir: /Users/tuyennguyen/project/OpenMontage/remotion-composer (CHÍNH XÁC path này)
KHÔNG render. Chỉ viết TSX + register + `npx tsc --noEmit` sạch. ≤22 turns.

## MỤC TIÊU
1 file mới `src/KidsStoryEp1RemakeDemo.tsx` — demo điện ảnh hoá cảnh khó nhất (2 nhân vật
tương tác + đi xa→gần): rùa đi từ xa vào gần + dừng nhìn thỏ ngủ + nói chuyện + vượt qua
thỏ ngủ (occlusion). 3 shot: establishing → medium tracking → close. 1080×1080 @30fps,
285 frames (9.5s). Pure function of frame (no Math.random/Date).

## QUY TẮC CHẾT
- KHÔNG BAO GIỜ Read file .png (chỉ PIL nếu cần — không cần, mọi số đo có sẵn dưới đây).
- Được Read TỐI ĐA 3 file: `src/KidsStoryEp1V2.tsx` (copy component Talking/Sprite/
  SwapCycle/Zzz + openAmt/ip/env/polyLerp helpers), `src/Root.tsx` (register), và 1 trong
  các JSON asset nếu thật sự cần. Mọi fact khác ĐÃ NHÚNG dưới đây — dùng nguyên văn.

## ASSET PATHS (public/character-performer/kids/…)
- BG back: `remake/bg_d5_back.png` (1536×1024 RGB) — vẽ trong wrapper 1620×1080, left −270
  (cover-fit: viewport thấy bg x 16.7–83.3%).
- Cây: `remake/tree_clean.png` — reg (px absolute, canvas 1223×1286): t=0,b=1278,cx=0.49959,
  chf=0.99378, cwf=0.99918.
- Thỏ ngủ: `sprite_lib/rabbit/rabbit_sleeping.png` — reg (FRACTION sẵn): w=1302,h=918,
  t=0.0087,b=0.9902,cx=0.4996,chf=0.9815,cwf=0.9869.
- Rùa walk frame1: `depth_demo/turtle_walk.png` — reg px (canvas 1535×1024): t=100,b=923,
  cx=0.50554,chf=0.80371,cwf=0.95114.
- Rùa walk frame2: `remake/turtle_walk2.png` — reg px: t=98,b=945,cx=0.50195,chf=0.82715,
  cwf=0.96221.
- Rùa walk mO (patch source): `remake/turtle_walk_mO.png` — reg px (canvas 1534×1025):
  t=99,b=925,cx=0.50587,chf=0.80585,cwf=0.95306.
- Rùa đứng-nghiêng phải m0: `depth_demo/turtle_side_m0.png` + mO `depth_demo/turtle_side_mO.png`
  — reg fraction: m0 t=0.0938,b=0.9072,cx=0.5101,chf=0.8135,cwf=0.9564; mO t=0.0938,
  b=0.9082,cx=0.5101,chf=0.8145,cwf=0.9598.
- Mouth patches (mouth_reg.json): key `turtle_walk` = file `ep1_v2/mouths/turtle_walk_mouthO.png`,
  x0f 0.79, y0f 0.46, x1f 0.93, y1f 0.62 (fractions trên canvas turtle_walk_mO); key
  `turtle_side` = file `ep1_v2/mouths/turtle_side_mouthO.png`, x0f 0.9199, y0f 0.4795,
  x1f 0.9805, y1f 0.5674 (canvas turtle_side_mO).
- FG cỏ: `depth_demo/strip_fg.png` (2172×724, 3:1).
- Audio: `dialogue_v2/d5_turtle.wav` (6.14s) bắt đầu ở demo t=1.6 (frame 48); cues
  `dialogue_v2/d5_cues.json` mouthCues — cue time = t − 1.6. BGM `k_bgm_v2.wav` volume 0.3 loop.

LƯU Ý REG px vs fraction: entries px (t=100…b=923) phải chuyển fraction (t/1024, b/1024)
khi build bảng REG thống nhất. Content bottom-center pin: left = x − imgW*cx, top = y − imgH*b,
imgH = H/chf, imgW = imgH*(w/h).

## STAGING (viewport 1080×1080, toạ độ ĐÃ convert từ bg — dùng NGUYÊN VN, không đo lại)
- Cây: base (810, 660), H 640 (canopy tràn mép trên khung — chủ ý).
- Thỏ ngủ: center (770, 690), H 170, thở scale ±0.8% chu kỳ 3s (origin đáy).
- zZz: 3 glyph pulse chu kỳ 2.5s quanh (695, 540), bay lên tối đa −80px, size 26→46,
  màu #5B7C99 (hoặc #3a2e2a), opacity sin.
- FG strip: container bottom 0 cao 300, ảnh hiển thị W 1620 H 540, bottom 0, mask gradient
  mép trên (transparent→black 45%), filter blur(2.5px) — depth-of-field tiền cảnh.

## RÙA — state machine (t = frame/30)
Walk-cycle: hard-swap turtle_walk ↔ turtle_walk2 mỗi 8 frame (267ms), phase global f0=0
(NHỊP ổn định xuyên suốt, không reset khi cắt shot). Waddle rotate ±3° sin chu kỳ 1.15s
(chỉ khi đang bước).

- Shot A 0.00→2.45 (ESTABLISHING WIDE): polyline [(486,466,H60),(500,530,H85),(508,568,H112)],
  u=clamp01(t/2.45) easeInOutQuad. Nói từ t=1.6 (patch turtle_walk).
- CUT tại 2.45.
- Shot B 2.45→5.90 (MEDIUM TRACKING): polyline
  [(505,585,H125),(455,650,H180),(400,730,H250),(372,800,H300),(365,845,H330)],
  u=clamp01((t−2.45)/3.45) easeInOutCubic. GLANCE BEAT 4.0→4.6: rotate thêm −6° easeInOut
  (nhìn sang thỏ bên phải) + tốc độ path nhân 0.35 trong beat (đèn path tiến chậm lại).
- CUT tại 5.90.
- Shot C 5.90→6.90 (CLOSE APPROACH): polyline [(368,838,H340),(430,858,H380),(560,872,H440),
  (600,875,H455)], u=clamp01((t−5.9)/1.0) easeOutQuad. Vẫn walk-swap + patch turtle_walk.
- STOP 6.90→8.00: đứng yên (600,875,H455). Tại 6.90 hard-swap body → turtle_side_m0 +
  landing squash scaleY 0.95→1.00 trong 0.12s easeOutCubic (che cú đổi pose). Nói bằng
  patch turtle_side (miệng nghiêng phải). Bob nhẹ ty = −4*sin(2π(t−6.9)/1.6).
- EXIT 8.00→9.47: polyline [(600,875,H455),(700,930,H500),(780,990,H560),(880,1080,H620)],
  u=clamp01((t−8.0)/1.47) easeInQuad (accelerate). Walk-swap trở lại + patch turtle_walk.
  Rùa ĐÈ LÊN thỏ+gốc cây lúc đi qua (occlusion) — z-order đã xử.
- 9.47→9.50: frame cuối — rùa ra khỏi khung góc dưới-phải, thỏ ngủ + zZz + đường trống.

Mouth openAmt: cue X→0, khác X→1, fade 70ms 2 chiều (dùng openAmt của V2). Body sprite
LUÔN full opacity — patch overlay fade (KHÔNG crossfade whole-sprite).

## CAMERA (điện ảnh: cut + punch + track, KHÔNG crossfade camera)
- Shot A: camZ 1.00→1.045 easeInOutQuad; TX=0, TY=0.
- Shot B: cut → camZ 1.30, rồi 1.30→1.22 easeOutQuad hết shot; TX = −(turtleX−430)*0.45
  (turtleX = x hiện tại của rùa) nhưng SMOOTH: TX áp qua interpolate thời gian với hệ số
  khối ~0.85 mỗi frame không được — DÙNG pure: TX(t) = −(polyX(t)−430)*0.45 với polyX là
  path đã ease (tự nhiên mượt vì path mượt); TY = −(turtleY−700)*0.25.
- Shot C: cut → camZ 1.12, → 1.05 easeOutQuad lúc 8.0, → 1.03 lúc 9.5; TX +18→0 linear,
  TY 0→+8 linear (drift nhẹ).
Transform camera: `translate(TX,TY) scale(camZ)`, origin 540px 540px, áp LÊN world.
An toàn mép: camZ≤1.30, |TX|≤40 → bg 1620 không lộ mép đen (đã kiểm công thức).

## PARALLAX (depth — mỗi layer một hệ số k trên TX/TY/camZ−1)
Parallax wrapper: transform = `translate(TX*k, TY*k) scale(1+(camZ−1)*k)`, origin center.
- BG back: k=1.0. Rùa: k=1.18 (cùng vẽ trong world back nhưng k riêng — server offset nhỏ
  chấp nhận, đường rộng). Cây+thỏ+zZz: k=1.10 (gói chung 1 div). FG strip: k=1.38.
DOM order (z): BG → (cây,thỏ,zZz) → rùa → FG strip.

## SHADOW
Mỗi nhân vật: ellipse bóng (radial-gradient) dưới chân — rộng ~0.72×content-width, cao
~0.18×, opacity 0.10→0.25 tăng theo độ gần, blur 8px. Rùa + thỏ đều có.

## ROOT REGISTER
`src/Root.tsx`: thêm Composition id `KidsStoryEp1RemakeDemo`, component KidsStoryEp1RemakeDemo,
durationInFrames 285, fps 30, width 1080, height 1080. KHÔNG đụng comp khác.

## HOÀN TẤT = 
1) file tsx tồn tại, 2) `npx tsc --noEmit` exit 0 (chạy từ remotion-composer/, in kèm),
3) báo cáo: số dòng TSX, tsc output. KHÔNG render mp4.
