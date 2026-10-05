// S02 -- HEADLINE GDP. Left-third text block over a concept illustration (right), Ken-Burns drift.
// Narration: "Tin vĩ mô: GDP quý 3 bứt phá, tăng trưởng 9 tháng cao nhất nhiều năm."
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Badge, IllustrationFrame, SceneFrame } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf, frameOfEnd } from "../timing";

const ID = "s02" as const;
const F = {
  img: 0,
  badge: frameOf(ID, "vĩ"),
  gdp: frameOf(ID, "GDP"),
  burst: frameOf(ID, "bứt"),
  kick1: frameOf(ID, "tăng"),
  kick2: frameOf(ID, "cao nhất"),
  kickEnd: frameOfEnd(ID, "năm"),
};

const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const underline = interpolate(frame, [F.kick2, F.kickEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <SceneFrame sceneId={ID} glow="rgba(245,158,11,0.18)">
      {/* illustration, right ~60%, left edge feathered into the background */}
      <div style={{ position: "absolute", right: 0, top: 0, width: 1060, height: 780 }}>
        <IllustrationFrame
          name="img_gdp"
          at={F.img}
          width={1060}
          height={780}
          rounded={28}
          zoom={1.06}
          driftX={-14}
          driftY={-8}
          style={{
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 38%)",
            maskImage: "linear-gradient(90deg, transparent 0%, #000 38%)",
          }}
        />
      </div>

      {/* text block, left third */}
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: 20, width: 880, fontFamily: FONT }}>
        <Badge text="VĨ MÔ" at={F.badge} tone="blue" size={32} />
        <Spoken at={F.gdp} fromY={36}>
          <div style={{ fontSize: 120, fontWeight: 800, color: C.text, lineHeight: 1.05, letterSpacing: -1 }}>GDP quý III</div>
        </Spoken>
        <Spoken at={F.burst} fromY={36} fromScale={0.96}>
          <div style={{ fontSize: 120, fontWeight: 800, color: C.green, lineHeight: 1.05, letterSpacing: -1 }}>bứt phá</div>
        </Spoken>
        <div style={{ marginTop: 14, width: 640 }}>
          <div style={{ fontSize: 44, fontWeight: 600, color: C.textSoft, lineHeight: 1.25, minHeight: 112 }}>
            <Spoken at={F.kick1} fromY={14}>Tăng trưởng 9 tháng</Spoken>
            <Spoken at={F.kick2} fromY={14} style={{ color: C.amber }}>cao nhất nhiều năm</Spoken>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: C.amberFill, width: `${underline * 100}%`, marginTop: 6 }} />
        </div>
      </div>
    </SceneFrame>
  );
};

export default S02;
