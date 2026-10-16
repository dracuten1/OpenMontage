# TASK BATCH COMPOSE-2 — KidsStoryEp1Remake (phần 2/2: điền S4–S7)

Workdir: /Users/tuyennguyen/project/OpenMontage/remotion-composer
File sửa: `src/KidsStoryEp1Remake.tsx` (đã có scaffold + S0–S3 xong + stub S4–S7 đánh dấu
`data-stub="S4..S7"`). KHÔNG render. Read TỐI ĐA 3: file này + `src/KidsStoryEp1RemakeDemo.tsx`
+ `src/KidsStoryEp1V2.tsx` (chỉ nếu cần tham chiếu component — mọi số liệu cần ĐÃ nhúng đây).
≤22 turns. Xong = `npx tsc --noEmit` exit 0.

## NGỮ CẢNH
Comp 1230f (41s). Stub S4–S7 phải thay bằng scene đầy đủ dưới đây. Tái dùng component
chung của file (Sprite/Idle/SwapCycle/Talking/Zzz/Confetti/EndCard/Parallax/camera state).
Đơn vị: giây episode. Audio đã đặt đúng ở scaffold — KHÔNG đụng audio.

## S4 — 17.79 → 22.79 (bg1 → bg6 → demo-bg, 3 nhịp)
- 17.79–18.90 START (bg1_start, crossfade từ bg3 xong 17.4): rabbit_back_m0 x430 y860 H280
  (lưng, quay đi), turtle_back_m0 x640 y850 H220 Idle. Rabbit cúi bật: ty hop 40px tại 18.30
  (spring dập 10). KHÔNG camera move.
- 18.90–20.90 SPRINT (CUT sang bg6_walk): SwapCycle rabbit_back_m0 ↔ rabbit_back_run2
  every 5 frame, path polyline BG6: X=[556,524,508,572,540], Y=[972,810,648,518,400],
  H=[400,170] (H nội suy tuyến tính theo u), u=clamp01((t−18.9)/1.8) easeOutQuad —
  thỏ chạy XA dần nhỏ lại (depth). Rùa không xuất hiện (ở sau). camZ 1.06→1.02.
  Kèm 3 "ghost" mờ phía sau thỏ (bản sprite opacity 0.18/0.10/0.05 lệch pha 3/6/9 frame
  theo path) — cảm giác tốc độ, mượt.
- 20.90–22.79 NAP (CUT sang demo-bg stack đầy đủ: bg_d5_back + tree_clean (870,685,H620)
  + rabbit_sleeping (830,715,H175) thở + zZz master fade-in 21.10 + fg strip): camera push
  1.00→1.04. Warm-tint overlay: div full-frame background rgba(255,150,60,α) blend multiply,
  α = 0→0.12 tăng 21.3→22.79 (chiều chiều trôi).

## S5 — 22.79 → 29.54 (DEMO đã duyệt, nén thời lượng; demo-bg stack giữ nguyên từ S4 —
KHÔNG cắt bg, chỉ cắt camera)
- A 22.30–24.64 ESTABLISHING: turtle walk-in xa (walk-swap every 8f phase global) polyline
  [(478,468,H58),(484,530,H84),(490,568,H110)] u=clamp01((t−22.3)/2.34) easeInOutQuad.
  Nói từ 22.79 (patch turtle_walk, cues d5, t0 22.79 t1 28.94 — COPY Talking tier logic).
  camZ 1.00→1.045. Thỏ ngủ + zZz + tint 0.12 giữ.
- B 24.64–27.09 MEDIUM TRACK: CUT camZ 1.30→1.22 easeOutQuad; TX=−(polyX−430)*0.45,
  TY=−(polyY−700)*0.25. Polyline [(505,585,H125),(455,650,H180),(400,730,H250),
  (372,800,H300),(365,845,H330)] u=clamp01((t−24.64)/2.45) easeInOutCubic; glance beat
  25.90–26.50: rotate −6° + path speed ×0.35 (dùng reparametrization arc-length như Demo).
- C 27.09–29.54 CLOSE: CUT camZ 1.12→1.05 easeOutQuad đến 28.9. Approach 27.09–27.75:
  [(330,830,H350),(360,850,H365)] easeOutQuad. STOP 27.75–28.90: turtle_side_m0 + landing
  squash scaleY 0.95→1 /0.12s + bob ty −4·sin(2π(t−27.75)/1.6) + patch turtle_side (miệng
  nghiêng phải nói với thỏ). EXIT 28.90–29.54: quay lại walk-swap, polyline
  [(360,850,H365),(560,900,H430)] easeInQuad — rùa bắt đầu vượt qua thỏ, CẮT NGANG
  (để d6 tiết lộ kết quả). z-order: rùa TRÊN (tree+thỏ+zZz). Tint 0.12 giữ.

## S6 — 29.54 → 33.90 (demo-bg; 2 shot)
- 29.54–31.90 WAKE CLOSE-UP: zZz cắt ngay 29.54; rabbit_wake_shock (sprite_lib/rabbit/
  rabbit_wake_shock.png, reg key rabbit_wake) tại (830,700) H300 to, camZ CUT 1.40 origin
  (830,640); spring pop-in (damping 9) + jerk rotate: ±4°·e^(−3(t−29.6))·sin(2π·6(t−29.6)).
  Thỏ hoảng: "Ủa… trời tối rồi sao? Rùa ơi!"
- 31.90–33.90 WIDE TRỐNG: CUT camZ 1.02: rabbit_wake nhỏ (830,715,H175) cạnh cây, nhìn
  xuống ĐƯỜNG TRỐNG bên trái (nếu sprite quay phải thì scaleX −1 để mặt hướng trái-trung
  tâm), đường không rùa — "Rùa tới đích trước mình rồi à?" + hold. Tint α 0.12→0.16.
  fg strip + parallax giữ.

## S7 — 33.90 → 41.00 (bg8_finish — vạch đích DÀN DỰNG CHỦ Ý medium, per owner)
- 33.90 CUT sang bg8_finish (tint về 0 ngay). 34.08–36.50 MEDIUM: turtle_proud Talking
  (patch turtle_proud, t0 34.08 t1 39.59) x420 y845 H300, gate/banner khung giữa-phải;
  camZ 1.08 drift dx. Confetti <Sequence from={34.1*30}> (đã có component).
- 36.50–38.50 THỎ VỀ ĐÍCH: SwapCycle rabbit_front_run_m0 ↔ rabbit_front_run2 every 5f,
  từ phải vào: x 950→640, y 713→800, H 90→210, u=clamp01((t−36.5)/1.4) easeOutQuad (chạy
  XA→GẦN camera, mệt hoá chậm dần). 37.90: đáp về rabbit_front_m0 Idle (640,800,H210),
  cúi đầu rotate 6° (thẹn) — interaction: rùa proud gật (bounce ty −8 spring 38.2).
- 38.50–41.00 END: giữ 2 nhân vật (thỏ lệch phải cúi đầu, rùa trái tự hào + bob nhẹ),
  EndCard <Sequence from={38.9*30}> (đã có), confetti tiếp. BGM volume = interpolate
  t [40.2,41.0] → [0.3,0.12] (fade nhẹ cuối).

## CHÚ Ý
- Mọi window đổi sprite dùng fade 0.15s (env) trừ hard-swap walk/run và các CUT.
- KHÔNG đụng S0–S3 đã xong, KHÔNG đổi comp id/duration, KHÔNG render.
- Stub div xóa sạch sau khi điền.
- Report: dòng đã sửa, tsc output, xác nhận 4 stub hết.
