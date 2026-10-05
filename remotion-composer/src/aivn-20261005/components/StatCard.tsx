import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT, fmtVi, toneFill, toneText, type Tone } from "../theme";
import { Spoken } from "../timing";

export interface CountUpProps {
  at: number;
  to: number;
  from?: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
}

export const CountUp: React.FC<CountUpProps> = ({
  at,
  to,
  from = 0,
  decimals = 0,
  duration = 24,
  prefix = "",
  suffix = "",
  style,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const v = from + (to - from) * p;
  return (
    <span
      style={{
        fontVariantNumeric: "tabular-nums",
        opacity: frame < at ? 0 : 1,
        ...style,
      }}
    >
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
  prefix?: string;
  suffix?: string;
  unit?: string;
  tone?: Tone;
  note?: string;
  width?: number | string;
  size?: number;
  countDuration?: number;
  style?: React.CSSProperties;
}

export const StatCard: React.FC<StatCardProps> = ({
  at,
  label,
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  unit,
  tone = "cyan",
  note,
  width = 540,
  size = 130,
  countDuration = 24,
  style,
}) => (
  <Spoken at={at} fromY={28} fromScale={0.95}>
    <div
      style={{
        width,
        boxSizing: "border-box",
        padding: "32px 36px",
        borderRadius: 24,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderTop: `6px solid ${toneFill(tone)}`,
        boxShadow: `0 12px 36px rgba(0, 0, 0, 0.5), 0 0 24px ${toneFill(tone)}22`,
        fontFamily: FONT,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 600,
          color: C.textSoft,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 14,
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          color: toneText(tone),
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: -1,
        }}
      >
        <CountUp
          at={at}
          to={value}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          duration={countDuration}
        />
        {unit ? (
          <span style={{ fontSize: 32, fontWeight: 600, color: C.textSoft }}>
            {unit}
          </span>
        ) : null}
      </div>
      {note ? (
        <div style={{ marginTop: 14, fontSize: 26, fontWeight: 500, color: C.muted }}>
          {note}
        </div>
      ) : null}
    </div>
  </Spoken>
);
