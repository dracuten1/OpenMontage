// VN-Myth Ep.02 shared base: paper background, fonts, animation helpers, tags, image scene.
// Contrast rule: body text never below C.cream on C.bg/C.card; body >= 34px, labels >= 28px @1920x1080.
import React, { createContext, useContext } from "react";
import {
  AbsoluteFill,
  Img,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadBeVietnam } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { C, FONT, at, ease } from "./theme";

// ---------------------------------------------------------------------------
// Fonts (loaded at module import; Remotion holds the render until they are ready)
// ---------------------------------------------------------------------------
const SUBSETS = ["vietnamese", "latin"] as const;
const fontLoads = [
  loadPlayfair("normal", { weights: ["700", "800"], subsets: [...SUBSETS] }),
  loadBeVietnam("normal", { weights: ["400", "500", "700"], subsets: [...SUBSETS] }),
  loadMono("normal", { weights: ["400", "500"], subsets: [...SUBSETS] }),
];

/** Fonts already load at import; this hook exists so scenes can call it explicitly (idempotent). */
export const useFonts = (): boolean => {
  void fontLoads;
  return true;
};

// ---------------------------------------------------------------------------
// Scene duration context + useFrac
// ---------------------------------------------------------------------------
const SceneDurContext = createContext<number | null>(null);
/** Wrap a scene to pin the duration all helpers use (ScenePreview / assembler do this). */
export const SceneDurProvider: React.FC<{
  durationInFrames: number;
  children: React.ReactNode;
}> = ({ durationInFrames, children }) => (
  <SceneDurContext.Provider value={durationInFrames}>{children}</SceneDurContext.Provider>
);

export type Frac = {
  frame: number;
  dur: number;
  /** 0..1 progress between fractions a..b of the scene (b defaults to a+0.08), clamped */
  p: (a: number, b?: number) => number;
};

/** Priority: explicit arg > SceneDurProvider > useVideoConfig().durationInFrames (Sequence-aware). */
export const useFrac = (durationInFrames?: number): Frac => {
  const frame = useCurrentFrame();
  const cfg = useVideoConfig();
  const ctx = useContext(SceneDurContext);
  const dur = durationInFrames ?? ctx ?? cfg.durationInFrames;
  return { frame, dur, p: (a, b) => at(frame, dur, a, b) };
};

