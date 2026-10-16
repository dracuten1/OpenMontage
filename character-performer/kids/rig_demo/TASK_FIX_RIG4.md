# TASK_FIX_RIG4.md — FIX-LOOP 4 (chốt): patch đặt theo ĐO RUNTIME + tăng biên run

KHÔNG đọc .png. Reads tối đa 3. Dir: `~/project/OpenMontage/character-performer/kids/rig_demo/`.

## Bằng chứng đo (vision lead trên frame raw f0147)
- Miệng-cười THẬT trên mặt: tâm (870, 547) px hiển thị.
- Mouth-open bean HIỆN TẠI: tâm (680, 710) — lệch (−190, +163).
- Mắt: tâm (855, 487) px (eyelid phải center đây).

## Fix A — đặt patch bằng ĐO RUNTIME (không suy hệ trục)
Script blender headless (`cc/fix4_place.py`):
1. Solo-render mouth plane 1 frame (như fix_solo đã có) → PIL bbox alpha → tâm B_now.
2. B_target = (870, 547). delta_px = B_target − B_now. Chuyển sang BU: |Δ|=px*0.01, chiều: chỉnh plane.location (thử 1 bước dấu theo quy ước hệ bạn đang dùng — nếu solo lần 2 lệch GẤP ĐÔI chiều sai thì đảo dấu). Lặp tối đa 3 lần đến |err| ≤ 8px cả 2 trục.
3. Eyelid plane: cùng quy trình với B_target = (855, 487).
4. Verify cuối: solo cả 2 patch, ghi bbox vào `out/fix4_patch_verify.json`.
5. Save blend.

## Fix B — tăng biên run cycle (authored motion, vision chê "đứng")
Trong action (không phải bug): sửa biên độ:
- hop z: nhân 1.4 (hiện ±~0.12/0.35 → ~0.17/0.49)
- squash: scale đỉnh 0.82 (hiện ~0.86), stretch 1.18 (hiện ~1.14)
- ear swing: biên ±16° (hiện ±12°)
Chỉnh trực tiếp fcurve (scale/offset) trong `cc/rig_animate.py` rồi chạy lại, KHÔNG sửa tay blend.

## Chạy
1. rig_animate (Fix B) → fix4_place (Fix A, sau animate) → render 216 frames → composite + ffmpeg → đè `out/rabbit_rig_demo_1080.mp4`.
2. Stills t=1.0, 3.2, 6.08, 7.87 → `out/qc_self/fix4_*.jpg`.
3. Append `## FIX4` vào REPORT: exit codes, patch verify (bbox trước/sau + số vòng lặp), biên mới, timing.

XONG = mp4 mới ffprobe 8.5-9.5s + patch |err|≤8px + vẫn giữ road-probe PASS (composite không đổi path).
