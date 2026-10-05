import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT, fmtVi, toneFill, toneText, type Tone } from "../theme";
import { Spoken } from "../timing";

export interface CountUpProps {
  /** scene-local frame where counting starts (the frame the number is SPOKEN) */
  at: number;
  to: number;
  from?: number;
  decimals?: number;
  /** frames to count (default 24) */
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
}

/** Number that counts from `from` to `to` starting at `at`; Vietnamese formatting (1.234,5). Hidden before `at`. */
export const CountUp: React.FC<CountUpProps> = ({ at, to, from = 0, decimals = 0, duration = 24, prefix = "", suffix = "", style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const v = from + (to - from) * p;
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", opacity: frame < at ? 0 : 1, ...style }}>
      {prefix}
      {fmtVi(v, decimals)}
      {suffix}
    </span>
  );
};

export interface StatCardProps {
  at: number;
  label: string;
  value: number;
  decimals?: number;
  prefix?: string; // e.g. "+"
  suffix?: string; // e.g. "%"
  unit?: string; // e.g. "đ/lít" shown small after the number
  tone?: Tone;
  /** caption under the number (e.g. "so với kỳ trước") */
  note?: string;
  width?: number;
  /** number font size (default 120) */
  size?: number;
  countDuration?: number;
}

/** Stat card: label, big CountUp number (fires at `at`), optional unit + note. Values must come from research_digest. */
export const StatCard: React.FC<StatCardProps> = ({
  at, label, value, decimals = 0, prefix = "", suffix = "", unit, tone = "blue", note, width = 520, size = 120, countDuration = 24,
}) => (
  <Spoken at={at} fromY={28} fromScale={0.96}>
    <div
      style={{
        width, boxSizing: "border-box", padding: "28px 32px", borderRadius: 24, background: C.surface,
        border: `1px solid ${C.border}`, borderTop: `6px solid ${toneFill(tone)}`, fontFamily: FONT,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 600, color: C.textSoft, letterSpacing: 0.3 }}>{label}</div>
      <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 12, color: toneText(tone), fontWeight: 800, fontSize: size, lineHeight: 1 }}>
        <CountUp at={at} to={value} decimals={decimals} prefix={prefix} suffix={suffix} duration={countDuration} />
        {unit ? <span style={{ fontSize: 32, fontWeight: 600, color: C.textSoft }}>{unit}</span> : null}
      </div>
      {note ? <div style={{ marginTop: 14, fontSize: 28, fontWeight: 500, color: C.muted }}>{note}</div> : null}
    </div>
  </Spoken>
);
