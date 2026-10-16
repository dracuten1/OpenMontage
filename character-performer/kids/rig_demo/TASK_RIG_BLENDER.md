# TASK_RIG_BLENDER.md — Rig xương COA Tools 2 cho THỎ + run cycle + close-up nói (DEMO-GATE)

## Bối cảnh (đã verify bởi Hermes, KHÔNG re-probe)
- COA Tools 2 v2.2.1 (clone tại `rig_demo/coa_tools2`, HEAD a7f2634) ĐÃ CÀI vào Blender 5.2.2 qua zip `rig_demo/coa_tools2_addon.zip`, probe headless XANH:
  - `addon_utils.enable("coa_tools2")` OK
  - `bpy.ops.coa_tools2.create_sprite_object()` OK (ARMATURE "SpriteObject")
  - `bpy.ops.coa_tools2.import_sprite(path=<png>, parent=<sprite_object_name>)` OK — NHỚ keyword `path=`, KHÔNG dùng filepath. Cần `bpy.context.view_layer.objects.active = sprite_obj` trước khi gọi.
- Blender binary: `~/.local/bin/blender` (5.2.2 LTS). Render headless `-b`.
- Python cho PIL/numpy: `~/project/OpenMontage/.venv/bin/python`
- Parts đã gen xong (i2i luna, $0): `rig_demo/parts/` (8 part + mO_full/blink_full matched pair canvas-m0) và `rig_demo/parts2/` (head_mO + head_blink matched pair TỪ head part — xem `parts2/parts_reg2.json`).
- Bảng assembly + pivots: `rig_demo/rig_pivots.json` (ĐỌC file này — mọi toạ độ px trong đó, gốc top-left).

## LUẬT CHẾT (vi phạm = chết session)
1. KHÔNG BAO GIỜ Read file .png — verify ảnh CHỈ bằng PIL script (mode, size, alpha%, bbox).
2. Read tối đa: rig_pivots.json, parts_reg2.json, file .py bạn viết, REPORT cuối. ≤8 Reads tổng.
3. Mọi script viết vào `rig_demo/cc/`, output vào `rig_demo/out/`.
4. Giới hạn: ≤24 turns. Nếu hết việc mà chưa render xong → viết REPORT ghi trạng thái + exit code.

