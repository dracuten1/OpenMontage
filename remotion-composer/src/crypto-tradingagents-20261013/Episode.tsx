// Episode.tsx — crypto-tradingagents-20261013 (VERTICAL 1080x1920 @30fps, 10 scenes).
// Bespoke dark-fintech-terminal composition, speech-locked via timing.ts frameOf().
// Series mechanics (btc08/eth09/eth10): Card/Chip/slam/CountUp/lit, layer badge,
// hard cuts, static camera, vi-VN fmtVi, TSX-only data (no gen-number images).
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { C, FONT, MONO, SAFE, FPS, fmtVi } from "./theme";
import { SCENE_TIMING, TOTAL_FRAMES, frameOf } from "./timing";

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
      whiteSpace: "nowrap",
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

const MoodBg: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill>
    <img
      src={staticFile(src)}
      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.32 }}
    />
    <AbsoluteFill style={{ background: "rgba(0,0,0,0.58)" }} />
  </AbsoluteFill>
);

const glow = (c: string, px: number) => `0 0 ${px}px ${c}`;

const Header: React.FC<{ at: number; t: string }> = ({ at, t }) => (
  <div
    style={{
      position: "absolute",
      left: SAFE.x,
      width: SAFE.w,
      top: 300,
      display: "flex",
      justifyContent: "center",
    }}
  >
    <Slam at={at}>
      <div
        style={{
          color: C.text,
          fontWeight: 800,
          fontSize: 46,
          letterSpacing: 1,
          textAlign: "center",
        }}
      >
        {t}
      </div>
    </Slam>
  </div>
);

// Horizontal rule that draws from left, with a right-aligned label above it.
const Rule: React.FC<{
  at: number;
  c: string;
  label: string;
  labelC?: string;
  drop?: boolean;
  fs?: number;
}> = ({ at, c, label, labelC, drop = false, fs = 26 }) => {
  const f = useCurrentFrame();
  const k = lit(f, at, 10);
  return (
    <div style={{ width: "100%", position: "relative", marginBottom: 34 }}>
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
          boxShadow: glow(c, 10),
        }}
      />
    </div>
  );
};

