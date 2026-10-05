import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT, MONO_FONT, fmtVi, toneFill, toneText, type Tone } from "../theme";
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
  value: number | string;
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
  tone = "blue",
  note,
  width = 500,
  size = 110,
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
        borderTop: `5px solid ${toneFill(tone)}`,
        boxShadow: `0 16px 36px -8px rgba(0, 0, 0, 0.7), 0 0 24px ${toneFill(tone)}18`,
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: C.muted,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          lineHeight: 1,
          fontFamily: MONO_FONT,
        }}
      >
        <div
          style={{
            fontSize: size,
            fontWeight: 800,
            color: toneText(tone),
            letterSpacing: -2,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {typeof value === "number" ? (
            <CountUp
              at={at}
              to={value}
              decimals={decimals}
              duration={countDuration}
              prefix={prefix}
              suffix={suffix}
            />
          ) : (
            <span>
              {prefix}
              {value}
              {suffix}
            </span>
          )}
        </div>
        {unit ? (
          <span
            style={{
              fontSize: Math.round(size * 0.38),
              fontWeight: 700,
              color: C.textSoft,
              fontFamily: FONT,
            }}
          >
            {unit}
          </span>
        ) : null}
      </div>

      {note ? (
        <div
          style={{
            fontSize: 20,
            color: C.muted,
            marginTop: 18,
            lineHeight: 1.4,
            borderTop: `1px solid ${C.borderSubtle}`,
            paddingTop: 12,
          }}
        >
          {note}
        </div>
      ) : null}
    </div>
  </Spoken>
);
