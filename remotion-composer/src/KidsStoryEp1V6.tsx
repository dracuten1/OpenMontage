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
import timelineJson from "../public/character-performer/kids/dialogue_v2/timeline.json";
import d0c from "../public/character-performer/kids/dialogue_v2/d0_cues.json";
import d1c from "../public/character-performer/kids/dialogue_v2/d1_cues.json";
import d2c from "../public/character-performer/kids/dialogue_v2/d2_cues.json";
import d3c from "../public/character-performer/kids/dialogue_v2/d3_cues.json";
import d4c from "../public/character-performer/kids/dialogue_v2/d4_cues.json";
import d5c from "../public/character-performer/kids/dialogue_v2/d5_cues.json";
import d6c from "../public/character-performer/kids/dialogue_v2/d6_cues.json";
import d7c from "../public/character-performer/kids/dialogue_v2/d7_cues.json";
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

// ---------------------------------------------------------------------------
// KidsStoryEp1V6 — Ep.01 REMAKE: v4 SIDE-VIEW turtle rig + dialogue_v2 (8
// lines, 40.66s) + 6-scene staging on the kids backgrounds (k_base → sc2_race
// → sc3_tree → sc4_path → sc5_sunset → sc6_finish), 0.5s crossfades +
// continuous Ken Burns camera (crossfade-blended), dynamic staging (characters
// slide inside 0.75s transition windows; turtle CRAWLS: S1 left-edge entry
// facing right, S4 the main right→left road crawl facing left, T56 crawl burst
// under the finish banner), rabbit S3 dash-run + oak nap + corner nap + S5
// startled wake with long sunset shadows + S6 clap confetti. Pure function of
// frame: no Math.random / Date / CSS animation.
//
// Turtle wrapper is the v4 staging contract (TurtleStillV4): local anchor
// (572, 859) = rig center / toes; scale(dir*TS, TS) — dir −1 MIRRORS (turtle
// faces RIGHT), +1 native (faces LEFT). TS = 0.88 constant.
// Rabbit wrapper unchanged from KidsStoryMultiScene: translate(x gy)
// scale(S) translate(-540 -856); gy varies only for the S4/S5 foreground
// corner nap (1000→940) then back to 856.
//
// Cue offset math: d{i}_cues.json t=0 is the START of that line's wav, NOT the
// shared timeline. Lookup time = t - line.start.
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
const RABBIT_SCHEDULE: RabbitSchedule = {
  blinks: [1.4, 5.8, 10.3, 15.2, 25.4, 27.0, 33.5, 36.2, 38.6], // skipped during run/startle
  hops: [
    { s: 0.35, h: 34 }, // S1 greet hops (entry 0.2→1.4)
    { s: 0.85, h: 34 },
    { s: 2.7, h: 30 }, // idle hop while listening to i1
    { s: 10.6, h: 34 }, // S2 confident hop during i2
    // S3 THE RUN: hop-bounces every ~0.35s, h30
    { s: 19.0, h: 30 },
    { s: 19.35, h: 30 },
    { s: 19.7, h: 30 },
    { s: 20.05, h: 30 },
    { s: 20.4, h: 30 },
    { s: 20.75, h: 30 },
    { s: 21.1, h: 30 },
  ],
  sleepIn: [21.5, 22.0], // at the oak, end of i4
  sleepOut: [30.01, 30.15], // i6 start — wake startled
  wakePopIn: [30.01, 30.33],
  wakePopOut: [30.26, 31.11],
  jerkIn: [30.01, 30.19], // tai dựng startle
  jerkOut: [30.23, 30.86],
  clapIn: [36.7, 36.9], // S6 clap — after the late arrival in the wide
  clapOut: [39.8, 40.0],
};

// turtle crawl windows (drive schedule.walk per-frame; S1 entry, S4 road,
// T56 crawl burst under the finish banner)
const WALKS = [
  { t0: 4.3, t1: 8.4 },
  { t0: 23.4, t1: 29.3 },
  { t0: 33.89, t1: 34.64 },
];

