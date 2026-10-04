import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, Reveal, InkPath, SourceTag, useFrac } from "../common";

// Sc29 - Mạng lưới di tích Rồng Tiên khắp đồng bằng Bắc Bộ (stylized map, not to scale).
// Order (narration s15 start): Lăng Kinh Dương Vương, Á Lữ, Thuận Thành, Bắc Ninh ->
// Đền Nội Bình Đà, Thanh Oai, Hà Nội (50 con theo cha xuống biển) -> Đền Mẫu Âu Cơ, Hiền Lương, Hạ Hòa -> Phong Châu.

const HUB = { x: 700, y: 340 }; // Phong Châu
const SITES = [
  { id: "alu", x: 1280, y: 470, title: "LĂNG KINH DƯƠNG VƯƠNG", sub: "Á Lữ, Thuận Thành, Bắc Ninh", lx: 1360, ly: 330, start: 0.1, line: 0.62, align: "left" as const },
  { id: "binhda", x: 800, y: 700, title: "ĐỀN NỘI BÌNH ĐÀ", sub: "Thanh Oai, Hà Nội · truyền tích 50 con theo cha xuống biển", lx: 880, ly: 700, start: 0.3, line: 0.7, align: "left" as const },
  { id: "hienluong", x: 360, y: 220, title: "ĐỀN MẪU ÂU CƠ", sub: "Hiền Lương, Hạ Hòa, Phú Thọ", lx: 64, ly: 270, start: 0.5, line: 0.78, align: "left" as const },
];

const DELTA =
  "M60,160 C200,120 380,140 520,110 C700,70 900,120 1100,150 C1300,180 1500,260 1640,380 C1760,480 1840,640 1860,800 C1700,860 1560,880 1420,930 C1260,980 1080,960 940,990 C760,1020 540,980 380,900 C240,830 120,700 80,560 C40,420 40,280 60,160 Z";
const RIVER = "M470,120 C560,230 660,300 700,340 C760,440 800,540 860,640 C920,740 1020,860 1130,960";
const RIVER2 = "M780,150 C760,230 740,290 700,340";

export const Sc29: React.FC<SceneProps> = () => {
  const { frame, dur, p } = useFrac();
  const pulse = 0.5 + 0.5 * Math.sin((frame / dur) * Math.PI * 14);
  const hubT = ease(p(0.72, 0.8));
  const flow = (frame / dur) * 600;

  return (
    <Paper>
      <Reveal startFrac={0.02} endFrac={0.1} dy={12} style={{ position: "absolute", right: 64, top: 52, textAlign: "right" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber }}>ĐỒNG BẰNG BẮC BỘ</div>
      </Reveal>

      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={DELTA} fill="rgba(232,220,200,0.035)" style={{ opacity: ease(p(0.0, 0.1)) }} />
        <InkPath d={DELTA} startFrac={0.0} endFrac={0.12} stroke={C.mute} strokeWidth={3} />
        <InkPath d={RIVER} startFrac={0.02} endFrac={0.14} stroke={C.sea} strokeWidth={9} style={{ opacity: 0.85 }} />
        <InkPath d={RIVER2} startFrac={0.04} endFrac={0.14} stroke={C.sea} strokeWidth={6} style={{ opacity: 0.7 }} />

        {/* connection lines toward Phong Châu */}
        {SITES.map((s) => {
          const d = `M${s.x},${s.y} Q${(s.x + HUB.x) / 2 + (s.id === "binhda" ? -120 : 40)},${(s.y + HUB.y) / 2 - 60} ${HUB.x},${HUB.y}`;
          const t = ease(p(s.line, s.line + 0.12));
          return (
            <g key={s.id}>
              <InkPath d={d} startFrac={s.line} endFrac={s.line + 0.12} stroke={C.amber} strokeWidth={4} />
              {t >= 1 && (
                <path
                  d={d}
                  fill="none"
                  stroke={C.white}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeDasharray="4 60"
                  strokeDashoffset={-flow}
                  opacity={0.9}
                />
              )}
            </g>
          );
        })}

        {/* shrine pins */}
        {SITES.map((s) => {
          const t = ease(p(s.start, s.start + 0.06));
          return (
            <g key={s.id} style={{ opacity: t }}>
              <circle cx={s.x} cy={s.y} r={18 + 30 * pulse} fill="none" stroke={C.amber} strokeWidth={3} opacity={(0.8 - 0.6 * pulse) * t} />
              <circle cx={s.x} cy={s.y} r={14} fill={C.amber} stroke={C.bg} strokeWidth={3} />
            </g>
          );
        })}

        {/* hub */}
        <g style={{ opacity: hubT }}>
          <circle cx={HUB.x} cy={HUB.y} r={30 + 44 * pulse} fill="none" stroke={C.amber} strokeWidth={4} opacity={0.7 - 0.5 * pulse} />
          <circle cx={HUB.x} cy={HUB.y} r={22} fill={C.bg} stroke={C.amber} strokeWidth={6} />
          <circle cx={HUB.x} cy={HUB.y} r={9} fill={C.amber} />
        </g>
      </svg>

      {/* labels */}
      {SITES.map((s) => (
        <Reveal
          key={s.id}
          startFrac={s.start + 0.02}
          endFrac={s.start + 0.1}
          dy={14}
          style={{ position: "absolute", left: s.lx, top: s.ly, width: s.id === "binhda" ? 960 : 520, textAlign: s.align }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(26,23,20,0.82)",
              border: `2px solid ${C.border}`,
              borderLeft: `6px solid ${C.amber}`,
              borderRadius: 8,
              padding: "12px 22px",
              textAlign: "left",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 38, color: C.white, lineHeight: 1.15 }}>{s.title}</div>
            <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 32, color: C.cream, marginTop: 6, lineHeight: 1.3 }}>
              {s.sub.split(" · ").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        </Reveal>
      ))}

      {/* hub label */}
      <Reveal startFrac={0.78} endFrac={0.86} dy={12} style={{ position: "absolute", left: HUB.x + 50, top: HUB.y - 100, width: 560 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 58, color: C.amber, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>PHONG CHÂU</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, color: C.cream }}>Đất Tổ · ngã ba sông</div>
      </Reveal>

      <Reveal startFrac={0.88} endFrac={0.96} dy={10} style={{ position: "absolute", left: 64, bottom: 110, width: 700, background: "rgba(26,23,20,0.7)", padding: "6px 0" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.white, lineHeight: 1.3 }}>
          Dấu tích cha rồng mẹ tiên
          <br />
          lan tỏa khắp đồng bằng
        </div>
      </Reveal>

      <SourceTag text="Bản đồ minh họa, không theo tỉ lệ" />
    </Paper>
  );
};
