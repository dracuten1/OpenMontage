import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EditorialBarChart } from "../../components/charts";
import {
  COLORS,
  FONTS,
  HeroTitle,
  MOTION,
  SceneShell,
  SourceBadge,
  VerdictStamp,
  ensureFonts,
} from "../../components/news";
import { after, cueFrame } from "../timing";

ensureFonts();

const GRID = { width: 850, height: 170 } as const;

export const MarketPulseSvg: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fIndex = cueFrame("s09", "1.653,9", 162);
  const fOil = cueFrame("s09", "6,8%", 247);
  const fLiq = cueFrame("s09", "30%", 305);

  const p1 = spring({ frame: Math.max(0, frame - Math.max(12, fIndex - 18)), fps, config: MOTION.pop });
  const p2 = spring({ frame: Math.max(0, frame - Math.max(18, fOil - 12)), fps, config: MOTION.pop });
  const p3 = spring({ frame: Math.max(0, frame - Math.max(24, fLiq - 18)), fps, config: MOTION.settle });

  return (
    <svg width={GRID.width} height={GRID.height} viewBox="0 0 850 170" aria-hidden="true" style={{ display: "block" }}>
      <g opacity={after(frame, Math.max(12, fIndex - 18)) ? interpolate(p1, [0, 1], [0.55, 1]) : 0.45}>
        <rect x={0} y={0} width={274} height={170} fill={COLORS.ink} />
        <rect x={0} y={0} width={274} height={8} fill={COLORS.highlighter} />
        <text x={18} y={40} fill={COLORS.mutedOnDark} fontFamily={FONTS.display} fontSize={24} fontWeight={900}>
          VN-INDEX (208 TĂNG)
        </text>
        <text x={18} y={102} fill={COLORS.highlighter} fontFamily={FONTS.display} fontSize={48} fontWeight={900}>
          1.653,90
        </text>
        <text x={18} y={142} fill="#FFFFFF" fontFamily={FONTS.body} fontSize={24} fontWeight={700}>
          +24,22đ (+1,49%)
        </text>
      </g>

      <g opacity={after(frame, Math.max(18, fOil - 12)) ? interpolate(p2, [0, 1], [0.55, 1]) : 0.45}>
        <rect x={288} y={0} width={274} height={170} fill={COLORS.vermilion} />
        <rect x={288} y={0} width={274} height={8} fill={COLORS.highlighter} />
        <text x={306} y={40} fill={COLORS.highlighter} fontFamily={FONTS.display} fontSize={24} fontWeight={900}>
          NHÓM DẦU KHÍ
        </text>
        <text x={306} y={102} fill="#FFFFFF" fontFamily={FONTS.display} fontSize={52} fontWeight={900}>
          +6,8%
        </text>
        <text x={306} y={142} fill="#FFFFFF" fontFamily={FONTS.body} fontSize={24} fontWeight={700}>
          BSR, PVS, PVD trần
        </text>
      </g>

      <g opacity={after(frame, Math.max(24, fLiq - 18)) ? interpolate(p3, [0, 1], [0.55, 1]) : 0.45}>
        <rect x={576} y={0} width={274} height={170} fill={COLORS.ink} />
        <rect x={576} y={0} width={274} height={8} fill={COLORS.ochre} />
        <text x={594} y={40} fill={COLORS.ochre} fontFamily={FONTS.display} fontSize={24} fontWeight={900}>
          THANH KHOẢN HOSE
        </text>
        <text x={594} y={102} fill="#FFFFFF" fontFamily={FONTS.display} fontSize={44} fontWeight={900}>
          11.269 TỶ
        </text>
        <text x={594} y={142} fill={COLORS.ochre} fontFamily={FONTS.body} fontSize={24} fontWeight={700}>
          Giảm 30% · 83 mã đỏ
        </text>
      </g>
    </svg>
  );
};

export const S09: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const fPts = cueFrame("s09", "24,22", 86);
  const fFor = cueFrame("s09", "611", 370);

  return (
    <SceneShell
      sceneId="S09"
      label="Tin 4A · VN-Index hồi 24,22 điểm & Sóng Dầu khí"
      kicker="TIN 4 — CHỨNG KHOÁN VIỆT NAM PHIÊN 27/11/2026"
      accent="amber"
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
          paddingTop: 6,
          paddingBottom: 10,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <HeroTitle
            text="VN-INDEX HỒI 24,22 ĐIỂM"
            highlight="24,22 ĐIỂM"
            highlightColor={COLORS.highlighter}
            sub="DẦU KHÍ TĂNG TRẦN · KHỐI NGOẠI ĐẢO CHIỀU MUA RÒNG"
          />
          <VerdictStamp text="SAU PHIÊN MẤT GẦN 60 ĐIỂM — VIC GÓP HƠN 8 ĐIỂM" enterFrame={Math.min(28, fPts)} color={COLORS.ink} />
        </div>

        <MarketPulseSvg />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 28,
              fontWeight: 900,
              color: COLORS.ink,
              borderBottom: `3px solid ${COLORS.ink}`,
              paddingBottom: 6,
            }}
          >
            DÒNG TIỀN KHỐI NGOẠI MUA RÒNG NGÀY 27/11 (TỶ ĐỒNG)
          </div>
          <EditorialBarChart
            data={[
              { label: "Toàn thị trường", value: 611, display: "611 tỷ" },
              { label: "Sàn HoSE", value: 563, display: "563 tỷ" },
              { label: "Tâm điểm mã FPT", value: 182, display: "182 tỷ" },
            ]}
            enterFrames={[
              Math.max(12, fFor - 24),
              Math.max(16, fFor - 12),
              Math.max(20, fFor),
            ]}
            growFrames={30}
            direction="h"
            maxValue={680}
            highlightIndex={0}
            width={850}
            rowHeight={96}
            barColor={COLORS.ink}
          />
        </div>

        <SourceBadge source="Thời báo Tài chính Việt Nam / VnExpress / Znews (27/11/2026)" />
      </div>
    </SceneShell>
  );
};

export default S09;
