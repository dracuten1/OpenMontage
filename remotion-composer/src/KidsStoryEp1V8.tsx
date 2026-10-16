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
  EIO,
  EOC,
  envAt,
  lerp,
  MouthCue,
  Pose,
} from "./rigs/types";

// ---------------------------------------------------------------------------
// KidsStoryEp1V8 — "Rùa và Thỏ" STORY-FIRST rebuild: 8 dialogue beats, each
// line = one stage intention. Same foundation as V6 (dialogue_v2 audio + cues,
// KawaiiRabbit / GoldenTurtle v4 side-view rigs, lip-sync by cues, confetti,
// zZz, BGM) with staging + camera REWRITTEN as a beat state machine:
//
//   beatState(t): per-character (cx, gy, scale, dir) + camera params, keyed to
//   the 8 line starts. Non-cut boundaries lerp 0.6s easeInOutCubic; the three
//   story CUTS (B4a→B4b oak @20.4s, B6a→B6b @31.9s, B7a→B7b @36.2s) switch
//   instantly — re-staging happens only where the outgoing framing hides it.
//
//   B0 greet wide push-in · B1 intro hold (turtle 35% / rabbit 70%) · B2
//   challenge lean-in 2-shot · B3 accept (turtle emphasized) · B4a start-line
//   dash with speed-lines + ghosts / B4b CUT oak nap zZz · B5 road crawl with
//   V6 depth ramp + warm time-passing tint (≤0.25) + pan · B6a CUT wake
//   close-up (s≈1.9) / B6b CUT wide late-realization · B7a CUT turtle-alone
//   finish (s1.45, banner) / B7b CUT celebration wide + confetti + lesson
//   title "Kiên trì là thắng" (39.0→40.6s, bottom 90px, never over cast).
//
// Pure function of frame: no Math.random / Date / CSS animation.
//
// Cue offset math: d{i}_cues.json t=0 is the START of that line's wav. Lookup
// time = t - line.start.
// ---------------------------------------------------------------------------

type Line = { i: number; who: "rabbit" | "turtle"; text: string; start: number; dur: number };

const LINES = (timelineJson as any).lines as Line[];
const LINE_CUES: MouthCue[][] = [d0c, d1c, d2c, d3c, d4c, d5c, d6c, d7c].map(
  (c) => (c as any).mouthCues as MouthCue[]
);

const OUT = "#3a2e2a"; // warm dark brown (zZz / lesson title fill)

const activeLine = (t: number): Line | null =>
  LINES.find((l) => t >= l.start - 0.05 && t < l.start + l.dur + 0.05) ?? null;

// ================= deterministic schedules passed into the rigs =================
const RABBIT_SCHEDULE: RabbitSchedule = {
  blinks: [1.4, 5.8, 10.3, 15.2, 25.4, 27.0, 33.5, 36.2, 38.6], // skipped during run/startle
  hops: [
    { s: 0.35, h: 34 }, // B0 spring-in greet hops (entry 0.3→0.8)
    { s: 0.85, h: 34 },
    { s: 6.4, h: 26 }, // B1 idle bounce while listening to i1
    { s: 11.2, h: 32 }, // B2 confident hop mid-challenge
    // B4a THE DASH: bounces every ~0.35s until the oak CUT
    { s: 19.0, h: 30 },
    { s: 19.35, h: 30 },
    { s: 19.7, h: 30 },
    { s: 20.05, h: 30 },
  ],
  sleepIn: [21.5, 22.0], // at the oak, end of i4 (V6)
  sleepOut: [30.01, 30.15], // B6a wake startled (V6)
  wakePopIn: [30.01, 30.33],
  wakePopOut: [30.26, 31.11],
  jerkIn: [30.01, 30.19], // tai dựng startle (V6)
  jerkOut: [30.23, 30.86],
  clapIn: [36.7, 36.9], // B7b clap — right after the late arrival
  clapOut: [39.8, 40.0],
};

// turtle crawl windows (drive schedule.walk per-frame): B0 entry, B4 start
// line, B5 road crawl, B6b finish approach, B7a crossing burst
const WALKS = [
  { t0: 0.4, t1: 3.9 },
  { t0: 18.5, t1: 20.4 },
  { t0: 20.5, t1: 22.9 },
  { t0: 23.3, t1: 29.3 },
  { t0: 32.0, t1: 34.5 },
  { t0: 34.56, t1: 35.11 },
];

