import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkImageScene, InkPath, Reveal, useFrac } from "../common";

// Sc27 - Không gian thiêng đất Tổ Phong Châu (plate + Remotion-drawn labels).
// Order (narration s14 start): ký ức tạc vào địa lý tâm linh -> Phong Châu, Việt Trì, Phú Thọ ->
// Đền Hùng trên núi Nghĩa Lĩnh -> thờ 18 đời vua Hùng.

export const Sc27: React.FC<SceneProps> = () => {
  const { frame, dur, p } = useFrac();
  const pulse = 0.5 + 0.5 * Math.sin((frame / dur) * Math.PI * 12);
  const pinT = ease(p(0.4, 0.5));

  return (
    <InkImageScene
      src="sc27_nghia_linh_phong_chau.png"
      label="Núi Nghĩa Lĩnh — Đền Hùng"
      sublabel="Thờ 18 đời vua Hùng"
      focus={{ x: 0.62, y: 0.3 }}
    >
      {/* region tag (first mentioned) */}
      <Reveal startFrac={0.06} endFrac={0.16} dy={14} style={{ position: "absolute", left: 64, top: 64 }}>
        <div
          style={{
            display: "inline-block",
            border: `2px solid ${C.amber}`,
            borderRadius: 8,
            background: "rgba(26,23,20,0.78)",
            padding: "10px 26px",
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.amber }}>PHONG CHÂU</div>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, color: C.cream, marginTop: 2 }}>Việt Trì, Phú Thọ</div>
        </div>
      </Reveal>

      {/* summit pin */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
        <g style={{ opacity: pinT }}>
          <circle cx={1190} cy={290} r={18 + 30 * pulse} fill="none" stroke={C.amber} strokeWidth={3} opacity={0.8 - 0.6 * pulse} />
          <circle cx={1190} cy={290} r={12} fill={C.amber} />
        </g>
        <InkPath d="M1190,290 L1190,170 L1360,170" startFrac={0.42} endFrac={0.52} stroke={C.amber} strokeWidth={3} />
      </svg>
      <Reveal startFrac={0.46} endFrac={0.56} dy={10} style={{ position: "absolute", left: 1380, top: 130 }}>
        <div
          style={{
            border: `2px solid ${C.amber}`,
            borderRadius: 8,
            background: "rgba(26,23,20,0.82)",
            padding: "8px 22px",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 38,
            color: C.white,
          }}
        >
          Nghĩa Lĩnh
        </div>
      </Reveal>
    </InkImageScene>
  );
};
