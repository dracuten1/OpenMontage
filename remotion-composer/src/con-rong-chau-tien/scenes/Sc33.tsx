import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkPath, Paper, Reveal, useFrac } from "../common";

// sc-33 — rim diagram. Narration order (s17): vành xoay ngược chiều kim đồng hồ -> vành 6:
// người múa lông chim -> cầm rìu -> thổi khèn -> giã cối đôi -> nhà mái cong hình thuyền -> vành 8: hươu đực, hươu cái.

type Kind = "dance" | "axe" | "horn" | "pestle" | "boat" | "stag" | "doe";

const ITEMS: { kind: Kind; text: string; start: number }[] = [
  { kind: "dance", text: "Người múa hóa trang lông chim", start: 0.14 },
  { kind: "axe", text: "Người cầm rìu", start: 0.25 },
  { kind: "horn", text: "Người thổi khèn", start: 0.35 },
  { kind: "pestle", text: "Trai gái giã cối đôi", start: 0.45 },
  { kind: "boat", text: "Nhà mái cong hình thuyền", start: 0.56 },
];
const V8 = [
  { kind: "stag" as Kind, text: "Hươu đực", start: 0.72 },
  { kind: "doe" as Kind, text: "Hươu cái", start: 0.8 },
];

const circle = (r: number) => `M ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0`;

const starPath = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 28; i++) {
    const r = i % 2 === 0 ? 112 : 54;
    const a = (i / 28) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${i === 0 ? "M" : "L"} ${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(" ") + " Z";
})();

const Fig: React.FC<{ kind: Kind; color: string; w: number }> = ({ kind, color, w }) => {
  const s = { stroke: color, strokeWidth: w, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "dance":
      return (
        <g {...s}>
          <circle cx={0} cy={-22} r={4.5} />
          <path d="M-5 -28 L-7 -37 M0 -29 L0 -39 M5 -28 L7 -37" />
          <path d="M0 -17 L0 -4 M0 -13 L-12 -5 M0 -13 L12 -20" />
          <path d="M-3 -4 L-12 18 L12 18 L3 -4" />
        </g>
      );
    case "axe":
      return (
        <g {...s}>
          <circle cx={0} cy={-22} r={4.5} />
          <path d="M0 -17 L0 -2 M0 -13 L14 -16 M0 -2 L-6 18 M0 -2 L7 18" />
          <path d="M14 -30 L14 -4 M14 -30 Q26 -22 14 -14" />
        </g>
      );
    case "horn":
      return (
        <g {...s}>
          <circle cx={0} cy={-22} r={4.5} />
          <path d="M0 -17 L0 -2 M0 -13 L8 -20 M0 -2 L-6 18 M0 -2 L7 18" />
          <path d="M4 -24 L26 -12 L28 -8" />
        </g>
      );
    case "pestle":
      return (
        <g {...s}>
          <circle cx={-16} cy={-22} r={4} />
          <circle cx={16} cy={-22} r={4} />
          <path d="M-16 -18 L-16 0 M16 -18 L16 0 M-16 -14 L-3 4 M16 -14 L3 4" />
          <path d="M-16 0 L-18 18 M16 0 L18 18" />
          <path d="M-8 6 L8 6 L5 18 L-5 18 Z" />
        </g>
      );
    case "boat":
      return (
        <g {...s}>
          <path d="M-30 12 Q0 28 30 12" />
          <path d="M-26 -4 Q-10 8 0 8 Q10 8 26 -4" />
          <path d="M-14 8 L-14 12 M14 8 L14 12 M0 8 L0 14" />
          <path d="M-26 -4 L-26 -14 L-22 -18 M26 -4 L26 -14 L22 -18" />
          <circle cx={-26} cy={-18} r={2.5} />
          <circle cx={26} cy={-18} r={2.5} />
        </g>
      );
    case "stag":
      return (
        <g {...s}>
          <path d="M-18 0 Q0 -8 16 0 L16 8 L-18 8 Z" />
          <path d="M-14 8 L-14 22 M-6 8 L-6 22 M8 8 L8 22 M14 8 L14 22" />
          <path d="M16 0 L24 -14 L30 -12" />
          <path d="M22 -14 L18 -30 M20 -22 L28 -28 M26 -16 L30 -28 M22 -14 L14 -22" />
        </g>
      );
    case "doe":
      return (
        <g {...s}>
          <path d="M-18 0 Q0 -8 16 0 L16 8 L-18 8 Z" />
          <path d="M-14 8 L-14 22 M-6 8 L-6 22 M8 8 L8 22 M14 8 L14 22" />
          <path d="M16 0 L24 -14 L30 -12" />
          <path d="M22 -14 L21 -20 M25 -14 L28 -20" />
        </g>
      );
  }
};