const TURTLE_SCHED_BASE: Omit<TurtleSchedule, "walk"> = {
  blinks: [1.6, 5.6, 9.6, 13.6, 17.6, 21.6, 25.6, 29.6, 33.6, 37.2], // ~4s cycle
  proud: { in: [35.1, 35.7], out: [39.6, 40.2], bounceStart: 35.7 }, // after the B7a crossing
  book: {
    fall: [35.2, 35.48], // easeInQuad fall held -> ground at the finish
    settleEnd: 35.65,
    heldX: 470, // v4 book home (rig-local)
    heldBodyY: 816,
    groundY: 842,
    landX: 405,
    landRot: -10,
  },
};

// ---- staging (1080x1080): ground y=856 (turtle toes local y859) ----
const TS = 0.88; // turtle scale (flat beats)
const RABBIT_S0 = 0.78; // rabbit base scale

const TITLE_FONT =
  "'Baloo 2','Arial Rounded MT Bold','Comic Sans MS',system-ui,sans-serif";
const LESSON_TEXT = "Kiên trì là thắng";

// ================= backgrounds (NEW gen 2026-10-11, style-locked) =================
const SCENE_BGS = [
  "kids_ep1v8/bg1_meadow.png",
  "kids_ep1v8/bg2_start.png",
  "kids_ep1v8/bg3_oak.png",
  "kids_ep1v8/bg4_road.png",
  "kids_ep1v8/bg5_sunset.png",
  "kids_ep1v8/bg6_finish.png",
];

// beat → bg: B0-B3 k_base(0) · B4a sc2_race(1) · B4b CUT sc3_tree(2) · B5
// sc4_path(3) · B6a sc3_tree(2) · B6b CUT sc6_finish(5) · B7 sc6_finish(5).
// Non-cut boundaries crossfade 0.5s; cut boundaries swap instantly.
type BgEvent = { t: number; from: number; to: number; cut: boolean };
const BG_EVENTS: BgEvent[] = [
  { t: 18.26, from: 0, to: 1, cut: false },
  { t: 20.4, from: 1, to: 2, cut: true },
  { t: 23.27, from: 2, to: 3, cut: false },
  { t: 30.01, from: 3, to: 2, cut: false },
  { t: 31.9, from: 2, to: 5, cut: true },
];
const BG_XF = 0.25; // half crossfade window (0.5s total)

const bgIndexAt = (tt: number): number => {
  let cur = 0;
  for (const e of BG_EVENTS) if (tt >= e.t) cur = e.to;
  return cur;
};

const bgOpsAt = (tt: number): number[] => {
  const ops = [0, 0, 0, 0, 0, 0];
  ops[bgIndexAt(tt)] = 1;
  for (const e of BG_EVENTS) {
    if (e.cut || tt < e.t - BG_XF || tt >= e.t + BG_XF) continue;
    const k = EIO(clamp01((tt - (e.t - BG_XF)) / (2 * BG_XF)));
    ops[e.from] = 1 - k;
    ops[e.to] = k;
  }
  return ops;
};

// ================= camera: one shot per beat, cut-aware crossfade =================
// Non-cut boundaries blend end→start params over ±0.3s (easeInOutCubic), same
// helper contract as V6 cameraAt; cutIn boundaries switch instantly.
type Shot = {
  t0: number; t1: number;
  s0: number; s1: number;
  tx0: number; tx1: number;
  ty0: number; ty1: number;
  ax?: number; ay?: number;
  cutIn?: boolean;
};
const SHOTS: Shot[] = [
  { t0: 0.0, t1: 4.09, s0: 1.0, s1: 1.03, tx0: 0, tx1: 0, ty0: 0, ty1: 0 }, // B0 wide greet, push-in
  { t0: 4.09, t1: 9.92, s0: 1.03, s1: 1.03, tx0: 0, tx1: 0, ty0: 0, ty1: 0 }, // B1 hold, intro chatter
  { t0: 9.92, t1: 14.01, s0: 1.08, s1: 1.08, tx0: 0, tx1: 0, ty0: 0, ty1: 0, ax: 525, ay: 810 }, // B2 2-shot, anchor mid pair
  { t0: 14.01, t1: 18.26, s0: 1.1, s1: 1.1, tx0: 0, tx1: 0, ty0: 0, ty1: 0, ax: 385, ay: 810 }, // B3 turtle emphasized (accepts)
  { t0: 18.26, t1: 20.4, s0: 1.04, s1: 1.08, tx0: 0, tx1: 60, ty0: 0, ty1: 0 }, // B4a start line, tracks the dash
  { t0: 20.4, t1: 23.27, s0: 1.55, s1: 1.58, tx0: 0, tx1: 0, ty0: 0, ty1: 0, ax: 890, ay: 770, cutIn: true }, // B4b CUT oak nap
  { t0: 23.27, t1: 30.01, s0: 1.03, s1: 1.05, tx0: 0, tx1: 60, ty0: 0, ty1: 0 }, // B5 road, pan-left chasing the turtle
  { t0: 30.01, t1: 31.9, s0: 1.8, s1: 1.92, tx0: 0, tx1: 0, ty0: 0, ty1: 0, ax: 880, ay: 840, cutIn: true }, // B6a CUT wake close-up
  { t0: 31.9, t1: 34.56, s0: 1.04, s1: 1.09, tx0: 0, tx1: 0, ty0: 0, ty1: 0, cutIn: true }, // B6b CUT wide, late realization
  { t0: 34.56, t1: 36.2, s0: 1.45, s1: 1.42, tx0: 0, tx1: 0, ty0: 0, ty1: 0, ax: 500, ay: 805, cutIn: true }, // B7a CUT turtle alone at the banner
  { t0: 36.2, t1: 40.67, s0: 1.18, s1: 1.0, tx0: 0, tx1: 0, ty0: 0, ty1: 4, cutIn: true }, // B7b CUT celebration wide, settle out
];

