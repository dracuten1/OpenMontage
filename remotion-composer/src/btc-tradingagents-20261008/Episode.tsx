// btc-tradingagents-20261008 — "Bitcoin Thủng 83.000 USD — 63% Vẫn Lạc Quan"
// (atelier composition, VERTICAL 1080x1920 @30fps).
// One <Sequence> per scene from MEASURED scene_timing.json (100.493s + 1s tail).
// Every reveal / count-up / draw is speech-locked (frameOf) to SPOKEN word times
// in public/btc-tradingagents-20261008/words.json (60/60 anchors audited).
// All on-screen numbers ⊆ digest whitelist, vi-VN display (82.145,70 USD).
// Only 2 gen mood backdrops (s01/s08, opacity ≤0.35 + black overlay) —
// every chart/stat/typography is pure TSX/SVG (focal-visual rule).
import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring,
} from "remotion";
import { C, FONT, MONO, SAFE, SPRING, fmtVi } from "./theme";
import { SCENE_TIMING, TOTAL_FRAMES, frameOf, frameOfEnd, getSceneTiming, type SceneId } from "./timing";
import captionsJson from "../../public/btc-tradingagents-20261008/captions.json";

export const BTC08_20261008_TOTAL_FRAMES = TOTAL_FRAMES; // 3045
const SF = (id: SceneId): number => getSceneTiming(id).scene_frames;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const lit = (f: number, at: number, k = 8): number => interpolate(f - at, [0, k], [0, 1], clamp);

// ---------------------------------------------------------------------------
// Shared primitives (mechanics codex — gh6 house style)
// ---------------------------------------------------------------------------

const Card: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 22, ...style }}>{children}</div>
);

const Chip: React.FC<{
  color: string; children?: React.ReactNode; dashed?: boolean; fill?: string; style?: React.CSSProperties;
}> = ({ color, children, dashed, fill = "rgba(255,255,255,0.04)", style }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 10,
    background: fill, color, border: `1.5px ${dashed ? "dashed" : "solid"} ${color}`,
    borderRadius: 12, padding: "10px 20px", fontSize: 28, fontWeight: 700, ...style,
  }}>{children}</div>
);

const slam = (at: number, frame: number, fps: number, fromScale = 1.45) => {
  const p = spring({ frame: frame - at, fps, config: { ...SPRING, damping: 18 } });
  const op = interpolate(frame - at, [0, 6], [0, 1], clamp);
  return { opacity: op, transform: `scale(${fromScale + (1 - fromScale) * p})` };
};

const glow = (color: string, strength: number): React.CSSProperties => ({ boxShadow: `0 0 ${strength}px ${color}` });

/** Number count-up, speech-locked. `at` = scene-local trigger frame. */
const CountUp: React.FC<{
  at: number; to: number; frames?: number; decimals?: number; style?: React.CSSProperties;
}> = ({ at, to, frames = 36, decimals = 0, style }) => {
  const f = useCurrentFrame();
  const eased = to * (f < at ? 0 : Math.pow(interpolate(f - at, [0, frames], [0, 1], clamp), 0.6));
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{f < at ? "" : fmtVi(eased, decimals)}</span>;
};

/** SVG path draw-on reveal via pathLength=100 normalization. */
const drawP = (f: number, at: number, k = 18): number => 100 * (1 - interpolate(f - at, [0, k], [0, 1], clamp));

