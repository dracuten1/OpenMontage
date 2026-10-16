# TURN4_STATE — kids-story Ep.01 FULL REMAKE (pacing "chậm rãi")
> TURN-5 (2026-10-15): user veto zoom Scene 1 → đã fix + deliver v5, xem TURN5_STATE.md

Brief gốc: session 20261014_101929_c9373d msg 2463 (đã recover đầy đủ).
Plan đã duyệt bởi user (turn-5 msg đầu): A1 → A2 → B → QC + deliver.

## Trạng thái
- [x] Verify disk: turtle_back chain 4f DONE (m0,w1,walk2,w3, reg trong TASK_S5_DEMO)
- [x] rabbit_back_m0+run2 (2f), rabbit_front_run_m0+run2 (2f) — cần mở rộng lên 4f mỗi chain
- [x] sleeping_v2/wake_v2 ĐÃ wire vào KidsStoryEp1Remake.tsx turn-3 (chỉ còn re-check Zzz anchor 663,556)
- [x] reg.json remake/ có: rabbit_sleeping, rabbit_wake, rig_rabbit_run, rig_turtle_walk, tree_clean, turtle_walk, turtle_walk2
- [x] A1: CC probe rabbit_back_run3 + rabbit_front_run3 → TASK_TURN4_A1.md → Hermes vision A/A — PASS cả 2 (front 53.0% sát gate nhưng identity + transparency sạch)
- [x] A2: CC batch run4 x2 + canon width-driven + reg.json + report — 4f chain matched cả 2 view, residuals ~0, reg +8 khóa; 429 tự phục hồi sau backoff 9p; run4 vision PASS
- [x] B: CC wire S4 4f + S5 back-view + S7 4f + pacing pass + render full 1230f — tsc 0 lỗi, 15/15 camera-static pass
- [x] QC độc lập + bảng px/s trước/sau + Telegram — S5 gate miss 1.91 → B2 fix trapz r=0.24 → 1.594 PASS; ffprobe verify 1230f/41.0s/30fps/aac; MID-cue stills vision PASS; TG msg_id 19027 (13.9MB <50MB, không cần crf)

## Facts
- Timeline: d5 22.79 dur 6.15; total 40.66s → 1230f @30fps
- Root.tsx đã đăng ký KidsStoryEp1Remake (line 361)
- Gen contract: repo .env OPENAI_API_KEY, base http://127.0.0.1:20128/v1, model cx/gpt-image-2.5-sunburst, data-URI ref ≤1024px, SSE dual-parse, background transparent. Pattern: character-performer/kids/assets/depth_demo/gen_assets.py
- CC spawn: cd ~/project/OpenMontage && claude --print --dangerously-skip-permissions "$(cat <TASK>.md)"
- Canon method turn-2: canon width-driven về content-box của m0 (cx=0, cwf=0, b≤0.001), gate pin-normalized + vision A/A
- S5 demo approved: out/kids_s5_back_demo_v2.mp4 (6.656s) — method = TASK_S5_DEMO.md
- Pacing rule: gait ≤12fps, peak ≤1.6× avg, hold ≥0.6s, ghost ≤2, mouth ±0.3s, camera TĨNH tuyệt đối
