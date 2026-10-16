import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import d5c from "../public/character-performer/kids/dialogue_v2/d5_cues.json";

// ---------------------------------------------------------------------------
// KidsStoryEp1RemakeDemo — REMAKE Ep.01, hard-scene d5 demo (cinematic):
// turtle walks far -> near, stops to look at the sleeping rabbit, talks,
// then passes OVER the rabbit + tree base (occlusion). 3 shots:
//   A 0.00-2.45 establishing wide | B 2.45-5.90 medium tracking (+glance beat
//   4.0-4.6, path speed x0.35) | C 5.90-6.90 close approach, then STOP
//   6.90-8.00 (pose swap to side + landing squash + bob) and EXIT 8.00-8.90
//   (accelerate, passes over rabbit/tree, head past right edge OK) |
//   CUT 8.90 -> D 8.90-9.50 hold: turtle hidden, empty road, rabbit breathes.
// 1080x1080 @30fps, 285 frames (9.5s). Cut camera (no crossfade), per-layer
// parallax (BG k=1.0 / tree+rabbit+zZz k=1.10 / turtle k=1.18 / FG k=1.38).
// Pure function of frame: no Math.random / Date / CSS animation.
// Geometry: content bottom-center pin — left = x - imgW*cx, top = y - imgH*b,
// imgH = H/chf, imgW = imgH*(w/h). Regs below are FRACTIONS (px entries from
// the task already divided by canvas h).
// ---------------------------------------------------------------------------

const FPS = 30;
const A = 1080;
const FONT =
  "'Baloo 2','Arial Rounded MT Bold','Comic Sans MS',system-ui,sans-serif";
