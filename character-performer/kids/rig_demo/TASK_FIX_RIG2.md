# TASK_FIX_RIG2.md — FIX-LOOP 2 (nhỏ): mouth/eyelid patch lệch delta head-mapping + path shot1

KHÔNG đọc .png. Reads tối đa 4. Mọi việc làm trong `~/project/OpenMontage/character-performer/kids/rig_demo/`.

## Defect (vision QC lead, zoom crop qc_hermes2/zoom_talk.png)
Mouth patch hiện như "near-black hard-edged rectangular block ngay BÊN PHẢI mặt, trước muzzle/jaw" — patch đặt theo toạ độ canvas GỐC (1065,548) thay vì theo vị trí head puppet SAU assembly.

## Fix 1 — patch planes đi theo head mapping
Head part mapping đã dùng ở build: neck attach part (880,641) → puppet (770,520), scale 1.0 → delta = (−110,−121) px.
- mouth_open patch: vị trí canvas (1065,548) → đặt lại (955,427).
- eyelid patch: (985,442) → đặt lại (875,321).
Vì patch full-canvas 1536x1024 pivot theo part 'head', cách sạch: chỉnh placement/offset 2 patch plane trong `cc/rig_build.py` (hoặc post-prep script `cc/fix_render_prep.py` đã có — thêm bước dời 2 plane này theo delta −110,−121 px = −1.10,−1.21 BU (trục theo quy ước z-mirror bạn đã dùng: xem dấu qua mirror của head — nếu head đã đúng thì cùng công thức transform với head part áp delta này)).
Sau fix: render solo frame talk 1 frame → PIL: alpha bbox của mouth patch phải nằm TRONG vùng đầu puppet (ensemble head ~ [535,222,945,538] → patch bbox ~ [855,327,1055,527] tương ứng), KHÔNG giao mép phải ngoài head.

## Fix 2 — path shot1 (staging nhẹ)
Vision: t≈1.0s thỏ đứng trên bãi cỏ bên trái đường, feet lifted. Chỉnh polyline composite.py: (12,80)→(35,68)→(55,56)→(75,57)→(97,60) (bg-%) và feet = centerline +1% (đứng hơi chếch lên mặt đường). Không đổi H.

## Chạy
1. fix_render_prep (nếu dùng) → render CHỦ frames 110..216 (talk) — shot1 frames 1..108 chỉ cần re-composite vì path đổi, KHÔNG re-render blender.
2. composite.py + ffmpeg lại full clip → đè `out/rabbit_rig_demo_1080.mp4`.
3. Extract stills: t=6.08, t=7.87, t=1.04 → `out/qc_self/fix2_*.jpg`.
4. Append `## FIX2` vào REPORT: exit codes, bbox patch verify, thời gian.

XONG = mp4 mới tồn tại ffprobe 8.5-9.5s + patch-bbox verify PASS.
