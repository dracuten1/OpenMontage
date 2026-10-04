// sc-12 — Ma cây, bão tố, rồi bọc trăm trứng.
// Narration order: gia đình ngăn cấm -> ma cây quấy phá -> bão tố gầm gào -> vượt qua -> bọc trăm trứng -> một trăm người con.
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkPath, Paper, Reveal, SourceTag, SpringPop, useFrac } from "../common";

const CX = 960;
const CY = 470;
const SEA_LIGHT = "#7FB3C4";

// phases (fractions of the scene)
const P_BAN = [0.03, 0.14] as const;
const P_TREE = [0.15, 0.3] as const;
const P_STORM = [0.32, 0.5] as const;
const P_PASS = [0.52, 0.6] as const;
const P_EGG = [0.62, 0.74] as const;
const P_KIDS = [0.8, 0.94] as const;

/** Wiggling branch polyline from (sx,sy) toward (ex,ey) with twigs. */
const branchPath = (sx: number, sy: number, ex: number, ey: number, seed: number, frame: number, tw: number) => {
  const N = 22;
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const w = Math.sin(t * 7 + seed * 2.1) * 26 + Math.sin(frame / 5 + t * 9 + seed) * tw * (0.4 + t);
    pts.push([sx + dx * t + nx * w, sy + dy * t + ny * w]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i <= N; i++) d += ` L ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
  // twigs
  [5, 9, 13, 17].forEach((k, j) => {
    const [px, py] = pts[k];
    const sgn = j % 2 === 0 ? 1 : -1;
    const tl = 70 - j * 10;
    const ang = Math.atan2(dy, dx) + sgn * 0.8 + Math.sin(frame / 6 + j + seed) * 0.15 * (tw / 6);
    d += ` M ${px.toFixed(1)} ${py.toFixed(1)} L ${(px + Math.cos(ang) * tl).toFixed(1)} ${(py + Math.sin(ang) * tl).toFixed(1)}`;
  });
  return d;
};

const BRANCHES: { sx: number; sy: number; ex: number; ey: number }[] = [
  { sx: 0, sy: 120, ex: 640, ey: 330 },
  { sx: 0, sy: 640, ex: 600, ey: 520 },
  { sx: 0, sy: 930, ex: 700, ey: 650 },
  { sx: 1920, sy: 140, ex: 1290, ey: 340 },
  { sx: 1920, sy: 620, ex: 1330, ey: 500 },
  { sx: 1920, sy: 940, ex: 1230, ey: 660 },
];

const spiralPath = (turns: number, rMax: number, phase: number) => {
  const N = 80;
  let d = "";
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = phase + t * turns * Math.PI * 2;
    const r = 30 + t * rMax;
    const x = CX + Math.cos(a) * r * 1.25;
    const y = CY + Math.sin(a) * r * 0.78;
    d += `${i === 0 ? "M" : " L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
};

const Pill: React.FC<{ text: string; start: number; color: string }> = ({ text, start, color }) => (
  <Reveal startFrac={start} endFrac={start + 0.06} dy={18}>
    <div
      style={{
        padding: "8px 22px",
        border: `2px solid ${color}`,
        borderRadius: 40,
        background: "rgba(26,23,20,0.85)",
        color,
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 30,
        letterSpacing: 2,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  </Reveal>
);

export const Sc12: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();

  const ban = ease(p(P_BAN[0], P_BAN[1]));
  const banFade = 1 - ease(p(P_TREE[1], P_STORM[0] + 0.05));
  const tree = ease(p(P_TREE[0], P_TREE[1]));
  const storm = ease(p(P_STORM[0], P_STORM[1]));
  const calm = ease(p(P_PASS[0], P_PASS[1] + 0.06)); // threats dissolve
  const threat = 1 - calm;
  const egg = ease(p(P_EGG[0], P_EGG[1]));
  const kids = p(P_KIDS[0], P_KIDS[1]);
  const jitter = (1 - calm) * 5;
  const pulse = 0.5 + 0.5 * Math.sin(frame / 12);
  const warmBg = ease(p(0.55, 0.78));

  return (
    <Paper>
      {/* warm light flooding in as the threats fall away */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${CX}px ${CY}px, rgba(217,164,65,${0.34 * warmBg}), rgba(217,164,65,0) 62%)`,
        }}
      />

      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* GIA ĐÌNH NGĂN CẤM: two opposed fronts + barrier */}
        <g opacity={banFade}>
          <InkPath d="M 560 250 L 560 700" startFrac={P_BAN[0]} endFrac={P_BAN[1]} stroke={C.warn} strokeWidth={8} />
          <InkPath d="M 1360 250 L 1360 700" startFrac={P_BAN[0]} endFrac={P_BAN[1]} stroke={C.warn} strokeWidth={8} />
          <InkPath d="M 560 470 L 1360 470" startFrac={P_BAN[0] + 0.03} endFrac={P_BAN[1]} stroke={C.warn} strokeWidth={5} style={{ strokeDasharray: "18 14" }} />
          <g opacity={ban} transform={`translate(${CX} ${CY}) scale(${0.7 + 0.3 * ban})`}>
            <path d="M -60 -60 L 60 60 M 60 -60 L -60 60" stroke={C.warn} strokeWidth={14} strokeLinecap="round" />
          </g>
        </g>

        {/* MA CÂY: ink branches writhe in from the margins */}
        <g opacity={threat * (tree > 0 ? 1 : 0)} style={{ transform: `translate(${Math.sin(frame * 1.7) * jitter * 0.4}px, ${Math.cos(frame * 2.1) * jitter * 0.4}px)` }}>
          {BRANCHES.map((b, i) => (
            <InkPath
              key={i}
              d={branchPath(b.sx, b.sy, b.ex, b.ey, i + 1, frame, 6 + jitter)}
              startFrac={P_TREE[0] + i * 0.012}
              endFrac={P_TREE[1]}
              stroke={C.cream}
              strokeWidth={6}
            />
          ))}
          {BRANCHES.map((b, i) => (
            <circle key={`e${i}`} cx={b.ex} cy={b.ey} r={7 + Math.sin(frame / 4 + i) * 2} fill={C.amber} opacity={tree * 0.8} />
          ))}
        </g>

        {/* BÃO TỐ: whirling spirals + wind streaks */}
        <g opacity={threat * storm}>
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={spiralPath(2.2, 430, frame / 20 + (i * Math.PI * 2) / 3)}
              fill="none"
              stroke={SEA_LIGHT}
              strokeWidth={5 - i}
              strokeLinecap="round"
              opacity={0.85 - i * 0.18}
            />
          ))}
          {Array.from({ length: 12 }).map((_, i) => {
            const y = 120 + random(`wy${i}`) * 820;
            const sp = 14 + random(`ws${i}`) * 14;
            const x = ((frame * sp + random(`wx${i}`) * 2200) % 2300) - 200;
            const l = 120 + random(`wl${i}`) * 160;
            return (
              <path
                key={i}
                d={`M ${x} ${y} q ${l / 4} -14 ${l / 2} 0 t ${l / 2} 0`}
                fill="none"
                stroke={C.cream}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.5}
              />
            );
          })}
        </g>

        {/* VƯỢT QUA: ring of light bursts outward */}
        {[0, 1].map((i) => {
          const t = p(P_PASS[0] + i * 0.03, P_PASS[1] + 0.12 + i * 0.03);
          return (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={40 + t * 640}
              fill="none"
              stroke={C.amber}
              strokeWidth={6 * (1 - t) + 1}
              opacity={t > 0 && t < 1 ? 0.9 * (1 - t) : 0}
            />
          );
        })}

        {/* BỌC TRĂM TRỨNG */}
        <defs>
          <radialGradient id="s12egg" cx="40%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#F7D98B" />
            <stop offset="55%" stopColor={C.amber} />
            <stop offset="100%" stopColor="#8A5E1E" />
          </radialGradient>
        </defs>
        <g transform={`translate(${CX} ${CY}) scale(${0.3 + 0.7 * egg})`} opacity={egg}>
          <ellipse rx={150 + pulse * 18} ry={190 + pulse * 18} fill="rgba(217,164,65,0.18)" />
          <ellipse rx={104} ry={134} fill="url(#s12egg)" stroke={C.cream} strokeWidth={4} />
          <path d="M -50 -20 q 25 -22 50 0 t 50 0 M -60 28 q 30 -22 60 0 t 60 0" fill="none" stroke="#6B4814" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
          <ellipse cx={-34} cy={-52} rx={16} ry={28} fill="rgba(255,255,255,0.35)" transform="rotate(20 -34 -52)" />
        </g>

        {/* light particles dissolving around the egg */}
        {Array.from({ length: 40 }).map((_, i) => {
          const a = random(`pa${i}`) * Math.PI * 2;
          const sp = 0.5 + random(`ps${i}`) * 0.9;
          const ph = random(`pp${i}`);
          const t = ((p(P_EGG[0], 0.9) * 2.2 * sp + ph) % 1);
          const r = 130 + t * (180 + random(`pr${i}`) * 140);
          const vis = p(P_EGG[0], P_EGG[0] + 0.04);
          return (
            <circle
              key={i}
              cx={CX + Math.cos(a) * r}
              cy={CY + Math.sin(a) * r * 1.1}
              r={3 + random(`pz${i}`) * 4}
              fill={C.amber}
              opacity={(1 - t) * 0.9 * vis}
            />
          );
        })}

        {/* MỘT TRĂM NGƯỜI CON: 100 dots in a golden-angle spiral */}
        {Array.from({ length: 100 }).map((_, i) => {
          const f = i / 99;
          const a = i * 2.39996;
          const r = 190 + 230 * Math.sqrt(f);
          const t = ease(Math.max(0, Math.min(1, kids * 1.5 - f * 0.5)));
          const tw = 0.75 + 0.25 * Math.sin(frame / 9 + i);
          return (
            <circle
              key={i}
              cx={CX + Math.cos(a) * r * 1.2}
              cy={CY + Math.sin(a) * r * 0.82}
              r={4 + 7 * t}
              fill="#F7D98B"
              opacity={t * tw}
              style={{ filter: "drop-shadow(0 0 6px rgba(217,164,65,0.9))" }}
            />
          );
        })}
      </svg>

      {/* stage chips follow the narration */}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 110,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Pill text="NGĂN CẤM" start={P_BAN[0]} color={C.warn} />
        <Pill text="MA CÂY" start={P_TREE[0]} color={C.cream} />
        <Pill text="BÃO TỐ" start={P_STORM[0]} color={SEA_LIGHT} />
        <Pill text="VƯỢT QUA" start={P_PASS[0]} color={C.amber} />
        <Pill text="BỌC TRĂM TRỨNG" start={P_EGG[0]} color={C.amber} />
        <Pill text="100 NGƯỜI CON" start={P_KIDS[0]} color={C.white} />
      </div>

      <SpringPop startFrac={P_EGG[0]} from={0.6} style={{ position: "absolute", top: 64, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.amber }}>Thần Nông sinh ra bọc trăm trứng</div>
      </SpringPop>
      <SourceTag text="Truyện Việt cổ — sự tích Thần Nông – Thần Rồng" />
    </Paper>
  );
};
