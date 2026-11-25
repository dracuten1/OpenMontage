// S05 — Data lấy từ đâu: 5 cổng thông tin chính thống của Nhà nước
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, MOTION } from "../../channels/ky-chu-phap-luat/theme";
import { ArchiveLabelBadge, SceneShell } from "../../core/SceneShell";
import { ASSET_BASE } from "../timing";

const PORTALS = [
  { domain: "vanban.chinhphu.vn", role: "Nghị định, Quyết định Chính phủ", enter: 44 },
  { domain: "vbpl.vn", role: "CSDL Quốc gia · Tra cứu hiệu lực", enter: 82 },
  { domain: "quochoi.vn", role: "Hiến pháp, Bộ luật, Luật, Nghị quyết", enter: 120 },
  { domain: "xaydungchinhsach.chinhphu.vn", role: "Chính sách mới & sắp áp dụng", enter: 158 },
  { domain: "baochinhphu.vn", role: "Thông tin chỉ đạo điều hành chính thống", enter: 196 },
];

export const S05: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wireProgress = interpolate(frame, [40, 220], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell
      sceneId="S05"
      label="5 cổng nguồn chính thống"
      kicker="NGUỒN DỮ LIỆU PHÁP LÝ · PRIMARY-FIRST"
      accent="crimson"
      layoutMode="swiss-split"
      backplate={{
        src: `${ASSET_BASE}/images/photo_s05_law_institution.jpg`,
        mode: "top-split",
        splitHeight: 360,
        objectPosition: "center 35%",
        zoomFrom: 1.0,
        zoomTo: 1.06,
      }}
      photoCredit="NGUỒN: WIKIMEDIA COMMONS · CC BY-SA"
      showHud={showHud}
    >
      <div style={{ position: "absolute", top: 24, right: 0 }}>
        <ArchiveLabelBadge archiveLabel="ẢNH TƯ LIỆU 2015" />
      </div>

      <div
        data-flow-timeline="true"
        style={{
          position: "absolute",
          top: 382,
          left: 0,
          width: 850,
          display: "flex",
          flexDirection: "column",
          gap: 16,
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
              fontSize: 50,
              fontWeight: 900,
              color: COLORS.ink,
              lineHeight: 1.0,
            }}
          >
            DỮ LIỆU LẤY TỪ ĐÂU?
          </div>
          <div
            style={{
              backgroundColor: COLORS.vermilion,
              color: COLORS.textOnDark,
              fontFamily: FONTS.display,
              fontSize: 28,
              fontWeight: 900,
              padding: "4px 14px",
              whiteSpace: "nowrap",
            }}
          >
            5 CỔNG CHÍNH THỐNG
          </div>
        </div>

        {/* SVG Source Network Feeding Ký Chủ Dossier */}
        <div style={{ position: "relative", width: 850, height: 500 }}>
          <svg
            width={60}
            height={500}
            viewBox="0 0 60 500"
            style={{ position: "absolute", left: 0, top: 0 }}
          >
            <line
              x1={24}
              y1={42}
              x2={24}
              y2={446}
              stroke={COLORS.vermilion}
              strokeWidth={4}
              strokeDasharray={410}
              strokeDashoffset={410 * (1 - wireProgress)}
            />
            {PORTALS.map((_, idx) => {
              const y = 42 + idx * 101;
              return (
                <g key={idx}>
                  <line x1={24} y1={y} x2={56} y2={y} stroke={COLORS.ink} strokeWidth={3} />
                  <circle cx={24} cy={y} r={9} fill={COLORS.highlighter} stroke={COLORS.ink} strokeWidth={3} />
                </g>
              );
            })}
          </svg>

          <div
            style={{
              position: "absolute",
              left: 60,
              top: 0,
              width: 790,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {PORTALS.map((portal) => {
              const p = spring({
                frame: Math.max(0, frame - portal.enter),
                fps,
                config: MOTION.settle,
              });
              return (
                <div
                  key={portal.domain}
                  style={{
                    height: 87,
                    backgroundColor: COLORS.surface,
                    borderLeft: `6px solid ${COLORS.ink}`,
                    padding: "10px 18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 4,
                    opacity: interpolate(p, [0, 1], [0.25, 1]),
                    transform: `translateX(${interpolate(p, [0, 1], [16, 0])}px)`,
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontSize: 32,
                      fontWeight: 900,
                      color: COLORS.vermilion,
                      letterSpacing: 0.4,
                    }}
                  >
                    {portal.domain}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 24,
                      fontWeight: 600,
                      color: COLORS.ink,
                    }}
                  >
                    {portal.role}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anti-rumor bar */}
        <div
          style={{
            backgroundColor: COLORS.ink,
            color: COLORS.textOnDark,
            borderLeft: `8px solid ${COLORS.crimson}`,
            padding: "12px 18px",
            fontFamily: FONTS.body,
            fontSize: 25,
            fontWeight: 700,
          }}
        >
          Không trích tin đồn mạng · Không dùng văn bản đã hết hiệu lực
        </div>
      </div>
    </SceneShell>
  );
};

export default S05;
