import React from "react";
import { ComparisonSplit } from "../../components/editorial";
import { COLORS, FONTS, SceneShell, SourceBadge, ensureFonts } from "../../components/news";
import { cueFrame } from "../timing";

ensureFonts();

export const S11: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const fOptA = cueFrame("s11", "nâng kỹ", 149);
  const fOptB = cueFrame("s11", "chọn B:", 262);

  return (
    <SceneShell
      sceneId="S11"
      label="Tranh luận A vs B hướng tới người Việt"
      kicker="CHIẾN LƯỢC CHO NGƯỜI VIỆT — BẠN CHỌN PHE NÀO?"
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
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 48,
            fontWeight: 900,
            color: COLORS.ink,
            lineHeight: 1.04,
            textTransform: "uppercase",
          }}
        >
          NÂNG KỸ NĂNG <span style={{ backgroundColor: COLORS.vermilion, color: "#FFFFFF", padding: "0 10px" }}>2320</span> HAY GIỮ TIỀN MẶT?
        </div>

        <ComparisonSplit
          width={850}
          height={640}
          dividerLabel="VS"
          settleAllFrame={365}
          left={{
            kicker: "CHỌN A — CHỦ ĐỘNG TĂNG TỐC",
            headline: "Đón sóng bán dẫn & mở thị trường CPTPP",
            metric: "50%",
            bullets: [
              "Theo nhóm 50% IT học thêm sang bán dẫn (QĐ 2320)",
              "Khai thác 3 cửa ngõ CPTPP: UAE, Indonesia, Philippines",
              "Đón đầu dòng vốn hạ tầng số chuẩn quốc tế",
            ],
            color: COLORS.vermilion,
            enterFrame: Math.max(12, fOptA - 18),
            endFrame: Math.max(13, fOptB),
          }}
          right={{
            kicker: "CHỌN B — PHÒNG THỦ CHẮC TIỀN",
            headline: "Giữ thanh khoản, đợi ký chính thức ART",
            metric: "136TR",
            bullets: [
              "Tránh đuổi vàng SJC 136 triệu khi chênh 5 triệu/lượng",
              "Thận trọng cổ phiếu khi thanh khoản HoSE giảm 30%",
              "Chờ chốt kỹ thuật ART kéo thuế Mỹ thấp hơn 35%",
            ],
            color: COLORS.ink,
            enterFrame: Math.max(24, fOptB - 12),
            endFrame: 375,
          }}
        />

        <div
          style={{
            padding: "16px 20px",
            backgroundColor: COLORS.highlighter,
            borderLeft: `8px solid ${COLORS.ink}`,
            fontFamily: FONTS.body,
            fontSize: 27,
            fontWeight: 900,
            color: COLORS.ink,
          }}
        >
          Với túi tiền và công việc của bạn tới 2030: chọn A hay B hợp lý hơn?
        </div>

        <SourceBadge source="Tổng hợp Ký Chủ Điểm Tin (27/11/2026)" />
      </div>
    </SceneShell>
  );
};

export default S11;
