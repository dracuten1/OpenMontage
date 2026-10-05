// S04 -- fuel headline / transition. Centered title over the fuel illustration; two divergent arrows left/right.
// Narration: "Chi phí đời sống: xăng nhích nhẹ, diesel giảm sâu ở kỳ điều chỉnh ngày 01/10."
import React from "react";
import { Badge, IllustrationFrame, SceneFrame } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s04" as const;
const F = {
  img: 0,
  badge: frameOf(ID, "Chi phí"),
  xang: frameOf(ID, "xăng"),
  xangW: frameOf(ID, "nhích"),
  diesel: frameOf(ID, "diesel"),
  dieselW: frameOf(ID, "giảm"),
  kicker: frameOf(ID, "01/10"),
};

const Arrow: React.FC<{ dir: "up" | "down"; color: string }> = ({ dir, color }) => (
  <svg width={110} height={110} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
    {dir === "up" ? <path d="M6 17 L17 6 M8 6 H17 V15" /> : <path d="M6 7 L17 18 M8 18 H17 V9" />}
  </svg>
);

const Side: React.FC<{ at: number; dir: "up" | "down"; color: string; wordAt: number; word: string; title: string; fromX: number }> = ({ at, dir, color, wordAt, word, title, fromX }) => (
  <Spoken at={at} fromX={fromX} fromY={0}>
    <div
      style={{
        width: 780, height: 330, boxSizing: "border-box", borderRadius: 28, background: "rgba(13,17,23,0.82)", border: `2px solid ${color}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: FONT,
      }}
    >
      <Arrow dir={dir} color={color} />
      <div style={{ fontSize: 112, fontWeight: 800, color, lineHeight: 1.05, letterSpacing: -1 }}>{title}</div>
      <div style={{ height: 56 }}>
        <Spoken at={wordAt} fromY={12}>
          <div style={{ fontSize: 44, fontWeight: 600, color: C.text }}>{word}</div>
        </Spoken>
      </div>
    </div>
  </Spoken>
);

const S04: React.FC = () => (
  <SceneFrame sceneId={ID} glow="rgba(245,158,11,0.20)">
    <div style={{ position: "absolute", left: 0, top: 0, width: 1728, height: 816 }}>
      <IllustrationFrame name="img_fuel" at={F.img} width={1728} height={816} rounded={32} scrim={0.55} zoom={1.08} driftX={-20} driftY={-6} />
    </div>
    <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
      <Badge text="CHI PHÍ" at={F.badge} tone="amber" size={34} />
      <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
        <Side at={F.xang} fromX={-70} dir="up" color={C.amber} wordAt={F.xangW} title="XĂNG" word="nhích nhẹ" />
        <Side at={F.diesel} fromX={70} dir="down" color={C.green} wordAt={F.dieselW} title="DIESEL" word="giảm sâu" />
      </div>
      <div style={{ height: 60 }}>
        <Spoken at={F.kicker} fromY={14}>
          <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 600, color: C.text, background: "rgba(13,17,23,0.82)", padding: "6px 28px", borderRadius: 14 }}>
            Kỳ điều hành giá xăng dầu 01/10
          </div>
        </Spoken>
      </div>
    </div>
  </SceneFrame>
);

export default S04;