// ---------------------------------------------------------------------------
// S01 — HOOK: 4 PHIÊN ĐỎ LIỀN vs 63% BULLISH (mood backdrop #1)
// ---------------------------------------------------------------------------
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aFour = frameOf("s01", "bốn phiên liên tiếp");
  const a63 = frameOf("s01", "sáu mươi ba phần trăm");
  const aBull = frameOf("s01", "vẫn gắn nhãn lạc quan");
  const aQ = frameOf("s01", "Họ biết gì mà chúng ta chưa biết");
  const aMark = frameOf("s01", "mốc giá nào sẽ phán xử");
  const bgDrift = interpolate(f, [0, SF("s01")], [1.0, 1.03], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Img src={staticFile("btc-tradingagents-20261008/bg_s01.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.32, transform: `scale(${bgDrift})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,17,23,0.78) 0%, rgba(13,17,23,0.62) 38%, rgba(13,17,23,0.9) 72%, #0D1117 100%)" }} />
      {/* kinetic '4 PHIÊN ĐỎ LIỀN' — word-by-word slam on the beat */}
      <div style={{ position: "absolute", top: 512, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", gap: 18 }}>
        {["4 PHIÊN", "ĐỎ", "LIỀN"].map((t, i) => (
          <span key={t} style={{ color: C.red, fontSize: i === 0 ? 96 : 84, fontWeight: 900, letterSpacing: 1, ...slam(aFour + i * 5, f, fps, 1.5), ...(f >= aFour + i * 5 ? { textShadow: "0 0 44px rgba(248,81,73,0.5)" } : {}) }}>
            {t}
          </span>
        ))}
      </div>
      {/* counter 63% BULLISH — the paradox, dead center */}
      <div style={{ position: "absolute", top: 742, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 16, ...slam(a63, f, fps, 0.6) }}>
          <span style={{ color: C.green, fontSize: 200, fontWeight: 900, lineHeight: 1, fontFamily: FONT, textShadow: "0 0 60px rgba(63,185,80,0.4)" }}>
            <CountUp at={a63} to={63} frames={34} /><span style={{ fontSize: 110 }}>%</span>
          </span>
          <span style={{ color: C.green, fontSize: 64, fontWeight: 900, letterSpacing: 2, opacity: lit(f, aBull, 8) }}>BULLISH</span>
        </div>
        <div style={{ color: C.textSoft, fontSize: 32, fontWeight: 700, marginTop: 8, opacity: lit(f, aBull, 10) }}>nhà đầu tư nhỏ lẻ vẫn gắn nhãn lạc quan</div>
      </div>
      {/* the open question */}
      <div style={{ position: "absolute", top: 1118, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aQ, 12), transform: `translateY(${interpolate(f - aQ, [0, 12], [24, 0], clamp)}px)` }}>
        <span style={{ color: C.text, fontSize: 58, fontWeight: 900, lineHeight: 1.15, letterSpacing: 0.5 }}>HỌ BIẾT GÌ MÀ<br />CHÚNG TA CHƯA BIẾT?</span>
      </div>
      {/* today's promise chip — answered at s08 */}
      <div style={{
        position: "absolute", top: 1330, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aMark, 10), transform: `translateX(${interpolate(f - aMark, [0, 12], [-70, 0], clamp)}px)`,
      }}>
        <Chip color={C.blue} fill="rgba(88,166,255,0.10)" style={{ fontSize: 32, fontWeight: 800, ...(f >= aMark ? glow("rgba(88,166,255,0.3)", 18) : {}) }}>
          mục hôm nay: tìm mốc phán xử
        </Chip>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S02 — SỰ KIỆN: 4 nến đỏ thủng 83.000, đóng cửa 82.145,70 (real-data chart)
// ---------------------------------------------------------------------------
const S02_CANDLES = [
  { date: "05/10", high: 86971.78, open: 86760, close: 86400, low: 86250 },
  { date: "", high: 85600, open: 85500, close: 84950, low: 84800 },
  { date: "", high: 84500, open: 84400, close: 83800, low: 83650 },
  { date: "08/10", high: 83427.12, open: 83300, close: 82145.7, low: 82145.7 },
];
const S02_yOf = (p: number): number => ((87600 - p) / 6000) * 730;

const S02: React.FC = () => {
  const f = useCurrentFrame();
  const aThung = frameOf("s02", "thủng ngưỡng tâm lý");
  const a83 = frameOf("s02", "tám mươi ba nghìn");
  const aClose = frameOf("s02", "đóng cửa tại");
  const aDinh = frameOf("s02", "Từ đỉnh đầu tuần");
  const aBon = frameOf("s02", "bốn phiên liền");
  const aKeo = frameOf("s02", "kéo cả nhóm");
  const flash = f >= a83 ? Math.max(0, 1 - (f - a83) / 26) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Card style={{ position: "absolute", top: 420, left: SAFE.x, width: SAFE.w, height: 730 }}>
        <svg width={SAFE.w} height={730} viewBox={`0 0 ${SAFE.w} 730`}>
          {/* faint grid */}
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={0} x2={SAFE.w} y1={120 + i * 170} y2={120 + i * 170} stroke="rgba(240,246,252,0.05)" strokeWidth={1} />
          ))}
          {/* 83.000 psychological threshold — dashed, pierced by the last candle */}
          <g opacity={lit(f, aThung + 6, 8)}>
            <line x1={30} x2={SAFE.w - 30} y1={S02_yOf(83000)} y2={S02_yOf(83000)} stroke={C.amber} strokeWidth={3} strokeDasharray="14 10" opacity={0.8} />
            {flash > 0 && <line x1={30} x2={SAFE.w - 30} y1={S02_yOf(83000)} y2={S02_yOf(83000)} stroke={C.red} strokeWidth={7} opacity={0.75 * flash} />}
          </g>
          {/* candles, revealed in time order */}
          {S02_CANDLES.map((cd, i) => {
            const at = aThung + i * 7;
            const op = lit(f, at, 6);
            const cx = 135 + i * 210;
            const bodyTop = S02_yOf(Math.max(cd.open, cd.close));
            const bodyH = Math.max(8, Math.abs(S02_yOf(cd.open) - S02_yOf(cd.close)));
            return (
              <g key={i} opacity={op}>
                <line x1={cx} x2={cx} y1={S02_yOf(cd.high)} y2={S02_yOf(cd.low)} stroke={C.red} strokeWidth={3.5} />
                <rect x={cx - 42} y={bodyTop} width={84} height={bodyH} rx={5} fill="#F85149" fillOpacity={0.88} stroke="#F85149" strokeWidth={2} />
              </g>
            );
          })}
        </svg>
        {/* 83.000 label */}
        <div style={{ position: "absolute", left: 26, top: S02_yOf(83000) - 44, opacity: lit(f, aThung + 6, 8) }}>
          <span style={{ background: "rgba(1,4,9,0.85)", border: `1.5px solid ${C.amber}`, color: C.amber, borderRadius: 8, padding: "5px 12px", fontSize: 26, fontWeight: 800, fontFamily: MONO }}>83.000</span>
        </div>
        {/* ordinal badges + dates (đánh số 4 phiên) */}
        {S02_CANDLES.map((cd, i) => {
          const at = aDinh + 10 + i * 6;
          return (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left: 135 + i * 210 - 19, top: Math.min(S02_yOf(cd.high) - 58, 652), opacity: lit(f, at, 6) }}>
                <span style={{ display: "inline-flex", width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", background: "rgba(1,4,9,0.85)", border: `2px solid ${C.red}`, color: C.red, fontSize: 24, fontWeight: 900, fontFamily: MONO }}>{i + 1}</span>
              </div>
              {cd.date ? (
                <div style={{ position: "absolute", left: 135 + i * 210 - 46, top: 730 - 34, width: 92, textAlign: "center", opacity: lit(f, at, 6) }}>
                  <span style={{ color: C.muted, fontSize: 24, fontWeight: 700, fontFamily: MONO }}>{cd.date}</span>
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </Card>
      {/* stat card — đóng cửa 82.145,70 */}
      <div style={{
        position: "absolute", top: 1178, left: SAFE.x, right: SAFE.x,
        opacity: lit(f, aClose, 10), transform: `translateY(${interpolate(f - aClose, [0, 12], [40, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "22px 32px", display: "flex", alignItems: "center", gap: 26, ...(f >= aClose ? glow("rgba(248,81,73,0.25)", 22) : {}) }}>
          <div style={{ color: C.red, fontSize: 84, fontWeight: 900, lineHeight: 1, fontFamily: FONT }}>
            <CountUp at={aClose} to={82145.7} frames={40} decimals={2} /><span style={{ fontSize: 40 }}> USD</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div style={{ color: C.text, fontSize: 32, fontWeight: 800 }}>ĐÓNG CỬA 08/10</div>
            <div style={{ opacity: lit(f, aDinh, 8) }}>
              <Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 25 }}>đỉnh 05/10: 86.971,78</Chip>
            </div>
          </div>
        </Card>
      </div>
      {/* crypto equities follow */}
      <div style={{
        position: "absolute", top: 1404, left: SAFE.x, right: SAFE.x, display: "flex", gap: 14, justifyContent: "center",
        opacity: lit(f, aKeo, 10), transform: `translateY(${interpolate(f - aKeo, [0, 10], [22, 0], clamp)}px)`,
      }}>
        {["COIN", "MSTR", "HOOD"].map((t) => (
          <Chip key={t} color={C.red} fill={C.redFill} style={{ fontSize: 27, fontFamily: MONO }}>{t} ↓</Chip>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S03 — MYTH-BUSTER: stamp CHƯA + thang giá 3 nút + ATR
// ---------------------------------------------------------------------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aQ = frameOf("s03", "Bốn phiên đỏ có nghĩa là sụp đổ");
  const aChua = frameOf("s03", "Chưa");
  const a50 = frameOf("s03", "đường trung bình năm mươi ngày");
  const a200 = frameOf("s03", "đường hai trăm ngày");
  const aAtr = frameOf("s03", "hơn hai nghìn đô");
  const aStr = frameOf("s03", "Cấu trúc chưa gãy");
  const nodes = [
    { label: "GIÁ", num: 82145.7, dec: 2, y: 496, at: aQ + 10, color: C.text },
    { label: "50 SMA", num: 80541.75, dec: 2, y: 716, at: a50, color: C.green },
    { label: "200 SMA", num: 71801.51, dec: 2, y: 936, at: a200, color: C.green },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* myth question, dim */}
      <div style={{ position: "absolute", top: 322, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: 0.55 * lit(f, aQ, 10) }}>
        <span style={{ color: C.textSoft, fontSize: 40, fontWeight: 800 }}>4 PHIÊN ĐỎ = SỤP ĐỔ?</span>
      </div>
      {/* stamp CHƯA */}
      <div style={{ position: "absolute", top: 380, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center" }}>
        <span style={{ ...slam(aChua, f, fps, 1.6), display: "inline-block", border: `4px solid ${C.text}`, color: C.text, borderRadius: 16, padding: "6px 44px", fontSize: 64, fontWeight: 900, letterSpacing: 6, background: "rgba(1,4,9,0.6)", ...(f >= aChua ? glow("rgba(230,237,243,0.3)", 22) : {}) }}>CHƯA</span>
      </div>
      {/* price ladder + green structure line */}
      <svg width={SAFE.w} height={560} viewBox={`0 0 ${SAFE.w} 560`} style={{ position: "absolute", left: SAFE.x, top: 484 }}>
        <line x1={70} x2={70} y1={40} y2={540} stroke={C.border} strokeWidth={6} strokeLinecap="round" />
        <line x1={70} x2={70} y1={40} y2={40 + 218 * interpolate(f - nodes[0].at, [0, 10], [0, 1], clamp)} stroke={C.green} strokeWidth={6} strokeLinecap="round" opacity={0.85} />
        <line x1={70} x2={70} y1={258} y2={258 + 218 * interpolate(f - a200, [0, 10], [0, 1], clamp)} stroke={C.green} strokeWidth={6} strokeLinecap="round" opacity={0.85} />
      </svg>
      {nodes.map((n) => {
        const on = f >= n.at;
        return (
          <div key={n.label} style={{
            position: "absolute", top: n.y, left: 190, right: SAFE.x,
            opacity: lit(f, n.at, 10), transform: `translateX(${interpolate(f - n.at, [0, 10], [36, 0], clamp)}px)`,
          }}>
            <Card style={{ padding: "18px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `2px solid ${on ? C.green : C.border}`, ...(on ? glow("rgba(63,185,80,0.2)", 16) : {}) }}>
              <span style={{ color: C.textSoft, fontSize: 40, fontWeight: 900, fontFamily: MONO }}>{n.label}</span>
              <span style={{ color: on ? C.green : C.muted, fontSize: 52, fontWeight: 900, fontFamily: FONT }}>{fmtVi(n.num, n.dec)}</span>
            </Card>
          </div>
        );
      })}
      {/* ATR card */}
      <div style={{
        position: "absolute", top: 1148, left: SAFE.x, right: SAFE.x,
        opacity: lit(f, aAtr, 10), transform: `translateY(${interpolate(f - aAtr, [0, 12], [30, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "20px 30px", border: `2px solid ${C.blue}`, display: "flex", alignItems: "center", gap: 24, ...(f >= aAtr ? glow("rgba(88,166,255,0.22)", 20) : {}) }}>
          <div style={{ color: C.blue, fontSize: 76, fontWeight: 900, lineHeight: 1, fontFamily: FONT }}>
            ATR <CountUp at={aAtr} to={2098.66} frames={36} decimals={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.text, fontSize: 30, fontWeight: 800 }}>BIÊN ĐỘ DAO ĐỘNG NGÀY THƯỜNG</div>
            <div style={{ marginTop: 8, opacity: lit(f, aAtr + 10, 8) }}>
              <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 24 }}>cú giảm nằm trong biên độ</Chip>
            </div>
          </div>
        </Card>
      </div>
      {/* verdict */}
      <div style={{ position: "absolute", top: 1408, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aStr, 10) }}>
        <span style={{ color: C.green, fontSize: 50, fontWeight: 900, letterSpacing: 2, ...(f >= aStr ? { textShadow: "0 0 36px rgba(63,185,80,0.45)" } : {}) }}>CẤU TRÚC CHƯA GÃY</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S04 — ĐỘNG LƯỢNG: dưới 2 kháng cự + gauge RSI 49,21 + MACD -452,36
// ---------------------------------------------------------------------------
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const aGai = frameOf("s04", "đã gãy");
  const aRes = frameOf("s04", "nằm dưới kháng cự");
  const aMacd = frameOf("s04", "chỉ báo động lượng cắt xuống");
  const aRsi = frameOf("s04", "bốn mươi chín");
  const aBear = frameOf("s04", "Phe bán đang giữ nhịp");
  const yOf = (p: number): number => 440 + ((85000 - p) / 4000) * 560;
  const rsiVal = interpolate(f - aRsi, [0, 30], [68.51, 49.21], clamp);
  const needle = (v: number): [number, number] => {
    const rad = Math.PI * (1 - v / 100);
    return [230 + 96 * Math.cos(rad), 210 - 96 * Math.sin(rad)];
  };
  const [nx, ny] = needle(rsiVal);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* price panel under two resistance ceilings */}
      <Card style={{ position: "absolute", top: 420, left: SAFE.x, width: SAFE.w, height: 600 }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(248,81,73,${0.10 * lit(f, aRes, 12)}) 0%, rgba(248,81,73,0.02) 70%)`, borderRadius: 22 }} />
        <svg width={SAFE.w} height={600} viewBox={`0 0 ${SAFE.w} 600`}>
          {/* price squiggle under both lines */}
          <path
            d={`M 40 ${yOf(82600)} C 180 ${yOf(82700)}, 300 ${yOf(82300)}, 430 ${yOf(82400)} S 700 ${yOf(82000)}, 880 ${yOf(82145.7)}`}
            fill="none" stroke={C.textSoft} strokeWidth={4.5} strokeLinecap="round"
            strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aGai, 20)}
          />
          {/* resistance lines draw down over the price */}
          {[
            { p: 84379.66, t: "VWMA 84.379,66", at: aRes },
            { p: 84155.64, t: "10 EMA 84.155,64", at: aRes + 7 },
          ].map((r, ri) => (
            <g key={r.t}>
              <line x1={40} x2={880} y1={yOf(r.p)} y2={yOf(r.p)} stroke={C.red} strokeWidth={4} strokeDasharray="16 12" opacity={lit(f, r.at, 8)} />
              <rect x={620} y={yOf(r.p) - 42 - (ri === 0 ? 44 : 0)} width={252} height={36} rx={8} fill="rgba(1,4,9,0.88)" stroke={C.red} strokeWidth={1.5} opacity={lit(f, r.at, 8)} />
              <text x={746} y={yOf(r.p) - 17 - (ri === 0 ? 44 : 0)} textAnchor="middle" fill={C.red} fontSize={23} fontWeight={800} fontFamily={MONO} opacity={lit(f, r.at, 8)}>{r.t}</text>
            </g>
          ))}
          {/* closing dot */}
          <circle cx={880} cy={yOf(82145.7)} r={9} fill={C.text} opacity={lit(f, aGai + 14, 8)} />
        </svg>
        <div style={{ position: "absolute", left: 46, top: yOf(82145.7) + 16, opacity: lit(f, aGai + 16, 8) }}>
          <span style={{ color: C.muted, fontSize: 24, fontWeight: 700, fontFamily: MONO }}>GIÁ 82.145</span>
        </div>
      </Card>
      {/* RSI gauge — needle falls 68 → 49,21 */}
      <div style={{ position: "absolute", top: 1046, left: SAFE.x, width: 460, opacity: lit(f, aRsi, 10) }}>
        <svg width={460} height={230} viewBox="0 0 460 230">
          <path d="M 80 210 A 150 150 0 0 1 380 210" fill="none" stroke={C.border} strokeWidth={14} strokeLinecap="round" />
          <path d="M 80 210 A 150 150 0 0 1 380 210" fill="none" stroke={C.amber} strokeWidth={14} strokeLinecap="round"
            strokeDasharray="100" pathLength={100} strokeDashoffset={100 - rsiVal} opacity={0.9} />
          <line x1={230} y1={60} x2={230} y2={78} stroke={C.muted} strokeWidth={3} opacity={0.6} />
          <line x1={230} y1={210} x2={nx} y2={ny} stroke={C.text} strokeWidth={5} strokeLinecap="round" />
          <circle cx={230} cy={210} r={10} fill={C.text} />
          <text x={44} y={228} fill={C.muted} fontSize={22} fontWeight={700} fontFamily={MONO}>0</text>
          <text x={366} y={228} fill={C.muted} fontSize={22} fontWeight={700} fontFamily={MONO}>100</text>
          <text x={218} y={48} fill={C.muted} fontSize={22} fontWeight={700} fontFamily={MONO} opacity={0.7}>50</text>
        </svg>
      </div>
      {/* RSI number + MACD line */}
      <div style={{ position: "absolute", top: 1064, left: 500, right: SAFE.x }}>
        <div style={{ color: C.amber, fontSize: 84, fontWeight: 900, lineHeight: 1, fontFamily: FONT, opacity: lit(f, aRsi, 8) }}>
          RSI {f >= aRsi ? fmtVi(rsiVal, 2) : ""}
        </div>
        <div style={{ color: C.textSoft, fontSize: 27, fontWeight: 700, marginTop: 6, opacity: lit(f, aRsi + 8, 8) }}>trung tính · suy yếu</div>
        <div style={{ marginTop: 16, opacity: lit(f, aMacd, 10), transform: `translateY(${interpolate(f - aMacd, [0, 10], [18, 0], clamp)}px)` }}>
          <Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 27, fontFamily: MONO }}>MACD cắt xuống · histogram -452,36</Chip>
        </div>
      </div>
      {/* verdict */}
      <div style={{ position: "absolute", top: 1396, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aBear, 10) }}>
        <span style={{ color: C.red, fontSize: 52, fontWeight: 900, letterSpacing: 2, ...(f >= aBear ? { textShadow: "0 0 38px rgba(248,81,73,0.5)" } : {}) }}>PHE BÁN ĐANG GIỮ NHỊP</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S05 — VĨ MÔ: 3 luồng gió ngược + 96% FED (Polymarket)
// ---------------------------------------------------------------------------
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aAp = frameOf("s05", "Áp lực thật");
  const aBond = frameOf("s05", "lợi suất trái phiếu Mỹ");
  const a2002 = frameOf("s05", "hai nghìn không trăm lẻ hai");
  const aOil = frameOf("s05", "một trăm lẻ năm đô");
  const aRisk = frameOf("s05", "tài sản rủi ro");
  const aFed = frameOf("s05", "Còn Phét");
  const a96 = frameOf("s05", "chín mươi sáu phần trăm");
  const shrunk = f >= aFed;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* liquidity drain diagram — 3 blocks in narration order */}
      <div style={{
        position: "absolute", top: 470, left: SAFE.x, width: SAFE.w,
        opacity: shrunk ? 0.45 : 1,
      }}>
        <div style={{ position: "absolute", top: -34, left: 0, opacity: lit(f, aAp, 8) }}>
          <span style={{ color: C.textSoft, fontSize: 34, fontWeight: 900, letterSpacing: 1 }}>ÁP LỰC THẬT ĐẾN TỪ VĨ MÔ</span>
        </div>
        {[
          { t: "T-BOND 10N", sub: "lợi suất trái phiếu Mỹ", at: aBond, color: C.blue, fill: C.blueFill, stamp: "CAO NHẤT TỪ 2002", stampAt: a2002 },
          { t: "DẦU 105 USD/THÙNG", sub: "đồng xu đỏ", at: aOil, color: C.red, fill: C.redFill, stamp: "", stampAt: 0 },
          { t: "TÀI SẢN RỦI RO ↓", sub: "tiền chảy ra", at: aRisk, color: C.red, fill: C.redFill, stamp: "", stampAt: 0 },
        ].map((b, i) => {
          const on = f >= b.at;
          return (
            <div key={b.t} style={{ position: "relative", marginTop: i === 0 ? 40 : 46, marginBottom: 6 }}>
              <Card style={{ padding: "20px 30px", display: "flex", alignItems: "center", gap: 22, border: `2px solid ${on ? b.color : C.border}`, ...(on ? glow(`${b.color}44`, 18) : {}) }}>
                <span style={{ width: 20, height: 20, borderRadius: 10, background: on ? b.color : C.border, display: "inline-block" }} />
                <span style={{ color: on ? C.text : C.muted, fontSize: 42, fontWeight: 900, fontFamily: MONO, flex: 1 }}>{b.t}</span>
                {b.stamp && f >= b.stampAt ? (
                  <span style={{ ...slam(b.stampAt, f, fps, 1.5), border: `2.5px solid ${C.blue}`, color: C.blue, borderRadius: 10, padding: "8px 18px", fontSize: 27, fontWeight: 900, background: "rgba(1,4,9,0.6)" }}>{b.stamp}</span>
                ) : null}
              </Card>
              {i < 2 ? (
                <div style={{ position: "absolute", left: 460, bottom: -46, display: "flex", alignItems: "center", gap: 8, opacity: lit(f, b.at + 6, 8) }}>
                  {[0, 1, 2].map((k) => (
                    <span key={k} style={{ width: 10, height: 10, borderRadius: 5, background: C.red, opacity: 0.25 + 0.75 * Math.abs(Math.sin(((f * 0.22) + k * 0.9 + i) * Math.PI)) }} />
                  ))}
                  <svg width={26} height={22} viewBox="0 0 26 22"><path d="M 13 22 L 13 6 M 5 12 L 13 3 L 21 12" stroke={C.red} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {/* 96% card — the biggest stat of the act */}
      <div style={{
        position: "absolute", top: 920, left: SAFE.x + 180, right: SAFE.x + 180,
        opacity: lit(f, aFed, 10), transform: `translateX(${interpolate(f - aFed, [0, 14], [140, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "34px 30px", border: `2.5px solid ${C.amber}`, ...(f >= aFed ? glow("rgba(210,153,34,0.3)", 26) : {}) }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ color: C.amber, fontSize: 170, fontWeight: 900, lineHeight: 1, fontFamily: FONT, textShadow: "0 0 56px rgba(210,153,34,0.4)" }}>
              <CountUp at={a96} to={96} frames={40} /><span style={{ fontSize: 90 }}>%</span>
            </span>
            <div style={{ color: C.text, fontSize: 33, fontWeight: 900, marginTop: 10, lineHeight: 1.3 }}>FED KHÔNG CẮT GIẢM<br />2026</div>
            <div style={{ marginTop: 14 }}>
              <Chip color={C.amber} dashed fill="rgba(210,153,34,0.08)" style={{ fontSize: 24 }}>Polymarket</Chip>
            </div>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S06 — NGHỊCH LÝ: mock feed StockTwits + donut 63% + DCA 82K
// ---------------------------------------------------------------------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const aFeed = frameOf("s06", "tâm lý bán lẻ vẫn nóng");
  const aST = frameOf("s06", "Trên Sốc Tuít");
  const a30 = frameOf("s06", "ba mươi bài");
  const a63 = frameOf("s06", "sáu mươi ba phần trăm");
  const a82 = frameOf("s06", "tám mươi hai nghìn");
  const aData = frameOf("s06", "dữ kiện đối trọng");
  const feeds = [true, true, false, true, false]; // BULLISH-dominant mock, 63/37 spirit
  const donutP = interpolate(f - a63, [0, 36], [0, 1], clamp);
  const R = 118;
  const CIRC = 2 * Math.PI * R;
  const tickerX = -((f * 2.2) % 320);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* feed header */}
      <div style={{ position: "absolute", top: 336, left: SAFE.x, right: SAFE.x, display: "flex", alignItems: "center", gap: 16, opacity: lit(f, aST, 8) }}>
        <span style={{ color: C.text, fontSize: 40, fontWeight: 900, fontFamily: MONO }}>StockTwits</span>
        <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 28, fontFamily: MONO }}>$BTC.X</Chip>
        <span style={{ color: C.muted, fontSize: 26, fontWeight: 700, opacity: lit(f, a30, 8) }}>mẫu 30 bài gần nhất</span>
      </div>
      {/* mock feed cards — typography only, no real UI/logo */}
      <div style={{ position: "absolute", top: 428, left: SAFE.x, width: SAFE.w, display: "flex", gap: 14 }}>
        {feeds.map((bull, i) => {
          const at = aFeed + 6 + i * 5;
          return (
            <div key={i} style={{
              flex: 1, opacity: lit(f, at, 6), transform: `translateY(${interpolate(f - at, [0, 8], [20, 0], clamp)}px)`,
            }}>
              <Card style={{ padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 23, fontWeight: 900, letterSpacing: 1, color: bull ? C.green : C.red, border: `2px solid ${bull ? C.green : C.red}`, borderRadius: 8, padding: "5px 10px", background: bull ? C.greenFill : C.redFill }}>
                  {bull ? "BULLISH" : "BEARISH"}
                </span>
                <span style={{ width: "78%", height: 9, borderRadius: 5, background: "rgba(139,148,158,0.25)" }} />
                <span style={{ width: "56%", height: 9, borderRadius: 5, background: "rgba(139,148,158,0.16)" }} />
              </Card>
            </div>
          );
        })}
      </div>
      {/* donut 63% */}
      <div style={{ position: "absolute", top: 940, left: SAFE.x, width: SAFE.w, display: "flex", alignItems: "center", justifyContent: "center", gap: 40, opacity: lit(f, a63, 10) }}>
        <svg width={300} height={300} viewBox="0 0 300 300">
          <g transform="rotate(-90 150 150)">
            <circle cx={150} cy={150} r={R} fill="none" stroke="rgba(248,81,73,0.35)" strokeWidth={34} />
            <circle cx={150} cy={150} r={R} fill="none" stroke={C.green} strokeWidth={34} strokeLinecap="round"
              strokeDasharray={`${CIRC} ${CIRC}`} strokeDashoffset={CIRC * (1 - 0.63 * donutP)} />
          </g>
          <text x={150} y={142} textAnchor="middle" fill={C.green} fontSize={74} fontWeight={900} fontFamily={FONT}>{f >= a63 ? fmtVi(63 * donutP, 0) : ""}%</text>
          <text x={150} y={186} textAnchor="middle" fill={C.text} fontSize={32} fontWeight={900} fontFamily={FONT}>BULLISH</text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Chip color={C.green} fill={C.greenFill} style={{ fontSize: 27 }}>63% BULLISH</Chip>
          <Chip color={C.red} fill={C.redFill} style={{ fontSize: 27, opacity: 0.7 }}>37% BEARISH</Chip>
          <span style={{ color: C.muted, fontSize: 24, fontWeight: 700, fontFamily: MONO }}>mẫu 30 bài · StockTwits</span>
        </div>
      </div>
      {/* DCA ticker */}
      <div style={{
        position: "absolute", top: 1300, left: SAFE.x, width: SAFE.w, overflow: "hidden", opacity: lit(f, a82, 10),
        maskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 0, transform: `translateX(${tickerX}px)`, whiteSpace: "nowrap" }}>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} style={{ color: C.green, fontSize: 34, fontWeight: 900, fontFamily: MONO, marginRight: 60 }}>DCA quanh 82K ·&nbsp;</span>
          ))}
        </div>
      </div>
      {/* counterweight chip */}
      <div style={{
        position: "absolute", top: 1404, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aData, 10), transform: `translateY(${interpolate(f - aData, [0, 10], [20, 0], clamp)}px)`,
      }}>
        <Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 26, fontWeight: 900 }}>DỮ KIỆN ĐỐI TRỌNG — KHÔNG PHẢI LỜI PHÁN XÉT</Chip>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S07 — POLYMARKET: 26% vs 8% — đám đông cá cược chọn đi ngang
