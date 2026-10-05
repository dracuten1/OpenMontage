// S07: Strata Coder Compression Trade-off (50% Expert Pruning, 91% Retention, 32GB RAM Fit)
import React from "react";
import { interpolate, staticFile, useCurrentFrame } from "remotion";
import { Badge, HeadlineText, SceneBackground, SceneFrame, SourceTag } from "../components";
import { C, FONT, MONO_FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s07" as const;

const F = {
  badge: frameOf(ID, "Strata"),
  coder: frameOf(ID, "Coder"),
  prune: frameOf(ID, "lược"),
  gauge: frameOf(ID, "91%"),
  ramFit: frameOf(ID, "32"),
};

export const S07: React.FC = () => {
  const frame = useCurrentFrame();

  const dialProgress = interpolate(frame, [F.gauge, F.gauge + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  return (
    <SceneFrame
      sceneId={ID}
      backdrop={
        <SceneBackground
          imageSrc={staticFile("aivn-20261006/images/scene_07_strata_coder_compression.png")}
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
        <Badge text="PHIÊN BẢN TINH GỌN (STRATA CODER)" at={F.badge} tone="emerald" />

        <HeadlineText
          text="STRATA CODER: CẮT 50% EXPERT, GIỮ 91% NĂNG LỰC"
          at={F.badge}
          align="center"
          fontSize={68}
          accent="GIỮ 91% NĂNG LỰC"
          accentColor={C.emerald}
        />

        {/* Trade-off Visualization Grid */}
        <div
          style={{
            display: "flex",
            gap: 32,
            width: "100%",
            maxWidth: 1540,
            marginTop: 16,
          }}
        >
          {/* Left: 50% Expert Pruning Card */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.prune} fromX={-24} fromScale={0.94}>
              <div
                style={{
                  height: 350,
                  boxSizing: "border-box",
                  padding: "32px 36px",
                  borderRadius: 24,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `5px solid ${C.amberFill}`,
                  boxShadow: `0 16px 36px -8px rgba(0,0,0,0.7), 0 0 24px ${C.glowAmber}`,
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
                      background: `${C.amberFill}22`,
                      border: `1px solid ${C.amberFill}55`,
                      color: C.amber,
                      fontWeight: 700,
                      fontSize: 18,
                      letterSpacing: 1,
                    }}
                  >
                    KỸ THUẬT NÉN MÔ HÌNH
                  </span>
                  <div
                    style={{
                      fontSize: 34,
                      fontWeight: 800,
                      color: C.text,
                      marginTop: 16,
                      lineHeight: 1.25,
                    }}
                  >
                    Lược Bỏ 50% Expert
                  </div>
                  <div style={{ fontSize: 22, color: C.muted, marginTop: 8 }}>
                    Chấp nhận sự hao hụt kỹ thuật để tối ưu bộ nhớ
                  </div>
                </div>

                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    background: "rgba(15, 23, 42, 0.8)",
                    border: `1px solid ${C.amberFill}44`,
                    fontSize: 20,
                    color: C.amber,
                    fontWeight: 600,
                  }}
                >
                  ✂️ Giảm một nửa số lượng expert layers
                </div>
              </div>
            </Spoken>
          </div>

          {/* Right: 91% Retention Gauge & 32GB RAM Safe Zone */}
          <div style={{ flex: 1.3 }}>
            <Spoken at={F.gauge} fromX={24} fromScale={0.94}>
              <div
                style={{
                  height: 350,
                  boxSizing: "border-box",
                  padding: "32px 36px",
                  borderRadius: 24,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `5px solid ${C.emeraldFill}`,
                  boxShadow: `0 16px 36px -8px rgba(0,0,0,0.7), 0 0 30px ${C.glowEmerald}`,
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
                      BẢO TOÀN NĂNG LỰC LẬP TRÌNH
                    </span>
                    <span style={{ fontSize: 20, color: C.muted }}>SWE-bench Verified</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 14 }}>
                    <div
                      style={{
                        fontFamily: MONO_FONT,
                        fontSize: 88,
                        fontWeight: 800,
                        color: C.emerald,
                        letterSpacing: -2,
                      }}
                    >
                      {(91 * dialProgress).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 24, color: C.textSoft, fontWeight: 600 }}>
                      so với model gốc chưa cắt tỉa
                    </div>
                  </div>
                </div>

                {/* 32 GB RAM Safe Zone Indicator */}
                <Spoken at={F.ramFit} fromY={12}>
                  <div
                    style={{
                      padding: "16px 22px",
                      borderRadius: 14,
                      background: `${C.emeraldFill}18`,
                      border: `1px solid ${C.emeraldFill}66`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 24 }}>✅</span>
                      <span style={{ fontSize: 22, fontWeight: 700, color: C.emerald }}>
                        VỪA VẶN TRONG 32 GB RAM PHỔ THÔNG
                      </span>
                    </div>
                    <span style={{ fontFamily: MONO_FONT, fontSize: 20, color: C.textSoft, fontWeight: 600 }}>
                      DDR4 / DDR5
                    </span>
                  </div>
                </Spoken>
              </div>
            </Spoken>
          </div>
        </div>

        <SourceTag
          source="Strata README: Compression Architecture & Model Pruning Benchmarks"
          at={F.gauge}
          style={{ marginTop: 10 }}
        />
      </div>
    </SceneFrame>
  );
};

export default S07;
