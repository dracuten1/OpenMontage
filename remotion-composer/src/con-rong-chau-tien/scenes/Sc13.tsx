// sc-13 — Nàng Thần Nông ngóng chồng, đàn con tản đi khắp nơi.
// Narration order: Thần Rồng về biển -> Thần Nông lên núi ngóng trông -> đàn con chia nhau đi -> gọi là "đất nước".
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkImageScene, Reveal, SourceTag, useFrac } from "../common";

const Chip: React.FC<{ n: string; text: string; start: number; style: React.CSSProperties; accent?: string }> = ({
  n,
  text,
  start,
  style,
  accent = C.amber,
}) => (
  <Reveal startFrac={start} endFrac={start + 0.07} dy={20} style={{ position: "absolute", ...style }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "12px 28px 12px 14px",
        borderRadius: 50,
        background: "rgba(26,23,20,0.84)",
        border: `2px solid ${accent}`,
        boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          background: accent,
          color: C.bg,
          fontFamily: FONT.body,
          fontWeight: 700,
          fontSize: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {n}
      </div>
      <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.white, whiteSpace: "nowrap" }}>{text}</div>
    </div>
  </Reveal>
);

export const Sc13: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const open = ease(p(0.58, 0.7));
  const glow = 0.6 + 0.4 * Math.sin(frame / 20);
  return (
    <InkImageScene src="sc13_nang_than_nong_muong.png" focus={{ x: 0.2, y: 0.4 }}>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "linear-gradient(to top, rgba(26,23,20,0.92) 0%, rgba(26,23,20,0.55) 20%, rgba(26,23,20,0) 42%)",
        }}
      />
      {/* sea glow top right */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 90,
          width: 520,
          height: 220,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, rgba(217,164,65,${0.18 * glow}), rgba(0,0,0,0) 70%)`,
        }}
      />
      <Chip n="1" text="Thần Rồng về biển, không trở lại" start={0.06} style={{ right: 64, top: 130 }} accent="#7FB3C4" />
      <Chip n="2" text="Thần Nông lên núi ngóng trông chồng" start={0.24} style={{ left: 64, top: 150 }} />
      <Chip n="3" text="Đàn con chia nhau đi khắp nơi" start={0.44} style={{ right: 64, top: 520 }} accent={C.cream} />

      <Reveal startFrac={0.6} endFrac={0.72} dy={30} style={{ position: "absolute", left: 64, right: 64, bottom: 100, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream, marginBottom: 6 }}>
          nơi mình định cư, họ gọi là
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 96,
            color: C.amber,
            letterSpacing: 6,
            textShadow: `0 0 ${20 + 30 * open * glow}px rgba(217,164,65,0.55), 0 3px 14px rgba(0,0,0,0.9)`,
          }}
        >
          “đất nước”
        </div>
      </Reveal>
      <SourceTag text="Truyện Việt cổ — sự tích Thần Nông – Thần Rồng" />
    </InkImageScene>
  );
};
