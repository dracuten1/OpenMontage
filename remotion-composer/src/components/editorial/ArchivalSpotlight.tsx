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
  return "contrast(1.08) saturate(0.98) brightness(0.97)";
}

/**
 * Full-impact photojournalism showcase (Brut / NYT Watch / Swiss Editorial).
 * Straight alignment (zero tilted polaroid), zero outer beige border, crisp
 * broadcast archive block, Ken Burns drift, and dark-carbon caption deck.
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
  rotateDeg = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enterP = spring({
    frame: Math.max(0, frame - enterFrame),
    fps,
    config: MOTION.settle,
  });
  const op = frame < enterFrame ? 0 : interpolate(enterP, [0, 1], [0.25, 1]);
  const ty = interpolate(enterP, [0, 1], [18, 0]);
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
            padding: "0 8px",
            color: COLORS.ink,
            backgroundColor: COLORS.highlighter,
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
        transform: rotateDeg ? `translateY(${ty}px) rotate(${rotateDeg}deg)` : `translateY(${ty}px)`,
        backgroundColor: COLORS.ink,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Clean photograph viewport */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: layout.photoHeight,
          overflow: "hidden",
          backgroundColor: COLORS.inkSoft,
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
        {/* Cinema scrim at top/bottom edge */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(11,12,14,0.22) 0%, rgba(11,12,14,0.0) 40%, rgba(11,12,14,0.52) 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Signal Red archive label badge (top-left) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            padding: "7px 16px",
            backgroundColor: COLORS.vermilion,
            borderBottom: `3px solid ${COLORS.highlighter}`,
            color: "#FFFFFF",
            fontFamily: FONTS.display,
            fontSize: 25,
            fontWeight: 900,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          {archiveLabel}
        </div>
      </div>

      {/* Flush dark-carbon caption & attribution deck */}
      <div
        style={{
          flex: 1,
          padding: hasQuote ? "14px 20px" : "10px 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          backgroundColor: COLORS.ink,
          borderTop: `4px solid ${COLORS.vermilion}`,
        }}
      >
        {hasQuote ? (
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 27,
              fontWeight: 800,
              lineHeight: 1.28,
              color: "#FFFFFF",
              opacity: frame >= qStart ? 1 : 0.35,
            }}
          >
            {renderQuote()}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 24,
            fontWeight: 600,
            color: COLORS.mutedOnDark,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {creditLine.replace(/\s*[·•]\s*/g, " / ")}
        </div>
      </div>
    </div>
  );
};
