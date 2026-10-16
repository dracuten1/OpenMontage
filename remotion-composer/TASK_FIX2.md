# TASK FIX2 — KidsStoryEp1Remake: camera consistency (veto S0 over-zoom)

Workdir: /Users/tuyennguyen/project/OpenMontage/remotion-composer
File sửa DUY NHẤT: `src/KidsStoryEp1Remake.tsx`. KHÔNG đụng asset/audio/timeline/duration.
Read tối đa 1 (file này). ≤12 turns. Xong = `npx tsc --noEmit` exit 0. KHÔNG render.

## BỐI CẢNH (owner veto)
S0 bị "phóng to quá mức" (camZ nhảy 1.04→1.30 giữa cảnh). Audit toàn phim, quy chuẩn:
slow push ≤1.05; punch ≤1.30 CHỈ cho medium/close chủ ý; không nhảy size nhân vật giữa
các shot kề (trừ close/reveal chủ ý hoặc cắt cảnh mới). Camera S5 (demo đã duyệt) GIỮ NGUYÊN.

## SỬA camAt() — bảng TRƯỚC → SAU (giữ nguyên cấu trúc if/return, chỉ đổi số)
- S0a `t < 1.75`: camZ `1 + 0.04*easeInOutQuad(clamp01(t/1.75))` → `1 + 0.03*easeInOutQuad(clamp01(t/3.9))` (push chậm, nhẹ hơn)
- S0b `t < 3.9`: camZ 1.3, origin (540,700) → camZ **1.08**, origin (540,700) giữ
- S1a `t < 6.4`: 1.05 → **1.03**
- S1b `t < 9.91`: 1.28 → **1.18** (origin 700,800 giữ)
- S2a `t < 10.9`: 1.08 → **1.04**
- S2b `t < 12.4`: 1.35 → **1.22** (origin 430,800 giữ)
- S2c `t < 13.53`: 1.25 → **1.15** (origin 640,800 giữ)
- S3a `t < 15.3`: 1.08 → **1.04**
- S3b (cuối): 1.3 → **1.18** (origin 660,800 giữ)
- S4 sprint `t>=18.9`: `lerp(1.06,1.02,...)` → `lerp(1.04,1.02,...)`
- S7 `t>=33.9`: camZ 1.08 → **1.04** (TX drift giữ)
- camStack S6 wake: 1.40 → **1.30** (origin 830,640 giữ); các giá trị stack khác GIỮ NGUYÊN

## SỬA BG_SEG (Ken Burns — tránh stack zoom với camZ)
- bg6_walk: s0 1.0→s1 1.03 ⇒ s1 **1.02**
- bg8_finish: s0 1.04→s1 1.04 ⇒ **1.02 / 1.02**
(các entry khác đã 1.0 — giữ)

## SỬA 3 sprite-height (compose staging — bù visual do punch giảm; KHÔNG phải asset)
- S2c reaction turtle: H 420 → **340** (x640 y870 giữ)
- S3 turtle (cả S3a 2-shot lẫn S3b punch, cùng staging): H 260 → **300** (x710 y885 giữ)
- S6 wake rabbit: H 300 → **330** (vị trí giữ)

## KIỂM SOÁT (in ra console khi xong bằng script node nhỏ hoặc tự tính, ghi vào report)
Bảng sprite-height % khung (= H×camZ/1080) tại tâm mỗi shot, trước→sau:
S0a 30→30 | S0b 37→31 | S1a 25→25(turtle) | S1b 31→28 | S2a 31→30 | S2b 39→35 |
S2c 49→36 | S3a 25→29(turtle H300) | S3b 31→33 | S4a 26→26 | S6 wake 39→40 |
S7 30→29 — mọi cặp kề ≤7pt, punch max 1.30 (chỉ S5B đã duyệt + S6 wake 1.30).

## REPORT
Liệt kê dòng đã đổi + số trước→sau từng shot + tsc output.
