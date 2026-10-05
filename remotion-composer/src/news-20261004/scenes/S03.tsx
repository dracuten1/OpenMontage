// S03 -- GDP evidence. Left: two stacked stat cards (Q3, 9 months). Right: three growth drivers listed as numbered rows.
// Narration: "GDP quý 3 ước tăng 9,95%. Tính chung 9 tháng, tăng 9,01%. Động lực chính đến từ công nghiệp chế biến chế tạo,
// đầu tư công và dịch vụ."
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { CountUp, SceneFrame } from "../components";
import { C, FONT, toneFill, toneText, type Tone } from "../theme";
import { Spoken, frameOf } from "../timing";

const ID = "s03" as const;
const F = {
  q3: frameOf(ID, "GDP"),
  q3Val: frameOf(ID, "9,95%"),
  m9: frameOf(ID, "Tính chung"),
  m9Val: frameOf(ID, "9,01%"),
  head: frameOf(ID, "Động lực"),
  d1: frameOf(ID, "công nghiệp"),
  d2: frameOf(ID, "đầu tư"),
  d3: frameOf(ID, "dịch vụ"),
};

const BigStat: React.FC<{
  at: number;
  valAt: number;
  label: string;
  to: number;
  note: string;
  tone: Tone;
}> = ({ at, valAt, label, to, note, tone }) => {
  const frame = useCurrentFrame();
  const done = interpolate(frame, [valAt + 20, valAt + 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Spoken at={at} fromY={30} fromScale={0.96}>
      <div
        style={{
          width: 800, height: 388, boxSizing: "border-box", padding: "28px 40px", borderRadius: 28, background: C.surface,
          border: `1px solid ${C.border}`, borderLeft: `10px solid ${toneFill(tone)}`, fontFamily: FONT,
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: `0 0 ${done * 34}px ${toneFill(tone)}33`,
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, color: C.textSoft }}>{label}</div>
        <div style={{ height: 190, display: "flex", alignItems: "center", color: toneText(tone), fontWeight: 800, fontSize: 176, lineHeight: 1, letterSpacing: -3 }}>
          <CountUp at={valAt} to={to} decimals={2} prefix="+" suffix="%" duration={26} />
        </div>
        <div style={{ fontSize: 30, fontWeight: 500, color: C.muted }}>{note}</div>
      </div>
    </Spoken>
  );
};

const DRIVERS: { at: number; title: string }[] = [
  { at: F.d1, title: "Công nghiệp chế biến chế tạo" },
  { at: F.d2, title: "Đầu tư công" },
  { at: F.d3, title: "Dịch vụ" },
];

const Driver: React.FC<{ at: number; n: number; title: string }> = ({ at, n, title }) => (
  <Spoken at={at} fromY={44} fromScale={0.97}>
    <div
      style={{
        display: "flex", alignItems: "center", gap: 28, padding: "0 32px", height: 168, boxSizing: "border-box", borderRadius: 24,
        background: C.surfaceHi, border: `1px solid ${C.border}`, fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 80, height: 80, borderRadius: 40, background: C.greenFill, color: C.onAmber, fontSize: 48, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.text, lineHeight: 1.15 }}>{title}</div>
      </div>
    </div>
  </Spoken>
);

const S03: React.FC = () => (
  <SceneFrame sceneId={ID} glow="rgba(16,185,129,0.20)">
    <div style={{ flex: 1, display: "flex", gap: 56, alignItems: "stretch" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 800 }}>
        <BigStat at={F.q3} valAt={F.q3Val} label="GDP quý III/2026" to={9.95} note="so với cùng kỳ" tone="green" />
        <BigStat at={F.m9} valAt={F.m9Val} label="GDP 9 tháng đầu năm" to={9.01} note="cao nhất nhiều năm" tone="blue" />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
        <div style={{ height: 60 }}>
          <Spoken at={F.head} fromY={16}>
            <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 800, color: C.green }}>Động lực tăng trưởng chính</div>
          </Spoken>
        </div>
        {DRIVERS.map((d, i) => (
          <div key={d.title} style={{ height: 168 }}>
            <Driver at={d.at} n={i + 1} title={d.title} />
          </div>
        ))}
      </div>
    </div>
  </SceneFrame>
);

export default S03;
