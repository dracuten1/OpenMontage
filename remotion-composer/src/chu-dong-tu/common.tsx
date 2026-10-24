// VN-Myth Ep.05 shared base: paper backgrounds, fonts, speech-lock anchor hook,
// animation helpers, tags, image plate, quote plates + EP.05 DEVICES:
// oil-lamp glyph (series motif "bản đồ tắt đèn"), map canvas on the gen BASE,
// six-trait grid, timeline track, text/stat cards.
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
// Same proven Vietnamese-diacritic stack as Ep.02/03/04.
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
  const dur = ctx ?? durationInFrames ?? cfg.durationInFrames;
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
 * A("trăm", 2) -> fraction of THIS scene at which that word is spoken.
 * Raw fractions preserve out-of-window anchors so the audit can report them.
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
// Paper background (variants: myth / earth / teal / museum / night)
// ---------------------------------------------------------------------------
export const Paper: React.FC<{
  variant?: "myth" | "earth" | "teal" | "museum" | "night";
  children?: React.ReactNode;
}> = ({ variant = "myth", children }) => {
  useFonts();
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`grain-${Math.floor(frame / 3)}`) * 10000);
  const bg =
    variant === "museum"
      ? C.bgMuseum
      : variant === "earth"
      ? "#201810"
      : variant === "night"
      ? "#0E0C0A"
      : C.bg;
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
      {variant === "night" && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 50% 62%, rgba(232,90,79,0.05) 0%, rgba(0,0,0,0) 60%)",
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
// Tags / labels
// ---------------------------------------------------------------------------
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
      textShadow: "0 2px 12px rgba(0,0,0,0.92)",
      background: "rgba(20,17,13,0.72)",
      padding: "6px 16px",
      borderRadius: 6,
    }}
  >
    {text}
  </div>
);

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
      background: "rgba(26,23,20,0.78)",
      ...style,
    }}
  >
    {children}
  </span>
);

