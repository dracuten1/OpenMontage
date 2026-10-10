// eth-tradingagents-20261010 — "Cùng Ngược Gió, Hai Số Phận — Ether Gãy Cấu
// Trúc, Bitcoin Trụ Vững" (atelier composition, VERTICAL 1080x1920 @30fps).
// One <Sequence> per scene from MEASURED scene_timing.json (132.447s + 1s tail
// = 4004f). Every reveal / count-up / draw is speech-locked (frameOf) to SPOKEN
// word times in public/eth-tradingagents-20261010/words.json (53/53 anchors
// audited, greedy-join; s03 clause gap-healed). All on-screen numbers ⊆ digest
// whitelist, vi-VN display (2.471,91 USD). Visual language of this episode:
// DUAL-PANEL ETH|BTC divergence throughout (s01 bar đôi, s02/s03 chart mặt
// gương, s04 gauge kép, s06 cột đôi, s07 hai vạch song song, s08/s09 cây kép).
// Only 2 gen mood backdrops (s01/s07, opacity 0.32 + black overlay) — every
// chart/stat/typography is pure TSX/SVG (focal-visual rule). Local-SVG yOf maps
// stay inside their viewBox — never offset by page (d-010).
import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring,
} from "remotion";
import { C, FONT, MONO, SAFE, SPRING, fmtVi } from "./theme";
import { SCENE_TIMING, TOTAL_FRAMES, frameOf, frameOfEnd, getSceneTiming, type SceneId } from "./timing";
import captionsJson from "../../public/eth-tradingagents-20261010/captions.json";

export const ETH10_20261010_TOTAL_FRAMES = TOTAL_FRAMES; // 4004
const SF = (id: SceneId): number => getSceneTiming(id).scene_frames;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const lit = (f: number, at: number, k = 8): number => interpolate(f - at, [0, k], [0, 1], clamp);

// ---------------------------------------------------------------------------
// Shared primitives (mechanics codex — btc08/eth09 house style)
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
// S01 — HOOK PHÂN TÁCH: ETH −7,35%/TUẦN vs BTC −3,34%/TUẦN (mood #1)
// ---------------------------------------------------------------------------
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aEth = frameOf("s01", "Ether mất bảy phẩy ba năm");
  const aBtc = frameOf("s01", "Bitcoin chỉ mất ba phẩy ba bốn");
  const aChip = frameOf("s01", "một tài sản duy nhất gãy cấu trúc");
  const aGay = frameOf("s01", "gãy cấu trúc", 2); // 'gãy cấu trúc' #2 = inside the chip line
  const aStat = frameOf("s01", "Bên nào");
  const aQ = frameOf("s01", "Vì sao chỉ một bên gãy");
  const bgDrift = interpolate(f, [0, SF("s01")], [1.0, 1.03], clamp);
  // honest ratio 7,35 : 3,34 ≈ 2,2x
  const ETH_W = 505;
  const BTC_W = 230;
  const growEth = spring({ frame: f - aEth, fps, config: SPRING });
  const growBtc = spring({ frame: f - aBtc, fps, config: SPRING });
  const gayFlash = f >= aGay && f < aGay + 22 ? 1 - (f - aGay) / 22 : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Img src={staticFile("eth-tradingagents-20261010/bg_s01.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.32, transform: `scale(${bgDrift})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,17,23,0.82) 0%, rgba(13,17,23,0.60) 38%, rgba(13,17,23,0.90) 72%, #0D1117 100%)" }} />
      {/* ETH counter bar — the break, ~2.2x longer, red (spoken FIRST → shown FIRST) */}
      <div style={{ position: "absolute", top: 560, left: SAFE.x, right: SAFE.x }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: lit(f, aEth - 4, 6) }}>
          <span style={{ color: C.text, fontSize: 44, fontWeight: 900, fontFamily: MONO, width: 110 }}>ETH</span>
          <div style={{ width: SAFE.w - 150, height: 92, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}>
            <div style={{
              width: ETH_W, height: "100%", borderRadius: 13, transformOrigin: "left center",
              transform: `scaleX(${Math.max(0.001, growEth)})`, background: "linear-gradient(90deg, rgba(248,81,73,0.35), #F85149)",
              boxShadow: `0 0 ${40 * Math.min(1, growEth)}px rgba(248,81,73,0.45)`,
            }} />
          </div>
          <span style={{ color: C.red, fontSize: 46, fontWeight: 900, fontFamily: MONO, whiteSpace: "nowrap", opacity: lit(f, aEth + 8, 8) }}>−7,35%<span style={{ fontSize: 26, color: C.muted }}>/TUẦN</span></span>
        </div>
      </div>
      {/* BTC counter bar — short, green */}
      <div style={{ position: "absolute", top: 760, left: SAFE.x, right: SAFE.x }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: lit(f, aBtc - 4, 6) }}>
          <span style={{ color: C.text, fontSize: 44, fontWeight: 900, fontFamily: MONO, width: 110 }}>BTC</span>
          <div style={{ width: SAFE.w - 150, height: 92, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}>
            <div style={{
              width: BTC_W, height: "100%", borderRadius: 13, transformOrigin: "left center",
              transform: `scaleX(${Math.max(0.001, growBtc)})`, background: "linear-gradient(90deg, rgba(63,185,80,0.35), #3FB950)",
              boxShadow: `0 0 ${26 * Math.min(1, growBtc)}px rgba(63,185,80,0.35)`,
            }} />
          </div>
          <span style={{ color: C.green, fontSize: 46, fontWeight: 900, fontFamily: MONO, whiteSpace: "nowrap", opacity: lit(f, aBtc + 8, 8) }}>−3,34%<span style={{ fontSize: 26, color: C.muted }}>/TUẦN</span></span>
        </div>
        <div style={{ color: C.muted, fontSize: 27, fontWeight: 700, marginTop: 12, marginLeft: 130, opacity: lit(f, aBtc + 14, 10) }}>cùng một đợt xả — một bên gãy gần gấp 2,2 lần</div>
      </div>
      {/* divergence chip */}
      <div style={{
        position: "absolute", top: 986, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aChip, 10), transform: `translateX(${interpolate(f - aChip, [0, 12], [-70, 0], clamp)}px)`,
      }}>
        <Chip color={C.amber} fill="rgba(210,153,34,0.10)" style={{ fontSize: 29, fontWeight: 800, ...(gayFlash > 0 ? glow("rgba(248,81,73,0.5)", 24) : {}) }}>
          PHÂN TÁCH — CHỈ MỘT BÊN <span style={{ color: C.red, textShadow: gayFlash > 0 ? `0 0 ${26 * gayFlash}px rgba(248,81,73,0.95)` : "none" }}>GÃY CẤU TRÚC</span>
        </Chip>
      </div>
      {/* week/date stat chip */}
      <div style={{
        position: "absolute", top: 1120, left: SAFE.x + 60, right: SAFE.x + 60, display: "flex", justifyContent: "center",
        opacity: lit(f, aStat, 10), transform: `translateY(${interpolate(f - aStat, [0, 12], [36, 0], clamp)}px)`,
      }}>
        <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 27, fontFamily: MONO, ...(f >= aStat ? glow("rgba(88,166,255,0.22)", 18) : {}) }}>
          TUẦN ĐẾN 08/10 · ETH −7,35% vs BTC −3,34%
        </Chip>
      </div>
      {/* the open question — answered at s02/s03, closed at s07-s09 */}
      <div style={{ position: "absolute", top: 1380, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aQ, 12), transform: `translateY(${interpolate(f - aQ, [0, 12], [24, 0], clamp)}px)` }}>
        <span style={{ color: C.text, fontSize: 54, fontWeight: 900, lineHeight: 1.15, letterSpacing: 0.5 }}>BÊN NÀO?<br />VÌ SAO CHỈ MỘT BÊN GÃY?</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S02 — PHÍA GÃY: nến 08/10 xuyên SMA50 2.551,00 (real-data chart, mirror A)
// ---------------------------------------------------------------------------
// viewBox-local scale: price 2590..2360 -> y 0..640 (inside the Card svg only)
const S02_yOf = (p: number): number => ((2590 - p) / 230) * 640;

