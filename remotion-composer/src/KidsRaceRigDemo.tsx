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
import regJson from "../public/character-performer/kids/remake/reg.json";

// ---------------------------------------------------------------------------
// KidsRaceRigDemo — Ep.01 bone-rig RACE SHOT demo comp (demo-gate, Phase B
// 2026-10-14). Dual-character sprint on the bg6 S-curve: bone-rig rabbit run
// cycle (rig_demo, 108 frames) leading the bone-rig turtle diagonal walk
// (rig_turtle render-3, 97 frames). Comp t=0 == episode t=17.49 (approved V2
// S4 window).
//
// FIX5 rules honored: camera absolutely static (bg6 cover-fit, no zoom/pan/
// Ken Burns — Img at constant scale 1.0, no camera wrapper); sprite height
// ramps are depth movement only (rabbit 400->170, turtle 205->120); all
// frames closed-mouth; opacity ramps are fade-IN ONLY at shot start (never a
// whole-sprite crossfade); stride frames swap at native 24fps timing (hard
// swap, no blend). Pure function of frame — no Math.random / Date / CSS
// animation. Every interpolate() input range is strictly increasing.
//
// Sprite pin math copied from KidsStoryEp1V2 Sprite (bottom-center pin):
//   imgH = H/chf, imgW = imgH*(w/h), left = x - imgW*cx, top = y - imgH*b;
//   shadow w = 0.72*contentW (imgW*cwf*0.72), rgba(30,25,20,0.28), blur 8.
// ---------------------------------------------------------------------------

const FPS = 30;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ip = (v: number, rng: number[], out: number[]) =>
  interpolate(v, rng, out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
// V2 polyLerp: p in [0,1] across equal-duration keyframe segments,
// easeOutCubic inside each segment.
const polyLerp = (ks: number[], p: number): number => {
  const n = ks.length - 1;
  const u = clamp01(p) * n;
  const i = Math.min(n - 1, Math.floor(u));
  const e = 1 - Math.pow(1 - (u - i), 3);
  return ks[i] + (ks[i + 1] - ks[i]) * e;
};

// reg entries (V2 Sprite field semantics; fractions of the image box)
type Reg = {
  w: number;
  h: number;
  t: number;
  b: number;
  cx: number;
  chf: number;
  cwf: number;
};
const REGALL = regJson as Record<string, Reg>;
const REG = {
  rig_rabbit_run: REGALL.rig_rabbit_run,
  rig_turtle_walk: REGALL.rig_turtle_walk,
};

const frameFile = (dir: string, idx: number) =>
  staticFile(
    `character-performer/kids/remake/${dir}/f${String(idx).padStart(4, "0")}.png`,
  );

// single-frame Sprite with the V2 bottom-center pin + soft ellipse shadow
const Sprite: React.FC<{
  src: string;
  g: Reg;
  x: number;
  y: number;
  H: number;
  opacity?: number;
}> = ({ src, g, x, y, H, opacity = 1 }) => {
  const imgH = H / g.chf;
  const imgW = imgH * (g.w / g.h);
  const left = x - imgW * g.cx;
  const top = y - imgH * g.b;
  const sw = imgW * g.cwf * 0.72; // shadow width ~0.72x content width
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: imgW,
        height: imgH,
        opacity,
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
        src={src}
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

// bg6 road centerline (viewport px) — same track as V2 d4. FIX1 (2026-10-14):
// lanes widened for horizontal separation (was turtle -55 / rabbit +40 —
// Hermes QC: rabbit covered turtle's head, depth ambiguous). Path is
// near-vertical so lanes carry the separation: turtle -135, rabbit +95.
// Turtle uT cap 0.72 -> 0.62 (slower path progress). Both sprites already
// face RIGHT — no mirroring.
const X = [556, 524, 508, 572, 540];
const Y = [972, 810, 648, 518, 400];
const TUR_X = X.map((v) => v - 135);
const RAB_X = X.map((v) => v + 95);

export const KidsRaceRigDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // turtle (rear, left lane): 24fps hard-swap walk frames, clamped 1..97.
  // FIX1: uT cap 0.62 (was 0.72) — turtle stays lower on the path.
  const tIdx = Math.min(97, Math.max(1, 1 + Math.floor(t * 24)));
  const uT = 0.62 * clamp01(t / 3.4);
  const tX = polyLerp(TUR_X, uT);
  const tY = polyLerp(Y, uT);
  const tH = ip(uT, [0, 1], [205, 120]);
  const tOp = ip(t, [0, 0.2], [0, 1]);

  // rabbit (leader, right lane): starts 0.30s ahead-clock, no loop, 1..108
  const rIdx = Math.min(108, Math.max(1, 1 + Math.floor((t - 0.3) * 24)));
  const u4 = clamp01((t - 0.3) / 3.0);
  const rX = polyLerp(RAB_X, u4);
  const rY = polyLerp(Y, u4);
  const rH = ip(u4, [0, 1], [400, 170]);
  const rOp = ip(t, [0, 0.21], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#241c16" }}>
      {/* bg6 cover-fit — camera absolutely static: constant scale 1.0, no
          pan/zoom/Ken Burns, no camera wrapper (same geometry as V2) */}
      <div
        style={{
          position: "absolute",
          left: -270,
          top: 0,
          width: 1620,
          height: 1080,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile("character-performer/kids/ep1_v2/bg6_walk.png")}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1620,
            height: 1080,
          }}
        />
      </div>

      {/* turtle rendered BEFORE rabbit (rear lane, behind the leader) */}
      <Sprite
        src={frameFile("rig_turtle_walk", tIdx)}
        g={REG.rig_turtle_walk}
        x={tX}
        y={tY}
        H={tH}
        opacity={tOp}
      />
      <Sprite
        src={frameFile("rig_rabbit_run", rIdx)}
        g={REG.rig_rabbit_run}
        x={rX}
        y={rY}
        H={rH}
        opacity={rOp}
      />

      {/* audio: d4 rabbit line at comp t=0.30s; BGM bed from episode offset
          17.49s, looped at 0.30 volume. NOTE: k_bgm_v2.wav measures exactly
          17.500s = 525 frames @30fps, so startFrom={525} leaves 0 frames and
          Remotion's <Loop> rejects durationInFrames=0 (render RC=1, measured
          2026-10-14). Trimmed to 524 (17.4667s) — closest representable
          non-degenerate offset; audible delta vs spec = 1 frame (33ms) of the
          17.5s loop bed, which then loops from position 0 as at episode
          t=17.49. */}
      <Sequence from={9}>
        <Audio
          src={staticFile("character-performer/kids/dialogue_v2/d4_rabbit.wav")}
        />
      </Sequence>
      <Audio
        src={staticFile("character-performer/kids/k_bgm_v2.wav")}
        volume={0.3}
        startFrom={524}
        loop
      />
    </AbsoluteFill>
  );
};
