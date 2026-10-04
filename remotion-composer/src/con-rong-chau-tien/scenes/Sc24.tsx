import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, LabBadge, Reveal, InterpretFlag, useFrac } from "../common";

// Sc24 - Nguyên tắc khoa học + "bản đồ tương ứng giả định" (DIỄN GIẢI).
// Order (narration s12 second half): nguyên tắc DNA không chứng minh nhân vật -> diễn giải giả định ->
// Mán Bạc ~4.000 năm trước khớp khung dã sử. Table rows: Mán Bạc/LLQ-ÂC -> Phùng Nguyên.. / Hùng Vương -> Đông Sơn / Lạc Việt.

const ROWS: { sci: string; sciSub?: string; myth: string }[] = [
  { sci: "Đá mới — Mán Bạc", sciSub: "4.100–3.600 năm trước", myth: "thế hệ Lạc Long Quân – Âu Cơ" },
  { sci: "Phùng Nguyên – Đồng Đậu – Gò Mun", myth: "thời Hùng Vương" },
  { sci: "Đông Sơn", myth: "Lạc Việt" },
];

export const Sc24: React.FC<SceneProps> = () => {
  const { frame, dur, p } = useFrac();
  const pulse = 0.5 + 0.5 * Math.sin((frame / dur) * Math.PI * 14);
  const signT = ease(p(0.03, 0.12));
  // sign flashes at entrance then settles to a soft pulse
  const flash = p(0.05, 0.2) < 1 ? 0.5 + 0.5 * Math.sin(frame * 0.5) : 0.35 + 0.15 * pulse;

  return (
    <Paper variant="lab">
      <LabBadge />
      <InterpretFlag />

      {/* principle sign */}
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 124,
          width: 1792,
          boxSizing: "border-box",
          padding: "26px 40px",
          border: `3px solid ${C.warn}`,
          borderRadius: 14,
          background: "rgba(200,85,61,0.12)",
          opacity: signT,
          transform: `translateY(${(1 - signT) * 20}px)`,
          boxShadow: `0 0 ${20 + 40 * flash}px rgba(200,85,61,${0.18 + 0.25 * flash})`,
        }}
      >
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.warn }}>NGUYÊN TẮC</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, lineHeight: 1.22, color: C.white, marginTop: 8 }}>
          DNA chứng minh <span style={{ color: C.teal }}>quá trình dân số</span> — không chứng minh{" "}
          <span style={{ color: C.warn }}>nhân vật thần thoại</span>
        </div>
      </div>

      {/* table title */}
      <Reveal startFrac={0.34} endFrac={0.42} dy={12} style={{ position: "absolute", left: 64, top: 402 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: C.amber }}>
          BẢN ĐỒ TƯƠNG ỨNG GIẢ ĐỊNH (?)
        </div>
      </Reveal>

      {/* header */}
      <Reveal startFrac={0.36} endFrac={0.44} dy={8} style={{ position: "absolute", left: 64, top: 458, width: 1792 }}>
        <div style={{ display: "flex", fontFamily: FONT.body, fontWeight: 700, fontSize: 28, letterSpacing: 3 }}>
          <div style={{ flex: 1, color: C.teal }}>MỐC KHOA HỌC / KHẢO CỔ</div>
          <div style={{ width: 150 }} />
          <div style={{ flex: 1, color: C.amber }}>TRUYỀN THUYẾT (GIẢ ĐỊNH)</div>
        </div>
      </Reveal>

      {/* rows */}
      {ROWS.map((r, i) => {
        const s = 0.44 + i * 0.15;
        const t = ease(p(s, s + 0.09));
        const arrowT = ease(p(s + 0.05, s + 0.13));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 64,
              top: 508 + i * 166,
              width: 1792,
              height: 140,
              display: "flex",
              alignItems: "center",
              opacity: t,
              transform: `translateX(${(1 - t) * -40}px)`,
            }}
          >
            <div
              style={{
                flex: 1,
                height: "100%",
                boxSizing: "border-box",
                background: C.card,
                border: `2px solid ${C.teal}`,
                borderRadius: 12,
                padding: "0 32px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: i === 1 ? 38 : 44, color: C.white, lineHeight: 1.15, whiteSpace: "nowrap" }}>{r.sci}</div>
              {r.sciSub && <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.cream, marginTop: 6 }}>{r.sciSub}</div>}
            </div>
            <svg width={150} height={60} viewBox="0 0 150 60" style={{ flexShrink: 0 }}>
              <line
                x1={14}
                y1={30}
                x2={14 + 100 * arrowT}
                y2={30}
                stroke={C.amber}
                strokeWidth={4}
                strokeDasharray="10 8"
                strokeDashoffset={-frame * 0.8}
              />
              <path d="M112,16 L136,30 L112,44" fill="none" stroke={C.amber} strokeWidth={4} strokeLinecap="round" opacity={arrowT} />
            </svg>
            <div
              style={{
                flex: 1,
                height: "100%",
                boxSizing: "border-box",
                background: C.card,
                border: `2px dashed ${C.amber}`,
                borderRadius: 12,
                padding: "0 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: ease(p(s + 0.04, s + 0.12)),
              }}
            >
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.white, lineHeight: 1.15 }}>{r.myth}</div>
              <div
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 800,
                  fontSize: 70,
                  color: C.amber,
                  opacity: 0.75 + 0.25 * pulse,
                }}
              >
                ?
              </div>
            </div>
          </div>
        );
      })}
    </Paper>
  );
};
