import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import timelineJson from "../public/character-performer/kids/dialogue_v2/timeline.json";
import d0c from "../public/character-performer/kids/dialogue_v2/d0_cues.json";
import d1c from "../public/character-performer/kids/dialogue_v2/d1_cues.json";
import d2c from "../public/character-performer/kids/dialogue_v2/d2_cues.json";
import d3c from "../public/character-performer/kids/dialogue_v2/d3_cues.json";
import d5c from "../public/character-performer/kids/dialogue_v2/d5_cues.json";
import d7c from "../public/character-performer/kids/dialogue_v2/d7_cues.json";
import regJson from "../public/character-performer/kids/ep1_v2/sprite_reg.json";
import mouthJson from "../public/character-performer/kids/ep1_v2/mouth_reg.json";
import remakeRegJson from "../public/character-performer/kids/remake/reg.json";

// ---------------------------------------------------------------------------
// KidsStoryEp1Remake — REMAKE Ep.01 "Rùa và Thỏ", S0–S7 complete.
// 1080x1080 @30fps, 1230 frames (41.0s), 8-line dialogue_v2 audio + BGM
// k_bgm_v2 @0.3 loop. Pure function of frame: no Math.random / Date / state.
//
// Architecture:
//   * Merged REG: ep1_v2/sprite_reg.json (legacy shapes via normReg) +
//     remake/reg.json (t/b in PX -> fractions t/h, b/h; w/cx/chf/cwf given) +
//     mouth_reg.json patch rects (MOUTH).
//   * Global camera wrapper: translate(TX,TY) scale(camZ), origin per shot;
//     instant cuts (no camera crossfade) per the SHOTS table. Identity over
//     the demo-bg window 20.90–33.90, where the camera lives inside the
//     parallax stack (camStack: NAP+S5 one static shot, S6 wake/wide).
//   * Backgrounds: cover-fit 1620x1080 at left -270, 0.5s (15f) crossfades at
//     scene boundaries; static plates (no Ken Burns, no pan).
//   * Talking = V2 body-at-full-opacity + mouth patch, with the DEMO tiered
//     openAmt (A=1 / B,C,G,H=0.66 / D,E,F=0.4 / X=0, 70ms easeOutCubic) —
//     copied exactly from KidsStoryEp1RemakeDemo.tsx.
//   * Demo-bg window (S4 NAP + S5 + S6): parallax stack (bg 1.0 / tree+rabbit
//     +zZz 1.10 / turtle 1.18 / fg strip 1.38). S5 = KidsS5BackDemo walk
//     method (back-view 4-frame chain, full d5 window, no mouth).
// ---------------------------------------------------------------------------

const FPS = 30;
const A = 1080; // square frame
const FONT =
  "'Baloo 2','Arial Rounded MT Bold','Comic Sans MS',system-ui,sans-serif";
