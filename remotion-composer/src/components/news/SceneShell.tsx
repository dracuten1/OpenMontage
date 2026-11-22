// Shared News Foundation SceneShell — Safe Zone v3.2 + atomic editorial widgets.
import React, { useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS, FPS, HEIGHT, SAFE, ensureFonts } from "./theme";

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
  const accentColor = accent === "amber" ? COLORS.amber : COLORS.crimson;

  const camScale = interpolate(
    frame,
    [0, Math.max(1, durationInFrames)],
    [1.0, 1.08],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const bpScale = backplate
    ? interpolate(
        frame,
        [0, Math.max(1, durationInFrames)],
        [backplate.zoomFrom ?? 1.0, backplate.zoomTo ?? 1.1],
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

  return (
    <AbsoluteFill
      style={{ backgroundColor: COLORS.paper, fontFamily: FONTS.body, color: COLORS.ink }}
      data-scene-id={sceneId}
      data-scene-label={label}
    >
      <AbsoluteFill
        style={{
          overflow: "hidden",
          transform: `scale(${camScale})`,
          transformOrigin: "center center",
        }}
      >
        <ArchivalPaperBackdrop accentColor={accentColor} />
      </AbsoluteFill>

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
              opacity: mediaBackdrop.opacity ?? 0.35,
            }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, rgba(244, 239, 230, 0.92) 0%, rgba(244, 239, 230, 0.42) 24%, rgba(244, 239, 230, 0.48) 64%, rgba(244, 239, 230, 0.92) 88%, ${COLORS.paper} 100%)`,
            }}
          />
        </div>
      ) : null}

      {backplate ? (
        <div
          style={{
            position: "absolute",
            top: 210,
            left: 0,
            width: 1080,
            height: 1180,
            overflow: "hidden",
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <Img
            src={staticFile(backplate.src)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: backplate.objectPosition ?? "center center",
              opacity: backplate.opacity ?? 0.24,
              filter: `brightness(${backplate.brightness ?? 1.04}) contrast(${backplate.contrast ?? 1.04}) saturate(0.75)`,
              transform: `scale(${bpScale}) translateX(${bpPanX}%)`,
              transformOrigin: "center center",
            }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, ${COLORS.paper} 0%, rgba(244, 239, 230, 0.38) 18%, rgba(244, 239, 230, 0.44) 58%, rgba(244, 239, 230, 0.90) 86%, ${COLORS.paper} 100%)`,
            }}
          />
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(90deg, rgba(244, 239, 230, 0.72) 0%, rgba(244, 239, 230, 0.16) 62%, rgba(244, 239, 230, 0.45) 100%)",
            }}
          />
        </div>
      ) : null}

      {kicker ? (
        <div style={{ position: "absolute", top: SAFE.kickerTop, left: SAFE.margin, zIndex: 40 }}>
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

      {photoCredit ?? backplate?.creditLine ? (
        <div
          style={{
            position: "absolute",
            top: 1428,
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

      {showHud === true ? (
        <div style={{ position: "absolute", left: SAFE.margin, bottom: 96, zIndex: 45 }}>
          <Hud text={hudText ?? sceneId} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const ArchivalPaperBackdrop: React.FC<{ accentColor?: string }> = ({
  accentColor = COLORS.crimson,
}) => {
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 95% at 50% 42%, #F7F3EA 0%, ${COLORS.paper} 62%, #E5DBC7 100%)`,
        }}
      />
      {/* Subtle broadsheet framing hairline rules */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${COLORS.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.gridLine} 1px, transparent 1px)`,
          backgroundSize: "140px 140px",
          opacity: 0.55,
        }}
      />
      {/* Deterministic archival paper grain texture */}
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.045, pointerEvents: "none" }}
      >
        <filter id="archival-paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#archival-paper-grain)" />
      </svg>
      {/* Top editorial masthead rule */}
      <div
        style={{
          position: "absolute",
          top: 218,
          left: SAFE.margin,
          right: SAFE.railRight,
          height: 3,
          backgroundColor: accentColor,
          opacity: 0.88,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 225,
          left: SAFE.margin,
          right: SAFE.railRight,
          height: 1,
          backgroundColor: COLORS.ink,
          opacity: 0.25,
        }}
      />
    </AbsoluteFill>
  );
};

export const BackdropGrid = ArchivalPaperBackdrop;

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
          padding: "12px 26px",
          borderRadius: 4,
          backgroundColor: COLORS.ink,
          border: `1px solid ${COLORS.ink}`,
          borderTop: `3px solid ${COLORS.crimson}`,
          color: COLORS.surface,
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize,
          lineHeight: 1.25,
          textAlign: "center",
          boxShadow: "0 6px 18px rgba(20, 20, 19, 0.22)",
        }}
      >
        {active.text}
      </div>
    </div>
  );
};

export const Hud: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      fontFamily: FONTS.mono,
      fontSize: 24,
      color: COLORS.neonYellow,
      letterSpacing: 1.5,
      backgroundColor: "rgba(20, 20, 19, 0.88)",
      border: `1px solid ${COLORS.ink}`,
      borderRadius: 3,
      padding: "8px 16px",
      whiteSpace: "pre",
    }}
  >
    {text}
  </div>
);

export const KickerPill: React.FC<{ text: string; accent?: string }> = ({
  text,
  accent = COLORS.crimson,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "9px 22px",
      borderRadius: 2,
      backgroundColor: COLORS.surface,
      borderTop: `1px solid ${COLORS.line}`,
      borderRight: `1px solid ${COLORS.line}`,
      borderBottom: `1px solid ${COLORS.line}`,
      borderLeft: `6px solid ${accent}`,
      color: accent,
      fontFamily: FONTS.kicker,
      fontWeight: 800,
      fontSize: 27,
      letterSpacing: 0.9,
      boxShadow: "0 2px 8px rgba(20, 20, 19, 0.06)",
    }}
  >
    {text}
  </div>
);

export const SourceBadge: React.FC<{ source: string }> = ({ source }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "7px 16px",
      borderRadius: 2,
      border: "1px solid rgba(20, 20, 19, 0.30)",
      backgroundColor: COLORS.surface,
      color: COLORS.muted,
      fontFamily: FONTS.mono,
      fontWeight: 700,
      fontSize: 24,
      letterSpacing: 0.4,
    }}
  >
    NGUỒN: {source}
  </div>
);

export const AiBadge: React.FC<{ concept?: string }> = ({ concept }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 16px",
      borderRadius: 2,
      border: `2px solid ${COLORS.ochre}`,
      backgroundColor: COLORS.surfaceAlt,
      color: COLORS.ochre,
      fontFamily: FONTS.body,
      fontWeight: 700,
      fontSize: 24,
      letterSpacing: 0.4,
    }}
  >
    {concept ? `Hình minh họa: AI · ${concept}` : "Hình minh họa: AI"}
  </div>
);

export const SimulationBadge: React.FC<{ label?: string }> = ({ label = "MÔ PHỎNG 3D" }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 16px",
      borderRadius: 2,
      border: `2px solid ${COLORS.cold}`,
      backgroundColor: COLORS.surface,
      color: COLORS.cold,
      fontFamily: FONTS.mono,
      fontWeight: 700,
      fontSize: 24,
      letterSpacing: 0.4,
    }}
  >
    {label}
  </div>
);

export const ArchiveLabelBadge: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 16px",
      borderRadius: 2,
      border: `2px solid ${COLORS.ink}`,
      backgroundColor: COLORS.surface,
      color: COLORS.ink,
      fontFamily: FONTS.mono,
      fontWeight: 800,
      fontSize: 24,
      letterSpacing: 0.4,
    }}
  >
    {label}
  </div>
);

export const PhotoCreditBadge: React.FC<{ credit: string }> = ({ credit }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "6px 14px",
      borderRadius: 2,
      border: "1px solid rgba(20, 20, 19, 0.28)",
      backgroundColor: COLORS.surface,
      color: COLORS.ink,
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
  color = COLORS.crimson,
}) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [enterFrame, enterFrame + 14], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < enterFrame) return null;
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        padding: "10px 24px",
        transform: "rotate(-1.2deg)",
        backgroundColor: COLORS.surface,
        border: `3px solid ${color}`,
        borderRadius: 2,
        fontFamily: FONTS.kicker,
        fontWeight: 800,
        fontSize: 28,
        letterSpacing: 0.9,
        color,
        clipPath: `inset(0 ${100 - w}% 0 0)`,
      }}
    >
      {text}
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
}> = ({ text, highlight, sub, color, highlightColor = COLORS.highlighter, align = "center" }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(SAFE.titleMaxFont);
  const width = SAFE.titleMaxWidth;

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    if (!wrap || !el) return;
    const lineHeight = 1.12;
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
    setFontSize(size);
  }, [text, width]);

  const isMarkerFill =
    highlightColor.toUpperCase() === COLORS.highlighter.toUpperCase() ||
    highlightColor.toUpperCase() === COLORS.neonYellow.toUpperCase() ||
    highlightColor.toUpperCase() === "#F7C204" ||
    highlightColor.toUpperCase() === "#FFBE0B";

  const renderHighlighted = () => {
    if (!highlight || !text.includes(highlight)) return text;
    const idx = text.indexOf(highlight);
    return (
      <>
        {text.slice(0, idx)}
        <span
          style={
            isMarkerFill
              ? {
                  backgroundColor: COLORS.highlighter,
                  color: COLORS.ink,
                  padding: "0 10px",
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
      style={{ width, maxWidth: "100%", display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div
        ref={textRef}
        style={{
          width: "100%",
          fontFamily: FONTS.display,
          fontSize,
          lineHeight: 1.12,
          fontWeight: 900,
          color: color ?? COLORS.ink,
          textAlign: align,
          textTransform: "uppercase",
          letterSpacing: -0.2,
          overflowWrap: "break-word",
        }}
      >
        {renderHighlighted()}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: FONTS.kicker,
            fontSize: 26,
            fontWeight: 700,
            color: COLORS.muted,
            textAlign: align,
            letterSpacing: 0.8,
          }}
        >
          {sub}
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
    <span>
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
  const barBg =
    color.toUpperCase() === COLORS.crimson.toUpperCase() ? "rgba(200, 40, 30, 0.16)" : color;
  return (
    <div style={{ position: "relative", maxWidth: width ?? "fit-content" }}>
      <div
        style={{
          position: "absolute",
          inset: "6% -1%",
          backgroundColor: barBg,
          opacity: 0.85,
          clipPath: `inset(0 ${100 - w}% 0 0)`,
          transform: "skewX(-4deg)",
          borderLeft: `4px solid ${COLORS.crimson}`,
        }}
      />
      <div
        style={{
          position: "relative",
          fontFamily: FONTS.kicker,
          fontSize: 27,
          fontWeight: 800,
          letterSpacing: 0.4,
          color: COLORS.ink,
          padding: "8px 14px",
        }}
      >
        {text}
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
          padding: "16px 36px",
          borderRadius: 3,
          backgroundColor: COLORS.ink,
          border: `2px solid ${COLORS.ink}`,
          borderLeft: `8px solid ${COLORS.crimson}`,
          color: COLORS.surface,
          fontFamily: FONTS.kicker,
          fontSize: 32,
          fontWeight: 700,
          textAlign: "center",
          letterSpacing: 0.8,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export { HEIGHT };