const KP = "character-performer/kids";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
// clamped interpolate — input ranges must be strictly increasing
const ip = (v: number, rng: number[], out: number[]) =>
  interpolate(v, rng, out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
// linear polyline keyframes: p in [0,1] across equal-duration segments
const polyLin = (ks: number[], p: number): number => {
  const n = ks.length - 1;
  const u = clamp01(p) * n;
  const i = Math.min(n - 1, Math.floor(u));
  return lerp(ks[i], ks[i + 1], u - i);
};
const easeInQuad = (x: number) => x * x;
const easeOutQuad = (x: number) => 1 - (1 - x) * (1 - x);
const easeInOutQuad = (x: number) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

// ---- mouth cues (rhubarb, d5; cue time = t - 1.6) --------------------------
type Cue = { start: number; end: number; value: string };
const CUES = (d5c as { mouthCues: Cue[] }).mouthCues;
// open tier per rhubarb value: A widest, B/C/G/H mid (C = half-open, NOT
// closed), D/E/F narrow, X closed
const TIER: Record<string, number> = {
  A: 1.0,
  B: 0.66,
  C: 0.66,
  G: 0.66,
  H: 0.66,
  D: 0.4,
  E: 0.4,
  F: 0.4,
  X: 0.0,
};
// mouth open amount 0..1 at local wav time `lt`: blend from the previous
// cue's tier to the current cue's tier over its first 70ms (easeOutCubic);
// outside the wav / no cue found -> closed
const openAmt = (cues: Cue[], lt: number): number => {
  const i = cues.findIndex((c) => lt >= c.start && lt < c.end);
  if (i === -1) return 0;
  const target = TIER[cues[i].value] ?? 0;
  const prev = i > 0 ? TIER[cues[i - 1].value] ?? 0 : 0;
  return lerp(prev, target, easeOutCubic(clamp01((lt - cues[i].start) / 0.07)));
};

// ---- sprite registration (fraction form; px entries converted) --------------
type Reg = {
  w: number;
  h: number;
  t: number;
  b: number;
  cx: number;
  chf: number;
  cwf: number;
};
const REG: Record<string, Reg> = {
  // canvas 1223x1286 px: t=0, b=1278
  tree: {
    w: 1223,
    h: 1286,
    t: 0,
    b: 1278 / 1286,
    cx: 0.49959,
    chf: 0.99378,
    cwf: 0.99918,
  },
  rabbit_sleeping: {
    w: 1302,
    h: 918,
    t: 0.0087,
    b: 0.9902,
    cx: 0.4996,
    chf: 0.9815,
    cwf: 0.9869,
  },
  // canvas 1535x1024 px: t=100, b=923
  turtle_walk: {
    w: 1535,
    h: 1024,
    t: 100 / 1024,
    b: 923 / 1024,
    cx: 0.50554,
    chf: 0.80371,
    cwf: 0.95114,
  },
  // same family canvas 1535x1024 px: t=98, b=945
  turtle_walk2: {
    w: 1535,
    h: 1024,
    t: 98 / 1024,
    b: 945 / 1024,
    cx: 0.50195,
    chf: 0.82715,
    cwf: 0.96221,
  },
  // canvas 1534x1025 px: t=99, b=925 (patch source, not rendered)
  turtle_walk_mO: {
    w: 1534,
    h: 1025,
    t: 99 / 1025,
    b: 925 / 1025,
    cx: 0.50587,
    chf: 0.80585,
    cwf: 0.95306,
  },
  turtle_side_m0: {
    w: 1535,
    h: 1024,
    t: 0.0938,
    b: 0.9072,
    cx: 0.5101,
    chf: 0.8135,
    cwf: 0.9564,
  },
  turtle_side_mO: {
    w: 1535,
    h: 1024,
    t: 0.0938,
    b: 0.9082,
    cx: 0.5101,
    chf: 0.8145,
    cwf: 0.9598,
  },
};
const FILES: Record<string, string> = {
  tree: "remake/tree_clean.png",
  rabbit_sleeping: "sprite_lib/rabbit/rabbit_sleeping.png",
  turtle_walk: "depth_demo/turtle_walk.png",
  turtle_walk2: "remake/turtle_walk2.png",
  turtle_side_m0: "depth_demo/turtle_side_m0.png",
};
const P = (k: string) => staticFile(`${KP}/${FILES[k]}`);

// mouth patches (mouth_reg.json): rect fractions on the mO canvas, mapped
// through the mO reg pinned at the same (x,y,H) anchor as the body.
type MouthDef = {
  file: string;
  src: string; // mO reg key (geometry reference)
  body: string; // body reg the patch is registered against
  x0f: number;
  y0f: number;
  x1f: number;
  y1f: number;
};
const MOUTHS: Record<"walk" | "side", MouthDef> = {
  walk: {
    file: `${KP}/ep1_v2/mouths/turtle_walk_mouthO.png`,
    src: "turtle_walk_mO",
    body: "turtle_walk",
    x0f: 0.79,
    y0f: 0.46,
    x1f: 0.93,
    y1f: 0.62,
  },
  side: {
    file: `${KP}/ep1_v2/mouths/turtle_side_mouthO.png`,
    src: "turtle_side_mO",
    body: "turtle_side_m0",
    x0f: 0.9199,
    y0f: 0.4795,
    x1f: 0.9805,
    y1f: 0.5674,
  },
};

// ---- static sprite (content bottom-center pin; no hooks) --------------------
const Static: React.FC<{
  k: string;
  x: number;
  y: number;
  H: number;
  scaleX?: number;
  scaleY?: number;
  shadowOpacity?: number; // omit -> no shadow
}> = ({ k, x, y, H, scaleX = 1, scaleY = 1, shadowOpacity }) => {
  const g = REG[k];
  const imgH = H / g.chf;
  const imgW = imgH * (g.w / g.h);
  const sw = imgW * g.cwf * 0.72;
  return (
    <div
      style={{
        position: "absolute",
        left: x - imgW * g.cx,
        top: y - imgH * g.b,
        width: imgW,
        height: imgH,
        transform: `scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`,
        transformOrigin: `${(g.cx * 100).toFixed(2)}% ${(g.b * 100).toFixed(2)}%`,
      }}
    >
      {shadowOpacity !== undefined && (
        <div
          style={{
            position: "absolute",
            left: (imgW - sw) / 2,
            top: imgH * g.b - sw * 0.09,
            width: sw,
            height: sw * 0.18,
            background: `rgba(30,25,20,${shadowOpacity.toFixed(3)})`,
            borderRadius: "50%",
            filter: "blur(8px)",
          }}
        />
      )}
      <Img
        src={P(k)}
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
};

// ---- zZz (3 glyphs, cycle 2.5s, rise -80px, size 26->46, sin opacity) -------
const Zzz: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const p = ((t / 2.5 + i / 3) % 1 + 1) % 1;
        const wave = Math.sin(Math.PI * p);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 715 - 6 * i,
              top: 540 - 30 - 42 * i - 80 * p,
              fontSize: 26 + 10 * i,
              fontFamily: FONT,
              fontWeight: 800,
              color: "#5B7C99",
              opacity: 0.12 + 0.72 * wave,
              textShadow: "0 2px 6px rgba(255,255,255,0.4)",
            }}
          >
            {i === 0 ? "z" : "Zz"}
          </div>
        );
      })}
    </>
  );
};

