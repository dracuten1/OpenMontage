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

// ---------------------------------------------------------------------------
// KidsStoryEp1AI — Ep.01 "Rùa và Thỏ", AI-image edition (8 still-sprite shots
// on the dialogue_v2 shared timeline, 40.66s = 1220f @ 30fps, 1080x1080).
//
// Mechanics copied from KidsDepthDemo (the QC'd depth reference):
//   * SpriteReg pinning — content bottom-center pins to a stage point:
//     imgH = contentH/(b-t), imgW = imgH*ar, left = X - imgW*cx,
//     top = Y - imgH*b. Flip (scaleX -1) mirrors cx -> 1-cx.
//   * exponential depth ramp scaleAtY (0.45 * k^((y-Y0)/(Y1-Y0)), clamp 1.0)
//   * 3-layer parallax pan tied to the turtle's real screen displacement
//   * cue-map lip-sync (X -> closed, A..G -> open, outside wav -> idle)
//   * Zzz glyph, ellipse shadow (w=1.12H h=0.2H, op 0.10..0.25 by scale),
//     feathered FG bottom band, breathing sleep, FONT constant.
//
// Geometry source: ep1_ai/registration.json — its values are ABSOLUTE PIXELS
// (size=[w,h], t/b/cx in px), converted to fractions HERE via fromPx().
// EXCEPTION: the turtle trio (turtle_walk/m0/mO) physically lives in
// depth_demo/ and registration.json's entries for them are STALE — for those
// three we use the inline re-measured constants from KidsDepthDemo.tsx.
//
// Facing (read from the .prompt.txt files):
//   rabbit_greet / rabbit_taunt native LEFT (as staged, no flip);
//   turtle_proud native RIGHT (as staged, no flip);
//   rabbit_run1/2 native RIGHT -> flipped (run is right->left);
//   rabbit_shock native RIGHT -> flipped (looks left toward the finish);
//   turtle_walk (demo) native RIGHT -> flipped in S2 (turned away).
//
// Pure function of frame: no Math.random / Date / CSS animation. Every
// interpolate() input range is strictly increasing and clamped.
// ---------------------------------------------------------------------------

const A = 1080; // square frame
const ZZZ_COLOR = "#3a2e2a";
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

// ---- dialogue timeline + cues ----------------------------------------------
type Line = {
  i: number;
  who: "rabbit" | "turtle";
  text: string;
  start: number;
  dur: number;
};
const LINES = (timelineJson as any).lines as Line[];
type Cue = { start: number; end: number; value: string };
const LINE_CUES: Cue[][] = [d0c, d1c, d2c, d3c, d4c, d5c, d6c, d7c].map(
  (c) => ((c as any).mouthCues ?? []) as Cue[]
);

// cue lookup time = (frame/fps) - line.start  (cues t=0 = START of the wav)
const mouthSprite = (
  lineIdx: number,
  t: number,
  idle: string,
  closed: string,
  open: string
): string => {
  const line = LINES[lineIdx];
  const local = t - line.start;
  if (local < 0 || local >= line.dur) return idle; // outside wav -> idle/base
  const cue = LINE_CUES[lineIdx].find((c) => local >= c.start && local < c.end);
  if (!cue) return idle; // idle between cues
  return cue.value === "X" ? closed : open; // X closed, A..G open
};

// ---- shot boundaries: gap centers (crossfade 0.5s = ±0.25s) ----------------
// S0->S1 is CONTINUOUS (no cut, no crossfade — characters lerp over 0.6s
// centered on g0 = 3.79, i.e. 3.49 -> 4.09). All other boundaries crossfade.
const G = [3.79, 9.615, 13.71, 17.965, 22.965, 29.735, 34.505]; // g0..g6
const XF = 0.5;

// ---- sprite registration (px -> fraction, from ep1_ai/registration.json) ---
type SpriteReg = { ar: number; t: number; b: number; cx: number };
type RegPx = {
  ar: number;
  t: number;
  b: number;
  cx: number;
  size: [number, number];
};
const fromPx = (r: RegPx): SpriteReg => ({
  ar: r.ar,
  t: r.t / r.size[1],
  b: r.b / r.size[1],
  cx: r.cx / r.size[0],
});

