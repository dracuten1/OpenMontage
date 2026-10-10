// eth-tradingagents-20261009 — "Ether Gãy Trước Bitcoin — Vùng Sinh Tử 2.400
// Sắp Phán Xử" (atelier composition, VERTICAL 1080x1920 @30fps).
// One <Sequence> per scene from MEASURED scene_timing.json (118.452s + 1s tail).
// Every reveal / count-up / draw is speech-locked (frameOf) to SPOKEN word
// times in public/eth-tradingagents-20261009/words.json (59/59 anchors audited,
// greedy-join). All on-screen numbers ⊆ digest whitelist, vi-VN display
// (2.471,91 USD). Only 2 gen mood backdrops (s01/s07, opacity ≤0.32 + black
// overlay) — every chart/stat/typography is pure TSX/SVG (focal-visual rule).
// Local-SVG yOf maps stay inside their viewBox — never offset by page (d-010).
import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring,
} from "remotion";
import { C, FONT, MONO, SAFE, SPRING, fmtVi } from "./theme";
import { SCENE_TIMING, TOTAL_FRAMES, frameOf, frameOfEnd, getSceneTiming, type SceneId } from "./timing";
import captionsJson from "../../public/eth-tradingagents-20261009/captions.json";

export const ETH09_20261009_TOTAL_FRAMES = TOTAL_FRAMES; // 3584
const SF = (id: SceneId): number => getSceneTiming(id).scene_frames;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const lit = (f: number, at: number, k = 8): number => interpolate(f - at, [0, k], [0, 1], clamp);

