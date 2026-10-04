// sc-16 — Hai anh em, hai giọng kể, chung một ký ức.
// Narration order: nhánh đồng bằng (tên chữ Hán, Lạc Long Quân - Âu Cơ) -> nhánh vùng cao (Thần Nông - Thần Rồng, thơ sử thi) -> kết luận.
import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, Reveal, SourceTag, useFrac } from "../common";

const Scroll: React.FC<{ open: number; frame: number }> = ({ open, frame }) => {
  const w = 120 + 340 * open;
  return (
    <svg width={520} height={300} viewBox="0 0 520 300" style={{ overflow: "visible" }}>
      {/* paper */}
      <rect x={30} y={40} width={w} height={220} fill="#E8DCC8" opacity={0.92} />
      {/* faux calligraphy columns */}
      {Array.from({ length: 6 }).map((_, i) => {
        const x = 70 + i * 62;
        const vis = x < 30 + w - 30 ? 1 : 0;
        return (
          <g key={i} opacity={vis * 0.75} stroke="#3A322A" strokeWidth={5} strokeLinecap="round">
            {Array.from({ length: 4 }).map((__, j) => {
              const y = 66 + j * 46;
              return <path key={j} d={`M ${x - 14} ${y} h ${24 + ((i + j) % 3) * 6} M ${x} ${y - 10} v 30 M ${x - 12} ${y + 14} h 26`} fill="none" />;
            })}
          </g>
        );
      })}
      {/* rollers */}
      <rect x={14} y={26} width={32} height={248} rx={16} fill={C.amber} />
      <rect x={14 + w} y={26} width={32} height={248} rx={16} fill={C.amber} />
      <ellipse cx={30} cy={26} rx={16} ry={6} fill="#8A5E1E" />
      <ellipse cx={30 + w} cy={26} rx={16} ry={6} fill="#8A5E1E" />
      <circle cx={30 + w} cy={150} r={0} fill="none" />
      {/* red seal */}
      <rect x={30 + w - 100} y={200} width={42} height={42} fill={C.warn} opacity={open > 0.8 ? 0.9 : 0} transform={`rotate(${Math.sin(frame / 30) * 1.5} ${30 + w - 79} 221)`} />
    </svg>
  );
};

const Fire: React.FC<{ frame: number; on: number }> = ({ frame, on }) => {
  const f1 = 1 + Math.sin(frame / 3) * 0.08;
  const f2 = 1 + Math.sin(frame / 4 + 1) * 0.1;
  return (
    <svg width={520} height={300} viewBox="0 0 520 300" style={{ overflow: "visible" }}>
      {/* stilt house */}
      <path d="M 120 120 L 260 40 L 400 120 Z" fill="none" stroke={C.cream} strokeWidth={5} strokeLinejoin="round" opacity={on} />
      <path d="M 150 120 H 370 V 190 H 150 Z" fill="rgba(232,220,200,0.07)" stroke={C.cream} strokeWidth={5} opacity={on} />
      {[160, 230, 290, 360].map((x) => (
        <path key={x} d={`M ${x} 190 V 290`} stroke={C.cream} strokeWidth={6} strokeLinecap="round" opacity={on} />
      ))}
      {/* fire glow */}
      <ellipse cx={260} cy={282} rx={110 + Math.sin(frame / 5) * 8} ry={24} fill={C.amber} opacity={0.2 * on} />
      <g opacity={on} transform={`translate(260 276)`}>
        <path d={`M 0 0 C -34 -10 -26 -${48 * f1} 0 -${86 * f1} C 26 -${48 * f1} 34 -10 0 0 Z`} fill={C.amber} />
        <path d={`M 0 0 C -16 -6 -12 -${26 * f2} 0 -${50 * f2} C 12 -${26 * f2} 16 -6 0 0 Z`} fill="#F7D98B" />
      </g>
      {/* smoke wisps */}
      {[0, 1, 2].map((i) => {
        const t = ((frame / 70 + i / 3) % 1);
        return (
          <circle key={i} cx={260 + Math.sin(t * 6 + i) * 22} cy={110 - t * 130} r={10 + t * 22} fill={C.cream} opacity={on * (1 - t) * 0.22} />
        );
      })}
    </svg>
  );
};

