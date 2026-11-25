// Shared News Foundation SceneShell — Hybrid Broadcast Photojournalism × Swiss Edge-to-Edge Split + Safe Zone v3.2
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS, FPS, HEIGHT, SAFE, ensureFonts, waitForFonts } from "./theme";

export interface BackplateConfig {
  src: string;
  opacity?: number;
  objectPosition?: string;
  zoomFrom?: number;
  zoomTo?: number;
  panX?: number;
  brightness?: number;
  contrast?: number;
  creditLine?: string;
  mode?: "full-bleed" | "top-split" | "ambient";
  fullBleed?: boolean;
  splitHeight?: number;
}

export interface MediaBackdropConfig {
  src: string;
  opacity?: number;
  top?: number;
  height?: number;
  playbackRate?: number;
}

export interface SceneShellProps {
  sceneId: string;
  label: string;
  kicker?: string;
  accent?: "crimson" | "amber";
  layoutMode?: "full-bleed" | "swiss-split";
  backplate?: BackplateConfig;
  mediaBackdrop?: MediaBackdropConfig;
  photoCredit?: string;
  children?: React.ReactNode;
  showHud?: boolean;
  hudText?: string;
  captions?: { text: string; start: number; end: number }[];
}

const GRAIN_TEXTURES = [
  "textures/film_grain_1.png",
  "textures/film_grain_2.png",
  "textures/film_grain_3.png",
] as const;

