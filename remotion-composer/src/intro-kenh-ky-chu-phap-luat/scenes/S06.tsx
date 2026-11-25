// S06 — Quy trình kiểm chứng 3 lớp (Legal Verification Gate)
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, MOTION } from "../../channels/ky-chu-phap-luat/theme";
import { SceneShell, VerdictStamp } from "../../core/SceneShell";

const STEPS = [
  {
    step: "BƯỚC 1",
    title: "XÁC MINH CÒN HIỆU LỰC HIỆN HÀNH",
    detail: "Kiểm tra đủ 3 thông số: Số hiệu văn bản · Điều / Khoản · Ngày hiệu lực",
    metric: "3 THÔNG SỐ",
    accent: COLORS.vermilion,
    enter: 24,
  },
  {
    step: "BƯỚC 2",
    title: "KHÓA 100% CON SỐ & ĐIỀU KHOẢN",
    detail: "Mọi mức phạt, số ngày và tỷ lệ đều khóa vào bảng đối chiếu — cấm suy diễn",
    metric: "100% KHỚP",
    accent: COLORS.ochre,
    enter: 112,
  },
  {
    step: "BƯỚC 3",
    title: "DIỄN GIẢI TRUNG TÍNH · RÕ NGUỒN",
    detail: "Giải thích dễ hiểu, không kích động, luôn gắn nguồn trích dẫn và miễn trừ",
    metric: "MINH BẠCH",
    accent: COLORS.ink,
    enter: 185,
  },
];

export const S06: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spineDraw = interpolate(frame, [24, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell
      sceneId="S06"
      label="Quy trình verify 3 lớp"
      kicker="LEGAL VERIFICATION GATE · CHỐNG BỊA ĐIỀU KHOẢN"
      accent="crimson"
      layoutMode="swiss-split"
      showHud={showHud}
    >
      <div
        data-flow-timeline="true"
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
              fontSize: 58,
              fontWeight: 900,
              color: COLORS.ink,
              lineHeight: 1.0,
            }}
          >
            KIỂM CHỨNG NHƯ THẾ NÀO?
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
            3 LỚP VERIFY
          </div>
        </div>

        {/* Vertical Timeline */}
        <div style={{ position: "relative", width: 850, minHeight: 650 }}>
          <svg
            width={64}
            height={630}
            viewBox="0 0 64 630"
            style={{ position: "absolute", left: 0, top: 0 }}
          >
            <line
              x1={32}
              y1={80}
              x2={32}
              y2={540}
              stroke={COLORS.vermilion}
              strokeWidth={5}
              strokeDasharray={460}
              strokeDashoffset={460 * (1 - spineDraw)}
            />
            {STEPS.map((st, idx) => {
              const cy = 84 + idx * 222;
              return (
                <g key={st.step}>
                  <circle cx={32} cy={cy} r={22} fill={COLORS.ink} />
                  <text
                    x={32}
                    y={cy + 9}
                    textAnchor="middle"
                    fill={COLORS.highlighter}
                    fontFamily={FONTS.display}
                    fontSize={26}
                    fontWeight={900}
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          <div
            style={{
              position: "absolute",
              left: 76,
              top: 0,
              width: 774,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {STEPS.map((st) => {
              const p = spring({
                frame: Math.max(0, frame - st.enter),
                fps,
                config: MOTION.settle,
              });
              return (
                <div
                  key={st.step}
                  style={{
                    minHeight: 196,
                    backgroundColor: COLORS.surface,
                    borderTop: `6px solid ${st.accent}`,
                    borderBottom: `2px solid ${COLORS.ink}`,
                    padding: "18px 22px",
                    opacity: interpolate(p, [0, 1], [0.22, 1]),
                    transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 10,
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div
                      style={{
                        fontFamily: FONTS.display,
                        fontSize: 25,
                        fontWeight: 900,
                        color: st.accent,
                        letterSpacing: 1.0,
                      }}
                    >
                      {st.step}
                    </div>
                    <div
                      style={{
                        backgroundColor: COLORS.paperWarm,
                        color: COLORS.ink,
                        fontFamily: FONTS.display,
                        fontSize: 24,
                        fontWeight: 900,
                        padding: "4px 12px",
                      }}
                    >
                      {st.metric}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontSize: 38,
                      fontWeight: 900,
                      color: COLORS.ink,
                      lineHeight: 1.08,
                    }}
                  >
                    {st.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 25,
                      fontWeight: 600,
                      lineHeight: 1.35,
                      color: COLORS.muted,
                    }}
                  >
                    {st.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verdict Stamp */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <VerdictStamp text="ĐÃ KIỂM CHỨNG NGUỒN GỐC" enterFrame={198} color={COLORS.vermilion} />
        </div>
      </div>
    </SceneShell>
  );
};

export default S06;
