# REPORT_MULTISCENE — Kể chuyện đa cảnh: Rùa và Thỏ (5 background, crossfade + Ken Burns)

Ngày: 2026-10-10 · Task: `TASK_MULTISCENE.md` · Comp: `remotion-composer/src/KidsStoryMultiScene.tsx` (id `KidsStoryMultiScene`, register `Root.tsx` +1 import +1 Composition — không đụng comp cũ)

## Output
- **Video:** `character-performer/renders/kids_story_multiscene.mp4` — 1080×1080 · 30fps · 900 frames · 30.06s · h264+aac · 45.0 MB
- QC frames: `character-performer/kids/qc_multiscene/` (22 file = 19 khoảnh khắc full + 3 crop mặt)
- Rig thỏ+rùa, viseme, blink/hop, sleep/wake/proud envelopes copy nguyên từ `KidsRabbitDuet.tsx` (clipPath id đổi prefix `ms-`). Audio giữ nguyên 8 câu `<Sequence>` + BGM volume 0.3.

## Scene map + times (theo timeline.json)
| Scene | Background | t | Frames | Staging |
|---|---|---|---|---|
| S1 intro | `k_bg_clean.png` (đồng cỏ) | 0 → 7.14 | 0–214 | thỏ x346 / rùa x734 (như duet), chào (i0, i1) |
| S2 challenge | `scenes/sc2_race.png` (vạch xuất phát) | 7.14 → 13.50 | 214–405 | thỏ x366 / rùa x714 (i2 thách đấu, i3 nhận) |
| S3 nap | `scenes/sc3_tree.png` (cây sồi phải) | 13.50 → 20.47 | 405–614 | thỏ trượt x740 **đứng dưới cây**, ngủ zZz 16.45–20.70 (xuyên i4-i5); rùa x640 → **đi đều sang trái 640→260 xuyên suốt i5** (17.69–20.25, linear + waddle ±2.5px) |
| S4 sunset | `scenes/sc5_sunset.png` | 20.47 → 24.77 | 614–743 | thỏ x640 giật mình 20.70 + nói i6; rùa đứng x260 xa trái (yên tĩnh — một chuyển động chính) |
| S5 finish | `scenes/sc6_finish.png` (banner caro) | 24.77 → 30.0 | 743–900 | rùa x430 về đích giữa: proud + nhún nhẹ; thỏ x700 **vỗ tay** (2 tay chạm trước ngực ±52°, 1.5Hz, 26.5–29.5); confetti deterministic 36 hạt rơi 25.5→end |

**`sc4_path.png` KHÔNG dùng** — S3 xuyên suốt nap + rùa đi (task cho phép; sc4 dự phòng).

## Transitions + camera
- 4 crossfade 0.5s, đúng tâm gap thoại: **T12** 6.89–7.39 · **T23** 13.25–13.75 · **T34** 20.22–20.72 · **T45** 24.52–25.02. Không cắt cứng nào.
- Camera (Ken Burns) áp DỰNG lên cả world (bg + nhân vật + zZz + confetti trong 1 container `scale+translate`, origin center); trong crossfade camera params BLEND lerp easeInOutCubic; nhân vật trượt vị trí trong slide window 0.75s phủ kín crossfade:
  - S1: 1.03→1.08, ty 0→−10 · S2: 1.08→1.03, tx 0→−10 · **S3: 1.03→1.08 push-in thuần, KHÔNG drift** (rùa đi bộ là chuyển động chính — quy tắc "một chuyển động chính mỗi thời điểm") · S4: 1.03→1.08, tx 0→+10 ty 0→−6 · S5: 1.08→1.03 pull-out lộ toàn cảnh mừng.
  - Numeric check: S1 t=3.5 scale 1.0545/ty −4.90 → t=6.0 scale 1.0720/ty −8.40 (đơn điệu, tx=0).
- Pupil look hướng generalize theo vị trí động: `sign(turtleX − rabbitX)`; zZz anchor theo rabbitX hiện tại (~x800–860 khi ngủ dưới cây, không cắt mép).

## Title card
"Rùa và Thỏ 🐰🐢" **giữa màn hình** (không phải top như duet), fontSize 96, halo trắng + fill nâu, drop-in easeOutBack f0–f18, fade out hoàn tất 2.5s — không che cảnh 2 (bắt đầu 7.14).

