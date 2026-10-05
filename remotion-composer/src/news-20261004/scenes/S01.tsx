// S01 -- HOOK / overview. Hero title + 4 indicator chips, each fired by its spoken word.
// Narration: "Chốt tuần 04/10: GDP quý 3 tăng 9,95%, cao nhất nhiều năm. Xăng dầu trái chiều, lãi suất chênh gần 2 điểm,
// vàng giảm sâu. Túi tiền của bạn ra sao?"
import React from "react";
import { useCurrentFrame } from "remotion";
import { Badge, CountUp, HeadlineText, SceneFrame } from "../components";
import { C, FONT, toneFill, toneText, type Tone } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s01" as const;
const F = {
  title: frameOf(ID, "Chốt"),
  badge: frameOf(ID, "04/10"),
  sub: frameOf(ID, "04/10", 1, 4),
  gdp: frameOf(ID, "GDP"),
  gdpVal: frameOf(ID, "9,95%"),
  gdpNote: frameOf(ID, "cao nhất"),
  fuel: frameOf(ID, "Xăng"),
  fuelVal: frameOf(ID, "trái"),
  rate: frameOf(ID, "lãi suất"),
  rateVal: frameOf(ID, "gần"),
  gold: frameOf(ID, "vàng"),
  goldVal: frameOf(ID, "giảm"),
  hook: frameOf(ID, "Túi tiền"),
};

const ArrowSvg: React.FC<{ dir: "up" | "down"; color: string; size?: number }> = ({ dir, color, size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    {dir === "up" ? <path d="M6 17 L17 6 M8 6 H17 V15" /> : <path d="M6 7 L17 18 M8 18 H17 V9" />}
  </svg>
);

const Chip: React.FC<{
  at: number;
  label: string;
  tone: Tone;
  noteAt: number;
  note: string;
  children: React.ReactNode;
}> = ({ at, label, tone, noteAt, note, children }) => {
  const frame = useCurrentFrame();
  // soft glow ring that breathes once the chip has landed
  const since = Math.max(0, frame - at);
  const pulse = since > 10 ? 0.5 + 0.5 * Math.sin((since - 10) / 9) : 0;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
    <Spoken at={at} fromY={34} fromScale={0.94}>
      <div
        style={{
          height: 236, boxSizing: "border-box", padding: "18px 24px", borderRadius: 22, background: C.surface,
          border: `1px solid ${C.border}`, borderTop: `6px solid ${toneFill(tone)}`, fontFamily: FONT,
          boxShadow: `0 0 ${12 + pulse * 22}px ${toneFill(tone)}${pulse > 0 ? "55" : "22"}`,
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, color: C.textSoft }}>{label}</div>
        <div style={{ height: 96, display: "flex", alignItems: "center", gap: 10, color: toneText(tone), fontWeight: 800, lineHeight: 1 }}>{children}</div>
        <div style={{ height: 34 }}>
          <Spoken at={noteAt} fromY={8}>
            <div style={{ fontSize: 28, fontWeight: 500, color: C.muted, whiteSpace: "nowrap" }}>{note}</div>
          </Spoken>
        </div>
      </div>
    </Spoken>
    </div>
  );
};

const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const hookGlow = frame < F.hook ? 0 : 14 + 14 * (0.5 + 0.5 * Math.sin((frame - F.hook) / 7));
  return (
    <SceneFrame sceneId={ID} glow="rgba(37,99,235,0.30)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <Badge text="CHỐT TUẦN 04/10" at={F.badge} tone="blue" />
        <HeadlineText
          text="BẢN TIN TÀI CHÍNH THỰC CHIẾN"
          at={F.title}
          align="center"
          maxLines={2}
          fontSize={100}
          maxWidth={1500}
          accent="THỰC CHIẾN"
          accentColor={C.blue}
        />
        <Spoken at={F.sub} fromY={16}>
          <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 600, color: C.textSoft, textAlign: "center" }}>
            5 biến số đổi hướng túi tiền
          </div>
        </Spoken>

        <div style={{ display: "flex", gap: 24, width: "100%", marginTop: 18, height: 236 }}>
          <Chip at={F.gdp} label="GDP quý III" tone="green" noteAt={F.gdpNote} note="cao nhất nhiều năm">
            <CountUp at={F.gdpVal} to={9.95} decimals={2} prefix="+" suffix="%" duration={22} style={{ fontSize: 84 }} />
          </Chip>
          <Chip at={F.fuel} label="Xăng dầu" tone="amber" noteAt={F.fuelVal} note="trái chiều">
            <Spoken at={F.fuelVal} fromY={10} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <ArrowSvg dir="up" color={C.amber} size={72} />
              <ArrowSvg dir="down" color={C.green} size={72} />
            </Spoken>
          </Chip>
          <Chip at={F.rate} label="Lãi suất chênh" tone="blue" noteAt={F.rateVal} note="tiền gửi 12 tháng">
            <Spoken at={F.rateVal} fromY={10} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: 30, color: C.textSoft, fontWeight: 600 }}>gần</span>
              <span style={{ fontSize: 84 }}>2</span>
              <span style={{ fontSize: 30, color: C.textSoft, fontWeight: 600 }}>điểm %</span>
            </Spoken>
          </Chip>
          <Chip at={F.gold} label="Vàng" tone="red" noteAt={F.goldVal} note="giảm trong tuần">
            <Spoken at={F.goldVal} fromY={10} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ArrowSvg dir="down" color={C.red} size={60} />
              <span style={{ fontSize: 52 }}>giảm sâu</span>
            </Spoken>
          </Chip>
        </div>

        <div style={{ height: 96, display: "flex", alignItems: "center", marginTop: 8 }}>
          <Spoken at={F.hook} fromY={26} fromScale={0.96}>
            <div
              style={{
                fontFamily: FONT, fontSize: 68, fontWeight: 800, color: C.amber, textAlign: "center",
                textShadow: `0 0 ${hookGlow}px rgba(251,191,36,0.55)`,
              }}
            >
              Túi tiền của bạn ra sao?
            </div>
          </Spoken>
        </div>
      </div>
    </SceneFrame>
  );
};

export default S01;
