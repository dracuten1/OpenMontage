import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, SAFE } from "../theme";
import { Captions } from "./Captions";
import type { SceneId } from "../timing";

export interface SceneFrameProps {
  sceneId: SceneId;
  children?: React.ReactNode;
  /** accent glow colour behind the content (default blue) */
  glow?: string;
  /** show word-level captions at the bottom (default true) */
  captions?: boolean;
  /** fade in over first N frames / out over last N frames (default 6 / 6) */
  fadeIn?: number;
  fadeOut?: number;
  /** show faint finance grid (default true) */
  grid?: boolean;
}

/**
 * Background (dark slate + grid + slow-drifting glow), scene fade in/out, safe-area content box and Captions.
 * Children render inside a box at SAFE margins (content area 1728x816, bottom 200px reserved for captions).
 * For full-bleed layers (images) render them via `<FullBleed>` which sits behind the content box.
 * No scene-id watermark by design.
 */
export const SceneFrame: React.FC<SceneFrameProps> = ({
  sceneId, children, glow = "rgba(37,99,235,0.22)", captions = true, fadeIn = 6, fadeOut = 6, grid = true,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity =
    interpolate(frame, [0, fadeIn], [0, 1], { extrapolateRight: "clamp" }) *
    interpolate(frame, [durationInFrames - fadeOut, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const drift = Math.sin(frame / 90) * 40;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: FONT, color: C.text, opacity }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 600px at ${70 + drift / 10}% ${18 + drift / 20}%, ${glow}, transparent 70%), linear-gradient(180deg, ${C.bg} 0%, ${C.bgDeep} 100%)`,
        }}
      />
      {grid ? (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            backgroundPosition: `${drift}px ${drift / 2}px`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          right: SAFE.right,
          top: SAFE.top,
          bottom: SAFE.bottom,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
      {captions ? <Captions sceneId={sceneId} /> : null}
    </AbsoluteFill>
  );
};

/** Full-bleed layer that sits behind the safe content box when placed as a direct child of AbsoluteFill. */
export const FullBleed: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={style}>{children}</AbsoluteFill>
);