## QC — deliver-and-verify (19 full + 3 crop, lead verify từng ảnh)
| Frame | Thời điểm | Kiểm tra | Kết quả |
|---|---|---|---|
| f030 | 1.0s | S1 đồng cỏ + title giữa màn, thỏ nói i0 miệng mở | **PASS** |
| f105 | 3.5s | title đã mất, cả hai idle, camera push-in (so f30) | **PASS** |
| f208 | 6.93s | **T12 crossfade** blend 50/50 đồng cỏ↔vạch xuất phát, không cắt cứng | **PASS** |
| f259 | 8.63s | S2 bg vạch xuất phát, thỏ nói i2 (crop: miệng mở + lưỡi) | **PASS** |
| f351 | 11.7s | S2 rùa nói i3, thỏ nghe closed-smile, camera pull-back | **PASS** |
| f405 | 13.5s | **T23 crossfade** + nhân vật trượt (thỏ sang phải, rùa sang trái) | **PASS** |
| f424 | 14.15s | S3 bg cây sồi, thỏ ĐÃ DỚI CÂY (phải) nói i4 miệng mở | **PASS** |
| f504 | 16.8s | thỏ NGỦ dưới tán cây (tai rũ, mắt arc) + zZz nổi; rùa chưa đi | **PASS** |
| f543 | 18.1s | rùa ĐANG ĐI giữa cảnh + nói i5 (crop: miệng mở); thỏ ngủ + zZz | **PASS** |
| f598 | 19.93s | rùa tới x≈260 cuối hành trình; thỏ vẫn ngủ dưới cây | **PASS** |
| f615 | 20.5s | **T34 crossfade** cây sồi↔hoàng hôn | **PASS** |
| f636 | 21.2s | S4 hoàng hôn: thỏ GIẬT MÌNH (tai dựng, mắt mở to, miệng khựng), không cắt đầu | **PASS** |
| f667 | 22.23s | thỏ nói i6 miệng mở rộng; rùa yên tĩnh xa trái | **PASS** |
| f741 | 24.7s | **T45 crossfade** hoàng hôn↔vạch đích, nhân vật trượt về vị trí mừng | **PASS** |
| f808 | 26.93s | S5 banner caro + confetti; rùa NGẨNG tự hào nói i7 (crop: đầu ngẩng rõ so f543); thỏ 2 tay chạm trước ngực | **PASS** |
| f820 | 27.33s | vỗ tay tiếp diễn + rùa nhún proud | **PASS** |
| f880 | 29.33s | confetti rơi dày, camera pull-out lộ toàn cảnh, cả hai mừng | **PASS** |
| f895 | 29.83s | frame cuối sạch, không artifact, không cắt nhân vật | **PASS** |

Loop verify dừng ở **round 1 — không cần fix/re-render**. Mọi frame pure function của `useCurrentFrame()` (blink/peek/nod/zZz/confetti = sin + arithmetic hash, không Math.random/Date/CSS animation).

## Ghi chú deviation (đã duyệt)
- Slide window 0.75s (trong biên 0.6–0.9s của brief).
- T23: thỏ-rùa trượt qua nhau có chồng lấp mờ ~0.3s (thỏ vẽ đè trước) — hệ quả vị trí + cửa sổ trượt, nhìn tự nhiên ở tốc độ thật, không phải lỗi.
- Waddle bob rùa 4px local ≈ ±2.5px world (trong group scale 0.62).

## File listing
- Video: `character-performer/renders/kids_story_multiscene.mp4` (45,021,879 bytes)
- Comp: `remotion-composer/src/KidsStoryMultiScene.tsx` · Root.tsx dòng 21 (+import) + 263 (+Composition)
- QC: `character-performer/kids/qc_multiscene/f{030,105,180,208,259,351,405,424,504,543,598,615,636,667,741,808,820,880,895}.png` + `f259_crop_rabbit / f543_crop_turtle / f808_crop_turtle` (f180 dự phòng camera S1)

---

# v2 changes — TASK_V2.md (2026-10-10): giọng mới + bụng rùa + BGM

3 thay đổi theo user; rig/scene map/camera/reactions giữ nguyên cấu trúc, chỉ remap thời gian theo timeline mới.

## Output
- **Video:** `character-performer/renders/kids_story_multiscene_v2.mp4` — 1080×1080 · 30fps · **1188 frames · 39.6s** · h264 + aac 48kHz stereo · 62.7 MB
- Comp `KidsStoryMultiScene` sửa tại chỗ; comp v1 `KidsRabbitTurtleDuet` KHÔNG đụng.

## 1. Audio (đã thay sẵn — không đụng TTS)
Thỏ = **Trúc Ly**, Rùa = **Mỹ Duyên**, atempo 0.87 (~chậm 15%), gap 0.6s, timeline total **38.42s** → comp = 38.42+1.2 ≈ 39.6s = 1188f. `<Sequence>` offsets tự đọc `timeline.json` mới. **BGM volume 0.3 → 0.42** ( KidsStoryMultiScene.tsx:1103).

## 2. Sửa bụng rùa (trọng tâm visual)
V1 sai: rig KHÔNG có bụng — dome (ry 122, đáy ~y837) gần chạm đất, chân lơ lửng dưới rim. Sửa theo childsbook:
- `dome`: cy 715→**700**, ry 122→**96** (mai dẹt bớt) · `rim`: cy 750→**766**, rx 152→**150**, ry 42→**38** (rim hạ sát đáy mai) · spots đổi theo dome.
- **Belly path mới** `#f5e6c8` (be vàng nhạt): dải ngang recessed (hẹp hơn rim), top edge tück dưới rim, đáy cong ~y838, 2 đầu vút tròn — tách rõ khỏi mai vàng đậm.
- Draw order mới: shadow → tail → far legs → **belly** → head/neck → near legs → dome → rim. Chân mọc từ mép bụng; viền cong liền mạch mai→rim→bụng, không khoảng hở.
- Probe fix vòng 2: `neck` ry 52→**64** — bịt dải nền ~10px giữa đáy cổ và viền bụng khi proud (chỉ lộ ở tư thế ngẩng).
- **Before/after (lead verify PASS):** `qc_multiscene_v2/belly_before_after_walk.png` (v1 f543 vs v2 f742) + `belly_before_after_proud.png` (v1 f808 vs v2 f1067).

