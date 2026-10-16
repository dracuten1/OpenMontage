// scenes_a.tsx — crypto-tradingagents-20261015: s01–s03 (self-contained).
// Mechanics inherited from cta13/cta14 (Card/Chip/Slam/CountUp/Stamp/Rule,
// layer badge, GREEDY-JOIN speech-lock anchors, static camera, vi-VN display).
// Animation order == speech order; staggers are subtraction-only. Numbers all
// from numbers_allowed_on_screen with per-number source chips; verdicts in
// Vietnamese verbatim; no tool/exchange names; no probability curves.
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

const ArrowS: React.FC<{ c: string; s?: number; op?: number }> = ({ c, s = 46, op = 1 }) => (
  <svg width={s} height={s} viewBox="0 0 54 54" style={{ opacity: op }}>
    <line x1={27} y1={8} x2={27} y2={42} stroke={c} strokeWidth={6} strokeLinecap="round" />
    <polyline points="13,30 27,44 41,30" fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

// ---------------- s01 — HOOK: ba lane → MỘT banner đỏ (hero #1, mood bg) ----------------
// Lane: chip tên + cặp giá 2 nguồn có nhãn riêng + mũi tên ↓ giữa hai chip.
const Lane: React.FC<{
  at: number; atDown: number;
  name: string; left: number; w: number;
  close13: number; open14: number; atCount: number;
  lag: number;
}> = ({ at, atDown, name, left, w, close13, open14, atCount, lag }) => {
  const f = useCurrentFrame();
  const blink = Math.max(0, Math.sin((f - atDown - lag) / 4));
  return (
    <Card style={{ position: "absolute", left, top: 380, width: w, height: 500, padding: 18, opacity: lit(f, at, 10) }}>
      <div style={{ color: C.text, fontWeight: 800, fontSize: 32, textAlign: "center" }}>{name}</div>
      {/* Chip nguồn MỜ — ĐÓNG CỬA 13/10 (nguồn ngày đã xác minh) */}
      <div style={{ marginTop: 18, opacity: 0.55 + 0.45 * blink * lit(f, atDown) }}>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 16, textAlign: "center", letterSpacing: 1 }}>
          ĐÓNG CỬA 13/10
        </div>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 30, fontFamily: MONO, textAlign: "center", marginTop: 4 }}>
          <Num v={close13} dec={2} />
        </div>
      </div>
      {/* Mũi tên ↓ nhỏ giữa hai chip — rơi tại 'cả ba thấp hơn đóng cửa hôm trước' */}
      <div style={{ display: "flex", justifyContent: "center", margin: "12px 0", opacity: lit(f, atDown, 8), transform: `translateY(${-20 * (1 - sp(f, atDown))}px)` }}>
        <ArrowS c={C.red} s={40} />
      </div>
      {/* Chip nguồn SÁNG — NẾN 14/10 · NGUỒN KHÁC */}
      <div style={{ border: `1.5px solid rgba(230,237,243,0.55)`, borderRadius: 12, padding: "10px 12px", background: "rgba(230,237,243,0.06)" }}>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 15, textAlign: "center", letterSpacing: 0.5 }}>
          NẾN 14/10 · NGUỒN KHÁC
        </div>
        <div style={{ color: C.text, fontWeight: 800, fontSize: 34, fontFamily: MONO, textAlign: "center", marginTop: 6 }}>
          <CountUp at={atCount} to={open14} dec={2} />
        </div>
      </div>
    </Card>
  );
};

