// S04: Timer counter -- "7 PHÚT / 1 DN" and "8 DN / GIỜ"
import React from "react";
import { Badge, HeadlineText, SceneFrame, SourceTag, TimerClock } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s04" as const;

const F = {
  badge: frameOf(ID, "Nhịp"),
  headline: frameOf(ID, "từng"),
  timer7: frameOf(ID, "7"),
  timer8: frameOf(ID, "8"),
};

export const S04: React.FC = () => {
  return (
    <SceneFrame sceneId={ID} glow="rgba(6, 182, 212, 0.22)">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 22,
          maxWidth: 1540,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Badge text="NHỊP ĐỘ GIA NHẬP" at={F.badge} tone="cyan" />
          <SourceTag source="VnEconomy" at={F.badge} />
        </div>

        <HeadlineText
          text="TỐC ĐỘ LAN TỎA THEO TỪNG PHÚT"
          at={F.headline}
          fontSize={76}
          accent="TỪNG PHÚT"
          accentColor={C.cyan}
        />

        {/* Dual Panel: Dynamic Clock Dial + Rate Cards */}
        <div
          style={{
            display: "flex",
            gap: 48,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          {/* Left: Clock / Radar Dial */}
          <div
            style={{
              padding: "36px 48px",
              borderRadius: 28,
              background: C.surface,
              border: `1px solid ${C.border}`,
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TimerClock at={F.timer7} size={280} />
            <div
              style={{
                marginTop: 20,
                fontSize: 22,
                fontWeight: 600,
                color: C.muted,
                fontFamily: FONT,
                textAlign: "center",
              }}
            >
              Chu kỳ gia nhập thị trường
            </div>
          </div>

          {/* Right: The 2 Pace Cards */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            {/* Card 1: 7 phút / 1 DN */}
            <Spoken at={F.timer7} fromX={30} fromScale={0.94}>
              <div
                style={{
                  padding: "28px 36px",
                  borderRadius: 22,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderLeft: `8px solid ${C.cyanFill}`,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 24px rgba(6, 182, 212, 0.15)",
                  fontFamily: FONT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.cyan, letterSpacing: 1, textTransform: "uppercase" }}>
                    Nhịp độ bình quân
                  </div>
                  <div style={{ fontSize: 44, fontWeight: 800, color: C.text, marginTop: 4 }}>
                    Cứ <span style={{ color: C.cyan }}>7 phút</span> / 1 doanh nghiệp mới
                  </div>
                </div>
                <div style={{ fontSize: 60, fontWeight: 800, color: C.cyan, fontVariantNumeric: "tabular-nums" }}>
                  7&apos;
                </div>
              </div>
            </Spoken>

            {/* Card 2: Hơn 8 doanh nghiệp / giờ */}
            <Spoken at={F.timer8} fromX={30} fromScale={0.94}>
              <div
                style={{
                  padding: "28px 36px",
                  borderRadius: 22,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderLeft: `8px solid ${C.emeraldFill}`,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 24px rgba(16, 185, 129, 0.15)",
                  fontFamily: FONT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.emerald, letterSpacing: 1, textTransform: "uppercase" }}>
                    Quy đổi theo giờ
                  </div>
                  <div style={{ fontSize: 44, fontWeight: 800, color: C.text, marginTop: 4 }}>
                    Hơn <span style={{ color: C.emerald }}>8 doanh nghiệp</span> mỗi giờ
                  </div>
                </div>
                <div style={{ fontSize: 60, fontWeight: 800, color: C.emerald, fontVariantNumeric: "tabular-nums" }}>
                  8+
                </div>
              </div>
            </Spoken>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};

export default S04;
