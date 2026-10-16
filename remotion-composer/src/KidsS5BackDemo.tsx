import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const KP = "character-performer/kids";

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
  turtle_back_m0: { w: 1407, h: 1021, t: 0.0098, b: 0.9902, cx: 0.4826, chf: 0.9804, cwf: 0.6326 },
  turtle_back_w1: { w: 1407, h: 1021, t: 0.047, b: 0.9912, cx: 0.4826, chf: 0.9442, cwf: 0.6326 },
  turtle_back_w3: { w: 1448, h: 1086, t: 0.047, b: 0.953, cx: 0.4834, chf: 0.9061, cwf: 0.6354 },
  turtle_back_walk2: { w: 1448, h: 1086, t: 0.0092, b: 0.9521, cx: 0.4827, chf: 0.9429, cwf: 0.6354 },
  rabbit_sleeping: { w: 1536, h: 1024, t: 0.16797, b: 0.83105, cx: 0.50326, chf: 0.66406, cwf: 0.58789 },
  tree_clean: { w: 1223, h: 1286, t: 0.0, b: 0.9938, cx: 0.4996, chf: 0.9938, cwf: 0.9992 },
};

const SRC: Record<string, string> = {
  turtle_back_m0: `${KP}/sprite_lib/turtle/turtle_back_m0.png`,
  turtle_back_w1: `${KP}/sprite_lib/turtle/turtle_back_w1.png`,
  turtle_back_w3: `${KP}/sprite_lib/turtle/turtle_back_w3.png`,
  turtle_back_walk2: `${KP}/sprite_lib/turtle/turtle_back_walk2.png`,
  rabbit_sleeping: `${KP}/sprite_lib/rabbit/rabbit_sleeping_v2.png`,
  tree_clean: `${KP}/remake/tree_clean.png`,
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const easeInOutQuad = (u: number) =>
  u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

// Linear polyline interpolation over equal segments: u in [0,1] -> vals[0..n].
const polyLin = (vals: number[], u: number) => {
  const n = vals.length - 1;
  const uu = clamp01(u) * n;
  const i = Math.min(Math.floor(uu), n - 1);
  return lerp(vals[i], vals[i + 1], uu - i);
};

// interpolate() with clamped extrapolation.
const ip = (t: number, xs: number[], ys: number[]) =>
  interpolate(t, xs, ys, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// Standard sprite: content height H pinned at content bottom-center (x, y).
const Sprite: React.FC<{
  k: string;
  x: number;
  y: number;
  H: number;
  shadow?: boolean;
  transform?: string;
}> = ({ k, x, y, H, shadow = true, transform }) => {
  const g = REG[k];
  const imgH = H / g.chf;
  const imgW = imgH * (g.w / g.h);
  const left = x - imgW * g.cx;
  const top = y - imgH * g.b;
  const sw = imgW * g.cwf * 0.72;
  const shOp = 0.1 + 0.15 * clamp01((H - 60) / 560);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: imgW,
        height: imgH,
        transform,
        transformOrigin: `${g.cx * 100}% ${g.b * 100}%`,
      }}
    >
      {shadow ? (
        <div
          style={{
            position: "absolute",
            left: (imgW - sw) / 2,
            top: imgH * g.b - sw * 0.09,
            width: sw,
            height: sw * 0.18,
            borderRadius: "50%",
            background: `rgba(30,25,20,${shOp})`,
            filter: "blur(8px)",
          }}
        />
      ) : null}
      <Img
        src={staticFile(SRC[k])}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

// Turtle exception: shared content scale S = H / 1002 (m0 content height in
// source px) across gait frames, so the generated body-dip frames read as a
// real vertical bob. Feet stay pinned; head-height undulation is intended.
const TurtleSprite: React.FC<{
  k: string;
  x: number;
  y: number;
  H: number;
  waddle: number;
}> = ({ k, x, y, H, waddle }) => {
  const g = REG[k];
  const S = H / 1002;
  const imgH = S * g.h;
  const imgW = S * g.w;
  const left = x - imgW * g.cx;
  const top = y - imgH * g.b;
  const sw = imgW * g.cwf * 0.72;
  const shOp = 0.1 + 0.15 * clamp01((H - 60) / 560);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: imgW,
        height: imgH,
        transform: `translateY(0) rotate(${waddle}deg)`,
        transformOrigin: `${g.cx * 100}% ${g.b * 100}%`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: (imgW - sw) / 2,
          top: imgH * g.b - sw * 0.09,
          width: sw,
          height: sw * 0.18,
          borderRadius: "50%",
          background: `rgba(30,25,20,${shOp})`,
          filter: "blur(8px)",
        }}
      />
      <Img
        src={staticFile(SRC[k])}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export const KidsS5BackDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Rabbit breathing (3s cycle), pinned at the feet.
  const bs = Math.sin((t * 2 * Math.PI) / 3);
  const rabbitTransform = `scaleX(${1 - 0.004 * bs}) scaleY(${1 + 0.008 * bs})`;

  // Turtle walk: local t in [0, 5.7), then hold to 6.6s at the final point.
  const WALK_END = 5.7;
  const walking = t < WALK_END;
  const u = easeInOutQuad(clamp01(t / WALK_END));
  const tx = polyLin([610, 508, 445, 510, 430, 250], u);
  const ty = polyLin([950, 810, 680, 540, 430, 355], u);
  const tH = polyLin([290, 232, 185, 140, 98, 60], u);
  const GAIT = [
    "turtle_back_m0",
    "turtle_back_w1",
    "turtle_back_walk2",
    "turtle_back_w3",
  ];
  const tKey = walking ? GAIT[Math.floor((t * 30) / 8) % 4] : "turtle_back_m0";
  const waddle = walking ? 2.5 * Math.sin((t * 2 * Math.PI) / 1.15) : 0;

  const bgmVol = ip(t, [6.3, 6.6], [0.25, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* 1. BG — static, no transform, no animation */}
      <div style={{ position: "absolute", left: -270, top: 0, width: 1620, height: 1080 }}>
        <Img
          src={staticFile(`${KP}/remake/bg_d5_back.png`)}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      {/* 2. Tree */}
      <Sprite k="tree_clean" x={870} y={685} H={620} shadow={false} />
      {/* 3. Sleeping rabbit */}
      <Sprite
        k="rabbit_sleeping"
        x={830}
        y={759.7}
        H={175}
        transform={rabbitTransform}
      />
      {/* 4. Turtle beat — the only path-moving element */}
      <TurtleSprite k={tKey} x={tx} y={ty} H={tH} waddle={waddle} />
      {/* 5. FG strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 300,
          overflow: "hidden",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 55%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 55%)",
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
      {/* 6. Warm tint */}
      <AbsoluteFill
        style={{ background: "rgba(255,150,60,0.12)", mixBlendMode: "multiply" }}
      />
      <Audio src={staticFile(`${KP}/dialogue_v2/d5_turtle.wav`)} />
      <Audio src={staticFile(`${KP}/k_bgm_v2.wav`)} volume={bgmVol} loop />
    </AbsoluteFill>
  );
};