const KP = "character-performer/kids";
const BG = `${KP}/ep1_v2`;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
// clamped interpolate — input ranges must be strictly increasing
const ip = (v: number, rng: number[], out: number[]) =>
  interpolate(v, rng, out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const s2f = (s: number) => Math.round(s * FPS);
const easeInOutQuad = (x: number) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
// trapezoid speed profile: quadratic ramp over the first/last r of the span,
// linear middle. Peak speed = 1/(1-r) x the average (r=0.25 -> 1.33x) so the
// measured path peak/avg stays under the 1.6x pacing ceiling.
const trapz = (x: number, r = 0.25) => {
  const c = 1 / (1 - r);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (x < r) return (c * x * x) / (2 * r);
  if (x <= 1 - r) return c * (x - r / 2);
  return 1 - (c * (1 - x) * (1 - x)) / (2 * r);
};
// linear polyline keyframes: p in [0,1] across equal-duration segments
const polyLin = (ks: number[], p: number): number => {
  const n = ks.length - 1;
  const u = clamp01(p) * n;
  const i = Math.min(n - 1, Math.floor(u));
  return lerp(ks[i], ks[i + 1], u - i);
};
// opacity envelope: fade in over 0.35s after tIn, fade out before tOut
const env = (t: number, tIn: number, tOut: number, f = 0.35) =>
  ip(t, [tIn, tIn + f], [0, 1]) * ip(t, [tOut - f, tOut], [1, 0]);
// instant-in window (camera-cut swaps): 1 from tIn, fade out over f before tOut
const until = (t: number, tIn: number, tOut: number, f = 0.2) =>
  t < tIn ? 0 : ip(t, [tOut - f, tOut], [1, 0]);

// ---- dialogue timeline + cues ----------------------------------------------
type Line = {
  i: number;
  who: "rabbit" | "turtle";
  text: string;
  start: number;
  dur: number;
};
const LINES = (timelineJson as { lines: Line[] }).lines;
type Cue = { start: number; end: number; value: string };
const mc = (j: unknown) => (j as { mouthCues: Cue[] }).mouthCues;
const CUES: Record<number, Cue[]> = {
  0: mc(d0c),
  1: mc(d1c),
  2: mc(d2c),
  3: mc(d3c),
  5: mc(d5c),
  7: mc(d7c),
};

// open tier per rhubarb value (copied from KidsStoryEp1RemakeDemo.tsx):
// A widest, B/C/G/H mid, D/E/F narrow, X closed. Mouth amount blends from
// the previous cue's tier to the current cue's tier over its first 70ms
// (easeOutCubic); outside the wav / no cue found -> closed.
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
const openAmt = (cues: Cue[], lt: number): number => {
  const i = cues.findIndex((c) => lt >= c.start && lt < c.end);
  if (i === -1) return 0;
  const target = TIER[cues[i].value] ?? 0;
  const prev = i > 0 ? TIER[cues[i - 1].value] ?? 0 : 0;
  return lerp(prev, target, easeOutCubic(clamp01((lt - cues[i].start) / 0.07)));
};

// ---- sprite registration (merged ep1_v2 sprite_reg + remake reg) ------------
type Reg = {
  w: number;
  h: number;
  t: number;
  b: number;
  cx: number;
  chf: number;
  cwf: number;
};
// sprite_reg.json legacy shapes: {t,b,chf,cwf} and stride {top,bot,contentH,x0,x1}
type RawReg = Partial<Reg> & {
  w: number;
  h: number;
  cx: number;
  top?: number;
  bot?: number;
  contentH?: number;
  x0?: number;
  x1?: number;
};
const normReg = (r: RawReg): Reg => ({
  w: r.w,
  h: r.h,
  t: r.t ?? r.top ?? 0,
  b: r.b ?? r.bot ?? 1,
  cx: r.cx,
  chf: r.chf ?? r.contentH ?? 1,
  cwf: r.cwf ?? (r.x1! - r.x0!) / r.w,
});
// remake/reg.json: t/b in PX on a w x h canvas -> fractions t/h, b/h
type RawRemakeReg = {
  w: number;
  h: number;
  t: number;
  b: number;
  cx: number;
  chf: number;
  cwf: number;
};
const normRemake = (r: RawRemakeReg): Reg => ({
  w: r.w,
  h: r.h,
  t: r.t / r.h,
  b: r.b / r.h,
  cx: r.cx,
  chf: r.chf,
  cwf: r.cwf,
});
const REG: Record<string, Reg> = Object.fromEntries([
  ...Object.entries(regJson as Record<string, RawReg>).map(
    ([k, r]): [string, Reg] => [k, normReg(r)],
  ),
  ...Object.entries(remakeRegJson as Record<string, RawRemakeReg>).map(
    ([k, r]): [string, Reg] => [k, normRemake(r)],
  ),
]);
const FILES: Record<string, string> = {
  rabbit_greet_mO: "ep1_ai/rabbit_greet_mO.png",
  rabbit_taunt: "ep1_ai/rabbit_taunt.png",
  rabbit_front_m0: "sprite_lib/rabbit/rabbit_front_m0.png",
  rabbit_back_m0: "sprite_lib/rabbit/rabbit_back_m0.png",
  rabbit_back_run2: "sprite_lib/rabbit/rabbit_back_run2.png",
  rabbit_back_run3: "sprite_lib/rabbit/rabbit_back_run3.png",
  rabbit_back_run4: "sprite_lib/rabbit/rabbit_back_run4.png",
  rabbit_front_run_m0: "sprite_lib/rabbit/rabbit_front_run_m0.png",
  rabbit_front_run2: "sprite_lib/rabbit/rabbit_front_run2.png",
  rabbit_front_run3: "sprite_lib/rabbit/rabbit_front_run3.png",
  rabbit_front_run4: "sprite_lib/rabbit/rabbit_front_run4.png",
  rabbit_wake: "sprite_lib/rabbit/rabbit_wake_v2.png",
  rabbit_sleeping: "sprite_lib/rabbit/rabbit_sleeping_v2.png",
  turtle_m0: "depth_demo/turtle_m0.png",
  turtle_side_m0: "depth_demo/turtle_side_m0.png",
  turtle_front_m0: "sprite_lib/turtle/turtle_front_m0.png",
  turtle_back_m0: "sprite_lib/turtle/turtle_back_m0.png",
  turtle_back_w1: "sprite_lib/turtle/turtle_back_w1.png",
  turtle_back_walk2: "sprite_lib/turtle/turtle_back_walk2.png",
  turtle_back_w3: "sprite_lib/turtle/turtle_back_w3.png",
  turtle_proud: "ep1_ai/turtle_proud.png",
  tree_clean: "remake/tree_clean.png",
  turtle_walk: "depth_demo/turtle_walk.png",
  turtle_walk2: "remake/turtle_walk2.png",
};
const P = (k: string) => staticFile(`${KP}/${FILES[k]}`);

// content bottom-center (x,y) anchor; H = content height in px
type SpriteProps = {
  k: string;
  x: number;
  y: number;
  H: number;
  opacity?: number;
  scaleMul?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number; // degrees
  ty?: number; // extra translateY px (hops/bobs)
  shadow?: boolean;
};
const Sprite: React.FC<SpriteProps> = ({
  k,
  x,
  y,
  H,
  opacity = 1,
  scaleMul = 1,
  scaleX = 1,
  scaleY = 1,
  rotate = 0,
  ty = 0,
  shadow = true,
}) => {
  const g = REG[k];
  const imgH = H / g.chf;
  const imgW = imgH * (g.w / g.h);
  const left = x - imgW * g.cx;
  const top = y - imgH * g.b;
  const sw = imgW * g.cwf * 0.72; // shadow width ~0.72x content width
  const sx = scaleX * scaleMul;
  const sy = scaleY * scaleMul;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: imgW,
        height: imgH,
        opacity,
        transform: `translateY(${ty}px) rotate(${rotate}deg) scale(${sx}, ${sy})`,
        transformOrigin: `${(g.cx * 100).toFixed(2)}% ${(g.b * 100).toFixed(2)}%`,
      }}
    >
      {shadow && (
        <div
          style={{
            position: "absolute",
            left: (imgW - sw) / 2,
            top: imgH * g.b - sw * 0.09,
            width: sw,
            height: sw * 0.18,
            background: "rgba(30,25,20,0.28)",
            borderRadius: "50%",
            filter: "blur(8px)",
          }}
        />
      )}
      <Img
        src={P(k)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

// idle sprite with +-1% squash-stretch breathing (period 1.7s)
const Idle: React.FC<SpriteProps & { amp?: number }> = ({
  amp = 1,
  ...rest
}) => {
  const frame = useCurrentFrame();
  const s = Math.sin(((frame / FPS) * Math.PI * 2) / 1.7);
  return (
    <Sprite
      {...rest}
      scaleX={(rest.scaleX ?? 1) * (1 - 0.006 * amp * s)}
      scaleY={(rest.scaleY ?? 1) * (1 + 0.01 * amp * s)}
    />
  );
};

// hard N-pose stride cycle: swaps ks[i] every `every` frames from f0 — no
// crossfade — carrying the usual Sprite transform. Pure function of frame.
const Chain: React.FC<
  Omit<SpriteProps, "k"> & { ks: string[]; every: number; f0: number }
> = ({ ks, every, f0, ...rest }) => {
  const frame = useCurrentFrame();
  const i = Math.floor((frame - f0) / every);
  return <Sprite k={i < 0 ? ks[0] : ks[i % ks.length]} {...rest} />;
};

// talking: body = closed sprite at FULL opacity always; an open-mouth patch
// fades on top, clipped to the mouth rect. Patch rect comes from
// ep1_v2/mouth_reg.json (fractions of the mO sprite image) and is mapped
// through the mO sprite's own reg entry so it lands on the same geometry the
// body uses. One wrapper div carries the common transform (ty + rotate +
// scale incl. scaleX=-1 mirroring) with the same transformOrigin as Sprite.
type MouthReg = {
  file: string; // relative to character-performer/kids/
  x0f: number;
  y0f: number;
  x1f: number;
  y1f: number;
};
const MOUTH = mouthJson as unknown as Record<string, MouthReg>;

type TalkProps = {
  closed: string;
  mouthName: string; // key into mouth_reg.json; mO reg entry = `${mouthName}_mO`
  x: number;
  y: number;
  H: number;
  cues: Cue[];
  t0: number;
  t1: number;
  opacity?: number;
  scaleMul?: number;
  scaleX?: number;
  rotate?: number;
  ty?: number;
};
const Talking: React.FC<TalkProps> = ({
  closed,
  mouthName,
  x,
  y,
  H,
  cues,
  t0,
  t1,
  opacity = 1,
  scaleMul = 1,
  scaleX = 1,
  rotate = 0,
  ty = 0,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const a = t >= t0 && t < t1 ? openAmt(cues, t - t0) : 0;
  const g = REG[closed];
  const imgH = H / g.chf;
  const imgW = imgH * (g.w / g.h);
  // patch geometry from the MATCHED mO2 entry when it exists
  // (turtle_front / rabbit_front); legacy mO for rabbit_taunt / turtle_proud.
  // The mO image is pinned at the SAME x,y,H anchor via its own reg entry,
  // so patch and body share one anchor pin.
  const gm = REG[`${mouthName}_mO2`] ?? REG[`${mouthName}_mO`];
  const imgHm = H / gm.chf;
  const imgWm = imgHm * (gm.w / gm.h);
  const m = MOUTH[mouthName];
  // mouth image top-left relative to the body wrapper = anchor-pin delta
  const mLeft = imgW * g.cx - imgWm * gm.cx;
  const mTop = imgH * g.b - imgHm * gm.b;
  const sw = imgW * g.cwf * 0.72; // shadow width ~0.72x content width
  return (
    <div
      style={{
        position: "absolute",
        left: x - imgW * g.cx,
        top: y - imgH * g.b,
        width: imgW,
        height: imgH,
        opacity,
        transform: `translateY(${ty}px) rotate(${rotate}deg) scale(${scaleX * scaleMul}, ${scaleMul})`,
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
          background: "rgba(30,25,20,0.28)",
          borderRadius: "50%",
          filter: "blur(8px)",
        }}
      />
      <Img
        src={P(closed)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <Img
        src={staticFile(`${KP}/${m.file}`)}
        style={{
          position: "absolute",
          left: mLeft + m.x0f * imgWm,
          top: mTop + m.y0f * imgHm,
          width: (m.x1f - m.x0f) * imgWm,
          height: (m.y1f - m.y0f) * imgHm,
          opacity: a,
        }}
      />
    </div>
  );
};

// ---- zZz bubbles (3, opacity pulse period 2s) -------------------------------
const ZB = [
  { txt: "z", s: 28, dx: 52, dy: -46 },
  { txt: "Zz", s: 40, dx: 88, dy: -100 },
  { txt: "Zz", s: 54, dx: 132, dy: -166 },
];
const Zzz: React.FC<{
  x: number;
  y: number;
  t0: number;
  master: number;
  pulse?: boolean;
}> = ({ x, y, t0, master, pulse = true }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <>
      {ZB.map((b, i) => {
        const wave = pulse
          ? 0.5 + 0.5 * Math.sin(((t - t0) / 2) * Math.PI * 2 - i * 1.1)
          : 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + b.dx,
              top: y + b.dy - 8 * wave,
              fontSize: b.s,
              fontFamily: FONT,
              fontWeight: 800,
              color: "#5B7C99",
              opacity: master * (0.22 + 0.62 * wave),
              textShadow: "0 2px 6px rgba(255,255,255,0.4)",
            }}
          >
            {b.txt}
          </div>
        );
      })}
    </>
  );
};

