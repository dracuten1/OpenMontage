import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ArchivalSpotlight } from "../../components/editorial";
import { COLORS, FONTS, MOTION, SceneShell, SourceBadge, ensureFonts } from "../../components/news";
import { ASSET_BASE, after, cueFrame } from "../timing";

ensureFonts();

const GRID = { width: 850, height: 364 } as const;

export const ArtTradeStrip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fArt = cueFrame("s04", "ART", 128);
  const fLow = cueFrame("s04", "35%", 227);
  const fUs = cueFrame("s04", "159,4", 293);

  const p1 = spring({ frame: Math.max(0, frame - Math.max(12, fArt - 12)), fps, config: MOTION.settle });
  const p2 = spring({ frame: Math.max(0, frame - Math.max(20, fLow - 12)), fps, config: MOTION.pop });
  const p3 = spring({ frame: Math.max(0, frame - Math.max(28, fUs - 18)), fps, config: MOTION.pop });

  return (
    <svg width={GRID.width} height={GRID.height} viewBox="0 0 850 364" aria-hidden="true" style={{ display: "block" }}>
      <g opacity={after(frame, Math.max(12, fArt - 12)) ? interpolate(p1, [0, 1], [0.55, 1]) : 0.45}>
        <rect x={0} y={0} width={850} height={110} fill={COLORS.vermilion} />
        <rect x={0} y={0} width={8} height={110} fill={COLORS.highlighter} />
        <text x={24} y={36} fill={COLORS.highlighter} fontFamily={FONTS.display} fontSize={26} fontWeight={900}>
          CẬP NHẬT MỚI 27/11 — THỦ TƯỚNG LÊ MINH HƯNG
        </text>
        <text x={24} y={76} fill="#FFFFFF" fontFamily={FONTS.body} fontSize={24} fontWeight={700}>
          Cơ bản xong đàm phán ART, chờ hoàn tất kỹ thuật
        </text>
        <rect x={636} y={24} width={194} height={62} fill={COLORS.ink} />
        <text x={733} y={66} textAnchor="middle" fill={COLORS.highlighter} fontFamily={FONTS.display} fontSize={36} fontWeight={900}>
          {"< 35%"}
        </text>
      </g>

      <g opacity={after(frame, Math.max(20, fLow - 12)) ? interpolate(p2, [0, 1], [0.55, 1]) : 0.45}>
        <rect x={0} y={126} width={850} height={110} fill={COLORS.ink} />
        <rect x={0} y={126} width={8} height={110} fill={COLORS.ochre} />
        <text x={24} y={162} fill={COLORS.ochre} fontFamily={FONTS.display} fontSize={26} fontWeight={900}>
          LỘ TRÌNH USTR (CHƯA CÓ HIỆU LỰC)
        </text>
        <text x={24} y={202} fill="#FFFFFF" fontFamily={FONTS.body} fontSize={24} fontWeight={700}>
          Đề xuất 25/11 tối đa 35% · Chốt sớm nhất 2/2027
        </text>
        <rect x={636} y={150} width={194} height={62} fill={COLORS.ochre} />
        <text x={733} y={192} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.display} fontSize={36} fontWeight={900}>
          20%
        </text>
      </g>

      <g opacity={after(frame, Math.max(28, fUs - 18)) ? interpolate(p3, [0, 1], [0.55, 1]) : 0.45}>
        <rect x={0} y={252} width={850} height={112} fill={COLORS.ink} />
        <rect x={0} y={252} width={8} height={112} fill={COLORS.highlighter} />
        <text x={24} y={288} fill={COLORS.highlighter} fontFamily={FONTS.display} fontSize={26} fontWeight={900}>
          QUY MÔ XUẤT NHẬP KHẨU 10 THÁNG 2026
        </text>
        <text x={24} y={328} fill="#FFFFFF" fontFamily={FONTS.body} fontSize={24} fontWeight={700}>
          Tổng XNK 1.001 tỷ USD · Thuế lao động 12,5%
        </text>
        <rect x={606} y={276} width={224} height={64} fill={COLORS.highlighter} />
        <text x={718} y={318} textAnchor="middle" fill={COLORS.ink} fontFamily={FONTS.display} fontSize={36} fontWeight={900}>
          159,4 TỶ USD
        </text>
      </g>
    </svg>
  );
};

export const S04: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const fArt = cueFrame("s04", "ART", 128);

  return (
    <SceneShell
      sceneId="S04"
      label="Tin 1B · Cập nhật mới thuế Mỹ ART"
      kicker="CẬP NHẬT MỚI 27/11 — HIỆP ĐỊNH THƯƠNG MẠI ĐỐI ỨNG ART"
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
          src={`${ASSET_BASE}/images/container_port.jpg`}
          width={850}
          height={420}
          enterFrame={0}
          archiveLabel="ẢNH TƯ LIỆU 2013"
          creditLine="Cảng container Tollerort — Wikimedia Commons / Huhu Uet (CC BY-SA 3.0)"
          pullQuote="Thuế Mỹ thực tế sẽ thấp hơn nhiều mức tối đa 35% nhờ tiến triển ART"
          quoteHighlight="thấp hơn nhiều"
          quoteEnterFrame={Math.min(54, Math.max(12, fArt))}
          objectPosition="center 48%"
        />

        <ArtTradeStrip />

        <SourceBadge source="VnExpress / Znews / Cục Thống kê (27/11/2026)" />
      </div>
    </SceneShell>
  );
};

export default S04;