export const SceneShell: React.FC<SceneShellProps> = ({
  sceneId,
  label,
  kicker,
  accent = "crimson",
  layoutMode = "swiss-split",
  backplate,
  mediaBackdrop,
  photoCredit,
  children,
  showHud,
  hudText,
  captions,
}) => {
  ensureFonts();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const accentColor = accent === "amber" ? COLORS.ochre : COLORS.vermilion;
  const isFullBleed =
    layoutMode === "full-bleed" ||
    backplate?.fullBleed === true ||
    backplate?.mode === "full-bleed";

  const bpScale = backplate
    ? interpolate(
        frame,
        [0, Math.max(1, durationInFrames)],
        [backplate.zoomFrom ?? 1.0, backplate.zoomTo ?? 1.08],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 1.0;

  const bpPanX = backplate?.panX
    ? interpolate(
        frame,
        [0, Math.max(1, durationInFrames)],
        [0, backplate.panX],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 0;

  // 12fps real 35mm film grain cycle (30fps / 2.5 ≈ 12fps)
  const grainIdx = Math.floor(frame / 2.5) % GRAIN_TEXTURES.length;
  const grainSrc = GRAIN_TEXTURES[grainIdx];

  const resolvedBackplateMode = isFullBleed
    ? "full-bleed"
    : backplate?.mode ?? (backplate?.splitHeight ? "top-split" : "ambient");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: isFullBleed ? COLORS.ink : COLORS.paper,
        fontFamily: FONTS.body,
        color: isFullBleed ? COLORS.textOnDark : COLORS.ink,
      }}
      data-scene-id={sceneId}
      data-scene-label={label}
      data-layout-mode={isFullBleed ? "full-bleed" : "swiss-split"}
    >
      {/* Structural Swiss Split / Broadcast Carbon Backdrop (locked pixel bounds) */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <ArchivalPaperBackdrop
          accentColor={accentColor}
          layoutMode={isFullBleed ? "full-bleed" : "swiss-split"}
        />
      </AbsoluteFill>

      {/* Full-bleed motion video backdrop (when provided) */}
      {mediaBackdrop ? (
        <div
          style={{
            position: "absolute",
            top: mediaBackdrop.top ?? 0,
            left: 0,
            width: 1080,
            height: mediaBackdrop.height ?? HEIGHT,
            overflow: "hidden",
            zIndex: 4,
            pointerEvents: "none",
          }}
        >
          <OffthreadVideo
            src={staticFile(mediaBackdrop.src)}
            muted
            playbackRate={mediaBackdrop.playbackRate ?? 1}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: mediaBackdrop.opacity ?? (isFullBleed ? 0.9 : 0.2),
            }}
          />
          <AbsoluteFill
            style={{
              background: isFullBleed
                ? "linear-gradient(180deg, rgba(11,12,14,0.88) 0%, rgba(11,12,14,0.28) 24%, rgba(11,12,14,0.34) 58%, rgba(11,12,14,0.92) 86%, rgba(11,12,14,0.98) 100%)"
                : `linear-gradient(180deg, rgba(245,245,242,0.92) 0%, rgba(245,245,242,0.55) 40%, rgba(245,245,242,0.92) 100%)`,
            }}
          />
        </div>
      ) : null}

      {/* Photojournalism / Satellite Backplate */}
      {backplate ? (
        <div
          style={{
            position: "absolute",
            top: resolvedBackplateMode === "full-bleed" ? 0 : 332,
            left: 0,
            width: 1080,
            height:
              resolvedBackplateMode === "full-bleed"
                ? HEIGHT
                : resolvedBackplateMode === "top-split"
                  ? backplate.splitHeight ?? 480
                  : 1112,
            overflow: "hidden",
            zIndex: 5,
            pointerEvents: "none",
            borderBottom:
              resolvedBackplateMode === "top-split" ? `3px solid ${COLORS.ink}` : undefined,
          }}
        >
          <Img
            src={staticFile(backplate.src)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: backplate.objectPosition ?? "center center",
              opacity:
                backplate.opacity ??
                (resolvedBackplateMode === "full-bleed"
                  ? 0.92
                  : resolvedBackplateMode === "top-split"
                    ? 0.96
                    : 0.14),
              filter: `brightness(${backplate.brightness ?? 1.0}) contrast(${backplate.contrast ?? 1.08}) saturate(${resolvedBackplateMode === "ambient" ? 0.55 : 0.96})`,
              transform: `scale(${bpScale}) translateX(${bpPanX}%)`,
              transformOrigin: "center center",
            }}
          />
          {resolvedBackplateMode === "full-bleed" ? (
            <AbsoluteFill
              style={{
                background:
                  "linear-gradient(180deg, rgba(11,12,14,0.90) 0%, rgba(11,12,14,0.34) 22%, rgba(11,12,14,0.28) 54%, rgba(11,12,14,0.88) 78%, rgba(11,12,14,0.98) 100%)",
              }}
            />
          ) : resolvedBackplateMode === "top-split" ? (
            <AbsoluteFill
              style={{
                background:
                  "linear-gradient(180deg, rgba(11,12,14,0.22) 0%, rgba(11,12,14,0.04) 45%, rgba(11,12,14,0.38) 100%)",
              }}
            />
          ) : (
            <>
              <AbsoluteFill
                style={{
                  background: `linear-gradient(180deg, ${COLORS.paper} 0%, rgba(245, 245, 242, 0.72) 18%, rgba(245, 245, 242, 0.76) 72%, ${COLORS.paper} 100%)`,
                }}
              />
              <AbsoluteFill
                style={{
                  background:
                    "linear-gradient(90deg, rgba(245, 245, 242, 0.88) 0%, rgba(245, 245, 242, 0.58) 55%, rgba(245, 245, 242, 0.78) 100%)",
                }}
              />
            </>
          )}
        </div>
      ) : null}

      {/* Top Broadcast Masthead Kicker (y=250 inside #0B0C0E carbon header band) */}
      {kicker ? (
        <div
          style={{
            position: "absolute",
            top: SAFE.kickerTop,
            left: SAFE.margin,
            maxWidth: SAFE.maxW,
            zIndex: 40,
          }}
        >
          <KickerPill text={kicker} accent={accentColor} />
        </div>
      ) : null}

      {/* Content band y=350..1420 (height 1070px, right rail >=140px) */}
      <div
        style={{
          position: "absolute",
          top: SAFE.cardTop,
          left: SAFE.margin,
          right: SAFE.railRight,
          height: SAFE.cardBottom - SAFE.cardTop,
          zIndex: 20,
        }}
      >
        {children}
      </div>

      {/* Optional photo credit positioned cleanly above bottom cinema band */}
      {photoCredit ?? backplate?.creditLine ? (
        <div
          style={{
            position: "absolute",
            top: 1412,
            left: SAFE.margin,
            maxWidth: SAFE.maxW,
            zIndex: 36,
            pointerEvents: "none",
          }}
        >
          <PhotoCreditBadge credit={(photoCredit ?? backplate?.creditLine)!} />
        </div>
      ) : null}

      <CaptionLayer captions={captions} />

      {/* Real 12fps 35mm film grain overlay across the full composition */}
      <AbsoluteFill
        style={{
          zIndex: 88,
          pointerEvents: "none",
          opacity: isFullBleed ? 0.24 : 0.18,
          mixBlendMode: "overlay",
        }}
      >
        <Img
          src={staticFile(grainSrc)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {showHud === true ? (
        <div style={{ position: "absolute", left: SAFE.margin, bottom: 96, zIndex: 45 }}>
          <Hud text={hudText ?? sceneId} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const ArchivalPaperBackdrop: React.FC<{
  accentColor?: string;
  layoutMode?: "full-bleed" | "swiss-split";
}> = ({ accentColor = COLORS.vermilion, layoutMode = "swiss-split" }) => {
  if (layoutMode === "full-bleed") {
    return (
      <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(120% 90% at 50% 35%, #161A23 0%, #0B0C0E 78%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 244,
            left: 0,
            width: 8,
            height: 68,
            backgroundColor: accentColor,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 326,
            left: SAFE.margin,
            right: SAFE.railRight,
            height: 2,
            backgroundColor: COLORS.lineOnDark,
          }}
        />
        <svg
          aria-hidden="true"
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, opacity: 0.02, pointerEvents: "none" }}
        >
          <filter id="archival-paper-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#archival-paper-grain)" />
        </svg>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {/* Middle Swiss Gallery Stage (y=332..1444) */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #F8F8F6 0%, #F5F5F2 58%, #EEEEEA 100%)",
        }}
      />

      {/* Top Edge-to-Edge Broadcast Carbon Masthead Block (y=0..332) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1080,
          height: 332,
          background:
            "linear-gradient(180deg, #0B0C0E 0%, #12151C 100%)",
        }}
      >
        {/* Left flush edge signal bar */}
        <div
          style={{
            position: "absolute",
            top: 248,
            left: 0,
            width: 10,
            height: 54,
            backgroundColor: accentColor,
          }}
        />
        {/* Crisp top masthead rule */}
        <div
          style={{
            position: "absolute",
            top: 224,
            left: SAFE.margin,
            right: SAFE.railRight,
            height: 1,
            backgroundColor: COLORS.lineOnDark,
          }}
        />
        {/* Bottom masthead divider rule separating dark broadcast header from light Swiss stage */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: accentColor,
          }}
        />
      </div>

      {/* Bottom Edge-to-Edge Cinema Lower-Third Band (y=1444..1920) */}
      <div
        style={{
          position: "absolute",
          top: 1444,
          left: 0,
          width: 1080,
          height: 476,
          background:
            "linear-gradient(180deg, #0E1014 0%, #0B0C0E 35%, #07080A 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: accentColor,
          }}
        />
      </div>

      {/* Deterministic subtle turbulence filter node preserved for editorial QC marker compatibility */}
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.02, pointerEvents: "none" }}
      >
        <filter id="archival-paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#archival-paper-grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const BackdropGrid = ArchivalPaperBackdrop;

