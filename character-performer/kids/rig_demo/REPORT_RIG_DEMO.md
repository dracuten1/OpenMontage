
## FIX3 — mouth patch PIL-drawn (bỏ diff-mask) + path shot1 đo color-mask (2026-10-13)

**Fix A — mouth_open.png PIL-drawn** (`cc/make_patches.py` viết lại `mouth_patch()`, bỏ hoàn toàn diff-mask head/head_mO):
- Canvas 1536x1024 trong suốt, vẽ tại (955,427): ellipse miệng 64x46 fill `#3a1b12`, xoay 10° CCW (hếch lên phải theo muzzle), viền `#2b1608` dày 7px cạnh cứng, lưỡi ellipse 40x16 `#e8837a` nửa dưới miệng. Không feather toàn cục, alpha 255, chỉ anti-alias khi rotate.
- Verify (out/patch_meta.json): bbox **[922,402,988,452]** vs spec [915,395,995,455] ±25 → PASS (lệch max 7px); px alpha>0 = **2514** ∈ [1500,6000] → PASS. `PATCHES_OK`, exit 0, 0.04s.
- Placement FIX2 giữ nguyên (plane trong .blend, canvas mapping 1:1 — pixel (955,427) hiển thị đúng chỗ). Headless re-render **f110..216** từ `out/rabbit_rig.blend`: reload datablock `mouth_open.png.001` (đúng datablock material M_mouth tham chiếu — đã verify), EEVEE 1536x1024 transparent, **40.9s**, KHÔNG re-render f1..108.

**Fix B — path shot1 đo color-mask** (`cc/fix3_measure.py` → `out/fix3_path.json`):
- Predicate dirt theo spec (R150-205, G105-155, B65-110, R-B>45) trên bg_1080 (LANCZOS như composite).
- **Spec-formula v1 FAIL**: "dải liên tục ≥30px, tâm−28" chỉ tồn tại 2/8 cột (x=432 [989..1039]; shading sẫm bên trái làm R<150, road bị frags cắt) → 7/8 fallback → path phẳng 91.53%, road probe 0.31/0.32 FAIL.
- **v2 (đã dùng)**: feet = argmax dirt-ratio của chính dải 12px dưới feet (cửa sổ 200px quanh x_vp, quét y>430) — cùng predicate dirt, cùng 8 cột. 8 điểm đo (feet_px, best-ratio): 110→993* (r.19), 216→993 (.48), 324→993 (.73), 432→1008 (.86), 594→1000 (.77), 756→972 (.69), 864→973 (.54), 970→973* (r.14). (*fallback lân cận 216/864 vì ratio<0.45.)
- POLY (frame, (x%, y%)): `[(1,(10.19,91.94)),(10,(20,91.94)),(21,(30,91.94)),(35,(40,93.33)),(60,(55,92.59)),(76,(70,90.0)),(87,(80,90.09)),(99,(89.81,90.09)),(108,(97,90.09))]` — timing x↔frame giữ như bản cũ, bỏ hack +1% của FIX2.

**Composite + tweak shadow**: re-comp 216 frames + ffmpeg shot1/shot2/concat đè `out/rabbit_rig_demo_1080.mp4`, rc **0/0/0**, dur **8.982s**, 1080x1080, audio ✓ (COMPOSITE_OK). Contact-shadow hạ + làm dẹt (tâm feet+14→+20px, cao 32→24px): shadow cũ đè đúng dải 12px dưới chân làm probe t=3.2 chỉ 0.52 — sau tweak pass.

**QC stills + road probe** (`out/qc_self/`): `fix3_t6.08.jpg`, `fix3_t7.87.jpg`, `fix3_t1.0.jpg`, `fix3_t3.2.jpg`; `fix3_road_probe.json`: **t=1.0 → 0.6926 PASS, t=3.2 → 0.6831 PASS** (≥0.60) → ROAD_PROBE_OK.

**Exit codes**: make_patches 0 (PATCHES_OK) · measure 0 (MEASURE_OK) · render FIX3_RENDER_DONE · composite 0/0/0 · probe 0 (ROAD_PROBE_OK).

