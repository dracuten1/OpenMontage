// scenes_b.tsx — crypto-tradingagents-20261015: s04–s06 (self-contained).
// Mechanics inherited from cta13/cta14 (Card/Chip/Slam/CountUp/Stamp/Rule,
// badge, GREEDY-JOIN speech-lock anchors, static camera, vi-VN display).
// Source-label rule: mỗi số gắn nhãn nguồn; KHÔNG trộn hai nguồn trên một
// trục ladder (s04 trục chính = nến 14/10, đóng 13/10 chỉ dòng mờ chip phụ;
// s06 ladder một nguồn 13/10, 104,29 chỉ trong stat card nhãn nguồn khác).
import React from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, MONO, SAFE, FPS, fmtVi } from "./theme";
import { frameOf } from "./timing";

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

// Mood canvas static; opacity ≤0.35 + dark overlay; all numbers TSX-only.
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
        maxWidth: 860,
        boxSizing: "border-box",
        textAlign: "center",
        padding: "14px 28px",
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
    <div style={{ width: SAFE.w, boxSizing: "border-box", position: "relative" }}>
      <div
        style={{
          color: labelC ?? c,
          fontWeight: 700,
          fontSize: fs,
          fontFamily: MONO,
          textAlign: "right",
          marginBottom: 6,
          opacity: k,
          whiteSpace: "normal",
          overflowWrap: "anywhere",
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

const ArrowNE: React.FC<{ c: string; s?: number }> = ({ c, s = 44 }) => (
  <svg width={s} height={s} viewBox="0 0 54 54">
    <line x1={8} y1={46} x2={40} y2={14} stroke={c} strokeWidth={6} strokeLinecap="round" />
    <polyline points="20,12 42,12 42,34" fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowSE: React.FC<{ c: string; s?: number }> = ({ c, s = 44 }) => (
  <svg width={s} height={s} viewBox="0 0 54 54">
    <line x1={8} y1={8} x2={40} y2={40} stroke={c} strokeWidth={6} strokeLinecap="round" />
    <polyline points="20,42 42,42 42,20" fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Digit-group reveal (số hiện theo từng nhóm chữ đọc).
const Dig: React.FC<{ f: number; at: number; c?: string; fs?: number; children: string }> = ({
  f, at, c = C.text, fs = 46, children,
}) => (
  <span style={{ color: c, fontFamily: MONO, fontWeight: 800, fontSize: fs, opacity: lit(f, at) }}>
    {children}
  </span>
);

// ---------------- s04 — Ether ladder: trục chính NẾN 14/10, giá xuyên mép dải ----------------
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const aDim = frameOf("s04", "đóng mười ba tháng mười");
  const aCount = frameOf("s04", "hai nghìn bốn trăm hai mươi mốt");
  const aPha = frameOf("s04", "phá dưới mép dải");
  const aE10 = frameOf("s04", "Dưới đường mười ngày");
  const aS50 = frameOf("s04", "năm mươi ngày");
  const a200 = frameOf("s04", "vẫn trên đường hai trăm ngày");
  const aDinh = frameOf("s04", "Từ đỉnh");
  const aRsi = frameOf("s04", "RSI");
  const aMacd = frameOf("s04", "thanh MACD");
  const aAtr = frameOf("s04", "Biên độ lớn");
  // Giá xuyên xuống dưới vạch: dot rơi từ trên mép dải xuống dưới tại 'phá dưới mép dải'.
  const pierce = interpolate(f, [aPha, aPha + 26], [-86, 0], clampX);
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      {/* Stat card NẾN 14/10 (nguồn khác) + dòng mờ đóng 13/10 chip phụ */}
      <div style={{ position: "absolute", left: SAFE.x, top: 240, width: SAFE.w, opacity: lit(f, aDim) }}>
        <Card style={{ padding: "22px 30px", borderColor: "rgba(210,153,34,0.55)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
            <span style={{ color: C.text, fontWeight: 800, fontSize: 34 }}>ETH</span>
            <span style={{ color: C.red, fontWeight: 800, fontSize: 52, opacity: lit(f, aCount) }}>
              <CountUp at={aCount} to={2421.6} dec={2} />
            </span>
            <span style={{ color: C.red, fontWeight: 700, fontSize: 28, opacity: lit(f, aCount) }}>USD</span>
            <span style={{ opacity: lit(f, aDim) }}><Chip t="NẾN 14/10 · NGUỒN KHÁC" c={C.amber} fs={24} /></span>
          </div>
          <div style={{ color: C.muted, fontWeight: 700, fontSize: 25, fontFamily: MONO, marginTop: 10, opacity: lit(f, aDim) }}>
            ĐÓNG CỬA 13/10: 2.496,63
          </div>
        </Card>
      </div>
      {/* Ladder MỘT NGUỒN chính (14/10): đỉnh mờ — EMA10/SMA50 đè đầu — mép dải — giá xuyên — SMA200 */}
      <div style={{ position: "absolute", left: SAFE.x, top: 460, width: SAFE.w }}>
        <div style={{ position: "absolute", top: 0, opacity: 0.7 * lit(f, aDinh) }}>
          <Rule at={aDinh} c={C.muted} fs={24} label="ĐỈNH 2.805,50 · 21/09" labelC={C.muted} />
        </div>
        <div style={{ position: "absolute", top: 150 }}>
          <Rule at={aS50} c={C.red} fs={27} drop label="SMA50 2.556 · ĐƯỜNG NĂM MƯƠI NGÀY" labelC="rgba(248,81,73,0.85)" />
        </div>
        <div style={{ position: "absolute", top: 240 }}>
          <Rule at={aE10} c={C.red} fs={27} drop label="EMA10 2.522 · ĐƯỜNG MƯỜI NGÀY" labelC="rgba(248,81,73,0.85)" />
        </div>
        {/* Vạch QUAN TRỌNG nhất cảnh — mép dải, chậm rãi từng chữ */}
        <div style={{ position: "absolute", top: 470 }}>
          <Rule at={aPha} c={C.amber} fs={29} dur={26} hot={lit(f, aPha, 26)}
            label="MÉP DẢI DƯỚI 2.431,27" labelC={C.amber} />
        </div>
        {/* Chấm giá XUYÊN XUỐNG DƯỚI vạch */}
        <div style={{ position: "absolute", top: 550, display: "flex", alignItems: "center", gap: 14, opacity: lit(f, aCount), transform: `translateY(${pierce}px)` }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: C.text, boxShadow: glow(C.red, 18) }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: C.text, fontWeight: 800, fontSize: 32, fontFamily: MONO }}>
              NẾN 14/10: 2.421,60
            </span>
            <span style={{ color: C.red, fontWeight: 800, fontSize: 26, fontFamily: MONO }}>
              PHÁ DƯỚI MÉP DẢI
            </span>
          </div>
        </div>
        <div style={{ position: "absolute", top: 770 }}>
          <Rule at={a200} c={C.green} fs={27} hot={lit(f, a200, 20)}
            label="SMA200 2.138 · ĐƯỜNG HAI TRĂM NGÀY" labelC={C.green} />
        </div>
      </div>
      {/* Card chỉ báo cuối */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1350, width: SAFE.w, opacity: lit(f, aRsi) }}>
        <Card style={{ padding: "18px 28px", borderColor: "rgba(139,148,158,0.4)" }}>
          <div style={{ color: C.muted, fontWeight: 700, fontSize: 28, fontFamily: MONO }}>
            RSI NGÀY 37,74 · MACD HISTOGRAM −33,40
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ opacity: lit(f, aMacd) }}>
              <Chip t="MACD ÂM LIỀN 5 PHIÊN" c={C.muted} fs={22} />
            </span>
            <span style={{ opacity: lit(f, aAtr) }}>
              <Chip t="ATR 88,38–93,44" c={C.amber} fs={22} />
            </span>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s05 — Kịch bản Ether: ladder ngưỡng hai chiều ----------------
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const aStamp = frameOf("s05", "Ether");
  const aZone = frameOf("s05", "Kháng cự");
  const a2400 = frameOf("s05", "Hai lần đóng ngày");
  const a2300 = frameOf("s05", "Đóng ngày dưới");
  const aThoat = frameOf("s05", "thoát phần còn lại");
  const aNguoc = frameOf("s05", "Ngược lại");
  const a2556 = frameOf("s05", "hai lần đóng trên");
  const a2626 = frameOf("s05", "trên hai nghìn sáu trăm hai mươi sáu");
  const W = SAFE.w - 52;
  return (
    <AbsoluteFill>
      <Badge label="KỊCH BẢN" c={C.text} />
      {/* Con dấu verdict — đập dứt đoạt */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 265, display: "flex", justifyContent: "center" }}>
        <Stamp at={aStamp} c={C.red} rotate={-2}>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 38, letterSpacing: 2, fontFamily: FONT }}>
            ETH: GIẢM TỪNG PHẦN
          </span>
        </Stamp>
      </div>
      {/* Ladder ngưỡng — vị trí theo giá trị, 2 chiều */}
      <div style={{ position: "absolute", left: SAFE.x, top: 460, width: SAFE.w }}>
        <div style={{ position: "absolute", top: 0 }}>
          <Rule at={a2626} c={C.green} fs={26} label="2.626 — CỦNG CỐ KỊCH BẢN HỒI" labelC={C.green} />
        </div>
        <div style={{ position: "absolute", top: 130 }}>
          <Rule at={a2556} c={C.green} fs={25} label="2 ĐÓNG NGÀY LIÊN TIẾP > 2.556 → TẠM DỪNG GIẢM" labelC={C.green} />
        </div>
        {/* VÙNG SÁNG — kháng cự quan trọng nhất, chậm rãi (vùng quyết định) */}
        <div style={{ position: "absolute", top: 250, opacity: lit(f, aZone, 22) }}>
          <svg width={W} height={150} viewBox={`0 0 ${W} 150`}>
            <rect x={0} y={40} width={W * lit(f, aZone, 22)} height={68} fill="rgba(210,153,34,0.16)" rx={6} />
            <line x1={0} y1={40} x2={W * lit(f, aZone, 18)} y2={40} stroke={C.amber} strokeWidth={3} />
            <line x1={0} y1={108} x2={W * lit(f, aZone, 18)} y2={108} stroke={C.amber} strokeWidth={3} />
            <text x={W - 4} y={30} fill={C.amber} fontSize={22} fontFamily={MONO} textAnchor="end">KHÁNG CỰ QUAN TRỌNG NHẤT 2.543–2.556</text>
            <text x={W - 4} y={140} fill={C.amber} fontSize={21} fontFamily={MONO} textAnchor="end">EMA10+SMA50 HỘI TỤ</text>
          </svg>
        </div>
        <div style={{ position: "absolute", top: 500 }}>
          <Rule at={a2400} c={C.red} fs={25} label="2 ĐÓNG NGÀY LIÊN TIẾP < 2.400 → GIẢM TIẾP" labelC="rgba(248,81,73,0.9)" />
        </div>
        <div style={{ position: "absolute", top: 700 }}>
          <Rule at={a2300} c={C.red} fs={25} hot={lit(f, aThoat, 16)}
            label="ĐÓNG NGÀY < 2.300 → THOÁT PHẦN CÒN LẠI" labelC={C.red} />
        </div>
      </div>
      {/* Chip phụ — ngưỡng điều kiện, không phải lệnh */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1330, display: "flex", justifyContent: "center", opacity: lit(f, aThoat) }}>
        <Chip t="NGƯỠNG ĐIỀU KIỆN — KHÔNG PHẢI LỆNH" c={C.muted} fs={24} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s06 — Solana gộp: nến xuyên dải + verdict ĐỎ (mood bg) ----------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const aPct = frameOf("s06", "mười một phẩy sáu phần trăm");
  const aClose13 = frameOf("s06", "đóng mười ba tháng mười");
  const aCount = frameOf("s06", "nến mười bốn tháng mười");
  const aE10 = frameOf("s06", "Dưới đường mười ngày");
  const aS50 = frameOf("s06", "năm mươi ngày");
  const a200 = frameOf("s06", "trên đường hai trăm ngày");
  const aRsi = frameOf("s06", "RSI");
  const aXuyen = frameOf("s06", "xuyên mép dải dưới");
  const aVerdict = frameOf("s06", "GIẢM TỶ TRỌNG");
  const a12h = frameOf("s06", "RSI mười hai giờ");
  const aSat = frameOf("s06", "sát quá bán");
  const aDn = frameOf("s06", "Đóng dưới");
  const aUp = frameOf("s06", "Hai phiên đóng trên");
  // Nến range 13/10 (MỘT nguồn ladder): H 108,78 → y 30; L 102,63 → y 350 — local viewBox only.
  const yOf = (v: number): number => 30 + (108.78 - v) * (320 / 6.15);
  // Râu xuyên xuống dưới vạch 105,39 rồi chấm đóng VỀ LẠI TRÊN (display-only 105,39).
  const yBand = yOf(105.39);
  const yClose = yOf(106.73);
  const yLow = yOf(102.63);
  const pierceDown = interpolate(f, [aXuyen, aXuyen + 18], [yBand, yLow], clampX);
  const pierceBack = interpolate(f, [aXuyen + 18, aXuyen + 40], [yLow, yClose], clampX);
  const wickY = Math.min(pierceDown, pierceBack);
  return (
    <AbsoluteFill>
      <MoodBg src="crypto-tradingagents-20261015/bg_s06_mood.png" />
      <BadgeDouble />
      {/* Stat card — chip −11,6% pop đầu câu; CountUp tại 'nến mười bốn…' */}
      <div style={{ position: "absolute", left: SAFE.x, top: 230, width: SAFE.w, opacity: lit(f, aPct) }}>
        <Card style={{ padding: "18px 28px", borderColor: "rgba(210,153,34,0.55)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
            <span style={{ color: C.text, fontWeight: 800, fontSize: 32 }}>SOL</span>
            <span style={{ color: C.red, fontWeight: 800, fontSize: 48, opacity: lit(f, aCount) }}>
              <CountUp at={aCount} to={104.29} dec={2} />
            </span>
            <span style={{ color: C.red, fontWeight: 700, fontSize: 26, opacity: lit(f, aCount) }}>USD</span>
            <span style={{ opacity: lit(f, aCount) }}><Chip t="NẾN 14/10 · NGUỒN KHÁC" c={C.amber} fs={22} /></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ color: C.muted, fontWeight: 700, fontSize: 24, fontFamily: MONO, opacity: lit(f, aClose13) }}>
              ĐÓNG 13/10: 106,73
            </span>
            <span style={{ opacity: lit(f, aPct, 6) }}>
              <Chip t="−11,6% TỪ 120,79 (06/10)" c={C.red} fs={21} />
            </span>
          </div>
        </Card>
      </div>
      {/* 2 vạch đỏ đè đầu — liệt kê nhanh đều tay */}
      <div style={{ position: "absolute", left: SAFE.x, top: 490, width: SAFE.w }}>
        <div style={{ position: "absolute", top: 0 }}>
          <Rule at={aE10} c={C.red} fs={26} drop label="EMA10 111,44 · ĐƯỜNG MƯỜI NGÀY" labelC="rgba(248,81,73,0.85)" />
        </div>
        <div style={{ position: "absolute", top: 88 }}>
          <Rule at={aS50} c={C.red} fs={26} drop label="SMA50 109,25 · ĐƯỜNG NĂM MƯƠI NGÀY" labelC="rgba(248,81,73,0.85)" />
        </div>
      </div>
      {/* Nến range 13/10 (H–L–C) + mép dải bị xuyên rồi đóng lại trên — một svg local */}
      <div style={{ position: "absolute", left: SAFE.x, top: 620, opacity: lit(f, aClose13) }}>
        <svg width={920} height={320} viewBox="0 0 920 380">
          {/* MÉP DẢI DƯỚI 105,39 — display only, sáng đúng cụm 'xuyên mép dải dưới' */}
          <line x1={8} y1={yBand} x2={560} y2={yBand} stroke={C.amber} strokeWidth={4} opacity={lit(f, aXuyen, 14)} />
          <text x={568} y={yBand + 7} fill={C.amber} fontSize={23} fontFamily={MONO} textAnchor="start" opacity={lit(f, aXuyen, 14)}>MÉP DẢI DƯỚI 105,39</text>
          {/* Range bar 13/10: H 108,78 — L 102,63 (không nhãn O) */}
          <line x1={250} y1={yOf(108.78)} x2={250} y2={yLow} stroke={C.red} strokeWidth={6} opacity={0.85} />
          <line x1={228} y1={yOf(108.78)} x2={272} y2={yOf(108.78)} stroke={C.red} strokeWidth={5} strokeLinecap="round" />
          <line x1={228} y1={yLow} x2={272} y2={yLow} stroke={C.red} strokeWidth={5} strokeLinecap="round" />
          <text x={302} y={yOf(108.78) + 8} fill={C.text} fontSize={24} fontFamily={MONO}>H 108,78</text>
          <text x={302} y={yLow + 8} fill={C.text} fontSize={24} fontFamily={MONO}>L 102,63</text>
          <text x={302} y={yClose + 60} fill={C.text} fontWeight={700} fontSize={24} fontFamily={MONO} opacity={lit(f, aClose13)}>ĐÓNG 106,73</text>
          {/* Râu xuyên: đầu dò rơi từ vạch xuống L rồi chấm đóng VỀ LẠI TRÊN */}
          <circle cx={250} cy={wickY} r={10} fill={C.text} opacity={lit(f, aXuyen, 8)} />
          {/* Chấm đóng cuối — về lại trên vạch */}
          <circle cx={250} cy={yClose} r={11} fill={C.text} stroke={C.amber} strokeWidth={3} opacity={lit(f, aXuyen + 40, 8)} />
        </svg>
      </div>
      {/* SMA200 xa dưới — glow nhấc nhẹ năng lượng */}
      <div style={{ position: "absolute", left: SAFE.x, top: 995, width: SAFE.w }}>
        <Rule at={a200} c={C.green} fs={27} hot={lit(f, a200, 20)}
          label="SMA200 87,02 · ĐƯỜNG HAI TRĂM NGÀY" labelC={C.green} />
      </div>
      {/* Card RSI + chip SÁT QUÁ BÁN chậm hơn nửa nhịp */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1080, width: SAFE.w, opacity: lit(f, aRsi) }}>
        <Card style={{ padding: "14px 26px", borderColor: "rgba(139,148,158,0.4)", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: C.muted, fontWeight: 700, fontSize: 27, fontFamily: MONO }}>
            RSI NGÀY 40,87 · <span style={{ opacity: lit(f, a12h) }}>RSI 12H 30,79</span>
          </span>
          <span style={{ opacity: lit(f, aSat, 12) }}>
            <Chip t="SÁT QUÁ BÁN — KHÔNG BÁN ĐUỔI" c={C.amber} fs={22} />
          </span>
        </Card>
      </div>
      {/* Con dấu verdict ĐỎ — đập dứt khoát từng chữ */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1220, display: "flex", justifyContent: "center" }}>
        <Stamp at={aVerdict} c={C.red} rotate={-2} style={{ padding: "12px 26px" }}>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 31, letterSpacing: 1, fontFamily: FONT }}>
            SOL: GIẢM TỶ TRỌNG — KHÔNG BÁN ĐUỔI
          </span>
        </Stamp>
      </div>
      {/* 2 nhánh cuối — đọc theo thứ tự: dưới trước, hồi sau */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 1330, width: SAFE.w, height: 75, padding: "10px 20px", opacity: lit(f, aDn), borderColor: "rgba(248,81,73,0.4)", display: "flex", alignItems: "center", gap: 12 }}>
        <ArrowSE c={C.red} s={36} />
        <span style={{ color: C.red, fontWeight: 800, fontSize: 25, fontFamily: MONO }}>
          ĐÓNG NGÀY &lt; 102,63 → RỦI RO RÕ HƠN
        </span>
      </Card>
      <Card style={{ position: "absolute", left: SAFE.x, top: 1420, width: SAFE.w, height: 110, padding: "10px 20px", opacity: lit(f, aUp), borderColor: "rgba(63,185,80,0.4)", display: "flex", alignItems: "center", gap: 12 }}>
        <ArrowNE c={C.green} s={36} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: C.green, fontWeight: 800, fontSize: 24, fontFamily: MONO }}>
            2 PHIÊN LIÊN TIẾP ĐÓNG &gt; 111,44
          </span>
          <span style={{ color: C.green, fontWeight: 800, fontSize: 22, fontFamily: MONO, marginTop: 4 }}>
            + HISTOGRAM CẢI THIỆN → TĂNG LẠI TỪNG BƯỚC
          </span>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

export { S04, S05, S06 };