const EP1 = "character-performer/kids/ep1_ai";
const DEMO = "character-performer/kids/depth_demo";

// turtle trio: registration.json entries are STALE (images live in
// depth_demo/) — demo TURTLE_REG constants below (re-measured 2026-10-11).
const TURTLE_REG: Record<"walk" | "m0" | "mO", SpriteReg> = {
  walk: { ar: 1.5623, t: 0.0674, b: 0.9844, cx: 0.5059 },
  m0: { ar: 1.559, t: 0.0811, b: 1.0, cx: 0.5033 },
  mO: { ar: 1.5819, t: 0.0938, b: 1.0, cx: 0.5055 },
};

const SPRITE: Record<string, { src: string; reg: SpriteReg }> = {
  rabbit_greet: {
    src: `${EP1}/rabbit_greet.png`,
    reg: fromPx({ ar: 1.499, t: 12, b: 1019, cx: 815, size: [1535, 1024] }),
  },
  rabbit_greet_mO: {
    src: `${EP1}/rabbit_greet_mO.png`,
    reg: fromPx({ ar: 1.499, t: 12, b: 1021, cx: 814, size: [1535, 1024] }),
  },
  rabbit_taunt: {
    src: `${EP1}/rabbit_taunt.png`,
    reg: fromPx({ ar: 1.499, t: 16, b: 1012, cx: 814, size: [1535, 1024] }),
  },
  rabbit_taunt_mO: {
    src: `${EP1}/rabbit_taunt_mO.png`,
    reg: fromPx({ ar: 1.5, t: 16, b: 1012, cx: 814, size: [1536, 1024] }),
  },
  rabbit_run1: {
    src: `${EP1}/rabbit_run1.png`,
    reg: fromPx({ ar: 1.5, t: 28, b: 978, cx: 763, size: [1536, 1024] }),
  },
  rabbit_run2: {
    src: `${EP1}/rabbit_run2.png`,
    reg: fromPx({ ar: 1.5, t: 27, b: 968, cx: 768, size: [1536, 1024] }),
  },
  rabbit_shock: {
    src: `${EP1}/rabbit_shock.png`,
    reg: fromPx({ ar: 1.5, t: 16, b: 1015, cx: 817, size: [1536, 1024] }),
  },
  rabbit_shock_m0: {
    src: `${EP1}/rabbit_shock_m0.png`,
    reg: fromPx({ ar: 1.5, t: 16, b: 1015, cx: 817, size: [1536, 1024] }),
  },
  turtle_proud: {
    src: `${EP1}/turtle_proud.png`,
    reg: fromPx({ ar: 1.5, t: 97, b: 924, cx: 777, size: [1536, 1024] }),
  },
  turtle_proud_mO: {
    src: `${EP1}/turtle_proud_mO.png`,
    reg: fromPx({ ar: 1.499, t: 96, b: 925, cx: 777, size: [1535, 1024] }),
  },
  turtle_walk_demo: { src: `${DEMO}/turtle_walk.png`, reg: TURTLE_REG.walk },
  turtle_m0_demo: { src: `${DEMO}/turtle_m0.png`, reg: TURTLE_REG.m0 },
  turtle_mO_demo: { src: `${DEMO}/turtle_mO.png`, reg: TURTLE_REG.mO },
  rabbit_sleep: {
    src: `${DEMO}/rabbit_sleep.png`,
    reg: fromPx({ ar: 1.5, t: 68, b: 934, cx: 765, size: [1536, 1024] }),
  },
  tree_sleep: {
    src: `${DEMO}/tree_sleep.png`,
    reg: fromPx({ ar: 0.951, t: 0, b: 1277, cx: 611, size: [1223, 1286] }),
  },
};

