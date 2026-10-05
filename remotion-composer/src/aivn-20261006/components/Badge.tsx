import React from "react";
import { C, FONT, toneFill, toneText, type Tone } from "../theme";
import { Spoken } from "../timing";

export interface BadgeProps {
  text: string;
  at: number;
  tone?: Tone;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  at,
  tone = "blue",
  icon,
  style,
}) => (
  <Spoken at={at} fromY={14} fromScale={0.92}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 18px",
        borderRadius: 999,
        background: `${toneFill(tone)}18`,
        border: `1px solid ${toneFill(tone)}55`,
        color: toneText(tone),
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        boxShadow: `0 0 20px ${toneFill(tone)}22`,
        ...style,
      }}
    >
      {icon ? <span style={{ display: "flex", alignItems: "center" }}>{icon}</span> : null}
      <span>{text}</span>
    </div>
  </Spoken>
);

export interface SourceTagProps {
  source: string;
  at: number;
  style?: React.CSSProperties;
}

export const SourceTag: React.FC<SourceTagProps> = ({ source, at, style }) => (
  <Spoken at={at} fromY={8}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 8,
        background: "rgba(15, 23, 42, 0.75)",
        border: `1px solid ${C.border}`,
        color: C.muted,
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: 18,
        letterSpacing: 0.5,
        ...style,
      }}
    >
      <span style={{ color: C.textSoft, fontWeight: 600 }}>Nguồn:</span>
      <span>{source}</span>
    </div>
  </Spoken>
);

export const DividerLine: React.FC<{ at: number; color?: string; width?: number | string }> = ({
  at,
  color = C.borderHi,
  width = "100%",
}) => (
  <Spoken at={at} fromScale={0.98}>
    <div
      style={{
        width,
        height: 1,
        backgroundColor: color,
        margin: "12px 0",
        opacity: 0.7,
      }}
    />
  </Spoken>
);
