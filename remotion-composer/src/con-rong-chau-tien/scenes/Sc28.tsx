import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, Reveal, InkPath, SpringPop, SourceTag, useFrac } from "../common";

// Sc28 - Tam giác ba ngọn núi: stylized ink map of Đền Hùng (not to scale).
// Order (narration s14): Nghĩa Lĩnh / Hùng Vương -> núi Sim, Đền Quốc Tổ Lạc Long Quân, ~1 km Đông Nam ->
// núi Vặn (Ốc Sơn), Đền Mẫu Âu Cơ -> ba ngọn núi vẽ nên sơ đồ gia đình thần thoại (Cha - Mẹ - Con).

type Peak = { x: number; y: number; w: number; h: number };
const NL: Peak = { x: 820, y: 450, w: 280, h: 230 }; // Nghĩa Lĩnh (top, centre)
const SIM: Peak = { x: 1330, y: 650, w: 230, h: 180 }; // núi Sim (Đông Nam of Nghĩa Lĩnh)
const VAN: Peak = { x: 360, y: 710, w: 240, h: 190 }; // núi Vặn (Ốc Sơn)

const peakPath = (p: Peak) => {
  const l = p.x - p.w / 2;
  const r = p.x + p.w / 2;
  const b = p.y;
  const t = p.y - p.h;
  return `M${l - 40},${b} C${l + 30},${b - 10} ${l + p.w * 0.2},${t + p.h * 0.45} ${p.x - 24},${t + 16} Q${p.x},${t - 8} ${p.x + 24},${t + 16} C${r - p.w * 0.2},${t + p.h * 0.45} ${r - 30},${b - 10} ${r + 40},${b}`;
};
const ridge = (p: Peak) =>
  `M${p.x - p.w * 0.28},${p.y - 4} C${p.x - p.w * 0.15},${p.y - p.h * 0.4} ${p.x - 8},${p.y - p.h * 0.55} ${p.x},${p.y - p.h * 0.62}`;

const PeakDraw: React.FC<{ peak: Peak; s: number; color: string }> = ({ peak, s, color }) => {
  const t = ease(useFrac().p(s, s + 0.08));
  return (
    <g>
      <path
        d={`${peakPath(peak)} Z`}
        fill={color}
        opacity={0.12 * t}
      />
      <InkPath d={peakPath(peak)} startFrac={s} endFrac={s + 0.09} stroke={C.cream} strokeWidth={5} />
      <InkPath d={ridge(peak)} startFrac={s + 0.04} endFrac={s + 0.11} stroke={C.mute} strokeWidth={3} />
    </g>
  );
};

const Marker: React.FC<{ x: number; y: number; startFrac: number; pulse: number }> = ({ x, y, startFrac, pulse }) => {
  const { p } = useFrac();
  const t = ease(p(startFrac, startFrac + 0.05));
  return (
    <g style={{ opacity: t }}>
      <circle cx={x} cy={y} r={16 + 26 * pulse} fill="none" stroke={C.amber} strokeWidth={3} opacity={0.8 - 0.6 * pulse} />
      <circle cx={x} cy={y} r={13} fill={C.amber} stroke={C.bg} strokeWidth={3} />
    </g>
  );
};

const Label: React.FC<{
  x: number;
  y: number;
  w: number;
  startFrac: number;
  role: string;
  roleFrac: number;
  title: string;
  sub: string;
  align?: "left" | "center" | "right";
}> = ({ x, y, w, startFrac, role, roleFrac, title, sub, align = "center" }) => (
  <Reveal startFrac={startFrac} endFrac={startFrac + 0.07} dy={16} style={{ position: "absolute", left: x, top: y, width: w, textAlign: align }}>
    <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 48, color: C.white, lineHeight: 1.12 }}>{title}</div>
    <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, color: C.cream, marginTop: 4, lineHeight: 1.3 }}>{sub}</div>
    <Reveal startFrac={roleFrac} endFrac={roleFrac + 0.05} dy={8}>
      <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: C.amber, marginTop: 8 }}>{role}</div>
    </Reveal>
  </Reveal>
);

