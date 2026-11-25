// S01 — Cover + Hook: "MỞ HỒ SƠ KÝ CHỦ PHÁP LUẬT"
import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, MOTION } from "../../channels/ky-chu-phap-luat/theme";
import { AiBadge, HeroTitle, SceneShell } from "../../core/SceneShell";
import { ASSET_BASE } from "../timing";

export const S01: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerSpring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: MOTION.pop,
  });
  const dossierSpring = spring({
    frame: Math.max(0, frame - 56),
    fps,
    config: MOTION.settle,
  });
  const dossierOpacity = interpolate(frame, [50, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineDraw = interpolate(frame, [66, 118], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const GRID = { width: 850, height: 244, accent: 10 };

  return (
    <SceneShell
      sceneId="S01"
      label="Cover + Hook"
      kicker="HỒ SƠ KÊNH · CÔNG BÁO THU NHỎ"
      accent="crimson"
      layoutMode="full-bleed"
      backplate={{
        src: `${ASSET_BASE}/images/ai_s01_legal_dossier.png`,
        mode: "full-bleed",
        opacity: 0.78,
        objectPosition: "center 45%",
        zoomFrom: 1.01,
        zoomTo: 1.07,
        brightness: 0.56,
        contrast: 1.1,
      }}
      showHud={showHud}
    >
      <div
        data-editorial-spotlight="true"
        style={{
          position: "absolute",
          top: 44,
          left: 0,
          width: 850,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        {/* Top Channel Crest + AI Illustration Disclosure */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            transform: `translateY(${interpolate(headerSpring, [0, 1], [-8, 0])}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Img
              src={staticFile("channels/ky-chu-phap-luat/brand/avatar_navy_emblem.png")}
              style={{ width: 64, height: 64, objectFit: "cover" }}
            />
            <div
              style={{
                backgroundColor: COLORS.vermilion,
                color: COLORS.textOnDark,
                fontFamily: FONTS.display,
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: 1.1,
                padding: "10px 18px",
                whiteSpace: "nowrap",
              }}
            >
              GIỚI THIỆU KÊNH CHÍNH THỨC
            </div>
          </div>
          <AiBadge concept="CÔNG BÁO" />
        </div>

        {/* Cover Hero Headline — visible at frame 0 as TikTok poster */}
        <div style={{ marginTop: 8 }}>
          <HeroTitle
            text="KÝ CHỦ PHÁP LUẬT"
            highlight="PHÁP LUẬT"
            color={COLORS.textOnDark}
            highlightColor={COLORS.highlighter}
          />
        </div>

        {/* Sub-headline bar */}
        <div
          style={{
            borderLeft: `6px solid ${COLORS.highlighter}`,
            paddingLeft: 20,
            fontFamily: FONTS.body,
            fontSize: 33,
            fontWeight: 700,
            lineHeight: 1.35,
            color: COLORS.textOnDark,
          }}
        >
          Hiểu đúng luật trong 60 giây · 2 chế độ · Nguồn chính thống · 3 lớp kiểm chứng
        </div>

        {/* Graphic-native SVG Contrast Box: Rumor vs Official Dossier */}
        <div
          style={{
            marginTop: 32,
            opacity: dossierOpacity,
            transform: `translateY(${interpolate(dossierSpring, [0, 1], [24, 0])}px)`,
          }}
        >
          <svg
            width={GRID.width}
            height={GRID.height}
            viewBox="0 0 850 244"
            style={{ display: "block", overflow: "visible" }}
          >
            <rect x={0} y={0} width={GRID.width} height={GRID.height} fill="rgba(13, 27, 42, 0.92)" />
            <rect x={0} y={0} width={GRID.accent} height={GRID.height} fill={COLORS.highlighter} />

            <text
              x={36}
              y={48}
              fill={COLORS.highlighter}
              fontFamily={FONTS.display}
              fontSize={28}
              fontWeight={800}
              letterSpacing={1.2}
            >
              TIN ĐỒN MẠNG vs CÔNG BÁO THU NHỎ
            </text>

            <line
              x1={36}
              y1={66}
              x2={816}
              y2={66}
              stroke="rgba(246, 242, 233, 0.25)"
              strokeWidth={2}
              strokeDasharray={780}
              strokeDashoffset={780 * (1 - lineDraw)}
            />

            <circle cx={46} cy={112} r={8} fill={COLORS.crimson} />
            <text
              x={68}
              y={121}
              fill="#F6F2E9"
              fontFamily={FONTS.body}
              fontSize={30}
              fontWeight={700}
            >
              Cắt ghép mức phạt, thiếu số hiệu văn bản
            </text>

            <circle cx={46} cy={180} r={8} fill={COLORS.vermilion} />
            <text
              x={68}
              y={189}
              fill={COLORS.highlighter}
              fontFamily={FONTS.body}
              fontSize={30}
              fontWeight={800}
            >
              Đối chiếu văn bản gốc còn hiệu lực · 60 giây
            </text>
          </svg>
        </div>
      </div>
    </SceneShell>
  );
};

export default S01;