## 3. Timing remap (gap centers timeline mới)
| Mốc | v1 | v2 |
|---|---|---|
| Scene S1/S2/S3/S4/S5 | 0/7.14/13.50/20.47/24.77 → 30.0 | 0/**9.43**/**18.33**/**27.59**/**32.40** → 39.6 |
| Crossfades (±0.25) | 7.14 · 13.5 · 20.47 · 24.77 | 9.43 · 18.33 · 27.59 · 32.40 |
| Rùa đi (i5) | 17.69–20.25 | **23.0–26.9** (pace chậm hơn, hợp giọng mới) |
| Thỏ ngủ / thức giật mình | 16.45 / 20.7 | **21.35** / **27.69** (trước i6 đúng 0.2s như v1) |
| Proud (i7) / clap / confetti | 25.0 / 26.5 / 25.5+4.5 | 32.6 / 33.7 / 33.1+**6.5** |
| Blinks/hops | — | remap theo tỷ lệ scene mới (16 blink thỏ, 10 blink rùa, hop 3.75 & 13.55 vào gap thoại) |

Title card frame-based giữ nguyên (fade xong 2.5s << S2 mới 9.43s).

## QC v2 — deliver-and-verify (17 frame + 4 crop + 2 montage, lead verify từng ảnh)
| Frame | Kiểm tra | Kết quả |
|---|---|---|
| f45 / f332 / f641 | thỏ nói i0/i2/i4 miệng mở (mid-cue) | **PASS** |
| f191 / f742 / f1067 | rùa nói i1/i5/i7 miệng mở — đứng / đang đi / proud ngẩng (mid-cue) | **PASS** |
| f283 / f550 / f828 / f972 | 4 crossfade đúng tâm gap mới | **PASS** |
| f660 | thỏ ngủ zZz dưới cây + rùa chưa đi | **PASS** |
| f807 | rùa tới x≈260 cuối hành trình | **PASS** |
| f836 | thỏ giật mình thức (tai dựng) | **PASS** |
| f1110 / f1182 | clap + confetti dày / frame cuối sạch | **PASS** |
| Belly before/after ×2 | dải bụng be rõ, liền khối, chân từ bụng | **PASS** |

Lip-sync **6/6** (≥3 câu mỗi nhân vật, mid-cue — không dùng đầu-cue). BGM check volume trong code (0.42) theo task. Không black frame; mọi frame vẫn pure function của `useCurrentFrame()`.

## File listing v2
- Video: `character-performer/renders/kids_story_multiscene_v2.mp4` (65,720,758 bytes)
- Comp: `remotion-composer/src/KidsStoryMultiScene.tsx` (sửa tại chỗ) · `Root.tsx` dòng 265 durationInFrames 1188
- QC: `character-performer/kids/qc_multiscene_v2/` — f{45,191,283,332,488,550,641,660,742,807,828,836,872,972,1067,1110,1182}.png + `v2_f{191,488,742,1067}_crop_turtle.png` + `belly_before_after_{walk,proud}.png` + ffprobe_v2.txt + COMPOSER_FACTS.md

---

# v3 kawaii redesign — TASK_V3.md (2026-10-10): redraw rigs theo design_C_kawaii.png (user ĐÃ DUYỆT)

Redraw 2 rig khớp phong cách sheet kawaii sticker. **Rig mechanics giữ nguyên 100%** (pivots/schedules/envelopes/viseme/blink/hop/clap/sleep-wake-proud, camera, staging, scene map, crossfade, audio 8 wav + BGM 0.42, belly path + draw order rùa) — chỉ đổi hình dạng + kích thước tương đối + màu + độ dày viền. Tỷ lệ chibi + bbox tai đã check số học: tai lũy cực đại (droop −24°/wake +16°) worst world-y 380, đầu nghiêng ±8° worst world-x 199–891 — không tràn viewBox (pitfall v1 né được).

## Output
- **Video:** `character-performer/renders/kids_story_multiscene_v3.mp4` — 1080×1080 · 30fps · **1188 frames · 39.66s** · h264 + aac · 65,556,783 bytes (~65.6 MB)
- Comp `KidsStoryMultiScene` sửa tại chỗ; `tsc --noEmit` sạch; probe vòng 1 PASS ngay không cần fix round.

