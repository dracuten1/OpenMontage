// S08: Hardware Compatibility: Discrete GPU (NVIDIA/AMD) vs Mac Unified Memory (12 tok/s)
import React from "react";
import { staticFile } from "remotion";
import { Badge, HeadlineText, SceneBackground, SceneFrame, SourceTag } from "../components";
import { C, FONT, MONO_FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s08" as const;

const F = {
  badge: frameOf(ID, "Đường"),
  discrete: frameOf(ID, "NVIDIA"),
  mac: frameOf(ID, "Mac"),
  macSpeed: frameOf(ID, "12"),
  verdict: frameOf(ID, "card"),
};

export const S08: React.FC = () => {
  return (
    <SceneFrame
      sceneId={ID}
      backdrop={
        <SceneBackground
          imageSrc={staticFile("aivn-20261006/images/scene_08_gpu_vs_mac_hardware.png")}
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
        <Badge text="ĐỊNH HƯỚNG NỀN TẢNG PHẦN CỨNG" at={F.badge} tone="blue" />

        <HeadlineText
          text="CARD ĐỒ HỌA RỜI LÀ LỰA CHỌN BẮT BUỘC"
          at={F.badge}
          align="center"
          fontSize={70}
          accent="LỰA CHỌN BẮT BUỘC"
          accentColor={C.blue}
        />

        {/* Dual Lane Hardware Comparison Columns */}
        <div
          style={{
            display: "flex",
            gap: 32,
            width: "100%",
            maxWidth: 1540,
            marginTop: 16,
          }}
        >
          {/* Left Column: NVIDIA & AMD Discrete GPU (Optimal Lane) */}
          <div style={{ flex: 1.2 }}>
            <Spoken at={F.discrete} fromX={-24} fromScale={0.94}>
              <div
                style={{
                  height: 340,
                  boxSizing: "border-box",
                  padding: "32px 36px",
                  borderRadius: 24,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `6px solid ${C.emeraldFill}`,
                  boxShadow: `0 16px 40px rgba(0,0,0,0.6), 0 0 30px ${C.glowEmerald}`,
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
                        fontSize: 18,
                        letterSpacing: 1,
                      }}
                    >
                      ĐƯỜNG CHẠY CHÍNH (TỐI ƯU)
                    </span>
                    <span style={{ fontSize: 22, color: C.emerald, fontWeight: 700 }}>PCIe Lanes</span>
                  </div>

                  <div style={{ fontSize: 34, fontWeight: 800, color: C.text, marginTop: 14 }}>
                    NVIDIA & AMD Discrete GPU
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
                    <span style={{ fontFamily: MONO_FONT, fontSize: 64, fontWeight: 800, color: C.emerald }}>
                      100 – 140
                    </span>
                    <span style={{ fontSize: 24, color: C.textSoft, fontWeight: 600 }}>token/giây</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 18px",
                    borderRadius: 12,
                    background: `${C.emeraldFill}15`,
                    border: `1px solid ${C.emeraldFill}44`,
                    fontSize: 20,
                    color: C.emerald,
                    fontWeight: 600,
                  }}
                >
                  ⚡ Kiến trúc offload tối ưu sâu cho bus truyền PCIe rời
                </div>
              </div>
            </Spoken>
          </div>

          {/* Right Column: Mac Unified Memory (Bottleneck) */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.mac} fromX={24} fromScale={0.94}>
              <div
                style={{
                  height: 340,
                  boxSizing: "border-box",
                  padding: "32px 36px",
                  borderRadius: 24,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `6px solid ${C.amberFill}`,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
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
                        background: `${C.amberFill}22`,
                        border: `1px solid ${C.amberFill}55`,
                        color: C.amber,
                        fontWeight: 700,
                        fontSize: 18,
                        letterSpacing: 1,
                      }}
                    >
                      BỊ GIỚI HẠN BĂNG THÔNG
                    </span>
                    <span style={{ fontSize: 20, color: C.muted }}>Unified Memory</span>
                  </div>

                  <div style={{ fontSize: 34, fontWeight: 800, color: C.textSoft, marginTop: 14 }}>
                    Máy Apple Mac (M-Series)
                  </div>

                  <Spoken at={F.macSpeed} fromScale={0.92}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
                      <span style={{ fontFamily: MONO_FONT, fontSize: 64, fontWeight: 800, color: C.amber }}>
                        ~12
                      </span>
                      <span style={{ fontSize: 24, color: C.muted, fontWeight: 600 }}>token/giây (Nghẽn)</span>
                    </div>
                  </Spoken>
                </div>

                <div
                  style={{
                    padding: "12px 18px",
                    borderRadius: 12,
                    background: "rgba(15, 23, 42, 0.8)",
                    border: `1px solid ${C.borderSubtle}`,
                    fontSize: 20,
                    color: C.muted,
                  }}
                >
                  Thử nghiệm SlotStream trên Mac 48GB chưa đạt tốc độ cao
                </div>
              </div>
            </Spoken>
          </div>
        </div>

        {/* Conclusion Hardware Verdict Banner */}
        <div style={{ width: "100%", maxWidth: 1540, marginTop: 12 }}>
          <Spoken at={F.verdict} fromY={18} fromScale={0.96}>
            <div
              style={{
                padding: "20px 32px",
                borderRadius: 18,
                background: "rgba(37, 99, 235, 0.16)",
                border: `2px solid ${C.blueFill}`,
                boxShadow: `0 8px 30px rgba(0,0,0,0.6), 0 0 25px ${C.glowBlue}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 32 }}>💡</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: C.text }}>
                CARD ĐỒ HỌA RỜI LÀ NỀN TẢNG TIÊU CHUẨN ĐỂ ĐẠT TỐC ĐỘ 100+ TOK/S
              </span>
            </div>
          </Spoken>
        </div>

        <SourceTag
          source="Hacker News Show HN 'Running 104GB Qwen3.8-Flash-Next on 48GB Mac' #49524447"
          at={F.mac}
          style={{ marginTop: 6 }}
        />
      </div>
    </SceneFrame>
  );
};

export default S08;
