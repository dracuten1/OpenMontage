import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface HighlighterTitleProps {
  title: string;
  enterFrame: number;
  wipeFrame?: number;
  wipeFrames?: number;
  wipeWidth?: number | string;
  barHeight?: number;
  accent?: string;
  fontFamily?: "mono" | "sans";
  fontSize?: number;
  pop?: { damping?: number; stiffness?: number };
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
const SANS = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const DEFAULT_DAMPING = 20;
const DEFAULT_STIFFNESS = 140;

/** File-local recreation of tracked Episode.tsx usePopIn (L213-223). */
const usePopIn = (
  frame: number,
  trigger: number,
  fps: number,
  damping = DEFAULT_DAMPING,
  stiffness = DEFAULT_STIFFNESS
) => {
  const spr = spring({ frame: frame - trigger, fps, config: { damping, stiffness } });
  const opacity = interpolate(frame, [trigger, trigger + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(spr, [0, 1], [36, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(spr, [0, 1], [0.94, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity, translateY, scale };
};

/** Title pop paired with a left-to-right highlighter wipe; no positioning assumptions. */
export const HighlighterTitle: React.FC<HighlighterTitleProps> = ({
  title,
  enterFrame,
  wipeFrame = enterFrame + 2,
  wipeFrames = 14,
  wipeWidth = "100%",
  barHeight = 10,
  accent = "#FFBE0B",
  fontFamily = "mono",
  fontSize = 44,
  pop,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const motion = usePopIn(
    frame,
    enterFrame,
    fps,
    pop?.damping ?? DEFAULT_DAMPING,
    pop?.stiffness ?? DEFAULT_STIFFNESS
  );
  const wipe = interpolate(frame, [wipeFrame, wipeFrame + Math.max(1, wipeFrames)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wipeSize =
    typeof wipeWidth === "number" ? wipeWidth * wipe : `calc(${wipeWidth} * ${wipe})`;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: fontFamily === "mono" ? MONO : SANS,
          fontWeight: 700,
          fontSize,
          opacity: motion.opacity,
          transform: `translateY(${motion.translateY}px) scale(${motion.scale})`,
          transformOrigin: "center center",
        }}
      >
        {title}
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          zIndex: 0,
          left: 0,
          bottom: 0,
          width: wipeSize,
          height: barHeight,
          background: accent,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
