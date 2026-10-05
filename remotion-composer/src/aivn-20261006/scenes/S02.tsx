// S02: Strata viral community explosion (GitHub stars & Hacker News #1 frontpage)
import React from "react";
import { staticFile } from "remotion";
import { Badge, HeadlineText, SceneBackground, SceneFrame, SourceTag, StatCard } from "../components";
import { C, FONT, MONO_FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s02" as const;

const F = {
  badge: frameOf(ID, "11"),
  title: frameOf(ID, "Strata"),
  stars: frameOf(ID, "12.499"),
  github: frameOf(ID, "GitHub"),
  hn: frameOf(ID, "Hacker"),
  points: frameOf(ID, "825"),
  comments: frameOf(ID, "365"),
};

export const S02: React.FC = () => {
  return (
    <SceneFrame
      sceneId={ID}
      backdrop={
        <SceneBackground
          imageSrc={staticFile("aivn-20261006/images/scene_02_strata_github_community.png")}
          glowColor={C.glowAmber}
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
          gap: 16,
          paddingTop: 10,
        }}
      >
        <Badge text="TĂNG TRƯỞNG KỶ LỤC TRONG 11 NGÀY" at={F.badge} tone="amber" />

        <HeadlineText
          text="CỘNG ĐỒNG BÙNG NỔ: 12.499 SAO & TOP 1 HACKER NEWS"
          at={F.title}
          align="center"
          fontSize={70}
          accent="12.499 SAO"
          accentColor={C.amber}
        />

        {/* Repository Header Tag */}
        <Spoken at={F.title} fromY={16}>
          <div
            style={{
              padding: "10px 24px",
              borderRadius: 14,
              background: "rgba(22, 30, 46, 0.9)",
              border: `1px solid ${C.borderHi}`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: MONO_FONT,
            }}
          >
            <span style={{ color: C.amber, fontWeight: 700, fontSize: 22 }}>📁 REPO:</span>
            <span style={{ color: C.text, fontWeight: 700, fontSize: 24 }}>Niko1221/Strata</span>
            <span
              style={{
                padding: "2px 10px",
                borderRadius: 6,
                background: `${C.blueFill}22`,
                border: `1px solid ${C.blueFill}55`,
                color: C.blue,
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              MIT LICENSE
            </span>
            <span
              style={{
                padding: "2px 10px",
                borderRadius: 6,
                background: `${C.emeraldFill}22`,
                border: `1px solid ${C.emeraldFill}55`,
                color: C.emerald,
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              C++ ENGINE
            </span>
          </div>
        </Spoken>

        {/* 3 Metric Cards Grid */}
        <div
          style={{
            display: "flex",
            gap: 28,
            width: "100%",
            maxWidth: 1540,
            marginTop: 14,
          }}
        >
          {/* Card 1: GitHub Stars */}
          <div style={{ flex: 1 }}>
            <StatCard
              at={F.stars}
              label="GitHub Stars"
              value={12499}
              suffix=" ⭐"
              tone="amber"
              width="100%"
              size={90}
              countDuration={26}
              note="11 ngày từ khi phát hành (24/09 – 05/10/2026)"
            />
          </div>

          {/* Card 2: Hacker News #1 */}
          <div style={{ flex: 1 }}>
            <Spoken at={F.hn} fromY={28} fromScale={0.95}>
              <div
                style={{
                  boxSizing: "border-box",
                  padding: "32px 36px",
                  borderRadius: 24,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderTop: `5px solid #FF6600`,
                  boxShadow: `0 16px 36px -8px rgba(0, 0, 0, 0.7), 0 0 24px rgba(255, 102, 0, 0.2)`,
                  fontFamily: FONT,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#FF6600",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  Hacker News Frontpage
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    lineHeight: 1,
                    fontFamily: MONO_FONT,
                  }}
                >
                  <div
                    style={{
                      fontSize: 90,
                      fontWeight: 800,
                      color: C.text,
                      letterSpacing: -2,
                    }}
                  >
                    #1
                  </div>
                  <span
                    style={{
                      fontSize: 34,
                      fontWeight: 700,
                      color: "#FF6600",
                      fontFamily: FONT,
                    }}
                  >
                    DẪN ĐẦU
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 20,
                    color: C.muted,
                    marginTop: 18,
                    lineHeight: 1.4,
                    borderTop: `1px solid ${C.borderSubtle}`,
                    paddingTop: 12,
                  }}
                >
                  Vị trí số một trên bảng xếp hạng công nghệ toàn cầu
                </div>
              </div>
            </Spoken>
          </div>

          {/* Card 3: Upvotes & Comments */}
          <div style={{ flex: 1 }}>
            <StatCard
              at={F.points}
              label="HN Điểm & Thảo Luận"
              value={825}
              suffix=" pts"
              tone="blue"
              width="100%"
              size={90}
              countDuration={22}
              note="365 bình luận sôi nổi từ giới kỹ sư AI"
            />
          </div>
        </div>

        <SourceTag
          source="GitHub API & Hacker News Algolia Thread #49953495"
          at={F.hn}
          style={{ marginTop: 10 }}
        />
      </div>
    </SceneFrame>
  );
};

export default S02;
