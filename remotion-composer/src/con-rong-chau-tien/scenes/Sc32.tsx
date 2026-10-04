import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { CountUp, Paper, Reveal, SpringPop, useFrac } from "../common";

// sc-32 — order: đường kính 79 cm -> cao 63 cm -> nặng 86 kg -> tuyệt tác thời kim khí -> biên niên sử bằng kim loại.
const STATS = [
  { label: "ĐƯỜNG KÍNH", to: 79, unit: "cm", start: 0.1 },
  { label: "CHIỀU CAO", to: 63, unit: "cm", start: 0.27 },
  { label: "TRỌNG LƯỢNG", to: 86, unit: "kg", start: 0.44 },
];

export const Sc32: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { frame, p } = useFrac(durationInFrames);
  const bar = ease(p(0.1, 0.55));
  const lock = ease(p(0.7, 0.8));
  const pulse = 0.5 + 0.5 * Math.sin(frame / 18);
  return (
    <Paper>
      <div style={{ position: "absolute", left: 64, right: 64, top: 70 }}>
        <Reveal startFrac={0.02} endFrac={0.1}>
          <div
            style={{
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: 5,
              color: C.amber,
            }}
          >
            TRỐNG ĐỒNG NGỌC LŨ I
          </div>
        </Reveal>
      </div>

      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          top: 190,
          display: "flex",
          gap: 40,
        }}
      >
        {STATS.map((s) => (
          <SpringPop key={s.label} startFrac={s.start} from={0.85} style={{ flex: 1 }}>
            <div
              style={{
                background: C.card,
                border: `3px solid ${C.border}`,
                borderTop: `6px solid ${C.amber}`,
                borderRadius: 14,
                padding: "40px 20px 44px",
                textAlign: "center",
                boxShadow: `0 0 ${30 + 20 * pulse}px rgba(217,164,65,0.12)`,
              }}
            >
              <div
                style={{
                  fontFamily: FONT.body,
                  fontWeight: 700,
                  fontSize: 30,
                  letterSpacing: 4,
                  color: C.cream,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  marginTop: 18,
                  fontFamily: FONT.display,
                  fontWeight: 800,
                  fontSize: 168,
                  lineHeight: 1,
                  color: C.amber,
                }}
              >
                <CountUp to={s.to} startFrac={s.start} endFrac={s.start + 0.1} />
                <span style={{ fontSize: 64, color: C.cream, marginLeft: 14 }}>{s.unit}</span>
              </div>
            </div>
          </SpringPop>
        ))}
      </div>

      {/* gold highlight bar sweep under the cards */}
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 600,
          width: 1792 * bar,
          height: 6,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${C.border}, ${C.amber})`,
        }}
      />

      {/* thời đại kim khí */}
      <Reveal startFrac={0.6} endFrac={0.7} style={{ position: "absolute", left: 64, right: 64, top: 650 }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 56,
            color: C.white,
            lineHeight: 1.2,
          }}
        >
          Bảo vật hoàn mỹ thời đại kim khí
        </div>
      </Reveal>

      {/* biên niên sử bằng kim loại */}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          top: 790,
          opacity: lock,
          transform: `translateY(${(1 - lock) * 26}px)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "22px 40px",
            border: `3px solid ${C.amber}`,
            borderRadius: 10,
            background: "rgba(36,31,26,0.9)",
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 44,
            letterSpacing: 2,
            color: C.amber,
          }}
        >
          BIÊN NIÊN SỬ BẰNG KIM LOẠI
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: FONT.body,
            fontSize: 36,
            color: C.cream,
          }}
        >
          của cộng đồng cổ đại
        </div>
      </div>
    </Paper>
  );
};
