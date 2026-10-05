// S10 -- Tin 5 headline: ILO, "cu 5 nguoi di lam, co 1 nguoi chiu tac dong cua AI tao sinh" (introduce_subject).
// Centered stack over a dimmed full-bleed illustration; five person icons, one highlights on the spoken "1".
import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Badge, IllustrationFrame, SceneFrame } from "../components";
import { C, FONT, SPRING } from "../theme";
import { Spoken, frameOf } from "../timing";

const F = {
  ilo: frameOf("s10", "ilo"), // 0
  cu: frameOf("s10", "cứ"), // ~23
  n5: frameOf("s10", "5"), // ~26
  nguoi: frameOf("s10", "người"), // ~32
  co: frameOf("s10", "có"), // ~53
  n1: frameOf("s10", "1"), // ~59
  chiu: frameOf("s10", "chịu"), // ~67
  ai: frameOf("s10", "ai"), // ~85
  sinh: frameOf("s10", "tạo"), // ~91
};

const Piece: React.FC<{ at: number; children: React.ReactNode; color?: string; mr?: number; fromY?: number }> = ({
  at, children, color, mr = 0.24, fromY = 24,
}) => (
  <Spoken at={at} fromY={fromY} style={{ display: "inline-block", marginRight: `${mr}em`, color }}>
    {children}
  </Spoken>
);

const Person: React.FC<{ index: number; highlight: boolean }> = ({ index, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = F.n5 + index * 3;
  const pop = frame < at ? 0 : Math.min(1, spring({ frame: frame - at, fps, config: SPRING }));
  const hp = frame < F.n1 ? 0 : Math.min(1, spring({ frame: frame - F.n1, fps, config: SPRING }));
  const dim = highlight ? 0 : 1;
  const fill = highlight && hp > 0 ? C.amber : "#6B7A90";
  const scale = (0.6 + 0.4 * pop) * (1 + 0.1 * hp * (highlight ? 1 : 0));
  return (
    <div style={{ width: 150, height: 170, display: "flex", alignItems: "center", justifyContent: "center", opacity: pop, transform: `scale(${scale})`, position: "relative" }}>
      {highlight ? (
        <div style={{ position: "absolute", inset: 8, borderRadius: 36, background: "rgba(251,191,36,0.16)", border: `3px solid ${C.amber}`, opacity: hp }} />
      ) : null}
      <svg width={96} height={116} viewBox="0 0 96 116" style={{ opacity: highlight ? 1 : 1 - 0.15 * hp * dim }}>
        <circle cx={48} cy={30} r={22} fill={fill} />
        <path d="M8 112 C8 76 26 62 48 62 C70 62 88 76 88 112 Z" fill={fill} />
      </svg>
    </div>
  );
};

const S10: React.FC = () => {
  return (
    <SceneFrame sceneId="s10" glow="rgba(139,92,246,0.3)">
      <div style={{ position: "absolute", left: -96, top: -64, width: 1920, height: 1080 }}>
        <IllustrationFrame name="img_ai_jobs" at={0} width={1920} height={1080} rounded={0} scrim={0.55} zoom={1.05} driftX={-6} driftY={-4} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 55% at 50% 45%, rgba(13,17,23,0.9) 0%, rgba(13,17,23,0.55) 70%, rgba(13,17,23,0.2) 100%)" }} />
      </div>

      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT, paddingBottom: 20 }}>
        <div style={{ height: 80, display: "flex", alignItems: "center", gap: 24 }}>
          <Badge text="CÔNG VIỆC" at={F.ilo} tone="violet" />
          <Piece at={F.ilo} fromY={10} mr={0}>
            <span style={{ fontSize: 40, fontWeight: 700, color: C.textSoft }}>Báo cáo ILO</span>
          </Piece>
        </div>

        <div style={{ height: 124, fontSize: 108, fontWeight: 800, color: C.text, whiteSpace: "nowrap", letterSpacing: -0.5, lineHeight: "124px" }}>
          <Piece at={F.cu}>Cứ</Piece>
          <Piece at={F.n5} color={C.violet}>5</Piece>
          <Piece at={F.nguoi} mr={0}>người đi làm</Piece>
        </div>

        <div style={{ display: "flex", gap: 14, height: 176, alignItems: "center" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Person key={i} index={i} highlight={i === 2} />
          ))}
        </div>

        <div style={{ height: 124, fontSize: 108, fontWeight: 800, color: C.text, whiteSpace: "nowrap", letterSpacing: -0.5, lineHeight: "124px" }}>
          <Piece at={F.co}>có</Piece>
          <Piece at={F.n1} color={C.amber}>1</Piece>
          <Piece at={F.n1 + 6} mr={0}>người</Piece>
        </div>

        <div style={{ height: 76, fontSize: 56, fontWeight: 700, color: C.textSoft, whiteSpace: "nowrap", lineHeight: "76px", opacity: 1 }}>
          <Piece at={F.chiu} mr={0.22} fromY={16}>chịu tác động của</Piece>
          <Piece at={F.ai} color={C.violet} mr={0.22} fromY={16}>AI</Piece>
          <Piece at={F.sinh} color={C.violet} mr={0} fromY={16}>tạo sinh</Piece>
        </div>
      </div>
    </SceneFrame>
  );
};

export default S10;
