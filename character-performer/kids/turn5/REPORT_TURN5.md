# REPORT_TURN5 — Scene 1 (S0–S3) DE-ZOOM — user aesthetic veto v4

Task: user veto trên `kids_ep1_remake_v4.mp4` — "Làm lại scene1, đừng có phóng
to thu nhỏ sprites với scene vô tội vại như vậy, nên sử dụng ở thời điểm thích
hợp." File sửa: `remotion-composer/src/KidsStoryEp1Remake.tsx` (chỉ file này).
Output: `remotion-composer/out/kids_ep1_remake_v5.mp4`.

## 1. Camera zoom before → after (Scene 1, t ∈ [0, 17.79))

| Window | t-range (v4) | camZ v4 | camZ v5 | Ghi chú |
|---|---|---|---|---|
| S0a wide | 0–1.75 | 1.00 | 1.00 | không đổi |
| S0b | 1.75–3.90 | 1.08 @ 540,700 | **1.00** | gỡ push |
| S1a | 4.09–6.40 | 1.03 | **1.00** | gỡ bậc thang |
| S1b punch | 6.40–9.91 | 1.18 @ 700,800 | **1.00** | gõ punch |
| S2a | 9.91–10.90 | 1.04 | **1.00** | gỡ bậc thang |
| S2b close | 10.90–12.40 | 1.22 @ 430,800 | **1.22 @ 430,800 — GIỮ** | close-up CÓ CHỦ ĐÍCH (taunt d2) |
| S2c | 12.40–13.45 | 1.15 @ 640,800 | **1.00** | gỡ reaction push |
| S3a | 13.53–15.30 | 1.06 | **1.00** | gỡ bậc thang |
| S3b close | 15.30–17.79 | 1.18 @ 660,800 | **1.18 @ 660,800 — GIỮ** | close-up CÓ CHỦ ĐÍCH (resolve d3, lead vào đua) |

Camera-cut trong Scene 1: **8 → 3** (còn lại tại 10.90 / 12.40 / 15.30).
Ngoài Scene 1 KHÔNG đổi: ≥17.79 identity, ≥18.9 camZ 1.02, ≥20.9 identity
(camStack giữ nguyên), ≥33.9 camZ 1.04.

Scale-constancy per shot: `camAt()` trả về per-shot CONSTANTS (không
interpolate/spring trong camera path) — camZ/origin chỉ đổi tại cut. Đúng bằng
construct từ code (FIX5 camera rule); không có phép đo hình học nào được chạy.

## 2. 4 spring scale entrance đã xóa (giữ nguyên opacity)

| # | Sprite | Biểu thức xóa |
|---|---|---|
| 1 | S0 rabbit Talking (`rabbit_front_m0`, x 380) | `scaleMul={0.75 + 0.25 * spA0}` |
| 2 | S0 turtle Idle (`turtle_front_m0`, x 700) | `scaleMul={0.8 + 0.2 * spA1}` |
| 3 | S1 turtle Talking (`turtle_front_m0`, x 710) | `scaleMul={0.92 + 0.08 * spB}` |
| 4 | S2 rabbit Talking (`rabbit_taunt`, x 350) | `scaleMul={0.92 + 0.08 * spC}` |

Sprite vào màn giờ chỉ fade opacity (biến spA0/spA1/spB/spC vẫn dùng ở opacity
— kept). Không đụng: S2c restage H 260→340 tại cut, breathing ±1%, hop 4.9,
nod0/nod3, mouth patches/cues, camStack, S4/S7, backgrounds, timeline.json,
LINES, audio, EndCard, confetti, Root.tsx.

## 3. Verify + render (số liệu từ stdout lệnh)

- `npx tsc --noEmit` → **RC=0** (0 errors)
- `npx remotion render KidsStoryEp1Remake out/kids_ep1_remake_v5.mp4
  --concurrency=4 --log=error` → **RC=0**, elapsed **53s**, size 12,650,996 B
- ffprobe (nguyên văn stdout):

```
codec_name=h264
width=1080
height=1080
r_frame_rate=30/1
avg_frame_rate=30/1
nb_read_frames=1230
---AUDIO/FORMAT---
codec_name=h264
codec_type=video
codec_name=aac
codec_type=audio
sample_rate=48000
channels=2
duration=41.045333
size=12650996
```

Đạt: 1230 frames, ~41.0s, 1080x1080, 30/1 fps, audio aac stereo 48kHz.

## 4. Stills (9, `npx remotion still ... --log=error`, exit 0 cả 9 lệnh)

`character-performer/kids/turn5/v5_stills/`:
f0100.png (frame 100), f0190.png (190), f0340.png (340), f0470.png (470),
f0527.png (527), f0600.png (600), f0780.png (780), f0920.png (920),
f1150.png (1150) — 9 file .png trên disk (1.6–1.9MB mỗi ảnh).

## 5. Không claim gì ngoài số liệu trên

- Chưa chạy vision QC trên stills (orchestrator/owner giữ aesthetic veto).
- Không đo pixel-diff v4 vs v5 (task không yêu cầu).

---

## 6. HERMES INDEPENDENT QC (turn5/qc_turn5.py — PASS toàn bộ, 2026-10-15 09:2x)

Baseline v4 stills render TRƯỚC khi CC đụng file (turn5/baseline/, TSX mtime
19:23 hôm trước = đúng bản v4 đã giao TG msg 19027).

| Gate | Kết quả | Ý nghĩa |
|---|---|---|
| G1 identity ngoài Scene 1 | f0600 (S4) / f0780 (S5) / f0920 (S6) / f1150 (S7): mean\|diff\| **0.0000** cả 4 | scenes khác + timeline + audio + bg giữ nguyên BIT-IDENTICAL (không chỉ "không đụng code") |
| G2 khung 2 close-up giữ | f0340 / f0470 / f0527: **0.0000** | 2 close-up còn lại nguyên vẹn đúng v4 |
| G3 zoom bỏ thật | f0100: **33.21** · f0190: **21.61** | 2 vùng bỏ zoom đổi khung thật sự |
| G4 camera tĩnh mỗi window | A(bg3 5.0–10.83s) / B(close) / C / D(close): sky-diff **0.0000** 4/4 | probe né crossfade bg đã duyệt 3.65–4.15 & 16.9–17.4 (đổi plate ≠ camera) |
| G5 ffprobe | 1230 frames · 41.045s · 1080x1080 · 30fps · aac stereo | đúng spec v4 |

Kiểm chứng zoom hoạt động khách quan (banner_measure.py, banner đỏ bg3_duel):
identity → banner bbox x(12,1071) hằng số ở mọi frame wide; close-up → banner
tràn clip mép (0,1079) = phóng đại thật. mp4 frame 361 vs remotion still 361:
mean|diff| 2.486 = encoder noise (khác khung thật đo 21–33) → delivered mp4
khớp comp code.

MID-cue mouth probes (từ chính mp4 v5): d0 f046 mở ✓ · d1 f252 mở ✓ · d2 f361
(F-tier 0.4, trong close 1.22) · d3 f448 (B-tier 0.66) — vision đọc "nhhé/mờ"
ở 2 cue hẹp là tính chất tier đã có ở v4 (bit-identical tại f0340 chứng minh),
không phải regression. Vision đọc close 1.22 là "wide" là do zoom nhẹ + cả 2
nhân vật vẫn trong khung (by design) — đã bác bỏ bằng đo banner ở trên.

**VERDICT: TURN5_QC PASS — awaiting owner aesthetic approval.**

