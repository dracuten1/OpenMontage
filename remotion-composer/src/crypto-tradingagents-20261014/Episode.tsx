// Episode.tsx — crypto-tradingagents-20261014 (VERTICAL 1080x1920 @30fps, 9 scenes).
// Bespoke dark-fintech-terminal composition, speech-locked via timing.ts frameOf()
// (GREEDY-JOIN multi-word anchors). Series mechanics (btc08/eth09/eth10/cta13):
// Card/Chip/slam/CountUp/lit, layer badge, verdict stamp, hard cuts, static
// camera, vi-VN display, TSX-only data from the
// 12/10 single-session digest — NO daily series, no gen-number images.
// Animation order == speech order; list staggers are subtraction-only
// (X - i*step), never +i*step. Local SVG yOf maps into the viewBox only
// (no page offset, d-010).
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { C, FONT, MONO, SAFE, FPS, fmtVi } from "./theme";
import { SCENE_TIMING, TOTAL_FRAMES, frameOf } from "./timing";
import captionsJson from "../../public/crypto-tradingagents-20261014/captions_speechlocked.json";

const clampX = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const lit = (f: number, at: number, d = 8) =>
  interpolate(f, [at, at + d], [0, 1], clampX);
const sp = (f: number, at: number) =>
  spring({
    frame: Math.max(0, f - at),
    fps: FPS,
    config: { damping: 18, mass: 0.9, stiffness: 170 },
  });