const camOf = (i: number, tt: number) => {
  const c = SHOTS[i];
  const p = clamp01((tt - c.t0) / (c.t1 - c.t0));
  return {
    s: lerp(c.s0, c.s1, p),
    tx: lerp(c.tx0, c.tx1, p),
    ty: lerp(c.ty0, c.ty1, p),
    ax: c.ax ?? 540,
    ay: c.ay ?? 540,
  };
};

const CAM_BLEND = 0.3; // half of the 0.6s beat transition
const cameraAt = (tt: number) => {
  for (let i = 1; i < SHOTS.length; i++) {
    if (SHOTS[i].cutIn) continue;
    const c = SHOTS[i].t0;
    if (tt >= c - CAM_BLEND && tt < c + CAM_BLEND) {
      const b = EIO(clamp01((tt - (c - CAM_BLEND)) / (2 * CAM_BLEND)));
      const A = camOf(i - 1, tt); // clamps to its end state
      const B = camOf(i, tt); // clamps to its start state
      return {
        s: lerp(A.s, B.s, b),
        tx: lerp(A.tx, B.tx, b),
        ty: lerp(A.ty, B.ty, b),
        ax: lerp(A.ax, B.ax, b),
        ay: lerp(A.ay, B.ay, b),
      };
    }
  }
  for (let i = 0; i < SHOTS.length; i++) {
    if (tt >= SHOTS[i].t0 && tt < SHOTS[i].t1) return camOf(i, tt);
  }
  return camOf(SHOTS.length - 1, tt);
};

// bg parallax factor: bg moves/scales LESS than the world layer (V6)
const BG_PAR = 0.6;

// ================= beat staging (pure functions of t) =================
// beatP: 0.6s easeInOutCubic transition centered on a beat boundary
const beatP = (tt: number, c: number) =>
  EIO(clamp01((tt - (c - 0.3)) / 0.6));

const DASH_T0 = 19.0; // B4a dash window
const DASH_T1 = 20.3;

// turtle cx per beat. Invisible re-stages only where the outgoing shot hides
// them: 22.97 (still inside the oak close-up, both old & new x off-frame) →
// road right edge; 31.9 is a CUT into the finish wide.
const turtleXAt = (tt: number): number => {
  if (tt < 4.09) return lerp(-60, 360, clamp01((tt - 0.2) / 1.6)); // B0 crawl in FAST, settled by 1.8s
  if (tt < 9.92) return lerp(300, 380, beatP(tt, 4.09)); // B1 dialogue post (35%)
  if (tt < 14.01) return lerp(380, 415, beatP(tt, 9.92)); // B2 backs off a half step
  if (tt < 18.26) return lerp(415, 395, beatP(tt, 14.01)); // B3 settles confident
  if (tt < 20.4)
    return lerp(
      lerp(395, 430, beatP(tt, 18.26)), // B4a step up to the start line
      460,
      clamp01((tt - 19.2) / 1.2)
    );
  if (tt < 22.97) return lerp(460, 490, clamp01((tt - 20.5) / 2.4)); // B4b creep (off-frame)
  if (tt < 23.3) return 900; // re-staged at road right edge (hidden)
  if (tt < 30.01) return lerp(900, 360, clamp01((tt - 23.3) / 6.0)); // B5 road crawl R→L (clear of the nap corner)
  if (tt < 31.9) return 380; // B6a (off-frame in the oak close-up)
  if (tt < 34.56) return lerp(620, 575, clamp01((tt - 32.0) / 2.5)); // B6b near the finish
  return lerp(575, 540, clamp01((tt - 34.56) / 0.55)); // B7a crosses under the banner
};

