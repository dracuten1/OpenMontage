import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";

export interface SceneBackgroundProps {
  imageSrc: string;
  glowColor?: string;
  glowCoords?: string;
  panDirection?: "up" | "down" | "none";
}

export const SceneBackground: React.FC<SceneBackgroundProps> = ({
  imageSrc,
  glowColor = "rgba(37, 99, 235, 0.22)",
  glowCoords = "50% 30%",
  panDirection = "none",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Gentle Ken Burns subtle scale (1.0 -> 1.04)
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.04], {
    extrapolateRight: "clamp",
  });

  const panY =
    panDirection === "up"
      ? interpolate(frame, [0, durationInFrames], [0, -20])
      : panDirection === "down"
      ? interpolate(frame, [0, durationInFrames], [0, 20])
      : 0;

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.bgDeep }}>
      {/* Background illustration with low brightness for text contrast */}
      <Img
        src={imageSrc}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateY(${panY}px)`,
          filter: "brightness(0.32) saturate(1.15) contrast(1.1)",
        }}
      />

      {/* Dark gradient overlay for razor-sharp readability */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(11, 15, 25, 0.72) 0%, rgba(11, 15, 25, 0.5) 45%, rgba(11, 15, 25, 0.94) 100%)",
        }}
      />

      {/* Subtle radial tech glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 600px at ${glowCoords}, ${glowColor}, transparent 70%)`,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
