import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { InterpretFlag, Paper, Reveal, useFrac } from "../common";

// sc-38 — synthesis. Order (s19): 50 lên núi / 50 xuống biển -> dòng mẹ thời Đông Sơn bùng nổ, phân ly cư dân ->
// "Truyền thuyết không ghi tên từng người — nó ghi nhớ cả một dữ kiện dân số." (DIỄN GIẢI flag, pairing = interpretation)

const Row: React.FC<{ big: string; small: string; t: number; color: string }> = ({ big, small, t, color }) => (
  <div
    style={{
      opacity: t,
      transform: `translateY(${(1 - t) * 22}px)`,
      padding: "18px 0",
      borderBottom: `1px solid ${C.border}`,
    }}
  >
    <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 60, color, lineHeight: 1.1 }}>{big}</div>
    <div style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 36, color: C.cream, marginTop: 6, lineHeight: 1.3 }}>
      {small}
    </div>
  </div>
);

export const Sc38: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { frame, p } = useFrac(durationInFrames);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 16);
  const left = ease(p(0.04, 0.16));
  const right = ease(p(0.34, 0.46));
  const merge = ease(p(0.6, 0.72));
  const line = ease(p(0.74, 0.86));
  const gold = `rgba(217,164,65,${0.4 + 0.6 * merge})`;

  return (
    <Paper>
      <InterpretFlag />
      <div style={{ position: "absolute", left: 64, right: 64, top: 70 }}>
        <Reveal startFrac={0.02} endFrac={0.08}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber }}>
            HAI NỬA CỦA CÙNG MỘT BỨC TRANH
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", left: 64, right: 64, top: 150, height: 430, display: "flex", gap: 0 }}>
        {/* left: truyền thuyết */}
        <div
          style={{
            flex: 1,
            opacity: left,
            transform: `translateX(${(1 - left) * -120 + merge * 12}px)`,
            background: C.card,
            border: `3px solid ${gold}`,
            borderRight: "none",
            borderRadius: "16px 0 0 16px",
            padding: "28px 44px",
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.amber }}>
            TRUYỀN THUYẾT
          </div>
          <Row big="50 lên núi" small="theo mẹ về trên đất" t={ease(p(0.1, 0.2))} color={C.white} />
          <Row big="50 xuống biển" small="theo cha về Thủy phủ" t={ease(p(0.2, 0.3))} color={C.white} />
        </div>

        {/* centre seam */}
        <div style={{ width: 6, background: `linear-gradient(${C.amber}, ${C.amber})`, opacity: 0.35 + 0.65 * merge, boxShadow: `0 0 ${20 * merge * (0.6 + 0.4 * pulse)}px rgba(217,164,65,0.7)` }} />

        {/* right: dữ kiện */}
        <div
          style={{
            flex: 1,
            opacity: right,
            transform: `translateX(${(1 - right) * 120 - merge * 12}px)`,
            background: C.card,
            border: `3px solid ${gold}`,
            borderLeft: "none",
            borderRadius: "0 16px 16px 0",
            padding: "28px 44px",
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.teal }}>
            DỮ KIỆN DÂN SỐ
          </div>
          <Row big="~2.500–3.000 năm trước" small="nhiều dòng mẹ cùng mở rộng · thời Đông Sơn" t={ease(p(0.4, 0.5))} color={C.teal} />
          <Row big="Thế kỷ 7–12" small="các nhánh Việt–Mường tách dần" t={ease(p(0.5, 0.6))} color={C.teal} />
        </div>
      </div>

      {/* takeaway */}
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 660,
          textAlign: "center",
          opacity: line,
          transform: `translateY(${(1 - line) * 26}px) scale(${0.97 + 0.03 * line})`,
        }}
      >
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 56, lineHeight: 1.25, color: C.white }}>
          Truyền thuyết không ghi tên từng người —
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 56, lineHeight: 1.25, color: C.amber, marginTop: 6 }}>
          nó ghi nhớ cả một dữ kiện dân số.
        </div>
      </div>
    </Paper>
  );
};
