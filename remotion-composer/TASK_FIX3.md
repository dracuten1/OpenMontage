# TASK FIX3 — CAMERA TĨNH TUYỆT ĐỐI (spec mới, owner veto "phóng to thu nhỏ ko kiểm soát")

Workdir: /Users/tuyennguyen/project/OpenMontage/remotion-composer
File sửa DUY NHẤT: `src/KidsStoryEp1Remake.tsx`. KHÔNG đụng asset/audio/timeline/duration/sprite-path/mouth.
Read tối đa 1. ≤10 turns. Xong = `npx tsc --noEmit` exit 0. KHÔNG render.

## SPEC
Trong 1 shot: camera scale HẰNG SỐ — không push/punch/Ken Burns/reframe/pan giữa cảnh.
Cỡ khung chỉ đổi tại cut. Số lượng zoom-animation còn lại sau khi xong = 0.

## SỬA `camAt()` (mỗi nhánh trả về hằng số; giữ cấu trúc if/return)
1. Nhánh `t >= 33.9` (S7): đang có TX drift `-16*easeInOutQuad(...)` → trả `{ camZ: 1.04, TX: 0, TY: 0, ox: 540, oy: 540 }`
2. Nhánh `t >= 18.9` (S4 sprint): `camZ: lerp(1.04, 1.02, ...)` → `{ camZ: 1.02, TX: 0, TY: 0, ox: 540, oy: 540 }`
3. Nhánh `t < 1.75` (S0a): `camZ: 1 + 0.03*easeInOutQuad(...)` → `{ camZ: 1, TX: 0, TY: 0, ox: 540, oy: 540 }`
4. Nhánh `t < 15.3` (S3a): camZ 1.04 → **1.06** (giữ shot kề ≤7pt)
   Các nhánh khác đã là hằng số — GIỮ NGUYÊN (1.08 / 1.03 / 1.18 / 1.04 / 1.22 / 1.15 / 1.18, origin giữ).

## SỬA `camStack()` (S4 nap → S5 → S6)
5. NAP `t < 22.3`: `camZ: 1 + 0.04*clamp01(...)` → `{ camZ: 1, TX: 0, TY: 0, ox: 540, oy: 540 }`
6. S5A `t < 24.64`: `camZ: 1 + 0.045*easeInOutQuad(...)` → `{ camZ: 1, TX: 0, TY: 0, ox: 540, oy: 540 }`
7. S5B `t < 27.09`: đang `camZ: 1.3 - 0.08*easeOutQuad(...)` + `TX/TY` track theo s5Pose →
   `{ camZ: 1.22, TX: 0, TY: 0, ox: 660, oy: 700 }` (reframe khóa tĩnh vào vùng rùa dừng; XOÁ track TX/TY)
8. S5C `t < 29.54`: đang `camZ: 1.12 - 0.07*ease...` + `TX: lerp(29.25,0,u)`, `TY: lerp(-36.25,0,u)` →
   `{ camZ: 1.05, TX: 0, TY: 0, ox: 540, oy: 540 }`
9. WAKE `t < 31.9` và WIDE cuối: đã hằng số — GIỮ NGUYÊN (1.30 @ 830,640 / 1.02)
   → hàm camStack KHÔNG còn dùng s5Pose/easeOutQuad/lerp trong TX/TY (nếu biến thừa, dọn để tsc sạch).

## SỬA `BG_SEG` (Ken Burns + pan dx)
10. bg3_duel: `dx0: -26, dx1: 26` → `dx0: 0, dx1: 0`
11. bg6_walk: `s0: 1.0, s1: 1.02` → `s0: 1.0, s1: 1.0`
12. bg8_finish: `s0: 1.02, s1: 1.02, dx0: -20, dx1: 20` → `s0: 1.0, s1: 1.0, dx0: 0, dx1: 0`
    (giữ cutIn/cutOut flags nguyên vẹn)

## KHÔNG đụng
- Sprite paths, depth ramp (rùa H lớn dần theo y-path S5B — là chuyển động NHÂN VẬT đi xa→gần, camera vẫn khóa),
  walk-cycle, mouth patches, springs/entrances, hop/nod beats, zZz, confetti, text.
- Dòng `transform: stopped ? "scale(1.12)"` (mouth patch) và `scale(0.6+0.4*sp)` (overlay) — không phải camera.

## BẢNG CHỨNG MINH (in trong report)
Per-shot scale hằng: S0a 1.00 | S0b 1.08 | S1a 1.03 | S1b 1.18 | S2a 1.04 | S2b 1.22 |
S2c 1.15 | S3a 1.06 | S3b 1.18 | S4a 1.00 | S4spr 1.02 | NAP 1.00 | S5A 1.00 | S5B 1.22 |
S5C 1.05 | WAKE 1.30 | WIDE 1.02 | S7 1.04 — scale_start→scale_end identity, delta 0.000 mọi shot.

## REPORT
Dòng đã đổi + tsc output.