// turtle facing: −1 mirrored (faces RIGHT) through the meadow/start-line
// beats; flips to +1 native (faces LEFT) at the hidden 22.97 re-stage for the
// B5 right→left crawl (V6 precedent: flip only while off-screen)
const turtleDirAt = (tt: number): number => (tt < 22.97 ? -1 : 1);

// turtle depth: FLAT 0.88/856 except B5, where the turtle walks the sc4 road
// perspective (V6 depth ramp — scale+gy are pure functions of x, no mid-scene
// scale jumps). Applied from the 22.97 re-stage so it is already correct when
// the crossfade reveals the road.
const B5_X_NEAR = 900;
const B5_X_FAR = 380;
const B5_TS_NEAR = 0.80;
const B5_TS_FAR = 0.40;
const B5_GY_NEAR = 892;
const B5_GY_FAR = 688;
const turtleDepthAt = (tt: number, x: number): { ts: number; gy: number } => {
  if (tt >= 22.97 && tt < 30.01) {
    const p = Math.pow(clamp01((B5_X_NEAR - x) / (B5_X_NEAR - B5_X_FAR)), 0.6); // ease toward FAR fast — mid-ground reads immediately
    return { ts: lerp(B5_TS_NEAR, B5_TS_FAR, p), gy: lerp(B5_GY_NEAR, B5_GY_FAR, p) };
  }
  return { ts: TS, gy: 856 };
};

// rabbit cx per beat. Cuts re-stage instantly (20.4 oak, 31.9 finish wide);
// the 34.56→ B7a shot hides the stunned retreat to the right edge.
const rabbitXAt = (tt: number): number => {
  if (tt < 4.09) return lerp(1150, 720, EOC(clamp01((tt - 0.3) / 0.5))); // B0 spring-in 0.5s
  if (tt < 9.92) return lerp(720, 730, beatP(tt, 4.09)); // B1 dialogue post (70%)
  if (tt < 14.01) return lerp(730, 695, beatP(tt, 9.92)); // B2 lean-in half step
  if (tt < 18.26) return lerp(695, 730, beatP(tt, 14.01)); // B3 steps back
  if (tt < DASH_T0) return lerp(730, 680, beatP(tt, 18.26)); // B4a toes the line
  if (tt < 20.4) {
    const p = clamp01((tt - DASH_T0) / (DASH_T1 - DASH_T0));
    return lerp(-130, 740, 1 - Math.pow(1 - p, 2.2)); // ease-out dash L→R
  }
  if (tt < 31.9) return 1010; // B4b oak nap / B6a close-up (CUT re-stage at 20.4)
  if (tt < 34.0) {
    const p = clamp01((tt - 31.95) / 1.35);
    return lerp(1150, 900, 1 - Math.pow(1 - p, 2.2)); // B6b dashes in R→L, skid-stops
  }
  if (tt < 34.56) return lerp(900, 1120, beatP(tt, 34.28)); // stunned retreat (hidden by the B7a CUT)
  const p = clamp01((tt - 36.2) / 0.7);
  return lerp(1120, 820, 1 - Math.pow(1 - p, 2.2)); // B7b late arrival
};

// rabbit scale/ground: flat 0.78/856 except the B5 foreground corner nap
// (small, bottom-right — turtle stays the subject and is drawn ON TOP)
const rabbitSAt = (tt: number): number =>
  tt >= 23.27 && tt < 30.01 ? lerp(0.78, 0.45, beatP(tt, 23.27)) : 0.78;
const rabbitGyAt = (tt: number): number =>
  tt >= 23.27 && tt < 30.01 ? lerp(856, 980, beatP(tt, 23.27)) : 856;

// B3 head-lift: turtle lifts confident at the accept line (14.01), holds
// through the beat, eases down into the start-line transition
const turtleLiftAt = (tt: number): number =>
  -8 * envAt(tt, 14.01, 14.31, 17.4, 18.0);