const S02: React.FC = () => {
  const f = useCurrentFrame();
  const aHead = frameOf("s02", "Đáp án nằm ở phiên");
  const aClose = frameOf("s02", "đóng cửa hai nghìn bốn trăm bảy mươi mốt");
  const aThung = frameOf("s02", "thủng đường trung bình năm mươi ngày");
  const aPct = frameOf("s02", "thấp hơn ba phẩy một");
  const aRau = frameOf("s02", "Râu nến dưới chạm tận hai tư không sáu");
  const aVol = frameOf("s02", "hai mươi phẩy không tám tỷ");
  const aAp = frameOf("s02", "áp lực thật");
  const smaY = S02_yOf(2551.00);
  const closeY = S02_yOf(2471.91);
  const lowY = S02_yOf(2406.15);
  const highY = S02_yOf(2585.30);
  const candleOp = lit(f, aClose + 4, 8);
  const pierceP = lit(f, aThung, 12);
  const wickDrop = interpolate(f - aRau, [0, 12], [closeY, lowY], clamp);
  const flash = f >= aThung && f < aThung + 26 ? 1 - (f - aThung) / 26 : 0;
  const volGrow = interpolate(f - aVol, [0, 14], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* header */}
      <div style={{ position: "absolute", top: 360, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aHead - 4, 8) }}>
        <span style={{ color: C.text, fontSize: 37, fontWeight: 900, fontFamily: MONO, letterSpacing: 0.5 }}>PHÍA GÃY — PHIÊN 08/10</span>
      </div>
      {/* chart */}
      <Card style={{ position: "absolute", top: 450, left: SAFE.x, width: SAFE.w, height: 640 }}>
        <svg width={SAFE.w} height={640} viewBox={`0 0 ${SAFE.w} 640`}>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={0} x2={SAFE.w} y1={80 + i * 160} y2={80 + i * 160} stroke="rgba(240,246,252,0.05)" strokeWidth={1} />
          ))}
          {/* 11-day descent silhouette — mood only, no fabricated numbers */}
          <path d={`M 60 ${S02_yOf(2575)} C 200 ${S02_yOf(2585)}, 330 ${S02_yOf(2540)}, 450 ${S02_yOf(2552)} S 620 ${S02_yOf(2570)}, 700 ${S02_yOf(2560)}`}
            fill="none" stroke="rgba(230,237,243,0.28)" strokeWidth={4} strokeLinecap="round"
            strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aHead + 6, 20)} />
          {/* SMA50 2.551,00 — blue, crossfades to pierced red */}
          <g opacity={lit(f, aThung - 14, 8)}>
            <line x1={30} x2={SAFE.w - 30} y1={smaY} y2={smaY} stroke={C.blue} strokeWidth={3.5} opacity={0.85 * (1 - pierceP)} />
            <line x1={30} x2={SAFE.w - 30} y1={smaY} y2={smaY} stroke={C.red} strokeWidth={3.5} strokeDasharray="16 10" opacity={0.9 * pierceP} />
            {flash > 0 && <line x1={30} x2={SAFE.w - 30} y1={smaY} y2={smaY} stroke={C.red} strokeWidth={8} opacity={0.7 * flash} />}
          </g>
          {/* 08/10 candle — body top AT the SMA pierce, close 2.471,91, low wick 2.406,15 */}
          <g opacity={candleOp}>
            <line x1={700} x2={700} y1={highY} y2={wickDrop} stroke={C.red} strokeWidth={4} />
            <rect x={635} y={smaY} width={130} height={Math.max(6, closeY - smaY)} rx={6} fill="#F85149" fillOpacity={0.9} stroke="#F85149" strokeWidth={2} />
            {flash > 0 && <circle cx={700} cy={smaY} r={16 + 14 * flash} fill="none" stroke={C.red} strokeWidth={4} opacity={0.8 * flash} />}
          </g>
        </svg>
        {/* SMA label */}
        <div style={{ position: "absolute", left: 30, top: smaY - 46, opacity: lit(f, aThung - 14, 8) }}>
          <span style={{ background: "rgba(1,4,9,0.88)", border: `1.5px solid ${C.blue}`, color: C.blue, borderRadius: 8, padding: "5px 12px", fontSize: 25, fontWeight: 800, fontFamily: MONO }}>SMA50 2.551,00</span>
        </div>
        {/* THỦNG flash */}
        <div style={{ position: "absolute", right: 60, top: smaY - 18, opacity: flash }}>
          <span style={{ color: C.red, fontSize: 44, fontWeight: 900, letterSpacing: 4, textShadow: `0 0 ${30 * flash}px rgba(248,81,73,0.95)` }}>THỦNG</span>
        </div>
        {/* wick low label inside chart */}
        <div style={{ position: "absolute", left: 720, top: wickDrop - 18, opacity: lit(f, aRau + 10, 8) }}>
          <span style={{ background: "rgba(1,4,9,0.88)", border: `1.5px solid ${C.red}`, color: C.red, borderRadius: 8, padding: "4px 12px", fontSize: 24, fontWeight: 800, fontFamily: MONO }}>2.406,15</span>
        </div>
      </Card>
      {/* stat card — close 2.471,91 */}
      <div style={{
        position: "absolute", top: 1130, left: SAFE.x, right: SAFE.x,
        opacity: lit(f, aClose, 10), transform: `translateY(${interpolate(f - aClose, [0, 12], [40, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "18px 30px", display: "flex", alignItems: "center", gap: 26, border: `2px solid ${C.red}`, ...(f >= aClose ? glow("rgba(248,81,73,0.25)", 22) : {}) }}>
          <div style={{ color: C.red, fontSize: 80, fontWeight: 900, lineHeight: 1, fontFamily: FONT }}>
            <CountUp at={aClose} to={2471.91} frames={40} decimals={2} /><span style={{ fontSize: 36 }}> USD</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div style={{ color: C.text, fontSize: 30, fontWeight: 800 }}>ĐÓNG CỬA 08/10</div>
            <div style={{ opacity: lit(f, aPct, 8) }}>
              <Chip color={C.red} fill={C.redFill} style={{ fontSize: 23 }}>THẤP HƠN SMA50 −3,10%</Chip>
            </div>
          </div>
        </Card>
      </div>
      {/* volume bar — 20,08 TỶ vượt vạch mờ (không ghi số vạch) */}
      <div style={{ position: "absolute", top: 1330, left: SAFE.x, width: SAFE.w, height: 200, opacity: lit(f, aVol, 8) }}>
        <svg width={SAFE.w} height={200} viewBox={`0 0 ${SAFE.w} 200`}>
          <line x1={20} x2={SAFE.w - 20} y1={180} y2={180} stroke={C.border} strokeWidth={3} />
          {/* faint threshold ≈ 20 (unlabeled) */}
          <line x1={20} x2={SAFE.w - 20} y1={82} y2={82} stroke="rgba(248,81,73,0.35)" strokeWidth={3} strokeDasharray="14 10" opacity={lit(f, aVol + 4, 8)} />
          {/* column — 20,08 on a 0..26 scale */}
          <rect x={330} y={180 - 98 * volGrow} width={260} height={98 * volGrow} rx={9} fill="url(#volGrad2)" stroke={C.red} strokeWidth={2.5} />
          <defs>
            <linearGradient id="volGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(248,81,73,0.2)" />
              <stop offset="100%" stopColor="rgba(248,81,73,0.85)" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, textAlign: "center", opacity: lit(f, aVol + 8, 8), ...(f >= aAp ? { textShadow: "0 0 30px rgba(248,81,73,0.5)" } : {}) }}>
          <span style={{ color: C.text, fontSize: 34, fontWeight: 900, fontFamily: MONO }}>20,08 TỶ USD · 08/10</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S03 — PHÍA TRỤ: BTC 81.676,34 trên SMA50 80.528,27 + hai nền móng (mirror B)
// ---------------------------------------------------------------------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aHead = frameOf("s03", "Còn Bitcoin");
  const aClose = frameOf("s03", "đóng cửa tám mươi mốt nghìn sáu trăm bảy mươi sáu");
  const aTren = frameOf("s03", "Nhưng vẫn đứng trên đường năm mươi ngày");
  const aNhi = frameOf("s03", "nhỉnh hơn một phẩy bốn ba"); // gap-healed synth anchor
  const aMong = frameOf("s03", "Cùng một cơn bão hai nền móng khác nhau");
  const aNut = frameOf("s03", "nền Ether đã nứt");
  const aQ = frameOf("s03", "Phân tách này sâu đến đâu");
  const zoneP = lit(f, aTren, 12);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* header */}
      <div style={{ position: "absolute", top: 360, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aHead - 2, 8) }}>
        <span style={{ color: C.text, fontSize: 37, fontWeight: 900, fontFamily: MONO, letterSpacing: 0.5 }}>PHÍA TRỤ — PHIÊN 08/10</span>
      </div>
      {/* mini chart — gentle descent RESTING ON the green SMA50 */}
      <Card style={{ position: "absolute", top: 450, left: SAFE.x, width: SAFE.w, height: 500 }}>
        <svg width={SAFE.w} height={500} viewBox={`0 0 ${SAFE.w} 500`}>
          {[0, 1, 2].map((i) => (
            <line key={i} x1={0} x2={SAFE.w} y1={110 + i * 140} y2={110 + i * 140} stroke="rgba(240,246,252,0.05)" strokeWidth={1} />
          ))}
          {/* price band between SMA and endpoint fills green (held above) */}
          <rect x={40} y={330} width={770} height={56} rx={8} fill="rgba(63,185,80,0.14)" opacity={zoneP} />
          {/* 11-day descent silhouette — mood only */}
          <path d={`M 60 150 C 220 120, 380 200, 520 240 S 700 320, 800 330`}
            fill="none" stroke="rgba(230,237,243,0.30)" strokeWidth={4} strokeLinecap="round"
            strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aHead + 4, 20)} />
          {/* SMA50 80.528,27 — green, holding */}
          <g opacity={0.3 + 0.65 * zoneP}>
            <line x1={30} x2={SAFE.w - 30} y1={386} y2={386} stroke={C.green} strokeWidth={4} />
          </g>
          {/* endpoint — 81.676,34 resting above the line */}
          <circle cx={800} cy={330} r={11} fill={C.green} opacity={lit(f, aClose + 16, 8)} />
          {f >= aTren && f < aTren + 26 && <circle cx={800} cy={386} r={14 + 12 * (1 - (f - aTren) / 26)} fill="none" stroke={C.green} strokeWidth={4} opacity={0.8 * (1 - (f - aTren) / 26)} />}
        </svg>
        <div style={{ position: "absolute", left: 40, top: 386 - 44, opacity: lit(f, aTren, 8) }}>
          <span style={{ background: "rgba(1,4,9,0.88)", border: `1.5px solid ${C.green}`, color: C.green, borderRadius: 8, padding: "5px 12px", fontSize: 25, fontWeight: 800, fontFamily: MONO }}>SMA50 80.528,27</span>
        </div>
        <div style={{ position: "absolute", right: 44, top: 330 - 74, opacity: lit(f, aClose + 16, 8) }}>
          <span style={{ background: "rgba(1,4,9,0.88)", border: `1.5px solid ${C.green}`, color: C.text, borderRadius: 8, padding: "5px 12px", fontSize: 25, fontWeight: 800, fontFamily: MONO }}>81.676,34</span>
        </div>
        {/* axis label — only the endpoint date is named */}
        <div style={{ position: "absolute", right: 44, top: 430 }}>
          <span style={{ color: C.muted, fontSize: 23, fontWeight: 700, fontFamily: MONO }}>08/10</span>
        </div>
      </Card>
      {/* ticker — mirror of s02 stat card, green polarity */}
      <div style={{
        position: "absolute", top: 990, left: SAFE.x, right: SAFE.x,
        opacity: lit(f, aClose, 10), transform: `translateY(${interpolate(f - aClose, [0, 12], [36, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "18px 30px", display: "flex", alignItems: "center", gap: 22, border: `2px solid ${C.green}`, ...(f >= aTren ? glow("rgba(63,185,80,0.22)", 20) : {}) }}>
          <div style={{ color: C.green, fontSize: 66, fontWeight: 900, lineHeight: 1, fontFamily: FONT, whiteSpace: "nowrap" }}>
            <CountUp at={aClose} to={81676.34} frames={40} decimals={2} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div style={{ color: C.text, fontSize: 27, fontWeight: 800, fontFamily: MONO }}>BTC · TRÊN SMA50 80.528,27</div>
            <div style={{ opacity: lit(f, aNhi, 8) }}>
              <Chip color={C.green} fill={C.greenFill} style={{ fontSize: 24 }}>+1,43%</Chip>
            </div>
          </div>
        </Card>
      </div>
      {/* two foundations — one cracked, one intact */}
      <div style={{ position: "absolute", top: 1190, left: SAFE.x, right: SAFE.x, display: "flex", gap: 24 }}>
        <Card style={{ flex: 1, height: 210, opacity: lit(f, aMong, 10), transform: `translateX(${interpolate(f - aMong, [0, 10], [-30, 0], clamp)}px)` }}>
          <svg width="100%" height="150" viewBox="0 0 420 150" style={{ display: "block" }}>
            <rect x={30} y={60} width={360} height={62} rx={10} fill="rgba(248,81,73,0.10)" stroke={C.red} strokeWidth={2.5} />
            <path d="M 60 60 L 110 92 L 160 74 L 205 104 L 250 88 L 300 112 L 350 98 L 390 122"
              fill="none" stroke={C.red} strokeWidth={4} strokeLinecap="round"
              strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aNut, 16)} />
          </svg>
          <div style={{ textAlign: "center", paddingBottom: 14 }}>
            <span style={{ color: C.red, fontSize: 27, fontWeight: 900, fontFamily: MONO }}>ETH · ĐÃ NỨT</span>
          </div>
        </Card>
        <Card style={{ flex: 1, height: 210, opacity: lit(f, aMong + 6, 10), transform: `translateX(${interpolate(f - aMong, [6, 16], [30, 0], clamp)}px)`, ...(f >= aMong + 6 ? glow("rgba(63,185,80,0.16)", 14) : {}) }}>
          <svg width="100%" height="150" viewBox="0 0 420 150" style={{ display: "block" }}>
            <rect x={30} y={60} width={360} height={62} rx={10} fill="rgba(63,185,80,0.10)" stroke={C.green} strokeWidth={2.5} />
          </svg>
          <div style={{ textAlign: "center", paddingBottom: 14 }}>
            <span style={{ color: C.green, fontSize: 27, fontWeight: 900, fontFamily: MONO }}>BTC · CÒN NGUYÊN VẸN</span>
          </div>
        </Card>
      </div>
      {/* open question for s04 */}
      <div style={{ position: "absolute", top: 1440, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aQ, 12), transform: `translateY(${interpolate(f - aQ, [0, 12], [22, 0], clamp)}px)` }}>
        <span style={{ color: C.blue, fontSize: 42, fontWeight: 900, letterSpacing: 1 }}>PHÂN TÁCH NÀY SÂU ĐẾN ĐÂU?</span>
      </div>
      {/* fps referenced to keep spring import parity */}
      <div style={{ display: "none" }}>{String(spring({ frame: f - 99999, fps, config: SPRING }).toFixed(6))}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S04 — ĐỘNG LƯỢNG: gauge kép RSI 37,41 vs 46,86 + thước chênh 9,45 + MACD
// ---------------------------------------------------------------------------
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const aHead = frameOf("s04", "Xét động lượng");
  const aRsiE = frameOf("s04", "RSI Ether ba mươi bảy");
  const aRsiB = frameOf("s04", "RSI Bitcoin gần bốn mươi bảy");
  const aChe = frameOf("s04", "Chênh nhau tận chín phẩy bốn lăm");
  const aMacdQ = frameOf("s04", "Còn MACD của Ether");
  const aAm = frameOf("s04", "Âm sâu");
  const rsiE = interpolate(f - aRsiE, [0, 26], [50, 37.41], clamp);
  const rsiB = interpolate(f - aRsiB, [0, 26], [50, 46.86], clamp);
  const needle = (v: number): [number, number] => {
    const rad = Math.PI * (1 - v / 100);
    return [215 + 104 * Math.cos(rad), 230 - 104 * Math.sin(rad)];
  };
  const [ex, ey] = needle(rsiE);
  const [bx, by] = needle(rsiB);
  // honest gap ruler: 37,41 → 46,86 on a shared 0..100 axis segment
  const X0 = 150;
  const XW = 620;
  const gxE = X0 + (37.41 / 100) * XW;
  const gxB = X0 + (46.86 / 100) * XW;
  const cheP = lit(f, aChe, 12);
  const macdGrow = interpolate(f - aAm, [0, 16], [0, 1], clamp);
  const Gauge: React.FC<{ color: string; label: string; sub: string; nx: number; ny: number; val: number; at: number; op: number }> = ({ color, label, sub, nx, ny, val, at, op }) => (
    <div style={{ opacity: op }}>
      <svg width={430} height={250} viewBox="0 0 430 250">
        <path d="M 65 230 A 150 150 0 0 1 365 230" fill="none" stroke={C.border} strokeWidth={13} strokeLinecap="round" />
        <path d="M 65 230 A 150 150 0 0 1 365 230" fill="none" stroke={color} strokeWidth={13} strokeLinecap="round" opacity={0.55}
          strokeDasharray="100" pathLength={100} strokeDashoffset={100 - val} />
        <line x1={215} y1={230} x2={nx} y2={ny} stroke={C.text} strokeWidth={5} strokeLinecap="round" />
        <circle cx={215} cy={230} r={9} fill={C.text} />
        <text x={215} y={196} textAnchor="middle" fill={color} fontSize={44} fontWeight={900} fontFamily={MONO}>{f >= at ? fmtVi(val, 2) : ""}</text>
      </svg>
      <div style={{ textAlign: "center", marginTop: -6 }}>
        <span style={{ color: C.text, fontSize: 26, fontWeight: 900, fontFamily: MONO }}>{label}</span>
        <div style={{ marginTop: 6 }}>
          <span style={{ color, fontSize: 22, fontWeight: 800, letterSpacing: 2 }}>{sub}</span>
        </div>
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* header */}
      <div style={{ position: "absolute", top: 350, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aHead - 2, 8) }}>
        <span style={{ color: C.text, fontSize: 36, fontWeight: 900, fontFamily: MONO, letterSpacing: 0.5 }}>ĐỘNG LƯỢNG — KHOẢNG CÁCH RÕ HƠN</span>
      </div>
      {/* dual RSI gauges — ETH left (falls lower), BTC right (neutral) */}
      <div style={{ position: "absolute", top: 430, left: SAFE.x, width: 430 }}>
        <Gauge color={C.red} label="RSI ETH 37,41" sub="GẦN QUÁ BÁN" nx={ex} ny={ey} val={rsiE} at={aRsiE} op={lit(f, aRsiE - 6, 8)} />
      </div>
      <div style={{ position: "absolute", top: 430, left: 570, width: 430 }}>
        <Gauge color={C.muted} label="RSI BTC 46,86" sub="TRUNG TÍNH" nx={bx} ny={ny2(by)} val={rsiB} at={aRsiB} op={lit(f, aRsiB - 6, 8)} />
      </div>
      {/* honest gap ruler between the two needle values */}
      <div style={{ position: "absolute", top: 1000, left: SAFE.x, width: SAFE.w, height: 110, opacity: cheP }}>
        <svg width={SAFE.w} height={110} viewBox={`0 0 ${SAFE.w} 110`}>
          <line x1={X0} y1={62} x2={X0 + XW} y2={62} stroke={C.border} strokeWidth={4} />
          <line x1={gxE} y1={44} x2={gxE} y2={80} stroke={C.red} strokeWidth={5} />
          <line x1={gxB} y1={44} x2={gxB} y2={80} stroke={C.muted} strokeWidth={5} />
          <rect x={gxE} y={54} width={(gxB - gxE) * cheP} height={16} fill="rgba(210,153,34,0.35)" />
          <line x1={gxE} y1={54} x2={gxE + (gxB - gxE) * cheP} y2={54} stroke={C.amber} strokeWidth={5} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 26, fontWeight: 900, ...(f >= aChe ? glow("rgba(210,153,34,0.32)", 20) : {}) }}>CHÊNH 9,45 ĐIỂM</Chip>
        </div>
      </div>
      {/* MACD histogram — negative depth */}
      <div style={{ position: "absolute", top: 1150, left: SAFE.x, width: SAFE.w, height: 340, opacity: lit(f, aMacdQ, 10) }}>
        <svg width={SAFE.w} height={340} viewBox={`0 0 ${SAFE.w} 340`}>
          <line x1={30} x2={SAFE.w - 30} y1={40} y2={40} stroke={C.border} strokeWidth={3} />
          <rect x={330} y={40} width={260} height={230 * macdGrow} rx={8} fill="url(#macdGrad10)" stroke={C.red} strokeWidth={2.5} opacity={0.92} />
          <defs>
            <linearGradient id="macdGrad10" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(248,81,73,0.25)" />
              <stop offset="100%" stopColor="#F85149" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: "absolute", top: 60, left: 40 }}>
          <span style={{ color: C.text, fontSize: 44, fontWeight: 900, fontFamily: MONO }}>MACD ETH <span style={{ color: C.red }}>−30,77</span></span>
          <div style={{ marginTop: 10, opacity: lit(f, aAm, 10) }}>
            <span style={{ color: C.red, fontSize: 30, fontWeight: 900, letterSpacing: 1 }}>ÂM SÂU — LỰC BÁN DỒN VÀO MỘT PHE</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
