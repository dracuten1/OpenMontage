import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { CountUp, InterpretFlag, InkPath, Paper, Reveal, useFrac } from "../common";

// sc-34 — vành 10. Narration order (s17): đúng 36 con chim muông -> 18 đậu, 18 bay ->
// (diễn giải) xã hội đa sinh thái: sông nước, đầm lầy, núi rừng, lễ hội -> "lên núi xuống biển mà vẫn báo cho nhau biết" đúc lại trên đồng thau.

const circle = (r: number) => `M ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0`;

const starPath = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 28; i++) {
    const r = i % 2 === 0 ? 92 : 44;
    const a = (i / 28) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${i === 0 ? "M" : "L"} ${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(" ") + " Z";
})();

const Bird: React.FC<{ flying: boolean; color: string; flap: number }> = ({ flying, color, flap }) => {
  const s = { stroke: color, strokeWidth: 4, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (flying) {
    const up = -22 - 10 * flap;
    return (
      <g {...s}>
        <path d={`M0 0 Q-14 ${up} -32 ${up + 8}`} />
        <path d={`M0 0 Q14 ${up} 32 ${up + 8}`} />
        <path d="M0 0 Q0 8 0 14 M-4 16 L0 8 L4 16" />
        <path d="M0 -2 L0 -10 L6 -12" />
      </g>
    );
  }
  return (
    <g {...s}>
      <path d="M-14 4 Q-4 -8 10 -4 L16 -14 L22 -16" />
      <path d="M-14 4 Q-4 14 10 4" />
      <path d="M-2 10 L-2 24 M6 8 L6 24" />
      <path d="M-14 4 L-24 -4" />
    </g>
  );
};

const CHIPS = ["sông nước", "đầm lầy", "núi rừng", "lễ hội"];

export const Sc34: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { frame, p } = useFrac(durationInFrames);
  const CX = 520;
  const CY = 500;
  const R = 300;
  const spin = -frame * 0.35 - 25 * ease(p(0, 0.5));
  const pulse = 0.5 + 0.5 * Math.sin(frame / 12);
  const ringIn = ease(p(0.0, 0.08));
  // birds appear one after another (0.06 .. 0.36), matching the 36 count-up
  const N = 36;
  const countStart = 0.06;
  const countEnd = 0.36;
  const shown = Math.floor(ease(p(countStart, countEnd)) * N + 0.0001);
  const perchedShown = Math.floor(shown / 2) + (shown % 2);
  const flyShown = Math.floor(shown / 2);
  const phase18 = p(0.4, 0.5) > 0; // 18 / 18 emphasis window
  const emph18 = phase18 && p(0.6, 0.62) === 0 ? 1 : 0;
  const interpLit = ease(p(0.58, 0.7));

  return (
    <Paper>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="s34core">
            <stop offset="0%" stopColor={C.amber} stopOpacity={0.35} />
            <stop offset="100%" stopColor={C.amber} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={`translate(${CX} ${CY})`}>
          <circle r={150 + 20 * pulse} fill="url(#s34core)" opacity={ringIn} />
          <InkPath d={starPath} startFrac={0} endFrac={0.08} stroke={C.amber} strokeWidth={3} fill="rgba(217,164,65,0.14)" />
          <InkPath d={circle(130)} startFrac={0.01} endFrac={0.09} stroke={C.mute} strokeWidth={3} />
          <InkPath d={circle(R - 56)} startFrac={0.02} endFrac={0.1} stroke={C.mute} strokeWidth={3} />
          <InkPath d={circle(R + 56)} startFrac={0.03} endFrac={0.11} stroke={C.mute} strokeWidth={3} />
          <InkPath d={circle(R + 66)} startFrac={0.04} endFrac={0.12} stroke={C.amber} strokeWidth={2} style={{ opacity: 0.55 }} />
          <g transform={`rotate(${spin})`}>
            {Array.from({ length: N }).map((_, i) => {
              const flying = i % 2 === 1;
              const idx = i; // appearance order index
              const vis = idx < shown;
              const born = p(countStart + (idx / N) * (countEnd - countStart), countStart + (idx / N) * (countEnd - countStart) + 0.03);
              const a = (i / N) * 360;
              const lit = phase18 && emph18 === 0;
              const col = lit ? (flying ? C.teal : C.amber) : C.cream;
              const flap = 0.5 + 0.5 * Math.sin(frame / 5 + i);
              return (
                <g
                  key={i}
                  opacity={vis ? 1 : 0}
                  transform={`rotate(${a}) translate(0 ${-R}) rotate(90) scale(${0.9 + 0.6 * ease(born)})`}
                >
                  <Bird flying={flying} color={col} flap={flying ? flap : 0} />
                </g>
              );
            })}
          </g>
          <text x={0} y={16} textAnchor="middle" fontFamily={FONT.display} fontWeight={800} fontSize={0} fill={C.amber} />
        </g>
      </svg>

      {/* right column */}
      <div style={{ position: "absolute", left: 1000, right: 64, top: 100 }}>
        <Reveal startFrac={0.02} endFrac={0.1}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber }}>
            VÀNH 10 · CHIM MUÔNG
          </div>
        </Reveal>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 6 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 210, lineHeight: 1.05, color: C.white }}>
            <CountUp to={36} startFrac={countStart} endFrac={countEnd} />
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 44, color: C.cream }}>con chim</div>
        </div>

        <div style={{ display: "flex", gap: 28, marginTop: 20 }}>
          <Reveal startFrac={0.38} endFrac={0.46}>
            <div
              style={{
                padding: "14px 30px",
                border: `3px solid ${C.amber}`,
                borderRadius: 12,
                background: C.card,
                transform: `scale(${1 + 0.03 * pulse * (phase18 ? 1 : 0)})`,
              }}
            >
              <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 80, color: C.amber }}>
                <CountUp to={18} startFrac={0.38} endFrac={0.46} />
              </span>
              <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38, color: C.cream, marginLeft: 14 }}>
                đậu
              </span>
            </div>
          </Reveal>
          <Reveal startFrac={0.47} endFrac={0.55}>
            <div
              style={{
                padding: "14px 30px",
                border: `3px solid ${C.teal}`,
                borderRadius: 12,
                background: C.card,
                transform: `scale(${1 + 0.03 * (1 - pulse) * (phase18 ? 1 : 0)})`,
              }}
            >
              <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 80, color: C.teal }}>
                <CountUp to={18} startFrac={0.47} endFrac={0.55} />
              </span>
              <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38, color: C.cream, marginLeft: 14 }}>
                sải cánh bay
              </span>
            </div>
          </Reveal>
        </div>

        {/* interpretation: đa sinh thái */}
        <Reveal startFrac={0.58} endFrac={0.66} style={{ marginTop: 44 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, lineHeight: 1.2, color: C.white }}>
            Một xã hội đa sinh thái
          </div>
        </Reveal>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 20 }}>
          {CHIPS.map((c, i) => {
            const t = ease(p(0.62 + i * 0.035, 0.68 + i * 0.035));
            return (
              <div
                key={c}
                style={{
                  opacity: t,
                  transform: `translateY(${(1 - t) * 18}px)`,
                  padding: "8px 24px",
                  border: `2px solid ${C.amber}`,
                  borderRadius: 40,
                  background: "rgba(36,31,26,0.9)",
                  fontFamily: FONT.body,
                  fontWeight: 500,
                  fontSize: 36,
                  color: C.cream,
                }}
              >
                {c}
              </div>
            );
          })}
        </div>
        <div style={{ height: 0, opacity: interpLit }} />
      </div>

      {/* closing message: lên núi xuống biển */}
      <Reveal
        startFrac={0.8}
        endFrac={0.9}
        style={{ position: "absolute", left: 64, right: 64, bottom: 56, textAlign: "center" }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "18px 44px",
            borderTop: `3px solid ${C.amber}`,
            borderBottom: `3px solid ${C.amber}`,
            background: "rgba(26,23,20,0.85)",
            boxShadow: `0 0 ${40 + 30 * pulse}px rgba(217,164,65,0.25)`,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 48,
            color: C.white,
          }}
        >
          “Lên núi xuống biển mà vẫn báo cho nhau biết” — đúc lại bằng đồng
        </div>
      </Reveal>

      <InterpretFlag />
    </Paper>
  );
};
