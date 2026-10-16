# TASK_TURN5 — rig-animator: Scene 1 (S0–S3) DE-ZOOM — user aesthetic veto v4

You are rig-animator. User veto nguyên văn trên bản v4 (kids_ep1_remake_v4.mp4):
"Làm lại scene1, đừng có phóng to thu nhỏ sprites với sceen vô tội vại như vậy,
nên sử dụng ở thời điểm thích hợp."

Scene 1 = TOÀN BỘ phần trước cuộc đua: S0–S3, t ∈ [0, 17.79) (d0–d3, bg1_start +
bg3_duel). Zoom/scale ở đây đang tràn lan: 5 cú punch/push camera (S0b 1.08,
S1b 1.18, S2b 1.22, S2c 1.15, S3b 1.18) + 3 bậc thang ~identity (1.03/1.04/1.06)
+ 4 spring scale entrance trên sprite. Các scene khác (S4 sprint, NAP+S5, S6
wake/wide, S7 finish) ĐÃ DUYỆT — KHÔNG ĐỤNG.

File được sửa: `remotion-composer/src/KidsStoryEp1Remake.tsx` (và chỉ nó).
Read budget: file này 1 LẦN duy nhất, KHÔNG Read .png, KHÔNG Read TASK/report cũ.
Edit xong là render + stills + report. Mục tiêu ≤12 turns.

## EDIT 1 — camera `camAt()` (hiện ~line 658–672) + comment block phía trên (~649–656)

Thay toàn bộ hàm bằng (chữ y hệt, giữ type Cam như cũ):

```ts
const camAt = (t: number): Cam => {
  if (t >= 33.9) return { camZ: 1.04, TX: 0, TY: 0, ox: 540, oy: 540 };
  if (t >= 20.9) return { camZ: 1, TX: 0, TY: 0, ox: 540, oy: 540 };
  if (t >= 18.9) return { camZ: 1.02, TX: 0, TY: 0, ox: 540, oy: 540 };
  if (t >= 17.79) return { camZ: 1, TX: 0, TY: 0, ox: 540, oy: 540 };
  // Scene 1 (S0–S3) sau veto "phóng to thu nhỏ vô tội vạ": camera TĨNH
  // identity; duy nhất 2 close-up CÓ CHỦ ĐÍCH tại cut — S2b taunt (kịch tính,
  // trọn trong d2) + S3b resolve (cảm xúc, cuối d3 lead vào cuộc đua).
  if (t < 10.9) return { camZ: 1, TX: 0, TY: 0, ox: 540, oy: 540 };
  if (t < 12.4) return { camZ: 1.22, TX: 0, TY: 0, ox: 430, oy: 800 };
  if (t < 15.3) return { camZ: 1, TX: 0, TY: 0, ox: 540, oy: 540 };
  return { camZ: 1.18, TX: 0, TY: 0, ox: 660, oy: 800 };
};
```

Cập nhật comment mô tả camera phía trên hàm (đang liệt kê S0b 1.08 / S1a 1.03 /
S1b 1.18 / S2a 1.04 / S2c 1.15 / S3a 1.06 / S3b 1.18) thành bảng mới:
S0–S2a ONE static shot identity 0–10.90 | S2b close 1.22 @430,800 10.90–12.40 |
S2c–S3a static identity 12.40–15.30 | S3b close 1.18 @660,800 15.30–17.79.
(8 camera-cut trong Scene 1 → 3; mọi giá trị camZ khác giữ nguyên ngoài Scene 1.)

## EDIT 2 — gỡ 4 spring scale entrance trong S0–S3 (giữ NGUYÊN opacity + mọi thứ khác)

Tìm 4 chỗ sau (chính xác theo từ khóa) và XÓA prop `scaleMul` (component mặc
định scaleMul=1 — sprite vào màn bằng fade opacity, KHÔNG phóng to):

1. S0 rabbit Talking (closed="rabbit_front_m0", x 380): xóa dòng
   `scaleMul={0.75 + 0.25 * spA0}`  (spA0 vẫn dùng ở opacity — giữ biến)
2. S0 turtle Idle (k="turtle_front_m0", x 700): xóa dòng
   `scaleMul={0.8 + 0.2 * spA1}`
3. S1 turtle Talking (closed="turtle_front_m0", x 710): xóa dòng
   `scaleMul={0.92 + 0.08 * spB}`
4. S2 rabbit Talking (closed="rabbit_taunt", x 350): xóa dòng
   `scaleMul={0.92 + 0.08 * spC}`

KHÔNG đụng (đã duyệt / hợp lệ):
- S2c turtle restage H 260→340 TẠI CUT (camera rule: sprite-height đổi tại cut cứng là hợp lệ)
- Idle breathing ±1%, hop ty 4.9, nod0/nod3, mọi mouth patch/cues/audio
- camStack (S6 wake 1.30 @830,640 / wide 1.02), S4 1.02, S7 1.04, path/ghost/every=
- Backgrounds, timeline.json, LINES, Zzz, confetti, EndCard, Root.tsx

## VERIFY + RENDER (từ remotion-composer/)

1. `npx tsc --noEmit` → phải 0 errors
2. `npx remotion render KidsStoryEp1Remake out/kids_ep1_remake_v5.mp4 --concurrency=4 --log=error` → exit 0
3. ffprobe out/kids_ep1_remake_v5.mp4: 1230 frames, ~41.0s, 1080x1080, 30/1 fps, audio stereo
4. Stills (npx remotion still KidsStoryEp1Remake <path> --frame=N --log=error),
   xuất vào `../character-performer/kids/turn5/v5_stills/` TÊN f%04d.png với
   N = 100, 190, 340, 470, 527, 600, 780, 920, 1150 (9 ảnh, path tương đối
   từ remotion-composer/ như lệnh render: ../character-performer/...)
5. Viết `character-performer/kids/turn5/REPORT_TURN5.md`: bảng zoom
   before→after từng window (S0b 1.08→1.00, S1a 1.03→1.00, S1b 1.18→1.00,
   S2a 1.04→1.00, S2b 1.22→GIỮ, S2c 1.15→1.00, S3a 1.06→1.00, S3b 1.18→GIỮ),
   4 scaleMul đã xóa, tsc RC, render RC + thời lượng, ffprobe output nguyên văn,
   danh sách 9 stills. KHÔNG claim gì không đo được.

## Constraints (FIX5 rules — paid for)
- Camera TĨNH TUYỆT ĐỐI trong shot (per-shot constants — hàm mới chỉ đổi giá trị TẠI cut)
- Không thêm interpolate/spring/animation mới
- Không Read .png; verify ảnh = PIL-only (nếu cần); mọi số liệu ghi từ stdout lệnh
- Session chết SAU khi report nằm trên disk — check disk trước khi respawn (Hermes đã biết)
