// S02 — Chiến lược 2 chế độ nội dung: Chế độ A (Tin Nóng) vs Chế độ B (Series Đời Sống)
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, MOTION } from "../../channels/ky-chu-phap-luat/theme";
import { SceneShell } from "../../core/SceneShell";
import { after } from "../timing";

export const S02: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftSpring = spring({
    frame: Math.max(0, frame - 24),
    fps,
    config: MOTION.settle,
  });
  const rightSpring = spring({
    frame: Math.max(0, frame - 150),
    fps,
    config: MOTION.settle,
  });
  const settleAll = after(frame, 230);

  const spineDraw = interpolate(frame, [20, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const leftActive = !settleAll && !after(frame, 150);
  const rightActive = !settleAll && after(frame, 150);

  return (
    <SceneShell
      sceneId="S02"
      label="Hai chế độ nội dung"
      kicker="CHIẾN LƯỢC NỘI DUNG · 2 CHẾ ĐỘ VẬN HÀNH"
      accent="crimson"
      layoutMode="swiss-split"
      showHud={showHud}
    >
      <div
        data-comparison-split="true"
        style={{
          position: "absolute",
          top: 38,
          left: 0,
          width: 850,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            borderBottom: `4px solid ${COLORS.ink}`,
            paddingBottom: 14,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 64,
              fontWeight: 900,
              color: COLORS.ink,
              lineHeight: 1.0,
            }}
          >
            KÊNH LÀM GÌ MỖI NGÀY?
          </div>
          <div
            style={{
              backgroundColor: COLORS.highlighter,
              color: COLORS.ink,
              fontFamily: FONTS.display,
              fontSize: 28,
              fontWeight: 900,
              padding: "6px 14px",
              whiteSpace: "nowrap",
            }}
          >
            2 CHẾ ĐỘ
          </div>
        </div>

        {/* Two-column Legal Dossier Split */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            width: 850,
            minHeight: 740,
          }}
        >
          {/* Left Column — Mode A */}
          <div
            style={{
              width: 396,
              backgroundColor: leftActive || settleAll ? COLORS.surface : "rgba(255,253,249,0.6)",
              borderTop: `8px solid ${COLORS.crimson}`,
              borderBottom: `3px solid ${COLORS.ink}`,
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: settleAll ? 1 : leftActive ? 1 : 0.62,
              transform: `translateX(${interpolate(leftSpring, [0, 1], [-18, 0])}px)`,
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 26,
                  fontWeight: 900,
                  color: COLORS.crimson,
                  letterSpacing: 1.0,
                }}
              >
                CHẾ ĐỘ A · ƯU TIÊN HẰNG NGÀY
              </div>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 44,
                  fontWeight: 900,
                  color: COLORS.ink,
                  lineHeight: 1.08,
                }}
              >
                TIN NGHỊ ĐỊNH &amp; LUẬT NÓNG
              </div>

              <div
                style={{
                  backgroundColor: COLORS.paperWarm,
                  borderLeft: `6px solid ${COLORS.crimson}`,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: 44,
                    fontWeight: 900,
                    color: COLORS.crimson,
                  }}
                >
                  24–72 giờ
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 25, fontWeight: 700, color: COLORS.ink }}>
                  Văn bản vừa ban hành
                </div>
              </div>

              <div
                style={{
                  backgroundColor: COLORS.paperWarm,
                  borderLeft: `6px solid ${COLORS.ochre}`,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: 44,
                    fontWeight: 900,
                    color: COLORS.ink,
                  }}
                >
                  7–30 ngày
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 25, fontWeight: 700, color: COLORS.ink }}>
                  Quy định sắp có hiệu lực
                </div>
              </div>
            </div>

            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 25,
                fontWeight: 600,
                lineHeight: 1.38,
                color: COLORS.muted,
                borderTop: `2px solid ${COLORS.line}`,
                paddingTop: 14,
              }}
            >
              Trả lời thẳng: Ai bị ảnh hưởng? Mức phạt hay quyền lợi đổi gì?
            </div>
          </div>

          {/* Center SVG Spine */}
          <svg
            width={58}
            height={740}
            viewBox="0 0 58 740"
            style={{ display: "block", flexShrink: 0 }}
          >
            <line
              x1={29}
              y1={20}
              x2={29}
              y2={720}
              stroke={COLORS.ink}
              strokeWidth={3}
              strokeDasharray={700}
              strokeDashoffset={700 * (1 - spineDraw)}
            />
            <rect x={7} y={336} width={44} height={44} fill={COLORS.ink} />
            <text
              x={29}
              y={368}
              textAnchor="middle"
              fill={COLORS.highlighter}
              fontFamily={FONTS.display}
              fontSize={26}
              fontWeight={900}
            >
              +
            </text>
          </svg>

          {/* Right Column — Mode B */}
          <div
            style={{
              width: 396,
              backgroundColor: rightActive || settleAll ? COLORS.surface : "rgba(255,253,249,0.5)",
              borderTop: `8px solid ${COLORS.vermilion}`,
              borderBottom: `3px solid ${COLORS.ink}`,
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: frame < 140 ? 0.35 : settleAll ? 1 : rightActive ? 1 : 0.65,
              transform: `translateX(${interpolate(rightSpring, [0, 1], [18, 0])}px)`,
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 26,
                  fontWeight: 900,
                  color: COLORS.vermilion,
                  letterSpacing: 1.0,
                }}
              >
                CHẾ ĐỘ B · SERIES CHỦ LỰC
              </div>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 44,
                  fontWeight: 900,
                  color: COLORS.ink,
                  lineHeight: 1.08,
                }}
              >
                LUẬT CẦN BIẾT ĐỜI SỐNG
              </div>

              <div
                style={{
                  backgroundColor: COLORS.paperWarm,
                  borderLeft: `6px solid ${COLORS.vermilion}`,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: 52,
                    fontWeight: 900,
                    color: COLORS.vermilion,
                  }}
                >
                  6 MẢNG
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 25, fontWeight: 700, color: COLORS.ink }}>
                  Sát sườn sinh hoạt hằng ngày
                </div>
              </div>

              <div
                style={{
                  backgroundColor: COLORS.paperWarm,
                  borderLeft: `6px solid ${COLORS.ink}`,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: 52,
                    fontWeight: 900,
                    color: COLORS.ink,
                  }}
                >
                  30 CHỦ ĐỀ
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 25, fontWeight: 700, color: COLORS.ink }}>
                  Tình huống thực tế dễ áp dụng
                </div>
              </div>
            </div>

            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 25,
                fontWeight: 600,
                lineHeight: 1.38,
                color: COLORS.muted,
                borderTop: `2px solid ${COLORS.line}`,
                paddingTop: 14,
              }}
            >
              Lên sóng luân phiên các ngày không có Nghị định mới khẩn cấp.
            </div>
          </div>
        </div>
      </div>
    </SceneShell>
  );
};

export default S02;
