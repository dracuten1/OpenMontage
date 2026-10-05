import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT, MONO_FONT, fmtVi, toneFill, toneText, type Tone } from "../theme";
import { Spoken } from "../timing";

export interface ComparisonBarProps {
  label: string;
  tag?: string;
  value: number;
  maxValue?: number;
  unit?: string;
  at: number;
  tone?: Tone;
  barDuration?: number;
  decimals?: number;
  note?: string;
}

export const ComparisonBarItem: React.FC<ComparisonBarProps> = ({
  label,
  tag,
  value,
  maxValue = 150,
  unit = "",
  at,
  tone = "blue",
  barDuration = 24,
  decimals = 0,
  note,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [at, at + barDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  const widthPct = Math.min(100, (value / maxValue) * 100 * progress);

  return (
    <div style={{ width: "100%", marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
          fontFamily: FONT,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {tag ? (
            <span
              style={{
                padding: "4px 14px",
                borderRadius: 8,
                background: `${toneFill(tone)}20`,
                border: `1px solid ${toneFill(tone)}55`,
                color: toneText(tone),
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              {tag}
            </span>
          ) : null}
          <span style={{ fontSize: 28, fontWeight: 600, color: C.text }}>
            {label}
          </span>
          {note ? (
            <span style={{ fontSize: 20, color: C.muted }}>({note})</span>
          ) : null}
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: toneText(tone),
            fontFamily: MONO_FONT,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {fmtVi(value * progress, decimals)}
          {unit ? <span style={{ fontSize: 26, marginLeft: 6, color: C.textSoft }}>{unit}</span> : null}
        </div>
      </div>

      {/* Bar container */}
      <div
        style={{
          width: "100%",
          height: 32,
          borderRadius: 16,
          background: "rgba(30, 41, 59, 0.7)",
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${widthPct}%`,
            height: "100%",
            borderRadius: 16,
            background: `linear-gradient(90deg, ${toneFill(tone)} 0%, ${toneText(tone)} 100%)`,
            boxShadow: `0 0 20px ${toneFill(tone)}55`,
            transition: "width 0.05s linear",
          }}
        />
      </div>
    </div>
  );
};