// ---------------------------------------------------------------------------
// Paper background
// ---------------------------------------------------------------------------
export const Paper: React.FC<{
  variant?: "myth" | "lab";
  children?: React.ReactNode;
}> = ({ variant = "myth", children }) => {
  useFonts();
  const frame = useCurrentFrame();
  const lab = variant === "lab";
  // deterministic grain: seed changes every 3 frames via remotion random()
  const seed = Math.floor(random(`grain-${Math.floor(frame / 3)}`) * 10000);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      {!lab && (
        <AbsoluteFill
          style={{
            opacity: 0.18,
            mixBlendMode: "soft-light",
          }}
        >
          <Img
            src={staticFile("con-rong-chau-tien/texture_giay_do.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}
      {lab && (
        <AbsoluteFill
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(127,209,200,0.05) 0px, rgba(127,209,200,0.05) 1px, transparent 1px, transparent 4px), linear-gradient(rgba(127,209,200,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(127,209,200,0.06) 1px, transparent 1px)`,
            backgroundSize: "100% 4px, 96px 96px, 96px 96px",
          }}
        />
      )}
      {/* children sit between the paper and the vignette/grain so ink stays crisp */}
      <AbsoluteFill>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: lab
            ? "radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.28) 100%)"
            : "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.42) 100%)",
        }}
      />
      {!lab && (
        <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.05, mixBlendMode: "overlay" }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <filter id={`grain-${seed}`}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves={2}
                seed={seed}
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
          </svg>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------
type StyleProp = React.CSSProperties;

/** Fade-up reveal. startFrac/endFrac are fractions of the scene duration. */
export const Reveal: React.FC<{
  startFrac: number;
  endFrac?: number;
  dy?: number;
  durationInFrames?: number;
  style?: StyleProp;
  children?: React.ReactNode;
}> = ({ startFrac, endFrac, dy = 24, durationInFrames, style, children }) => {
  const { p } = useFrac(durationInFrames);
  const t = ease(p(startFrac, endFrac));
  return (
    <div style={{ opacity: t, transform: `translateY(${(1 - t) * dy}px)`, ...style }}>
      {children}
    </div>
  );
};

/** Vietnamese number format: thousands dot, decimal comma (1.434.628 / 3,5). */
export const formatVN = (n: number, decimals = 0): string => {
  const neg = n < 0;
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, dec] = fixed.split(".");
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-" : "") + withDots + (dec ? "," + dec : "");
};

export const CountUp: React.FC<{
  to: number;
  from?: number;
  startFrac: number;
  endFrac: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  durationInFrames?: number;
  style?: StyleProp;
}> = ({ to, from = 0, startFrac, endFrac, decimals = 0, prefix = "", suffix = "", durationInFrames, style }) => {
  const { p } = useFrac(durationInFrames);
  const v = from + (to - from) * ease(p(startFrac, endFrac));
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {formatVN(v, decimals)}
      {suffix}
    </span>
  );
};

/** Spring scale/opacity pop-in starting at startFrac of the scene. */
export const SpringPop: React.FC<{
  startFrac: number;
  from?: number;
  durationInFrames?: number;
  style?: StyleProp;
  children?: React.ReactNode;
}> = ({ startFrac, from = 0.8, durationInFrames, style, children }) => {
  const { frame, dur } = useFrac(durationInFrames);
  const { fps } = useVideoConfig();
  const s = spring({
    frame: Math.max(0, frame - startFrac * dur),
    fps,
    config: { damping: 14, stiffness: 110, mass: 0.9 },
  });
  const started = frame >= startFrac * dur;
  return (
    <div
      style={{
        opacity: started ? Math.min(1, s * 1.4) : 0,
        transform: `scale(${from + (1 - from) * s})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Inner <path> that draws itself in (use inside your own <svg>). */
export const InkPath: React.FC<{
  d: string;
  startFrac: number;
  endFrac: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  durationInFrames?: number;
  style?: React.CSSProperties;
}> = ({ d, startFrac, endFrac, stroke = C.cream, strokeWidth = 4, fill = "none", durationInFrames, style }) => {
  const { p } = useFrac(durationInFrames);
  const t = ease(p(startFrac, endFrac));
  return (
    <path
      d={d}
      pathLength={1}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={1}
      strokeDashoffset={1 - t}
      style={{ opacity: t > 0 ? 1 : 0, ...style }}
    />
  );
};

/** Self-contained SVG with one path stroke-drawn in (dashoffset driven by the fraction window). */
export const InkDraw: React.FC<{
  d: string;
  startFrac: number;
  endFrac: number;
  viewBox?: string;
  width?: number | string;
  height?: number | string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  durationInFrames?: number;
  style?: React.CSSProperties;
}> = ({ d, startFrac, endFrac, viewBox = "0 0 1920 1080", width = "100%", height = "100%", stroke, strokeWidth, fill, durationInFrames, style }) => (
  <svg width={width} height={height} viewBox={viewBox} style={{ overflow: "visible", ...style }}>
    <InkPath
      d={d}
      startFrac={startFrac}
      endFrac={endFrac}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
      durationInFrames={durationInFrames}
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------
/** "DIỄN GIẢI" amber-outline tag, top-right. For interpretation (not-fact) scenes. */
export const InterpretFlag: React.FC<{ show?: boolean; text?: string }> = ({
  show = true,
  text = "DIỄN GIẢI",
}) => {
  const { p } = useFrac();
  if (!show) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        right: 64,
        padding: "8px 22px",
        border: `2px solid ${C.amber}`,
        borderRadius: 6,
        color: C.amber,
        background: "rgba(26,23,20,0.72)",
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 28,
        letterSpacing: 3,
        opacity: ease(p(0.02, 0.07)),
      }}
    >
      {text}
    </div>
  );
};

/** Bottom-left mono citation line. */
export const SourceTag: React.FC<{ text: string; bottom?: number }> = ({ text, bottom = 40 }) => (
  <div
    style={{
      position: "absolute",
      left: 64,
      bottom,
      maxWidth: 1500,
      color: C.cream,
      fontFamily: FONT.mono,
      fontWeight: 400,
      fontSize: 28,
      lineHeight: 1.3,
      textShadow: "0 2px 8px rgba(0,0,0,0.7)",
    }}
  >
    {text}
  </div>
);

/** Teal top-left badge for the science layer. */
export const LabBadge: React.FC<{ text?: string }> = ({ text = "GÓC KHOA HỌC" }) => {
  const { p } = useFrac();
  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        left: 64,
        padding: "8px 22px",
        border: `2px solid ${C.teal}`,
        borderRadius: 6,
        color: C.teal,
        background: "rgba(26,23,20,0.72)",
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 28,
        letterSpacing: 3,
        opacity: ease(p(0.02, 0.07)),
      }}
    >
      {text}
    </div>
  );
};

// ---------------------------------------------------------------------------
// SceneTitle
// ---------------------------------------------------------------------------
export const SceneTitle: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  startFrac?: number;
  titleSize?: number;
  maxWidth?: number;
  accent?: string;
  style?: StyleProp;
}> = ({
  eyebrow,
  title,
  subtitle,
  align = "left",
  startFrac = 0.04,
  titleSize = 88,
  maxWidth = 1500,
  accent = C.amber,
  style,
}) => (
  <div style={{ maxWidth, textAlign: align, ...style }}>
    {eyebrow && (
      <Reveal startFrac={startFrac} endFrac={startFrac + 0.06}>
        <div
          style={{
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 5,
            color: accent,
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          {eyebrow}
        </div>
      </Reveal>
    )}
    <Reveal startFrac={startFrac + 0.03} endFrac={startFrac + 0.11}>
      <div
        style={{
          fontFamily: FONT.display,
          fontWeight: 800,
          fontSize: titleSize,
          lineHeight: 1.12,
          color: C.white,
        }}
      >
        {title}
      </div>
    </Reveal>
    {subtitle && (
      <Reveal startFrac={startFrac + 0.08} endFrac={startFrac + 0.16}>
        <div
          style={{
            fontFamily: FONT.body,
            fontWeight: 400,
            fontSize: 38,
            lineHeight: 1.45,
            color: C.cream,
            marginTop: 24,
          }}
        >
          {subtitle}
        </div>
      </Reveal>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// InkImageScene
// ---------------------------------------------------------------------------
const plateSrc = (src: string) =>
  staticFile(src.includes("/") ? src : `con-rong-chau-tien/${src}`);

export const InkImageScene: React.FC<{
  /** file name inside public/con-rong-chau-tien/ or a full public-relative path */
  src: string;
  label?: string;
  sublabel?: string;
  labelPos?: "bottom-left" | "bottom-right";
  /** focal point 0..1 (default centre): transform origin and drift direction */
  focus?: { x: number; y: number };
  flag?: boolean;
  durationInFrames?: number;
  children?: React.ReactNode;
}> = ({ src, label, sublabel, labelPos = "bottom-left", focus = { x: 0.5, y: 0.5 }, flag = false, durationInFrames, children }) => {
  const { frame, dur, p } = useFrac(durationInFrames);
  const t = Math.max(0, Math.min(1, frame / Math.max(1, dur - 1)));
  const s = t * t * (3 - 2 * t); // slow smoothstep
  const dir = focus.x < 0.5 ? 1 : -1;
  const origin = `${focus.x * 100}% ${focus.y * 100}%`;
  const url = plateSrc(src);
  const imgStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
  const fade = ease(p(0, 0.04));
  const right = labelPos === "bottom-right";
  return (
    <Paper>
      <AbsoluteFill style={{ opacity: fade }}>
        {/* back layer: soft, slow, counter-drift */}
        <AbsoluteFill
          style={{
            transform: `translate(${-dir * (-12 + 24 * s)}px, ${-6 + 12 * s}px) scale(${1.12 + 0.03 * s})`,
            transformOrigin: origin,
            filter: "blur(6px) brightness(0.8)",
          }}
        >
          <Img src={url} style={imgStyle} />
        </AbsoluteFill>
        {/* front layer: sharp, feathered edges so the back layer shows at the periphery */}
        <AbsoluteFill
          style={{
            transform: `translate(${dir * (-20 + 40 * s)}px, ${-10 + 14 * s}px) scale(${1.04 + 0.08 * s})`,
            transformOrigin: origin,
            WebkitMaskImage: "radial-gradient(ellipse at center, #000 62%, rgba(0,0,0,0.0) 100%)",
            maskImage: "radial-gradient(ellipse at center, #000 62%, rgba(0,0,0,0.0) 100%)",
          }}
        >
          <Img src={url} style={imgStyle} />
        </AbsoluteFill>
      </AbsoluteFill>
      {children}
      {label && (
        <>
          <AbsoluteFill
            style={{
              pointerEvents: "none",
              background:
                "linear-gradient(to top, rgba(26,23,20,0.94) 0%, rgba(26,23,20,0.72) 16%, rgba(26,23,20,0) 40%)",
            }}
          />
          <Reveal
            startFrac={0.08}
            endFrac={0.18}
            style={{
              position: "absolute",
              bottom: 110,
              [right ? "right" : "left"]: 64,
              maxWidth: 1300,
              textAlign: right ? "right" : "left",
            }}
          >
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 56,
                lineHeight: 1.15,
                color: C.white,
                textShadow: "0 2px 12px rgba(0,0,0,0.8)",
              }}
            >
              {label}
            </div>
            {sublabel && (
              <div
                style={{
                  fontFamily: FONT.body,
                  fontWeight: 500,
                  fontSize: 34,
                  lineHeight: 1.4,
                  color: C.cream,
                  marginTop: 10,
                  textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                }}
              >
                {sublabel}
              </div>
            )}
          </Reveal>
        </>
      )}
      <InterpretFlag show={flag} />
    </Paper>
  );
};