// identity helper to keep the second gauge needle y explicit
const ny2 = (y: number): number => y;

// ---------------------------------------------------------------------------
// S05 — TWIST TÂM LÝ: SOCIAL 6,2/10 lạc quan vs GIÁ −8,36%/2 PHIÊN + stamp
// ---------------------------------------------------------------------------
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aHead = frameOf("s05", "Điều bất thường nhất");
  const aSocial = frameOf("s05", "sáu phẩy hai trên mười");
  const aGia = frameOf("s05", "tám phẩy ba sáu phần trăm");
  const aCuoi = frameOf("s05", "Đám đông cười giữa cơn bão");
  const aStamp = frameOf("s05", "tín hiệu phụ");
  const tilt = interpolate(f - aCuoi, [0, 14], [0, 1], clamp);
  const rotL = -3 * tilt;
  const rotR = 3 * tilt;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* header */}
      <div style={{ position: "absolute", top: 340, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aHead - 2, 8) }}>
        <span style={{ color: C.text, fontSize: 36, fontWeight: 900, fontFamily: MONO, letterSpacing: 0.5 }}>ĐIỀU BẤT THƯỜNG — TÂM LÝ</span>
      </div>
      {/* LEFT — social optimism, axis pointing UP */}
      <div style={{
        position: "absolute", top: 450, left: 90, width: 430, height: 690,
        transform: `rotate(${rotL}deg)`, opacity: lit(f, aSocial - 8, 8),
      }}>
        <Card style={{ padding: "22px 26px", height: "100%", borderColor: `rgba(63,185,80,0.4)` }}>
          <div style={{ color: C.textSoft, fontSize: 26, fontWeight: 900, fontFamily: MONO }}>SOCIAL ETH</div>
          <div style={{ color: C.green, fontSize: 96, fontWeight: 900, lineHeight: 1.05, fontFamily: FONT, marginTop: 10 }}>
            <CountUp at={aSocial} to={6.2} frames={30} decimals={1} /><span style={{ fontSize: 44, color: C.muted }}>/10</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <Chip color={C.green} fill={C.greenFill} style={{ fontSize: 25 }}>LẠC QUAN</Chip>
          </div>
          {/* up axis + smiley (pure SVG, mouth curves UP) */}
          <svg width="100%" height={300} viewBox="0 0 380 300" style={{ marginTop: 16 }}>
            <line x1={70} y1={260} x2={70} y2={30} stroke="rgba(63,185,80,0.5)" strokeWidth={5} strokeLinecap="round"
              strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aSocial, 18)} />
            <path d="M 60 46 L 70 28 L 80 46" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={lit(f, aSocial + 14, 8)} />
            <circle cx={230} cy={130} r={74} fill="none" stroke={C.green} strokeWidth={5} opacity={lit(f, aSocial + 6, 10)} />
            <path d="M 192 118 Q 230 88 268 118" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" opacity={lit(f, aSocial + 10, 8)} />
            <path d={`M 196 172 Q 230 ${172 + 26 * lit(f, aSocial + 12, 10)} 264 172`} fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" opacity={lit(f, aSocial + 12, 8)} />
            <circle cx={202} cy={118} r={7} fill={C.green} opacity={lit(f, aSocial + 10, 8)} />
            <circle cx={258} cy={118} r={7} fill={C.green} opacity={lit(f, aSocial + 10, 8)} />
          </svg>
        </Card>
      </div>
      {/* RIGHT — price falling, axis angled DOWN */}
      <div style={{
        position: "absolute", top: 450, left: 560, width: 430, height: 690,
        transform: `rotate(${rotR}deg)`, opacity: lit(f, aGia - 8, 8),
      }}>
        <Card style={{ padding: "22px 26px", height: "100%", borderColor: `rgba(248,81,73,0.4)` }}>
          <div style={{ color: C.textSoft, fontSize: 26, fontWeight: 900, fontFamily: MONO }}>GIÁ</div>
          <div style={{ color: C.red, fontSize: 84, fontWeight: 900, lineHeight: 1.05, fontFamily: FONT, marginTop: 10 }}>−8,36%</div>
          <div style={{ marginTop: 12 }}>
            <Chip color={C.red} fill={C.redFill} style={{ fontSize: 25 }}>2 PHIÊN</Chip>
          </div>
          <svg width="100%" height={300} viewBox="0 0 380 300" style={{ marginTop: 16 }}>
            <path d="M 70 40 L 290 260" fill="none" stroke={C.red} strokeWidth={7} strokeLinecap="round"
              strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aGia, 18)} />
            <path d="M 272 250 L 292 262 L 282 240" fill="none" stroke={C.red} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={lit(f, aGia + 14, 8)} />
          </svg>
        </Card>
      </div>
      {/* caption — the crowd laughs mid-storm */}
      <div style={{ position: "absolute", top: 1216, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aCuoi, 12), transform: `translateY(${interpolate(f - aCuoi, [0, 12], [22, 0], clamp)}px)` }}>
        <span style={{ color: C.text, fontSize: 42, fontWeight: 900, letterSpacing: 1 }}>ĐÁM ĐÔNG CƯỜI GIỮA CƠN BÃO</span>
      </div>
      {/* caveat stamp — the heaviest element of the scene */}
      <div style={{ position: "absolute", top: 1330, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center" }}>
        <div style={{ ...slam(aStamp, f, fps, 1.3), transformOrigin: "center", rotate: "-3deg", border: `4px solid ${C.amber}`, borderRadius: 16, padding: "20px 34px", textAlign: "center", background: "rgba(1,4,9,0.72)", ...(f >= aStamp ? glow("rgba(210,153,34,0.4)", 26) : {}) }}>
          <div style={{ color: C.amber, fontSize: 38, fontWeight: 900, letterSpacing: 1 }}>TÍN HIỆU PHỤ · ĐỘ TIN CẬY THẤP</div>
          <div style={{ color: C.text, fontSize: 28, fontWeight: 800, marginTop: 8 }}>— CHỈ DÙNG ĐỂ THẬN TRỌNG —</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S06 — BÓNG DÀI HẠN: hai cột từ vạch SMA200 (+16,1% vs +13,8% theo tỷ lệ thật)
// ---------------------------------------------------------------------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aHead = frameOf("s06", "Nhưng hãy nhìn bức tranh lớn hơn");
  const aHai = frameOf("s06", "Cả hai vẫn đứng trên đường hai trăm ngày");
  const aE = frameOf("s06", "Ether cao hơn mười sáu phẩy một");
  const aB = frameOf("s06", "Bitcoin cao hơn mười ba phẩy tám");
  const aChua = frameOf("s06", "chưa gãy");
  const aChot = frameOf("s06", "điều chỉnh sâu");
  const BASE_Y = 1250; // shared SMA200 baseline (absolute page y of the svg block)
  const H_ETH = 560;   // honest ratio 16,1 : 13,8
  const H_BTC = 480;
  const gE = spring({ frame: f - aE, fps, config: SPRING });
  const gB = spring({ frame: f - aB, fps, config: SPRING });
  const topE = BASE_Y - H_ETH;
  const topB = BASE_Y - H_BTC;
  const connP = lit(f, aChua, 12);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* header */}
      <div style={{ position: "absolute", top: 350, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aHead - 2, 8) }}>
        <span style={{ color: C.text, fontSize: 36, fontWeight: 900, fontFamily: MONO, letterSpacing: 0.5 }}>BỨC TRANH LỚN HƠN — ĐƯỜNG 200 NGÀY</span>
      </div>
      {/* twin columns rising from the shared SMA200 baseline */}
      <svg width={SAFE.w} height={840} viewBox={`0 0 ${SAFE.w} 840`} style={{ position: "absolute", left: SAFE.x, top: 430 }}>
        {/* baseline */}
        <line x1={40} x2={SAFE.w - 40} y1={820} y2={820} stroke={C.green} strokeWidth={4} opacity={0.25 + 0.55 * lit(f, aHai, 12)} />
        {/* ETH column — taller */}
        <rect x={150} y={820 - H_ETH * Math.max(0.001, gE)} width={220} height={H_ETH * Math.max(0.001, gE)} rx={12} fill="url(#colGradE)" stroke={C.green} strokeWidth={2.5} />
        {/* BTC column */}
        <rect x={550} y={820 - H_BTC * Math.max(0.001, gB)} width={220} height={H_BTC * Math.max(0.001, gB)} rx={12} fill="url(#colGradB)" stroke={C.green} strokeWidth={2.5} />
        <defs>
          <linearGradient id="colGradE" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(63,185,80,0.55)" />
            <stop offset="100%" stopColor="rgba(63,185,80,0.12)" />
          </linearGradient>
          <linearGradient id="colGradB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(63,185,80,0.55)" />
            <stop offset="100%" stopColor="rgba(63,185,80,0.12)" />
          </linearGradient>
        </defs>
        {/* connector between the two peaks — trend not broken on either side */}
        <line x1={270} y1={820 - H_ETH} x2={660} y2={820 - H_BTC} stroke={C.green} strokeWidth={3} strokeDasharray="12 10" opacity={0.75 * connP} />
      </svg>
      {/* column labels */}
      <div style={{ position: "absolute", top: topE - 88, left: 150, width: 220, textAlign: "center", opacity: lit(f, aE + 6, 8) }}>
        <div style={{ color: C.green, fontSize: 54, fontWeight: 900, fontFamily: FONT }}><CountUp at={aE} to={16.1} frames={30} decimals={1} /><span style={{ fontSize: 30 }}>%</span></div>
        <div style={{ color: C.textSoft, fontSize: 22, fontWeight: 700, fontFamily: MONO }}>ETH · vs SMA200</div>
      </div>
      <div style={{ position: "absolute", top: topB - 88, left: 550, width: 220, textAlign: "center", opacity: lit(f, aB + 6, 8) }}>
        <div style={{ color: C.green, fontSize: 54, fontWeight: 900, fontFamily: FONT }}><CountUp at={aB} to={13.8} frames={30} decimals={1} /><span style={{ fontSize: 30 }}>%</span></div>
        <div style={{ color: C.textSoft, fontSize: 22, fontWeight: 700, fontFamily: MONO }}>BTC · vs SMA200</div>
      </div>
      {/* axis label at the base */}
      <div style={{ position: "absolute", top: 1286, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aHai + 8, 10) }}>
        <span style={{ color: C.muted, fontSize: 24, fontWeight: 700, fontFamily: MONO }}>SMA200 · ETH 2.128,63 / BTC 71.798,14</span>
      </div>
      {/* verdict */}
      <div style={{ position: "absolute", top: 1408, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aChot, 10), transform: `translateY(${interpolate(f - aChot, [0, 12], [22, 0], clamp)}px)` }}>
        <span style={{ color: C.green, fontSize: 46, fontWeight: 900, letterSpacing: 1, ...(f >= aChot ? { textShadow: "0 0 34px rgba(63,185,80,0.4)" } : {}) }}>ĐIỀU CHỈNH SÂU — KHÔNG PHẢI SỤP ĐỔ</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S07 — HERO #2: HAI VẠCH ĐỎ SONG SONG (mood #2 + dual-panel, cùng độ cao)
