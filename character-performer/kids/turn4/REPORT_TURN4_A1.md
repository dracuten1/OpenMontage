# REPORT_TURN4_A1 — probe 2 sprite run3 (RAW, chưa canon)

Task: gen 2 probe sprite raw `run3` (back + front) từ ref `run2` qua i2i `cx/gpt-image-2.5-sunburst`, PIL QC, A/A strip. Gate cho batch A2 — **dừng chờ Hermes vision**, không canon, không reg.json, không TSX/render.

## Kết quả

| Ảnh | Exit | Giây | Size | Mode | Transparent% (gate ≥50) | Non-blank | Drift RGB vs run2 (mean/std) |
|---|---|---|---|---|---|---|---|
| rabbit_back_run3.png | 0 (lần 1) | 38.7 | 1489x1056 | RGBA | **75.5** PASS | OK | 9.23 / 40.63 |
| rabbit_front_run3.png | 0 (lần 1) | 51.6 | 1032x1524 | RGBA | **53.0** PASS (sát gate) | OK | 23.94 / 65.32 |

Drift = abs RGB diff full-frame, probe resize về dims ref — chỉ tham khảo (đây là RAW trước canon). Front drift cao hơn back (khác tỉ lệ khung ref/probe + chân đổi vị trí) — Hermes đối chiếu bằng mắt qua strip.

## Paths (mới, trong `character-performer/kids/turn4/`)
- Script: `gen_probe_run3.py` (gen + prompt.txt + gen_log.json), `qc_probe_run3.py` (PIL QC + strip)
- Ảnh raw: `probe/rabbit_back_run3.png`, `probe/rabbit_front_run3.png` (+ `.prompt.txt` mỗi ảnh)
- Log: `probe/gen_log.json` (file, giây, size, transparent%), `probe/qc_results.json`
- A/A strip: `probe/strip_back_run3_AA.png` (1501x566), `probe/strip_front_run3_AA.png` (733x566) — run2 (ref) | run3 (probe), cùng scale theo content height 512px, nền checker, label PIL

## Deviations / notes
- Ref thật nằm ở `remotion-composer/public/character-performer/kids/sprite_lib/rabbit/` — task ghi `public/...` thiếu prefix `remotion-composer/`.
- Pattern mẫu `assets/depth_demo/gen_assets.py` **không tồn tại** trên disk → script viết trực tiếp theo GEN CONTRACT trong task (khớp NOTES.local §9router: SSE `Accept: text/event-stream`, dual parse JSON→regex `b64_json`, ref downscale ≤1024 giữ tỉ lệ, `background: transparent`).
- Gen thành công cả 2 lần đầu, không dùng retry. Gen tuần tự, exit codes [0, 0].
- Không đụng file có sẵn nào; mọi output là file mới trong `kids/turn4/`.

## Trạng thái
A1 xong — **chờ Hermes vision** trên 2 strip để quyết định gate batch A2.