const Slam: React.FC<{
  at: number;
  rotate?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, rotate = 0, style, children }) => {
  const f = useCurrentFrame();
  const s = sp(f, at);
  return (
    <div
      style={{
        opacity: interpolate(f, [at, at + 6], [0, 1], clampX),
        transform: `rotate(${rotate}deg) scale(${1 + 0.45 * (1 - s)})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Chip: React.FC<{
  t: string;
  c: string;
  bg?: string;
  fs?: number;
  style?: React.CSSProperties;
}> = ({ t, c, bg = "transparent", fs = 28, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      border: `1.5px solid ${c}`,
      borderRadius: 12,
      padding: "10px 20px",
      background: bg,
      color: c,
      fontWeight: 700,
      fontSize: fs,
      letterSpacing: 1,
      fontFamily: FONT,
      maxWidth: 820,
      whiteSpace: "normal",
      textAlign: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      ...style,
    }}
  >
    {t}
  </div>
);

const Num: React.FC<{ v: number; dec?: number; style?: React.CSSProperties }> = ({
  v,
  dec = 0,
  style,
}) => (
  <span style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", ...style }}>
    {fmtVi(v, dec)}
  </span>
);

const CountUp: React.FC<{ at: number; to: number; dec?: number }> = ({ at, to, dec = 0 }) => {
  const f = useCurrentFrame();
  const p = Math.pow(interpolate(f, [at, at + 36], [0, 1], clampX), 0.6);
  return <Num v={to * p} dec={dec} />;
};

const Card: React.FC<{
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ style, children }) => (
  <div
    style={{
      background: C.surface,
      border: "1.5px solid #30363D",
      borderRadius: 22,
      boxSizing: "border-box",
      ...style,
    }}
  >
    {children}
  </div>
);

const Badge: React.FC<{ label: string; c: string }> = ({ label, c }) => (
  <div style={{ position: "absolute", left: SAFE.x, top: 128 }}>
    <Chip t={label} c={c} fs={24} />
  </div>
);

const BadgeDouble: React.FC = () => (
  <div style={{ position: "absolute", left: SAFE.x, top: 128, display: "flex", gap: 12 }}>
    <Chip t="QUAN SÁT" c={C.blue} fs={24} />
    <Chip t="KỊCH BẢN" c={C.text} fs={24} />
  </div>
);

// Mood canvas stays static; all numbers are TSX overlays.
const MoodBg: React.FC<{ src: string }> = ({ src }) => {
  return (
    <AbsoluteFill>
      <img
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.32, transform: "scale(1)" }}
      />
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.58)" }} />
    </AbsoluteFill>
  );
};

const glow = (c: string, px: number) => `0 0 ${px}px ${c}`;

// Verdict stamp (con dấu pháp lý): slam + rotate + outline + glow.
const Stamp: React.FC<{
  at: number;
  c: string;
  rotate?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, c, rotate = -3, style, children }) => {
  const f = useCurrentFrame();
  const s = sp(f, at);
  const k = lit(f, at, 10);
  return (
    <div
      style={{
        transform: `rotate(${rotate}deg) scale(${1 + 0.5 * (1 - s)})`,
        opacity: interpolate(f, [at, at + 5], [0, 1], clampX),
        border: `3px solid ${c}`,
        outline: `1.5px solid ${c}`,
        outlineOffset: 5,
        borderRadius: 10,
        maxWidth: 820,
        boxSizing: "border-box",
        textAlign: "center",
        padding: "16px 30px",
        background: "rgba(13,17,23,0.78)",
        boxShadow: `0 0 ${12 + k * 18}px ${c}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Horizontal reference rule; label sits right-aligned above the line.
const Rule: React.FC<{
  at: number;
  c: string;
  label: React.ReactNode;
  labelC?: string;
  drop?: boolean;
  dur?: number;
  hot?: number;
  fs?: number;
}> = ({ at, c, label, labelC, drop = false, dur = 10, hot = 0, fs = 26 }) => {
  const f = useCurrentFrame();
  const k = lit(f, at, dur);
  return (
    <div style={{ width: "100%", position: "relative", marginBottom: 30 }}>
      <div
        style={{
          color: labelC ?? c,
          fontWeight: 700,
          fontSize: fs,
          fontFamily: MONO,
          textAlign: "right",
          marginBottom: 6,
          opacity: k,
        }}
      >
        {label}
      </div>
      <div
        style={{
          height: 4,
          background: c,
          borderRadius: 2,
          transform: `scaleX(${k}) translateY(${drop ? -8 * (1 - k) : 0}px)`,
          transformOrigin: "left center",
          boxShadow: glow(c, 10 + hot * 14),
        }}
      />
    </div>
  );
};

const ArrowNE: React.FC<{ c: string; s?: number }> = ({ c, s = 50 }) => (
  <svg width={s} height={s} viewBox="0 0 54 54">
    <line x1={8} y1={46} x2={40} y2={14} stroke={c} strokeWidth={6} strokeLinecap="round" />
    <polyline points="20,12 42,12 42,34" fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowSE: React.FC<{ c: string; s?: number }> = ({ c, s = 50 }) => (
  <svg width={s} height={s} viewBox="0 0 54 54">
    <line x1={8} y1={8} x2={40} y2={40} stroke={c} strokeWidth={6} strokeLinecap="round" />
    <polyline points="20,42 42,42 42,20" fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Digit-wise reveal span (marker numbers read digit-group by digit-group).
const Dig: React.FC<{ f: number; at: number; c?: string; fs?: number; children: string }> = ({
  f, at, c = C.text, fs = 46, children,
}) => (
  <span style={{ color: c, fontFamily: MONO, fontWeight: 800, fontSize: fs, opacity: lit(f, at) }}>
    {children}
  </span>
);

// Mini RSI gauge: local-viewBox horizontal track, needle sweeps to rsi,
// threshold tick + "30" label ONLY (no other numeric ticks — s07 rule).
const RsiMini: React.FC<{ at: number; thr: number; thrAt: number; rsi: number; w?: number }> = ({
  at, thr, thrAt, rsi, w = 250,
}) => {
  const f = useCurrentFrame();
  const k = sp(f, at);
  const x = (v: number) => 12 + (v / 100) * (w - 24);
  const kThr = lit(f, thrAt);
  return (
    <svg width={w} height={58} viewBox={`0 0 ${w} 58`}>
      <line x1={12} y1={26} x2={w - 12} y2={26} stroke="#30363D" strokeWidth={6} strokeLinecap="round" />
      <line x1={x(thr)} y1={10} x2={x(thr)} y2={42} stroke={C.amber} strokeWidth={3} opacity={kThr} />
      <text x={x(thr)} y={54} fill={C.amber} fontSize={15} fontFamily={MONO} textAnchor="middle" opacity={kThr}>30</text>
      <line x1={12} y1={26} x2={12 + (x(rsi) - 12) * k} y2={26} stroke={C.muted} strokeWidth={6} strokeLinecap="round" />
      <circle cx={12 + (x(rsi) - 12) * k} cy={26} r={8} fill={C.text} />
    </svg>
  );
};

// ---------------- s01 — HOOK: ba lane, một trạng thái ----------------
const LANE_W = 280;
const Lane: React.FC<{
  at: number; at10: number; at200: number; atClose: number;
  tick: string; left: number; w: number;
}> = ({ at, at10, at200, atClose, tick, left, w }) => {
  const f = useCurrentFrame();
  const blink = Math.max(0, Math.sin((f - atClose) / 4));
  return (
    <Card style={{ position: "absolute", left, top: 420, width: w, height: 720, padding: 16, opacity: lit(f, at) }}>
      <div style={{ color: C.text, fontWeight: 800, fontSize: 34, textAlign: "center" }}>{tick}</div>
      <svg width="100%" height={540} viewBox={`0 0 ${LANE_W} 540`} preserveAspectRatio="xMidYMid meet">
        <line x1={10} y1={90} x2={270} y2={90} stroke={C.muted} strokeWidth={3} strokeDasharray="9 7" opacity={0.75 * lit(f, at10)} />
        <text x={140} y={65} fill={C.muted} fontSize={25} fontFamily={FONT} fontWeight={700} textAnchor="middle" opacity={lit(f, at10)}>ĐƯỜNG 10 NGÀY</text>
        {/* Schematic close marker only: no invented open, high, or wick. */}
        <circle cx={140} cy={365} r={24} fill={C.red} opacity={(0.3 + 0.4 * blink) * lit(f, atClose)} />
        <circle cx={140} cy={365} r={12} fill={C.text} opacity={lit(f, atClose)} />
        <text x={140} y={415} fill={C.red} fontSize={25} fontFamily={FONT} fontWeight={800} textAnchor="middle" opacity={lit(f, atClose)}>ĐÓNG SÁT ĐÁY</text>
        <line x1={10} y1={500} x2={270} y2={500} stroke={C.green} strokeWidth={3.5} opacity={lit(f, at200)} />
        <text x={140} y={534} fill={C.green} fontSize={25} fontFamily={FONT} fontWeight={700} textAnchor="middle" opacity={lit(f, at200)}>ĐƯỜNG 200 NGÀY</text>
      </svg>
    </Card>
  );
};

const S01: React.FC = () => {
  const aChip = frameOf("s01", "Nến ngày mười hai tháng mười");
  const aBtc = frameOf("s01", "Bitcoin");
  const aEth = frameOf("s01", "Ether");
  const aSol = frameOf("s01", "Xôlana");
  const aClose = frameOf("s01", "cùng đóng cửa sát đáy phiên");
  const a10 = frameOf("s01", "cùng dưới đường mười ngày");
  const a200 = frameOf("s01", "trên đường hai trăm ngày");
  const aGold = frameOf("s01", "dài hạn chưa gãy");
  const aQ = frameOf("s01", "Khác biệt nằm ở đâu");
  return (
    <AbsoluteFill>
      <MoodBg src="crypto-tradingagents-20261014/bg_s01_mood.png" />
      <Badge label="QUAN SÁT" c={C.blue} />
      <div style={{ position: "absolute", left: 0, width: 1080, top: 250, display: "flex", justifyContent: "center" }}>
        <Slam at={aChip}>
          <Chip t="NẾN NGÀY 12/10" c={C.blue} bg={C.blueFill} fs={30} />
        </Slam>
      </div>
      {/* 3 lane dọc theo thứ tự đọc Bitcoin → Ether → Solana */}
      <Lane at={aBtc} at10={a10 - 6} at200={a200 - 6} atClose={aClose} left={SAFE.x} w={296} tick="BTC" />
      <Lane at={aEth} at10={a10 - 3} at200={a200 - 3} atClose={aClose} left={392} w={296} tick="ETH" />
      <Lane at={aSol} at10={a10} at200={a200} atClose={aClose} left={704} w={296} tick="SOL" />
      {/* Chip vàng đóng dấu */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1250, display: "flex", justifyContent: "center" }}>
        <Slam at={aGold}>
          <Chip t="NGẮN HẠN YẾU — DÀI HẠN CHƯA GÃY" c={C.amber} bg={C.amberFill} fs={28} />
        </Slam>
      </div>
      {/* Câu hỏi nâng nửa tông */}
      <div style={{ position: "absolute", left: SAFE.x, width: SAFE.w, top: 1500 }}>
        <Slam at={aQ}>
          <div style={{ color: C.blue, fontWeight: 800, fontSize: 44, textAlign: "center", letterSpacing: 1 }}>
            KHÁC BIỆT NẰM Ở ĐÂU?
          </div>
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s02 — Bitcoin: giá giữa thang bậc, sát mép dải dưới ----------------
const S02: React.FC = () => {
  const f = useCurrentFrame();
  const aCount = frameOf("s02", "tám mươi mốt nghìn bảy trăm sáu mươi hai");
  const aLow = frameOf("s02", "tám mươi đô chín mươi ba");
  const aE10 = frameOf("s02", "đường mười ngày");
  const aMid = frameOf("s02", "đường giữa dải dao động");
  const aP1 = frameOf("s02", "âm một phẩy tám ba");
  const aP2 = frameOf("s02", "âm hai phẩy sáu bảy");
  const a50 = frameOf("s02", "đường năm mươi ngày");
  const a200 = frameOf("s02", "hai trăm ngày");
  const a091 = frameOf("s02", "không phẩy chín một");
  const a1349 = frameOf("s02", "mười ba phẩy bốn chín");
  const aSat = frameOf("s02", "Sát mép dải dưới");
  const aBand = frameOf("s02", "tám mốt, năm, ba, chín");
  const a027 = frameOf("s02", "không phẩy hai bảy");
  const aInd = frameOf("s02", "RSI");
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      {/* Stat card CountUp speech-locked */}
      <div style={{ position: "absolute", left: SAFE.x, top: 300, width: SAFE.w, opacity: lit(f, aCount) }}>
        <Card style={{ padding: "26px 30px", display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", borderColor: "rgba(88,166,255,0.4)" }}>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 34 }}>BTC</span>
          <span style={{ color: C.blue, fontWeight: 800, fontSize: 52 }}>
            <CountUp at={aCount} to={81762.56} dec={2} />
          </span>
          <span style={{ color: C.blue, fontWeight: 700, fontSize: 28 }}>USD · ĐÓNG CỬA 12/10</span>
        </Card>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: 480, opacity: lit(f, aLow) }}>
        <Slam at={aLow}>
          <Chip t="+80,93 USD TRÊN ĐÁY PHIÊN 81.681,63" c={C.blue} bg={C.blueFill} fs={26} style={{ whiteSpace: "nowrap" }} />
        </Slam>
      </div>
      {/* Thang bậc: 2 vạch đè trên đầu — giá — 2 vạch đỡ dưới chân — SMA200 sâu dưới */}
      <div style={{ position: "absolute", left: SAFE.x, top: 620, width: SAFE.w }}>
        <div style={{ position: "absolute", top: 80 }}>
          <Rule at={aMid} c={C.red} fs={27}
            label={<span>DẢI GIỮA 84.006,58 · <span style={{ opacity: lit(f, aP2) }}>−2,67%</span></span>} labelC="rgba(248,81,73,0.85)" drop />
        </div>
        <div style={{ position: "absolute", top: 170 }}>
          <Rule at={aE10} c={C.red} fs={27}
            label={<span>EMA10 83.283,19 · <span style={{ opacity: lit(f, aP1) }}>−1,83%</span></span>} labelC="rgba(248,81,73,0.85)" drop />
        </div>
        {/* Chấm giá sáng giữa khung */}
        <div style={{ position: "absolute", top: 420, display: "flex", alignItems: "center", gap: 16, opacity: lit(f, aCount) }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: C.text, boxShadow: glow(C.blue, 18) }} />
          <span style={{ color: C.text, fontWeight: 800, fontSize: 46, fontFamily: MONO }}>81.762,56</span>
        </div>
        <div style={{ position: "absolute", top: 550 }}>
          <Rule at={aBand} c={C.amber} fs={27} dur={12} hot={lit(f, aSat)}
            label={<span>DẢI DƯỚI 81.539,46 · <span style={{ opacity: lit(f, a027) }}>+0,27%</span></span>} labelC={C.amber} />
        </div>
        <div style={{ position: "absolute", top: 648 }}>
          <Rule at={a50} c={C.green} fs={27}
            label={<span>SMA50 81.022,15 · <span style={{ opacity: lit(f, a091) }}>+0,91%</span></span>} labelC="rgba(63,185,80,0.9)" />
        </div>
        <div style={{ position: "absolute", top: 762 }}>
          <Rule at={a200} c={C.green} fs={27} hot={lit(f, a1349)}
            label={<span>SMA200 72.044,97 · <span style={{ opacity: lit(f, a1349), fontWeight: 800 }}>+13,49%</span></span>} labelC={C.green} />
        </div>
      </div>
      {/* Card chỉ báo — đọc phẳng như thước */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1500, width: SAFE.w, opacity: lit(f, aInd) }}>
        <Card style={{ padding: "20px 28px", borderColor: "rgba(139,148,158,0.4)" }}>
          <span style={{ color: C.muted, fontWeight: 700, fontSize: 30, fontFamily: MONO }}>
            RSI 46,99 · MACD HIST −584,91
          </span>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s03 — Kịch bản Bitcoin: GIỮ — chờ xác nhận ----------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const aStamp = frameOf("s03", "Kết luận");
  const a2moc = frameOf("s03", "hai mốc");
  const aUpIn = frameOf("s03", "Đóng cửa trên");
  const d1 = frameOf("s03", "tám tư");
  const d2 = frameOf("s03", "không", 1);
  const d3 = frameOf("s03", "không", 2);
  const d4 = frameOf("s03", "sáu");
  const d58 = frameOf("s03", "kèm");
  const aRsi50 = frameOf("s03", "RSI");
  const aMacd = frameOf("s03", "MACD");
  const aResUp = frameOf("s03", "đà hồi phục");
  const aDnIn = frameOf("s03", "Đóng dưới");
  const d81a = frameOf("s03", "tám mốt", 1);
  const d5 = frameOf("s03", "năm", 2);
  const d3b = frameOf("s03", "ba");
  const d9 = frameOf("s03", "chín");
  const aRoi = frameOf("s03", "rồi");
  const d81b = frameOf("s03", "tám mốt", 2);
  const d0 = frameOf("s03", "không", 3);
  const d2a = frameOf("s03", "hai", 2);
  const d2b = frameOf("s03", "hai", 3);
  const d15 = frameOf("s03", "rủi ro");
  const aResDn = frameOf("s03", "suy yếu trung hạn");
  const step2 = lit(f, aRoi, 12);
  return (
    <AbsoluteFill>
      <Badge label="KỊCH BẢN" c={C.text} />
      {/* Con dấu verdict đập trước */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 310, display: "flex", justifyContent: "center" }}>
        <Stamp at={aStamp} c={C.green}>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 36, letterSpacing: 2, fontFamily: FONT }}>
            BTC: GIỮ — CHỜ XÁC NHẬN
          </span>
        </Stamp>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 490, display: "flex", justifyContent: "center", opacity: lit(f, a2moc) }}>
        <Chip t="2 MỐC THEO DÕI" c={C.text} fs={24} />
      </div>
      {/* Nhánh TRÊN */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 610, width: SAFE.w, height: 400, padding: 26, opacity: lit(f, aUpIn), borderColor: "rgba(63,185,80,0.4)" }}>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 24 }}>ĐÓNG &gt;</div>
        <div style={{ marginTop: 6 }}>
          <Dig f={f} at={d1} c={C.green}>84</Dig>
          <Dig f={f} at={d2} c={C.green}>.</Dig>
          <Dig f={f} at={d2} c={C.green}>0</Dig>
          <Dig f={f} at={d3} c={C.green}>0</Dig>
          <Dig f={f} at={d4} c={C.green}>6</Dig>
          <Dig f={f} at={d58} c={C.green} fs={34}>,58</Dig>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
          <span style={{ opacity: lit(f, d58) }}><Chip t="DẢI GIỮA" c={C.green} fs={22} /></span>
          <span style={{ opacity: lit(f, aRsi50) }}><Chip t="RSI VƯỢT 50" c={C.green} fs={22} /></span>
          <span style={{ opacity: lit(f, aMacd) }}><Chip t="MACD CẢI THIỆN" c={C.green} fs={22} /></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26, opacity: lit(f, aResUp), transform: `translateY(${16 * (1 - sp(f, aResUp))}px)` }}>
          <ArrowNE c={C.green} s={44} />
          <span style={{ color: C.green, fontWeight: 800, fontSize: 32 }}>HỒI PHỤC THUYẾT PHỤC HƠN</span>
        </div>
      </Card>
      {/* Nhánh DƯỚI — bậc thang xuống chữ 'RỒI' */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 1050, width: SAFE.w, height: 470, padding: 26, opacity: lit(f, aDnIn), borderColor: "rgba(248,81,73,0.4)" }}>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 24 }}>ĐÓNG &lt;</div>
        <div style={{ marginTop: 6 }}>
          <Dig f={f} at={d81a} c={C.red}>81</Dig>
          <Dig f={f} at={d5} c={C.red} fs={34}>.</Dig>
          <Dig f={f} at={d5} c={C.red}>5</Dig>
          <Dig f={f} at={d3b} c={C.red}>3</Dig>
          <Dig f={f} at={d9} c={C.red}>9</Dig>
          <Dig f={f} at={aRoi} c={C.red} fs={34}>,46</Dig>
        </div>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 22, marginTop: 8, opacity: lit(f, aRoi) }}>
          · DẢI DƯỚI → SMA50
        </div>
        {/* Bậc thứ hai mọc tiếp — chữ 'RỒI' nối bậc thang xuống */}
        <div style={{ marginTop: 18, transform: `translate(${60 * step2}px, ${26 * step2}px)`, opacity: step2 }}>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 30, marginRight: 12 }}>RỒI &lt;</span>
          <Dig f={f} at={d81b} c={C.red} fs={40}>81</Dig>
          <Dig f={f} at={d0} c={C.red} fs={30}>.</Dig>
          <Dig f={f} at={d0} c={C.red} fs={40}>0</Dig>
          <Dig f={f} at={d2a} c={C.red} fs={40}>2</Dig>
          <Dig f={f} at={d2b} c={C.red} fs={40}>2</Dig>
          <Dig f={f} at={d15} c={C.red} fs={30}>,15</Dig>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 28, opacity: lit(f, aResDn), transform: `translateY(${16 * (1 - sp(f, aResDn))}px)` }}>
          <ArrowSE c={C.red} s={44} />
          <span style={{ color: C.red, fontWeight: 800, fontSize: 32 }}>RỦI RO SUY YẾU TRUNG HẠN TĂNG</span>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------------- s04 — Ether: dưới cả mép dải, tựa đường 200 ngày ----------------
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const aCount = frameOf("s04", "hai nghìn bốn trăm bốn mươi tư");
  const aLow = frameOf("s04", "hai đô sáu mươi tám");
  const aE10 = frameOf("s04", "hai nghìn năm trăm năm mươi tư");
  const aS50 = frameOf("s04", "hai nghìn năm trăm năm mươi lăm");
  const aBand = frameOf("s04", "mép dải dưới");
  const aBandVal = frameOf("s04", "hai nghìn bốn trăm bốn mươi tám");
  const a200 = frameOf("s04", "hai nghìn một trăm ba mươi lăm");
  const a1445 = frameOf("s04", "mười bốn phẩy bốn năm");
  const aRsi = frameOf("s04", "ba mươi bảy phẩy năm năm");
  const aThr = frameOf("s04", "ngưỡng");
  const aMacd = frameOf("s04", "Thanh MACD");
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      <div style={{ position: "absolute", left: SAFE.x, top: 300, width: SAFE.w, opacity: lit(f, aCount) }}>
        <Card style={{ padding: "26px 30px", display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", borderColor: "rgba(248,81,73,0.4)" }}>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 34 }}>ETH</span>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 52 }}>
            <CountUp at={aCount} to={2444.36} dec={2} />
          </span>
          <span style={{ color: C.red, fontWeight: 700, fontSize: 28 }}>USD · ĐÓNG CỬA 12/10</span>
        </Card>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: 470, opacity: lit(f, aLow) }}>
        <Slam at={aLow}>
          <Chip t="+2,68 USD TRÊN ĐÁY PHIÊN 2.441,68" c={C.red} bg={C.redFill} fs={26} style={{ whiteSpace: "nowrap" }} />
        </Slam>
      </div>
      {/* Ladder: 2 vạch đè đầu → mép dải NGAY TRÊN giá → SMA200 */}
      <div style={{ position: "absolute", left: SAFE.x, top: 620, width: SAFE.w }}>
        <div style={{ position: "absolute", top: 152 }}>
          <Rule at={aS50} c={C.red} fs={27} label="SMA50 2.555,78 · −4,36%" labelC="rgba(248,81,73,0.85)" drop />
        </div>
        <div style={{ position: "absolute", top: 244 }}>
          <Rule at={aE10} c={C.red} fs={27} label="EMA10 2.554,34 · −4,31%" labelC="rgba(248,81,73,0.85)" drop />
        </div>
        {/* Vạch QUAN TRỌNG nhất cảnh — mép dải đè chậm xuống NGAY TRÊN giá */}
        <div style={{ position: "absolute", top: 430 }}>
          <Rule at={aBand} c={C.red} fs={29} dur={26} hot={lit(f, aBandVal)}
            label={<span>DẢI DƯỚI <span style={{ opacity: lit(f, aBandVal) }}>2.448,96 · −0,19%</span></span>} labelC={C.red} />
        </div>
        <div style={{ position: "absolute", top: 506, display: "flex", alignItems: "center", gap: 16, opacity: lit(f, aCount) }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: C.text, boxShadow: glow(C.red, 18) }} />
          <span style={{ color: C.text, fontWeight: 800, fontSize: 46, fontFamily: MONO }}>2.444,36</span>
        </div>
        <div style={{ position: "absolute", top: 668 }}>
          <Rule at={a200} c={C.green} fs={27} hot={lit(f, a1445)}
            label={<span>SMA200 2.135,79 · <span style={{ opacity: lit(f, a1445), fontWeight: 800 }}>+14,45%</span></span>} labelC={C.green} />
        </div>
      </div>
      {/* Chip chỉ báo kép */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1420, width: SAFE.w, display: "flex", flexDirection: "column", gap: 16 }}>
        <Card style={{ padding: "16px 24px", borderColor: "rgba(139,148,158,0.4)", opacity: lit(f, aRsi) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.muted, fontWeight: 700, fontSize: 27, fontFamily: MONO }}>RSI 37,55 · NGƯỠNG 30 — CHƯA DƯỚI</span>
            <RsiMini at={aRsi} thr={30} thrAt={aThr} rsi={37.55} w={210} />
          </div>
        </Card>
        <Card style={{ padding: "16px 24px", borderColor: "rgba(248,81,73,0.4)", opacity: lit(f, aMacd) }}>
          <span style={{ color: C.red, fontWeight: 700, fontSize: 27, fontFamily: MONO }}>MACD −13,40 &lt; SIGNAL 22,53 · HIST −35,93</span>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s05 — Kịch bản Ether: GIỮ, đối xứng s03 ----------------
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const aStamp = frameOf("s05", "Ether cũng GIỮ");
  const aZone = frameOf("s05", "Lấy lại vùng");
  const aZ1 = frameOf("s05", "hai nghìn năm trăm năm mươi tư");
  const aZ2 = frameOf("s05", "hai nghìn năm trăm năm mươi lăm");
  const aImp = frameOf("s05", "chỉ báo cải thiện");
  const aRes = frameOf("s05", "xác nhận tốt hơn");
  const aDnIn = frameOf("s05", "Ngược lại");
  const aLow = frameOf("s05", "hai nghìn bốn trăm bốn mươi mốt");
  const aSoon = frameOf("s05", "không sớm lấy lại");
  const aResDn = frameOf("s05", "rủi ro giảm tăng");
  const aCaveat = frameOf("s05", "chưa phải mục tiêu");
  return (
    <AbsoluteFill>
      <Badge label="KỊCH BẢN" c={C.text} />
      <div style={{ position: "absolute", left: 0, width: 1080, top: 310, display: "flex", justifyContent: "center" }}>
        <Stamp at={aStamp} c={C.green}>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 36, letterSpacing: 2, fontFamily: FONT }}>
            ETH: GIỮ — CHỜ XÁC NHẬN
          </span>
        </Stamp>
      </div>
      {/* Nhánh TRÊN — vùng 2 vạch sáng */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 560, width: SAFE.w, height: 430, padding: 26, opacity: lit(f, aZone), borderColor: "rgba(63,185,80,0.4)" }}>
        <div style={{ color: C.green, fontWeight: 800, fontSize: 32, fontFamily: MONO }}>
          LẤY LẠI VÙNG <Dig f={f} at={aZ1} c={C.green} fs={32}>2.554,34</Dig>
          <Dig f={f} at={aZ2} c={C.green} fs={32}>–2.555,78</Dig>
        </div>
        <svg width={SAFE.w - 52} height={150} viewBox={`0 0 ${SAFE.w - 52} 150`} style={{ marginTop: 14 }}>
          <rect x={0} y={38} width={(SAFE.w - 52) * lit(f, aZone)} height={74} fill="rgba(63,185,80,0.14)" rx={6} />
          <line x1={0} y1={38} x2={(SAFE.w - 52) * lit(f, aZ2, 12)} y2={38} stroke={C.green} strokeWidth={3} />
          <text x={SAFE.w - 56} y={30} fill={C.green} fontSize={20} fontFamily={MONO} textAnchor="end" opacity={lit(f, aZ2)}>SMA50 2.555,78</text>
          <line x1={0} y1={112} x2={(SAFE.w - 52) * lit(f, aZ1, 12)} y2={112} stroke={C.green} strokeWidth={3} />
          <text x={SAFE.w - 56} y={136} fill={C.green} fontSize={20} fontFamily={MONO} textAnchor="end" opacity={lit(f, aZ1)}>EMA10 2.554,34</text>
        </svg>
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <span style={{ opacity: lit(f, aZone) }}><Chip t="EMA10 + SMA50" c={C.green} fs={22} /></span>
          <span style={{ opacity: lit(f, aImp) }}><Chip t="RSI/MACD CẢI THIỆN" c={C.green} fs={22} /></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, opacity: lit(f, aRes), transform: `translateY(${16 * (1 - sp(f, aRes))}px)` }}>
          <ArrowNE c={C.green} s={42} />
          <span style={{ color: C.green, fontWeight: 800, fontSize: 30 }}>XÁC NHẬN TỐT HƠN</span>
        </div>
      </Card>
      {/* Nhánh DƯỚI — mất đáy phiên */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 1030, width: SAFE.w, height: 470, padding: 26, opacity: lit(f, aDnIn), borderColor: "rgba(248,81,73,0.4)" }}>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 26 }}>ĐÓNG &lt; ĐÁY PHIÊN</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 6 }}>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 54, fontFamily: MONO, opacity: lit(f, aLow), textShadow: glow(C.red, lit(f, aLow) * 16) }}>
            2.441,68
          </span>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 30, opacity: lit(f, aSoon) }}>· KHÔNG SỚM LẤY LẠI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26, opacity: lit(f, aResDn), transform: `translateY(${16 * (1 - sp(f, aResDn))}px)` }}>
          <ArrowSE c={C.red} s={42} />
          <span style={{ color: C.red, fontWeight: 800, fontSize: 30 }}>RỦI RO GIẢM TĂNG</span>
        </div>
        {/* Van bảo hiểm trung thực — dòng phụ nghiêng */}
        <div style={{ marginTop: 30, color: C.muted, fontStyle: "italic", fontWeight: 700, fontSize: 27, opacity: lit(f, aCaveat, 22) }}>
          CHƯA PHẢI MỤC TIÊU GIẢM ĐÃ XÁC NHẬN
        </div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------------- s06 — Solana: cao trào, verdict ĐỎ (hero #2, mood bg) ----------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const aCount = frameOf("s06", "một trăm lẻ năm");
  const aZoom = frameOf("s06", "mười lăm xu");
  const aE10 = frameOf("s06", "đường mười ngày");
  const aS50 = frameOf("s06", "đường năm mươi ngày");
  const aBand = frameOf("s06", "mép dải dưới");
  const a200 = frameOf("s06", "đường hai trăm ngày");
  const a2147 = frameOf("s06", "hai mươi mốt phẩy bốn bảy");
  const aRsi = frameOf("s06", "RSI");
  const aVerdict = frameOf("s06", "GIẢM TỶ TRỌNG");
  const aNb = frameOf("s06", "KHÔNG BÁN KHỐNG");
  const aUpB = frameOf("s06", "Lấy lại vùng");
  const aImpB = frameOf("s06", "chỉ báo cải thiện");
  const aResUp = frameOf("s06", "phục hồi đáng tin");
  const aDnB = frameOf("s06", "rõ dưới đáy phiên");
  const aMoc = frameOf("s06", "tiếp diễn");
  // Candle svg — LOCAL viewBox only (d-010): H 113,15 → y 30; L 105,41 → y 440.
  const yOf = (v: number): number => 30 + (113.15 - v) * (410 / 7.74);
  const zoomK = sp(f, aZoom);
  const r = 10 + 18 * zoomK;
  return (
    <AbsoluteFill>
      <MoodBg src="crypto-tradingagents-20261014/bg_s06_mood.png" />
      <BadgeDouble />
      {/* Stat card */}
      <div style={{ position: "absolute", left: SAFE.x, top: 240, width: SAFE.w, opacity: lit(f, aCount) }}>
        <Card style={{ padding: "20px 28px", display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", borderColor: "rgba(248,81,73,0.4)" }}>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 32 }}>SOL</span>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 48 }}>
            <CountUp at={aCount} to={105.56} dec={2} />
          </span>
          <span style={{ color: C.red, fontWeight: 700, fontSize: 26 }}>USD · ĐÓNG CỬA 12/10</span>
        </Card>
      </div>
      {/* Nến OHLC phóng lớn + 3 vạch đè đầu (một svg local) */}
      <div style={{ position: "absolute", left: SAFE.x, top: 420, opacity: lit(f, aCount) }}>
        <svg width={560} height={470} viewBox="0 0 560 470">
          {/* 3 vạch đè đầu — liệt kê nhanh đều tay */}
          <line x1={8} y1={yOf(112.49)} x2={552} y2={yOf(112.49)} stroke={C.red} strokeWidth={3} strokeDasharray="9 7" opacity={0.8 * lit(f, aE10)} />
          <text x={552} y={yOf(112.49) - 7} fill="rgba(248,81,73,0.85)" fontSize={17} fontFamily={MONO} textAnchor="end" opacity={lit(f, aE10)}>EMA10 112,49 · −6,16%</text>
          <line x1={8} y1={yOf(109.09)} x2={552} y2={yOf(109.09)} stroke={C.red} strokeWidth={3} strokeDasharray="9 7" opacity={0.8 * lit(f, aS50)} />
          <text x={552} y={yOf(109.09) - 7} fill="rgba(248,81,73,0.85)" fontSize={17} fontFamily={MONO} textAnchor="end" opacity={lit(f, aS50)}>SMA50 109,09 · −3,24%</text>
          <line x1={8} y1={yOf(106.75)} x2={552} y2={yOf(106.75)} stroke={C.red} strokeWidth={3} strokeDasharray="9 7" opacity={0.85 * lit(f, aBand)} />
          <text x={552} y={yOf(106.75) - 7} fill="rgba(248,81,73,0.9)" fontSize={17} fontFamily={MONO} textAnchor="end" opacity={lit(f, aBand)}>DẢI DƯỚI 106,75 · −1,11%</text>
          {/* Nến: O 111,24 · H 113,15 · L 105,41 · C 105,56 — thân đỏ, close SÁT ĐÁY */}
          <g opacity={lit(f, aCount)}>
            <line x1={250} y1={yOf(113.15)} x2={250} y2={yOf(111.24)} stroke={C.red} strokeWidth={5} />
            <rect x={218} y={yOf(111.24)} width={64} height={yOf(105.56) - yOf(111.24)} rx={6} fill={C.red} opacity={0.92} />
            <line x1={250} y1={yOf(105.56)} x2={250} y2={yOf(105.41)} stroke={C.red} strokeWidth={5} />
            <circle cx={250} cy={yOf(105.56)} r={7} fill={C.text} />
            <text x={302} y={yOf(111.24) + 34} fill={C.muted} fontSize={17} fontFamily={MONO}>O 111,24</text>
            <text x={262} y={yOf(113.15) + 6} fill={C.muted} fontSize={17} fontFamily={MONO}>H 113,15</text>
            <text x={8} y={459} fill={C.muted} fontSize={17} fontFamily={MONO} textAnchor="start">C 105,56 · L 105,41</text>
          </g>
          {/* Callout zoom phóng to khoảng đóng-đáy — hero số của video */}
          <g opacity={lit(f, aZoom)} transform={`translate(250 ${yOf(105.56) + (yOf(105.41) - yOf(105.56)) / 2})`}>
            <circle cx={0} cy={0} r={r} fill="none" stroke={C.red} strokeWidth={4} />
            <line x1={r} y1={0} x2={r + 26} y2={0} stroke={C.red} strokeWidth={2.5} />
            <text x={r + 34} y={-4} fill={C.red} fontWeight="800" fontSize={44} fontFamily={MONO}>+0,15 USD</text>
            <text x={r + 34} y={26} fill={C.muted} fontSize={18} fontFamily={MONO}>C ↔ ĐÁY</text>
          </g>
        </svg>
      </div>
      {/* SMA200 xa dưới — 'chỉ còn' */}
      <div style={{ position: "absolute", left: SAFE.x, top: 950, width: SAFE.w }}>
        <Rule at={a200} c={C.green} fs={27} hot={lit(f, a2147)}
          label={<span>SMA200 86,90 · <span style={{ opacity: lit(f, a2147), fontWeight: 800 }}>+21,47%</span></span>} labelC={C.green} />
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: 1050, opacity: lit(f, aRsi) }}>
        <Chip t="RSI 38,59 · HIST −2,17" c={C.muted} fs={26} style={{ whiteSpace: "nowrap" }} />
      </div>
      {/* Con dấu verdict ĐỎ — đập dứt khoát, khác hẳn hai con dấu xanh */}
      <div style={{ position: "absolute", left: SAFE.x, width: SAFE.w, top: 1180, display: "flex", justifyContent: "center" }}>
        <Stamp at={aVerdict} c={C.red} rotate={-2} style={{ width: 820, padding: "14px 24px" }}>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 32, letterSpacing: 1, fontFamily: FONT }}>
            SOL: GIẢM TỶ TRỌNG
            <span style={{ display: "block", color: C.text, opacity: lit(f, aNb) }}>— KHÔNG BÁN KHỐNG</span>
          </span>
        </Stamp>
      </div>
      {/* Cây 2 nhánh cuối */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 1350, width: SAFE.w, height: 140, padding: "16px 22px", opacity: lit(f, aUpB), borderColor: "rgba(63,185,80,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ArrowNE c={C.green} s={38} />
          <div>
            <div style={{ color: C.green, fontWeight: 800, fontSize: 26, fontFamily: MONO }}>LẤY LẠI VÙNG 109,09–112,49</div>
            <div style={{ color: C.green, fontWeight: 700, fontSize: 22, marginTop: 6 }}>
              + <span style={{ opacity: lit(f, aImpB) }}>RSI/MACD CẢI THIỆN</span>
              <span style={{ opacity: lit(f, aResUp) }}> → PHỤC HỒI ĐÁNG TIN HƠN</span>
            </div>
          </div>
        </div>
      </Card>
      <Card style={{ position: "absolute", left: SAFE.x, top: 1510, width: SAFE.w, height: 180, padding: "16px 22px", opacity: lit(f, aDnB), borderColor: "rgba(248,81,73,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ArrowSE c={C.red} s={38} />
          <div>
            <div style={{ color: C.red, fontWeight: 800, fontSize: 26, fontFamily: MONO }}>ĐÓNG RÕ &lt; ĐÁY PHIÊN 105,41</div>
            <div style={{ color: C.red, fontWeight: 700, fontSize: 22, marginTop: 6, opacity: lit(f, aMoc) }}>
              → RỦI RO TIẾP DIỄN MỨC GIẢM
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, opacity: lit(f, aMoc) }}>
          <Chip t="MỐC ĐÁNH GIÁ LẠI · KHÔNG PHẢI STOP" c={C.muted} fs={20} />
        </div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------------- s07 — Nhận định: bảng 3 cột + 2 con dấu trung thực ----------------
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const aChip = frameOf("s07", "Cả ba");
  const aRow1 = frameOf("s07", "dưới đường mười ngày");
  const aHist = frameOf("s07", "histogram âm");
  const aThr = frameOf("s07", "chưa đồng loạt");
  const aG1 = frameOf("s07", "bốn mươi sáu phẩy chín chín");
  const aG2 = frameOf("s07", "ba mươi bảy phẩy năm năm");
  const aG3 = frameOf("s07", "ba mươi tám phẩy năm chín");
  const aA1 = frameOf("s07", "hai nghìn không trăm tám mươi");
  const aA2 = frameOf("s07", "tám mươi lăm phẩy bốn không");
  const aA3 = frameOf("s07", "bốn phẩy sáu năm");
  const aMoi = frameOf("s07", "Mọi mốc");
  const aMacro = frameOf("s07", "Vĩ mô");
  const AtrCell: React.FC<{ at: number; v: string }> = ({ at, v }) => (
    <div style={{ width: "100%", textAlign: "center", opacity: lit(f, at) }}>
      <span style={{ color: C.amber, fontWeight: 700, fontSize: 24, fontFamily: MONO, whiteSpace: "nowrap" }}>{v}</span>
    </div>
  );
  const grid = { display: "grid", gridTemplateColumns: "230px 1fr 1fr 1fr", alignItems: "center" };
  const lbl = { color: C.muted, fontWeight: 700, fontSize: 22, fontFamily: FONT } as React.CSSProperties;
  return (
    <AbsoluteFill>
      {/* Chip lớp NHẬN ĐỊNH — thay badge thường */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 250, display: "flex", justifyContent: "center" }}>
        <Slam at={aChip}>
          <Chip t="NHẬN ĐỊNH" c={C.amber} bg={C.amberFill} fs={32} />
        </Slam>
      </div>
      <Card style={{ position: "absolute", left: SAFE.x, top: 400, width: SAFE.w, height: 830, padding: "24px 22px" }}>
        {/* Header */}
        <div style={{ ...grid, marginBottom: 14 }}>
          <div />
          {[["BTC", aChip], ["ETH", aChip], ["SOL", aChip]].map(([t, at], i) => (
            <div key={i} style={{ color: C.text, fontWeight: 800, fontSize: 30, textAlign: "center", opacity: lit(f, at as number) }}>{t as string}</div>
          ))}
        </div>
        {/* Hàng 1: DƯỚI ĐƯỜNG 10 NGÀY ✓✓✓ */}
        <div style={{ ...grid, marginBottom: 20 }}>
          <div style={lbl}>DƯỚI ĐƯỜNG<br />10 NGÀY</div>
          {[aRow1 - 6, aRow1 - 3, aRow1].map((at, i) => (
            <div key={i} style={{ color: C.red, fontWeight: 800, fontSize: 44, textAlign: "center", opacity: lit(f, at) }}>✓</div>
          ))}
        </div>
        {/* Hàng phụ: HISTOGRAM ÂM */}
        <div style={{ ...grid, marginBottom: 20 }}>
          <div style={lbl}>HISTOGRAM ÂM</div>
          {[["−584,91", aHist - 6], ["−35,93", aHist - 3], ["−2,17", aHist]].map(([v, at], i) => (
            <div key={i} style={{ color: "rgba(248,81,73,0.85)", fontWeight: 700, fontSize: 25, fontFamily: MONO, textAlign: "center", opacity: lit(f, at as number) }}>{v as string}</div>
          ))}
        </div>
        {/* Hàng gauge RSI — kim chạy lần lượt điểm danh, vạch 30 chưa chạm */}
        <div style={{ ...grid, marginBottom: 6 }}>
          <div style={lbl}>RSI<br />· NGƯỠNG 30</div>
          {[["46,99", aG1], ["37,55", aG2], ["38,59", aG3]].map(([v, at], i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <RsiMini at={at as number} thr={30} thrAt={aThr} rsi={Number((v as string).replace(",", "."))} w={210} />
              <span style={{ color: C.muted, fontWeight: 700, fontSize: 22, fontFamily: MONO }}>{v as string}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <span style={{ opacity: lit(f, aThr) }}>
            <Chip t="NGƯỠNG 30 — CHƯA ĐỒNG LOẠT" c={C.muted} fs={20} />
          </span>
        </div>
        {/* Hàng ATR — ô số cùng chiều rộng, không so sánh bằng độ dài */}
        <div style={{ ...grid, marginBottom: 22 }}>
          <div style={lbl}>ATR · USD</div>
          <AtrCell at={aA1} v="2.080,49" />
          <AtrCell at={aA2} v="85,40" />
          <AtrCell at={aA3} v="4,65" />
        </div>
      </Card>
      {/* Chip tham chiếu có điều kiện — câu trung thực nhất */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1290, display: "flex", justifyContent: "center" }}>
        <Slam at={aMoi}>
          <Chip t="MỌI MỐC = THAM CHIẾU CÓ ĐIỀU KIỆN" c={C.amber} bg={C.amberFill} fs={28} />
        </Slam>
      </div>
      {/* Con dấu xám — dữ liệu thiếu, không suy diễn */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1440, display: "flex", justifyContent: "center" }}>
        <Stamp at={aMacro} c={C.muted} rotate={0}>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 27, letterSpacing: 1, fontFamily: FONT }}>
            VĨ MÔ + TIN TỨC: KHÔNG KHẢ DỤNG TRONG KỲ
          </span>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 27, letterSpacing: 1, marginTop: 4 }}>
            — KHÔNG SUY DIỄN HƯỚNG GIÁ
          </div>
        </Stamp>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s08 — Lời biên tập: caveat + CTA ----------------
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const aBan = frameOf("s08", "đóng cửa phiên");
  const a14 = frameOf("s08", "không phải giá hiện tại");
  const aSrc = frameOf("s08", "Ảnh chụp muộn hơn");
  const aRule = frameOf("s08", "Theo dõi");
  const aCta = frameOf("s08", "Lưu video");
  const pulse = interpolate(f, [aCta, aCta + 8, aCta + 20], [1, 1.05, 1], clampX);
  return (
    <AbsoluteFill>
      <Badge label="LỜI BIÊN TẬP" c={C.muted} />
      {/* Banner caveat — fade vào nhẹ, không đập */}
      <div style={{ position: "absolute", left: SAFE.x, top: 480, width: SAFE.w, opacity: lit(f, aBan, 16) }}>
        <Card style={{ padding: "34px 36px", borderColor: C.amber }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 33, textAlign: "center", lineHeight: 1.5 }}>
            MỌI SỐ = ĐÓNG CỬA PHIÊN 12/10 ·{" "}
            <span style={{ fontWeight: 800, borderBottom: `4px solid ${C.amber}`, paddingBottom: 2, opacity: lit(f, a14) }}>
              KHÔNG PHẢI GIÁ HIỆN TẠI NGÀY 14/10
            </span>
          </div>
        </Card>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 760, display: "flex", justifyContent: "center", opacity: lit(f, aSrc) }}>
        <Chip t="ẢNH CHỤP MUỘN HƠN = NGUỒN KHÁC — KHÔNG TRỘN" c={C.muted} fs={26} />
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 960, display: "flex", justifyContent: "center" }}>
        <Slam at={aRule} rotate={-2}>
          <div
            style={{
              background: C.muted,
              color: "#0D1117",
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: 1,
              borderRadius: 12,
              padding: "18px 32px",
              textAlign: "center",
            }}
          >
            THEO DÕI, KHÔNG PHẢI LỆNH
          </div>
        </Slam>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, width: SAFE.w, top: 1280, display: "flex", justifyContent: "center" }}>
        <Slam at={aCta} style={{ width: 820, maxWidth: 820 }}>
          <div style={{ transform: `scale(${pulse})` }}>
            <Chip t="LƯU VIDEO — ĐỐI CHIẾU KHI ĐIỀU KIỆN THAY ĐỔI" c={C.blue} bg={C.blueFill} fs={30} style={{ width: 820, boxShadow: glow(C.blue, 14) }} />
          </div>
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s09 — Disclosure (giữ đến hết video) ----------------
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const aBan = frameOf("s09", "Crypto");
  const aTwo = frameOf("s09", "Phân tích");
  const k1 = lit(f, aBan, 12);
  const k2 = lit(f, aTwo, 12);
  return (
    <AbsoluteFill>
      <Badge label="LỜI BIÊN TẬP" c={C.muted} />
      <div style={{ position: "absolute", left: SAFE.x, top: 820, width: SAFE.w, opacity: lit(f, aBan, 14) }}>
        <Card style={{ padding: "44px 40px", borderColor: C.amber }}>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 38, textAlign: "center", lineHeight: 1.5, opacity: 0.4 + 0.6 * k1 }}>
            CRYPTO BIẾN ĐỘNG MẠNH — CÓ THỂ GÂY MẤT VỐN
          </div>
          <div style={{ marginTop: 22, color: C.text, fontWeight: 700, fontSize: 34, textAlign: "center", lineHeight: 1.5, opacity: 0.4 + 0.6 * k2 }}>
            PHÂN TÍCH CÓ ĐIỀU KIỆN,{" "}
            <span style={{ fontWeight: 800, borderBottom: `4px solid ${C.amber}` }}>KHÔNG PHẢI KHUYẾN NGHỊ ĐẦU TƯ</span>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