export const Sc33: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { frame, p } = useFrac(durationInFrames);
  const rot6 = -70 * ease(p(0.0, 0.6)) - frame * 0.04;
  const rot8 = -45 * ease(p(0.0, 0.6)) - frame * 0.03;
  const pulse = 0.5 + 0.5 * Math.sin(frame / 14);
  const ringIn = ease(p(0.0, 0.1));
  const kinds6: Kind[] = ["dance", "axe", "horn", "pestle", "boat"];
  const N6 = 15;
  const N8 = 12;
  // which kind is currently "lit": the latest started item
  const all = [...ITEMS, ...V8];
  let active: Kind | null = null;
  for (const it of all) if (p(it.start, it.start + 0.01) > 0) active = it.kind;

  const CX = 520;
  const CY = 560;
  return (
    <Paper>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${CX} ${CY})`}>
          <circle r={190} fill="rgba(217,164,65,0.06)" opacity={ringIn} />
          {[150, 232, 342, 418].map((r, i) => (
            <InkPath key={r} d={circle(r)} startFrac={0.0 + i * 0.02} endFrac={0.1 + i * 0.02} stroke={C.mute} strokeWidth={3} />
          ))}
          <InkPath d={circle(238)} startFrac={0.02} endFrac={0.12} stroke={C.amber} strokeWidth={2} style={{ opacity: 0.6 }} />
          <InkPath d={circle(336)} startFrac={0.04} endFrac={0.14} stroke={C.amber} strokeWidth={2} style={{ opacity: 0.6 }} />
          <InkPath d={starPath} startFrac={0.0} endFrac={0.12} stroke={C.amber} strokeWidth={3} fill="rgba(217,164,65,0.12)" />

          {/* vành 6 */}
          <g transform={`rotate(${rot6})`} opacity={ringIn}>
            {Array.from({ length: N6 }).map((_, i) => {
              const kind = kinds6[i % 5];
              const a = (i / N6) * 360;
              const lit = active === kind;
              return (
                <g key={i} transform={`rotate(${a}) translate(0 -285) scale(${lit ? 1.12 + 0.05 * pulse : 1})`}>
                  <Fig kind={kind} color={lit ? C.amber : C.cream} w={lit ? 3.6 : 3} />
                </g>
              );
            })}
          </g>
          {/* vành 8 */}
          <g transform={`rotate(${rot8})`} opacity={ringIn}>
            {Array.from({ length: N8 }).map((_, i) => {
              const kind: Kind = i % 2 === 0 ? "stag" : "doe";
              const a = (i / N8) * 360;
              const lit = active === kind;
              return (
                <g key={i} transform={`rotate(${a}) translate(0 -380) scale(${lit ? 1.12 + 0.05 * pulse : 1})`}>
                  <Fig kind={kind} color={lit ? C.amber : C.cream} w={lit ? 3.6 : 3} />
                </g>
              );
            })}
          </g>
          {/* ring tags */}
          <g opacity={ease(p(0.06, 0.14))}>
            <text x={0} y={-176} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={28} fill={C.amber}>
              6
            </text>
          </g>
        </g>
      </svg>

      {/* right: callouts, same order as narration */}
      <div style={{ position: "absolute", left: 1040, right: 64, top: 76 }}>
        <Reveal startFrac={0.02} endFrac={0.1}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: C.amber, whiteSpace: "nowrap" }}>
            VÀNH XOAY NGƯỢC CHIỀU KIM ĐỒNG HỒ
          </div>
        </Reveal>
        <Reveal startFrac={0.1} endFrac={0.18}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.white, marginTop: 14 }}>
            Vành 6
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", left: 1040, right: 64, top: 214, display: "flex", flexDirection: "column", gap: 12 }}>
        {ITEMS.map((it) => {
          const t = ease(p(it.start, it.start + 0.07));
          const lit = active === it.kind;
          return (
            <div
              key={it.kind}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity: t,
                transform: `translateX(${(1 - t) * 40}px)`,
                padding: "4px 22px",
                background: C.card,
                border: `2px solid ${lit ? C.amber : C.border}`,
                borderRadius: 12,
              }}
            >
              <svg width={68} height={68} viewBox="-42 -42 84 84">
                <Fig kind={it.kind} color={lit ? C.amber : C.cream} w={3} />
              </svg>
              <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream }}>{it.text}</div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: 1040, right: 64, top: 740 }}>
        <Reveal startFrac={0.66} endFrac={0.74}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.white }}>Vành 8</div>
        </Reveal>
        <div style={{ display: "flex", gap: 24, marginTop: 14 }}>
          {V8.map((it) => {
            const t = ease(p(it.start, it.start + 0.07));
            const lit = active === it.kind;
            return (
              <div
                key={it.kind}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  opacity: t,
                  transform: `translateY(${(1 - t) * 24}px)`,
                  padding: "8px 22px",
                  background: C.card,
                  border: `2px solid ${lit ? C.amber : C.border}`,
                  borderRadius: 12,
                }}
              >
                <svg width={84} height={84} viewBox="-42 -42 84 84">
                  <g transform="translate(-2 4)">
                    <Fig kind={it.kind} color={lit ? C.amber : C.cream} w={3} />
                  </g>
                </svg>
                <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream }}>{it.text}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Paper>
  );
};
