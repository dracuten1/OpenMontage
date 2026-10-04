// sc-11 — Dị bản Mường: Thần Nông (nữ) & Thần Rồng.
// Narration order: tiêu đề -> Thần Nông (người con gái, Thần Đất & Thần Rừng) -> kết duyên -> Thần Rồng (Thần Nước & Thần Bão).
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, Reveal, SourceTag, SpringPop, useFrac } from "../common";

const SEA_LIGHT = "#7FB3C4";

const Mist: React.FC = () => {
  const { frame } = useFrac();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: -300 + i * 760 + Math.sin(frame / 90 + i * 2) * 60,
            top: 200 + i * 230 + Math.cos(frame / 110 + i) * 24,
            width: 900,
            height: 260,
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(217,164,65,0.07), rgba(0,0,0,0) 70%)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const MountainIcon: React.FC<{ float: number }> = ({ float }) => (
  <svg width={150} height={130} viewBox="0 0 150 130" style={{ transform: `translateY(${float}px)` }}>
    <path d="M6 112 L52 34 L72 66 L92 28 L144 112 Z" fill="rgba(217,164,65,0.12)" stroke={C.amber} strokeWidth={4} strokeLinejoin="round" />
    <path d="M52 34 L60 50 M92 28 L100 46" stroke={C.cream} strokeWidth={3} strokeLinecap="round" />
    <path d="M24 112 L24 90 M18 98 L24 88 L30 98 M120 112 L120 92 M114 100 L120 90 L126 100" stroke={C.cream} strokeWidth={3} strokeLinecap="round" fill="none" />
    <circle cx={120} cy={22} r={9} fill="none" stroke={C.amber} strokeWidth={3} />
  </svg>
);

const WaveIcon: React.FC<{ float: number }> = ({ float }) => (
  <svg width={150} height={130} viewBox="0 0 150 130" style={{ transform: `translateY(${float}px)` }}>
    <path d="M6 96 C26 70 42 70 62 96 S98 122 118 96 S140 80 146 90" fill="none" stroke={SEA_LIGHT} strokeWidth={4} strokeLinecap="round" />
    <path d="M6 70 C26 44 42 44 62 70 S98 96 118 70 S140 54 146 64" fill="none" stroke={C.cream} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
    <path d="M40 40 C40 14 82 8 96 26 C108 42 90 54 78 44 C70 38 80 28 88 32" fill="none" stroke={SEA_LIGHT} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

const Card: React.FC<{
  side: "left" | "right";
  name: string;
  badge: string;
  line: string;
  accent: string;
  start: number;
  float: number;
}> = ({ side, name, badge, line, accent, start, float }) => {
  const { p, frame } = useFrac();
  const t = ease(p(start, start + 0.1));
  const dir = side === "left" ? -1 : 1;
  const pulse = 0.5 + 0.5 * Math.sin(frame / 18 + (side === "left" ? 0 : 2));
  return (
    <div
      style={{
        width: 650,
        padding: "30px 36px 38px",
        background: C.card,
        border: `2px solid ${accent}`,
        borderRadius: 20,
        boxShadow: `0 0 ${24 + pulse * 22}px ${accent}33`,
        opacity: t,
        transform: `translateX(${(1 - t) * dir * 90}px) scale(${0.92 + 0.08 * t})`,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {side === "left" ? <MountainIcon float={float} /> : <WaveIcon float={float} />}
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 70, color: C.white, marginTop: 8 }}>{name}</div>
      <SpringPop startFrac={start + 0.07} from={0.7}>
        <div
          style={{
            marginTop: 14,
            padding: "6px 26px",
            border: `2px solid ${accent}`,
            borderRadius: 40,
            background: side === "left" ? "rgba(217,164,65,0.16)" : "rgba(127,179,196,0.14)",
            color: accent,
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 36,
            letterSpacing: 3,
          }}
        >
          {badge}
        </div>
      </SpringPop>
      <Reveal startFrac={start + 0.1} endFrac={start + 0.17} style={{ marginTop: 22 }}>
        <div style={{ fontFamily: FONT.body, fontSize: 38, lineHeight: 1.4, color: C.cream, whiteSpace: "pre-line" }}>{line}</div>
      </Reveal>
    </div>
  );
};

export const Sc11: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const float = Math.sin(frame / 22) * 6;
  const link = ease(p(0.42, 0.5));
  const linkGlow = 0.5 + 0.5 * Math.sin(frame / 14);
  return (
    <Paper>
      <Mist />
      <div style={{ position: "absolute", top: 64, left: 64, right: 64, textAlign: "center" }}>
        <Reveal startFrac={0.02} endFrac={0.08} dy={-26}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.amber }}>
            THẦN THOẠI MƯỜNG
          </div>
        </Reveal>
        <Reveal startFrac={0.04} endFrac={0.14} dy={-40}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 70, lineHeight: 1.12, color: C.white, marginTop: 10 }}>
            DỊ BẢN KỲ LẠ TRONG TRUYỆN CỔ MƯỜNG
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Card side="left" name="Thần Nông" badge="NGƯỜI CON GÁI" line={"do Thần Đất và\nThần Rừng sinh ra"} accent={C.amber} start={0.2} float={float} />
        <div style={{ width: 250, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg width={200} height={120} viewBox="0 0 200 120" style={{ overflow: "visible" }}>
            <path d="M0 60 L200 60" stroke={C.amber} strokeWidth={3} strokeDasharray="10 10" opacity={link * 0.8} strokeDashoffset={-frame * 0.6} />
            <circle cx={82} cy={60} r={30} fill="none" stroke={C.amber} strokeWidth={5} opacity={link} style={{ filter: `drop-shadow(0 0 ${6 + linkGlow * 8}px ${C.amber})` }} />
            <circle cx={118} cy={60} r={30} fill="none" stroke={SEA_LIGHT} strokeWidth={5} opacity={link} style={{ filter: `drop-shadow(0 0 ${6 + linkGlow * 8}px ${SEA_LIGHT})` }} />
          </svg>
          <Reveal startFrac={0.43} endFrac={0.5} style={{ marginTop: 10 }}>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: C.amber, whiteSpace: "nowrap" }}>
              KẾT DUYÊN
            </div>
          </Reveal>
        </div>
        <Card side="right" name="Thần Rồng" badge="CON TRAI" line={"con của Thần Nước\nvà Thần Bão"} accent={SEA_LIGHT} start={0.5} float={-float} />
      </div>

      <SourceTag text="Truyện Việt cổ — sự tích Thần Nông – Thần Rồng" />
    </Paper>
  );
};
