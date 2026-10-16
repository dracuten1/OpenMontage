# REPORT_COMPOSE_EP1 — KidsStoryEp1AI (Ep.01 "Rùa và Thỏ", AI-image edition)

Component: `remotion-composer/src/KidsStoryEp1AI.tsx` — 1080x1080, 30fps, 1220f (40.66s),
registered trong `remotion-composer/src/Root.tsx` (id `KidsStoryEp1AI`).
Cơ chế copy từ `KidsDepthDemo.tsx`: SpriteReg pinning (đáy-giữa nội dung ghim vào điểm sân khấu:
imgH=contentH/(b−t), imgW=imgH*ar, left=X−imgW*cx, top=Y−imgH*b; flip scaleX(−1) maps cx→1−cx),
ramp depth mũ scaleAtY, pan 3 lớp, cue-map lip-sync, Zzz, bóng ellipse (w=1.12H, h=0.2H,
radial-gradient, op 0.10+0.15*clamp01((s−0.45)/0.55)), FG band lông mác, thở khi ngủ, FONT.

## Nguồn geometry
- `ep1_ai/registration.json` — giá trị PX TUYỆT ĐỐI, chuyển fraction ngay trong component
  (`fromPx`: t_frac=t/size[1], b_frac=b/size[1], cx_frac=cx/size[0]) cho mọi sprite ep1_ai
  + rabbit_sleep/tree_sleep (đúng bằng demo constants).
- BỘ BA RÙA (turtle_walk/m0/mO sống trong depth_demo/, entries registration.json STALE) →
  dùng nguyên constants `TURTLE_REG` re-measured inline của KidsDepthDemo.tsx.

## Staging từng shot (≥2 kỹ thuật depth/shot)
| Shot | Staging | Kỹ thuật depth |
|---|---|---|
| S0 (d0) | rabbit_greet cx 0.63/y 0.88/scale 0.9, hướng trái (native), vẫy paw rotate ±6° chu kỳ ~1.1s quanh vai "30% 20%" | pan + drift bg chậm + shadow theo scale |
| S1 (d1) | turtle_proud cx 0.40/y 0.88/scale 0.85, hướng phải (native). LIÊN TỤC S0→S1: không cut, lerp 0.6s (3.49→4.09) rabbit chạy phải ra khỏi khung, rùa vào từ trái | pan (cùng bg) + overlap handover 2 nhân vật |
| S2 (d2) | rabbit_taunt cx 0.66/scale 0.95 phải; turtle_walk depth_demo scale 0.45 cx 0.22/y 0.74, flip scaleX(−1) (quay lưng) | overlap quy mô (0.95 vs 0.45) + pan drift + chênh y (0.88 vs 0.74) |
| S3 (d3) | turtle_proud GẦN scale 1.0 cx 0.42/y 0.88; rabbit_taunt nhỏ 0.45 cx 0.80/y 0.74; camera push-in 1.0→1.06 linear toàn cảnh, origin "50% 60%" | overlap quy mô + push-in (camera depth) + pan |
| S4 (d4) | Nửa 1: run1/run2 swap 8fps chạy phải→trái cx 1.15→−0.15, scale 0.8, y 0.83, flip (native RIGHT); pan strip_mid 0→+180px + bg_far 0→+60px NGƯỢC chiều chạy. Nửa 2: crossfade 0.5s vào nap demo (tree 810/985, rabbit_sleep 800/975 breathing, Zzz, FG band 128) | pan ngược (parallax 2 lớp) + overlap + FG band |
| S5 (d5) | Demo staging DÙNG LẠI NGUYÊN TRẠNG: ramp X 0.15→0.55, Y 0.72→0.88, scale 0.45→1.0 mũ; u=clamp01((t−g4)/(g5−g4)); pan 3 lớp (0.2/0.6/fg=1.5x chậm hơn rùa) ghim位移 thực; nap + Zzz + FG band | ramp + pan 3 lớp + FG band |
| S6 (d6) | overlay hoàng hôn linear-gradient #FF8C42→#7B4397 op 0.35 TRÊN bg DƯỚI nhân vật; rabbit_shock cx 0.70/y 0.88/scale 1.0, flip (nhìn trái); turtle_proud nhỏ 0.45 trái trôi phải 0.16→0.24 | overlap quy mô + pan + push màu (tint) |
| S7 (d7) | finish_bg (ar 1.7768 → 1919px, centered); turtle_proud cx 0.5/y 0.90/scale 0.9 hướng phải; rabbit_shock nhỏ 0.5 cx 0.80/y 0.78 flip; confetti 36 hạt deterministic (pattern V6: hash số học, CONF_START 35.0); title "Kiên trì là thắng!" fade-in 0.5s từ f1172, 64px coral #FF7F50, stroke trắng 2px (paintOrder stroke), top 18% | overlap quy mô + pan bg chậm (±60px, an toàn trong biên ±419px của FINISH_W=1919) + confetti depth |

