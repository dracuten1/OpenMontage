// S07: Saachi Jain quote: "didn't quite meet the bar" (Head of Safety Systems, OpenAI)
import React from "react";
import { Badge, SceneFrame, SourceTag } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s07" as const;

const F = {
  speaker: frameOf(ID, "Saachi"),
  role: frameOf(ID, "Trưởng"),
  quote: frameOf(ID, "'didn't"),
  standard: frameOf(ID, "tiêu"),
};

export const S07: React.FC = () => {
  return (
    <SceneFrame
      sceneId={ID}
      glow="rgba(245, 158, 11, 0.2)"
      glowPosition="center"
      captionHighlight={C.amber}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          maxWidth: 1480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Badge text="TUYÊN BỐ CHÍNH THỨC" at={F.speaker} tone="amber" />
          <SourceTag source="The Guardian" at={F.speaker} />
        </div>

        {/* Editorial Quote Card */}
        <Spoken at={F.quote} fromY={32} fromScale={0.93}>
          <div
            style={{
              width: "100%",
              maxWidth: 1360,
              padding: "48px 60px",
              borderRadius: 28,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderTop: `6px solid ${C.amberFill}`,
              boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 32px rgba(245, 158, 11, 0.15)",
              fontFamily: FONT,
              position: "relative",
            }}
          >
            {/* Massive quotation watermark */}
            <div
              style={{
                position: "absolute",
                top: 24,
                left: 36,
                fontSize: 140,
                lineHeight: 1,
                color: "rgba(245, 158, 11, 0.14)",
                fontFamily: "Georgia, serif",
                pointerEvents: "none",
              }}
            >
              “
            </div>

            <div style={{ position: "relative", zIndex: 2 }}>
              <div
                style={{
                  fontSize: 68,
                  fontWeight: 800,
                  color: C.amber,
                  lineHeight: 1.25,
                  letterSpacing: -1,
                  fontStyle: "italic",
                }}
              >
                &ldquo;didn&apos;t quite meet the bar&rdquo;
              </div>

              <div
                style={{
                  marginTop: 20,
                  fontSize: 34,
                  fontWeight: 600,
                  color: C.text,
                  lineHeight: 1.35,
                }}
              >
                Chưa đạt tiêu chuẩn an toàn khắt khe mà công ty đặt ra.
              </div>

              {/* Attribution Footer */}
              <div
                style={{
                  marginTop: 36,
                  paddingTop: 24,
                  borderTop: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: C.text }}>
                    Saachi Jain
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 500, color: C.muted, marginTop: 4 }}>
                    Trưởng nhóm hệ thống an toàn (Head of Safety Systems) • OpenAI
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 20px",
                    borderRadius: 12,
                    background: "rgba(245, 158, 11, 0.12)",
                    border: `1px solid rgba(245, 158, 11, 0.3)`,
                    color: C.amber,
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  XÁC NHẬN CHÍNH THỨC
                </div>
              </div>
            </div>
          </div>
        </Spoken>
      </div>
    </SceneFrame>
  );
};

export default S07;