// ---------------------------------------------------------------------------
// Shared primitives (mechanics codex — btc08 house style)
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
// S01 — HOOK: cùng gió ngược, BTC −2,7%/TUẦN vs ETH −7,6%/TUẦN (mood #1)
// ---------------------------------------------------------------------------
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aBtc = frameOf("s01", "hai phẩy bảy phần trăm");
  const aEth = frameOf("s01", "bảy phẩy sáu phần trăm");
  const aPhe = frameOf("s01", "Thị trường đang chọn phe");
  const aThua = frameOf("s01", "phe Ether đang thua");
  const aGia = frameOf("s01", "hai nghìn bốn trăm chín mươi hai");
  const aQ = frameOf("s01", "Vừa có gì gãy dưới chân giá");
  const bgDrift = interpolate(f, [0, SF("s01")], [1.0, 1.03], clamp);
  // bars: honest ratio 2.7 : 7.6 ≈ 1 : 2.8
  const BTC_W = 175;
  const ETH_W = 505;
  const growBtc = spring({ frame: f - aBtc, fps, config: SPRING });
  const growEth = spring({ frame: f - aEth, fps, config: SPRING });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Img src={staticFile("eth-tradingagents-20261009/bg_s01.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.32, transform: `scale(${bgDrift})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,17,23,0.80) 0%, rgba(13,17,23,0.62) 38%, rgba(13,17,23,0.90) 72%, #0D1117 100%)" }} />
      {/* BTC counter bar — short, green */}
      <div style={{ position: "absolute", top: 520, left: SAFE.x, right: SAFE.x }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: lit(f, aBtc - 4, 6) }}>
          <span style={{ color: C.text, fontSize: 44, fontWeight: 900, fontFamily: MONO, width: 110 }}>BTC</span>
          <div style={{ width: SAFE.w - 150, height: 92, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}>
            <div style={{
              width: BTC_W, height: "100%", borderRadius: 13, transformOrigin: "left center",
              transform: `scaleX(${Math.max(0.001, growBtc)})`, background: "linear-gradient(90deg, rgba(63,185,80,0.35), #3FB950)",
              boxShadow: `0 0 ${26 * Math.min(1, growBtc)}px rgba(63,185,80,0.35)`,
            }} />
          </div>
          <span style={{ color: C.green, fontSize: 46, fontWeight: 900, fontFamily: MONO, whiteSpace: "nowrap", opacity: lit(f, aBtc + 8, 8) }}>−2,7%<span style={{ fontSize: 26, color: C.muted }}>/TUẦN</span></span>
        </div>
      </div>
      {/* ETH counter bar — the contradiction, ~2.8x longer, red */}
      <div style={{ position: "absolute", top: 700, left: SAFE.x, right: SAFE.x }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: lit(f, aEth - 4, 6) }}>
          <span style={{ color: C.text, fontSize: 44, fontWeight: 900, fontFamily: MONO, width: 110 }}>ETH</span>
          <div style={{ width: SAFE.w - 150, height: 92, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}>
            <div style={{
              width: ETH_W, height: "100%", borderRadius: 13, transformOrigin: "left center",
              transform: `scaleX(${Math.max(0.001, growEth)})`, background: "linear-gradient(90deg, rgba(248,81,73,0.35), #F85149)",
              boxShadow: `0 0 ${40 * Math.min(1, growEth)}px rgba(248,81,73,0.45)`,
            }} />
          </div>
          <span style={{ color: C.red, fontSize: 46, fontWeight: 900, fontFamily: MONO, whiteSpace: "nowrap", opacity: lit(f, aEth + 8, 8) }}>−7,6%<span style={{ fontSize: 26, color: C.muted }}>/TUẦN</span></span>
        </div>
        <div style={{ color: C.muted, fontSize: 27, fontWeight: 700, marginTop: 12, marginLeft: 130, opacity: lit(f, aEth + 14, 10) }}>cùng cơn gió vĩ mô — gãy gần gấp ba</div>
      </div>
      {/* verdict chip — market is choosing sides */}
      <div style={{
        position: "absolute", top: 1006, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aPhe, 10), transform: `translateX(${interpolate(f - aPhe, [0, 12], [-70, 0], clamp)}px)`,
      }}>
        <Chip color={C.amber} fill="rgba(210,153,34,0.10)" style={{ fontSize: 30, fontWeight: 800, ...(f >= aThua ? glow("rgba(210,153,34,0.3)", 20) : {}) }}>
          THỊ TRƯỜNG ĐANG CHỌN PHE — PHE ETHER ĐANG THUA
        </Chip>
      </div>
      {/* realtime price stat */}
      <div style={{
        position: "absolute", top: 1146, left: SAFE.x + 90, right: SAFE.x + 90,
        opacity: lit(f, aGia, 10), transform: `translateY(${interpolate(f - aGia, [0, 12], [36, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "20px 34px", border: `2px solid ${C.blue}`, display: "flex", alignItems: "center", gap: 26, ...(f >= aGia ? glow("rgba(88,166,255,0.22)", 20) : {}) }}>
          <div style={{ color: C.blue, fontSize: 84, fontWeight: 900, lineHeight: 1, fontFamily: FONT }}>
            <CountUp at={aGia} to={2492.62} frames={38} decimals={2} /><span style={{ fontSize: 38 }}> USD</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            <div style={{ color: C.text, fontSize: 32, fontWeight: 800, fontFamily: MONO }}>ETH · 09/10</div>
            <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 23 }}>giá realtime Binance</Chip>
          </div>
        </Card>
      </div>
      {/* the open question — answered at s02, closed at s07 */}
      <div style={{ position: "absolute", top: 1430, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aQ, 12), transform: `translateY(${interpolate(f - aQ, [0, 12], [24, 0], clamp)}px)` }}>
        <span style={{ color: C.text, fontSize: 56, fontWeight: 900, lineHeight: 1.15, letterSpacing: 0.5 }}>VÀ VỪA CÓ GÌ GÃY<br />DƯỚI CHÂN GIÁ?</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S02 — SỰ KIỆN: nến 08/10 xuyên xuống 50 SMA 2.551,00 (real-data chart)
// ---------------------------------------------------------------------------
// viewBox-local scale: price 2590..2380 -> y 0..640 (inside the Card svg only)
const S02_yOf = (p: number): number => ((2590 - p) / 210) * 640;

const S02: React.FC = () => {
  const f = useCurrentFrame();
  const aBreak = frameOf("s02", "Ether mất đường trung bình năm mươi ngày");
  const aLanDau = frameOf("s02", "lần đầu kể từ tháng sáu");
  const aClose = frameOf("s02", "Đóng cửa hai nghìn bốn trăm bảy mươi mốt");
  const aRau = frameOf("s02", "râu nến dưới chạm tận hai tư không sáu");
  const aKhang = frameOf("s02", "trở thành kháng cự phía trên");
  const smaY = S02_yOf(2551.00);
  const closeY = S02_yOf(2471.91);
  const lowY = S02_yOf(2406.15);
  const candleOp = lit(f, aBreak + 4, 8);
  const wickDrop = interpolate(f - aRau, [0, 12], [closeY, lowY], clamp);
  const flash = f >= aRau && f < aRau + 26 ? 1 - (f - aRau) / 26 : 0;
  const khangP = lit(f, aKhang, 12); // SMA blue -> red crossfade
  const firstFlash = f >= aLanDau && f < aLanDau + 24 ? 1 - (f - aLanDau) / 24 : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* header */}
      <div style={{ position: "absolute", top: 388, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aBreak - 6, 8) }}>
        <span style={{ color: C.text, fontSize: 37, fontWeight: 900, fontFamily: MONO, letterSpacing: 0.5 }}>
          PHIÊN 08/10 — MẤT 50 SMA{" "}
          <span style={{ color: firstFlash > 0 ? C.red : C.text, textShadow: firstFlash > 0 ? `0 0 ${26 * firstFlash}px rgba(248,81,73,0.9)` : "none" }}>LẦN ĐẦU</span>{" "}
          TỪ THÁNG 6
        </span>
      </div>
      {/* chart */}
      <Card style={{ position: "absolute", top: 470, left: SAFE.x, width: SAFE.w, height: 640 }}>
        <svg width={SAFE.w} height={640} viewBox={`0 0 ${SAFE.w} 640`}>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={0} x2={SAFE.w} y1={80 + i * 160} y2={80 + i * 160} stroke="rgba(240,246,252,0.05)" strokeWidth={1} />
          ))}
          {/* 50 SMA 2.551 — blue first, crossfades to red as it becomes resistance */}
          <g opacity={lit(f, aBreak + 10, 8)}>
            <line x1={30} x2={SAFE.w - 30} y1={smaY} y2={smaY} stroke={C.blue} strokeWidth={3.5} opacity={0.85 * (1 - khangP)} />
            <line x1={30} x2={SAFE.w - 30} y1={smaY} y2={smaY} stroke={C.red} strokeWidth={3.5} strokeDasharray="16 10" opacity={0.9 * khangP} />
            {flash > 0 && <line x1={30} x2={SAFE.w - 30} y1={smaY} y2={smaY} stroke={C.red} strokeWidth={8} opacity={0.7 * flash} />}
          </g>
          {/* the 08/10 candle — body top AT the SMA line (no inferred OHLC), close 2.471,91 */}
          <g opacity={candleOp}>
            <line x1={640} x2={640} y1={smaY} y2={wickDrop} stroke={C.red} strokeWidth={4} />
            <rect x={575} y={smaY} width={130} height={Math.max(6, closeY - smaY)} rx={6} fill="#F85149" fillOpacity={0.9} stroke="#F85149" strokeWidth={2} />
            {flash > 0 && <circle cx={640} cy={wickDrop} r={16 + 14 * flash} fill="none" stroke={C.red} strokeWidth={4} opacity={0.8 * flash} />}
          </g>
          {/* price path silhouette above (pure mood, no data numbers) */}
          <path d={`M 60 ${smaY - 30} C 200 ${smaY - 90}, 360 ${smaY - 20}, 500 ${smaY - 46}`}
            fill="none" stroke="rgba(230,237,243,0.28)" strokeWidth={4} strokeLinecap="round"
            strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aBreak, 16)} />
        </svg>
        {/* SMA label -> resistance label at the end */}
        <div style={{ position: "absolute", left: 30, top: smaY - 46, opacity: lit(f, aBreak + 10, 8) }}>
          <span style={{ background: "rgba(1,4,9,0.88)", border: `1.5px solid ${C.blue}`, color: C.blue, borderRadius: 8, padding: "5px 12px", fontSize: 25, fontWeight: 800, fontFamily: MONO }}>50 SMA 2.551,00</span>
        </div>
        <div style={{ position: "absolute", right: 40, top: smaY + 14, opacity: khangP, transform: `translateY(${interpolate(f - aKhang, [0, 12], [16, 0], clamp)}px)` }}>
          <Chip color={C.amber} fill="rgba(1,4,9,0.85)" style={{ fontSize: 26, fontFamily: MONO, ...(f >= aKhang ? glow("rgba(210,153,34,0.3)", 18) : {}) }}>2.551,00 → KHÁNG CỰ MỚI</Chip>
        </div>
        {/* wick low label inside chart */}
        <div style={{ position: "absolute", left: 660, top: wickDrop - 18, opacity: lit(f, aRau + 10, 8) }}>
          <span style={{ background: "rgba(1,4,9,0.88)", border: `1.5px solid ${C.red}`, color: C.red, borderRadius: 8, padding: "4px 12px", fontSize: 24, fontWeight: 800, fontFamily: MONO }}>râu nến 2.406,15</span>
        </div>
      </Card>
      {/* stat card — close 2.471,91 */}
      <div style={{
        position: "absolute", top: 1162, left: SAFE.x, right: SAFE.x,
        opacity: lit(f, aClose, 10), transform: `translateY(${interpolate(f - aClose, [0, 12], [40, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "22px 32px", display: "flex", alignItems: "center", gap: 26, border: `2px solid ${C.red}`, ...(f >= aClose ? glow("rgba(248,81,73,0.25)", 22) : {}) }}>
          <div style={{ color: C.red, fontSize: 84, fontWeight: 900, lineHeight: 1, fontFamily: FONT }}>
            <CountUp at={aClose} to={2471.91} frames={40} decimals={2} /><span style={{ fontSize: 38 }}> USD</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div style={{ color: C.text, fontSize: 31, fontWeight: 800 }}>ĐÓNG CỬA 08/10</div>
            <div style={{ opacity: lit(f, aRau, 8) }}>
              <Chip color={C.red} fill={C.redFill} style={{ fontSize: 24 }}>râu nến 2.406,15</Chip>
            </div>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S03 — MYTH-BUSTER: stamp CHƯA ĐÂU + thang giá 3 nút + ATR
// ---------------------------------------------------------------------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aQ = frameOf("s03", "đảo chiều?");
  const aChua = frameOf("s03", "Chưa đâu");
  const aDinh = frameOf("s03", "đỉnh hai nghìn tám trăm đô");
  const aPct = frameOf("s03", "mười một phẩy tám phần trăm");
  const aAtr = frameOf("s03", "ba lần biên độ dao động ngày");
  const a200 = frameOf("s03", "đường hai trăm ngày nằm sâu bên dưới");
  const aChot = frameOf("s03", "xu hướng dài hạn chưa gãy");
  const nodes = [
    { label: "ĐỈNH", sub: "2.805,50 · 21/09", y: 500, at: aDinh, color: C.text },
    { label: "GIÁ", sub: "2.471,91", y: 720, at: aPct, color: C.red },
    { label: "200 SMA", sub: "2.128,63", y: 960, at: a200, color: C.green },
  ];
  const pctDraw = interpolate(f - aPct, [0, 12], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* myth question, dim */}
      <div style={{ position: "absolute", top: 322, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: 0.5 * lit(f, aQ, 10) }}>
        <span style={{ color: C.textSoft, fontSize: 38, fontWeight: 800 }}>MẤT 50 NGÀY = ĐẢO CHIỀU?</span>
      </div>
      {/* stamp CHƯA ĐÂU */}
      <div style={{ position: "absolute", top: 368, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center" }}>
        <span style={{ ...slam(aChua, f, fps, 1.6), display: "inline-block", border: `4px solid ${C.text}`, color: C.text, borderRadius: 16, padding: "6px 44px", fontSize: 62, fontWeight: 900, letterSpacing: 6, background: "rgba(1,4,9,0.6)", ...(f >= aChua ? glow("rgba(230,237,243,0.3)", 22) : {}) }}>CHƯA ĐÂU</span>
      </div>
      {/* price ladder */}
      <svg width={SAFE.w} height={600} viewBox={`0 0 ${SAFE.w} 600`} style={{ position: "absolute", left: SAFE.x, top: 480 }}>
        <line x1={60} x2={60} y1={50} y2={560} stroke={C.border} strokeWidth={6} strokeLinecap="round" />
        <line x1={60} x2={60} y1={50 + 30} y2={50 + 30 + 160 * pctDraw} stroke={C.red} strokeWidth={6} strokeLinecap="round" opacity={0.9} />
        <line x1={60} x2={60} y1={470} y2={470 + 70 * lit(f, a200, 12)} stroke={C.green} strokeWidth={6} strokeLinecap="round" opacity={0.85} />
      </svg>
      {nodes.map((n) => {
        const on = f >= n.at;
        return (
          <div key={n.label} style={{
            position: "absolute", top: n.y, left: 190, right: SAFE.x,
            opacity: lit(f, n.at, 10), transform: `translateX(${interpolate(f - n.at, [0, 10], [36, 0], clamp)}px)`,
          }}>
            <Card style={{ padding: "16px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `2px solid ${on ? n.color : C.border}`, ...(on && n.label === "200 SMA" ? glow("rgba(63,185,80,0.2)", 16) : {}) }}>
              <span style={{ color: C.textSoft, fontSize: 38, fontWeight: 900, fontFamily: MONO }}>{n.label}</span>
              <span style={{ color: n.color, fontSize: 46, fontWeight: 900, fontFamily: FONT }}>{n.sub}</span>
            </Card>
          </div>
        );
      })}
      {/* −11,8% drop connector label between ĐỈNH and GIÁ */}
      <div style={{ position: "absolute", top: 585, left: 100, opacity: lit(f, aPct + 6, 8) }}>
        <span style={{ background: "rgba(1,4,9,0.85)", border: `2px solid ${C.red}`, color: C.red, borderRadius: 10, padding: "5px 16px", fontSize: 34, fontWeight: 900, fontFamily: MONO }}>−11,8%</span>
      </div>
      {/* ATR card */}
      <div style={{
        position: "absolute", top: 1162, left: SAFE.x, right: SAFE.x,
        opacity: lit(f, aAtr, 10), transform: `translateY(${interpolate(f - aAtr, [0, 12], [30, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "20px 30px", border: `2px solid ${C.blue}`, display: "flex", alignItems: "center", gap: 24, ...(f >= aAtr ? glow("rgba(88,166,255,0.22)", 20) : {}) }}>
          <div style={{ color: C.blue, fontSize: 70, fontWeight: 900, lineHeight: 1, fontFamily: FONT }}>
            ATR <CountUp at={aAtr} to={90.69} frames={34} decimals={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.text, fontSize: 29, fontWeight: 800 }}>~3× ATR — GIẢM VẪN TRONG BIÊN ĐỘ</div>
            <div style={{ marginTop: 8, opacity: lit(f, aAtr + 10, 8) }}>
              <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 24 }}>ba lần biên độ dao động ngày</Chip>
            </div>
          </div>
        </Card>
      </div>
      {/* verdict */}
      <div style={{ position: "absolute", top: 1408, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aChot, 10) }}>
        <span style={{ color: C.green, fontSize: 50, fontWeight: 900, letterSpacing: 2, ...(f >= aChot ? { textShadow: "0 0 36px rgba(63,185,80,0.45)" } : {}) }}>XU HƯỚNG DÀI HẠN CHƯA GÃY</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S04 — ĐỘNG LƯỢNG: gauge RSI 37,41 (từ 59,72) + MACD −30,77
// ---------------------------------------------------------------------------
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const aRsi = frameOf("s04", "RSI rơi về ba mươi bảy");
  const aThap = frameOf("s04", "mức thấp nhất hơn một tháng");
  const aTu = frameOf("s04", "từ gần sáu mươi");
  const aMacd = frameOf("s04", "MACD âm sâu");
  const aNhiet = frameOf("s04", "bắt đầu hạ nhiệt");
  const rsiVal = interpolate(f - aRsi, [0, 30], [59.72, 37.41], clamp);
  const needle = (v: number): [number, number] => {
    const rad = Math.PI * (1 - v / 100);
    return [230 + 96 * Math.cos(rad), 210 - 96 * Math.sin(rad)];
  };
  const [nx, ny] = needle(rsiVal);
  const [px59] = needle(59.72);
  const [, py59] = needle(59.72);
  const macdDim = 1 - 0.5 * lit(f, aNhiet, 14);
  const macdGrow = interpolate(f - aMacd, [0, 16], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* RSI gauge — no axis thresholds (none in digest) */}
      <div style={{ position: "absolute", top: 450, left: SAFE.x, width: 460, opacity: lit(f, aRsi, 10) }}>
        <svg width={460} height={230} viewBox="0 0 460 230">
          <path d="M 80 210 A 150 150 0 0 1 380 210" fill="none" stroke={C.border} strokeWidth={14} strokeLinecap="round" />
          <path d="M 80 210 A 150 150 0 0 1 380 210" fill="none" stroke={C.amber} strokeWidth={14} strokeLinecap="round"
            strokeDasharray="100" pathLength={100} strokeDashoffset={100 - rsiVal} opacity={0.9} />
          <line x1={230} y1={60} x2={230} y2={78} stroke={C.muted} strokeWidth={3} opacity={0.6} />
          <line x1={230} y1={210} x2={nx} y2={ny} stroke={C.text} strokeWidth={5} strokeLinecap="round" />
          <circle cx={230} cy={210} r={10} fill={C.text} />
          {/* 59,72 origin tick — where the needle fell FROM */}
          <g opacity={lit(f, aTu, 8)}>
            <circle cx={px59} cy={py59} r={7} fill="none" stroke={C.blue} strokeWidth={3} />
            <text x={px59 - 4} y={py59 - 16} fill={C.blue} fontSize={24} fontWeight={800} fontFamily={MONO}>59,72</text>
          </g>
        </svg>
      </div>
      {/* RSI number */}
      <div style={{ position: "absolute", top: 470, left: 540, right: SAFE.x }}>
        <div style={{ color: C.amber, fontSize: 76, fontWeight: 900, lineHeight: 1, fontFamily: FONT, opacity: lit(f, aRsi, 8) }}>
          RSI {f >= aRsi ? fmtVi(rsiVal, 2) : ""}
        </div>
        <div style={{ marginTop: 14, opacity: lit(f, aThap, 8), transform: `translateY(${interpolate(f - aThap, [0, 10], [14, 0], clamp)}px)` }}>
          <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 23, fontFamily: MONO }}>từ 59,72 · 06/10 · thấp nhất &gt;1 tháng</Chip>
        </div>
      </div>
      {/* MACD histogram bar — grows DOWN, dims by half at 'hạ nhiệt' */}
      <div style={{ position: "absolute", top: 1010, left: SAFE.x, right: SAFE.x, opacity: macdDim }}>
        <svg width={SAFE.w} height={250} viewBox={`0 0 ${SAFE.w} 250`}>
          <line x1={30} x2={SAFE.w - 30} y1={20} y2={20} stroke={C.border} strokeWidth={3} />
          <rect x={330} y={20} width={260} height={200 * macdGrow} rx={8} fill="url(#macdGrad)" stroke={C.red} strokeWidth={2.5} opacity={0.92} />
          <defs>
            <linearGradient id="macdGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(248,81,73,0.25)" />
              <stop offset="100%" stopColor="#F85149" />
            </linearGradient>
          </defs>
          {f >= aMacd ? <text x={460} y={244 - (1 - macdGrow) * 40} textAnchor="middle" fill={C.red} fontSize={30} fontWeight={900} fontFamily={MONO} opacity={lit(f, aMacd + 12, 8)}>MACD HISTOGRAM −30,77 · CẮT XUỐNG</text> : null}
        </svg>
      </div>
      {/* cooldown verdict */}
      <div style={{ position: "absolute", top: 1330, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aNhiet, 10) }}>
        <span style={{ color: C.text, fontSize: 44, fontWeight: 900, letterSpacing: 1 }}>PHE BÁN VẪN GIỮ NHỊP — BẮT ĐẦU HẠ NHIỆT</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S05 — DÒNG TIỀN: 2 cột khối lượng vượt vạch 20 TỶ + stamp BÁN THẬT
// ---------------------------------------------------------------------------
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aStamp = frameOf("s05", "Bán thật");
  const aFrame = frameOf("s05", "hai phiên liên tiếp");
  const aC1 = frameOf("s05", "hai mươi phẩy không tám tỷ");
  const aC2 = frameOf("s05", "gần hai mươi lăm tỷ");
  const aChip = frameOf("s05", "cao nhất kể từ hai mươi mốt tháng chín");
  const aQ = frameOf("s05", "ai vẫn đang đứng ra gánh");
  // honest heights: 20.08 and 24.9 on a 0..25 scale
  const H = 470;
  const h1 = (20.08 / 25) * H;
  const h2 = (24.9 / 25) * H;
  const thrY = H - (20 / 25) * H; // threshold from bar base (in svg-local coords)
  const g1 = spring({ frame: f - aC1, fps, config: SPRING });
  const g2 = spring({ frame: f - aC2, fps, config: SPRING });
  const dimBars = 1 - 0.45 * lit(f, aQ, 12);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* question + stamp */}
      <div style={{ position: "absolute", top: 366, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: 0.6 * lit(f, aStamp - 8, 10) }}>
        <span style={{ color: C.textSoft, fontSize: 36, fontWeight: 800 }}>BÁN THẬT HAY THANH KHOẢN MỎNG?</span>
      </div>
      <div style={{ position: "absolute", top: 408, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center" }}>
        <span style={{ ...slam(aStamp, f, fps, 1.5), display: "inline-block", border: `4px solid ${C.red}`, color: C.red, borderRadius: 14, padding: "6px 40px", fontSize: 60, fontWeight: 900, letterSpacing: 6, background: "rgba(1,4,9,0.65)", ...(f >= aStamp ? glow("rgba(248,81,73,0.4)", 24) : {}) }}>BÁN THẬT</span>
      </div>
      {/* volume chart */}
      <div style={{ position: "absolute", top: 540, left: SAFE.x, width: SAFE.w, height: 560, opacity: dimBars }}>
        <svg width={SAFE.w} height={560} viewBox={`0 0 ${SAFE.w} 560`}>
          {/* baseline + threshold appear with the frame */}
          <line x1={20} x2={SAFE.w - 20} y1={530} y2={530} stroke={C.border} strokeWidth={3} opacity={lit(f, aFrame, 8)} />
          <g opacity={lit(f, aFrame + 6, 8)}>
            <line x1={20} x2={SAFE.w - 20} y1={530 - thrY} y2={530 - thrY} stroke={C.red} strokeWidth={4} strokeDasharray="14 10" />
            <text x={SAFE.w - 28} y={530 - thrY - 14} textAnchor="end" fill={C.red} fontSize={27} fontWeight={800} fontFamily={MONO}>20 TỶ USD</text>
          </g>
          {/* col 1 — 20,08 · 08/10 (spoken first) */}
          <g opacity={lit(f, aC1, 6)}>
            <rect x={150} y={530 - h1 * Math.max(0.001, g1)} width={250} height={h1 * Math.max(0.001, g1)} rx={10} fill="url(#volGrad)" stroke={C.red} strokeWidth={2.5} />
            <text x={275} y={530 - h1 * Math.max(0.001, g1) - 52} textAnchor="middle" fill={C.text} fontSize={38} fontWeight={900} fontFamily={FONT} opacity={lit(f, aC1 + 8, 8)}>20,08</text>
            <text x={275} y={530 - h1 * Math.max(0.001, g1) - 18} textAnchor="middle" fill={C.muted} fontSize={25} fontWeight={700} fontFamily={MONO} opacity={lit(f, aC1 + 8, 8)}>TỶ USD · 08/10</text>
          </g>
          {/* col 2 — 24,9 · 07/10, taller */}
          <g opacity={lit(f, aC2, 6)}>
            <rect x={520} y={530 - h2 * Math.max(0.001, g2)} width={250} height={h2 * Math.max(0.001, g2)} rx={10} fill="url(#volGrad)" stroke={C.red} strokeWidth={2.5} />
            <text x={645} y={530 - h2 * Math.max(0.001, g2) - 52} textAnchor="middle" fill={C.text} fontSize={38} fontWeight={900} fontFamily={FONT} opacity={lit(f, aC2 + 8, 8)}>24,9</text>
            <text x={645} y={530 - h2 * Math.max(0.001, g2) - 18} textAnchor="middle" fill={C.muted} fontSize={25} fontWeight={700} fontFamily={MONO} opacity={lit(f, aC2 + 8, 8)}>TỶ USD · 07/10</text>
          </g>
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(248,81,73,0.2)" />
              <stop offset="100%" stopColor="rgba(248,81,73,0.85)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {/* peak chip */}
      <div style={{
        position: "absolute", top: 1186, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aChip, 10), transform: `translateY(${interpolate(f - aChip, [0, 12], [20, 0], clamp)}px)`,
      }}>
        <Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 27, fontWeight: 900, ...(f >= aChip ? glow("rgba(210,153,34,0.3)", 20) : {}) }}>
          2 PHIÊN &gt;20 TỶ USD · CAO NHẤT KỂ TỪ 21/09
        </Chip>
      </div>
      {/* handoff question */}
      <div style={{ position: "absolute", top: 1396, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aQ, 12), transform: `translateY(${interpolate(f - aQ, [0, 12], [22, 0], clamp)}px)` }}>
        <span style={{ color: C.text, fontSize: 50, fontWeight: 900 }}>VẬY AI VẪN ĐANG ĐỨNG RA GÁNH?</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S06 — SO SÁNH: ticker BTC (giữ + bật) vs ETH (yếu) + cặp dốc 7 ngày
// ---------------------------------------------------------------------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const aBtc = frameOf("s06", "Bitcoin trụ được không? Trụ được");
  const a805 = frameOf("s06", "giữ vùng sinh tử tám mươi nghìn năm trăm");
  const a83 = frameOf("s06", "tám mươi ba nghìn lẻ năm mươi đô");
  const aEth = frameOf("s06", "hai nghìn bốn trăm chín mươi hai đô");
  const aBeta = frameOf("s06", "Độ nhạy cao hơn");
  const aGay = frameOf("s06", "gãy trước, bật sau");
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* BTC ticker — bright */}
      <div style={{
        position: "absolute", top: 430, left: SAFE.x, right: SAFE.x,
        opacity: lit(f, aBtc, 10), transform: `translateX(${interpolate(f - aBtc, [0, 12], [-50, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "20px 30px", border: `2px solid ${C.green}`, ...(f >= a805 ? glow("rgba(63,185,80,0.22)", 20) : {}) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ color: C.text, fontSize: 46, fontWeight: 900, fontFamily: MONO }}>BTC</span>
            <span style={{
              color: C.green, fontSize: 29, fontWeight: 800, border: `2px solid ${C.green}`, borderRadius: 10,
              padding: "5px 14px", opacity: lit(f, a805, 10), ...(f >= a805 ? glow("rgba(63,185,80,0.25)", 14) : {}),
            }}>GIỮ VÙNG SINH TỬ 80.5K</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 12 }}>
            <span style={{ color: C.green, fontSize: 88, fontWeight: 900, lineHeight: 1, fontFamily: FONT }}>
              <CountUp at={a83} to={83050} frames={36} />
            </span>
            <span style={{ color: C.green, fontSize: 36, fontWeight: 800, fontFamily: MONO, opacity: lit(f, a83 + 8, 8) }}>+0,42% 24h</span>
          </div>
        </Card>
      </div>
      {/* ETH ticker — one step dimmer */}
      <div style={{
        position: "absolute", top: 680, left: SAFE.x, right: SAFE.x,
        opacity: 0.78 * lit(f, aEth, 10), transform: `translateX(${interpolate(f - aEth, [0, 12], [50, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "20px 30px", border: `2px solid ${C.red}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ color: C.text, fontSize: 46, fontWeight: 900, fontFamily: MONO }}>ETH</span>
            <span style={{ color: C.textSoft, fontSize: 27, fontWeight: 700 }}>chỉ bật yếu quanh mốc cũ</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 12 }}>
            <span style={{ color: C.red, fontSize: 88, fontWeight: 900, lineHeight: 1, fontFamily: FONT }}>
              <CountUp at={aEth} to={2492} frames={30} />
            </span>
            <span style={{ color: C.red, fontSize: 36, fontWeight: 800, fontFamily: MONO, opacity: lit(f, aEth + 8, 8) }}>−1,54% 24h</span>
          </div>
        </Card>
      </div>
      {/* rebased 7-day slope pair — BTC shallow, ETH ~3x deep (no axis numbers) */}
      <div style={{ position: "absolute", top: 960, left: SAFE.x, width: SAFE.w, height: 260 }}>
        <div style={{ position: "absolute", top: -6, left: 10, opacity: lit(f, aBeta, 8) }}>
          <span style={{ color: C.textSoft, fontSize: 30, fontWeight: 900, letterSpacing: 2 }}>7 NGÀY</span>
        </div>
        <svg width={SAFE.w} height={260} viewBox={`0 0 ${SAFE.w} 260`}>
          {/* ETH — steep */}
          <path d={`M 80 ${70} L 840 ${220}`} fill="none" stroke={C.red} strokeWidth={6} strokeLinecap="round"
            strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aBeta + 6, 22)} />
          {/* BTC — shallow */}
          <path d={`M 80 ${80} L 840 ${128}`} fill="none" stroke={C.green} strokeWidth={6} strokeLinecap="round"
            strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aBeta, 22)} />
          <text x={70} y={52} fill={C.red} fontSize={26} fontWeight={900} fontFamily={MONO} opacity={lit(f, aBeta + 10, 8)}>ETH</text>
          <text x={70} y={106} fill={C.green} fontSize={26} fontWeight={900} fontFamily={MONO} opacity={lit(f, aBeta + 10, 8)}>BTC</text>
        </svg>
      </div>
      {/* beta verdict chip */}
      <div style={{
        position: "absolute", top: 1340, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aGay, 10), transform: `translateY(${interpolate(f - aGay, [0, 10], [20, 0], clamp)}px)`,
      }}>
        <Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 30, fontWeight: 900, ...(f >= aGay ? glow("rgba(210,153,34,0.32)", 22) : {}) }}>
          BETA CAO HƠN — GÃY TRƯỚC, BẬT SAU
        </Chip>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S07 — HERO: VÙNG SINH TỬ 2.400–2.450 (mood #2 + TSX zone chart)
// ---------------------------------------------------------------------------
// viewBox-local scale: price 2560..2090 -> y 0..820 (inside the Card svg only)
const S07_yOf = (p: number): number => ((2560 - p) / 470) * 820;

const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aTitle = frameOf("s07", "Vậy Ether phải giữ ở đâu");
  const a2400 = frameOf("s07", "vùng sinh tử hai nghìn bốn trăm");
  const a2450 = frameOf("s07", "hai nghìn bốn trăm năm mươi");
  const a2450end = frameOfEnd("s07", "hai nghìn bốn trăm năm mươi");
  const aDay = frameOf("s07", "trùng với đáy giữa tháng chín");
  const aVoid = frameOf("s07", "khoảng trống dài");
  const a200 = frameOf("s07", "đường hai trăm ngày");
  const aQuyet = frameOf("s07", "quyết định tất cả");
  const zoneTop = S07_yOf(2450);
  const zoneBot = S07_yOf(2400);
  const priceY = S07_yOf(2471.91);
  const smaY = S07_yOf(2128.63);
  const zoom = interpolate(f, [aVoid + 16, SF("s07")], [1.0, 1.15], clamp);
  const voidP = lit(f, aVoid, 14);
  const pulse = 0.78 + 0.22 * Math.sin((f / 16) * Math.PI);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Img src={staticFile("eth-tradingagents-20261009/bg_s07.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.32 }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,17,23,0.86) 0%, rgba(13,17,23,0.6) 40%, rgba(13,17,23,0.92) 78%, #0D1117 100%)" }} />
      {/* the question */}
      <div style={{ position: "absolute", top: 348, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aTitle, 12) }}>
        <span style={{ color: C.text, fontSize: 54, fontWeight: 900, letterSpacing: 1 }}>ETHER PHẢI GIỮ Ở ĐÂU?</span>
      </div>
      {/* the chart — slow zoom toward the zone */}
      <div style={{ position: "absolute", top: 470, left: SAFE.x, width: SAFE.w, height: 820, opacity: lit(f, aTitle + 4, 10), transform: `scale(${zoom})`, transformOrigin: "50% 34%" }}>
        <Card style={{ position: "absolute", inset: 0, background: "rgba(22,27,34,0.72)" }}>
          <svg width={SAFE.w} height={820} viewBox={`0 0 ${SAFE.w} 820`}>
            {/* the void below the zone — darkens on 'khoảng trống dài' */}
            <rect x={30} y={zoneBot} width={SAFE.w - 60} height={820 - zoneBot - 16} rx={10} fill="#05070A" opacity={0.72 * voidP} />
            {/* death zone band 2.400–2.450 — edges light up in narration order */}
            <rect x={30} y={zoneTop} width={SAFE.w - 60} height={Math.max(2, (zoneBot - zoneTop) * Math.max(0.001, lit(f, a2400, 10)))} rx={10} fill="url(#zoneGrad)" opacity={0.9} />
            <defs>
              <linearGradient id="zoneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(210,153,34,0.42)" />
                <stop offset="100%" stopColor="rgba(248,81,73,0.42)" />
              </linearGradient>
            </defs>
            <rect x={30} y={zoneTop} width={SAFE.w - 60} height={zoneBot - zoneTop} rx={10} fill="none" stroke={C.red} strokeWidth={2.5} opacity={0.6 * lit(f, a2450, 12)} />
            {/* price line hanging just above the zone — one step away */}
            <path d={`M 40 ${priceY} C 300 ${priceY - 26}, 560 ${priceY + 10}, 880 ${priceY}`}
              fill="none" stroke={C.text} strokeWidth={5} strokeLinecap="round"
              strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aTitle + 8, 22)} />
            <circle cx={880} cy={priceY} r={10} fill={C.text} opacity={lit(f, aTitle + 26, 8)} />
            {/* 15/09 low — dashed, sits on the zone floor */}
            <g opacity={lit(f, aDay, 10)}>
              <line x1={60} x2={860} y1={zoneBot} y2={zoneBot} stroke={C.amber} strokeWidth={3} strokeDasharray="10 10" opacity={0.8} />
            </g>
            {/* 200 SMA deep below — faint in the void, brightens on its words */}
            <g opacity={0.25 + 0.65 * lit(f, a200, 12)}>
              <line x1={40} x2={880} y1={smaY} y2={smaY} stroke={C.green} strokeWidth={4} />
            </g>
          </svg>
          {/* in-chart labels */}
          <div style={{ position: "absolute", left: 46, top: zoneTop - 24, opacity: lit(f, a2450, 8) }}>
            <span style={{ background: "rgba(1,4,9,0.88)", border: `2px solid ${C.red}`, color: C.text, borderRadius: 8, padding: "4px 14px", fontSize: 27, fontWeight: 900, fontFamily: MONO }}>2.450</span>
          </div>
          <div style={{ position: "absolute", left: 46, top: zoneBot - 10, opacity: lit(f, a2400, 8) }}>
            <span style={{ background: "rgba(1,4,9,0.88)", border: `2px solid ${C.red}`, color: C.text, borderRadius: 8, padding: "4px 14px", fontSize: 27, fontWeight: 900, fontFamily: MONO }}>2.400</span>
          </div>
          <div style={{ position: "absolute", right: 60, top: priceY - 66, opacity: lit(f, aTitle + 28, 8) }}>
            <span style={{ background: "rgba(1,4,9,0.88)", color: C.text, borderRadius: 8, padding: "6px 14px", fontSize: 26, fontWeight: 800, fontFamily: MONO }}>GIÁ 2.471,91 · MỘT BƯỚC NỮA</span>
          </div>
          <div style={{ position: "absolute", left: 460, top: zoneBot + 12, opacity: lit(f, aDay, 8) }}>
            <span style={{ color: C.amber, fontSize: 26, fontWeight: 800, fontFamily: MONO }}>ĐÁY 15/09</span>
          </div>
          <div style={{ position: "absolute", left: 46, top: smaY - 40, opacity: lit(f, aVoid, 8) }}>
            <span style={{ background: "rgba(1,4,9,0.88)", border: `1.5px solid ${C.green}`, color: C.green, borderRadius: 8, padding: "4px 14px", fontSize: 25, fontWeight: 800, fontFamily: MONO }}>200 SMA 2.128,63</span>
          </div>
        </Card>
      </div>
      {/* VÙNG SINH TỬ stamp — springs when '2.450' lands */}
      <div style={{ position: "absolute", top: 1322, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <span style={{ ...slam(a2450end, f, fps, 1.5), display: "inline-block", color: C.text, fontSize: 62, fontWeight: 900, letterSpacing: 5, border: `3.5px solid ${C.red}`, borderRadius: 14, padding: "8px 36px", background: "rgba(1,4,9,0.7)", ...(f >= a2450end ? glow("rgba(248,81,73,0.5)", 28) : {}) }}>VÙNG SINH TỬ</span>
      </div>
      {/* pulse verdict */}
      <div style={{ position: "absolute", top: 1462, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aQuyet, 10) }}>
        <span style={{ color: C.text, fontSize: 31, fontWeight: 900, letterSpacing: 0.5, opacity: pulse }}>NẾN PHẢN ỨNG TẠI ĐÂY QUYẾT ĐỊNH TẤT CẢ</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S08 — KỊCH BẢN NẾU #1: GIỮ 2.400 → TEST 2.550 → 2.634 (+ điều kiện vô hiệu)
// ---------------------------------------------------------------------------
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aKich = frameOf("s08", "Kịch bản chỉ nói theo điều kiện");
  const aNeu = frameOf("s08", "Nếu giữ được hai nghìn bốn trăm");
  const a2550 = frameOf("s08", "hai nghìn năm trăm năm mươi mốt");
  const aSmaCu = frameOf("s08", "đường năm mươi ngày cũ trở thành kháng cự");
  const a2634 = frameOf("s08", "hai nghìn sáu trăm ba mươi bốn");
  const aChet = frameOf("s08", "Nhánh này chết khi nào");
  const aDong = frameOf("s08", "đóng cửa ngày dưới hai nghìn bốn trăm");
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* header NẾU */}
      <div style={{ position: "absolute", top: 344, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aNeu, 10) }}>
        <span style={{ color: C.green, fontSize: 56, fontWeight: 900, letterSpacing: 2 }}><span style={{ letterSpacing: 8 }}>NẾU</span> GIỮ ĐƯỢC 2.400</span>
      </div>
      {/* root — mini death zone reused from s07 */}
      <div style={{ position: "absolute", top: 480, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", opacity: lit(f, aKich, 10) }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16, border: `2.5px solid ${C.red}`, background: "linear-gradient(90deg, rgba(210,153,34,0.2), rgba(248,81,73,0.2))", borderRadius: 14, padding: "12px 26px", ...(f >= aNeu ? glow("rgba(248,81,73,0.22)", 18) : {}) }}>
          <span style={{ color: C.text, fontSize: 36, fontWeight: 900, fontFamily: MONO }}>VÙNG 2.400 – 2.450</span>
          <span style={{ color: C.textSoft, fontSize: 25, fontWeight: 700, opacity: lit(f, aNeu + 8, 10) }}>GIỮ 2.400 + KHỐI LƯỢNG BÁN CẠN DẦN</span>
        </div>
      </div>
      {/* staircase arrows */}
      <svg width={SAFE.w} height={640} viewBox={`0 0 ${SAFE.w} 640`} style={{ position: "absolute", left: SAFE.x, top: 620 }}>
        <path d="M 200 20 C 200 110, 620 90, 620 180" fill="none" stroke={C.green} strokeWidth={5.5} strokeLinecap="round"
          strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, a2550, 18)} />
        <path d="M 620 250 C 620 330, 300 320, 300 400" fill="none" stroke={C.green} strokeWidth={5.5} strokeLinecap="round"
          strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, a2634, 18)} />
      </svg>
      {/* step 1 — TEST 2.550 */}
      <div style={{
        position: "absolute", top: 780, left: 330, right: SAFE.x, opacity: lit(f, a2550 + 6, 10),
        transform: `translateY(${interpolate(f - a2550, [0, 12], [24, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "16px 28px", border: `2.5px solid ${C.green}`, ...(f >= a2550 ? glow("rgba(63,185,80,0.2)", 18) : {}) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ color: C.text, fontSize: 52, fontWeight: 900, fontFamily: FONT }}>TEST <span style={{ color: C.green }}>2.550</span></span>
            <span style={{
              color: f >= aSmaCu ? C.green : C.muted, fontSize: 25, fontWeight: 800, fontFamily: MONO,
              border: `2px solid ${f >= aSmaCu ? C.green : C.border}`, borderRadius: 10, padding: "4px 12px",
              opacity: lit(f, aSmaCu - 8, 8), ...(f >= aSmaCu ? glow("rgba(63,185,80,0.3)", 14) : {}),
            }}>50 SMA CŨ</span>
          </div>
        </Card>
      </div>
      {/* step 2 — 2.634 */}
      <div style={{
        position: "absolute", top: 1000, left: SAFE.x, right: 360, opacity: lit(f, a2634, 10),
        transform: `translateY(${interpolate(f - a2634, [0, 12], [24, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "16px 28px", border: `2.5px solid ${C.green}`, ...(f >= a2634 ? glow("rgba(63,185,80,0.2)", 18) : {}) }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <span style={{ color: C.green, fontSize: 56, fontWeight: 900, fontFamily: FONT }}>2.634</span>
            <span style={{ color: C.textSoft, fontSize: 27, fontWeight: 800 }}>MỤC TIÊU KẾ TIẾP</span>
          </div>
          <div style={{ marginTop: 10, opacity: lit(f, a2634 + 8, 8) }}>
            <Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 23, fontFamily: MONO }}>10 EMA 2.634,44 · kháng cự ngắn hạn</Chip>
          </div>
        </Card>
      </div>
      {/* invalidity question + stamp */}
      <div style={{ position: "absolute", top: 1244, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aChet, 10) }}>
        <span style={{ color: C.text, fontSize: 44, fontWeight: 900 }}>NHÁNH NÀY CHẾT KHI NÀO?</span>
      </div>
      <div style={{ position: "absolute", top: 1318, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center" }}>
        <span style={{ ...slam(aDong, f, fps, 1.15), display: "inline-block", border: `3.5px solid ${C.red}`, color: C.red, borderRadius: 12, padding: "10px 30px", fontSize: 40, fontWeight: 900, fontFamily: MONO, letterSpacing: 1, background: "rgba(1,4,9,0.7)", ...(f >= aDong + 4 ? glow("rgba(248,81,73,0.45)", 26) : {}) }}>
          VÔ HIỆU KHI: ĐÓNG CỬA NGÀY &lt; 2.400
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S09 — KỊCH BẢN NẾU #2: THỦNG 2.400 → 200 SMA 2.128,63 + TÍCH LŨY BỊ HỦY
// ---------------------------------------------------------------------------
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const aBreak = frameOf("s09", "đóng cửa ngày dứt khoát dưới hai nghìn bốn trăm");
  const a2128 = frameOf("s09", "hai nghìn một trăm hai mươi tám");
  const aHuy = frameOf("s09", "bị hủy tại chính mốc đó");
  const aRo = frameOf("s09", "mốc vô hiệu rõ ràng");
  const aKhong = frameOf("s09", "Không phán đoán");
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* header NẾU THỦNG */}
      <div style={{ position: "absolute", top: 344, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aBreak, 10) }}>
        <span style={{ color: C.red, fontSize: 56, fontWeight: 900, letterSpacing: 2 }}><span style={{ letterSpacing: 8 }}>NẾU</span> THỦNG 2.400</span>
      </div>
      {/* root mini zone */}
      <div style={{ position: "absolute", top: 460, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", opacity: lit(f, aBreak + 4, 10) }}>
        <div style={{ display: "inline-flex", border: `2.5px solid ${C.red}`, background: "linear-gradient(90deg, rgba(210,153,34,0.2), rgba(248,81,73,0.2))", borderRadius: 14, padding: "12px 26px" }}>
          <span style={{ color: C.text, fontSize: 36, fontWeight: 900, fontFamily: MONO }}>ĐÓNG CỬA NGÀY &lt; 2.400</span>
        </div>
      </div>
      {/* down branch through the darkening void to 200 SMA */}
      <div style={{ position: "absolute", top: 560, left: SAFE.x, width: SAFE.w, height: 600 }}>
        <svg width={SAFE.w} height={600} viewBox={`0 0 ${SAFE.w} 600`}>
          <rect x={140} y={20} width={640} height={520} rx={14} fill="#05070A" opacity={0.6} />
          <path d="M 460 16 C 460 200, 460 380, 460 540" fill="none" stroke={C.red} strokeWidth={6} strokeLinecap="round"
            strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aBreak + 8, 34)} />
          <path d="M 448 512 L 460 544 L 472 512" fill="none" stroke={C.red} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={lit(f, aBreak + 34, 6)} />
          <line x1={60} x2={860} y1={548} y2={548} stroke={C.green} strokeWidth={4.5} opacity={0.25 + 0.7 * lit(f, a2128, 12)} />
        </svg>
        <div style={{ position: "absolute", left: 40, top: 512, opacity: lit(f, a2128, 8) }}>
          <span style={{ background: "rgba(1,4,9,0.88)", border: `2px solid ${C.green}`, color: C.green, borderRadius: 10, padding: "6px 16px", fontSize: 30, fontWeight: 900, fontFamily: MONO, ...(f >= a2128 ? glow("rgba(63,185,80,0.3)", 18) : {}) }}>200 SMA 2.128,63</span>
        </div>
      </div>
      {/* TÍCH LŨY BỊ HỦY — struck through */}
      <div style={{ position: "absolute", top: 900, left: 520, opacity: lit(f, aHuy, 10) }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <span style={{ color: C.text, fontSize: 44, fontWeight: 900, letterSpacing: 1 }}>TÍCH LŨY</span>
          <span style={{ color: C.red, fontSize: 44, fontWeight: 900, letterSpacing: 1, marginLeft: 14 }}>BỊ HỦY</span>
          <div style={{
            position: "absolute", left: -8, right: -8, top: "50%", height: 6, background: C.red, borderRadius: 3,
            transform: `scaleX(${interpolate(f - aHuy, [0, 10], [0, 1], clamp)})`, transformOrigin: "left center",
            boxShadow: `0 0 ${14 * lit(f, aHuy, 8)}px rgba(248,81,73,0.7)`,
          }} />
        </div>
      </div>
      {/* each branch has its kill mark */}
      <div style={{ position: "absolute", top: 1236, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aRo, 10) }}>
        <span style={{ color: C.text, fontSize: 40, fontWeight: 900 }}>MỐI NHÁNH ĐỀU CÓ MỐC VÔ HIỆU RÕ RÀNG</span>
      </div>
      {/* neutral lock */}
      <div style={{
        position: "absolute", top: 1376, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aKhong, 10), transform: `translateY(${interpolate(f - aKhong, [0, 10], [20, 0], clamp)}px)`,
      }}>
        <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 31, fontWeight: 900, letterSpacing: 1, ...(f >= aKhong ? glow("rgba(88,166,255,0.3)", 20) : {}) }}>
          KHÔNG PHÁN ĐOÁN — CHỈ THEO DÕI MỐC
        </Chip>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S10 — CTA POLL + DISCLAIMER (banner holds to the last frame)
