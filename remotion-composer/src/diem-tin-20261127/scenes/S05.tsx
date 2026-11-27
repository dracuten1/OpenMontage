import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ArchivalSpotlight } from "../../components/editorial";
import { COLORS, FONTS, MOTION, SceneShell, SourceBadge, ensureFonts } from "../../components/news";
import { ASSET_BASE, after, cueFrame } from "../timing";

ensureFonts();

const GRID = { width: 850, height: 364 } as const;

export const DataCenterTierSvg: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fRack = cueFrame("s05", "2.000", 96);
  const fTier = cueFrame("s05", "Tier", 262);
  const fDec = cueFrame("s05", "2320", 305);

  const p1 = spring({ frame: Math.max(0, frame - Math.max(12, fRack - 12)), fps, config: MOTION.pop });
  const p2 = spring({ frame: Math.max(0, frame - Math.max(20, fTier - 16)), fps, config: MOTION.settle });
  const p3 = spring({ frame: Math.max(0, frame - Math.max(28, fDec - 12)), fps, config: MOTION.pop });

  return (
    <svg width={GRID.width} height={GRID.height} viewBox="0 0 850 364" aria-hidden="true" style={{ display: "block" }}>
      <g opacity={after(frame, Math.max(12, fRack - 12)) ? interpolate(p1, [0, 1], [0.55, 1]) : 0.45}>
        <rect x={0} y={0} width={850} height={110} fill={COLORS.ink} />
        <rect x={0} y={0} width={8} height={110} fill={COLORS.highlighter} />
        <text x={24} y={36} fill={COLORS.highlighter} fontFamily={FONTS.display} fontSize={26} fontWeight={900}>
          VNPT IDC HÒA LẠC — ĐỦ 3 CHUẨN TIER III
        </text>
        <text x={24} y={76} fill="#FFFFFF" fontFamily={FONTS.body} fontSize={24} fontWeight={700}>
          23.000 m² · Đủ chuẩn 2021, 2023 và 27/11/2026
        </text>
        <rect x={656} y={24} width={174} height={62} fill={COLORS.highlighter} />
        <text x={743} y={66} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.display} fontSize={36} fontWeight={900}>
          2.000 RACK
        </text>
      </g>

      <g opacity={after(frame, Math.max(20, fTier - 16)) ? interpolate(p2, [0, 1], [0.55, 1]) : 0.45}>
        <rect x={0} y={126} width={850} height={110} fill={COLORS.ink} />
        <rect x={0} y={126} width={8} height={110} fill={COLORS.ochre} />
        <text x={24} y={162} fill={COLORS.ochre} fontFamily={FONTS.display} fontSize={26} fontWeight={900}>
          TOÀN CẢNH HẠ TẦNG DATA CENTER VIỆT NAM
        </text>
        <text x={24} y={202} fill="#FFFFFF" fontFamily={FONTS.body} fontSize={24} fontWeight={700}>
          42 trung tâm (372,75 MW) · 19 cơ sở đạt chuẩn (44%)
        </text>
        <rect x={656} y={150} width={174} height={62} fill={COLORS.ochre} />
        <text x={743} y={192} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.display} fontSize={36} fontWeight={900}>
          CHỈ 2 CƠ SỞ
        </text>
      </g>

      <g opacity={after(frame, Math.max(28, fDec - 12)) ? interpolate(p3, [0, 1], [0.55, 1]) : 0.45}>
        <rect x={0} y={252} width={850} height={112} fill={COLORS.vermilion} />
        <rect x={0} y={252} width={8} height={112} fill={COLORS.highlighter} />
        <text x={24} y={288} fill={COLORS.highlighter} fontFamily={FONTS.display} fontSize={26} fontWeight={900}>
          QUYẾT ĐỊNH 2320/QĐ-TTg (26/11, CÔNG BỐ 27/11)
        </text>
        <text x={24} y={328} fill="#FFFFFF" fontFamily={FONTS.body} fontSize={24} fontWeight={700}>
          Hợp tác quốc tế bán dẫn – điện tử tới năm 2030
        </text>
        <rect x={656} y={276} width={174} height={64} fill={COLORS.ink} />
        <text x={743} y={318} textAnchor="middle" fill={COLORS.highlighter} fontFamily={FONTS.display} fontSize={36} fontWeight={900}>
          7 GIẢI PHÁP
        </text>
      </g>
    </svg>
  );
};

export const S05: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const fTier = cueFrame("s05", "Tier", 262);

  return (
    <SceneShell
      sceneId="S05"
      label="Tin 2A · VNPT IDC Hòa Lạc & Đề án 2320"
      kicker="TIN 2 — HẠ TẦNG SỐ CHUẨN QUỐC TẾ & ĐỀ ÁN BÁN DẪN 2320"
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
        <ArchivalSpotlight
          src={`${ASSET_BASE}/images/data_center.jpg`}
          width={850}
          height={420}
          enterFrame={0}
          archiveLabel="ẢNH TƯ LIỆU 2019"
          creditLine="Trung tâm máy chủ CERN — Wikimedia Commons / SimonWaldherr (CC BY-SA 4.0)"
          pullQuote="VNPT IDC Hòa Lạc là cơ sở thứ 2 tại Việt Nam đủ 3 chuẩn Uptime Tier III"
          quoteHighlight="thứ 2"
          quoteEnterFrame={Math.min(54, Math.max(12, fTier - 18))}
          objectPosition="center 42%"
        />

        <DataCenterTierSvg />

        <SourceBadge source="VnExpress / Báo Chính phủ / Tạp chí Công Thương (27/11/2026)" />
      </div>
    </SceneShell>
  );
};

export default S05;
