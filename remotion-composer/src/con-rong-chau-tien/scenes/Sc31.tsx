import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkImageScene, Reveal, useFrac } from "../common";

// sc-31 — narration order: trống đồng Đông Sơn -> Ngọc Lũ I, bảo vật quốc gia -> phát hiện 1893–1894, Hà Nam.
export const Sc31: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { frame, p } = useFrac(durationInFrames);
  const glow = 0.5 + 0.5 * Math.sin(frame / 22);
  const sheen = p(0.1, 0.9);
  return (
    <InkImageScene
      src="sc31_trong_dong_ngoc_lu.png"
      label="Trống đồng Ngọc Lũ I"
      durationInFrames={durationInFrames}
    >
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: 700,
            top: 280,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(217,164,65,${0.14 + 0.12 * glow}) 0%, rgba(217,164,65,0) 65%)`,
            opacity: ease(p(0.04, 0.2)),
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: -400 + sheen * 2700,
            width: 260,
            background:
              "linear-gradient(90deg, rgba(245,242,234,0) 0%, rgba(245,242,234,0.10) 50%, rgba(245,242,234,0) 100%)",
            transform: "skewX(-18deg)",
          }}
        />
      </AbsoluteFill>

      <Reveal startFrac={0.03} endFrac={0.11} style={{ position: "absolute", top: 48, left: 64 }}>
        <div
          style={{
            padding: "8px 22px",
            border: `2px solid ${C.amber}`,
            borderRadius: 6,
            background: "rgba(26,23,20,0.78)",
            color: C.amber,
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 4,
          }}
        >
          TRỐNG ĐỒNG ĐÔNG SƠN
        </div>
      </Reveal>

      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 64,
          right: 64,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        <Reveal startFrac={0.3} endFrac={0.4}>
          <div
            style={{
              padding: "6px 20px",
              borderRadius: 6,
              background: C.amber,
              color: C.bg,
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: 3,
              whiteSpace: "nowrap",
            }}
          >
            BẢO VẬT QUỐC GIA
          </div>
        </Reveal>
        <Reveal startFrac={0.5} endFrac={0.6}>
          <div
            style={{
              fontFamily: FONT.body,
              fontWeight: 500,
              fontSize: 36,
              color: C.cream,
              textShadow: "0 2px 10px rgba(0,0,0,0.85)",
              whiteSpace: "nowrap",
            }}
          >
            Phát hiện 1893–1894 · đắp đê tại Hà Nam
          </div>
        </Reveal>
      </div>
    </InkImageScene>
  );
};
