// VN-Myth Ep.04 shared base: paper backgrounds, fonts, speech-lock anchor hook,
// animation helpers, tags, image scene, quote plates, motif glyphs.
// Speech-lock: `useA()` returns A(word, occ) -> FRACTION of the scene at which that
// word is spoken in this scene's section — feed the result into startFrac props.
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
import { C, FONT, FPS, at, ease } from "./theme";

// scene groups import these helpers from "./common" — re-export for them
export { at, ease };
import { wordStart } from "./anchors";

// ---------------------------------------------------------------------------
// Fonts (loaded at module import; Remotion holds the render until ready)
// Same proven Vietnamese-diacritic stack as Ep.02/Ep.03.
// ---------------------------------------------------------------------------
const SUBSETS = ["vietnamese", "latin"] as const;
const fontLoads = [
  loadPlayfair("normal", { weights: ["700", "800"], subsets: [...SUBSETS] }),
  loadBeVietnam("normal", { weights: ["400", "500", "700"], subsets: [...SUBSETS] }),
  loadMono("normal", { weights: ["400", "500"], subsets: [...SUBSETS] }),
];

export const useFonts = (): boolean => {
  void fontLoads;
  return true;
};

// ---------------------------------------------------------------------------
// Scene duration context + useFrac (series pattern)
// ---------------------------------------------------------------------------
const SceneDurContext = createContext<number | null>(null);

export const SceneDurProvider: React.FC<{
  durationInFrames: number;
  children: React.ReactNode;
}> = ({ durationInFrames, children }) => (
  <SceneDurContext.Provider value={durationInFrames}>{children}</SceneDurContext.Provider>
);

export type Frac = {
  frame: number;
  dur: number;
  p: (a: number, b?: number) => number;
};

export const useFrac = (durationInFrames?: number): Frac => {
  const frame = useCurrentFrame();
  const cfg = useVideoConfig();
  const ctx = useContext(SceneDurContext);
  const dur = durationInFrames ?? ctx ?? cfg.durationInFrames;
  return { frame, dur, p: (a, b) => at(frame, dur, a, b) };
};

// ---------------------------------------------------------------------------
// Speech-lock anchor context
// ---------------------------------------------------------------------------
const AnchorCtx = createContext<{ sectionId: string; startFrame: number } | null>(null);

export const AnchorProvider: React.FC<{
  sectionId: string;
  startFrame: number;
  children: React.ReactNode;
}> = ({ sectionId, startFrame, children }) => (
  <AnchorCtx.Provider value={{ sectionId, startFrame }}>{children}</AnchorCtx.Provider>
);

/**
 * A("trống", 2) -> fraction of THIS scene at which that word is spoken.
 * Clamp keeps a slightly-off anchor inside the scene instead of hiding content.
 */
export const useA = (durationInFrames?: number) => {
  const ctx = useContext(AnchorCtx);
  const cfg = useVideoConfig();
  const dctx = useContext(SceneDurContext);
  const dur = durationInFrames ?? dctx ?? cfg.durationInFrames;
  return (word: string, occ = 1): number => {
    if (!ctx) return 0.04;
    const local = Math.round(wordStart(ctx.sectionId, word, occ) * FPS) - ctx.startFrame;
    return Math.max(0.01, Math.min(0.965, local / Math.max(1, dur)));
  };
};

// ---------------------------------------------------------------------------
// Paper background (variants: myth / earth / teal / museum)
// ---------------------------------------------------------------------------
export const Paper: React.FC<{
  variant?: "myth" | "earth" | "teal" | "museum";
  children?: React.ReactNode;
}> = ({ variant = "myth", children }) => {
  useFonts();
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`grain-${Math.floor(frame / 3)}`) * 10000);
  const bg =
    variant === "museum" ? C.bgMuseum : variant === "earth" ? "#201810" : C.bg;
  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      {variant === "earth" && (
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(to top, rgba(92,61,34,0.55) 0%, rgba(92,61,34,0.18) 34%, rgba(26,23,20,0) 62%)",
          }}
        />
      )}
      {variant === "teal" && (
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(to top, rgba(47,93,107,0.30) 0%, rgba(26,23,20,0) 55%), radial-gradient(ellipse at 50% 30%, rgba(127,209,200,0.07) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
      )}
      {variant === "museum" && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 50% 42%, rgba(201,143,78,0.10) 0%, rgba(0,0,0,0) 55%)",
          }}
        />
      )}
      <AbsoluteFill>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.42) 100%)",
        }}
      />
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
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------
type StyleProp = React.CSSProperties;

