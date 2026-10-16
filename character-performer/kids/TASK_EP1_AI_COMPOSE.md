# TASK_EP1_AI_COMPOSE.md — Composition Ep.01 "Rùa và Thỏ" AI-image edition

## Bối cảnh (verify bởi Hermes, ĐỪNG re-verify — các file này TỒN TẠI)
- Assets đầy đủ: `remotion-composer/public/character-performer/kids/ep1_ai/` (11 ảnh mới + registration.json) và `.../depth_demo/` (9 ảnh demo). Geometry mọi sprite: đọc từ `ep1_ai/registration.json`.
- Audio 8 câu + cues: `remotion-composer/public/character-performer/kids/dialogue_v2/` (d0..d7 wav + d*_cues.json, timeline.json). BGM: `depth_demo/k_bgm_v2.wav`.
- Component mẫu ĐÃ QC: `remotion-composer/src/KidsDepthDemo.tsx` — copy pattern (SpriteReg, registration pinning, depth ramp, pan 3 lớp, lip-sync cue map, zZz, feather mask FG).

## Task: `KidsStoryEp1AI.tsx` (1080×1080, 30fps) + register `KidsStoryEp1AI` trong Root.tsx

8 shot theo timeline.json (t=0 tại start câu; durations từ timeline). Mỗi shot dùng hệ depth của demo (ramp/pan/overlap) tối thiểu 2 trong 3 kỹ thuật:

| # | câu (who) | staging |
|---|---|---|
| S0 | d0 rabbit "Chào các bạn!..." | rabbit_greet giữa-phải scale 0.9 hướng trái, wave paw bằng rotate nhẹ ±6° quanh vai; bg_far+strip_mid; m0/mO theo cues |
| S1 | d1 turtle "Chào các bạn nhỏ..." | turtle_proud giữa-trái scale 0.85 hướng phải + proud mO/m0 cues; cùng bg (không cut, lerp vị trí 0.6s) |
| S2 | d2 rabbit "Rùa ơi, cậu chạy chậm quá..." | rabbit_taunt phải scale 0.95 smirk + mO/m0; turtle nhỏ xa (0.45, trái, quay lưng nhẹ) — overlap quy mô = depth |
| S3 | d3 turtle "Đua thì đua..." | turtle_proud GẦN (1.0, giữa-trái), camera push-in nhẹ 1.0→1.06 cả cảnh; rabbit nhỏ xa phải |
| S4 | d4 rabbit "Một hai ba, chạy nào!... ngủ chút đã" | nửa đầu: rabbit_run1/run2 swap 8fps chạy phải→trái qua màn (pan mid ngược); nửa sau: crossfade về rabbit_sleep dưới tree_sleep + zZz (giữ staging demo) |
| S5 | d5 turtle | DÙNG LẠI nguyên trạng staging demo (depth ramp 0.45→1.0 + 3 lớp pan + thỏ ngủ) — tham chiếu KidsDepthDemo.tsx, chỉ đổi thời lượng theo timeline |
| S6 | d6 rabbit "Ủa… trời tối rồi sao?" | bg đổi tông hoàng hôn: overlay màu cam-tím opacity 0.35 trên bg layers; rabbit_shock phải (1.0) tai dựng + m0/mO cues; xa trái: turtle_proud nhỏ đang tới đích |
| S7 | d7 turtle "Thấy chưa các bạn ơi..." | finish_bg làm bg mới; turtle_proud giữa (0.9) mO/m0; confetti 36 hạt deterministic (pattern V6); rabbit_shock nhỏ xa phải; kết: title "Kiên trì là thắng!" fade-in 64px coral + white stroke |

Chung: bóng ellipse mọi nhân vật (w=1.12H, h=0.2H, opacity 0.10→0.25 theo scale); transition giữa câu: crossfade 0.5s tại tâm gap; BGM volume 0.25 fade-in 30f / fade-out 90f; không interpolate array giảm dần.

## QC tự làm (bắt buộc, KHÔNG Read .png)
1. `npx tsc --noEmit` → 0 error
2. 4 stills remotion (frame đầu S0, S3 push-in, S4 giữa chuyển chạy→ngủ, S7 confetti+title) — chỉ kiểm bằng PIL std>40 không trắng
3. Render: `npx remotion render KidsStoryEp1AI out/kids_story_ep1_ai.mp4 --concurrency=4 --log=error`

## Report: REPORT_COMPOSE_EP1.md (staging đã dùng/kỹ thuật depth/shot, lỗi, thông số)
## Checklist: [ ] TSX+Root [ ] tsc 0 [ ] 4 stills PIL [ ] render [ ] report