## 1. Tỷ lệ chibi (thỏ)
| Thông số | v2 | v3 |
|---|---|---|
| HEAD | cx540 cy565 rx150 ry125 | cx540 cy560 **rx175 ry150** (đầu to tròn hơn hẳn) |
| BODY | cx540 cy742 rx120 ry126 | cx540 cy775 **rx115 ry98** (thân ngắn mập, đầu đè lên vest = no-neck chibi) |
| Đầu/tổng chiều cao | ~45% | **56.4%** (target 55-60) — đầu 300px / tai-đỉnh 324 → chân 856 |
| Tai | cy380 ry92, piv y468 | cy402 **ry78** (ngắn tròn hơn), piv y480 — tai ngắn lại để đầu chiếm tỷ trọng |
| Tay/chân | rx21 ry44 / rx52 ry27 | **rx19 ry38 / rx48 ry25** (stub; offset pivot→ellipse giữ (−16,+36) nên clap vẫn gặp nhau trước ngực) |

Rùa: head **rx108 ry92** (was 96/84) to hơn hẳn so với dome rx138 ry94 (was 142/96) = chibi; neck rx58 ry70 (v2 probe-fix giữ tinh thần — proud không hở cổ, crop f1067 verify).

## 2. Mắt sparkle + má hồng (tham số)
| Thông số | v2 | v3 |
|---|---|---|
| Mắt thỏ | rx16.5 ry21, 1 chấm highlight r5.5 | **rx22 ry28 (+33%)** + halo mờ (rx9 ry11, op .25) + **chấm lớn trên-trái r7** + **chấm nhỏ dưới-phải r3** + **sao lấp lánh 4 cánh r4.5** (trong nhóm blink-scale —ép theo chớp mắt) |
| Mắt rùa | rx15 ry19, 1 chấm r5 | **rx19 ry23 (+27%)** + 2 highlight (r6 lớn + r2.6 nhỏ), **không có sao** — rùa hiền hơn thỏ đúng brief |
| Arc blink | ±15, sw8/7 | ±20 thỏ sw9 / ±18 rùa sw8 |
| Má hồng | rx24 ry15 #ffb3c0 op .75 (thỏ), rx20 ry13 op .7 (rùa) | Thỏ **rx31 ry18 #ff9db4 op .85** nghiêng ∓10° · rùa **rx27 ry16 #ff9db4 op .8** nghiêng ∓10° — to rõ, oval nghiêng, hồng candy đậm |
| Miệng idle | arc w30/d22 sw7 | **w38/d26 (rùa proud +8/+6) sw8 + 2 má lún nhỏ** 2 đầu arc |
| Lòng tai thỏ | 2 lớp #ffb7c9/#ff93ad | **3 lớp gradient đậm**: #ffc9d6 → #ff9fb6 → #ff7fa2 |

Viền +15% làm tròn: 12→14 (đầu/thân/dome), 11→13 (rim), 10→12 (tai), 9→10 (chi tiết), 7→8, 5→6; `strokeLinejoin/cap="round"` toàn bộ; OUT giữ #3a2e2a. zZz re-anchor y 500/462/420 → 478/443/406 (đầu v3 cao hơn, không đè tai).

## 3. QC v3 — deliver-and-verify (17 frame từ mp4 + 4 crop + 2 montage so design sheet)
| Frame | Kiểm tra | Kết quả |
|---|---|---|
| f045 | S1 + thỏ nói i0 mid-cue miệng mở + title giữa màn | **PASS** |
| f191 (+crop) | S1 + rùa nói i1 mid-cue — miệng mở, mắt bóng 2 highlight, má nghiêng | **PASS** |
| f332 | S2 vạch xuất phát, thỏ nói i2 | **PASS** |
| f660 | S3 thỏ NGỦ dưới cây: tai rũ 2 bên, mắt arc, zZz không đè tai | **PASS** |
| f742 (+crop) | rùa đang đi nói i5 mid-cue | **PASS** (composer spot-check) |
| f836 | S4 giật mình: tai dựng, mắt mở to | **PASS** |
| f1067 (+crop) | S5 rùa proud ngẩng — cổ→bụng liền mạch (không hở như pitfall v2) | **PASS** |
| f1110/f1121 | clap: tay stub GẶP NHAU trước ngực (f1121 pha chạm, probe phụ) + confetti | **PASS** |
| f1182 | frame cuối sạch | **PASS** (composer spot-check) |
| **compare_rabbit_vs_sheet / compare_turtle_vs_sheet** | **CROP MẶT so design_C_kawaii.png — NHẬN RA CẢ 2 NHÂN VẬT TỪ SHEET** (vest đỏ 2 cúc trắng, tai gradient hồng, mắt bóng star / mai vàng hex + bụng cream + đầu olive chibi) | **PASS — mục tiêu task đạt** |

