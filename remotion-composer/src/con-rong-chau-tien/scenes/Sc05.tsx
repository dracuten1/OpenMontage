// sc-05 — Bọc trăm trứng & dị bản. Order: bọc trứng -> vứt ra cánh đồng, 6-7 ngày -> 100 con trai -> LNCQ 3 năm 3 tháng 10 ngày.
import React from "react";
import { random } from "remotion";
import { C, FONT, SceneProps, ease } from "../theme";
import { CountUp, Paper, Reveal, SourceTag, SpringPop, useFrac } from "../common";

const QuoteCard: React.FC<{
  start: number;
  source: string;
  head: string;
  body: React.ReactNode;
  accent: string;
}> = ({ start, source, head, body, accent }) => (
  <Reveal startFrac={start} endFrac={start + 0.1} dy={12} style={{ flex: 1 }}>
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        padding: "28px 36px 32px",
        background: C.card,
        border: `2px solid ${C.border}`,
        borderTop: `5px solid ${accent}`,
        borderRadius: 14,
        boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ fontFamily: FONT.mono, fontWeight: 500, fontSize: 28, color: accent, letterSpacing: 1 }}>{source}</div>
      <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: C.white, marginTop: 16, lineHeight: 1.2 }}>{head}</div>
      <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.cream, marginTop: 18, lineHeight: 1.45 }}>{body}</div>
    </div>
  </Reveal>
);

export const Sc05: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();

  // 100 mini eggs that hatch into 100 figures (grid 20 x 5)
  const hatch = p(0.34, 0.52);
  const dots = Array.from({ length: 100 }, (_, i) => {
    const col = i % 20;
    const row = Math.floor(i / 20);
    const delay = (random(`hatch-${i}`) * 0.6 + (i / 100) * 0.4) * 0.8;
    const t = ease(Math.max(0, Math.min(1, (hatch - delay) / 0.2)));
    const appear = ease(Math.max(0, Math.min(1, p(0.08, 0.2) * 1.4 - random(`egg-${i}`) * 0.4)));
    const x = col * 36 + 18;
    const y = row * 40 + 24;
    const bob = Math.sin(frame * 0.07 + i) * 1.5 * t;
    return (
      <g key={i} opacity={appear} transform={`translate(${x} ${y + bob})`}>
        {/* egg */}
        <ellipse cx={0} cy={2} rx={11} ry={14} fill="#F2C86B" opacity={1 - t} stroke="#7A5216" strokeWidth={1.5} />
        {/* child (head + body) */}
        <g opacity={t}>
          <circle cx={0} cy={-8} r={6} fill={C.cream} />
          <path d="M-9 14 C-9 2 9 2 9 14 Z" fill={C.cream} />
        </g>
      </g>
    );
  });

  const glow = 0.5 + 0.3 * Math.sin(frame * 0.06);

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 28%, rgba(217,164,65,${0.12 + 0.05 * glow}), rgba(0,0,0,0) 55%)` }} />

      {/* top tier: big stat */}
      <div style={{ position: "absolute", left: 64, right: 64, top: 52, display: "flex", alignItems: "center", gap: 56 }}>
        <SpringPop startFrac={0.03} from={0.7} style={{ flexShrink: 0 }}>
          <div style={{ textAlign: "center", width: 520 }}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 260,
                lineHeight: 0.95,
                color: C.amber,
                textShadow: `0 0 ${30 + 20 * glow}px rgba(217,164,65,0.45)`,
              }}
            >
              <CountUp to={100} startFrac={0.04} endFrac={0.2} />
            </div>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38, color: C.white, marginTop: 6, letterSpacing: 2 }}>
              trứng · người con trai
            </div>
          </div>
        </SpringPop>

        <div style={{ flex: 1 }}>
          <svg width={720} height={210} viewBox="0 0 720 210" style={{ overflow: "visible" }}>
            {dots}
          </svg>
        </div>
      </div>

      {/* chips: field + 6-7 days (Toàn thư order) */}
      <Reveal startFrac={0.26} endFrac={0.34} dy={12} style={{ position: "absolute", left: 64, top: 372 }}>
        <div style={{ display: "flex", gap: 20 }}>
          <Chip text="Vứt ra cánh đồng" />
          <Chip text="6–7 ngày sau bọc vỡ" tone="amber" />
        </div>
      </Reveal>

      {/* bottom tier: two quotes */}
      <div style={{ position: "absolute", left: 64, right: 64, top: 480, bottom: 130, display: "flex", gap: 40 }}>
        <QuoteCard
          start={0.36}
          source="Đại Việt sử ký toàn thư · 1479"
          head="Điềm bất thường"
          body={
            <>
              Bọc trứng bị <b style={{ color: C.white }}>vứt ra cánh đồng</b>; sáu bảy ngày sau vỡ ra một trăm con trai.
            </>
          }
          accent={C.cream}
        />
        <QuoteCard
          start={0.58}
          source="Lĩnh Nam chích quái · bản khác"
          head="Dị bản thời gian"
          body={
            <>
              Âu Cơ mang thai{" "}
              <b style={{ color: C.amber, fontSize: 46 }}>3 năm 3 tháng 10 ngày</b>.
            </>
          }
          accent={C.amber}
        />
      </div>

      <SourceTag text="Chính các văn bản cổ ghi không thống nhất" bottom={48} />
    </Paper>
  );
};

const Chip: React.FC<{ text: string; tone?: "cream" | "amber" }> = ({ text, tone = "cream" }) => (
  <div
    style={{
      fontFamily: FONT.body,
      fontWeight: 700,
      fontSize: 34,
      color: tone === "amber" ? C.amber : C.white,
      padding: "8px 24px",
      border: `2px solid ${tone === "amber" ? C.amber : C.mute}`,
      borderRadius: 40,
      background: "rgba(36,31,26,0.9)",
    }}
  >
    {text}
  </div>
);
