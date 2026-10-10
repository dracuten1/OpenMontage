import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import timelineJson from "../public/character-performer/kids/dialogue/timeline.json";
import d0c from "../public/character-performer/kids/dialogue/d0_cues.json";
import d1c from "../public/character-performer/kids/dialogue/d1_cues.json";
import d2c from "../public/character-performer/kids/dialogue/d2_cues.json";
import d3c from "../public/character-performer/kids/dialogue/d3_cues.json";
import d4c from "../public/character-performer/kids/dialogue/d4_cues.json";
import d5c from "../public/character-performer/kids/dialogue/d5_cues.json";
import d6c from "../public/character-performer/kids/dialogue/d6_cues.json";
import d7c from "../public/character-performer/kids/dialogue/d7_cues.json";

// ---------------------------------------------------------------------------
// KidsRabbitTurtleDuet — 2-character dialogue: white rabbit (from KidsRabbitCode)
// + NEW code-drawn golden turtle, same children's-book parametric style.
// Pure function of frame: no Math.random / Date / CSS animation.
//
// Helpers (lerp/clamp/piv/VISEMES/blink/hop) duplicated from KidsRabbitCode.tsx
// with minimal adaptation — that file must stay untouched (task constraint), so
// extraction into a shared module is not possible here.
//
// Cue offset math: d{i}_cues.json t=0 is the START of that line's wav, NOT the
// shared timeline. Lookup time = t - line.start (see mouthAtCues call sites).
// ---------------------------------------------------------------------------

type MouthCue = { start: number; end: number; value: string };
type Line = { i: number; who: "rabbit" | "turtle"; text: string; start: number; dur: number };

const LINES = (timelineJson as any).lines as Line[];
const LINE_CUES: MouthCue[][] = [d0c, d1c, d2c, d3c, d4c, d5c, d6c, d7c].map(
  (c) => (c as any).mouthCues as MouthCue[]
);

const OUT = "#3a2e2a"; // warm dark brown outline (same as rabbit)
const EASE_OUT_BACK = Easing.bezier(0.34, 1.56, 0.64, 1);
const EOC = Easing.out(Easing.cubic);
const EIC = Easing.in(Easing.cubic);

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// pivot-wrap transform helper (from KidsRabbitCode)
const piv = (cx: number, cy: number, deg: number, sx = 1, sy = 1) =>
  `translate(${cx} ${cy}) rotate(${deg}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`;

// ---- viseme targets (QC-passed table from KidsRabbitCode / REPORT_CODE.md) ----
const VISEMES: Record<string, { rx: number; ry: number }> = {
  X: { rx: 0, ry: 0 },
  B: { rx: 9, ry: 3 },
  C: { rx: 13, ry: 7 },
  D: { rx: 20, ry: 15 },
  E: { rx: 26, ry: 9 },
  F: { rx: 10, ry: 6 },
  G: { rx: 8, ry: 8 },
  H: { rx: 28, ry: 22 },
  A: { rx: 30, ry: 26 },
};

// Generalized version of KidsRabbitCode.mouthAt: works on any cue array with
// local time. 70ms easeOutCubic lerp prev->cur; relax to closed after the last
// cue ends (70ms). Same interpolation contract as REPORT_CODE.md.
const mouthAtCues = (cues: MouthCue[], tt: number): { rx: number; ry: number } => {
  if (!cues.length || tt < cues[0].start) return VISEMES.X;
  let i = -1;
  for (let j = cues.length - 1; j >= 0; j--) {
    if (cues[j].start <= tt) {
      i = j;
      break;
    }
  }
  if (i < 0) return VISEMES.X;
  const lastCue = cues[cues.length - 1];
  if (tt >= lastCue.end) {
    const last = VISEMES[lastCue.value] ?? VISEMES.X;
    const p = EOC(Math.min(1, (tt - lastCue.end) / 0.07));
    return { rx: lerp(last.rx, 0, p), ry: lerp(last.ry, 0, p) };
  }
  const cur = VISEMES[cues[i].value] ?? VISEMES.X;
  const since = tt - cues[i].start;
  if (since < 0.07 && i > 0) {
    const prev = VISEMES[cues[i - 1].value] ?? VISEMES.X;
    const p = EOC(clamp01(since / 0.07));
    return { rx: lerp(prev.rx, cur.rx, p), ry: lerp(prev.ry, cur.ry, p) };
  }
  return cur;
};

