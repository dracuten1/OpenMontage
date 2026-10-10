# REPORT_CODE — KidsRabbitCode (code-drawn rebuild)

Ngày: 2026-10-10 · Task: `TASK_CODE_DRAWN.md` · Comp: `remotion-composer/src/KidsRabbitCode.tsx` (id `KidsRabbitCode`, đã register trong `Root.tsx` — chỉ thêm import + 1 `<Composition>`, không đụng comp cũ)

## Output
- **Video:** `character-performer/renders/kids_rabbit_code.mp4`
- 1080×1080 · 30fps · 510 frames · 17.05s · h264 + aac · 3.59 MB
- Audio: narration `k_narration_v2.wav` từ frame 0; BGM `k_bgm_v2.wav` volume 0.32, fade-out 15 frame cuối
- QC frames: `character-performer/kids/qc_code/` (14 file = 7 khoảnh khắc × full + crop zoom mặt)

## Kỹ thuật (từ skills) & khác biệt vs bản rigged SVG cũ
Từ `javascript-animation` (SKILL + `references/character.md`, `techniques.md`, `qc.md`):
- **Pure function of frame** — mọi giá trị hình ảnh tính từ `useCurrentFrame()`; không Math.random/Date/CSS-animation. Variety (blink, hop) là lịch deterministic hardcode.
- **Rounded forms + draw back-to-front**: shadow → tail → ears (sau đầu) → body+vest → feet → arms → head → face. Không dùng polygon thô.
- **Deliver-and-verify loop**: render → extract frame tại các thời điểm then chốt → tự inspect (kèm đo pixel, xem dưới).

Từ `motion-art-direction`: motion personality **Playful** (kinetic-soft cho kids) — easeOutBack `cubic-bezier(0.34,1.56,0.64,1)` cho hop/title/landing, overshoot 10–20%; blinks/mouth dùng easeIn/easeOutCubic. Không dùng linear ở bất kỳ phần tử nào người xem đọc được.

Từ `color-motion`: palette tiết chế — trắng (primary) + đỏ vest (accent) + hồng tai/má/mũi/lưỡi; outline nâu ấm `#3a2e2a` (không đen phẳng), nét dày 9–13px kiểu children's book.

**Khác biệt vs `KidsRiggedRabbit.tsx`:**
| | Rigged SVG (cũ) | Code-drawn (mới) |
|---|---|---|
| Lip-sync | `cueAt()` — hard swap viseme mỗi cue | **Interpolate rx/ry ~70ms** easeOutCubic từ viseme trước → sau; smile-arc crossfade theo openness; lưỡi hiện khi ry>12 |
| Hop cuối câu | Tính từ cue gaps >350ms — cues liền kề nên **không có hop nào** | Hop từ **closed-run (B/X) ≥0.35s**: 2.30 / 3.56 / 9.49 / 11.95 / 14.15s + double-hop outro 15.6/16.15s |
| Idle life | blink/tai cơ bản | blink đơn + **double-blink** (4.82, 10.82, 16.12s), **ear lag 0.18s** (tai trễ sau tilt+hops), breathing 3.6s ±1.2%, head tilt 0.13Hz, speech-nod theo openness |
| Character | SVG parts tĩnh ghép/rig | Hoàn toàn parametric — mọi toạ độ/biến đổi tính theo frame |

## QC — deliver-and-verify (pass/fail từng mục)
| Frame | Thời điểm | Kiểm tra | Kết quả |
|---|---|---|---|
| f0043 | 1.42s (A-cue) | miệng mở + lưỡi, mắt highlight | **PASS** |
| f0186 | 6.19s (A-cue) | như trên | **PASS** |
| f0274 | 9.14s (A-cue) | như trên | **PASS** |
| f0402 | 13.41s (A-cue) | như trên | **PASS** |
| f0140 | 4.65s (blink) | mắt nhắm dạng happy-arc, má nâng | **PASS** |
| f0431 | 14.35s (mid-hop) | airborne, arms out, shadow co 0.82 + fade, tai lag | **PASS** |
| f0507 | 16.90s (end) | happy hold,站稳 đất, tai nghỉ | **PASS** |
| Title | mọi frame full | "Rùa và Thỏ 🐰🐢" y≈70–145, chân y≈853 — **không đè chân nhân vật** | **PASS** |

**Đo khách quan (chống eyeball sai):** cảm quan đầu thấy "miệng lệch trái so mũi" ở 4 frame A-cue → đo centroid pixel (PIL/numpy): dx = −2.8 … +3.4px (do head-tilt rotation) → không phải defect, không cần re-render. Loop verify dừng ở round 1.

## Viseme interpolation params
- Bảng target (rx/ry): X(0/0 · smile arc) · B(9/3) · C(13/7) · F(10/6) · G(8/8) · E(26/9) · D(20/15) · H(28/22+t) · A(30/26+t)
- Chuyển tiếp: 70ms đầu mỗi cue, `lerp(prev→cur, easeOutCubic)` trên rx và ry
- Crossfade: smile-arc opacity `1−openness`, mouth opacity `min(1, openness·1.15)`, `openness = clamp(ry/12)`; tongue opacity `(ry−12)/8`
- Miệng tại (540, 632), stroke 5px `#3a2e2a`, fill `#5b3a3f`, lưỡi `#ff8fa3`