// B5 warm time-passing tint (#ff9d3c, flat full-frame, ≤0.25, cut off at 31.9)
const warmOpAt = (tt: number): number => {
  if (tt < 23.27 || tt >= 31.9) return 0;
  if (tt < 29.5) return 0.25 * clamp01((tt - 23.27) / 6.23);
  return 0.25;
};

// ================= confetti (deterministic arithmetic hash — no random, V6) =================
const CONF_N = 36;
const CONF_START = 35.0;
const CONF_FALL = 6.5; // 35.0 -> 41.5 (comp ends 40.67)
const CONF_COLORS = ["#e8503a", "#e8724a", "#f2b53c", "#ffb3c0", "#ffffff"];

// ================= zZz (world coords, follows the CURRENT rabbit pose, V6) =================
// B5: rabbit naps at the RIGHT edge — z's shift LEFT so the camera pan keeps them in-frame
const ZZZS_B5 = [
  { dx: -70, dy: -30, s: 26 },
  { dx: -44, dy: -65, s: 34 },
  { dx: -16, dy: -102, s: 44 },
];
const ZZZS = [
  { dx: 62, dy: -30, s: 26 },
  { dx: 88, dy: -65, s: 34 },
  { dx: 116, dy: -102, s: 44 },
];

export const KidsStoryEp1V8: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // ================= beat state =================
  const cam = cameraAt(t);
  const bgOps = bgOpsAt(t);
  const turtleX = turtleXAt(t);
  const tDir = turtleDirAt(t);
  const { ts: turtleTS, gy: turtleGy0 } = turtleDepthAt(t, turtleX);
  const turtleGy = turtleGy0 + turtleLiftAt(t); // B3 head-lift rides the ground
  const rabbitX = rabbitXAt(t);
  const rabbitS = rabbitSAt(t);
  const rabbitGy = rabbitGyAt(t);

  // ================= speech state =================
  const line = activeLine(t);
  const speaker: "rabbit" | "turtle" | null = line ? line.who : null;

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

  // pupils look toward the other character (turtle local lookX pre-flipped by
  // dir — world = dir * local). While SPEAKING to camera-ish framing the
  // speaker's look centers (V6 contract).
  const lookDir = Math.sign(turtleX - rabbitX) || 1;
  const rLookX = speaker === "rabbit" ? 0 : 5 * lookDir;
  const tLookX = tDir * (speaker === "turtle" ? -2 : -5) * lookDir;

  // acting-mode labels (advisory; envelopes blend continuously)
  const rabbitPose: Pose =
    t >= RABBIT_SCHEDULE.clapIn[0]
      ? "clap"
      : t >= RABBIT_SCHEDULE.jerkIn[0] && t < RABBIT_SCHEDULE.wakePopOut[1]
      ? "startle"
      : t >= RABBIT_SCHEDULE.sleepIn[0] && t < RABBIT_SCHEDULE.sleepOut[1]
      ? "sleep"
      : (t >= DASH_T0 && t < 20.4) || (t >= 31.95 && t < 33.3) || (t >= 36.2 && t < 36.9)
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

  const asleep = rabbitAsleepAt(
    t,
    RABBIT_SCHEDULE.sleepIn,
    RABBIT_SCHEDULE.sleepOut
  );

  // B4a dash dressing: afterimage ghosts (V6 pattern) + speed lines + dust
  const ghostsOn = t >= DASH_T0 && t < 20.35;
  const dashDressing = (t >= 19.05 && t < 20.35) || (t >= 31.95 && t < 33.35);

  // ================= lesson title (39.0→40.6, fades 0.3s both ends) =================
  const lessonOp =
    interpolate(t, [39.0, 39.3], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(t, [40.3, 40.6], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // ================= zZz anchor (head-top world y, scale-following, V6) =================
  const zzzK = rabbitS / RABBIT_S0;
  const zzzHeadTop = rabbitGy - 446 * rabbitS;
  const zzzSet = t >= 23.27 && t < 30.01 ? ZZZS_B5 : ZZZS;

  const warmOp = warmOpAt(t);

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
          transform: `translate(${cam.tx.toFixed(2)}px, ${cam.ty.toFixed(2)}px) scale(${cam.s.toFixed(4)})`,
          transformOrigin: `${cam.ax.toFixed(0)}px ${cam.ay.toFixed(0)}px`,
        }}
      >
        <svg
          viewBox="0 0 1080 1080"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          {/* ==================== B4a speed lines + dust (behind the runner) ==================== */}
          {dashDressing ? (
            <g>
              {/* B4a runs L→R (lines trail on the LEFT); B6b runs R→L (trail RIGHT) */}
              {t >= 31.95 ? (
                <>
                  {/* R→L sprint: lines sweep ABOVE-RIGHT of the runner, kept in-frame */}
                  {[0, 1, 2].map((k) => {
                    const lx = Math.min(rabbitX + 95 + k * 60, 1040);
                    const ly = 856 - 190 - k * 42;
                    const len = 70 + k * 35;
                    return (
                      <line
                        key={`slr-${k}`}
                        x1={lx}
                        y1={ly}
                        x2={lx - len}
                        y2={ly}
                        stroke="#3a2e2a"
                        strokeWidth={7 - k}
                        strokeLinecap="round"
                        opacity={0.42 - k * 0.1}
                      />
                    );
                  })}
                  <circle cx={rabbitX + 80} cy={852} r={13} fill="#e8dcc0" opacity={0.35} />
                  <circle cx={rabbitX + 55} cy={858} r={9} fill="#e8dcc0" opacity={0.28} />
                </>
              ) : (
                <>
                  {[0, 1, 2].map((k) => {
                    const lx = rabbitX - 130 - k * 75;
                    const ly = 856 - 130 - k * 34;
                    const len = 90 + k * 45;
                    return (
                      <line
                        key={`sl-${k}`}
                        x1={lx}
                        y1={ly}
                        x2={lx + len}
                        y2={ly}
                        stroke="#ffffff"
                        strokeWidth={7 - k}
                        strokeLinecap="round"
                        opacity={0.4 - k * 0.1}
                      />
                    );
                  })}
                  <circle cx={rabbitX - 95} cy={848} r={13} fill="#e8dcc0" opacity={0.35} />
                  <circle cx={rabbitX - 135} cy={856} r={9} fill="#e8dcc0" opacity={0.28} />
                </>
              )}
            </g>
          ) : null}

          {/* ==================== RABBIT (front-view kawaii; B2 lean-in tilt) ==================== */}
          <g
            transform={`translate(${rabbitX.toFixed(1)} ${rabbitGy.toFixed(
              1
            )}) rotate(${t >= 9.92 && t < 14.01 ? -4 : 0}) scale(${rabbitS.toFixed(
              3
            )}) translate(-540 -856)`}
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

          {/* ==================== TURTLE (v4 side-view rig; on top — never covered by the rabbit when the turtle is the subject) ==================== */}
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
              clipSuffix="ep1v8"
            />
          </g>

          {/* ==================== B4a dash afterimage ghosts (behind the runner, V6 pattern) ==================== */}
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

          {/* ==================== zZz above sleeping rabbit (V6) ==================== */}
          {asleep > 0.02
            ? zzzSet.map((z, idx) => {
                const ph = t * 0.6 + idx * 0.9;
                const wave = (Math.sin(Math.PI * 2 * ph) + 1) / 2;
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

          {/* ==================== confetti (B7 celebration, deterministic hash, V6) ==================== */}
          {Array.from({ length: CONF_N }, (_, k) => {
            const start = CONF_START + (k * 0.13) % 1.2;
            const local = t - start;
            if (local < 0) return null;
            const fallP = local / CONF_FALL;
            if (fallP >= 1) return null;
            const x0 = (k * 97) % 1080;
            const size = 8 + (k % 7);
            const x = x0 + 16 * Math.sin(Math.PI * 2 * 0.35 * local + k);
            const y = lerp(-30, 1110, fallP);
            const rot = (k * 31 + 240 * local * (0.6 + 0.15 * (k % 5))) % 360;
            const op = clamp01(local / 0.4);
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

      {/* ============ B5 warm time-passing tint (above world, ≤0.25) ============ */}
      {warmOp > 0.003 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#ff9d3c",
            opacity: warmOp,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {/* ============ lesson title — screen space (outside camera), bottom 90px, never over the cast ============ */}
      {lessonOp > 0.003 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: 90,
            opacity: lessonOp,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "relative",
              fontFamily: TITLE_FONT,
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              color: "transparent",
              WebkitTextStroke: "8px #ffffff",
              paintOrder: "stroke fill",
            }}
          >
            {LESSON_TEXT}
            <div
              style={{
                position: "absolute",
                inset: 0,
                color: OUT,
                textShadow: "0 3px 8px rgba(58,46,42,0.25)",
              }}
            >
              {LESSON_TEXT}
            </div>
          </div>
        </div>
      ) : null}

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
