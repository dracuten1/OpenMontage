// sc-04 — Tranh mực Lạc Long Quân & Âu Cơ. Labels follow narration order:
// Kinh Dương Vương x Long Nữ -> Sùng Lãm = Lạc Long Quân -> Đế Nghi -> Đế Lai -> Âu Cơ.
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkImageScene, Reveal, useFrac } from "../common";

const Plate: React.FC<{
  side: "left" | "right";
  start: number;
  title: string;
  sub: string;
  accent: string;
}> = ({ side, start, title, sub, accent }) => (
  <Reveal
    startFrac={start}
    endFrac={start + 0.1}
    style={{ position: "absolute", bottom: 70, [side]: 64, maxWidth: 800, textAlign: side }}
  >
    <div
      style={{
        display: "inline-block",
        padding: "14px 30px 16px",
        background: "rgba(26,23,20,0.78)",
        borderTop: `3px solid ${accent}`,
        borderRadius: 8,
        textAlign: side,
      }}
    >
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, lineHeight: 1.1, color: C.white }}>{title}</div>
      <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, lineHeight: 1.35, color: C.cream, marginTop: 8 }}>{sub}</div>
    </div>
  </Reveal>
);

export const Sc04: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const chain = ease(p(0.04, 0.16));
  const chain2 = ease(p(0.5, 0.62));

  const motes = Array.from({ length: 28 }, (_, i) => {
    const x = random(`s4-x-${i}`) * 1920;
    const y0 = random(`s4-y-${i}`) * 1080;
    const sp = 0.3 + random(`s4-s-${i}`) * 0.6;
    const ph = random(`s4-p-${i}`) * 6.28;
    const y = (((y0 - frame * sp) % 1080) + 1080) % 1080;
    return (
      <circle
        key={i}
        cx={x + Math.sin(frame * 0.02 + ph) * 12}
        cy={y}
        r={2 + random(`s4-r-${i}`) * 2.5}
        fill="#F2C86B"
        opacity={0.15 + 0.35 * (0.5 + 0.5 * Math.sin(frame * 0.08 + ph))}
      />
    );
  });

  return (
    <InkImageScene src="sc04_lac_long_quan_au_co.png" focus={{ x: 0.4, y: 0.5 }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {motes}
      </svg>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "linear-gradient(to top, rgba(26,23,20,0.92) 0%, rgba(26,23,20,0.6) 18%, rgba(26,23,20,0) 40%), linear-gradient(to bottom, rgba(26,23,20,0.6) 0%, rgba(26,23,20,0) 16%)",
        }}
      />
      {/* top-centre marriage chip (Kinh Dương Vương x Long Nữ -> Sùng Lãm) */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: chain,
          transform: `translateY(${(1 - chain) * -14}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "12px 30px",
            background: "rgba(26,23,20,0.82)",
            border: `2px solid ${C.border}`,
            borderRadius: 10,
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 34,
            color: C.white,
          }}
        >
          <span>Kinh Dương Vương</span>
          <span style={{ color: C.amber }}>+</span>
          <span style={{ color: "#8FC0CE" }}>Long Nữ Động Đình</span>
          <span style={{ color: C.amber }}>→</span>
          <span>Sùng Lãm</span>
        </div>
      </div>

      <Plate side="left" start={0.2} title="Lạc Long Quân" sub="bậc quân vương nòi rồng, đứng đầu thủy tộc" accent="#6FA8B8" />

      {/* right: Đế Nghi -> Đế Lai -> Âu Cơ */}
      <div
        style={{
          position: "absolute",
          top: 150,
          right: 64,
          opacity: chain2,
          transform: `translateY(${(1 - chain2) * -12}px)`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "10px 24px",
          background: "rgba(26,23,20,0.82)",
          border: `2px solid ${C.border}`,
          borderRadius: 10,
          fontFamily: FONT.body,
          fontWeight: 700,
          fontSize: 34,
          color: C.white,
        }}
      >
        <Seq start={0.5} text="Đế Nghi" />
        <span style={{ color: C.amber }}>→</span>
        <Seq start={0.58} text="Đế Lai" />
        <span style={{ color: C.amber }}>→</span>
        <Seq start={0.66} text="Âu Cơ" />
      </div>
      <Plate side="right" start={0.68} title="Âu Cơ" sub="nàng xinh đẹp, sống trên cõi đất" accent={C.cream} />
    </InkImageScene>
  );
};

const Seq: React.FC<{ start: number; text: string }> = ({ start, text }) => {
  const { p } = useFrac();
  const t = ease(p(start, start + 0.06));
  return <span style={{ opacity: t, color: t > 0.5 ? C.white : C.cream }}>{text}</span>;
};
