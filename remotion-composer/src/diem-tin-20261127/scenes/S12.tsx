import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, CtaBand, FONTS, HeroTitle, SceneShell, SourceBadge, ensureFonts } from "../../components/news";
import { cueFrame } from "../timing";

ensureFonts();

const GRID = { width: 850, height: 156 } as const;

export const DebateOutroSvg: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [6, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <svg width={GRID.width} height={GRID.height} viewBox="0 0 850 156" aria-hidden="true" style={{ display: "block" }}>
      <rect x={0} y={0} width={GRID.width} height={GRID.height} fill={COLORS.ink} />
      <line
        x1={28}
        y1={36}
        x2={822}
        y2={36}
        stroke={COLORS.highlighter}
        strokeWidth={4}
        strokeDasharray={794}
        strokeDashoffset={794 * (1 - draw)}
      />
      <rect x={28} y={54} width={380} height={74} fill={COLORS.vermilion} />
      <text x={218} y={102} textAnchor="middle" fill="#FFFFFF" fontFamily={FONTS.display} fontSize={32} fontWeight={900}>
        CHỌN A — NÂNG KỸ NĂNG
      </text>
      <rect x={442} y={54} width={380} height={74} fill={COLORS.highlighter} />
      <text x={632} y={102} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.display} fontSize={32} fontWeight={900}>
        CHỌN B — PHÒNG THỦ TIỀN
      </text>
    </svg>
  );
};

export const S12: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const fFollow = cueFrame("s12", "theo", 133);

  return (
    <SceneShell
      sceneId="S12"
      label="Outro CTA · Ký Chủ Điểm Tin"
      kicker="KÝ CHỦ ĐIỂM TIN — BẢN TIN MỖI NGÀY"
      accent="crimson"
      layoutMode="swiss-split"
      showHud={showHud}
    >
      <div
        style={{
          width: 850,
          height: 1060,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingTop: 14,
          paddingBottom: 60,
          boxSizing: "border-box",
        }}
      >
        <HeroTitle
          text="BÌNH LUẬN A HOẶC B"
          highlight="A HOẶC B"
          highlightColor={COLORS.highlighter}
          sub="BẠN CHỌN TĂNG TỐC KỸ NĂNG HAY PHÒNG THỦ TIỀN MẶT?"
        />

        <DebateOutroSvg />

        <div
          style={{
            padding: "22px 24px",
            backgroundColor: COLORS.paperWarm,
            borderLeft: `10px solid ${COLORS.vermilion}`,
            color: COLORS.ink,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ fontFamily: FONTS.display, fontSize: 30, fontWeight: 900, color: COLORS.vermilion }}>
            MỐC THEO DÕI: ART &amp; NÂNG CẤP CPTPP 2027
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 27, fontWeight: 700, lineHeight: 1.35 }}>
            Chốt kỹ thuật Hiệp định ART giảm áp lực thuế 35% và đàm phán 3 thành viên CPTPP mới.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, opacity: fFollow >= 0 ? 1 : 1 }}>
          <CtaBand text="THEO DÕI KÝ CHỦ ĐIỂM TIN" />
          <SourceBadge source="VnExpress / Báo Chính phủ / Dân trí / Thời báo Tài chính (27/11/2026)" />
        </div>
      </div>
    </SceneShell>
  );
};

export default S12;
