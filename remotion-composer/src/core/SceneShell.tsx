// Shared Themeable Core SceneShell — adapts colors, fonts, safe zones, and backdrop style from ChannelTheme.
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
import { BASE_PRESETS, useChannelTheme } from "./theme";

export const HEIGHT = BASE_PRESETS["swiss-broadcast"].canvas.height;

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
  const theme = useChannelTheme();
  const { colors, fonts, safe, backdrop } = theme;
  theme.ensureFonts();

  const frame = useCurrentFrame();
  const { durationInFrames, width: canvasWidth, height: canvasHeight } = useVideoConfig();
  const accentColor = accent === "amber" ? colors.ochre : colors.vermilion;
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
  const grainTextures = backdrop.grainTextures;
  const grainIdx = grainTextures.length > 0 ? Math.floor(frame / 2.5) % grainTextures.length : 0;
  const grainSrc = grainTextures[grainIdx];

  const resolvedBackplateMode = isFullBleed
    ? "full-bleed"
    : backplate?.mode ?? (backplate?.splitHeight ? "top-split" : "ambient");

  const mastheadTop = backdrop.style === "swiss-broadcast" ? backdrop.mastheadHeight : 0;
  const stageHeight =
    backdrop.style === "swiss-broadcast"
      ? Math.max(1, backdrop.lowerThirdTop - backdrop.mastheadHeight)
      : canvasHeight;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: isFullBleed ? colors.ink : colors.paper,
        fontFamily: fonts.body,
        color: isFullBleed ? colors.textOnDark : colors.ink,
      }}
      data-scene-id={sceneId}
      data-scene-label={label}
      data-layout-mode={isFullBleed ? "full-bleed" : "swiss-split"}
    >
      {/* Structural Backdrop */}
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
            width: canvasWidth,
            height: mediaBackdrop.height ?? canvasHeight,
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
            top: resolvedBackplateMode === "full-bleed" ? 0 : mastheadTop,
            left: 0,
            width: canvasWidth,
            height:
              resolvedBackplateMode === "full-bleed"
                ? canvasHeight
                : resolvedBackplateMode === "top-split"
                  ? backplate.splitHeight ?? 480
                  : stageHeight,
            overflow: "hidden",
            zIndex: 5,
            pointerEvents: "none",
            borderBottom:
              resolvedBackplateMode === "top-split" ? `3px solid ${colors.ink}` : undefined,
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
                  background: `linear-gradient(180deg, ${colors.paper} 0%, rgba(245, 245, 242, 0.72) 18%, rgba(245, 245, 242, 0.76) 72%, ${colors.paper} 100%)`,
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

      {/* Top Masthead Kicker */}
      {kicker ? (
        <div
          style={{
            position: "absolute",
            top: safe.kickerTop,
            left: safe.margin,
            maxWidth: safe.maxW,
            zIndex: 40,
          }}
        >
          <KickerPill text={kicker} accent={accentColor} />
        </div>
      ) : null}

      {/* Safe Content Band */}
      <div
        style={{
          position: "absolute",
          top: safe.cardTop,
          left: safe.margin,
          right: safe.railRight,
          height: safe.cardBottom - safe.cardTop,
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
            top: safe.cardBottom - 8,
            left: safe.margin,
            maxWidth: safe.maxW,
            zIndex: 36,
            pointerEvents: "none",
          }}
        >
          <PhotoCreditBadge credit={(photoCredit ?? backplate?.creditLine)!} />
        </div>
      ) : null}

      <CaptionLayer captions={captions} />

      {/* Real 12fps 35mm film grain overlay across the full composition */}
      {grainSrc ? (
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
      ) : null}

      {showHud === true ? (
        <div style={{ position: "absolute", left: safe.margin, bottom: 96, zIndex: 45 }}>
          <Hud text={hudText ?? sceneId} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const ArchivalPaperBackdrop: React.FC<{
  accentColor?: string;
  layoutMode?: "full-bleed" | "swiss-split";
}> = ({ accentColor, layoutMode = "swiss-split" }) => {
  const theme = useChannelTheme();
  const { colors, safe, backdrop } = theme;
  const { width: canvasWidth, height: canvasHeight } = useVideoConfig();
  const resolvedAccent = accentColor ?? colors.vermilion;

  if (backdrop.style === "archival-diorama") {
    return (
      <AbsoluteFill style={{ backgroundColor: layoutMode === "full-bleed" ? colors.panelDeep : colors.ink }}>
        <AbsoluteFill
          style={{
            background:
              layoutMode === "full-bleed"
                ? `radial-gradient(120% 90% at 50% 40%, ${colors.ink} 0%, ${colors.panelDeep} 80%)`
                : `linear-gradient(180deg, ${colors.ink} 0%, ${colors.panelDeep} 100%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: safe.kickerTop - 8,
            left: safe.margin,
            right: safe.railRight,
            height: 2,
            backgroundColor: resolvedAccent,
            opacity: 0.7,
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

  if (backdrop.style === "clean-minimal") {
    return (
      <AbsoluteFill style={{ backgroundColor: layoutMode === "full-bleed" ? colors.ink : colors.paper }}>
        <svg
          aria-hidden="true"
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, opacity: 0.015, pointerEvents: "none" }}
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

  if (layoutMode === "full-bleed") {
    return (
      <AbsoluteFill style={{ backgroundColor: colors.ink }}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(120% 90% at 50% 35%, ${colors.inkSoft} 0%, ${colors.ink} 78%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 244,
            left: 0,
            width: 8,
            height: 68,
            backgroundColor: resolvedAccent,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 326,
            left: safe.margin,
            right: safe.railRight,
            height: 2,
            backgroundColor: colors.lineOnDark,
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

  const mastheadH = backdrop.mastheadHeight || 332;
  const lowerTop = backdrop.lowerThirdTop || 1444;
  const lowerH = Math.max(0, canvasHeight - lowerTop);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      {/* Middle Swiss Gallery Stage */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${colors.paper} 0%, ${colors.paper} 58%, ${colors.paperWarm} 100%)`,
        }}
      />

      {/* Top Edge-to-Edge Broadcast Masthead Block */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: canvasWidth,
          height: mastheadH,
          background: `linear-gradient(180deg, ${colors.ink} 0%, ${colors.inkSoft} 100%)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 248,
            left: 0,
            width: 10,
            height: 54,
            backgroundColor: resolvedAccent,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 224,
            left: safe.margin,
            right: safe.railRight,
            height: 1,
            backgroundColor: colors.lineOnDark,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: resolvedAccent,
          }}
        />
      </div>

      {/* Bottom Edge-to-Edge Cinema Lower-Third Band */}
      <div
        style={{
          position: "absolute",
          top: lowerTop,
          left: 0,
          width: canvasWidth,
          height: lowerH,
          background: `linear-gradient(180deg, ${colors.inkSoft} 0%, ${colors.ink} 35%, ${colors.ink} 100%)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: resolvedAccent,
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

function renderKineticCaptionText(text: string, highlightColor: string): React.ReactNode {
  const parts = text.split(CAPTION_HIGHLIGHT_RE);
  if (parts.length <= 1) return text;
  return parts.map((part, idx) => {
    if (!part) return null;
    if (/^\d/.test(part.trim())) {
      return (
        <span key={idx} style={{ color: highlightColor }}>
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
  const theme = useChannelTheme();
  const { safe, colors, fonts, canvas } = theme;
  const currentSeconds = frame / canvas.fps;
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
        top: safe.subTop,
        left: safe.subLeft,
        width: safe.subWidth,
        height: safe.subBottom - safe.subTop,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 35,
      }}
    >
      <div
        style={{
          maxWidth: safe.subWidth,
          padding: "4px 16px",
          color: colors.captionText || "#FFFFFF",
          fontFamily: fonts.body,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.24,
          textAlign: "center",
          letterSpacing: -0.2,
          textShadow: "0 2px 16px rgba(0, 0, 0, 0.88)",
        }}
      >
        {renderKineticCaptionText(active.text, colors.captionHighlight || colors.highlighter)}
      </div>
    </div>
  );
};

export const Hud: React.FC<{ text: string }> = ({ text }) => {
  const { colors, fonts } = useChannelTheme();
  return (
    <div
      style={{
        fontFamily: fonts.display,
        fontSize: 24,
        fontWeight: 800,
        color: colors.highlighter,
        letterSpacing: 1.2,
        backgroundColor: "rgba(11, 12, 14, 0.92)",
        borderLeft: `4px solid ${colors.vermilion}`,
        padding: "6px 14px",
        whiteSpace: "pre",
      }}
    >
      {text}
    </div>
  );
};

export const KickerPill: React.FC<{ text: string; accent?: string }> = ({
  text,
  accent,
}) => {
  const { colors, fonts, safe } = useChannelTheme();
  const resolvedAccent = accent ?? colors.vermilion;
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
        maxWidth: safe.maxW,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "6px 16px",
          backgroundColor: resolvedAccent,
          color: "#FFFFFF",
          fontFamily: fonts.display,
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
            fontFamily: fonts.display,
            fontWeight: 800,
            fontSize: 29,
            letterSpacing: 0.9,
            lineHeight: 1.1,
            color: colors.textOnDark,
            textTransform: "uppercase",
          }}
        >
          {rest.map((seg, i) => (
            <React.Fragment key={`${seg}-${i}`}>
              {i > 0 ? (
                <span style={{ color: colors.highlighter, margin: "0 10px" }}>/</span>
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
  const { colors, fonts } = useChannelTheme();
  const cleanSource = source.replace(/\s*[·•]\s*/g, " / ");
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        paddingLeft: 12,
        borderLeft: `4px solid ${colors.vermilion}`,
        color: onDark ? colors.mutedOnDark : colors.muted,
        fontFamily: fonts.display,
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

export const AiBadge: React.FC<{ concept?: string }> = ({ concept }) => {
  const { colors, fonts } = useChannelTheme();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        backgroundColor: colors.ink,
        borderLeft: `5px solid ${colors.ochre}`,
        color: "#FFFFFF",
        fontFamily: fonts.display,
        fontWeight: 800,
        fontSize: 24,
        letterSpacing: 0.6,
        textTransform: "uppercase",
      }}
    >
      {concept ? `MINH HỌA AI / ${concept}` : "MINH HỌA AI"}
    </div>
  );
};

export const SimulationBadge: React.FC<{ label?: string }> = ({ label = "MÔ PHỎNG 3D" }) => {
  const { colors, fonts } = useChannelTheme();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        backgroundColor: colors.cold,
        color: "#FFFFFF",
        fontFamily: fonts.display,
        fontWeight: 800,
        fontSize: 24,
        letterSpacing: 0.8,
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
};

export const ArchiveLabelBadge: React.FC<{ label?: string; archiveLabel?: string }> = ({
  label,
  archiveLabel,
}) => {
  const { colors, fonts } = useChannelTheme();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        backgroundColor: colors.vermilion,
        color: "#FFFFFF",
        fontFamily: fonts.display,
        fontWeight: 900,
        fontSize: 24,
        letterSpacing: 0.8,
        textTransform: "uppercase",
      }}
    >
      {archiveLabel ?? label ?? ""}
    </div>
  );
};

export const PhotoCreditBadge: React.FC<{ credit: string }> = ({ credit }) => {
  const { colors, fonts } = useChannelTheme();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        backgroundColor: "rgba(11, 12, 14, 0.88)",
        borderLeft: `4px solid ${colors.highlighter}`,
        color: colors.textOnDark,
        fontFamily: fonts.body,
        fontWeight: 600,
        fontSize: 24,
        letterSpacing: 0.2,
      }}
    >
      {credit}
    </div>
  );
};

export const VerdictStamp: React.FC<{ text: string; enterFrame: number; color?: string }> = ({
  text,
  enterFrame,
  color,
}) => {
  const frame = useCurrentFrame();
  const { colors, fonts } = useChannelTheme();
  const resolvedColor = color ?? colors.vermilion;
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
        backgroundColor: resolvedColor,
        borderLeft: `8px solid ${colors.highlighter}`,
        fontFamily: fonts.display,
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
  highlightColor,
  align = "left",
  subColor,
}) => {
  const theme = useChannelTheme();
  const { colors, fonts, safe } = theme;
  const resolvedHighlightColor = highlightColor ?? colors.highlighter;
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(safe.titleMaxFont);
  const width = safe.titleMaxWidth;

  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    if (!wrap || !el) return;

    const measureAndFit = (): number => {
      const lineHeight = 1.06;
      let size: number = safe.titleMaxFont;
      el.style.fontSize = `${size}px`;
      let guard = 0;
      while (guard < 60) {
        guard += 1;
        const lineBox = size * lineHeight;
        const lines = Math.max(1, Math.round(el.offsetHeight / lineBox));
        const overflowX = el.scrollWidth > el.clientWidth + 1;
        if (lines <= 2 && !overflowX) break;
        if (size <= safe.titleMinFont) {
          size = safe.titleMinFont;
          break;
        }
        size = Math.max(safe.titleMinFont, size - 2);
        el.style.fontSize = `${size}px`;
      }
      return size;
    };

    setFontSize(measureAndFit());
    let cancelled = false;
    const handle = typeof window !== "undefined" ? delayRender("HeroTitle font-fit") : null;
    theme
      .waitForFonts()
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
  }, [text, width, safe.titleMaxFont, safe.titleMinFont, theme]);

  const isYellowBlock =
    resolvedHighlightColor.toUpperCase() === colors.highlighter.toUpperCase() ||
    resolvedHighlightColor.toUpperCase() === colors.neonYellow.toUpperCase() ||
    resolvedHighlightColor.toUpperCase() === "#F3D34A" ||
    resolvedHighlightColor.toUpperCase() === "#F7C204" ||
    resolvedHighlightColor.toUpperCase() === "#FFBE0B";

  const isRedBlock =
    resolvedHighlightColor.toUpperCase() === colors.vermilion.toUpperCase() ||
    resolvedHighlightColor.toUpperCase() === "#C8281E";

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
                  backgroundColor: colors.highlighter,
                  color: colors.highlightText,
                  padding: "0 14px",
                  boxDecorationBreak: "clone",
                }
              : isRedBlock
                ? {
                    backgroundColor: colors.vermilion,
                    color: "#FFFFFF",
                    padding: "0 14px",
                    boxDecorationBreak: "clone",
                  }
                : { color: resolvedHighlightColor }
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
          fontFamily: fonts.display,
          fontSize,
          lineHeight: 1.06,
          fontWeight: 900,
          color: color ?? colors.ink,
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
            fontFamily: fonts.body,
            fontSize: 25,
            fontWeight: 700,
            color: subColor ?? colors.muted,
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
              backgroundColor: colors.vermilion,
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
}> = ({ text, enterFrame, color, width }) => {
  const frame = useCurrentFrame();
  const { colors, fonts } = useChannelTheme();
  const resolvedColor = color ?? colors.highlighter;
  const w = interpolate(frame, [enterFrame, enterFrame + 14], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < enterFrame) return null;
  const cleanText = text.replace(/\s*[·•]\s*/g, " / ");
  const isCrimson =
    resolvedColor.toUpperCase() === colors.vermilion.toUpperCase() ||
    resolvedColor.toUpperCase() === "#C8281E";
  return (
    <div style={{ position: "relative", width: width ?? "fit-content", maxWidth: "100%" }}>
      <div
        style={{
          position: "relative",
          backgroundColor: isCrimson ? colors.vermilion : colors.ink,
          borderLeft: `8px solid ${isCrimson ? colors.highlighter : resolvedColor}`,
          clipPath: `inset(0 ${100 - w}% 0 0)`,
          padding: "11px 18px",
        }}
      >
        <div
          style={{
            fontFamily: fonts.body,
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
  const { colors, fonts } = useChannelTheme();
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
          backgroundColor: colors.vermilion,
          borderLeft: `10px solid ${colors.highlighter}`,
          color: "#FFFFFF",
          fontFamily: fonts.display,
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