const TURTLE_SCHED_BASE: Omit<TurtleSchedule, "walk"> = {
  blinks: [1.6, 5.6, 9.6, 13.6, 17.6, 21.6, 25.6, 29.6, 33.6, 37.2], // ~4s cycle
  proud: { in: [34.3, 34.9], out: [39.6, 40.2], bounceStart: 34.9 }, // i7 at the finish
  book: {
    fall: [34.5, 34.78], // easeInQuad fall held -> ground
    settleEnd: 34.95, // tiny ±3px settle bounce
    heldX: 470, // v4 book home (TurtleStillV4)
    heldBodyY: 816,
    groundY: 842, // landed spine y — page bottom ≈ local y860 ≈ ground
    landX: 405, // beside the front-near foot (rig foot x≈548)
    landRot: -10,
  },
};

// ---- staging (1080x1080): turtle ground y=856 (toes local y859), rabbit
// ground y=856 except the S4/S5 foreground corner (1000→940) ----
const TS = 0.88; // turtle scale, constant
const RABBIT_S0 = 0.78; // rabbit base scale

// rabbit entry (S1) + S3 run windows
const ENTRY_T0 = 0.2;
const ENTRY_T1 = 1.4;
const RUN_T0 = 18.7;
const RUN_T1 = 21.4;

const TITLE_TEXT = "Rùa và Thỏ 🐰🐢";
const TITLE_FONT =
  "'Baloo 2','Arial Rounded MT Bold','Comic Sans MS',system-ui,sans-serif";

// ================= scene map (6 scenes, boundaries = gap centers between cues) =================
// S1 meadow 0->9.62 · S2 start line ->17.97 · S3 oak ->22.97
// S4 winding road ->29.72 · S5 sunset ->34.26 · S6 finish ->40.66
const SCENE_BGS = [
  "character-performer/kids/k_base.png",
  "character-performer/kids/scenes/sc2_race.png",
  "character-performer/kids/scenes/sc3_tree.png",
  "character-performer/kids/scenes/sc4_path.png",
  "character-performer/kids/scenes/sc5_sunset.png",
  "character-performer/kids/scenes/sc6_finish.png",
];
// crossfade windows 0.5s centered at scene boundaries (gap centers)
const XFADES = [9.62, 17.97, 22.97, 29.72, 34.26];
const XF = 0.25; // half window

// V6 SHOT LIST: Ken Burns + real CUTS inside scenes (boundaries without an
// XFADES entry = hard cut). ax/ay = zoom anchor per shot (default center).
// Depth: characters/world get the FULL camera; the bg stack gets a dampened
// version (BG_PAR) -> differential drift = parallax separation.
type CamDef = { t0: number; t1: number; s0: number; s1: number; tx0: number; tx1: number; ty0: number; ty1: number; ax?: number; ay?: number };
const CAMS: CamDef[] = [
  { t0: 0.0, t1: 9.62, s0: 1.03, s1: 1.08, tx0: 0, tx1: 0, ty0: 0, ty1: -10 }, // S1 wide establish
  { t0: 9.62, t1: 17.97, s0: 1.08, s1: 1.03, tx0: 0, tx1: -10, ty0: 0, ty1: 0 }, // S2 start line
  { t0: 17.97, t1: 21.4, s0: 1.03, s1: 1.07, tx0: 0, tx1: 70, ty0: 0, ty1: -6 }, // S3a THE RUN — wide, tracks right
  { t0: 21.4, t1: 22.97, s0: 2.30, s1: 2.38, tx0: 0, tx1: 0, ty0: 0, ty1: 0, ax: 870, ay: 740 }, // S3b CUT close: rabbit beds at the oak
  { t0: 22.97, t1: 29.72, s0: 1.03, s1: 1.05, tx0: 0, tx1: 0, ty0: 0, ty1: 0 }, // S4 wide: turtle recedes (scale ramp does depth)
  { t0: 29.72, t1: 31.5, s0: 1.03, s1: 1.06, tx0: 0, tx1: -14, ty0: 0, ty1: -4 }, // S5a wide: nap fg + turtle far
  { t0: 31.5, t1: 32.6, s0: 2.15, s1: 2.08, tx0: 0, tx1: 0, ty0: 0, ty1: 0, ax: 880, ay: 840 }, // S5b CUT close: startled rabbit, sunset
  { t0: 32.6, t1: 34.26, s0: 1.06, s1: 1.26, tx0: 0, tx1: 0, ty0: 0, ty1: -8 }, // S5c CUT back wide -> accelerating push to the cut
  { t0: 34.26, t1: 36.2, s0: 1.5, s1: 1.44, tx0: 0, tx1: 0, ty0: 0, ty1: 0, ax: 500, ay: 805 }, // S6a punch-in: the crossing + book drop (turtle drawn on top)
  { t0: 36.2, t1: 40.66, s0: 1.20, s1: 1.02, tx0: 0, tx1: 0, ty0: 0, ty1: 4 }, // S6b CUT wide reveal: celebration
];

