// sc-03 — Phả hệ Thần Nông trong cổ thư. Reveal order follows narration:
// 2 books -> Thần Nông -> Đế Minh -> Đế Nghi (Bắc) -> Lộc Tục = Kinh Dương Vương (Nam) -> Long Nữ Động Đình Quân
// -> Sùng Lãm = Lạc Long Quân -> Đế Lai -> Âu Cơ.
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkPath, Paper, Reveal, SpringPop, useFrac } from "../common";

type NodeProps = {
  x: number;
  y: number;
  w: number;
  h?: number;
  title: string;
  sub?: string;
  start: number;
  tone?: "cream" | "amber" | "sea";
  strong?: boolean;
};

const TONE = { cream: C.cream, amber: C.amber, sea: "#6FA8B8" } as const;

const Node: React.FC<NodeProps> = ({ x, y, w, h = 100, title, sub, start, tone = "cream", strong = false }) => {
  const { frame, p } = useFrac();
  const col = TONE[tone];
  const lit = ease(p(start, start + 0.05));
  const pulse = lit * (0.5 + 0.5 * Math.sin(frame * 0.08 + x * 0.01));
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h }}>
      <SpringPop startFrac={start} from={0.85} style={{ width: "100%", height: "100%" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            background: strong ? "rgba(217,164,65,0.14)" : C.card,
            border: `2.5px solid ${col}`,
            borderRadius: 14,
            boxShadow: `0 0 ${12 + 22 * pulse}px rgba(${tone === "sea" ? "111,168,184" : "217,164,65"},${0.12 + 0.22 * pulse})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 14px",
          }}
        >
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 36, lineHeight: 1.15, color: C.white }}>{title}</div>
          {sub && (
            <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 28, lineHeight: 1.25, color: C.cream, marginTop: 4 }}>{sub}</div>
          )}
        </div>
      </SpringPop>
    </div>
  );
};

const BookCard: React.FC<{ title: string; year: string; start: number; top: number }> = ({ title, year, start, top }) => (
  <Reveal startFrac={start} endFrac={start + 0.07} dy={14} style={{ position: "absolute", left: 64, top, width: 600 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "12px 20px",
        background: C.card,
        border: `2px solid ${C.border}`,
        borderLeft: `6px solid ${C.amber}`,
        borderRadius: 10,
      }}
    >
      <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: C.white, lineHeight: 1.2, flex: 1 }}>{title}</div>
      <div style={{ fontFamily: FONT.mono, fontWeight: 500, fontSize: 32, color: C.amber }}>{year}</div>
    </div>
  </Reveal>
);

export const Sc03: React.FC<SceneProps> = () => {
  const { p } = useFrac();

  const X0 = 960; // trunk
  const XB = 500; // Bắc column
  const XN = 1340; // Nam column
  const XL = 1665; // Long Nữ node

  const ink = C.cream;
  const sw = 3.5;

  return (
    <Paper>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(217,164,65,0.07), rgba(0,0,0,0) 60%)" }} />

      {/* 1. two ancient books (top-left) */}
      <BookCard title="Đại Việt sử ký toàn thư" year="1479" start={0.02} top={56} />
      <BookCard title="Lĩnh Nam chích quái" year="1492" start={0.1} top={150} />

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* Thần Nông -> Đế Minh */}
        <InkPath d={`M ${X0} 288 L ${X0} 342`} startFrac={0.26} endFrac={0.32} stroke={ink} strokeWidth={sw} />
        {/* Đế Minh -> Đế Nghi (Bắc) */}
        <InkPath d={`M ${X0} 440 C ${X0} 490, ${XB} 440, ${XB} 490`} startFrac={0.4} endFrac={0.5} stroke={ink} strokeWidth={sw} />
        {/* Đế Minh -> Kinh Dương Vương (Nam) */}
        <InkPath d={`M ${X0} 440 C ${X0} 490, ${XN} 440, ${XN} 490`} startFrac={0.5} endFrac={0.6} stroke={C.amber} strokeWidth={sw} />
        {/* KDV -> Sùng Lãm / LLQ */}
        <InkPath d={`M ${XN} 592 L ${XN} 792`} startFrac={0.7} endFrac={0.82} stroke={C.amber} strokeWidth={sw} />
        {/* Long Nữ joins */}
        <InkPath d={`M ${XL - 25 - 210} 692 L ${XN} 692`} startFrac={0.66} endFrac={0.72} stroke="#6FA8B8" strokeWidth={sw} />
        {/* Đế Nghi -> Đế Lai -> Âu Cơ */}
        <InkPath d={`M ${XB} 592 L ${XB} 642`} startFrac={0.84} endFrac={0.88} stroke={ink} strokeWidth={sw} />
        <InkPath d={`M ${XB} 742 L ${XB} 792`} startFrac={0.9} endFrac={0.94} stroke={ink} strokeWidth={sw} />
      </svg>

      {/* branch tags */}
      <Reveal startFrac={0.42} endFrac={0.5} style={{ position: "absolute", left: 250, top: 428, width: 260 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.cream, textAlign: "right" }}>
          NHÁNH BẮC
        </div>
      </Reveal>
      <Reveal startFrac={0.52} endFrac={0.6} style={{ position: "absolute", left: 1410, top: 428, width: 300 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.amber }}>NHÁNH NAM</div>
      </Reveal>
      <Reveal startFrac={0.3} endFrac={0.38} style={{ position: "absolute", left: X0 + 22, top: 298, width: 260 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 28, color: C.cream }}>cháu ba đời</div>
      </Reveal>

      {/* nodes in narration order */}
      <Node x={X0} y={238} w={500} title="Viêm Đế Thần Nông" start={0.17} tone="amber" strong />
      <Node x={X0} y={392} w={320} title="Đế Minh" start={0.3} tone="amber" strong />
      <Node x={XB} y={540} w={340} title="Đế Nghi" sub="phương Bắc" start={0.42} />
      <Node x={XN} y={540} w={560} title="Lộc Tục = Kinh Dương Vương" sub="đi tuần phương Nam" start={0.54} tone="amber" />
      <Node x={XL - 25} y={692} w={420} h={112} title="Long Nữ" sub="con gái Động Đình Quân" start={0.66} tone="sea" />
      <Node x={XN} y={842} w={560} h={112} title="Sùng Lãm = Lạc Long Quân" sub="nòi rồng, đứng đầu thủy tộc" start={0.76} tone="amber" strong />
      <Node x={XB} y={692} w={340} title="Đế Lai" start={0.85} />
      <Node x={XB} y={842} w={340} h={112} title="Âu Cơ" sub="sống trên cõi đất" start={0.91} tone="cream" strong />

      {/* travelling light along the Thần Nông -> Đế Minh trunk keeps the diagram alive */}
      <TrunkSpark enabled={p(0.17, 0.2) > 0} />
    </Paper>
  );
};

const TrunkSpark: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const { frame } = useFrac();
  if (!enabled) return null;
  const s = (frame % 60) / 60;
  const y = 290 + s * 52;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <circle cx={960} cy={y} r={6} fill="#F2C86B" opacity={Math.sin(s * Math.PI)} />
    </svg>
  );
};