export const Sc28: React.FC<SceneProps> = () => {
  const { frame, dur, p } = useFrac();
  const pulse = 0.5 + 0.5 * Math.sin((frame / dur) * Math.PI * 14);

  const NLm = { x: NL.x, y: NL.y - NL.h - 20 };
  const SIMm = { x: SIM.x, y: SIM.y - SIM.h - 20 };
  const VANm = { x: VAN.x, y: VAN.y - VAN.h - 20 };

  // triangle lines (after all three are named)
  const L1 = `M${NLm.x},${NLm.y} L${SIMm.x},${SIMm.y}`;
  const L2 = `M${SIMm.x},${SIMm.y} L${VANm.x},${VANm.y}`;
  const L3 = `M${VANm.x},${VANm.y} L${NLm.x},${NLm.y}`;
  const pts = [NLm, SIMm, VANm, NLm];
  const lt = ((frame / dur) * 6) % 3;
  const seg = Math.min(2, Math.floor(lt));
  const f = lt - seg;
  const dot = {
    x: pts[seg].x + (pts[seg + 1].x - pts[seg].x) * f,
    y: pts[seg].y + (pts[seg + 1].y - pts[seg].y) * f,
  };

  // river ribbon for texture
  const RIVER = "M0,930 C300,880 500,990 820,930 S1300,860 1920,930";

  return (
    <Paper>
      <Reveal startFrac={0.02} endFrac={0.1} dy={14} style={{ position: "absolute", left: 64, top: 52 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber }}>
          ĐỀN HÙNG · PHONG CHÂU, PHÚ THỌ
        </div>
      </Reveal>

      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0 }}>
        <InkPath d={RIVER} startFrac={0.02} endFrac={0.2} stroke={C.sea} strokeWidth={10} style={{ opacity: 0.8 }} />

        {/* mountains */}
        <PeakDraw peak={NL} s={0.05} color={C.amber} />
        <PeakDraw peak={SIM} s={0.3} color={C.amber} />
        <PeakDraw peak={VAN} s={0.52} color={C.amber} />

        {/* markers */}
        <Marker x={NLm.x} y={NLm.y} startFrac={0.12} pulse={pulse} />
        <Marker x={SIMm.x} y={SIMm.y} startFrac={0.36} pulse={pulse} />
        <Marker x={VANm.x} y={VANm.y} startFrac={0.58} pulse={pulse} />

        {/* distance dimension Nghĩa Lĩnh -> Sim, SE */}
        <InkPath d={`M${NL.x + 110},${NL.y + 50} L${SIM.x - 110},${SIM.y + 36}`} startFrac={0.36} endFrac={0.44} stroke={C.cream} strokeWidth={3} />

        {/* triangle */}
        <InkPath d={L1} startFrac={0.74} endFrac={0.82} stroke={C.amber} strokeWidth={5} />
        <InkPath d={L2} startFrac={0.78} endFrac={0.86} stroke={C.amber} strokeWidth={5} />
        <InkPath d={L3} startFrac={0.82} endFrac={0.9} stroke={C.amber} strokeWidth={5} />
        {/* light travelling the triangle */}
        {frame / dur > 0.9 && (
          <circle cx={dot.x} cy={dot.y} r={11} fill={C.white} style={{ filter: "drop-shadow(0 0 10px #D9A441)" }} />
        )}
      </svg>

      {/* compass */}
      <Reveal startFrac={0.3} endFrac={0.4} dy={0} style={{ position: "absolute", right: 64, top: 64 }}>
        <svg width={170} height={170} viewBox="0 0 170 170">
          <circle cx={85} cy={85} r={70} fill="none" stroke={C.border} strokeWidth={3} />
          {/* SE arrow */}
          <path d="M85,85 L135,135" stroke={C.amber} strokeWidth={5} strokeLinecap="round" />
          <path d="M115,136 L138,138 L136,115" fill="none" stroke={C.amber} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={85} cy={85} r={6} fill={C.cream} />
        </svg>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: C.amber, textAlign: "center", marginTop: -4 }}>Đông Nam</div>
      </Reveal>

      {/* distance badge */}
      <SpringPop startFrac={0.4} from={0.8} style={{ position: "absolute", left: 1016, top: 566, transformOrigin: "center" }}>
        <div
          style={{
            border: `2px solid ${C.cream}`,
            borderRadius: 8,
            background: "rgba(26,23,20,0.9)",
            padding: "6px 22px",
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 44,
            color: C.white,
          }}
        >
          ~1 km
        </div>
      </SpringPop>

      {/* peak labels */}
      <Label x={NL.x + 150} y={NLm.y - 70} w={560} startFrac={0.1} role="CON" roleFrac={0.9} title="Núi Nghĩa Lĩnh" sub="Hùng Vương" align="left" />
      <Label x={SIM.x - 280} y={SIM.y + 78} w={560} startFrac={0.34} role="CHA" roleFrac={0.86} title="Núi Sim" sub="Đền Quốc Tổ Lạc Long Quân" />
      <Label x={VAN.x - 310} y={VAN.y + 40} w={620} startFrac={0.56} role="MẸ" roleFrac={0.88} title="Núi Vặn (Ốc Sơn)" sub="Đền Mẫu Âu Cơ" />

      {/* conclusion banner */}
      <Reveal startFrac={0.88} endFrac={0.96} dy={18} style={{ position: "absolute", left: 64, right: 64, bottom: 56, textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            background: "rgba(26,23,20,0.88)",
            border: `2px solid ${C.amber}`,
            borderRadius: 12,
            padding: "14px 36px",
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 46,
            color: C.white,
          }}
        >
          Sơ đồ gia đình thần thoại · <span style={{ color: C.amber }}>Cha – Mẹ – Con</span>
        </div>
      </Reveal>
      <SourceTag text="Bản đồ minh họa, không theo tỉ lệ" bottom={6} />
    </Paper>
  );
};
