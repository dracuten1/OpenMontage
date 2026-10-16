# TASK_FIX_RIG3.md — FIX-LOOP 3: mouth patch vẽ tay (bỏ diff-mask) + path shot1 đo color-mask

KHÔNG đọc .png. Reads tối đa 4. Dir: `~/project/OpenMontage/character-performer/kids/rig_demo/`.

## Bối cảnh
- FIX2 dời patch đúng vùng mặt nhưng diff-mask patch (33508px) vẫn hiện KHỐI ĐEN CỨNG đè mặt (vision 3/10) — mask bắt cả viền má/cằm do drift.
- Eyelid PIL-drawn của bạn hoạt động ĐÚNG (vision 9/10). Áp cùng triết lý cho miệng.

## Fix A — mouth patch PIL-drawn (thay thế hoàn toàn mouth_open.png)
`cc/make_patches.py` sửa: sinh `out/patches/mouth_open.png` = canvas 1536x1024 trong suốt, vẽ tại (955,427):
1. Miệng mở hình bean/ellipse: chiều ngang 64, cao 46, xoay −10° (theo hướng muzzle hếch lên phải), fill #3a1b12.
2. Lưỡi: ellipse 40x16 màu #e8837a, đặt trong nửa dưới miệng.
3. Viền: outline #2b1608 dày 7px bao ellipse miệng (khớp outline dày style — cạnh CỨNG là đúng, không feather).
4. KHÔNG feather toàn cục (chỉ anti-alias). Alpha 255.
5. Verify: alpha bbox ≈ [915,395,995,455] ±25; px alpha>0 trong 1.5k..6k.
Sau đó re-run placement FIX2 như cũ (plane patch giữ vị trí FIX2 — canvas mapping 1:1, pixel (955,427) hiển thị đúng chỗ (955,427)).

## Fix B — path shot1 đo bằng color-mask (bỏ số vision)
Script đo: bg_1080 (composite.py đã có), với các cột x_vp ∈ {110, 216, 324, 432, 594, 756, 864, 970} px: quét cột, tìm dải liên tục các pixel "dirt" (R∈150..205, G∈105..155, B∈65..110, và R−B>45) dài ≥30px gần dưới khung (y>430); tâm dải = y_center. Nội suy polyline (x_vp → y_center−28) cho 8 điểm đo (feet trên mặt đường). Đưa list vào composite.py thay polyline cũ. Nếu cột nào không tìm thấy dải → dùng lân cận.
Sau composite: probe 2 still t=1.0, t=3.2 — PIL check: dải 12px dưới chân-sprite có ≥60% pixel dirt-color (xác nhận đứng trên đường).

## Chạy
1. make_patches → render frames 110..216 (talk) 46s + composite lại (dùng path mới cho shot1, KHÔNG re-render frames 1..108) + ffmpeg full clip đè `out/rabbit_rig_demo_1080.mp4`.
2. Stills: t=6.08, 7.87, 1.0, 3.2 → `out/qc_self/fix3_*.jpg` + `out/qc_self/fix3_road_probe.json` (kết quả đo dải dirt).
3. Append `## FIX3` vào REPORT: exit codes, patch bbox verify, 8 điểm polyline đo được, timing.

XONG = mp4 mới (ffprobe 8.5-9.5s) + patch verify PASS + road probe PASS.
