import {
  interpolate,
  useCurrentFrame,
} from "remotion";

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
const DEFAULT_TRACK = "#3A424E";
const DEFAULT_BAR = "#FFBE0B";
const DEFAULT_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

const formatVietnamese = (n: number): string => Math.round(n).toLocaleString("vi-VN");

/**
 * Native DOM editorial chart. Each row computes a single progress `p` from
 * its scene-local anchor; bar geometry and count-up text both consume that
 * same value in the same [anchor, anchor + growFrames] window (anti-detach).
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
                borderTop: `1px solid ${trackColor}`,
                pointerEvents: "none",
              }}
            />
          ))
        : null}
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
              flexDirection: vertical ? "column" : "row",
              alignItems: "center",
              gap: 12,
              boxSizing: "border-box",
              padding: 8,
              opacity: interpolate(frame, [anchor, anchor + 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {!vertical ? (
              <div style={{ flex: "0 0 24%", overflow: "hidden", whiteSpace: "nowrap" }}>{datum.label}</div>
            ) : null}
            <div
              style={{
                position: "relative",
                flex: vertical ? "1 1 auto" : "1 1 0",
                width: vertical ? "100%" : undefined,
                height: vertical ? "100%" : 24,
                alignSelf: vertical ? "stretch" : undefined,
                background: trackColor,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: vertical ? 0 : 0,
                  bottom: vertical ? 0 : undefined,
                  top: vertical ? undefined : 0,
                  width: vertical ? "100%" : `${size * 100}%`,
                  height: vertical ? `${size * 100}%` : "100%",
                  background: barColor,
                  borderRadius: 4,
                  boxShadow: glowing ? `0 0 24px ${barColor}` : undefined,
                }}
              />
            </div>
            {vertical ? <div style={{ textAlign: "center" }}>{datum.label}</div> : null}
            {showValues ? (
              <div style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}>
                {countUp ? visibleValue : datum.display ?? format(datum.value)}
              </div>
            ) : null}
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
