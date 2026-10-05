// S03: Big KPI card -- 75.000 new enterprises adopting AI in the past year
import React from "react";
import { Badge, CountUp, HeadlineText, SceneFrame, SourceTag } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s03" as const;

const F = {
  badge: frameOf(ID, "quy"),
  headline: frameOf(ID, "quy"),
  kpi: frameOf(ID, "75.000"),
  firstTime: frameOf(ID, "lần"),
  shift: frameOf(ID, "chuyển"),
};

export const S03: React.FC = () => {
  return (
    <SceneFrame sceneId={ID} glow="rgba(16, 185, 129, 0.22)" glowPosition="center">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          maxWidth: 1540,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Badge text="QUY MÔ THỰC TẾ" at={F.badge} tone="emerald" />
          <SourceTag source="VnEconomy" at={F.badge} />
        </div>

        <HeadlineText
          text="LÀN SÓNG 75.000 DOANH NGHIỆP MỚI GIA NHẬP"
          at={F.headline}
          align="center"
          fontSize={76}
          accent="75.000"
          accentColor={C.emerald}
        />

        {/* Hero KPI Layout */}
        <div
          style={{
            display: "flex",
            gap: 36,
            width: "100%",
            maxWidth: 1400,
            marginTop: 10,
          }}
        >
          {/* Main Giant Stat Card */}
          <div style={{ flex: 1.5 }}>
            <Spoken at={F.kpi} fromY={30} fromScale={0.92}>
              <div
                style={{
                  padding: "44px 50px",
                  borderRadius: 28,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `8px solid ${C.emeraldFill}`,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(16, 185, 129, 0.2)",
                  fontFamily: FONT,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: C.emerald,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  DOANH NGHIỆP MỚI TRONG 1 NĂM QUA
                </div>
                <div
                  style={{
                    marginTop: 16,
                    fontSize: 144,
                    fontWeight: 800,
                    color: C.emerald,
                    lineHeight: 1,
                    letterSpacing: -2,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 16,
                  }}
                >
                  <CountUp at={F.kpi} to={75000} duration={26} />
                  <span style={{ fontSize: 36, fontWeight: 700, color: C.textSoft }}>
                    DN mới
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 20,
                    fontSize: 28,
                    fontWeight: 500,
                    color: C.textSoft,
                    lineHeight: 1.4,
                  }}
                >
                  Bắt đầu ứng dụng AI lần đầu tiên, hình thành xung lực dịch chuyển công nghệ trên diện rộng.
                </div>
              </div>
            </Spoken>
          </div>

          {/* Right Pillar Cards */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              justifyContent: "space-between",
            }}
          >
            <Spoken at={F.firstTime} fromX={30} fromScale={0.94}>
              <div
                style={{
                  padding: "28px 32px",
                  borderRadius: 20,
                  background: C.surfaceHi,
                  border: `1px solid ${C.borderHi}`,
                  fontFamily: FONT,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: C.cyan, textTransform: "uppercase", letterSpacing: 1 }}>
                  Đặc tính làn sóng
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.text, marginTop: 8 }}>
                  Lần Đầu Tiên Ứng Dụng
                </div>
                <div style={{ fontSize: 22, color: C.muted, marginTop: 6 }}>
                  Không chỉ là nâng cấp, mà là 75.000 tổ chức lần đầu mở cửa cho AI vào quy trình.
                </div>
              </div>
            </Spoken>

            <Spoken at={F.shift} fromX={30} fromScale={0.94}>
              <div
                style={{
                  padding: "28px 32px",
                  borderRadius: 20,
                  background: `linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(16, 185, 129, 0.1))`,
                  border: `1px solid ${C.cyanFill}44`,
                  fontFamily: FONT,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: C.emerald, textTransform: "uppercase", letterSpacing: 1 }}>
                  Tác động thị trường
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.text, marginTop: 8 }}>
                  Chuyển Dịch Số Thực Chất
                </div>
                <div style={{ fontSize: 22, color: C.muted, marginTop: 6 }}>
                  Chuyển từ thảo luận thử nghiệm sang tích hợp trực tiếp vào bài toán doanh thu và năng suất.
                </div>
              </div>
            </Spoken>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};

export default S03;
