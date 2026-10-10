# COMPOSER_FACTS — v3.3 ONE-PATH turtle construction (KidsStoryMultiScene)

Files changed: `remotion-composer/src/KidsStoryMultiScene.tsx` (TURT geometry + TurtleFigure
rebuild), `remotion-composer/src/TurtleStill.tsx` (rewritten: 3 single-pose comps),
`remotion-composer/src/Root.tsx` (ADD-only: TurtleStillWalk + TurtleStillProud comps).
Rabbit, scenes, camera, staging, audio, confetti and ALL t* animation envelopes untouched.
`TurtleFigureProps` interface unchanged — KidsStoryMultiScene compiles as-is.

## Core change vs v3.2
v3.2 drew the shell as OBJECTS stacked on the body (dome ellipse + rim ellipse, each with its
own OUT stroke, drawn last over a cream body-core ellipse) → owner read "nắp + hộp" (lid on a
box). v3.3: the ENTIRE body (shell + belly + tail) is ONE closed path; mai and belly are
REGIONS of that path painted through a clipPath. The shell physically cannot appear as a
second block.

## Body path (TURT.bodyPath) — "rounded loaf", facing LEFT
Cubic-Bézier closed loop, clockwise, anchors:
(470,846) bottom-left start → C(430,846)(405,824)→(400,780) left-bottom corner →
C(396,742)(400,706)→(418,676) left side → C(442,638)(486,612)→(540,612) dome top →
C(606,612)(660,646)→(672,700) right dome → C(678,728)(678,752)→(674,772) right side →
TAIL NUB: C(690,778)(706,786)→(706,800), C(706,812)(692,820)→(674,818) (tail is INSIDE the
same closed path; v3.2 separate tail ellipse deleted) → C(664,828)(648,842)→(620,846)
right-bottom corner → C(588,851)(520,851)→(470,846) bottom (sag ~851) → Z.
Extents ≈ x397..707 (incl. tail), y612..851. Belly band below equator ≈ 54px center / deeper
toward the corners.

## Equator (TURT.equatorPath) — mai|belly split + THE rim
`M 398 770 Q 540 822 675 770` — gentle sag, center y796, both ends ON the body-path edge.
Mai fill = same curve closed up to y560 (`M 398 770 Q 540 822 675 770 L 675 560 L 398 560 Z`),
fill #f2b53c, drawn INSIDE the body clip. Rim = ONE thin single stroke #c9821e sw6 round-cap
along the equator (v3.2's thick two-ellipse rim lip deleted). Measured rendered width ~13px
at still scale 2.14 (≈6px rig).

## clipPath id scheme (ids global per SVG doc, suffixed per instance)
`ms-t-body-clip-${clipSuffix}` — NEW: clipPath containing TURT.bodyPath; mai fill, scutes,
sheen, plastron lines and the rim stroke all render inside it. Replaces v3.2's
`ms-t-shell-clip` (dome-ellipse-inset clip, deleted). `ms-t-head-clip` / `ms-t-mouth-clip`
unchanged. clipSuffix values: `main` (video), `still` (all three still comps — one turtle
per SVG doc now).

## Paint order inside the tBodyDy group (v3.3)
1. far legs #7f8f38 sw10 (x 505/600, cy818 ry44 — tips peek ~13px below loaf bottom)
2. body base fill #f5e6c8 (whole path = belly base)
3. clipped interior: mai fill → scutes (hexPath #e8724a stroke OUT sw8, interior-only,
   never touching silhouette: (568,652,r24) (622,700,r19) (490,730,r21) (596,742,r17)
   (432,726,r15)) → sheen white ellipse (610,655) op.22 → plastron hints (2 thin
   horizontals `M 452 816 Q 540 826 628 816` / `M 468 838 Q 540 846 612 838`, OUT sw4
   op.3) → rim stroke
4. THE body outline: single stroke on TURT.bodyPath, OUT #3a2e2a sw13 (only body stroke)
5. head group (drawn OVER body): neck fill DELETED — the head's own overlap is the neck;
   head keeps its full sw14 stroke, no cut border. TURT.head unchanged (445,600,108,92) so
   the whole T_FACE (eyes/glasses/mouth/blush/snout) is untouched; tilt still pivots at
   TURT.neck (450,688) which is now a pivot-only constant
6. near legs #94a344 sw10 + toe lines (x 445/648, cy812 ry43, in FRONT of belly)
7. book topmost (v3.1 geometry + book.bodyY mechanic untouched)

Outer outlines in the figure = exactly 3 kinds: body path (a), head (b), legs (c: near + far
pairs). Tail adds none (inside path a).

## TurtleStill.tsx (3 comps, one file)
`TurtleStill` / `TurtleStillWalk` / `TurtleStillProud`, each 1080x1080 PURE WHITE, one
turtle, NO labels, NO ground line. Scale 750/350 ≈ 2.1429 (rig y508..858 = 350px → ~750px =
70% frame height), vertically centered via `translate(540 540) scale(2.1429)
translate(-540 -683)`. Poses (approved v3.2 params):
- idle: tHeadX/Y 0, tilt 0, tBodyDy 0, smile 36/26, book HELD (548, 812, rot 0)
- walk: tilt -2, tBodyDy -5, smile 36/26, book HELD
- proud: tHeadY -6, tilt +7, tBodyDy -11, smile 44/32, NO book
All: tEyeSy 1, tArcOp 0, tLookX 0, tMouth rx0 (closed smile), clipSuffix "still".

## Build / render (STILL ONLY — video render forbidden this round, not run)
- `npx tsc --noEmit` → clean first try
- `npx remotion still src/index.tsx TurtleStill|TurtleStillWalk|TurtleStillProud
  /Users/tuyennguyen/project/OpenMontage/character-performer/renders/turtle_v33_{idle,walk,proud}.png`

## Deliverables
renders/turtle_v33_idle.png, turtle_v33_walk.png, turtle_v33_proud.png (1080x1080 PNG)
+ qc_multiscene_v33/: qc_<pose>_full.png (copy) + qc_<pose>_equator.png (500x500 crop at
(140,430±poseDy) upscaled 2x → 1000x1000, LANCZOS; shows head junction, rim, front leg,
belly bottom ≈ front third of turtle).

## QC verdicts (PIL pixel-classification column scans + eyeball crops)
- All 3 PNGs: 1080x1080 RGB, corners pure (255,255,255), no alpha channel, ~60% white.
- Column scans (rendered x257 = rig x408, clear of book/legs; proud also x690/x583):
  sequence `MAI → RIM(13-14px) → CREAM` on every pose — exactly ONE thin rim between mai
  and belly, zero dark outline between them. Silhouette scans show only body/head/leg
  strokes (head-over-mai junction: head green → head stroke → mai, no cut line).
- idle/walk x690 shows RIM then OUT = the held BOOK's top edge (prop in front, same overlap
  as v3.2, intentional). Rear near-leg also crosses the rim zone (leg in front) — by design.
