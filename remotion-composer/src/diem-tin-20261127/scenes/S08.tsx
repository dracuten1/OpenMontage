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

export const S08: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fUnaff = cueFrame("s08", "12%", 135);
  const fUpskill = cueFrame("s08", "50%", 215);
  const fSemi = cueFrame("s08", "70%", 271);

  const p = spring({ frame: Math.max(0, frame - Math.max(18, fSemi - 16)), fps, config: MOTION.pop });
  const op = after(frame, Math.max(18, fSemi - 16)) ? interpolate(p, [0, 1], [0.55, 1]) : 0.45;

  return (
    <SceneShell
      sceneId="S08"
      label="Tin 3B · Khảo sát nhân lực IT Việt trước bão AI"
      kicker="TIN 3B — KHẢO SÁT NHÂN LỰC CÔNG NGHỆ VIỆT NAM (27/11)"
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <HeroTitle
            text="CHỈ 12% DÂN IT KHÔNG BỊ ẢNH HƯỞNG"
            highlight="12%"
            highlightColor={COLORS.vermilion}
            sub="ÁP LỰC TỰ ĐỘNG HÓA GÕ CỬA VIỆC LÀM VIỆT NAM"
          />
          <VerdictStamp text="MANPOWER Q4/2026: 52% DOANH NGHIỆP CẮT GIẢM DO TỰ ĐỘNG HÓA" enterFrame={Math.min(28, fUnaff)} color={COLORS.ink} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
            PHẢN ỨNG CỦA NHÂN SỰ IT – PHẦN MỀM VIỆT NAM (%)
          </div>
          <EditorialBarChart
            data={[
              { label: "Không bị ảnh hưởng bởi AI", value: 12, display: "12%" },
              { label: "Phải học thêm để tránh sa thải", value: 50, display: "~50%" },
              { label: "Đổi nghề hoặc làm thêm việc khác", value: 20, display: "> 20%" },
              { label: "Đang tìm việc mới mảng công nghệ", value: 10, display: "10%" },
            ]}
            enterFrames={[
              Math.max(10, fUnaff - 12),
              Math.max(16, fUpskill - 12),
              Math.max(20, fUpskill),
              Math.max(24, fUpskill + 10),
            ]}
            growFrames={30}
            direction="h"
            maxValue={60}
            highlightIndex={0}
            width={850}
            rowHeight={96}
            barColor={COLORS.ink}
          />
        </div>

        <div
          style={{
            padding: "18px 22px",
            backgroundColor: COLORS.ink,
            borderLeft: `8px solid ${COLORS.vermilion}`,
            opacity: op,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ fontFamily: FONTS.body, fontSize: 25, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.3 }}>
            Lớp cao học bán dẫn TP.HCM xuất thân từ IT, điện
          </div>
          <div style={{ fontFamily: FONTS.display, fontSize: 48, fontWeight: 900, color: COLORS.highlighter, whiteSpace: "nowrap" }}>
            &gt; 70%
          </div>
        </div>

        <SourceBadge source="VnExpress / ManpowerGroup / TopCV (27/11/2026) · Đề án QĐ 2320 tới 2030" />
      </div>
    </SceneShell>
  );
};

export default S08;