/** Amber framed tag — mandatory frame for primary-source quotes. */
export const LegendFrame: React.FC<{
  label?: string;
  color?: string;
  children?: React.ReactNode;
  style?: StyleProp;
}> = ({ label = "TRÍCH NGUYÊN VĂN", color = C.amber, children, style }) => (
  <div
    style={{
      position: "relative",
      background: "rgba(36,31,26,0.94)",
      border: `3px solid ${color}`,
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
        background: color,
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

/** Red lamp badge — "hồ sơ" dossier marker. */
export const DossierBadge: React.FC<{ text: string }> = ({ text }) => {
  const { p } = useFrac();
  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        left: 64,
        padding: "8px 22px",
        border: `2px solid ${C.lampRed}`,
        borderRadius: 6,
        color: C.lampRed,
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

/** Standard text-card scene layout: dark panel + SceneTitle (contrast rule). */
export const TextCard: React.FC<{
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  titleSize?: number;
  accent?: string;
  align?: "left" | "center";
  startFrac?: number;
  maxWidth?: number;
  children?: React.ReactNode;
}> = ({
  eyebrow,
  title,
  subtitle,
  titleSize = 84,
  accent = C.amber,
  align = "center",
  startFrac = 0.05,
  maxWidth = 1500,
  children,
}) => (
  <Paper>
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 120px",
      }}
    >
      <div
        style={{
          background: "rgba(20,17,13,0.78)",
          border: `2px solid ${C.border}`,
          borderRadius: 14,
          padding: "56px 72px",
          maxWidth,
        }}
      >
        {(title || eyebrow || subtitle) && (
          <SceneTitle
            eyebrow={eyebrow}
            title={title ?? ""}
            subtitle={subtitle}
            align={align}
            titleSize={titleSize}
            accent={accent}
            startFrac={startFrac}
            maxWidth={maxWidth - 40}
          />
        )}
        {children}
      </div>
    </div>
  </Paper>
);

// ---------------------------------------------------------------------------
// InkImageScene — Ken Burns two-layer plate (series pattern, Ep.05 asset roots)
// ---------------------------------------------------------------------------
/** "img-sc006.png" -> public/chu-dong-tu/images/... ; URLs with "/" pass through. */
export const plateSrc = (src: string): string =>
  src.includes("/")
    ? src
    : staticFile(`chu-dong-tu/images/${src}`);

export const InkImageScene: React.FC<{
  src: string;
  label?: string;
  sublabel?: string;
  labelPos?: "bottom-left" | "bottom-right";
  focus?: { x: number; y: number };
  durationInFrames?: number;
  labelStartFrac?: number;
  sublabelStartFrac?: number;
  children?: React.ReactNode;
}> = ({
  src,
  label,
  sublabel,
  labelPos = "bottom-left",
  focus = { x: 0.5, y: 0.5 },
  durationInFrames,
  labelStartFrac,
  sublabelStartFrac,
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
      <AbsoluteFill
        style={{
          opacity: fade,
          WebkitMaskImage:
            "radial-gradient(ellipse 47% 45% at center, #000000 70%, rgba(0,0,0,0) 95%)",
          maskImage:
            "radial-gradient(ellipse 47% 45% at center, #000000 70%, rgba(0,0,0,0) 95%)",
        }}
      >
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
            startFrac={labelStartFrac ?? 0.06}
            endFrac={labelStartFrac ? labelStartFrac + 0.09 : 0.15}
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

// ---------------------------------------------------------------------------
// EP.05 DEVICE — đèn dầu (oil lamp) glyph
// mode: "lit" amber flame | "red" survivor lamp | "ghost" outline echo
// ---------------------------------------------------------------------------
export const Lamp: React.FC<{
  x: number;
  y: number;
  scale?: number;
  /** 0..1 — 0 = tắt (ember only), 1 = cháy đầy */
  lit: number;
  mode?: "lit" | "red" | "ghost";
  /** pulse phase for the survivor lamp */
  pulse?: number;
}> = ({ x, y, scale = 1, lit, mode = "lit", pulse = 0 }) => {
  const t = Math.max(0, Math.min(1, lit));
  const flame = mode === "red" ? C.lampRed : C.lampGlow;
  const flick = 1 + 0.08 * Math.sin(pulse * 6.283) * t;
  const body = mode === "ghost" ? "none" : C.card;
  const stroke = mode === "ghost" ? C.mute : C.cream;
  const ghost = mode === "ghost";
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={ghost ? 0.55 * t : 1}>
      {/* glow */}
      {t > 0 && !ghost && (
        <>
          <circle cx={0} cy={-26} r={70 * t * flick} fill={flame} opacity={0.10 * t} />
          <circle cx={0} cy={-26} r={34 * t * flick} fill={flame} opacity={0.20 * t} />
        </>
      )}
      {/* flame */}
      {t > 0 && (
        <path
          d="M 0 -52 C 12 -34 15 -22 8 -12 C 4 -6 -4 -6 -8 -12 C -15 -22 -12 -34 0 -52 Z"
          fill={ghost ? "none" : flame}
          stroke={ghost ? stroke : "none"}
          strokeWidth={2.5}
          opacity={Math.min(1, t * 1.2) * (ghost ? 0.7 : 1)}
          transform={`scale(${0.55 + 0.45 * t * flick})`}
        />
      )}
      {/* wick + bowl */}
      <path
        d="M -7 -8 L 7 -8 L 4 -2 L -4 -2 Z"
        fill={body}
        stroke={stroke}
        strokeWidth={2}
        opacity={0.9}
      />
      <path
        d="M -20 -2 Q 0 14 20 -2 Q 10 6 8 12 L -8 12 Q -10 6 -20 -2 Z"
        fill={body}
        stroke={stroke}
        strokeWidth={2.5}
      />
      <path d="M -8 12 L 8 12 L 6 20 L -6 20 Z" fill={body} stroke={stroke} strokeWidth={2} />
      {/* ember dot when nearly off */}
      {t <= 0.02 && !ghost && <circle cx={0} cy={-8} r={3} fill={C.mute} opacity={0.7} />}
    </g>
  );
};

// ---------------------------------------------------------------------------
// EP.05 DEVICE — MapCanvas: gen BASE img-sc002 + lamp state machine + labels
// Toạ độ 1920x1080 đọc từ ảnh gen (đất trái, biển phải, Trường Giang trên,
// marker đỏ giữa bờ biển + vòng hổ phách dưới — GIỮ NGUYÊN làm glow accent).
// ---------------------------------------------------------------------------
export type MapLampKey = "dongau" | "man" | "nam" | "tayau" | "lac";

export const MAP_LAMPS: Record<MapLampKey, { x: number; y: number; label: string }> = {
  dongau: { x: 1104, y: 172, label: "Đông Âu" },
  man: { x: 1046, y: 296, label: "Mân Việt" },
  nam: { x: 1018, y: 456, label: "Nam Việt" },
  tayau: { x: 806, y: 566, label: "Tây Âu" },
  lac: { x: 730, y: 842, label: "Lạc Việt" },
};

/** Bắc → Nam, thứ tự điểm danh narration sc002 (Mân · Đông · Nam · Tây Âu · Lạc). */
export const MAP_LAMP_ROLLCALL: MapLampKey[] = ["man", "dongau", "nam", "tayau", "lac"];

export const MapCanvas: React.FC<{
  /** 0..1 darkness overlay */
  dim?: number;
  /** slow camera translate Y px (dương = lướt xuống nam) */
  panY?: number;
  /** zoom quanh 1 điểm (0..1 progress) */
  zoom?: { progress: number; cx: number; cy: number; amount?: number };
  children?: React.ReactNode;
}> = ({ dim = 0, panY = 0, zoom, children }) => {
  const zt = ease(Math.max(0, Math.min(1, zoom?.progress ?? 0)));
  const amount = zoom?.amount ?? 0.22;
  const scale = 1 + amount * zt;
  return (
    <Paper variant="night">
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            transform: `translateY(${panY}px) scale(${scale})`,
            transformOrigin: zoom ? `${zoom.cx}px ${zoom.cy}px` : "50% 50%",
          }}
        >
          <Img
            src={plateSrc("img-sc002.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.96 }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
      {dim > 0 && (
        <AbsoluteFill style={{ background: `rgba(10,8,6,${0.88 * dim})`, pointerEvents: "none" }} />
      )}
      {children}
    </Paper>
  );
};

/** Nhãn spring cạnh đèn trên bản đồ. */
export const MapLabel: React.FC<{
  x: number;
  y: number;
  text: string;
  startFrac: number;
  color?: string;
  dx?: number;
}> = ({ x, y, text, startFrac, color = C.cream, dx = 36 }) => {
  const { frame, dur } = useFrac();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: Math.max(0, frame - startFrac * dur),
    fps,
    config: { damping: 13, stiffness: 120, mass: 0.8 },
  });
  const started = frame >= startFrac * dur;
  if (!started) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x + dx,
        top: y - 26,
        transform: `translateX(${(1 - s) * -30}px) scale(${0.85 + 0.15 * s})`,
        opacity: Math.min(1, s * 1.3),
        color,
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 34,
        letterSpacing: 1,
        textShadow: "0 2px 10px rgba(0,0,0,0.9)",
        background: "rgba(20,17,13,0.74)",
        padding: "6px 18px",
        borderRadius: 8,
        border: `2px solid ${color}55`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// ---------------------------------------------------------------------------
// EP.05 DEVICE — lưới 6 nét (2×3 "dấu hiệu nhận diện" cells, code-drawn icons)
// ---------------------------------------------------------------------------
export const SixCell: React.FC<{
  hanzi: string;
  label: string;
  note?: string;
  lit: number;
  x: number;
  y: number;
  icon: React.ReactNode;
}> = ({ hanzi, label, note, lit, x, y, icon }) => {
  const t = Math.max(0, Math.min(1, lit));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 520,
        height: 320,
        borderRadius: 12,
        border: `2px solid ${t > 0.05 ? C.amber : C.border}`,
        background: t > 0.05 ? "rgba(36,31,26,0.92)" : "rgba(24,20,16,0.82)",
        opacity: 0.45 + 0.55 * t,
        padding: "20px 26px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: t > 0.3 ? `0 0 ${36 * t}px rgba(217,164,65,${0.18 * t})` : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            fontFamily: FONT.hanzi,
            fontWeight: 700,
            fontSize: 64,
            color: t > 0.05 ? C.amber : C.mute,
            lineHeight: 1,
          }}
        >
          {hanzi}
        </div>
        <svg width={92} height={92} viewBox="0 0 92 92" style={{ opacity: 0.35 + 0.65 * t }}>
          {icon}
        </svg>
      </div>
      <div>
        <div
          style={{
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 36,
            color: t > 0.05 ? C.white : C.mute,
          }}
        >
          {label}
        </div>
        {note && (
          <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.mute, marginTop: 6 }}>{note}</div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// EP.05 DEVICE — timeline quốc hiệu (968 → 1054 → 1804, climax Hồi 4)
// ---------------------------------------------------------------------------
export const TimelineTrack: React.FC<{
  progress: number;
  marks: { at: number; year: string; label?: string; lit?: boolean; accent?: string }[];
  y?: number;
}> = ({ progress, marks, y = 560 }) => {
  const t = ease(Math.max(0, Math.min(1, progress)));
  const x0 = 240;
  const x1 = 1680;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke={C.border} strokeWidth={5} />
      <line
        x1={x0}
        y1={y}
        x2={x0 + (x1 - x0) * t}
        y2={y}
        stroke={C.amber}
        strokeWidth={6}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 12px rgba(217,164,65,0.5))" }}
      />
      {marks.map((m, i) => {
        const mx = x0 + (x1 - x0) * m.at;
        const on = t >= m.at - 0.001 && (m.lit ?? true);
        return (
          <g key={i} opacity={on ? 1 : 0.35}>
            <circle cx={mx} cy={y} r={on ? 14 : 8} fill={on ? m.accent ?? C.amber : C.border} />
            {on && <circle cx={mx} cy={y} r={26} fill={m.accent ?? C.amber} opacity={0.18} />}
          </g>
        );
      })}
    </svg>
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
  label?: string;
  durationInFrames?: number;
}> = ({
  text,
  startFrac,
  endFrac,
  source = "Sử ký Tư Mã Thiên",
  size = 54,
  maxWidth = 1480,
  accent = C.amber,
  label = "TRÍCH NGUYÊN VĂN",
  durationInFrames,
}) => {
  const { frame, dur } = useFrac(durationInFrames);
  const chars = [...text];
  const s0 = startFrac * dur;
  const s1 = (endFrac ?? startFrac + 0.45) * dur;
  const prog = Math.max(0, Math.min(1, (frame - s0) / Math.max(1, s1 - s0)));
  const n = Math.floor(prog * chars.length);
  return (
    <LegendFrame label={label} color={accent}>
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
// Glyphs — mũi tên mực (tấn công / di dân), khiên (lá chắn), trống đồng mini
// ---------------------------------------------------------------------------
/** Mũi tên mực nghiêng `rot` độ — vẽ theo stroke progress 0..1. */
export const InkArrow: React.FC<{
  x: number;
  y: number;
  dx: number;
  dy: number;
  progress: number;
  color?: string;
  strokeWidth?: number;
}> = ({ x, y, dx, dy, progress, color = C.warn, strokeWidth = 7 }) => {
  const t = Math.max(0, Math.min(1, progress));
  const ex = x + dx * t;
  const ey = y + dy * t;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <g opacity={t > 0.02 ? 1 : 0}>
      <line x1={x} y1={y} x2={ex} y2={ey} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <g transform={`translate(${ex} ${ey}) rotate(${ang})`}>
        <path d="M 0 0 L -26 -14 L -20 0 L -26 14 Z" fill={color} opacity={Math.min(1, t * 2)} />
      </g>
    </g>
  );
};

/** Khiên 3 lá chắn motif (đất · tiếng nói · không im lặng). */
export const ShieldGlyph: React.FC<{
  x: number;
  y: number;
  scale?: number;
  lit: number;
  color?: string;
  label?: string;
}> = ({ x, y, scale = 1, lit, color = C.teal, label }) => {
  const t = Math.max(0, Math.min(1, lit));
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M -70 -60 L 70 -60 L 70 20 Q 70 70 0 100 Q -70 70 -70 20 Z"
        fill={t > 0.05 ? "rgba(36,31,26,0.9)" : "rgba(24,20,16,0.6)"}
        stroke={t > 0.05 ? color : C.border}
        strokeWidth={5}
        opacity={0.5 + 0.5 * t}
      />
      {t > 0.3 && (
        <path
          d="M -70 -60 L 70 -60 L 70 20 Q 70 70 0 100 Q -70 70 -70 20 Z"
          fill={color}
          opacity={0.12 * t}
        />
      )}
      {label && (
        <text
          x={0}
          y={30}
          textAnchor="middle"
          fill={t > 0.05 ? color : C.mute}
          fontFamily='"Be Vietnam Pro", sans-serif'
          fontWeight={700}
          fontSize={40}
        >
          {label}
        </text>
      )}
    </g>
  );
};

/** Trống đồng mini (reuse motif series): mặt trời giữa mặt trống. */
export const DrumGlyph: React.FC<{
  x: number;
  y: number;
  scale?: number;
  progress: number;
}> = ({ x, y, scale = 1, progress }) => {
  const t = Math.max(0, Math.min(1, progress));
  const rays = 8;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={0.3 + 0.7 * t}>
      <circle cx={0} cy={0} r={78} fill="rgba(36,31,26,0.92)" stroke={C.bronze} strokeWidth={5} />
      <circle cx={0} cy={0} r={54} fill="none" stroke={C.bronze} strokeWidth={3} opacity={0.7} />
      {Array.from({ length: rays }).map((_, i) => {
        const a = (i / rays) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={Math.cos(a) * 18}
            y1={Math.sin(a) * 18}
            x2={Math.cos(a) * 46 * t}
            y2={Math.sin(a) * 46 * t}
            stroke={C.amber}
            strokeWidth={6}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={0} cy={0} r={16 * t} fill={C.amber} />
    </g>
  );
};
