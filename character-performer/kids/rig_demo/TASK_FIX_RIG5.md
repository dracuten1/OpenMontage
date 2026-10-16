# TASK_FIX_RIG5.md — FIX-LOOP 5 (chốt, số liệu từ diagnostic độc lập đã verify)

KHÔNG đọc .png. Reads tối đa 4. Dir: `~/project/OpenMontage/character-performer/kids/rig_demo/`.
FIX4 đã chết giữa chừng (lead kill): blend hiện có animate FIX4 tốt (hop −0.49..+0.168BU, hips scaleY 0.82–1.18, ears ±16°) nhưng patch placement SAI (converge đến target sai) — sẽ thay toàn bộ cách đặt patch ở đây. out/frames đang mixed-era → re-render tất cả.

## A. Patch = COPY HEAD (bỏ mọi placement thủ công)
Trong `cc/fix5_patches.py` (blender headless, mở out/rabbit_rig.blend):
1. XÓA 2 object `mouth`, `eyelid` hiện có. Xóa mọi PATCH_DELTA logic (không dùng fix_render_prep cho patch nữa).
2. Với mỗi (new_name, png, y_layer): `ob = head.copy(); ob.data = head.data.copy()`; gán material riêng M_mouth2/M_eyelid2 (giữ node tree cũ: tex→emission, AlphaKey cho 2 patch); đặt `ob.matrix_parent_inverse = head.matrix_parent_inverse.copy()` NGUYÊN VĂN; `ob.matrix_basis = head.matrix_basis.copy()` rồi CHỈ sửa `matrix_basis` phần translation.y thành y_layer (mouth 0.01, eyelid 0.00 — tùy z-order hiện tại của head, giữ thứ tự eyelid TRÊN mouth TRÊN head). Parent/bone giống head.
   → patch tự đi theo head 100% (không cần target toạ độ nào nữa).
3. Texture PNG vẽ ở TỌA ĐỘ SOURCE (parts/head.png): viết lại `cc/make_patches.py`:
   - mouth_open.png: ellipse miệng mở center (1066,538), w 62 h 48, tilt −8°, fill #3a1b12, viền #2b1608 7px, lưỡi 38x14 #e8837a nửa dưới; alpha mask ∩ (head.png alpha eroded 4px) trong rect [1026,506,1104,572] (giữ right ≤1104).
   - eyelid.png: ellipse center (977,483), w 78 h 64 (đÈ hẳn mắt bbox [938,441,1017,525]), fill fur_rgb (sample vành quanh mắt như cũ), arc viền line_rgb 7px cong LÊN, 3 lông mi; alpha mask ∩ head-alpha-eroded-4px, rect [930,435,1025,532].
   - Verify: bbox patch ⊂ rect ±10px, px alpha>128: mouth 1200..5000, eyelid 3000..9000.

## B. Mouth fade 41.7ms (spec ≤70ms)
`cc/rig_animate.py`: đổi mọi fade keyframe `a+2`/`b+2` → `a+1`/`b+1` (2 keys cách 1 frame). Chạy lại animate (giữ nguyên biên FIX4 đã có trong script — poses đã là 0.82/1.18 v.v. nếu FIX4 đã sửa script; nếu chưa thì set: hop nhân 1.4, squash 0.82/1.18 stretch, ears ±16°).

## C. Composite giữ squash-stretch (bỏ normalize H)
`cc/composite.py` — thay crop-bbox-resize-Ht bằng CROP WINDOW CỐ ĐỊNH + scale k cố định:
- k_run = 443/723 = 0.6125, k_talk = 443/817 = 0.5423 (đã đo từ raw rest-pose: run rest H=723px, talk rest H=817px → cả 2 shot H danh nghĩa 443px, dH = 0pt).
- Crop window RAW (sau FLIP_TOP_BOTTOM như hiện tại): run rows [55,995], cols [485,943]; talk rows [40,870], cols — lấy cùng x-range run [485,943] nếu không clip (nếu talk content vượt, mở rộng đối xứng và tính k_talk lại = 443/(817*talk_H_raw/817)).
- scale = k_shot, KHÔNG resize về H cố định; sprite H thay đổi theo frame (squash/hop HIỆN ra).
- Anchor: rest-feet row (run 781, talk 861 — sau flip) đặt vào POLY cy (feet line); talk feet cy = 0.88*1080 giữ nguyên. Vị trí x: center window → cx cũ.
- Shot2 (talk) giữ như cũ về vị trí (cx 0.32, cy 0.88) — chỉ đổi cách scale.
- Shadow: giữ.

## D. Render + QC
1. fix5_patches → render TẤT CẢ 216 frames (out/frames cũ mixed-era) → composite → ffmpeg (giữ pipeline) → `out/rabbit_rig_demo_1080.mp4`.
2. Stills: t=1.0, 3.2, 6.08, 7.87 → `out/qc_self/fix5_*.jpg`.
3. Probe số (PIL, ghi `out/fix5_probe.json`):
   - talk frame mid open-cue: diff vs frame closed kề trước nó (≤0.3s) trong vùng mặt [x±120 quanh sprite-cx] → px count 300..6000 (chỉ miệng, không body motion).
   - run raw heights: f1..108 raw (đã flip) content height min/max — kỳ vọng range ≥ 1.15x.
   - 2 frame kề blink (t≈5.6): diff vùng mắt > 500px.
4. Append `## FIX5` vào REPORT: exit codes, kRun/kTalk, range H, probe results, timing.

XONG = mp4 8.5-9.5s + mọi probe PASS. Nếu probe nào FAIL → ghi rõ số, KHÔNG tự thay đổi thông số của lead.