/** sound-wave rings pulsing from the hearth */
const Waves: React.FC<{ frame: number; on: number }> = ({ frame, on }) => (
  <svg width={520} height={90} viewBox="0 0 520 90">
    {Array.from({ length: 28 }).map((_, i) => {
      const h = 10 + 36 * Math.abs(Math.sin(frame / 8 + i * 0.55)) * (0.5 + 0.5 * Math.sin(i * 0.4 + 1));
      return <rect key={i} x={i * 18.5 + 4} y={45 - h / 2} width={8} height={h} rx={4} fill={C.amber} opacity={on * 0.85} />;
    })}
  </svg>
);

const Side: React.FC<{
  eyebrow: string;
  accent: string;
  names: string[];
  start: number;
  children: React.ReactNode;
  foot: string;
}> = ({ eyebrow, accent, names, start, children, foot }) => {
  const { p } = useFrac();
  const t = ease(p(start, start + 0.08));
  return (
    <div style={{ width: 800, textAlign: "center", opacity: t, transform: `translateY(${(1 - t) * 40}px)` }}>
      <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: accent }}>{eyebrow}</div>
      <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 10px" }}>{children}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", minHeight: 130 }}>
        {names.map((n, i) => (
          <Reveal key={n} startFrac={start + 0.07 + i * 0.045} endFrac={start + 0.12 + i * 0.045}>
            <div style={{ padding: "8px 22px", border: `2px solid ${accent}`, borderRadius: 40, background: C.card, fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.white }}>{n}</div>
          </Reveal>
        ))}
      </div>
      <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 6 }}>{foot}</div>
    </div>
  );
};

export const Sc16: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const open = ease(p(0.08, 0.3));
  const fireOn = ease(p(0.38, 0.46));
  const wavesOn = ease(p(0.5, 0.58));
  const glow = 0.5 + 0.5 * Math.sin(frame / 16);
  const join = ease(p(0.76, 0.86));
  return (
    <Paper>
      <div style={{ position: "absolute", top: 64, left: 64, right: 64, display: "flex", justifyContent: "space-between" }}>
        <div style={{ width: 800 }}>
          <Reveal startFrac={0.02} endFrac={0.08}>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, color: C.white, textAlign: "center" }}>Nhánh đồng bằng</div>
          </Reveal>
        </div>
        <div style={{ width: 800 }}>
          <Reveal startFrac={0.34} endFrac={0.4}>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, color: C.amber, textAlign: "center" }}>Nhánh vùng cao</div>
          </Reveal>
        </div>
      </div>

      <div style={{ position: "absolute", top: 190, left: 64, right: 64, display: "flex", justifyContent: "space-between" }}>
        <Side eyebrow="TÊN CHỮ HÁN · PHẢ HỆ VƯƠNG QUYỀN" accent={C.cream} names={["Lạc Long Quân", "Âu Cơ"]} start={0.06} foot="được ghi trong thư tịch">
          <Scroll open={open} frame={frame} />
        </Side>
        <Side eyebrow="THƠ SỬ THI TRUYỀN MIỆNG" accent={C.amber} names={["Thần Nông", "Thần Rồng"]} start={0.36} foot="cốt truyện sơ khai, giữ bằng lời hát">
          <div>
            <Fire frame={frame} on={fireOn} />
            <Waves frame={frame} on={wavesOn} />
          </div>
        </Side>
      </div>

      {/* centre divider with pulsing thread */}
      <div
        style={{
          position: "absolute",
          left: 958,
          top: 190,
          width: 4,
          height: 560,
          background: `linear-gradient(to bottom, rgba(217,164,65,0), rgba(217,164,65,${0.5 + glow * 0.4}), rgba(217,164,65,0))`,
        }}
      />

      {/* conclusion lockup */}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 100,
          textAlign: "center",
          opacity: join,
          transform: `scale(${0.94 + 0.06 * join})`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "16px 56px",
            background: "rgba(26,23,20,0.9)",
            border: `2px solid ${C.amber}`,
            borderRadius: 18,
            boxShadow: `0 0 ${30 + glow * 30}px rgba(217,164,65,0.35)`,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 60,
            color: C.white,
            letterSpacing: 1,
          }}
        >
          HAI ANH EM · HAI GIỌNG KỂ · <span style={{ color: C.amber }}>CHUNG MỘT KÝ ỨC</span>
        </div>
      </div>
      <SourceTag text="Văn bản Việt cổ · Truyện cổ Mường" />
    </Paper>
  );
};