const ArrowNE: React.FC<{ c: string; s?: number }> = ({ c, s = 54 }) => (
  <svg width={s} height={s} viewBox="0 0 54 54">
    <line x1={8} y1={46} x2={40} y2={14} stroke={c} strokeWidth={6} strokeLinecap="round" />
    <polyline points="20,12 42,12 42,34" fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------------- s01 — HOOK: hai trạng thái ----------------
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const aC = frameOf("s01", "Cùng một nến");
  const aB = frameOf("s01", "đứng trên cả ba đường");
  const aE = frameOf("s01", "chui dưới bốn đường");
  const aR = frameOf("s01", "Lần đầu kể từ");
  const aQ = frameOf("s01", "vì sao hai cấu trúc");
  const btcLines = [
    { at: aB, v: "EMA10 83.621", c: C.green },
    { at: aB - 5, v: "SMA50 80.942", c: C.green },
    { at: aB - 10, v: "SMA200 71.980", c: C.green },
  ];
  const ethLines = [
    { at: aE, v: "2.578,78", c: C.red },
    { at: aE - 4, v: "2.556,17", c: C.red },
    { at: aE - 8, v: "2.637,14", c: "rgba(248,81,73,0.45)" },
    { at: aE - 12, v: "2.650,60", c: "rgba(248,81,73,0.45)" },
  ];
  const flash = Math.max(0, Math.sin((f - aR) / 4)) * 14;
  return (
    <AbsoluteFill>
      <MoodBg src="crypto-tradingagents-20261013/hero_s01_mood.png" />
      <Badge label="QUAN SÁT" c={C.blue} />
      <div style={{ position: "absolute", left: 0, width: 1080, top: 240, display: "flex", justifyContent: "center" }}>
        <Slam at={aC}>
          <Chip t="NẾN NGÀY 11/10" c={C.blue} bg={C.blueFill} fs={30} />
        </Slam>
      </div>
      {/* Panel BTC (trái, xanh) */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 420, width: 440, height: 730, padding: 26, opacity: lit(f, aB - 14), borderColor: "rgba(63,185,80,0.4)" }}>
        <div style={{ color: C.text, fontWeight: 800, fontSize: 34 }}>BTC</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "8px 0 2px", opacity: lit(f, aB) }}>
          <span style={{ color: C.green, fontWeight: 800, fontSize: 44, fontFamily: MONO }}>83.679,47</span>
        </div>
        <div style={{ margin: "26px 0 18px", opacity: lit(f, aB) }}>
          <Chip t="TRÊN 3 ĐƯỜNG ↗" c={C.green} bg={C.greenFill} fs={26} />
        </div>
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 60, display: "flex", flexDirection: "column" }}>
          {btcLines.map((l, i) => (
            <Rule key={i} at={l.at} c={l.c} label={l.v} labelC={C.green} fs={24} />
          ))}
        </div>
        <div style={{ position: "absolute", right: 26, top: 96, display: "flex", gap: 6, opacity: lit(f, aB + 4) }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ opacity: lit(f, aB + 4 + i * 3) }}>
              <ArrowNE c={C.green} s={40} />
            </div>
          ))}
        </div>
      </Card>
      {/* Panel ETH (phải, đỏ mờ) */}
      <Card style={{ position: "absolute", left: 560, top: 420, width: 440, height: 730, padding: 26, opacity: lit(f, aE - 16), borderColor: "rgba(248,81,73,0.4)" }}>
        <div style={{ color: C.text, fontWeight: 800, fontSize: 34 }}>ETH</div>
        <div style={{ margin: "8px 0 2px", opacity: lit(f, aE) }}>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 44, fontFamily: MONO }}>2.534,70</span>
        </div>
        <div style={{ marginTop: 10, opacity: lit(f, aE) }}>
          <Chip t="DƯỚI 4 ĐƯỜNG" c={C.red} bg={C.redFill} fs={26} />
        </div>
        <div style={{ position: "absolute", left: 26, right: 26, top: 210 }}>
          {ethLines.map((l, i) => (
            <Rule key={i} at={l.at} c={l.c} label={l.v} labelC="rgba(248,81,73,0.75)" fs={24} drop />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: 26,
            bottom: 66,
            width: 16,
            height: 16,
            borderRadius: 8,
            background: C.red,
            boxShadow: glow(C.red, 18),
            opacity: lit(f, aE),
            transform: `translateY(${-14 * (1 - sp(f, aE))}px)`,
          }}
        />
      </Card>
      {/* Chip đỏ 02/10 */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1220, display: "flex", justifyContent: "center" }}>
        <Slam at={aR}>
          <Chip t="ETH DƯỚI 4 ĐƯỜNG — LẦN ĐẦU TỪ 02/10" c={C.red} bg={C.redFill} fs={28} style={{ boxShadow: glow(C.red, flash) }} />
        </Slam>
      </div>
      {/* Chip so sánh */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1380, display: "flex", justifyContent: "center" }}>
        <Slam at={aQ}>
          <div style={{ display: "inline-flex", border: "1.5px solid #30363D", borderRadius: 12, padding: "10px 20px", background: C.surface, fontSize: 28, fontWeight: 700, fontFamily: FONT }}>
            <span style={{ color: C.green }}>BTC: TRÊN 3 ĐƯỜNG ↗</span>
            <span style={{ color: C.muted, margin: "0 12px" }}>·</span>
            <span style={{ color: C.red }}>ETH: DƯỚI 4 ĐƯỜNG ↘</span>
          </div>
        </Slam>
      </div>
      {/* Câu hỏi */}
      <div style={{ position: "absolute", left: SAFE.x, width: SAFE.w, top: 1560 }}>
        <Slam at={aQ + 6}>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 40, textAlign: "center", lineHeight: 1.35 }}>
            CÙNG THỊ TRƯỜNG — VÌ SAO HAI CẤU TRÚC KHÁC NHAU ĐẾN VẬY?
          </div>
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s02 — Phía hồi: Bitcoin trên cả ba đường ----------------
const S02: React.FC = () => {
  const f = useCurrentFrame();
  const aH = frameOf("s02", "hai câu chuyện");
  const aLow = frameOf("s02", "tám mươi mốt nghìn");
  const aClose = frameOf("s02", "đóng cửa tám mươi ba");
  const a50 = frameOf("s02", "tám mươi nghìn chín trăm bốn");
  const a200 = frameOf("s02", "mười sáu phẩy ba");
  const aUp = frameOf("s02", "cả ba hướng lên");
  const yOf = (v: number) => 30 + ((84103.62 - v) / 1381.51) * 280;
  const wickBlink = interpolate(f, [aLow, aLow + 7, aLow + 14], [0.35, 1, 0.55], clampX);
  const steps = [
    { at: aUp, label: "EMA10 83.621", chip: "", c: C.green },
    { at: a50, label: "SMA50 80.942", chip: "+3,38%", c: C.green },
    { at: a200, label: "SMA200 71.980", chip: "+16,3%", c: C.green },
  ];
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      <Header at={aH} t="PHÍA HỒI — BITCOIN TRÊN CẢ BA ĐƯỜNG" />
      {/* Nến đơn 11/10 */}
      <div style={{ position: "absolute", left: SAFE.x, top: 430, opacity: lit(f, aH) }}>
        <svg width={340} height={330} viewBox="0 0 360 340">
          <g transform={`translate(${20 * (1 - sp(f, aH))}, 0)`}>
            <line x1={185} y1={yOf(84103.62)} x2={185} y2={yOf(82912.23)} stroke={C.green} strokeWidth={5} />
            <line x1={185} y1={yOf(82912.23)} x2={185} y2={yOf(82722.11)} stroke={C.green} strokeWidth={7} strokeOpacity={wickBlink} />
            <rect x={150} y={yOf(83679.47)} width={70} height={yOf(82912.23) - yOf(83679.47)} rx={6} fill={C.green} opacity={0.92} />
            <text x={195} y={yOf(84103.62) + 6} fill={C.muted} fontSize={20} fontFamily={MONO}>H 84.103,62</text>
            <text x={195} y={yOf(82722.11) + 8} fill={C.muted} fontSize={20} fontFamily={MONO}>L 82.722,11</text>
            <text x={142} y={yOf(82912.23) + 6} fill={C.muted} fontSize={20} fontFamily={MONO} textAnchor="end">O 82.912,23</text>
            <text x={228} y={yOf(83679.47) + 6} fill={C.text} fontSize={20} fontFamily={MONO} textAnchor="start">C 83.679,47</text>
          </g>
        </svg>
      </div>
      {/* Stat card CountUp */}
      <div style={{ position: "absolute", left: SAFE.x, top: 800, width: SAFE.w, opacity: lit(f, aClose) }}>
        <Card style={{ padding: "26px 30px", display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 34 }}>BTC</span>
          <span style={{ color: C.green, fontWeight: 800, fontSize: 52 }}>
            <CountUp at={aClose} to={83679.47} dec={2} />
          </span>
          <span style={{ color: C.green, fontWeight: 700, fontSize: 28 }}>USD · ĐÓNG CỬA 11/10</span>
        </Card>
      </div>
      {/* Chip đáy */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1000, opacity: lit(f, aLow) }}>
        <Slam at={aLow}>
          <Chip t="HỒI 3 PHIÊN TỪ ĐÁY 81.676,34 · 08/10" c={C.blue} bg={C.blueFill} fs={26} />
        </Slam>
      </div>
      {/* Thang bậc 3 đường (đáy→đỉnh: SMA200 → SMA50 → EMA10) */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1120, width: SAFE.w }}>
        {steps.map((s, i) => (
          <div key={i} style={{ marginLeft: (2 - i) * 90, marginBottom: 12, opacity: lit(f, s.at) }}>
            <Card style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 16, borderColor: "rgba(63,185,80,0.35)" }}>
              <span style={{ color: C.text, fontWeight: 700, fontSize: 30, fontFamily: MONO, minWidth: 300 }}>{s.label}</span>
              {s.chip ? <Chip t={s.chip} c={C.green} bg={C.greenFill} fs={26} /> : <span style={{ color: C.green, fontSize: 26, fontWeight: 700 }}>GIÁ TRÊN CÙNG ↗</span>}
            </Card>
          </div>
        ))}
      </div>
      {/* Dòng chốt */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1560, display: "flex", justifyContent: "center" }}>
        <Slam at={aUp}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, border: `2px solid ${C.green}`, borderRadius: 14, padding: "12px 26px", background: C.greenFill }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ opacity: lit(f, aUp + i * 3) }}>
                <ArrowNE c={C.green} s={42} />
              </div>
            ))}
            <span style={{ color: C.green, fontWeight: 800, fontSize: 38 }}>CẢ BA HƯỚNG LÊN</span>
          </div>
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s03 — Phía mất: Ether dưới bốn đường ----------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const aH = frameOf("s03", "ngược chiều");
  const aP = frameOf("s03", "hai nghìn năm trăm ba mươi");
  const aE1 = frameOf("s03", "hai nghìn năm trăm bảy mươi tám");
  const aE2 = frameOf("s03", "hai nghìn năm trăm năm mươi sáu");
  const a5 = frameOf("s03", "năm phiên liên tiếp");
  const a2 = frameOf("s03", "hai đường nữa");
  const a4 = frameOf("s03", "bốn đường cùng lúc");
  const aB = frameOf("s03", "bật lên từ đáy");
  const drop5 = 6 * lit(f, a5, 10);
  const lines = [
    { at: a2, v: "DẢI GIỮA 2.650,60", c: "rgba(139,148,158,0.55)", dim: true },
    { at: a2 - 4, v: "VWMA 2.637,14", c: "rgba(139,148,158,0.55)", dim: true },
    { at: aE2, v: "SMA50 2.556,17", c: C.red, dim: false },
    { at: aE1, v: "EMA10 2.578,78 · GIẢM 5 PHIÊN ↘", c: C.red, dim: false },
  ];
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      <Header at={aH} t="PHÍA MẤT — ETHER DƯỚI BỐN ĐƯỜNG" />
      <div style={{ position: "absolute", left: SAFE.x, top: 420, width: SAFE.w, opacity: lit(f, aP) }}>
        <Card style={{ padding: "26px 30px", display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", borderColor: "rgba(248,81,73,0.4)" }}>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 34 }}>ETH</span>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 52 }}>
            <CountUp at={aP} to={2534.7} dec={2} />
          </span>
          <span style={{ color: C.red, fontWeight: 700, fontSize: 26 }}>USD · ĐÓNG CỬA 11/10 · DƯỚI 4 ĐƯỜNG</span>
        </Card>
      </div>
      {/* 4 vạch đè trên đầu giá */}
      <div style={{ position: "absolute", left: SAFE.x, top: 640, width: SAFE.w }}>
        {lines.map((l, i) => (
          <div key={i} style={{ transform: `translateY(${l.dim ? 0 : -drop5}px)`, marginBottom: 30 }}>
            <Rule at={l.at} c={l.c} label={l.v} labelC={l.dim ? C.muted : "rgba(248,81,73,0.85)"} fs={26} drop />
          </div>
        ))}
        {/* Chấm giá thấp nhất khung */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 30, opacity: lit(f, aP) }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: C.red, boxShadow: glow(C.red, 20) }} />
          <span style={{ color: C.red, fontWeight: 800, fontSize: 40, fontFamily: MONO }}>2.534,70</span>
        </div>
        {/* Mũi tên bật từ đáy */}
        <svg width={SAFE.w} height={110} viewBox={`0 0 ${SAFE.w} 110`} style={{ marginTop: 10, opacity: lit(f, aB) }}>
          <line x1={40} y1={100} x2={40} y2={100 - 80 * lit(f, aB, 14)} stroke={C.blue} strokeWidth={7} strokeLinecap="round" />
          <polyline
            points={`${26},${34} 40,18 54,34`}
            fill="none"
            stroke={C.blue}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={lit(f, aB + 8)}
          />
        </svg>
        <div style={{ marginTop: 4, opacity: lit(f, aB + 4) }}>
          <Chip t="BẬT TỪ ĐÁY 2.406,15 · PHIÊN 08/10" c={C.blue} bg={C.blueFill} fs={28} />
        </div>
      </div>
      {/* Con dấu */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1350, display: "flex", justifyContent: "center" }}>
        <Slam at={a4} rotate={-5}>
          <div
            style={{
              border: `3px solid ${C.amber}`,
              outline: `1.5px solid ${C.red}`,
              outlineOffset: 5,
              borderRadius: 10,
              padding: "14px 30px",
              color: C.text,
              fontWeight: 800,
              fontSize: 32,
              letterSpacing: 2,
              background: "rgba(13,17,23,0.75)",
              boxShadow: glow(C.red, lit(f, a4, 10) * 16),
            }}
          >
            4 ĐƯỜNG · LẦN ĐẦU TỪ 02/10
          </div>
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s04 — Động lượng: gauge RSI đôi ----------------
const Gauge: React.FC<{ at: number; rsi: number; c: string; title: string }> = ({ at, rsi, c, title }) => {
  const f = useCurrentFrame();
  const k = sp(f, at);
  const ang = (-90 + 180 * (rsi / 100)) * k;
  const rad = (ang * Math.PI) / 180;
  return (
    <div style={{ width: 330, textAlign: "center" }}>
      <div style={{ color: C.muted, fontWeight: 700, fontSize: 24, marginBottom: 2 }}>{title}</div>
      <svg width={330} height={160} viewBox="0 0 330 160">
        <path d="M 25 150 A 140 140 0 0 1 305 150" fill="none" stroke="#30363D" strokeWidth={8} />
        <line x1={165} y1={150} x2={165 + 112 * Math.sin(rad)} y2={150 - 112 * Math.cos(rad)} stroke={c} strokeWidth={6} strokeLinecap="round" />
        <circle cx={165} cy={150} r={9} fill={c} />
        <text x={30} y={140} fill={C.muted} fontSize={17} fontFamily={FONT}>YẾU</text>
        <text x={165} y={24} fill={C.muted} fontSize={17} fontFamily={FONT} textAnchor="middle">TRUNG TÍNH</text>
        <text x={300} y={140} fill={C.muted} fontSize={17} fontFamily={FONT} textAnchor="end">MẠNH</text>
      </svg>
      <div style={{ color: c, fontWeight: 800, fontSize: 30 }}>
        RSI <CountUp at={at} to={rsi} dec={2} />
      </div>
    </div>
  );
};

