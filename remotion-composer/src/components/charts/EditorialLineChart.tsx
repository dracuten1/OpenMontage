import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, MOTION } from "../news/theme";

export interface EditorialLineDatum {
  label: string;
  value: number;
  display?: string;
  annotation?: string;
}

export interface EditorialLineDeltaBadge {
  fromIndex: number;
  toIndex: number;
  text: string;
  color?: string;
}

export interface EditorialLineChartProps {
  data: EditorialLineDatum[];
  enterFrames: number[];
  drawFrames?: number;
  yDomain?: "zero" | "auto" | [number, number];
  width?: number;
  height?: number;
  lineColor?: string;
  areaFill?: boolean;
  accentColor?: string;
  highlightIndex?: number;
  deltaBadge?: EditorialLineDeltaBadge;
  title?: string;
  unit?: string;
  format?: (n: number) => string;
}

export interface EditorialLineDomain {
  min: number;
  max: number;
  hasAxisBreak: boolean;
}

export interface EditorialLineChartLayout {
  width: number;
  height: number;
  plotLeft: number;
  plotTop: number;
  plotWidth: number;
  plotHeight: number;
  points: Array<{ label: string; x: number; y: number }>;
  domain: EditorialLineDomain;
}

const DEFAULT_WIDTH = 820;
const DEFAULT_HEIGHT = 420;
const DEFAULT_DRAW_FRAMES = 36;
const defaultFormat = (n: number): string =>
  Number.isInteger(n) ? n.toLocaleString("vi-VN") : n.toFixed(1).replace(".", ",");

/**
 * Compute y-axis bounds and whether a non-zero truncated axis break indicator
 * is required so narrow-variance series remain visually honest.
 */
export function computeYDomain(
  values: number[],
  yDomain: "zero" | "auto" | [number, number] = "auto",
): EditorialLineDomain {
  if (values.length === 0) {
    return { min: 0, max: 1, hasAxisBreak: false };
  }
  if (Array.isArray(yDomain)) {
    const lo = Math.min(yDomain[0], yDomain[1]);
    const hi = Math.max(lo + 1e-6, yDomain[1]);
    return { min: lo, max: hi, hasAxisBreak: lo > 0 };
  }
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const span = Math.max(1e-6, vMax - vMin);
  if (yDomain === "zero") {
    const lo = Math.min(0, vMin);
    const hi = Math.max(lo + 1e-6, vMax + span * 0.15);
    return { min: lo, max: hi, hasAxisBreak: false };
  }
  const padLow = Math.max(span * 0.25, Math.abs(vMin) * 0.005);
  const padHigh = Math.max(span * 0.22, Math.abs(vMax) * 0.005);
  const lo = Math.max(0, vMin - padLow);
  const hi = Math.max(lo + 1e-6, vMax + padHigh);
  return { min: lo, max: hi, hasAxisBreak: lo > 0 };
}

/** Pure geometry helper for consumer-side layoutGuard assertions. */
export function editorialLineChartLayout(
  data: EditorialLineDatum[],
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  yDomain: "zero" | "auto" | [number, number] = "auto",
  hasTitle = true,
): EditorialLineChartLayout {
  const plotLeft = 86;
  const plotRight = width - 36;
  const plotTop = hasTitle ? 74 : 28;
  const plotBottom = height - 58;
  const plotWidth = Math.max(1, plotRight - plotLeft);
  const plotHeight = Math.max(1, plotBottom - plotTop);
  const domain = computeYDomain(
    data.map((d) => d.value),
    yDomain,
  );
  const denom = Math.max(1, data.length - 1);
  const points = data.map((d, idx) => {
    const x =
      data.length === 1 ? plotLeft + plotWidth / 2 : plotLeft + (idx / denom) * plotWidth;
    const norm = (d.value - domain.min) / Math.max(1e-6, domain.max - domain.min);
    const y = plotBottom - norm * plotHeight;
    return { label: d.label, x, y };
  });
  return {
    width,
    height,
    plotLeft,
    plotTop,
    plotWidth,
    plotHeight,
    points,
    domain,
  };
}

/**
 * Borderless Swiss / Economist line chart with explicit axis-break signaling,
 * speech-locked SVG path drawing, and high-contrast tabular callouts.
 */
