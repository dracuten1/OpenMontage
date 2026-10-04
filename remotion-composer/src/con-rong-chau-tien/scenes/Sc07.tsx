// sc-07 — "Đợi đã": hai nhánh họ hàng cùng quy về Đế Minh.
// Order (narration): Rồng và Tiên đối lập? -> Âu Cơ con Đế Lai, cháu nội Đế Nghi -> Lạc Long Quân con Kinh Dương Vương
// -> cùng tổ Đế Minh, cháu ba đời Viêm Đế Thần Nông.
import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkPath, Paper, Reveal, SpringPop, useFrac } from "../common";

const Row: React.FC<{ start: number; label: string; name: string; tone?: "normal" | "root" }> = ({ start, label, name, tone = "normal" }) => (
  <Reveal startFrac={start} endFrac={start + 0.07} dy={14}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 20,
        padding: "12px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <span style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, color: C.cream }}>{label}</span>
      <span
        style={{
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 40,
          color: tone === "root" ? C.amber : C.white,
        }}
      >
        {name}
      </span>
    </div>
  </Reveal>
);

export const Sc07: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();

  const shake = (() => {
    const t = p(0.0, 0.07);
    if (t <= 0 || t >= 1) return { x: 0, y: 0 };
    const k = (1 - t) * 14;
    return { x: Math.sin(frame * 2.3) * k, y: Math.cos(frame * 3.1) * k * 0.5 };
  })();

  const glow = 0.5 + 0.5 * Math.sin(frame * 0.08);
  const slideL = ease(p(0.3, 0.42));
  const slideR = ease(p(0.18, 0.3));
  const minhScale = 1 + 0.3 * ease(p(0.76, 0.86));

  // card geometry
  const CW = 700;
  const LX = 190; // Âu Cơ card (left) — first mentioned
  const RX = 1920 - 190 - CW; // Lạc Long Quân card (right)
  const CT = 360;
  const CH = 330;

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 80%, rgba(217,164,65,0.12), rgba(0,0,0,0) 55%)" }} />

      {/* header: impact shake */}
      <div style={{ position: "absolute", top: 54, left: 0, right: 0, textAlign: "center", transform: `translate(${shake.x}px, ${shake.y}px)` }}>
        <SpringPop startFrac={0.0} from={0.9}>
          <div
            style={{
              display: "inline-block",
              padding: "20px 60px 22px",
              background: "rgba(200,85,61,0.14)",
              border: `3px solid ${C.warn}`,
              borderRadius: 14,
              boxShadow: `0 0 ${24 + 14 * glow}px rgba(200,85,61,0.4)`,
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 70, color: C.white, lineHeight: 1.1 }}>
              ĐỢI ĐÃ! Rồng và Tiên có thực sự đối lập?
            </div>
          </div>
        </SpringPop>
      </div>

      {/* connection lines (draw after both columns are named) */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <InkPath d={`M ${LX + CW / 2} ${CT + CH} C ${LX + CW / 2} 790, 880 760, 920 820`} startFrac={0.62} endFrac={0.74} stroke={C.amber} strokeWidth={5} />
        <InkPath d={`M ${RX + CW / 2} ${CT + CH} C ${RX + CW / 2} 790, 1040 760, 1000 820`} startFrac={0.66} endFrac={0.78} stroke={C.amber} strokeWidth={5} />
        {/* arrow heads */}
        <g opacity={ease(p(0.72, 0.78))} fill={C.amber}>
          <path d="M 912 806 L 934 830 L 906 836 Z" />
          <path d="M 1008 806 L 986 830 L 1014 836 Z" />
        </g>
      </svg>

      {/* column: Âu Cơ (first in narration) */}
      <div style={{ position: "absolute", left: LX, top: CT, width: CW, height: CH, opacity: slideR, transform: `translateX(${(1 - slideR) * -60}px)` }}>
        <div style={{ height: "100%", boxSizing: "border-box", padding: "22px 34px", background: C.card, border: `2px solid ${C.border}`, borderTop: `5px solid ${C.cream}`, borderRadius: 14 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 54, color: C.white }}>Âu Cơ</div>
          <Row start={0.22} label="con gái" name="Đế Lai" />
          <Row start={0.28} label="cháu nội" name="Đế Nghi" />
          <Row start={0.58} label="chắt nội" name="ĐẾ MINH" tone="root" />
        </div>
      </div>

      {/* column: Lạc Long Quân */}
      <div style={{ position: "absolute", left: RX, top: CT, width: CW, height: CH, opacity: slideL, transform: `translateX(${(1 - slideL) * 60}px)` }}>
        <div style={{ height: "100%", boxSizing: "border-box", padding: "22px 34px", background: C.card, border: `2px solid ${C.border}`, borderTop: `5px solid #6FA8B8`, borderRadius: 14 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 54, color: C.white }}>Lạc Long Quân</div>
          <Row start={0.38} label="con" name="Kinh Dương Vương" />
          <Row start={0.46} label="cháu nội" name="ĐẾ MINH" tone="root" />
        </div>
      </div>

      {/* centre: common ancestor Đế Minh */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 830,
          textAlign: "center",
        }}
      >
        <SpringPop startFrac={0.74} from={0.7}>
          <div
            style={{
              display: "inline-block",
              padding: "14px 56px 16px",
              background: "rgba(217,164,65,0.16)",
              border: `3px solid ${C.amber}`,
              borderRadius: 16,
              transform: `scale(${minhScale})`,
              boxShadow: `0 0 ${30 + 30 * glow}px rgba(217,164,65,0.5)`,
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 68, color: C.amber, letterSpacing: 2 }}>ĐẾ MINH</div>
          </div>
        </SpringPop>
        <Reveal startFrac={0.82} endFrac={0.9} dy={10}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.cream, marginTop: 22 }}>
            cháu ba đời của Viêm Đế Thần Nông
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};
