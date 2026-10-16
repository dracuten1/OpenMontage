# REPORT_ASSETS_EP1.md — Batch gen assets Ep.01 "Rùa và Thỏ"

- Ngày: 2026-10-11 · Task: `character-performer/kids/TASK_EP1_AI_ASSETS.md`
- Model: `cx/gpt-5.6-luna-image` (duy nhất) · Gateway: `http://127.0.0.1:20128/v1` (9router, $0)
- Img2img: ref ở body field `image` (data URI PNG, downscale ≤1024px, LANCZOS), KHÔNG nhét vào prompt
- Chạy: tuần tự, timeout request 600s, retry tối đa 1 lần/ảnh → script `gen_ep1_assets.py` (import `depth_demo/gen_assets.py` đã verify; chỉ mở rộng timeout 420→600s)

## 1. Assets — 11/11 OK, 0 retry, 0 fail

| file | kind | ref (embed) | size trả về | alpha_t% | giây |
|---|---|---|---|---|---|
| rabbit_greet.png | i2i | luna_probe (1024x683) | 1535x1024 | 69.8 | 45 |
| rabbit_greet_mO.png | i2i | rabbit_greet (1024x683) | 1535x1024 | 69.7 | 108 |
| rabbit_taunt.png | i2i | luna_probe (1024x683) | 1535x1024 | 69.5 | 78 |
| rabbit_taunt_mO.png | i2i | rabbit_taunt (1024x683) | 1536x1024 | 69.5 | 69 |
| rabbit_run1.png | i2i | luna_probe (1024x683) | 1536x1024 | 54.2 | 87 |
| rabbit_run2.png | i2i | rabbit_run1 (1024x683) | 1536x1024 | 55.1 | 147 |
| rabbit_shock.png | i2i | luna_probe (1024x683) | 1536x1024 | 78.9 | 143 |
| rabbit_shock_m0.png | i2i | rabbit_shock (1024x683) | 1536x1024 | 78.8 | 78 |
| turtle_proud.png | i2i | depth_demo/turtle_walk (1024x683) | 1536x1024 | 47.6 | 131 |
| turtle_proud_mO.png | i2i | turtle_proud (1024x683) | 1535x1024 | 47.3 | 103 |
| finish_bg.png | t2i | — (opaque) | 1672x941 | RGB | 103 |

**Tổng giây gen: 1092s (~18.2 phút)** · tất cả pass PIL gate lần đầu (sprite RGBA transparent ≥25%, opaque ≥3%; finish_bg RGB opaque).

## 2. Registration — đo sau MỖI ảnh (PIL alpha-bbox, alpha>16)

`registration.json`: **16/16 entries** (11 mới + 5 cũ: turtle_walk/m0/mO, rabbit_sleep, tree_sleep) — keys `{size, ar, t, b, cx, content_h_frac}` (t/b/cx = pixel).

Độ khớp cặp miệng (pose-lock cho animation mouth-swap — bbox gần trùng tuyệt đối):
- greet / greet_mO: bbox (341,12,1289,1019) vs (340,12,1289,1021) — lệch ≤2px
- taunt / taunt_mO: (366,16,1263,1012) vs (365,16,1264,1012)
- shock / shock_m0: (531,16,1104,1015) — identical
- proud / proud_mO: (45,97,1509,924) vs (45,96,1509,925)
- run1 / run2: giãn ngang tương đương (106..1420 vs 119..1418) — đúng stride-phase swap
- turtle_proud vs turtle_walk (anchor): t 97 vs 100, cx 777 vs 776 — giữ registration khi đổi pose

## 3. Lỗi gặp

Không. 0 ảnh fail, 0 retry cần dùng, 0 skip. Latency từng ảnh 45–147s (trong dải bình thường 35–430s).

## 4. Output paths

- Canonical: `character-performer/kids/assets/ep1_ai/` — 11 png + 11 `.prompt.txt` + `gen_log.json` + `registration.json` + `batch_stdout.log`
- Public (byte-identical, đã verify 22/22 files): `remotion-composer/public/character-performer/kids/ep1_ai/`
- Script: `character-performer/kids/assets/ep1_ai/gen_ep1_assets.py` (resumable — chạy lại sẽ skip ảnh OK; `--only <names>` để re-run chọn lọc)

## TODO

(không có — batch hoàn tất 11/11)

Vision QC (identity/facing/mouth đúng ý) là bước tiếp theo của Hermes theo task rule 1.