- Eyeball crops (all 3): ONE closed outline around the body; rim thin single; belly = bottom
  strip of the SAME mass (no lid/box read); scutes interior-only; kawaii face + glasses +
  book mechanics intact. Fix rounds used: 0.

## Deviations from brief
1. Tail folded into the body path as a rear nub (below equator → belly-cream colored) instead
   of keeping the separate stroked tail ellipse — required by "exactly 3 outer outlines";
   cream tail reads as underside, keeps one-mass unity.
2. v3.2 neck fill ellipse removed (head overlap itself is the neck per spec §4); TURT.neck
   kept as the tilt-pivot constant so animation mechanics are bit-identical.
3. Equator Q-curve (center sag to y796) replaces v3.2's rim-ellipse bottom arc — same visual
   role (curved horizon), now a fill boundary + single stroke instead of an object.

## Video round (v33)
Grip mechanic (lead-approved fix, gates this round): near legs now render AFTER the book
group (toes paint over the pages). `TURT_GRIP_DEG = 72`; front leg piv(445, 786, −72·tGrip),
rear leg piv(648, 786, +72·tGrip); toe detail lines rotate inside each leg group; `tGrip = 1 − bookFallP`
(so legs grip while held, release smoothly across the 32.8→33.08s fall). tGrip=0 is an identity
transform (proud pose bit-identical). Stills re-rendered: turtle_v33_{idle,walk,proud}.png (walk gate PASS).

Render: `npx remotion render src/index.tsx KidsStoryMultiScene renders/kids_story_multiscene_v33.mp4`
— 1188/1188 frames @30fps 1080x1080, h264 + AAC, 39.6s, 66,086,365 bytes (63.0 MB), no warnings.

Probe files (this dir): ffprobe_v33.txt; frames v33_f{045,200,332,660,690,754,836,1008,1067,1110,1121,1182}.png;
turtle crops (480x480 window, 2x LANCZOS -> 960x960): v33_f200_crop_turtle.png (ctr 760,755),
v33_f690_crop_turtle.png (ctr 640,750), v33_f754_crop_turtle.png (ctr 425,760),
v33_f1008_crop_turtle.png (ctr 420,760). Crop verdicts: f200/f690/f754 book HELD with both toes
planted on pages (incl. mid-walk); f1008 book PARKED on ground beside front-left foot, legs released.
