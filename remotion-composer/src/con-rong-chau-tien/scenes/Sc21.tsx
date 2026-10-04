import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, LabBadge, Reveal, CountUp, SceneTitle, InkPath, useFrac } from "../common";

// Sc21 - Bước vào phòng lab: Lipson et al. 2018 (Science), 18 genome cổ đại, 4.100-1.700 năm trước.
// Order (narration s11): phòng lab -> Lipson / Science -> 18 genome -> 4.100 đến 1.700 năm trước.

const helix = (phase: number, x0: number, amp: number, y0: number, y1: number) => {
  let a = "";
  let b = "";
  for (let y = y0; y <= y1; y += 4) {
    const s = Math.sin(y * 0.13 + phase);
    a += `${y === y0 ? "M" : "L"}${(x0 + amp * s).toFixed(1)},${y} `;
    b += `${y === y0 ? "M" : "L"}${(x0 - amp * s).toFixed(1)},${y} `;
  }
  return { a, b };
};

const GenomeIcon: React.FC<{ index: number; startFrac: number; endFrac: number }> = ({ index, startFrac, endFrac }) => {
  const { frame, p } = useFrac();
  const t = ease(p(startFrac, endFrac));
  const { a, b } = helix(frame * 0.09 + index * 0.8, 40, 15, 16, 112);
  return (
    <svg
      width={80}
      height={128}
      viewBox="0 0 80 128"
      style={{ opacity: t, transform: `translateY(${(1 - t) * 18}px) scale(${0.7 + 0.3 * t})` }}
    >
      <rect x={6} y={4} width={68} height={120} rx={30} fill="rgba(127,209,200,0.08)" stroke={C.teal} strokeWidth={3} />
      <path d={a} fill="none" stroke={C.teal} strokeWidth={3.5} strokeLinecap="round" />
      <path d={b} fill="none" stroke={C.white} strokeWidth={3.5} strokeLinecap="round" opacity={0.9} />
    </svg>
  );
};

export const Sc21: React.FC<SceneProps> = () => {
  const { dur, frame, p } = useFrac();
  const sweep = p(0.0, 0.16);
  const sweepY = -40 + sweep * 1160;
  const sweepOpacity = sweep <= 0 || sweep >= 1 ? 0 : 0.9;
  const glow = 0.5 + 0.5 * Math.sin((frame / dur) * Math.PI * 10);
  const iconStart = 0.36;
  const iconStep = 0.0085;

  return (
    <Paper variant="lab">
      <LabBadge />

      <div style={{ position: "absolute", left: 64, top: 128 }}>
        <SceneTitle
          eyebrow="Bước vào phòng lab"
          title="GIẢI MÃ BỘ GEN CỔ ĐÔNG NAM Á"
          titleSize={76}
          maxWidth={1760}
          accent={C.teal}
          startFrac={0.03}
        />
      </div>

      <Reveal startFrac={0.18} endFrac={0.26} dy={20} style={{ position: "absolute", left: 64, top: 330 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 34,
            background: C.card,
            border: `2px solid ${C.teal}`,
            borderRadius: 10,
            padding: "20px 34px",
            boxShadow: `0 0 ${30 + 20 * glow}px rgba(127,209,200,${0.12 + 0.08 * glow})`,
          }}
        >
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.white }}>
            Lipson et al., Science (2018)
          </div>
          <div style={{ width: 2, height: 52, background: C.border }} />
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.cream }}>doi:10.1126/science.aat3188</div>
        </div>
      </Reveal>

      {/* stat: 18 */}
      <div style={{ position: "absolute", left: 64, top: 470, display: "flex", alignItems: "center", gap: 36 }}>
        <Reveal startFrac={0.3} endFrac={0.38}>
          <CountUp
            to={18}
            startFrac={0.3}
            endFrac={0.5}
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 300,
              lineHeight: 1,
              color: C.teal,
              textShadow: "0 0 40px rgba(127,209,200,0.35)",
            }}
          />
        </Reveal>
        <Reveal startFrac={0.34} endFrac={0.44}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 52, color: C.white, lineHeight: 1.2 }}>
            bộ genome
            <br />
            cổ đại
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, marginTop: 10 }}>Đông Nam Á</div>
        </Reveal>
      </div>

      {/* 18 genome icons */}
      <div
        style={{
          position: "absolute",
          left: 940,
          top: 500,
          width: 920,
          display: "flex",
          flexWrap: "wrap",
          gap: "28px 22px",
        }}
      >
        {Array.from({ length: 18 }).map((_, i) => (
          <GenomeIcon key={i} index={i} startFrac={iconStart + i * iconStep} endFrac={iconStart + i * iconStep + 0.05} />
        ))}
      </div>

      {/* timeline 4.100 -> 1.700 */}
      <div style={{ position: "absolute", left: 64, top: 856, width: 1792 }}>
        <svg width={1792} height={44} viewBox="0 0 1792 44" style={{ overflow: "visible" }}>
          <line x1={0} y1={22} x2={1792} y2={22} stroke={C.border} strokeWidth={4} />
          <InkPath d="M0,22 L1792,22" startFrac={0.58} endFrac={0.76} stroke={C.teal} strokeWidth={6} />
          <circle cx={8} cy={22} r={14} fill={C.bg} stroke={C.teal} strokeWidth={5} style={{ opacity: ease(p(0.58, 0.62)) }} />
          <circle cx={1784} cy={22} r={14} fill={C.bg} stroke={C.teal} strokeWidth={5} style={{ opacity: ease(p(0.74, 0.78)) }} />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <Reveal startFrac={0.58} endFrac={0.66} dy={10}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: C.white }}>
              4.100 <span style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 36, color: C.cream }}>năm trước</span>
            </div>
          </Reveal>
          <Reveal startFrac={0.74} endFrac={0.82} dy={10}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: C.white, textAlign: "right" }}>
              1.700 <span style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 36, color: C.cream }}>năm trước</span>
            </div>
          </Reveal>
        </div>
      </div>

      {/* scanline */}
      <AbsoluteFill style={{ pointerEvents: "none", opacity: sweepOpacity }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: sweepY,
            height: 4,
            background: C.teal,
            boxShadow: "0 0 36px 10px rgba(127,209,200,0.55)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: sweepY - 180,
            height: 180,
            background: "linear-gradient(to bottom, rgba(127,209,200,0), rgba(127,209,200,0.14))",
          }}
        />
      </AbsoluteFill>
    </Paper>
  );
};
