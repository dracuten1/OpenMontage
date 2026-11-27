import React from "react";
import { EditorialMap } from "../../components/editorial";
import { COLORS, FONTS, SceneShell, SourceBadge, ensureFonts } from "../../components/news";
import { NVIDIA_ASEAN_PAUSE_ISO } from "../mapData";
import { cueFrame } from "../timing";

ensureFonts();

export const S06: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const fNvidia = cueFrame("s06", "Nvidia", 58);
  const fFour = cueFrame("s06", "4", 123);
  const fVn = cueFrame("s06", "Việt", 237);

  return (
    <SceneShell
      sceneId="S06"
      label="Tin 2B · Nvidia dừng máy chủ ASEAN"
      kicker="TIN 2B — ĐỐI TÁC NVIDIA TẠM DỪNG GIAO MÁY CHỦ AI TỚI 4 NƯỚC ĐNA"
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
        <EditorialMap
          width={850}
          height={640}
          center={[106, 6]}
          scale={760}
          endCenter={[107, 4]}
          endScale={840}
          detail="50m"
          highlightIso={NVIDIA_ASEAN_PAUSE_ISO}
          title="DELL & SUPERMICRO DỪNG GIAO MÁY CHỦ AI TỚI 4 NƯỚC ASEAN"
          source="Dân trí / Lao Động / Financial Times (27/11/2026)"
          pins={[
            {
              id: "th-pin",
              coords: [100.5, 13.75],
              label: "THÁI LAN",
              sublabel: "Tạm dừng giao hàng",
              color: COLORS.vermilion,
              enterFrame: Math.max(12, fNvidia - 12),
              status: "restricted",
              labelOffset: [-190, -34],
            },
            {
              id: "my-pin",
              coords: [101.69, 3.14],
              label: "MALAYSIA",
              sublabel: "Dự án tỷ USD chững lại",
              color: COLORS.vermilion,
              enterFrame: Math.max(18, fFour - 10),
              pulse: true,
              status: "restricted",
              labelOffset: [-270, -10],
            },
            {
              id: "sg-pin",
              coords: [103.82, 1.35],
              label: "SINGAPORE (104 TỶ)",
              sublabel: "Doanh thu 2025 (+72%)",
              color: COLORS.vermilion,
              enterFrame: Math.max(24, fFour + 12),
              status: "restricted",
              labelOffset: [26, -34],
            },
            {
              id: "id-pin",
              coords: [106.85, -6.2],
              label: "INDONESIA",
              sublabel: "Chờ hướng dẫn Mỹ",
              color: COLORS.vermilion,
              enterFrame: Math.max(30, fVn - 30),
              status: "restricted",
              labelOffset: [24, 34],
            },
            {
              id: "vn-pin",
              coords: [105.85, 21.02],
              label: "VIỆT NAM (42 DC)",
              sublabel: "Cơ hội kèm siết xuất xứ",
              color: COLORS.highlighter,
              enterFrame: Math.max(28, fVn - 12),
              status: "info",
              labelOffset: [16, -24],
            },
          ]}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div style={{ backgroundColor: COLORS.ink, borderTop: `6px solid ${COLORS.vermilion}`, padding: "14px 16px" }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 42, fontWeight: 900, color: COLORS.vermilion }}>
              4 NƯỚC ĐNA
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>
              Bị tạm dừng máy chủ AI
            </div>
          </div>
          <div style={{ backgroundColor: COLORS.ink, borderTop: `6px solid ${COLORS.highlighter}`, padding: "14px 16px" }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 42, fontWeight: 900, color: COLORS.highlighter }}>
              90 NGÀY
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>
              Hạn rà soát giấy phép Mỹ
            </div>
          </div>
          <div style={{ backgroundColor: COLORS.ink, borderTop: `6px solid ${COLORS.vermilion}`, padding: "14px 16px" }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 42, fontWeight: 900, color: COLORS.vermilion }}>
              42 TRUNG TÂM
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>
              372,75 MW · Siết xuất xứ
            </div>
          </div>
        </div>

        <SourceBadge source="Dân trí / Lao Động / Financial Times (27/11/2026)" />
      </div>
    </SceneShell>
  );
};

export default S06;
