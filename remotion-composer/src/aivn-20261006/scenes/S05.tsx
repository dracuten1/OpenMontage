// S05: Benchmark Quality: SWE-bench Pro Comparison (Qwen 62.5 vs Claude Opus 4.6 53.4, DeepSWE 58.7, 1/9 Cost)
import React from "react";
import { staticFile } from "remotion";
import { Badge, ComparisonBarItem, HeadlineText, SceneBackground, SceneFrame, SourceTag } from "../components";
import { C, FONT, MONO_FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s05" as const;

const F = {
  badge: frameOf(ID, "chất"),
  title: frameOf(ID, "62,5"),
  qwen: frameOf(ID, "62,5"),
  claude: frameOf(ID, "53,4"),
  deepswe: frameOf(ID, "58,7"),
  cost: frameOf(ID, "1/9"),
};

export const S05: React.FC = () => {
  return (
    <SceneFrame
      sceneId={ID}
      backdrop={
        <SceneBackground
          imageSrc={staticFile("aivn-20261006/images/scene_05_swebench_quality_benchmark.png")}
          glowColor={C.glowBlue}
          glowCoords="50% 25%"
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
        <Badge text="CHẤT LƯỢNG LẬP TRÌNH & SUY LUẬN (SWE-BENCH PRO)" at={F.badge} tone="blue" />

        <HeadlineText
          text="SWE-BENCH PRO: 62,5 ĐIỂM VƯỢT CLAUDE OPUS 4.6"
          at={F.title}
          align="center"
          fontSize={68}
          accent="62,5 ĐIỂM"
          accentColor={C.blue}
        />

        {/* Comparison Dashboard Grid */}
        <div
          style={{
            display: "flex",
            gap: 28,
            width: "100%",
            maxWidth: 1540,
            marginTop: 18,
          }}
        >
          {/* Left: Dual Bar Chart */}
          <div
            style={{
              flex: 1.5,
              padding: "36px 40px",
              borderRadius: 24,
              background: "rgba(22, 30, 46, 0.94)",
              border: `1px solid ${C.border}`,
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 20,
              }}
            >
              SWE-bench Pro Score (Độ chính xác kỹ thuật phần mềm)
            </div>

            <ComparisonBarItem
              tag="🏆 DẪN ĐẦU"
              label="Qwen 3.8 Flash-Next"
              value={62.5}
              maxValue={75}
              unit="pts"
              at={F.qwen}
              tone="blue"
              decimals={1}
              barDuration={24}
              note="Vượt mốc cao nhất"
            />

            <ComparisonBarItem
              tag="THAM CHIẾU"
              label="Claude Opus 4.6"
              value={53.4}
              maxValue={75}
              unit="pts"
              at={F.claude}
              tone="amber"
              decimals={1}
              barDuration={24}
              note="Khoảng cách +9.1 điểm"
            />
          </div>

          {/* Right: Complementary Badges & Compute Cost */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* DeepSWE Badge Card */}
            <Spoken at={F.deepswe} fromX={24} fromScale={0.95}>
              <div
                style={{
                  padding: "28px 32px",
                  borderRadius: 20,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderLeft: `6px solid ${C.emeraldFill}`,
                  boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 20px ${C.glowEmerald}`,
                }}
              >
                <div style={{ fontSize: 20, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>
                  DeepSWE Benchmark
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
                  <span style={{ fontSize: 62, fontWeight: 800, color: C.emerald, fontFamily: MONO_FONT }}>
                    58,7
                  </span>
                  <span style={{ fontSize: 26, color: C.textSoft, fontWeight: 600 }}>điểm</span>
                </div>
                <div style={{ fontSize: 18, color: C.muted, marginTop: 6 }}>
                  Kiểm thử khả năng giải quyết bug phức tạp
                </div>
              </div>
            </Spoken>

            {/* 1/9 Training Cost Badge Card */}
            <Spoken at={F.cost} fromX={24} fromScale={0.95}>
              <div
                style={{
                  padding: "28px 32px",
                  borderRadius: 20,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderLeft: `6px solid ${C.amberFill}`,
                  boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 20px ${C.glowAmber}`,
                }}
              >
                <div style={{ fontSize: 20, color: C.amber, fontWeight: 700, textTransform: "uppercase" }}>
                  Hiệu Quả Huấn Luyện
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
                  <span style={{ fontSize: 62, fontWeight: 800, color: C.amber, fontFamily: MONO_FONT }}>
                    1/9
                  </span>
                  <span style={{ fontSize: 24, color: C.text, fontWeight: 700 }}>chi phí</span>
                </div>
                <div style={{ fontSize: 18, color: C.textSoft, marginTop: 6 }}>
                  So với chi phí huấn luyện mô hình tiền nhiệm
                </div>
              </div>
            </Spoken>
          </div>
        </div>

        <SourceTag
          source="Qwen Official Blog: Benchmark Evaluation & Training Compute Metrics"
          at={F.claude}
          style={{ marginTop: 8 }}
        />
      </div>
    </SceneFrame>
  );
};

export default S05;