// ---------------------------------------------------------------------------
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aPoll = frameOf("s10", "Ether giữ được hai nghìn bốn trăm không");
  const aBinh = frameOf("s10", "Bình chọn bên dưới");
  const aFollow = frameOf("s10", "Theo dõi kênh");
  const aBanner = frameOf("s10", "mang tính tham khảo");
  const aNo = frameOf("s10", "không phải lời khuyên đầu tư");
  const quiet = 1 - lit(f, SF("s10") - 18, 12);
  const invite = (0.6 + 0.4 * Math.sin((f / 10) * Math.PI)) * quiet;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #0D1117 0%, #161B22 100%)" }} />
      {/* binary poll — no results, waiting for the viewer */}
      <div style={{ position: "absolute", top: 566, left: SAFE.x, right: SAFE.x, textAlign: "center", ...slam(aPoll, f, fps, 1.25) }}>
        <span style={{ color: C.text, fontSize: 76, fontWeight: 900, lineHeight: 1.12, letterSpacing: 1 }}>ETHER GIỮ<br />ĐƯỢC 2.400?</span>
      </div>
      <div style={{ position: "absolute", top: 800, left: SAFE.x, right: SAFE.x, display: "flex", gap: 24, justifyContent: "center", alignItems: "stretch" }}>
        <div style={{
          opacity: lit(f, aPoll + 6, 10), transform: `translateX(${interpolate(f - aPoll, [0, 12], [-40, 0], clamp)}px)`,
          border: `3px solid ${C.green}`, boxShadow: `0 0 ${18 + 16 * invite}px rgba(63,185,80,${0.25 + 0.3 * invite})`,
          borderRadius: 18, padding: "20px 52px", background: C.greenFill,
        }}>
          <div style={{ color: C.green, fontSize: 52, fontWeight: 900 }}>GIỮ ✋</div>
        </div>
        <div style={{
          opacity: lit(f, aPoll + 9, 10), transform: `translateX(${interpolate(f - aPoll, [0, 12], [40, 0], clamp)}px)`,
          border: `3px solid ${C.red}`, boxShadow: `0 0 ${18 + 16 * invite}px rgba(248,81,73,${0.25 + 0.3 * invite})`,
          borderRadius: 18, padding: "20px 52px", background: C.redFill,
        }}>
          <div style={{ color: C.red, fontSize: 52, fontWeight: 900 }}>THỦNG 👇</div>
        </div>
      </div>
      {/* follow chip */}
      <div style={{
        position: "absolute", top: 1026, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aFollow, 10), transform: `translateY(${interpolate(f - aFollow, [0, 10], [20, 0], clamp)}px)`,
      }}>
        <Chip color={C.green} fill={C.greenFill} style={{ fontSize: 29, fontWeight: 900, ...(f >= aFollow ? glow("rgba(63,185,80,0.3)", 18) : {}) }}>
          THEO DÕI KÊNH — VÙNG SINH TỬ MỖI PHIÊN
        </Chip>
      </div>
      {/* disclaimer banner — syncs the spoken words, holds to the end */}
      <div style={{
        position: "absolute", top: 1200, left: SAFE.x + 40, right: SAFE.x + 40,
        opacity: lit(f, aBanner, 12), transform: `translateY(${interpolate(f - aBanner, [0, 12], [28, 0], clamp)}px)`,
      }}>
        <div style={{
          border: `${f >= aNo ? 5 : 3}px solid ${C.amber}`, borderRadius: 18, padding: "26px 30px", textAlign: "center",
          background: "rgba(1,4,9,0.75)", ...(f >= aNo ? glow("rgba(210,153,34,0.4)", 26) : {}),
        }}>
          <div style={{ color: C.amber, fontSize: 40, fontWeight: 900, letterSpacing: 1, lineHeight: 1.3 }}>PHÂN TÍCH THAM KHẢO</div>
          <div style={{ color: C.text, fontSize: 40, fontWeight: 900, letterSpacing: 1, marginTop: 6, opacity: lit(f, aNo, 10) }}>KHÔNG PHẢI LỜI KHUYÊN ĐẦU TƯ</div>
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

export const EthTradingAgents20261009: React.FC = () => (
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
    <Audio src={staticFile("eth-tradingagents-20261009/narration_full.wav")} volume={1} />
    <Audio
      src={staticFile("eth-tradingagents-20261009/bgm.mp3")}
      volume={(fr) =>
        BGM_VOLUME *
        Math.min(1, fr / BGM_FADE_IN) *
        Math.min(1, Math.max(0, (TOTAL_FRAMES - fr) / BGM_FADE_OUT))
      }
    />
  </AbsoluteFill>
);
