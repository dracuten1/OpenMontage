// S03: MoE & Memory Offload Architecture (Dual Pipeline: VRAM 6B vs Host RAM 51B)
import React from "react";
import { staticFile } from "remotion";
import { Badge, HeadlineText, SceneBackground, SceneFrame, SourceTag } from "../components";
import { C, FONT, MONO_FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s03" as const;

const F = {
  badge: frameOf(ID, "MoE"),
  title: frameOf(ID, "125"),
  vram: frameOf(ID, "6"),
  ram: frameOf(ID, "51"),
  prefetch: frameOf(ID, "RAM"),
};

export const S03: React.FC = () => {
  return (
    <SceneFrame
      sceneId={ID}
      backdrop={
        <SceneBackground
          imageSrc={staticFile("aivn-20261006/images/scene_03_moe_memory_offload.png")}
          glowColor={C.glowBlue}
          glowCoords="50% 30%"
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
        <Badge text="KIẾN TRÚC MIXTURE-OF-EXPERTS (MoE)" at={F.badge} tone="blue" />

        <HeadlineText
          text="BÍ MẬT MOE: 6B KÍCH HOẠT & 51B CHUYỂN SANG RAM"
          at={F.title}
          align="center"
          fontSize={70}
          accent="6B KÍCH HOẠT & 51B"
          accentColor={C.blue}
        />

        {/* Master Architecture Breakdown Grid */}
        <div
          style={{
            display: "flex",
            gap: 28,
            width: "100%",
            maxWidth: 1540,
            marginTop: 18,
          }}
        >
          {/* Card 1: Total Model Weights */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.title} fromY={24} fromScale={0.95}>
              <div
                style={{
                  height: 350,
                  boxSizing: "border-box",
                  padding: "32px 36px",
                  borderRadius: 24,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `5px solid ${C.muted}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span
                    style={{
                      padding: "4px 14px",
                      borderRadius: 999,
                      background: "rgba(148, 163, 184, 0.15)",
                      border: `1px solid ${C.borderSubtle}`,
                      color: C.muted,
                      fontWeight: 700,
                      fontSize: 18,
                      letterSpacing: 1,
                    }}
                  >
                    TỔNG THAM SỐ
                  </span>
                  <div
                    style={{
                      fontFamily: MONO_FONT,
                      fontSize: 84,
                      fontWeight: 800,
                      color: C.text,
                      marginTop: 14,
                    }}
                  >
                    125B
                  </div>
                  <div style={{ fontSize: 24, color: C.textSoft, fontWeight: 600, marginTop: 4 }}>
                    Qwen 3.8 Flash-Next
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 18px",
                    borderRadius: 12,
                    background: "rgba(15, 23, 42, 0.7)",
                    color: C.muted,
                    fontSize: 20,
                  }}
                >
                  Mô hình gốc hoàn chỉnh, không cắt xén cấu trúc
                </div>
              </div>
            </Spoken>
          </div>

          {/* Card 2: GPU VRAM Active Cluster */}
          <div style={{ flex: 1.2 }}>
            <Spoken at={F.vram} fromY={24} fromScale={0.95}>
              <div
                style={{
                  height: 350,
                  boxSizing: "border-box",
                  padding: "32px 36px",
                  borderRadius: 24,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `5px solid ${C.blueFill}`,
                  boxShadow: `0 16px 36px -8px rgba(0,0,0,0.7), 0 0 28px ${C.glowBlue}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span
                    style={{
                      padding: "4px 14px",
                      borderRadius: 999,
                      background: `${C.blueFill}22`,
                      border: `1px solid ${C.blueFill}55`,
                      color: C.blue,
                      fontWeight: 700,
                      fontSize: 18,
                      letterSpacing: 1,
                    }}
                  >
                    ⚡ GPU VRAM (ACTIVE)
                  </span>
                  <div
                    style={{
                      fontFamily: MONO_FONT,
                      fontSize: 84,
                      fontWeight: 800,
                      color: C.blue,
                      marginTop: 14,
                    }}
                  >
                    6B
                  </div>
                  <div style={{ fontSize: 24, color: C.text, fontWeight: 700, marginTop: 4 }}>
                    Kích hoạt mỗi token suy luận
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 18px",
                    borderRadius: 12,
                    background: `${C.blueFill}15`,
                    border: `1px solid ${C.blueFill}44`,
                    color: C.blue,
                    fontSize: 20,
                    fontWeight: 600,
                  }}
                >
                  Vừa vặn hoàn hảo trong 12 GB VRAM card đồ họa
                </div>
              </div>
            </Spoken>
          </div>

          {/* Card 3: Host RAM Offloading */}
          <div style={{ flex: 1.2 }}>
            <Spoken at={F.ram} fromY={24} fromScale={0.95}>
              <div
                style={{
                  height: 350,
                  boxSizing: "border-box",
                  padding: "32px 36px",
                  borderRadius: 24,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `5px solid ${C.emeraldFill}`,
                  boxShadow: `0 16px 36px -8px rgba(0,0,0,0.7), 0 0 28px ${C.glowEmerald}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span
                    style={{
                      padding: "4px 14px",
                      borderRadius: 999,
                      background: `${C.emeraldFill}22`,
                      border: `1px solid ${C.emeraldFill}55`,
                      color: C.emerald,
                      fontWeight: 700,
                      fontSize: 18,
                      letterSpacing: 1,
                    }}
                  >
                    💾 HOST RAM OFFLOAD
                  </span>
                  <div
                    style={{
                      fontFamily: MONO_FONT,
                      fontSize: 84,
                      fontWeight: 800,
                      color: C.emerald,
                      marginTop: 14,
                    }}
                  >
                    51B
                  </div>
                  <div style={{ fontSize: 24, color: C.text, fontWeight: 700, marginTop: 4 }}>
                    N-gram Embeddings đẩy sang RAM
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 18px",
                    borderRadius: 12,
                    background: `${C.emeraldFill}15`,
                    border: `1px solid ${C.emeraldFill}44`,
                    color: C.emerald,
                    fontSize: 20,
                    fontWeight: 600,
                  }}
                >
                  Nạp bất đồng bộ không gây nghẽn băng thông PCIe
                </div>
              </div>
            </Spoken>
          </div>
        </div>

        <SourceTag
          source="Qwen Official Blog: 'Introducing Qwen 3.8 Flash-Next Architecture'"
          at={F.prefetch}
          style={{ marginTop: 12 }}
        />
      </div>
    </SceneFrame>
  );
};

export default S03;
