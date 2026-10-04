// sc-10 — Hai không gian sinh thái. Plate is portrait (1024x1536): shown as a vertically panning band, with a
// blurred full-bleed backdrop. Order (narration): Rồng/sông nước duyên hải (bottom) -> Tiên/rẻo cao rừng núi (top).
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, SceneProps, ease } from "../theme";
import { InterpretFlag, Paper, Reveal, useFrac } from "../common";

const Tag: React.FC<{ start: number; title: string; sub: string; accent: string; align: "left" | "right"; style: React.CSSProperties }> = ({
  start,
  title,
  sub,
  accent,
  align,
  style,
}) => (
  <Reveal startFrac={start} endFrac={start + 0.1} dy={14} style={{ position: "absolute", ...style }}>
    <div
      style={{
        padding: "14px 30px 16px",
        background: "rgba(26,23,20,0.84)",
        borderLeft: align === "left" ? `6px solid ${accent}` : undefined,
        borderRight: align === "right" ? `6px solid ${accent}` : undefined,
        borderRadius: 8,
        textAlign: align,
        maxWidth: 560,
      }}
    >
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, lineHeight: 1.1, color: C.white }}>{title}</div>
      <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, lineHeight: 1.35, color: C.cream, marginTop: 6 }}>{sub}</div>
    </div>
  </Reveal>
);

export const Sc10: React.FC<SceneProps> = () => {
  const { frame, dur, p } = useFrac();
  const url = staticFile("con-rong-chau-tien/sc10_hai_khong_gian_sinh_thai.png");
  const t = Math.max(0, Math.min(1, frame / Math.max(1, dur - 1)));
  const s = t * t * (3 - 2 * t);

  // portrait plate fitted to width 1280 -> height 1920; viewport shows 1080 of it. Pan from bottom (sea) to top (mountains).
  const PW = 1280;
  const PH = 1920;
  const panY = -(PH - 1080) * (1 - s); // starts at bottom of the image, ends at top
  const x0 = (1920 - PW) / 2;

  const fade = ease(p(0, 0.05));
  const bandBlur = ease(p(0.02, 0.1));

  return (
    <Paper>
      <AbsoluteFill style={{ opacity: fade }}>
        {/* backdrop: same plate, wider and blurred */}
        <AbsoluteFill style={{ transform: `scale(${1.4 + 0.02 * s})`, filter: "blur(18px) brightness(0.5)" }}>
          <Img src={url} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${(1 - s) * 100}%` }} />
        </AbsoluteFill>
        {/* sharp band */}
        <div
          style={{
            position: "absolute",
            left: x0,
            top: 0,
            width: PW,
            height: 1080,
            overflow: "hidden",
            WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,0), #000 12%, #000 88%, rgba(0,0,0,0))",
            maskImage: "linear-gradient(to right, rgba(0,0,0,0), #000 12%, #000 88%, rgba(0,0,0,0))",
          }}
        >
          <Img src={url} style={{ position: "absolute", left: 0, top: panY, width: PW, height: PH }} />
        </div>
      </AbsoluteFill>

      {/* edge shading */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "linear-gradient(to top, rgba(26,23,20,0.8) 0%, rgba(26,23,20,0) 26%), linear-gradient(to bottom, rgba(26,23,20,0.7) 0%, rgba(26,23,20,0) 24%)",
          opacity: bandBlur,
        }}
      />

      {/* order of mention: sông nước (Rồng) first, then rẻo cao (Tiên); labels follow the pan (sea bottom -> mountains top) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 1 - ease(p(0.5, 0.58)) }}>
        <Tag start={0.08} title="Rồng" sub="cư dân sông nước duyên hải" accent="#6FA8B8" align="left" style={{ left: 64, bottom: 64 }} />
      </div>
      <Tag start={0.6} title="Tiên" sub="cư dân rẻo cao rừng núi" accent={C.cream} align="right" style={{ right: 64, top: 128 }} />

      <InterpretFlag />
    </Paper>
  );
};
