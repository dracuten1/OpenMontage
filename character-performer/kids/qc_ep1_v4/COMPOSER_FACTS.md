# COMPOSER_FACTS — KidsStoryEp1V4 (Ep.01 remake: v4 side-view turtle + dialogue_v2)

Files changed (ADD-only): `remotion-composer/src/KidsStoryEp1V4.tsx` (new comp),
`remotion-composer/src/Root.tsx` (+1 import, +1 Composition — 9 insertions, 0 deletions),
`remotion-composer/public/character-performer/kids/dialogue_v2/` (copy of source, 17 files).
Rigs, KidsStoryMultiScene, TurtleStill*, tsconfig untouched. `npx tsc --noEmit` → 0 errors.

## Scene boundaries (gap centers between dialogue_v2 cues; XF half-window 0.25)
S1 k_base 0→9.62 · S2 sc2_race →17.97 · S3 sc3_tree →22.97 · S4 sc4_path →29.72
S5 sc5_sunset →34.26 · S6 sc6_finish →40.66. Crossfades 0.5s centered; bg fade pairs
[9.37,9.87] [17.72,18.22] [22.72,23.22] [29.47,29.97] [34.01,34.51]. Camera = old
crossfade-blend `cameraAt`; Ken Burns: S1 push-in+rise, S2 pull-out+pan-left, S3 push-in
+drift-right, S4 gentle push-in ONLY (crawl is the motion), S5 push-in+right-drift,
S6 pull-out reveal.

## Staging final values (1080x1080)
Turtle wrapper `translate(x 856) scale(dir*0.88 0.88) translate(-572 -859)`; TS=0.88 const.
| window | turtle x | dir | rabbit x | rabbit S | rabbit gy |
|---|---|---|---|---|---|
| S1 pre-entry (<4.3) | −80 (nose tip peeks at left edge) | −1 | 1160→700 (0.2→1.4) | 0.78 | 856 |
| S1 crawl 4.3→8.4 | −80→380 linear | −1 | 700 | 0.78 | 856 |
| T12 / S2 | 380→360 | −1 (faces rabbit@720) | 700→720 | 0.78 | 856 |
| T23 / S3 | 360→1250 exits right | −1→+1 flip @ t=20.0 (x≈1250, invisible) | 720→−150; RUN −130→740 @18.7→21.4 (~322px/s) | 0.78 | 856 |
| T34 / S4 | re-stage 1250→1150 under X34 fade (slideP c=23.0), crawl 1150→380 @23.4→29.3 | +1 | 740→900 corner | 0.78→0.62 | 856→1000 |
| T45 / S5 | 380→430, idle | +1 | 900→880 | 0.62→0.72 | 1000→940 |
| T56 / S6 | 430→540 (crawl burst) | +1 | 880→760 | 0.72→0.78 | 940→856 |

Turtle WALKS (drive schedule.walk per-frame): [4.3–8.4], [23.4–29.3], [33.89–34.64];
else {t0:−10,t1:−9} (planted). lookX mirror-aware: `tLookX = dir * (speaker? −2 : −5) * sign(turtleX−rabbitX)`.

## Book landing (verified by still f1085, NO tuning needed)
fall [34.5,34.78], settleEnd 34.95, held (470,816), **groundY 842, landX 405, landRot −10**
(page bottom ≈ local y860 ≈ world ground 856; book spans world x≈303–460, front foot ≈495–543).
Brief values used as-is — 0 px adjustment.

## Rabbit schedule
blinks [1.4,5.8,10.3,15.2,25.4,27.0,33.5,36.2,38.6]; hops 0.35/0.85 (greet 34), 2.7 (30),
10.6 (confident 34), 19.0…21.1 every ~0.35s (run, 30). sleepIn [21.5,22.0] at oak x740;
corner nap (900,1000,0.62) whole S4 drawn AFTER turtle (in front); wake @i6: sleepOut
[30.01,30.15], wakePop [30.01–30.33 / 30.26–31.11], jerk [30.01–30.19 / 30.23–30.86];
clap [35.6,35.8 → 39.8,40.0]. Run afterimages: 2 ghost rabbits at x−70 (op 0.15) / x−140
(op 0.08), 18.7–21.2, cues null, clipSuffix gA/gB. Pose labels: rabbit rig is front-view —
"walk" label used during the run but the visual run = hopState bounces (rig has no walk pose).

## S5 long shadows
Window 29.9→34.2, 0.4s edge fades, peak opacity 0.20, fill #2e5d34, ry 22, stretched RIGHT
(sc5_sunset sun is LOW-LEFT). rx = 2.2× each character's rig ground-shadow width
(turtle 170·0.88 → 330; rabbit 150·S), center offset +0.45·rx. DEVIATION: read "2.2×
character width" as 2.2× base shadow width — literal body-width reading (rx≈700) would
overrun the canvas. zZz generalized: anchored to head-top world y (gy−446·S), scaled k=S/0.78.

## Audio
8 Sequences from=round(start·30), src dialogue_v2/d{i}_{who}.wav; cues d{i}_cues.json,
lookup t−line.start. BGM: single <Audio volume={0.42}> dialogue/bgm_dialogue.wav — 45.0s ≥
40.66s total, NO loop needed. Confetti: CONF_N 36, START 35.0, FALL 6.5 (old hash/shape code).

## Render + verification
Command (from remotion-composer/): `npx remotion render src/index.tsx KidsStoryEp1V4
../character-performer/renders/kids_story_ep1_v4.mp4` — 1220/1220 frames, no warnings.
Output: renders/kids_story_ep1_v4.mp4, h264 1080×1080 30fps, 1220 frames = 40.67s,
AAC audio stream, 58,792,930 bytes (56.1 MiB / 58.8 MB).
Still gates (npx remotion still … --frame=N): f180 PASS (crawl-in facing right, book held,
rabbit center), f790 PASS (4 legs + tail + belly readable mid-road, rabbit asleep corner),
f1085 PASS (proud, book ON ground beside foot, confetti, clap) — first try, 0 fix rounds.
Mid-cue lip-sync: f180 turtle + f461 turtle + f350 rabbit + f960 rabbit all open-viseme.
Run/ghosts f595, startle+long-shadows f912, crossfades f289/f539/f689/f891/f1028, final f1219 clean.

## Deviations from brief
1. S4 re-stage slide 1250→1150 across the X34 fade (slideP center 23.0) — brief left the
   pre-crawl x unspecified; without it the nose pops 100px at crawl start 23.4.
2. S1 pre-entry hold at −80 (brief start value kept; nose tip visibly peeks at the left
   edge during i0 — reads as "waiting to be introduced", no pop at crawl start).
3. Long-shadow rx interpreted as 2.2× base shadow width (see above).
4. Rabbit "walk" pose is advisory only — front-view rig has no walk geometry (noted).
