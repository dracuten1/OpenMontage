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
import d7c from "../public/character-performer/kids/dialogue_v2/d7_cues.json";
import regJson from "../public/character-performer/kids/ep1_v2/sprite_reg.json";
import mouthJson from "../public/character-performer/kids/ep1_v2/mouth_reg.json";

// ---------------------------------------------------------------------------
// KidsStoryEp1V2 — Ep.01 "Rùa và Thỏ", ep1_v2 full upgrade (8 lines on the
// dialogue_v2 timeline, 40.2s = 1206f @ 30fps, 1080x1080).
//
// Staging per TASK_COMPOSE.md (Hermes, 2026-10-11):
//   * New 1536x1024 backgrounds, full-bleed cover in the 1080x1080 viewport,
//     0.5s crossfades centered at line-boundary gaps, per-shot Ken Burns
//     (alternating zoom / drift).
//   * Sprite geometry from ep1_v2/sprite_reg.json (measured by Hermes):
//     content bottom-center pins to a stage point. imgH = H/chf,
//     imgW = imgH*(w/h), left = X - imgW*cx, top = Y - imgH*b.
//   * Mouth (TASK_FIX3): body = closed sprite at full opacity ALWAYS; an
//     open-mouth patch (feathered crop of the mO sprite, ep1_v2/mouth_reg.json)
//     fades on top, clipped to the mouth rect only. 70ms easeOutCubic from
//     rhubarb cues (X,C closed; A,B,D,E,F,G,H open). One wrapper carries the
//     common transform so mirroring (scaleX=-1) flips body+patch together.
//   * Soft ellipse contact shadow under every sprite; squash-stretch idle
//     +-1%; entrances spring (damping 12) except where the shot notes
//     custom motion (d4 sprint, d5 walk, d6 wake overshoot).
//   * d7: 40 seeded deterministic confetti particles + end card @ 39.0s.
//   * FIX5: d4/d5 follow the measured CURVED road centerlines (bg6 S-curve,
//     bg5 left curve) via polyline keyframes; back-view sprites carry 2-pose
//     stride cycles (hard swap, no crossfade; rabbit 150ms, turtle 267ms);
//     nap moves to the bg5 trunk-base spot (977,680) H=170; d7 rabbit adds
//     a 1% cos-2s breathing scale.
//
// Pure function of frame: no Math.random / Date / CSS animation. Confetti
// PRNG runs once at module load with a fixed seed. Every interpolate() input
// range is strictly increasing and clamped.
// ---------------------------------------------------------------------------

const FPS = 30;
const A = 1080; // square frame
const FONT =
  "'Baloo 2','Arial Rounded MT Bold','Comic Sans MS',system-ui,sans-serif";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
// clamped interpolate — input ranges must be strictly increasing
const ip = (v: number, rng: number[], out: number[]) =>
  interpolate(v, rng, out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const s2f = (s: number) => Math.round(s * FPS);
// polyline keyframes (FIX5): p in [0,1] maps across equal-duration segments,
// easeOutCubic inside each segment (bounds-style gait: quick -> settle per leg).
const polyLerp = (ks: number[], p: number): number => {
  const n = ks.length - 1;
  const u = clamp01(p) * n;
  const i = Math.min(n - 1, Math.floor(u));
  const e = 1 - Math.pow(1 - (u - i), 3);
  return lerp(ks[i], ks[i + 1], e);
};
// linear polyline keyframes: p in [0,1] across equal-duration segments with
// NO easing — bg5 far-turtle crawl (LINEAR over the full duration).
const polyLin = (ks: number[], p: number): number => {
  const n = ks.length - 1;
  const u = clamp01(p) * n;
  const i = Math.min(n - 1, Math.floor(u));
  return lerp(ks[i], ks[i + 1], u - i);
};
const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
// opacity envelope: fade in over f after tIn, fade out over f before tOut
const env = (t: number, tIn: number, tOut: number, f = 0.35) =>
  ip(t, [tIn, tIn + f], [0, 1]) * ip(t, [tOut - f, tOut], [1, 0]);

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
  7: mc(d7c),
};

