// VN-Myth S2E04 "Liễu Hạnh" — shared base: paper backgrounds, fonts, speech-lock
// anchor hook, animation helpers, captions (from real word timestamps), image
// panel with missing-asset ink placeholder, quote slate, safe margins.
// Speech-lock: `useA()` returns A(word, occ) -> FRACTION of the scene at which
// that word is spoken in this scene's section — feed the result into startFrac.
import React, { createContext, useContext } from "react";
import {
  AbsoluteFill,
  Img,
  getStaticFiles,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadBeVietnam } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import captionsJson from "../../public/lieu-hanh/captions.json";
import { C, FONT, FPS, at, ease } from "./theme";

// scene groups import these helpers from "./common" — re-export for them
export { at, ease };
import { wordStart } from "./anchors";

// ---------------------------------------------------------------------------
// Fonts (loaded at module import; Remotion holds the render until ready)
// Same proven Vietnamese-diacritic stack as S2E01–03.
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
// Paper background (variants: myth / teal / dossier / night)
// ---------------------------------------------------------------------------
export const Paper: React.FC<{
  variant?: "myth" | "teal" | "dossier" | "night";
  children?: React.ReactNode;
}> = ({ variant = "myth", children }) => {
  useFonts();
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`grain-${Math.floor(frame / 3)}`) * 10000);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      {variant === "teal" && (
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(to top, rgba(62,124,123,0.30) 0%, rgba(26,23,20,0) 55%), radial-gradient(ellipse at 50% 30%, rgba(127,209,200,0.06) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
      )}
      {variant === "dossier" && (
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
              "radial-gradient(ellipse at 50% 62%, rgba(166,58,43,0.06) 0%, rgba(0,0,0,0) 60%)",
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

// ---------------------------------------------------------------------------
// Tags / labels
// ---------------------------------------------------------------------------
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

/** Framed slate — mandatory frame for primary-source quotes. */
export const SlateFrame: React.FC<{
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

/** Layer badge — teal (đền thờ / thực hành) or amber (bản kể) marker. */
export const LayerBadge: React.FC<{ text: string; color?: string }> = ({ text, color = C.amber }) => {
  const { p } = useFrac();
  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        left: 64,
        padding: "8px 22px",
        border: `2px solid ${color}`,
        borderRadius: 6,
        color,
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

// ---------------------------------------------------------------------------
// Captions — from public/lieu-hanh/captions.json (real word timestamps).
// Two-line wrap ~46 chars/line; cream text on dark scrim >= 0.72 alpha;
// body >= 34px; cue visible only inside its speech window, 0.3s fades.
// ---------------------------------------------------------------------------
type CaptionCue = { start: number; end: number; text: string };
type CaptionScene = { window: [number, number]; cues: CaptionCue[] };
const CAPTIONS = captionsJson as unknown as Record<string, CaptionScene>;

const CHARS_PER_LINE = 46;

/** Wrap `text` into lines of <= ~46 chars at word boundaries. */
export const wrapLines = (text: string, max = CHARS_PER_LINE): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > max) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
};

export const Caption: React.FC<{
  sceneId: string;
  /** global frame at which this scene's Sequence begins */
  startFrame: number;
  /** extra bottom offset (px) when scene art occupies the low band */
  bottom?: number;
}> = ({ sceneId, startFrame, bottom = 64 }) => {
  const frame = useCurrentFrame();
  const scene = CAPTIONS[sceneId];
  if (!scene) return null;
  const gSec = (startFrame + frame) / FPS;
  const cue = scene.cues.find((q) => gSec >= q.start - 0.01 && gSec < q.end);
  if (!cue) return null;
  const fadeIn = Math.min(1, (gSec - cue.start) / 0.3);
  const fadeOut = Math.min(1, (cue.end - gSec) / 0.3);
  const op = Math.max(0, Math.min(fadeIn, fadeOut));
  const lines = wrapLines(cue.text);
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: op,
      }}
    >
      <div
        style={{
          background: "rgba(14,12,9,0.78)",
          borderRadius: 10,
          padding: "18px 34px",
          maxWidth: 1560,
          textAlign: "center",
        }}
      >
        {lines.map((ln, i) => (
          <div
            key={i}
            style={{
              fontFamily: FONT.body,
              fontWeight: 500,
              fontSize: 36,
              lineHeight: 1.4,
              color: C.cream,
              textShadow: "0 2px 10px rgba(0,0,0,0.85)",
            }}
          >
            {ln}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Image assets — public/lieu-hanh/images/img-###.png (lead generates them).
// Missing image => elegant ink placeholder so builds work before the batch.
// ---------------------------------------------------------------------------
export const imgUrl = (id: string): string => staticFile(`lieu-hanh/images/${id}.png`);

export const hasImage = (id: string): boolean => {
  // Remotion API: getStaticFiles() returns StaticFile[] directly (no .publicFiles).
  const name = `lieu-hanh/images/${id}.png`;
  return getStaticFiles().some((f) => f.name === name);
};

export const InkPlaceholder: React.FC<{
  note?: string;
  style?: StyleProp;
}> = ({ note, style }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 22,
      background:
        "linear-gradient(160deg, rgba(36,31,26,0.9) 0%, rgba(26,23,20,0.94) 60%, rgba(62,124,123,0.10) 100%)",
      border: "2px dashed rgba(138,127,110,0.55)",
      borderRadius: 12,
      ...style,
    }}
  >
    <svg width={220} height={120} viewBox="0 0 220 120">
      <path
        d="M 12 96 C 48 60, 66 84, 96 44 S 152 24, 208 60"
        fill="none"
        stroke={C.mute}
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.8}
      />
      <circle cx={96} cy={44} r={9} fill={C.amber} opacity={0.65} />
      <path d="M 12 106 L 208 106" stroke={C.mute} strokeWidth={3} opacity={0.5} />
    </svg>
    <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.cream, letterSpacing: 2 }}>
      {note ?? "ảnh chưa sinh"}
    </div>
    <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.mute }}>
      mực tàu · giấy dó — khung chờ ảnh
    </div>
  </div>
);