## 4. Before/after thoughts
- **v2 → v3 khác biệt сразу thấy ở crop mặt:** v2 mắt dẹt 1 chấm sáng → v3 mắt bóng cầu 2 lớp highlight + sao, má từ "phấn nhạt" thành "sticker candy nghiêng", đầu chiếm quá nửa thân — đúng năng lượng emoji/sticker của sheet.
- Giữ nguyên offset pivot→chi tiết (tay, tai, đầu) là chìa khóa: đổi 100% hình dạng mà clap vẫn gặp tay, tai vẫn flop đúng envelope, proud không hở cổ — không phải chỉnh lại animation nào.
- Tai ngắn lại (ry92→78) là trade-off có chủ đích: tai v2 quá dài sẽ kéo tỷ lệ đầu/tổng xuống dưới 55%.
- Tỷ lệ đầu 56.4% + stub tay chân làm nhân vật đọc rõ cả ở wide shot (f836/f1110), không cần crop mới nhận ra là thỏ/rùa — đúng mục tiêu "nhận ra từ sheet".

## File listing v3
- Video: `character-performer/renders/kids_story_multiscene_v3.mp4` (65,556,783 bytes)
- Comp: `remotion-composer/src/KidsStoryMultiScene.tsx` (sửa tại chỗ, Root.tsx không đổi — 1188 frames giữ nguyên)
- QC: `character-performer/kids/qc_multiscene_v3/` (38 file): `probe_f{045,191,660,742,836,1067,1110,1121,1182}.png` + `probe_f{045,1067}_crop_*.png` + `sheet_crop_{rabbit,turtle}.png` + `compare_{rabbit,turtle}_vs_sheet.png` + `v3_f{045,191,283,332,488,550,641,660,742,807,828,836,872,972,1067,1110,1182}.png` + `v3_f{045,191,742,1067}_crop_*.png` + ffprobe_v3.txt

# v3.1 glasses+book — TASK_V31.md (2026-10-10): kính tròn + sách cho rùa theo design_C đã duyệt

Lead QC v3 phát hiện rig thiếu 2 prop của design sheet C. v3.1 thêm **kính tròn** + **sách mở**, rig mechanics giữ nguyên 100% (reviewer audit diff: mọi const/schedule v3 nguyên vẹn, Root.tsx không đụng, 1188f). Composer probe vòng 1 PASS ngay — 0 fix round.

## Output
- **Video:** `character-performer/renders/kids_story_multiscene_v31.mp4` — 1080×1080 · 30fps · **1188 frames · 39.66s** · h264 + aac · 65,937,858 bytes (~62.9 MB) · `tsc --noEmit` sạch

## 1. Kính tròn (trọng tâm #1: KHÔNG che sparkle)
- **2 ring rỗng** `fill="none"` stroke `#5b3a2f` sw7.5 quanh 2 mắt: ellipse rx27 ry31 tại eyesX [294, 382] cy630 — to hơn mắt (rx19 ry23) một vòng hở, **2 chấm sparkle nhìn xuyên qua rõ** (ring trong y≈603 vs đỉnh mắt 607 / sparkle 617). Vẽ SAU nhóm mắt trong head group, **NGOÀI nhóm scaleY blink** → blink: mắt dẹt lại BÊN TRONG, kính giữ nguyên (crop f410 verify).
- Ring đứng tại eye-x DANH NGHĨA (không theo tLookX ±2–5px) — mắt liếc sau tròng như kính thật. Cầu nối `M 321 622 Q 338 612 355 622` + 2 càng cong ra sau: `M 409 626 Q 428 618 440 634` (phải) / `M 267 626 Q 248 618 243 637` (trái), gọn trong silhouette đầu.
- Kính ở trong head group → ride theo nod/tilt/proud (f1058: kính nghiêng +7° theo đầu ngẩng).

## 2. Sách mở (trọng tâm #2: KHÔNG che miệng khi nói)
- **2 trang be** `#fbf3dd` (sáng hơn bụng `#f5e6c8`) + viền OUT sw7.5 + gáy dip 6px (V mở) + 6 nét "chữ" mảnh sw3.2 op0.5 (28–45px, KHÔNG glyph thật). Spans local x472–624 × y793–830 — **mép sách chạm mép trong 2 chân trước** (476/617) = tay đặt trên mép sách.
- **Miệng (312, 716) cách sách ≥160px local** — hình học không bao giờ che miệng ở mọi tư thế (proud ngẩng, đầu chỉ đi LÊN). Vẽ TOPMOST (sau rim) trong tBodyDy group → sách rõ trước bụng, ride walk-bob = "tay ôm" khi đi (f754).
- (Sheet vẽ sách cao hơn ở ngực — TASK_V31 quy định "phía trước bụng", theo task.)

## 3. S5: thả sách TRƯỚC khi ăn mừng (chọn thả — tự nhiên hơn giơ sách vì i7 nói suốt S5 với đầu ngẩng)
- Rùa trượt về đích x430 (32.025–32.775) vẫn ôm sách → **rơi 32.80→33.08 easeInQuad** (x 548→350, y→834, rot→−12°), settle ±3px 33.08→33.25, rồi **park cố định** (bù −tBodyDy nên proud-bounce không kéo sách) đến f1182. Hoàn tất trước proud-full 33.2 · confetti 33.1 · clap thỏ 33.7. Nằm cạnh chân trước trái (overlap ≤8.6px = tựa nhẹ), ground zone y830–845.
- Ghi chú: comp này RÙA không vỗ tay (thỏ clap; rùa proud + nói i7) — "trước khi vỗ tay" áp tương đương "trước khi ăn mừng proud".

