import React from "react";
import { Easing, interpolate } from "remotion";
import turtleSpecJson from "./specs/turtle.kawaii.v4.side.json";
import {
  blinkFrom,
  CharacterCues,
  CharacterSpec,
  clamp01,
  EOC,
  envAt,
  lerp,
  mouthAtCues,
  piv,
  Pose,
  SpeechLine,
} from "./types";

// ---------------------------------------------------------------------------
// GoldenTurtle — v4 SIDE-VIEW crawling turtle rig (owner feedback on v3.3:
// front-view shell read as ~80% of the mass; v4 = side profile, shell ~55-60%
// of body length, 4 legs, tail, belly band under the shell).
//
// TurtleFigure keeps its exact historical props interface (compiles unchanged
// in TurtleStill / KidsStoryMultiScene) + ONE new optional prop `tCrawl`
// (crawl-cycle phase 0..1 for the diagonal leg swing). Geometry/colors/strokes
// come from specs/turtle.kawaii.v4.side.json (single source). Facing LEFT.
//
// ONE-PATH construction kept from v3.3: shell + belly = ONE closed "rounded
// loaf lying horizontal" path; mai = region above the equator painted through
// the body clipPath; NO second shell object. Tail is a separate short cone
// attached at the rear silhouette edge (drawn BEHIND the body — base overlap
// hidden, one-mass read preserved). Legs grow from UNDER the shell (hips at
// equator level, tops hidden behind / below the mai).
//
// GoldenTurtle (high-level) keeps the envelope structure + constants; v4
// deltas: peek/head-extend along −x, tCrawl driven by the walk window.
// ---------------------------------------------------------------------------

export type TurtleSpec = typeof turtleSpecJson;
const DEFAULT_SPEC: TurtleSpec = turtleSpecJson;
// compile-time check: the JSON satisfies the shared CharacterSpec contract
const _specCheck: CharacterSpec = DEFAULT_SPEC;

