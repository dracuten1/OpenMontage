import React from "react";
import { C, FONT, toneFill, toneText, type Tone } from "../theme";
import { Spoken } from "../timing";

export interface BadgeProps {
  text: string;
  at: number;
  tone?: Tone;
  size?: number;
}

/** Small topic pill (e.g. "VĨ MÔ"). Tinted plate with text-safe tone colour. */
export const Badge: React.FC<BadgeProps> = ({ text, at, tone = "blue", size = 28 }) => (
  <Spoken at={at} fromY={10}>
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 20px", borderRadius: 999, fontFamily: FONT,
        fontSize: size, fontWeight: 700, letterSpacing: 1, color: toneText(tone), background: C.surface, border: `2px solid ${toneFill(tone)}`,
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: 6, background: toneFill(tone) }} />
      {text}
    </div>
  </Spoken>
);

export interface SourceTagProps {
  /** e.g. "Nguồn: Tổng cục Thống kê" -- take from research_digest sources only */
  text: string;
  at?: number;
}

/** Bottom-left source line, sits above the caption band (y ~ 900). */
export const SourceTag: React.FC<SourceTagProps> = ({ text, at = 0 }) => (
  <div style={{ position: "absolute", left: 96, bottom: 148, fontFamily: FONT }}>
    <Spoken at={at} fromY={6}>
      <div style={{ fontSize: 24, fontWeight: 500, color: C.muted }}>{text}</div>
    </Spoken>
  </div>
);

export interface LowerThirdProps {
  title: string;
  subtitle?: string;
  at: number;
  tone?: Tone;
  until?: number;
}

/** Lower-third strip with accent bar, placed left above SourceTag/captions (y ~ 760-880). */
export const LowerThird: React.FC<LowerThirdProps> = ({ title, subtitle, at, tone = "blue", until }) => (
  <div style={{ position: "absolute", left: 96, bottom: 210, fontFamily: FONT }}>
    <Spoken at={at} fromX={-40} fromY={0} until={until}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 18, background: "rgba(22,27,34,0.92)", borderRadius: 14, padding: "14px 28px 14px 0", border: `1px solid ${C.border}` }}>
        <div style={{ width: 8, borderRadius: 4, background: toneFill(tone), marginLeft: 14 }} />
        <div>
          <div style={{ fontSize: 40, fontWeight: 700, color: C.text }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 28, fontWeight: 500, color: C.textSoft }}>{subtitle}</div> : null}
        </div>
      </div>
    </Spoken>
  </div>
);