## QC v3.1 — deliver-and-verify (lead xem từng ảnh + reviewer audit độc lập PASS 6/6)
| Frame | Thời điểm | Kiểm tra | Kết quả |
|---|---|---|---|
| f200 (+crop mặt) | 6.67s | rùa nói i1 mid-cue: kính ring quanh 2 MẮT, **sparkle xuyên qua rõ**, miệng mở, sách ở bụng xa miệng | **PASS** |
| f410 (+crop mặt) | 13.67s | **blink peak**: mắt dẹt bên trong, **kính giữ nguyên full ring** + cầu/càng nguyên vẹn | **PASS** |
| f754 (+crop rùa) | 25.13s | đang ĐI giữa i5: **ôm sách trước bụng**, chân bám mép sách, kính, miệng mở mid-cue | **PASS** |
| f1008 | 33.6s | S5 proud: **sách NẰM ĐẤT cạnh chân trái**, confetti rơi, kính, nói i7 | **PASS** |
| f1058 (+crop mặt) | 35.27s | i7 mid-cue proud: miệng mở rộng KHÔNG bị che, kính nghiêng theo đầu | **PASS** |
| f1080 | 36.0s | celebration sâu: thỏ clap + rùa proud + sách dưới đất | **PASS** |
| f1182 | 39.4s | frame cuối sạch, sách vẫn dưới đất, kính vẫn trên | **PASS** |
| compare_turtle_vs_sheet_v31 | — | crop mặt v3.1 so design_C_kawaii.png — kính tròn + sách mở khớp nhân vật sheet | **PASS** |

## File listing v3.1
- Video: `character-performer/renders/kids_story_multiscene_v31.mp4` (65,937,858 bytes)
- Comp: `remotion-composer/src/KidsStoryMultiScene.tsx` (chỉ thêm: book state ~L500-517, glasses ~L739-778, book render ~L954+; Root.tsx + rig v3 không đổi)
- QC: `character-performer/kids/qc_multiscene_v31/` (15 file): `probe_f{200,410,754,1008,1058,1080,1182}.png` + `probe_f{200,410,1058}_crop_face.png` + `probe_f754_crop_turtle.png` + `compare_turtle_vs_sheet_v31.png` + `ffprobe_v31.txt` + `COMPOSER_FACTS.md`
- Deviation (đã ghi COMPOSER_FACTS): LAND_X 350 thay vì ≈352 (2px — giữ overlap chân ≤10px); settle bounce = −3·sin(π·q)

# v3.3 one-path rig + walk-hold fix — lead brief 2026-10-10: rig rùa 1-silhouette (user DUYỆT 3 still) → fix walk pose → render video

v3.2 "mai đè lên thân" bị lead bác ("nắp + hộp"); **v3.3 dựng lại rùa ONE-PATH**: toàn bộ thân+mai+ bụng = MỘT path kín "rounded loaf" (tail nub gộp vào cùng path), mai/bụng là VÙNG của path vẽ qua clipPath, rim = 1 nét mảnh dọc equator `M 398 770 Q 540 822 675 770`. Chỉ 3 loại outline ngoài: path thân / đầu / chân — **không thể** đọc thành 2 khối. User duyệt qua 3 still PNG (`renders/turtle_v33_{idle,walk,proud}.png`, QC PIL column-scan: mỗi pose đúng 1 rim mảnh, không outline tối giữa mai–bụng). Rig mechanics giữ nguyên (props t*, TURT.head pivot, scutes, kính, sách v3.1).

## 1. Walk-hold fix (defect lead: sách "không có chân giữ")
- Nguyên nhân: sách vẽ TOPMOST đè lên mép trong 2 chân trước → sách như THẢ nổi trên bụng.
- **Fix grip:** prop mới `tGrip` (0..1) trên TurtleFigure. Khi ôm sách, 2 chân GẦN xoay vào trong quanh pivot hông (445,786)/(648,786) góc **±TURT_GRIP_DEG=72°·tGrip** (chân trước −72° quét mũi chân sang phải lên trang trái, chân sau +72° sang trái lên trang phải) → mũi chân + 2 nét ngón ĐÈ lên trang sách qua mép = "tay ôm, chân giữ mép". **Thứ tự vẽ đổi: chân near vẽ SAU sách** (mũi chân đè lên trang, không bị sách che).
- `tGrip = 1 − bookFallP` ở comp chính: giữ sách chắc từ f0 → thả dần 32.80→33.08 khi sách rơi, về đứng thường từ 33.08 (không "ôm không"). TurtleStill truyền `tGrip={book ? 1 : 0}` → still proud bit-identical, idle/walk có grip.
- Gate trước render video: still walk + crop `qc_walk_grip_fix.png` lead duyệt PASS ngay, 0 fix round.

