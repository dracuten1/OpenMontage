import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ArchivalSpotlight } from "../../components/editorial";
import { COLORS, FONTS, MOTION, SceneShell, SourceBadge, ensureFonts } from "../../components/news";
import { ASSET_BASE, after, cueFrame } from "../timing";

ensureFonts();

const GRID = { width: 850, height: 364 } as const;

export const GoldGeoRiskSvg: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fSjc = cueFrame("s10", "136", 82);
  const fWorld = cueFrame("s10", "3.656", 153);
  const fPick = cueFrame("s10", "Pickaxe", 312);

  const p1 = spring({ frame: Math.max(0, frame - Math.max(12, fSjc - 16)), fps, config: MOTION.pop });
  const p2 = spring({ frame: Math.max(0, frame - Math.max(18, fWorld - 12)), fps, config: MOTION.settle });
  const p3 = spring({ frame: Math.max(0, frame - Math.max(24, fPick - 24)), fps, config: MOTION.pop });

  return (
    <svg width={GRID.width} height={GRID.height} viewBox="0 0 850 364" aria-hidden="true" style={{ display: "block" }}>
      <g opacity={after(frame, Math.max(12, fSjc - 16)) ? interpolate(p1, [0, 1], [0.55, 1]) : 0.45}>
        <rect x={0} y={0} width={850} height={110} fill={COLORS.ink} />
        <rect x={0} y={0} width={8} height={110} fill={COLORS.highlighter} />
        <text x={24} y={36} fill={COLORS.highlighter} fontFamily={FONTS.display} fontSize={26} fontWeight={900}>
          CẬP NHẬT MỚI 27/11 — VÀNG MIẾNG SJC (+1,5 TRIỆU)
        </text>
        <text x={24} y={76} fill="#FFFFFF" fontFamily={FONTS.body} fontSize={24} fontWeight={700}>
          Mua 131tr · Nhẫn 135,8tr (+2,5tr) · Chênh 5 triệu
        </text>
        <rect x={636} y={24} width={194} height={62} fill={COLORS.highlighter} />
        <text x={733} y={66} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.display} fontSize={36} fontWeight={900}>
          136 TRIỆU
        </text>
      </g>

      <g opacity={after(frame, Math.max(18, fWorld - 12)) ? interpolate(p2, [0, 1], [0.55, 1]) : 0.45}>
        <rect x={0} y={126} width={850} height={110} fill={COLORS.ink} />
        <rect x={0} y={126} width={8} height={110} fill={COLORS.ochre} />
        <text x={24} y={162} fill={COLORS.ochre} fontFamily={FONTS.display} fontSize={26} fontWeight={900}>
          VÀNG GIAO NGAY QUỐC TẾ (+2,6%)
        </text>
        <text x={24} y={202} fill="#FFFFFF" fontFamily={FONTS.body} fontSize={24} fontWeight={700}>
          Tăng mạnh theo nhu cầu trú ẩn địa chính trị
        </text>
        <rect x={636} y={150} width={194} height={62} fill={COLORS.ochre} />
        <text x={733} y={192} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.display} fontSize={36} fontWeight={900}>
          3.656 USD
        </text>
      </g>

      <g opacity={after(frame, Math.max(24, fPick - 24)) ? interpolate(p3, [0, 1], [0.55, 1]) : 0.45}>
        <rect x={0} y={252} width={850} height={112} fill={COLORS.vermilion} />
        <rect x={0} y={252} width={8} height={112} fill={COLORS.highlighter} />
        <text x={24} y={288} fill={COLORS.highlighter} fontFamily={FONTS.display} fontSize={26} fontWeight={900}>
          ĐỊA CHÍNH TRỊ MỸ–IRAN — NÚI PICKAXE (26/11)
        </text>
        <text x={24} y={328} fill="#FFFFFF" fontFamily={FONTS.body} fontSize={24} fontWeight={700}>
          150 tên lửa Mỹ · Cơ sở Behjatabad (5.000 ha)
        </text>
        <rect x={636} y={276} width={194} height={64} fill={COLORS.ink} />
        <text x={733} y={318} textAnchor="middle" fill={COLORS.highlighter} fontFamily={FONTS.display} fontSize={34} fontWeight={900}>
          62 KM
        </text>
      </g>
    </svg>
  );
};

export const S10: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const fSjc = cueFrame("s10", "136", 82);

  return (
    <SceneShell
      sceneId="S10"
      label="Tin 4B · Vàng SJC 136 triệu & Núi Pickaxe"
      kicker="CẬP NHẬT MỚI 27/11 — VÀNG SJC 136 TRIỆU & RỦI RO TRUNG ĐÔNG"
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
          paddingTop: 6,
          paddingBottom: 10,
          boxSizing: "border-box",
        }}
      >
        <ArchivalSpotlight
          src={`${ASSET_BASE}/images/gold_bullion.jpg`}
          width={850}
          height={420}
          enterFrame={0}
          archiveLabel="ẢNH TƯ LIỆU 2015"
          creditLine="Thỏi vàng 999.9 — Wikimedia Commons / Ank Kumar (CC BY-SA 4.0)"
          pullQuote="SJC vọt 1,5 triệu lên 136 triệu/lượng nhưng chênh mua–bán vẫn 5 triệu đồng"
          quoteHighlight="136 triệu"
          quoteEnterFrame={Math.min(54, Math.max(12, fSjc - 12))}
          objectPosition="center 48%"
        />

        <GoldGeoRiskSvg />

        <SourceBadge source="CafeF / Báo Nghệ An / Jerusalem Post / Thanh Niên (26–27/11/2026)" />
      </div>
    </SceneShell>
  );
};

export default S10;
