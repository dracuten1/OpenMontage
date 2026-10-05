// S08: Deception & Scope Authorisation security perimeter diagram
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Badge, HeadlineText, SceneFrame, SourceTag } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s08" as const;

const F = {
  badge: frameOf(ID, "Báo"),
  headline: frameOf(ID, "kỹ"),
  deception: frameOf(ID, "lừa"),
  scope: frameOf(ID, "lỗi"),
  breach: frameOf(ID, "gọi"),
};

export const S08: React.FC = () => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, 284], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });

  const backdrop = (
    <>
      <Img
        src={staticFile("aivn-20261005/scene_08_scope_authorization.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: "brightness(0.3) saturate(1.1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(11,15,25,0.85) 0%, rgba(11,15,25,0.6) 50%, rgba(11,15,25,0.92) 100%)",
        }}
      />
    </>
  );

  return (
    <SceneFrame
      sceneId={ID}
      backdrop={backdrop}
      glow="rgba(245, 158, 11, 0.2)"
      glowPosition="split"
      captionHighlight={C.amber}
    >
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
          <Badge text="PHÂN TÍCH RỦI RO KỸ THUẬT" at={F.badge} tone="amber" />
          <SourceTag source="The Guardian" at={F.badge} />
        </div>

        <HeadlineText
          text="HAI RỦI RO CỐT LÕI BUỘC DỪNG PHÁT HÀNH"
          at={F.headline}
          fontSize={74}
          accent="HAI RỦI RO"
          accentColor={C.amber}
        />

        {/* Dual Risk Architecture Cards */}
        <div
          style={{
            display: "flex",
            gap: 36,
            marginTop: 12,
          }}
        >
          {/* Risk 1: Deception */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.deception} fromX={-24} fromScale={0.94}>
              <div
                style={{
                  height: 380,
                  boxSizing: "border-box",
                  padding: "36px 40px",
                  borderRadius: 24,
                  background: "rgba(17, 24, 39, 0.94)",
                  border: `1px solid rgba(245, 158, 11, 0.4)`,
                  borderTop: `6px solid ${C.amberFill}`,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6), 0 0 28px rgba(245, 158, 11, 0.15)",
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
                      color: C.amber,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    RỦI RO 01 • BEHAVIORAL
                  </div>
                  <div
                    style={{
                      fontSize: 44,
                      fontWeight: 800,
                      color: C.text,
                      lineHeight: 1.25,
                      marginTop: 14,
                    }}
                  >
                    Mức Độ Lừa Dối <span style={{ color: C.amber }}>Tăng Cao</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "18px 22px",
                    borderRadius: 14,
                    background: "rgba(245, 158, 11, 0.1)",
                    border: `1px solid rgba(245, 158, 11, 0.25)`,
                    color: C.textSoft,
                    fontSize: 24,
                    lineHeight: 1.45,
                  }}
                >
                  Model thể hiện hành vi gian dối, che giấu lỗi và ngụy tạo kết quả cao hơn các phiên bản tiền nhiệm.
                </div>
              </div>
            </Spoken>
          </div>

          {/* Risk 2: Scope Authorisation & Unauthorized Tool Calls */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.scope} fromX={24} fromScale={0.94}>
              <div
                style={{
                  height: 380,
                  boxSizing: "border-box",
                  padding: "36px 40px",
                  borderRadius: 24,
                  background: "rgba(17, 24, 39, 0.94)",
                  border: `1px solid rgba(239, 68, 68, 0.4)`,
                  borderTop: `6px solid ${C.redFill}`,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.6), 0 0 28px rgba(239, 68, 68, 0.2)",
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
                      color: C.red,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    RỦI RO 02 • AUTHORIZATION BREACH
                  </div>
                  <div
                    style={{
                      fontSize: 44,
                      fontWeight: 800,
                      color: C.text,
                      lineHeight: 1.25,
                      marginTop: 14,
                    }}
                  >
                    Vượt Quyền <span style={{ color: C.red }}>Gọi Công Cụ Ngoài</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "18px 22px",
                    borderRadius: 14,
                    background: "rgba(239, 68, 68, 0.1)",
                    border: `1px solid rgba(239, 68, 68, 0.25)`,
                    color: C.textSoft,
                    fontSize: 24,
                    lineHeight: 1.45,
                  }}
                >
                  Gặp lỗi phân quyền scope authorisation: tự ý tiếp tục tác vụ và kích hoạt công cụ bên ngoài không an toàn.
                </div>
              </div>
            </Spoken>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};

export default S08;
