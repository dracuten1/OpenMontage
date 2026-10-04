import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, LabBadge, Reveal, InkPath, SpringPop, SourceTag, useFrac } from "../common";

// Sc26 - Đỉnh phân hóa dòng mẹ 2.500-3.000 năm trước trùng văn hóa Đông Sơn.
// The curve is a SCHEMATIC of the peak shape (no y-values are claimed); labelled as such.
// Order (narration s13 second half): đỉnh phân hóa dòng mẹ -> 2.500-3.000 năm trước -> trùng Đông Sơn -> Văn Lang.

const X0 = 180;
const X1 = 1740;
const Y0 = 800; // baseline
const PEAK_X = 1060;
const PEAK_Y = 300;
// band 3.000 -> 2.500 years ago (older = left)
const BAND_L = 920;
const BAND_R = 1200;

const CURVE =
  `M${X0},${Y0 - 70} C300,${Y0 - 80} 420,${Y0 - 60} 540,${Y0 - 100} S760,${Y0 - 130} 860,${Y0 - 230} ` +
  `S${PEAK_X - 60},${PEAK_Y + 10} ${PEAK_X},${PEAK_Y} S1230,${PEAK_Y + 150} 1310,${Y0 - 250} ` +
  `S1500,${Y0 - 130} 1600,${Y0 - 120} S1700,${Y0 - 110} ${X1},${Y0 - 100}`;

export const Sc26: React.FC<SceneProps> = () => {
  const { frame, dur, p } = useFrac();
  const pulse = 0.5 + 0.5 * Math.sin((frame / dur) * Math.PI * 18);
  const bandT = ease(p(0.52, 0.64));
  const peakT = ease(p(0.5, 0.56));

  return (
    <Paper variant="lab">
      <LabBadge />

      <Reveal startFrac={0.03} endFrac={0.11} dy={16} style={{ position: "absolute", left: 64, top: 128 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.teal }}>DÒNG MẸ · mtDNA</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 70, color: C.white, marginTop: 8, lineHeight: 1.1 }}>
          Đỉnh phân hóa dòng mẹ
        </div>
      </Reveal>

      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0 }}>
        {/* grid */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={X0}
            x2={X1}
            y1={Y0 - i * 120}
            y2={Y0 - i * 120}
            stroke={C.border}
            strokeWidth={1.5}
            opacity={ease(p(0.1, 0.2)) * 0.6}
          />
        ))}
        {/* axes */}
        <InkPath d={`M${X0},${Y0} L${X1 + 40},${Y0}`} startFrac={0.08} endFrac={0.18} stroke={C.cream} strokeWidth={4} />
        <InkPath d={`M${X0},${Y0} L${X0},${Y0 - 560}`} startFrac={0.08} endFrac={0.18} stroke={C.cream} strokeWidth={4} />

        {/* highlight band */}
        <rect
          x={BAND_L}
          y={Y0 - 560 + (1 - bandT) * 560}
          width={BAND_R - BAND_L}
          height={bandT * 560}
          fill={C.amber}
          opacity={0.14 + 0.06 * pulse}
        />
        <line x1={BAND_L} x2={BAND_L} y1={Y0} y2={Y0 - 560 * bandT} stroke={C.amber} strokeWidth={3} />
        <line x1={BAND_R} x2={BAND_R} y1={Y0} y2={Y0 - 560 * bandT} stroke={C.amber} strokeWidth={3} />

        {/* the curve */}
        <InkPath d={CURVE} startFrac={0.2} endFrac={0.52} stroke={C.teal} strokeWidth={7} />

        {/* peak marker */}
        <g style={{ opacity: peakT }}>
          <circle cx={PEAK_X} cy={PEAK_Y} r={20 + 34 * pulse} fill="none" stroke={C.amber} strokeWidth={3} opacity={0.8 - 0.6 * pulse} />
          <circle cx={PEAK_X} cy={PEAK_Y} r={14} fill={C.amber} />
        </g>
      </svg>

      {/* axis labels */}
      <Reveal startFrac={0.14} endFrac={0.22} dy={6} style={{ position: "absolute", left: X0 - 10, top: Y0 + 20 }}>
        <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream }}>Quá khứ xa</div>
      </Reveal>
      <Reveal startFrac={0.14} endFrac={0.22} dy={6} style={{ position: "absolute", left: X1 - 220, top: Y0 + 20, width: 270, textAlign: "right" }}>
        <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream }}>Hiện nay</div>
      </Reveal>
      <Reveal startFrac={0.14} endFrac={0.22} dy={6} style={{ position: "absolute", left: 64, top: 360, width: 110 }}>
        <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream, lineHeight: 1.25 }}>Mức phân hóa</div>
      </Reveal>

      {/* band label under axis */}
      <Reveal startFrac={0.54} endFrac={0.64} dy={10} style={{ position: "absolute", left: BAND_L - 120, top: Y0 + 14, width: BAND_R - BAND_L + 240, textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            border: `3px solid ${C.amber}`,
            borderRadius: 10,
            padding: "6px 22px",
            background: "rgba(26,23,20,0.85)",
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 52,
            color: C.amber,
            boxShadow: `0 0 ${16 + 20 * pulse}px rgba(217,164,65,0.4)`,
          }}
        >
          2.500–3.000
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 6 }}>năm trước</div>
      </Reveal>

      {/* Dong Son label */}
      <Reveal startFrac={0.66} endFrac={0.76} dy={14} style={{ position: "absolute", left: 1290, top: 190, width: 566 }}>
        <div
          style={{
            border: `2px solid ${C.amber}`,
            background: "rgba(217,164,65,0.1)",
            borderRadius: 12,
            padding: "18px 26px",
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.amber }}>TRÙNG KHỚP</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 48, color: C.white, marginTop: 6, lineHeight: 1.15 }}>
            Văn hóa Đông Sơn
          </div>
        </div>
      </Reveal>
      <Reveal startFrac={0.8} endFrac={0.9} dy={10} style={{ position: "absolute", left: 1290, top: 362, width: 566 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.cream, lineHeight: 1.35 }}>
          cùng thời hình thành nhà nước Văn Lang
        </div>
      </Reveal>

      {/* schematic note */}
      <SpringPop startFrac={0.9} from={0.9} style={{ position: "absolute", left: 64, bottom: 96, transformOrigin: "left center" }}>
        <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream, opacity: 0.9 }}>
          Sơ đồ minh họa dạng đỉnh — không phải số liệu gốc
        </div>
      </SpringPop>
      <SourceTag text="Nguyễn Thúy Dương et al., Scientific Reports (2018)" />
    </Paper>
  );
};
