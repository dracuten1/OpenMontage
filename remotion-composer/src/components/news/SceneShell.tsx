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
import { COLORS, FONTS, FPS, HEIGHT, SAFE } from "./theme";

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
      style={{ backgroundColor: COLORS.slate, fontFamily: FONTS.body, color: COLORS.text }}
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
        <BackdropGrid accentColor={accentColor} />
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
              opacity: mediaBackdrop.opacity ?? 0.78,
            }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, rgba(11, 14, 20, 0.68) 0%, rgba(18, 22, 31, 0.16) 24%, rgba(18, 22, 31, 0.28) 64%, rgba(11, 14, 20, 0.88) 88%, ${COLORS.slate} 100%)`,
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
              opacity: backplate.opacity ?? 0.62,
              filter: `brightness(${backplate.brightness ?? 0.92}) contrast(${backplate.contrast ?? 1.08}) saturate(0.92)`,
              transform: `scale(${bpScale}) translateX(${bpPanX}%)`,
              transformOrigin: "center center",
            }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, ${COLORS.slate} 0%, rgba(18, 22, 31, 0.30) 18%, rgba(18, 22, 31, 0.42) 58%, rgba(18, 22, 31, 0.88) 86%, ${COLORS.slate} 100%)`,
            }}
          />
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(90deg, rgba(11, 14, 20, 0.56) 0%, rgba(11, 14, 20, 0.14) 62%, rgba(11, 14, 20, 0.36) 100%)",
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

export const BackdropGrid: React.FC<{ accentColor?: string }> = ({
  accentColor = COLORS.crimson,
}) => {
  const frame = useCurrentFrame();
  const glow = 0.16 + 0.05 * Math.sin(frame / 45);
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 50% 30%, rgba(30,38,50,1) 0%, ${COLORS.slate} 55%, ${COLORS.ink} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${COLORS.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.gridLine} 1px, transparent 1px)`,
          backgroundSize: "120px 120px",
          opacity: 0.9,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(45% 30% at 50% 6%, ${accentColor}${Math.round(glow * 255)
            .toString(16)
            .padStart(2, "0")} 0%, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

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
          borderRadius: 12,
          backgroundColor: "rgba(11, 14, 20, 0.90)",
          border: `1px solid ${COLORS.line}`,
          color: COLORS.text,
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize,
          lineHeight: 1.25,
          textAlign: "center",
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
      color: COLORS.amber,
      letterSpacing: 1.5,
      backgroundColor: "rgba(11, 14, 20, 0.78)",
      border: `1px solid ${COLORS.amber}`,
      borderRadius: 8,
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
      padding: "10px 26px",
      borderRadius: 999,
      backgroundColor: "rgba(11, 14, 20, 0.88)",
      border: `2px solid ${accent}`,
      color: accent,
      fontFamily: FONTS.kicker,
      fontWeight: 700,
      fontSize: 28,
      letterSpacing: 0.8,
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
      padding: "7px 18px",
      borderRadius: 999,
      border: `1px solid ${COLORS.line}`,
      backgroundColor: "rgba(11, 14, 20, 0.86)",
      color: COLORS.muted,
      fontFamily: FONTS.mono,
      fontWeight: 600,
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
      padding: "7px 18px",
      borderRadius: 999,
      border: `2px solid ${COLORS.amber}`,
      backgroundColor: "rgba(11, 14, 20, 0.86)",
      color: COLORS.amber,
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
      padding: "7px 18px",
      borderRadius: 999,
      border: `2px solid ${COLORS.cold}`,
      backgroundColor: "rgba(11, 14, 20, 0.86)",
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
      padding: "7px 18px",
      borderRadius: 999,
      border: `2px solid ${COLORS.amber}`,
      backgroundColor: "rgba(11, 14, 20, 0.88)",
      color: COLORS.amber,
      fontFamily: FONTS.body,
      fontWeight: 700,
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
      padding: "6px 16px",
      borderRadius: 999,
      border: "1px solid rgba(255, 190, 11, 0.45)",
      backgroundColor: "rgba(11, 14, 20, 0.88)",
      color: COLORS.paper,
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
  color = COLORS.amber,
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
        padding: "12px 26px",
        transform: "rotate(-1.0deg)",
        backgroundColor: "rgba(11, 14, 20, 0.90)",
        borderTop: `3px solid ${color}`,
        borderBottom: `3px solid ${color}`,
        fontFamily: FONTS.kicker,
        fontWeight: 700,
        fontSize: 28,
        letterSpacing: 0.8,
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
}> = ({ text, highlight, sub, color, highlightColor = COLORS.neonYellow, align = "center" }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(SAFE.titleMaxFont);
  const width = SAFE.titleMaxWidth;

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    if (!wrap || !el) return;
    const lineHeight = 1.1;
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

  const renderHighlighted = () => {
    if (!highlight || !text.includes(highlight)) return text;
    const idx = text.indexOf(highlight);
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ color: highlightColor }}>{highlight}</span>
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
          lineHeight: 1.1,
          fontWeight: 800,
          color: color ?? COLORS.text,
          textAlign: align,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          overflowWrap: "break-word",
          textShadow: `0 0 34px ${COLORS.glowRed}`,
        }}
      >
        {renderHighlighted()}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: FONTS.kicker,
            fontSize: 26,
            fontWeight: 600,
            color: COLORS.muted,
            textAlign: align,
            letterSpacing: 1.0,
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
}> = ({ text, enterFrame, color = COLORS.amber, width }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [enterFrame, enterFrame + 14], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < enterFrame) return null;
  return (
    <div style={{ position: "relative", maxWidth: width ?? "fit-content" }}>
      <div
        style={{
          position: "absolute",
          inset: "8% -2%",
          backgroundColor: color,
          opacity: 0.52,
          clipPath: `inset(0 ${100 - w}% 0 0)`,
          transform: "skewX(-8deg)",
        }}
      />
      <div
        style={{
          position: "relative",
          fontFamily: FONTS.kicker,
          fontSize: 27,
          fontWeight: 700,
          letterSpacing: 0.5,
          color: COLORS.text,
          padding: "8px 12px",
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
          padding: "16px 38px",
          borderRadius: 999,
          backgroundColor: COLORS.amber,
          border: `2px solid ${COLORS.amber}`,
          color: COLORS.ink,
          fontFamily: FONTS.kicker,
          fontSize: 32,
          fontWeight: 700,
          textAlign: "center",
          letterSpacing: 0.8,
          whiteSpace: "nowrap",
          boxShadow: `0 0 40px ${COLORS.glowAmber}`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export { HEIGHT };
