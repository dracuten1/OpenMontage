import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "./theme";

export const BRAND_BUMPER_FRAMES = 90 as const;
export const BRAND_BUMPER_SECONDS = 3.0 as const;

export interface BrandBumperProps {
  aspect?: "9x16" | "16x9";
  src?: string;
  stingSrc?: string | null;
  stingVolume?: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
}

/**
 * Reusable 3-second Blender-rendered 3D channel outro stinger ("Ký Chủ Điểm Tin").
 * Placed at the end of the episode after the final scene so the opening 0–3s hook stays untouched.
 * Auto-detects 9:16 vs 16:9 canvas and binds deterministic fade-in/out + studio audio sting.
 */
export const BrandBumper: React.FC<BrandBumperProps> = ({
  aspect,
  src,
  stingSrc,
  stingVolume = 0.55,
  fadeInFrames = 6,
  fadeOutFrames = 8,
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const resolvedAspect = aspect ?? (width < height ? "9x16" : "16x9");
  const videoSrc =
    src ??
    staticFile(
      resolvedAspect === "16x9"
        ? "brand/kcdt_bumper_16x9.mp4"
        : "brand/kcdt_bumper_9x16.mp4",
    );
  const audioSrc =
    stingSrc === null ? null : stingSrc ?? staticFile("brand/kcdt_bumper_sting.wav");

  const fadeInOpacity =
    fadeInFrames > 0
      ? interpolate(frame, [0, fadeInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const fadeStart = Math.max(1, durationInFrames - Math.max(1, fadeOutFrames));
  const fadeOutOpacity =
    fadeOutFrames > 0
      ? interpolate(frame, [fadeStart, durationInFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const opacity = fadeInOpacity * fadeOutOpacity;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.slate, opacity }}>
      <OffthreadVideo
        src={videoSrc}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {audioSrc ? <Audio src={audioSrc} volume={stingVolume} /> : null}
    </AbsoluteFill>
  );
};