export const Reveal: React.FC<{
  startFrac: number;
  endFrac?: number;
  dy?: number;
  durationInFrames?: number;
  style?: StyleProp;
  children?: React.ReactNode;
}> = ({ startFrac, endFrac, dy = 24, durationInFrames, style, children }) => {
  const { p } = useFrac(durationInFrames);
  const t = ease(p(startFrac, endFrac ?? startFrac + 0.05));
  return <div style={{ opacity: t, transform: `translateY(${(1 - t) * dy}px)`, ...style }}>{children}</div>;
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

/** Vietnamese number format: thousands dot, decimal comma. */
export const formatVN = (n: number, decimals = 0): string => {
  const neg = n < 0;
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, dec] = fixed.split(".");
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-" : "") + withDots + (dec ? "," + dec : "");
};

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

export const InkPath: React.FC<{
  d: string;
  startFrac: number;
  endFrac?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  durationInFrames?: number;
  style?: React.CSSProperties;
}> = ({ d, startFrac, endFrac, stroke = C.cream, strokeWidth = 4, fill = "none", durationInFrames, style }) => {
  const { p } = useFrac(durationInFrames);
  const t = ease(p(startFrac, endFrac ?? startFrac + 0.12));
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

export const InkDraw: React.FC<{
  d: string;
  startFrac: number;
  endFrac?: number;
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

/** SVG circle path (for InkPath stroke-drawing rings). */
export const circleD = (cx: number, cy: number, r: number): string =>
  `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;

// ---------------------------------------------------------------------------
// Sound-ripple motif — sóng nước / sóng lan, dùng xuyên suốt tập
// ---------------------------------------------------------------------------
export const SoundRipples: React.FC<{
  cx: number;
  cy: number;
  startFrac: number;
  count?: number;
  maxR?: number;
  color?: string;
  strokeWidth?: number;
  periodFrac?: number;
  durationInFrames?: number;
}> = ({
  cx,
  cy,
  startFrac,
  count = 3,
  maxR = 620,
  color = C.amber,
  strokeWidth = 5,
  periodFrac = 0.18,
  durationInFrames,
}) => {
  const { frame, dur } = useFrac(durationInFrames);
  const start = startFrac * dur;
  const rings = [];
  for (let i = 0; i < count; i++) {
    const t0 = start + i * periodFrac * dur;
    const t = Math.max(0, Math.min(1, (frame - t0) / (0.5 * dur)));
    if (t <= 0) continue;
    const e = ease(t);
    rings.push(
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={e * maxR}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth * (1 - 0.5 * e)}
        opacity={0.85 * (1 - e)}
      />
    );
  }
  return (
    <svg
      width="1920"
      height="1080"
      viewBox="0 0 1920 1080"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {rings}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------
/** Amber framed tag "TRUYỀN THUYẾT KỂ" — mandatory frame for legend quotes. */
export const LegendFrame: React.FC<{
  label?: string;
  children?: React.ReactNode;
  style?: StyleProp;
}> = ({ label = "TRUYỀN THUYẾT KỂ", children, style }) => (
  <div
    style={{
      position: "relative",
      background: "rgba(36,31,26,0.94)",
      border: `3px solid ${C.amber}`,
      borderRadius: 10,
      padding: "44px 56px 48px",
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: -26,
        left: 48,
        padding: "8px 24px",
        background: C.amber,
        color: "#1A1714",
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 28,
        letterSpacing: 3,
        borderRadius: 4,
      }}
    >
      {label}
    </div>
    {children}
  </div>
);

export const SourceTag: React.FC<{ text: string; bottom?: number; right?: boolean }> = ({
  text,
  bottom = 40,
  right = false,
}) => (
  <div
    style={{
      position: "absolute",
      [right ? "right" : "left"]: 64,
      bottom,
      maxWidth: 1500,
      color: C.cream,
      fontFamily: FONT.mono,
      fontWeight: 400,
      fontSize: 28,
      lineHeight: 1.3,
      textShadow: "0 2px 8px rgba(0,0,0,0.75)",
      background: "rgba(20,17,13,0.66)",
      padding: "6px 16px",
      borderRadius: 6,
    }}
  >
    {text}
  </div>
);

/** Wikimedia photo credit — bắt buộc trên mọi scene dùng ảnh thật. */
export const PhotoCredit: React.FC = () => (
  <div
    style={{
      position: "absolute",
      right: 48,
      bottom: 32,
      color: C.cream,
      fontFamily: FONT.mono,
      fontSize: 24,
      letterSpacing: 0.5,
      opacity: 0.92,
      textShadow: "0 2px 8px rgba(0,0,0,0.85)",
      background: "rgba(20,17,13,0.55)",
      padding: "5px 14px",
      borderRadius: 6,
    }}
  >
    Ảnh: Casablanca1911 / Wikimedia Commons, CC BY-SA 3.0
  </div>
);

/** Teal badge for the science layer. */
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
        background: "rgba(26,23,20,0.78)",
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 28,
        letterSpacing: 3,
        opacity: ease(p(0.02, 0.08)),
      }}
    >
      {text}
    </div>
  );
};

/** Earth-brown badge for the ground dossier. */
export const EarthBadge: React.FC<{ text?: string }> = ({ text = "HỒ SƠ NỀN ĐẤT" }) => {
  const { p } = useFrac();
  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        left: 64,
        padding: "8px 22px",
        border: `2px solid ${C.earthGlow}`,
        borderRadius: 6,
        color: C.earthGlow,
        background: "rgba(26,23,20,0.78)",
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 28,
        letterSpacing: 3,
        opacity: ease(p(0.02, 0.08)),
      }}
    >
      {text}
    </div>
  );
};

/** Small bordered label chip. */
export const Chip: React.FC<{
  color?: string;
  children?: React.ReactNode;
  style?: StyleProp;
}> = ({ color = C.cream, children, style }) => (
  <span
    style={{
      display: "inline-block",
      padding: "6px 18px",
      border: `2px solid ${color}`,
      borderRadius: 999,
      color,
      fontFamily: FONT.body,
      fontWeight: 500,
      fontSize: 30,
      letterSpacing: 1,
      background: "rgba(26,23,20,0.72)",
      ...style,
    }}
  >
    {children}
  </span>
);

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
  titleSize = 84,
  maxWidth = 1560,
  accent = C.amber,
  style,
}) => (
  <div style={{ maxWidth, textAlign: align, ...style }}>
    {eyebrow && (
      <Reveal startFrac={startFrac} endFrac={startFrac + 0.05}>
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
    <Reveal startFrac={startFrac + 0.03} endFrac={startFrac + 0.1}>
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
      <Reveal startFrac={startFrac + 0.08} endFrac={startFrac + 0.15}>
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
// InkImageScene — Ken Burns two-layer plate (series pattern, Ep.04 asset roots)
// ---------------------------------------------------------------------------
/** "img-sc006.png" -> public/co-loa-no-than/images/... ; URLs with "/" pass through. */
export const plateSrc = (src: string): string =>
  src.includes("/")
    ? src
    : staticFile(`co-loa-no-than/images/${src}`);

export const InkImageScene: React.FC<{
  src: string;
  label?: string;
  sublabel?: string;
  labelPos?: "bottom-left" | "bottom-right";
  focus?: { x: number; y: number };
  durationInFrames?: number;
  children?: React.ReactNode;
}> = ({
  src,
  label,
  sublabel,
  labelPos = "bottom-left",
  focus = { x: 0.5, y: 0.5 },
  durationInFrames,
  children,
}) => {
  const { frame, dur, p } = useFrac(durationInFrames);
  const t = Math.max(0, Math.min(1, frame / Math.max(1, dur - 1)));
  const s = t * t * (3 - 2 * t);
  const dir = focus.x < 0.5 ? 1 : -1;
  const origin = `${focus.x * 100}% ${focus.y * 100}%`;
  const url = plateSrc(src);
  const imgStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
  const fade = ease(p(0, 0.04));
  const right = labelPos === "bottom-right";
  return (
    <Paper>
      <AbsoluteFill style={{ opacity: fade }}>
        <AbsoluteFill
          style={{
            transform: `translate(${-dir * (-12 + 24 * s)}px, ${-6 + 12 * s}px) scale(${1.12 + 0.03 * s})`,
            transformOrigin: origin,
            filter: "blur(6px) brightness(0.8)",
          }}
        >
          <Img src={url} style={imgStyle} />
        </AbsoluteFill>
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
            startFrac={0.06}
            endFrac={0.15}
            style={{
              position: "absolute",
              bottom: 110,
              [right ? "right" : "left"]: 64,
              maxWidth: 1320,
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
                textShadow: "0 2px 12px rgba(0,0,0,0.85)",
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
                  textShadow: "0 2px 10px rgba(0,0,0,0.85)",
                }}
              >
                {sublabel}
              </div>
            )}
          </Reveal>
        </>
      )}
    </Paper>
  );
};

/** Red strike-through sweeping across a text block. */
export const StrikeThrough: React.FC<{
  startFrac: number;
  endFrac?: number;
  width?: number;
  color?: string;
  thickness?: number;
  style?: StyleProp;
}> = ({ startFrac, endFrac, width = 1100, color = C.warn, thickness = 10, style }) => {
  const { p } = useFrac();
  const t = ease(p(startFrac, endFrac ?? startFrac + 0.06));
  if (t <= 0) return null;
  return (
    <div style={{ position: "absolute", left: "50%", ...style }}>
      <div
        style={{
          width: width * t,
          height: thickness,
          background: color,
          transform: `translate(-${(width * t) / 2}px, -50%) rotate(-2deg)`,
          boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// QuotePlate — nguyên văn cổ thư, chữ hiện dần như đang được đọc
// ---------------------------------------------------------------------------
export const QuotePlate: React.FC<{
  text: string;
  startFrac: number;
  endFrac?: number;
  source?: string;
  size?: number;
  maxWidth?: number;
  accent?: string;
  durationInFrames?: number;
}> = ({
  text,
  startFrac,
  endFrac,
  source = "Lĩnh Nam chích quái — Truyện Rùa Vàng",
  size = 54,
  maxWidth = 1480,
  accent = C.amber,
  durationInFrames,
}) => {
  const { frame, dur } = useFrac(durationInFrames);
  const chars = [...text];
  const s0 = startFrac * dur;
  const s1 = (endFrac ?? startFrac + 0.45) * dur;
  const prog = Math.max(0, Math.min(1, (frame - s0) / Math.max(1, s1 - s0)));
  const n = Math.floor(prog * chars.length);
  return (
    <LegendFrame label="TRÍCH NGUYÊN VĂN">
      <div
        style={{
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.5,
          color: C.white,
          maxWidth,
        }}
      >
        {chars.slice(0, n).join("")}
        <span style={{ color: accent }}>{n < chars.length ? "▌" : ""}</span>
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 28,
          color: accent,
          marginTop: 26,
          letterSpacing: 1,
        }}
      >
        — {source}
      </div>
    </LegendFrame>
  );
};

// ---------------------------------------------------------------------------
// WipeInk — chuyển lớp hồ sơ bằng vệt mực chéo phủ toàn màn
// ---------------------------------------------------------------------------
export const WipeInk: React.FC<{
  startFrac: number;
  color: string;
  durationInFrames?: number;
}> = ({ startFrac, color, durationInFrames }) => {
  const { p } = useFrac(durationInFrames);
  const t = ease(p(startFrac, startFrac + 0.12));
  const out = ease(p(startFrac + 0.12, startFrac + 0.26));
  if (t <= 0 || out >= 1) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-30%",
          width: "170%",
          height: "150%",
          background: color,
          transform: `translateX(${(t - out) * 130 - 15}%) skewX(-8deg)`,
          opacity: Math.min(1, t * 1.5) * (1 - out),
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Glyphs — mũi tên đồng + cây nỏ schema (dùng nhiều scene)
// ---------------------------------------------------------------------------
/** Mũi tên đồng ba cạnh — vẽ theo stroke, dài dọc trục Y, đỉnh ở (0,0). */
export const ArrowGlyph: React.FC<{
  x: number;
  y: number;
  scale?: number;
  progress: number;
  stroke?: string;
  glow?: number;
}> = ({ x, y, scale = 1, progress, stroke = C.bronze, glow = 0 }) => {
  const t = Math.max(0, Math.min(1, progress));
  const tip = `M0 0 L26 64 L-26 64 Z`;
  const tang = `M0 64 L10 300 L-10 300 Z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={t}>
      <path d={tip} fill={stroke} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, t * 1.6)} />
      <path d={tang} fill={stroke} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, t * 1.6 - 0.6)} />
      {glow > 0 && (
        <path d={`${tip} ${tang}`} fill={C.white} opacity={0.35 * glow} />
      )}
    </g>
  );
};

