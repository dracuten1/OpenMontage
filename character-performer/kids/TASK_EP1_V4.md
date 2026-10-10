# TASK_EP1_V4.md — Ep.01 REMAKE: rig rùa v4 side-view + dialogue v2 + staging scenes mới

## Input (đủ cả 3, không thiếu)
1. **Rig**: `src/rigs/GoldenTurtle.tsx` đã là side-view v4 (spec `turtle.kawaii.v4.side.json`, prop `tCrawl` cho nhịp bò). Rabbit `KawaiiRabbit.tsx` giữ nguyên.
2. **Audio**: `kids/dialogue_v2/` — 8 câu, total 40.66s, `timeline.json` (who/text/voice/start/dur) + `d{i}_cues.json` mỗi câu. Cả 2 giọng atempo 0.87.
3. **Backgrounds có sẵn** (`kids/assets/scenes/`, KHÔNG gen thêm): `k_base.png` (đồng cỏ), `sc2_race.png` (vạch xuất phát), `sc3_tree.png` (cây sồi), `sc4_path.png` (đường đua quanh co — lần đầu dùng), `sc5_sunset.png` (hoàng hôn), `sc6_finish.png` (vạch đích caro).

## Scene map (6 cảnh theo dialogue — tự nhiên hơn bản cũ)
- **S1** (i0+i1): đồng cỏ intro — thỏ hop vào giữa, rùa **bò ngang side-view từ trái vào** đứng cạnh, both chào
- **S2** (i2+i3): vạch xuất phát — 2 nhân vật đối diện nhau (thỏ front, rùa side quay đầu về thỏ), thỏ tự tin gợi đua, rùa gật chấp nhận (kính + sách)
- **S3** (i4): cảnh kép trên `sc3_tree`: nửa đầu thỏ chạy nhanh qua màn hình (blur/hops) → đến cây sồi ngủ gục zZz (giữ zZz hiệu ứng cũ)
- **S4** (i5): `sc4_path` — **cảnh chính mới**: rùa side-view bò ngang màn hình (phải→trái hoặc trái→phải theo hướng đường), nhịp bò chéo đều, CẦN thấy 4 chân + đuôi; thỏ ngủ góc dưới/phải nền
- **S5** (i6): hoàng hôn — thỏ giật mình tỉnh (tai dựng, giữ shock cũ), bóng dài 2 nhân vật trên cỏ nếu feasible bằng shadow ellipse
- **S6** (i7): vạch đích — rùa proud ngẩng đầu (không sách — sách thả cạnh chân như bookFall cũ), thỏ clap, confetti giữ
- Crossfade 0.5s tại gap giữa cảnh, Ken Burns mỗi cảnh giữ phong cách cũ.

## Ràng buộc
- Comp MỚI `KidsStoryEp1V4` (Root.tsx add-only), KHÔNG đụng `KidsStoryMultiScene` cũ
- Audio: 8 × Sequence offset theo timeline.json; BGM loop 0.42 volume như cũ
- Turtle staging: side-view rig bò theo trục X, flip hướng bằng scaleX -1 nếu cần quay đầu
- `tsc` 0 error
- Output: `renders/kids_story_ep1_v4.mp4` (1080², 30fps, ~1220 frames)

## QC deliver-and-verify (bắt buộc, như mọi task)
- Mỗi cảnh 1 frame + crossfade; 2 mid-cue lip-sync mỗi nhân vật (KHÔNG probe đầu-cue — pitfall đã biết); S3 zZz + chạy; **S4 crop rùa: 4 chân + đuôi + bụng thấy, side-view đúng**; S6 proud + confetti
- Evidence + facts vào `kids/qc_ep1_v4/`
- Append report vào `kids/REPORT_MULTISCENE.md`