// ---- layer display geometry (verbatim demo constants) ----------------------
const BG_W = 2520,
  BG_H = 1080; // bg_far 2.334:1
const MID_W = 2587,
  MID_H = 970; // strip_mid 2.667:1, road top ~y750
const FG_W = 1700,
  FG_H = 567; // strip_fg 3:1 source
const FG_BAND_H = 128; // visible bottom band

const TREE_H0 = 620,
  TREE_CX = 810,
  TREE_BOTTOM = 985;
const RS_H0 = 200,
  RS_CX = 800,
  RS_BOTTOM = 975; // napping rabbit (demo staging)
const TURTLE_H0 = 320; // turtle content height at scale 1.0
const RABBIT_H0 = 430; // rabbit content height at scale 1.0

// ---- demo depth ramp + parallax constants ----------------------------------
const X0 = 0.15,
  X1 = 0.55,
  Y0 = 0.72,
  Y1 = 0.88,
  S0 = 0.45,
  S1 = 1.0;
const RAMP_BASE = S1 / S0;
const scaleAtY = (y: number): number =>
  Math.min(S1, S0 * Math.pow(RAMP_BASE, (y - Y0) / (Y1 - Y0)));
const PAN_BG_W = 0.2;
const PAN_MID_W = 0.6;
const PAN_FG_DIV = 1.5;

// ---- reusable pieces --------------------------------------------------------

// content bottom-center pinned to (x, y); contentH = on-screen content height
const PinnedImg: React.FC<{
  sprite: string;
  x: number;
  y: number;
  contentH: number;
  flip?: boolean;
  opacity?: number;
  transform?: string;
  transformOrigin?: string;
}> = ({ sprite, x, y, contentH, flip = false, opacity = 1, transform, transformOrigin }) => {
  const s = SPRITE[sprite];
  const imgH = contentH / (s.reg.b - s.reg.t);
  const imgW = imgH * s.reg.ar;
  const cx = flip ? 1 - s.reg.cx : s.reg.cx; // mirror maps cx -> 1-cx
  const tf = `${flip ? "scaleX(-1) " : ""}${transform ?? ""}`.trim();
  return (
    <Img
      src={staticFile(s.src)}
      style={{
        position: "absolute",
        width: imgW,
        height: imgH,
        left: x - imgW * cx,
        top: y - imgH * s.reg.b,
        opacity,
        transform: tf.length ? tf : undefined,
        transformOrigin: transformOrigin ?? "center",
      }}
    />
  );
};

// demo ellipse shadow: w=1.12H h=0.2H, radial-gradient, op 0.10->0.25 by scale
const Shadow: React.FC<{
  x: number;
  yBottom: number;
  contentH: number;
  scale: number;
}> = ({ x, yBottom, contentH, scale }) => {
  const w = 1.12 * contentH;
  const h = 0.2 * contentH;
  const op = 0.1 + 0.15 * clamp01((scale - 0.45) / 0.55);
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: yBottom - 0.55 * h,
        width: w,
        height: h,
        borderRadius: "50%",
        background: `radial-gradient(ellipse at center, rgba(58,46,42,${op.toFixed(
          3
        )}) 0%, rgba(58,46,42,0) 70%)`,
      }}
    />
  );
};

const BgPair: React.FC<{ panBg: number; panMid: number }> = ({ panBg, panMid }) => (
  <>
    <Img
      src={staticFile(`${DEMO}/bg_far.png`)}
      style={{
        position: "absolute",
        width: BG_W,
        height: BG_H,
        left: (A - BG_W) / 2,
        top: (A - BG_H) / 2,
        transform: `translateX(${panBg}px)`,
      }}
    />
    <Img
      src={staticFile(`${DEMO}/strip_mid.png`)}
      style={{
        position: "absolute",
        width: MID_W,
        height: MID_H,
        left: (A - MID_W) / 2,
        top: A - MID_H,
        transform: `translateX(${panMid}px)`,
      }}
    />
  </>
);