const camOf = (i: number, tt: number) => {
  const c = CAMS[i];
  const p = clamp01((tt - c.t0) / (c.t1 - c.t0));
  return {
    s: lerp(c.s0, c.s1, p),
    tx: lerp(c.tx0, c.tx1, p),
    ty: lerp(c.ty0, c.ty1, p),
    ax: c.ax ?? 540,
    ay: c.ay ?? 540,
  };
};

// bg parallax factor: bg moves/scales LESS than the world layer
const BG_PAR = 0.6;

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
        ax: lerp(A.ax, B.ax, b),
        ay: lerp(A.ay, B.ay, b),
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
// the 0.5s crossfade), hold still mid-scene. Turtle additionally CRAWLS with
// linear pace inside the WALKS windows (S1 entry, S4 road, T56 burst).
const SLIDE_DUR = 0.75;
const slideP = (tt: number, center: number) =>
  EIO(clamp01((tt - (center - SLIDE_DUR / 2)) / SLIDE_DUR));

const turtleXAt = (tt: number): number => {
  let x = -80; // pre-entry hold (nose tip just peeking at the left edge)
  x = lerp(x, 380, clamp01((tt - WALKS[0].t0) / (WALKS[0].t1 - WALKS[0].t0))); // S1 crawl in, facing right
  x = lerp(x, 360, slideP(tt, 9.62)); // T12 — face rabbit at 720
  x = lerp(x, 1250, slideP(tt, 17.97)); // T23 — crawl out right, off-screen
  x = lerp(x, 1150, slideP(tt, 23.0)); // re-stage to road edge under the X34 fade (no pop)
  x = lerp(x, 380, clamp01((tt - WALKS[1].t0) / (WALKS[1].t1 - WALKS[1].t0))); // S4 road crawl right→left
  x = lerp(x, 430, slideP(tt, 29.72)); // T45
  x = lerp(x, 540, slideP(tt, 34.26)); // T56 crawl burst — under the finish banner
  return x;
};

// turtle facing: −1 mirrored (faces RIGHT) through T23; flip to +1 native
// (faces LEFT) at t=20.0 while off-screen (x≈1250), ahead of the S4 crawl
const turtleDirAt = (tt: number): number => (tt < 20.0 ? -1 : 1);

// ---- V6 DEPTH: sc4 road vanishes toward (470, 470) — turtle walks the
// perspective: far end (x 380) -> small & high on the road; near end
// (x 1150) -> full size at the road lip. Scale + ground y are pure
// functions of x (screen-space depth mapping, deterministic).
const S4_TS_NEAR = 0.93; // near scale (slightly bigger than v4's flat 0.88)
const S4_TS_FAR = 0.48; // far scale — reads as "way down the road"
const S4_X_FAR = 380;
const S4_X_NEAR = 1150;
const S4_GY_NEAR = 892; // road lip, foreground
const S4_GY_FAR = 700; // up the road toward the vanishing area

// depth state for the turtle: scale + ground y at time tt.
// S4: walks the perspective (near->far). After the S4 window the depth state
// EASES BACK to identity over DEPTH_RETURN (no scale pop at the scene cut).
const DEPTH_RETURN = 0.9; // s
const turtleDepthAt = (tt: number, x: number): { ts: number; gy: number } => {
  const S4_T0 = 22.97;
  const S4_T1 = 29.72;
  if (tt >= S4_T0 && tt < S4_T1) {
    const p = clamp01((S4_X_NEAR - x) / (S4_X_NEAR - S4_X_FAR)); // 0 near -> 1 far
    return {
      ts: lerp(S4_TS_NEAR, S4_TS_FAR, p),
      gy: lerp(S4_GY_NEAR, S4_GY_FAR, p),
    };
  }
  if (tt >= S4_T1 && tt < S4_T1 + DEPTH_RETURN) {
    // freeze the far-end depth, then ease back to identity (turtle steps
    // forward off the road onto the sunset foreground)
    const p = EIO(clamp01((tt - S4_T1) / DEPTH_RETURN));
    return {
      ts: lerp(S4_TS_FAR, TS, p),
      gy: lerp(S4_GY_FAR, 856, p),
    };
  }
  return { ts: TS, gy: 856 };
};

