import React from "react";
import { random } from "remotion";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, Reveal, SpringPop, useFrac } from "../common";

// sc-39 — closing formula. Order: "Một nguồn, nhiều nhánh." -> "Cùng một bọc." -> (open question teaser).
export const Sc39: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { frame, dur, p } = useFrac(durationInFrames);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 20);
  const q = ease(p(0.55, 0.72));
  return (
    <Paper>
      {/* drifting amber motes (deterministic) */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 46 }).map((_, i) => {
          const x0 = random(`m39x-${i}`) * 1920;
          const y0 = random(`m39y-${i}`) * 1080;
          const sp = 0.25 + random(`m39s-${i}`) * 0.6;
          const y = (((y0 - frame * sp * 0.8) % 1100) + 1100) % 1100 - 10;
          const x = x0 + Math.sin(frame / 40 + i) * 18;
          const r = 2 + random(`m39r-${i}`) * 3.5;
          const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame / 12 + i * 1.7));
          return <circle key={i} cx={x} cy={y} r={r} fill={C.amber} opacity={0.18 + 0.4 * tw * ease(p(0, 0.12))} />;
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 42%, rgba(217,164,65,${0.14 + 0.06 * pulse}) 0%, rgba(217,164,65,0) 60%)`,
        }}
      />

      <div style={{ position: "absolute", left: 64, right: 64, top: 190, textAlign: "center" }}>
        <SpringPop startFrac={0.04} from={0.9}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 104, lineHeight: 1.12, color: C.white }}>
            Một nguồn, nhiều nhánh.
          </div>
        </SpringPop>
        <SpringPop startFrac={0.22} from={0.82} style={{ marginTop: 24 }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 168,
              lineHeight: 1.1,
              color: C.amber,
              textShadow: `0 0 ${40 + 30 * pulse}px rgba(217,164,65,0.45)`,
            }}
          >
            Cùng một bọc.
          </div>
        </SpringPop>
        <div
          style={{
            margin: "40px auto 0",
            height: 4,
            width: 900 * ease(p(0.36, 0.5)),
            background: `linear-gradient(90deg, rgba(217,164,65,0), ${C.amber}, rgba(217,164,65,0))`,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          bottom: 100,
          textAlign: "center",
          opacity: q,
          transform: `translateY(${(1 - q) * 24}px)`,
        }}
      >
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber, marginBottom: 14 }}>
          TẬP SAU
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 44, lineHeight: 1.4, color: C.cream }}>
          50 lên núi, 50 xuống biển — nhưng nhánh nào đi đâu, và ai còn kể câu chuyện này hôm nay?
        </div>
      </div>
      <span style={{ display: "none" }}>{dur}</span>
    </Paper>
  );
};