const CAPTION_HIGHLIGHT_RE =
  /(\b\d+(?:[.,]\d+)?(?:\s*(?:%|mm|km|m|hải lý|đoạn|bài|tiếng|bậc|tỷ|triệu|người|USD))?(?=\s|$|[.,!?:;–—-]))/gi;

function renderKineticCaptionText(text: string): React.ReactNode {
  const parts = text.split(CAPTION_HIGHLIGHT_RE);
  if (parts.length <= 1) return text;
  return parts.map((part, idx) => {
    if (!part) return null;
    if (/^\d/.test(part.trim())) {
      return (
        <span key={idx} style={{ color: COLORS.highlighter }}>
          {part}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const CaptionLayer: React.FC<{
  captions?: { text: string; start: number; end: number }[];
}> = ({ captions }) => {
  const frame = useCurrentFrame();
  const currentSeconds = frame / FPS;
  const active = (captions ?? []).find(
    (c) =>
      typeof c?.text === "string" &&
      c.text.trim().length > 0 &&
      currentSeconds >= c.start &&
      currentSeconds < c.end,
  );
  if (!active) return null;
  const fontSize = active.text.length > 44 ? 42 : 45;
  return (
    <div
      style={{
        position: "absolute",
        top: SAFE.subTop,
        left: 60,
        width: 880,
        height: SAFE.subBottom - SAFE.subTop,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 35,
      }}
    >
      <div
        style={{
          maxWidth: 880,
          padding: "4px 16px",
          color: "#FFFFFF",
          fontFamily: FONTS.body,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.24,
          textAlign: "center",
          letterSpacing: -0.2,
          textShadow: "0 2px 16px rgba(0, 0, 0, 0.88)",
        }}
      >
        {renderKineticCaptionText(active.text)}
      </div>
    </div>
  );
};

export const Hud: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      fontFamily: FONTS.display,
      fontSize: 24,
      fontWeight: 800,
      color: COLORS.highlighter,
      letterSpacing: 1.2,
      backgroundColor: "rgba(11, 12, 14, 0.92)",
      borderLeft: `4px solid ${COLORS.vermilion}`,
      padding: "6px 14px",
      whiteSpace: "pre",
    }}
  >
    {text}
  </div>
);

export const KickerPill: React.FC<{ text: string; accent?: string }> = ({
  text,
  accent = COLORS.vermilion,
}) => {
  const segments = text
    .split(/\s*[·•]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lead = segments[0] ?? text;
  const rest = segments.slice(1);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 14,
        maxWidth: SAFE.maxW,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "6px 16px",
          backgroundColor: accent,
          color: "#FFFFFF",
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 28,
          letterSpacing: 1.2,
          lineHeight: 1.05,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {lead}
      </span>
      {rest.length > 0 ? (
        <span
          style={{
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: 29,
            letterSpacing: 0.9,
            lineHeight: 1.1,
            color: COLORS.textOnDark,
            textTransform: "uppercase",
          }}
        >
          {rest.map((seg, i) => (
            <React.Fragment key={`${seg}-${i}`}>
              {i > 0 ? (
                <span style={{ color: COLORS.highlighter, margin: "0 10px" }}>/</span>
              ) : null}
              <span>{seg}</span>
            </React.Fragment>
          ))}
        </span>
      ) : null}
    </div>
  );
};

export const SourceBadge: React.FC<{ source: string; onDark?: boolean }> = ({
  source,
  onDark = false,
}) => {
  const cleanSource = source.replace(/\s*[·•]\s*/g, " / ");
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        paddingLeft: 12,
        borderLeft: `4px solid ${COLORS.vermilion}`,
        color: onDark ? COLORS.mutedOnDark : COLORS.muted,
        fontFamily: FONTS.display,
        fontWeight: 700,
        fontSize: 25,
        letterSpacing: 0.7,
        textTransform: "uppercase",
        lineHeight: 1.15,
      }}
    >
      NGUỒN: {cleanSource}
    </div>
  );
};