// ---------------------------------------------------------------------------
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aPoly = frameOf("s07", "Pô-li mác-két");
  const a100 = frameOf("s07", "một trăm nghìn đô");
  const a26 = frameOf("s07", "hai mươi sáu phần trăm");
  const a55 = frameOf("s07", "năm mươi lăm nghìn");
  const a8 = frameOf("s07", "tám phần trăm");
  const aNgang = frameOf("s07", "đi ngang");
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* title */}
      <div style={{ position: "absolute", top: 336, left: SAFE.x, right: SAFE.x, textAlign: "center", ...slam(aPoly, f, fps, 1.35) }}>
        <span style={{ color: C.text, fontSize: 56, fontWeight: 900, letterSpacing: 4 }}>POLYMARKET</span>
      </div>
      {/* card 1 — 100K trước 31/12 → 26% */}
      <div style={{
        position: "absolute", top: 470, left: SAFE.x, right: SAFE.x,
        opacity: lit(f, a100, 10), transform: `translateY(${interpolate(f - a100, [0, 12], [30, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "24px 34px", display: "flex", alignItems: "center", gap: 28, border: `2px solid ${C.amber}`, ...(f >= a26 ? glow("rgba(210,153,34,0.25)", 22) : {}) }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.textSoft, fontSize: 31, fontWeight: 800, lineHeight: 1.3 }}>BTC 100.000 USD<br />TRƯỚC 31/12</div>
            <div style={{ marginTop: 12, opacity: lit(f, a26 + 24, 8), transform: `translateY(${interpolate(f - a26 - 24, [0, 10], [16, 0], clamp)}px)` }}>
              <Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 25, fontFamily: MONO }}>-9pp/tuần</Chip>
            </div>
          </div>
          <div style={{ color: C.text, fontSize: 150, fontWeight: 900, lineHeight: 1, fontFamily: FONT }}>
            <CountUp at={a26} to={26} frames={40} /><span style={{ fontSize: 80 }}>%</span>
          </div>
        </Card>
      </div>
      {/* card 2 — dưới 55.000 → 8% */}
      <div style={{
        position: "absolute", top: 872, left: SAFE.x, right: SAFE.x,
        opacity: lit(f, a55, 10), transform: `translateY(${interpolate(f - a55, [0, 12], [30, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "24px 34px", display: "flex", alignItems: "center", gap: 28, border: `2px solid ${C.green}`, ...(f >= a8 ? glow("rgba(63,185,80,0.22)", 20) : {}) }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.textSoft, fontSize: 31, fontWeight: 800, lineHeight: 1.3 }}>KỊCH BẢN SỤP ĐỔ<br />DƯỚI 55.000 USD</div>
          </div>
          <div style={{ color: C.green, fontSize: 150, fontWeight: 900, lineHeight: 1, fontFamily: FONT }}>
            <CountUp at={a8} to={8} frames={34} /><span style={{ fontSize: 80 }}>%</span>
          </div>
        </Card>
      </div>
      {/* balance verdict */}
      <div style={{ position: "absolute", top: 1262, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", alignItems: "center", gap: 20, opacity: lit(f, aNgang, 12), transform: `translateY(${interpolate(f - aNgang, [0, 12], [24, 0], clamp)}px)` }}>
        <svg width={84} height={64} viewBox="0 0 84 64" style={{ transform: `rotate(${interpolate(f - aNgang, [0, 14], [-8, 0], clamp)}deg)` }}>
          <line x1={42} y1={8} x2={42} y2={24} stroke={C.text} strokeWidth={4} />
          <line x1={8} x2={76} y1={26} y2={26} stroke={C.text} strokeWidth={4} strokeLinecap="round" />
          <path d="M 42 26 L 12 26 L 8 52 L 16 52 Z" fill="none" stroke={C.amber} strokeWidth={3} />
          <path d="M 42 26 L 72 26 L 68 52 L 76 52 Z" fill="none" stroke={C.amber} strokeWidth={3} />
          <circle cx={42} cy={6} r={4} fill={C.text} />
        </svg>
        <span style={{ color: C.text, fontSize: 40, fontWeight: 900, letterSpacing: 1 }}>ĐÁM ĐÔNG CÁ CUỘC<br />CHỌN: ĐI NGANG</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S08 — VÙNG SINH TỬ 80.500–81.214 (hero #2, mood backdrop + TSX chart)
// ---------------------------------------------------------------------------
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aTitle = frameOf("s08", "Vậy mốc phán xử");
  const aFoot = frameOf("s08", "Ngay dưới chân giá");
  const a80 = frameOf("s08", "tám mươi nghìn năm trăm");
  const a81 = frameOf("s08", "tám mươi mốt nghìn hai trăm mười bốn");
  const a81end = frameOfEnd("s08", "tám mươi mốt nghìn hai trăm mười bốn");
  const aLB = frameOf("s08", "dải dao động dưới");
  const aSMA = frameOf("s08", "đường trung bình năm mươi ngày");
  const aDecide = frameOf("s08", "quyết định tất cả");
  const yOf = (p: number): number => 40 + ((83000 - p) / 3500) * 720;
  const zoom = interpolate(f, [aFoot + 20, SF("s08")], [1.0, 1.25], clamp);
  const zoneY0 = yOf(81214.06);
  const zoneY1 = yOf(80500);
  const pulse = 0.78 + 0.22 * Math.sin((f / 16) * Math.PI);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Img src={staticFile("btc-tradingagents-20261008/bg_s08.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.32 * lit(f, aFoot, 14) }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,17,23,0.86) 0%, rgba(13,17,23,0.6) 40%, rgba(13,17,23,0.92) 78%, #0D1117 100%)" }} />
      {/* the promised question, answered */}
      <div style={{ position: "absolute", top: 336, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aTitle, 12) }}>
        <span style={{ color: C.text, fontSize: 54, fontWeight: 900, letterSpacing: 1 }}>VẬY MỐC PHÁN XỬ Ở ĐÂU?</span>
      </div>
      {/* the chart — slow zoom into the convergence zone */}
      <div style={{ position: "absolute", top: 500, left: SAFE.x, width: SAFE.w, height: 800, opacity: lit(f, aFoot, 10), transform: `scale(${zoom})`, transformOrigin: "50% 62%" }}>
        <Card style={{ position: "absolute", inset: 0, background: "rgba(22,27,34,0.72)" }}>
          <svg width={SAFE.w} height={800} viewBox={`0 0 ${SAFE.w} 800`}>
            {/* death zone band 80.500–81.214 */}
            <rect x={30} y={zoneY0} width={SAFE.w - 60} height={zoneY1 - zoneY0} rx={10}
              fill={`url(#zoneGrad)`} opacity={lit(f, a80, 14)} />
            <defs>
              <linearGradient id="zoneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(210,153,34,0.4)" />
                <stop offset="100%" stopColor="rgba(248,81,73,0.4)" />
              </linearGradient>
            </defs>
            <rect x={30} y={zoneY0} width={SAFE.w - 60} height={zoneY1 - zoneY0} rx={10} fill="none" stroke={C.red} strokeWidth={2.5} opacity={0.55 * lit(f, a81, 12)} />
            {/* Bollinger LB 81.214,06 — amber, converging in */}
            <path d={`M 40 ${zoneY0 - 150} C 300 ${zoneY0 - 110}, 560 ${zoneY0 - 40}, 880 ${zoneY0}`}
              fill="none" stroke={C.amber} strokeWidth={5} strokeLinecap="round"
              strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aLB, 20)} opacity={0.95} />
            {/* 50 SMA 80.541,75 — green, rising to meet it */}
            <path d={`M 40 ${yOf(80541.75) + 130} C 300 ${yOf(80541.75) + 90}, 560 ${yOf(80541.75) + 30}, 880 ${yOf(80541.75)}`}
              fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round"
              strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aSMA, 20)} />
            {/* price line descending from above, closing dot 82.145 */}
            <path d={`M 40 ${yOf(82800)} C 260 ${yOf(82650)}, 480 ${yOf(82300)}, 660 ${yOf(82180)} S 830 ${yOf(82145.7)}, 880 ${yOf(82145.7)}`}
              fill="none" stroke={C.text} strokeWidth={5.5} strokeLinecap="round"
              strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aFoot + 8, 24)} />
            <circle cx={880} cy={yOf(82145.7)} r={11} fill={C.text} opacity={lit(f, aFoot + 26, 8)} />
          </svg>
          {/* zone edge labels */}
          <div style={{ position: "absolute", left: 46, top: zoneY1 - 20, opacity: lit(f, a80, 8) }}>
            <span style={{ background: "rgba(1,4,9,0.88)", border: `2px solid ${C.red}`, color: C.text, borderRadius: 8, padding: "5px 14px", fontSize: 27, fontWeight: 900, fontFamily: MONO }}>80.500</span>
          </div>
          <div style={{ position: "absolute", left: 46, top: zoneY0 - 22, opacity: lit(f, a81, 8) }}>
            <span style={{ background: "rgba(1,4,9,0.88)", border: `2px solid ${C.amber}`, color: C.text, borderRadius: 8, padding: "5px 14px", fontSize: 27, fontWeight: 900, fontFamily: MONO }}>81.214</span>
          </div>
          {/* line labels (right, staggered so they never collide) */}
          <div style={{ position: "absolute", left: 210, top: zoneY0 - 150 - 14, opacity: lit(f, aLB + 10, 8) }}>
            <Chip color={C.amber} fill="rgba(1,4,9,0.85)" style={{ fontSize: 25, fontFamily: MONO }}>Bollinger LB 81.214,06</Chip>
          </div>
          <div style={{ position: "absolute", left: 210, top: yOf(80541.75) + 130 + 10, opacity: lit(f, aSMA + 10, 8) }}>
            <Chip color={C.green} fill="rgba(1,4,9,0.85)" style={{ fontSize: 25, fontFamily: MONO }}>50 SMA 80.541,75</Chip>
          </div>
          <div style={{ position: "absolute", right: 60, top: yOf(82145.7) - 62, opacity: lit(f, aFoot + 28, 8) }}>
            <span style={{ background: "rgba(1,4,9,0.88)", color: C.text, borderRadius: 8, padding: "6px 14px", fontSize: 25, fontWeight: 800, fontFamily: MONO }}>82.145 · cách mốc sinh tử một bước</span>
          </div>
        </Card>
      </div>
      {/* VÙNG SINH TỬ — springs on 'mười bốn' */}
      <div style={{ position: "absolute", top: 1330, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <span style={{ ...slam(a81end, f, fps, 1.55), display: "inline-block", color: C.text, fontSize: 66, fontWeight: 900, letterSpacing: 5, border: `3.5px solid ${C.red}`, borderRadius: 14, padding: "8px 36px", background: "rgba(1,4,9,0.7)", ...(f >= a81end ? glow("rgba(248,81,73,0.5)", 28) : {}) }}>VÙNG SINH TỬ</span>
      </div>
      {/* pulse verdict */}
      <div style={{ position: "absolute", top: 1452, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aDecide, 10) }}>
        <span style={{ color: C.red, fontSize: 31, fontWeight: 900, letterSpacing: 0.5, opacity: pulse }}>NẾN PHẢN ỨNG TẠI ĐÂY QUYẾT ĐỊNH TẤT CẢ</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S09 — KỊCH BẢN NẾU-THÌ: cây 2 nhánh, điều kiện vô hiệu rõ ràng
// ---------------------------------------------------------------------------
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const aKich = frameOf("s09", "Kịch bản nói theo điều kiện");
  const aKeep = frameOf("s09", "Nếu giữ được vùng này");
  const a84 = frameOf("s09", "tám mươi bốn nghìn một trăm năm mươi lăm");
  const aClose = frameOf("s09", "Nếu đóng cửa ngày dứt khoát");
  const aUnder = frameOf("s09", "dưới tám mươi nghìn năm trăm");
  const a77 = frameOf("s09", "bảy mươi bảy đến bảy mươi tám nghìn");
  const aNo = frameOf("s09", "Không phán đoán");
  const condPulse = 0.7 + 0.3 * Math.sin((f / 14) * Math.PI);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* trunk — the death zone, reused from s08 */}
      <div style={{ position: "absolute", top: 400, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", opacity: lit(f, aKich, 10) }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, border: `2.5px solid ${C.red}`, background: "linear-gradient(90deg, rgba(210,153,34,0.2), rgba(248,81,73,0.2))", borderRadius: 14, padding: "14px 30px", ...(f >= aKich ? glow("rgba(248,81,73,0.25)", 20) : {}) }}>
          <span style={{ color: C.text, fontSize: 38, fontWeight: 900, fontFamily: MONO }}>VÙNG 80.500 – 81.214</span>
        </div>
      </div>
      {/* branch SVG connectors */}
      <svg width={SAFE.w} height={880} viewBox={`0 0 ${SAFE.w} 880`} style={{ position: "absolute", left: SAFE.x, top: 540 }}>
        <path d="M 460 20 C 460 120, 720 120, 720 210" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round"
          strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aKeep, 16)} />
        <path d="M 460 380 C 460 480, 200 480, 200 570" fill="none" stroke={C.red} strokeWidth={5} strokeLinecap="round"
          strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aClose, 16)} />
      </svg>
      {/* UP branch — GIỮ VỰNG */}
      <div style={{ position: "absolute", top: 742, left: 430, right: SAFE.x, opacity: lit(f, aKeep + 8, 10) }}>
        <Card style={{ padding: "18px 28px", border: `2.5px solid ${C.green}`, ...(f >= aKeep ? glow("rgba(63,185,80,0.25)", 20) : {}) }}>
          <div style={{ color: C.green, fontSize: 33, fontWeight: 900, letterSpacing: 1 }}>NẾU GIỮ VỰNG &amp; BẬT LÊN</div>
          <div style={{ marginTop: 12, opacity: lit(f, a84, 10), transform: `translateY(${interpolate(f - a84, [0, 10], [18, 0], clamp)}px)` }}>
            <div style={{ color: C.text, fontSize: 46, fontWeight: 900, fontFamily: MONO }}>84.155,64 – 84.379,66</div>
            <div style={{ marginTop: 10 }}>
              <Chip color={C.green} fill={C.greenFill} style={{ fontSize: 24, fontFamily: MONO }}>kháng cự · 10 EMA + VWMA</Chip>
            </div>
          </div>
        </Card>
      </div>
      {/* DOWN branch — THỦNG */}
      <div style={{ position: "absolute", top: 1108, left: SAFE.x, right: 430, opacity: lit(f, aClose + 8, 10) }}>
        <Card style={{ padding: "18px 28px", border: `2.5px solid ${C.red}`, ...(f >= aClose ? glow("rgba(248,81,73,0.25)", 20) : {}) }}>
          <div style={{ color: C.red, fontSize: 33, fontWeight: 900, letterSpacing: 1, opacity: f >= aUnder ? condPulse : 0.85 }}>
            NẾU ĐÓNG CỬA NGÀY &lt; 80.500
          </div>
          <div style={{ marginTop: 12, opacity: lit(f, a77, 10), transform: `translateY(${interpolate(f - a77, [0, 10], [18, 0], clamp)}px)` }}>
            <div style={{ color: C.text, fontSize: 46, fontWeight: 900, fontFamily: MONO }}>77.000 – 78.000</div>
            <div style={{ marginTop: 10 }}>
              <Chip color={C.red} fill={C.redFill} style={{ fontSize: 24, fontFamily: MONO }}>vùng nền · tháng 9</Chip>
            </div>
          </div>
        </Card>
      </div>
      {/* neutral verdict */}
      <div style={{
        position: "absolute", top: 1398, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aNo, 10), transform: `translateY(${interpolate(f - aNo, [0, 10], [20, 0], clamp)}px)`,
      }}>
        <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 31, fontWeight: 900, letterSpacing: 1, ...(f >= aNo ? glow("rgba(88,166,255,0.3)", 20) : {}) }}>
          KHÔNG PHÁN ĐOÁN — CHỈ THEO DÕI MỐC
        </Chip>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S10 — CTA + DISCLAIMER (banner holds to the last frame)
