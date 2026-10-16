# TURN5_STATE — kids-story Ep.01 v5: Scene 1 de-zoom (user aesthetic veto #3)

Veto gốc (TG reply video v4, 2026-10-15): "Làm lại scene1, đừng có phóng to thu nhỏ
sprites với sceen vô tội vại như vậy, nên sử dụng ở thời điểm thích hợp."

## Trạng thái — HOÀN TẤT, awaiting_human (TG msg 19032 video + 19033 cmp sheet)
- [x] Scope chốt: "Scene 1" = toàn bộ phần trước cuộc đua S0–S3 (0→17.79s, d0–d3) — nơi zoom
      dồn đặc (5 punch/push + 3 bậc thang camera + 4 spring scale sprite trong 18s)
- [x] Baseline v4 stills render TRƯỚC edit (turn5/baseline/ 9 frames)
- [x] CC rig-animator TASK_TURN5.md: camAt mới (8→3 camera-cut, giữ 2 close có chủ đích
      S2b 1.22 taunt d2 + S3b 1.18 resolve d3) + xóa 4 scaleMul spring entrance — 9/12 turns,
      tsc 0, render 53s
- [x] QC độc lập qc_turn5.py: PASS toàn bộ — G1 identity 4 frame ngoài Scene 1 diff 0.0000
      (scenes khác bit-identical); G2 close giữ 0.0000 ×3; G3 zoom bỏ đổi khung 33.2/21.6;
      G4 camera tĩnh 0.0000 4/4 window (probe né crossfade bg duyệt 3.65–4.15/16.9–17.4);
      G5 ffprobe 1230f/41.045s/aac
- [x] Kiểm chứng zoom khách quan: banner đỏ bg3 — identity bbox(12,1071) hằng, close clip mép
      (0,1079); mp4 f361 vs still f361 diff 2.486 (encoder noise) — vision đọc "wide" ở close
      1.22 là sai judged, đã bác bằng đo
- [x] MID-cue mouths d0–d3 từ mp4: d0/d1 mở rõ; d2(F)/d3(B) tier hẹp đọc mờ = tính chất v4
      (bit-identical f0340), không regression
- [x] Deliver TG DM: video v5 12.65MB (msg 19032) + cmp_v4_v5.jpg (msg 19033) — awaiting_human

## Camera Scene 1 v5 (chốt)
0–10.90 identity (S0a+S0b+S1a+S1b+S2a gộp 1 shot tĩnh) | 10.90–12.40 close 1.22@430,800
| 12.40–15.30 identity | 15.30–17.79 close 1.18@660,800. Ngoài 17.79s: y hệt v4.

## Files
- Video: remotion-composer/out/kids_ep1_remake_v5.mp4 (1230f, 41.045s, 12.65MB)
- Spec/report: character-performer/kids/TASK_TURN5.md, turn5/REPORT_TURN5.md (§6 = Hermes QC)
- QC: turn5/turn5_qc.json, qc_turn5.py, banner_measure.py, cmp_sheet.py, midcues.json
- Stills: turn5/baseline/ (v4), turn5/v5_stills/, turn5/probe/ (windows + MID-cue + w0150/w0500)

## Bài học
- G4 probe window KHÔNG được đè lên crossfade bg đã duyệt (3.65–4.15, 16.9–17.4) — sky-diff
  bắt đổi PLATE (3.78/17.49 fail giả) chứ không phải camera; thu window về 1 segment bg thuần.
- Vision phán "wide/close" không tin được ở zoom nhẹ (1.18–1.22): đo feature bg (banner) hoặc
  diff mp4-vs-still thay vì hỏi vision.
