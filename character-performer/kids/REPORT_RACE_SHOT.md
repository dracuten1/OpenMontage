# REPORT_RACE_SHOT — Phase B RACE SHOT dual-character demo comp (demo-gate)

Task: Ep.01 bone-rig remake race shot. Date: 2026-10-14. Worker: rig-animator.
Comp: `KidsRaceRigDemo` 1080x1080 @30fps, 102 frames (3.4s), comp t=0 == episode t=17.49.

## 1. Asset prep (PIL un-flip FLIP_TOP_BOTTOM + copy)

| item | rabbit (rig_demo) | turtle (rig_turtle render-3) |
|---|---|---|
| source | `character-performer/kids/rig_demo/out/frames` | `character-performer/kids/rig_turtle/out/frames_t` |
| frames used | f0001..f0108 (108) | f0001..f0097 (97) |
| copied to | `remotion-composer/public/character-performer/kids/remake/rig_rabbit_run/` | `remotion-composer/public/character-performer/kids/remake/rig_turtle_walk/` |
| copied count | 108 | 97 |
| actual frame size | 1536x1024 | 1536x1024 (MEASURED — task said may be 1535 or 1536) |
| f0001 bottom-most content row | 989 (gap 34px from canvas bottom; within ~40px) | 923 (gap 100px from canvas bottom; EXCEEDS ~40px guide — walk-cycle f1 is a mid-stride pose; placement unaffected: bottom-center pin anchors content bottom to path Y) |
| union bbox px (all frames, alpha>0) | x 511..1087, y 5..989 | x 32..1510, y 93..936 |

Background `ep1_v2/bg6_walk.png` measured 1254x1254 (task said 1536x1024); drawn
with the V2-approved cover-fit geometry (1620x1080 at left:-270) so the bg6 road
centerline coordinates match the approved episode look.

## 2. reg.json entries appended (V2 Sprite semantics: fractions of image box)

`remotion-composer/public/character-performer/kids/remake/reg.json` (existing
entries untouched):

| field | rig_rabbit_run | rig_turtle_walk |
|---|---|---|
| w,h | 1536,1024 | 1536,1024 |
| t (union top / h) | 0.00488 | 0.09082 |
| b (rest feet row / h) | 0.96582 | 0.90137 |
| cx (union center / w) | 0.52051 | 0.50228 |
| chf (b - t) | 0.96094 | 0.81055 |
| cwf (union width / w) | 0.37565 | 0.96289 |

Pin math (V2 Sprite): imgH = H/chf, imgW = imgH*(w/h), left = x - imgW*cx,
top = y - imgH*b; shadow sw = imgW*cwf*0.72.

## 3. Comp + registration

- New comp: `remotion-composer/src/KidsRaceRigDemo.tsx` (pure function of frame;
  no Math.random/Date/CSS animation). Registered in `remotion-composer/src/Root.tsx`
  as id `KidsRaceRigDemo`, 1080x1080, fps 30, 102 frames — ADDITIVE edit only
  (import + one Composition block; existing entries untouched).
- BG: bg6_walk cover-fit (div left:-270, 1620x1080; Img scale 1.0 constant) —
  no zoom/pan/Ken Burns, no camera wrapper.
- Turtle (rendered before rabbit): idx=1+floor(t*24) clamp 1..97; polyLerp
  X-55 / Y; uT=0.72*clamp01(t/3.4); H=ip(uT,[0,1],[205,120]); opacity=ip(t,[0,0.2],[0,1]).
- Rabbit: idx=1+floor((t-0.30)*24) clamp 1..108, no loop; polyLerp X+40 / Y;
  u4=clamp01((t-0.30)/3.0) (easeOutCubic inside segments via polyLerp);
  H=ip(u4,[0,1],[400,170]); opacity=ip(t,[0,0.21],[0,1]). Fade-IN only.
- Shadow per V2: sw=imgW*cwf*0.72, rgba(30,25,20,0.28), blur 8, radius 50%.
- Audio: `<Sequence from={9}>` d4_rabbit.wav (comp t=0.30s); BGM k_bgm_v2.wav
  volume 0.3, loop. **Measured deviation**: k_bgm_v2.wav = exactly 17.500s =
  525 frames @30fps, so the spec's `startFrom={525}` leaves 0 frames and
  Remotion 4.0.484 `<Loop>` throws (render RC=1, first attempt). Used
  `startFrom={524}` — 1 frame (33ms) earlier into the loop bed; BGM then loops
  from position 0, matching episode phase at t=17.49 within 0.3 frames.
  d4_rabbit.wav measures 4.402s; the 3.4s shot plays its first 3.1s.