## BƯỚC 1 — Alpha cleanup (PIL, .venv python)
Script `cc/clean_parts.py`: với MỌI part (`parts/*.png` trừ `_m0_ref`, `mO_full`, `blink_full` và `parts2/head_mO.png`, `head_blink.png`):
- alpha ramp: a<70→0, a>190→255, giữa tuyến tính (a'=(a-70)*255/120, clip)
- morphology: các pixel alpha>0 nhưng cô lập (connected component <30px) → 0 (bỏ stray/tuft rác)
- Ghi vào `out/parts_clean/<name>.png`. Log trước/sau alpha% mỗi part.

## BƯỚC 2 — Mouth/blink patches (PIL)
`cc/make_patches.py`:
- **mouth_open.png — kỹ thuật DIFF-MASK (bắt buộc, drift annulus nguồn = 2.23% nên paste hình chữ nhật sẽ lộ seam)**:
  1. A = parts/head.png, B = parts2/head_mO.png (cùng canvas 1536x1024).
  2. Vùng crop C = vuông cạnh 220 quanh (1065,548).
  3. diff = |A-B| mean trên RGBA trong C; mask0 = diff > 18 (pixel).
  4. morphology: binary_closing(mask0, iterations=3) rồi binary_dilation iterations=4 (numpy/scipy-free: dùng PIL ImageFilter.MaxFilter/MinFilter trên ảnh mask L).
  5. feather: mask = mask.filter(GaussianBlur(7)); alpha patch = mask*255.
  6. patch RGBA: màu lấy từ B, alpha từ bước 5. Ghi `out/patches/mouth_open.png` (canvas 1536x1024, đặt đúng toạ độ tuyệt đối).
  7. Verify: alpha>0 bbox nằm trong ±130 quanh (1065,548); tổng px alpha>128 trong 6k..60k.
- **eyelid.png — PIL-DRAWN (KHÔNG dùng head_blink: drift annulus mắt 11.4% = vẽ lại cả mặt, patch sẽ lộ)**:
  1. Sample màu fur: median RGB các pixel alpha>200 trong vành 30-50px quanh (985,430) trên head.png → fur_rgb. Outline: pixel đậm nhất (min luminance) quanh đó → line_rgb.
  2. Vẽ trên canvas 1536x1024 trong suốt: eyelid = hình "mắt nhắm": ellipse fill fur_rgb cao ~26px rộng ~64px centered (985,442) + arc đường cong (PIL arc width 7px màu line_rgb) cong VÀNG lên (mi mắt nhắm cười), 2-3 lông mi ngắn (line 4px, dài 10px, xòe xuống-ngoài). Mục tiêu: đè HẲN con mắt mở, khớp style flat dày viền.
  3. Ghi `out/patches/eyelid.png`. Verify bbox trong ±60 quanh (985,435).
- Log kích thước mask + fur_rgb vào REPORT.

## BƯỚC 3 — Build .blend (COA + bones) — `cc/rig_build.py`
Đơn vị: 1px = 0.01 BU. Canvas 1536x1024 → plane X∈[0,15.36], Z∈[0,-10.24] (COA import tạo verts (0,0,-h)..(w,0,0)*0.01).
Mapping: pixel (px,py) → BU (px*0.01, y_layer, -py*0.01).

1. New scene. enable coa_tools2. create_sprite_object. Giữ name.
2. Import 9 sprite part vào sprite object (theo rig_pivots.json, dùng bản clean BƯỚC 1):
   head, ear_far, ear_near, body, arm_far, arm_near, leg_left (DÙNG CHO CẢ 2 CHÂN — import 2 lần hoặc duplicate: leg_near = leg_left duplicate), mouth_open patch, eyelid patch.
3. Với MỖI part mesh: translate verts sao cho pivot_part (xem json) nằm tại (0,0,0) local; rồi đặt object theo bone parenting (bước 4) tại pivot_puppet.
   - head: dùng neck attach (880,641) làm pivot part.
   - leg 2 cái: pivot_part = (716,574) (top-center bbox leg_left).
4. Bones (edit mode của SpriteObject armature; trục bone: head=dưới pivot, tail=lên trên hoặc hướng chi; roll=0; pose dùng rotation_euler Z (local) cho swing trong mặt phẳng sprite — tự kiểm chứng dấu xoay bằng render test):
   - root: (700,980) → (700,900)
   - hips: (765,800) → (765,600) (con root)
   - body attaches vào hips
   - spine: (765,780) → (765,500) (con hips)
   - head_b: (770,470) → (740,380) (con spine); head + mouth patch + eyelid parent head_b
   - ear_far_b: (820,245) → hướng tip theo rest_angle -25° dài 3.0 BU (con head_b)
   - ear_near_b: (872,252) → rest -8° dài 3.2 (con head_b)
   - arm_far_b: (798,565) hướng xuống-phải 20° dài 2.2 (con spine)
   - arm_near_b: (845,588) 25° dài 2.1 (con spine)
   - leg_far_b: (700,798) hướng xuống 1.9 (con hips); IK constraint chain 1 → target empty leg_far_target
   - leg_near_b: (830,798) xuống 1.9 (con hips); IK → leg_near_target
   - Parent object→bone: object.parent = armature, parent_type='BONE', parent_bone=<tên>. Object location = pivot_puppet BU (đơn vị & công thức mapping trên). LƯU Ý part scale trong json áp bằng object.scale (scale đều XY... sprite plane nằm XZ: scale X và Z).
5. Z-order (y_layer BU): leg_far=0.00, arm_far=0.01, body=0.02, tail trong body, leg_near=0.03, head=0.04, ear_far=0.05, arm_near=0.06, ear_near=0.07, mouth patch=0.08, eyelid=0.09.
6. Camera: Orthographic, position (7.68, -30, 5.12), rotation (pi/2, 0, 0) nhìn +Y... nếu khung bị xoay/lật thì chỉnh (mục tiêu: frame render 1536x1024 khớp canvas puppet 1:1, cạnh X trái=0). ortho_scale=10.24 (chiều cao canvas). KIỂM CHỨNG: render 1 frame f=1 (numpy diff bbox content vs PIL bbox của assembly dự kiến — cho phép lệch ≤8px/1500).
7. Render settings: engine BLENDER_EEVEE_NEXT (nếu render lỗi/GPU fail → BLENDER_WORKBENCH, báo trong REPORT); film_transparent=True; 24fps; res 1536x1024; PNG RGBA.
8. Save `out/rabbit_rig.blend`.

## BƯỚC 4 — Animate `cc/rig_animate.py` (mở .blend, keyframe, KHÔNG re-build)
Shot 1 RUN (frames 1..108, 4.5s):
- Stride pose keys @12fps (mỗi 2 frame) với CONSTANT interpolation cho leg/arm bones qua IK targets: keyframe leg_near_target & leg_far_target di chuyển ellipse trước-sau quanh pivot chân (bk 0.55 BU, phase lệch nửa vòng). Leg bones theo IK.
- Squash-stretch (LINEAR): frame 0-6 anticipation: hips scale (1.08, 1, 0.88) + hạ 0.12; frame 8 stretch (0.92,1,1.14) bay lên +0.35; frame 12 chạm (1.1,1,0.86); lặp chu kỳ 12 frame (hop-run), KHÔNG lặp anticipation (chỉ đầu).
- Head bob: head_b location z sin 2x stride ±0.05 BU (LINEAR keys mỗi 3f).
- Tai follow-through: ear bones rotation Z keyframe sin lệch phase 2 frame SO VỚI hop, biên ±14°, LINEAR — tai đung đưa trễ theo nhịp.
- Arm bones: vung đối phase chân ±25° CONSTANT stepped 12fps.

Shot 2 TALK (frames 110..216, 4.5s): đọc `dialogue_v2/d0_cues.json` (mouthCues: t=0 ứng frame 110; value X/C=đóng, khác=mở):
- mouth_open patch: material alpha keyframe 0↔1, fade 2 frame (70ms) mỗi chuyển — dùng keyframe alpha trên principled BSDF alpha input HOẶC mix shader factor.
- eyelid patch: blink 2 lần: frame 132-134 và 178-180 (alpha 0→1→0, mỗi lần 3f).
- head_b: gật nhẹ (rot Z ±2°) mỗi câu ngừng; hips idle scale 1±0.008 chậm.
- Tay: arm_near vẽ nhẹ (rot ±8°) như đang nói.
- Cues offset: c.start*24 + 110 (t giây → frame).

## BƯỚC 5 — Render + composite `cc/render_composite.py`
- Blender render frames 1..216 → `out/frames/f%04d.png` (alpha). Log thời gian render.
- PIL composite mỗi frame (`cc/composite.py`, .venv):
  - bg: `assets/scenes/sc2_race.png` 1024² → resize 1080x1080 LANCZOS 1 lần.
  - frame → content bbox alpha>16 → crop. Shot1 (f1-108): scale content H→367px; vị trí đáy-centre theo path polyline (bg-% ×10.8 vp): f=1→(12,82), f=27→(35,68), f=60→(55,57), f=81→(75,57), f=108→(97,60); nội suy tuyến tính giữa các mốc. Shot2 (f110-216): H→443px, đáy tại (32%,88%).
  - Shadow ellipse dưới chân: alpha 70, màu (60,40,25), w = 0.52*spriteW*(1.06-0.12*squashProxy) với squashProxy=|sin(pi*f/6)|, blur 10. Vẽ TRƯỚC sprite.
  - KHÔNG zoom/scale bg. Camera tĩnh tuyệt đối.
- ffmpeg: shot1.mp4 + shot2.mp4 (mux `dialogue_v2/d0_rabbit.wav` vào shot2, -c:a aac) → concat → `out/rabbit_rig_demo_1080.mp4` (yuv420p, crf 20, 24fps). Ghi duration + size.

## BƯỚC 6 — REPORT `out/REPORT_RIG_DEMO.md`
- Exit code từng bước (cleanup, patches, build, animate, render, composite, ffmpeg)
- Số part dùng, bbox sau cleanup, drift matched-pair (đọc từ parts2/parts_reg2.json + parts/parts_reg.json)
- Thời gian: build, animate, render (s), composite (s), tổng
- Frames render, engine dùng, số keyframe
- Đường dẫn output cuối.

## Verify trước khi kết thúc (bắt buộc)
- `out/rabbit_rig_demo_1080.mp4` tồn tại, ffprobe duration 8.5-9.5s, 1080x1080, có audio stream.
- 3 still QC tự extract: f=30 (run giữa), f=150 (talk mouth mở — chọn frame giữa 1 cue mở từ cues json), f=180 → lưu `out/qc_self/` (KHÔNG soi bằng mắt, chỉ ghi path).
