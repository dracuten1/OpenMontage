import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, Reveal, SpringPop, InkPath, SourceTag, useFrac } from "../common";

// Sc30 - UNESCO 6/12/2012, Quốc Giỗ 10/3 ÂL (nghỉ lễ từ 2007), câu lục bát.
// Order (narration s15 end): ngày 6 tháng 12 năm 2012 UNESCO -> từ năm 2007 ngày 10 tháng 3 ÂL -> lục bát.

const GOLD = C.amber;

const Emblem: React.FC<{ pulse: number }> = ({ pulse }) => {
  const { p } = useFrac();
  // generic heritage-temple glyph (pediment + columns), not an organisation logo
  return (
    <svg width={150} height={150} viewBox="0 0 150 150">
      <circle cx={75} cy={75} r={68} fill="rgba(217,164,65,0.08)" stroke={GOLD} strokeWidth={3} opacity={0.6 + 0.4 * pulse} />
      <InkPath d="M28,62 L75,30 L122,62 Z" startFrac={0.08} endFrac={0.18} stroke={GOLD} strokeWidth={4} />
      {[44, 66, 88, 110].map((x, i) => (
        <InkPath key={x} d={`M${x},68 L${x},112`} startFrac={0.12 + i * 0.02} endFrac={0.22 + i * 0.02} stroke={C.cream} strokeWidth={5} />
      ))}
      <InkPath d="M30,118 L120,118" startFrac={0.2} endFrac={0.28} stroke={GOLD} strokeWidth={5} />
      <circle cx={75} cy={52} r={4} fill={GOLD} opacity={ease(p(0.2, 0.26))} />
    </svg>
  );
};

export const Sc30: React.FC<SceneProps> = () => {
  const { frame, dur, p } = useFrac();
  const pulse = 0.5 + 0.5 * Math.sin((frame / dur) * Math.PI * 12);
  const frameT = ease(p(0.0, 0.12));

  return (
    <Paper>
      {/* ceremonial border */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x={40} y={40} width={1840} height={1000} rx={14} fill="none" stroke={GOLD} strokeWidth={3} opacity={0.55 * frameT} />
        <rect x={56} y={56} width={1808} height={968} rx={10} fill="none" stroke={C.border} strokeWidth={2} opacity={frameT} />
      </svg>

      {/* Stat 1: UNESCO */}
      <div style={{ position: "absolute", left: 96, top: 110, width: 880 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Emblem pulse={pulse} />
          <Reveal startFrac={0.1} endFrac={0.18} dy={14}>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: GOLD }}>UNESCO CÔNG NHẬN</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.white, lineHeight: 1.2, marginTop: 6 }}>
              Di sản văn hóa phi vật thể
              <br />
              đại diện của nhân loại
            </div>
          </Reveal>
        </div>
        <SpringPop startFrac={0.16} from={0.85} style={{ transformOrigin: "left center", marginTop: 20 }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 140,
              lineHeight: 1,
              color: GOLD,
              textShadow: `0 0 ${20 + 20 * pulse}px rgba(217,164,65,0.35)`,
            }}
          >
            6/12/2012
          </div>
        </SpringPop>
        <Reveal startFrac={0.24} endFrac={0.32} dy={10}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.cream, marginTop: 14, lineHeight: 1.35 }}>
            Tín ngưỡng thờ cúng Hùng Vương ở Phú Thọ
          </div>
        </Reveal>
      </div>

      {/* divider */}
      <svg width={20} height={560} viewBox="0 0 20 560" style={{ position: "absolute", left: 970, top: 110 }}>
        <InkPath d="M10,0 L10,560" startFrac={0.3} endFrac={0.42} stroke={C.border} strokeWidth={3} />
      </svg>

      {/* Stat 2: Quốc Giỗ */}
      <div style={{ position: "absolute", left: 1010, top: 110, width: 820 }}>
        <Reveal startFrac={0.38} endFrac={0.46} dy={14}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: GOLD }}>NGÀY QUỐC GIỖ</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.white, marginTop: 6 }}>Âm lịch</div>
        </Reveal>
        <SpringPop startFrac={0.42} from={0.85} style={{ transformOrigin: "left center", marginTop: 52 }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 140,
              lineHeight: 1,
              color: GOLD,
              textShadow: `0 0 ${20 + 20 * pulse}px rgba(217,164,65,0.35)`,
            }}
          >
            10/3
          </div>
        </SpringPop>
        <SpringPop startFrac={0.52} from={0.9} style={{ transformOrigin: "left center", marginTop: 22 }}>
          <div
            style={{
              display: "inline-block",
              border: `2px solid ${GOLD}`,
              borderRadius: 8,
              padding: "8px 22px",
              background: "rgba(217,164,65,0.1)",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 36,
              color: C.white,
            }}
          >
            Nghỉ lễ quốc gia từ <span style={{ color: GOLD, fontFamily: FONT.display, fontWeight: 800, fontSize: 46 }}>2007</span>
          </div>
        </SpringPop>
      </div>

      {/* couplet on bronze card */}
      <Reveal startFrac={0.68} endFrac={0.8} dy={30} style={{ position: "absolute", left: 96, right: 96, top: 700 }}>
        <div
          style={{
            border: `2px solid ${GOLD}`,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(217,164,65,0.18), rgba(36,31,26,0.95))",
            padding: "30px 40px",
            textAlign: "center",
            boxShadow: `0 0 ${24 + 16 * pulse}px rgba(217,164,65,0.2)`,
          }}
        >
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontStyle: "italic", fontSize: 58, color: C.white, lineHeight: 1.3 }}>
            Dù ai đi ngược về xuôi
          </div>
          <Reveal startFrac={0.78} endFrac={0.88} dy={14}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontStyle: "italic", fontSize: 58, color: GOLD, lineHeight: 1.3, marginTop: 6 }}>
              Nhớ ngày Giỗ Tổ mùng Mười tháng Ba
            </div>
          </Reveal>
        </div>
      </Reveal>

      <SourceTag text="Ca dao dân gian" bottom={64} />
    </Paper>
  );
};
