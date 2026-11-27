import React from "react";
import { EditorialMap } from "../../components/editorial";
import { COLORS, FONTS, SceneShell, SourceBadge, ensureFonts } from "../../components/news";
import { CPTPP_EXPANSION_ISO } from "../mapData";
import { cueFrame } from "../timing";

ensureFonts();

export const S03: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const fUae = cueFrame("s03", "UAE", 116);
  const fIndo = cueFrame("s03", "Indonesia", 137);
  const fPhi = cueFrame("s03", "Philippines", 164);
  const fGdp = cueFrame("s03", "14%", 231);

  return (
    <SceneShell
      sceneId="S03"
      label="Tin 1A · CPTPP mở rộng tại Hà Nội"
      kicker="TIN 1 — HỘI ĐỒNG CPTPP LẦN THỨ 11 TẠI HÀ NỘI (27/11)"
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
        <EditorialMap
          width={850}
          height={640}
          center={[88, 12]}
          scale={500}
          endCenter={[90, 10]}
          endScale={540}
          detail="50m"
          highlightIso={CPTPP_EXPANSION_ISO}
          title="CPTPP KHỞI ĐỘNG ĐÀM PHÁN KẾT NẠP 3 NỀN KINH TẾ MỚI"
          source="VnExpress / Báo Chính phủ (27/11/2026)"
          routes={[
            {
              id: "hn-uae",
              from: [105.85, 21.02],
              to: [54.37, 24.47],
              color: COLORS.highlighter,
              enterFrame: Math.max(12, fUae - 12),
              drawFrames: 38,
            },
            {
              id: "hn-indo",
              from: [105.85, 21.02],
              to: [106.85, -6.2],
              color: COLORS.vermilion,
              enterFrame: Math.max(18, fIndo - 8),
              drawFrames: 34,
            },
            {
              id: "hn-phi",
              from: [105.85, 21.02],
              to: [120.98, 14.6],
              color: COLORS.highlighter,
              enterFrame: Math.max(24, fPhi - 8),
              drawFrames: 34,
            },
          ]}
          pins={[
            {
              id: "hn-pin",
              coords: [105.85, 21.02],
              label: "HÀ NỘI (CHỦ TỊCH 2026)",
              sublabel: "Hội đồng CPTPP lần 11",
              color: COLORS.vermilion,
              enterFrame: 12,
              pulse: true,
              status: "info",
              labelOffset: [-150, -96],
            },
            {
              id: "uae-pin",
              coords: [54.37, 24.47],
              label: "UAE",
              sublabel: "Cửa ngõ Trung Đông",
              color: COLORS.highlighter,
              enterFrame: Math.max(12, fUae - 12),
              status: "info",
              labelOffset: [18, -28],
            },
            {
              id: "indo-pin",
              coords: [106.85, -6.2],
              label: "INDONESIA",
              sublabel: "Đàm phán gia nhập",
              color: COLORS.vermilion,
              enterFrame: Math.max(18, fIndo - 8),
              status: "info",
              labelOffset: [-220, 16],
            },
            {
              id: "phi-pin",
              coords: [120.98, 14.6],
              label: "PHILIPPINES",
              sublabel: "Mở rộng chuỗi ĐNA",
              color: COLORS.highlighter,
              enterFrame: Math.max(24, fPhi - 8),
              status: "info",
              labelOffset: [-200, 18],
            },
          ]}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div style={{ backgroundColor: COLORS.ink, borderTop: `6px solid ${COLORS.highlighter}`, padding: "14px 16px" }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 42, fontWeight: 900, color: COLORS.highlighter }}>
              600 TRIỆU
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>
              Người tiêu dùng hiện tại
            </div>
          </div>
          <div style={{ backgroundColor: COLORS.ink, borderTop: `6px solid ${COLORS.vermilion}`, padding: "14px 16px" }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 42, fontWeight: 900, color: COLORS.vermilion }}>
              14% GDP
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>
              Quy mô kinh tế toàn cầu
            </div>
          </div>
          <div style={{ backgroundColor: COLORS.ink, borderTop: `6px solid ${COLORS.highlighter}`, padding: "14px 16px" }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 42, fontWeight: 900, color: COLORS.highlighter }}>
              GIỮA 2027
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>
              Mục tiêu nâng cấp khối
            </div>
          </div>
        </div>

        <SourceBadge source="VnExpress / Báo Chính phủ (27/11/2026) · Thúc đẩy Uruguay & CSO tại Nhật" />
      </div>
    </SceneShell>
  );
};

export default S03;
