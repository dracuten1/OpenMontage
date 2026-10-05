// S13 -- NHẬN ĐỊNH 2 (công việc và rủi ro). Left-to-right roadmap: tác vụ lặp lại -> kỹ năng AI -> phán đoán giá trị cao.
// Speech-locked: statement on "AI", node 1 on "tác vụ", role chips on their spoken words, node 1 dashes + arrow 1 sweeps
// on "bổ sung", node 2 on "kỹ năng", arrow 2 on "chuyển", node 3 lights on "phán đoán".
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { SceneFrame } from "../components";
import { C, FONT, toneFill, toneText, type Tone } from "../theme";
import { Spoken, frameOf } from "../timing";

const S = "s13" as const;
const fBadge = 0; // "Nhận"
const fAI = frameOf(S, "AI");
const fMa = frameOf(S, "mà");
const fNode1 = frameOf(S, "tác vụ");
const fHC = frameOf(S, "hành chính");
const fNL = frameOf(S, "nhập liệu");
const fTS = frameOf(S, "telesales");
const fKT = frameOf(S, "kế toán");
const fBoSung = frameOf(S, "bổ sung");
const fKyNang = frameOf(S, "kỹ năng");
const fChuyen = frameOf(S, "chuyển");
const fPhan = frameOf(S, "phán");

const NODE_W = 500;
const NODE_H = 560;

const FlowArrow: React.FC<{ at: number; tone: Tone }> = ({ at, tone }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  return (
    <div style={{ width: 114, height: NODE_H, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="104" height="64" viewBox="0 0 104 64" style={{ overflow: "visible" }}>
        <path d={`M6 32 L${6 + 78 * p} 32`} stroke={toneFill(tone)} strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M70 10 L96 32 L70 54" stroke={toneFill(tone)} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={p > 0.85 ? 1 : p * 0.9} />
      </svg>
    </div>
  );
};

const Chip: React.FC<{ at: number; text: string; dim: boolean }> = ({ at, text, dim }) => (
  <Spoken at={at} fromX={-24} fromY={0}>
    <div
      style={{
        padding: "10px 22px", borderRadius: 14, background: C.surfaceHi, border: `2px dashed ${C.muted}`,
        fontSize: 34, fontWeight: 600, color: dim ? C.muted : C.text, fontFamily: FONT,
      }}
    >
      {text}
    </div>
  </Spoken>
);

const S13: React.FC = () => {
  const frame = useCurrentFrame();
  const dashed = interpolate(frame, [fBoSung, fBoSung + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glow = interpolate(frame, [fPhan, fPhan + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 0.5 + 0.5 * Math.sin(Math.max(0, frame - fPhan) / 9);
  return (
    <SceneFrame sceneId={S} glow="rgba(167,139,250,0.18)">
      <div style={{ display: "flex", alignItems: "center", gap: 28, height: 92 }}>
        <Spoken at={fBadge} fromX={-30} fromY={0}>
          <div
            style={{
              padding: "10px 32px", borderRadius: 999, border: `3px solid ${C.amberFill}`, background: C.surface,
              fontFamily: FONT, fontSize: 34, fontWeight: 800, letterSpacing: 2, color: C.amber,
            }}
          >
            NHẬN ĐỊNH BIÊN TẬP
          </div>
        </Spoken>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.3em", fontFamily: FONT, fontSize: 48, fontWeight: 800, color: C.text, whiteSpace: "nowrap" }}>
          <Spoken at={fAI} fromY={14}>
            <span>AI không thay thế ồ ạt,</span>
          </Spoken>
          <Spoken at={fMa} fromY={14}>
            <span style={{ color: C.violet }}>mà tự động hóa</span>
          </Spoken>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginTop: 60, justifyContent: "center" }}>
        {/* Node 1: repetitive tasks */}
        <Spoken at={fNode1} fromY={30}>
          <div
            style={{
              width: NODE_W, height: NODE_H, boxSizing: "border-box", padding: "28px 30px", borderRadius: 28, background: C.surface,
              border: `${dashed > 0.5 ? 4 : 2}px ${dashed > 0.5 ? "dashed" : "solid"} ${dashed > 0.5 ? C.muted : C.border}`,
              fontFamily: FONT, opacity: 1 - 0.25 * dashed,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: C.muted, letterSpacing: 1 }}>HIỆN TẠI</div>
            <div style={{ fontSize: 46, fontWeight: 800, color: C.text, marginTop: 6, lineHeight: 1.15 }}>Tác vụ lặp lại</div>
            <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
              <Chip at={fHC} text="Hành chính" dim={dashed > 0.5} />
              <Chip at={fNL} text="Nhập liệu" dim={dashed > 0.5} />
              <Chip at={fTS} text="Telesales" dim={dashed > 0.5} />
              <Chip at={fKT} text="Kế toán cơ bản" dim={dashed > 0.5} />
            </div>
          </div>
        </Spoken>

        <FlowArrow at={fBoSung} tone="amber" />

        {/* Node 2: AI skills */}
        <Spoken at={fKyNang} fromY={30}>
          <div
            style={{
              width: NODE_W, height: NODE_H, boxSizing: "border-box", padding: "28px 30px", borderRadius: 28, background: C.surface,
              border: `3px solid ${toneFill("violet")}`, fontFamily: FONT, display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: toneText("violet"), letterSpacing: 1 }}>NÊN SỚM BỔ SUNG</div>
            <div style={{ fontSize: 56, fontWeight: 800, color: C.text, marginTop: 6, lineHeight: 1.12 }}>Kỹ năng AI</div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle cx="75" cy="75" r="62" fill="none" stroke={toneFill("violet")} strokeWidth="6" opacity="0.5" />
                <circle cx="75" cy="75" r="40" fill={C.surfaceHi} stroke={toneFill("violet")} strokeWidth="6" />
                <path d="M75 52 L75 98 M52 75 L98 75" stroke={C.violet} strokeWidth="9" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </Spoken>

        <FlowArrow at={fChuyen} tone="amber" />

        {/* Node 3: high-value judgement */}
        <Spoken at={fPhan} fromY={30}>
          <div
            style={{
              width: NODE_W, height: NODE_H, boxSizing: "border-box", padding: "28px 30px", borderRadius: 28, background: C.surface,
              border: `4px solid ${C.amberFill}`, fontFamily: FONT, display: "flex", flexDirection: "column",
              boxShadow: `0 0 ${40 + 30 * pulse}px rgba(245,158,11,${0.35 * glow})`,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: C.amber, letterSpacing: 1 }}>CHUYỂN SANG</div>
            <div style={{ fontSize: 52, fontWeight: 800, color: C.text, marginTop: 6, lineHeight: 1.12 }}>Việc cần phán đoán</div>
            <div style={{ flex: 1 }} />
          </div>
        </Spoken>
      </div>
    </SceneFrame>
  );
};

export default S13;
