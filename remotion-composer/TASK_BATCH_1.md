# TASK BATCH COMPOSE-1 — KidsStoryEp1Remake (toàn tập 8 shot, phần 1/2)

Workdir: /Users/tuyennguyen/project/OpenMontage/remotion-composer (copy nguyên văn)
KHÔNG render. ≤22 turns. Được Read TỐI ĐA 2 file tsx: `src/KidsStoryEp1V2.tsx` và
`src/KidsStoryEp1RemakeDemo.tsx` (lấy component + số liệu). JSON thì IMPORT như V2
(import ... from "../public/..."), không cần Read.

## MỤC TIÊU
File `src/KidsStoryEp1Remake.tsx` — comp `KidsStoryEp1Remake`, 1080×1080 @30fps,
1230 frames (41.0s). Audio: 8 line dialogue_v2 (timeline.json) + BGM k_bgm_v2 0.3 loop.
Pure function of frame. Phần 1/2: scaffold + shared components + S0–S3 HOÀN CHỈNH;
S4–S7 là STUB chạy được (bg + audio đúng cửa sổ, placeholder tối giản) — session sau填.

## NHÁP KIẾN TRÚC (làm theo)
1. REG gộp: import sprite_reg.json (ep1_v2) + remake/reg.json (px→fraction: t=tpx/h,
   b=bpx/h) + mouth_reg.json. Component: Sprite (bottom-center pin, shadow ellipse),
   Idle (squash-stretch 1.7s), SwapCycle (hard-swap every N frame, phase global),
   Talking (body full-opacity + mouth patch fade 70ms, tier map A=1/B,C,G,H=0.66/
   D,E,F=0.4/X=0 — COPY nguyên logic tier + fade từ KidsStoryEp1RemakeDemo.tsx),
   Zzz, Confetti (mulberry32 seed 20261011, 40 hạt — copy từ V2), EndCard (copy V2,
   text "Kiên trì là thắng!"). LƯU Ý mouth_reg key: rabbit_front, turtle_front,
   rabbit_taunt, turtle_proud, turtle_side, turtle_walk (file + x0f..y1f sẵn).
2. Camera wrapper toàn cục: transform translate(TX,TY) scale(camZ) origin 540,540.
   Camera state machine theo bảng SHOTS dưới (cut tức thời, KHÔNG crossfade camera).
3. Backgrounds: mỗi scene 1 ảnh cover-fit 1620×1080 (left −270), Ken Burns scale/dx
   nhẹ; chuyển scene = crossfade 0.5s trừ các CUT trong bảng (cut cứng). Bảng bg:
   bg1_start (ep1_v2), bg3_duel (ep1_v2), bg6_walk (ep1_v2), remake/bg_d5_back
   (remake, KHÔNG còn banner), bg8_finish (ep1_v2).
4. Demo-layer stack (chỉ dùng cho scene demo-bg): Parallax k: bg 1.0 / (tree+thỏ+zZz)
   1.10 / rùa 1.18 / fg strip_fg blur(2px) mask 55% 1.38 — copy từ Demo tsx.

## TIMELINE audio (timeline.json, giây) — NHÚNG, đừng đổi
d0 rabbit 0–3.49 · d1 turtle 4.09–9.31 · d2 rabbit 9.91–12.93 · d3 turtle 13.53–17.19 ·
d4 rabbit 17.79–22.19 · d5 turtle 22.79–28.94 · d6 rabbit 29.54–33.48 · d7 turtle 34.08–39.59

## SHOTS (thời gian episode, giây) — S0–S3 phần này; S4–S7 stub

S0 bg1_start:
- 0.00–1.75 WIDE: rabbit_front_m0 Talking (patch rabbit_front, cues d0, t0 0 t1 3.49)
  x380 y880 H310 spring-in (damping 12); turtle_front_m0 Idle x700 y845 H230 spring.
  camZ 1.00→1.04 easeInOutQuad.
- 1.75–3.90 MEDIUM: cut camZ 1.30 origin (540,700) (giữ 2 nhân vật, rabbit vẫn nói
  tới 3.49). Turtle bob-nod (ty −8 spring) lúc 2.3–3.2 ("bạn Rùa Vàng").
- 3.90 crossfade sang bg3 (0.5s).

S1 bg3_duel:
- 4.09–6.40 MEDIUM 2-shot: turtle_front_m0 Talking (patch turtle_front, t0 4.09 t1 9.31)
  x710 y885 H260; rabbit_greet_mO Idle x350 y880 H310 (nghe, hop nhẹ 4.9/7.8 h 24).
  camZ 1.05, dx −26→26 (Ken Burns).
- 6.40–9.40 PUNCH: cut camZ 1.28 origin (700,800) — cận rùa nói tiếp; thỏ ló mép trái.

S2 bg3_duel:
- 9.91–10.90 MEDIUM ĐỐI ĐẦU: rabbit_taunt Talking (patch rabbit_taunt, t0 9.91 t1 12.93)
  x350 y880 H310 scaleX −1 (mặt PHẢI); turtle_side_m0 Idle x710 y885 H260 scaleX −1
  (mặt TRÁI) — hai nhân vật NHÌN NHAU. camZ 1.08.
- 10.90–12.40 CLOSE thỏ: cut camZ 1.35 origin (430,800) — thỏ khinh miệt nói tiếp.
- 12.40–13.45 REACTION rùa: cut — turtle_side_m0 H420 x640 y870 scaleX −1, tilt −5°,
  lùi nhẹ x 710→730; thỏ idle nhỏ bên trái.

S3 bg3_duel:
- 13.53–15.30 MEDIUM ngược: turtle_side_m0 Talking (patch turtle_side, t0 13.53 t1 17.19)
  x710 y885 H260 scaleX −1; rabbit_taunt Idle x350 y880 H310 scaleX −1 (giữ smirk).
- 15.30–17.40 PUNCH rùa: cut camZ 1.30 origin (660,800); gật quyết tâm (ty −10 spring)
  lúc 16.4 ("Chậm mà chắc").

STUB S4–S7 (chỉ để tsc xanh + audio đúng; session sau thay):
- S4 17.79–22.79: render bg6_walk + Audio d4 (KHÔNG nhân vật).
- S5 22.79–29.54: render remake/bg_d5_back + Audio d5 (KHÔNG nhân vật).
- S6 29.54–33.90: giữ nguyên demo-bg + Audio d6.
- S7 33.90–41.00: bg8_finish + Audio d7 + EndCard (.Sequence 38.9*30).
Mỗi stub bọc `<div data-stub="S4"/>` đánh dấu chỗ thay.

## ROOT
Thêm Composition id `KidsStoryEp1Remake` 1230f 30fps 1080×1080 (KHÔNG đụng comp khác).

## XONG = file tồn tại + `npx tsc --noEmit` exit 0 (in output) + báo số dòng.
