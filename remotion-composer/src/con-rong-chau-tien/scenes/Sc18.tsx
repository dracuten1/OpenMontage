// sc-18 — Quả bầu Khun Borom: phân tầng xã hội trong thần thoại láng giềng.
// Narration order: thần thoại cài sẵn phân tầng -> lỗ que sắt nung đỏ (người da tối) -> lỗ đục gỗ (người Tai da sáng) -> Muang Then = Điện Biên Phủ.
import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkPath, Paper, Reveal, SourceTag, useFrac } from "../common";

const HOT = "#E0763A";
const CX = 960;
const GY = 540;

const Person: React.FC<{ x: number; y: number; fill: string; stroke: string; scale?: number; opacity: number }> = ({
  x,
  y,
  fill,
  stroke,
  scale = 1,
  opacity,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <circle cx={0} cy={-34} r={13} fill={fill} stroke={stroke} strokeWidth={3} />
    <path d="M -16 14 C -16 -14 16 -14 16 14 Z" fill={fill} stroke={stroke} strokeWidth={3} strokeLinejoin="round" />
  </g>
);

export const Sc18: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const call = ease(p(0.04, 0.14));
  const dark = ease(p(0.24, 0.4));
  const light = ease(p(0.5, 0.66));
  const pin = ease(p(0.78, 0.88));
  const glow = 0.5 + 0.5 * Math.sin(frame / 10);
  const sway = Math.sin(frame / 40) * 4;

  // person streams emerging from holes
  const stream = (side: -1 | 1, t: number, count: number, fill: string, stroke: string) =>
    Array.from({ length: count }).map((_, i) => {
      const k = Math.max(0, Math.min(1, t * (count + 1) - i)) as number;
      const e = ease(k);
      const bob = Math.sin(frame / 12 + i) * 3;
      return (
        <Person
          key={i}
          x={CX + side * (190 + 118 * e * (i + 1) * 0.7 + i * 34)}
          y={GY + 190 - (1 - e) * 10 + bob}
          fill={fill}
          stroke={stroke}
          scale={0.75 + 0.1 * e}
          opacity={e}
        />
      );
    });

  return (
    <Paper>
      {/* callout first (narration: thần thoại cài sẵn phân tầng) */}
      <div style={{ position: "absolute", top: 64, left: 64, right: 64, textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            padding: "12px 40px",
            border: `3px solid ${C.warn}`,
            background: "rgba(200,85,61,0.16)",
            borderRadius: 12,
            opacity: call,
            transform: `scale(${0.8 + 0.2 * call})`,
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 52,
            color: C.white,
            letterSpacing: 1,
          }}
        >
          THẦN THOẠI CÀI SẴN PHÂN TẦNG XÃ HỘI
        </div>
      </div>

      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="s18g" cx="40%" cy="30%" r="80%">
            <stop offset="0" stopColor="#6B5A34" />
            <stop offset="1" stopColor="#2A2318" />
          </radialGradient>
        </defs>
        {/* gourd outline (two-lobed) */}
        <g transform={`translate(0 ${sway})`}>
          <path
            d={`M ${CX - 40} 250 C ${CX - 40} 210 ${CX + 40} 210 ${CX + 40} 250 C ${CX + 50} 300 ${CX + 140} 320 ${CX + 160} 440 C ${CX + 180} 560 ${CX + 270} 640 ${CX + 170} 740 C ${CX + 70} 810 ${CX - 70} 810 ${CX - 170} 740 C ${CX - 270} 640 ${CX - 180} 560 ${CX - 160} 440 C ${CX - 140} 320 ${CX - 50} 300 ${CX - 40} 250 Z`}
            fill="url(#s18g)"
            opacity={0.95}
          />
          <InkPath
            d={`M ${CX - 40} 250 C ${CX - 40} 210 ${CX + 40} 210 ${CX + 40} 250 C ${CX + 50} 300 ${CX + 140} 320 ${CX + 160} 440 C ${CX + 180} 560 ${CX + 270} 640 ${CX + 170} 740 C ${CX + 70} 810 ${CX - 70} 810 ${CX - 170} 740 C ${CX - 270} 640 ${CX - 180} 560 ${CX - 160} 440 C ${CX - 140} 320 ${CX - 50} 300 ${CX - 40} 250 Z`}
            startFrac={0.02}
            endFrac={0.2}
            stroke={C.cream}
            strokeWidth={6}
          />
          <path d={`M ${CX} 215 C ${CX + 10} 170 ${CX + 50} 150 ${CX + 90} 160`} fill="none" stroke={C.cream} strokeWidth={6} strokeLinecap="round" />
          {/* holes */}
          <ellipse cx={CX - 165} cy={GY + 100} rx={34} ry={44} fill="#0F0D0A" stroke={HOT} strokeWidth={dark > 0 ? 5 : 0} opacity={dark} />
          <ellipse cx={CX + 165} cy={GY + 100} rx={34} ry={44} fill="#0F0D0A" stroke={C.cream} strokeWidth={light > 0 ? 5 : 0} opacity={light} />
        </g>

        {/* DARK side: hot iron poker punches the left hole */}
        <g opacity={dark}>
          <g transform={`translate(${-60 + 60 * dark} 0)`}>
            <rect x={CX - 560} y={GY + 90} width={300} height={16} rx={8} fill={HOT} style={{ filter: `drop-shadow(0 0 ${8 + glow * 10}px ${HOT})` }} />
            <rect x={CX - 560} y={GY + 90} width={110} height={16} rx={8} fill="#5A4A3A" />
          </g>
          {stream(-1, dark, 3, "#0F0D0A", C.mute)}
        </g>

        {/* LIGHT side: wooden chisel on the right hole */}
        <g opacity={light}>
          <g transform={`translate(${60 - 60 * light} 0)`}>
            <rect x={CX + 270} y={GY + 90} width={110} height={18} rx={4} fill="#9A7B52" />
            <path d={`M ${CX + 270} ${GY + 88} L ${CX + 210} ${GY + 99} L ${CX + 270} ${GY + 110} Z`} fill={C.cream} />
            <rect x={CX + 380} y={GY + 84} width={150} height={30} rx={12} fill="#7A5C3A" />
          </g>
          {stream(1, light, 3, C.cream, C.white)}
        </g>
      </svg>

      {/* labels */}
      <div style={{ position: "absolute", left: 64, top: 330, width: 560 }}>
        <Reveal startFrac={0.22} endFrac={0.3}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: HOT }}>LỖ KHOÉT 1</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 48, color: C.white, marginTop: 6, lineHeight: 1.15 }}>Que sắt nung đỏ</div>
        </Reveal>
        <Reveal startFrac={0.32} endFrac={0.4} style={{ marginTop: 12 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream }}>→ người da tối bước ra</div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", right: 64, top: 330, width: 560, textAlign: "right" }}>
        <Reveal startFrac={0.48} endFrac={0.56}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.cream }}>LỖ KHOÉT 2</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 48, color: C.white, marginTop: 6, lineHeight: 1.15 }}>Đục gỗ</div>
        </Reveal>
        <Reveal startFrac={0.58} endFrac={0.66} style={{ marginTop: 12 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream }}>người Tai da sáng bước ra ←</div>
        </Reveal>
      </div>

      {/* location */}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 100,
          textAlign: "center",
          opacity: pin,
          transform: `translateY(${(1 - pin) * 24}px)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "12px 40px",
            background: "rgba(26,23,20,0.9)",
            border: `2px solid ${C.amber}`,
            borderRadius: 14,
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 40,
            color: C.white,
          }}
        >
          Muang Then = <span style={{ color: C.amber }}>Điện Biên Phủ, Việt Nam</span>
        </div>
      </div>
      <SourceTag text="Truyền thuyết Khun Borom (Tai–Lào)" bottom={36} />
    </Paper>
  );
};