// ---------------------------------------------------------------------------
// Panel-local scales (svg-local y, never offset by page — d-010):
//   ETH: y(p) = 560 + (2425 - p) * 1.8   (zone 2.400-2.450 center = 560)
//   BTC: y(p) = 560 + (80500 - p) * 0.07 (SMA50 80.500 line   = 560)
const S07_yE = (p: number): number => 560 + (2425 - p) * 1.8;
const S07_yB = (p: number): number => 560 + (80500 - p) * 0.07;

const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aHead = frameOf("s07", "Vậy mỗi bên phải giữ");
  const aVung = frameOf("s07", "vùng hai nghìn bốn trăm đến hai nghìn bốn trăm năm mươi");
  const aDay = frameOf("s07", "trùng đáy");
  const aBtc = frameOf("s07", "Bitcoin đúng tám mươi nghìn năm trăm");
  const aSong = frameOf("s07", "Hai tài sản hai vạch đỏ song song");
  const aChot = frameOf("s07", "Ai mất vạch");
  const zoneTop = S07_yE(2450);
  const zoneBot = S07_yE(2400);
  const dayY = S07_yE(2406); // ≈ zone floor
  const btcLineY = S07_yB(80500); // 560 — same height as ETH zone center
  const btcDotY = S07_yB(81676.34);
  const sweep = lit(f, aVung, 14);
  const pulse = 0.78 + 0.22 * Math.sin((f / 16) * Math.PI);
  const songP = lit(f, aSong, 10);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Img src={staticFile("eth-tradingagents-20261010/bg_s07.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.32 }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,17,23,0.86) 0%, rgba(13,17,23,0.58) 40%, rgba(13,17,23,0.92) 78%, #0D1117 100%)" }} />
      {/* header */}
      <div style={{ position: "absolute", top: 330, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aHead - 2, 10) }}>
        <span style={{ color: C.text, fontSize: 44, fontWeight: 900, letterSpacing: 1 }}>VÙNG SINH TỬ — MỖI BÊN MỘT VẠCH</span>
      </div>
      {/* ETH panel — the 2.400–2.450 zone */}
      <div style={{ position: "absolute", top: 440, left: SAFE.x, width: 440, height: 850, opacity: lit(f, aHead + 2, 10) }}>
        <Card style={{ position: "absolute", inset: 0, background: "rgba(22,27,34,0.72)" }}>
          <svg width={440} height={850} viewBox="0 0 440 850">
            {/* zone band — sweeps in narration order 2.400 → 2.450 */}
            <rect clipPath="url(#ethClip)" x={24} y={zoneTop} width={(440 - 48) * sweep} height={Math.max(2, (zoneBot - zoneTop) * sweep)} fill="url(#zoneGrad10)" />
            <defs>
              <clipPath id="ethClip"><rect x={24} y={zoneTop} width={440 - 48} height={zoneBot - zoneTop} rx={10} /></clipPath>
              <linearGradient id="zoneGrad10" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(210,153,34,0.42)" />
                <stop offset="100%" stopColor="rgba(248,81,73,0.42)" />
              </linearGradient>
            </defs>
            <rect x={24} y={zoneTop} width={440 - 48} height={Math.max(2, zoneBot - zoneTop)} rx={10} fill="none" stroke={C.red} strokeWidth={2.5} opacity={0.6 * sweep} />
            {/* descending path into the zone */}
            <path d={`M 40 ${S07_yE(2570)} C 140 ${S07_yE(2590)}, 240 ${S07_yE(2520)}, 320 ${S07_yE(2490)} S 390 ${S07_yE(2462)}, 402 ${S07_yE(2444)}`}
              fill="none" stroke="rgba(230,237,243,0.34)" strokeWidth={4} strokeLinecap="round"
              strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aHead + 8, 24)} />
            {/* 15/09 low — dotted, touches the zone floor */}
            <g opacity={lit(f, aDay, 10)}>
              <line x1={50} x2={390} y1={dayY} y2={dayY} stroke={C.amber} strokeWidth={3} strokeDasharray="10 10" opacity={0.85} />
            </g>
          </svg>
          <div style={{ position: "absolute", left: 34, top: zoneTop - 40, opacity: lit(f, aVung, 8) }}>
            <span style={{ background: "rgba(1,4,9,0.88)", border: `2px solid ${C.red}`, color: C.text, borderRadius: 8, padding: "4px 14px", fontSize: 27, fontWeight: 900, fontFamily: MONO }}>2.400 – 2.450</span>
          </div>
          <div style={{ position: "absolute", right: 40, top: dayY - 12, opacity: lit(f, aDay, 8) }}>
            <span style={{ color: C.amber, fontSize: 25, fontWeight: 800, fontFamily: MONO }}>ĐÁY 15/09</span>
          </div>
          <div style={{ position: "absolute", left: 34, bottom: 18 }}>
            <span style={{ color: C.textSoft, fontSize: 30, fontWeight: 900, fontFamily: MONO }}>ETH</span>
          </div>
        </Card>
      </div>
      {/* BTC panel — SMA50 80.500 holding the price */}
      <div style={{ position: "absolute", top: 440, left: 560, width: 440, height: 850, opacity: lit(f, aHead + 2, 10) }}>
        <Card style={{ position: "absolute", inset: 0, background: "rgba(22,27,34,0.72)" }}>
          <svg width={440} height={850} viewBox="0 0 440 850">
            {/* the red threshold — glows, HOLDS the price above it */}
            <g opacity={lit(f, aBtc, 10)}>
              <line x1={24} x2={416} y1={btcLineY} y2={btcLineY} stroke={C.red} strokeWidth={6} opacity={0.55 + 0.45 * pulse * (0.5 + 0.5 * songP)} />
              <line x1={24} x2={416} y1={btcLineY - 3} y2={btcLineY - 3} stroke="rgba(248,81,73,0.18)" strokeWidth={14} />
            </g>
            {/* price dot resting above the line */}
            <circle cx={330} cy={btcDotY} r={11} fill={C.text} opacity={lit(f, aBtc + 10, 8)} />
            {/* path above the threshold */}
            <path d={`M 40 ${S07_yB(81300)} C 140 ${S07_yB(81550)}, 230 ${S07_yB(81200)}, 330 ${btcDotY}`}
              fill="none" stroke="rgba(230,237,243,0.34)" strokeWidth={4} strokeLinecap="round"
              strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aBtc + 4, 20)} />
          </svg>
          <div style={{ position: "absolute", left: 34, top: btcLineY - 44, opacity: lit(f, aBtc, 8) }}>
            <span style={{ background: "rgba(1,4,9,0.88)", border: `2px solid ${C.red}`, color: C.red, borderRadius: 8, padding: "4px 14px", fontSize: 27, fontWeight: 900, fontFamily: MONO }}>SMA50 80.500</span>
          </div>
          <div style={{ position: "absolute", right: 40, top: btcDotY - 58, opacity: lit(f, aBtc + 10, 8) }}>
            <span style={{ background: "rgba(1,4,9,0.88)", color: C.text, borderRadius: 8, padding: "5px 14px", fontSize: 26, fontWeight: 800, fontFamily: MONO }}>81.676,34</span>
          </div>
          <div style={{ position: "absolute", left: 34, bottom: 18 }}>
            <span style={{ color: C.textSoft, fontSize: 30, fontWeight: 900, fontFamily: MONO }}>BTC</span>
          </div>
        </Card>
      </div>
      {/* synchronized blink line connecting both thresholds at 'song song' */}
      <div style={{ position: "absolute", top: 440 + 560 - 2, left: SAFE.x, right: SAFE.x, height: 4, opacity: 0.5 * songP * pulse, background: `linear-gradient(90deg, rgba(210,153,34,0.0), rgba(248,81,73,0.85), rgba(248,81,73,0.85), rgba(210,153,34,0.0))`, filter: "blur(1px)" }} />
      {/* the verdict of the episode */}
      <div style={{ position: "absolute", top: 1400, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center" }}>
        <span style={{ ...slam(aChot, f, fps, 1.35), display: "inline-block", color: C.amber, fontSize: 48, fontWeight: 900, letterSpacing: 2, border: `3.5px solid ${C.red}`, borderRadius: 14, padding: "10px 32px", background: "rgba(1,4,9,0.72)", ...(f >= aChot ? glow("rgba(210,153,34,0.45)", 26) : {}) }}>
          AI MẤT VẠCH — NGƯỜI ĐÓ MẤT CẤU TRÚC
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S08 — KỊCH BẢN NẾU GIỮ: cây bậc hai panel + con dấu vô hiệu
// ---------------------------------------------------------------------------
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aHead = frameOf("s08", "Kịch bản chỉ nói theo điều kiện");
  const aRootE = frameOf("s08", "Nếu Ether giữ hai nghìn bốn trăm");
  const aS1 = frameOf("s08", "test hai nghìn năm trăm năm mươi");
  const aS2 = frameOf("s08", "rồi hai nghìn sáu trăm ba mươi bốn");
  const aRootB = frameOf("s08", "Nếu Bitcoin giữ tám mươi nghìn năm trăm");
  const aTB = frameOf("s08", "test tám mươi tư nghìn");
  const aVh = frameOf("s08", "Nhánh này vô hiệu khi nào");
  const aDong = frameOf("s08", "Khi giá đóng cửa ngày dưới vạch");
  const dim = 1 - 0.45 * lit(f, aVh, 14);
  const Step: React.FC<{ top: number; at: number; main: string; sub?: string; color?: string; align?: "left" | "right" }> = ({ top, at, main, sub, color = C.green, align = "left" }) => (
    <div style={{
      position: "absolute", top, left: align === "left" ? 24 : 110, right: 24,
      opacity: lit(f, at + 4, 10), transform: `translateY(${interpolate(f - at, [0, 12], [24, 0], clamp)}px)`,
    }}>
      <Card style={{ padding: "14px 20px", border: `2.5px solid ${color}`, ...(f >= at ? glow("rgba(63,185,80,0.18)", 16) : {}) }}>
        <div style={{ color: C.text, fontSize: 34, fontWeight: 900, fontFamily: FONT, whiteSpace: "nowrap" }}>{main}</div>
        {sub ? <div style={{ marginTop: 6 }}><Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 19, fontFamily: MONO }}>{sub}</Chip></div> : null}
      </Card>
    </div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* header */}
      <div style={{ position: "absolute", top: 340, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aHead - 2, 8) }}>
        <span style={{ color: C.text, fontSize: 36, fontWeight: 900, fontFamily: MONO, letterSpacing: 0.5 }}>KỊCH BẢN — CHỈ NÓI THEO <span style={{ color: C.green, textShadow: f >= aHead ? "0 0 26px rgba(63,185,80,0.55)" : "none" }}>ĐIỀU KIỆN</span></span>
      </div>
      {/* tree — dims as the invalidity question lands */}
      <div style={{ position: "absolute", top: 450, left: SAFE.x, right: SAFE.x, height: 880, opacity: dim }}>
        {/* ETH ladder */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 440, height: 850 }}>
          <svg width={440} height={850} viewBox="0 0 440 850" style={{ position: "absolute", inset: 0 }}>
            <path d="M 220 130 C 220 200, 220 220, 220 290" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aS1, 16)} />
            <path d="M 220 460 C 220 530, 220 550, 220 620" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aS2, 16)} />
            <path d="M 208 602 L 220 634 L 232 602" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={lit(f, aS2 + 14, 6)} />
          </svg>
          <div style={{ position: "absolute", top: 20, left: 24, right: 24, opacity: lit(f, aRootE, 10) }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, border: `2.5px solid ${C.green}`, background: C.greenFill, borderRadius: 14, padding: "12px 22px", ...(f >= aRootE ? glow("rgba(63,185,80,0.22)", 18) : {}) }}>
              <span style={{ color: C.green, fontSize: 32, fontWeight: 900, letterSpacing: 3 }}>NẾU</span>
              <span style={{ color: C.text, fontSize: 32, fontWeight: 900, fontFamily: MONO }}>GIỮ 2.400</span>
            </div>
          </div>
          <Step top={296} at={aS1} main="TEST 2.550" sub="SMA50 CŨ" />
          <Step top={640} at={aS2} main="2.634" sub="KHÁNG CỰ NGẮN HẠN" />
        </div>
        {/* BTC ladder */}
        <div style={{ position: "absolute", top: 0, left: 480, width: 440, height: 850 }}>
          <svg width={440} height={850} viewBox="0 0 440 850" style={{ position: "absolute", inset: 0 }}>
            <path d="M 220 130 C 220 220, 220 260, 220 340" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aTB, 16)} />
            <path d="M 208 322 L 220 354 L 232 322" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={lit(f, aTB + 14, 6)} />
          </svg>
          <div style={{ position: "absolute", top: 20, left: 24, right: 24, opacity: lit(f, aRootB, 10) }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, border: `2.5px solid ${C.green}`, background: C.greenFill, borderRadius: 14, padding: "12px 22px", ...(f >= aRootB ? glow("rgba(63,185,80,0.22)", 18) : {}) }}>
              <span style={{ color: C.green, fontSize: 32, fontWeight: 900, letterSpacing: 3 }}>NẾU</span>
              <span style={{ color: C.text, fontSize: 32, fontWeight: 900, fontFamily: MONO }}>GIỮ 80.500</span>
            </div>
          </div>
          <Step top={360} at={aTB} main="TEST 84.033,10" />
        </div>
      </div>
      {/* invalidity stamp */}
      <div style={{ position: "absolute", top: 1370, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center" }}>
        <span style={{ ...slam(aDong, f, fps, 1.2), display: "inline-block", border: `3.5px solid ${C.red}`, color: C.red, borderRadius: 12, padding: "10px 28px", fontSize: 33, fontWeight: 900, fontFamily: MONO, letterSpacing: 0.5, background: "rgba(1,4,9,0.72)", textAlign: "center", ...(f >= aDong + 4 ? glow("rgba(248,81,73,0.45)", 26) : {}) }}>
          VÔ HIỆU KHI: ĐÓNG CỬA NGÀY &lt; VẠCH<br /><span style={{ fontSize: 27, color: C.text }}>(ETH 2.400 / BTC 80.500)</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S09 — KỊCH BẢN NẾU MẤT VẠCH: thang rơi kép + digit-wise 71.798
// ---------------------------------------------------------------------------
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const aHead = frameOf("s09", "Và nếu mất vạch");
  const a2k4 = frameOf("s09", "đóng cửa dưới hai nghìn bốn trăm");
  const a2128 = frameOf("s09", "hai nghìn một trăm hai mươi tám");
  const aDem = frameOf("s09", "vùng đệm");
  const aSau = frameOf("s09", "rồi sâu hẳn");
  const d7a = frameOf("s09", "bảy mốt");                              // '7'
  const d1 = frameOf("s09", "mốt");                                    // '1'
  const d7b = frameOf("s09", (w) => w.word === "bảy" && w.start > 8.3); // '7' #2
  const d9 = frameOf("s09", (w) => w.word === "chín");                 // '9'
  const d8 = frameOf("s09", (w) => w.word === "tám" && w.start > 8.5);  // '8'
  const aKl = frameOf("s09", "Theo dõi thêm khối lượng");
  const aChot = frameOf("s09", "Không phán đoán");
  const digits: { d: string; at: number }[] = [
    { d: "7", at: d7a }, { d: "1", at: d1 }, { d: "7", at: d7b }, { d: "9", at: d9 }, { d: "8", at: d8 },
  ];
  const fullOp = lit(f, d8 + 10, 10);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* header */}
      <div style={{ position: "absolute", top: 330, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aHead - 2, 8) }}>
        <span style={{ color: C.text, fontSize: 56, fontWeight: 900, letterSpacing: 2 }}>NẾU <span style={{ color: C.red }}>MẤT</span> VẠCH</span>
      </div>
      {/* ETH falling ladder */}
      <div style={{ position: "absolute", top: 440, left: SAFE.x, width: 440, height: 860, opacity: lit(f, aHead + 4, 10) }}>
        <Card style={{ position: "absolute", inset: 0 }}>
          <svg width={440} height={860} viewBox="0 0 440 860">
            {/* the lost threshold */}
            <g opacity={lit(f, a2k4, 10)}>
              <line x1={30} x2={410} y1={90} y2={90} stroke={C.red} strokeWidth={4} strokeDasharray="14 10" opacity={0.8} />
            </g>
            {/* dark void */}
            <rect x={70} y={110} width={300} height={560} rx={14} fill="#05070A" opacity={0.6} />
            {/* arrow down through the void */}
            <path d="M 220 100 C 220 260, 220 460, 220 660" fill="none" stroke={C.red} strokeWidth={6} strokeLinecap="round"
              strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, a2128, 30)} />
            <path d="M 206 640 L 220 672 L 234 640" fill="none" stroke={C.red} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={lit(f, a2128 + 26, 6)} />
            {/* destination node — 200 SMA */}
            <line x1={40} x2={400} y1={690} y2={690} stroke={C.red} strokeWidth={4} opacity={0.25 + 0.6 * lit(f, a2128, 12)} />
          </svg>
          <div style={{ position: "absolute", left: 34, top: 50, opacity: lit(f, a2k4, 8) }}>
            <span style={{ color: C.red, fontSize: 27, fontWeight: 900, fontFamily: MONO }}>&lt; 2.400</span>
          </div>
          <div style={{ position: "absolute", left: 34, top: 648, opacity: lit(f, a2128, 8) }}>
            <span style={{ background: "rgba(1,4,9,0.88)", border: `2px solid ${C.red}`, color: C.red, borderRadius: 10, padding: "6px 16px", fontSize: 28, fontWeight: 900, fontFamily: MONO, ...(f >= a2128 ? glow("rgba(248,81,73,0.3)", 18) : {}) }}>200 SMA 2.128,63</span>
          </div>
          <div style={{ position: "absolute", left: 34, bottom: 18 }}>
            <span style={{ color: C.textSoft, fontSize: 30, fontWeight: 900, fontFamily: MONO }}>ETH</span>
          </div>
        </Card>
      </div>
      {/* BTC falling ladder — đệm then deep, digit-wise */}
      <div style={{ position: "absolute", top: 440, left: 560, width: 440, height: 860, opacity: lit(f, aHead + 4, 10) }}>
        <Card style={{ position: "absolute", inset: 0 }}>
          <svg width={440} height={860} viewBox="0 0 440 860">
            <g opacity={lit(f, aHead + 10, 10)}>
              <line x1={30} x2={410} y1={90} y2={90} stroke={C.red} strokeWidth={4} strokeDasharray="14 10" opacity={0.8} />
            </g>
            {/* the thin cushion, dimmer */}
            <g opacity={0.55 * lit(f, aDem, 10)}>
              <line x1={60} x2={380} y1={300} y2={300} stroke={C.muted} strokeWidth={3.5} strokeDasharray="8 8" />
            </g>
            <rect x={70} y={110} width={300} height={560} rx={14} fill="#05070A" opacity={0.6} />
            {/* arrow: pierces the cushion, falls deep */}
            <path d="M 220 100 C 220 180, 220 240, 220 300" fill="none" stroke={C.red} strokeWidth={6} strokeLinecap="round"
              strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aDem, 16)} />
            <path d="M 220 300 C 220 420, 220 520, 220 660" fill="none" stroke={C.red} strokeWidth={6} strokeLinecap="round"
              strokeDasharray="100" pathLength={100} strokeDashoffset={drawP(f, aSau, 24)} />
            <path d="M 206 640 L 220 672 L 234 640" fill="none" stroke={C.red} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={lit(f, aSau + 20, 6)} />
            <line x1={40} x2={400} y1={690} y2={690} stroke={C.red} strokeWidth={4} opacity={0.25 + 0.6 * lit(f, aSau, 12)} />
          </svg>
          <div style={{ position: "absolute", left: 34, top: 50, opacity: lit(f, aHead + 10, 8) }}>
            <span style={{ color: C.red, fontSize: 27, fontWeight: 900, fontFamily: MONO }}>&lt; 80.500</span>
          </div>
          <div style={{ position: "absolute", right: 40, top: 262, opacity: 0.7 * lit(f, aDem, 8) }}>
            <span style={{ color: C.muted, fontSize: 24, fontWeight: 800, fontFamily: MONO }}>ĐỆM 81.078,29</span>
          </div>
          {/* digit-wise: 7 · 1 · 7 · 9 · 8 land with each spoken group, then assemble */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 710, display: "flex", justifyContent: "center", gap: 12 }}>
            {digits.map((dg, i) => (
              <div key={i} style={{
                width: 58, height: 66, borderRadius: 12, border: `2.5px solid ${C.red}`, background: "rgba(1,4,9,0.85)",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: lit(f, dg.at, 6), transform: `scale(${interpolate(f - dg.at, [0, 8], [1.5, 1], clamp)})`,
                ...(f >= dg.at ? glow("rgba(248,81,73,0.28)", 14) : {}),
              }}>
                <span style={{ color: C.red, fontSize: 40, fontWeight: 900, fontFamily: MONO }}>{f >= dg.at ? dg.d : ""}</span>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 792, textAlign: "center", opacity: fullOp }}>
            <span style={{ color: C.text, fontSize: 30, fontWeight: 900, fontFamily: MONO }}>SÂU: 71.798,14 · SMA200</span>
          </div>
          <div style={{ position: "absolute", left: 34, bottom: 18 }}>
            <span style={{ color: C.textSoft, fontSize: 30, fontWeight: 900, fontFamily: MONO }}>BTC</span>
          </div>
        </Card>
      </div>
      {/* volume watch chip */}
      <div style={{
        position: "absolute", top: 1330, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aKl, 10), transform: `translateY(${interpolate(f - aKl, [0, 10], [18, 0], clamp)}px)`,
      }}>
        <Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 27, fontWeight: 900, ...(f >= aKl ? glow("rgba(210,153,34,0.3)", 18) : {}) }}>THEO DÕI KHỐI LƯỢNG</Chip>
      </div>
      {/* neutral lock */}
      <div style={{
        position: "absolute", top: 1430, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aChot, 10), transform: `translateY(${interpolate(f - aChot, [0, 10], [18, 0], clamp)}px)`,
      }}>
        <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 28, fontWeight: 900, letterSpacing: 0.5, ...(f >= aChot ? glow("rgba(88,166,255,0.3)", 20) : {}) }}>
          KHÔNG PHÁN ĐOÁN — CHỈ THEO DÕI MỐC + KHỐI LƯỢNG
        </Chip>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S10 — POLL + THEO DÕI + DISCLAIMER (banner giữ đến hết)
