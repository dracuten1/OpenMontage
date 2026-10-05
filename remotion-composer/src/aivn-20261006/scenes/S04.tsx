// S04: Consumer GPU Speed Race Bar Chart (RTX 4090 124, RTX 5070 94, RTX 2060 33, Human reading 60)
import React from "react";
import { interpolate, staticFile, useCurrentFrame } from "remotion";
import { Badge, ComparisonBarItem, HeadlineText, SceneBackground, SceneFrame, SourceTag } from "../components";
import { C, FONT, MONO_FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s04" as const;

const F = {
  badge: frameOf(ID, "Tốc"),
  title: frameOf(ID, "ấn"),
  bar4090: frameOf(ID, "124"),
  bar5070: frameOf(ID, "94"),
  bar2060: frameOf(ID, "33"),
  threshold: frameOf(ID, "gấp"),
};

export const S04: React.FC = () => {
  const frame = useCurrentFrame();

  const thresholdProgress = interpolate(frame, [F.threshold, F.threshold + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Calculate percentage for 60 tok/s on 140 max scale
  const thresholdPct = (60 / 140) * 100;

  return (
    <SceneFrame
      sceneId={ID}
      backdrop={
        <SceneBackground
          imageSrc={staticFile("aivn-20261006/images/scene_04_gpu_speed_race.png")}
          glowColor={C.glowAmber}
          glowCoords="50% 30%"
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
        <Badge text="BENCHMARK TỐC ĐỘ THỰC ĐO (TOKEN/GIÂY)" at={F.badge} tone="amber" />

        <HeadlineText
          text="TỐC ĐỘ THỰC TẾ: 124 TOK/S VƯỢT XA NGƯỠNG ĐỌC"
          at={F.title}
          align="center"
          fontSize={68}
          accent="124 TOK/S"
          accentColor={C.amber}
        />

        {/* Speed Race Container with Threshold Line */}
        <div
          style={{
            width: "100%",
            maxWidth: 1480,
            marginTop: 18,
            boxSizing: "border-box",
            padding: "36px 44px 28px 44px",
            borderRadius: 24,
            background: "rgba(22, 30, 46, 0.94)",
            border: `1px solid ${C.border}`,
            boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            position: "relative",
          }}
        >
          {/* RTX 4090 */}
          <ComparisonBarItem
            tag="FLAGSHIP"
            label="NVIDIA GeForce RTX 4090 (24GB VRAM)"
            value={124}
            maxValue={140}
            unit="tok/s"
            at={F.bar4090}
            tone="amber"
            barDuration={24}
            note="Siêu tốc độ"
          />

          {/* RTX 5070 */}
          <ComparisonBarItem
            tag="THẾ HỆ MỚI"
            label="NVIDIA GeForce RTX 5070 (12GB VRAM)"
            value={94}
            maxValue={140}
            unit="tok/s"
            at={F.bar5070}
            tone="emerald"
            barDuration={24}
            note="Phổ biến tầm trung"
          />

          {/* RTX 2060 */}
          <ComparisonBarItem
            tag="CARD CŨ 2019"
            label="NVIDIA GeForce RTX 2060 (8GB/12GB)"
            value={33}
            maxValue={140}
            unit="tok/s"
            at={F.bar2060}
            tone="blue"
            barDuration={24}
            note="Vẫn chạy mượt mà"
          />

          {/* 60 tok/s Threshold Vertical Marker */}
          {frame >= F.threshold ? (
            <div
              style={{
                position: "absolute",
                top: 20,
                bottom: 20,
                left: `calc(44px + (100% - 88px) * ${thresholdPct / 100})`,
                width: 2,
                opacity: thresholdProgress,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
                zIndex: 20,
              }}
            >
              <div
                style={{
                  width: 2,
                  height: "100%",
                  background: `dashed 2px ${C.red}`,
                  boxShadow: `0 0 10px ${C.red}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: -14,
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  padding: "4px 12px",
                  borderRadius: 6,
                  background: C.redFill,
                  color: C.white,
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 16,
                  letterSpacing: 0.8,
                  boxShadow: `0 0 12px ${C.red}`,
                }}
              >
                NGƯỠNG ĐỌC MẮT NGƯỜI (60 tok/s)
              </div>
            </div>
          ) : null}
        </div>

        {/* Highlight Summary Card */}
        <Spoken at={F.threshold} fromY={16}>
          <div
            style={{
              padding: "12px 28px",
              borderRadius: 14,
              background: "rgba(15, 23, 42, 0.8)",
              border: `1px solid ${C.amberFill}55`,
              color: C.textSoft,
              fontSize: 22,
              fontFamily: FONT,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span style={{ color: C.amber, fontWeight: 700, fontFamily: MONO_FONT }}>
              ⚡ KẾT LUẬN:
            </span>
            <span>
              RTX 4090 nhanh gấp đôi tốc độ đọc, RTX 5070 vẫn nhanh hơn đọc — ngay cả GPU cũ vẫn chạy được!
            </span>
          </div>
        </Spoken>

        <SourceTag
          source="Hacker News Thread #49953495 Benchmarks & Strata README"
          at={F.bar4090}
          style={{ marginTop: 6 }}
        />
      </div>
    </SceneFrame>
  );
};

export default S04;
