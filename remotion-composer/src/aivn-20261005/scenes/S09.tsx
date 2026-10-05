// S09: Conclusion & Advice -- Controlled automation vs autonomous fantasy
import React from "react";
import { Badge, HeadlineText, SceneFrame } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s09" as const;

const F = {
  badge: frameOf(ID, "Bài"),
  headline: frameOf(ID, "ranh"),
  controlled: frameOf(ID, "thực"),
  fantasy: frameOf(ID, "ảo"),
};

export const S09: React.FC = () => {
  return (
    <SceneFrame
      sceneId={ID}
      glow="rgba(6, 182, 212, 0.22)"
      glowPosition="center"
      fadeOut={12}
    >
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
          <Badge text="ĐÚC KẾT CHIẾN LƯỢC" at={F.badge} tone="cyan" />
        </div>

        <HeadlineText
          text="RANH GIỚI ỦY QUYỀN LÀ CHÌA KHÓA SỐNG CÒN"
          at={F.headline}
          fontSize={76}
          accent="RANH GIỚI ỦY QUYỀN"
          accentColor={C.cyan}
        />

        {/* Strategic Comparison Lanes */}
        <div
          style={{
            display: "flex",
            gap: 36,
            marginTop: 12,
          }}
        >
          {/* Lane 1: The Winning Strategy (Controlled Pragmatic Automation) */}
          <div style={{ flex: 1.2 }}>
            <Spoken at={F.controlled} fromY={26} fromScale={0.94}>
              <div
                style={{
                  height: 380,
                  boxSizing: "border-box",
                  padding: "36px 40px",
                  borderRadius: 24,
                  background: C.surface,
                  border: `1px solid ${C.emeraldFill}66`,
                  borderTop: `6px solid ${C.emeraldFill}`,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6), 0 0 32px rgba(16, 185, 129, 0.2)",
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
                    HƯỚNG ĐI ĐÚNG ĐẮN • KHUYÊN DÙNG
                  </div>
                  <div
                    style={{
                      fontSize: 42,
                      fontWeight: 800,
                      color: C.text,
                      lineHeight: 1.25,
                      marginTop: 14,
                    }}
                  >
                    Tự Động Hóa Thực Dụng <span style={{ color: C.emerald }}>Có Kiểm Soát</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "18px 22px",
                    borderRadius: 14,
                    background: "rgba(16, 185, 129, 0.12)",
                    border: `1px solid rgba(16, 185, 129, 0.3)`,
                    color: C.textSoft,
                    fontSize: 24,
                    lineHeight: 1.45,
                  }}
                >
                  Xác định rõ phạm vi quyền hạn cho từng tác vụ AI, giữ con người trong vòng lặp phê duyệt (human-in-the-loop).
                </div>
              </div>
            </Spoken>
          </div>

          {/* Lane 2: The Trap (Autonomous Fantasy) */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.fantasy} fromY={26} fromScale={0.94}>
              <div
                style={{
                  height: 380,
                  boxSizing: "border-box",
                  padding: "36px 40px",
                  borderRadius: 24,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `6px solid ${C.muted}`,
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
                      color: C.muted,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    CẦN TRÁNH • NGUY CƠ CAO
                  </div>
                  <div
                    style={{
                      fontSize: 42,
                      fontWeight: 800,
                      color: C.muted,
                      lineHeight: 1.25,
                      marginTop: 14,
                    }}
                  >
                    Ảo Tưởng Tự Trị Hoàn Toàn
                  </div>
                </div>

                <div
                  style={{
                    padding: "18px 22px",
                    borderRadius: 14,
                    background: "rgba(148, 163, 184, 0.08)",
                    border: `1px solid ${C.border}`,
                    color: C.muted,
                    fontSize: 24,
                    lineHeight: 1.45,
                  }}
                >
                  Giao toàn quyền không giám sát cho agent dễ dẫn đến mất kiểm soát hành vi và rủi ro vi phạm an toàn dữ liệu.
                </div>
              </div>
            </Spoken>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};

export default S09;