// ---- turtle path state machine ---------------------------------------------
type Pose = { x: number; y: number; H: number };
const AX = [478, 484, 490];
const AY = [468, 530, 568];
const AH = [58, 84, 110];
const BX = [505, 455, 400, 372, 365];
const BY = [585, 650, 730, 800, 845];
const BH = [125, 180, 250, 300, 330];
const SX = [330, 360];
const SY = [830, 850];
const SH = [350, 365];
const EX = [360, 560, 980];
const EY = [850, 900, 990];
const EH = [365, 430, 540];
// glance beat 4.0->4.6 (tau 1.55->2.15 in shot B): path speed x0.35 there.
// Normalized arc length S(tau); total = 3.45 - 0.6*0.65 = 3.06.
const turtlePose = (t: number): Pose => {
  if (t < 2.45) {
    const u = easeInOutQuad(clamp01(t / 2.45));
    return { x: polyLin(AX, u), y: polyLin(AY, u), H: polyLin(AH, u) };
  }
  if (t < 5.9) {
    const tau = t - 2.45;
    const s = tau < 1.55 ? tau : tau < 2.15 ? 1.55 + 0.35 * (tau - 1.55) : tau - 0.39;
    const u = easeInOutCubic(clamp01(s / 3.06));
    return { x: polyLin(BX, u), y: polyLin(BY, u), H: polyLin(BH, u) };
  }
  if (t < 6.9) {
    const u = easeOutQuad(clamp01((t - 5.9) / 1.0));
    return { x: polyLin(SX, u), y: polyLin(SY, u), H: polyLin(SH, u) };
  }
  if (t < 8.0) return { x: 360, y: 850, H: 365 };
  const u = easeInQuad(clamp01((t - 8.0) / 0.9));
  return { x: polyLin(EX, u), y: polyLin(EY, u), H: polyLin(EH, u) };
};

// ---- camera (cut + punch + track; NO crossfade) -----------------------------
type Cam = { camZ: number; TX: number; TY: number };
const camera = (t: number, pose: Pose): Cam => {
  if (t < 2.45)
    return { camZ: 1 + 0.045 * easeInOutQuad(clamp01(t / 2.45)), TX: 0, TY: 0 };
  if (t < 5.9)
    return {
      camZ: 1.3 - 0.08 * easeOutQuad(clamp01((t - 2.45) / 3.45)),
      TX: -(pose.x - 430) * 0.45,
      TY: -(pose.y - 700) * 0.25,
    };
  if (t < 8.9) {
    const camZ = 1.12 - 0.07 * easeOutQuad(clamp01((t - 5.9) / 2.1));
    const u = clamp01((t - 5.9) / 3.6);
    return { camZ, TX: lerp(18, 0, u), TY: lerp(0, 8, u) };
  }
  // CUT 8.90 -> Shot D hold: turtle hidden, empty road left of tree
  return { camZ: ip(t, [8.9, 9.5], [1.05, 1.02]), TX: 0, TY: 0 };
};

// ---- parallax wrapper (per-layer k over TX/TY/camZ-1, origin center) --------
const Par: React.FC<{
  k: number;
  cam: Cam;
  children: React.ReactNode;
}> = ({ k, cam, children }) => (
  <AbsoluteFill
    style={{
      transform: `translate(${(cam.TX * k).toFixed(2)}px, ${(cam.TY * k).toFixed(2)}px) scale(${(1 + (cam.camZ - 1) * k).toFixed(4)})`,
      transformOrigin: "50% 50%",
    }}
  >
    {children}
  </AbsoluteFill>
);