export const EditorialLineChart: React.FC<EditorialLineChartProps> = ({
  data,
  enterFrames,
  drawFrames = DEFAULT_DRAW_FRAMES,
  yDomain = "auto",
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  lineColor = COLORS.vermilion,
  areaFill = true,
  accentColor = COLORS.ochre,
  highlightIndex,
  deltaBadge,
  title,
  unit,
  format = defaultFormat,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (enterFrames.length !== data.length) {
    throw new Error(
      `EditorialLineChart: enterFrames length (${enterFrames.length}) must match data length (${data.length}).`,
    );
  }

  const layout = editorialLineChartLayout(data, width, height, yDomain, Boolean(title));
  const { plotLeft, plotTop, plotWidth, plotHeight, points, domain } = layout;
  const plotBottom = plotTop + plotHeight;

  const polylinePath = points
    .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    points.length >= 2
      ? `${polylinePath} L ${points[points.length - 1].x.toFixed(1)} ${plotBottom.toFixed(1)} L ${points[0].x.toFixed(1)} ${plotBottom.toFixed(1)} Z`
      : "";

  let totalPathLen = 1;
  for (let i = 1; i < points.length; i++) {
    totalPathLen += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }

  const firstEnter = enterFrames[0] ?? 0;
  const lastEnter = enterFrames[enterFrames.length - 1] ?? firstEnter;
  const drawEnd = Math.max(firstEnter + Math.max(1, drawFrames), lastEnter + 8);
  const drawProgress = interpolate(frame, [firstEnter, drawEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dashOffset = totalPathLen * (1 - drawProgress);

  const yTicks = [0, 0.5, 1].map((frac) => ({
    value: domain.min + frac * (domain.max - domain.min),
    y: plotBottom - frac * plotHeight,
  }));

  return (
    <div
      data-editorial-line-chart="true"
      style={{
        position: "relative",
        width,
        height,
        borderTop: `3px solid ${COLORS.ink}`,
        borderBottom: `2px solid ${COLORS.ink}`,
        overflow: "hidden",
      }}
    >
      {/* Title & Axis-break header */}
      {title ? (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 28,
              fontWeight: 800,
              color: COLORS.ink,
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            {title}
            {unit ? ` (${unit})` : ""}
          </div>
          {domain.hasAxisBreak ? (
            <div
              style={{
                padding: "3px 10px",
                backgroundColor: COLORS.ink,
                borderLeft: `4px solid ${COLORS.highlighter}`,
                color: "#FFFFFF",
                fontFamily: FONTS.display,
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 0.6,
              }}
            >
              TRỤC RÚT GỌN
            </div>
          ) : null}
        </div>
      ) : null}

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="editorial-line-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.18} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0.01} />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & Y tick labels */}
        {yTicks.map((tick, idx) => (
          <g key={idx}>
            <line
              x1={plotLeft}
              y1={tick.y}
              x2={plotLeft + plotWidth}
              y2={tick.y}
              stroke={idx === 0 ? COLORS.ink : "rgba(11, 12, 14, 0.14)"}
              strokeDasharray={idx === 0 ? undefined : "5 5"}
              strokeWidth={idx === 0 ? 2 : 1}
            />
            <text
              x={plotLeft - 12}
              y={tick.y + 7}
              textAnchor="end"
              fill={COLORS.muted}
              fontFamily={FONTS.display}
              fontSize={26}
              fontWeight={800}
            >
              {format(tick.value)}
            </text>
          </g>
        ))}

        {/* Axis break zigzag when domainMin > 0 */}
        {domain.hasAxisBreak ? (
          <path
            d={`M ${plotLeft - 8} ${plotBottom + 10} L ${plotLeft + 4} ${plotBottom + 4} L ${plotLeft - 4} ${plotBottom - 2} L ${plotLeft + 8} ${plotBottom - 8}`}
            fill="none"
            stroke={COLORS.ochre}
            strokeWidth={2.5}
          />
        ) : null}

        {/* Area fill under curve */}
        {areaFill && areaPath ? (
          <path d={areaPath} fill="url(#editorial-line-area-grad)" opacity={drawProgress} />
        ) : null}

        {/* Animated SVG stroke path */}
        {polylinePath ? (
          <path
            d={polylinePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={5}
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeDasharray={totalPathLen}
            strokeDashoffset={dashOffset}
          />
        ) : null}

        {/* Per-point markers & labels */}
        {points.map((pt, idx) => {
          const datum = data[idx];
          const anchor = enterFrames[idx];
          const p = spring({
            frame: Math.max(0, frame - anchor),
            fps,
            config: MOTION.settle,
          });
          const visible = frame >= anchor;
          const isHi = idx === highlightIndex;
          const dotColor = isHi ? accentColor : lineColor;
          const valLabel = datum.display ?? format(datum.value);
          return (
            <g key={`${datum.label}-${idx}`}>
              <text
                x={pt.x}
                y={plotBottom + 36}
                textAnchor="middle"
                fill={isHi ? COLORS.ink : COLORS.muted}
                fontFamily={FONTS.display}
                fontSize={25}
                fontWeight={isHi ? 800 : 700}
              >
                {datum.label}
              </text>
              {visible ? (
                <g opacity={p}>
                  {isHi ? (
                    <circle cx={pt.x} cy={pt.y} r={14} fill={dotColor} opacity={0.22} />
                  ) : null}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHi ? 8 : 6}
                    fill={dotColor}
                    stroke={COLORS.surface}
                    strokeWidth={2.5}
                  />
                  <text
                    x={pt.x}
                    y={Math.max(plotTop + 24, pt.y - 16)}
                    textAnchor="middle"
                    fill={isHi ? accentColor : COLORS.ink}
                    fontFamily={FONTS.display}
                    fontSize={27}
                    fontWeight={900}
                  >
                    {valLabel}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Optional delta badge comparing two points */}
      {deltaBadge &&
      points[deltaBadge.fromIndex] &&
      points[deltaBadge.toIndex] &&
      frame >= (enterFrames[deltaBadge.toIndex] ?? 0) ? (
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 66,
            padding: "8px 16px",
            backgroundColor: COLORS.ink,
            borderLeft: `6px solid ${deltaBadge.color ?? accentColor}`,
            color: "#FFFFFF",
            fontFamily: FONTS.display,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: 0.6,
          }}
        >
          {deltaBadge.text}
        </div>
      ) : null}
    </div>
  );
};
