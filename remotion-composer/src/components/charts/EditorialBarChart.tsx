import {
  interpolate,
  useCurrentFrame,
} from "remotion";
import { COLORS, FONTS } from "../news/theme";

export interface EditorialBarDatum {
  label: string;
  value: number;
  display?: string;
}

export interface EditorialBarChartProps {
  data: EditorialBarDatum[];
  enterFrames: number[];
  growFrames?: number;
  direction?: "h" | "v";
  maxValue?: number;
  format?: (n: number) => string;
  highlightIndex?: number;
  glowWindow?: [number, number];
  countUp?: boolean;
  width?: number;
  rowHeight?: number;
  trackColor?: string;
  barColor?: string;
  labelColor?: string;
  valueColor?: string;
  showGrid?: boolean;
  showValues?: boolean;
  fontFamily?: string;
}

export interface EditorialBarChartLayout {
  width: number;
  height: number;
  direction: "h" | "v";
  rows: Array<{ label: string; left: number; top: number; width: number; height: number }>;
}

const DEFAULT_WIDTH = 700;
const DEFAULT_ROW_HEIGHT = 96;
const DEFAULT_GROW_FRAMES = 36;
const DEFAULT_TRACK = "#E2E2DC";
const DEFAULT_BAR = COLORS.vermilion;
const DEFAULT_FONT = FONTS.body;

const formatVietnamese = (n: number): string => Math.round(n).toLocaleString("vi-VN");

/**
 * Economist / FT precision editorial bar chart.
 * Vertical mode constrains pillar width (~76px) above a continuous 2px ink baseline
 * so multi-column charts never turn into giant filled squares.
 */
