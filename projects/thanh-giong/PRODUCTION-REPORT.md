# PRODUCTION REPORT — VN-MYTH S2E02 "Thánh Gióng: Vì sao người cứu nước lại là một đứa trẻ?"

Trạng thái: **AWAITING_HUMAN — QC Gate C xong; chờ owner duyệt + upload tay.**
Ngày: 2026-10-17 · Pipeline: OpenMontage animated-explainer + playbook ink-genome · Engine mirror S2E01

## Sản phẩm
- Master 1080p: `/Users/tuyennguyen/project/OpenMontage/exports/video/vn-myth-s2e02-thanh-giong-1080p.mp4` (252MB, 948.93s, 1080p30)
- Preview duyệt Telegram: `/Users/tuyennguyen/project/OpenMontage/exports/video/vn-myth-s2e02-preview-720p-tg.mp4` (42.6MB, 948.93s, 720p30, crf 30 + aac 96k re-encode, DRAFT HUD, ≤50MB Telegram cap; bản 720p crf26 gốc 102MB giữ tại `vn-myth-s2e02-preview-720p.mp4`)
- Scene index: `/Users/tuyennguyen/project/vn-myth-series/episodes/S2E02-thanh-giong/scene_index_s2e02.md`
- Metadata: `/Users/tuyennguyen/project/OpenMontage/exports/metadata/youtube.json`
- Composition: `ThanhGiong` 28466 frames = 948.87s @ 30fps 1080p

## Targets vs thực tế
| Chỉ số | Target | Thực tế | Trạng thái |
|---|---|---|---|
| Độ dài | 12–16' (S2-BIBLE) | 15.8' | OK |
| Từ narration | 3.400–3.900 | 3887 | PASS |
| Sections | 28–31 | 28 | PASS |
| Scenes | 60–70 | 70 | PASS |
| Ảnh | 13 gen + 1 reuse | 13 AI PNG + f07 silhouette; img-05 v2 (kiếm sắt LNCQ) | PASS |
| Chi phí ảnh | $0 (9router free) | $0 | PASS |

## QC Gates
- Gate A TTS: PASS — VieneuTTS v3 Turbo local; 10 sections respoken sau content-fix (s03, s08, s09, s11, s12, s13, s14, s15, s22, s23); narration_full.wav 946.86s
- Gate B script: PASS — 10 sai lệch nội dung (C01–C10) đã sửa; whitelist số liệu + anti-rules từ sources/07
- Word alignment: PASS — 28 sections, 3887 words, 0 zero-duration, 0 anomalous, 100% monotonic (narration_words.json canonical)
- Scene timing: PASS — 70 scenes audio-locked (boundary = next first_anchor_start − 0.32s, min 0.5s), contiguous, 0 speech overflow
- typecheck tsc --noEmit: exit 0
- scene_sweep (10 scenes thăm dò): verdict WARN — edge_clip=0 panel_clip=0 dense_overlap=1
- Gate C ASR round-trip (master 1080p): PASS — s01 @4s overlap 79% · s15 @565s overlap 47% · s28 @939s overlap 78% · duration render 948.93s vs composition 948.87s (+0.06s) vs narration 946.86s (+2.07s tail) — GATE_C_ASR: PASS
- Anchor audit đầy đủ (pre-render): 187/187 A() calls resolve trong window scene, 0 MISS (2 anchor cũ đã vá: sc025 "năm điều không đổi"→"một đứa trẻ, một tiếng nói đầu tiên"; sc059 "Không một chữ nào"→"Đó là cách đọc từ trang truyền kỳ" + caption đổi sang cách đọc đóng khung)

## QC1 fixes đáng chú ý
- img-05 v2: i2i chuyển roi sắt → kiếm sắt hai lưỡi đúng LNCQ (canon cảnh 31: kiếm 7 thước gãy rồi mới nhị tre); sc031 dùng img-05-v2
- sc052: panel clip y599 — mở rộng panels (620px, boxSizing border-box), lock box xuống y710
- InkImageScene: mask vignette 47%/45% chống edge_clip khi ảnh full-bleed
- common.tsx: thêm props labelStartFrac/sublabelStartFrac
- scenes-a: khai báo D, twF; scenes-c/e: imports TextCard/SpringPop/SceneTitle/CountUp

## CC usage
- ~14 CC sessions (6 scene groups + content + engine + audio + asset + TTS), chi phí LLM $0

## Trạng thái
- awaiting_human — KHÔNG tự xuất bản. Owner duyệt qua Draft HUD 720p + scene index, APPROVE thì render final sạch.

Generated: 2026-10-17T03:47:05+00:00
