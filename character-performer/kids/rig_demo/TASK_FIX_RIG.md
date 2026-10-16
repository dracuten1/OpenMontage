# TASK_FIX_RIG.md — Fix puppet lộn ngược từng part + mouth patch lệch (FIX-LOOP 1)

## Bạn là fix-session. KHÔNG đọc .png. Reads tối đa 5: report cũ, rig_build.py của bạn, TASK này (đã có), meta json cần thiết.

## Bằng chứng (vision QC của lead trên render cuối)
1. Run frame: "body positioned unusually high above and behind the head; ears point down BELOW the face" — mỗi PART bị lộn ngược nội dung TẠI CHỖ (vflip nội bộ), dù vị trí part đúng (bbox tổng khớp [391,15,998,993]).
2. Talk frame: mouth patch hiện thành "angular black block beside the muzzle" — patch lệch khỏi miệng (hệ quả cùng lỗi chiều).
3. Root cause: để fix camera z-mirror bạn đã mirror geometry/placement (z=+y...) nhưng texture UV không mirror theo → nội dung từng sprite lộn.

## FIX (theo đúng thứ tự)
1. **Flip texture nguồn từng part (PIL), KHÔNG đụng placement math đã verify**:
   `~/project/OpenMontage/.venv/bin/python` script `cc/fix_flip.py`: với MỌI file trong `out/parts_clean/*.png` VÀ `out/patches/*.png`: mở RGBA, `ImageOps.flip(img)` (flip DỌC), ghi đè lại. (10 part + 2 patch.)
2. **Render verify solo từng part** (dùng `cc/probe_solo.py` sẵn có, chỉ đường dẫn out mới): mỗi sprite render solo 1 frame → PIL so với PNG flip tương ứng trong vùng: mean|diff| ≤ 12/255 (cho phép AA). Nếu 1 part nào FAIL → ghi rõ part + số, KHÔNG tự đổi math placement.
3. **Re-render 216 frames + composite + ffmpeg** (chạy lại `cc/render_composite.py` + `cc/composite.py` — animate giữ nguyên: keyframe nằm trên bones, không phụ thuộc texture).
4. **Extract 3 stills QC** từ mp4 cuối: t=2.5 (run mid), t=6.08 (open-cue mid), t=7.87 (closed mid) → `out/qc_self/fix1_*.jpg` (chỉ paths).
5. Append section "## FIX1" vào `out/REPORT_RIG_DEMO.md`: exit codes, số part flip-verified, thời gian.

## Định nghĩa XONG
- `out/rabbit_rig_demo_1080.mp4` mới tồn tại, ffprobe 8.5-9.5s 1080² có audio.
- 10/10 part solo-verify PASS.
- Nói rõ trong REPORT nếu có gì FAIL còn sót.