export const AiBadge: React.FC<{ concept?: string }> = ({ concept }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 14px",
      backgroundColor: COLORS.ink,
      borderLeft: `5px solid ${COLORS.ochre}`,
      color: "#FFFFFF",
      fontFamily: FONTS.display,
      fontWeight: 800,
      fontSize: 24,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    }}
  >
    {concept ? `MINH HỌA AI / ${concept}` : "MINH HỌA AI"}
  </div>
);

export const SimulationBadge: React.FC<{ label?: string }> = ({ label = "MÔ PHỎNG 3D" }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 14px",
      backgroundColor: COLORS.cold,
      color: "#FFFFFF",
      fontFamily: FONTS.display,
      fontWeight: 800,
      fontSize: 24,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    }}
  >
    {label}
  </div>
);

export const ArchiveLabelBadge: React.FC<{ label?: string; archiveLabel?: string }> = ({
  label,
  archiveLabel,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 14px",
      backgroundColor: COLORS.vermilion,
      color: "#FFFFFF",
      fontFamily: FONTS.display,
      fontWeight: 900,
      fontSize: 24,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    }}
  >
    {archiveLabel ?? label ?? ""}
  </div>
);

export const PhotoCreditBadge: React.FC<{ credit: string }> = ({ credit }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 12px",
      backgroundColor: "rgba(11, 12, 14, 0.88)",
      borderLeft: `4px solid ${COLORS.highlighter}`,
      color: COLORS.textOnDark,
      fontFamily: FONTS.body,
      fontWeight: 600,
      fontSize: 24,
      letterSpacing: 0.2,
    }}
  >
    {credit}
  </div>
);

