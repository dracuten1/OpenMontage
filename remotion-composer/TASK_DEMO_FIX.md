# TASK DEMO FIX1 — KidsStoryEp1RemakeDemo (6 fix, lead-audited)

Workdir: /Users/tuyennguyen/project/OpenMontage/remotion-composer
File duy nhất được sửa: `src/KidsStoryEp1RemakeDemo.tsx`. KHÔNG render.
Read TỐI ĐA 2: file tsx này + Root.tsx nếu cần. Mọi số liệu dưới đây là CHÍNH XÁC từ lead.
Xong = `npx tsc --noEmit` exit 0.

## F1 — BUG miệng (quan trọng nhất)
Dòng ~65 hiện: `const open = cue.value !== "X" && cue.value !== "C";` → SAI: 'C' là miệng HÉ
(không phải đóng) — đang gây giật đóng/mở khi cue B↔C xen kẽ (frame 180 miệng đóng giữa câu).
SỬA openAmt thành tier map (độ mở phân bậc, mượt hơn):
  tier: A→1.0, B/C/G/H→0.66, D/E/F→0.4, X→0.0
  openAmt = nội suy 70ms easeOutCubic từ giá trị CỦA CUE TRƯỚC sang giá trị CUE HIỆN TẠI
  (tính bằng cách: target(cue) theo bảng; nếu lt nằm trong 70ms đầu cue → lerp từ
  target(cue trước đó) sang target(cue), else = target(cue)). Cue ngoài wav / không tìm
  thấy → 0.

## F2 — Restage bên phải (thỏ hết bị rùa đè, zZz hết đè thân cây)
- Cây: base (870, 685), H 620 (canopy tràn mép phải — chủ ý).
- Thỏ ngủ: center (830, 715), H 175 (thở giữ nguyên).
- zZz: base (715, 540), drift lên + hơi TRÁI (dx −6 mỗi glyph thay vì phải).

## F3 — Shot C staging lại (rùa dừng TRÁI, nhìn sang thỏ, hết che thỏ)
- Approach 5.90→6.90: polyline [(330,830,H350),(360,850,H365)], easeOutQuad (bước nhỏ tiến phải).
- STOP 6.90→8.00: đứng (360,850,H365) — giữ nguyên logic cũ (side pose + squash + bob).
- EXIT 8.00→8.90: polyline [(360,850,H365),(560,900,H430),(980,990,H540)], easeInQuad
  (accelerate). Rùa vượt qua/đè thỏ ~8.4–8.7 (giữ z-order). Đầu ló mép phải cuối shot là OK.

## F4 — CUT mới tại 8.90 → Shot D "hold" kết (thay vì rùa kẹt trong khung)
- t ≥ 8.90: ẨN rùa (không render — opacity 0 hoặc return null).
- Camera Shot D 8.90→9.50: cut về camZ 1.05 → 1.02 linear, TX=0, TY=0.
- Khung kết: thỏ ngủ + zZz + cây + đường trống bên trái (rùa đã đi qua), thở + zZz pulse tiếp.
- Tổng duration GIỮ NGUYÊN 285 frames.

## F5 — Shot A: rùa về giữa làn (hết ôm mép cỏ phải)
Polyline A: [(478,468,H58),(484,530,H84),(490,568,H110)] (thay bộ cũ). Shot B giữ nguyên.

## F6 — FG strip mềm hơn + patch side to lên
- Mask gradient mép trên: black point 45%→55%; blur 2.5px→2px.
- Patch miệng side (khi đứng nói): scale ×1.12, transformOrigin center (đọc rõ hơn).

## REPORT
In: các dòng đã đổi (số dòng), tsc output, xác nhận không đổi durationInFrames/comp id.
