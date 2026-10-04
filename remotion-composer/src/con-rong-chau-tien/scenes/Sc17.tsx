// sc-17 — Khun Borom, quả bầu, Muang Then.
// Narration order: mô-típ khắp Đông Nam Á -> Khun Borom (Tai-Lào) -> trâu trời chết, dây bầu từ mũi -> người bước ra từ lỗ khoét -> Muang Then ở Điện Biên Phủ.
import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkImageScene, Reveal, SourceTag, useFrac } from "../common";

const Step: React.FC<{ text: string; start: number }> = ({ text, start }) => (
  <Reveal startFrac={start} endFrac={start + 0.07} dy={18}>
    <div
      style={{
        padding: "10px 26px",
        background: "rgba(26,23,20,0.84)",
        border: `2px solid ${C.cream}`,
        borderRadius: 14,
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 36,
        color: C.white,
        boxShadow: "0 6px 22px rgba(0,0,0,0.6)",
      }}
    >
      {text}
    </div>
  </Reveal>
);

export const Sc17: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const glow = 0.5 + 0.5 * Math.sin(frame / 18);
  const pin = ease(p(0.74, 0.84));
  return (
    <InkImageScene src="sc17_khun_borom_qua_bau.png" focus={{ x: 0.7, y: 0.45 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse 900px 420px at 260px 150px, rgba(26,23,20,0.82), rgba(26,23,20,0) 100%)",
        }}
      />
      <div style={{ position: "absolute", top: 64, left: 64 }}>
        <Reveal startFrac={0.04} endFrac={0.12}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>
            THẦN THOẠI TAI–LÀO
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 92, color: C.white, lineHeight: 1.05, textShadow: "0 3px 16px rgba(0,0,0,0.95)", marginTop: 6 }}>
            Khun Borom
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", left: 64, top: 330, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
        <Step text="Trâu trời chết đi" start={0.28} />
        <Step text="Từ mũi trâu mọc dây bầu" start={0.4} />
        <Step text="Người bước ra từ lỗ khoét" start={0.54} />
      </div>

      {/* location pin */}
      <div
        style={{
          position: "absolute",
          right: 64,
          bottom: 100,
          opacity: pin,
          transform: `translateY(${(1 - pin) * 30}px)`,
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "14px 30px 14px 20px",
          background: "rgba(26,23,20,0.88)",
          border: `2px solid ${C.amber}`,
          borderRadius: 16,
          boxShadow: `0 0 ${16 + glow * 18}px rgba(217,164,65,0.35)`,
        }}
      >
        <svg width={44} height={58} viewBox="0 0 44 58">
          <path d="M22 2 C 8 2 2 14 2 22 C 2 38 22 56 22 56 C 22 56 42 38 42 22 C 42 14 36 2 22 2 Z" fill={C.amber} />
          <circle cx={22} cy={22} r={8} fill={C.bg} />
        </svg>
        <div>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 48, color: C.white }}>Muang Then</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, color: C.cream }}>nay là Điện Biên Phủ, Việt Nam</div>
        </div>
      </div>
      <SourceTag text="Truyền thuyết Khun Borom (Tai–Lào)" />
    </InkImageScene>
  );
};
