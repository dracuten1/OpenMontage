import React from "react";
import {
  AbsoluteFill,
  Audio,
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
import { KawaiiRabbit, rabbitAsleepAt, RabbitSchedule } from "./rigs/KawaiiRabbit";
import { GoldenTurtle, TurtleSchedule } from "./rigs/GoldenTurtle";
import {
  clamp01,
  EASE_OUT_BACK,
  EIO,
  lerp,
  MouthCue,
  Pose,
} from "./rigs/types";

// Back-compat re-exports: <TurtleFigure> keeps living in ./rigs/GoldenTurtle
// (v3.3 one-path construction) — TurtleStill.tsx imports it from here.
export { TurtleFigure } from "./rigs/GoldenTurtle";
export type { TurtleFigureProps, TurtleBook } from "./rigs/GoldenTurtle";

// ---------------------------------------------------------------------------
// KidsStoryMultiScene — multi-scene storytelling comp: 5 backgrounds with
// 0.5s crossfades + continuous Ken Burns camera, dynamic staging (characters
// slide inside transition windows; turtle walks left through i5), title card
// centered, S5 celebration (turtle proud bounce, rabbit clap, deterministic
// confetti). Pure function of frame: no Math.random / Date / CSS animation.
//
// RIG SPLIT: the character rigs (rabbit / turtle v3.3) + their pose-envelope
// formulas now live in ./rigs/ (KawaiiRabbit, GoldenTurtle + spec JSONs —
// single source of aesthetic constants). This comp keeps the scene map,
// camera, staging, audio and scene elements (zZz, confetti, title), and
// passes each rig its schedule/timeline data via props. Zero visual change.
//
// Cue offset math: d{i}_cues.json t=0 is the START of that line's wav, NOT the
// shared timeline. Lookup time = t - line.start (see cues props below).
// ---------------------------------------------------------------------------

type Line = { i: number; who: "rabbit" | "turtle"; text: string; start: number; dur: number };

const LINES = (timelineJson as any).lines as Line[];
const LINE_CUES: MouthCue[][] = [d0c, d1c, d2c, d3c, d4c, d5c, d6c, d7c].map(
  (c) => (c as any).mouthCues as MouthCue[]
);

const OUT = "#3a2e2a"; // warm dark brown outline (scene elements: zZz)

const activeLine = (t: number): Line | null =>
  LINES.find((l) => t >= l.start - 0.05 && t < l.start + l.dur + 0.05) ?? null;

// ================= deterministic schedules passed into the rigs =================
// (values = the current video's timeline; rigs own the envelope formulas)
const RABBIT_SCHEDULE: RabbitSchedule = {
  blinks: [1.4, 6.1, 6.3, 9.8, 14.3, 14.6, 17.6, 19.4, 21.5, 21.7, 25.4, 29.8, 31.4, 35.3, 35.5, 37.6],
  hops: [
    { s: 3.75, h: 34 },
    { s: 13.55, h: 34 },
  ],
  sleepIn: [21.35, 21.85], // i4 tail
  sleepOut: [27.69, 27.83], // i6 start (wake startled)
  wakePopIn: [27.69, 28.01],
  wakePopOut: [27.94, 28.79],
  jerkIn: [27.69, 27.87],
  jerkOut: [27.91, 28.54],
  clapIn: [33.7, 33.9], // S5 clap
  clapOut: [39.0, 39.2],
};

const TURTLE_SCHEDULE: TurtleSchedule = {
  blinks: [1.6, 5.6, 9.6, 13.6, 17.6, 21.6, 25.6, 29.6, 33.6, 37.2], // slower: ~4s cycle
  walk: { t0: 23.0, t1: 26.9 }, // steady slow walk left through i5
  proud: { in: [32.6, 33.2], out: [38.55, 39.15], bounceStart: 33.2 }, // i7 + ~1s after
  book: {
    fall: [32.8, 33.08], // easeInQuad fall held -> ground
    settleEnd: 33.25, // tiny ±3px settle bounce
    heldX: 548,
    heldBodyY: 812,
    groundY: 834, // lands beside the LEFT front foot
    landX: 350,
    landRot: -12,
  },
};

// ---- staging (1080x1080, ground y=856): scales unchanged from duet ----
const RABBIT_S = 0.78;
const TURTLE_S = 0.62;

const TITLE_TEXT = "Rùa và Thỏ 🐰🐢";
const TITLE_FONT =
  "'Baloo 2','Arial Rounded MT Bold','Comic Sans MS',system-ui,sans-serif";

// ================= scene map (authoritative, per TASK_MULTISCENE v2 brief) =================
// S1 meadow 0->9.43 · S2 start line 9.43->18.33 · S3 oak 18.33->27.59
// S4 sunset 27.59->32.40 · S5 finish 32.40->39.62   (sc4_path.png NOT used)
const SCENE_BGS = [
  "character-performer/kids/k_bg_clean.png",
  "character-performer/kids/scenes/sc2_race.png",
  "character-performer/kids/scenes/sc3_tree.png",
  "character-performer/kids/scenes/sc5_sunset.png",
  "character-performer/kids/scenes/sc6_finish.png",
];
// crossfade windows 0.5s centered at scene boundaries (gap centers)
const XFADES = [9.43, 18.33, 27.59, 32.4];
const XF = 0.25; // half window

// Ken Burns per scene: scale s0->s1 + drift (each scene a different direction;
// S3 pure push-in, no drift — turtle's walk is the scene's primary motion)
type CamDef = { t0: number; t1: number; s0: number; s1: number; tx0: number; tx1: number; ty0: number; ty1: number };
const CAMS: CamDef[] = [
  { t0: 0.0, t1: 9.43, s0: 1.03, s1: 1.08, tx0: 0, tx1: 0, ty0: 0, ty1: -10 }, // S1 push-in + rise
  { t0: 9.43, t1: 18.33, s0: 1.08, s1: 1.03, tx0: 0, tx1: -10, ty0: 0, ty1: 0 }, // S2 pull-out + pan left
  { t0: 18.33, t1: 27.59, s0: 1.03, s1: 1.08, tx0: 0, tx1: 0, ty0: 0, ty1: 0 }, // S3 pure push-in
  { t0: 27.59, t1: 32.4, s0: 1.03, s1: 1.08, tx0: 0, tx1: 10, ty0: 0, ty1: -6 }, // S4 push-in + right drift
  { t0: 32.4, t1: 39.62, s0: 1.08, s1: 1.03, tx0: 0, tx1: 0, ty0: 0, ty1: 4 }, // S5 pull-out reveal
];

const camOf = (i: number, tt: number) => {
  const c = CAMS[i];
  const p = clamp01((tt - c.t0) / (c.t1 - c.t0));
  return {
    s: lerp(c.s0, c.s1, p),
    tx: lerp(c.tx0, c.tx1, p),
    ty: lerp(c.ty0, c.ty1, p),
  };
};

// camera at time t: inside a crossfade window, BLEND (lerp easeInOutCubic)
// outgoing-scene-end params with incoming-scene-start params
const cameraAt = (tt: number) => {
  for (let i = 0; i < XFADES.length; i++) {
    const c = XFADES[i];
    if (tt >= c - XF && tt < c + XF) {
      const b = EIO(clamp01((tt - (c - XF)) / (2 * XF)));
      const A = camOf(i, c + 1); // clamps to scene end (p=1)
      const B = camOf(i + 1, c - 1); // clamps to scene start (p=0)
      return {
        s: lerp(A.s, B.s, b),
        tx: lerp(A.tx, B.tx, b),
        ty: lerp(A.ty, B.ty, b),
      };
    }
  }
  for (let i = 0; i < CAMS.length; i++) {
    if (tt >= CAMS[i].t0 && tt < CAMS[i].t1) return camOf(i, tt);
  }
  return camOf(CAMS.length - 1, tt);
};

// ================= dynamic staging =================
// Characters slide across transition windows (0.75s easeInOutCubic, covering
// the 0.5s crossfade), hold still mid-scene. Turtle additionally WALKS left
// 640->260 linearly through i5 (23.0->26.9) with a small waddle bob.
const SLIDE_DUR = 0.75;
const slideP = (tt: number, center: number) =>
  EIO(clamp01((tt - (center - SLIDE_DUR / 2)) / SLIDE_DUR));

const WALK_T0 = 23.0;
const WALK_T1 = 26.9;

const rabbitXAt = (tt: number): number => {
  let x = 346; // S1
  x = lerp(x, 366, slideP(tt, 9.43)); // T12
  x = lerp(x, 740, slideP(tt, 18.33)); // T23 — under the oak on the right
  x = lerp(x, 640, slideP(tt, 27.59)); // T34
  x = lerp(x, 700, slideP(tt, 32.4)); // T45 — beside turtle at the finish
  return x;
};

const turtleXAt = (tt: number): number => {
  let x = 734; // S1
  x = lerp(x, 714, slideP(tt, 9.43)); // T12
  x = lerp(x, 640, slideP(tt, 18.33)); // T23
  // steady slow walk left through i5 — LINEAR pace (bền bỉ đi đều)
  const walkP = clamp01((tt - WALK_T0) / (WALK_T1 - WALK_T0));
  x = lerp(x, 260, walkP);
  x = lerp(x, 430, slideP(tt, 32.4)); // T45 — finish center, under banner
  return x;
};

// ================= confetti (deterministic arithmetic hash — no random) =================
const CONF_N = 36;
const CONF_START = 33.1;
const CONF_FALL = 6.5; // 33.1 -> 39.6
const CONF_COLORS = ["#e8503a", "#e8724a", "#f2b53c", "#ffb3c0", "#ffffff"];

export const KidsStoryMultiScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // ================= camera + staging =================
  const cam = cameraAt(t);
  const rabbitX = rabbitXAt(t);
  const turtleX = turtleXAt(t);

  // ================= bg crossfade opacities =================
  const fade = (a: number, b: number, from: number, to: number) =>
    interpolate(t, [a, b], [from, to], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const bgOps = [
    fade(9.18, 9.68, 1, 0),
    fade(9.18, 9.68, 0, 1) * fade(18.08, 18.58, 1, 0),
    fade(18.08, 18.58, 0, 1) * fade(27.34, 27.84, 1, 0),
    fade(27.34, 27.84, 0, 1) * fade(32.15, 32.65, 1, 0),
    fade(32.15, 32.65, 0, 1),
  ];

  // ================= speech state =================
  const line = activeLine(t);
  const speaker: "rabbit" | "turtle" | null = line ? line.who : null;

  // cue props: ONLY the speaker lip-syncs, on that line's cues + start offset
  const rCues =
    speaker === "rabbit" && line
      ? { mouthCues: LINE_CUES[line.i], start: line.start }
      : null;
  const tCues =
    speaker === "turtle" && line
      ? { mouthCues: LINE_CUES[line.i], start: line.start }
      : null;
  const rabbitLines = LINES.filter((l) => l.who === "rabbit");
  const turtleLines = LINES.filter((l) => l.who === "turtle");

  // pupil look direction generalized to dynamic positions: look toward the
  // other character wherever it currently stands
  const lookDir = Math.sign(turtleX - rabbitX); // +1 turtle right of rabbit
  const rLookX = speaker === "rabbit" ? 0 : 5 * lookDir; // listening / idle
  const tLookX = speaker === "turtle" ? -2 * lookDir : -5 * lookDir;

  // acting-mode labels for the rigs (advisory; envelopes blend continuously)
  const rabbitPose: Pose =
    t >= RABBIT_SCHEDULE.clapIn[0]
      ? "clap"
      : t >= RABBIT_SCHEDULE.jerkIn[0]
      ? "startle"
      : t >= RABBIT_SCHEDULE.sleepIn[0]
      ? "sleep"
      : "idle";
  const turtlePose: Pose =
    t >= TURTLE_SCHEDULE.proud.in[0]
      ? "proud"
      : t >= WALK_T0 && t < WALK_T1
      ? "walk"
      : "idle";

  // asleep 0..1 drives the zZz scene element (formula lives in the rabbit rig)
  const asleep = rabbitAsleepAt(t, RABBIT_SCHEDULE.sleepIn, RABBIT_SCHEDULE.sleepOut);

  // ================= title (outside camera layer) =================
  const titleP = interpolate(frame, [0, 18], [0, 1], {
    easing: EASE_OUT_BACK,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = -60 * (1 - titleP);
  const titleOp =
    interpolate(frame, [0, 8], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(frame, [60, 75], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // ================= zZz (world coords, anchored to CURRENT rabbit x) =================
  const zzzs = [
    { dx: 62, y: 478, s: 26 },
    { dx: 88, y: 443, s: 34 },
    { dx: 116, y: 406, s: 44 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#bfe6f5" }}>
      {/* ============ CAMERA CONTAINER — bg stack + world SVG move together ============ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${cam.s}) translate(${cam.tx}px, ${cam.ty}px)`,
          transformOrigin: "50% 50%",
        }}
      >
        {/* bg stack: 5 full-bleed images, opacity per crossfade windows */}
        {SCENE_BGS.map((bg, i) => (
          <Img
            key={bg}
            src={staticFile(bg)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: bgOps[i],
            }}
          />
        ))}

        {/* ============ world SVG (viewBox 1080x1080): turtle, rabbit, zZz, confetti ============ */}
        <svg
          viewBox="0 0 1080 1080"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          {/* ==================== TURTLE (facing left, dynamic x) ==================== */}
          {/* v3.3 one-path rig: <GoldenTurtle> computes the t* animation state
              (peek/nod/waddle/proud/book fall + grip) and renders the figure. */}
          <g transform={`translate(${turtleX.toFixed(1)} 856) scale(${TURTLE_S}) translate(-540 -856)`}>
            <GoldenTurtle
              frame={frame}
              fps={fps}
              pose={turtlePose}
              cues={tCues}
              speakLines={turtleLines}
              listenLines={rabbitLines}
              lookX={tLookX}
              schedule={TURTLE_SCHEDULE}
              clipSuffix="main"
            />
          </g>


          {/* ==================== RABBIT (facing right, dynamic x) ==================== */}
          <g transform={`translate(${rabbitX.toFixed(1)} 856) scale(${RABBIT_S}) translate(-540 -856)`}>
            <KawaiiRabbit
              frame={frame}
              fps={fps}
              pose={rabbitPose}
              cues={rCues}
              speakLines={rabbitLines}
              listenLines={turtleLines}
              lookX={rLookX}
              schedule={RABBIT_SCHEDULE}
            />
          </g>

          {/* ==================== zZz above sleeping rabbit (world coords, follows rabbitX) ==================== */}
          {asleep > 0.02
            ? zzzs.map((z, idx) => {
                const ph = t * 0.6 + idx * 0.9;
                const wave = (Math.sin(Math.PI * 2 * ph) + 1) / 2; // 0..1
                return (
                  <text
                    key={`zzz-${idx}`}
                    x={rabbitX + z.dx}
                    y={z.y - 8 * wave}
                    fontFamily={TITLE_FONT}
                    fontSize={z.s}
                    fontWeight={800}
                    fill={OUT}
                    stroke="#ffffff"
                    strokeWidth={6}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    opacity={asleep * (0.35 + 0.55 * wave)}
                  >
                    z
                  </text>
                );
              })
            : null}

          {/* ==================== confetti (S5 celebration, deterministic hash) ==================== */}
          {Array.from({ length: CONF_N }, (_, k) => {
            const start = CONF_START + (k * 0.13) % 1.2;
            const local = t - start;
            if (local < 0) return null;
            const fallP = local / CONF_FALL;
            if (fallP >= 1) return null; // landed off-screen
            const x0 = (k * 97) % 1080;
            const size = 8 + (k % 7);
            const x = x0 + 16 * Math.sin(Math.PI * 2 * 0.35 * local + k);
            const y = lerp(-30, 1110, fallP);
            const rot = (k * 31 + 240 * local * (0.6 + 0.15 * (k % 5))) % 360;
            const op = clamp01(local / 0.4); // fade-in 0.4s
            const fill = CONF_COLORS[k % CONF_COLORS.length];
            return (
              <g
                key={`cf-${k}`}
                transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`}
                opacity={op}
              >
                {k % 2 === 0 ? (
                  <rect x={-size / 2} y={-size / 2} width={size} height={size * 0.62} rx={1.5} fill={fill} />
                ) : (
                  <circle r={size / 2} fill={fill} />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* title card — centered both axes, outside camera layer; fade out by 2.5s */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
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
            fontSize: 96,
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
      <Audio src={staticFile("character-performer/kids/dialogue/bgm_dialogue.wav")} volume={0.42} />
    </AbsoluteFill>
  );
};