/**
 * InkPanel — image plate with 1.2s fade + slide (36f @30fps), gentle drift.
 * mode "full" = full-bleed cover; "card" = framed panel (w/h px, centered offset).
 */
export const InkPanel: React.FC<{
  img: string;
  mode?: "full" | "card";
  w?: number;
  h?: number;
  x?: number;
  y?: number;
  focus?: { x: number; y: number };
  durationInFrames?: number;
  children?: React.ReactNode;
}> = ({
  img,
  mode = "full",
  w = 760,
  h = 980,
  x = 1020,
  y = 50,
  focus = { x: 0.5, y: 0.5 },
  durationInFrames,
  children,
}) => {
  const { frame, dur, p } = useFrac(durationInFrames);
  const t = Math.max(0, Math.min(1, frame / Math.max(1, dur - 1)));
  const s = t * t * (3 - 2 * t);
  const fadeIn = ease(p(0, 0.6));
  const slide = (1 - fadeIn) * 56;
  // caption band occupies roughly y>=810 (2-3 line cues, bottom:64).
  // Clamp every card's bottom edge above it so captions never cover art.
  const cardH = Math.max(320, Math.min(h, 800 - y));
  const exists = hasImage(img);
  const imgEl = (
    <Img
      src={imgUrl(img)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center 38%",
        opacity: 0.97,
      }}
    />
  );
  if (mode === "full") {
    return (
      <Paper>
        <AbsoluteFill
          style={{
            opacity: fadeIn,
            transform: `translateY(${slide}px) scale(${1.06 + 0.05 * s})`,
            transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
            WebkitMaskImage:
              "radial-gradient(ellipse 52% 50% at center, #000000 72%, rgba(0,0,0,0) 98%)",
            maskImage:
              "radial-gradient(ellipse 52% 50% at center, #000000 72%, rgba(0,0,0,0) 98%)",
          }}
        >
          {exists ? imgEl : <InkPlaceholder note={`${img}.png`} />}
        </AbsoluteFill>
        {children}
      </Paper>
    );
  }
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: cardH,
          opacity: fadeIn,
          transform: `translateY(${slide}px)`,
          borderRadius: 10,
          overflow: "hidden",
          border: `2px solid ${C.border}`,
          boxShadow: "0 18px 60px rgba(0,0,0,0.6)",
        }}
      >
        {exists ? imgEl : <InkPlaceholder note={`${img}.png`} />}
      </div>
      {children}
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// QuoteSlate — quote card «...» verbatim + source label small mono.
// ---------------------------------------------------------------------------
export const QuoteSlate: React.FC<{
  text: string;
  startFrac: number;
  endFrac?: number;
  source?: string;
  label?: string;
  size?: number;
  maxWidth?: number;
  accent?: string;
  durationInFrames?: number;
}> = ({
  text,
  startFrac,
  endFrac,
  source,
  label = "TRÍCH NGUYÊN VĂN",
  size = 54,
  maxWidth = 1480,
  accent = C.amber,
  durationInFrames,
}) => {
  const { frame, dur } = useFrac(durationInFrames);
  const chars = [...`«${text}»`];
  const s0 = startFrac * dur;
  const s1 = (endFrac ?? startFrac + 0.45) * dur;
  const prog = Math.max(0, Math.min(1, (frame - s0) / Math.max(1, s1 - s0)));
  const n = Math.floor(prog * chars.length);
  return (
    <SlateFrame label={label} color={accent}>
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
      {source && (
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
      )}
    </SlateFrame>
  );
};

// ---------------------------------------------------------------------------
// HUD safe margins (draft review overlay guide)
// ---------------------------------------------------------------------------
export const SafeMargins: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.35 }}>
    <div
      style={{
        position: "absolute",
        inset: "48px 64px",
        border: `2px dashed ${C.tealLight}`,
        borderRadius: 8,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 2,
        height: 24,
        background: C.tealLight,
        transform: "translate(-50%,-50%)",
      }}
    />
  </AbsoluteFill>
);
