import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, Reveal, useFrac } from "../common";

// sc-35 — etymology 同胞. Narration order (s18): hai tiếng "đồng bào" -> đồng = cùng một ->
// bào = bọc thai, buồng ối -> nghĩa đen "những người cùng sinh ra từ một bọc thai" -> dân gian: bọc trăm trứng.
const HAN = '"Songti SC", "STSong", "Noto Serif CJK SC", "Noto Serif SC", "PingFang SC", serif';

export const Sc35: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { frame, p } = useFrac(durationInFrames);
  const lock = ease(p(0.04, 0.16)); // 同胞 written on
  const split = ease(p(0.22, 0.34)); // components slide apart
  const pulse = 0.5 + 0.5 * Math.sin(frame / 20);
  const inkWipe = 100 * lock;
  const gap = 90 * split;
  const eggs = ease(p(0.8, 0.92));

  return (
    <Paper>
      {/* soft warm glow */}
      <div
        style={{
          position: "absolute",
          left: 460,
          top: 40,
          width: 1000,
          height: 520,
          background: `radial-gradient(ellipse, rgba(217,164,65,${0.14 + 0.06 * pulse}) 0%, rgba(217,164,65,0) 68%)`,
        }}
      />
      {/* intro: đồng bào */}
      <Reveal startFrac={0.02} endFrac={0.1} style={{ position: "absolute", top: 60, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.amber }}>
          TỪ NGUYÊN HÁN-VIỆT · ĐỒNG BÀO
        </div>
      </Reveal>

      {/* Hán characters */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 40 + gap,
        }}
      >
        {["同", "胞"].map((ch, i) => (
          <div
            key={ch}
            style={{
              fontFamily: HAN,
              fontWeight: 700,
              fontSize: 280,
              lineHeight: 1,
              color: C.amber,
              textShadow: "0 0 40px rgba(217,164,65,0.35)",
              WebkitMaskImage: `linear-gradient(100deg, #000 ${Math.max(0, Math.min(100, inkWipe * 2 - i * 100))}%, transparent ${Math.max(0, Math.min(100, inkWipe * 2 - i * 100)) + 8}%)`,
              maskImage: `linear-gradient(100deg, #000 ${Math.max(0, Math.min(100, inkWipe * 2 - i * 100))}%, transparent ${Math.max(0, Math.min(100, inkWipe * 2 - i * 100)) + 8}%)`,
            }}
          >
            {ch}
          </div>
        ))}
      </div>

      {/* components: đồng / bào */}
      <div style={{ position: "absolute", top: 470, left: 64, right: 64, display: "flex", gap: 48 }}>
        <Reveal startFrac={0.3} endFrac={0.4} style={{ flex: 1 }}>
          <div
            style={{
              background: C.card,
              border: `3px solid ${C.border}`,
              borderLeft: `8px solid ${C.amber}`,
              borderRadius: 12,
              padding: "26px 34px",
            }}
          >
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.amber }}>
              同 · ĐỒNG
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.white, marginTop: 6 }}>
              cùng một
            </div>
          </div>
        </Reveal>
        <Reveal startFrac={0.46} endFrac={0.56} style={{ flex: 1 }}>
          <div
            style={{
              background: C.card,
              border: `3px solid ${C.border}`,
              borderLeft: `8px solid ${C.amber}`,
              borderRadius: 12,
              padding: "26px 34px",
            }}
          >
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.amber }}>
              胞 · BÀO
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.white, marginTop: 6 }}>
              bọc thai, buồng ối
            </div>
          </div>
        </Reveal>
      </div>

      {/* literal meaning */}
      <Reveal startFrac={0.62} endFrac={0.72} style={{ position: "absolute", top: 710, left: 64, right: 64 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.cream, letterSpacing: 1 }}>
          Nghĩa đen nguyên thủy
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 56,
            lineHeight: 1.2,
            color: C.white,
            marginTop: 8,
          }}
        >
          “những người cùng sinh ra từ một bọc thai”
        </div>
      </Reveal>

      {/* folk localisation: bọc trăm trứng */}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 56,
          display: "flex",
          alignItems: "center",
          gap: 28,
          opacity: eggs,
          transform: `translateY(${(1 - eggs) * 24}px)`,
        }}
      >
        <svg width={170} height={90} viewBox="0 0 170 90">
          {Array.from({ length: 12 }).map((_, i) => {
            const cx = 22 + (i % 6) * 25;
            const cy = 24 + Math.floor(i / 6) * 34;
            return <ellipse key={i} cx={cx} cy={cy} rx={9} ry={12} fill="none" stroke={C.amber} strokeWidth={2.5} />;
          })}
        </svg>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream }}>
          Dân gian Việt hóa thành <span style={{ color: C.amber, fontWeight: 700 }}>bọc trăm trứng</span>
        </div>
      </div>
    </Paper>
  );
};
