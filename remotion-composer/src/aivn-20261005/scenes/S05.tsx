// S05: Total 245.000 enterprises using AI in Vietnam
import React from "react";
import { Badge, CountUp, HeadlineText, SceneFrame, SourceTag } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s05" as const;

const F = {
  badge: frameOf(ID, "bùng"),
  headline: frameOf(ID, "tổng"),
  totalKpi: frameOf(ID, "245.000"),
  essential: frameOf(ID, "sản"),
};

export const S05: React.FC = () => {
  return (
    <SceneFrame sceneId={ID} glow="rgba(6, 182, 212, 0.25)" glowPosition="center">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          maxWidth: 1540,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Badge text="CỘT MỐC TOÀN DIỆN" at={F.badge} tone="cyan" />
          <SourceTag source="VnEconomy" at={F.badge} />
        </div>

        <HeadlineText
          text="TỔNG CỘNG GẦN 245.000 DOANH NGHIỆP DÙNG AI"
          at={F.headline}
          align="center"
          fontSize={76}
          accent="245.000"
          accentColor={C.cyan}
        />

        {/* Big Ecosystem Milestone Banner */}
        <div
          style={{
            width: "100%",
            maxWidth: 1400,
            marginTop: 10,
          }}
        >
          <Spoken at={F.totalKpi} fromY={30} fromScale={0.93}>
            <div
              style={{
                padding: "44px 56px",
                borderRadius: 28,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderTop: `8px solid ${C.cyanFill}`,
                boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(6, 182, 212, 0.2)",
                fontFamily: FONT,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: C.cyan,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                QUY MÔ VẬN HÀNH THỰC TẾ TOÀN QUỐC
              </div>

              <div
                style={{
                  marginTop: 16,
                  fontSize: 152,
                  fontWeight: 800,
                  color: C.cyan,
                  lineHeight: 1,
                  letterSpacing: -2,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                }}
              >
                <span style={{ fontSize: 64, fontWeight: 700, color: C.textSoft }}>Gần</span>
                <CountUp at={F.totalKpi} to={245000} duration={28} />
                <span style={{ fontSize: 40, fontWeight: 700, color: C.textSoft }}>DN</span>
              </div>

              {/* Sub-banner: Essential Production Tool */}
              <div style={{ marginTop: 28, width: "100%", maxWidth: 1000 }}>
                <Spoken at={F.essential} fromY={16}>
                  <div
                    style={{
                      padding: "16px 28px",
                      borderRadius: 16,
                      background: "rgba(16, 185, 129, 0.12)",
                      border: `1px solid rgba(16, 185, 129, 0.35)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 26, fontWeight: 700, color: C.emerald }}>
                      AI ĐÃ TRỞ THÀNH CÔNG CỤ SẢN XUẤT THIẾT YẾU
                    </span>
                  </div>
                </Spoken>
              </div>
            </div>
          </Spoken>
        </div>
      </div>
    </SceneFrame>
  );
};

export default S05;
