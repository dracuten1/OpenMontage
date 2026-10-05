// S05 -- fuel comparison. Two 50/50 comparison cards with a divider; delta badges and prices fire on spoken numbers.
// Narration: "Xăng E5 RON 92 tăng 172 đồng, lên tối đa 26.569 đồng mỗi lít. Ngược lại, diesel giảm mạnh 780 đồng,
// xuống còn 29.717 đồng một lít nhờ giá dầu thế giới hạ nhiệt."
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { CountUp, SceneFrame } from "../components";
import { C, FONT, toneFill, toneText, type Tone } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s05" as const;
const F = {
  e5: frameOf(ID, "Xăng"),
  e5Delta: frameOf(ID, "172"),
  e5Max: frameOf(ID, "tối đa"),
  e5Price: frameOf(ID, "26.569"),
  contrast: frameOf(ID, "Ngược lại"),
  dz: frameOf(ID, "diesel"),
  dzDelta: frameOf(ID, "780"),
  dzStill: frameOf(ID, "còn"),
  dzPrice: frameOf(ID, "29.717"),
  note: frameOf(ID, "Giá dầu"),
  noteEnd: frameOf(ID, "hạ nhiệt"),
};

const Card: React.FC<{
  at: number;
  fromX: number;
  tone: Tone;
  title: string;
  sub: string;
  deltaAt: number;
  deltaTo: number;
  deltaPrefix: string;
  priceAt: number;
  priceTo: number;
  priceTag?: { at: number; text: string };
  dir: "up" | "down";
}> = ({ at, fromX, tone, title, sub, deltaAt, deltaTo, deltaPrefix, priceAt, priceTo, priceTag, dir }) => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [priceAt, priceAt + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Spoken at={at} fromX={fromX} fromY={0}>
      <div
        style={{
          width: 820, height: 560, boxSizing: "border-box", padding: "30px 40px", borderRadius: 30, background: C.surface,
          border: `1px solid ${C.border}`, borderTop: `8px solid ${toneFill(tone)}`, fontFamily: FONT,
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: `0 0 ${glow * 36}px ${toneFill(tone)}33`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 56, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{title}</div>
            <div style={{ fontSize: 30, fontWeight: 500, color: C.muted, marginTop: 4 }}>{sub}</div>
          </div>
          <div style={{ height: 84, width: 250, display: "flex", justifyContent: "flex-end" }}>
            <Spoken at={deltaAt} fromY={-16} fromScale={0.9}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 999,
                  background: toneFill(tone), color: C.onAmber, fontSize: 48, fontWeight: 800, whiteSpace: "nowrap",
                }}
              >
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={C.onAmber} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                  {dir === "up" ? <path d="M12 19 V5 M5 12 L12 5 L19 12" /> : <path d="M12 5 V19 M5 12 L12 19 L19 12" />}
                </svg>
                <CountUp at={deltaAt} to={deltaTo} duration={14} prefix={deltaPrefix} suffix="đ" />
              </div>
            </Spoken>
          </div>
        </div>

        <div>
          <div style={{ height: 40 }}>
            {priceTag ? (
              <Spoken at={priceTag.at} fromY={8}>
                <div style={{ fontSize: 32, fontWeight: 600, color: C.textSoft }}>{priceTag.text}</div>
              </Spoken>
            ) : null}
          </div>
          <div style={{ height: 150, display: "flex", alignItems: "baseline", color: toneText(tone), fontWeight: 800, fontSize: 136, lineHeight: "150px", letterSpacing: -2 }}>
            <CountUp at={priceAt} to={priceTo} duration={26} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 600, color: C.textSoft }}>đồng/lít</div>
        </div>
      </div>
    </Spoken>
  );
};

const S05: React.FC = () => (
  <SceneFrame sceneId={ID} glow="rgba(245,158,11,0.16)">
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", height: 560 }}>
        <Card
          at={F.e5} fromX={-90} tone="amber" title="Xăng E5 RON 92" sub="Kỳ điều hành 01/10" dir="up"
          deltaAt={F.e5Delta} deltaTo={172} deltaPrefix="+" priceAt={F.e5Price} priceTo={26569}
          priceTag={{ at: F.e5Max, text: "Lên tối đa" }}
        />
        {/* divider */}
        <Spoken at={F.contrast} fromY={0} style={{ position: "absolute", left: 864 - 1, top: 20, bottom: 20 }}>
          <div style={{ width: 2, height: 520, background: `linear-gradient(180deg, transparent, ${C.muted}, transparent)` }} />
        </Spoken>
        <Card
          at={F.dz} fromX={90} tone="green" title="Dầu diesel" sub="Kỳ điều hành 01/10" dir="down"
          deltaAt={F.dzDelta} deltaTo={780} deltaPrefix="−" priceAt={F.dzPrice} priceTo={29717}
          priceTag={{ at: F.dzStill, text: "Xuống còn" }}
        />
      </div>
      <div style={{ height: 44 }}>
        <Spoken at={F.note} fromY={10}>
          <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 500, color: C.textSoft, textAlign: "center" }}>
            Giá dầu thế giới hạ nhiệt: WTI khoảng 91,11 USD/thùng · Brent khoảng 102,30 USD/thùng
          </div>
        </Spoken>
      </div>
    </div>
  </SceneFrame>
);

export default S05;
