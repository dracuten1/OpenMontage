// S11 -- TIN 5: bóc tách tác động AI (ILO). Three-column metric grid with zero-based progress bars.
// Speech-locked: each column fires on its spoken figure (20,8% / 2% / 28%); tier/sub lines on their spoken words.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Badge, CountUp, SceneFrame } from "../components";
import { C, FONT, toneFill, toneText, type Tone } from "../theme";
import { Spoken, frameOf } from "../timing";

const S = "s11" as const;
const fHead = 0; // "Khoảng"
const fC1 = frameOf(S, "20,8%");
const fC1Label = frameOf(S, "lao");
const fPeople = frameOf(S, "11,5");
const fC1Tier = frameOf(S, "vùng");
const fC2 = frameOf(S, "2%");
const fC2Tier = frameOf(S, "nguy cơ");
const fC3 = frameOf(S, "28%");
const fC3Label = frameOf(S, "người đi làm");
const fC3Tier = frameOf(S, "dùng");

interface ColProps {
  at: number;
  tone: Tone;
  tier: string;
  tierAt: number;
  prefix?: string;
  value: number;
  decimals?: number;
  label: string;
  labelAt: number;
  subAt?: number;
  subStrong?: string;
  sub?: string;
  highlight?: boolean;
}

const Column: React.FC<ColProps> = ({ at, tone, tier, tierAt, prefix, value, decimals = 0, label, labelAt, subAt, subStrong, sub, highlight }) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [at + 4, at + 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <Spoken at={at} fromY={36} fromScale={0.97}>
        <div
          style={{
            height: 610, boxSizing: "border-box", padding: "30px 34px", borderRadius: 28, background: C.surface,
            border: `1px solid ${highlight ? toneFill(tone) : C.border}`, borderTop: `8px solid ${toneFill(tone)}`,
            display: "flex", flexDirection: "column", fontFamily: FONT,
          }}
        >
          <div style={{ marginTop: 6, fontSize: 136, fontWeight: 800, lineHeight: 1, color: toneText(tone), whiteSpace: "nowrap" }}>
            <CountUp at={at} to={value} decimals={decimals} prefix={prefix} suffix="%" duration={26} />
          </div>
          <div style={{ minHeight: 46, marginTop: 14 }}>
            <Spoken at={labelAt} fromY={10}>
              <div style={{ fontSize: 32, fontWeight: 500, color: C.textSoft, lineHeight: 1.25 }}>{label}</div>
            </Spoken>
          </div>
          <div style={{ minHeight: 100, marginTop: 10 }}>
            <Spoken at={tierAt} fromY={14}>
              <div style={{ fontSize: 38, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{tier}</div>
            </Spoken>
          </div>
          <div style={{ minHeight: 48 }}>
            {subAt !== undefined ? (
              <Spoken at={subAt} fromY={12}>
                <div style={{ fontSize: 36, fontWeight: 800, color: toneText(tone), lineHeight: 1.2 }}>
                  {subStrong} <span style={{ color: C.textSoft, fontWeight: 600 }}>{sub}</span>
                </div>
              </Spoken>
            ) : null}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ position: "relative", height: 30, borderRadius: 15, background: C.surfaceHi, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${value * grow}%`, minWidth: grow > 0 ? 6 : 0, background: toneFill(tone), borderRadius: 15 }} />
          </div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 600, color: C.muted }}>
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </Spoken>
    </div>
  );
};

const S11: React.FC = () => (
  <SceneFrame sceneId={S} glow="rgba(139,92,246,0.20)">
    <div style={{ display: "flex", alignItems: "center", gap: 24, height: 96 }}>
      <Badge text="BÁO CÁO ILO" at={fHead} tone="violet" />
      <Spoken at={fHead + 3} fromX={-20} fromY={0}>
        <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 700, color: C.text }}>Tác động của AI tạo sinh lên lao động Việt Nam</div>
      </Spoken>
    </div>
    <div style={{ display: "flex", gap: 36, marginTop: 12 }}>
      <Column
        at={fC1} tone="blue" value={20.8} decimals={1}
        label="lực lượng lao động" labelAt={fC1Label}
        tier="Nằm trong vùng tác động của AI tạo sinh" tierAt={fC1Tier}
        subAt={fPeople} subStrong="11,5 triệu" sub="người"
      />
      <Column
        at={fC2} tone="green" prefix="< " value={2} highlight
        label="lực lượng lao động" labelAt={fC2}
        tier="Có nguy cơ bị thay thế hoàn toàn" tierAt={fC2Tier}
      />
      <Column
        at={fC3} tone="amber" value={27.9} decimals={1}
        label="người đi làm" labelAt={fC3Label}
        tier="Đã dùng AI" tierAt={fC3Tier}
        subAt={fC3} subStrong="Gần 28%" sub="đang ứng dụng"
      />
    </div>
    <div style={{ marginTop: 20 }}>
      <Spoken at={fHead + 6} fromY={6}>
        <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 500, color: C.muted }}>Nguồn: ILO; nhandan.vn; vietnamnet.vn</div>
      </Spoken>
    </div>
  </SceneFrame>
);

export default S11;
