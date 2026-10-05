// S07 -- Tin 3 payload (hero): Big4 5,9% vs ACB 7,8% on a zero-based axis (0-9%), then a cash conversion chain.
// Two stacked tiers: horizontal bars on top, "1,9 diem = gan 2 trieu dong / nam tren 100 trieu" chain below.
import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { CountUp, SceneFrame } from "../components";
import { C, FONT, SPRING, fmtVi, toneFill, toneText, type Tone } from "../theme";
import { Spoken, frameOf } from "../timing";

const F = {
  big4: frameOf("s07", "big4"), // ~8
  m12: frameOf("s07", "12"), // ~30
  v59: frameOf("s07", "5,9%"), // ~52
  acb: frameOf("s07", "acb"), // ~95
  v78: frameOf("s07", "7,8%"), // ~137
  chenh: frameOf("s07", "chênh"), // ~173
  d19: frameOf("s07", "1,9"), // ~182
  two: frameOf("s07", "2"), // ~212
  moi: frameOf("s07", "mỗi năm"), // ~239
  trieu100: frameOf("s07", "100"), // ~255
};

const MAX = 9; // zero-based axis 0-9 %
const LABEL_W = 270;
const VAL_W = 300;
const W_ALL = 1728;
const PLOT_W = W_ALL - LABEL_W - VAL_W;
const ROW_H = 120;
const ROW_GAP = 70;
const PLOT_H = ROW_H * 2 + ROW_GAP;
const xOf = (v: number) => LABEL_W + (PLOT_W * v) / MAX;

const Row: React.FC<{
  y: number; label: string; labelAt: number; value: number; barAt: number; tone: Tone;
}> = ({ y, label, labelAt, value, barAt, tone }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = frame < barAt ? 0 : Math.min(1, spring({ frame: frame - barAt, fps, config: { ...SPRING, damping: 26 } }));
  const lop = interpolate(frame - labelAt, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: W_ALL, height: ROW_H }}>
      <div style={{ position: "absolute", left: 0, width: LABEL_W - 24, height: ROW_H, display: "flex", alignItems: "center", justifyContent: "flex-end", fontSize: 40, fontWeight: 700, color: C.text, opacity: lop }}>
        {label}
      </div>
      <div style={{ position: "absolute", left: LABEL_W, width: (PLOT_W * value * p) / MAX, height: ROW_H, background: toneFill(tone), borderRadius: "0 12px 12px 0" }} />
      <div
        style={{
          position: "absolute", left: LABEL_W + (PLOT_W * value * p) / MAX + 16, height: ROW_H, display: "flex", alignItems: "center", gap: 10,
          color: toneText(tone), fontWeight: 800, fontSize: 64, opacity: frame < barAt ? 0 : 1,
        }}
      >
        <CountUp at={barAt} to={value} decimals={1} suffix="%" duration={20} />
        <span style={{ fontSize: 30, fontWeight: 600, color: C.textSoft }}>/năm</span>
      </div>
    </div>
  );
};

const Cell: React.FC<{ at: number; tone: Tone; label: string; flex?: number; children: React.ReactNode; note?: string }> = ({
  at, tone, label, flex = 1, children, note,
}) => (
  <Spoken at={at} fromY={26} fromScale={0.96} style={{ flex, display: "flex" }}>
    <div
      style={{
        flex: 1, boxSizing: "border-box", padding: "20px 28px", borderRadius: 24, background: C.surface, border: `1px solid ${C.border}`,
        borderTop: `6px solid ${toneFill(tone)}`, display: "flex", flexDirection: "column", justifyContent: "center",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 600, color: C.textSoft }}>{label}</div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 12, fontWeight: 800, color: toneText(tone), lineHeight: 1 }}>{children}</div>
      {note ? <div style={{ marginTop: 10, fontSize: 28, fontWeight: 500, color: C.muted }}>{note}</div> : null}
    </div>
  </Spoken>
);

const Connector: React.FC<{ at: number; text: string; small?: boolean }> = ({ at, text, small }) => (
  <Spoken at={at} fromY={0} fromScale={0.6} style={{ display: "flex", alignItems: "center" }}>
    <div style={{ width: small ? 110 : 64, textAlign: "center", fontSize: small ? 34 : 64, fontWeight: 800, color: C.amber }}>{text}</div>
  </Spoken>
);

