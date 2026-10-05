// S12 -- NHẬN ĐỊNH 1 (vĩ mô và đời sống). Editorial badge on top, two cause -> implication pillars.
// Speech-locked: 9% on "9%", income outcome on "nền", +172đ on "172", fuel outcome on "chi phí",
// diesel row on "diesel", logistics on "logistics", goods price on "giá hàng hóa".
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { CountUp, SceneFrame } from "../components";
import { C, FONT, toneFill, toneText, type Tone } from "../theme";
import { Spoken, frameOf } from "../timing";

const S = "s12" as const;
const fBadge = 0; // "Nhận"
const fL = frameOf(S, "Tăng");
const fL9 = frameOf(S, "9%");
const fLOut = frameOf(S, "nền");
const fR = frameOf(S, "Xăng");
const fR172 = frameOf(S, "172");
const fROut = frameOf(S, "chi phí");
const fDiesel = frameOf(S, "diesel");
const fLogi = frameOf(S, "logistics");
const fGoods = frameOf(S, "giá hàng hóa");

const Arrow: React.FC<{ at: number; tone: Tone }> = ({ at, tone }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width="60" height="56" viewBox="0 0 60 56" style={{ display: "block", opacity: p }}>
      <path d={`M30 2 L30 ${2 + 40 * p}`} stroke={toneFill(tone)} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M12 30 L30 50 L48 30" stroke={toneFill(tone)} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
};

const Outcome: React.FC<{ at: number; tone: Tone; title: string; extraAt?: number; extra?: string }> = ({ at, tone, title, extraAt, extra }) => (
  <Spoken at={at} fromY={18}>
    <div
      style={{
        padding: "18px 26px", borderRadius: 18, background: C.surfaceHi, borderLeft: `8px solid ${toneFill(tone)}`,
        fontFamily: FONT, fontSize: 38, fontWeight: 700, color: C.text, lineHeight: 1.22,
      }}
    >
      {title}
      {extra && extraAt !== undefined ? (
        <Spoken at={extraAt} fromY={8}>
          <div style={{ marginTop: 6, fontSize: 34, fontWeight: 600, color: toneText(tone) }}>{extra}</div>
        </Spoken>
      ) : null}
    </div>
  </Spoken>
);

const Pillar: React.FC<{ at: number; tone: Tone; tag: string; children: React.ReactNode }> = ({ at, tone, tag, children }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <Spoken at={at} fromY={0} fromX={at === fL ? -60 : 60}>
      <div
        style={{
          height: 604, boxSizing: "border-box", padding: "28px 36px", borderRadius: 28, background: C.surface,
          border: `1px solid ${C.border}`, borderTop: `8px solid ${toneFill(tone)}`, fontFamily: FONT, display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 1, color: toneText(tone), textTransform: "uppercase" }}>{tag}</div>
        {children}
      </div>
    </Spoken>
  </div>
);

const FactRow: React.FC<{ at: number; tone: Tone; label: string; children: React.ReactNode }> = ({ at, tone, label, children }) => (
  <Spoken at={at} fromY={14}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
      <div style={{ fontSize: 34, fontWeight: 600, color: C.textSoft, minWidth: 140 }}>{label}</div>
      <div style={{ fontSize: 76, fontWeight: 800, color: toneText(tone), lineHeight: 1.05 }}>{children}</div>
    </div>
  </Spoken>
);

const S12: React.FC = () => (
  <SceneFrame sceneId={S} glow="rgba(251,191,36,0.14)">
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 230, letterSpacing: 6, color: "rgba(240,246,252,0.035)", whiteSpace: "nowrap" }}>NHẬN ĐỊNH</div>
    </div>
    <div style={{ display: "flex", justifyContent: "center", height: 92, alignItems: "center", position: "relative" }}>
      <Spoken at={fBadge} fromY={-24} fromScale={0.94}>
        <div
          style={{
            padding: "10px 36px", borderRadius: 999, border: `3px solid ${C.amberFill}`, background: C.surface,
            fontFamily: FONT, fontSize: 38, fontWeight: 800, letterSpacing: 2, color: C.amber,
          }}
        >
          NHẬN ĐỊNH BIÊN TẬP
        </div>
      </Spoken>
    </div>
    <div style={{ display: "flex", gap: 40, marginTop: 20, position: "relative" }}>
      <Pillar at={fL} tone="green" tag="Việc làm và thu nhập">
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 34, fontWeight: 600, color: C.textSoft }}>Tăng trưởng GDP</div>
          <div style={{ fontSize: 190, fontWeight: 800, lineHeight: 1.05, color: C.green, minHeight: 200 }}>
            <CountUp at={fL9} to={9} suffix="%" duration={22} />
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <Spoken at={fLOut - 4} fromY={0}>
            <Arrow at={fLOut - 4} tone="green" />
          </Spoken>
        </div>
        <div style={{ marginTop: 14 }}>
          <Outcome at={fLOut} tone="green" title="Nền tốt cho việc làm và thu nhập" />
        </div>
      </Pillar>
      <Pillar at={fR} tone="amber" tag="Chi phí cuối năm">
        <div style={{ marginTop: 22 }}>
          <FactRow at={fR} tone="amber" label="Xăng">
            <CountUp at={fR172} to={172} prefix="+" suffix="đ" duration={20} />
            <span style={{ fontSize: 34, fontWeight: 600, color: C.textSoft }}> /lít</span>
          </FactRow>
        </div>
        <div style={{ marginTop: 10 }}>
          <Spoken at={fROut} fromY={12}>
            <div style={{ fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.2, paddingLeft: 8 }}>
              <span style={{ color: C.amber }}>→</span> Chi phí đi lại nhích lên
            </div>
          </Spoken>
        </div>
        <div style={{ height: 2, background: C.border, margin: "26px 0" }} />
        <FactRow at={fDiesel} tone="green" label="Diesel">
          <span>giảm</span>
        </FactRow>
        <div style={{ marginTop: 18 }}>
          <Outcome at={fLogi} tone="green" title="Lợi cho logistics" extraAt={fGoods} extra="và giá hàng hóa cuối năm" />
        </div>
      </Pillar>
    </div>
  </SceneFrame>
);

export default S12;