const rabbitXAt = (tt: number): number => {
  let x = 1160;
  x = lerp(x, 700, clamp01((tt - ENTRY_T0) / (ENTRY_T1 - ENTRY_T0))); // S1 hop in from right
  x = lerp(x, 720, slideP(tt, 9.62)); // T12
  x = lerp(x, -150, slideP(tt, 17.97)); // T23 — dash off LEFT
  if (tt >= RUN_T0) {
    // V6: ease-out sprint — explodes off the line, then a cruise (speed reads
    // even when the bg is a still painting)
    const p = clamp01((tt - RUN_T0) / (RUN_T1 - RUN_T0));
    x = lerp(-130, 740, 1 - Math.pow(1 - p, 2.2));
  }
  x = lerp(x, 900, slideP(tt, 22.97)); // T34 — to the nap corner
  x = lerp(x, 880, slideP(tt, 29.72)); // T45
  // V6 STORY: the crossing is the turtle's moment ALONE. Rabbit hangs back
  // small at the right edge through the S6a punch-in, then sprints in late
  // (arrives with the wide reveal) — reads as "too late".
  x = lerp(x, 1120, slideP(tt, 34.26)); // T56a — off right edge, background
  x = lerp(x, 760, slideP(tt, 36.5)); // T56b — dashes in during the wide reveal
  return x;
};

const rabbitSAt = (tt: number): number => {
  let s = RABBIT_S0;
  s = lerp(s, 0.62, slideP(tt, 22.97)); // T34 — shrink into the foreground corner
  s = lerp(s, 0.72, slideP(tt, 29.72)); // T45
  s = lerp(s, 0.60, slideP(tt, 34.26)); // T56a — background-scale at the edge
  s = lerp(s, 0.78, slideP(tt, 36.5)); // T56b — back to full for the celebration
  return s;
};

const rabbitGyAt = (tt: number): number => {
  let gy = 856;
  gy = lerp(gy, 1000, slideP(tt, 22.97)); // T34 — foreground bottom-right (drawn after turtle)
  gy = lerp(gy, 940, slideP(tt, 29.72)); // T45
  gy = lerp(gy, 900, slideP(tt, 34.26)); // T56a — mid-ground at the edge
  gy = lerp(gy, 856, slideP(tt, 36.5)); // T56b — joins the finish line
  return gy;
};

// ================= confetti (deterministic arithmetic hash — no random) =================
const CONF_N = 36;
const CONF_START = 35.0;
const CONF_FALL = 6.5; // 35.0 -> 41.5 (comp ends 40.67)
const CONF_COLORS = ["#e8503a", "#e8724a", "#f2b53c", "#ffb3c0", "#ffffff"];

// ================= S5 long shadows (sunset) =================
// sc5_sunset.png: sun LOW-LEFT -> shadows stretch RIGHT (opposite the sun).
// ONE extra ellipse per character, drawn BEFORE the characters; rx ≈ 2.2× the
// character's base ground-shadow width; fades 0.4s at the window edges.
const LSH_WIN: [number, number] = [29.9, 34.2];
const LSH_FADE = 0.4;
const LSH_FILL = "#2e5d34";
const TURTLE_LSH_RX = 2.2 * 170 * TS; // rig ground-shadow rx 170 local -> ~330 world
const rabbitLshRx = (s: number) => 2.2 * 150 * s; // rig shadow rx 150 local, world-scaled

// ================= zZz (world coords, follows the CURRENT rabbit pose) =================
// Reference = old comp positions at S=0.78/gy=856, anchored to the head-top
// world y (gy - 446*S); rescaled by k = S/0.78 so the corner nap gets small z's.
const ZZZS = [
  { dx: 62, dy: -30, s: 26 },
  { dx: 88, dy: -65, s: 34 },
  { dx: 116, dy: -102, s: 44 },
];

