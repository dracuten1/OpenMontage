# COMPOSER_FACTS — v3.2 unified turtle body construction (KidsStoryMultiScene)

Files changed: `remotion-composer/src/KidsStoryMultiScene.tsx` (turtle-only rebuild +
TurtleFigure extraction), `remotion-composer/src/TurtleStill.tsx` (new), `remotion-composer/src/Root.tsx`
(ADD-only: import + TurtleStill composition). Rabbit, scenes, camera, staging, audio,
confetti, and ALL t* animation envelopes untouched (mechanics identical — only geometry).

## New construction (strict z-order inside the tBodyDy group)
1. ground shadow (unchanged, outside tBodyDy)
2. z4 tail — keep (688, 802, rx24 ry15), drawn BEHIND body core
3. z3 far legs — x kept [505, 600], cy 800→818, ry 38→44 (#7f8f38): tips now peek
   ~12–17px below the body-core bottom (with old size they were 100% hidden behind
   the taller core)
4. z1 BODY CORE — ONE cream ellipse #f5e6c8 + OUT sw10: cx540 cy788 rx132 ry64
   (x408..672, y724..852). Contains belly + hips. OLD separate belly path (~line 650
   v3.1) DELETED — belly is now the visible bottom strip of this core below the rim.
5. z2 head — moved to TOP-FRONT: (445, 600) rx108 ry92 (was side 352,655). Head top
   y508 pokes ~98px above dome top y606; lower-right tucks behind dome. Neck #94a344
   (450, 688, rx58 ry66), tilt pivot at neck center (same contract as before).
6. z3 near legs — keep (445/648, cy812 rx31 ry43, toe lines); in FRONT of body core,
   tops (y769) tucked under rim bottom edge (~792–795 there)
7. z5 shell LAST — dome #f2b53c + hex scuts + sheen + rim #e09a30 unchanged
   (540,700/138/94 + 540,766/150/38); covers upper body core, rim = curved horizon.
   Belly strip visible: ~48px at center, tapering ~14px at the sides.
8. book topmost (unchanged v3.1 geometry): x472..624 y793..831 over near-feet inner
   edges (grip 4/7px) — belly strip at book x starts y~800, book overlaps rim bottom
   by ~7px, reads as held against belly in front of rim. No collision with new
   head/mouth (mouth y661, book top 793).

## Face relocation approach (single-point parameterization)
New module const `T_FACE` derives EVERY face coord from `TURT.head` using the approved
v3.1 offsets: eyeY = cy−25; eyesX = cx−58 / cx+30; mouth = (cx−40, cy+61); blush
(cx−80, cy+27)/(cx+68, cy+31); snout (cx−100, cy+15); nostrils (cx−105, cy+10)/(cx−98,
cy+7); glasses bridge M(cx−31, eyeY−8) Q(cx−14, eyeY−18) (cx+3, eyeY−8); temples
(cx±57..88 / −85..−109, eyeY−4..+7). One TURT.head change relocates the whole face.
Clip defs (shell/head/mouth) moved INSIDE TurtleFigure with `-${clipSuffix}` ids
(`main` in the video comp; `idle/walk/proud` in the still) — 3 instances per SVG doc,
no id collisions, no clip artifacts observed.

## TurtleFigure extraction
Module-level component, props: tHeadX, tHeadY, tHeadTilt, tBodyDy, tEyeSy, tArcOp,
tLookX, tMouth{rx,ry}, tMouthOp, tTongueOp, tSmileOp, tSmileW, tSmileD,
book{x,bodyY,rot}|null, clipSuffix. Main comp renders it inside the existing
translate/scale wrapper passing the same computed values — zero behavior change.

## TurtleStill (approval comp)
1080x1080 white bg, ground line y880 (#d9cfc2), 3 instances scale 0.60 at x 195/540/885,
labels "idle/walk/proud" Baloo 2 40px #3a2e2a at y972.
- idle: 0/0/0, tBodyDy 0, smile 36/26, book HELD (548, 812, rot 0)
- walk: tilt −2, tBodyDy −5 (bob raised), book HELD (body-local y812 → world rides bob)
- proud: tHeadY −6, tilt +7, tBodyDy −11, smile 44/32, NO book
All: tEyeSy 1, tArcOp 0, tLookX 0, tMouth rx0 (closed smile).

## Build / render (STILL ONLY — video render forbidden this round, not run)
- `npx tsc --noEmit` → clean (first try)
- `npx remotion still TurtleStill ../character-performer/renders/turtle_v32_review.png` → OK

## Deliverable
`/Users/tuyennguyen/project/OpenMontage/character-performer/renders/turtle_v32_review.png`
(1080x1080 PNG, 3 poses + labels)

## QC verdicts (viewed via Read tool, full still + 3 zoom crops)
- Full still: PASS — all 3 silhouettes read as ONE unified turtle block: head pokes
  above shell edge, dome covers back, continuous cream belly strip below rim, legs +
  dark far-leg tips + tail under it. No "box lid + tag" read anywhere.
- qc_idle_full.png (3x): PASS — old belly path gone (no stray edge), shell rim is the
  only horizon line, near-leg tops hidden under rim, book at belly with feet gripping.
- qc_idle_face.png (4x): PASS — glasses rings around BOTH eyes, sparkles visible
  through rings (ring top clears eye top by 4.25px, same as v3.1 since offsets kept),
  bridge + temples inside head outline, smile + dimples + snout correct.
- qc_walk_proud_belly.png: PASS — walk holds book raised with bob; proud has NO book,
  wider smile, body raised; far-leg dark tips peek below belly on both.
- Fix rounds used: 0.

## Deviations from brief
1. Far legs lengthened (cy 818 ry 44) instead of strict "keep" — kept x positions but
   old size left them fully hidden behind the new body core (invisible far pair).
2. Body core is a plain ellipse (brief allowed "oval/bean"); no bean path needed.
3. Walk-pose book passed as body-local (548, 812) — matches main-comp held contract
   (world y = 812 + tBodyDy) rather than naive (548, 812+dy) double-compensation.
