// Shared chrome + primitives — crypto-tradingagents-20261016.
import React from "react";
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, FPS, LAY, wrap } from "./theme";

export const PUB = "crypto-tradingagents-20261016";

export const useReveal = (at: number): { opacity: number; transform: string } => {
  const f = useCurrentFrame();
  const p = spring({ frame: Math.max(0, f - at), fps: FPS, config: { damping: 200 } });
  return { opacity: p, transform: `translateY(${(1 - p) * 16}px)` };
};

export const Reveal: React.FC<{
  at: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ at, style, children }) => (
  <div style={{ position: "absolute", ...useReveal(at), ...style }}>{children}</div>
);

/** Inline reveal span — for value fragments inside one line. */
export const RV: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  children,
  style,
}) => <span style={{ display: "inline-block", ...useReveal(at), ...style }}>{children}</span>;

export const Chip: React.FC<{ children: React.ReactNode; tone: string; style?: React.CSSProperties }> = ({
  children,
  tone,
  style,
}) => (
  <span
    style={{
      display: "inline-block",
      padding: "8px 16px",
      borderRadius: 10,
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: 1,
      color: tone,
      background: C.bg,
      border: `2px solid ${tone}`,
      fontFamily: FONT,
      ...style,
    }}
  >
    {children}
  </span>
);

export const SceneShell: React.FC<{
  tag: string;
  layer: string;
  mood?: string;
  children: React.ReactNode;
}> = ({ tag, layer, mood, children }) => (
  <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
    {mood ? (
      <>
        <Img
          src={staticFile(`${PUB}/${mood}`)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.16 }}
        />
        <AbsoluteFill
          style={{ background: "linear-gradient(180deg, rgba(13,17,23,0.6) 0%, rgba(13,17,23,0.9) 55%, rgba(13,17,23,0.98) 100%)" }}
        />
      </>
    ) : null}
    <div
      style={{
        position: "absolute",
        left: LAY.x,
        top: LAY.headerY,
        padding: "6px 14px",
        borderRadius: 8,
        border: `1px solid ${C.line}`,
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: 2,
        color: C.muted,
      }}
    >
      {tag}
    </div>
    <div
      style={{
        position: "absolute",
        right: LAY.x,
        top: LAY.headerY,
        padding: "6px 14px",
        borderRadius: 8,
        background: "rgba(139,148,158,0.12)",
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: 2,
        color: C.text,
      }}
    >
      {layer}
    </div>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: LAY.footerY,
        textAlign: "center",
        fontSize: 26,
        fontWeight: 700,
        color: C.muted,
      }}
    >
      Nguồn: báo cáo phân tích 15/10
    </div>
    {children}
  </AbsoluteFill>
);

export const HTitle: React.FC<{ text: string; at?: number; y?: number; size?: number }> = ({
  text,
  at = 0,
  y = LAY.titleY,
  size = 64,
}) => (
  <Reveal at={at} style={{ left: LAY.x, top: y, width: LAY.w }}>
    {wrap(text, LAY.maxTextW, size).map((ln, i) => (
      <div key={i} style={{ fontSize: size, fontWeight: 800, color: C.text, lineHeight: 1.15, letterSpacing: 1 }}>
        {ln}
      </div>
    ))}
  </Reveal>
);

export const HSub: React.FC<{ at: number; tone: string; children: React.ReactNode }> = ({
  at,
  tone,
  children,
}) => (
  <Reveal at={at} style={{ left: LAY.x, top: LAY.subY, fontSize: 30, fontWeight: 700, color: tone, letterSpacing: 1 }}>
    {children}
  </Reveal>
);

export const ObsRow: React.FC<{
  at: number;
  y: number;
  h: number;
  label: React.ReactNode;
  value?: React.ReactNode;
  tone?: string;
  labelTone?: string;
  valueSize?: number;
  labelSize?: number;
}> = ({ at, y, h, label, value, tone = C.text, labelTone, valueSize = 48, labelSize = 36 }) => (
  <Reveal
    at={at}
    style={{
      left: LAY.x,
      top: y,
      width: LAY.w,
      height: h,
      background: C.surface,
      border: `1px solid ${C.line}`,
      borderRadius: 16,
      padding: "24px 36px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 10,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
      <div style={{ fontSize: labelSize, fontWeight: 700, color: labelTone ?? tone, lineHeight: 1.25, maxWidth: 500 }}>{label}</div>
      {value ? (
        <div style={{ fontSize: valueSize, fontWeight: 800, color: tone, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
          {value}
        </div>
      ) : null}
    </div>
  </Reveal>
);

/** Scenario lane: trigger chip header + absolutely-positioned rows inside. */
export const Lane: React.FC<{
  at: number;
  y: number;
  h: number;
  tone: string;
  chip: React.ReactNode;
  children?: React.ReactNode;
}> = ({ at, y, h, tone, chip, children }) => (
  <Reveal
    at={at}
    style={{
      left: LAY.x,
      top: y,
      width: LAY.w,
      height: h,
      background: C.surface,
      border: `1px solid ${C.line}`,
      borderLeft: `6px solid ${tone}`,
      borderRadius: 16,
      boxSizing: "border-box",
    }}
  >
    <div style={{ position: "absolute", left: 32, top: 22 }}>{chip}</div>
    <div style={{ position: "absolute", inset: 0 }}>{children}</div>
  </Reveal>
);

/** Condition row inside a Lane (absolute top, relative to lane inner box). */
export const CondRow: React.FC<{ at: number; top: number; tone: string; size?: number; children: React.ReactNode }> = ({
  at,
  top,
  tone,
  size = 32,
  children,
}) => (
  <Reveal at={at} style={{ left: 58, right: 32, top, fontSize: size, fontWeight: 700, color: C.text, letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 14 }}>
    <span style={{ width: 10, height: 10, borderRadius: 5, background: tone, display: "inline-block" }} />
    {children}
  </Reveal>
);

/** Outcome bar inside a Lane. */
export const Outcome: React.FC<{ at: number; top: number; tone: string; children: React.ReactNode }> = ({
  at,
  top,
  tone,
  children,
}) => (
  <Reveal
    at={at}
    style={{
      left: 58,
      right: 32,
      top,
      height: 70,
      borderRadius: 12,
      border: `2px solid ${tone}`,
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: tone,
      fontSize: 34,
      fontWeight: 800,
      letterSpacing: 1,
    }}
  >
    {children}
  </Reveal>
);

/** Status bar in the 1600..1710 area (page coords). */
export const Status: React.FC<{ at: number; tone: string; children: React.ReactNode; size?: number }> = ({
  at,
  tone,
  children,
  size = 38,
}) => (
  <Reveal
    at={at}
    style={{
      left: LAY.x,
      top: LAY.statusY,
      width: LAY.w,
      height: 80,
      borderRadius: 14,
      background: C.surface,
      border: `2px solid ${tone}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: tone,
      fontSize: size,
      fontWeight: 800,
      letterSpacing: 1,
      boxSizing: "border-box",
    }}
  >
    {children}
  </Reveal>
);

/** Short disclaimer — shown at video start (s01) and end (s09). */
export const Disc: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: LAY.discY,
      textAlign: "center",
      fontSize: 26,
      fontWeight: 700,
      color: C.muted,
    }}
  >
    Phân tích có điều kiện · Không phải khuyến nghị đầu tư
  </div>
);
