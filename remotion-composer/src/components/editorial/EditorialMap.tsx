import React, { useMemo } from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { geoArea, geoGraticule10, geoInterpolate, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countries50m from "world-atlas/countries-50m.json";
import countries10m from "world-atlas/countries-10m.json";
import type { GeoFeature, GeoFeatureCollection } from "d3-geo";
import type { CountryProps } from "world-atlas/*.json";
import { COLORS, FONTS, MOTION } from "../news/theme";

export interface MapPin {
  id: string;
  coords: [number, number];
  label: string;
  sublabel?: string;
  color?: string;
  enterFrame: number;
  pulse?: boolean;
  status?: "active" | "closed" | "restricted" | "info";
  labelOffset?: [number, number];
}

export interface MapRoute {
  id: string;
  from: [number, number];
  to: [number, number];
  waypoints?: [number, number][];
  color?: string;
  dashed?: boolean;
  enterFrame: number;
  drawFrames?: number;
  label?: string;
}

export interface MapWaterLine {
  id: string;
  points: [number, number][];
  color?: string;
  width?: number;
  label?: string;
}

export interface MapRegionLabel {
  id: string;
  label: string;
  coords: [number, number];
  color?: string;
}

export interface EditorialMapProps {
  width: number;
  height: number;
  center: [number, number];
  scale: number;
  endCenter?: [number, number];
  endScale?: number;
  tiltDeg?: number;
  detail?: "50m" | "10m";
  highlightIso?: string[];
  waterLines?: MapWaterLine[];
  routes?: MapRoute[];
  pins?: MapPin[];
  regionLabels?: MapRegionLabel[];
  title?: string;
  source?: string;
  showGraticule?: boolean;
}

export interface EditorialMapLayout {
  width: number;
  height: number;
  pinCount: number;
  routeCount: number;
}

const CAMERA_EASE = Easing.bezier(0.22, 1, 0.36, 1);

const STATUS_LABELS: Record<NonNullable<MapPin["status"]>, string> = {
  active: "ĐÁNH TRÚNG",
  closed: "ĐÓNG CỬA",
  restricted: "HẠN CHẾ",
  info: "MỐC",
};

const DEFAULT_PIN_OFFSETS: Array<[number, number]> = [
  [18, -56],
  [18, 16],
  [-210, -56],
  [-210, 16],
];

function buildSmoothPolyline(points: Array<[number, number]>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  const parts = [`M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`];
  for (let i = 1; i < points.length; i++) {
    parts.push(`L ${points[i][0].toFixed(1)} ${points[i][1].toFixed(1)}`);
  }
  return parts.join(" ");
}

function approxPolylineLength(points: Array<[number, number]>): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    len += Math.hypot(dx, dy);
  }
  return Math.max(1, len);
}

/**
 * High-contrast dark tactical cartographic map (NYT Visual Investigations / BBC style)
 * using d3-geo + world-atlas with sharp dark-carbon callout strips and luminous beacons.
 */
