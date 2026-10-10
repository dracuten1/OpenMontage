import React from "react";
import { Easing, interpolate } from "remotion";
import rabbitSpecJson from "./specs/rabbit.kawaii.json";
import {
  blinkFrom,
  CharacterCues,
  CharacterSpec,
  clamp01,
  EASE_OUT_BACK,
  EIC,
  EOC,
  envAt,
  mouthAtCues,
  piv,
  Pose,
  SpeechLine,
} from "./types";

// ---------------------------------------------------------------------------
// KawaiiRabbit — kawaii rabbit rig (chibi huge head ~56% height, chubby body),
// extracted VERBATIM from KidsStoryMultiScene.tsx (rig-split refactor, zero
// visual change). Geometry/colors/strokes come from specs/rabbit.kawaii.json
// (single source); animation envelope formulas live here with the original
// constants; schedule/timeline data (blink times, hop anchors, sleep/wake and
// clap windows) is passed in via the `schedule` prop. Pure function of frame.
// ---------------------------------------------------------------------------

export type RabbitSpec = typeof rabbitSpecJson;
const DEFAULT_SPEC: RabbitSpec = rabbitSpecJson;
// compile-time check: the JSON satisfies the shared CharacterSpec contract
const _specCheck: CharacterSpec = DEFAULT_SPEC;

// deterministic schedule data the composition passes in (current video values)
export type RabbitSchedule = {
  blinks: number[]; // blink start times
  hops: { s: number; h: number }[]; // hop anchors (time, height)
  sleepIn: [number, number]; // falling asleep window
  sleepOut: [number, number]; // waking (eyes open) window
  wakePopIn: [number, number]; // wakePop envelope on/off
  wakePopOut: [number, number];
  jerkIn: [number, number]; // whole-body startle jerk on/off
  jerkOut: [number, number];
  clapIn: [number, number]; // S5 clap on/off (phase = clapIn[0])
  clapOut: [number, number];
};

export type KawaiiRabbitProps = {
  frame: number;
  fps: number;
  // acting-mode label for this frame ('idle' | 'sleep' | 'startle' | 'clap'
  // for this character). Envelopes are schedule-driven and blend continuously,
  // so pose is an advisory annotation, not a gate.
  pose: Pose;
  spec?: RabbitSpec;
  // active line's cues + timeline start offset (null = not speaking)
  cues: CharacterCues;
  speakLines: SpeechLine[]; // this character's lines (speak nod envelope)
  listenLines: SpeechLine[]; // partner's lines (listen nod envelope)
  lookX: number; // pupil look offset (toward partner / camera)
  schedule: RabbitSchedule;
  // clipPath id suffix — ids are global per SVG doc; omit for the historical
  // unsuffixed ids (ms-r-body-clip ...), pass e.g. "main" for multi-instance
  clipSuffix?: string;
};