export const EditorialBarChart: React.FC<EditorialBarChartProps> = ({
  data,
  enterFrames,
  growFrames = DEFAULT_GROW_FRAMES,
  direction = "h",
  maxValue,
  format = formatVietnamese,
  highlightIndex,
  glowWindow,
  countUp = true,
  width = DEFAULT_WIDTH,
  rowHeight = DEFAULT_ROW_HEIGHT,
  trackColor = DEFAULT_TRACK,
  barColor = DEFAULT_BAR,
  labelColor = COLORS.ink,
  valueColor = COLORS.ink,
  showGrid = false,
  showValues = true,
  fontFamily = DEFAULT_FONT,
}) => {
  const frame = useCurrentFrame();
  if (enterFrames.length !== data.length) {
    throw new Error(
      `EditorialBarChart: enterFrames length (${enterFrames.length}) must match data length (${data.length}).`
    );
  }
  const ceiling = maxValue ?? Math.max(1, ...data.map((datum) => datum.value));
  const safeMax = Math.max(1, ceiling);
  const vertical = direction === "v";
  const plotWidth = width;
  const chartHeight = vertical ? rowHeight * 3 : data.length * rowHeight;
  const layout: EditorialBarChartLayout = {
    width: plotWidth,
    height: chartHeight,
    direction,
    rows: data.map((datum, index) => ({
      label: datum.label,
      left: vertical ? (index * plotWidth) / Math.max(1, data.length) : 0,
      top: vertical ? 0 : index * rowHeight,
      width: vertical ? plotWidth / Math.max(1, data.length) : plotWidth,
      height: vertical ? chartHeight : rowHeight,
    })),
  };

  return (
    <div
      data-editorial-bar-chart="true"
      style={{
        position: "relative",
        width: plotWidth,
        height: chartHeight,
        fontFamily,
        overflow: "visible",
      }}
    >
      {showGrid && !vertical
        ? [0.25, 0.5, 0.75, 1].map((fraction) => (
            <div
              key={fraction}
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: fraction * chartHeight,
                borderTop: `1px solid ${COLORS.line}`,
                pointerEvents: "none",
              }}
            />
          ))
        : null}

      {vertical ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 72,
            height: 2,
            backgroundColor: COLORS.ink,
            zIndex: 2,
          }}
        />
      ) : null}

      {data.map((datum, index) => {
        const anchor = enterFrames[index];
        const windowFrames = Math.max(1, growFrames);
        const progress = interpolate(frame, [anchor, anchor + windowFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const normalized = Math.max(0, Math.min(1, datum.value / safeMax));
        const size = progress * normalized;
        const highlighted = index === highlightIndex;
        const glowing =
          highlighted &&
          (glowWindow === undefined || (frame >= glowWindow[0] && frame < glowWindow[1]));
        const visibleValue = datum.display ?? format((countUp ? progress : 1) * datum.value);
        const row = layout.rows[index];

        const activeFillColor = glowing
          ? COLORS.ochre
          : highlightIndex !== undefined
            ? highlighted
              ? barColor
              : "#1E222B"
            : barColor;

        const opacity = interpolate(frame, [anchor, anchor + 1], [0.2, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        if (vertical) {
          const pillarWidth = Math.min(82, Math.max(44, Math.floor(row.width * 0.38)));
          return (
            <div
              key={`${datum.label}-${index}`}
              style={{
                position: "absolute",
                left: row.left,
                top: row.top,
                width: row.width,
                height: row.height,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                boxSizing: "border-box",
                padding: "0 8px",
                opacity,
              }}
            >
              {showValues ? (
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: 38,
                    fontWeight: 900,
                    fontVariantNumeric: "tabular-nums",
                    color: highlighted ? barColor : valueColor,
                    lineHeight: 1.05,
                    marginBottom: 10,
                    whiteSpace: "nowrap",
                  }}
                >
                  {countUp ? visibleValue : datum.display ?? format(datum.value)}
                </div>
              ) : null}

              <div
                style={{
                  position: "relative",
                  flex: "1 1 0",
                  width: pillarWidth,
                  background: trackColor === COLORS.surfaceAlt ? "#E2E2DC" : trackColor,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    width: "100%",
                    height: `${size * 100}%`,
                    background: activeFillColor,
                    borderTop: highlighted ? `5px solid ${COLORS.highlighter}` : undefined,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  height: 72,
                  paddingTop: 10,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  textAlign: "center",
                  fontFamily: FONTS.body,
                  fontSize: 24,
                  fontWeight: highlighted ? 800 : 700,
                  lineHeight: 1.2,
                  color: labelColor,
                  boxSizing: "border-box",
                }}
              >
                {datum.label}
              </div>
            </div>
          );
        }

        return (
          <div
            key={`${datum.label}-${index}`}
            style={{
              position: "absolute",
              left: row.left,
              top: row.top,
              width: row.width,
              height: row.height,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 10,
              boxSizing: "border-box",
              padding: "8px 0",
              borderBottom: `1px solid ${COLORS.line}`,
              opacity,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 26,
                  fontWeight: highlighted ? 800 : 700,
                  color: labelColor,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {datum.label}
              </div>
              {showValues ? (
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: 34,
                    fontWeight: 900,
                    fontVariantNumeric: "tabular-nums",
                    color: highlighted ? barColor : valueColor,
                    whiteSpace: "nowrap",
                  }}
                >
                  {countUp ? visibleValue : datum.display ?? format(datum.value)}
                </div>
              ) : null}
            </div>

            <div
              style={{
                position: "relative",
                width: "100%",
                height: 22,
                background: trackColor === COLORS.surfaceAlt ? "#E2E2DC" : trackColor,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: `${size * 100}%`,
                  height: "100%",
                  background: activeFillColor,
                  borderRight: highlighted ? `5px solid ${COLORS.highlighter}` : undefined,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Geometry helper for consumer-side assertInBounds/assertRailSafe checks. */
export const editorialBarChartLayout = (
  data: EditorialBarDatum[],
  width = DEFAULT_WIDTH,
  rowHeight = DEFAULT_ROW_HEIGHT,
  direction: "h" | "v" = "h"
): EditorialBarChartLayout => {
  const height = direction === "v" ? rowHeight * 3 : data.length * rowHeight;
  return {
    width,
    height,
    direction,
    rows: data.map((datum, index) => ({
      label: datum.label,
      left: direction === "v" ? (index * width) / Math.max(1, data.length) : 0,
      top: direction === "v" ? 0 : index * rowHeight,
      width: direction === "v" ? width / Math.max(1, data.length) : width,
      height: direction === "v" ? height : rowHeight,
    })),
  };
};
