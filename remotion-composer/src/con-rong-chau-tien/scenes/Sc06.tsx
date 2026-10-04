// sc-06 — Chia ly & lời thề. Order (narration): "Ta là nòi rồng... Thủy hỏa tương khắc" -> 50 xuống biển / 50 lên núi
// -> "Lên núi, xuống bể, hữu sự báo cho nhau biết, đừng quên" -> Phong Châu, Văn Lang, 18 đời Hùng.
import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkPath, Paper, Reveal, SpringPop, useFrac } from "../common";

const CX = 960;
const EGG_Y = 330;

const Egg: React.FC<{ x: number; y: number; s: number; glow: number }> = ({ x, y, s, glow }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={74} ry={96} fill={`rgba(242,200,107,${0.2 + 0.2 * glow})`} />
    <path
      d="M0 -62 C 36 -60, 48 28, 0 62 C -48 28, -36 -60, 0 -62 Z"
      fill="#D9A441"
      stroke="#FBE4A3"
      strokeWidth={3}
    />
    <ellipse cx={-14} cy={-24} rx={9} ry={16} fill="rgba(255,255,255,0.3)" />
  </g>
);

export const Sc06: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const glow = 0.5 + 0.5 * Math.sin(frame * 0.07);

  const split = ease(p(0.08, 0.2));
  const sea = ease(p(0.2, 0.3));
  const mount = ease(p(0.3, 0.4));

  // flow dots along the two arcs
  const flow = (side: -1 | 1, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const t = (((frame * 0.012 + i / n) % 1) + 1) % 1;
      const x = CX + side * (120 + 560 * t);
      const y = EGG_Y + 40 + 200 * Math.pow(t, 1.4) + (side === 1 ? -80 * Math.sin(t * Math.PI) : 30 * Math.sin(t * Math.PI));
      return (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={5}
          fill={side === -1 ? "#6FA8B8" : C.cream}
          opacity={ease(p(0.12, 0.2)) * Math.sin(t * Math.PI)}
        />
      );
    });

  // wave icon and mountain icon
  const wave = (ox: number, oy: number) => (
    <g transform={`translate(${ox} ${oy})`} fill="none" stroke="#6FA8B8" strokeWidth={5} strokeLinecap="round">
      <path d={`M-70 0 C-50 ${-20 + 4 * Math.sin(frame * 0.1)}, -30 ${20 - 4 * Math.sin(frame * 0.1)}, -10 0 S30 ${-20 + 4 * Math.sin(frame * 0.1)}, 50 0 S80 ${12}, 90 0`} />
      <path d={`M-70 26 C-50 ${6 + 4 * Math.sin(frame * 0.1 + 1)}, -30 ${46 - 4 * Math.sin(frame * 0.1 + 1)}, -10 26 S30 ${6 + 4 * Math.sin(frame * 0.1 + 1)}, 50 26 S80 38, 90 26`} />
    </g>
  );
  const mountain = (ox: number, oy: number) => (
    <g transform={`translate(${ox} ${oy})`} fill="none" stroke={C.cream} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
      <path d="M-84 30 L-30 -34 L-4 -4 L30 -50 L86 30 Z" />
      <path d="M-30 -34 L-22 -18 L-34 -12 M30 -50 L40 -28 L26 -20" strokeWidth={3.5} />
    </g>
  );

  const badge = ease(p(0.86, 0.94));

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(217,164,65,0.12), rgba(0,0,0,0) 55%)" }} />

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* soft fields behind the two halves */}
        <rect x={0} y={430} width={940} height={440} fill="rgba(47,93,107,0.16)" opacity={sea} />
        <rect x={980} y={430} width={940} height={440} fill="rgba(232,220,200,0.07)" opacity={mount} />

        {/* arcs */}
        <InkPath d={`M ${CX - 80} ${EGG_Y + 60} C ${CX - 300} ${EGG_Y + 120}, ${CX - 500} ${EGG_Y + 150}, ${CX - 700} ${EGG_Y + 250}`} startFrac={0.1} endFrac={0.22} stroke="#6FA8B8" strokeWidth={5} />
        <InkPath d={`M ${CX + 80} ${EGG_Y + 60} C ${CX + 300} ${EGG_Y + 30}, ${CX + 500} ${EGG_Y + 60}, ${CX + 700} ${EGG_Y + 250}`} startFrac={0.1} endFrac={0.22} stroke={C.cream} strokeWidth={5} />
        {flow(-1, 7)}
        {flow(1, 7)}

        {/* egg splits */}
        <g opacity={1 - split}>
          <Egg x={CX} y={EGG_Y} s={1 + 0.04 * glow} glow={glow} />
        </g>
        <g opacity={split}>
          <Egg x={CX - 60 * split} y={EGG_Y} s={0.8} glow={glow} />
          <Egg x={CX + 60 * split} y={EGG_Y} s={0.8} glow={glow} />
        </g>

        {/* icons */}
        <g opacity={sea}>{wave(CX - 700, EGG_Y + 290)}</g>
        <g opacity={mount}>{mountain(CX + 700, EGG_Y + 290)}</g>
      </svg>

      {/* "Ta là nòi rồng ... thủy hỏa tương khắc" brief header */}
      <Reveal startFrac={0.02} endFrac={0.1} style={{ position: "absolute", top: 52, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: C.amber }}>
          NÒI RỒNG · GIỐNG TIÊN · THỦY HỎA TƯƠNG KHẮC
        </div>
      </Reveal>

      {/* 50 / 50 (father/sea first, then mother/mountain) */}
      <Reveal startFrac={0.2} endFrac={0.3} style={{ position: "absolute", left: 90, top: 700, width: 520, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 150, lineHeight: 1, color: "#8FC0CE" }}>50</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.white }}>con theo cha xuống biển</div>
      </Reveal>
      <Reveal startFrac={0.3} endFrac={0.4} style={{ position: "absolute", right: 90, top: 700, width: 520, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 150, lineHeight: 1, color: C.cream }}>50</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.white }}>con theo mẹ lên núi</div>
      </Reveal>

      {/* centre oath */}
      <Reveal startFrac={0.46} endFrac={0.6} dy={16} style={{ position: "absolute", left: 650, right: 650, top: 600, textAlign: "center" }}>
        <div
          style={{
            padding: "26px 30px 28px",
            background: "rgba(36,31,26,0.92)",
            border: `2px solid ${C.amber}`,
            borderRadius: 14,
            boxShadow: `0 0 ${30 + 20 * glow}px rgba(217,164,65,0.3)`,
          }}
        >
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, lineHeight: 1.25, color: C.white }}>
            «Lên núi, xuống bể, hữu sự báo cho nhau biết, đừng quên.»
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.amber, marginTop: 12 }}>Cổ thư · Truyện Hồng Bàng</div>
        </div>
      </Reveal>

      {/* Phong Châu · Văn Lang badge */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", justifyContent: "center" }}>
        <SpringPop startFrac={0.8} from={0.7}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              padding: "16px 40px",
              background: "rgba(36,31,26,0.95)",
              border: `3px solid ${C.amber}`,
              borderRadius: 60,
              boxShadow: `0 0 ${24 + 24 * badge * glow}px rgba(217,164,65,0.45)`,
            }}
          >
            <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, color: C.amber }}>18</span>
            <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.white }}>đời vua Hùng</span>
            <span style={{ color: C.mute, fontSize: 36 }}>·</span>
            <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.cream }}>Phong Châu</span>
            <span style={{ color: C.mute, fontSize: 36 }}>·</span>
            <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.cream }}>nước Văn Lang</span>
          </div>
        </SpringPop>
      </div>
    </Paper>
  );
};