// ---------------------------------------------------------------------------
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aPoll = frameOf("s10", "Theo bạn Ether chạm");
  const aCham = frameOf("s10", "chạm hai nghìn một trăm hai mươi tám");
  const aGiu = frameOf("s10", "hay giữ hai nghìn bốn trăm");
  const aBinh = frameOf("s10", "Bình chọn bên dưới");
  const aFollow = frameOf("s10", "Theo dõi kênh");
  const aBanner = frameOf("s10", "phân tích tham khảo");
  const aNo = frameOf("s10", "không phải lời khuyên đầu tư");
  const nudge = interpolate(f - aBinh, [0, 6, 12], [0, 10, 0], clamp);
  const invite = 0.6 + 0.4 * Math.sin((f / 10) * Math.PI);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #0D1117 0%, #161B22 100%)" }} />
      {/* binary poll — reuses exactly the two numbers already read in s09 */}
      <div style={{ position: "absolute", top: 400, left: SAFE.x, right: SAFE.x, textAlign: "center", ...slam(aPoll, f, fps, 1.25) }}>
        <div style={{ color: C.textSoft, fontSize: 40, fontWeight: 900, fontFamily: MONO, letterSpacing: 2 }}>ETHER:</div>
        <div style={{ color: C.text, fontSize: 72, fontWeight: 900, lineHeight: 1.15, letterSpacing: 1 }}>CHẠM 2.128<br />HAY GIỮ 2.400?</div>
      </div>
      {/* two buttons — CHẠM first (spoken first), then GIỮ */}
      <div style={{ position: "absolute", top: 760, left: SAFE.x, right: SAFE.x, display: "flex", gap: 24, justifyContent: "center", alignItems: "stretch", transform: `translateY(${nudge}px)` }}>
        <div style={{
          opacity: lit(f, aCham, 10), transform: `translateX(${interpolate(f - aCham, [0, 12], [-40, 0], clamp)}px)`,
          border: `3px solid ${C.red}`, boxShadow: `0 0 ${18 + 16 * invite}px rgba(248,81,73,${0.25 + 0.3 * invite})`,
          borderRadius: 18, padding: "20px 44px", background: C.redFill,
        }}>
          <div style={{ color: C.red, fontSize: 50, fontWeight: 900 }}>CHẠM 2.128 👇</div>
        </div>
        <div style={{
          opacity: lit(f, aGiu, 10), transform: `translateX(${interpolate(f - aGiu, [0, 12], [40, 0], clamp)}px)`,
          border: `3px solid ${C.green}`, boxShadow: `0 0 ${18 + 16 * invite}px rgba(63,185,80,${0.25 + 0.3 * invite})`,
          borderRadius: 18, padding: "20px 44px", background: C.greenFill,
        }}>
          <div style={{ color: C.green, fontSize: 50, fontWeight: 900 }}>GIỮ 2.400 ✋</div>
        </div>
      </div>
      {/* follow chip */}
      <div style={{
        position: "absolute", top: 1030, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aFollow, 10), transform: `translateY(${interpolate(f - aFollow, [0, 10], [20, 0], clamp)}px)`,
      }}>
        <Chip color={C.green} fill={C.greenFill} style={{ fontSize: 28, fontWeight: 900, ...(f >= aFollow ? glow("rgba(63,185,80,0.3)", 18) : {}) }}>
          THEO DÕI KÊNH — HAI VẠCH ĐỎ MỖI PHIÊN
        </Chip>
      </div>
      {/* disclaimer banner — syncs the spoken words, holds to the last frame */}
      <div style={{
        position: "absolute", top: 1230, left: SAFE.x + 30, right: SAFE.x + 30,
        opacity: lit(f, aBanner, 12), transform: `translateY(${interpolate(f - aBanner, [0, 12], [28, 0], clamp)}px)`,
      }}>
        <div style={{
          border: `${f >= aNo ? 5 : 3}px solid ${C.amber}`, borderRadius: 18, padding: "26px 30px", textAlign: "center",
          background: "rgba(1,4,9,0.75)", ...(f >= aNo ? glow("rgba(210,153,34,0.4)", 26) : {}),
        }}>
          <div style={{ color: C.amber, fontSize: 42, fontWeight: 900, letterSpacing: 1 }}>PHÂN TÍCH THAM KHẢO</div>
          <div style={{ color: C.text, fontSize: 42, fontWeight: 900, letterSpacing: 1, marginTop: 6, opacity: lit(f, aNo, 10) }}>KHÔNG PHẢI LỜI KHUYÊN ĐẦU TƯ</div>
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

export const EthTradingAgents20261010: React.FC = () => (
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
    <Audio src={staticFile("eth-tradingagents-20261010/narration_full.wav")} volume={1} />
    <Audio
      src={staticFile("eth-tradingagents-20261010/bgm.mp3")}
      volume={(fr) =>
        BGM_VOLUME *
        Math.min(1, fr / BGM_FADE_IN) *
        Math.min(1, Math.max(0, (TOTAL_FRAMES - fr) / BGM_FADE_OUT))
      }
    />
  </AbsoluteFill>
);