const activeLine = (t: number): Line | null =>
  LINES.find((l) => t >= l.start - 0.05 && t < l.start + l.dur + 0.05) ?? null;

// smooth on/off envelope around a line (for nod amplitude, head extension...)
const envAt = (tt: number, a0: number, a1: number, b0: number, b1: number): number =>
  interpolate(tt, [a0, a1], [0, 1], {
    easing: EOC,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) *
  interpolate(tt, [b0, b1], [1, 0], {
    easing: EOC,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// ---- blink: close 80ms easeInCubic, open 120ms easeOutCubic (parameterized
//      version of KidsRabbitCode.blinkAt) ----
const blinkFrom = (starts: number[], tt: number): number => {
  let b = 0;
  for (const s of starts) {
    const dt = tt - s;
    if (dt < 0 || dt >= 0.2) continue;
    const v = dt < 0.08 ? EIC(dt / 0.08) : 1 - EOC(clamp01((dt - 0.08) / 0.12));
    b = Math.max(b, v);
  }
  return b;
};

// deterministic schedules (no randomness)
const RABBIT_BLINKS = [1.05, 4.6, 4.82, 7.4, 10.6, 10.82, 13.0, 15.9, 16.12, 22.4, 24.05, 26.9, 27.12, 29.0];
const TURTLE_BLINKS = [1.6, 5.6, 9.6, 13.6, 17.6, 21.6, 25.6, 28.4]; // slower: ~4s cycle

// ---- rabbit hops in the duet: small celebration hops at rabbit line ends
//      (NOT i4 — rabbit falls asleep there; wake at 20.70 has its own jerk) ----
const HOPS: { s: number; h: number }[] = [
  { s: 3.3, h: 34 },
  { s: 10.6, h: 34 },
  { s: 24.6, h: 34 },
];

// hopState copied from KidsRabbitCode (same squash-stretch contract)
const hopState = (tt: number): { dy: number; sx: number; sy: number; arm: number } => {
  let dy = 0;
  let sx = 1;
  let sy = 1;
  let arm = 0;
  for (const { s, h } of HOPS) {
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

// ---- rabbit geometry (identical to KidsRabbitCode, local canvas coords) ----
const FEET_Y = 856;
const BODY = { cx: 540, cy: 742, rx: 120, ry: 126 };
const HEAD = { cx: 540, cy: 565, rx: 150, ry: 125 };
const NECK = { x: 540, y: 668 };
const MOUTH_Y = 632;
const EYE_Y = 548;
const EYES_X = [474, 606];
const VEST_PATH =
  "M 468 668 Q 540 646 612 668 Q 634 712 630 764 Q 540 806 450 764 Q 446 712 468 668 Z";

// ---- NEW turtle geometry (drawn facing LEFT toward the rabbit, same ground
//      line y=856, local canvas coords before staging transform) ----
const TURT = {
  dome: { cx: 540, cy: 715, rx: 142, ry: 122 },
  rim: { cx: 540, cy: 750, rx: 152, ry: 42 },
  head: { cx: 352, cy: 660, rx: 96, ry: 84 },
  neck: { cx: 430, cy: 700, rx: 55, ry: 52 },
  eyeY: 634,
  eyesX: [302, 372],
  mouth: { x: 315, y: 706 },
  legsFar: [505, 600],
  legsNear: [445, 648],
  tail: { cx: 688, cy: 802, rx: 24, ry: 15 },
  spots: [
    { x: 540, y: 645, r: 32 },
    { x: 474, y: 698, r: 22 },
    { x: 606, y: 698, r: 22 },
    { x: 540, y: 598, r: 22 },
  ],
};

// rounded-join hexagon path for shell spots (pure math, deterministic)
const hexPath = (cx: number, cy: number, r: number): string => {
  const pts: string[] = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k - Math.PI / 6;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M ${pts.join(" L ")} Z`;
};

const TURTLE_VISEME_SCALE = 0.85; // turtle mouth is smaller than rabbit's

// ---- staging (1080x1080): rabbit left x=0.32 facing right (drawn front-facing
//      symmetric; "facing" reads via pupils offset toward the speaker), turtle
//      right x=0.68 drawn facing left. Both pivot at shared ground y=856. ----
const RABBIT_X = 346; // 0.32 * 1080
const RABBIT_S = 0.78;
const TURTLE_X = 734; // 0.68 * 1080
const TURTLE_S = 0.62;

// world-space head centers (for zZz placement; crop boxes derived in QC script)
const RABBIT_HEAD_WORLD = { x: 346, y: Math.round(856 - (856 - 565) * RABBIT_S) }; // (346, 629)

const TITLE_TEXT = "Rùa và Thỏ 🐰🐢";
const TITLE_FONT =
  "'Baloo 2','Arial Rounded MT Bold','Comic Sans MS',system-ui,sans-serif";

export const KidsRabbitTurtleDuet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  // ================= speech state =================
  const line = activeLine(t);
  const speaker: "rabbit" | "turtle" | null = line ? line.who : null;

  // rabbit reaction beats: sleep (i4 tail) -> wake startled (i6 start)
  const sleepIn = interpolate(t, [16.45, 16.95], [0, 1], {
    easing: EOC,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sleepOut = interpolate(t, [20.7, 20.84], [1, 0], {
    easing: EIC,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const asleep = sleepIn * sleepOut;
  const wakePop =
    interpolate(t, [20.7, 21.02], [0, 1], {
      easing: EASE_OUT_BACK,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(t, [20.95, 21.8], [1, 0], {
      easing: EOC,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const jerkUp =
    interpolate(t, [20.7, 20.88], [0, 1], {
      easing: EASE_OUT_BACK,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(t, [20.92, 21.55], [1, 0], {
      easing: EOC,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // turtle proud pose: during i7 + ~1s after (release by ~29.5)
  const proud =
    interpolate(t, [25.0, 25.6], [0, 1], {
      easing: EOC,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(t, [28.95, 29.55], [1, 0], {
      easing: EOC,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // cue lookup: ONLY the speaker lip-syncs, on that line's cues + start offset
  const rMouth0 =
    speaker === "rabbit" && line ? mouthAtCues(LINE_CUES[line.i], t - line.start) : VISEMES.X;
  const tMouth0 =
    speaker === "turtle" && line ? mouthAtCues(LINE_CUES[line.i], t - line.start) : VISEMES.X;
  const rMouth = { rx: rMouth0.rx * (1 - asleep), ry: rMouth0.ry * (1 - asleep) };
  const tMouth = {
    rx: tMouth0.rx * TURTLE_VISEME_SCALE,
    ry: tMouth0.ry * TURTLE_VISEME_SCALE,
  };

  // smooth speech envelopes (nod amplitude, head extension, listener nod)
  const envR = LINES.filter((l) => l.who === "rabbit").reduce(
    (acc, l) => acc + envAt(t, l.start - 0.15, l.start, l.start + l.dur - 0.2, l.start + l.dur + 0.1),
    0
  );
  const envT = LINES.filter((l) => l.who === "turtle").reduce(
    (acc, l) => acc + envAt(t, l.start - 0.15, l.start, l.start + l.dur - 0.2, l.start + l.dur + 0.1),
    0
  );

  // ================= rabbit anim state =================
  const rBlinkRaw = blinkFrom(RABBIT_BLINKS, t);
  const rBlink = Math.max(rBlinkRaw, asleep); // eyes stay closed while asleep
  const hop = hopState(t);
  const breathe = Math.sin((Math.PI * 2 * t) / 3.6);
  const rTiltSway = 2.5 * Math.sin(Math.PI * 2 * 0.13 * t);
  const rHeadTilt = rTiltSway + 8 * asleep - 5 * wakePop;
  const rSpeakNod = Math.sin(t * Math.PI * 2 * 2.2) * 1.5 * Math.min(1, envR);
  const rListenNod = Math.sin(t * Math.PI * 2 * 0.9) * 1.2 * Math.min(1, envT) * (1 - asleep);
  const rHeadY = 1.5 * breathe + rSpeakNod + rListenNod + 11 * asleep - 4 * wakePop;
  const earSway = Math.sin(Math.PI * 2 * 0.55 * t) * 2;
  // asleep: ears droop outward; startled: shoot upright (easeOutBack overshoot)
  const earRotL = earSway - 24 * asleep + 16 * wakePop;
  const earRotR = -earSway + 24 * asleep - 16 * wakePop;
  const rLookX = speaker === "turtle" ? 5 : 0; // idle-attentive: pupils toward turtle

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
  const bodySx = hop.sx * (1 - 0.004 * breathe);
  const bodySy = hop.sy * (1 + 0.012 * breathe);

  // ================= turtle anim state =================
  const tBlink = blinkFrom(TURTLE_BLINKS, t);
  const tBreathe = Math.sin((Math.PI * 2 * t) / 5); // slower, calmer than rabbit
  // peek cycle: head extends/retracts, ~4s period, slow and even (turtle personality)
  const peek = Math.sin((Math.PI * 2 * t) / 4);
  const tHeadX = -(5 + 5 * peek) - 5 * Math.min(1, envT);
  const tSpeakNod = Math.sin(t * Math.PI * 2 * 1.1) * 2.2 * Math.min(1, envT); // gentle slow nod
  const tListenNod = Math.sin(t * Math.PI * 2 * 0.85) * 1.6 * Math.min(1, envR);
  const tHeadY = 1.2 * tBreathe + tSpeakNod + tListenNod - 6 * proud;
  // facing left: positive rotate lifts the nose (chin-up proud)
  const tHeadTilt = 1.5 * Math.sin(Math.PI * 2 * 0.09 * t) + 7 * proud;
  const tLookX = speaker === "turtle" ? -2 : -5; // attentive toward rabbit
  const tBodyDy = -3 * proud;

  const tOpenness = clamp01(tMouth.ry / 10);
  const tSmileOp = clamp01(1 - tOpenness);
  const tMouthOp = clamp01(tOpenness * 1.15);
  const tTongueOp = clamp01((tMouth.ry - 10) / 7);
  const tEyeSy = 1 - 0.95 * tBlink;
  const tArcOp = clamp01((tBlink - 0.55) / 0.3);
  const tSmileW = 30 + 8 * proud;
  const tSmileD = 22 + 6 * proud;

  // ================= title =================
  const titleP = interpolate(frame, [0, 18], [0, 1], {
    easing: EASE_OUT_BACK,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = -60 * (1 - titleP);
  const titleOp = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ================= zZz (world coords, above rabbit's head, never mirrored) =================
  const zzzs = [
    { x: 408, y: 500, s: 26 },
    { x: 434, y: 462, s: 34 },
    { x: 462, y: 420, s: 44 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#bfe6f5" }}>
      <Img
        src={staticFile("character-performer/kids/k_bg_clean.png")}
        style={{ width, height, objectFit: "cover" }}
      />

      <svg
        viewBox="0 0 1080 1080"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          {/* rabbit clips */}
          <clipPath id="duet-r-body-clip">
            <ellipse cx={BODY.cx} cy={BODY.cy} rx={BODY.rx} ry={BODY.ry} />
          </clipPath>
          <clipPath id="duet-r-head-clip">
            <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} />
          </clipPath>
          <clipPath id="duet-r-mouth-clip">
            <ellipse
              cx={540}
              cy={MOUTH_Y}
              rx={Math.max(rMouth.rx, 0.01)}
              ry={Math.max(rMouth.ry, 0.01)}
            />
          </clipPath>
          {/* turtle clips */}
          <clipPath id="duet-t-shell-clip">
            <ellipse
              cx={TURT.dome.cx}
              cy={TURT.dome.cy}
              rx={TURT.dome.rx - 14}
              ry={TURT.dome.ry - 14}
            />
          </clipPath>
          <clipPath id="duet-t-head-clip">
            <ellipse cx={TURT.head.cx} cy={TURT.head.cy} rx={TURT.head.rx} ry={TURT.head.ry} />
          </clipPath>
          <clipPath id="duet-t-mouth-clip">
            <ellipse
              cx={TURT.mouth.x}
              cy={TURT.mouth.y}
              rx={Math.max(tMouth.rx, 0.01)}
              ry={Math.max(tMouth.ry, 0.01)}
            />
          </clipPath>
        </defs>

        {/* ==================== TURTLE (right, facing left) ==================== */}
        <g transform={`translate(${TURTLE_X} 856) scale(${TURTLE_S}) translate(-540 -856)`}>
          <g transform={`translate(0 ${tBodyDy})`}>
            {/* ground shadow */}
            <ellipse cx={540} cy={858} rx={160} ry={26} fill="#2e5d34" opacity={0.22} />

            {/* tail (behind everything) */}
            <ellipse
              cx={TURT.tail.cx}
              cy={TURT.tail.cy}
              rx={TURT.tail.rx}
              ry={TURT.tail.ry}
              fill="#94a344"
              stroke={OUT}
              strokeWidth={9}
            />

            {/* far legs (darker olive, behind shell) */}
            {TURT.legsFar.map((lx) => (
              <ellipse
                key={`far-${lx}`}
                cx={lx}
                cy={800}
                rx={28}
                ry={42}
                fill="#7f8f38"
                stroke={OUT}
                strokeWidth={9}
              />
            ))}

            {/* head group: peek extend/retract + speaking/listening nod + proud tilt */}
            <g
              transform={`translate(${tHeadX} ${tHeadY}) ${piv(TURT.neck.cx, TURT.neck.cy, tHeadTilt)}`}
            >
              {/* neck (joins head to shell, mostly hidden behind shell) */}
              <ellipse
                cx={TURT.neck.cx}
                cy={TURT.neck.cy}
                rx={TURT.neck.rx}
                ry={TURT.neck.ry}
                fill="#94a344"
              />
              {/* head with soft top-left highlight */}
              <ellipse
                cx={TURT.head.cx}
                cy={TURT.head.cy}
                rx={TURT.head.rx}
                ry={TURT.head.ry}
                fill="#94a344"
              />
              <g clipPath="url(#duet-t-head-clip)">
                <ellipse
                  cx={TURT.head.cx - 8}
                  cy={TURT.head.cy - 6}
                  rx={TURT.head.rx - 2}
                  ry={TURT.head.ry - 2}
                  fill="#a8b755"
                />
              </g>
              <ellipse
                cx={TURT.head.cx}
                cy={TURT.head.cy}
                rx={TURT.head.rx}
                ry={TURT.head.ry}
                fill="none"
                stroke={OUT}
                strokeWidth={12}
              />

              {/* cheeks: light pink */}
              <ellipse cx={288} cy={664} rx={20} ry={13} fill="#ffb3c0" opacity={0.7} />
              <ellipse cx={396} cy={668} rx={20} ry={13} fill="#ffb3c0" opacity={0.7} />

              {/* eyes: big kind dark eyes + highlight; blink crossfades to arc */}
              {TURT.eyesX.map((ex) => (
                <g key={`teye-${ex}`}>
                  <g transform={piv(ex, TURT.eyeY, 0, 1, tEyeSy)}>
                    <ellipse cx={ex + tLookX} cy={TURT.eyeY} rx={15} ry={19} fill={OUT} />
                    <circle cx={ex + tLookX - 4.5} cy={TURT.eyeY - 6} r={5} fill="#ffffff" />
                  </g>
                  <path
                    d={`M ${ex - 14} ${TURT.eyeY + 2} Q ${ex} ${TURT.eyeY - 8} ${ex + 14} ${TURT.eyeY + 2}`}
                    fill="none"
                    stroke={OUT}
                    strokeWidth={7}
                    strokeLinecap="round"
                    opacity={tArcOp}
                  />
                </g>
              ))}

              {/* beak snout + nostrils */}
              <ellipse
                cx={262}
                cy={668}
                rx={12}
                ry={9}
                fill="#a8b755"
                stroke={OUT}
                strokeWidth={5}
              />
              <circle cx={258} cy={664} r={2.4} fill={OUT} />
              <circle cx={264} cy={661} r={2.4} fill={OUT} />

              {/* mouth: open viseme ellipse crossfaded with closed smile arc */}
              {tMouth.rx > 0.5 ? (
                <g opacity={tMouthOp}>
                  <ellipse
                    cx={TURT.mouth.x}
                    cy={TURT.mouth.y}
                    rx={tMouth.rx}
                    ry={tMouth.ry}
                    fill="#5b3a3f"
                    stroke={OUT}
                    strokeWidth={5}
                  />
                  {tTongueOp > 0.01 ? (
                    <g clipPath="url(#duet-t-mouth-clip)" opacity={tTongueOp}>
                      <ellipse
                        cx={TURT.mouth.x}
                        cy={TURT.mouth.y + tMouth.ry * 0.38}
                        rx={tMouth.rx * 0.62}
                        ry={tMouth.ry * 0.5}
                        fill="#ff8fa3"
                      />
                    </g>
                  ) : null}
                </g>
              ) : null}
              <path
                d={`M ${TURT.mouth.x - tSmileW} ${TURT.mouth.y - 6} Q ${TURT.mouth.x} ${
                  TURT.mouth.y - 6 + tSmileD
                } ${TURT.mouth.x + tSmileW} ${TURT.mouth.y - 6}`}
                fill="none"
                stroke={OUT}
                strokeWidth={7}
                strokeLinecap="round"
                opacity={tSmileOp}
              />
            </g>

            {/* near legs (drawn before shell so the rim covers their tops) */}
            {TURT.legsNear.map((lx) => (
              <g key={`near-${lx}`}>
                <ellipse
                  cx={lx}
                  cy={812}
                  rx={33}
                  ry={47}
                  fill="#94a344"
                  stroke={OUT}
                  strokeWidth={9}
                />
                <line
                  x1={lx - 10}
                  y1={840}
                  x2={lx - 10}
                  y2={854}
                  stroke={OUT}
                  strokeWidth={5}
                  strokeLinecap="round"
                  opacity={0.85}
                />
                <line
                  x1={lx + 10}
                  y1={840}
                  x2={lx + 10}
                  y2={854}
                  stroke={OUT}
                  strokeWidth={5}
                  strokeLinecap="round"
                  opacity={0.85}
                />
              </g>
            ))}

            {/* shell dome (golden yellow) + red-orange hexagon pattern */}
            <ellipse
              cx={TURT.dome.cx}
              cy={TURT.dome.cy}
              rx={TURT.dome.rx}
              ry={TURT.dome.ry}
              fill="#f2b53c"
            />
            <g clipPath="url(#duet-t-shell-clip)">
              {TURT.spots.map((sp) => (
                <path
                  key={`spot-${sp.x}-${sp.y}`}
                  d={hexPath(sp.x, sp.y, sp.r)}
                  fill="#e8724a"
                  stroke={OUT}
                  strokeWidth={7}
                  strokeLinejoin="round"
                />
              ))}
              {/* soft sheen */}
              <ellipse
                cx={490}
                cy={640}
                rx={40}
                ry={18}
                fill="#ffffff"
                opacity={0.22}
                transform="rotate(-25 490 640)"
              />
            </g>
            <ellipse
              cx={TURT.dome.cx}
              cy={TURT.dome.cy}
              rx={TURT.dome.rx}
              ry={TURT.dome.ry}
              fill="none"
              stroke={OUT}
              strokeWidth={12}
            />

            {/* shell rim (darker orange lip with inner line) */}
            <ellipse
              cx={TURT.rim.cx}
              cy={TURT.rim.cy}
              rx={TURT.rim.rx}
              ry={TURT.rim.ry}
              fill="#e09a30"
              stroke={OUT}
              strokeWidth={11}
            />
            <ellipse
              cx={TURT.rim.cx}
              cy={TURT.rim.cy + 2}
              rx={TURT.rim.rx - 14}
              ry={TURT.rim.ry - 10}
              fill="none"
              stroke="#c9821e"
              strokeWidth={6}
            />
          </g>
        </g>

        {/* ==================== RABBIT (left, facing right) ==================== */}
        <g transform={`translate(${RABBIT_X} 856) scale(${RABBIT_S}) translate(-540 -856)`}>
          {/* startled wake: whole-body jump with easeOutBack overshoot */}
          <g transform={`translate(0 ${-24 * jerkUp})`}>
            {/* ground shadow (stays on ground, shrinks + fades when airborne) */}
            <ellipse
              cx={540}
              cy={858}
              rx={150 * rShScale}
              ry={30 * rShScale}
              fill="#2e5d34"
              opacity={rShOp}
            />

            {/* whole-rabbit hop translation */}
            <g transform={`translate(0 ${hop.dy})`}>
              {/* squash-stretch + breathing, pivot at feet */}
              <g transform={piv(540, FEET_Y, 0, bodySx, bodySy)}>
                {/* tail puff (behind body) */}
                <ellipse cx={413} cy={764} rx={36} ry={33} fill="#ffffff" stroke={OUT} strokeWidth={9} />

                {/* ears — droop outward asleep, shoot upright startled */}
                <g transform={piv(NECK.x, NECK.y, rHeadTilt)}>
                  <g transform={piv(492, 468, earRotL)}>
                    <ellipse cx={492} cy={380} rx={27} ry={92} fill="#ffffff" stroke={OUT} strokeWidth={10} />
                    <ellipse cx={492} cy={392} rx={14} ry={64} fill="#ffb7c9" />
                    <ellipse cx={492} cy={400} rx={8} ry={42} fill="#ff93ad" />
                  </g>
                  <g transform={piv(588, 468, earRotR)}>
                    <ellipse cx={588} cy={380} rx={27} ry={92} fill="#ffffff" stroke={OUT} strokeWidth={10} />
                    <ellipse cx={588} cy={392} rx={14} ry={64} fill="#ffb7c9" />
                    <ellipse cx={588} cy={400} rx={8} ry={42} fill="#ff93ad" />
                  </g>
                </g>

                {/* body with warm rim shading */}
                <ellipse cx={BODY.cx} cy={BODY.cy} rx={BODY.rx} ry={BODY.ry} fill="#f3ebe4" />
                <g clipPath="url(#duet-r-body-clip)">
                  <ellipse cx={BODY.cx - 8} cy={BODY.cy - 5} rx={BODY.rx - 1} ry={BODY.ry - 1} fill="#ffffff" />
                </g>
                <ellipse
                  cx={BODY.cx}
                  cy={BODY.cy}
                  rx={BODY.rx}
                  ry={BODY.ry}
                  fill="none"
                  stroke={OUT}
                  strokeWidth={12}
                />

                {/* red vest with darker rim + buttons */}
                <path d={VEST_PATH} fill="#e8503a" stroke={OUT} strokeWidth={9} strokeLinejoin="round" />
                <path d="M 456 754 Q 540 798 624 754" fill="none" stroke="#c23a28" strokeWidth={8} strokeLinecap="round" />
                <path d="M 540 658 Q 543 730 540 798" fill="none" stroke="#c23a28" strokeWidth={5} strokeLinecap="round" />
                <circle cx={540} cy={714} r={9} fill="#ffffff" stroke="#c23a28" strokeWidth={4} />
                <circle cx={540} cy={758} r={9} fill="#ffffff" stroke="#c23a28" strokeWidth={4} />

                {/* feet */}
                {[497, 583].map((fx) => (
                  <g key={fx}>
                    <ellipse cx={fx} cy={853} rx={52} ry={27} fill="#ffffff" stroke={OUT} strokeWidth={9} />
                    <line x1={fx - 13} y1={842} x2={fx - 13} y2={856} stroke={OUT} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
                    <line x1={fx + 13} y1={842} x2={fx + 13} y2={856} stroke={OUT} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
                  </g>
                ))}

                {/* arms — rounded stubs, swing outward while airborne */}
                <g transform={piv(466, 706, -(13 + hop.arm))}>
                  <ellipse cx={450} cy={742} rx={21} ry={44} fill="#ffffff" stroke={OUT} strokeWidth={9} />
                </g>
                <g transform={piv(614, 706, 13 + hop.arm)}>
                  <ellipse cx={630} cy={742} rx={21} ry={44} fill="#ffffff" stroke={OUT} strokeWidth={9} />
                </g>

                {/* head group: nod/breathing + droop asleep, tilt about neck */}
                <g transform={`translate(0 ${rHeadY}) ${piv(NECK.x, NECK.y, rHeadTilt)}`}>
                  <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} fill="#f3ebe4" />
                  <g clipPath="url(#duet-r-head-clip)">
                    <ellipse cx={HEAD.cx - 9} cy={HEAD.cy - 6} rx={HEAD.rx - 1} ry={HEAD.ry - 1} fill="#ffffff" />
                  </g>
                  <ellipse
                    cx={HEAD.cx}
                    cy={HEAD.cy}
                    rx={HEAD.rx}
                    ry={HEAD.ry}
                    fill="none"
                    stroke={OUT}
                    strokeWidth={12}
                  />

                  {/* cheeks (blush, lift on blink) */}
                  <ellipse cx={438} cy={598 - rCheekLift} rx={24} ry={15} fill="#ffb3c0" opacity={0.75} />
                  <ellipse cx={642} cy={598 - rCheekLift} rx={24} ry={15} fill="#ffb3c0" opacity={0.75} />

                  {/* eyes: big dark with highlight; blink/sleep crossfades to arc; wide when startled */}
                  {EYES_X.map((ex) => (
                    <g key={ex}>
                      <g transform={piv(ex, EYE_Y, 0, 1, rEyeSy * rEyeWide)}>
                        <ellipse cx={ex + rLookX} cy={EYE_Y} rx={16.5} ry={21} fill={OUT} />
                        <circle cx={ex + rLookX - 5} cy={EYE_Y - 7} r={5.5} fill="#ffffff" />
                      </g>
                      <path
                        d={`M ${ex - 15} ${EYE_Y + 2} Q ${ex} ${EYE_Y - 9} ${ex + 15} ${EYE_Y + 2}`}
                        fill="none"
                        stroke={OUT}
                        strokeWidth={8}
                        strokeLinecap="round"
                        opacity={rArcOp}
                      />
                    </g>
                  ))}

                  {/* nose: small rounded pink */}
                  <path
                    d="M 526 592 Q 540 585 554 592 Q 549 606 540 611 Q 531 606 526 592 Z"
                    fill="#ff8fa3"
                    stroke={OUT}
                    strokeWidth={4.5}
                    strokeLinejoin="round"
                  />

                  {/* mouth: open viseme ellipse crossfaded with closed smile arc */}
                  {rMouth.rx > 0.5 ? (
                    <g opacity={rMouthOp}>
                      <ellipse
                        cx={540}
                        cy={MOUTH_Y}
                        rx={rMouth.rx}
                        ry={rMouth.ry}
                        fill="#5b3a3f"
                        stroke={OUT}
                        strokeWidth={5}
                      />
                      {rTongueOp > 0.01 ? (
                        <g clipPath="url(#duet-r-mouth-clip)" opacity={rTongueOp}>
                          <ellipse
                            cx={540}
                            cy={MOUTH_Y + rMouth.ry * 0.38}
                            rx={rMouth.rx * 0.62}
                            ry={rMouth.ry * 0.5}
                            fill="#ff8fa3"
                          />
                        </g>
                      ) : null}
                    </g>
                  ) : null}
                  <path
                    d={`M ${540 - 30} 626 Q 540 648 ${540 + 30} 626`}
                    fill="none"
                    stroke={OUT}
                    strokeWidth={7}
                    strokeLinecap="round"
                    opacity={rSmileOp}
                  />
                </g>
              </g>
            </g>
          </g>
        </g>

        {/* ==================== zZz above sleeping rabbit (world coords) ==================== */}
        {asleep > 0.02
          ? zzzs.map((z, idx) => {
              const ph = t * 0.6 + idx * 0.9;
              const wave = (Math.sin(Math.PI * 2 * ph) + 1) / 2; // 0..1
              return (
                <text
                  key={`zzz-${idx}`}
                  x={z.x}
                  y={z.y - 8 * wave}
                  fontFamily={TITLE_FONT}
                  fontSize={z.s}
                  fontWeight={800}
                  fill={OUT}
                  stroke="#ffffff"
                  strokeWidth={6}
                  paintOrder="stroke"
                  opacity={asleep * (0.35 + 0.55 * wave)}
                >
                  z
                </text>
              );
            })
          : null}
      </svg>

      {/* title — white halo layer under dark fill layer, drop-in easeOutBack */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          paddingTop: 70,
          display: "flex",
          justifyContent: "center",
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "relative",
            fontFamily: TITLE_FONT,
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.15,
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              color: "transparent",
              WebkitTextStroke: "10px #ffffff",
              paintOrder: "stroke fill",
            }}
          >
            {TITLE_TEXT}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              color: "#3a2e2a",
              textShadow: "0 3px 10px rgba(58,46,42,0.22)",
            }}
          >
            {TITLE_TEXT}
          </div>
        </div>
      </div>

      {/* 8 dialogue lines placed at their timeline `start` — gaps are >=0.45s, no overlap */}
      {LINES.map((l) => (
        <Sequence key={l.i} from={Math.round(l.start * fps)}>
          <Audio src={staticFile(`character-performer/kids/dialogue/d${l.i}_${l.who}.wav`)} />
        </Sequence>
      ))}
      <Audio src={staticFile("character-performer/kids/dialogue/bgm_dialogue.wav")} volume={0.3} />
    </AbsoluteFill>
  );
};
