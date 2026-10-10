# COMPOSER_FACTS — v3.1 glasses + book (KidsStoryMultiScene)

File changed: `remotion-composer/src/KidsStoryMultiScene.tsx` ONLY (no Root.tsx, no other file).
All existing rig mechanics (pivots, blink/hop/sleep/wake/proud schedules, viseme, camera,
staging, scene map, crossfades, audio) untouched. No numeric rig parameter altered.

## Glasses (inside head group, after eyes map, BEFORE snout; outside blink scaleY group)
- Rings: for ex in TURT.eyesX [294,382] — `<ellipse cx=ex cy=630(TURT.eyeY) rx=27 ry=31
  fill=none stroke=#5b3a2f sw=7.5 round join>`. Rings at NOMINAL ex (do not follow tLookX;
  eyes shift up to ±5px behind rims). Ring inner top edge y≈602.75 clears eye top (607) by
  4.25px and sparkle top (617) by 14px — no grazing, no widening needed.
- Bridge: `M 321 622 Q 338 612 355 622` stroke #5b3a2f sw7 round cap.
- Temples: right `M 409 626 Q 428 618 440 634`; left `M 267 626 Q 248 618 243 637`.
  Both verified inside head silhouette incl. 14px head outline stroke (left cap tip x≈242
  vs outline outer edge ≈238). Static → ride head nod/tilt/proud rotate, never shrink on blink.

## Book (placement choice: TOPMOST — drawn LAST inside tBodyDy group, after rim ellipses)
- Left page: `M 472 793 L 548 799 L 548 831 L 472 825 Z`; right page mirrored
  `M 624 793 L 548 799 L 548 831 L 624 825 Z`. Fill #fbf3dd (lighter than belly #f5e6c8),
  border OUT sw7.5 round join/cap. Spine dips ~6px below outer corners (open-V).
- Spine line: `M 548 799 L 548 831` OUT sw4.5 round cap.
- Text hints (no glyphs): OUT sw3.2 opacity 0.5 round cap —
  L `481 803→524 806.4`, `481 811→526 814.8`, `481 819→509 821.2`;
  R mirrored `572 806.4→615 803`, `570 814.8→615 811`, `587 821.2→615 819`. Lengths 28–45px.
- Edges x472/624 overlap near-feet inner edges (476/617) by 4/7px — feet read gripping rim
  (book drawn on top). Mouth (312,716) to book ≥160px — never near mouth. Topmost chosen:
  probe f200/f754 showed clean grip + full book visibility (under-rim variant not needed).

## S5 book drop (pure function of t; held → ground)
- Held: center (548, 812) + tBodyDy (rides walk bob / proud bounce = "tay ôm").
- Fall 32.80→33.08, easeInQuad (`Easing.in(Easing.quad)` interpolate, clamped):
  x 548→350, y (held)→834, rot 0→−12°.
- Settle 33.08→33.25: dy = −3·sin(π·q) (±3px), then parked exactly at (350, 834, −12°)
  for the rest of the video (incl. f1182 @39.4s).
- Landed overlap with left front foot: max ~8.6px horizontal sliver (≤10 OK); center y834
  inside ground zone 830–845. Book drawn inside tBodyDy group with `−tBodyDy` compensation
  so the LANDED book stays fixed while the body keeps its proud bounce.
- LAND_X 350 (brief said ≈352; shifted 2px to keep foot overlap ≤10px — only deviation).
- Design-sheet note: sheet draws the book higher (chest); brief's explicit coordinates
  (belly, y793–830, feet-grip) were followed — brief is the contract.

## Build / render
- `npx tsc --noEmit` → clean (first try).
- `npx remotion render KidsStoryMultiScene ../character-performer/renders/kids_story_multiscene_v31.mp4`
  → 1188 frames encoded OK.

## Deliverable
- `/Users/tuyennguyen/project/OpenMontage/character-performer/renders/kids_story_multiscene_v31.mp4`
  — h264 1080x1080, 30fps, 1188 frames, 39.60s video + AAC audio (39.66s container),
  65,937,858 bytes ≈ 62.9 MiB.

## Probe self-review verdicts (all viewed via Read tool)
- f200 (6.67s) + face crop: PASS — mouth open mid-cue, rings around BOTH eyes, sparkles
  visible through rings, book at belly far from mouth.
- f410 (13.67s) + face crop: PASS — blink: eyes squashed thin INSIDE full unchanged rings
  (rings never shrink); bridge + temples intact.
- f754 (25.13s) + turtle crop: PASS — mid-walk, book hugged at belly (feet gripping rim),
  glasses on, mouth open mid-cue i5.
- f1008 (33.6s): PASS — proud pose, book lying on ground beside left front foot (lean,
  ≤10px overlap), confetti falling, glasses on.
- f1058 (35.27s) + face crop: PASS — mouth wide open, nothing covering it, glasses tilt
  with head (proud), sparkles through rings.
- f1080 (36.0s): PASS — rabbit clapping, turtle proud, book on ground.
- f1182 (39.4s): PASS — final frame clean, book still on ground, glasses on.
- compare_turtle_vs_sheet_v31.png: render matches approved sheet C (round glasses + open
  book now present).
- Fix rounds used: 0 (no re-render needed).

## Deviations from brief
1. LAND_X = 350 instead of ≈352 (2px, to honor the ≤10px foot-overlap rule).
2. Settle bounce implemented as −3·sin(π·q) (single up-blip then rest) — matches "±3px,
   easeOut" intent; no other deltas.