export const VerdictStamp: React.FC<{ text: string; enterFrame: number; color?: string }> = ({
  text,
  enterFrame,
  color = COLORS.vermilion,
}) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [enterFrame, enterFrame + 14], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < enterFrame) return null;
  const cleanText = text.replace(/\s*[·•]\s*/g, " / ");
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        padding: "10px 22px",
        backgroundColor: color,
        borderLeft: `8px solid ${COLORS.highlighter}`,
        fontFamily: FONTS.display,
        fontWeight: 900,
        fontSize: 30,
        letterSpacing: 1.1,
        textTransform: "uppercase",
        color: "#FFFFFF",
        clipPath: `inset(0 ${100 - w}% 0 0)`,
      }}
    >
      {cleanText}
    </div>
  );
};

export const HeroTitle: React.FC<{
  text: string;
  highlight?: string;
  sub?: string;
  color?: string;
  highlightColor?: string;
  align?: "left" | "center";
  subColor?: string;
}> = ({
  text,
  highlight,
  sub,
  color,
  highlightColor = COLORS.highlighter,
  align = "left",
  subColor,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(SAFE.titleMaxFont);
  const width = SAFE.titleMaxWidth;

  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    if (!wrap || !el) return;

    const measureAndFit = (): number => {
      const lineHeight = 1.06;
      let size: number = SAFE.titleMaxFont;
      el.style.fontSize = `${size}px`;
      let guard = 0;
      while (guard < 60) {
        guard += 1;
        const lineBox = size * lineHeight;
        const lines = Math.max(1, Math.round(el.offsetHeight / lineBox));
        const overflowX = el.scrollWidth > el.clientWidth + 1;
        if (lines <= 2 && !overflowX) break;
        if (size <= SAFE.titleMinFont) {
          size = SAFE.titleMinFont;
          break;
        }
        size = Math.max(SAFE.titleMinFont, size - 2);
        el.style.fontSize = `${size}px`;
      }
      return size;
    };

    // Initial fast fit + font-ready re-measure guarded by delayRender so Barlow Condensed metrics win
    setFontSize(measureAndFit());
    let cancelled = false;
    const handle = typeof window !== "undefined" ? delayRender("HeroTitle font-fit") : null;
    waitForFonts()
      .then(() => {
        if (!cancelled) {
          setFontSize(measureAndFit());
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (handle !== null) {
          continueRender(handle);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [text, width]);

  const isYellowBlock =
    highlightColor.toUpperCase() === COLORS.highlighter.toUpperCase() ||
    highlightColor.toUpperCase() === COLORS.neonYellow.toUpperCase() ||
    highlightColor.toUpperCase() === "#F3D34A" ||
    highlightColor.toUpperCase() === "#F7C204" ||
    highlightColor.toUpperCase() === "#FFBE0B";

  const isRedBlock =
    highlightColor.toUpperCase() === COLORS.vermilion.toUpperCase() ||
    highlightColor.toUpperCase() === "#C8281E";

  const renderHighlighted = () => {
    if (!highlight || !text.includes(highlight)) return text;
    const idx = text.indexOf(highlight);
    return (
      <>
        {text.slice(0, idx)}
        <span
          style={
            isYellowBlock
              ? {
                  backgroundColor: COLORS.highlighter,
                  color: COLORS.ink,
                  padding: "0 14px",
                  boxDecorationBreak: "clone",
                }
              : isRedBlock
                ? {
                    backgroundColor: COLORS.vermilion,
                    color: "#FFFFFF",
                    padding: "0 14px",
                    boxDecorationBreak: "clone",
                  }
                : { color: highlightColor }
          }
        >
          {highlight}
        </span>
        {text.slice(idx + highlight.length)}
      </>
    );
  };

  return (
    <div
      ref={wrapRef}
      style={{ width, maxWidth: "100%", display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div
        ref={textRef}
        style={{
          width: "100%",
          fontFamily: FONTS.display,
          fontSize,
          lineHeight: 1.06,
          fontWeight: 900,
          color: color ?? COLORS.ink,
          textAlign: align,
          textTransform: "uppercase",
          letterSpacing: -0.4,
          overflowWrap: "break-word",
        }}
      >
        {renderHighlighted()}
      </div>
      {sub ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: align === "center" ? "center" : "flex-start",
            gap: 10,
            fontFamily: FONTS.body,
            fontSize: 25,
            fontWeight: 700,
            color: subColor ?? COLORS.muted,
            textAlign: align,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 18,
              height: 4,
              backgroundColor: COLORS.vermilion,
              flexShrink: 0,
            }}
          />
          <span>{sub.replace(/\s*[·•]\s*/g, " / ")}</span>
        </div>
      ) : null}
    </div>
  );
};

export const CountUp: React.FC<{
  to: number;
  startFrame: number;
  durationFrames?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  localeFormat?: boolean;
}> = ({
  to,
  startFrame,
  durationFrames = 30,
  decimals = 0,
  prefix = "",
  suffix = "",
  localeFormat = true,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - p, 3);
  const val = to * eased;
  const txt =
    decimals > 0
      ? val.toFixed(decimals).replace(".", ",")
      : Math.round(val).toLocaleString("vi-VN");
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {localeFormat ? txt : String(Math.round(val))}
      {suffix}
    </span>
  );
};

export const HighlightBar: React.FC<{
  text: string;
  enterFrame: number;
  color?: string;
  width?: number;
}> = ({ text, enterFrame, color = COLORS.highlighter, width }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [enterFrame, enterFrame + 14], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < enterFrame) return null;
  const cleanText = text.replace(/\s*[·•]\s*/g, " / ");
  const isCrimson =
    color.toUpperCase() === COLORS.vermilion.toUpperCase() ||
    color.toUpperCase() === "#C8281E";
  return (
    <div style={{ position: "relative", width: width ?? "fit-content", maxWidth: "100%" }}>
      <div
        style={{
          position: "relative",
          backgroundColor: isCrimson ? COLORS.vermilion : COLORS.ink,
          borderLeft: `8px solid ${isCrimson ? COLORS.highlighter : color}`,
          clipPath: `inset(0 ${100 - w}% 0 0)`,
          padding: "11px 18px",
        }}
      >
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 27,
            fontWeight: 800,
            letterSpacing: 0.2,
            color: "#FFFFFF",
            lineHeight: 1.25,
          }}
        >
          {cleanText}
        </div>
      </div>
    </div>
  );
};

export const CtaBand: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "18px 28px",
          backgroundColor: COLORS.vermilion,
          borderLeft: `10px solid ${COLORS.highlighter}`,
          color: "#FFFFFF",
          fontFamily: FONTS.display,
          fontSize: 36,
          fontWeight: 900,
          textAlign: "center",
          letterSpacing: 1.0,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          boxSizing: "border-box",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export { HEIGHT };
