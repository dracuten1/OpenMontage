// S09: Qwen4 Roadmap Preview & CTA (Gated DeltaNet, Sparse Attention, Muon Optimizer, Strata Repo CTA)
import React from "react";
import { interpolate, staticFile, useCurrentFrame } from "remotion";
import { Badge, HeadlineText, SceneBackground, SceneFrame, SourceTag } from "../components";
import { C, FONT, MONO_FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s09" as const;

const F = {
  badge: frameOf(ID, "Kiến"),
  qwen4: frameOf(ID, "Qwen4"),
  deltanet: frameOf(ID, "DeltaNet"),
  sparse: frameOf(ID, "Sparse"),
  muon: frameOf(ID, "Muon"),
  wave: frameOf(ID, "Làn"),
  cta: frameOf(ID, "tự"),
};

export const S09: React.FC = () => {
  const frame = useCurrentFrame();

  const pulse = Math.sin(frame / 10) * 0.03 + 1;

  return (
    <SceneFrame
      sceneId={ID}
      backdrop={
        <SceneBackground
          imageSrc={staticFile("aivn-20261006/images/scene_09_qwen4_future_roadmap.png")}
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
          gap: 14,
          paddingTop: 8,
        }}
      >
        <Badge text="TẦM NHÌN TƯƠNG LAI & HÀNH ĐỘNG" at={F.badge} tone="blue" />

        <HeadlineText
          text="BẢN XEM TRƯỚC KIẾN TRÚC QWEN4 HYBRID"
          at={F.qwen4}
          align="center"
          fontSize={70}
          accent="KIẾN TRÚC QWEN4"
          accentColor={C.blue}
        />

        {/* 3 Architectural Innovation Cards */}
        <div
          style={{
            display: "flex",
            gap: 24,
            width: "100%",
            maxWidth: 1540,
            marginTop: 14,
          }}
        >
          {/* Card 1: Gated DeltaNet */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.deltanet} fromY={24} fromScale={0.94}>
              <div
                style={{
                  height: 240,
                  boxSizing: "border-box",
                  padding: "24px 28px",
                  borderRadius: 20,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `5px solid ${C.blueFill}`,
                  boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 20px ${C.glowBlue}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: 16, color: C.blue, fontWeight: 700, letterSpacing: 1 }}>
                    TRỤ CỘT 01
                  </span>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.text, marginTop: 8 }}>
                    Gated DeltaNet
                  </div>
                  <div style={{ fontSize: 18, color: C.muted, marginTop: 6, lineHeight: 1.35 }}>
                    Mô hình tuyến tính Linear Attention tiết kiệm bộ nhớ
                  </div>
                </div>
                <div style={{ fontSize: 16, color: C.textSoft, fontWeight: 600 }}>
                  Tăng tốc suy luận context dài
                </div>
              </div>
            </Spoken>
          </div>

          {/* Card 2: Sparse Attention */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.sparse} fromY={24} fromScale={0.94}>
              <div
                style={{
                  height: 240,
                  boxSizing: "border-box",
                  padding: "24px 28px",
                  borderRadius: 20,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `5px solid ${C.emeraldFill}`,
                  boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 20px ${C.glowEmerald}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: 16, color: C.emerald, fontWeight: 700, letterSpacing: 1 }}>
                    TRỤ CỘT 02
                  </span>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.text, marginTop: 8 }}>
                    Sparse Attention
                  </div>
                  <div style={{ fontSize: 18, color: C.muted, marginTop: 6, lineHeight: 1.35 }}>
                    Chú ý thưa kết hợp 4-branch Gated Residual
                  </div>
                </div>
                <div style={{ fontSize: 16, color: C.textSoft, fontWeight: 600 }}>
                  Giảm thiểu phép tính ma trận thừa
                </div>
              </div>
            </Spoken>
          </div>

          {/* Card 3: Muon Optimizer */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.muon} fromY={24} fromScale={0.94}>
              <div
                style={{
                  height: 240,
                  boxSizing: "border-box",
                  padding: "24px 28px",
                  borderRadius: 20,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `5px solid ${C.amberFill}`,
                  boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 20px ${C.glowAmber}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: 16, color: C.amber, fontWeight: 700, letterSpacing: 1 }}>
                    TRỤ CỘT 03
                  </span>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.text, marginTop: 8 }}>
                    Muon Optimizer
                  </div>
                  <div style={{ fontSize: 18, color: C.muted, marginTop: 6, lineHeight: 1.35 }}>
                    Thuật toán tối ưu hóa siêu phân giải trọng số
                  </div>
                </div>
                <div style={{ fontSize: 16, color: C.textSoft, fontWeight: 600 }}>
                  Đạt độ hội tụ cao với chi phí 1/9
                </div>
              </div>
            </Spoken>
          </div>
        </div>

        {/* Thesis & Call-To-Action Banner */}
        <div style={{ width: "100%", maxWidth: 1540, marginTop: 14 }}>
          {/* Main Thesis Banner */}
          <Spoken at={F.wave} fromY={18} fromScale={0.96}>
            <div
              style={{
                padding: "20px 32px",
                borderRadius: 18,
                background: "linear-gradient(90deg, rgba(37, 99, 235, 0.22) 0%, rgba(16, 185, 129, 0.22) 100%)",
                border: `2px solid ${C.blueFill}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 34 }}>🌊</span>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.text }}>
                    LÀN SÓNG AI LỚN CHẠY LOCAL ĐÃ CHÍNH THỨC BẮT ĐẦU
                  </div>
                  <div style={{ fontSize: 18, color: C.textSoft, marginTop: 4 }}>
                    Hãy kiểm tra cấu hình máy tính của bạn và tự mình trải nghiệm ngay hôm nay!
                  </div>
                </div>
              </div>

              {/* Pulsing CTA Repo Link Button */}
              <Spoken at={F.cta} fromScale={0.88}>
                <div
                  style={{
                    padding: "14px 28px",
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${C.blueFill} 0%, #1D4ED8 100%)`,
                    border: `1px solid ${C.blue}`,
                    boxShadow: `0 8px 24px rgba(37, 99, 235, 0.5)`,
                    color: C.white,
                    fontFamily: MONO_FONT,
                    fontWeight: 800,
                    fontSize: 20,
                    transform: `scale(${pulse})`,
                    whiteSpace: "nowrap",
                  }}
                >
                  ⭐ github.com/Niko1221/Strata
                </div>
              </Spoken>
            </div>
          </Spoken>
        </div>

        <SourceTag
          source="Qwen Official Blog Roadmap & GitHub Open Source Community"
          at={F.wave}
          style={{ marginTop: 6 }}
        />
      </div>
    </SceneFrame>
  );
};

export default S09;
