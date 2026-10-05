// S01: Hook -- Split-screen Pacific divide (US caution vs Vietnam acceleration)
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Badge, HeadlineText, SceneFrame } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s01" as const;

const F = {
  badge: frameOf(ID, "Trong"),
  title: frameOf(ID, "đại dương"),
  usCard: frameOf(ID, "dừng bước"),
  vnCard: frameOf(ID, "Việt Nam"),
  surge: frameOf(ID, "tăng tốc"),
};

export const S01: React.FC = () => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, 270], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });

  const backdrop = (
    <>
      <Img
        src={staticFile("aivn-20261005/scene_01_pacific_divide.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: "brightness(0.35) saturate(1.2)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(11,15,25,0.7) 0%, rgba(11,15,25,0.4) 50%, rgba(11,15,25,0.92) 100%)",
        }}
      />
    </>
  );

  return (
    <SceneFrame
      sceneId={ID}
      backdrop={backdrop}
      glow="rgba(6, 182, 212, 0.2)"
      glowPosition="split"
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <Badge text="ĐỐI TRỌNG CÔNG NGHỆ 2026" at={F.badge} tone="cyan" />

        <HeadlineText
          text="HAI BỜ ĐẠI DƯƠNG: THẬN TRỌNG & TĂNG TỐC"
          at={F.title}
          align="center"
          fontSize={82}
          accent="TĂNG TỐC"
          accentColor={C.cyan}
        />

        {/* Split Screen Cards Container */}
        <div
          style={{
            display: "flex",
            gap: 36,
            width: "100%",
            maxWidth: 1600,
            marginTop: 16,
          }}
        >
          {/* Left card: US Safety Frontier */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.usCard} fromX={-30} fromScale={0.94}>
              <div
                style={{
                  height: 380,
                  boxSizing: "border-box",
                  padding: "36px 40px",
                  borderRadius: 24,
                  background: "rgba(17, 24, 39, 0.92)",
                  border: `1px solid ${C.amberFill}66`,
                  borderTop: `6px solid ${C.amberFill}`,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6), 0 0 30px rgba(245, 158, 11, 0.2)",
                  fontFamily: FONT,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      color: C.amber,
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    <span>PHÍA HOA KỲ • FRONTIER LABS</span>
                  </div>
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 800,
                      color: C.text,
                      lineHeight: 1.2,
                      marginTop: 18,
                    }}
                  >
                    Dừng Bước Vì <span style={{ color: C.amber }}>An Toàn</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    background: "rgba(245, 158, 11, 0.12)",
                    border: `1px solid rgba(245, 158, 11, 0.3)`,
                    color: C.textSoft,
                    fontSize: 26,
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  Kiểm thử an toàn nội bộ gióng hồi chuông cảnh báo về deception & vượt quyền tự trị.
                </div>
              </div>
            </Spoken>
          </div>

          {/* Right card: Vietnam Operational Acceleration */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.vnCard} fromX={30} fromScale={0.94}>
              <div
                style={{
                  height: 380,
                  boxSizing: "border-box",
                  padding: "36px 40px",
                  borderRadius: 24,
                  background: "rgba(17, 24, 39, 0.92)",
                  border: `1px solid ${C.cyanFill}66`,
                  borderTop: `6px solid ${C.cyanFill}`,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6), 0 0 30px rgba(6, 182, 212, 0.25)",
                  fontFamily: FONT,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      color: C.cyan,
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    <span>VIỆT NAM • THỰC DỤNG VẬN HÀNH</span>
                  </div>
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 800,
                      color: C.text,
                      lineHeight: 1.2,
                      marginTop: 18,
                    }}
                  >
                    Tăng Tốc Đưa AI Vào <span style={{ color: C.emerald }}>Doanh Nghiệp</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    background: "rgba(6, 182, 212, 0.12)",
                    border: `1px solid rgba(6, 182, 212, 0.3)`,
                    color: C.textSoft,
                    fontSize: 26,
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  Làn sóng áp dụng thực tiễn tăng tốc kỷ lục, biến AI thành công cụ sản xuất thiết yếu.
                </div>
              </div>
            </Spoken>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};

export default S01;
