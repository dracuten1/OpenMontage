// sc-20 — Bách tử quy tâm: 100 tia sáng bình đẳng, lời hẹn ước.
// Narration order: 50 theo cha xuống biển / 50 theo mẹ lên núi, vẫn anh em chung ruột rà -> hẹn ước "hữu sự báo cho nhau" -> triết lý bình đẳng hiếm hoi.
import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, SourceTag, useFrac } from "../common";

const CX = 960;
const CY = 500;
const R = 330;
const SEA_LIGHT = "#7FB3C4";
const N = 100;

const pt = (i: number, r = R) => {
  const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r] as const;
};

export const Sc20: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const burst = ease(p(0.02, 0.2));
  const net = ease(p(0.2, 0.34));
  const split = ease(p(0.34, 0.46));
  const split2 = ease(p(0.4, 0.5));
  const oath = ease(p(0.54, 0.66));
  const fin = ease(p(0.8, 0.9));
  const glow = 0.5 + 0.5 * Math.sin(frame / 14);
  const rot = frame * 0.08;

  return (
    <Paper>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="s20halo">
            <stop offset="0" stopColor="rgba(217,164,65,0.55)" />
            <stop offset="1" stopColor="rgba(217,164,65,0)" />
          </radialGradient>
          <radialGradient id="s20egg" cx="40%" cy="35%" r="75%">
            <stop offset="0" stopColor="#F7D98B" />
            <stop offset="0.55" stopColor={C.amber} />
            <stop offset="1" stopColor="#8A5E1E" />
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r={R + 140 + glow * 20} fill="url(#s20halo)" opacity={0.5 * burst} />

        <g transform={`rotate(${rot} ${CX} ${CY})`}>
          {/* ring */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.amber} strokeWidth={2} opacity={0.3 * net} />
          {/* 100 equal rays */}
          {Array.from({ length: N }).map((_, i) => {
            const [x, y] = pt(i);
            const [x0, y0] = pt(i, 70);
            const k = ease(p(0.02 + (i / N) * 0.08, 0.14 + (i / N) * 0.08));
            const ex = x0 + (x - x0) * k;
            const ey = y0 + (y - y0) * k;
            return <line key={i} x1={x0} y1={y0} x2={ex} y2={ey} stroke={C.amber} strokeWidth={2.5} opacity={0.55 * k} strokeLinecap="round" />;
          })}
          {/* web: link each node to neighbours at +1 and +7 */}
          {Array.from({ length: N }).map((_, i) => {
            const [x1, y1] = pt(i);
            const [x2, y2] = pt((i + 1) % N);
            const [x3, y3] = pt((i + 7) % N);
            return (
              <g key={i} opacity={net * 0.5}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.cream} strokeWidth={2} />
                <line x1={x1} y1={y1} x2={x3} y2={y3} stroke={C.cream} strokeWidth={1.2} opacity={0.5} />
              </g>
            );
          })}
          {/* 100 nodes — coloured 50/50 after split */}
          {Array.from({ length: N }).map((_, i) => {
            const [x, y] = pt(i);
            const k = ease(p(0.1 + (i / N) * 0.08, 0.2 + (i / N) * 0.08));
            const seaSide = i < N / 2; // right half = cha xuống biển
            const tw = 0.75 + 0.25 * Math.sin(frame / 9 + i * 0.9);
            const tint = seaSide ? SEA_LIGHT : "#F7D98B";
            const fill = split > 0 ? tint : "#F7D98B";
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={(9 + 3 * Math.sin(frame / 12 + i)) * k}
                fill={fill}
                opacity={k * tw}
                style={{ filter: `drop-shadow(0 0 7px ${fill})` }}
              />
            );
          })}
        </g>

        {/* central egg */}
        <g transform={`translate(${CX} ${CY}) scale(${0.25 + 0.75 * burst + glow * 0.03})`} opacity={Math.min(1, burst * 1.5)}>
          <ellipse rx={60} ry={78} fill="url(#s20egg)" stroke={C.cream} strokeWidth={3} />
          <ellipse cx={-20} cy={-30} rx={9} ry={17} fill="rgba(255,255,255,0.4)" transform="rotate(20 -20 -30)" />
        </g>
      </svg>

      {/* 50 / 50 labels */}
      <div
        style={{
          position: "absolute",
          right: 64,
          top: 330,
          textAlign: "left",
          opacity: split,
          transform: `translateX(${(1 - split) * 40}px)`,
        }}
      >
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 96, color: SEA_LIGHT, lineHeight: 1 }}>50</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.white }}>theo cha</div>
        <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream }}>xuống biển</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 330,
          opacity: split2,
          transform: `translateX(${(1 - split2) * -40}px)`,
        }}
      >
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 96, color: "#F7D98B", lineHeight: 1 }}>50</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.white }}>theo mẹ</div>
        <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream }}>lên núi</div>
      </div>

      {/* oath at centre */}
      <div
        style={{
          position: "absolute",
          left: CX - 330,
          top: CY - 95,
          width: 660,
          textAlign: "center",
          opacity: oath,
          transform: `scale(${0.9 + 0.1 * oath})`,
          padding: "20px 24px",
          background: "rgba(26,23,20,0.9)",
          border: `2px solid ${C.amber}`,
          borderRadius: 18,
          boxShadow: `0 0 ${24 + glow * 24}px rgba(217,164,65,0.4)`,
        }}
      >
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, lineHeight: 1.25, color: C.white }}>
          “Lên núi, xuống bể, hữu sự báo cho nhau biết, <span style={{ color: C.amber }}>đừng quên.</span>”
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.cream, marginTop: 8 }}>Truyện Hồng Bàng</div>
      </div>

      <div style={{ position: "absolute", left: 64, right: 64, bottom: 100, textAlign: "center", opacity: fin, transform: `translateY(${(1 - fin) * 26}px)` }}>
        <div
          style={{
            display: "inline-block",
            padding: "10px 36px",
            background: "rgba(26,23,20,0.9)",
            border: `2px solid ${C.amber}`,
            borderRadius: 14,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 42,
            color: C.white,
          }}
        >
          Triết lý <span style={{ color: C.amber }}>bình đẳng xã hội</span> hiếm hoi trong thần thoại khu vực
        </div>
      </div>
      <SourceTag text="Lĩnh Nam chích quái — Truyện Hồng Bàng" bottom={36} />
    </Paper>
  );
};