// ---- backgrounds (cover + 0.5s crossfades + hard CUTs) ----------------------
// 1536x1024 -> cover 1080x1080: draw at 1620x1080, centered (left -270).
// Static plates (no Ken Burns, no pan) — reframing happens only at camera cuts.
// S4 START reuses bg1_start (the bg3 -> bg1 crossfade completes by 17.4);
// SPRINT 18.90, NAP 20.90 and the bg8 finish 33.90 are hard CUTs (cutIn/
// cutOut step the opacity instead of crossfading). The demo-bg window
// 20.90–33.90 is owned by the S4-NAP/S5/S6 parallax stack below (its own
// bg_d5_back at k=1.0), so it is absent from this table.
type BgSeg = {
  src: string;
  t0: number;
  t1: number;
  s0: number;
  s1: number;
  dx0: number;
  dx1: number;
  cutIn?: boolean;
  cutOut?: boolean;
};
const BG_SEG: BgSeg[] = [
  { src: `${BG}/bg1_start.png`, t0: 0, t1: 3.9, s0: 1.0, s1: 1.0, dx0: 0, dx1: 0 },
  { src: `${BG}/bg3_duel.png`, t0: 3.9, t1: 17.15, s0: 1.0, s1: 1.0, dx0: 0, dx1: 0 },
  { src: `${BG}/bg1_start.png`, t0: 17.15, t1: 18.9, s0: 1.0, s1: 1.0, dx0: 0, dx1: 0, cutOut: true },
  { src: `${BG}/bg6_walk_v2.png`, t0: 18.9, t1: 20.9, s0: 1.0, s1: 1.0, dx0: 0, dx1: 0, cutIn: true, cutOut: true }, // v2: gate đỏ+vọc đã xóa bằng surgical i2i (USER VETO v5 @20s — cổng giả-đích trước mặt thỏ; diff ngoài zone 0.0000, path SPX/SPY giữ nguyên)
  { src: `${BG}/bg8_finish.png`, t0: 33.9, t1: 41.0, s0: 1.0, s1: 1.0, dx0: 0, dx1: 0, cutIn: true },
];
const Backgrounds: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <>
      {BG_SEG.map((seg, i) => {
        const fadeIn =
          i === 0
            ? 1
            : seg.cutIn
              ? t >= seg.t0
                ? 1
                : 0
              : ip(t, [seg.t0 - 0.25, seg.t0 + 0.25], [0, 1]);
        const fadeOut =
          i === BG_SEG.length - 1
            ? 1
            : seg.cutOut
              ? t < seg.t1
                ? 1
                : 0
              : ip(t, [seg.t1 - 0.25, seg.t1 + 0.25], [1, 0]);
        const op = fadeIn * fadeOut;
        if (op <= 0) return null;
        const p = ip(t, [seg.t0, seg.t1], [0, 1]);
        const s = lerp(seg.s0, seg.s1, p);
        const dx = lerp(seg.dx0, seg.dx1, p);
        return (
          <div
            key={`${seg.src}-${i}`}
            style={{ position: "absolute", left: -270, top: 0, width: 1620, height: A, overflow: "hidden", opacity: op }}
          >
            <Img
              src={staticFile(seg.src)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 1620,
                height: 1080,
                transform: `translateX(${dx}px) scale(${s})`,
                transformOrigin: "50% 50%",
              }}
            />
          </div>
        );
      })}
    </>
  );
};