// ---- turtle: walk hard-swap + waddle + glance + stop pose + mouth patch -----
const Turtle: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t >= 8.9) return null; // CUT 8.90 -> Shot D hold: turtle is gone
  const pose = turtlePose(t);
  const stopped = t >= 6.9 && t < 8.0;
  const bodyK = stopped
    ? "turtle_side_m0"
    : Math.floor(frame / 8) % 2 === 0
      ? "turtle_walk"
      : "turtle_walk2";
  const g = REG[bodyK];
  const { x, y, H } = pose;
  const imgH = H / g.chf;
  const imgW = imgH * (g.w / g.h);

  // waddle only while stepping; glance beat adds -6deg easeInOut
  const waddle = stopped ? 0 : 3 * Math.sin((t * Math.PI * 2) / 1.15);
  const glance =
    t >= 4.0 && t < 4.6 ? -6 * Math.sin(Math.PI * clamp01((t - 4.0) / 0.6)) : 0;
  // landing squash hides the 6.9 pose swap; bob fades out before exit walk
  const squash = stopped
    ? 0.95 + 0.05 * easeOutCubic(clamp01((t - 6.9) / 0.12))
    : 1;
  const bob = stopped
    ? -4 * Math.sin((2 * Math.PI * (t - 6.9)) / 1.6) * ip(t, [7.55, 7.95], [1, 0])
    : 0;

  // mouth patch: registered against walk frame1 while walking (fixed offset —
  // body strides beneath), side pair while stopped. Body stays full opacity.
  const m = stopped ? MOUTHS.side : MOUTHS.walk;
  const gm = REG[m.src];
  const refG = REG[m.body];
  const imgHr = H / refG.chf;
  const imgWr = imgHr * (refG.w / refG.h);
  const imgHm = H / gm.chf;
  const imgWm = imgHm * (gm.w / gm.h);
  const mLeft = imgWr * refG.cx - imgWm * gm.cx + m.x0f * imgWm;
  const mTop = imgHr * refG.b - imgHm * gm.b + m.y0f * imgHm;
  const mW = (m.x1f - m.x0f) * imgWm;
  const mH = (m.y1f - m.y0f) * imgHm;
  const a = t >= 1.6 ? openAmt(CUES, t - 1.6) : 0;

  // contact shadow deepens with closeness (H 60 -> 620)
  const shOp = lerp(0.1, 0.25, clamp01((H - 60) / 560));
  const sw = imgW * g.cwf * 0.72;

  return (
    <div
      style={{
        position: "absolute",
        left: x - imgW * g.cx,
        top: y - imgH * g.b,
        width: imgW,
        height: imgH,
        transform: `translateY(${bob.toFixed(2)}px) rotate(${(waddle + glance).toFixed(3)}deg) scale(1, ${squash.toFixed(4)})`,
        transformOrigin: `${(g.cx * 100).toFixed(2)}% ${(g.b * 100).toFixed(2)}%`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: (imgW - sw) / 2,
          top: imgH * g.b - sw * 0.09,
          width: sw,
          height: sw * 0.18,
          background: `rgba(30,25,20,${shOp.toFixed(3)})`,
          borderRadius: "50%",
          filter: "blur(8px)",
        }}
      />
      <Img
        src={P(bodyK)}
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}
      />
      <Img
        src={staticFile(m.file)}
        style={{
          position: "absolute",
          left: mLeft,
          top: mTop,
          width: mW,
          height: mH,
          opacity: a,
          // side mouth patch reads better slightly larger while stopped
          transform: stopped ? "scale(1.12)" : undefined,
          transformOrigin: "center",
        }}
      />
    </div>
  );
};

// ---- FG grass strip (DOF foreground: blur + top gradient mask) --------------
const FgStrip: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      bottom: 0,
      width: A,
      height: 300,
      overflow: "hidden",
      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 55%)",
      maskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 55%)",
    }}
  >
    <Img
      src={staticFile(`${KP}/depth_demo/strip_fg.png`)}
      style={{
        position: "absolute",
        left: -270,
        top: -240,
        width: 1620,
        height: 540,
        filter: "blur(2px)",
      }}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const KidsStoryEp1RemakeDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camera(t, turtlePose(t));

  // sleeping rabbit: content center (830,715), H 175 -> bottom pin (830,802.5);
  // breathing +-0.8% scaleY, 3s period, origin bottom
  const br = Math.sin((t * Math.PI * 2) / 3);

  return (
    <AbsoluteFill style={{ backgroundColor: "#241c16", overflow: "hidden" }}>
      {/* BG back (k=1.0): 1536x1024 drawn 1620x1080 at left -270 */}
      <Par k={1.0} cam={cam}>
        <Img
          src={staticFile(`${KP}/remake/bg_d5_back.png`)}
          style={{ position: "absolute", left: -270, top: 0, width: 1620, height: A }}
        />
      </Par>

      {/* mid layer (k=1.10): tree + sleeping rabbit + zZz */}
      <Par k={1.1} cam={cam}>
        <Static k="tree" x={870} y={685} H={620} />
        <Static
          k="rabbit_sleeping"
          x={830}
          y={802.5}
          H={175}
          scaleX={1 - 0.004 * br}
          scaleY={1 + 0.008 * br}
          shadowOpacity={0.18}
        />
        <Zzz />
      </Par>

      {/* turtle (k=1.18) — passes OVER rabbit + tree base on exit */}
      <Par k={1.18} cam={cam}>
        <Turtle />
      </Par>

      {/* FG grass (k=1.38) */}
      <Par k={1.38} cam={cam}>
        <FgStrip />
      </Par>

      {/* audio: turtle line d5 from t=1.6 (frame 48) + BGM bed */}
      <Sequence from={48} durationInFrames={Math.round(6.14 * FPS) + 2}>
        <Audio src={staticFile(`${KP}/dialogue_v2/d5_turtle.wav`)} />
      </Sequence>
      <Audio src={staticFile(`${KP}/k_bgm_v2.wav`)} volume={0.3} loop />
    </AbsoluteFill>
  );
};