// rounded-join hexagon path for shell spots (pure math, deterministic) — verbatim
const hexPath = (cx: number, cy: number, r: number): string => {
  const pts: string[] = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k - Math.PI / 6;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M ${pts.join(" L ")} Z`;
};

export type TurtleBook = { x: number; bodyY: number; rot: number };

export type TurtleFigureProps = {
  tHeadX: number;
  tHeadY: number;
  tHeadTilt: number;
  tBodyDy: number;
  tEyeSy: number;
  tArcOp: number;
  tLookX: number;
  tMouth: { rx: number; ry: number };
  tMouthOp: number;
  tTongueOp: number;
  tSmileOp: number;
  tSmileW: number;
  tSmileD: number;
  book: TurtleBook | null;
  tGrip: number; // 0 = legs down (no book / released), 1 = full inward grip on the book
  clipSuffix: string;
  // v4 ONLY addition: crawl-cycle phase 0..1 (diagonal leg swing). 0 = planted.
  tCrawl?: number;
};

// Face layout DERIVED from the head anchor (side profile: ONE eye, ONE blush,
// ONE nostril, ONE dimple behind the mouth corner). Changing the head anchor
// relocates the entire face, glasses included.
const TURT_FACE = (spec: TurtleSpec) => ({
  eyeX: spec.head.cx + spec.face.eyeDx,
  eyeY: spec.head.cy + spec.face.eyeDy,
  mouthX: spec.head.cx + spec.face.mouthDx,
  mouthY: spec.head.cy + spec.face.mouthDy,
  blush: { x: spec.head.cx + spec.face.blushDx, y: spec.head.cy + spec.face.blushDy },
  nostril: { x: spec.head.cx + spec.face.nostrilDx, y: spec.head.cy + spec.face.nostrilDy },
});

export const TurtleFigure: React.FC<TurtleFigureProps> = ({
  tHeadX,
  tHeadY,
  tHeadTilt,
  tBodyDy,
  tEyeSy,
  tArcOp,
  tLookX,
  tMouth,
  tMouthOp,
  tTongueOp,
  tSmileOp,
  tSmileW,
  tSmileD,
  book,
  tGrip,
  clipSuffix,
  tCrawl = 0,
}) => {
  const SPEC = DEFAULT_SPEC;
  const OUT = SPEC.outline;
  const F = TURT_FACE(SPEC);
  const headClip = `ms-t-head-clip-${clipSuffix}`;
  const mouthClip = `ms-t-mouth-clip-${clipSuffix}`;
  const bodyClip = `ms-t-body-clip-${clipSuffix}`;
  const TAU = Math.PI * 2;

  // crawl state per leg: swing angle about the hip + toe lift for the
  // swing phase (diagonal pairs: near-front + far-rear phase 0,
  // near-rear + far-front phase π)
  const crawlOf = (phase: number) => {
    const s = Math.sin(TAU * tCrawl + phase);
    return {
      rot: SPEC.crawl.ampDeg * s,
      lift: -SPEC.crawl.liftPx * Math.max(0, s),
    };
  };

  return (
    <g>
      <defs>
        {/* mai + belly + all interior pattern clip to the ONE body path */}
        <clipPath id={bodyClip}>
          <path d={SPEC.bodyPath} />
        </clipPath>
        <clipPath id={headClip}>
          <ellipse cx={SPEC.head.cx} cy={SPEC.head.cy} rx={SPEC.head.rx} ry={SPEC.head.ry} />
        </clipPath>
        <clipPath id={mouthClip}>
          <ellipse
            cx={F.mouthX}
            cy={F.mouthY}
            rx={Math.max(tMouth.rx, 0.01)}
            ry={Math.max(tMouth.ry, 0.01)}
          />
        </clipPath>
      </defs>

      {/* ground shadow (stays put while the body bobs) */}
      <ellipse cx={SPEC.shadow.cx} cy={SPEC.shadow.cy} rx={SPEC.shadow.rx} ry={SPEC.shadow.ry} fill={SPEC.shadow.fill} opacity={SPEC.shadow.opacity} />

      <g transform={`translate(0 ${tBodyDy.toFixed(2)})`}>
        {/* far legs (LIGHTENED skin — depth cue "gần đậm, xa nhạt"; BEHIND the
            body, hips at equator level so the tops hide behind the belly) */}
        {SPEC.legsFar.legs.map((lg) => {
          const cr = crawlOf(lg.phase);
          return (
            <g
              key={`far-${lg.x}`}
              transform={`translate(0 ${cr.lift.toFixed(2)}) ${piv(lg.x, lg.hipY, lg.baseTilt + cr.rot)}`}
            >
              <ellipse
                cx={lg.x}
                cy={lg.cy}
                rx={lg.rx}
                ry={lg.ry}
                fill={SPEC.legsFar.fill}
                stroke={OUT}
                strokeWidth={SPEC.legsFar.strokeWidth}
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* tail: short tapered cone at the rear silhouette edge, head-skin
            color, drawn BEHIND the body (base overlap hidden -> no double
            outline, one-mass read kept) */}
        <path
          d={SPEC.tail.path}
          fill={SPEC.tail.fill}
          stroke={OUT}
          strokeWidth={SPEC.tail.strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* z1 BODY — the ONE closed "rounded loaf lying horizontal" path =
            the entire shell + belly mass. Belly base fill first, then every
            interior detail (mai, scutes, sheen, plastron hints, rim line)
            painted through the body clip, then the single outline on top.
            No second shell object exists anywhere. */}
        <path d={SPEC.bodyPath} fill={SPEC.bellyFill} />
        <g clipPath={`url(#${bodyClip})`}>
          {/* mai = region ABOVE the equator, INSIDE the same body path */}
          <path d={SPEC.maiPath} fill={SPEC.maiFill} />
          {/* scutes: interior pattern only — hexes sit fully inside the mai,
              never touching the silhouette or the rim */}
          {SPEC.scutes.spots.map((sp) => (
            <path
              key={`scute-${sp.x}-${sp.y}`}
              d={hexPath(sp.x, sp.y, sp.r)}
              fill={SPEC.scutes.fill}
              stroke={OUT}
              strokeWidth={SPEC.scutes.strokeWidth}
              strokeLinejoin="round"
            />
          ))}
          {/* soft sheen */}
          <ellipse
            cx={SPEC.sheen.cx}
            cy={SPEC.sheen.cy}
            rx={SPEC.sheen.rx}
            ry={SPEC.sheen.ry}
            fill={SPEC.white}
            opacity={SPEC.sheen.opacity}
            transform={`rotate(${SPEC.sheen.rot} ${SPEC.sheen.cx} ${SPEC.sheen.cy})`}
          />
          {/* belly plastron hints: thin horizontals, clipped, no outline */}
          <g fill="none" stroke={OUT} strokeWidth={SPEC.plastron.strokeWidth} strokeLinecap="round" opacity={SPEC.plastron.opacity}>
            {SPEC.plastron.paths.map((pp) => (
              <path key={`plas-${pp}`} d={pp} />
            ))}
          </g>
          {/* mai rim: ONE thin single stroke along the equator curve */}
          <path
            d={SPEC.equatorPath}
            fill="none"
            stroke={SPEC.rim.color}
            strokeWidth={SPEC.rim.strokeWidth}
            strokeLinecap="round"
          />
        </g>
        {/* the ONLY body outline stroke of the whole figure */}
        <path
          d={SPEC.bodyPath}
          fill="none"
          stroke={OUT}
          strokeWidth={SPEC.bodyStrokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* z2 head group: peek extend/retract + speaking/listening nod +
            proud tilt. Positive tHeadTilt = nose UP (rotate −deg about the
            neck pivot; facing LEFT, so ccw lifts the nose). The head's own
            overlap with the shell front-top IS the neck: full stroke kept,
            no cut border. */}
        <g
          transform={`translate(${tHeadX.toFixed(2)} ${tHeadY.toFixed(2)}) ${piv(
            SPEC.neck.cx,
            SPEC.neck.cy,
            -tHeadTilt
          )}`}
        >
          {/* head with soft top-left highlight */}
          <ellipse
            cx={SPEC.head.cx}
            cy={SPEC.head.cy}
            rx={SPEC.head.rx}
            ry={SPEC.head.ry}
            fill={SPEC.head.fill}
          />
          <g clipPath={`url(#${headClip})`}>
            <ellipse
              cx={SPEC.head.cx + SPEC.head.rimDx}
              cy={SPEC.head.cy + SPEC.head.rimDy}
              rx={SPEC.head.rx + SPEC.head.rimDRx}
              ry={SPEC.head.ry + SPEC.head.rimDRy}
              fill={SPEC.head.rimFill}
            />
          </g>
          <ellipse
            cx={SPEC.head.cx}
            cy={SPEC.head.cy}
            rx={SPEC.head.rx}
            ry={SPEC.head.ry}
            fill="none"
            stroke={OUT}
            strokeWidth={SPEC.head.strokeWidth}
            strokeLinejoin="round"
          />

          {/* blush: one candy-pink oval, gently tilted (side profile) */}
          <ellipse
            cx={F.blush.x}
            cy={F.blush.y}
            rx={SPEC.blush.rx}
            ry={SPEC.blush.ry}
            fill={SPEC.blush.fill}
            opacity={SPEC.blush.opacity}
            transform={`rotate(${SPEC.blush.tiltDeg} ${F.blush.x} ${F.blush.y})`}
          />

          {/* ONE eye: glossy sparkle; blink scaleY + closed-eye arc */}
          <g>
            <g transform={piv(F.eyeX, F.eyeY, 0, 1, tEyeSy)}>
              <ellipse cx={F.eyeX + tLookX} cy={F.eyeY} rx={SPEC.eye.rx} ry={SPEC.eye.ry} fill={OUT} />
              <circle cx={F.eyeX + tLookX + SPEC.eye.glintDx} cy={F.eyeY + SPEC.eye.glintDy} r={SPEC.eye.glintR} fill={SPEC.white} opacity={SPEC.eye.glintOpacity} />
              <circle cx={F.eyeX + tLookX + SPEC.eye.glint2Dx} cy={F.eyeY + SPEC.eye.glint2Dy} r={SPEC.eye.glint2R} fill={SPEC.white} opacity={SPEC.eye.glint2Opacity} />
            </g>
            <path
              d={`M ${F.eyeX - SPEC.eye.arcDx} ${F.eyeY + SPEC.eye.arcDy} Q ${F.eyeX} ${F.eyeY + SPEC.eye.arcPeakDy} ${F.eyeX + SPEC.eye.arcDx} ${F.eyeY + SPEC.eye.arcDy}`}
              fill="none"
              stroke={OUT}
              strokeWidth={SPEC.eye.arcStrokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={tArcOp}
            />
          </g>

          {/* side-profile glasses: ONE round lens ring at the nominal eye
              position + temple arm Q-curve back over the "ear" region + tiny
              bridge stub at the lens front toward the nose. Static OUTSIDE
              the blink scaleY group -> the ring never shrinks on blink. */}
          <ellipse
            cx={F.eyeX + SPEC.glasses.lensDx}
            cy={F.eyeY + SPEC.glasses.lensDy}
            rx={SPEC.glasses.rx}
            ry={SPEC.glasses.ry}
            fill="none"
            stroke={SPEC.glasses.color}
            strokeWidth={SPEC.glasses.strokeWidth}
            strokeLinejoin="round"
          />
          <path
            d={`M ${F.eyeX + SPEC.glasses.temple[0][0]} ${F.eyeY + SPEC.glasses.temple[0][1]} Q ${F.eyeX + SPEC.glasses.temple[1][0]} ${F.eyeY + SPEC.glasses.temple[1][1]} ${F.eyeX + SPEC.glasses.temple[2][0]} ${F.eyeY + SPEC.glasses.temple[2][1]}`}
            fill="none"
            stroke={SPEC.glasses.color}
            strokeWidth={SPEC.glasses.detailStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M ${F.eyeX + SPEC.glasses.bridge[0][0]} ${F.eyeY + SPEC.glasses.bridge[0][1]} Q ${F.eyeX + SPEC.glasses.bridge[1][0]} ${F.eyeY + SPEC.glasses.bridge[1][1]} ${F.eyeX + SPEC.glasses.bridge[2][0]} ${F.eyeY + SPEC.glasses.bridge[2][1]}`}
            fill="none"
            stroke={SPEC.glasses.color}
            strokeWidth={SPEC.glasses.detailStrokeWidth}
            strokeLinecap="round"
          />

          {/* nostril: tiny dot near the nose front (NO beak-snout ellipse —
              that was the front-view face) */}
          <circle cx={F.nostril.x} cy={F.nostril.y} r={SPEC.nostril.r} fill={OUT} />

          {/* mouth: open viseme ellipse ROTATED ~15° (side-open toward the
              facing direction); tongue clip stays inside the rotated group.
              Closed smile arc + ONE dimple behind (toward the ear). */}
          {tMouth.rx > 0.5 ? (
            <g opacity={tMouthOp} transform={`rotate(${SPEC.face.mouthTiltDeg} ${F.mouthX} ${F.mouthY})`}>
              <ellipse
                cx={F.mouthX}
                cy={F.mouthY}
                rx={tMouth.rx}
                ry={tMouth.ry}
                fill={SPEC.mouth.fill}
                stroke={OUT}
                strokeWidth={SPEC.mouth.strokeWidth}
                strokeLinejoin="round"
              />
              {tTongueOp > 0.01 ? (
                <g clipPath={`url(#${mouthClip})`} opacity={tTongueOp}>
                  <ellipse
                    cx={F.mouthX}
                    cy={F.mouthY + tMouth.ry * SPEC.mouth.tongueDyFactor}
                    rx={tMouth.rx * SPEC.mouth.tongueRxFactor}
                    ry={tMouth.ry * SPEC.mouth.tongueRyFactor}
                    fill={SPEC.mouth.tongueFill}
                  />
                </g>
              ) : null}
            </g>
          ) : null}
          <path
            d={`M ${F.mouthX - tSmileW} ${F.mouthY + SPEC.mouth.smileDy} Q ${F.mouthX} ${
              F.mouthY + SPEC.mouth.smileDy + tSmileD
            } ${F.mouthX + tSmileW} ${F.mouthY + SPEC.mouth.smileDy}`}
            fill="none"
            stroke={OUT}
            strokeWidth={SPEC.mouth.smileStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={tSmileOp}
          />
          <path
            d={`M ${F.mouthX + SPEC.mouth.dimple.dx1} ${F.mouthY + SPEC.mouth.dimple.dy1} Q ${F.mouthX + SPEC.mouth.dimple.dx2} ${
              F.mouthY + SPEC.mouth.dimple.dy2
            } ${F.mouthX + SPEC.mouth.dimple.dx3} ${F.mouthY + SPEC.mouth.dimple.dy3}`}
            fill="none"
            stroke={OUT}
            strokeWidth={SPEC.mouth.dimple.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={tSmileOp}
          />
        </g>

        {/* v3.1 open book ("tay ôm"), side-view geometry: drawn over the
            belly but UNDER the near legs (the gripping near-front leg's toes
            paint over the pages). Sits under the chin, ahead of the shell. */}
        {book ? (
          <g
            transform={`translate(${(book.x - SPEC.book.homeX).toFixed(2)} ${(
              book.bodyY - SPEC.book.homeY
            ).toFixed(2)}) rotate(${book.rot.toFixed(2)} ${book.x.toFixed(2)} ${book.bodyY.toFixed(2)})`}
          >
            <path
              d={SPEC.book.pageLPath}
              fill={SPEC.book.pageFill}
              stroke={OUT}
              strokeWidth={SPEC.book.pageStrokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={SPEC.book.pageRPath}
              fill={SPEC.book.pageFill}
              stroke={OUT}
              strokeWidth={SPEC.book.pageStrokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={SPEC.book.spinePath}
              fill="none"
              stroke={OUT}
              strokeWidth={SPEC.book.spineStrokeWidth}
              strokeLinecap="round"
            />
            <g
              fill="none"
              stroke={OUT}
              strokeWidth={SPEC.book.textStrokeWidth}
              strokeLinecap="round"
              opacity={SPEC.book.textOpacity}
            >
              {SPEC.book.textLines.map((tl) => (
                <path key={`btl-${tl}`} d={tl} />
              ))}
            </g>
          </g>
        ) : null}

        {/* near legs (head-skin green, IN FRONT of the belly + book): flat
            paddle ellipses, hips under the shell at equator level. Crawl
            swing about each hip; the near-FRONT leg blends crawl with the
            book grip: totalRot = crawlAngle·(1−tGrip) + gripDeg·tGrip (the
            grip rotates the paddle inward so its toes land ON the pages).
            Toe lines rotate inside each leg group. */}
        {SPEC.legsNear.legs.map((lg) => {
          const cr = crawlOf(lg.phase);
          const grip = lg.grips ? tGrip : 0;
          const rot = (lg.baseTilt + cr.rot) * (1 - grip) + SPEC.legsNear.gripDeg * grip;
          const lift = cr.lift * (1 - grip);
          const toeY1 = lg.cy + lg.ry + SPEC.legsNear.toeTopDy;
          const toeY2 = lg.cy + lg.ry + SPEC.legsNear.toeBotDy;
          return (
            <g
              key={`near-${lg.x}`}
              transform={`translate(0 ${lift.toFixed(2)}) ${piv(lg.x, lg.hipY, rot)}`}
            >
              <ellipse
                cx={lg.x}
                cy={lg.cy}
                rx={lg.rx}
                ry={lg.ry}
                fill={SPEC.legsNear.fill}
                stroke={OUT}
                strokeWidth={SPEC.legsNear.strokeWidth}
                strokeLinejoin="round"
              />
              <line
                x1={lg.x - SPEC.legsNear.toeDx}
                y1={toeY1}
                x2={lg.x - SPEC.legsNear.toeDx}
                y2={toeY2}
                stroke={OUT}
                strokeWidth={SPEC.legsNear.toeStrokeWidth}
                strokeLinecap="round"
                opacity={SPEC.legsNear.toeOpacity}
              />
              <line
                x1={lg.x + SPEC.legsNear.toeDx}
                y1={toeY1}
                x2={lg.x + SPEC.legsNear.toeDx}
                y2={toeY2}
                stroke={OUT}
                strokeWidth={SPEC.legsNear.toeStrokeWidth}
                strokeLinecap="round"
                opacity={SPEC.legsNear.toeOpacity}
              />
            </g>
          );
        })}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// GoldenTurtle — high-level rig: computes the t* animation state from frame +
// schedules + cues and renders <TurtleFigure>. Envelope structure + constants
// kept from v3.3 (speak/listen nods, proud tilt/bounce, book fall/settle,
// blink, mouthAtCues/visemeScale verbatim); v4 deltas: head extend along −x,
// walk drives tCrawl (crawl cycle ~1.1s).
// ---------------------------------------------------------------------------

// deterministic schedule data the composition passes in (current video values)
export type TurtleSchedule = {
  blinks: number[]; // blink start times
  walk: { t0: number; t1: number }; // steady walk-left window
  proud: {
    in: [number, number]; // proud pose blend in
    out: [number, number]; // proud pose blend out
    bounceStart: number; // celebration bounce phase anchor
  };
  book: {
    fall: [number, number]; // easeInQuad fall held -> ground
    settleEnd: number; // end of the tiny settle bounce
    heldX: number; // held book local x
    heldBodyY: number; // held book body-local y (rides body bob)
    groundY: number; // landed book y (beside the front foot)
    landX: number; // landed book x
    landRot: number; // landed book rotation (deg)
  };
};

export type GoldenTurtleProps = {
  frame: number;
  fps: number;
  // acting-mode label for this frame ('idle' | 'walk' | 'proud' for this
  // character). Envelopes are schedule-driven and blend continuously, so
  // pose is an advisory annotation, not a gate.
  // NOTE: unlike KawaiiRabbit, GoldenTurtle takes no `spec` prop — the
  // turtle's aesthetic constants are bound to <TurtleFigure>, whose props
  // interface is frozen (existing comps import it). The spec JSON is the
  // single source for the whole rig.
  pose: Pose;
  // active line's cues + timeline start offset (null = not speaking)
  cues: CharacterCues;
  speakLines: SpeechLine[]; // this character's lines (speak nod envelope)
  listenLines: SpeechLine[]; // partner's lines (listen nod envelope)
  lookX: number; // pupil look offset (toward partner / camera)
  schedule: TurtleSchedule;
  clipSuffix?: string;
};

export const GoldenTurtle: React.FC<GoldenTurtleProps> = ({
  frame,
  fps,
  cues,
  speakLines,
  listenLines,
  lookX,
  schedule,
  clipSuffix = "main",
}) => {
  const t = frame / fps;

  // ---- speech envelopes (nod amplitude; listener nod) ----
  const envT = speakLines.reduce(
    (acc, l) => acc + envAt(t, l.start - 0.15, l.start, l.start + l.dur - 0.2, l.start + l.dur + 0.1),
    0
  );
  const envR = listenLines.reduce(
    (acc, l) => acc + envAt(t, l.start - 0.15, l.start, l.start + l.dur - 0.2, l.start + l.dur + 0.1),
    0
  );

  // ---- turtle anim state (windows from schedule) ----
  const tBlink = blinkFrom(schedule.blinks, t);
  const tBreathe = Math.sin((Math.PI * 2 * t) / 5); // slower, calmer than rabbit
  const peek = Math.sin((Math.PI * 2 * t) / 4);
  // v4 side-view: peek/head-extend along −x (forward, facing LEFT)
  const tHeadX = -(4 + 4 * peek) - 4 * Math.min(1, envT);
  const tSpeakNod = Math.sin(t * Math.PI * 2 * 1.1) * 2.2 * Math.min(1, envT);
  const tListenNod = Math.sin(t * Math.PI * 2 * 0.85) * 1.6 * Math.min(1, envR);
  const proud =
    interpolate(t, schedule.proud.in, [0, 1], {
      easing: EOC,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(t, schedule.proud.out, [1, 0], {
      easing: EOC,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const tHeadY = 1.2 * tBreathe + tSpeakNod + tListenNod - 6 * proud;
  // positive tilt = nose UP (the figure negates about the neck pivot)
  const tHeadTilt = 1.5 * Math.sin(Math.PI * 2 * 0.09 * t) + 7 * proud;

  // walk waddle bob (local coords), only while walking
  const walkActive = t >= schedule.walk.t0 && t < schedule.walk.t1;
  const walkBob = walkActive
    ? 4 * Math.abs(Math.sin(Math.PI * 2 * 0.9 * (t - schedule.walk.t0)))
    : 0;
  // v4 crawl cycle: diagonal leg-pair phase, ~1.1s period, while walking
  const tCrawl = walkActive ? (((t - schedule.walk.t0) % 1.1) + 1.1) % 1.1 / 1.1 : 0;
  // proud gentle bounce (small amplitude, does not break lip-sync)
  const proudBounce =
    -10 * Math.abs(Math.sin(Math.PI * 2 * 1.2 * (t - schedule.proud.bounceStart))) * proud;
  const tBodyDy = -3 * proud + proudBounce - walkBob;

  // ---- lip sync (viseme scale from the bundled turtle spec) ----
  const tMouth0 = cues
    ? mouthAtCues(cues.mouthCues, t - cues.start, DEFAULT_SPEC.visemes)
    : DEFAULT_SPEC.visemes.X;
  const tMouth = {
    rx: tMouth0.rx * (DEFAULT_SPEC.visemeScale ?? 1),
    ry: tMouth0.ry * (DEFAULT_SPEC.visemeScale ?? 1),
  };

  const tOpenness = clamp01(tMouth.ry / 10);
  const tSmileOp = clamp01(1 - tOpenness);
  const tMouthOp = clamp01(tOpenness * 1.15);
  const tTongueOp = clamp01((tMouth.ry - 10) / 7);
  const tEyeSy = 1 - 0.95 * tBlink;
  const tArcOp = clamp01((tBlink - 0.55) / 0.3);
  const tSmileW = 36 + 8 * proud;
  const tSmileD = 26 + 6 * proud;

  // ---- v3.1 held book ("tay ôm") + S5 drop (verbatim) ----
  const bookFallP = interpolate(t, schedule.book.fall, [0, 1], {
    easing: Easing.in(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // near legs grip the book while it is held; release smoothly during the fall
  const tGrip = 1 - bookFallP;
  const bookSettleQ = clamp01((t - schedule.book.fall[1]) / (schedule.book.settleEnd - schedule.book.fall[1]));
  const bookSettleDy = -3 * Math.sin(Math.PI * bookSettleQ);
  const bookHeldY = schedule.book.heldBodyY + tBodyDy; // rides body bob (walk bob / proud bounce)
  const bookGroundY =
    t < schedule.book.fall[1]
      ? lerp(bookHeldY, schedule.book.groundY, bookFallP)
      : schedule.book.groundY + bookSettleDy;
  const bookX = lerp(schedule.book.heldX, schedule.book.landX, bookFallP);
  const bookRot = lerp(0, schedule.book.landRot, bookFallP);
  // book is drawn inside the tBodyDy group; subtract tBodyDy from the LANDED
  // position so the parked book stays fixed on the ground while the body
  // keeps bouncing (proud bounce) — net world position = (bookX, bookGroundY).
  const bookBodyY = bookGroundY - tBodyDy;

  return (
    <TurtleFigure
      tHeadX={tHeadX}
      tHeadY={tHeadY}
      tHeadTilt={tHeadTilt}
      tBodyDy={tBodyDy}
      tEyeSy={tEyeSy}
      tArcOp={tArcOp}
      tLookX={lookX}
      tMouth={tMouth}
      tMouthOp={tMouthOp}
      tTongueOp={tTongueOp}
      tSmileOp={tSmileOp}
      tSmileW={tSmileW}
      tSmileD={tSmileD}
      book={{ x: bookX, bodyY: bookBodyY, rot: bookRot }}
      tGrip={tGrip}
      clipSuffix={clipSuffix}
      tCrawl={tCrawl}
    />
  );
};