## 2. Output
- **Video:** `character-performer/renders/kids_story_multiscene_v33.mp4` — 1080×1080 · 30fps · **1188 frames · 39.6s** · h264 + aac · 66,086,365 bytes (63.0 MiB) · render đủ 1188/1188 frame, không warning · `tsc --noEmit` sạch
- Still rig re-render khớp code: `renders/turtle_v33_{idle,walk,proud}.png` (bản duyệt gốc giữ nguyên tại `qc_multiscene_v33/qc_*_full.png`)

## 3. QC v3.3 — deliver-and-verify (12 frame từ mp4 + 4 crop; lead xem từng ảnh + reviewer audit độc lập PASS)
| Frame | Thời điểm | Kiểm tra | Kết quả |
|---|---|---|---|
| f045 | 1.5s | S1 + thỏ nói i0 + title giữa màn; rùa đứng ôm sách CÓ chân giữ | **PASS** |
| f200 (+crop) | 6.67s | rùa nói i1 mid-cue: **miệng mở**, kính, idle ôm sách **mũi chân bám 2 trang** | **PASS** |
| f332 | 11.07s | S2 vạch xuất phát, thỏ nói i2 mid-cue | **PASS** |
| f660 | 22.0s | S3 thỏ NGỦ: tai rũ 2 bên, zZz không đè tai; rùa đi phía sau ôm sách | **PASS** |
| f690 (+crop) | 23.0s | bắt đầu đi: sách được 2 chân giữ chặt, miệng đóng | **PASS** |
| f754 (+crop) | 25.13s | **KEY — đi giữa i5 mid-cue: miệng MỞ + kính + 2 mũi chân ĐÈ lên trang sách qua mép + 1 SILHOUETTE** (1 outline kín, rim mảnh, không 2 khối nắp/hộp) | **PASS — fix đạt** |
| f836 | 27.9s | S4 giật mình: tai dựng, mắt mở to | **PASS** |
| f1008 (+crop) | 33.6s | S5: sách NẰM ĐẤT cạnh chân trái, **chân đã BUÔNG đứng bình thường** (tGrip→0, không ôm không) | **PASS** |
| f1067 | 35.57s | rùa proud ngẩng + kính + nói i7 miệng mở, sách dưới đất | **PASS** |
| f1110 / f1121 | 37.0 / 37.37s | clap: tay GẶP NHAU trước ngực (f1121 pha chạm) + confetti | **PASS** |
| f1182 | 39.4s | frame cuối sạch, sách dưới đất, kính trên | **PASS** |

## 4. File listing v3.3
- Video: `character-performer/renders/kids_story_multiscene_v33.mp4` (66,086,365 bytes)
- Comp: `remotion-composer/src/KidsStoryMultiScene.tsx` (one-path rig + TURT_GRIP_DEG 72 ~L227, tGrip prop, near-legs sau book ~L653–698, tGrip=1−bookFallP ~L993) · `remotion-composer/src/TurtleStill.tsx` (+tGrip L63) · Root.tsx không đổi (1188f giữ nguyên)
- QC: `character-performer/kids/qc_multiscene_v33/` (27 file): 6 still QC duyệt rig (`qc_{idle,walk,proud}_{full,equator}.png`) + `qc_walk_grip_fix.png` + 12 probe `v33_f{045,200,332,660,690,754,836,1008,1067,1110,1121,1182}.png` + 4 crop `v33_f{200,690,754,1008}_crop_turtle.png` + `ffprobe_v33.txt` + `COMPOSER_FACTS.md` (one-path construction + addendum "Video round (v33)")
- Ghi chú: vẫn dùng audio/BGM/camera/staging cũ (không đổi gì khác đúng brief); grip là thay đổi hình học duy nhất của vòng này.

# rig split — TASK_RIG_SPLIT.md (2026-10-10): tách rigs/ component + spec JSON, refactor thuần 0 thay đổi visual

God-file 1424 dòng tách thành module tái dùng. **Mọi hằng số/easing/timing giữ nguyên từng số** — chứng minh bằng still-vs-still 6/6 anchor **bit-identical 0.000000%**.

