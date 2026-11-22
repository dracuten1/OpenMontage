import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, MOTION } from "../news/theme";

export interface ComparisonSide {
  kicker: string;
  headline: string;
  metric: string;
  bullets: string[];
  color?: string;
  enterFrame: number;
  endFrame: number;
}

export interface ComparisonSplitProps {
  left: ComparisonSide;
  right: ComparisonSide;
  settleAllFrame?: number;
  width?: number;
  height?: number;
  dividerLabel?: string;
}

export interface ComparisonSplitLayout {
  width: number;
  height: number;
  columnWidth: number;
  dividerGap: number;
}

const DEFAULT_WIDTH = 850;
const DEFAULT_HEIGHT = 480;
const DIVIDER_GAP = 56;

/** Pure geometry helper for consumer-side layoutGuard checks. */
export function comparisonSplitLayout(
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  dividerGap = DIVIDER_GAP,
): ComparisonSplitLayout {
  return {
    width,
    height,
    columnWidth: Math.floor((width - dividerGap) / 2),
    dividerGap,
  };
}

/**
 * Side-by-side editorial split comparison with animated center SVG divider
 * and speech-locked highlight windows for left vs right perspectives.
 */
export const ComparisonSplit: React.FC<ComparisonSplitProps> = ({
  left,
  right,
  settleAllFrame,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  dividerLabel = "VS",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const layout = comparisonSplitLayout(width, height);
  const finalSettle = settleAllFrame ?? Math.max(left.endFrame, right.endFrame) + 12;
  const settleAll = frame >= finalSettle;

  const firstEnter = Math.min(left.enterFrame, right.enterFrame);
  const lineProgress = interpolate(frame, [firstEnter, firstEnter + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineLen = Math.max(1, height - 48);

  const renderColumn = (side: ComparisonSide, fromLeft: boolean) => {
    const p = spring({
      frame: Math.max(0, frame - side.enterFrame),
      fps,
      config: MOTION.settle,
    });
    const active = !settleAll && frame >= side.enterFrame && frame < side.endFrame;
    const past = !settleAll && frame >= side.endFrame;
    const op =
      frame < side.enterFrame ? 0.15 : settleAll ? 1.0 : active ? 1.0 : past ? 0.56 : 0.15;
    const accent = side.color ?? (fromLeft ? COLORS.amber : COLORS.crimson);
    const dx = interpolate(p, [0, 1], [fromLeft ? -16 : 16, 0]);

    return (
      <div
        style={{
          width: layout.columnWidth,
          minHeight: height,
          padding: "20px 20px",
          borderRadius: 4,
          backgroundColor: active ? COLORS.surfaceAlt : COLORS.surface,
          border: `1px solid ${COLORS.line}`,
          borderTop: active ? `4px solid ${accent}` : `2px solid ${COLORS.ink}`,
          opacity: op,
          transform: `translateX(${dx}px)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 12,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 24,
              fontWeight: 800,
              color: accent,
              letterSpacing: 0.4,
            }}
          >
            {side.kicker}
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 30,
              fontWeight: 800,
              color: COLORS.ink,
              lineHeight: 1.18,
            }}
          >
            {side.headline}
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 36,
              fontWeight: 800,
              color: COLORS.crimson,
              lineHeight: 1.1,
              marginTop: 4,
            }}
          >
            {side.metric}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {side.bullets.map((b, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontFamily: FONTS.body,
                fontSize: 24,
                color: COLORS.muted,
                lineHeight: 1.32,
              }}
            >
              <span style={{ color: accent, fontWeight: 800 }}>•</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      data-comparison-split="true"
      style={{
        position: "relative",
        width,
        minHeight: height,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "space-between",
      }}
    >
      {renderColumn(left, true)}

      {/* Animated SVG center split spine + badge */}
      <div
        style={{
          position: "relative",
          width: layout.dividerGap,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width={layout.dividerGap}
          height={height}
          viewBox={`0 0 ${layout.dividerGap} ${height}`}
          style={{ position: "absolute", inset: 0 }}
        >
          <line
            x1={layout.dividerGap / 2}
            y1={24}
            x2={layout.dividerGap / 2}
            y2={height - 24}
            stroke={COLORS.line}
            strokeWidth={2}
            strokeDasharray={lineLen}
            strokeDashoffset={lineLen * (1 - lineProgress)}
          />
        </svg>
        <div
          style={{
            position: "relative",
            zIndex: 3,
            padding: "5px 10px",
            borderRadius: 2,
            backgroundColor: COLORS.surface,
            border: `2px solid ${COLORS.ink}`,
            color: COLORS.ink,
            fontFamily: FONTS.mono,
            fontSize: 24,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {dividerLabel}
        </div>
      </div>

      {renderColumn(right, false)}
    </div>
  );
};
