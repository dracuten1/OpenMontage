// sc-02 — Hero animation: glowing amber egg between a wave stream (Rồng, below) and a cloud stream (Tiên, above).
// Order follows narration: mist clears -> bọc trứng -> Lạc Long Quân (waves) -> Âu Cơ (clouds).
import React from "react";
import { random } from "remotion";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, Reveal, useFrac } from "../common";

const CX = 960;
const CY = 520;
const RX = 190;
const RY = 245;

const eggPath = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx} ${cy - ry} C ${cx + rx * 0.55} ${cy - ry}, ${cx + rx} ${cy - ry * 0.45}, ${cx + rx} ${cy + ry * 0.15} C ${cx + rx} ${cy + ry * 0.65}, ${cx + rx * 0.55} ${cy + ry}, ${cx} ${cy + ry} C ${cx - rx * 0.55} ${cy + ry}, ${cx - rx} ${cy + ry * 0.65}, ${cx - rx} ${cy + ry * 0.15} C ${cx - rx} ${cy - ry * 0.45}, ${cx - rx * 0.55} ${cy - ry}, ${cx} ${cy - ry} Z`;

const wavePath = (base: number, amp: number, k: number, phase: number, amp2: number, k2: number, phase2: number) => {
  let d = "";
  for (let x = -40; x <= 1960; x += 40) {
    const y = base + amp * Math.sin(x * k + phase) + amp2 * Math.sin(x * k2 + phase2);
    d += `${x === -40 ? "M" : "L"} ${x} ${y.toFixed(1)} `;
  }
  return d;
};

const CLOUD = "M10 90 C-12 90 -12 55 25 52 C20 20 70 5 95 30 C110 5 165 5 175 40 C215 30 245 62 220 90 Z";
const SWIRL = "M175 40 C198 34 208 58 190 64";

export const Sc02: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();

  const mist = 1 - ease(p(0.04, 0.42));
  const eggIn = ease(p(0.14, 0.34));
  const breath = 1 + 0.025 * Math.sin(frame * 0.08);
  const pulse = 0.55 + 0.25 * Math.sin(frame * 0.08 - 0.6);
  const streamIn = ease(p(0.34, 0.56));

  // small "hundred eggs" inside the bọc (rejection-sampled, deterministic)
  const inner: { x: number; y: number; ph: number; r: number }[] = [];
  for (let i = 0; inner.length < 34 && i < 400; i++) {
    const x = (random(`ie-x-${i}`) * 2 - 1) * 0.82;
    const y = (random(`ie-y-${i}`) * 2 - 1) * 0.82;
    if (x * x + y * y < 0.7) inner.push({ x, y, ph: random(`ie-p-${i}`) * 6.28, r: 11 + random(`ie-r-${i}`) * 7 });
  }

  // amber motes
  const motes = Array.from({ length: 70 }, (_, i) => {
    const x = random(`m-x-${i}`) * 1920;
    const y0 = random(`m-y-${i}`) * 1080;
    const sp = 0.3 + random(`m-s-${i}`) * 0.8;
    const r = 1.8 + random(`m-r-${i}`) * 3.6;
    const ph = random(`m-p-${i}`) * 6.28;
    const y = (((y0 - frame * sp) % 1080) + 1080) % 1080;
    const a = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(frame * 0.09 + ph));
    return <circle key={i} cx={x + Math.sin(frame * 0.025 + ph) * 18} cy={y} r={r} fill="#F2C86B" opacity={a * ease(p(0.1, 0.3))} />;
  });

  // mist puffs scatter outward from the centre
  const puffs = Array.from({ length: 11 }, (_, i) => {
    const ang = random(`mist-a-${i}`) * 6.28;
    const dist0 = 40 + random(`mist-d-${i}`) * 180;
    const grow = ease(p(0.04, 0.42));
    const dist = dist0 + grow * (520 + random(`mist-g-${i}`) * 420);
    const r = 190 + random(`mist-r-${i}`) * 150;
    return (
      <circle
        key={i}
        cx={CX + Math.cos(ang) * dist}
        cy={CY + Math.sin(ang) * dist * 0.7}
        r={r}
        fill="url(#mistGrad)"
        opacity={mist * 0.9}
      />
    );
  });

  // wave stream (Rồng) — three layers
  const waves = [
    { base: 880, a: 26, k: 0.006, ph: frame * 0.045, a2: 12, k2: 0.013, ph2: frame * 0.03, fill: "rgba(47,93,107,0.55)", sw: 3 },
    { base: 925, a: 30, k: 0.0052, ph: -frame * 0.04 + 1.5, a2: 14, k2: 0.011, ph2: frame * 0.025, fill: "rgba(47,93,107,0.8)", sw: 3 },
    { base: 985, a: 24, k: 0.007, ph: frame * 0.05 + 3, a2: 10, k2: 0.016, ph2: -frame * 0.035, fill: "rgba(30,60,72,0.95)", sw: 3 },
  ];

  // cloud stream (Tiên) — two parallax rows wrapping
  const clouds = (row: number, y: number, speed: number, scale: number, n: number, alpha: number) =>
    Array.from({ length: n }, (_, i) => {
      const span = n * 330;
      const x = ((((i * 330 + frame * speed + row * 140) % span) + span) % span) - 300;
      const yy = y + Math.sin(frame * 0.02 + i * 1.7 + row) * 14;
      return (
        <g key={`${row}-${i}`} transform={`translate(${x} ${yy}) scale(${scale})`}>
          <path d={CLOUD} fill={`rgba(232,220,200,${alpha})`} stroke={C.cream} strokeWidth={3 / scale} strokeLinejoin="round" />
          <path d={SWIRL} fill="none" stroke={C.cream} strokeWidth={3 / scale} strokeLinecap="round" />
        </g>
      );
    });

  const haloR = 330 + 40 * Math.sin(frame * 0.08);

  return (
    <Paper>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="eggGrad" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#FBE4A3" />
            <stop offset="45%" stopColor={C.amber} />
            <stop offset="100%" stopColor="#7A5216" />
          </radialGradient>
          <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(242,200,107,0.55)" />
            <stop offset="55%" stopColor="rgba(217,164,65,0.18)" />
            <stop offset="100%" stopColor="rgba(217,164,65,0)" />
          </radialGradient>
          <radialGradient id="mistGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(232,220,200,0.55)" />
            <stop offset="100%" stopColor="rgba(232,220,200,0)" />
          </radialGradient>
          <linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(232,220,200,0.12)" />
            <stop offset="100%" stopColor="rgba(232,220,200,0)" />
          </linearGradient>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        <rect x={0} y={0} width={1920} height={380} fill="url(#skyFade)" opacity={streamIn} />

        {/* Tiên: cloud stream above (slides down into place) */}
        <g opacity={streamIn} transform={`translate(0 ${(1 - streamIn) * -160})`}>
          {clouds(0, 70, 0.7, 1.15, 8, 0.1)}
          {clouds(1, 190, -0.45, 0.8, 9, 0.07)}
        </g>

        {/* halo + egg */}
        <g opacity={0.35 + 0.65 * eggIn}>
          <circle cx={CX} cy={CY} r={haloR} fill="url(#haloGrad)" opacity={pulse} />
          <g transform={`translate(${CX} ${CY}) scale(${(0.82 + 0.18 * eggIn) * breath}) translate(${-CX} ${-CY})`}>
            <path d={eggPath(CX, CY, RX + 18, RY + 18)} fill="rgba(242,200,107,0.35)" filter="url(#soft)" opacity={pulse + 0.2} />
            <path d={eggPath(CX, CY, RX, RY)} fill="url(#eggGrad)" stroke="#FBE4A3" strokeWidth={4} />
            {inner.map((e, i) => {
              const tw = 0.5 + 0.5 * Math.sin(frame * 0.07 + e.ph);
              return (
                <ellipse
                  key={i}
                  cx={CX + e.x * RX}
                  cy={CY + e.y * RY}
                  rx={e.r * 0.8}
                  ry={e.r}
                  fill={`rgba(255,244,214,${0.16 + 0.3 * tw})`}
                  stroke="rgba(122,82,22,0.7)"
                  strokeWidth={2}
                />
              );
            })}
            <ellipse cx={CX - 52} cy={CY - 90} rx={30} ry={52} fill="rgba(255,255,255,0.28)" transform={`rotate(-18 ${CX - 52} ${CY - 90})`} />
          </g>
        </g>

        {/* mist (clears from the centre outward) */}
        {puffs}

        {/* Rồng: wave stream below (rises into place) */}
        <g opacity={streamIn} transform={`translate(0 ${(1 - streamIn) * 200})`}>
          {waves.map((w, i) => {
            const d = wavePath(w.base, w.a, w.k, w.ph, w.a2, w.k2, w.ph2);
            return (
              <g key={i}>
                <path d={`${d} L 1960 1100 L -40 1100 Z`} fill={w.fill} />
                <path d={d} fill="none" stroke={C.cream} strokeWidth={w.sw} opacity={0.55 - i * 0.12} strokeLinecap="round" />
              </g>
            );
          })}
        </g>

        {motes}
      </svg>

      {/* labels: Lạc Long Quân (below) is named first, then Âu Cơ (above) */}
      <Reveal startFrac={0.58} endFrac={0.7} style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 46,
            color: C.white,
            padding: "8px 34px",
            background: "rgba(26,23,20,0.78)",
            border: `2px solid ${C.sea}`,
            borderRadius: 8,
            textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          }}
        >
          Lạc Long Quân · Rồng
        </span>
      </Reveal>
      <Reveal startFrac={0.72} endFrac={0.84} style={{ position: "absolute", left: 0, right: 0, top: 56, textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 46,
            color: C.white,
            padding: "8px 34px",
            background: "rgba(26,23,20,0.78)",
            border: `2px solid ${C.cream}`,
            borderRadius: 8,
            textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          }}
        >
          Âu Cơ · Tiên
        </span>
      </Reveal>
    </Paper>
  );
};
