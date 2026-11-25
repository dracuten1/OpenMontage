// S07 — Tuyên bố tham khảo, hành động người xem & CTA trước Outro Bumper
import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, MOTION } from "../../channels/ky-chu-phap-luat/theme";
import { CtaBand, SceneShell } from "../../core/SceneShell";

const ACTIONS = [
  { label: "THEO DÕI KÊNH", desc: "Nhận cập nhật Nghị định & Luật mới mỗi ngày" },
  { label: "LƯU VIDEO NÀY", desc: "Tra cứu lại 6 mảng và 5 cổng chính thống khi cần" },
  { label: "BÌNH LUẬN TÌNH HUỐNG", desc: "Kênh tổng hợp và giải thích theo văn bản hiện hành" },
];

export const S07: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sealSpring = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: MOTION.pop,
  });
  const lineDraw = interpolate(frame, [20, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell
      sceneId="S07"
      label="Tuyên bố tham khảo & CTA"
      kicker="KÝ CHỦ PHÁP LUẬT · CHUẨN MỰC & ĐỒNG HÀNH"
      accent="amber"
      layoutMode="swiss-split"
      showHud={showHud}
    >
      <div
        data-editorial-spotlight="true"
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
        {/* Crest with Official Channel Paper Seal Avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            borderBottom: `4px solid ${COLORS.ink}`,
            paddingBottom: 18,
            transform: `scale(${interpolate(sealSpring, [0, 1], [0.94, 1])})`,
          }}
        >
          <Img
            src={staticFile("channels/ky-chu-phap-luat/brand/avatar_paper_seal.png")}
            style={{ width: 112, height: 112, objectFit: "cover" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 58,
                fontWeight: 900,
                color: COLORS.ink,
                lineHeight: 1.0,
              }}
            >
              CÔNG BÁO THU NHỎ CỦA BẠN
            </div>
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 26,
                fontWeight: 700,
                color: COLORS.vermilion,
              }}
            >
              Hiểu đúng luật trong 60 giây · Rõ nguồn · Không bịa điều khoản
            </div>
          </div>
        </div>

        {/* SVG Checkmarks + 3 Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ACTIONS.map((act, idx) => {
            const p = spring({
              frame: Math.max(0, frame - (48 + idx * 28)),
              fps,
              config: MOTION.settle,
            });
            return (
              <div
                key={act.label}
                style={{
                  backgroundColor: COLORS.surface,
                  borderLeft: `8px solid ${idx === 2 ? COLORS.crimson : COLORS.vermilion}`,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  opacity: interpolate(p, [0, 1], [0.25, 1]),
                  transform: `translateX(${interpolate(p, [0, 1], [14, 0])}px)`,
                }}
              >
                <svg width={40} height={40} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
                  <rect x={2} y={2} width={36} height={36} fill={COLORS.ink} />
                  <path
                    d="M 10 21 L 17 28 L 30 13"
                    fill="none"
                    stroke={COLORS.highlighter}
                    strokeWidth={4}
                    strokeLinecap="square"
                    strokeDasharray={36}
                    strokeDashoffset={36 * (1 - lineDraw)}
                  />
                </svg>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontSize: 32,
                      fontWeight: 900,
                      color: COLORS.ink,
                    }}
                  >
                    {act.label}
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 25, fontWeight: 600, color: COLORS.muted }}>
                    {act.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legal Disclaimer Box */}
        <div
          style={{
            backgroundColor: COLORS.paperWarm,
            borderLeft: `8px solid ${COLORS.ochre}`,
            padding: "16px 20px",
            fontFamily: FONTS.body,
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.4,
            color: COLORS.ink,
          }}
        >
          TUYÊN BỐ THAM KHẢO: Thông tin phổ biến pháp luật mang tính tham khảo theo văn bản hiện hành tại thời điểm phát hành.
        </div>

        {/* Safe Zone CTA Band */}
        <div style={{ marginTop: 8 }}>
          <CtaBand text="BÌNH LUẬN TÌNH HUỐNG BẠN ĐANG GẶP BÊN DƯỚI" />
        </div>
      </div>
    </SceneShell>
  );
};

export default S07;
