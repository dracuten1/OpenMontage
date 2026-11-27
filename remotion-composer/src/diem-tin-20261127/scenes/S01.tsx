import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AiBadge,
  COLORS,
  FONTS,
  HeroTitle,
  MOTION,
  SceneShell,
  SourceBadge,
  ensureFonts,
} from "../../components/news";
import { ASSET_BASE, after, cueFrame } from "../timing";

ensureFonts();

const GRID = { width: 850, height: 320 } as const;

export const DigestPulseGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fArt = cueFrame("s01", "35%", 137);
  const fNvidia = cueFrame("s01", "Nvidia", 178);
  const fGold = cueFrame("s01", "136", 268);

  const items = [
    { tag: "CPTPP HÀ NỘI", val: "+3 NƯỚC", sub: "UAE · Indo · Philippines", color: COLORS.highlighter, enter: 0 },
    { tag: "THUẾ MỸ ART", val: "< 35%", sub: "Cơ bản xong đàm phán", color: COLORS.highlighter, enter: Math.max(12, fArt - 18) },
    { tag: "MÁY CHỦ AI", val: "4 NƯỚC", sub: "Nvidia dừng giao ASEAN", color: "#FF5500", enter: Math.max(20, fNvidia) },
    { tag: "VÀNG & VNI", val: "136 TRIỆU", sub: "SJC +1,5tr · VNI 1.654", color: COLORS.highlighter, enter: Math.max(28, fGold - 12) },
  ];

  return (
    <div style={{ width: GRID.width, height: GRID.height, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {items.map((it) => {
        const p = spring({ frame: Math.max(0, frame - it.enter), fps, config: MOTION.pop });
        const active = after(frame, it.enter);
        const op = active ? interpolate(p, [0, 1], [0.78, 1]) : 0.78;
        const ty = active ? interpolate(p, [0, 1], [10, 0]) : 10;
        return (
          <div
            key={it.tag}
            style={{
              backgroundColor: "rgba(11, 12, 14, 0.92)",
              borderTop: `6px solid ${it.color}`,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: op,
              transform: `translateY(${ty}px)`,
            }}
          >
            <div style={{ fontFamily: FONTS.display, fontSize: 24, fontWeight: 900, color: COLORS.mutedOnDark, letterSpacing: 0.8 }}>
              {it.tag}
            </div>
            <div style={{ fontFamily: FONTS.display, fontSize: 52, fontWeight: 900, color: it.color, lineHeight: 1.0 }}>
              {it.val}
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>
              {it.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const S01: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 315], [1.0, 1.06], { extrapolateRight: "clamp" });

  return (
    <SceneShell
      sceneId="S01"
      label="Cover + Hook"
      kicker="KÝ CHỦ ĐIỂM TIN — BẢN TIN NGÀY 27/11"
      accent="crimson"
      layoutMode="full-bleed"
      showHud={showHud}
    >
      <div
        style={{
          width: 850,
          height: 1060,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingTop: 8,
          paddingBottom: 10,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <AiBadge concept="ĐIỂM TIN 27/11" />
            <div
              style={{
                padding: "7px 16px",
                backgroundColor: COLORS.vermilion,
                color: "#FFFFFF",
                fontFamily: FONTS.display,
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: 0.8,
              }}
            >
              ĐIỂM TIN 27/11
            </div>
          </div>

          <HeroTitle
            text="CPTPP MỞ · VÀNG 136 TRIỆU"
            highlight="VÀNG 136 TRIỆU"
            color="#FFFFFF"
            highlightColor={COLORS.vermilion}
            sub="THUẾ MỸ ART, HẠ TẦNG AI & ROBOT BƯU CỤC"
          />
        </div>

        <div
          style={{
            width: 850,
            height: 360,
            overflow: "hidden",
            position: "relative",
            borderBottom: `6px solid ${COLORS.highlighter}`,
          }}
        >
          <Img
            src={staticFile(`${ASSET_BASE}/images/cover_digest.png`)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center center",
              transform: `scale(${zoom})`,
            }}
          />
        </div>

        <DigestPulseGrid />

        <SourceBadge source="VnExpress / Báo Chính phủ / Dân trí / Thời báo Tài chính (27/11/2026)" />
      </div>
    </SceneShell>
  );
};

export default S01;