const FgBand: React.FC<{ panFg: number }> = ({ panFg }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      bottom: 0,
      width: A,
      height: FG_BAND_H,
      overflow: "hidden",
      maskImage: "linear-gradient(to bottom, transparent 0%, black 45%, black 100%)",
      WebkitMaskImage:
        "linear-gradient(to bottom, transparent 0%, black 45%, black 100%)",
    }}
  >
    <Img
      src={staticFile(`${DEMO}/strip_fg.png`)}
      style={{
        position: "absolute",
        width: FG_W,
        height: FG_H,
        left: (A - FG_W) / 2,
        bottom: 0,
        transform: `translateX(${panFg}px)`,
      }}
    />
  </div>
);

// zZz glyphs — verbatim demo positions (rabbit naps at RS_CX=800/RS_BOTTOM=975)
const Zzz: React.FC<{ t: number }> = ({ t }) => {
  const CYCLE = 2.5;
  const glyphs = [0, 1, 2].map((i) => {
    const phase = (i * CYCLE) / 3;
    const p = ((t + phase) % CYCLE) / CYCLE; // 0..1
    return { i, p };
  });
  return (
    <>
      {glyphs.map(({ i, p }) => {
        const opacity = Math.sin(Math.PI * p);
        if (opacity <= 0.01) return null;
        const size = 26 + 20 * p;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: 762 + 26 * p,
              top: 752 - 72 * p - i * 6,
              fontSize: size,
              fontWeight: 700,
              fontFamily: FONT,
              color: ZZZ_COLOR,
              opacity,
              lineHeight: 1,
            }}
          >
            z
          </span>
        );
      })}
    </>
  );
};

// demo nap actors: tree + breathing rabbit + zZz (no bg / no FG band —
// callers place their own pan-carrying bg layers and the FG band LAST so it
// draws on top of the ramping turtle, exactly like the demo layer order)
const NapActors: React.FC<{ t: number }> = ({ t }) => {
  const breathe = 1 + 0.008 * Math.sin((2 * Math.PI * t) / 3); // 3s cycle
  const rs = SPRITE.rabbit_sleep.reg;
  const rsImgH = RS_H0 / (rs.b - rs.t);
  const tree = SPRITE.tree_sleep.reg;
  const treeImgH = TREE_H0 / (tree.b - tree.t);
  return (
    <>
      <Img
        src={staticFile(SPRITE.tree_sleep.src)}
        style={{
          position: "absolute",
          width: treeImgH * tree.ar,
          height: treeImgH,
          left: TREE_CX - treeImgH * tree.ar * tree.cx,
          top: TREE_BOTTOM - treeImgH * tree.b,
        }}
      />
      <Img
        src={staticFile(SPRITE.rabbit_sleep.src)}
        style={{
          position: "absolute",
          width: rsImgH * rs.ar,
          height: rsImgH,
          left: RS_CX - rsImgH * rs.ar * rs.cx,
          top: RS_BOTTOM - rsImgH * rs.b,
          transform: `scale(${breathe})`,
          transformOrigin: `${rs.cx * 100}% ${rs.b * 100}%`,
        }}
      />
      <Zzz t={t} />
    </>
  );
};

// demo sleep staging kept verbatim: bg at rest + nap actors + FG band on top.
// S4 passes the run-chase pan so the run->nap crossfade blends IDENTICAL bg
// pixels (no shift-blur), then eases back to rest before the S5 handover.
const SleepStage: React.FC<{
  t: number;
  panFg: number;
  panBg?: number;
  panMid?: number;
}> = ({ t, panFg, panBg = 0, panMid = 0 }) => (
  <>
    <BgPair panBg={panBg} panMid={panMid} />
    <NapActors t={t} />
    <FgBand panFg={panFg} />
  </>
);

// ---- confetti (deterministic arithmetic hash — copied from KidsStoryEp1V6) --
const CONF_N = 36;
const CONF_START = 35.0; // inside the S7 window (g6=34.505 -> end)
const CONF_FALL = 5.8; // falls through the rest of the comp
const CONF_COLORS = ["#e8503a", "#e8724a", "#f2b53c", "#ffb3c0", "#ffffff"];

