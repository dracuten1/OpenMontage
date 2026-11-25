// S03 — Series Luật Cần Biết Đời Sống: 3 mảng đầu (Giao thông, Lao động/BHXH, Nhà trọ/Đất đai)
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, MOTION } from "../../channels/ky-chu-phap-luat/theme";
import { ArchiveLabelBadge, SceneShell } from "../../core/SceneShell";
import { ASSET_BASE } from "../timing";

const PILLARS_FIRST_THREE = [
  {
    code: "MỤC 1",
    title: "GIAO THÔNG & XỬ PHẠT",
    detail: "Nồng độ cồn, trừ điểm bằng lái, đèn vàng và phạt nguội",
    enter: 42,
    accent: COLORS.crimson,
  },
  {
    code: "MỤC 2",
    title: "LAO ĐỘNG, OT & BHXH",
    detail: "Thử việc, nợ lương, ép ký đơn nghỉ, tính tăng ca và bảo hiểm",
    enter: 112,
    accent: COLORS.vermilion,
  },
  {
    code: "MỤC 3",
    title: "NHÀ TRỌ & ĐẤT ĐAI",
    detail: "Mất cọc trọ, giá điện nước, tiếng ồn karaoke, giấy tay và vi bằng",
    enter: 180,
    accent: COLORS.ochre,
  },
];

export const S03: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneShell
      sceneId="S03"
      label="Series 3 mảng đầu"
      kicker="SERIES LUẬT CẦN BIẾT ĐỜI SỐNG · 6 MẢNG / 30 CHỦ ĐỀ"
      accent="crimson"
      layoutMode="swiss-split"
      backplate={{
        src: `${ASSET_BASE}/images/photo_s03_traffic.jpg`,
        mode: "top-split",
        splitHeight: 400,
        objectPosition: "center 48%",
        zoomFrom: 1.0,
        zoomTo: 1.06,
      }}
      photoCredit="NGUỒN: WIKIMEDIA COMMONS · CC BY"
      showHud={showHud}
    >
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 0,
        }}
      >
        <ArchiveLabelBadge archiveLabel="ẢNH TƯ LIỆU 2019" />
      </div>

      {/* Bottom Swiss Gazette Stage */}
      <div
        data-editorial-bar-chart="true"
        style={{
          position: "absolute",
          top: 424,
          left: 0,
          width: 850,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            borderBottom: `3px solid ${COLORS.ink}`,
            paddingBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 52,
              fontWeight: 900,
              color: COLORS.ink,
              lineHeight: 1.0,
            }}
          >
            3 MẢNG ĐẦU · SÁT VÍ TIỀN
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 30,
              fontWeight: 900,
              color: COLORS.vermilion,
            }}
          >
            30 CHỦ ĐỀ
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {PILLARS_FIRST_THREE.map((item) => {
            const p = spring({
              frame: Math.max(0, frame - item.enter),
              fps,
              config: MOTION.settle,
            });
            const barDraw = interpolate(frame, [item.enter, item.enter + 28], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={item.code}
                style={{
                  backgroundColor: COLORS.surface,
                  borderLeft: `8px solid ${item.accent}`,
                  padding: "16px 20px",
                  opacity: interpolate(p, [0, 1], [0.25, 1]),
                  transform: `translateX(${interpolate(p, [0, 1], [18, 0])}px)`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontSize: 34,
                      fontWeight: 900,
                      color: COLORS.ink,
                      lineHeight: 1.08,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      backgroundColor: item.accent,
                      color: COLORS.textOnDark,
                      fontFamily: FONTS.display,
                      fontSize: 24,
                      fontWeight: 900,
                      padding: "4px 12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.code}
                  </div>
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 25, fontWeight: 600, color: COLORS.muted }}>
                  {item.detail}
                </div>
                <svg width={790} height={8} viewBox="0 0 790 8" style={{ display: "block" }}>
                  <rect x={0} y={2} width={790} height={4} fill="rgba(13,27,42,0.10)" />
                  <line
                    x1={0}
                    y1={4}
                    x2={790}
                    y2={4}
                    stroke={item.accent}
                    strokeWidth={4}
                    strokeDasharray={790}
                    strokeDashoffset={790 * (1 - barDraw)}
                  />
                </svg>
              </div>
            );
          })}
        </div>
      </div>
    </SceneShell>
  );
};

export default S03;