## 4. Checks + render + ffprobe (all measured)

- `npx tsc --noEmit`: 0 errors, exit 0 (run twice: pre-render and post-audio-fix).
- Static interpolate scan: 4 `ip()` call sites (turtle H, turtle opacity,
  rabbit H, rabbit opacity). All input arrays strictly increasing
  ([0,1],[0,0.2],[0,1],[0,0.21]); in/out lengths equal (2/2). Violations: 0.
- Render `npx remotion render KidsRaceRigDemo out/kids_race_rig_demo.mp4
  --concurrency=4 --log=error`: exit 0, wall 11.7s, output 1,136,140 bytes.
- ffprobe: h264, 1080x1080, r_frame_rate 30/1, duration 3.456s (102f + AAC
  padding), audio stream aac stereo present.

## 5. Shot QC (PIL only; methods + numbers in `remotion-composer/out/race_shot_qc.json`)

Camera-static proof: stills frame 8 vs 95, 120x120 sky patch (x 60..180,
y 40..160): mean|diff| = **0.0** (threshold 2.0) — PASS.

Seam check (carry-forward): comp frame 16 (t=0.533, turtle src f13). Source
f13 alpha in window x 1038..1060 has exactly one interior gap: rows 744..747
(4 rows, head-bottom<->shell-top) — the Phase A residual seam. Mapped to comp
rows 793..797 (band +-2). Interior bleed columns (median |still-BGREF| < 15
where source is opaque above AND below the band): **0 comp px**; worst
contiguous run 0 px → **ACCEPT (<= 8)**. Cause: 4 src rows = 0.94 comp rows
at H=195; bilinear downscale closes the sub-pixel gap. (58 comp px of
silhouette-margin "bleed" are transparent-by-design canvas inside the bbox —
left margin 0..17, right 320..360 above the shell slope — not defects.)

Sprite heights (measured head-to-feet vs exact pin-math label composite, and
vs spec H; diff>25 vs BGREF counted only at each sprite's own footprint
columns):

| still | t | sprite | src f | spec H | measured | err vs pinned geometry | err vs spec H |
|---|---|---|---|---|---|---|---|
| 1 (f18) | 0.6s | turtle | 15 | 194.2 | 195 | -0.0% | +0.5% |
| 1 (f18) | 0.6s | rabbit | 8 | 377.0 | 257 | -0.4% | -31.8% |
| 2 (f51) | 1.7s | turtle | 41 | 174.4 | 174 | 0.0% | 0.0% |
| 2 (f51) | 1.7s | rabbit | 34 | 292.7 | 206 | -0.5% | -29.5% |
| 3 (f87) | 2.9s | turtle | 70 | 152.8 | 153 | -0.6% | 0.0% |
| 3 (f87) | 2.9s | rabbit | 63 | 200.7 | 171 | -0.6% | -14.8% |

All 6 within 0.6% of the pinned geometry — the comp renders the pin math
exactly. Rabbit-vs-specH shortfall (-14.8..-31.8%) is stride phase: spec H is
the union-envelope height (union top row 5 = extreme ear-reach pose); at
f8/f34/f63 the ears are tucked, so per-frame content is shorter. Not a scale
error (pinned-geometry err <=0.6%). Turtle silhouette is stable, so it
matches spec H directly.

## 6. Artifacts

- Comp video: `remotion-composer/out/kids_race_rig_demo.mp4` (RC 0, 11.7s render)
- Stills: `remotion-composer/out/race_still_{1,2,3}.jpg` (f18/51/87, RC 0),
  `remotion-composer/out/race_still_seam.jpg` (f16, RC 0),
  `remotion-composer/out/race_cam_f{8,95}.png` (RC 0)
- QC json (all numbers): `remotion-composer/out/race_shot_qc.json`
- Scripts: `character-performer/kids/race_shot/{prep_assets,qc_shot3,assemble_qc}.py`
  (qc_shot/qc_shot2.py superseded — measurement-method iterations, kept on disk)
- Frame sets: `remotion-composer/public/character-performer/kids/remake/rig_rabbit_run/`
  (108), `.../rig_turtle_walk/` (97)

Untouched per constraints: rig_demo frames, rig_turtle frames/parts, blend
files, skill files, KidsStoryEp1V2.tsx, KidsStoryEp1Remake*, other comps,
existing Root.tsx entries, existing reg.json entries.

