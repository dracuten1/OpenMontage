// sc-15 — Cây ngôn ngữ Việt-Mường cổ và mốc chia tách.
// Narration order: Việt-Mường cổ (gốc chung) -> bắt đầu tách TK 7–8 -> hoàn tất TK 12 thời Lý -> bọc trăm trứng có từ trước khi tách.
import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkPath, Paper, Reveal, SourceTag, SpringPop, useFrac } from "../common";

const X7 = 520; // split begins
const X12 = 1220; // split complete
const TRUNK_Y = 560;
const AXIS_Y = 850;

export const Sc15: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const sway = Math.sin(frame / 30) * 3;
  const pulse = 0.5 + 0.5 * Math.sin(frame / 12);
  const before = ease(p(0.72, 0.82));
  const marker = ease(p(0.3, 0.38));
  const marker12 = ease(p(0.5, 0.58));
  return (
    <Paper>
      <div style={{ position: "absolute", top: 64, left: 64 }}>
        <Reveal startFrac={0.02} endFrac={0.08}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber }}>NGÔN NGỮ HỌC LỊCH SỬ</div>
        </Reveal>
        <Reveal startFrac={0.04} endFrac={0.12}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 60, color: C.white, marginTop: 6 }}>Hai ngôn ngữ, một cội nguồn</div>
        </Reveal>
      </div>

      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="s15tl" x1="0" x2="1">
            <stop offset="0" stopColor={C.cream} stopOpacity="0.9" />
            <stop offset="1" stopColor={C.cream} stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* pre-split zone highlight */}
        <rect x={110} y={430} width={X7 - 110} height={260} rx={16} fill={C.amber} opacity={0.08 * before} />

        {/* common trunk: Việt-Mường cổ */}
        <InkPath d={`M 110 ${TRUNK_Y} C 240 ${TRUNK_Y + sway}, 380 ${TRUNK_Y - sway}, ${X7} ${TRUNK_Y}`} startFrac={0.1} endFrac={0.24} stroke={C.cream} strokeWidth={16} />
        {/* branches split between TK7 and TK12 */}
        <InkPath
          d={`M ${X7} ${TRUNK_Y} C ${X7 + 220} ${TRUNK_Y - 10}, ${X12 - 200} ${TRUNK_Y - 160 + sway}, ${X12} 360`}
          startFrac={0.34}
          endFrac={0.56}
          stroke={C.cream}
          strokeWidth={11}
        />
        <InkPath d={`M ${X12} 360 C ${X12 + 160} 350, 1520 ${350 + sway}, 1640 340`} startFrac={0.54} endFrac={0.62} stroke={C.cream} strokeWidth={11} />
        <InkPath
          d={`M ${X7} ${TRUNK_Y} C ${X7 + 220} ${TRUNK_Y + 10}, ${X12 - 200} ${TRUNK_Y + 150 - sway}, ${X12} 730`}
          startFrac={0.34}
          endFrac={0.56}
          stroke={C.amber}
          strokeWidth={11}
        />
        <InkPath d={`M ${X12} 730 C ${X12 + 160} 740, 1520 ${740 - sway}, 1640 750`} startFrac={0.54} endFrac={0.62} stroke={C.amber} strokeWidth={11} />

        {/* time axis */}
        <InkPath d={`M 110 ${AXIS_Y} L 1810 ${AXIS_Y}`} startFrac={0.1} endFrac={0.3} stroke={C.mute} strokeWidth={4} />
        <g opacity={marker}>
          <line x1={X7} y1={AXIS_Y - 330} x2={X7} y2={AXIS_Y + 14} stroke={C.cream} strokeWidth={3} strokeDasharray="8 10" />
          <circle cx={X7} cy={AXIS_Y} r={12} fill={C.cream} />
        </g>
        <g opacity={marker12}>
          <line x1={X12} y1={AXIS_Y - 130} x2={X12} y2={AXIS_Y + 14} stroke={C.amber} strokeWidth={3} strokeDasharray="8 10" />
          <circle cx={X12} cy={AXIS_Y} r={14 + pulse * 4} fill={C.amber} style={{ filter: "drop-shadow(0 0 12px rgba(217,164,65,0.9))" }} />
        </g>

        {/* arrow: story exists before TK7 */}
        <g opacity={before}>
          <path d={`M ${X7 - 20} 780 L 120 780`} stroke={C.amber} strokeWidth={6} strokeLinecap="round" />
          <path d="M 150 756 L 118 780 L 150 804" fill="none" stroke={C.amber} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>

      {/* trunk label */}
      <Reveal startFrac={0.1} endFrac={0.18} style={{ position: "absolute", left: 100, top: 440 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, color: C.white, lineHeight: 1.1 }}>Việt-Mường cổ</div>
        <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream }}>khối ngôn ngữ chung</div>
      </Reveal>

      {/* century labels */}
      <Reveal startFrac={0.3} endFrac={0.37} style={{ position: "absolute", left: X7 - 190, top: AXIS_Y + 30, width: 380, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: C.white }}>Thế kỷ 7–8</div>
        <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream }}>bắt đầu chia tách</div>
      </Reveal>
      <SpringPop startFrac={0.5} from={0.7} style={{ position: "absolute", left: X12 - 220, top: AXIS_Y + 24, width: 440, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 44, color: C.amber }}>Thế kỷ 12 · thời Lý</div>
        <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream }}>hoàn tất chia tách</div>
      </SpringPop>

      {/* branch labels */}
      <Reveal startFrac={0.56} endFrac={0.64} style={{ position: "absolute", left: 1480, top: 262 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, color: C.white }}>Nhánh Kinh</div>
        <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream }}>đồng bằng</div>
      </Reveal>
      <Reveal startFrac={0.58} endFrac={0.66} style={{ position: "absolute", left: 1480, top: 760 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, color: C.amber }}>Nhánh Mường</div>
        <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream }}>miền núi</div>
      </Reveal>

      {/* conclusion */}
      <Reveal startFrac={0.72} endFrac={0.82} style={{ position: "absolute", left: 130, top: 700, width: 980 }}>
        <div
          style={{
            display: "inline-block",
            padding: "10px 28px",
            background: "rgba(26,23,20,0.88)",
            border: `2px solid ${C.amber}`,
            borderRadius: 14,
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 38,
            color: C.white,
          }}
        >
          Bọc trăm trứng có từ trước khi rẽ đôi
        </div>
      </Reveal>
      <SourceTag text="Ngôn ngữ học lịch sử Việt-Mường" />
    </Paper>
  );
};
