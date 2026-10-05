// S02: Stat comparison -- 26% vs 18% (44% growth) with animated bar reveal
import React from "react";
import { Badge, ComparisonBarItem, HeadlineText, SceneFrame, SourceTag } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s02" as const;

const F = {
  badge: frameOf(ID, "AWS"),
  source: frameOf(ID, "VnEconomy"),
  val26: frameOf(ID, "26%"),
  val18: frameOf(ID, "18%"),
  growth: frameOf(ID, "44%"),
};

export const S02: React.FC = () => {
  return (
    <SceneFrame sceneId={ID} glow="rgba(6, 182, 212, 0.22)">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          maxWidth: 1540,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Badge text="BÁO CÁO VNECONOMY & AWS" at={F.badge} tone="cyan" />
          <SourceTag source="VnEconomy / AWS AI Study" at={F.source} />
        </div>

        <HeadlineText
          text="26% DOANH NGHIỆP VIỆT NAM ĐÃ ỨNG DỤNG AI"
          at={F.val26}
          fontSize={76}
          accent="26%"
          accentColor={C.cyan}
        />

        {/* Data Visualization Container */}
        <div
          style={{
            display: "flex",
            gap: 40,
            alignItems: "stretch",
            marginTop: 12,
          }}
        >
          {/* Left: Bar comparisons */}
          <div
            style={{
              flex: 1.6,
              padding: "36px 40px",
              borderRadius: 24,
              background: C.surface,
              border: `1px solid ${C.border}`,
              boxShadow: "0 12px 36px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <ComparisonBarItem
              label="Tỷ lệ ứng dụng AI hiện tại"
              year="2026"
              value={26}
              at={F.val26}
              tone="cyan"
            />

            <ComparisonBarItem
              label="Tỷ lệ năm trước"
              year="2025"
              value={18}
              at={F.val18}
              tone="neutral"
            />
          </div>

          {/* Right: Growth highlight callout */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.growth} fromY={30} fromScale={0.94}>
              <div
                style={{
                  height: "100%",
                  boxSizing: "border-box",
                  padding: "36px 40px",
                  borderRadius: 24,
                  background: `linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(16, 185, 129, 0.08))`,
                  border: `1px solid ${C.cyanFill}66`,
                  borderTop: `6px solid ${C.emeraldFill}`,
                  boxShadow: "0 12px 36px rgba(0,0,0,0.5), 0 0 32px rgba(16, 185, 129, 0.2)",
                  fontFamily: FONT,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: C.emerald,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    TỐC ĐỘ BỨT PHÁ
                  </div>
                  <div
                    style={{
                      marginTop: 14,
                      fontSize: 104,
                      fontWeight: 800,
                      color: C.emerald,
                      lineHeight: 1,
                      letterSpacing: -1,
                    }}
                  >
                    +44%
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 30,
                      fontWeight: 700,
                      color: C.text,
                    }}
                  >
                    Tăng trưởng hàng năm
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 24,
                    color: C.textSoft,
                    lineHeight: 1.4,
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 16,
                  }}
                >
                  Tốc độ mở rộng ấn tượng đưa Việt Nam vào nhóm thị trường ứng dụng AI năng động nhất khu vực.
                </div>
              </div>
            </Spoken>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};

export default S02;