## FIX1 — horizontal separation (2026-10-14)

Trigger: Hermes vision QC (t=0.6/1.7/2.9) — rabbit covered turtle's head;
depth read ambiguous. Cause: lanes (+40/-55) vs content widths (rabbit ~222px,
turtle ~346px at H schedules); near-vertical path adds no X separation.

### Params changed (staging ONLY — camera/timeline/TTS/bg untouched)

- Lanes: turtle -55 → **-135**, rabbit +40 → **+95** (TSX `TUR_X`/`RAB_X`).
- Turtle uT cap: 0.72 → **0.62**. Turtle H [205,120] unchanged (end ≥110 ✓).
- Rabbit H [400,170], delays (rabbit 0.30s, turtle 0s) unchanged.
- Pin-math pre-check (`race_shot/fix1_pinmath.py`, per-frame cwf×H widths):
  the suggested lane band (+70..+85 / -105..-125) could NOT meet the A1 dx
  bar at t=0.6 (best margin **-5px**); lanes went 10px wider than suggested.

### A1 — separation (still f18/51/87; pin-math per-frame bboxes, render
corroboration: rabbit presence at expected footprint 99.4/100/99.5%,
0 unexpected gap-content columns)

| t | wR | wT | dx | thr=0.5(wR+wT)-0.25min | margin | overlap (dx-formula / edge) | pixel co-occupancy | in turtle head |
|---|---|---|---|---|---|---|---|---|
| 0.6 | 181 | 340 | 231.2 | 215.2 | **+16.0** | 16.2% / 28.2% of narrower | 2116 px (rows 695-763) | **0 px** (head rows 644-673) |
| 1.7 | 139 | 312 | 223.0 | 190.8 | **+32.3** | 1.8% / 15.1% | 0 | 0 |
| 2.9 | 100 | 283 | 247.2 | 166.5 | **+80.7** | 0.0% / 0.0% | 0 | 0 |

Both readings pass (bars: dx ≥ thr; overlap ≤50% of narrower). Turtle head
(topmost 15% cluster) never covered — co-occupancy at t=0.6 sits at the
turtle's right shell/leg edge only, 22px below the head block.

### A2 — on-road (12px band starting 40px below feet, sprite content
columns, sampled on the rendered stills f9/36/63/87)

**Predicate deviation (measured):** the literal fix3 predicate
(R150-205/G105-155/B65-110/R-B>45) fires **0.000** on bg6 everywhere —
it describes the rig_demo composite road. bg6's road measures R 210-250,
G 110-165, B 50-100 (R-G ≈ 80-100). Pass bar applied on a bg6-calibrated
predicate keeping the fix3 structure (R195-255, G95-185, B35-130, R-B>45,
R-G≥35; rejects grass G≥R). Literal ratios also stored in the QC json.

| t | turtle dirt | rabbit dirt |
|---|---|---|
| 0.3 | 0.831 | 0.651 |
| 1.2 | 0.967 | 0.998 |
| 2.1 | 1.000 | 0.998 |
| 2.9 | 1.000 | 1.000 |

All ≥ 0.45 → PASS. (Shadow-blur tails measured up to 79px below feet;
band start 40px sits past them except documented tail — zones excluded
geometrically in A1 scans.)

### A3 — camera static: f8 vs f95 sky patch mean|diff| = **0.0** (<2.0) PASS

### A4 — build/render: `npx tsc --noEmit` RC 0; render RC 0, wall **10.45s**;
ffprobe h264 **1080x1080, 102 frames, 30/1 fps**, aac 48000Hz stereo present.

### Artifacts (overwritten in place)

- `remotion-composer/out/kids_race_rig_demo.mp4` (1,229,193 B)
- `remotion-composer/out/race_still_{1,2,3}.jpg` (f18/51/87), `race_cam_f{8,95}.png`
- `remotion-composer/out/race_shot_qc.json` (+ `fix1` block, all numbers)
- Diagnostic (new): `remotion-composer/out/race_fix1_f{9,36,63}.jpg`,
  `race_shot_qc_partial_fix1.json`
- Scripts (new): `race_shot/fix1_pinmath.py`, `race_shot/fix1_qc.py`,
  `race_shot/fix1_assemble.py`

Measurement caveat recorded: browser-vs-PIL bg reconstruction differs >25 in
sky gradient and grass texture; sprite checks therefore use bounded windows,
per-column hit counts, and expected-composite conjunctions (details in
fix1_qc.py header).