// mouth open amount 0..1 at local wav time `lt` (70ms easeOutCubic crossfade)
const openAmt = (cues: Cue[], lt: number): number => {
  const cue = cues.find((c) => lt >= c.start && lt < c.end);
  if (!cue) return 0;
  const open = cue.value !== "X" && cue.value !== "C";
  const k = clamp01((lt - cue.start) / 0.07);
  const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
  return open ? e : 1 - e;
};

// ---- sprite registration (geometry measured by Hermes) ----------------------
type Reg = {
  w: number;
  h: number;
  t: number;
  b: number;
  cx: number;
  chf: number;
  cwf: number;
};
// FIX5: the reg now holds two shapes — legacy {t,b,chf,cwf} and the walk/run2
// stride entries {top,bot,contentH,x0,x1}. Normalize both to Reg at load.
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
const REG: Record<string, Reg> = Object.fromEntries(
  Object.entries(regJson as Record<string, RawReg>).map(
    ([k, r]): [string, Reg] => [k, normReg(r)],
  ),
);
const FILES: Record<string, string> = {
  rabbit_greet_mO: "ep1_ai/rabbit_greet_mO.png",
  rabbit_taunt: "ep1_ai/rabbit_taunt.png",
  rabbit_front_m0: "sprite_lib/rabbit/rabbit_front_m0.png",
  rabbit_back_m0: "sprite_lib/rabbit/rabbit_back_m0.png",
  rabbit_back_run2: "sprite_lib/rabbit/rabbit_back_run2.png",
  rabbit_front_run_m0: "sprite_lib/rabbit/rabbit_front_run_m0.png",
  rabbit_front_run2: "sprite_lib/rabbit/rabbit_front_run2.png",
  rabbit_wake: "sprite_lib/rabbit/rabbit_wake_shock.png",
  rabbit_sleeping: "sprite_lib/rabbit/rabbit_sleeping.png",
  turtle_m0: "depth_demo/turtle_m0.png",
  turtle_side_m0: "depth_demo/turtle_side_m0.png",
  turtle_front_m0: "sprite_lib/turtle/turtle_front_m0.png",
  turtle_back_m0: "sprite_lib/turtle/turtle_back_m0.png",
  turtle_back_walk2: "sprite_lib/turtle/turtle_back_walk2.png",
  turtle_proud: "ep1_ai/turtle_proud.png",
};
const P = (k: string) =>
  staticFile(`character-performer/kids/${FILES[k]}`);

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

// hard 2-pose stride cycle (FIX5): swaps kA/kB every `every` frames from f0 —
// no crossfade — carrying the usual Sprite transform. Pure function of frame.
const SwapCycle: React.FC<
  Omit<SpriteProps, "k"> & { kA: string; kB: string; every: number; f0: number }
> = ({ kA, kB, every, f0, ...rest }) => {
  const frame = useCurrentFrame();
  const phase = Math.floor((frame - f0) / every) % 2;
  return <Sprite k={phase === 0 ? kA : kB} {...rest} />;
};

// talking (TASK_FIX3): body = closed sprite at FULL opacity always (stable —
// no whole-sprite shimmer); an open-mouth patch fades on top, clipped to the
// mouth rect. Patch rect comes from ep1_v2/mouth_reg.json (fractions of the
// mO sprite image) and is mapped through the mO sprite's own reg entry so it
// lands on the same geometry the body uses. One wrapper div carries the
// common transform (rotate + scale incl. scaleX=-1 mirroring) with the same
// transformOrigin as Sprite, so body+patch always flip together.
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
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const a = t >= t0 && t < t1 ? openAmt(cues, t - t0) : 0;
  const g = REG[closed];
  const imgH = H / g.chf;
  const imgW = imgH * (g.w / g.h);
  // FIX4 D1: patch geometry from the MATCHED mO2 entry when it exists
  // (turtle_front / rabbit_front); legacy mO for rabbit_taunt / turtle_proud
  // (those were always matched). The mO2 image is pinned at the SAME x,y,H
  // anchor via its own reg entry, so patch and body share one anchor pin.
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
        transform: `rotate(${rotate}deg) scale(${scaleX * scaleMul}, ${scaleMul})`,
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
        src={staticFile(`character-performer/kids/${m.file}`)}
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

