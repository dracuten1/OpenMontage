import { Children, Fragment, isValidElement, type ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type EasingFunction,
} from "remotion";

/* ============================================================
   ParallaxCamera — editorial parallax camera stack (C4)

   Extracted from the tracked xang-dau-demo-20261107 Episode.tsx
   camScale primitive (L231-237) and its nested AbsoluteFill scale
   stack (backplate L436-439 < cutout L441 < data L469; ordering
   backplate < cutout < data). Pure leaf module: no <Composition>
   registration, no module-scope asserts, no global state. Other
   lanes opt in only by importing; behavior otherwise unchanged.

   Rail-safety stays with the consumer: after adopting a multiplier
   set, assert `mult * endScaleRatio` against assertRailSafe — this
   component intentionally does NOT duplicate guard logic.
   ============================================================ */

/** Tracked editorial ease (Easing.bezier(0.22, 1, 0.36, 1)). */
const DEFAULT_EASING: EasingFunction = Easing.bezier(0.22, 1, 0.36, 1);

/** Tracked default end-of-scene overshoot ratio (1.1x the multiplier). */
const DEFAULT_END_SCALE_RATIO = 1.1;

/** Tracked layer multipliers: backplate < cutout < data. */
const DEFAULT_MULTIPLIERS: [number, number, number] = [1.0, 1.04, 1.02];

/** Tracked tactile judder rate for the cutout layer (13fps posterize). */
const QUANTIZE_FPS = 13;

/**
 * Camera drift scale at a scene-local frame (per-layer parallax multiplier).
 * Exactly the tracked Episode.tsx:231-237 primitive, generalized with an
 * injectable easing + end ratio. `dur` is guarded with Math.max(1, dur) so a
 * 0/negative duration can never produce a degenerate interpolate input range.
 */
export const camScale = (
  frame: number,
  dur: number,
  mult = 1.0,
  easing: EasingFunction = DEFAULT_EASING,
  endScaleRatio: number = DEFAULT_END_SCALE_RATIO
): number =>
  interpolate(frame, [0, Math.max(1, dur)], [1.0 * mult, endScaleRatio * mult], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Posterize a frame to a lower fps grid (tracked posterize, L225). */
const posterize = (frame: number, quantizeFps: number, fps: number): number => {
  const step = fps / quantizeFps;
  return Math.floor(frame / step) * step;
};

/** Flatten fragments so a slotted <Fragment> counts as its inner layers. */
const flattenLayers = (node: ReactNode): ReactNode[] => {
  const out: ReactNode[] = [];
  Children.forEach(node, (child) => {
    if (isValidElement(child) && child.type === Fragment) {
      out.push(...flattenLayers((child.props as { children?: ReactNode }).children));
    } else if (child !== null && child !== undefined && child !== false && child !== true) {
      out.push(child);
    }
  });
  return out;
};

export interface ParallaxCameraProps {
  /**
   * EXPLICIT scene-local duration. Scene Sequences are shorter than the
   * composition — never derive this from useVideoConfig() (footgun).
   * Tracked scenes pass `sec.dur`.
   */
  durationInFrames: number;
  /** Slotted layers in paint order: backplate / cutout / data (exactly 3). */
  layers: React.ReactNode;
  /** Per-layer drift multipliers, tracked ordering backplate < cutout < data. */
  multipliers?: [number, number, number];
  /** Index of the layer rendered with tactile 13fps judder; null = none. */
  quantizeLayer?: 0 | 1 | 2 | null;
  /** End-of-scene overshoot ratio applied on top of each multiplier. */
  endScaleRatio?: number;
  /** Drift easing; defaults to the tracked Easing.bezier(0.22, 1, 0.36, 1). */
  easing?: EasingFunction;
}

/**
 * Nested AbsoluteFill scale stack (one wrapper per layer). Layer DOM order
 * preserves paint order; consumers control stacking with their own zIndex
 * inside each slotted node, exactly like the tracked scene bodies.
 */
export const ParallaxCamera: React.FC<ParallaxCameraProps> = ({
  durationInFrames,
  layers,
  multipliers = DEFAULT_MULTIPLIERS,
  quantizeLayer = 1,
  endScaleRatio = DEFAULT_END_SCALE_RATIO,
  easing = DEFAULT_EASING,
}) => {
  const frame = useCurrentFrame();
  const nodes = flattenLayers(layers);
  if (nodes.length !== 3) {
    throw new Error(
      `ParallaxCamera: expected exactly 3 layers (backplate/cutout/data), received ${nodes.length}.`
    );
  }
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {nodes.map((node, i) => {
        const t = quantizeLayer === i ? posterize(frame, QUANTIZE_FPS, fps) : frame;
        const scale = camScale(t, durationInFrames, multipliers[i], easing, endScaleRatio);
        return (
          <AbsoluteFill key={i} style={{ transform: `scale(${scale})` }}>
            {node}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