export const EditorialMap: React.FC<EditorialMapProps> = ({
  width,
  height,
  center,
  scale,
  endCenter,
  endScale,
  tiltDeg = 14,
  detail = "50m",
  highlightIso = [],
  waterLines = [],
  routes = [],
  pins = [],
  regionLabels = [],
  title,
  source,
  showGraticule = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const camT = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    easing: CAMERA_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const curCenter: [number, number] = endCenter
    ? [
        center[0] + (endCenter[0] - center[0]) * camT,
        center[1] + (endCenter[1] - center[1]) * camT,
      ]
    : center;
  const curScale = endScale !== undefined ? scale + (endScale - scale) * camT : scale;

  const countriesCollection = useMemo(() => {
    const topo = detail === "10m" ? countries10m : countries50m;
    const fc = feature(topo, topo.objects.countries) as GeoFeatureCollection<CountryProps>;
    return {
      ...fc,
      features: fc.features.filter((f) => geoArea(f) <= Math.PI),
    };
  }, [detail]);

  const highlightSet = useMemo(() => new Set(highlightIso.map(String)), [highlightIso]);

  const projection = useMemo(
    () =>
      geoMercator()
        .center(curCenter)
        .scale(curScale)
        .translate([width / 2, height / 2])
        .clipExtent([
          [-120, -120],
          [width + 120, height + 120],
        ]),
    [curCenter[0], curCenter[1], curScale, width, height],
  );

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const countryPaths = useMemo(() => {
    const out: Array<{ key: string; d: string; highlighted: boolean }> = [];
    countriesCollection.features.forEach((feat: GeoFeature<CountryProps>, idx: number) => {
      const d = pathGenerator(feat);
      if (!d) return;
      const idStr = feat.id !== undefined ? String(feat.id) : `c-${idx}`;
      out.push({
        key: `${idStr}-${idx}`,
        d,
        highlighted: highlightSet.has(idStr),
      });
    });
    return out;
  }, [countriesCollection, pathGenerator, highlightSet]);

  const graticulePath = useMemo(() => {
    if (!showGraticule) return null;
    return pathGenerator(geoGraticule10());
  }, [showGraticule, pathGenerator]);

  const tiltStyle =
    tiltDeg !== 0
      ? {
          transform: `perspective(1200px) rotateX(${tiltDeg}deg) scale(${tiltDeg > 0 ? 1.06 : 1})`,
          transformOrigin: "center 58%",
        }
      : undefined;

  return (
    <div
      data-editorial-map="true"
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        backgroundColor: "#0B1019",
        borderTop: `4px solid ${COLORS.vermilion}`,
        borderBottom: `3px solid ${COLORS.ink}`,
      }}
    >
      {/* Tactical deep-maritime ocean gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(95% 85% at 50% 48%, #152030 0%, #0A0F18 85%)",
          pointerEvents: "none",
        }}
      />

      {/* Tilted 2.5D tactical map plane */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...tiltStyle,
        }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <defs>
            <marker
              id="editorial-map-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill={COLORS.highlighter} />
            </marker>
          </defs>

          {graticulePath ? (
            <path
              d={graticulePath}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={1}
            />
          ) : null}

          {/* Dark tactical landmasses */}
          <g>
            {countryPaths.map((c) => (
              <path
                key={c.key}
                d={c.d}
                fill={c.highlighted ? "rgba(225, 29, 46, 0.30)" : "#1E2736"}
                stroke={c.highlighted ? COLORS.vermilion : "#3D4C66"}
                strokeWidth={c.highlighted ? 2.2 : 1.3}
                strokeLinejoin="round"
              />
            ))}
          </g>

          {/* Custom rivers / straits */}
          {waterLines.map((w) => {
            const pts = w.points
              .map((pt) => projection(pt))
              .filter((p): p is [number, number] => p !== null);
            if (pts.length < 2) return null;
            const d = buildSmoothPolyline(pts);
            return (
              <g key={w.id}>
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(14, 165, 233, 0.28)"
                  strokeWidth={(w.width ?? 14) + 10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={d}
                  fill="none"
                  stroke={w.color ?? "#0EA5E9"}
                  strokeWidth={w.width ?? 14}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Animated supply/strike routes */}
          {routes.map((route) => {
            const rawCoords: [number, number][] = [];
            if (route.waypoints && route.waypoints.length > 0) {
              rawCoords.push(route.from, ...route.waypoints, route.to);
            } else {
              const interp = geoInterpolate(route.from, route.to);
              const segs = 24;
              for (let s = 0; s <= segs; s++) {
                rawCoords.push(interp(s / segs));
              }
            }
            const projected = rawCoords
              .map((c) => projection(c))
              .filter((p): p is [number, number] => p !== null);
            if (projected.length < 2) return null;
            const d = buildSmoothPolyline(projected);
            const totalLen = approxPolylineLength(projected);
            const drawFrames = Math.max(1, route.drawFrames ?? 28);
            const p = interpolate(
              frame,
              [route.enterFrame, route.enterFrame + drawFrames],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            if (p <= 0) return null;
            const dashOffset = totalLen * (1 - p);
            const routeColor = route.color ?? COLORS.highlighter;
            const mid = projected[Math.floor(projected.length / 2)];
            return (
              <g key={route.id}>
                <path
                  d={d}
                  fill="none"
                  stroke={routeColor}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray={route.dashed ? "10 8" : `${totalLen}`}
                  strokeDashoffset={route.dashed ? totalLen * (1 - p) : dashOffset}
                  opacity={0.96}
                  markerEnd={p > 0.92 && !route.dashed ? "url(#editorial-map-arrow)" : undefined}
                />
                {route.label && p > 0.6
                  ? (() => {
                      const boxW = Math.max(192, route.label.length * 15 + 28);
                      return (
                        <g
                          transform={`translate(${mid[0]}, ${mid[1] - 18})`}
                          opacity={interpolate(p, [0.6, 1], [0, 1])}
                        >
                          <rect
                            x={-boxW / 2}
                            y={-22}
                            width={boxW}
                            height={38}
                            fill="rgba(11, 12, 14, 0.92)"
                          />
                          <rect
                            x={-boxW / 2}
                            y={-22}
                            width={5}
                            height={38}
                            fill={routeColor}
                          />
                          <text
                            x={0}
                            y={6}
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontFamily={FONTS.display}
                            fontSize={25}
                            fontWeight={800}
                          >
                            {route.label}
                          </text>
                        </g>
                      );
                    })()
                  : null}
              </g>
            );
          })}

          {/* Region labels on map plane */}
          {regionLabels.map((reg) => {
            const pt = projection(reg.coords);
            if (!pt) return null;
            return (
              <text
                key={reg.id}
                x={pt[0]}
                y={pt[1]}
                textAnchor="middle"
                fill={reg.color ?? "rgba(186, 198, 218, 0.72)"}
                fontFamily={FONTS.display}
                fontSize={26}
                fontWeight={800}
                letterSpacing={1.8}
              >
                {reg.label}
              </text>
            );
          })}

          {/* Pin beacons */}
          {pins.map((pin) => {
            const pt = projection(pin.coords);
            if (!pt) return null;
            const localF = Math.max(0, frame - pin.enterFrame);
            const enterP = spring({
              frame: localF,
              fps,
              config: MOTION.settle,
            });
            const visible = frame >= pin.enterFrame;
            const pinColor = pin.color ?? COLORS.vermilion;
            const pulseCycle = (localF % 45) / 45;
            const ringR = visible ? 10 + pulseCycle * 30 : 0;
            const ringOp = visible && pin.pulse !== false ? 0.8 * (1 - pulseCycle) : 0;
            return (
              <g
                key={pin.id}
                transform={`translate(${pt[0]}, ${pt[1]})`}
                opacity={visible ? enterP : 0.25}
              >
                {pin.pulse !== false && visible ? (
                  <circle
                    cx={0}
                    cy={0}
                    r={ringR}
                    fill="none"
                    stroke={COLORS.highlighter}
                    strokeWidth={2.5}
                    opacity={ringOp}
                  />
                ) : null}
                <circle
                  cx={0}
                  cy={0}
                  r={10}
                  fill={pinColor}
                  stroke="#FFFFFF"
                  strokeWidth={2.5}
                />
                <circle cx={0} cy={0} r={4} fill={COLORS.highlighter} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Sleek dark-carbon HUD callout strips anchored to projected pin coords */}
      {pins.map((pin, idx) => {
        const pt = projection(pin.coords);
        if (!pt) return null;
        const localF = Math.max(0, frame - pin.enterFrame);
        const enterP = spring({ frame: localF, fps, config: MOTION.settle });
        const visible = frame >= pin.enterFrame;
        const offset = pin.labelOffset ?? DEFAULT_PIN_OFFSETS[idx % DEFAULT_PIN_OFFSETS.length];
        const rawLeft = pt[0] + offset[0];
        const rawTop = pt[1] + offset[1];
        const left = Math.max(16, Math.min(width - 350, rawLeft));
        const top = Math.max(title ? 76 : 16, Math.min(height - 96, rawTop));
        const pinColor = pin.color ?? COLORS.vermilion;
        return (
          <div
            key={`lbl-${pin.id}`}
            style={{
              position: "absolute",
              left,
              top,
              opacity: visible ? enterP : 0,
              transform: `translateY(${interpolate(enterP, [0, 1], [10, 0])}px)`,
              backgroundColor: "rgba(11, 12, 14, 0.92)",
              borderLeft: `5px solid ${pinColor}`,
              padding: "7px 14px",
              pointerEvents: "none",
              maxWidth: 340,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {pin.status ? (
                <span
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: 24,
                    fontWeight: 900,
                    color: COLORS.highlighter,
                    letterSpacing: 0.6,
                  }}
                >
                  {STATUS_LABELS[pin.status]}
                </span>
              ) : null}
              <span
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  whiteSpace: "nowrap",
                }}
              >
                {pin.label}
              </span>
            </div>
            {pin.sublabel ? (
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 24,
                  fontWeight: 600,
                  color: COLORS.mutedOnDark,
                  marginTop: 2,
                }}
              >
                {pin.sublabel.replace(/\s*[·•]\s*/g, " / ")}
              </div>
            ) : null}
          </div>
        );
      })}

      {/* Borderless dark-carbon map header & attribution strip */}
      {title ? (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 18,
            padding: "6px 14px",
            backgroundColor: "rgba(11, 12, 14, 0.90)",
            borderLeft: `5px solid ${COLORS.highlighter}`,
            fontFamily: FONTS.display,
            fontSize: 25,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          {title.replace(/\s*[·•]\s*/g, " / ")}
        </div>
      ) : null}

      {source ? (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 14,
            padding: "4px 12px",
            backgroundColor: "rgba(11, 12, 14, 0.88)",
            borderLeft: `4px solid ${COLORS.vermilion}`,
            fontFamily: FONTS.display,
            fontSize: 24,
            fontWeight: 700,
            color: COLORS.mutedOnDark,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          {source.replace(/\s*[·•]\s*/g, " / ")}
        </div>
      ) : null}
    </div>
  );
};

/** Pure geometry helper for consumer-side assertInBounds / layoutGuard checks. */
export const editorialMapLayout = (
  width: number,
  height: number,
  pins: MapPin[] = [],
  routes: MapRoute[] = [],
): EditorialMapLayout => {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`editorialMapLayout: invalid dimensions ${width}x${height}`);
  }
  return {
    width,
    height,
    pinCount: pins.length,
    routeCount: routes.length,
  };
};
