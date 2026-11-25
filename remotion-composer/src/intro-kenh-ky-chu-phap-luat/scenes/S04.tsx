// S04 — Series Luật Cần Biết Đời Sống: 3 mảng còn lại (Tài chính/Thuế, Hôn nhân, Quyền công dân)
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, MOTION } from "../../channels/ky-chu-phap-luat/theme";
import { AiBadge, SceneShell } from "../../core/SceneShell";
import { ASSET_BASE } from "../timing";

const PILLARS_NEXT_THREE = [
  {
    code: "MỤC 4",
    title: "TÀI CHÍNH, THUẾ & NGÂN HÀNG",
    detail: "Thuế bán hàng online, chuyển khoản nhầm, cho mượn tài khoản",
    enter: 24,
    accent: COLORS.vermilion,
  },
  {
    code: "MỤC 5",
    title: "HÔN NHÂN & GIA ĐÌNH",
    detail: "Tài sản đứng tên riêng, quyền nuôi con, thừa kế không di chúc",
    enter: 96,
    accent: COLORS.ochre,
  },
  {
    code: "MỤC 6",
    title: "ĐỜI SỐNG & QUYỀN CÔNG DÂN",
    detail: "Định danh VNeID, mua hàng online sai mẫu, bôi nhọ trên mạng",
    enter: 160,
    accent: COLORS.crimson,
  },
];

export const S04: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneShell
      sceneId="S04"
      label="Series 3 mảng sau"
      kicker="SERIES LUẬT CẦN BIẾT ĐỜI SỐNG · 6 MẢNG / 30 CHỦ ĐỀ"
      accent="amber"
      layoutMode="swiss-split"
      backplate={{
        src: `${ASSET_BASE}/images/ai_s04_civil_life.png`,
        mode: "top-split",
        splitHeight: 400,
        objectPosition: "center 50%",
        zoomFrom: 1.0,
        zoomTo: 1.06,
      }}
      showHud={showHud}
    >
      <div style={{ position: "absolute", top: 24, right: 0 }}>
        <AiBadge concept="ĐỜI SỐNG SỐ" />
      </div>

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
            3 MẢNG TIẾP · QUYỀN CÔNG DÂN
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 30,
              fontWeight: 900,
              color: COLORS.ochre,
            }}
          >
            6 / 6 MẢNG
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {PILLARS_NEXT_THREE.map((item) => {
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

export default S04;