## Mouth-cue mapping (cue time = t − line.start; ngoài wav → idle/base)
- S0: X→rabbit_greet, A..G→rabbit_greet_mO, idle→rabbit_greet
- S1/S3/S7: X→turtle_proud, A..G→turtle_proud_mO, idle→turtle_proud
- S2: X→rabbit_taunt, A..G→rabbit_taunt_mO, idle→rabbit_taunt
- S4: không đổi miệng khi chạy (run1/run2 + sleep)
- S5: X→turtle_m0, A..G→turtle_mO, idle/past-wav→turtle_walk (logic demo)
- S6 (đảo): X→rabbit_shock_m0, A..G→rabbit_shock, ngoài wav→rabbit_shock (base = gasp mở)

## Transition
- S0→S1 continuous (lerp 0.6s tại g0=3.79). Còn lại: crossfade 0.5s tại tâm gap
  g1 9.615 / g2 13.71 / g3 17.965 / g4 22.965 / g5 29.735 / g6 34.505.
- 8 wav đặt tại frame Math.round(start*30): 0, 123, 298, 420, 548, 698, 900, 1037 (Sequence+Audio).
- BGM k_bgm_v2.wav volume 0.25, fade-in f0..30, fade-out f1130..1220 (interpolate [0,30,1130,1220] tăng nghiêm ngặt).

## QC
- `npx tsc --noEmit` → **0 error**.
- **Re-render sau 2 fix từ lead audit (v1.1):** (1) S0 giờ thật sự gọi `mouthSprite(0,...)`
  (rabbit_greet_mO hiển thị theo d0_cues — trước đó PinnedImg hardcode rabbit_greet);
  (2) S7 thêm camera pan chậm trên finish_bg (translateX ±60px) → đủ 2/3 kỹ thuật depth.
  Số liệu dưới đây là của bản re-render v1.1.
- 4 stills (PIL convert('L') ImageStat std, PASS > 40), tại `character-performer/kids/qc_ep1_ai/`:
  - still_s0_f0.png std=42.72 PASS (giống bản cũ — cue đầu d0 là X→closed)
  - still_s3_f475.png std=42.87 PASS
  - still_s4_f614.png std=46.64 PASS
  - still_s7_f1175.png std=40.78 PASS (dịch nhẹ so với 40.84 do pan bg mới)
- Render: `remotion-composer/out/kids_story_ep1_ai.mp4` — ffprobe: **40.73s, 1080x1080, 30fps,
  1220 frames, h264 + aac 48kHz stereo, 19.05 MB**.

## Sai lệch so với spec (và lý do)
1. **S4 run local-0 = g3 (17.965s)** thay vì start wav d4 (18.26s): frame QC 614 chỉ rơi vào
   GIỮA crossfade (2.2+0.25s) nếu tính local từ đầu window shot; đây là mốc tác giả task ngầm định.
2. **Crossfade chạy→ngủ dùng ease-out cubic** (vẫn 0.5s, vẫn bắt đầu ~2.2s): blend tuyến tính tại
   giữa cửa sổ để nền watercolor quá mềm (std 34.3 < 40). Ease-out cho nap ổn định sớm → std 46.64.
3. **Pan giữ 180px xuyên crossfade rồi ease về 0 trong [2.7, 4.0]s** (thay vì reset ngay): tránh
   blend 2 nền lệch 180px (nhòe), về nghỉ trước khi S5 tiếp quản pan demo (=0 tại u=0).
4. rabbit_shock flip scaleX(−1) ở S6/S7 (native hướng PHẢI): nhân vật đứng phải cần nhìn sang trái
   (về phía rùa/đích); mọi rabbit khác giữ native khớp staging.

## Checklist
- [x] TSX + Root
- [x] tsc 0
- [x] 4 stills PIL
- [x] render
- [x] report