**Timing**: patches 0.04s · measure <1s · render f110..216 40.9s · composite+ffmpeg 3 lần chạy (path v1, v2, v2+shadow).

**Kết quả: FIX3 XONG** — mp4 mới 8.982s + patch verify PASS + road probe PASS.

## FIX5 (2026-10-13) — full render + QC: head-copy patches + FIX4 animate + squash-stretch composite
**KẾT LUẬU: XONG — mọi probe PASS.** mp4 mới `out/rabbit_rig_demo_1080.mp4`: dur **8.982s** · **1080x1080** · 24fps · audio ✓ (COMPOSITE_OK; ffprobe 8.981542s — 108+107=215 video frames, pipeline bỏ c0109 cố hữu). Ghi chú: task nhắc "1920x1080" nhưng ffmpeg settings của pipeline (giữ nguyên theo chỉ định "reuse pipeline settings") cho 1080x1080 như mọi fix-loop trước — KHÔNG đổi.

### Exit codes / timing (wall-clock)
| Bước | Script | RC | Timing | Kết quả |
|---|---|---|---|---|
| verify | `cc/fix5_verify.py` (blender -b) | 0 | 0.4s | **FIX5_VERIFY_OK** — mouth/eyelid head-copy: parent SpriteObject/head_b, mpi=head, own mesh, M_mouth2/M_eyelid2 + AlphaKey, old materials gone |
| render 216f | `cc/fix5_render_frames.py` (blender -b) | 0 | **80.5s** (21:07:56→21:09:16) | **FIX5_RENDER_OK** — BLENDER_EEVEE, 216/216 frame fresh (full overwrite mixed-era) |
| composite+ffmpeg+stills | `cc/composite.py` | 0 | 20.5s | **COMPOSITE_OK** rc [0,0,0] |
| probes | `cc/fix5_probe_full.py` | 0 | 1.1s | **FIX5_PROBE_OK** → `out/fix5_probe.json` |

Lưu ý vận hành: `seq -s,` (BSD) sinh dấu phẩy cuối → `int('')` ValueError ở lần gọi render đầu (script chết TRƯỚC khi render, 0 frame bị đụng); sửa bằng list python sạch, không đổi spec.

### Composite (FIX5/C)
- **k_run = 0.61272** (443/723) · **k_talk = 0.54223** (443/817) — constant scale, fixed crop window, giữ squash-stretch.
- **Talk window guard KHÔNG trigger**: content bbox raw [489,42,939,867] ⊂ window [485,40,943,870] (108 frame đo, talk_H_raw 826).
- Anchor rest-feet run 781 / talk 861 → feet line; talk cx 0.32·1080 / cy 0.88·1080; shadow giữ.

### Probes số (thr=25, max-channel |diff|)
| Probe | Số đo | Ngưỡng | Kết quả |
|---|---|---|---|
| (a) talk mouth-open: c0116 (closed) vs c0123 (mid open-cue, gap 0.2917s ≤0.3s), face window [cx±120 = 226..466] × rows [680,790] | **1281 px** (centroid [408,734]) | 300..6000 | **PASS** (adjacent pair 116/117 diagnostic: 419 px) |
| (b) run raw heights f1..f108 (flipped, alpha bbox): min **667** (f8) / max **955** (f5) | ratio **1.4318** | ≥1.15 | **PASS** |
| (c) blink c0133 (lid full) vs c0134 (open), eye window [196,695,496,760] | **641 px** (centroid [416,728]) | >500 | **PASS** |

### QC stills (out/qc_self/, trích từ mp4 cuối)
`fix5_t1.0.jpg` · `fix5_t3.2.jpg` · `fix5_t6.08.jpg` · `fix5_t7.87.jpg`

### Meta files
`out/fix5_probe.json` · `out/comp_meta.json` (ok=true) · `out/fix5_smoke_render_meta.json` (216f, 80.5s) · `out/fix5_render_full.log` · `out/fix5_composite.log` · `out/fix5_verify_fixloop.log`
