// S06 -- Tin 3 headline: lai suat tiet kiem phan hoa (build_tension).
// Full-bleed bank illustration, left-aligned word-by-word headline stack, every piece fires on its spoken word.
import React from "react";
import { Badge, IllustrationFrame, SceneFrame } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const F = {
  tin: frameOf("s06", "tin"), // 0
  tich: frameOf("s06", "tích"), // ~41
  lai: frameOf("s06", "lãi suất"), // ~47
  tiet: frameOf("s06", "tiết kiệm"), // ~49
  m12: frameOf("s06", "12"), // ~51
  phan: frameOf("s06", "phân"), // ~65
  manh: frameOf("s06", "mạnh"), // ~76
  giua: frameOf("s06", "giữa"), // ~82
  ngan: frameOf("s06", "ngân hàng"), // ~90
};

const Piece: React.FC<{ at: number; children: React.ReactNode; color?: string; mr?: number; fromY?: number }> = ({
  at, children, color, mr = 0.26, fromY = 26,
}) => (
  <Spoken at={at} fromY={fromY} style={{ display: "inline-block", marginRight: `${mr}em`, color }}>
    {children}
  </Spoken>
);

const Line: React.FC<{ h: number; size: number; weight?: number; children: React.ReactNode }> = ({ h, size, weight = 800, children }) => (
  <div style={{ height: h, fontSize: size, fontWeight: weight, lineHeight: 1.1, whiteSpace: "nowrap", letterSpacing: -0.5, color: C.text }}>
    {children}
  </div>
);

const S06: React.FC = () => (
  <SceneFrame sceneId="s06" glow="rgba(37,99,235,0.28)">
    {/* full-bleed illustration behind the text (content box starts at 96,64) */}
    <div style={{ position: "absolute", left: -96, top: -64, width: 1920, height: 1080 }}>
      <IllustrationFrame name="img_savings" at={0} width={1920} height={1080} rounded={0} scrim={0.3} zoom={1.05} driftX={-10} driftY={-6} />
      <div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(13,17,23,0.9) 0%, rgba(13,17,23,0.78) 45%, rgba(13,17,23,0.2) 75%, rgba(13,17,23,0) 100%)",
        }}
      />
    </div>

    <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 30 }}>
      {/* eyebrow: badge + "Tin cho nguoi tich luy" */}
      <div style={{ height: 84, display: "flex", alignItems: "center", gap: 28 }}>
        <Badge text="TỰ DO TÀI CHÍNH" at={F.tin} tone="blue" />
        <div style={{ fontSize: 40, fontWeight: 600, color: C.textSoft, whiteSpace: "nowrap" }}>
          <Piece at={F.tin} mr={0.28} fromY={12}>Tin cho người</Piece>
          <Piece at={F.tich} color={C.amber} fromY={12}>tích lũy</Piece>
        </div>
      </div>

      <Line h={120} size={104}>
        <Piece at={F.lai}>Lãi suất</Piece>
        <Piece at={F.tiet}>tiết kiệm</Piece>
      </Line>
      <Line h={120} size={104}>
        <Piece at={F.m12} color={C.amber}>12 tháng</Piece>
      </Line>
      <Line h={120} size={104}>
        <Piece at={F.phan} color={C.red}>phân hóa</Piece>
        <Piece at={F.manh} color={C.red}>mạnh</Piece>
      </Line>

      <div style={{ marginTop: 18, height: 72, fontSize: 56, fontWeight: 600, whiteSpace: "nowrap", color: C.textSoft }}>
        <Piece at={F.giua} fromY={18}>giữa các</Piece>
        <Piece at={F.ngan} color={C.blue} fromY={18}>ngân hàng</Piece>
      </div>
    </div>

    <div style={{ position: "absolute", left: 0, top: 832, fontFamily: FONT, fontSize: 28, fontWeight: 500, color: C.muted }}>
      <Spoken at={F.lai} fromY={6}>Nguồn: vietnamnet.vn, topi.vn</Spoken>
    </div>
  </SceneFrame>
);

export default S06;