// asleep 0..1 shared with scene elements (zZz) — same formula the rig uses
export const rabbitAsleepAt = (
  t: number,
  sleepIn: [number, number],
  sleepOut: [number, number]
): number =>
  interpolate(t, sleepIn, [0, 1], {
    easing: EOC,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) *
  interpolate(t, sleepOut, [1, 0], {
    easing: EIC,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// hopState (verbatim): squash-stretch contract around hop anchors
const hopState = (
  tt: number,
  hops: { s: number; h: number }[]
): { dy: number; sx: number; sy: number; arm: number } => {
  let dy = 0;
  let sx = 1;
  let sy = 1;
  let arm = 0;
  for (const { s, h } of hops) {
    const p = tt - s;
    if (p < 0 || p > 0.45) continue;
    dy += interpolate(p, [0.09, 0.2, 0.31], [0, -h, 0], {
      easing: [EOC, EIC],
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    sx *= interpolate(p, [0, 0.09, 0.15, 0.31, 0.45], [1, 1.07, 0.94, 1.05, 1], {
      easing: [EIC, EOC, EIC, EASE_OUT_BACK],
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    sy *= interpolate(p, [0, 0.09, 0.15, 0.31, 0.45], [1, 0.93, 1.08, 0.95, 1], {
      easing: [EIC, EOC, EIC, EASE_OUT_BACK],
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    arm = Math.max(
      arm,
      interpolate(p, [0.09, 0.16, 0.24, 0.36], [0, 14, 14, 0], {
        easing: [EOC, Easing.linear, EIC],
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
  }
  return { dy, sx, sy, arm };
};

// 4-point sparkle star path (kawaii eye glint) — verbatim
const star4 = (cx: number, cy: number, r: number): string =>
  `M ${cx} ${cy - r} Q ${cx + r * 0.15} ${cy - r * 0.15} ${cx + r} ${cy} ` +
  `Q ${cx + r * 0.15} ${cy + r * 0.15} ${cx} ${cy + r} ` +
  `Q ${cx - r * 0.15} ${cy + r * 0.15} ${cx - r} ${cy} ` +
  `Q ${cx - r * 0.15} ${cy - r * 0.15} ${cx} ${cy - r} Z`;

export const KawaiiRabbit: React.FC<KawaiiRabbitProps> = ({
  frame,
  fps,
  spec = DEFAULT_SPEC,
  cues,
  speakLines,
  listenLines,
  lookX,
  schedule,
  clipSuffix = "",
}) => {
  const OUT = spec.outline;
  const t = frame / fps;

  const bodyClip = clipSuffix ? `ms-r-body-clip-${clipSuffix}` : "ms-r-body-clip";
  const headClip = clipSuffix ? `ms-r-head-clip-${clipSuffix}` : "ms-r-head-clip";
  const mouthClip = clipSuffix ? `ms-r-mouth-clip-${clipSuffix}` : "ms-r-mouth-clip";

  // ---- reaction envelopes (formulas verbatim; windows from schedule) ----
  const asleep = rabbitAsleepAt(t, schedule.sleepIn, schedule.sleepOut);
  const wakePop =
    interpolate(t, schedule.wakePopIn, [0, 1], {
      easing: EASE_OUT_BACK,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(t, schedule.wakePopOut, [1, 0], {
      easing: EOC,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const jerkUp =
    interpolate(t, schedule.jerkIn, [0, 1], {
      easing: EASE_OUT_BACK,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(t, schedule.jerkOut, [1, 0], {
      easing: EOC,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // ---- lip sync: only while speaking; mouth closes while asleep ----
  const rMouth0 = cues
    ? mouthAtCues(cues.mouthCues, t - cues.start, spec.visemes)
    : spec.visemes.X;
  const rMouth = {
    rx: rMouth0.rx * (1 - asleep) * (spec.visemeScale ?? 1),
    ry: rMouth0.ry * (1 - asleep) * (spec.visemeScale ?? 1),
  };

  // ---- speech envelopes (nod amplitude; listener nod) ----
  const envR = speakLines.reduce(
    (acc, l) => acc + envAt(t, l.start - 0.15, l.start, l.start + l.dur - 0.2, l.start + l.dur + 0.1),
    0
  );
  const envT = listenLines.reduce(
    (acc, l) => acc + envAt(t, l.start - 0.15, l.start, l.start + l.dur - 0.2, l.start + l.dur + 0.1),
    0
  );

  // ---- rabbit anim state (verbatim) ----
  const rBlinkRaw = blinkFrom(schedule.blinks, t);
  const rBlink = Math.max(rBlinkRaw, asleep); // eyes stay closed while asleep
  const hop = hopState(t, schedule.hops);
  const breathe = Math.sin((Math.PI * 2 * t) / 3.6);
  const rTiltSway = 2.5 * Math.sin(Math.PI * 2 * 0.13 * t);
  const rHeadTilt = rTiltSway + 8 * asleep - 5 * wakePop;
  const rSpeakNod = Math.sin(t * Math.PI * 2 * 2.2) * 1.5 * Math.min(1, envR);
  const rListenNod = Math.sin(t * Math.PI * 2 * 0.9) * 1.2 * Math.min(1, envT) * (1 - asleep);
  const rHeadY = 1.5 * breathe + rSpeakNod + rListenNod + 11 * asleep - 4 * wakePop;
  const earSway = Math.sin(Math.PI * 2 * 0.55 * t) * 2;
  const earRotL = earSway - 24 * asleep + 16 * wakePop;
  const earRotR = -earSway + 24 * asleep - 16 * wakePop;

  const rLookX = lookX;
  const rOpenness = clamp01(rMouth.ry / 12);
  const rSmileOp = clamp01(1 - rOpenness);
  const rMouthOp = clamp01(rOpenness * 1.15);
  const rTongueOp = clamp01((rMouth.ry - 12) / 8);
  const rEyeSy = 1 - 0.95 * rBlink;
  const rEyeWide = 1 + 0.16 * wakePop;
  const rArcOp = clamp01((rBlink - 0.55) / 0.3);
  const rCheekLift = 2 * rBlink;
  const airFrac = clamp01(-hop.dy / 40);
  const rShScale = 1 - 0.18 * airFrac;
  const rShOp = 0.25 - 0.09 * airFrac;

  // S5 clap: 1.5Hz swing between open (±13° base) and meet (±52°) — verbatim
  const clapEnv =
    interpolate(t, schedule.clapIn, [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(t, schedule.clapOut, [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const clapMeet = Math.abs(Math.sin(Math.PI * 1.5 * (t - schedule.clapIn[0])));
  const clapSwing = clapMeet * clapEnv; // 0 = open, 1 = meet
  const armRotL = 13 + 39 * clapSwing; // coefficient: 13 -> 52
  const armRotR = 13 + 39 * clapSwing;
  const bodySx =
    hop.sx * (1 - 0.004 * breathe) * (1 + 0.01 * (2 * clapSwing - 1) * clapEnv);
  const bodySy = hop.sy * (1 + 0.012 * breathe);

  return (
    <g>
      <defs>
        <clipPath id={bodyClip}>
          <ellipse cx={spec.body.cx} cy={spec.body.cy} rx={spec.body.rx} ry={spec.body.ry} />
        </clipPath>
        <clipPath id={headClip}>
          <ellipse cx={spec.head.cx} cy={spec.head.cy} rx={spec.head.rx} ry={spec.head.ry} />
        </clipPath>
        <clipPath id={mouthClip}>
          <ellipse
            cx={spec.mouthX}
            cy={spec.mouthY}
            rx={Math.max(rMouth.rx, 0.01)}
            ry={Math.max(rMouth.ry, 0.01)}
          />
        </clipPath>
      </defs>

      {/* startled wake: whole-body jump with easeOutBack overshoot */}
      <g transform={`translate(0 ${(-24 * jerkUp).toFixed(2)})`}>
        {/* ground shadow (stays on ground, shrinks + fades when airborne) */}
        <ellipse
          cx={spec.shadow.cx}
          cy={spec.shadow.cy}
          rx={spec.shadow.rx * rShScale}
          ry={spec.shadow.ry * rShScale}
          fill={spec.shadow.fill}
          opacity={rShOp}
        />

        {/* whole-rabbit hop translation */}
        <g transform={`translate(0 ${hop.dy.toFixed(2)})`}>
          {/* squash-stretch + breathing + clap micro-pulse, pivot at feet */}
          <g transform={piv(spec.axisX, spec.feetY, 0, bodySx, bodySy)}>
            {/* tail puff (behind body) */}
            <ellipse cx={spec.tail.cx} cy={spec.tail.cy} rx={spec.tail.rx} ry={spec.tail.ry} fill={spec.tail.fill} stroke={OUT} strokeWidth={spec.tail.strokeWidth} strokeLinejoin="round" />

            {/* ears — droop outward asleep, shoot upright startled; 3-layer pink */}
            <g transform={piv(spec.neck.x, spec.neck.y, rHeadTilt)}>
              {spec.ear.xs.map((ex, ei) => (
                <g key={`ear-${ex}`} transform={piv(ex, spec.ear.pivotY, ei === 0 ? earRotL : earRotR)}>
                  <ellipse cx={ex} cy={spec.ear.outerCy} rx={spec.ear.outerRx} ry={spec.ear.outerRy} fill={spec.ear.outerFill} stroke={OUT} strokeWidth={spec.ear.outerStrokeWidth} strokeLinejoin="round" />
                  {spec.ear.pinks.map((p) => (
                    <ellipse key={`earpink-${p.cy}`} cx={ex} cy={p.cy} rx={p.rx} ry={p.ry} fill={p.fill} />
                  ))}
                </g>
              ))}
            </g>

            {/* body with warm rim shading */}
            <ellipse cx={spec.body.cx} cy={spec.body.cy} rx={spec.body.rx} ry={spec.body.ry} fill={spec.body.fill} />
            <g clipPath={`url(#${bodyClip})`}>
              <ellipse cx={spec.body.cx + spec.body.rimDx} cy={spec.body.cy + spec.body.rimDy} rx={spec.body.rx + spec.body.rimDRx} ry={spec.body.ry + spec.body.rimDRy} fill={spec.body.rimFill} />
            </g>
            <ellipse
              cx={spec.body.cx}
              cy={spec.body.cy}
              rx={spec.body.rx}
              ry={spec.body.ry}
              fill="none"
              stroke={OUT}
              strokeWidth={spec.body.strokeWidth}
              strokeLinejoin="round"
            />

            {/* red vest with darker rim + white buttons */}
            <path d={spec.vest.path} fill={spec.vest.fill} stroke={OUT} strokeWidth={spec.vest.strokeWidth} strokeLinejoin="round" />
            <path d={spec.vest.hemPath} fill="none" stroke={spec.vest.trim} strokeWidth={spec.vest.hemStrokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d={spec.vest.seamPath} fill="none" stroke={spec.vest.trim} strokeWidth={spec.vest.seamStrokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            {spec.vest.buttonYs.map((by) => (
              <circle key={`btn-${by}`} cx={spec.vest.buttonX} cy={by} r={spec.vest.buttonR} fill={spec.vest.buttonFill} stroke={spec.vest.trim} strokeWidth={spec.vest.buttonStrokeWidth} strokeLinejoin="round" />
            ))}

            {/* feet (stubby) */}
            {spec.feet.xs.map((fx) => (
              <g key={`foot-${fx}`}>
                <ellipse cx={fx} cy={spec.feet.cy} rx={spec.feet.rx} ry={spec.feet.ry} fill={spec.feet.fill} stroke={OUT} strokeWidth={spec.feet.strokeWidth} strokeLinejoin="round" />
                <line x1={fx - spec.feet.toeDx} y1={spec.feet.toeY1} x2={fx - spec.feet.toeDx} y2={spec.feet.toeY2} stroke={OUT} strokeWidth={spec.feet.toeStrokeWidth} strokeLinecap="round" opacity={spec.feet.toeOpacity} />
                <line x1={fx + spec.feet.toeDx} y1={spec.feet.toeY1} x2={fx + spec.feet.toeDx} y2={spec.feet.toeY2} stroke={OUT} strokeWidth={spec.feet.toeStrokeWidth} strokeLinecap="round" opacity={spec.feet.toeOpacity} />
              </g>
            ))}

            {/* arms (stub) — S5 clap: swing between open (±13°) and meet
                (±52°) in front of chest; hop swing outward while airborne */}
            <g transform={piv(spec.arm.left.pivX, spec.arm.left.pivY, -(armRotL + hop.arm))}>
              <ellipse cx={spec.arm.left.cx} cy={spec.arm.cy} rx={spec.arm.rx} ry={spec.arm.ry} fill={spec.arm.fill} stroke={OUT} strokeWidth={spec.arm.strokeWidth} strokeLinejoin="round" />
            </g>
            <g transform={piv(spec.arm.right.pivX, spec.arm.right.pivY, armRotR + hop.arm)}>
              <ellipse cx={spec.arm.right.cx} cy={spec.arm.cy} rx={spec.arm.rx} ry={spec.arm.ry} fill={spec.arm.fill} stroke={OUT} strokeWidth={spec.arm.strokeWidth} strokeLinejoin="round" />
            </g>

            {/* head group: nod/breathing + droop asleep, tilt about neck */}
            <g transform={`translate(0 ${rHeadY.toFixed(2)}) ${piv(spec.neck.x, spec.neck.y, rHeadTilt)}`}>
              <ellipse cx={spec.head.cx} cy={spec.head.cy} rx={spec.head.rx} ry={spec.head.ry} fill={spec.head.fill} />
              <g clipPath={`url(#${headClip})`}>
                <ellipse cx={spec.head.cx + spec.head.rimDx} cy={spec.head.cy + spec.head.rimDy} rx={spec.head.rx + spec.head.rimDRx} ry={spec.head.ry + spec.head.rimDRy} fill={spec.head.rimFill} />
              </g>
              <ellipse
                cx={spec.head.cx}
                cy={spec.head.cy}
                rx={spec.head.rx}
                ry={spec.head.ry}
                fill="none"
                stroke={OUT}
                strokeWidth={spec.head.strokeWidth}
                strokeLinejoin="round"
              />

              {/* blush: deep candy-pink ovals, tilted; lift on blink */}
              <ellipse
                cx={spec.blush.leftX}
                cy={spec.blush.cy - rCheekLift}
                rx={spec.blush.rx}
                ry={spec.blush.ry}
                fill={spec.blush.fill}
                opacity={spec.blush.opacity}
                transform={`rotate(${-spec.blush.tiltDeg} ${spec.blush.leftX} ${spec.blush.cy})`}
              />
              <ellipse
                cx={spec.blush.rightX}
                cy={spec.blush.cy - rCheekLift}
                rx={spec.blush.rx}
                ry={spec.blush.ry}
                fill={spec.blush.fill}
                opacity={spec.blush.opacity}
                transform={`rotate(${spec.blush.tiltDeg} ${spec.blush.rightX} ${spec.blush.cy})`}
              />

              {/* eyes: glossy sparkle — halo + big top-left + small
                  bottom-right highlights + 4-point star; blink -> arc */}
              {spec.eyesX.map((ex) => (
                <g key={`reye-${ex}`}>
                  <g transform={piv(ex, spec.eyeY, 0, 1, rEyeSy * rEyeWide)}>
                    <ellipse cx={ex + rLookX} cy={spec.eyeY} rx={spec.eye.rx} ry={spec.eye.ry} fill={OUT} />
                    <ellipse cx={ex + rLookX + spec.eye.haloDx} cy={spec.eyeY + spec.eye.haloDy} rx={spec.eye.haloRx} ry={spec.eye.haloRy} fill={spec.white} opacity={spec.eye.haloOpacity} />
                    <circle cx={ex + rLookX + spec.eye.glintDx} cy={spec.eyeY + spec.eye.glintDy} r={spec.eye.glintR} fill={spec.white} opacity={spec.eye.glintOpacity} />
                    <circle cx={ex + rLookX + spec.eye.glint2Dx} cy={spec.eyeY + spec.eye.glint2Dy} r={spec.eye.glint2R} fill={spec.white} opacity={spec.eye.glint2Opacity} />
                    <path d={star4(ex + rLookX + spec.eye.starDx, spec.eyeY + spec.eye.starDy, spec.eye.starR)} fill={spec.white} opacity={spec.eye.starOpacity} />
                  </g>
                  <path
                    d={`M ${ex - spec.eye.arcDx} ${spec.eyeY + spec.eye.arcDy} Q ${ex} ${spec.eyeY + spec.eye.arcPeakDy} ${ex + spec.eye.arcDx} ${spec.eyeY + spec.eye.arcDy}`}
                    fill="none"
                    stroke={OUT}
                    strokeWidth={spec.eye.arcStrokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={rArcOp}
                  />
                </g>
              ))}

              {/* nose: rounded pink heart-ish */}
              <path
                d={spec.nose.path}
                fill={spec.nose.fill}
                stroke={OUT}
                strokeWidth={spec.nose.strokeWidth}
                strokeLinejoin="round"
              />

              {/* mouth: open viseme ellipse crossfaded with closed smile + dimples */}
              {rMouth.rx > 0.5 ? (
                <g opacity={rMouthOp}>
                  <ellipse
                    cx={spec.mouthX}
                    cy={spec.mouthY}
                    rx={rMouth.rx}
                    ry={rMouth.ry}
                    fill={spec.mouth.fill}
                    stroke={OUT}
                    strokeWidth={spec.mouth.strokeWidth}
                    strokeLinejoin="round"
                  />
                  {rTongueOp > 0.01 ? (
                    <g clipPath={`url(#${mouthClip})`} opacity={rTongueOp}>
                      <ellipse
                        cx={spec.mouthX}
                        cy={spec.mouthY + rMouth.ry * spec.mouth.tongueDyFactor}
                        rx={rMouth.rx * spec.mouth.tongueRxFactor}
                        ry={rMouth.ry * spec.mouth.tongueRyFactor}
                        fill={spec.mouth.tongueFill}
                      />
                    </g>
                  ) : null}
                </g>
              ) : null}
              <path
                d={spec.mouth.smilePath}
                fill="none"
                stroke={OUT}
                strokeWidth={spec.mouth.smileStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={rSmileOp}
              />
              <path
                d={spec.mouth.dimpleLPath}
                fill="none"
                stroke={OUT}
                strokeWidth={spec.mouth.dimpleStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={rSmileOp}
              />
              <path
                d={spec.mouth.dimpleRPath}
                fill="none"
                stroke={OUT}
                strokeWidth={spec.mouth.dimpleStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={rSmileOp}
              />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};
