import React from "react";
import { FlowTimeline } from "../../components/editorial";
import { COLORS, HeroTitle, SceneShell, SourceBadge, ensureFonts } from "../../components/news";
import { cueFrame } from "../timing";

ensureFonts();

export const S02: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const fCptpp = cueFrame("s02", "Đầu tiên", 105);
  const fInfra = cueFrame("s02", "Thứ hai", 185);
  const fRobot = cueFrame("s02", "Thứ ba", 255);
  const fGold = cueFrame("s02", "Thứ tư", 335);

  return (
    <SceneShell
      sceneId="S02"
      label="Bản đồ Điểm Tin 27/11"
      kicker="BẢN ĐỒ ĐIỂM TIN — NGÀY 27/11/2026"
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
        <HeroTitle
          text="BỐN CHUYỂN ĐỘNG HÔM NAY"
          highlight="BỐN CHUYỂN ĐỘNG"
          highlightColor={COLORS.highlighter}
          sub="TÁC ĐỘNG TRỰC TIẾP VÍ TIỀN & VIỆC LÀM NGƯỜI VIỆT"
        />

        <FlowTimeline
          width={850}
          gap={14}
          steps={[
            {
              id: "digest-1",
              tag: "TIN 1 — THƯƠNG MẠI & THUẾ MỸ",
              title: "CPTPP mở rộng & Cập nhật mới ART",
              detail: "Đàm phán kết nạp thêm 3 nước; thuế Mỹ sẽ thấp hơn nhiều 35%.",
              metric: "+3 NƯỚC",
              color: COLORS.vermilion,
              startFrame: Math.max(10, fCptpp - 14),
              endFrame: Math.max(11, fInfra - 8),
            },
            {
              id: "digest-2",
              tag: "TIN 2 — HẠ TẦNG SỐ & BÁN DẪN",
              title: "VNPT Hòa Lạc đạt trọn 3 chuẩn Tier III",
              detail: "Đối lập cú sốc Nvidia tạm dừng máy chủ AI tới 4 nước ASEAN.",
              metric: "TIER III",
              color: COLORS.ink,
              startFrame: Math.max(18, fInfra - 8),
              endFrame: Math.max(19, fRobot - 8),
            },
            {
              id: "digest-3",
              tag: "TIN 3 — ROBOT & LAO ĐỘNG IT",
              title: "45 robot Hàng Châu chạy 1.500 gói/giờ",
              detail: "Làn sóng tự động hóa đẩy nhân sự IT Việt tái đào tạo.",
              metric: "1.500/GIỜ",
              color: COLORS.vermilion,
              startFrame: Math.max(24, fRobot - 8),
              endFrame: Math.max(25, fGold - 8),
            },
            {
              id: "digest-4",
              tag: "TIN 4 — CHỨNG KHOÁN & VÀNG SJC",
              title: "VN-Index 1.653,90 & Vàng 136 triệu",
              detail: "Dầu khí dẫn dắt giữa cảnh báo Mỹ–Iran quanh Núi Pickaxe.",
              metric: "136 TRIỆU",
              color: COLORS.ochre,
              startFrame: Math.max(30, fGold - 8),
              endFrame: Math.max(40, fGold + 45),
            },
          ]}
          settleAllFrame={Math.max(45, fGold + 36)}
        />

        <SourceBadge source="Tổng hợp kiểm chứng từ VnExpress, Báo Chính phủ, Dân trí, Thời báo Tài chính" />
      </div>
    </SceneShell>
  );
};

export default S02;
