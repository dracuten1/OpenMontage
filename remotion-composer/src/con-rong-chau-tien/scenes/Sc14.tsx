// sc-14 — Sử thi Đẻ đất đẻ nước + 1.434.628 người Mường.
// Narration order: sử thi (Te tấc te đác) -> 8.000–16.000 câu -> 1.434.628 người, đông thứ ba -> Hòa Bình, Thanh Hóa, Phú Thọ.
import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { CountUp, Paper, Reveal, SourceTag, SpringPop, formatVN, useFrac } from "../common";

const PROVINCES: { name: string; value: number; start: number }[] = [
  { name: "Hòa Bình", value: 549026, start: 0.72 },
  { name: "Thanh Hóa", value: 376340, start: 0.79 },
  { name: "Phú Thọ", value: 218404, start: 0.86 },
];

const Panel: React.FC<{ start: number; children: React.ReactNode; w: number }> = ({ start, children, w }) => {
  const { p, frame } = useFrac();
  const t = ease(p(start, start + 0.08));
  const pulse = 0.5 + 0.5 * Math.sin(frame / 20);
  return (
    <div
      style={{
        width: w,
        padding: "34px 44px 38px",
        background: C.card,
        border: `2px solid ${C.border}`,
        borderTop: `4px solid ${C.amber}`,
        borderRadius: 18,
        opacity: t,
        transform: `translateY(${(1 - t) * 40}px)`,
        boxShadow: `0 0 ${20 + pulse * 14}px rgba(217,164,65,0.12)`,
      }}
    >
      {children}
    </div>
  );
};

/** simple verse-lines motif: 16 stanza lines growing, evokes a long oral epic */
const VerseLines: React.FC = () => {
  const { p, frame } = useFrac();
  return (
    <svg width={560} height={70} viewBox="0 0 560 70" style={{ marginTop: 18 }}>
      {Array.from({ length: 16 }).map((_, i) => {
        const t = ease(p(0.2 + i * 0.006, 0.3 + i * 0.006));
        const w = (110 + ((i * 53) % 90)) * t;
        const wob = Math.sin(frame / 14 + i) * 2;
        return (
          <rect key={i} x={(i % 2) * 16} y={i * 4.2 + wob * 0.2} width={w * 2.6} height={2.4} fill={C.amber} opacity={0.35 + 0.4 * ((i % 4) / 3)} />
        );
      })}
    </svg>
  );
};

export const Sc14: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  return (
    <Paper>
      <div style={{ position: "absolute", top: 64, left: 64, right: 64 }}>
        <Reveal startFrac={0.02} endFrac={0.08}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber }}>SỬ THI MƯỜNG</div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", top: 130, left: 64, right: 64, display: "flex", gap: 40, justifyContent: "center" }}>
        {/* STAT 1: sử thi */}
        <Panel start={0.05} w={840}>
          <Reveal startFrac={0.06} endFrac={0.13}>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 66, lineHeight: 1.1, color: C.white }}>Đẻ đất đẻ nước</div>
            <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream, marginTop: 8 }}>
              tiếng Mường: <span style={{ fontStyle: "italic", color: C.amber, fontWeight: 700 }}>Te tấc te đác</span>
            </div>
          </Reveal>
          <VerseLines />
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 10 }}>
            <CountUp to={8000} startFrac={0.2} endFrac={0.3} style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 92, color: C.amber }} />
            <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 60, color: C.cream }}>–</span>
            <CountUp to={16000} startFrac={0.2} endFrac={0.34} style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 92, color: C.amber }} />
          </div>
          <Reveal startFrac={0.3} endFrac={0.38}>
            <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.cream, marginTop: 4 }}>câu thơ sử thi truyền miệng</div>
          </Reveal>
        </Panel>

        {/* STAT 2: dân số */}
        <Panel start={0.4} w={840}>
          <Reveal startFrac={0.41} endFrac={0.48}>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 3, color: C.cream }}>NGƯỜI MƯỜNG HÔM NAY</div>
          </Reveal>
          <div style={{ marginTop: 14 }}>
            <CountUp to={1434628} startFrac={0.42} endFrac={0.58} style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 110, color: C.amber }} />
          </div>
          <Reveal startFrac={0.5} endFrac={0.58}>
            <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.cream, marginTop: 4 }}>người · Tổng điều tra 2019</div>
          </Reveal>
          <SpringPop startFrac={0.58} from={0.6} style={{ marginTop: 22, transformOrigin: "left center" }}>
            <div
              style={{
                display: "inline-block",
                padding: "8px 28px",
                border: `2px solid ${C.amber}`,
                borderRadius: 40,
                background: "rgba(217,164,65,0.14)",
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 36,
                color: C.white,
              }}
            >
              Đông thứ 3 cả nước
            </div>
          </SpringPop>
        </Panel>
      </div>

      {/* Provinces */}
      <div style={{ position: "absolute", left: 64, right: 64, top: 700, display: "flex", gap: 32, justifyContent: "center" }}>
        {PROVINCES.map((pv) => {
          const t = ease(p(pv.start, pv.start + 0.07));
          const barW = (pv.value / 549026) * 100 * ease(p(pv.start + 0.03, pv.start + 0.14));
          const glow = 0.5 + 0.5 * Math.sin(frame / 16 + pv.start * 10);
          return (
            <div
              key={pv.name}
              style={{
                width: 560,
                padding: "22px 30px 26px",
                background: C.card,
                border: `2px solid ${C.border}`,
                borderRadius: 16,
                opacity: t,
                transform: `translateY(${(1 - t) * 40}px)`,
                boxShadow: `0 0 ${10 + glow * 12}px rgba(217,164,65,0.10)`,
              }}
            >
              <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38, color: C.white }}>{pv.name}</div>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 60, color: C.amber, marginTop: 4 }}>{formatVN(pv.value)}</div>
              <div style={{ height: 10, borderRadius: 5, background: C.border, marginTop: 12, overflow: "hidden" }}>
                <div style={{ width: `${barW}%`, height: "100%", background: C.amber, borderRadius: 5 }} />
              </div>
            </div>
          );
        })}
      </div>
      <Reveal startFrac={0.7} endFrac={0.76} style={{ position: "absolute", left: 64, top: 648 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.cream }}>CƯ TRÚ TẬP TRUNG</div>
      </Reveal>
      <SourceTag text="Tổng điều tra 2019 (GSO) · Sử thi Đẻ đất đẻ nước" />
    </Paper>
  );
};