## Cấu trúc
```
remotion-composer/src/rigs/
  types.ts            99 dòng   # CharacterSpec (outline/white/headRatio/visemes/visemeScale) + Pose + primitives (piv, blinkFrom 80/120ms, envAt, mouthAtCues 70ms, easings)
  KawaiiRabbit.tsx   456 dòng   # <KawaiiRabbit frame pose spec cues .../> — pose idle|walk|sleep|startle|proud|clap
  GoldenTurtle.tsx   668 dòng   # <GoldenTurtle .../> — one-path v3.3 + tGrip walk-hold sách (TURT_GRIP_DEG 72)
  specs/rabbit.kawaii.json      # mọi hằng số thẩm mỹ thỏ (35 nhóm part, tai 3 lớp, sparkle, viseme 9 kiểu)
  specs/turtle.kawaii.json      # rùa v3.3 (bodyPath/equator/mai/rim/5 scutes/kính/sách, visemeScale 0.85)
```
- Props API đúng task: `frame`, `pose`, `spec`, `cues = {mouthCues, start}` + schedule props (blinks/hops/walk 23.0–26.9/sleep 21.35/startle 27.69/bookFall 32.80→33.08/staging). Dựng comp mới chỉ cần spec + audio cues.
- `KidsStoryMultiScene.tsx`: **1424 → 465 dòng** — giữ scene map 5 scene, 4 crossfade ±0.25, Ken Burns, 8 audio Sequence + BGM 0.42, staging, title, zZz, confetti. Re-export `TurtleFigure/TurtleFigureProps/TurtleBook` từ rigs → `TurtleStill.tsx` KHÔNG đổi (vẫn import từ `./KidsStoryMultiScene`), Root.tsx registration nguyên vẹn.
- Spec JSON = nguồn duy nhất hằng số thẩm mỹ (TSX rigs 0 hex — reviewer audit). Part params + accessories typed chính xác qua `typeof specJson` + compile-time check `_specCheck: CharacterSpec` (chặt hơn Record chung — deviation có chủ đích so với chữ "part params, accessories" trong interface).

## Chứng minh visual-identical (3 lớp, `qc_rig_split/frame_diff_table.txt`)
Anchor f045/f200/f660/f754/f1008/f1110 · metric % pixel max-channel |Δ|, PIL 1080×1080:
| Frame | A) refa-vs-stored | B) control: orig-code re-render vs stored | C) still-vs-still (encoder-free) |
|---|---|---|---|
| f045 | **0.000000** PASS | 0.000000 | **0.000000** |
| f200 | **0.000000** PASS | 0.000000 | **0.000000** |
| f660 | **0.000000** PASS | 0.000000 | **0.000000** |
| f754 | **0.000000** PASS | 0.000000 | **0.000000** |
| f1008 | **0.000000** PASS | 0.000000 | **0.000000** |
| f1110 | 87.041 (Δ>8: 2.83) | **86.983 (Δ>8: 2.78) — code GỐC lệch y hệt** | **0.000000** PASS |

**Verdict PASS ở mức source.** f1110 (sau confetti onset f993): bitstream mp4 lưu KHÔNG tái lập được cross-session — control (re-render code gốc chưa refactor) lệch baseline cùng cỡ 86.98%; và 2 render CÙNG code refactor lệch nhau 75.2% (f1037) / 87.1% (f1110) / 90.1% (f1187) ⇒ độ lệch video post-f1008 là nondeterminism pipeline (Chrome AA trên confetti subpixel + lan truyền x264 P-frame), KHÔNG phải constants drift. Bằng chứng quyết định: **C) `remotion still --frame=N` render từ code gốc vs code refactor, 6/6 anchor bit-identical 0.000000%** — không encoder trong đường đi.

## Ràng buộc — checklist
- `renders/kids_story_multiscene_v33.mp4` nguyên vẹn (md5 `fefb225f07641de5265172a105f917d1` trước/sau).
- KHÔNG đụng comp cũ (KidsRabbitCode/Duet/Demo/Layered/Rigged, KidsLayeredPerformer, CharacterPerformer*): mtime audit PASS (reviewer độc lập).
- Root.tsx: registration KidsStoryMultiScene L21/L264-265 + TurtleStill* (có sẵn vòng trước) — không đổi.
- `tsc --noEmit` **0 error**; tsconfig +`resolveJsonModule` (thay đổi build-config duy nhất).
- Reviewer audit độc lập: 23/23 hex + >140 spot-check số thỏ/rùa khớp .orig; animation constants (viseme 0.07s, bookFall 32.8→33.08 easeInQuad ±3px, grip 72°, walk/sleep/startle/proud/clap/confetti 36@33.1, BGM 0.42, crossfade, Ken Burns) PASS; clipPath id `ms-*` scheme giữ nguyên.

## Output + artifacts
- **Video:** `character-performer/renders/kids_story_multiscene_v33_refactor.mp4` — 1188f/1080×1080/30fps/39.6s, 66,089,255 bytes
- Baseline để audit: `character-performer/kids/_rig_split_baseline/KidsStoryMultiScene.tsx.orig` (md5 4413110a…)
- QC: `character-performer/kids/qc_rig_split/` — `frame_diff.py` (3 lớp A/B/C, chạy lại được bằng `.venv/bin/python`), `frame_diff_table.txt`, `frames/` (anchor PNG + still-vs-still), `orig_code_rerender.mp4` (control), `refactor_render2.mp4` (run-to-run proof), `scan/` (chẩn đoán f1012–1095)
- Bonus: `remotion-composer/src/rigs/README.md` — công thức tạo nhân vật mới từ 1 spec JSON
- Ghi chú: hằng số "ear lag 0.18s" nêu trong task KHÔNG tồn tại trong code v3.3 (giá trị 0.18 duy nhất là rShScale — đã giữ nguyên .orig:932 → KawaiiRabbit.tsx:215); composer agent vỡ context giữa chừng — lead kế tục verify (sửa path bug still-diff, đo lại toàn bộ A/B/C + run-to-run)
