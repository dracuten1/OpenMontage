import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT, fmtVi, toneFill, toneText, type Tone } from "../theme";
import { Spoken } from "../timing";

export interface ComparisonBarProps {
  label: string;
  year: string;
  value: number; // e.g. 18 or 26
  maxValue?: number; // default 35 for percentage scaling
  at: number;
  tone?: Tone;
  barDuration?: number;
}

export const ComparisonBarItem: React.FC<ComparisonBarProps> = ({
  label,
  year,
  value,
  maxValue = 35,
  at,
  tone = "cyan",
  barDuration = 24,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [at, at + barDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  const widthPct = (value / maxValue) * 100 * progress;

  return (
    <div style={{ width: "100%", marginBottom: 32 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
          fontFamily: FONT,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 8,
              background: `${toneFill(tone)}22`,
              border: `1px solid ${toneFill(tone)}55`,
              color: toneText(tone),
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            {year}
          </span>
          <span style={{ fontSize: 32, fontWeight: 600, color: C.textSoft }}>
            {label}
          </span>
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: toneText(tone),
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {fmtVi(value * progress, 0)}%
        </div>
      </div>

      {/* Bar container */}
      <div
        style={{
          width: "100%",
          height: 38,
          borderRadius: 19,
          background: C.surfaceHi,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${widthPct}%`,
            borderRadius: 19,
            background: `linear-gradient(90deg, ${toneFill(tone)}88, ${toneFill(tone)})`,
            boxShadow: `0 0 20px ${toneFill(tone)}66`,
            transition: "width 0.05s linear",
          }}
        />
      </div>
    </div>
  );
};
