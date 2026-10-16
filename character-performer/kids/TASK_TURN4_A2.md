# TASK_TURN4_A2 — rig-animator: batch run4 + canon 4-frame chains + reg (sau khi A1 vision PASS)

You are rig-animator. Hermes đã vision-PASS probe run3 (A1). KHÔNG re-verify A1.

## HARD RULES (như A1)
Không Read .png; PIL-only verify; write chunk 25-40 dòng; ≤25 turns; chỉ tạo/sửa file trong kids/turn4/ + remake/reg.json.

## VIỆC
1. Batch 2 ảnh nữa, method + prompt y hệt A1 (chain i2i từ run3 vừa PASS):
   - rabbit_back_run4.png (ref = turn4/probe/rabbit_back_run3.png sau canon, xem mục 2)
   - rabbit_front_run4.png (ref = turn4/probe/rabbit_front_run3.png sau canon)
   Kết quả: mỗi chain 4 frame matched (m0, run2, run3, run4).
2. CANON width-driven (method turn-2 đã kiểm chứng): mỗi frame raw (run3, run4 back + front) canon về content-box của m0 của chain đó:
   - back: m0 = sprite_lib/rabbit/rabbit_back_m0.png; front: m0 = sprite_lib/rabbit/rabbit_front_run_m0.png
   - Crop/pad canvas sao cho: cx = 0.000±0.002, cwf = 0.000±0.002, b ≤ 0.001 so với m0 content box (scale theo content WIDTH, giữ nguyên nội dung pixel, KHÔNG vẽ lại).
   - File canon → sprite_lib/rabbit/rabbit_back_run3.png, rabbit_back_run4.png, rabbit_front_run3.png, rabbit_front_run4.png (bản đọc bởi comp).
3. PIL đo lại mọi frame canon + m0/run2 cũ: {w,h,t,b,cx,chf,cwf} alpha-bbox → append vào public/character-performer/kids/remake/reg.json (không đụng entry cũ; khóa "rabbit_back_run3" v.v.).
4. QC số: bảng canon metric từng frame (cx, cwf, b residuals), transparent%, gen giây.
5. REPORT_TURN4_A2.md: bảng assets, drift sau canon, tổng giây, lỗi (ảnh fail sau 1 retry thì nêu rõ — KHÔNG tự thay method).

## GEN CONTRACT
Y hệt A1: model cx/gpt-image-2.5-sunburst, gateway 127.0.0.1:20128/v1, key từ repo .env, data-URI ≤1024px, SSE dual-parse, background transparent, timeout 600s, tuần tự, retry ≤1/ảnh. Script: mở rộng turn4/gen_probe_run3.py → turn4/gen_batch_run4.py.

## KHÔNG làm
Không đụng TSX/Root/render — SESSION B lo.
