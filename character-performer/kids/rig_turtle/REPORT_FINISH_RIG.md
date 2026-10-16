# REPORT_FINISH_RIG.md -- Turtle rig finish + Phase-B fix (final)

Date: 2026-10-14. Agent: rig-animator. Budget: $0 (no network, no model calls,
no image gen). All paths under
`/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle/`.

## Phase A -- first-run verification (kept as history; verdict FAIL)

Blend on disk at first run predated every mandatory fix except #2. Measured:
(a) all 4 leg sprites parent_bone='hips' (never touching leg_*_b) FAIL;
(c) last keys at 149/151/234/245 < 248 FAIL; (d) only euler[1] keyed, local-Z
never FAIL; (e) head bone translation-y spread 0.05220 BU (>1e-4) FAIL
(mouth/eyelid patches tracked rigidly, 1.6e-6/2.05e-6 PASS); (f) cycle
amplitudes hips 1.7321 deg, head 5.0 deg (budget 1.0/3.0) FAIL; gait: 3 px
lockstep bob, all pairs phase_diff 0 FAIL; (b) head-copy patches PASS;
seam/halo PASS (static); no re-render triggered; mouth spot-check max 2.15.

## Phase B -- fixes applied (backup: out/turtle_rig_pre_fix.blend)

1. `cc/fix_rig.py` (FIX_RIG_OK, rc 0): roll-aligned hips/head_b/tail_b local Z
   to world +/-Y via `edit_bone.align_roll`; re-parented 4 leg sprites to their
   own leg_*_b bones (mpi=Identity, build-style matrix_basis solve; rest
   registration residual <= 1.43e-6); converted body rotations euler[1]->euler[2]
   (local Z) with amplitude scaling hips x0.5778 -> 1.0 deg full, head x0.3873
   -> 3.0 deg full (1.9355 deg cycle), tail kept 14.0 deg; loop-extended every
   channel to f248 (hips P=24 step 4, tail P=12 step 3, bob P=12 step 3,
   targets P=24 on-twos; head re-keyed at original nod key times + pure-cycle
   extension 237..248). Mouth/eyelid material actions untouched.
2. `cc/finish_underpaint.py` cap v1 (head-only, 40 px, shell palette, 6083 px)
   -> render 2 (100.9 s, rc 0, 248 frames).
3. Gait diagnosis on render 2: targets in blend perfectly diagonal
   (`out/target_phase.json`: NF-FH lag 0 r=1.0, NH-FF lag 0 r=1.0), but pixels
   showed far_hind ANTIPHASE to its target (pixel x_min@f1 vs target x_max@f1;
   other three legs matched targets). Far-hind sprite mounts opposite the IK
   bone swing. Fix: `cc/fix_gait.py` shifted far_hind_target location curves by
   12 f (half cycle; z is P=12 so unaffected; 125 keys/axis, CONSTANT interp).
4. Seam diagnosis: render-2 neck gap growth 11->29 px worst / 120 cols at f13;
   0/60 sampled gap columns shell-covered; head in-plane roll at that lever is
   only ~8 px horizontal, so the gap is the near-front leg (~31 px centroid
   swing) vacating under-chin columns. Caps: v2 (110 px, notch rule; 4314
   shell-hidden px, 0 visible -- rule too strict) superseded by v3
   (`cc/finish_underpaint3.py`: 110 px below true head bottom edge, paint where
   covered at rest by any other part -- 23,813 edge-color px, 0 floating).
   -> render 3 (100.5 s, rc 0, 248 frames, EEVEE 1536x1024, V-flipped storage).

## Phase B -- re-probe results (render 3 + fixed blend)

Structural `cc/finish_verify.py` (rc 0, FINISH_VERIFY_OK), all PASS:
(a) legs own_bone_only (parent_bone=leg_*_b, no hips VGs); (b) patches
same-parent, mpi diff 0.0, own mesh, M_mouth/M_eyelid, tracking 1.6e-6/2.05e-6;
(c) all fcurves keyed to f248 (incl. re-phased far_hind target); (d) local-Z
euler keyed for hips/head_b/tail_b, world axes (0,1,0)+/-0.001; (e) head bone
trans-y spread 0.0, world-Y row spread 0.0 (<1e-4); (f) hips 1.0 deg full
(=budget), head 3.0 deg full / 1.9355 deg cycle, tail 14.0 deg.