/** Cây nỏ schema nằm ngang (thân ở giữa, cung bên phải) — vẽ theo stroke. */
export const CrossbowGlyph: React.FC<{
  x: number;
  y: number;
  scale?: number;
  progress: number;
  stroke?: string;
  strokeWidth?: number;
}> = ({ x, y, scale = 1, progress, stroke = C.cream, strokeWidth = 5 }) => {
  const t = Math.max(0, Math.min(1, progress));
  const stock = "M -260 0 L 180 0 L 180 26 L -260 26 Z"; // thân nỏ
  const bow = "M 150 -150 Q 320 0 150 150"; // cánh cung
  const string = "M 150 -150 L 40 8 L 150 150"; // dây cung
  const trigger = "M -20 26 L -20 96 Q -20 124 8 124 L 40 124 L 40 96 L 12 96 L 12 26 Z"; // hộp lẫy + cò
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d={stock} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, t * 2)} />
      <path d={bow} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, Math.min(1, t * 2 - 0.6))} />
      <path
        d={string}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - Math.max(0, Math.min(1, t * 2 - 1.1))}
        opacity={0.9}
      />
      <path
        d={trigger}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - Math.max(0, Math.min(1, t * 2 - 1.5))}
        stroke={C.amber}
      />
    </g>
  );
};