const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const ticks = [0, 3, 6, 9];
  // delta band between the two bar ends, appears on "Chenh"
  const bandOp = interpolate(frame - F.chenh, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <SceneFrame sceneId="s07" glow="rgba(251,191,36,0.16)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: FONT, paddingBottom: 14 }}>
        {/* tier 1: chart */}
        <Spoken at={F.big4} fromY={14}>
          <div style={{ fontSize: 34, fontWeight: 600, color: C.textSoft, height: 48 }}>
            Lãi suất tiền gửi{" "}
            {frame >= F.m12 ? <span style={{ color: C.amber, fontWeight: 700 }}>kỳ hạn 12 tháng</span> : null}
            <span style={{ color: C.muted }}> (%/năm, trục bắt đầu từ 0)</span>
          </div>
        </Spoken>
        <div style={{ position: "relative", width: W_ALL, height: PLOT_H + 46, marginTop: 6 }}>
          <Spoken at={F.big4} fromY={0}>
            <div style={{ position: "absolute", left: 0, top: 0, width: W_ALL, height: PLOT_H + 46 }}>
              {ticks.map((t) => (
                <React.Fragment key={t}>
                  <div style={{ position: "absolute", left: xOf(t), top: 0, width: t === 0 ? 2 : 1, height: PLOT_H, background: t === 0 ? C.muted : C.border }} />
                  <div style={{ position: "absolute", left: xOf(t) - 40, top: PLOT_H + 8, width: 80, textAlign: "center", fontSize: 24, color: C.muted }}>{fmtVi(t)}%</div>
                </React.Fragment>
              ))}
            </div>
          </Spoken>
          {/* difference band 5,9 -> 7,8 */}
          <div
            style={{
              position: "absolute", left: xOf(5.9), top: ROW_H, width: xOf(7.8) - xOf(5.9), height: ROW_GAP, opacity: bandOp,
              background: "rgba(251,191,36,0.16)", borderLeft: `3px dashed ${C.amber}`, borderRight: `3px dashed ${C.amber}`,
            }}
          />
          <Row y={0} label="Nhóm Big4" labelAt={F.big4} value={5.9} barAt={F.v59} tone="blue" />
          <Row y={ROW_H + ROW_GAP} label="ACB" labelAt={F.acb} value={7.8} barAt={F.v78} tone="amber" />
          <Spoken at={F.chenh} fromY={0} fromScale={0.9} style={{ position: "absolute", left: xOf(5.9), width: xOf(7.8) - xOf(5.9), top: ROW_H + 16, textAlign: "center" }}>
            <span style={{ display: "inline-block", fontSize: 30, fontWeight: 800, lineHeight: 1.1, color: C.onAmber, background: C.amberFill, borderRadius: 10, padding: "2px 14px" }}>
              chênh +1,9
            </span>
          </Spoken>
        </div>

        {/* tier 2: cash conversion chain */}
        <div style={{ marginTop: 34, height: 270, display: "flex", alignItems: "stretch", gap: 10 }}>
          <Cell at={F.d19} tone="amber" label="Chênh lệch lãi suất" flex={0.9}>
            <span style={{ fontSize: 100 }}><CountUp at={F.d19} to={1.9} decimals={1} duration={18} prefix="+" /></span>
            <span style={{ fontSize: 34, fontWeight: 600, color: C.textSoft }}>điểm %</span>
          </Cell>
          <Connector at={F.two} text="=" />
          <Cell at={F.two} tone="green" label="Tiền lời thêm" flex={1.35} note={frame >= F.moi ? "mỗi năm" : " "}>
            <span style={{ fontSize: 34, fontWeight: 600, color: C.textSoft }}>gần</span>
            <span style={{ fontSize: 112 }}><CountUp at={F.two} to={2} duration={16} /></span>
            <span style={{ fontSize: 34, fontWeight: 600, color: C.textSoft }}>triệu đồng</span>
          </Cell>
          <Connector at={F.trieu100} text="trên" small />
          <Cell at={F.trieu100} tone="blue" label="Khoản tiền gửi" flex={1.05}>
            <span style={{ fontSize: 100 }}><CountUp at={F.trieu100} to={100} duration={20} /></span>
            <span style={{ fontSize: 34, fontWeight: 600, color: C.textSoft }}>triệu</span>
          </Cell>
        </div>
      </div>
    </SceneFrame>
  );
};

export default S07;