interface CaptionCue { start: number; end: number; text: string }
const SPEECH_CAPTIONS = captionsJson as CaptionCue[];
const SpeechLockedCaptions: React.FC = () => {
  const seconds = useCurrentFrame() / FPS;
  let cue: CaptionCue | undefined;
  for (const candidate of SPEECH_CAPTIONS) {
    if (seconds >= candidate.start && seconds < candidate.end) cue = candidate;
  }
  return cue ? (
    <div style={{ position: "absolute", left: 80, top: 1608, width: 820, padding: "14px 24px", boxSizing: "border-box", borderRadius: 16, background: "rgba(0,0,0,0.82)", color: "#FFFFFF", fontSize: 36, lineHeight: 1.24, fontWeight: 650, textAlign: "center", whiteSpace: "pre-line", zIndex: 10 }}>
      {cue.text}
    </div>
  ) : null;
};

const SCENES: Record<string, React.FC> = {
  s01: S01, s02: S02, s03: S03, s04: S04, s05: S05,
  s06: S06, s07: S07, s08: S08, s09: S09,
};

export const CryptoTradingAgents20261014: React.FC = () => {
  const f = useCurrentFrame();
  const bgmVol = Math.min(
    interpolate(f, [0, 30], [0, 0.12], clampX),
    interpolate(f, [TOTAL_FRAMES - 90, TOTAL_FRAMES], [0.12, 0], clampX),
  );
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <Audio src={staticFile("crypto-tradingagents-20261014/narration_full.wav")} volume={0.89} />
      <Audio src={staticFile("crypto-tradingagents-20261014/bgm.mp3")} volume={bgmVol} />
      <div style={{ position: "absolute", inset: 0, transform: "translate(7.2px, -20px) scale(0.91)", transformOrigin: "top left" }}>
        {SCENE_TIMING.map((t, index) => (
          <Sequence key={t.scene_id} from={t.start_frame} durationInFrames={index === SCENE_TIMING.length - 1 ? TOTAL_FRAMES - t.start_frame : t.scene_frames}>
            {SCENES[t.scene_id] ? <>{React.createElement(SCENES[t.scene_id])}</> : null}
          </Sequence>
        ))}
      </div>
      <SpeechLockedCaptions />
      <div style={{ position: "absolute", left: 80, top: 60, width: 820, color: C.text, fontSize: 22, lineHeight: 1.35, fontWeight: 600, zIndex: 20 }}>
        Phân tích có điều kiện — không phải khuyến nghị đầu tư
      </div>
      <div style={{ position: "absolute", left: 80, top: 1780, width: 820, color: C.muted, fontSize: 23, lineHeight: 1.3, zIndex: 20 }}>
        Nguồn: báo cáo phân tích 14/10/2026 · Nến ngày 12/10/2026 · USD
      </div>
    </AbsoluteFill>
  );
};
