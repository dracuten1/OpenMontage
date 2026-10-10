# COMPOSER_FACTS_v4 — turtle rig v4 SIDE-VIEW (design-gate stills)

Files changed: `remotion-composer/src/rigs/GoldenTurtle.tsx` (TurtleFigure rebuilt
side-view; GoldenTurtle envelope kept + tCrawl), NEW
`remotion-composer/src/rigs/specs/turtle.kawaii.v4.side.json` (all v4 geometry;
turtle.kawaii.json untouched on disk), NEW `remotion-composer/src/TurtleStillV4.tsx`
(3 still comps), `remotion-composer/src/Root.tsx` (ADD-only: 3 TurtleStillV4*
compositions, 30f/30fps/1080x1080). TurtleStill.tsx / KidsStoryMultiScene.tsx /
KawaiiRabbit untouched; KidsStoryMultiScene compiles as-is (TurtleFigureProps frozen
+ ONE optional `tCrawl?: number`). `npx tsc --noEmit` clean. NO video render.

## Core change vs v3.3
Front-view (shell ≈80% of mass) → SIDE-VIEW crawling turtle facing LEFT. Shell =
mai dome x512..712 (~200px = 55-60% of body length incl. head+tail), 4 paddle legs
(near #94a344 sw10 + toe lines, far LIGHTENED #a5b354 sw9, depth cue "gần đậm xa
nhạt"), tapered tail cone (head-skin color, drawn BEHIND body, base overlap hidden),
belly band cream #f5e6c8 under the rim. ONE-PATH construction kept: bodyPath =
ONE closed horizontal loaf `M 512 772 C…dome top (612,608)…(712,772) C…belly sag
(664,809)/(552,808)… Z`; mai = region above equator `M 512 772 Q 612 788 712 772`
painted through the body clipPath; rim = ONE thin #c9821e stroke; NO second shell
object. Head (460,698,rx57,ry60) overlaps shell front-top — overlap IS the neck
(full sw12 stroke, no cut border); tilt pivots at neck (505,740) with sign FLIPPED
so positive tHeadTilt = nose UP.

## Side-view face (derived from head anchor, TURT_FACE)
ONE eye (444,686) rx16 ry20 + 2 glints, blink scaleY + arc; glasses = ONE lens
ring rx23 ry27 #5b3a2f sw7 + temple Q-arm back over the "ear" + tiny bridge stub
toward the nose (static, outside blink group); ONE blush (468,722) rot 10; mouth
viseme at (440,736) ROTATED +15° (side-open, tongue clip inside rotated group);
closed smile + ONE dimple behind; nostril dot (411,710); NO beak-snout ellipse.

## Crawl mechanic (tCrawl 0..1, diagonal pairs)
near-front(548)+far-rear(630) phase 0; near-rear(678)+far-front(590) phase π.
angle = 16°·sin(2π·tCrawl+φ) about each hip (hipY 778/780, legs rx24 ry38, tips
≈854); toe lift = −5·max(0,sin). Near-front blends with the book grip:
totalRot = crawlAngle·(1−tGrip) + 55·tGrip (toes land ON the pages), lift·(1−tGrip).
GoldenTurtle: peek/head-extend along −x `−(4+4·peek)−4·min(1,envT)`; nods/proud/
bounce/walkBob/book-fall formulas verbatim; NEW tCrawl =
walkActive ? ((t−walk.t0) mod 1.1)/1.1 : 0, passed down.

## Book (side-view rebuild of v3.1 geometry)
home (470,816), pages 394..546 (y794..826) #fbf3dd + text lines; held rot −6°
in stills; under the chin, ahead of the shell, does NOT cover the face; rendered
after body+head, BEFORE near legs (gripping toes paint over pages).

## Still comps (TurtleStillV4.tsx)
Scale 2.60 (rig 363x258 → 944x671 canvas, 68px margins, rim sw6 → 15.6px ≤ gate),
center translate(540 540) scale(2.6) translate(−572 −730), clipSuffix "v4".
- Idle: tCrawl 0, TALKING tMouth {22,19} op1 tongue .5, book HELD, tGrip 1.
- Walk: tCrawl 0.75 (near-rear+far-front mid-swing at sin=+1: +16° & −5px lift;
  near-front grips book, far-rear planted), tBodyDy −4, tHeadX −4, tilt −2,
  closed smile 34/24, book HELD, tGrip 1.
- Proud: tHeadY −8, tilt +8 (nose up), tBodyDy −10, smile 42/32, NO book,
  tGrip 0, legs planted.
All: tEyeSy 1, tArcOp 0, tLookX 0, pure-white 1080².

## Render (STILL ONLY — video render banned this round, not run)
`npx tsc --noEmit` → clean (every round).
`npx remotion still src/index.tsx TurtleStillV4{Idle,Walk,Proud}
 /Users/tuyennguyen/project/OpenMontage/character-performer/renders/turtle_v4_{crawl_idle,crawl_walk,proud}.png`
Deliverables: turtle_v4_crawl_idle.png (135,345 B), turtle_v4_crawl_walk.png
(135,001 B), turtle_v4_proud.png (122,097 B).

## QC verdicts (PIL pixel classification — qc_turtle_v4.py → qc_report.txt)
- q1 PASS x3: 1080x1080 RGB, 4 corners pure white.
- q2 PASS x3: shadow-tint-excluded turtle mask = exactly 1 component ≥500px
  (book welded to gripped toes; legs/tail/head all connected).
- q3 PASS x3: columns rig x596/x606: mai → rim 15px (≤16 gate) → cream, NO dark
  run between mai and cream; head-over-shell junction (scan from rig x480,
  behind the face): skin → exactly 1 dark run (head stroke) → mai, no cut line.
- q4 PASS x3: shell_w/full_w = 0.520-0.522 (gate 0.52..0.62; measured mai row at
  rig y740 — conservative, head occludes mai's front edge; nominal 200/357=0.56);
  head protrusion 325-330px (≥20); tail skin span 57-58px behind shell rear
  (≥15); belly cream band 55px below rim (≥25); walk toe-tips: planted far-rear
  837 vs max swung 822 → 15px (≥8). Toe-tip bottoms = outer stroke edge
  (fill+contiguous outline), per-leg x-zones by near/far color class.
- Eyeball crops: qc_<pose>_face.png + qc_<pose>_equator.png (500px window, 2x
  LANCZOS), qc_walk_legs.png. All read: one mass, kawaii side-crawl turtle,
  4 legs, grip on pages, no interior outline splitting shell/belly.

## Geometry fix rounds used: 3
1. Glasses temple arm drooped mid-head → arced to land at ear height near the
   head edge.
2. Still scale 2.7 → 2.6 (rim run 16.2 → 15.6px ≤ gate) + plastron hints moved
   below y800 (pure-cream band 55px ≥ gate; hints were cutting it to 23px).
3. Leg staging for the walk snapshot: near-rear 668 → 678 and far-rear baseTilt
   −6 → +4 — the raked-back planted far-rear had slid fully behind the swung
   near-rear (invisible 4th leg) and its tip cleared the swung pair by only
   ~4px; now visibly planted lowest with a 73px visible sliver, gate 15px.

## Deviations from brief
1. Rim stroke sw6 kept (spec'd), still scale lowered 2.7 → 2.6 so the rendered
   rim run is 15.6px ≤ 16px gate (sw6 at 2.7 would render 16.2px).
2. Leg baseTilts tuned (near-front +8, near-rear 0, far-front 0, far-rear +4)
   and near-rear x 668→678 (within ±10px license) — required for 4-leg
   readability + the ≥8px planted-vs-swung gate at tCrawl 0.75.
3. Tail drawn as a separate path BEHIND the body (base overlap hidden) rather
   than folded into the body path — spec §4 explicitly allows this; keeps the
   loaf path a clean dome+belly shape and preserves the one-mass silhouette
   (q2 single component confirms).
4. Shell ratio measured conservatively from visible mai at rig y740 (head
   occludes mai front): 0.520 vs nominal 0.56 — still inside [0.52, 0.62].
