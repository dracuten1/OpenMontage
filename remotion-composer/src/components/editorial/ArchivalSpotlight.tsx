import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, MOTION } from "../news/theme";

export type ArchivalTreatment = "authentic" | "halftone-tint" | "duotone";

export interface ArchivalSpotlightProps {
  src: string;
  width: number;
  height: number;
  enterFrame: number;
  archiveLabel: string;
  creditLine: string;
  pullQuote?: string;
  quoteHighlight?: string;
  quoteEnterFrame?: number;
  treatment?: ArchivalTreatment;
  objectPosition?: string;
  rotateDeg?: number;
}

export interface ArchivalSpotlightLayout {
  width: number;
  height: number;
  photoHeight: number;
  hasPullQuote: boolean;
}

/** Pure geometry helper for consumer-side layoutGuard checks. */
export function archivalSpotlightLayout(
  width: number,
  height: number,
  hasPullQuote = false,
): ArchivalSpotlightLayout {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`archivalSpotlightLayout: invalid dimensions ${width}x${height}`);
  }
  const footerH = hasPullQuote ? 132 : 56;
  return {
    width,
    height,
    photoHeight: Math.max(120, height - footerH),
    hasPullQuote,
  };
}

function getTreatmentFilter(treatment: ArchivalTreatment): string {
  if (treatment === "halftone-tint") {
    return "grayscale(85%) contrast(1.22) brightness(0.94)";
  }
  if (treatment === "duotone") {
    return "grayscale(100%) sepia(38%) hue-rotate(175deg) saturate(1.4) contrast(1.15)";
  }
  return "contrast(1.06) brightness(0.96)";
}

/**
 * Tactile Vox/NYT archival photograph showcase.
 * Gives verified press/archival photography full visual authority with corner
 * registration ticks, archive-year badge, attribution strip, Ken Burns drift,
 * and an optional animated highlighter pull-quote.
 */
export const ArchivalSpotlight: React.FC<ArchivalSpotlightProps> = ({
  src,
  width,
  height,
  enterFrame,
  archiveLabel,
  creditLine,
  pullQuote,
  quoteHighlight,
  quoteEnterFrame,
  treatment = "authentic",
  objectPosition = "center center",
  rotateDeg = -0.8,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enterP = spring({
    frame: Math.max(0, frame - enterFrame),
    fps,
    config: MOTION.settle,
  });
  const op = frame < enterFrame ? 0 : interpolate(enterP, [0, 1], [0.15, 1]);
  const ty = interpolate(enterP, [0, 1], [22, 0]);
  const kenBurns = interpolate(
    frame,
    [enterFrame, Math.max(enterFrame + 1, durationInFrames)],
    [1.0, 1.07],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const qStart = quoteEnterFrame ?? enterFrame + 18;
  const qWipe = interpolate(frame, [qStart, qStart + 16], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const hasQuote = Boolean(pullQuote);
  const layout = archivalSpotlightLayout(width, height, hasQuote);

  const renderQuote = () => {
    if (!pullQuote) return null;
    if (!quoteHighlight || !pullQuote.includes(quoteHighlight)) {
      return pullQuote;
    }
    const idx = pullQuote.indexOf(quoteHighlight);
    return (
      <>
        {pullQuote.slice(0, idx)}
        <span
          style={{
            position: "relative",
            display: "inline-block",
            padding: "0 6px",
            color: COLORS.ink,
            backgroundColor: COLORS.neonYellow,
            clipPath: `inset(0 ${100 - qWipe}% 0 0)`,
          }}
        >
          {quoteHighlight}
        </span>
        {pullQuote.slice(idx + quoteHighlight.length)}
      </>
    );
  };

  return (
    <div
      data-editorial-spotlight="true"
      style={{
        position: "relative",
        width,
        height,
        opacity: op,
        transform: `translateY(${ty}px) rotate(${rotateDeg}deg)`,
        borderRadius: 18,
        backgroundColor: "#0E131D",
        border: `1.5px solid rgba(255, 190, 11, 0.42)`,
        boxShadow: "0 20px 52px rgba(0, 0, 0, 0.65)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Framed photograph window */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: layout.photoHeight,
          overflow: "hidden",
          backgroundColor: COLORS.ink,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition,
            filter: getTreatmentFilter(treatment),
            transform: `scale(${kenBurns})`,
            transformOrigin: "center center",
          }}
        />
        {/* Editorial vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(11,14,20,0.22) 0%, rgba(11,14,20,0.02) 45%, rgba(11,14,20,0.72) 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Archive label badge (top-left) */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            padding: "6px 14px",
            borderRadius: 999,
            backgroundColor: "rgba(11, 14, 20, 0.90)",
            border: `2px solid ${COLORS.amber}`,
            color: COLORS.amber,
            fontFamily: FONTS.mono,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {archiveLabel}
        </div>
        {/* Corner registration ticks */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 22,
            height: 22,
            borderTop: `2px solid ${COLORS.paper}`,
            borderRight: `2px solid ${COLORS.paper}`,
            opacity: 0.55,
          }}
        />
      </div>

      {/* Pull-quote + mandatory attribution footer */}
      <div
        style={{
          flex: 1,
          padding: hasQuote ? "14px 20px" : "10px 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 8,
          backgroundColor: "rgba(14, 18, 26, 0.96)",
          borderTop: `1px solid ${COLORS.line}`,
        }}
      >
        {hasQuote ? (
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1.28,
              color: COLORS.text,
              opacity: frame >= qStart ? 1 : 0.25,
            }}
          >
            {renderQuote()}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 24,
            fontWeight: 600,
            color: COLORS.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {creditLine}
        </div>
      </div>
    </div>
  );
};
