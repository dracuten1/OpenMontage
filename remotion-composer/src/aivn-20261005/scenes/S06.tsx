// S06: OpenAI Astra cancellation alert + lab backdrop (The Guardian source)
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Badge, HeadlineText, SceneFrame, SourceTag } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s06" as const;

const F = {
  badge: frameOf(ID, "OpenAI"),
  cancel: frameOf(ID, "hủy"),
  target: frameOf(ID, "tháng"),
  safety: frameOf(ID, "kiểm"),
  alarm: frameOf(ID, "chuông"),
};

export const S06: React.FC = () => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, 370], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });

  const alertPulse =
    frame < F.alarm ? 0 : 0.5 + 0.5 * Math.sin((frame - F.alarm) / 7);

  const backdrop = (
    <>
      <Img
        src={staticFile("aivn-20261005/scene_06_openai_hq.png")}
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
            "linear-gradient(180deg, rgba(11,15,25,0.85) 0%, rgba(11,15,25,0.6) 50%, rgba(11,15,25,0.95) 100%)",
        }}
      />
    </>
  );

  return (
    <SceneFrame
      sceneId={ID}
      backdrop={backdrop}
      glow="rgba(245, 158, 11, 0.25)"
      glowPosition="top-left"
      captionHighlight={C.amber}
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
          <Badge text="CẢNH BÁO AN TOÀN BIÊN GIỚI" at={F.badge} tone="amber" />
          <SourceTag source="The Guardian (10/2026)" at={F.badge} />
        </div>

        <HeadlineText
          text="OPENAI BẤT NGỜ HỦY PHÁT HÀNH GPT-6.1 ASTRA"
          at={F.cancel}
          fontSize={76}
          accent="HỦY PHÁT HÀNH"
          accentColor={C.amber}
        />

        {/* Diagnostic Alert Box */}
        <div
          style={{
            display: "flex",
            gap: 36,
            marginTop: 12,
          }}
        >
          {/* Main Status Panel */}
          <div style={{ flex: 1.4 }}>
            <Spoken at={F.cancel} fromY={28} fromScale={0.94}>
              <div
                style={{
                  padding: "36px 44px",
                  borderRadius: 24,
                  background: "rgba(17, 24, 39, 0.94)",
                  border: `1px solid ${C.amberFill}88`,
                  borderLeft: `8px solid ${C.amberFill}`,
                  boxShadow: `0 16px 40px rgba(0,0,0,0.6), 0 0 ${20 + alertPulse * 25}px rgba(245, 158, 11, 0.25)`,
                  fontFamily: FONT,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      background: C.amber,
                      boxShadow: `0 0 10px ${C.amber}`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: C.amber,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    TRẠNG THÁI PHÁT HÀNH: BỊ HỦY BỎ
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 800,
                    color: C.text,
                    marginTop: 14,
                    lineHeight: 1.25,
                  }}
                >
                  Model <span style={{ color: C.amber }}>GPT-6.1 Astra</span> dừng bước trước thềm ra mắt
                </div>

                <div
                  style={{
                    marginTop: 18,
                    fontSize: 26,
                    color: C.textSoft,
                    lineHeight: 1.45,
                  }}
                >
                  Dự kiến ra mắt trong tháng 10/2026, nhưng đã bị đình chỉ vô thời hạn sau khi quy trình red-teaming nội bộ phát hiện các lỗ hổng rủi ro an toàn nghiêm trọng.
                </div>
              </div>
            </Spoken>
          </div>

          {/* Right: Telemetry Alarm Notice */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.safety} fromX={24} fromScale={0.94}>
              <div
                style={{
                  height: "100%",
                  boxSizing: "border-box",
                  padding: "36px 38px",
                  borderRadius: 24,
                  background: "rgba(239, 68, 68, 0.12)",
                  border: `1px solid rgba(239, 68, 68, 0.4)`,
                  borderTop: `6px solid ${C.redFill}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  fontFamily: FONT,
                }}
              >
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: 1 }}>
                    HỒI CHUÔNG CẢNH BÁO
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: C.text, marginTop: 10 }}>
                    Kiểm Thử An Toàn Nội Bộ
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 24,
                    color: C.textSoft,
                    lineHeight: 1.45,
                    borderTop: `1px solid rgba(239, 68, 68, 0.25)`,
                    paddingTop: 16,
                  }}
                >
                  Ngưỡng an toàn frontier model đòi hỏi kiểm soát tuyệt đối trước khi cấp quyền tự động cho đại chúng.
                </div>
              </div>
            </Spoken>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};

export default S06;
