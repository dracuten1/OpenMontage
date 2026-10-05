// S08 -- Tin 4 headline: vang qua mot tuan giam gia (introduce_subject).
// Split layout: illustration panel on the left, headline column pushed right; pieces fire on spoken words.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Badge, IllustrationFrame, SceneFrame } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const F = {
  kenh: frameOf("s08", "kênh"), // 0
  tru: frameOf("s08", "trú"), // ~7
  vang: frameOf("s08", "vàng"), // ~22
  qua: frameOf("s08", "qua"), // ~28
  giam: frameOf("s08", "giảm"), // ~39
  gia: frameOf("s08", "giá"), // ~46
  de: frameOf("s08", "đè"), // ~53
  len: frameOf("s08", "lên"), // ~65
  ngan: frameOf("s08", "ngắn"), // ~79
};

const Piece: React.FC<{ at: number; children: React.ReactNode; color?: string; mr?: number; fromY?: number }> = ({
  at, children, color, mr = 0.24, fromY = 24,
}) => (
  <Spoken at={at} fromY={fromY} style={{ display: "inline-block", marginRight: `${mr}em`, color }}>
    {children}
  </Spoken>
);

/** Downward trend arrow, draws itself from the moment "giá" is spoken. */
const DownArrow: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < at) return null;
  return (
    <svg width={110} height={110} viewBox="0 0 110 110" style={{ marginLeft: 8, opacity: p }}>
      <path d="M18 22 L58 62 L72 48 L96 92" fill="none" stroke={C.redFill} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={200} strokeDashoffset={200 * (1 - p)} />
      <path d="M96 92 L60 88 M96 92 L98 56" fill="none" stroke={C.redFill} strokeWidth={12} strokeLinecap="round" opacity={p > 0.8 ? 1 : 0} />
    </svg>
  );
};

const S08: React.FC = () => (
  <SceneFrame sceneId="s08" glow="rgba(239,68,68,0.2)">
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 64 }}>
      <IllustrationFrame name="img_gold" at={F.kenh} width={800} height={560} zoom={1.08} driftX={0} driftY={-6} scrim={0.1} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ height: 84, display: "flex", alignItems: "center", gap: 24 }}>
          <Badge text="ĐẦU TƯ" at={F.kenh} tone="red" />
          <div style={{ fontSize: 42, fontWeight: 600, color: C.amber, whiteSpace: "nowrap" }}>
            <Piece at={F.tru} fromY={10}>Kênh trú ẩn</Piece>
          </div>
        </div>

        <div style={{ height: 140, display: "flex", alignItems: "baseline", gap: 24, fontWeight: 800, whiteSpace: "nowrap", color: C.text }}>
          <Piece at={F.vang}><span style={{ fontSize: 124, color: C.amber, letterSpacing: -1 }}>Vàng</span></Piece>
          <Piece at={F.qua}><span style={{ fontSize: 56, fontWeight: 600, color: C.textSoft }}>qua một tuần</span></Piece>
        </div>

        <div style={{ height: 130, display: "flex", alignItems: "center", fontWeight: 800, fontSize: 124, whiteSpace: "nowrap", color: C.red, letterSpacing: -1 }}>
          <Piece at={F.giam}>giảm</Piece>
          <Piece at={F.gia} mr={0.05}>giá</Piece>
          <DownArrow at={F.gia} />
        </div>

        <div style={{ height: 100, fontSize: 80, fontWeight: 800, whiteSpace: "nowrap", color: C.text, lineHeight: "100px" }}>
          <Piece at={F.de}>đè nặng</Piece>
        </div>
        <div style={{ height: 72, fontSize: 52, fontWeight: 600, whiteSpace: "nowrap", color: C.textSoft, lineHeight: "72px" }}>
          <Piece at={F.len} mr={0.22}>lên nhà đầu tư</Piece>
          <Spoken at={F.ngan} fromY={14} style={{ display: "inline-block", color: C.red, padding: "0 20px", borderRadius: 14, border: `3px solid ${C.redFill}`, lineHeight: "62px", verticalAlign: "middle" }}>
            ngắn hạn
          </Spoken>
        </div>
      </div>
    </div>

    <div style={{ position: "absolute", left: 0, top: 832, fontFamily: FONT, fontSize: 28, fontWeight: 500, color: C.muted }}>
      <Spoken at={F.vang} fromY={6}>Nguồn: vietnamnet.vn, 24h.com.vn</Spoken>
    </div>
  </SceneFrame>
);

export default S08;