Gait (`out/gait_lag.json`, x-centroid lag correlation, 24 f cycle, bands
y820-1010; shell ends y808 so bands are shell-free): PASS diagonal.
NF-vs-FH lag 0 r 0.9805; NH-vs-FF lag 0 r 0.860; NF-vs-NH lag -10 (==14 mod 24,
2 f off 12, within on-twos quantization); FF-vs-FH lag 12 r 0.743.
Strides (x-swing amplitude): NH 22.5, FH 24.2, NF 31.3, FF 20.6 px
(all >> 3 px lockstep). Tip lift 13-27 px/leg. NOTE: `leg_phase` inside
qc_probe.json uses argmin(y_tip), which double-counts pendulum swings and is
unreliable; the lag correlations above are the authoritative measure.

Seam (PIL, criterion growth >= 2 px vs f1): FAIL after 2 attempts, reported
with numbers. Rest baseline neck now 0 cols >= 8 px (pre-fix: 11 px worst /
64 cols). Residual: f13 neck worst 21 px / 21 cols at x~1049 (was 29 px /
120 cols after v1). leg_roots never grows (172 -> 127 worst at f13, improved).
Mechanism: near-front leg swing under the chin at its x-extremes (f13/f19);
head cap rotates with the head and cannot chase the leg. Halo PASS
(ring max L 71.0 vs solid max 197.0).

Mouth guard: PASS on ground truth. Blend (`out/mouth_blend_truth.json`):
M_mouth + M_eyelid AlphaKey deviation across f1..f97 = 0.0 exactly; value 0.0
at f98/f99, 1.0 at f105 (talk keys >= f98, spec respected; walk did not open
the mouth). Pixel box (1274,428,1366,501) raw max 9.67 with 75 frames > 2.2,
but dips <= 2.2 at every nod zero-crossing (f15-16,24-26,39-40,48-50,63-64,
72-74,87-88,96-97) -> trips are 3-deg head-nod pose displacement inside the
fixed box, not mouth state; shift compensation (max 5.55) cannot fully cancel
a roll. Mouth closed f1..f97: proven.

Filmstrip regenerated on render 3: `out/rig_cycle_strip.jpg` (2208x1456 q88;
row 1 f1/7/13/19 upright 0.35x on pale green; rows 2-3: 2x NEAREST crops
neck + leg-root).

## Verdict summary

| Check | Phase A | Phase B (final) |
|---|---|---|
| (a) leg binding | FAIL | PASS |
| (b) head-copy patches | PASS | PASS |
| (c) keys to f248 | FAIL | PASS |
| (d) local-Z in-plane | FAIL | PASS |
| (e) head XZ stability | FAIL (0.0522 BU) | PASS (0.0 spread) |
| (f) amplitudes | FAIL | PASS (1.0 / 3.0 / 14.0 deg) |
| Diagonal gait | FAIL (3 px lockstep) | PASS (lags 0/0/12+/-2, strides 20.6-31.3 px) |
| Seam | PASS (static) | FAIL by criterion (f13 neck 21 px / 21 cols; baseline clean; 2 attempts used) |
| Halo | PASS | PASS |
| Mouth guard 1..97 | OK | PASS (blend deviation 0.0; pixel trips = nod displacement) |

Renders: #2 100.9 s rc 0; #3 100.5 s rc 0 (248 frames each, RENDER_OK).
Out/frames_t now = render 3.

## Artifacts

- out/qc_rig.json -- final merged QC (structural + probe + gait + seam_final +
  mouth_guard + underpaint + gait_fix + rerender)
- out/qc_rig_verify.json, out/qc_probe.json -- raw per-side detail
- out/gait_lag.json, out/target_phase.json -- gait measures
- out/mouth_blend_truth.json, out/mouth_guard_r3.json, out/mouth_guard_comp.json
- out/underpaint_meta.json (v1), underpaint2_meta.json, underpaint3_meta.json
- out/fix_rig.json, out/fix_gait.json -- fix receipts
- out/render_meta.json; out/rig_cycle_strip.jpg
- out/turtle_rig.blend (fixed), out/turtle_rig_pre_fix.blend (backup),
  out/parts/head.png (capped), out/parts_orig/head.png (original)

No SSOT files, rabbit assets, skill files, or remotion sources touched.