const Confetti: React.FC<{ t: number }> = ({ t }) => (
  <>
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
      const isRect = k % 2 === 0;
      return (
        <div
          key={`cf-${k}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: isRect ? size * 0.62 : size,
            borderRadius: isRect ? 1.5 : "50%",
            background: fill,
            opacity: op,
            transform: `rotate(${rot.toFixed(1)}deg)`,
          }}
        />
      );
    })}
  </>
);

// ---------------------------------------------------------------------------
export const KidsStoryEp1AI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // ---- scene crossfade opacities (7 visual scenes; S0+S1 share one world) --
  const opIn = (gi: number) => ip(t, [G[gi] - XF / 2, G[gi] + XF / 2], [0, 1]);
  const opOut = (gi: number) => ip(t, [G[gi] - XF / 2, G[gi] + XF / 2], [1, 0]);
  const opV0 = opOut(1); // S0+S1 continuous world
  const opV1 = opIn(1) * opOut(2); // S2
  const opV2 = opIn(2) * opOut(3); // S3
  const opV3 = opIn(3) * opOut(4); // S4
  const opV4 = opIn(4) * opOut(5); // S5
  const opV5 = opIn(5) * opOut(6); // S6
  const opV6 = opIn(6); // S7

  // subtle slow bg drift through the S0..S3 world (pan = depth cue #1)
  const driftMid = 24 * clamp01(t / 18);
  const driftBg = driftMid / 3;

  // ---- S0/S1: rabbit greets, then exits right while turtle enters left ----
  const handoverP = clamp01((t - 3.49) / 0.6); // 3.49 -> 4.09 (centered g0)
  const wave = 6 * Math.sin((2 * Math.PI * t) / 1.1); // ~1.1s period
  const r0H = RABBIT_H0 * 0.9;
  const r0X = lerp(0.63 * A, 1.18 * A, handoverP);
  const r0Op = 1 - handoverP;
  const t1H = TURTLE_H0 * 0.85;
  const t1X = lerp(-0.12 * A, 0.4 * A, handoverP);
  const t1Op = clamp01(handoverP / 0.5);
  const s0Sprite = mouthSprite(0, t, "rabbit_greet", "rabbit_greet", "rabbit_greet_mO");
  const s1Sprite = mouthSprite(1, t, "turtle_proud", "turtle_proud", "turtle_proud_mO");

  // ---- S2: rabbit taunts right, small turtle far-left turned away ----------
  const r2H = RABBIT_H0 * 0.95;
  const s2Sprite = mouthSprite(2, t, "rabbit_taunt", "rabbit_taunt", "rabbit_taunt_mO");

  // ---- S3: turtle NEAR + camera push-in; small rabbit far right ------------
  const push = ip(t, [G[2], G[3]], [1.0, 1.06]); // linear across S3 window
  const s3Sprite = mouthSprite(3, t, "turtle_proud", "turtle_proud", "turtle_proud_mO");

  // ---- S4: run (right->left, counter-pan) then crossfade into nap ----------
  // local-0 = S4 window start (g3=17.965): run 0->2.2s, 0.5s crossfade at
  // ~2.2 (QC still f614 = crossfade mid), nap holds through S5's world.
  // Crossfade curve = ease-out cubic (nap establishes fast) — a linear blend
  // at mid-window leaves the soft watercolor sky too flat (QC std 34<40).
  const runT = t - G[3];
  const napP = ip(runT, [2.2, 2.7], [0, 1]); // 0.5s crossfade progress
  const napOp = 1 - Math.pow(1 - napP, 3); // ease-out cubic
  const runOp = 1 - napOp;
  // pan OPPOSITE the run for the chase; HOLD through the crossfade (so the
  // two worlds blend identical bg pixels), then ease back to rest [2.7,4.0]
  const runMidPan = ip(runT, [0, 2.2, 2.7, 4.0], [0, 180, 180, 0]);
  const runBgPan = ip(runT, [0, 2.2, 2.7, 4.0], [0, 60, 60, 0]);
  const runX = ip(runT, [0, 2.2], [1.15, -0.15]) * A;
  const runSprite = Math.floor(runT * 8) % 2 === 0 ? "rabbit_run1" : "rabbit_run2";
  const r4H = RABBIT_H0 * 0.8;

  // ---- S5: demo staging reused EXACTLY — ramp runs over the S5 window ------
  const u5 = clamp01((t - G[4]) / (G[5] - G[4])); // g4 -> g5
  const ty5 = Y0 + (Y1 - Y0) * u5;
  const ts5 = scaleAtY(ty5);
  const tx5 = X0 + ((X1 - X0) * (ts5 - S0)) / (S1 - S0);
  const turtleDx = (tx5 - X0) * A;
  const panBase = turtleDx / (PAN_FG_DIV * 1.3);
  const panBg5 = -PAN_BG_W * panBase;
  const panMid5 = -PAN_MID_W * panBase;
  const panFg5 = -1.3 * panBase; // = turtleDx/1.5: 1.5x slower than the turtle
  const t5H = TURTLE_H0 * ts5;
  // d5 cue map: X -> m0, A..G -> mO, idle/past-wav -> walk (demo logic)
  const d5local = t - LINES[5].start;
  let t5Kind: "walk" | "m0" | "mO" = "walk";
  if (d5local >= 0 && d5local < LINES[5].dur) {
    const cue = LINE_CUES[5].find((c) => d5local >= c.start && d5local < c.end);
    if (cue) t5Kind = cue.value === "X" ? "m0" : "mO";
  }
  const t5Sprite = `turtle_${t5Kind}_demo`;
  const t5Reg = TURTLE_REG[t5Kind];
  const t5ImgH = t5H / (t5Reg.b - t5Reg.t);
  const t5ImgW = t5ImgH * t5Reg.ar;

  // ---- S6: sunset world — shocked rabbit, small turtle arriving far-left ---
  const s6Sprite = mouthSprite(6, t, "rabbit_shock", "rabbit_shock_m0", "rabbit_shock");
  const t6SmallX = ip(t, [G[5], G[6]], [0.16, 0.24]) * A; // slow drift right

  // ---- S7: finish line — proud turtle, confetti, end title -----------------
  const s7Sprite = mouthSprite(7, t, "turtle_proud", "turtle_proud", "turtle_proud_mO");
  const FINISH_W = Math.round(1.7768 * A); // 1919
  // slow camera pan across the finish bg (depth cue #2; ±60px is safely
  // inside the ±419px margin FINISH_W leaves on each side of the 1080 frame)
  const panFinish = ip(t, [34.505, 40.66], [-60, 60]);
  const titleOp = ip(frame, [1172, 1187], [0, 1]); // fade-in 0.5s from f1172

  return (
    <AbsoluteFill style={{ backgroundColor: "#cfe8f5", overflow: "hidden" }}>
      {/* ============ V0 = S0 + S1 (continuous, no cut) ============ */}
      {opV0 > 0.005 && (
        <AbsoluteFill style={{ opacity: opV0 }}>
          <BgPair panBg={driftBg} panMid={driftMid} />
          {/* turtle enters center-left (S1) */}
          {t1Op > 0.005 && (
            <>
              <Shadow x={t1X} yBottom={0.88 * A} contentH={t1H} scale={0.85} />
              <PinnedImg
                sprite={s1Sprite}
                x={t1X}
                y={0.88 * A}
                contentH={t1H}
                opacity={t1Op}
              />
            </>
          )}
          {/* rabbit greets center-right (S0), waving paw, exits right */}
          {r0Op > 0.005 && (
            <>
              <Shadow x={r0X} yBottom={0.88 * A} contentH={r0H} scale={0.9} />
              <PinnedImg
                sprite={s0Sprite}
                x={r0X}
                y={0.88 * A}
                contentH={r0H}
                opacity={r0Op}
                transform={`rotate(${wave.toFixed(2)}deg)`}
                transformOrigin="30% 20%" /* shoulder of the raised left paw */
              />
            </>
          )}
        </AbsoluteFill>
      )}

      {/* ============ V1 = S2: taunt + far small turtle ============ */}
      {opV1 > 0.005 && (
        <AbsoluteFill style={{ opacity: opV1 }}>
          <BgPair panBg={driftBg} panMid={driftMid} />
          {/* far turtle, turned away (flip -> faces left/away) */}
          <Shadow x={0.22 * A} yBottom={0.74 * A} contentH={TURTLE_H0 * 0.45} scale={0.45} />
          <PinnedImg
            sprite="turtle_walk_demo"
            x={0.22 * A}
            y={0.74 * A}
            contentH={TURTLE_H0 * 0.45}
            flip
          />
          {/* near rabbit taunting right */}
          <Shadow x={0.66 * A} yBottom={0.88 * A} contentH={r2H} scale={0.95} />
          <PinnedImg sprite={s2Sprite} x={0.66 * A} y={0.88 * A} contentH={r2H} />
        </AbsoluteFill>
      )}

      {/* ============ V2 = S3: turtle NEAR + camera push-in ============ */}
      {opV2 > 0.005 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: opV2,
            transform: `scale(${push.toFixed(4)})`,
            transformOrigin: "50% 60%",
          }}
        >
          <BgPair panBg={driftBg} panMid={driftMid} />
          {/* far rabbit right (static taunt) */}
          <Shadow x={0.8 * A} yBottom={0.74 * A} contentH={RABBIT_H0 * 0.45} scale={0.45} />
          <PinnedImg
            sprite="rabbit_taunt"
            x={0.8 * A}
            y={0.74 * A}
            contentH={RABBIT_H0 * 0.45}
          />
          {/* NEAR turtle center-left */}
          <Shadow x={0.42 * A} yBottom={0.88 * A} contentH={TURTLE_H0} scale={1.0} />
          <PinnedImg sprite={s3Sprite} x={0.42 * A} y={0.88 * A} contentH={TURTLE_H0} />
        </div>
      )}

      {/* ============ V3 = S4: run right->left, then nap ============ */}
      {opV3 > 0.005 && (
        <AbsoluteFill style={{ opacity: opV3 }}>
          {runOp > 0.005 && (
            <AbsoluteFill style={{ opacity: runOp }}>
              <BgPair panBg={runBgPan} panMid={runMidPan} />
              <Shadow x={runX} yBottom={0.83 * A} contentH={r4H} scale={0.8} />
              <PinnedImg
                sprite={runSprite}
                x={runX}
                y={0.83 * A}
                contentH={r4H}
                flip /* run1/run2 face RIGHT natively; the run is right->left */
              />
            </AbsoluteFill>
          )}
          {napOp > 0.005 && (
            <AbsoluteFill style={{ opacity: napOp }}>
              <SleepStage t={t} panFg={0} panBg={runBgPan} panMid={runMidPan} />
            </AbsoluteFill>
          )}
        </AbsoluteFill>
      )}

      {/* ============ V4 = S5: demo depth ramp + 3-layer pan + nap ============ */}
      {opV4 > 0.005 && (
        <AbsoluteFill style={{ opacity: opV4 }}>
          <BgPair panBg={panBg5} panMid={panMid5} />
          <NapActors t={t} />
          {/* turtle — registered demo trio, ramped far->near */}
          <div
            style={{
              position: "absolute",
              left: tx5 * A - t5ImgW * t5Reg.cx,
              top: ty5 * A - t5ImgH * t5Reg.b,
              width: t5ImgW,
              height: t5ImgH,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: t5ImgH * t5Reg.b - 0.2 * t5H * 0.55,
                width: 1.12 * t5H,
                height: 0.2 * t5H,
                marginLeft: -(1.12 * t5H) / 2,
                borderRadius: "50%",
                background: `radial-gradient(ellipse at center, rgba(58,46,42,${(
                  0.1 +
                  (0.15 * (ts5 - S0)) / (S1 - S0)
                ).toFixed(3)}) 0%, rgba(58,46,42,0) 70%)`,
              }}
            />
            <Img
              src={staticFile(SPRITE[t5Sprite].src)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />
          </div>
          {/* FG band LAST — on top of the turtle, exactly like the demo order */}
          <FgBand panFg={panFg5} />
        </AbsoluteFill>
      )}

      {/* ============ V5 = S6: sunset shock ============ */}
      {opV5 > 0.005 && (
        <AbsoluteFill style={{ opacity: opV5 }}>
          <BgPair panBg={driftBg} panMid={driftMid} />
          {/* sunset tint — above bg, below characters; fades in with the shot */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, #FF8C42, #7B4397)",
              opacity: 0.35,
            }}
          />
          {/* far-left small turtle slowly arriving at the finish */}
          <Shadow x={t6SmallX} yBottom={0.74 * A} contentH={TURTLE_H0 * 0.45} scale={0.45} />
          <PinnedImg
            sprite="turtle_proud"
            x={t6SmallX}
            y={0.74 * A}
            contentH={TURTLE_H0 * 0.45}
          />
          {/* shocked rabbit right, flipped to face left */}
          <Shadow x={0.7 * A} yBottom={0.88 * A} contentH={RABBIT_H0} scale={1.0} />
          <PinnedImg
            sprite={s6Sprite}
            x={0.7 * A}
            y={0.88 * A}
            contentH={RABBIT_H0}
            flip
          />
        </AbsoluteFill>
      )}

      {/* ============ V6 = S7: finish line + confetti + title ============ */}
      {opV6 > 0.005 && (
        <AbsoluteFill style={{ opacity: opV6 }}>
          <Img
            src={staticFile(`${EP1}/finish_bg.png`)}
            style={{
              position: "absolute",
              width: FINISH_W,
              height: A,
              left: (A - FINISH_W) / 2,
              top: 0,
              transform: `translateX(${panFinish.toFixed(2)}px)`,
            }}
          />
          {/* small shocked rabbit far right (still looking left) */}
          <Shadow x={0.8 * A} yBottom={0.78 * A} contentH={RABBIT_H0 * 0.5} scale={0.5} />
          <PinnedImg
            sprite="rabbit_shock"
            x={0.8 * A}
            y={0.78 * A}
            contentH={RABBIT_H0 * 0.5}
            flip
          />
          {/* proud turtle center */}
          <Shadow x={0.5 * A} yBottom={0.9 * A} contentH={TURTLE_H0 * 0.9} scale={0.9} />
          <PinnedImg
            sprite={s7Sprite}
            x={0.5 * A}
            y={0.9 * A}
            contentH={TURTLE_H0 * 0.9}
          />
          <Confetti t={t} />
          {/* end title */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "18%",
              textAlign: "center",
              fontSize: 64,
              fontWeight: 700,
              fontFamily: FONT,
              color: "#FF7F50",
              WebkitTextStroke: "2px #FFFFFF",
              paintOrder: "stroke",
              lineHeight: 1.15,
              opacity: titleOp,
            }}
          >
            Kiên trì là thắng!
          </div>
        </AbsoluteFill>
      )}

      {/* ============ audio: 8 dialogue lines + BGM ============ */}
      {LINES.map((l) => (
        <Sequence key={`d${l.i}`} from={Math.round(l.start * fps)}>
          <Audio
            src={staticFile(
              `character-performer/kids/dialogue_v2/d${l.i}_${l.who}.wav`
            )}
          />
        </Sequence>
      ))}
      <Audio
        src={staticFile(`${DEMO}/k_bgm_v2.wav`)}
        volume={(f) => ip(f, [0, 30, 1130, 1220], [0, 0.25, 0.25, 0])}
      />
    </AbsoluteFill>
  );
};
