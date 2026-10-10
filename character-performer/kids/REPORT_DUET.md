# REPORT_DUET — Bộ đôi Thỏ + Rùa (video đối thoại 2 nhân vật code-drawn)

Ngày: 2026-10-10 · Task: `TASK_DUET.md` · Comp: `remotion-composer/src/KidsRabbitDuet.tsx` (id `KidsRabbitTurtleDuet`, register trong `Root.tsx` — chỉ thêm import + 1 `<Composition>`, không đụng comp cũ)

## Output
- **Video:** `character-performer/renders/kids_duet.mp4`
- 1080×1080 · 30fps · 900 frames · 30.06s · h264 + aac · 4.99 MB
- QC frames: `character-performer/kids/qc_duet/` (39 file = 13 khoảnh khắc × full + crop mặt thỏ + crop mặt rùa)

## Staging (1080×1080, nền `k_bg_clean.png` tái dùng)
- **Thỏ** x=346 (0.32) · scale 0.78 · pivot chân y=856 · nhìn sang phải (thân đối xứng, "hướng" thể hiện bằng pupil lệch +5px về người nói) · vest đỏ + tai hồng như `KidsRabbitCode`.
- **Rùa (rig MỚI)** x=734 (0.68) · scale 0.62 (lùn hơn thỏ: đỉnh ~y682 vs tai thỏ ~y413) · vẽ hướng trái. Mai vàng `#f2b53c` viền cam `#e09a30` + 4 hoa văn lục giác đỏ-cam `#e8724a` (hexPath thuần toán, bo tròn bằng strokeLinejoin); đầu to olive `#94a344` + highlight `#a8b755`, mõm nhỏ 2 lỗ mũi, má hồng `#ffb3c0`, 4 chân mập (2 sau sẫm `#7f8f38` sau mai, 2 trước đè viền mai), đuôi stub. Draw back-to-front: shadow → đuôi → chân xa → cổ+đầu → chân gần → mai → hoa văn → viền mai. Outline nâu ấm `#3a2e2a` 9–12px toàn bộ — đồng phong cách thỏ.
- **Idle rùa (turtle personality):** peek cycle ~4s (đầu thò/thụt ±10px), KHÔNG hop; blink chậm hơn thỏ (lịch 4s: 1.6/5.6/…/28.4); nói = gật nhẹ 2.2px @1.1Hz (không speech-nod dồn 2.2Hz như thỏ); nghe = gật 1.6px @0.85Hz, pupil lệch −5px về thỏ.
- **Miệng rùa:** tái dùng nguyên bảng viseme thỏ, scale 0.85 (A → rx25.5/ry22), cùng interpolation 70ms easeOutCubic + crossfade smile-arc theo openness; lưỡi hiện khi ry>10.
- **Hop thỏ (duet):** nhỏ h=34 tại 3.30/10.60/24.60 (cuối câu i0/i2/i6; i4 không hop vì gục ngủ).

## Offset cues math (t của `d{i}_cues.json` là đầu file wav, KHÔNG phải timeline)
`timelineTime = cueTime + line.start` · frame = `round(timelineTime × 30)`. Chỉ nhân vật nói mới lip-sync theo `mouthAtCues(LINE_CUES[i], t − line.start)`; nhân vật kia giữ closed-smile.
- Ví dụ 1 — d0 (start 0.00): A-cue 0.23–0.31 → timeline 0.23+0.00 = 0.23–0.31 → crop f8 (t=0.267, giữa cue) ✓
- Ví dụ 2 — d1 (start 3.73): A-cue 1.12–1.20 → timeline 1.12+3.73 = 4.85–4.93 → crop f147 (t=4.90) ✓
- Audio: 8 × `<Sequence from={Math.round(start×30)}><Audio …/></Sequence>` (from = 0/112/214/331/412/531/621/750) + BGM `bgm_dialogue.wav` volume 0.3 từ frame 0. Gap giữa các câu đúng 0.45s (end→start: 3.28→3.73, 6.69→7.14, 10.58→11.03, 13.27→13.72, 17.24→17.69, 20.25→20.70, 24.54→24.99) — không chồng tiếng.

