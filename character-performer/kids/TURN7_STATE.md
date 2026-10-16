# TURN7_STATE — kids-story Ep.01 v7: feedback v6 (nhìn nhau khi thoại + gỡ zoom rùa)

Veto nguyên văn (TG, trên v6): (1) 'Có cách nào để 2 nv nhìn nhau khi nói chuyện k?'
(2) 'đừng phóng to rùa'.

## Trạng thái — HOÀN TẤT, awaiting_human (TG: video + board_11s + board_17s)
- [x] Probe TRƯỚC edit (8 mốc mp4 + sprite board): rabbit_taunt native nhìn TRÁI,
      turtle_side native nhìn PHẢI → scaleX=-1 hiện có = thỏ nhìn PHẢI↔rùa nhìn TRÁI
      = ĐÃ nhìn nhau từ fix9 → KHÔNG lật (lật sẽ phá). Ghi audit vào code comment.
- [x] CC rig-animator TURN7 (session A edit + session B mechanical; A chết max-turns
      ngay sau code — check disk trước respawn đúng quy trình):
      camAt 1.22@430,800 CHỈ [10.9,12.4) (thỏ close, KHÔNG có ở v6); [15.3,17.79)
      identity (bỏ zoom rùa 1.18); rùa S2 counter-scale 1/1.22 cùng origin → NET 1.0.
- [x] Render v7: tsc RC0, 54.2s, 12,283,370 B, ffprobe 1230f/41.045s/aac stereo.
- [x] QC độc lập 12 gate PASS (qc_lead_v7.json): still scope-diff ngoài 2 cửa
      0.0000 ×14 frame (gồm S5); audio PCM bit-identical; 392 asset hash giữ nguyên;
      thỏ 1.22 err 0.7px; rùa dome mean 0.25 @offset(0,0); w2 v7==pre-cut ±1px.
- [x] Bài học MỚI: --sequence render KHÔNG bit-deterministic (S5 turtle, 31f, offset
      (0,0) mean~1) — scope-diff gate phải dùng `remotion still` từng frame (SSOT).
      Crosscheck: seq-v6 tự lệch still-v6 24611px @f780 trong khi still==still = 0.
- [x] Deliver TG DM chat 615761638: kids_ep1_remake_v7.mp4 + 2 evidence board — awaiting_human.

## Camera Scene 1 v7 (chốt)
0–10.90 identity | 10.90–12.40 close THỎ 1.22@430,800 (rùa counter NET 1.0 — không
bị phóng to) | 12.40–15.30 identity | 15.30–17.79 identity (zoom rùa ĐÃ BỎ).
Ngoài 17.79s: y hệt v6 (1.02 sprint, camStack, 1.04 finish).

## Files
- Video: remotion-composer/out/kids_ep1_remake_v7.mp4 (1230f, 41.045s, 12.28MB)
- Source: remotion-composer/src/KidsStoryEp1Remake.tsx (snapshot v6: turn7/KidsStoryEp1Remake.v6.tsx)
- Task/report: kids/TASK_TURN7.md, TASK_TURN7B.md, turn7/REPORT_TURN7.md (§TURN7C = Hermes QC)
- QC: turn7/lead_qc_v7.py, qc_lead_v7.json, still_diff.json, seq_noise_crosscheck.json
- Evidence: turn7/board_v7_11s.jpg, board_v7_17s.jpg (trước/sau × 5 MID-cue mỗi cửa),
  before_facing_board.jpg, source_facing_board.jpg, diag_windows.jpg
- Lossless 2×1230 PNG: turn7/lossless/{v6,v7}/ (~4.3GB — có thể xóa sau khi user duyệt)

## Bài học (cộng thêm)
- Flip là磷 reflex nguy hiểm: luôn probe facing thực tế trước khi "sửa" — profile
  pair đã đúng hướng từ fix9; "fix" bằng lật sẽ tạo lỗi mới.
- Close-up 1 nhân vật trong comp sprite dùng camera toàn-cục: counter-transform
  sprite kia về NET identity (scale 1/camZ cùng origin trong window) — thỏa cả
  "close thỏ" lẫn "không phóng to rùa", transform-only, không đụng audio/cues.
