// S06: Hardware Specs & Local AI Data Sovereignty (12GB VRAM, 32GB RAM, 80GB SSD, $0.15 Cloud vs Privacy)
import React from "react";
import { staticFile } from "remotion";
import { Badge, HeadlineText, SceneBackground, SceneFrame, SourceTag } from "../components";
import { C, FONT, MONO_FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s06" as const;

const F = {
  badge: frameOf(ID, "Strata"),
  vram: frameOf(ID, "12"),
  ram: frameOf(ID, "32"),
  ssd: frameOf(ID, "80"),
  cloud: frameOf(ID, "0,15"),
  privacy: frameOf(ID, "quyền"),
  notCost: frameOf(ID, "không"),
};

export const S06: React.FC = () => {
  return (
    <SceneFrame
      sceneId={ID}
      backdrop={
        <SceneBackground
          imageSrc={staticFile("aivn-20261006/images/scene_06_hardware_specs_privacy_shield.png")}
          glowColor={C.glowEmerald}
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
        <Badge text="CẤU HÌNH YÊU CẦU & BẢN CHẤT LOCAL AI" at={F.badge} tone="emerald" />

        <HeadlineText
          text="CHỦ QUYỀN DỮ LIỆU & QUYỀN RIÊNG TƯ TUYỆT ĐỐI"
          at={F.badge}
          align="center"
          fontSize={68}
          accent="CHỦ QUYỀN DỮ LIỆU"
          accentColor={C.emerald}
        />

        {/* 3 Hardware Prerequisite Spec Chips */}
        <div
          style={{
            display: "flex",
            gap: 24,
            width: "100%",
            maxWidth: 1540,
            marginTop: 14,
          }}
        >
          {/* Chip 1: 12 GB VRAM */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.vram} fromY={24} fromScale={0.94}>
              <div
                style={{
                  padding: "26px 30px",
                  borderRadius: 20,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `5px solid ${C.blueFill}`,
                  boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 20px ${C.glowBlue}`,
                }}
              >
                <div style={{ fontSize: 18, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>
                  GPU BỘ NHỚ ĐỒ HỌA
                </div>
                <div style={{ fontSize: 56, fontWeight: 800, color: C.blue, fontFamily: MONO_FONT, marginTop: 8 }}>
                  12 GB
                </div>
                <div style={{ fontSize: 22, color: C.text, fontWeight: 600, marginTop: 4 }}>
                  VRAM Card Tiêu Dùng
                </div>
              </div>
            </Spoken>
          </div>

          {/* Chip 2: 32 GB RAM */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.ram} fromY={24} fromScale={0.94}>
              <div
                style={{
                  padding: "26px 30px",
                  borderRadius: 20,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `5px solid ${C.emeraldFill}`,
                  boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 20px ${C.glowEmerald}`,
                }}
              >
                <div style={{ fontSize: 18, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>
                  BỘ NHỚ HỆ THỐNG
                </div>
                <div style={{ fontSize: 56, fontWeight: 800, color: C.emerald, fontFamily: MONO_FONT, marginTop: 8 }}>
                  32 GB
                </div>
                <div style={{ fontSize: 22, color: C.text, fontWeight: 600, marginTop: 4 }}>
                  System RAM (DDR4 / DDR5)
                </div>
              </div>
            </Spoken>
          </div>

          {/* Chip 3: 80 GB SSD */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.ssd} fromY={24} fromScale={0.94}>
              <div
                style={{
                  padding: "26px 30px",
                  borderRadius: 20,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `5px solid ${C.amberFill}`,
                  boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 20px ${C.glowAmber}`,
                }}
              >
                <div style={{ fontSize: 18, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>
                  LƯU TRỮ TRỌNG SỐ
                </div>
                <div style={{ fontSize: 56, fontWeight: 800, color: C.amber, fontFamily: MONO_FONT, marginTop: 8 }}>
                  80 GB
                </div>
                <div style={{ fontSize: 22, color: C.text, fontWeight: 600, marginTop: 4 }}>
                  SSD Ổ Cứng Khả Dụng
                </div>
              </div>
            </Spoken>
          </div>
        </div>

        {/* Cloud Price vs Privacy Shield Banner */}
        <div style={{ width: "100%", maxWidth: 1540, marginTop: 14 }}>
          {/* Cloud Price Chip */}
          <Spoken at={F.cloud} fromY={16}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 20px",
                borderRadius: 12,
                background: "rgba(15, 23, 42, 0.8)",
                border: `1px solid ${C.borderSubtle}`,
                color: C.muted,
                fontSize: 20,
                marginBottom: 12,
              }}
            >
              <span>Tham chiếu Cloud API:</span>
              <span style={{ color: C.text, fontWeight: 700, fontFamily: MONO_FONT }}>
                $0.15 / 1M input tokens
              </span>
              <span>(Cực kỳ rẻ)</span>
            </div>
          </Spoken>

          {/* Core Privacy Verdict Banner */}
          <Spoken at={F.privacy} fromY={20} fromScale={0.96}>
            <div
              style={{
                padding: "24px 36px",
                borderRadius: 20,
                background: "linear-gradient(90deg, rgba(16, 185, 129, 0.16) 0%, rgba(37, 99, 235, 0.16) 100%)",
                border: `2px solid ${C.emeraldFill}`,
                boxShadow: "0 12px 40px rgba(0,0,0,0.7), 0 0 30px rgba(16, 185, 129, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <span style={{ fontSize: 44 }}>🛡️</span>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.emerald }}>
                    LOCAL AI: VÌ QUYỀN RIÊNG TƯ & CHỦ QUYỀN DỮ LIỆU
                  </div>
                  <div style={{ fontSize: 20, color: C.textSoft, marginTop: 4 }}>
                    Dữ liệu cá nhân & mã nguồn không bao giờ rời khỏi chiếc máy tính của bạn
                  </div>
                </div>
              </div>

              <Spoken at={F.notCost} fromScale={0.9}>
                <div
                  style={{
                    padding: "8px 18px",
                    borderRadius: 10,
                    background: `${C.redFill}22`,
                    border: `1px solid ${C.redFill}66`,
                    color: C.red,
                    fontWeight: 800,
                    fontSize: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  KHÔNG PHẢI VÌ RẺ
                </div>
              </Spoken>
            </div>
          </Spoken>
        </div>

        <SourceTag
          source="Strata Documentation & Qwen Official Pricing Sheet ($0.15/1M)"
          at={F.cloud}
          style={{ marginTop: 6 }}
        />
      </div>
    </SceneFrame>
  );
};

export default S06;
