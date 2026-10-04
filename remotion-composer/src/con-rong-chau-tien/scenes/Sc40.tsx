import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, Reveal, SpringPop, useFrac } from "../common";

// sc-40 — series outro. Order (s20): "Đây là vn-myth, mỗi tập một truyền thuyết, một bằng chứng thật" ->
// câu hỏi mở -> "chia sẻ suy nghĩ bên dưới và đăng ký kênh". Final ~1s calm hold (nothing new appears).
export const Sc40: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { frame, p } = useFrac(durationInFrames);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 18);
  const drop = ease(p(0.02, 0.16));
  const frame2 = ease(p(0.0, 0.12));
  const bell = Math.sin(frame / 5) * 14 * (p(0.62, 0.64) > 0 && p(0.9, 0.92) < 1 ? 1 : 0.0) * (1 - ease(p(0.62, 0.9)));
  return (
    <Paper>
      {/* amber frame */}
      <div
        style={{
          position: "absolute",
          inset: 40,
          border: `2px solid rgba(217,164,65,${0.5 * frame2})`,
          borderRadius: 18,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 35%, rgba(217,164,65,${0.1 + 0.04 * pulse}) 0%, rgba(217,164,65,0) 60%)`,
        }}
      />

      {/* logo */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 120,
          textAlign: "center",
          opacity: drop,
          transform: `translateY(${(1 - drop) * -90}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 190,
            letterSpacing: 8,
            lineHeight: 1,
            color: C.amber,
            textShadow: `0 0 ${30 + 20 * pulse}px rgba(217,164,65,0.35)`,
          }}
        >
          VN-MYTH
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, letterSpacing: 10, color: C.cream, marginTop: 18 }}>
          TẬP 02 · CON RỒNG CHÁU TIÊN
        </div>
      </div>

      {/* tagline */}
      <Reveal startFrac={0.14} endFrac={0.28} style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 60, color: C.white }}>
          Mỗi tập một truyền thuyết, một bằng chứng thật.
        </div>
      </Reveal>

      {/* open question */}
      <Reveal startFrac={0.3} endFrac={0.46} style={{ position: "absolute", left: 200, right: 200, top: 600, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, lineHeight: 1.4, color: C.cream }}>
          Nhánh nào đã đi đâu, và ai còn đang kể câu chuyện này hôm nay?
        </div>
      </Reveal>

      {/* CTA */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center", gap: 36 }}>
        <SpringPop startFrac={0.5} from={0.8}>
          <div
            style={{
              padding: "20px 40px",
              border: `3px solid ${C.cream}`,
              borderRadius: 14,
              background: C.card,
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 38,
              color: C.cream,
            }}
          >
            Chia sẻ suy nghĩ bên dưới
          </div>
        </SpringPop>
        <SpringPop startFrac={0.62} from={0.8}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "20px 40px",
              borderRadius: 14,
              background: C.amber,
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 38,
              color: C.bg,
              boxShadow: `0 0 ${24 + 20 * pulse}px rgba(217,164,65,0.45)`,
            }}
          >
            <svg width={44} height={44} viewBox="-22 -22 44 44" style={{ transform: `rotate(${bell}deg)`, transformOrigin: "50% 10%" }}>
              <path
                d="M -12 8 Q -12 -14 0 -14 Q 12 -14 12 8 L 16 12 L -16 12 Z M -4 16 Q 0 20 4 16"
                stroke={C.bg}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Đăng ký kênh · Đón xem Tập 3
          </div>
        </SpringPop>
      </div>
    </Paper>
  );
};