export const KidsStoryEp1V6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // ================= camera + staging =================
  const cam = cameraAt(t);
  const turtleX = turtleXAt(t);
  const tDir = turtleDirAt(t);
  const { ts: turtleTS, gy: turtleGy } = turtleDepthAt(t, turtleX); // V6 depth
  const rabbitX = rabbitXAt(t);
  const rabbitS = rabbitSAt(t);
  const rabbitGy = rabbitGyAt(t);

  // ================= bg crossfade opacities =================
  const fade = (a: number, b: number, from: number, to: number) =>
    interpolate(t, [a, b], [from, to], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const bgOps = [
    fade(9.37, 9.87, 1, 0),
    fade(9.37, 9.87, 0, 1) * fade(17.72, 18.22, 1, 0),
    fade(17.72, 18.22, 0, 1) * fade(22.72, 23.22, 1, 0),
    fade(22.72, 23.22, 0, 1) * fade(29.47, 29.97, 1, 0),
    fade(29.47, 29.97, 0, 1) * fade(34.01, 34.51, 1, 0),
    fade(34.01, 34.51, 0, 1),
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
  // other character wherever it currently stands. The turtle group is MIRRORED
  // when dir=-1, so its local lookX is pre-flipped (world = dir * local).
  const lookDir = Math.sign(turtleX - rabbitX); // +1 turtle right of rabbit
  const rLookX = speaker === "rabbit" ? 0 : 5 * lookDir; // listening / idle
  const tLookX = tDir * (speaker === "turtle" ? -2 : -5) * lookDir;

  // acting-mode labels for the rigs (advisory; envelopes blend continuously)
  const rabbitPose: Pose =
    t >= RABBIT_SCHEDULE.clapIn[0]
      ? "clap"
      : t >= RABBIT_SCHEDULE.jerkIn[0] && t < RABBIT_SCHEDULE.wakePopOut[1]
      ? "startle"
      : t >= RABBIT_SCHEDULE.sleepIn[0] && t < RABBIT_SCHEDULE.sleepOut[1]
      ? "sleep"
      : t >= RUN_T0 && t < RUN_T1
      ? "walk"
      : "idle";
  const turtlePose: Pose =
    t >= TURTLE_SCHED_BASE.proud.in[0]
      ? "proud"
      : WALKS.some((w) => t >= w.t0 && t < w.t1)
      ? "walk"
      : "idle";

  // per-frame turtle schedule: walk = the window containing t (else planted)
  const walkWin =
    WALKS.find((w) => t >= w.t0 && t < w.t1) ?? { t0: -10, t1: -9 };
  const turtleSchedule: TurtleSchedule = { ...TURTLE_SCHED_BASE, walk: walkWin };

  // asleep 0..1 drives the zZz scene element (formula lives in the rabbit rig)
  const asleep = rabbitAsleepAt(t, RABBIT_SCHEDULE.sleepIn, RABBIT_SCHEDULE.sleepOut);

  // S3 run afterimage ghosts (deterministic; mouth closed — cues null)
  const ghostsOn = t >= RUN_T0 && t < 21.2;

  // ================= S5 long-shadow opacity =================
  const lshOp =
    interpolate(t, [LSH_WIN[0], LSH_WIN[0] + LSH_FADE], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(t, [LSH_WIN[1] - LSH_FADE, LSH_WIN[1]], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

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

  // ================= zZz anchor (head-top world y, scale-following) =================
  const zzzK = rabbitS / RABBIT_S0;
  const zzzHeadTop = rabbitGy - 446 * rabbitS;

  return (
    <AbsoluteFill style={{ backgroundColor: "#bfe6f5" }}>
      {/* ============ BG LAYER — dampened camera (parallax: bg lags the world) ============ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${(1 + (cam.s - 1) * BG_PAR).toFixed(4)}) translate(${(cam.tx * BG_PAR).toFixed(1)}px, ${(cam.ty * BG_PAR).toFixed(1)}px)`,
          transformOrigin: "50% 50%",
        }}
      >
        {/* bg stack: 6 full-bleed images, opacity per crossfade windows */}
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
      </div>

      {/* ============ WORLD LAYER — full camera, zoom anchored per shot ============ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})`,
          transformOrigin: `${cam.ax}px ${cam.ay}px`,
        }}
      >

        {/* ============ world SVG (viewBox 1080x1080): shadows, turtle, ghosts, rabbit, zZz, confetti ============ */}
        <svg
          viewBox="0 0 1080 1080"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          {/* ==================== S5 long shadows (BEFORE the characters) ==================== */}
          {lshOp > 0.005 ? (
            <g>
              {/* turtle: shadow stretches RIGHT away from the low-left sun */}
              <ellipse
                cx={turtleX + 0.45 * TURTLE_LSH_RX * (turtleTS / TS)}
                cy={turtleGy + 1}
                rx={TURTLE_LSH_RX * (turtleTS / TS)}
                ry={22}
                fill={LSH_FILL}
                opacity={0.2 * lshOp}
              />
              {/* rabbit: follows its current x / scale / ground */}
              <ellipse
                cx={rabbitX + 0.45 * rabbitLshRx(rabbitS)}
                cy={rabbitGy + 2}
                rx={rabbitLshRx(rabbitS)}
                ry={22}
                fill={LSH_FILL}
                opacity={0.2 * lshOp}
              />
            </g>
          ) : null}

          {/* ==================== RABBIT (front-view kawaii, NEVER flipped; dynamic x/scale/ground) ==================== */}
          <g
            transform={`translate(${rabbitX.toFixed(1)} ${rabbitGy.toFixed(
              1
            )}) scale(${rabbitS.toFixed(3)}) translate(-540 -856)`}
          >
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

          {/* ==================== TURTLE (v4 side-view rig, dynamic x + facing) ==================== */}
          {/* dir −1 mirrors (faces RIGHT), +1 native (faces LEFT); local anchor
              (572, 859) = rig center / toes -> world (x, 856). */}
          <g
            transform={`translate(${turtleX.toFixed(1)} ${turtleGy.toFixed(
              1
            )}) scale(${(tDir * turtleTS).toFixed(3)} ${turtleTS.toFixed(
              3
            )}) translate(-572 -859)`}
          >
            <GoldenTurtle
              frame={frame}
              fps={fps}
              pose={turtlePose}
              cues={tCues}
              speakLines={turtleLines}
              listenLines={rabbitLines}
              lookX={tLookX}
              schedule={turtleSchedule}
              clipSuffix="ep1v4"
            />
          </g>

          {/* ==================== S3 run afterimage ghosts (behind the runner) ==================== */}
          {ghostsOn ? (
            <>
              <g
                transform={`translate(${(rabbitX - 140).toFixed(1)} 856) scale(${RABBIT_S0}) translate(-540 -856)`}
                opacity={0.08}
              >
                <KawaiiRabbit
                  frame={frame}
                  fps={fps}
                  pose="walk"
                  cues={null}
                  speakLines={rabbitLines}
                  listenLines={turtleLines}
                  lookX={0}
                  schedule={RABBIT_SCHEDULE}
                  clipSuffix="gB"
                />
              </g>
              <g
                transform={`translate(${(rabbitX - 70).toFixed(1)} 856) scale(${RABBIT_S0}) translate(-540 -856)`}
                opacity={0.15}
              >
                <KawaiiRabbit
                  frame={frame}
                  fps={fps}
                  pose="walk"
                  cues={null}
                  speakLines={rabbitLines}
                  listenLines={turtleLines}
                  lookX={0}
                  schedule={RABBIT_SCHEDULE}
                  clipSuffix="gA"
                />
              </g>
            </>
          ) : null}

          {/* ==================== zZz above sleeping rabbit (world coords, follows rabbit) ==================== */}
          {asleep > 0.02
            ? ZZZS.map((z, idx) => {
                const ph = t * 0.6 + idx * 0.9;
                const wave = (Math.sin(Math.PI * 2 * ph) + 1) / 2; // 0..1
                return (
                  <text
                    key={`zzz-${idx}`}
                    x={rabbitX + z.dx * zzzK}
                    y={zzzHeadTop + z.dy * zzzK - 8 * wave}
                    fontFamily={TITLE_FONT}
                    fontSize={z.s * zzzK}
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

          {/* ==================== confetti (S6 celebration, deterministic hash) ==================== */}
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

      {/* title card — centered both axes, outside camera layer; fade out by f75 */}
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

      {/* 8 dialogue lines placed at their timeline `start` (dialogue_v2) */}
      {LINES.map((l) => (
        <Sequence key={l.i} from={Math.round(l.start * fps)}>
          <Audio src={staticFile(`character-performer/kids/dialogue_v2/d${l.i}_${l.who}.wav`)} />
        </Sequence>
      ))}
      {/* BGM: bgm_dialogue.wav is 45.0s >= 40.66s total — one pass, no loop */}
      <Audio src={staticFile("character-performer/kids/dialogue/bgm_dialogue.wav")} volume={0.42} />
    </AbsoluteFill>
  );
};
