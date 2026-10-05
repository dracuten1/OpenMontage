// S01: Hook -- 125B on Bedroom PC (Split contrast: Cloud datacenter vs Bedroom PC)
import React from "react";
import { staticFile, useCurrentFrame } from "remotion";
import { Badge, HeadlineText, SceneBackground, SceneFrame, SourceTag } from "../components";
import { C, FONT, MONO_FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s01" as const;

const F = {
  badge: frameOf(ID, "Một"),
  hero: frameOf(ID, "125"),
  cloudCard: frameOf(ID, "siêu"),
  pcCard: frameOf(ID, "PC"),
  stream: frameOf(ID, "tạo"),
  reading: frameOf(ID, "tốc"),
};

export const S01: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SceneFrame
      sceneId={ID}
      backdrop={
        <SceneBackground
          imageSrc={staticFile("aivn-20261006/images/scene_01_hero_125b_gaming_pc.png")}
          glowColor={C.glowBlue}
          glowCoords="50% 25%"
        />
      }
      glowPosition="center"
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 16,
          paddingTop: 10,
        }}
      >
        <Badge text="BƯỚC ĐỘT PHÁ LOCAL AI 2026" at={F.badge} tone="blue" />

        <HeadlineText
          text="125 TỶ THAM SỐ TRÊN PC GAMING PHÒNG NGỦ"
          at={F.hero}
          align="center"
          fontSize={74}
          accent="125 TỶ THAM SỐ"
          accentColor={C.blue}
        />

        {/* Split Screen Contrast Cards */}
        <div
          style={{
            display: "flex",
            gap: 36,
            width: "100%",
            maxWidth: 1540,
            marginTop: 18,
          }}
        >
          {/* Left card: Enterprise Cloud Servers */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.cloudCard} fromX={-30} fromScale={0.94}>
              <div
                style={{
                  height: 340,
                  boxSizing: "border-box",
                  padding: "32px 36px",
                  borderRadius: 24,
                  background: "rgba(22, 30, 46, 0.92)",
                  border: `1px solid ${C.border}`,
                  borderTop: `6px solid ${C.redFill}`,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6), 0 0 30px rgba(239, 68, 68, 0.15)",
                  fontFamily: FONT,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        padding: "4px 14px",
                        borderRadius: 999,
                        background: `${C.redFill}22`,
                        border: `1px solid ${C.redFill}55`,
                        color: C.red,
                        fontWeight: 700,
                        fontSize: 20,
                        letterSpacing: 1,
                      }}
                    >
                      TRUYỀN THỐNG
                    </span>
                    <span style={{ fontSize: 28, color: C.red, fontWeight: 800 }}>$$$ ĐẮT ĐỎ</span>
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: C.text, marginTop: 14 }}>
                    Siêu Máy Chủ Đám Mây
                  </div>
                  <div style={{ fontSize: 24, color: C.muted, marginTop: 8 }}>
                    Cụm 8x H100 / Enterprise Cluster
                  </div>
                </div>

                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    background: "rgba(15, 23, 42, 0.8)",
                    border: `1px solid ${C.borderSubtle}`,
                    fontSize: 22,
                    color: C.textSoft,
                  }}
                >
                  Chi phí thuê cụm server hàng nghìn USD / tháng
                </div>
              </div>
            </Spoken>
          </div>

          {/* Right card: Bedroom Gaming PC */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.pcCard} fromX={30} fromScale={0.94}>
              <div
                style={{
                  height: 340,
                  boxSizing: "border-box",
                  padding: "32px 36px",
                  borderRadius: 24,
                  background: "rgba(22, 30, 46, 0.92)",
                  border: `1px solid ${C.border}`,
                  borderTop: `6px solid ${C.emeraldFill}`,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6), 0 0 35px rgba(16, 185, 129, 0.22)",
                  fontFamily: FONT,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        padding: "4px 14px",
                        borderRadius: 999,
                        background: `${C.emeraldFill}22`,
                        border: `1px solid ${C.emeraldFill}55`,
                        color: C.emerald,
                        fontWeight: 700,
                        fontSize: 20,
                        letterSpacing: 1,
                      }}
                    >
                      BƯỚC ĐỘT PHÁ
                    </span>
                    <span style={{ fontSize: 28, color: C.emerald, fontWeight: 800 }}>OFFLINE 100%</span>
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: C.text, marginTop: 14 }}>
                    PC Gaming Phòng Ngủ
                  </div>
                  <div style={{ fontSize: 24, color: C.emerald, marginTop: 8, fontWeight: 600 }}>
                    1x GPU Tiêu Dùng (12GB VRAM + 32GB RAM)
                  </div>
                </div>

                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    background: "rgba(15, 23, 42, 0.8)",
                    border: `1px solid ${C.emeraldFill}44`,
                    fontSize: 22,
                    color: C.text,
                    fontWeight: 600,
                  }}
                >
                  Chạy mượt mà, quyền riêng tư dữ liệu tuyệt đối
                </div>
              </div>
            </Spoken>
          </div>
        </div>

        {/* Real-time Token Streaming Indicator */}
        <div style={{ width: "100%", maxWidth: 1540, marginTop: 14 }}>
          <Spoken at={F.stream} fromY={20}>
            <div
              style={{
                padding: "16px 28px",
                borderRadius: 16,
                background: "rgba(11, 15, 25, 0.92)",
                border: `1px solid ${C.blueFill}66`,
                boxShadow: "0 8px 30px rgba(0,0,0,0.5), 0 0 20px rgba(37, 99, 235, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: MONO_FONT,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: C.emerald,
                    boxShadow: `0 0 12px ${C.emerald}`,
                  }}
                />
                <span style={{ color: C.textSoft, fontSize: 22, fontFamily: FONT }}>
                  Tốc độ sinh chữ:
                </span>
                <span style={{ color: C.blue, fontSize: 26, fontWeight: 800 }}>
                  100 – 140 tok/s
                </span>
              </div>
              <div style={{ color: C.amber, fontSize: 22, fontWeight: 700, fontFamily: FONT }}>
                ⚡ VƯỢT XA TỐC ĐỘ ĐỌC CỦA MẮT NGƯỜI
              </div>
            </div>
          </Spoken>
        </div>

        <SourceTag
          source="Niko1221/Strata (MIT, C++) & Qwen 3.8 Flash-Next"
          at={F.pcCard}
          style={{ marginTop: 6 }}
        />
      </div>
    </SceneFrame>
  );
};

export default S01;
