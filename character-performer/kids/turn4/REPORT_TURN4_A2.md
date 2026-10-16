# REPORT_TURN4_A2 — batch run4 + canon 4-frame chains + reg

Task: gen 2 sprite run4 (back+front) chain i2i từ run3 canon, canon width-driven
mọi frame raw (run3, run4 back+front) về content-box m0 của chain, đo reg + QC số,
append reg.json. Gen method + prompt y hệt A1 (vision-PASS). Không đụng TSX/Root/render.

## 1. Assets

| File (sprite_lib/rabbit/) | Nguồn | Canvas | transp% |
|---|---|---|---|
| rabbit_back_run3.png (canon) | probe raw A1 | 1435x1018 (=m0) | 73.6 |
| rabbit_back_run4.png (canon) | gen mới (ref = run3 canon) | **1435x1048** (pad +30px top) | 72.5 |
| rabbit_front_run3.png (canon) | probe raw A1 | 1032x1524 (=m0) | 53.1 |
| rabbit_front_run4.png (canon) | gen mới (ref = run3 canon) | 1032x1524 (=m0) | 59.6 |

Chain 4f mỗi view: back = m0 → run2 → run3 → run4; front = run_m0 → run2 → run3 → run4.
Raw gen giữ ở `turn4/probe/` (rabbit_{back,front}_run4.png + .prompt.txt + gen_log_run4.json).

## 2. Canon width-driven (method turn-2)

Canvas = dims m0 (width giữ nguyên); content alpha-bbox của raw scale để content WIDTH =
content width m0 (LANCZOS, không vẽ lại); center-x ghim content center-x m0; bottom row
ghim bottom row m0. **Pad case:** run4 back nội dung đặc (alpha≥8) cao hơn hẳn
(ch 1033 vs 1004 raw) → scale xong tràn 30px → pad canvas thêm 30px ở TOP
(task cho crop/pad; không mất pixel; m0 chạm cạnh dưới nên b vẫn ≈1).
Gate: |cx|≤0.002, |cwf|≤0.002, |b|≤0.001 vs m0.

| Frame | cx_res | cwf_res | b_res | Pass |
|---|---|---|---|---|
| rabbit_back_run3 | 0.0 | 0.0 | 0.0 | ✅ |
| rabbit_back_run4 | 0.0 | 0.0 | 0.00003 | ✅ (pad) |
| rabbit_front_run3 | 0.00097 | 0.0 | 0.0 | ✅ |
| rabbit_front_run4 | 0.00097 | 0.0 | 0.0 | ✅ |

Tham khảo — frame CŨ chưa canon (run2, giữ nguyên theo task):
back_run2 drift (cx −0.0155, cwf −0.0197, b −0.0189); front_run2 drift
(cx +0.0048, cwf +0.0252, b −0.0184). SESSION B lưu ý khi wire nếu cần khớp strict.

## 3. QC số — reg alpha-bbox (t/b px; cx/chf/cwf fraction)

| Key (reg.json) | w | h | t | b | cx | chf | cwf |
|---|---|---|---|---|---|---|---|
| rabbit_back_m0 | 1435 | 1018 | 8 | 1017 | 0.50000 | 0.99214 | 0.98885 |
| rabbit_back_run2 | 1489 | 1056 | 0 | 1035 | 0.48455 | 0.98106 | 0.96911 |
| rabbit_back_run3 | 1435 | 1018 | 3 | 1017 | 0.50000 | 0.99705 | 0.98885 |
| rabbit_back_run4 | 1435 | 1048 | 0 | 1047 | 0.50000 | 1.00000 | 0.98885 |
| rabbit_front_run_m0 | 1032 | 1524 | 30 | 1523 | 0.49564 | 0.98031 | 0.91182 |
| rabbit_front_run2 | 1032 | 1524 | 30 | 1495 | 0.50048 | 0.96194 | 0.93702 |
| rabbit_front_run3 | 1032 | 1524 | 32 | 1523 | 0.49661 | 0.97900 | 0.91182 |
| rabbit_front_run4 | 1032 | 1524 | 157 | 1523 | 0.49661 | 0.89698 | 0.91182 |

- reg.json: append **8 khóa mới** (16 tổng), không đụng entry cũ — đã verify key list.
- front_run4 t=157/chf 0.897: tư thế run4 chân gập cao hơn (content đặc ngắn hơn) — t/chf
  là chỉ số pose, không ghim theo task.
- transparent% mọi frame canon ≥ 50 (gate A1): back 72.5–73.6, front 53.1–59.6.

## 4. Gen

| Ảnh | Exit | Lần | Giây | Raw size | transp% raw |
|---|---|---|---|---|---|
| rabbit_back_run3 (A1) | 0 | 1/1 | 38.7 | 1489x1056 | 75.5 |
| rabbit_front_run3 (A1) | 0 | 1/1 | 51.6 | 1032x1524 | 53.0 |
| rabbit_back_run4 | 0 | gen-thành-công 1/1 (sau 429) | 46.4 | 1489x1056 | 74.1 |
| rabbit_front_run4 | 0 | 1/1 | 61.3 | 1031x1525 | 54.3 |

Tổng gen: **198.0s** / 4 ảnh. Model cx/gpt-image-2.5-sunburst, tuần tự, prompt verbatim A1.

## 5. Lỗi / deviations

1. **429 rate-limit gateway** (usage limit upstream, `retry-after: 8s`): run đầu
   (18:40) cả 2 ảnh reject tức thời ×2 attempts (0.1s, không tốn gen). Re-run +90s
   vẫn 429. Fix transport-only: backoff theo `retry-after` trong post_image (≤6 tries),
   KHÔNG đổi method/prompt/ref/model. Back thủng quota sau ~9 phút chờ (12 lần 429),
   front chui qua được ngay sau đó. Sau đó back thành công ở resume-run kế tiếp
   (script có skip-if-exists để không đốt lại ảnh đã xong).
2. **back_run4 tràn canvas 30px** → xử lý bằng pad-top (mục 2), giữ nguyên pixel,
   vẫn đạt gate. KHÔNG crop nội dung, KHÔNG vẽ lại.
3. gen_log_run4.json bị resume-run ghi đè (front thành "skip") → qc_a2.json đã patch
   seconds 61.3 từ output run gen3 (turn4_cc_a2_gen3.out) kèm note.
4. Ref thật nằm ở `remotion-composer/public/...` (task ghi thiếu prefix — như A1).

## Files mới

- `turn4/gen_batch_run4.py` (mở rộng từ gen_probe_run3.py: SPECS run4 + 429 backoff + skip-if-exists)
- `turn4/canon_run34.py` (canon width-driven + pad-top, stage `3`/`4`)
- `turn4/reg_qc_a2.py` (đo 8 frame, append reg, residuals, QC json)
- `turn4/probe/`: rabbit_{back,front}_run4.png + .prompt.txt, gen_log_run4.json,
  canon_log_run{3,4}.json, qc_a2.json
- Canon outputs: `remotion-composer/public/character-performer/kids/sprite_lib/rabbit/rabbit_{back,front}_run{3,4}.png`
- reg.json: `remotion-composer/public/character-performer/kids/remake/reg.json` (8 khóa mới)

## Trạng thái

A2 xong. 4-frame chains matched cả 2 view, canon đạt gate, reg đã append.
Sẵn sàng cho SESSION B (wire TSX + render) — KHÔNG đụng TSX/Root/render trong A2.
