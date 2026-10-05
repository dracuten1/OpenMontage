import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, SAFE } from "../theme";
import { Captions } from "./Captions";
import type { SceneId } from "../timing";

export interface SceneFrameProps {
  sceneId: SceneId;
  children?: React.ReactNode;
  backdrop?: React.ReactNode;
  glow?: string;
  glowPosition?: "top-right" | "center" | "split" | "top-left";
  captions?: boolean;
  captionHighlight?: string;
  fadeIn?: number;
  fadeOut?: number;
  grid?: boolean;
}

export const SceneFrame: React.FC<SceneFrameProps> = ({
  sceneId,
  children,
  backdrop,
  glow = "rgba(6, 182, 212, 0.18)",
  glowPosition = "top-right",
  captions = true,
  captionHighlight,
  fadeIn = 6,
  fadeOut = 6,
  grid = true,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity =
    interpolate(frame, [0, fadeIn], [0, 1], { extrapolateRight: "clamp" }) *
    interpolate(frame, [durationInFrames - fadeOut, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
    });

  const drift = Math.sin(frame / 75) * 30;

  const glowCoords =
    glowPosition === "top-right"
      ? `${75 + drift / 10}% ${20 + drift / 20}%`
      : glowPosition === "top-left"
      ? `${25 - drift / 10}% ${20 + drift / 20}%`
      : glowPosition === "split"
      ? `50% 50%`
      : `50% 30%`;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        fontFamily: FONT,
        color: C.text,
        opacity,
        overflow: "hidden",
      }}
    >
      {/* Background gradients */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(1000px 700px at ${glowCoords}, ${glow}, transparent 70%), linear-gradient(180deg, ${C.bg} 0%, ${C.bgDeep} 100%)`,
        }}
      />

      {/* Optional full-bleed illustration backdrop (behind grid & content) */}
      {backdrop ? (
        <AbsoluteFill style={{ zIndex: 1, pointerEvents: "none" }}>
          {backdrop}
        </AbsoluteFill>
      ) : null}

      {/* Tech grid texture */}
      {grid ? (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            backgroundPosition: `${drift}px ${drift / 2}px`,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      ) : null}

      {/* Content area within safe bounds */}
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          right: SAFE.right,
          top: SAFE.top,
          bottom: SAFE.bottom,
          display: "flex",
          flexDirection: "column",
          zIndex: 10,
        }}
      >
        {children}
      </div>

      {/* Captions */}
      {captions ? (
        <Captions sceneId={sceneId} highlightColor={captionHighlight} />
      ) : null}
    </AbsoluteFill>
  );
};