// ---- confetti (40 seeded deterministic particles; V2 copy) ------------------
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t_ = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t_ = (t_ + Math.imul(t_ ^ (t_ >>> 7), 61 | t_)) ^ t_;
  return ((t_ ^ (t_ >>> 14)) >>> 0) / 4294967296;
};
const CONF_COLORS = [
  "#FFB3BA",
  "#FFDFBA",
  "#FFFFBA",
  "#BAFFC9",
  "#BAE1FF",
  "#D7BAFF",
  "#FFC9DE",
];
const rnd = mulberry32(20261011);
const CONFETTI = Array.from({ length: 40 }, () => ({
  x0: rnd() * A,
  delay: rnd() * 1.6,
  speed: 0.3 + rnd() * 0.22, // fall cycles/sec
  sway: 1.2 + rnd() * 1.6,
  phase: rnd() * Math.PI * 2,
  rot: 60 + rnd() * 160,
  color: CONF_COLORS[Math.floor(rnd() * CONF_COLORS.length)],
  w: 8 + rnd() * 7,
  h: 10 + rnd() * 9,
}));
const Confetti: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {CONFETTI.map((p, i) => {
        const lt = t - p.delay;
        if (lt < 0) return null;
        const prog = (lt * p.speed) % 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x0 + Math.sin(t * p.sway + p.phase) * 26,
              top: -40 + prog * 1180,
              width: p.w,
              height: p.h,
              background: p.color,
              borderRadius: 2,
              transform: `rotate(${((t * p.rot + (p.phase * 180) / Math.PI) % 360).toFixed(1)}deg)`,
              opacity: Math.min(1, lt / 0.3) * 0.95,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---- end card ("CENTER-TOP on white rounded card, pop-in"; V2 copy) ---------
const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const sp = spring({ frame, fps: FPS, config: { damping: 10 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 36,
        left: "50%",
        transform: `translateX(-50%) scale(${(0.6 + 0.4 * sp).toFixed(3)})`,
        opacity: clamp01(frame / 8),
        background: "rgba(255,255,255,0.93)",
        borderRadius: 24,
        padding: "12px 40px",
        boxShadow: "0 10px 32px rgba(70,45,30,0.28)",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 44,
          lineHeight: 1.08,
          color: "#E2574C",
          whiteSpace: "nowrap",
          letterSpacing: 0.5,
        }}
      >
        Kiên trì là thắng!
      </div>
    </div>
  );
};

// ---- camera state machine (instant cuts, no crossfade) ----------------------
// Absolute-static camera: per-shot camZ/origin are CONSTANTS — scale/origin
// change only at cuts, never inside a shot. S0–S3a ONE static shot identity
// 0–15.30 | S3b close 1.18 @660,800 15.30–17.79 | S4 START 17.79–18.90
// identity | S4 SPRINT 18.90–20.90 (1.02) | demo-bg window 20.90–33.90 identity
// (camera = camStack inside the parallax stack) | S7 finish 33.90+ (1.04).
type Cam = { camZ: number; TX: number; TY: number; ox: number; oy: number };
const camAt = (t: number): Cam => {
  if (t >= 33.9) return { camZ: 1.04, TX: 0, TY: 0, ox: 540, oy: 540 };
  if (t >= 20.9) return { camZ: 1, TX: 0, TY: 0, ox: 540, oy: 540 };
  if (t >= 18.9) return { camZ: 1.02, TX: 0, TY: 0, ox: 540, oy: 540 };
  if (t >= 17.79) return { camZ: 1, TX: 0, TY: 0, ox: 540, oy: 540 };
  // Scene 1 (S0–S3) sau veto "phóng to thu nhỏ vô tội vạ" + USER VETO v5:
  // camera TĨNH identity; duy nhất 1 close-up CÓ CHỦ ĐÍCH còn lại — S3b
  // resolve (rùa nói "Chậm mà chắc" = đúng người nói). S2b close 1.22
  // @430,800 đã BỎ: zoom toàn-cục phóng lớn RÙA (260→317px) ở 10.90–12.40
  // trong khi d2 là lời THỎ thách đấu; camera toàn cục không thể phóng thỏ
  // mà không phóng rùa cùng lúc → bỏ hẳn zoom, rùa trở lại H260 đã duyệt.
  if (t < 15.3) return { camZ: 1, TX: 0, TY: 0, ox: 540, oy: 540 };
  return { camZ: 1.18, TX: 0, TY: 0, ox: 660, oy: 800 };
};

// ---- parallax wrapper (per-layer k over TX/TY/camZ-1, origin per shot) ------
const Par: React.FC<{
  k: number;
  cam: Cam;
  children: React.ReactNode;
}> = ({ k, cam, children }) => (
  <AbsoluteFill
    style={{
      transform: `translate(${(cam.TX * k).toFixed(2)}px, ${(cam.TY * k).toFixed(2)}px) scale(${(1 + (cam.camZ - 1) * k).toFixed(4)})`,
      transformOrigin: `${cam.ox}px ${cam.oy}px`,
    }}
  >
    {children}
  </AbsoluteFill>
);

// ---- FG grass strip (DOF foreground: blur + top gradient mask; Demo copy) ---
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
// S4 SPRINT rabbit (bg6): recedes along the path (depth shrink) with 2 soft
// ghost trails at 5/2 frames behind on the same path. 4-frame back-run chain
// (every=3, hard swap). Trapezoid profile r=0.25 over the full 18.90-20.90
// window: measured px peak/avg 1.48 (v3 easeOutQuad/1.8s was 2.20).
// ---------------------------------------------------------------------------
const SPX = [556, 524, 508, 572, 540];
const SPY = [972, 810, 648, 518, 400];
const SPRINT0 = 18.9;
const SPRINT_DUR = 2.0;
const S4_GAIT = [
  "rabbit_back_m0",
  "rabbit_back_run2",
  "rabbit_back_run3",
  "rabbit_back_run4",
];
const sprintPose = (t: number) => {
  const u = trapz(clamp01((t - SPRINT0) / SPRINT_DUR), 0.25);
  return { x: polyLin(SPX, u), y: polyLin(SPY, u), H: lerp(400, 170, u) };
};
const S4SprintRabbit: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { x, y, H } = sprintPose(t);
  return (
    <>
      {[
        { d: 5, o: 0.1 },
        { d: 2, o: 0.16 },
      ].map((g) => {
        const p = sprintPose(t - g.d / FPS);
        return (
          <Sprite
            key={g.d}
            k="rabbit_back_run2"
            x={p.x}
            y={p.y}
            H={p.H}
            opacity={g.o}
            shadow={false}
          />
        );
      })}
      <Chain ks={S4_GAIT} every={3} f0={s2f(SPRINT0)} x={x} y={y} H={H} />
    </>
  );
};

// ---------------------------------------------------------------------------
// S5 turtle — approved KidsS5BackDemo method on the episode timeline: back-
// view 4-frame walk chain (every=8, unchanged), shared content scale S=H/1002
// (feet pinned, body-dip frames read as a real vertical bob), waddle +-2.5deg.
// Walk spans the FULL d5 window 22.79-28.94 (6.15s, u=trapz r=0.24 — no time
// compression, no glance warp), then holds pose m0 at (250,355,60) until the
// S6 wake cut 29.54 (>=0.6s). Back-view: no mouth patch. easeInOutQuad measured
// px peak/avg 1.91; trapz r=0.25 → 1.616 (still >gate); r=0.24 → 1.594 ≤1.6
// per pacing rule msg 2463.
// ---------------------------------------------------------------------------
const S5TURTLE_REG: Record<string, Reg> = {
  turtle_back_m0: { w: 1407, h: 1021, t: 0.0098, b: 0.9902, cx: 0.4826, chf: 0.9804, cwf: 0.6326 },
  turtle_back_w1: { w: 1407, h: 1021, t: 0.047, b: 0.9912, cx: 0.4826, chf: 0.9442, cwf: 0.6326 },
  turtle_back_walk2: { w: 1448, h: 1086, t: 0.0092, b: 0.9521, cx: 0.4827, chf: 0.9429, cwf: 0.6354 },
  turtle_back_w3: { w: 1448, h: 1086, t: 0.047, b: 0.953, cx: 0.4834, chf: 0.9061, cwf: 0.6354 },
};
const S5_GAIT = [
  "turtle_back_m0",
  "turtle_back_w1",
  "turtle_back_walk2",
  "turtle_back_w3",
];
const S5T0 = 22.79; // d5 audio window 22.79-28.94 (6.15s)
const S5WALK = 6.15;
const s5Pose = (t: number) => {
  const tl = t - S5T0;
  const u = trapz(clamp01(tl / S5WALK), 0.24);
  return {
    walking: tl >= 0 && tl < S5WALK,
    x: polyLin([610, 508, 445, 510, 430, 250], u),
    y: polyLin([950, 810, 680, 540, 430, 355], u),
    H: polyLin([290, 232, 185, 140, 98, 60], u),
  };
};
const S5Turtle: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { x, y, H, walking } = s5Pose(t);
  const k = walking
    ? S5_GAIT[Math.floor((frame - s2f(S5T0)) / 8) % 4]
    : "turtle_back_m0";
  const g = S5TURTLE_REG[k];
  const S = H / 1002;
  const imgH = S * g.h;
  const imgW = S * g.w;
  const waddle = walking ? 2.5 * Math.sin(((t - S5T0) * Math.PI * 2) / 1.15) : 0;
  const sw = imgW * g.cwf * 0.72;
  const shOp = 0.1 + 0.15 * clamp01((H - 60) / 560);
  return (
    <div
      style={{
        position: "absolute",
        left: x - imgW * g.cx,
        top: y - imgH * g.b,
        width: imgW,
        height: imgH,
        transform: `rotate(${waddle.toFixed(3)}deg)`,
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
        src={P(k)}
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Demo-bg stack camera (S4 NAP -> S5 -> S6 wake/wide), instant cuts, per-shot
// CONSTANTS (no zoom/pan inside a shot): NAP + S5 = ONE static shot 1.00
// (the old S5 A/B/C 1.22/1.05 cuts are gone — the back-view demo runs uncut)
// | wake close-up 1.30 @ (830,640) | wide 1.02.
// ---------------------------------------------------------------------------
const camStack = (t: number): Cam => {
  if (t < 29.54) return { camZ: 1, TX: 0, TY: 0, ox: 540, oy: 540 };
  if (t < 31.9) return { camZ: 1.3, TX: 0, TY: 0, ox: 830, oy: 640 };
  return { camZ: 1.02, TX: 0, TY: 0, ox: 540, oy: 540 };
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const KidsStoryEp1Remake: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camAt(t);

  // entrances (springs, damping 16 — pacing pass: softer settle)
  const spA0 = spring({ frame: frame - 4, fps: FPS, config: { damping: 16 } });
  const spA1 = spring({ frame: frame - 14, fps: FPS, config: { damping: 16 } });
  const spB = spring({ frame: frame - s2f(4.0), fps: FPS, config: { damping: 16 } });
  const spC = spring({ frame: frame - s2f(9.42), fps: FPS, config: { damping: 16 } });

  // S0 turtle bob-nod at 2.3–3.2 ("bạn Rùa Vàng"): ty -8 spring in, release
  const spNod0 = spring({ frame: frame - s2f(2.3), fps: FPS, config: { damping: 16 } });
  const nod0 = -8 * spNod0 * (1 - ip(t, [3.0, 3.2], [0, 1]));
  // S3 turtle determined nod at 16.4 ("Chậm mà chắc"): ty -10 spring in, release
  const spNod3 = spring({ frame: frame - s2f(16.4), fps: FPS, config: { damping: 16 } });
  const nod3 = -10 * spNod3 * (1 - ip(t, [17.2, 17.4], [0, 1]));

  // S1 rabbit listen hop: ONE beat at 4.9 (pacing pass dropped the old 7.8
  // second hop), height 24, 0.4s arc
  const hopBeat = (tb: number) => {
    const u = (t - tb) / 0.4;
    return u > 0 && u < 1 ? -24 * Math.sin(Math.PI * u) : 0;
  };
  const hop1 = hopBeat(4.9);

  // sleeping-rabbit breathing (+-0.8% scaleY, 3s period; Demo copy)
  const br6 = Math.sin((t * Math.PI * 2) / 3);
  // S4 rabbit crouch-launch hop at 18.00 (settles by ~18.4 -> >=0.5s hold
  // before the 18.90 sprint CUT; damping 16)
  const spHop4 = spring({ frame: frame - s2f(18.0), fps: FPS, config: { damping: 16 } });
  // S6 wake pop-in spring (damping 16 — pacing pass: softer pop)
  const spWake = spring({ frame: frame - s2f(29.54), fps: FPS, config: { damping: 16 } });
  // S7 turtle proud nod-bounce at 38.2 + gentle bob through the end hold
  const spNod7 = spring({ frame: frame - s2f(38.2), fps: FPS, config: { damping: 16 } });
  const nod7 = -8 * spNod7 * (1 - ip(t, [38.9, 39.3], [0, 1]));
  const bob7 = t >= 38.5 ? -4 * Math.sin((2 * Math.PI * (t - 38.5)) / 1.9) : 0;
  // S7 rabbit arrival progress (36.50 -> 37.90), trapezoid r=0.25:
  // measured px peak/avg 1.33 (v3 easeOutQuad was 1.98)
  const uR = trapz(clamp01((t - 36.5) / 1.4), 0.25);
  // demo-bg stack camera + warm late-afternoon tint (multiply)
  const cams = camStack(t);
  const tintA =
    t < 21.3
      ? 0
      : t < 22.79
        ? ip(t, [21.3, 22.79], [0, 0.12])
        : t < 31.9
          ? 0.12
          : t < 33.9
            ? ip(t, [31.9, 33.9], [0.12, 0.16])
            : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#241c16", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${cam.TX}px, ${cam.TY}px) scale(${cam.camZ})`,
          transformOrigin: `${cam.ox}px ${cam.oy}px`,
          overflow: "hidden",
        }}
      >
      <Backgrounds />

      {/* S0 (bg1_start) — rabbit front LEFT talking (d0), turtle idle RIGHT */}
      <Talking
        closed="rabbit_front_m0"
        mouthName="rabbit_front"
        cues={CUES[0]}
        t0={0}
        t1={3.49}
        x={380}
        y={880}
        H={310}
        opacity={ip(t, [3.65, 4.05], [1, 0]) * clamp01(spA0 * 2)}
      />
      <Idle
        k="turtle_front_m0"
        x={700}
        y={845}
        H={230}
        ty={nod0}
        opacity={ip(t, [3.65, 4.05], [1, 0]) * clamp01(spA1 * 2)}
      />

      {/* S1 (bg3_duel) — turtle front RIGHT talking (d1), greet idle LEFT */}
      <Talking
        closed="turtle_front_m0"
        mouthName="turtle_front"
        cues={CUES[1]}
        t0={4.09}
        t1={9.31}
        x={710}
        y={885}
        H={260}
        opacity={env(t, 4.0, 9.91) * clamp01(spB * 2)}
      />
      <Idle
        k="rabbit_greet_mO"
        x={350}
        y={880}
        H={310}
        ty={hop1}
        opacity={env(t, 4.15, 9.91)}
      />

      {/* S2 (bg3_duel) — taunt face-off: rabbit taunt LEFT talking (d2,
          mirrored to face RIGHT), turtle side idle RIGHT (mirrored LEFT);
          camera TĨNH identity cả window (S2b close đã bỏ — USER VETO v5);
          REACTION 12.40 cuts to the enlarged turtle (tilt -5, steps back
          710->730) with a small idle rabbit at the left */}
      <Talking
        closed="rabbit_taunt"
        mouthName="rabbit_taunt"
        cues={CUES[2]}
        t0={9.91}
        t1={12.93}
        x={350}
        y={880}
        H={310}
        opacity={until(t, 9.41, 12.4) * clamp01(spC * 2)}
        scaleX={-1}
      />
      <Idle
        k="turtle_side_m0"
        x={710}
        y={885}
        H={260}
        scaleX={-1}
        opacity={until(t, 9.41, 12.4)}
      />
      <Idle
        k="turtle_side_m0"
        x={ip(t, [12.4, 13.45], [710, 730])}
        y={870}
        H={340}
        scaleX={-1}
        rotate={-5}
        opacity={until(t, 12.4, 13.53)}
      />
      <Idle
        k="rabbit_taunt"
        x={350}
        y={880}
        H={240}
        scaleX={-1}
        opacity={until(t, 12.4, 13.53)}
      />

      {/* S3 (bg3_duel) — turtle side talking (d3, mirrored LEFT), rabbit
          keeps the smirk idle (mirrored RIGHT); PUNCH 15.30 + nod at 16.4 */}
      <Talking
        closed="turtle_side_m0"
        mouthName="turtle_side"
        cues={CUES[3]}
        t0={13.53}
        t1={17.19}
        x={710}
        y={885}
        H={300}
        scaleX={-1}
        ty={nod3}
        opacity={until(t, 13.53, 17.94, 0.4)}
      />
      <Idle
        k="rabbit_taunt"
        x={350}
        y={880}
        H={310}
        scaleX={-1}
        opacity={until(t, 13.53, 17.94, 0.4)}
      />

      {/* S4 START (bg1_start) — both backs to camera at the line; rabbit
          crouch-launch hop (40px) at 18.30, CUT 18.90 into the sprint */}
      <Sprite
        k="rabbit_back_m0"
        x={430}
        y={860}
        H={280}
        ty={-40 * spHop4}
        opacity={ip(t, [17.79, 17.94], [0, 1]) * (t < 18.9 ? 1 : 0)}
      />
      <Idle
        k="turtle_back_m0"
        x={640}
        y={850}
        H={220}
        opacity={ip(t, [17.79, 17.94], [0, 1]) * (t < 18.9 ? 1 : 0)}
      />

      {/* S4 SPRINT (bg6_walk CUT) — rabbit recedes with ghost speed trails;
          the turtle is behind, off-screen */}
      {t >= 18.9 && t < 20.9 && <S4SprintRabbit />}

      {/* demo-bg parallax stack — S4 NAP (20.90 CUT in) through S5 (ONE
          static shot; turtle back-view walk on the full d5 window from 22.79,
          holds m0 28.94-29.54) through S6 (wake close-up 29.54, wide empty
          road 31.90), CUT out 33.90 */}
      {t >= 20.9 && t < 33.9 && (
        <AbsoluteFill>
          <Par k={1.0} cam={cams}>
            <Img
              src={staticFile(`${KP}/remake/bg_d5_back.png`)}
              style={{ position: "absolute", left: -270, top: 0, width: 1620, height: A }}
            />
          </Par>
          <Par k={1.1} cam={cams}>
            <Sprite k="tree_clean" x={870} y={685} H={620} shadow={false} />
            {t < 29.54 ? (
              <Sprite
                k="rabbit_sleeping"
                x={830}
                y={759.7}
                H={175}
                scaleX={1 - 0.004 * br6}
                scaleY={1 + 0.008 * br6}
              />
            ) : t < 31.9 ? (
              <Sprite
                k="rabbit_wake"
                x={830}
                y={689.0}
                H={330}
                scaleMul={0.55 + 0.45 * spWake}
                rotate={
                  t > 29.6
                    ? 4 * Math.exp(-3 * (t - 29.6)) * Math.sin(2 * Math.PI * 6 * (t - 29.6))
                    : 0
                }
              />
            ) : (
              <Sprite k="rabbit_wake" x={830} y={796.7} H={175} scaleX={-1} />
            )}
            <Zzz
              x={663}
              y={556}
              t0={21.1}
              master={ip(t, [21.1, 21.45], [0, 1]) * (t < 29.54 ? 1 : 0)}
            />
          </Par>
          {/* turtle ABOVE tree+rabbit+zZz; gone from 29.54 (empty road) */}
          <Par k={1.18} cam={cams}>
            {t >= 22.79 && t < 29.54 && <S5Turtle />}
          </Par>
          <Par k={1.38} cam={cams}>
            <FgStrip />
          </Par>
        </AbsoluteFill>
      )}

      {/* S7 (bg8_finish CUT) — turtle proud talking (d7) at the gate; rabbit
          arrives 36.50 and bows (rotate 6, thẹn); turtle nods back 38.2 */}
      <Talking
        closed="turtle_proud"
        mouthName="turtle_proud"
        cues={CUES[7]}
        t0={34.08}
        t1={39.59}
        x={420}
        y={845}
        H={300}
        opacity={ip(t, [33.9, 34.05], [0, 1])}
        ty={nod7 + bob7}
      />
      {t >= 36.5 && t < 37.9 && (
        <Chain
          ks={[
            "rabbit_front_run_m0",
            "rabbit_front_run2",
            "rabbit_front_run3",
            "rabbit_front_run4",
          ]}
          every={3}
          f0={s2f(36.5)}
          x={lerp(950, 640, uR)}
          y={lerp(713, 800, uR)}
          H={lerp(90, 210, uR)}
        />
      )}
      {t >= 37.9 && <Idle k="rabbit_front_m0" x={640} y={800} H={210} rotate={6} />}
      </AbsoluteFill>

      {/* warm late-afternoon tint over the demo-bg window (multiply blend) */}
      {tintA > 0 && (
        <AbsoluteFill
          style={{
            background: `rgba(255,150,60,${tintA.toFixed(4)})`,
            mixBlendMode: "multiply",
            pointerEvents: "none",
          }}
        />
      )}

      {/* S7 confetti from 34.1s + end card from 38.9s (screen space) */}
      <Sequence from={Math.round(34.1 * 30)}>
        <Confetti />
      </Sequence>
      <Sequence from={s2f(38.9)}>
        <EndCard />
      </Sequence>

      {/* audio: BGM bed (0.30, loop) + 8 dialogue lines on the timeline.json
          windows (embedded data, not hardcoded) */}
      <Audio
        src={staticFile(`${KP}/k_bgm_v2.wav`)}
        volume={ip(t, [40.2, 41.0], [0.3, 0.12])}
        loop
      />
      {LINES.map((l) => (
        <Sequence key={l.i} from={s2f(l.start)} durationInFrames={s2f(l.dur) + 2}>
          <Audio src={staticFile(`${KP}/dialogue_v2/d${l.i}_${l.who}.wav`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