## Reaction beats (đã làm đủ 3)
- **i4 ngủ (16.45–16.95):** đầu tụt +11px & nghiêng 8°, mắt nhắm happy-arc, tai rũ ra ngoài ±24°, miệng tắt dần theo (1−asleep), chữ **z** x3 nổi trên đầu (26/34/44px, bob+nhấp nháy sin, world-coords không bị mirror). Ngủ xuyên suốt i5 (17.69–20.25).
- **i6 giật mình (20.70):** tai bắn dựng (easeOutBack overshoot +16°), mắt mở to ×1.16, giật thân −24px (overshoot rồi hạ về 21.55s); cue A ngay 0.00s = "Ơ!" mở miệng khựng.
- **i7 tự hào (25.0–25.6 ramp, giữ tới ~28.95, nhả 29.55):** đầu rùa ngẩng +7°, thân nâng −3px, smile-arc rộng +8px khi ngừng nói.

## QC — deliver-and-verify (13 khoảnh khắc × 3 ảnh, pass/fail từng mục)
| Frame | Thời điểm | Kiểm tra | Kết quả |
|---|---|---|---|
| f008 | 0.27s (i0 A-cue) | thỏ miệng mở+lưỡi; rùa closed-smile nghe | **PASS** |
| f105 | 3.50s (gap i0→i1) | cả hai idle, miệng closed-smile, pupil thỏ hướng rùa | **PASS** |
| f147 | 4.90s (i1 A-cue) | rùa miệng mở+lưỡi; thỏ closed-smile | **PASS** |
| f207 | 6.90s (gap i1→i2) | cả hai idle awake, cả hai miệng đóng | **PASS** |
| f259 | 8.63s (i2 A-cue) | thỏ miệng mở rộng | **PASS** |
| f351 | 11.71s (i3 A-cue) | rùa miệng mở | **PASS** |
| f424 | 14.15s (i4 A-cue) | thỏ miệng mở (chưa ngủ — ngủ từ 16.45) | **PASS** |
| f543 | 18.10s (i5 đầu) | thỏ NGỦ: mắt arc, tai rũ, zZz nổi; rùa nói (F-cue mở) | **PASS** |
| f575 | 19.16s (i5 giữa) | rùa miệng mở (C-cue); thỏ vẫn ngủ + z trong crop | **PASS** |
| f636 | 21.20s (i6 +0.5s) | thỏ GIẬT MÌNH: tai dựng đứng, mắt mở to, miệng khựng | **PASS** |
| f667 | 22.23s (i6 A-cue) | thỏ miệng mở rộng, tai còn hơi dựng | **PASS** |
| f808 | 26.92s (i7 A-cue) | rùa miệng mở + đầu NGẨNG tự hào (so f575: đầu cao hẳn) | **PASS** |
| f885 | 29.50s (end) | cả hai idle closed-smile, đứng vững, rùa hạ dần pose tự hào | **PASS** |
| Title | mọi frame full | "Rùa và Thỏ 🐰🐢" y≈70–145; tai thỏ đỉnh ~y413, đầu rùa ~y682 — không đè | **PASS** |

Loop verify dừng ở round 1 (không cần fix/re-render). Mọi frame là pure function của `useCurrentFrame()` — blink/peek/nod/zZz là chu kỳ sin deterministic, không Math.random/Date/CSS animation.

## File listing
- Video: `character-performer/renders/kids_duet.mp4` (5,234,635 bytes)
- Comp: `remotion-composer/src/KidsRabbitDuet.tsx` · Root.tsx +1 import +1 Composition
- QC crops: `character-performer/kids/qc_duet/f{frame}_{tag}_{full|rabbit|turtle}.png` × 39
