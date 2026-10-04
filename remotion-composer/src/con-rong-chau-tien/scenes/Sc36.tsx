import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkPath, Paper, Reveal, useFrac } from "../common";

// sc-36 — emotional peak. Narration order (s18): bọc thai sinh học -> dân gian hóa thành bọc trăm trứng
// (100 trứng, 100 người con) -> tình đồng bào -> "không phải khẩu hiệu, mà là lời nhắc về nguồn gốc sinh học chung".

const ovalPath = (rx: number, ry: number) =>
  `M ${-rx} 0 A ${rx} ${ry} 0 1 1 ${rx} 0 A ${rx} ${ry} 0 1 1 ${-rx} 0`;

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

const STAGES = [
  { x: 360, label: "Bọc thai sinh học", start: 0.04 },
  { x: 960, label: "Bọc trăm trứng", start: 0.3 },
  { x: 1560, label: "Tình đồng bào", start: 0.5 },
];
const CY = 340;

export const Sc36: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { frame, p } = useFrac(durationInFrames);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 16);
  const slow = frame / 60;

  // stage 1: amniotic sac
  const s1 = ease(p(0.04, 0.16));
  // stage 2: 100 pearls bloom out of one centre
  const bloom = ease(p(0.32, 0.5));
  // stage 3: ring of people linked, threads converge
  const s3 = ease(p(0.5, 0.64));
  const converge = ease(p(0.52, 0.7));

  const arrow1 = ease(p(0.2, 0.3));
  const arrow2 = ease(p(0.44, 0.52));

  const headline = ease(p(0.76, 0.88));
  const headline2 = ease(p(0.86, 0.95));
  const warm = ease(p(0.5, 0.95));

  const figs = 10;
  return (
    <Paper>
      {/* warm light that spreads across the frame as the idea lands */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 38%, rgba(217,164,65,${0.05 + 0.2 * warm + 0.03 * pulse}) 0%, rgba(217,164,65,0) 62%)`,
        }}
      />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* arrows */}
        <g opacity={arrow1}>
          <path d="M 560 340 L 740 340 M 715 318 L 745 340 L 715 362" stroke={C.amber} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g opacity={arrow2}>
          <path d="M 1160 340 L 1340 340 M 1315 318 L 1345 340 L 1315 362" stroke={C.amber} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* stage 1: bọc thai */}
        <g transform={`translate(${STAGES[0].x} ${CY})`}>
          <circle r={190 + 14 * pulse} fill={`rgba(217,164,65,${0.07 * s1})`} />
          <InkPath d={ovalPath(150, 176)} startFrac={0.04} endFrac={0.16} stroke={C.amber} strokeWidth={5} />
          <InkPath d={ovalPath(124, 150)} startFrac={0.08} endFrac={0.18} stroke={C.cream} strokeWidth={3} style={{ opacity: 0.7 }} />
          <g opacity={s1} transform={`scale(${1 + 0.03 * pulse})`}>
            <path
              d="M -20 -80 C 50 -90 80 -20 40 30 C 10 70 -50 60 -60 20 C -70 -20 -30 -30 -10 -10 C 10 10 -10 30 -25 15"
              stroke={C.cream}
              strokeWidth={5}
              fill="rgba(232,220,200,0.12)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* stage 2: bọc trăm trứng — 100 pearls from one centre */}
        <g transform={`translate(${STAGES[1].x} ${CY})`}>
          <circle r={190 + 14 * pulse} fill={`rgba(217,164,65,${0.08 * bloom})`} />
          <InkPath d={ovalPath(150, 180)} startFrac={0.3} endFrac={0.4} stroke={C.amber} strokeWidth={5} />
          {Array.from({ length: 100 }).map((_, i) => {
            const rr = Math.sqrt((i + 0.5) / 100);
            const a = i * GOLDEN + slow * 0.4;
            const born = ease(p(0.33 + (i / 100) * 0.12, 0.38 + (i / 100) * 0.12));
            const R = rr * 128;
            const x = Math.cos(a) * R * 1.0 * (0.85 + 0.15 * born);
            const y = Math.sin(a) * R * 1.15 * (0.85 + 0.15 * born);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={4 + 2.4 * born + (i % 7 === 0 ? 0.8 * pulse : 0)}
                fill={C.amber}
                opacity={born * (0.55 + 0.45 * ((i % 5) / 4))}
              />
            );
          })}
          <circle r={10 + 5 * pulse} fill={C.white} opacity={bloom} />
        </g>

        {/* stage 3: tình đồng bào — people in a ring, threads converge to the centre */}
        <g transform={`translate(${STAGES[2].x} ${CY})`}>
          <circle r={190 + 14 * pulse} fill={`rgba(217,164,65,${0.1 * s3})`} />
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2 + slow * 0.3;
            const r0 = 188;
            const r1 = 188 * (1 - 0.88 * converge);
            return (
              <line
                key={i}
                x1={Math.cos(a) * r0}
                y1={Math.sin(a) * r0}
                x2={Math.cos(a) * r1}
                y2={Math.sin(a) * r1}
                stroke={C.amber}
                strokeWidth={2.5}
                opacity={0.5 * s3}
                strokeLinecap="round"
              />
            );
          })}
          <circle r={96} fill="none" stroke={C.amber} strokeWidth={4} opacity={s3} strokeDasharray="10 12" strokeDashoffset={-frame * 0.8} />
          <g transform={`rotate(${slow * 6})`} opacity={s3}>
            {Array.from({ length: figs }).map((_, i) => {
              const a = (i / figs) * 360;
              return (
                <g key={i} transform={`rotate(${a}) translate(0 -150)`}>
                  <circle cx={0} cy={-14} r={11} fill={C.cream} />
                  <path d="M -14 22 Q 0 -4 14 22 Z" fill={C.cream} />
                  {/* clasped hands: arcs towards next figure */}
                  <path d="M 14 8 Q 36 -2 46 8" stroke={C.amber} strokeWidth={3.5} fill="none" strokeLinecap="round" />
                </g>
              );
            })}
          </g>
          <circle r={14 + 6 * pulse} fill={C.white} opacity={converge} />
        </g>
      </svg>

      {/* stage labels, in narration order */}
      {STAGES.map((s, i) => {
        const t = ease(p(s.start, s.start + 0.08));
        return (
          <div
            key={s.label}
            style={{
              position: "absolute",
              left: s.x - 280,
              width: 560,
              top: 560,
              textAlign: "center",
              opacity: t,
              transform: `translateY(${(1 - t) * 20}px)`,
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 40,
              color: i === 2 ? C.amber : C.cream,
            }}
          >
            {s.label}
          </div>
        );
      })}

      {/* headline */}
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 690,
          textAlign: "center",
        }}
      >
        <div
          style={{
            opacity: headline,
            transform: `scale(${0.94 + 0.06 * headline})`,
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 76,
            lineHeight: 1.15,
            color: C.white,
          }}
        >
          “Đồng bào” không phải là khẩu hiệu
        </div>
        <div
          style={{
            opacity: headline2,
            transform: `translateY(${(1 - headline2) * 24}px)`,
            marginTop: 22,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 58,
            lineHeight: 1.2,
            color: C.amber,
          }}
        >
          mà là lời nhắc về nguồn gốc sinh học chung
        </div>
      </div>
    </Paper>
  );
};