const S04: React.FC = () => {
  const f = useCurrentFrame();
  const aH = frameOf("s04", "chưa được xác nhận");
  const aM = frameOf("s04", "chín trăm mười bốn");
  const aS = frameOf("s04", "dưới đường tín hiệu");
  const aR1 = frameOf("s04", "năm mươi bốn phẩy ba năm");
  const aH2 = frameOf("s04", "ba mươi ba phẩy năm tám");
  const aRef = frameOf("s04", "âm bảy phẩy năm tư");
  const aR2 = frameOf("s04", "bốn mươi bốn phẩy năm ba");
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      <div style={{ position: "absolute", left: SAFE.x, width: SAFE.w, top: 300, display: "flex", justifyContent: "center" }}>
        <Slam at={aH}>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 44, textAlign: "center", paddingBottom: 8 }}>
            ĐỘNG LƯỢNG — CHƯA XÁC NHẬN Ở CẢ HAI
            <div style={{ height: 5, background: C.amber, marginTop: 8, borderRadius: 3, transform: `scaleX(${lit(f, aH + 4, 12)})`, transformOrigin: "center" }} />
          </div>
        </Slam>
      </div>
      {/* Card BTC */}
      <div style={{ position: "absolute", left: SAFE.x, top: 430, width: SAFE.w, opacity: lit(f, aM) }}>
        <Card style={{ padding: "26px 32px", borderColor: "rgba(139,148,158,0.4)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
            <span style={{ color: C.text, fontWeight: 800, fontSize: 32 }}>MACD</span>
            <span style={{ color: C.text, fontWeight: 800, fontSize: 52 }}>
              <CountUp at={aM} to={914.83} dec={2} />
            </span>
            <span style={{ color: C.muted, fontWeight: 700, fontSize: 28, opacity: lit(f, aS) }}>DƯỚI SIGNAL 1.429,10</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, opacity: lit(f, aS) }}>
            <span style={{ color: C.muted, fontWeight: 700, fontSize: 26, fontFamily: MONO }}>HIST −514,27</span>
            <div style={{ width: 150 * lit(f, aS, 12), height: 18, background: C.muted, borderRadius: 4, transformOrigin: "right center" }} />
          </div>
        </Card>
      </div>
      {/* Panel ETH: hist mở rộng */}
      <div style={{ position: "absolute", left: SAFE.x, top: 870, width: SAFE.w, opacity: lit(f, aH2) }}>
        <Card style={{ padding: "26px 32px", borderColor: "rgba(248,81,73,0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ color: C.red, fontWeight: 800, fontSize: 32 }}>HIST −33,58</span>
            <span style={{ color: C.muted, fontWeight: 700, fontSize: 26, fontFamily: MONO, opacity: lit(f, aRef) }}>−7,54 · 30/09</span>
          </div>
          <div style={{ position: "relative", height: 120, marginTop: 14 }}>
            <div style={{ position: "absolute", right: 0, top: 8, width: 70, height: 14, background: "rgba(139,148,158,0.5)", borderRadius: 4, transformOrigin: "right center", transform: `scaleX(${lit(f, aRef)})` }} />
            <div style={{ position: "absolute", right: 0, top: 44, width: 320 * lit(f, aH2, 14), height: 26, background: C.red, borderRadius: 5, transformOrigin: "right center", boxShadow: glow(C.red, 12) }} />
            <svg width={SAFE.w - 64} height={120} viewBox={`0 0 ${SAFE.w - 64} 120`}>
              <line
                x1={SAFE.w - 64 - 74}
                y1={16}
                x2={SAFE.w - 64 - 74 - 40 * lit(f, aRef, 12)}
                y2={48 - 26 * lit(f, aRef, 12)}
                stroke={C.red}
                strokeWidth={5}
                strokeLinecap="round"
                markerEnd="url(#ah)"
                opacity={lit(f, aRef + 6)}
              />
              <defs>
                <marker id="ah" markerWidth={10} markerHeight={10} refX={6} refY={3} orient="auto">
                  <path d="M0,0 L7,3 L0,6 Z" fill={C.red} />
                </marker>
              </defs>
            </svg>
          </div>
        </Card>
      </div>
      {/* Gauge đôi + vạch nối */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1200, width: SAFE.w, display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
        <Gauge at={aR1} rsi={54.35} c={C.green} title="BTC · TRUNG TÍNH" />
        <Gauge at={aR2} rsi={44.53} c={C.red} title="ETH" />
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: 1490, width: SAFE.w, display: "flex", justifyContent: "center", opacity: lit(f, aR2) }}>
        <Chip t="RSI 54,35 vs 44,53" c={C.muted} fs={26} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s05 — Vị trí: dải co, thước một năm ----------------
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const aH = frameOf("s05", "kẹt sát mép dưới");
  const aL = frameOf("s05", "hai nghìn bốn trăm tám mươi");
  const aP = frameOf("s05", "hai phẩy hai");
  const aY = frameOf("s05", "giữa hai cực");
  const aPk = frameOf("s05", "bốn nghìn hai trăm chín mươi hai");
  const aLo = frameOf("s05", "một đáy sâu");
  const aA = frameOf("s05", "tám mươi mốt phẩy năm chín");
  const aSq = frameOf("s05", "hai mươi mốt phần trăm");
  const xOf = (v: number) => 120 + ((v - 1506.51) / 2786.34) * 800;
  const inset = 30 + 150 * lit(f, aA, Math.max(10, aSq - aA));
  const bands = [
    { at: aH, v: "2.820,65", c: "rgba(139,148,158,0.5)", lc: C.muted },
    { at: aH - 4, v: "2.650,60", c: "rgba(139,148,158,0.5)", lc: C.muted },
    { at: aL, v: "2.480,55", c: C.amber, lc: C.amber },
  ];
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      <Header at={aH} t="VỊ TRÍ — SÁT MÉP DƯỚI DẢI, BIÊN ĐỘ CO LẠI" />
      {/* Dải 3 vạch + giá */}
      <div style={{ position: "absolute", left: SAFE.x, top: 440, width: SAFE.w }}>
        {bands.map((b, i) => (
          <Rule key={i} at={b.at} c={b.c} label={b.v} labelC={b.lc} fs={28} />
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 18, opacity: lit(f, aL) }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: C.amber, boxShadow: glow(C.amber, 20) }} />
          <span style={{ color: C.text, fontWeight: 800, fontSize: 40, fontFamily: MONO }}>ETH 2.534,70</span>
          <div style={{ opacity: lit(f, aP) }}>
            <Chip t="+2,2% SO VỚI DẢI DƯỚI" c={C.amber} bg={C.amberFill} fs={26} />
          </div>
        </div>
        {/* Vạch kẹp biên độ co lại */}
        <div style={{ position: "absolute", top: -30, left: -inset, right: -inset, bottom: 60, borderLeft: `3px solid ${C.amber}`, borderRight: `3px solid ${C.amber}`, borderRadius: 8, opacity: 0.5 * lit(f, aA) }} />
      </div>
      {/* Thước một năm */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1010, width: SAFE.w, opacity: lit(f, aY) }}>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 24, textAlign: "center", marginBottom: 26 }}>MỘT NĂM QUA</div>
        <div style={{ height: 4, background: C.blue, borderRadius: 2, transform: `scaleX(${lit(f, aY, 12)})`, transformOrigin: "left center", boxShadow: glow(C.blue, 8) }} />
        <div style={{ position: "relative", height: 120 }}>
          <div style={{ position: "absolute", left: 0, top: 14, color: C.blue, fontWeight: 700, fontSize: 24, fontFamily: MONO, opacity: lit(f, aPk) }}>ĐỈNH 4.292,85 · 14/10/2025</div>
          <div style={{ position: "absolute", right: 0, top: 14, color: C.muted, fontWeight: 700, fontSize: 24, fontFamily: MONO, opacity: lit(f, aLo) }}>ĐÁY 1.506,51 · 06/06/2026</div>
          <div style={{ position: "absolute", left: xOf(2805.5) - 2, top: -10, width: 4, height: 34, background: C.muted, opacity: lit(f, aPk) }} />
          <div style={{ position: "absolute", left: xOf(2805.5) + 10, top: -12, color: C.muted, fontSize: 21, fontFamily: MONO, opacity: lit(f, aPk) }}>2.805,50 · ĐỈNH 21/09</div>
          <div style={{ position: "absolute", left: xOf(2406.15) - 2, top: -10, width: 4, height: 34, background: C.muted, opacity: lit(f, aLo) }} />
          <div style={{ position: "absolute", left: xOf(2406.15) + 10, top: 22, color: C.muted, fontSize: 21, fontFamily: MONO, opacity: lit(f, aLo) }}>2.406,15 · ĐÁY 08/10</div>
          <div style={{ position: "absolute", left: xOf(2534.7) - 7, top: -14, width: 14, height: 14, borderRadius: 7, background: C.amber, boxShadow: glow(C.amber, 12), opacity: lit(f, aY + 8) }} />
        </div>
      </div>
      {/* Chip ATR */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1310, display: "flex", justifyContent: "center" }}>
        <Slam at={aA}>
          <Chip t="ATR 81,59 · CO ~21% TỪ ĐỈNH 23/09" c={C.amber} bg={C.amberFill} fs={30} />
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s06 — Nhận định ----------------
const MacroIcon: React.FC<{ kind: "oil" | "bond" | "tech"; c: string }> = ({ kind, c }) => {
  if (kind === "oil")
    return (
      <svg width={64} height={64} viewBox="0 0 64 64">
        <rect x={16} y={10} width={32} height={44} rx={7} fill="none" stroke={c} strokeWidth={4} />
        <line x1={16} y1={24} x2={48} y2={24} stroke={c} strokeWidth={4} />
        <line x1={16} y1={40} x2={48} y2={40} stroke={c} strokeWidth={4} />
      </svg>
    );
  if (kind === "bond")
    return (
      <svg width={64} height={64} viewBox="0 0 64 64">
        <rect x={14} y={8} width={36} height={48} rx={5} fill="none" stroke={c} strokeWidth={4} />
        <line x1={22} y1={20} x2={42} y2={20} stroke={c} strokeWidth={4} />
        <line x1={22} y1={30} x2={42} y2={30} stroke={c} strokeWidth={4} />
        <line x1={22} y1={40} x2={34} y2={40} stroke={c} strokeWidth={4} />
      </svg>
    );
  return (
    <svg width={64} height={64} viewBox="0 0 64 64">
      <line x1={14} y1={54} x2={50} y2={54} stroke={c} strokeWidth={4} strokeLinecap="round" />
      <rect x={16} y={34} width={8} height={16} fill={c} />
      <rect x={28} y={24} width={8} height={26} fill={c} />
      <rect x={40} y={14} width={8} height={36} fill={c} />
    </svg>
  );
};