// ---------------------------------------------------------------------------
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aQ = 0;
  const aMua = frameOf("s10", "mua dần");
  const aCho = frameOf("s10", "chờ nến xác nhận");
  const aFollow = frameOf("s10", "Theo dõi kênh");
  const aBanner = frameOf("s10", "chỉ mang tính tham khảo");
  const aBannerEnd = frameOf("s10", "không phải lời khuyên đầu tư");
  const quiet = 1 - lit(f, SF("s10") - 18, 12);
  const invite = (0.6 + 0.4 * Math.sin((f / 10) * Math.PI)) * quiet;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #0D1117 0%, #161B22 100%)" }} />
      {/* binary poll */}
      <div style={{ position: "absolute", top: 520, left: SAFE.x, right: SAFE.x, textAlign: "center", ...slam(aQ, f, fps, 1.3) }}>
        <span style={{ color: C.text, fontSize: 84, fontWeight: 900, lineHeight: 1.12, letterSpacing: 1 }}>BẠN Ở PHE NÀO?</span>
      </div>
      <div style={{ position: "absolute", top: 680, left: SAFE.x, right: SAFE.x, display: "flex", gap: 24, justifyContent: "center", alignItems: "stretch" }}>
        <div style={{
          opacity: lit(f, aMua, 10), transform: `translateX(${interpolate(f - aMua, [0, 12], [-40, 0], clamp)}px)`,
          border: `3px solid ${C.green}`, boxShadow: `0 0 ${18 + 16 * invite}px rgba(63,185,80,${0.25 + 0.3 * invite})`,
          borderRadius: 18, padding: "22px 44px", background: C.greenFill,
        }}>
          <div style={{ color: C.green, fontSize: 52, fontWeight: 900 }}>MUA DẦN ✋</div>
          <div style={{ color: C.textSoft, fontSize: 26, fontWeight: 700, marginTop: 6 }}>phe tích lũy</div>
        </div>
        <div style={{
          opacity: lit(f, aCho, 10), transform: `translateX(${interpolate(f - aCho, [0, 12], [40, 0], clamp)}px)`,
          border: `3px solid ${C.blue}`, boxShadow: `0 0 ${18 + 16 * invite}px rgba(88,166,255,${0.25 + 0.3 * invite})`,
          borderRadius: 18, padding: "22px 44px", background: C.blueFill,
        }}>
          <div style={{ color: C.blue, fontSize: 52, fontWeight: 900 }}>CHỜ NẾN</div>
          <div style={{ color: C.textSoft, fontSize: 26, fontWeight: 700, marginTop: 6 }}>chờ xác nhận</div>
        </div>
      </div>
      {/* follow chip */}
      <div style={{
        position: "absolute", top: 920, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aFollow, 10), transform: `translateY(${interpolate(f - aFollow, [0, 10], [20, 0], clamp)}px)`,
      }}>
        <Chip color={C.green} fill={C.greenFill} style={{ fontSize: 29, fontWeight: 900, ...(f >= aFollow ? glow("rgba(63,185,80,0.3)", 18) : {}) }}>
          THEO DÕI KÊNH — MỐC SINH TỬ MỖI PHIÊN
        </Chip>
      </div>
      {/* disclaimer banner — syncs word-by-word, holds to the end */}
      <div style={{
        position: "absolute", top: 1130, left: SAFE.x + 40, right: SAFE.x + 40,
        opacity: lit(f, aBanner, 12), transform: `translateY(${interpolate(f - aBanner, [0, 12], [28, 0], clamp)}px)`,
      }}>
        <div style={{
          border: `${f >= aBannerEnd ? 5 : 3}px solid ${C.amber}`, borderRadius: 18, padding: "26px 30px", textAlign: "center",
          background: "rgba(1,4,9,0.75)", ...(f >= aBannerEnd ? glow("rgba(210,153,34,0.4)", 26) : {}),
        }}>
          <div style={{ color: C.amber, fontSize: 40, fontWeight: 900, letterSpacing: 1, lineHeight: 1.3 }}>PHÂN TÍCH THAM KHẢO</div>
          <div style={{ color: C.text, fontSize: 40, fontWeight: 900, letterSpacing: 1, marginTop: 6, opacity: lit(f, aBannerEnd, 10) }}>KHÔNG PHẢI LỜI KHUYÊN ĐẦU TƯ</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Captions — canonical script text cues, burned at the bottom safe band
