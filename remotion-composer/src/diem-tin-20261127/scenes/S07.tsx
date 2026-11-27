import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EditorialBarChart } from "../../components/charts";
import { ArchivalSpotlight } from "../../components/editorial";
import { COLORS, FONTS, MOTION, SceneShell, SourceBadge, ensureFonts } from "../../components/news";
import { ASSET_BASE, after, cueFrame } from "../timing";

ensureFonts();

export const S07: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fFleet = cueFrame("s07", "45", 65);
  const fInit = cueFrame("s07", "500", 176);
  const fMid = cueFrame("s07", "1.200", 189);
  const fPeak = cueFrame("s07", "vượt 1.500", 227);
  const fAcc = cueFrame("s07", "90%", 305);

  const p = spring({ frame: Math.max(0, frame - Math.max(12, fAcc - 18)), fps, config: MOTION.pop });
  const op = after(frame, Math.max(12, fAcc - 18)) ? interpolate(p, [0, 1], [0.55, 1]) : 0.45;

  return (
    <SceneShell
      sceneId="S07"
      label="Tin 3A · 45 Robot ROBOTERA M7 tại Hàng Châu"
      kicker="TIN 3 — 45 ROBOT HÌNH NGƯỜI M7 CHẠY BƯU CỤC HÀNG CHÂU"
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
          src={`${ASSET_BASE}/images/logistics_robot.jpg`}
          width={850}
          height={370}
          enterFrame={0}
          archiveLabel="ẢNH TƯ LIỆU 2023"
          creditLine="Robot tự động hóa kho vận — Wikimedia Commons / Geni (CC BY-SA 4.0)"
          pullQuote="45 robot hình người M7 sau 11 điểm ở 8 thành phố Quảng Đông"
          quoteHighlight="45 robot"
          quoteEnterFrame={Math.min(54, Math.max(12, fFleet - 12))}
          objectPosition="center 46%"
        />

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
            TỐC ĐỘ PHÂN LOẠI TẠI CHINA POST HÀNG CHÂU (BƯU KIỆN / GIỜ)
          </div>
          <EditorialBarChart
            data={[
              { label: "Khởi điểm thử nghiệm (500–600)", value: 600, display: "500–600" },
              { label: "Đạt chuẩn Hàng Châu", value: 1200, display: "1.200" },
              { label: "Sau tối ưu mới nhất", value: 1500, display: "> 1.500" },
            ]}
            enterFrames={[
              Math.max(10, fInit - 24),
              Math.max(16, fMid - 12),
              Math.max(22, fPeak - 12),
            ]}
            growFrames={30}
            direction="h"
            maxValue={1650}
            highlightIndex={2}
            width={850}
            rowHeight={96}
            barColor={COLORS.ink}
          />
        </div>

        <div
          style={{
            padding: "16px 20px",
            backgroundColor: COLORS.ink,
            borderLeft: `8px solid ${COLORS.highlighter}`,
            opacity: op,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ fontFamily: FONTS.body, fontSize: 25, fontWeight: 700, color: "#FFFFFF" }}>
            Hơn 95% phần cứng tự chế tạo
          </div>
          <div style={{ fontFamily: FONTS.display, fontSize: 40, fontWeight: 900, color: COLORS.highlighter, whiteSpace: "nowrap" }}>
            CHÍNH XÁC &gt; 90%
          </div>
        </div>

        <SourceBadge source="Unite.AI / Gasgoo / ROBOTERA (26/11/2026)" />
      </div>
    </SceneShell>
  );
};

export default S07;
