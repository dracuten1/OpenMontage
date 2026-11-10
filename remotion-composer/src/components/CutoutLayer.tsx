import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { camScale } from "./ParallaxCamera";

export interface CutoutLayerProps {
  src: string;
  enterFrame: number;
  width: number;
  left: number | string;
  top: number | string;
  rotate?: number;
  shadow?: boolean;
  quantizeFps?: number | false;
  drift?: number;
  enter?: { dx: number; dy: number };
  tornEdge?: boolean;
  springConfig?: { damping?: number; stiffness?: number };
}

const FILTER_ID = "cutout-torn-edge-fixed-seed-47";
const FILTER_SEED = 47;
const FILTER_SCALE = 6;
const DEFAULT_DAMPING = 18;
const DEFAULT_STIFFNESS = 140;
const DEFAULT_QUANTIZE_FPS = 13;
const DROP_SHADOW = "drop-shadow(12px 14px 18px rgba(0,0,0,0.65))";

/** Posterize a frame to a lower fps grid (tracked posterize, Episode.tsx L225). */
const posterize = (frame: number, quantizeFps: number, fps: number): number => {
  const step = Math.max(1e-6, fps / quantizeFps);
  return Math.floor(frame / step) * step;
};

/**
 * Generic pre-cut subject layer. Source image must already carry alpha;
 * `staticFile()` resolves the provided public/static path. Optional torn edge
 * uses deterministic fixed-seed SVG turbulence, so frames match across workers.
 */
export const CutoutLayer: React.FC<CutoutLayerProps> = ({
  src,
  enterFrame,
  width,
  left,
  top,
  rotate = -2.5,
  shadow = true,
  quantizeFps = DEFAULT_QUANTIZE_FPS,
  drift = 1.04,
  enter = { dx: -160, dy: 40 },
  tornEdge = false,
  springConfig,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const damping = springConfig?.damping ?? DEFAULT_DAMPING;
  const stiffness = springConfig?.stiffness ?? DEFAULT_STIFFNESS;
  const quantized = quantizeFps === false ? frame : posterize(frame, quantizeFps, fps);
  const localFrame = quantized - enterFrame;
  const progress = spring({ frame: localFrame, fps, config: { damping, stiffness } });
  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(progress, [0, 1], [enter.dx, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(progress, [0, 1], [enter.dy, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const driftScale = camScale(quantized, durationInFrames, drift);

  return (
    <AbsoluteFill style={{ transform: `scale(${driftScale})`, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left,
          top,
          width,
          opacity,
          transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
          filter: shadow ? DROP_SHADOW : undefined,
        }}
      >
        {tornEdge ? (
          <svg
            aria-hidden="true"
            style={{ position: "absolute", width: 0, height: 0 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <filter id={FILTER_ID}>
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={FILTER_SEED} />
              <feDisplacementMap in="SourceGraphic" scale={FILTER_SCALE} />
            </filter>
          </svg>
        ) : null}
        <Img
          src={staticFile(src)}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            filter: tornEdge ? `url(#${FILTER_ID})` : undefined,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