// ---------------------------------------------------------------------------
interface Cue { start: number; end: number; text: string }
const CUES = captionsJson as unknown as Cue[];

const Captions: React.FC = () => (
  <>
    {CUES.map((c, i) => {
      const from = Math.round(c.start * 30);
      const dur = Math.max(9, Math.round((c.end - c.start) * 30));
      return (
        <Sequence key={i} from={from} durationInFrames={dur} name={`cap-${i + 1}`}>
          <CaptionCue text={c.text} />
        </Sequence>
      );
    })}
  </>
);

const CaptionCue: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [0, 4, 100000], [0, 1, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1556, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{
        background: "rgba(1,4,9,0.84)", border: "1px solid rgba(240,246,252,0.16)", borderRadius: 18,
        padding: "16px 30px", color: C.text, fontSize: 42, fontWeight: 600, textAlign: "center",
        lineHeight: 1.3, maxWidth: 940, fontFamily: FONT,
      }}>{text}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root composition
// ---------------------------------------------------------------------------
const SCENES: Record<SceneId, React.FC> = {
  s01: S01, s02: S02, s03: S03, s04: S04, s05: S05, s06: S06, s07: S07,
  s08: S08, s09: S09, s10: S10,
};

const BGM_VOLUME = 0.12;   // peak — Hermes mixes -14 LUFS after render
const BGM_FADE_IN = 30;    // 1s
const BGM_FADE_OUT = 90;   // 3s

export const BtcTradingAgents20261008: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: FONT }}>
    {SCENE_TIMING.map((t, i) => {
      const Scene = SCENES[t.scene_id];
      const frames = i === SCENE_TIMING.length - 1 ? TOTAL_FRAMES - t.start_frame : t.scene_frames;
      return (
        <Sequence key={t.scene_id} from={t.start_frame} durationInFrames={frames} name={t.scene_id}>
          <Scene />
        </Sequence>
      );
    })}
    <Captions />
    <Audio src={staticFile("btc-tradingagents-20261008/narration_full.wav")} volume={1} />
    <Audio
      src={staticFile("btc-tradingagents-20261008/bgm.mp3")}
      volume={(fr) =>
        BGM_VOLUME *
        Math.min(1, fr / BGM_FADE_IN) *
        Math.min(1, Math.max(0, (TOTAL_FRAMES - fr) / BGM_FADE_OUT))
      }
    />
  </AbsoluteFill>
);
