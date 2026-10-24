// S1Panel — Scene 1 visual layer for NewsDaily20261020Demo.
// ONLY whitelisted labels are visible (data_whitelist.json):
//   "15 ngân hàng", "hạ lãi suất tiết kiệm", "kỳ hạn từ 6 tháng",
//   "giảm 0,5–0,7 điểm phần trăm", "ngày 19/10".
// P2 attribution ("Theo bản tin ngày 20/10...") is SPOKEN-ONLY — no display text.
// Visuals: abstract bank/coins geometry (SVG coin circles, vault arch, percentage
// arc). Static camera — no zoom/pan on the whole scene; only element reveals move.
// All reveals speech-locked to real word spans (timing.ts).
import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  type SpringConfig,
} from "remotion";
import { C, FONT, SPRING_SMOOTH, SPRING_SNAPPY } from "./theme";
import { REVEAL_AT } from "./timing";

/** Fade+rise reveal driven by global frame (elements live at comp top level). */
const useReveal = (at: number, cfg = SPRING_SMOOTH) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: cfg, durationInFrames: 18 });
  const op = interpolate(frame - at, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity: op, translateY: (1 - p) * 26, scale: 0.985 + p * 0.015 };
};

const RevealBox: React.FC<{
  at: number;
  cfg?: Partial<SpringConfig>;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ at, cfg = SPRING_SMOOTH, style, children }) => {
  const r = useReveal(at, cfg);
  if (r.opacity <= 0) return null;
  return (
    <div
      style={{
        opacity: r.opacity,
        transform: `translateY(${r.translateY}px) scale(${r.scale})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// --- Abstract geometry (no data semantics: no axes, no bars, no rate levels) ---

/** Stack of coin circles — abstract savings geometry. */
const CoinStack: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const coins = [0, 1, 2, 3].map((i) => {
    const p = spring({
      frame: frame - (at + i * 3),
      fps,
      config: SPRING_SNAPPY,
      durationInFrames: 16,
    });
    return { i, p };
  });
  if (frame < at) return null;
  return (
    <g>
      {coins.map(({ i, p }) => (
        <ellipse
          key={i}
          cx={x}
          cy={y - i * 26 * p}
          rx={64}
          ry={20}
          fill="none"
          stroke={i === 3 ? C.gold : C.borderGold}
          strokeWidth={i === 3 ? 3 : 2}
          opacity={0.28 + i * 0.16}
        />
      ))}
    </g>
  );
};

/** Vault arch — abstract bank geometry (pediment + columns). */
const VaultArch: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: SPRING_SMOOTH, durationInFrames: 24 });
  if (frame < at) return null;
  return (
    <g opacity={0.5 * p} transform={`translate(${x} ${y}) scale(${0.97 + p * 0.03})`}>
      {/* arch */}
      <path
        d="M -110 60 L -110 -10 A 110 110 0 0 1 110 -10 L 110 60"
        fill="none"
        stroke={C.borderGold}
        strokeWidth={3}
      />
      {/* keystone */}
      <path d="M -16 -112 L 16 -112 L 10 -84 L -10 -84 Z" fill={C.gold} opacity={0.85} />
      {/* door arc hint */}
      <path
        d="M -52 60 L -52 6 A 52 52 0 0 1 52 6 L 52 60"
        fill="none"
        stroke={C.gold}
        strokeWidth={2}
        opacity={0.7}
      />
      <line x1={-110} y1={60} x2={110} y2={60} stroke={C.borderGold} strokeWidth={3} />
    </g>
  );
};

/** Percentage arc — abstract "%" glyph geometry (not a chart value). */
const PercentArc: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sweep = spring({ frame: frame - at, fps, config: SPRING_SNAPPY, durationInFrames: 22 });
  if (frame < at) return null;
  const end = -90 + sweep * 300;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const r = 78;
  const x1 = x + r * Math.cos(rad(-90));
  const y1 = y + r * Math.sin(rad(-90));
  const x2 = x + r * Math.cos(rad(end));
  const y2 = y + r * Math.sin(rad(end));
  const large = sweep * 300 > 180 ? 1 : 0;
  return (
    <g opacity={0.75}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={C.border} strokeWidth={2} />
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        fill="none"
        stroke={C.gold}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <circle cx={x - 26} cy={y - 8} r={11} fill="none" stroke={C.gold} strokeWidth={3} opacity={0.8} />
      <circle cx={x + 26} cy={y + 8} r={11} fill="none" stroke={C.gold} strokeWidth={3} opacity={0.8} />
      <line
        x1={x + 16}
        y1={y - 22}
        x2={x - 16}
        y2={y + 22}
        stroke={C.gold}
        strokeWidth={3}
        opacity={0.8}
      />
    </g>
  );
};

/** Restrained backdrop glow — static (no zoom/pan). */
const BackdropGlow: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(900px 620px at 50% 34%, ${C.bgGlow}, transparent 70%)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 520,
        background: "linear-gradient(180deg, transparent, rgba(4, 9, 20, 0.72))",
      }}
    />
  </>
);

export const S1Panel: React.FC = () => {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <BackdropGlow />

      {/* Abstract geometry canvas */}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0 }}
      >
        <VaultArch x={540} y={470} at={REVEAL_AT.headline15 + 2} />
        <CoinStack x={260} y={870} at={REVEAL_AT.cutLabel + 2} />
        <CoinStack x={820} y={870} at={REVEAL_AT.cutLabel + 5} />
        <PercentArc x={540} y={1180} at={REVEAL_AT.cutChip + 2} />
      </svg>

      {/* Headline block — top third */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 560,
          display: "flex",
          flexDirection: "column",
          gap: 34,
        }}
      >
        <RevealBox at={REVEAL_AT.headline15}>
          <div
            style={{
              fontFamily: FONT,
              color: C.text,
              fontSize: 108,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1,
            }}
          >
            <span style={{ color: C.gold }}>15</span> ngân hàng
          </div>
        </RevealBox>

        <RevealBox at={REVEAL_AT.cutLabel}>
          <div
            style={{
              display: "inline-block",
              fontFamily: FONT,
              color: C.text,
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.15,
              borderBottom: `4px solid ${C.gold}`,
              paddingBottom: 14,
            }}
          >
            hạ lãi suất tiết kiệm
          </div>
        </RevealBox>
      </div>

      {/* Detail rows — middle band */}
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 1310,
          display: "flex",
          flexDirection: "column",
          gap: 28,
          alignItems: "flex-start",
        }}
      >
        <RevealBox at={REVEAL_AT.termLabel} cfg={SPRING_SNAPPY}>
          <div
            style={{
              fontFamily: FONT,
              color: C.textSoft,
              fontSize: 52,
              fontWeight: 600,
              background: C.surface,
              border: `2px solid ${C.border}`,
              borderRadius: 18,
              padding: "18px 34px",
            }}
          >
            kỳ hạn từ 6 tháng
          </div>
        </RevealBox>

        {/* Numeral chip — highlighted */}
        <RevealBox at={REVEAL_AT.cutChip} cfg={SPRING_SNAPPY}>
          <div
            style={{
              fontFamily: FONT,
              color: C.gold,
              fontSize: 60,
              fontWeight: 800,
              background: C.surfaceGold,
              border: `3px solid ${C.borderGold}`,
              borderRadius: 22,
              padding: "22px 38px",
              boxShadow: "0 0 60px rgba(245, 196, 112, 0.18)",
            }}
          >
            giảm 0,5–0,7 điểm phần trăm
          </div>
        </RevealBox>
      </div>

      {/* Date chip — bottom of panel */}
      <RevealBox at={REVEAL_AT.dateChip} cfg={SPRING_SNAPPY} style={{ position: "absolute", left: 80, bottom: 260 }}>
        <div
          style={{
            fontFamily: FONT,
            color: C.textSoft,
            fontSize: 44,
            fontWeight: 600,
            border: `2px dashed ${C.borderGold}`,
            borderRadius: 16,
            padding: "14px 30px",
            letterSpacing: 1,
          }}
        >
          ngày 19/10
        </div>
      </RevealBox>
    </div>
  );
};