const S06: React.FC = () => {
  const f = useCurrentFrame();
  const aC = frameOf("s06", "đáng chú ý");
  const aS = frameOf("s06", "thường đi trước");
  const aO = frameOf("s06", "dầu tăng");
  const aB = frameOf("s06", "lợi suất trái phiếu tăng");
  const aT = frameOf("s06", "công nghệ yếu");
  const aP = frameOf("s06", "áp lực ngắn hạn");
  const aV = frameOf("s06", "Vì thế");
  const chips = [
    { at: aO, t: "DẦU ↗", kind: "oil" as const, c: C.amber },
    { at: aB, t: "LỢI SUẤT TRÁI PHIẾU ↗", kind: "bond" as const, c: C.amber },
    { at: aT, t: "CỔ PHIẾU CÔNG NGHỆ ↘", kind: "tech" as const, c: C.red },
  ];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 320, display: "flex", justifyContent: "center" }}>
        <Slam at={aC}>
          <Chip t="NHẬN ĐỊNH" c={C.amber} bg={C.amberFill} fs={34} />
        </Slam>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, width: SAFE.w, top: 460 }}>
        <Slam at={aS}>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 46, textAlign: "center", lineHeight: 1.4 }}>
            BIÊN ĐỘ CO LẠI —{" "}
            <span style={{ borderBottom: `5px solid ${C.amber}`, paddingBottom: 2 }}>THƯỜNG</span>{" "}
            ĐI TRƯỚC DỊCH CHUYỂN LỚN
          </div>
        </Slam>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: 720, width: SAFE.w, display: "flex", justifyContent: "space-between", gap: 18 }}>
        {chips.map((ch, i) => (
          <div key={i} style={{ width: 294 }}>
            <Slam at={ch.at}>
              <Card style={{ padding: "26px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, borderColor: `${ch.c}66` }}>
                <MacroIcon kind={ch.kind} c={ch.c} />
                <div style={{ color: ch.c, fontWeight: 800, fontSize: 25, textAlign: "center" }}>{ch.t}</div>
              </Card>
            </Slam>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1080, display: "flex", justifyContent: "center", opacity: lit(f, aP) }}>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 32, letterSpacing: 1 }}>ÁP LỰC NGẮN HẠN · TÀI SẢN RỦI RO</div>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1290, display: "flex", justifyContent: "center" }}>
        <Slam at={aV} rotate={-4}>
          <div
            style={{
              border: `3px solid ${C.amber}`,
              outline: `1.5px solid ${C.amber}`,
              outlineOffset: 5,
              borderRadius: 10,
              padding: "18px 34px",
              color: C.text,
              fontWeight: 800,
              fontSize: 34,
              letterSpacing: 2,
              background: "rgba(13,17,23,0.75)",
            }}
          >
            ƯU TIÊN HÀNG ĐẦU: QUẢN TRỊ RỦI RO
          </div>
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s07 — Kịch bản BTC (hero #2, mood bg) ----------------
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const aH = frameOf("s07", "rõ theo từng mốc");
  const d1 = frameOf("s07", "tám tư");
  const d2 = frameOf("s07", "một");
  const d3 = frameOf("s07", "không");
  const d4 = frameOf("s07", "ba");
  const aTop = frameOf("s07", "đỉnh phiên mười một");
  const aBot = frameOf("s07", "tám mươi hai nghìn bảy trăm");
  const aE = frameOf("s07", "hai phiên liên tiếp");
  const yOf = (v: number) => 30 + ((84103.62 - v) / 1381.51) * 240;
  const blink = interpolate(f, [aE, aE + 8, aE + 20], [0.35, 0.8, 0.35], clampX);
  const seg = (at: number) => ({ opacity: lit(f, at) });
  return (
    <AbsoluteFill>
      <MoodBg src="crypto-tradingagents-20261013/hero_s07_mood.png" />
      <Badge label="KỊCH BẢN" c={C.text} />
      <Header at={aH} t="KỊCH BẢN — MỐC BITCOIN" />
      {/* Lane BTC */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 410, width: SAFE.w, height: 520, opacity: lit(f, aH), borderColor: "rgba(63,185,80,0.35)" }}>
        <svg width={230} height={300} viewBox="0 0 230 300" style={{ position: "absolute", left: 40, top: 100 }}>
          <line x1={115} y1={yOf(84103.62)} x2={115} y2={yOf(82722.11)} stroke={C.green} strokeWidth={5} />
          <rect x={86} y={yOf(83679.47)} width={58} height={yOf(82912.23) - yOf(83679.47)} rx={5} fill={C.green} opacity={0.92} />
          <circle cx={115} cy={yOf(83679.47)} r={8} fill={C.text} />
          <text x={130} y={yOf(83679.47) + 6} fill={C.text} fontSize={20} fontFamily={MONO}>83.679,47</text>
        </svg>
        {/* Mốc trên: digit-wise 84.103,62 */}
        <div style={{ position: "absolute", left: 300, right: 26, top: 44 }}>
          <div style={{ color: C.green, fontWeight: 800, fontSize: 30, fontFamily: MONO }}>
            NẾU ĐÓNG &gt;{" "}
            <span style={seg(d1)}>84</span>
            <span style={{ ...seg(d3), opacity: lit(f, d1) * lit(f, d3) }}>.</span>
            <span style={{ ...seg(d2), opacity: lit(f, d2) }}>1</span>
            <span style={seg(d3)}>0</span>
            <span style={seg(d4)}>3</span>
            <span style={seg(d4 + 3)}>,62</span>
          </div>
          <div style={{ color: C.muted, fontWeight: 700, fontSize: 24, marginTop: 6, opacity: lit(f, d4 + 3) }}>· ĐỈNH PHIÊN 11/10</div>
          <div style={{ marginTop: 12, opacity: lit(f, aTop), transform: `translateY(${18 * (1 - sp(f, aTop))}px)` }}>
            <Chip t="→ ĐÀ HỒI XÁC NHẬN" c={C.green} bg={C.greenFill} fs={28} style={{ boxShadow: glow(C.green, 16) }} />
          </div>
          <div style={{ height: 4, background: C.green, borderRadius: 2, marginTop: 18, transform: `scaleX(${lit(f, d1, 10)})`, transformOrigin: "left center", boxShadow: glow(C.green, 14) }} />
        </div>
        {/* Mốc dưới */}
        <div style={{ position: "absolute", left: 300, right: 26, bottom: 40 }}>
          <div style={{ color: C.red, fontWeight: 800, fontSize: 30, fontFamily: MONO, opacity: lit(f, aBot) }}>
            NẾU ĐÓNG &lt; 82.722,11 · ĐÁY PHIÊN
          </div>
          <div style={{ marginTop: 10, opacity: lit(f, aBot) }}>
            <Chip t="→ MẤT ĐÁY PHIÊN" c={C.red} bg={C.redFill} fs={28} style={{ boxShadow: glow(C.red, 16) }} />
          </div>
          <div style={{ height: 4, background: C.red, borderRadius: 2, marginTop: 18, transform: `scaleX(${lit(f, aBot, 10)})`, transformOrigin: "left center", boxShadow: glow(C.red, 14) }} />
        </div>
      </Card>
      {/* Lane ETH mờ preview */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 970, width: SAFE.w, height: 330, opacity: blink, borderColor: "rgba(248,81,73,0.3)" }}>
        <div style={{ position: "absolute", left: 30, top: 60, color: C.muted, fontWeight: 700, fontSize: 26 }}>ETHER — MỘT VẠCH (SẮP ĐỌC)</div>
        <div style={{ position: "absolute", left: 30, top: 120, color: "rgba(248,81,73,0.7)", fontWeight: 800, fontSize: 40, fontFamily: MONO }}>2.480,55</div>
        <div style={{ position: "absolute", left: 30, right: 30, top: 200, height: 4, background: "rgba(248,81,73,0.5)", borderRadius: 2 }} />
      </Card>
      {/* Chip phụ lục */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1400, display: "flex", justifyContent: "center" }}>
        <Slam at={aE}>
          <Chip t="2 PHIÊN LIÊN TIẾP DƯỚI SMA50 80.942 → ĐỘNG LỰC HỒI SUY YẾU" c={C.amber} bg={C.amberFill} fs={26} />
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s08 — Kịch bản ETH: một vạch ----------------
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const a1 = frameOf("s08", "một vạch");
  const a2 = frameOf("s08", "hai nghìn bốn trăm tám mươi");
  const a3 = frameOf("s08", "còn nguyên");
  const a4 = frameOf("s08", "hai nghìn sáu trăm năm mươi");
  const a5 = frameOf("s08", "hai nghìn tám trăm hai mươi");
  const a6 = frameOf("s08", "Mất vạch");
  const gap = 26 * lit(f, a6, 10);
  const lineOp = 1 - 0.75 * lit(f, a6, 10);
  return (
    <AbsoluteFill>
      <Badge label="KỊCH BẢN" c={C.text} />
      <Header at={a1} t="KỊCH BẢN — MỐC ETHER: MỘT VẠCH" />
      {/* Lane BTC mờ (đã đọc) */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 410, width: SAFE.w, height: 210, opacity: 0.45 * lit(f, a1), borderColor: "rgba(139,148,158,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", height: "100%", color: C.muted, fontWeight: 700, fontSize: 24, fontFamily: MONO }}>
          <span>ĐÃ ĐỌC · BTC &gt; 84.103,62 ✓</span>
          <span>BTC &lt; 82.722,11 ✓</span>
        </div>
      </Card>
      {/* Lane ETH sáng */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 660, width: SAFE.w, height: 630, opacity: lit(f, a1), borderColor: "rgba(248,81,73,0.4)" }}>
        {/* Bậc tham chiếu mọc lên */}
        <div style={{ position: "absolute", left: 30, right: 30, top: 60 }}>
          <div style={{ color: C.blue, fontWeight: 700, fontSize: 26, fontFamily: MONO, textAlign: "right", opacity: 0.65 * lit(f, a5) }}>2.820,65</div>
          <div style={{ height: 3, background: "rgba(88,166,255,0.55)", borderRadius: 2, transform: `scaleX(${lit(f, a5, 10)})`, transformOrigin: "left center" }} />
        </div>
        <div style={{ position: "absolute", left: 30, right: 30, top: 150 }}>
          <div style={{ color: C.blue, fontWeight: 700, fontSize: 26, fontFamily: MONO, textAlign: "right", opacity: 0.65 * lit(f, a4) }}>2.650,60</div>
          <div style={{ height: 3, background: "rgba(88,166,255,0.55)", borderRadius: 2, transform: `scaleX(${lit(f, a4, 10)})`, transformOrigin: "left center" }} />
        </div>
        <div style={{ position: "absolute", left: 30, right: 30, top: 90, display: "flex", justifyContent: "flex-end", opacity: lit(f, a5) }}>
          <span style={{ color: C.blue, fontWeight: 700, fontSize: 22 }}>2.650,60 → 2.820,65 · THAM CHIẾU — THEO DÕI</span>
        </div>
        {/* Vạch sống còn 2.480,55 — đứt gãy khi 'Mất vạch' */}
        <div style={{ position: "absolute", left: 30, right: 30, top: 330 }}>
          <div style={{ color: C.red, fontWeight: 800, fontSize: 40, fontFamily: MONO, textAlign: "right", opacity: lit(f, a2) }}>2.480,55</div>
          <div style={{ display: "flex", gap: gap, marginTop: 10 }}>
            <div style={{ flex: 1, height: 8, background: C.red, borderRadius: 4, transform: `scaleX(${lit(f, a2, 10)}) translateX(${-gap / 2}px)`, transformOrigin: "left center", boxShadow: glow(C.red, 18), opacity: lineOp }} />
            <div style={{ flex: 1, height: 8, background: C.red, borderRadius: 4, transform: `scaleX(${lit(f, a2, 10)}) translateX(${gap / 2}px)`, transformOrigin: "right center", boxShadow: glow(C.red, 18), opacity: lineOp }} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 30, bottom: 60, color: C.text, fontWeight: 700, fontSize: 26, opacity: lit(f, a2 + 6) }}>
          ETH 2.534,70 <span style={{ color: C.red }}>— mất vạch → rủi ro mở rộng</span>
        </div>
      </Card>
      {/* Con dấu nhánh đôi */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1330, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <Slam at={a3}>
          <Chip t="GIỮ > 2.480,55 → CẤU TRÚC CÒN · THAM CHIẾU 2.650,60 → 2.820,65" c={C.green} bg={C.greenFill} fs={26} />
        </Slam>
        <Slam at={a6} rotate={-2}>
          <Chip t="MẤT 2.480,55 → RỦI RO MỞ RỘNG MỨC GIẢM" c={C.red} bg={C.redFill} fs={28} style={{ boxShadow: glow(C.red, 16) }} />
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s09 — Lời biên tập: caveat + CTA ----------------
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const aB = frameOf("s09", "lưu ý quan trọng");
  const aH = frameOf("s09", "chưa có nến");
  const aS = frameOf("s09", "chưa kiểm chứng");
  const aT = frameOf("s09", "Theo dõi");
  const aC = frameOf("s09", "Lưu lại video");
  const pulse = interpolate(f, [aT, aT + 6, aT + 14], [1, 1.04, 1], clampX);
  const hl = lit(f, aH, 10);
  return (
    <AbsoluteFill>
      <Badge label="LỜI BIÊN TẬP" c={C.muted} />
      <div style={{ position: "absolute", left: SAFE.x, top: 480, width: SAFE.w, opacity: lit(f, aB, 12) }}>
        <Card style={{ padding: "34px 36px", borderColor: C.amber }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 34, textAlign: "center", lineHeight: 1.5 }}>
            MỌI MỨC = ĐÓNG CỬA PHIÊN 11/10 ·{" "}
            <span style={{ color: interpolateColors(hl, [0, 1], [C.muted, C.text]), fontWeight: 800 }}>
              NGUỒN CHƯA CÓ NẾN PHIÊN SAU
            </span>
          </div>
        </Card>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 760, display: "flex", justifyContent: "center" }}>
        <div style={{ opacity: lit(f, aS) }}>
          <Slam at={aS}>
            <div style={{ transform: `scale(${pulse})` }}>
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
                THAM CHIẾU CHƯA KIỂM CHỨNG — THEO DÕI, KHÔNG PHẢI LỆNH
              </div>
            </div>
          </Slam>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1080, display: "flex", justifyContent: "center" }}>
        <Slam at={aC}>
          <Chip t="💾 LƯU VIDEO — ĐỐI CHIẾU KHI ĐIỀU KIỆN THAY ĐỔI" c={C.blue} bg={C.blueFill} fs={30} style={{ boxShadow: glow(C.blue, 14) }} />
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s10 — Disclosure (giữ đến hết) ----------------
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const aV = frameOf("s10", "Và cuối cùng");
  const a1 = frameOf("s10", "biến động mạnh");
  const a2 = frameOf("s10", "khuyến nghị đầu tư");
  const k1 = lit(f, a1, 10);
  const k2 = lit(f, a2, 10);
  return (
    <AbsoluteFill>
      <Badge label="LỜI BIÊN TẬP" c={C.muted} />
      <div style={{ position: "absolute", left: SAFE.x, top: 820, width: SAFE.w, opacity: lit(f, aV, 12) }}>
        <Card style={{ padding: "44px 40px", borderColor: C.amber }}>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 40, textAlign: "center", lineHeight: 1.5, opacity: 0.4 + 0.6 * k1 }}>
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

const SCENES: Record<string, React.FC> = {
  s01: S01, s02: S02, s03: S03, s04: S04, s05: S05,
  s06: S06, s07: S07, s08: S08, s09: S09, s10: S10,
};

export const CryptoTradingAgents20261013: React.FC = () => {
  const f = useCurrentFrame();
  const bgmVol = Math.min(
    interpolate(f, [0, 30], [0, 0.12], clampX),
    interpolate(f, [TOTAL_FRAMES - 90, TOTAL_FRAMES], [0.12, 0], clampX),
  );
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <Audio src={staticFile("crypto-tradingagents-20261013/narration_full.wav")} volume={1} />
      <Audio src={staticFile("crypto-tradingagents-20261013/bgm.mp3")} volume={bgmVol} />
      {SCENE_TIMING.map((t) => (
        <Sequence key={t.scene_id} from={t.start_frame} durationInFrames={t.scene_frames}>
          {SCENES[t.scene_id] ? <>{React.createElement(SCENES[t.scene_id])}</> : null}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
