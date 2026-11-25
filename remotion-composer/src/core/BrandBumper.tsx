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
import { useChannelTheme } from "./theme";

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
 * Reusable channel outro stinger.
 * Reads default video/sting paths & volume from the active ChannelTheme,
 * while permitting explicit per-episode overrides via props.
 */
export const BrandBumper: React.FC<BrandBumperProps> = ({
  aspect,
  src,
  stingSrc,
  stingVolume,
  fadeInFrames = 6,
  fadeOutFrames = 8,
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const theme = useChannelTheme();

  const resolvedAspect = aspect ?? (width < height ? "9x16" : "16x9");
  const themedRelSrc =
    resolvedAspect === "16x9" ? theme.bumper.video16x9 : theme.bumper.video9x16;
  const videoSrc = src ?? (themedRelSrc ? staticFile(themedRelSrc) : null);

  if (!videoSrc) {
    return null;
  }

  const audioSrc =
    stingSrc === null
      ? null
      : stingSrc ?? (theme.bumper.sting ? staticFile(theme.bumper.sting) : null);
  const resolvedVolume = stingVolume ?? theme.bumper.stingVolume ?? 0.55;

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
    <AbsoluteFill style={{ backgroundColor: theme.colors.paper, opacity }}>
      <OffthreadVideo
        src={videoSrc}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {audioSrc ? <Audio src={audioSrc} volume={resolvedVolume} /> : null}
    </AbsoluteFill>
  );
};
