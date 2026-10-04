// sc-08 — Cây phả hệ hợp nhất: hai nhánh uốn thành vòng tròn, khép lại; câu đúc kết.
// Order (narration): ông tổ Đế Minh / Thần Nông -> hai nhánh anh em (Rồng, Tiên) -> "khác nòi mà cùng nguồn".
import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkPath, Paper, Reveal, useFrac } from "../common";

const CX = 960;
const CY = 410;
const R = 210;

export const Sc08: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const glow = 0.5 + 0.5 * Math.sin(frame * 0.08);

  // trunk (bottom of ring) -> splits into two arcs that rise and meet at the top
  const rootY = CY + R;
  const arcL = `M ${CX} ${rootY} C ${CX - R * 0.9} ${rootY - 10}, ${CX - R} ${CY + 60}, ${CX - R} ${CY} C ${CX - R} ${CY - R * 0.56}, ${CX - R * 0.55} ${CY - R}, ${CX} ${CY - R}`;
  const arcR = `M ${CX} ${rootY} C ${CX + R * 0.9} ${rootY - 10}, ${CX + R} ${CY + 60}, ${CX + R} ${CY} C ${CX + R} ${CY - R * 0.56}, ${CX + R * 0.55} ${CY - R}, ${CX} ${CY - R}`;

  // energy pulses running along both arcs (pure math on arc param)
  const pulseAt = (side: -1 | 1, t: number) => {
    // approximate ring path parametrically (half circle from bottom to top)
    return { x: CX + side * R * Math.sin(t * Math.PI), y: CY + R * Math.cos(t * Math.PI) };
  };
  const pulses = [-1, 1].flatMap((side) =>
    [0, 0.5].map((off) => {
      const t = (((frame * 0.011 + off) % 1) + 1) % 1;
      const pt = pulseAt(side as -1 | 1, t);
      return (
        <circle
          key={`${side}-${off}`}
          cx={pt.x}
          cy={pt.y}
          r={9}
          fill="#F6D98B"
          opacity={ease(p(0.5, 0.58)) * Math.sin(t * Math.PI)}
          style={{ filter: "drop-shadow(0 0 8px #F2C86B)" }}
        />
      );
    })
  );

  const ring = ease(p(0.5, 0.62));
  const orbit = frame * 0.004;

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 38%, rgba(217,164,65,${0.1 + 0.1 * glow * ring}), rgba(0,0,0,0) 55%)` }} />

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* trunk coming up from Đế Minh */}
        <InkPath d={`M ${CX} ${rootY + 150} L ${CX} ${rootY}`} startFrac={0.04} endFrac={0.14} stroke={C.amber} strokeWidth={6} />
        {/* two branches bending into the ring */}
        <InkPath d={arcL} startFrac={0.2} endFrac={0.46} stroke={"#8FC0CE"} strokeWidth={6} />
        <InkPath d={arcR} startFrac={0.26} endFrac={0.5} stroke={C.cream} strokeWidth={6} />

        {/* slow decorative orbit rings once closed */}
        <g opacity={ring * 0.7} transform={`rotate(${orbit * 57.3} ${CX} ${CY})`}>
          <circle cx={CX} cy={CY} r={R + 26} fill="none" stroke={C.amber} strokeWidth={2} strokeDasharray="4 18" strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r={R - 28} fill={`rgba(217,164,65,${0.05 + 0.05 * glow})`} opacity={ring} />

        {/* meeting node at top */}
        <g opacity={ease(p(0.46, 0.54))}>
          <circle cx={CX} cy={CY - R} r={20 + 3 * glow} fill={C.amber} stroke="#FBE4A3" strokeWidth={3} />
        </g>
        {/* root node */}
        <g opacity={ease(p(0.02, 0.08))}>
          <circle cx={CX} cy={rootY + 150} r={14} fill={C.amber} />
        </g>
        {pulses}
      </svg>

      {/* root label at the foot of the trunk */}
      <Reveal startFrac={0.02} endFrac={0.1} style={{ position: "absolute", left: CX + 40, top: CY + R + 96, width: 800 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.amber, lineHeight: 1.1 }}>Đế Minh</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, color: C.cream, marginTop: 4 }}>cháu ba đời Viêm Đế Thần Nông</div>
      </Reveal>

      {/* branch labels */}
      <Reveal startFrac={0.24} endFrac={0.32} style={{ position: "absolute", left: CX - R - 40 - 360, top: CY - 30, width: 360, textAlign: "right" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: "#8FC0CE" }}>Rồng</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 32, color: C.cream }}>Lạc Long Quân</div>
      </Reveal>
      <Reveal startFrac={0.3} endFrac={0.38} style={{ position: "absolute", left: CX + R + 40, top: CY - 30, width: 360 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.white }}>Tiên</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 32, color: C.cream }}>Âu Cơ</div>
      </Reveal>

      {/* inside ring */}
      <Reveal startFrac={0.52} endFrac={0.62} style={{ position: "absolute", left: CX - 160, top: CY - 40, width: 320, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 3, color: C.amber, lineHeight: 1.3 }}>
          HAI NHÁNH
          <br />
          ANH EM
        </div>
      </Reveal>

      {/* closing line */}
      <Reveal startFrac={0.68} endFrac={0.82} dy={16} style={{ position: "absolute", left: 120, right: 120, bottom: 70, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 70,
            letterSpacing: 4,
            color: C.white,
            textShadow: `0 0 ${20 + 14 * glow}px rgba(217,164,65,0.5)`,
          }}
        >
          KHÁC NÒI MÀ CÙNG NGUỒN
        </div>
        <div style={{ height: 3, width: 760 * ease(p(0.76, 0.9)), background: C.amber, margin: "16px auto 0" }} />
      </Reveal>
    </Paper>
  );
};