const S01: React.FC = () => {
  const f = useCurrentFrame();
  const aChip = frameOf("s01", "Nến mười bốn tháng mười");
  const aBtc = frameOf("s01", "Bitcoin");
  const aEth = frameOf("s01", "Ether");
  const aSol = frameOf("s01", "Xôlana");
  const aDown = frameOf("s01", "cả ba thấp hơn");
  const aGold = frameOf("s01", "cùng kết luận");
  const aVerdict = frameOf("s01", "GIẢM TỶ TRỌNG CÓ KIỂM SOÁT");
  const aSub = frameOf("s01", "không thoát toàn bộ");
  const aQ = frameOf("s01", "Vì sao");
  const drop = sp(f, aVerdict);
  return (
    <AbsoluteFill>
      <MoodBg src="crypto-tradingagents-20261015/bg_s01_mood.png" />
      <Badge label="QUAN SÁT" c={C.blue} />
      <div style={{ position: "absolute", left: 0, width: 1080, top: 246, display: "flex", justifyContent: "center" }}>
        <Slam at={aChip}>
          <Chip t="NẾN 14/10 · NGUỒN KHÁC" c={C.blue} bg={C.blueFill} fs={28} />
        </Slam>
      </div>
      {/* 3 lane dọc theo thứ tự đọc Bitcoin → Ether → Solana */}
      <Lane at={aBtc - 8} atDown={aDown} name="BITCOIN" left={SAFE.x} w={310} close13={83095.12} open14={81682.01} atCount={aBtc} lag={0} />
      <Lane at={aEth - 5} atDown={aDown} name="ETHER" left={396} w={288} close13={2496.63} open14={2421.6} atCount={aEth} lag={4} />
      <Lane at={aSol - 2} atDown={aDown} name="SOLANA" left={690} w={310} close13={106.73} open14={104.29} atCount={aSol} lag={8} />
      {/* 3 đường kẻ HỘI TỤ về banner đỏ */}
      <svg width={920} height={100} viewBox="0 0 920 100" style={{ position: "absolute", left: SAFE.x, top: 895 }}>
        <line x1={155} y1={0} x2={460 - 148 * drop} y2={90 * drop} stroke={C.red} strokeWidth={3} opacity={0.75 * lit(f, aVerdict, 12)} />
        <line x1={460} y1={0} x2={460} y2={90 * drop} stroke={C.red} strokeWidth={3} opacity={0.75 * lit(f, aVerdict, 12)} />
        <line x1={765} y1={0} x2={460 + 148 * drop} y2={90 * drop} stroke={C.red} strokeWidth={3} opacity={0.75 * lit(f, aVerdict, 12)} />
      </svg>
      {/* Chip vàng đóng dấu */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1010, display: "flex", justifyContent: "center" }}>
        <Slam at={aGold}>
          <Chip t="CẢ BA CÙNG MỘT KẾT LUẬN" c={C.amber} bg={C.amberFill} fs={28} />
        </Slam>
      </div>
      {/* Banner đỏ hội tụ — đập xuống giữ đến hết */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1115, display: "flex", justifyContent: "center" }}>
        <Stamp at={aVerdict} c={C.red} rotate={-2} style={{ width: 860 }}>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 40, letterSpacing: 2, fontFamily: FONT }}>
            GIẢM TỶ TRỌNG CÓ KIỂM SOÁT
          </span>
          <span style={{ display: "block", color: C.text, fontWeight: 800, fontSize: 26, letterSpacing: 1, marginTop: 8, opacity: lit(f, aSub) }}>
            KHÔNG THOÁT TOÀN BỘ · KHÔNG BÁN KHỐNG
          </span>
        </Stamp>
      </div>
      {/* Câu hỏi mở — pop nâng nửa tông */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1335, display: "flex", justifyContent: "center" }}>
        <Slam at={aQ} rotate={0}>
          <Chip t="VÌ SAO GIẢM MÀ KHÔNG THOÁT?" c={C.blue} bg={C.blueFill} fs={32} style={{ boxShadow: glow(C.blue, 12) }} />
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s02 — Bitcoin ladder: trục chính ĐÓNG 13/10, nến 14/10 panel phụ ----------------
const S02: React.FC = () => {
  const f = useCurrentFrame();
  const aCount = frameOf("s02", "tám mươi ba nghìn");
  const a50 = frameOf("s02", "Trên đường năm mươi ngày");
  const a200 = frameOf("s02", "hai trăm ngày");
  const aE10 = frameOf("s02", "dưới đường mười ngày");
  const aRsi = frameOf("s02", "RSI");
  const aMacd = frameOf("s02", "MACD");
  const a584 = frameOf("s02", "dịu hơn");
  const aPanel = frameOf("s02", "nguồn khác");
  const aAp = frameOf("s02", "áp lực giảm");
  const aR1h = frameOf("s02", "RSI một giờ");
  const a4h = frameOf("s02", "bốn giờ");
  const aKet = frameOf("s02", "khung ngày trên hai đường dài");
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      {/* Stat card CountUp — speech-locked 'tám mươi ba nghìn…' */}
      <div style={{ position: "absolute", left: SAFE.x, top: 240, width: SAFE.w, opacity: lit(f, aCount) }}>
        <Card style={{ padding: "24px 30px", display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", borderColor: "rgba(88,166,255,0.4)" }}>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 34 }}>BTC</span>
          <span style={{ color: C.blue, fontWeight: 800, fontSize: 52 }}>
            <CountUp at={aCount} to={83095.12} dec={2} />
          </span>
          <span style={{ color: C.blue, fontWeight: 700, fontSize: 28 }}>USD</span>
          <span style={{ color: C.blue, fontWeight: 700, fontSize: 26 }}><Chip t="ĐÓNG CỬA 13/10" c={C.blue} fs={24} /></span>
        </Card>
      </div>
      {/* Thang bậc MỘT NGUỒN (13/10): EMA10 đè trên đầu giá — giá — SMA50 — SMA200 sâu dưới */}
      <div style={{ position: "absolute", left: SAFE.x, top: 470, width: SAFE.w }}>
        <div style={{ position: "absolute", top: 70 }}>
          <Rule at={aE10} c={C.red} fs={27} drop
            label="EMA10 83.248,99 · ĐƯỜNG MƯỜI NGÀY" labelC="rgba(248,81,73,0.85)" />
        </div>
        <div style={{ position: "absolute", top: 250, display: "flex", alignItems: "center", gap: 16, opacity: lit(f, aCount) }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: C.text, boxShadow: glow(C.blue, 18) }} />
          <span style={{ color: C.text, fontWeight: 800, fontSize: 44, fontFamily: MONO }}>GIÁ ĐÓNG 83.095,12</span>
        </div>
        <div style={{ position: "absolute", top: 410 }}>
          <Rule at={a50} c={C.green} fs={27}
            label="SMA50 81.104,76 · ĐƯỜNG NĂM MƯƠI NGÀY" labelC="rgba(63,185,80,0.9)" />
        </div>
        <div style={{ position: "absolute", top: 560 }}>
          <Rule at={a200} c={C.green} fs={27} hot={lit(f, aKet)}
            label="SMA200 72.128,75 · ĐƯỜNG HAI TRĂM NGÀY" labelC={C.green} />
        </div>
      </div>
      {/* Card chỉ báo — đọc phẳng như thước */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1130, width: SAFE.w, opacity: lit(f, aRsi) }}>
        <Card style={{ padding: "18px 28px", borderColor: "rgba(139,148,158,0.4)", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: C.muted, fontWeight: 700, fontSize: 28, fontFamily: MONO }}>
            RSI NGÀY 51,87 · TRUNG TÍNH
          </span>
          <span style={{ color: C.muted, fontWeight: 700, fontSize: 28, fontFamily: MONO, opacity: lit(f, aMacd) }}>
            MACD HISTOGRAM −525,18
          </span>
          <span style={{ opacity: lit(f, a584) }}>
            <Chip t="DỊU TỪ −584,91 · 12/10" c={C.muted} fs={22} />
          </span>
        </Card>
      </div>
      {/* Panel phụ NẾN 14/10 · NGUỒN KHÁC — tách biệt khỏi trục chính */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1295, width: SAFE.w, opacity: lit(f, aPanel, 12) }}>
        <Card style={{ padding: "16px 26px", borderColor: "rgba(210,153,34,0.55)" }}>
          <div style={{ color: C.amber, fontWeight: 800, fontSize: 26, fontFamily: MONO }}>
            NẾN 14/10 · NGUỒN KHÁC — BTC 81.682,01
          </div>
          <div style={{ color: C.red, fontWeight: 800, fontSize: 25, marginTop: 8, opacity: lit(f, aAp) }}>
            ÁP LỰC GIẢM KHUNG NGẮN
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ opacity: lit(f, aR1h) }}><Chip t="RSI 1H 33,68" c={C.muted} fs={21} /></span>
            <span style={{ opacity: lit(f, a4h) }}><Chip t="RSI 4H 38,08" c={C.muted} fs={21} /></span>
            <span style={{ opacity: lit(f, aKet) }}><Chip t="KHUNG NGÀY VẪN TRÊN ĐƯỜNG 50 + 200 NGÀY" c={C.green} fs={21} /></span>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s03 — Kịch bản Bitcoin: 2 mốc nến 4 giờ, nếu-thì thuần ----------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const aStamp = frameOf("s03", "Kết luận");
  const a2moc = frameOf("s03", "hai mốc");
  const aDnIn = frameOf("s03", "Đóng bốn giờ dưới");
  const d81207 = frameOf("s03", "tám mươi mốt nghìn hai trăm lẻ bảy");
  const aVung = frameOf("s03", "không lấy lại vùng");
  const aRoi = frameOf("s03", "rủi ro giảm tiếp");
  const aNguoc = frameOf("s03", "Ngược lại");
  const aLay = frameOf("s03", "lấy lại", 2);
  const a83 = frameOf("s03", "đóng bốn giờ trên khoảng");
  const aImp = frameOf("s03", "kèm chỉ báo cải thiện");
  const aRes = frameOf("s03", "dừng giảm");
  return (
    <AbsoluteFill>
      <Badge label="KỊCH BẢN" c={C.text} />
      {/* Con dấu verdict đập trước — đọc chậm từng chữ như đóng dấu */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 270, display: "flex", justifyContent: "center" }}>
        <Stamp at={aStamp} c={C.red} rotate={-3}>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 34, letterSpacing: 2, fontFamily: FONT }}>
            BTC: GIẢM TỶ TRỌNG
          </span>
          <span style={{ display: "block", color: C.text, fontWeight: 800, fontSize: 28, letterSpacing: 2, marginTop: 6 }}>
            — KHÔNG THOÁT TOÀN BỘ
          </span>
        </Stamp>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 468, display: "flex", justifyContent: "center", opacity: lit(f, a2moc) }}>
        <Chip t="2 MỐC · NẾN 4 GIỜ" c={C.text} fs={24} />
      </div>
      {/* Nhánh GIẢM THÊM (đọc trước — khối trên) */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 640, width: SAFE.w, height: 400, padding: 24, opacity: lit(f, aDnIn), borderColor: "rgba(248,81,73,0.4)" }}>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 24 }}>ĐÓNG 4H &lt;</div>
        <div style={{ marginTop: 4 }}>
          <Dig f={f} at={d81207} c={C.red}>81.207,46</Dig>
        </div>
        <div style={{ color: C.red, fontWeight: 800, fontSize: 30, marginTop: 12, opacity: lit(f, aVung) }}>
          KHÔNG LẤY LẠI VÙNG 81.207–81.444
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24, opacity: lit(f, aRoi), transform: `translateY(${16 * (1 - sp(f, aRoi))}px)` }}>
          <ArrowSE c={C.red} s={44} />
          <span style={{ color: C.red, fontWeight: 800, fontSize: 32 }}>RỦI RO GIẢM TIẾP</span>
        </div>
      </Card>
      {/* Chữ chuyển nhánh — NGƯỢC LẠI nhấn sau ngắt */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 560, display: "flex", justifyContent: "center" }}>
        <Slam at={aNguoc} rotate={0}>
          <Chip t="NGƯỢC LẠI" c={C.text} fs={26} style={{ opacity: lit(f, aNguoc) }} />
        </Slam>
      </div>
      {/* Nhánh HỒI (đọc sau — khối dưới) */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 1060, width: SAFE.w, height: 440, padding: 24, opacity: lit(f, aLay), borderColor: "rgba(63,185,80,0.4)" }}>
        <div style={{ color: C.green, fontWeight: 800, fontSize: 30, fontFamily: MONO }}>
          LẤY LẠI 82.422–82.640
        </div>
        <div style={{ color: C.green, fontWeight: 800, fontSize: 30, fontFamily: MONO, marginTop: 10, opacity: lit(f, a83) }}>
          ĐÓNG 4H &gt; ~83.100
        </div>
        <div style={{ marginTop: 14, opacity: lit(f, aImp) }}>
          <Chip t="RSI/MACD CẢI THIỆN" c={C.green} fs={22} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 22, opacity: lit(f, aRes), transform: `translateY(${16 * (1 - sp(f, aRes))}px)` }}>
          <ArrowNE c={C.green} s={42} />
          <span style={{ color: C.green, fontWeight: 800, fontSize: 30 }}>DỪNG GIẢM, KHÔI PHỤC DẦN</span>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

export { S01, S02, S03 };