// ---- backgrounds (cover + crossfades + Ken Burns) ---------------------------
// 1536x1024 -> cover 1080x1080: draw at 1620x1080, centered (left -270).
const BG = "character-performer/kids/ep1_v2";
// Road centerlines in VIEWPORT px (bg-space % converted via
// x_vp = x%*16.198 - 270, y_vp = y%*10.8):
// bg6 S-curve track (d4 sprint + d5 walk), ending just before the finish gate;
// bg5 road sweeping LEFT to the far gate at (103,486) — the far turtle's crawl
// during the nap dialogue (ends at (119,529), just short of the gate).
const BG6_X = [556, 524, 508, 572, 540];
const BG6_Y = [972, 810, 648, 518, 400];
const BG6_H = [400, 170];
const BG5_X = [540, 524, 427, 65];
const BG5_Y = [972, 648, 594, 529];
const BG_SEG = [
  { f: "bg1_start", t0: 0, t1: 3.9, s0: 1.0, s1: 1.04, dx0: 0, dx1: 0 },
  { f: "bg3_duel", t0: 3.9, t1: 17.49, s0: 1.05, s1: 1.05, dx0: -26, dx1: 26 },
  { f: "bg6_walk", t0: 17.49, t1: 20.33, s0: 1.06, s1: 1.02, dx0: 0, dx1: 0 },
  { f: "bg5_nap", t0: 20.33, t1: 33.79, s0: 1.02, s1: 1.06, dx0: 12, dx1: -12 },
  { f: "bg8_finish", t0: 33.79, t1: 40.93, s0: 1.04, s1: 1.04, dx0: -20, dx1: 20 },
];
const Backgrounds: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <>
      {BG_SEG.map((seg, i) => {
        const fadeIn = i === 0 ? 1 : ip(t, [seg.t0 - 0.25, seg.t0 + 0.25], [0, 1]);
        const fadeOut =
          i === BG_SEG.length - 1
            ? 1
            : ip(t, [seg.t1 - 0.25, seg.t1 + 0.25], [1, 0]);
        const op = fadeIn * fadeOut;
        if (op <= 0) return null;
        const p = ip(t, [seg.t0, seg.t1], [0, 1]);
        const s = lerp(seg.s0, seg.s1, p);
        const dx = lerp(seg.dx0, seg.dx1, p);
        return (
          <div
            key={`${seg.f}-${i}`}
            style={{ position: "absolute", left: -270, top: 0, width: 1620, height: A, overflow: "hidden", opacity: op }}
          >
            <Img
              src={staticFile(`${BG}/${seg.f}.png`)}
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

// ---- confetti (40 seeded deterministic particles, falling whole d7 shot) ----
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

// ---- end card ("CENTER-TOP on white rounded card, pop-in") ------------------
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
        Thấy chưa: Kiên trì là thắng!
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const KidsStoryEp1V2: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // entrances (springs, damping 12 unless noted)
  const spA0 = spring({ frame: frame - 4, fps: FPS, config: { damping: 12 } });
  const spA1 = spring({ frame: frame - 14, fps: FPS, config: { damping: 12 } });
  const spB = spring({ frame: frame - s2f(4.0), fps: FPS, config: { damping: 12 } });
  const spC = spring({ frame: frame - s2f(9.42), fps: FPS, config: { damping: 12 } });
  const spG = spring({ frame: frame - s2f(33.92), fps: FPS, config: { damping: 12 } });
  const spWake = spring({ frame: frame - s2f(30.23), fps: FPS, config: { damping: 9 } });

  // d4 sprint (FIX5): follows the bg6 S-curve centerline (BG6_X/Y); H
  // 400->170 easeOutCubic (polyLerp(BG6_H)) over the same 2.5s from
  // t=18.26 with a 150ms hard-swap run stride (m0 <-> run2).
  const u4 = clamp01((t - 17.79) / 2.5);
  const hop = 22 * (1 - u4) * Math.abs(Math.sin((t - 17.79) * Math.PI * 2 * 2.2));

  // d5 walk (FIX5): same bg6 centerline, 5.5s from t=23.0, H 340->230
  // easeInOut, 267ms hard-swap walk stride; waddle rotate kept.
  const u5 = clamp01((t - 22.52) / 5.5);
  const wob = Math.sin(((t - 22.52) * Math.PI * 2) / 1.15);

  // bg5 nap-shot turtle: crawls the far road the WHOLE window 20.8 -> 33.0 and
  // REACHES the far gate (uN=1 at 33.0) — it finishes the race far away while
  // the rabbit sleeps; H 150->60 linear.
  const uN = clamp01((t - 20.33) / 12.2);

  // d7 rabbit breathing (FIX5): cos, 2s period, +-1% uniform scale.
  const br7 = Math.cos((t * Math.PI * 2) / 2);

  // FIX8 punch-in camera: zoom 1 -> 1.45 centered ON THE GATE, panned so the
  // gate sits at frame center at full zoom — no frame edge exposure (bg is
  // 1620 wide vs 1080 viewport: max safe zoom at x=103 is ~1.45 with pan).
  const camZ =
    ip(t, [31.43, 33.23], [1, 2.35]) * ip(t, [33.33, 33.79], [1, 1 / 2.35]);
  // pan so the gate lands at frame CENTER (540,540) at full zoom, 0 at z=1
  const camTX = ((540 - 103) * (camZ - 1)) / 1.35;
  const camTY = ((540 - 486) * (camZ - 1)) / 1.35;

  return (
    <AbsoluteFill style={{ backgroundColor: "#241c16" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${camTX}px, ${camTY}px) scale(${camZ})`,
          transformOrigin: "103px 486px",
        }}
      >
      <Backgrounds />

      {/* A — d0 (bg1_start): rabbit front pair LEFT talking, turtle idle RIGHT */}
      <Talking
        closed="rabbit_front_m0"
        mouthName="rabbit_front"
        cues={CUES[0]}
        t0={0}
        t1={3.49}
        x={380}
        y={880}
        H={310}
        opacity={ip(t, [3.6, 4.05], [1, 0]) * clamp01(spA0 * 2)}
        scaleMul={0.75 + 0.25 * spA0}
      />
      <Idle
        k="turtle_front_m0"
        x={700}
        y={845}
        H={230}
        opacity={ip(t, [3.6, 4.05], [1, 0]) * clamp01(spA1 * 2)}
        scaleMul={0.8 + 0.2 * spA1}
      />

      {/* B — d1 (bg3_duel): turtle front pair RIGHT talking, greet idle LEFT */}
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
        scaleMul={0.92 + 0.08 * spB}
      />
      <Idle k="rabbit_greet_mO" x={350} y={880} H={310} opacity={env(t, 4.15, 9.81)} />

      {/* C — d2+d3 (bg3_duel): rabbit taunt pair LEFT (talks d2 only, mirrored
          to face RIGHT toward the turtle; d3 keeps it as idle for continuity),
          turtle: front pair d1 -> depth m0 idle mirrored to face the rabbit
          across d2 + gap -> depth side-view pair talking d3 (FIX9) */}
      <Talking
        closed="rabbit_taunt"
        mouthName="rabbit_taunt"
        cues={CUES[2]}
        t0={9.91}
        t1={12.93}
        x={350}
        y={880}
        H={310}
        opacity={env(t, 9.41, 17.72) * clamp01(spC * 2)}
        scaleMul={0.92 + 0.08 * spC}
        scaleX={-1}
      />
      <Idle k="turtle_side_m0" x={710} y={885} H={260} scaleX={-1} opacity={env(t, 9.41, 13.97)} />
      <Talking
        closed="turtle_side_m0"
        mouthName="turtle_side"
        cues={CUES[3]}
        t0={13.53}
        t1={17.19}
        x={710}
        y={885}
        H={260}
        opacity={env(t, 13.67, 17.72)}
        scaleX={-1}
      />

      {/* D — d4 (FIX5): rabbit_back RUNS the bg6 S-curve (150ms stride swap,
          no crossfade), then naps under bg5's big tree; a tiny turtle walks
          bg5's far road during the nap dialogue */}
      <SwapCycle
        kA="rabbit_back_m0"
        kB="rabbit_back_run2"
        every={5}
        f0={s2f(17.79)}
        x={polyLerp(BG6_X, u4)}
        y={polyLerp(BG6_Y, u4)}
        H={polyLerp(BG6_H, u4)}
        ty={-hop}
        opacity={env(t, 17.63, 20.43)}
      />
      {/* nap at the bg5 trunk base — rabbit sleeps through the WHOLE window;
          zZz cuts off when it wakes in panic (~30.7) */}
      <Sprite k="rabbit_sleeping" x={977} y={680} H={130} opacity={env(t, 20.23, 30.63)} />
      <Zzz x={960} y={550} t0={20.53} master={env(t, 20.58, 30.13)} />
      {/* rabbit wakes in PANIC at the tree (still bg5, far from the gate):
          wakes ~30.7 as it sees the turtle reach the finish far away */}
      <Sprite
        k="rabbit_wake"
        x={950}
        y={690}
        H={140}
        opacity={env(t, 30.23, 33.83)}
        scaleMul={0.85 + 0.15 * spWake}
      />
      <SwapCycle
        kA="turtle_back_m0"
        kB="turtle_back_walk2"
        every={8}
        f0={s2f(20.33)}
        x={polyLin(BG5_X, uN)}
        y={polyLin(BG5_Y, uN)}
        H={lerp(150, 60, uN)}
        opacity={env(t, 20.38, 33.73)}
      />

      {/* E — d5/d6 MERGED into the bg5 window (sunset bg CUT — story: the turtle
          finishes while the rabbit sleeps; rabbit wakes in panic at the tree,
          far from the gate). bg8_finish follows directly at 34.26. */}

      {/* G — d7 (bg8_finish): turtle AT THE FINISH celebrating on the LEFT
          side of the gate (facing right, watching the road), rabbit still
          FAR AWAY — far RIGHT of frame, small front-view sprint toward the
          viewer, 2-pose front-run stride (FIX9) */}
      {/* FIX10: rabbit grounded — enters mid-leap from the right, feet land
          ON the road top edge (y≈713, x 460–740) to the RIGHT of the turtle
          (turtle right edge ≈686), then grows toward the camera on the dirt
          (front-run 2-pose cycle; previously floated 120–160px above it) */}
      <SwapCycle
        kA="rabbit_front_run_m0"
        kB="rabbit_front_run2"
        every={5}
        f0={s2f(34.13)}
        x={ip(t, [34.13, 39.73], [800, 735])}
        y={ip(t, [34.13, 39.73], [655, 740])}
        H={ip(t, [34.13, 39.73], [66, 110])}
        ty={-8 * Math.abs(Math.sin((t - 34.13) * Math.PI * 2 * 2.2))}
        opacity={env(t, 34.13, 40.93)}
      />
      <Talking
        closed="turtle_proud"
        mouthName="turtle_proud"
        cues={CUES[7]}
        t0={34.08}
        t1={39.59}
        x={420}
        y={845}
        H={300}
        opacity={env(t, 33.92, 40.93) * clamp01(spG * 2)}
        scaleMul={0.92 + 0.08 * spG}
      />
      <Sequence from={s2f(34.08)}>
        <Confetti />
      </Sequence>
      <Sequence from={s2f(38.52)}>
        <EndCard />
      </Sequence>

      {/* audio: dialogue lines + BGM bed (constant 0.30, loop) */}
      <Audio src={staticFile("character-performer/kids/k_bgm_v2.wav")} volume={0.3} loop />
      {LINES.map((l) => (
        <Sequence key={l.i} from={s2f(l.start)} durationInFrames={s2f(l.dur) + 2}>
          <Audio
            src={staticFile(`character-performer/kids/dialogue_v2/d${l.i}_${l.who}.wav`)}
          />
        </Sequence>
      ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
