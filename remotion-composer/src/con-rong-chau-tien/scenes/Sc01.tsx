// sc-01 — Callback Ep.01 + hook. Order follows narration:
// series title -> Ep.01 recap (gene Bách Việt struck out) -> mist clears -> hook question.
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkDraw, Paper, Reveal, useFrac } from "../common";

const Dust: React.FC<{ n: number; seed: string }> = ({ n, seed }) => {
  const { frame } = useFrac();
  const items = Array.from({ length: n }, (_, i) => {
    const x = random(`${seed}-x-${i}`) * 1920;
    const y0 = random(`${seed}-y-${i}`) * 1080;
    const sp = 0.25 + random(`${seed}-s-${i}`) * 0.5;
    const r = 2 + random(`${seed}-r-${i}`) * 3.5;
    const ph = random(`${seed}-p-${i}`) * 6.28;
    const y = (((y0 - frame * sp) % 1080) + 1080) % 1080;
    const a = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(frame * 0.07 + ph));
    return <circle key={i} cx={x + Math.sin(frame * 0.02 + ph) * 14} cy={y} r={r} fill={C.amber} opacity={a * 0.7} />;
  });
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {items}
    </svg>
  );
};

export const Sc01: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const cardScale = 1 + 0.018 * p(0, 1);
  const glow = 0.16 + 0.05 * Math.sin(frame * 0.05);

  // strike sweep across "gene Bách Việt" (narration: "không hề có một mã gene nào tên là Bách Việt")
  const strike = ease(p(0.38, 0.5));
  const textDim = 1 - 0.35 * ease(p(0.44, 0.56));
  const verdict = ease(p(0.5, 0.58));

  // mist wipe ("gạt bỏ lớp sương mù thần thoại")
  const mistT = p(0.58, 0.82);
  const mistX = -700 + mistT * 2900;
  const mistA = Math.sin(Math.min(1, mistT) * Math.PI) * 0.55;

  return (
    <Paper>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 55%, rgba(217,164,65,${glow}) 0%, rgba(217,164,65,0) 60%)`,
        }}
      />
      <Dust n={36} seed="sc01" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 1560,
            padding: "52px 80px 60px",
            background: C.card,
            border: `2px solid ${C.border}`,
            borderRadius: 16,
            boxShadow: "0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(217,164,65,0.08) inset",
            transform: `scale(${cardScale})`,
            textAlign: "center",
            opacity: ease(p(0, 0.05)),
          }}
        >
          {/* series lockup (spring-down) */}
          <Reveal startFrac={0.04} endFrac={0.1} dy={-16}>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 8, color: C.amber }}>
              VN-MYTH · EP.02
            </div>
          </Reveal>
          <Reveal startFrac={0.08} endFrac={0.16} dy={-16}>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 72, lineHeight: 1.12, color: C.white, marginTop: 14 }}>
              Bọc trăm trứng dưới ánh sáng DNA
            </div>
          </Reveal>
          <div style={{ height: 6, margin: "26px auto 0", width: 520 }}>
            <InkDraw d="M0 3 L520 3" viewBox="0 0 520 6" startFrac={0.14} endFrac={0.24} stroke={C.amber} strokeWidth={3} height={6} width={520} />
          </div>

          {/* Ep.01 recap: gene Bách Việt struck through */}
          <Reveal startFrac={0.22} endFrac={0.34} dy={12}>
            <div style={{ marginTop: 38, display: "flex", alignItems: "center", justifyContent: "center", gap: 32 }}>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 30,
                  color: C.cream,
                  border: `2px solid ${C.mute}`,
                  borderRadius: 6,
                  padding: "6px 18px",
                  letterSpacing: 2,
                }}
              >
                TẬP 1
              </div>
              <div style={{ position: "relative", display: "inline-block" }}>
                <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 84, color: C.cream, opacity: textDim }}>
                  gene Bách Việt
                </span>
                <div
                  style={{
                    position: "absolute",
                    left: -14,
                    top: "56%",
                    height: 9,
                    width: `${strike * 104}%`,
                    background: C.warn,
                    borderRadius: 4,
                    boxShadow: `0 0 18px ${C.warn}`,
                    transform: "rotate(-1.2deg)",
                    transformOrigin: "left center",
                  }}
                />
              </div>
            </div>
          </Reveal>
          <div
            style={{
              marginTop: 14,
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 34,
              color: C.warn,
              letterSpacing: 4,
              opacity: verdict,
              transform: `translateY(${(1 - verdict) * 10}px)`,
            }}
          >
            KHÔNG TỒN TẠI TRONG DNA
          </div>

          {/* hook question (fade-up 12px) */}
          <Reveal startFrac={0.82} endFrac={0.94} dy={12}>
            <div style={{ marginTop: 40, borderTop: `1px solid ${C.border}`, paddingTop: 34 }}>
              <div
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 700,
                  fontSize: 62,
                  lineHeight: 1.2,
                  color: C.white,
                  textShadow: `0 0 ${24 + 10 * Math.sin(frame * 0.08)}px rgba(217,164,65,0.35)`,
                }}
              >
                Thần thoại hay ký ức hòa huyết có thật?
              </div>
            </div>
          </Reveal>
        </div>
      </AbsoluteFill>

      {/* drifting mist sweeping across */}
      <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 120,
            height: 840,
            width: 900,
            left: mistX,
            opacity: mistA,
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(232,220,200,0.55) 0%, rgba(232,220,200,0.22) 45%, rgba(232,220,200,0) 72%)",
            filter: "blur(10px)",
          }}
        />
      </AbsoluteFill>
    </Paper>
  );
};
