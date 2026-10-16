// scenes_c.tsx — crypto-tradingagents-20261015: s07–s09 (self-contained).
// Mechanics inherited from scenes_a/b (Card/Chip/Slam/CountUp/Badge, glow,
// GREEDY-JOIN speech-lock anchors, static camera, vi-VN display).
// s07: bối cảnh vĩ mô + bảng 3 coin (số đúng whitelist) + banner đỏ verdict.
// s08: hai thẻ nguồn không trộn (xanh xác-minh / vàng chụp-muộn) + ✕ đỏ.
// s09: disclaimer giữ đến hết + credit nhạc. KHÔNG tên tool/sàn; fmtVi mọi số.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
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

const glow = (c: string, px: number) => `0 0 ${px}px ${c}`;

// ---------------- s07 — Nhận định: vĩ mô + bảng 3 coin + verdict đỏ ----------------
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const aLP = frameOf("s07", "lạm phát");
  const aLS = frameOf("s07", "lợi suất trái phiếu mười năm");
  const aKyVong = frameOf("s07", "kỳ vọng tăng lãi suất");
  const aDau = frameOf("s07", "dầu về");
  const aCuaBa = frameOf("s07", "cả ba");
  const a200 = frameOf("s07", "trên đường hai trăm ngày");
  const aRsi = frameOf("s07", "rsi sát quá bán");
  const aBien = frameOf("s07", "biến động rất lớn");
  const aBtc = frameOf("s07", "hai nghìn một trăm năm mươi ba");
  const aEth = frameOf("s07", "tám mươi tám");
  const aSol = frameOf("s07", "bốn phẩy bảy năm");
  const aGiam = frameOf("s07", "giảm tỷ trọng");
  const aKoBan = frameOf("s07", "không bán đuổi");
  const aKoThoat = frameOf("s07", "không thoát hẳn");
  const st = 3;
  const VC: React.FC<{ at: number; c?: string; fs?: number; children: React.ReactNode }> = ({
    at, c = C.text, fs = 32, children,
  }) => (
    <div style={{ flex: 1, textAlign: "center", color: c, fontWeight: 800, fontSize: fs, opacity: lit(f, at) }}>
      {children}
    </div>
  );
  return (
    <AbsoluteFill>
      <Badge label="NHẬN ĐỊNH" c={C.amber} />
      {/* Hàng trên — 3 chip bối cảnh vĩ mô theo thoại */}
      <div style={{ position: "absolute", left: SAFE.x, top: 236, width: SAFE.w, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
        <Slam at={aLP} rotate={0}>
          <Chip t="LẠM PHÁT NÓNG HƠN KỲ VỌNG" c={C.red} fs={26} />
        </Slam>
        <Slam at={aLS} rotate={0}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Chip t={`LỢI SUẤT ${fmtVi(10, 0)} NĂM TĂNG`} c={C.red} fs={26} />
            <span style={{ opacity: lit(f, aKyVong) }}>
              <Chip t={`KỲ VỌNG TĂNG LÃI SUẤT THÁNG ${fmtVi(10, 0)}`} c={C.muted} fs={22} />
            </span>
          </div>
        </Slam>
        <Slam at={aDau} rotate={0}>
          <Chip t={`DẦU VỀ ${fmtVi(103, 0)} ĐÔ`} c={C.amber} fs={26} />
        </Slam>
      </div>
      {/* Bảng 3 cột — BTC/ETH/SOL, dòng theo thoại, ô stagger */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 548, width: SAFE.w, padding: "24px 26px" }}>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div style={{ width: 238 }} />
          {["BITCOIN", "ETHER", "SOLANA"].map((cn, i) => (
            <div key={cn} style={{ flex: 1, textAlign: "center", color: C.text, fontWeight: 800, fontSize: 26, letterSpacing: 2, fontFamily: FONT, opacity: lit(f, aCuaBa + (i + 1) * st) }}>
              {cn}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid #30363D" }}>
          <div style={{ width: 238, display: "flex", alignItems: "center", gap: 8, opacity: lit(f, a200) }}>
            <svg width={26} height={26} viewBox="0 0 26 26">
              <polyline points="4,14 10,20 22,6" fill="none" stroke={C.green} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ color: C.muted, fontWeight: 700, fontSize: 21, fontFamily: FONT, lineHeight: 1.25 }}>
              TRÊN ĐƯỜNG {fmtVi(200, 0)} NGÀY
            </span>
          </div>
          <VC at={a200 + st} c={C.green}>
            <CountUp at={a200 + st} to={72128.75} dec={2} />
          </VC>
          <VC at={a200 + st * 2} c={C.green}>
            <CountUp at={a200 + st * 2} to={2138} dec={0} />
          </VC>
          <VC at={a200 + st * 3} c={C.green}>
            <CountUp at={a200 + st * 3} to={87.02} dec={2} />
          </VC>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid #30363D" }}>
          <div style={{ width: 238, opacity: lit(f, aRsi) }}>
            <div style={{ color: C.muted, fontWeight: 700, fontSize: 21, fontFamily: FONT, lineHeight: 1.25 }}>
              RSI KHUNG NGẮN
              <br />
              SÁT QUÁ BÁN
            </div>
            <div style={{ marginTop: 6, opacity: lit(f, aRsi + 6) }}>
              <Chip t="1H/1H/12H" c={C.muted} fs={16} style={{ padding: "3px 10px", borderRadius: 8 }} />
            </div>
          </div>
          <VC at={aRsi + st} c={C.amber} fs={36}>
            <CountUp at={aRsi + st} to={33.68} dec={2} />
          </VC>
          <VC at={aRsi + st * 2} c={C.amber} fs={36}>
            <CountUp at={aRsi + st * 2} to={30.72} dec={2} />
          </VC>
          <VC at={aRsi + st * 3} c={C.amber} fs={36}>
            <CountUp at={aRsi + st * 3} to={30.79} dec={2} />
          </VC>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid #30363D" }}>
          <div style={{ width: 238, opacity: lit(f, aBien) }}>
            <div style={{ color: C.muted, fontWeight: 700, fontSize: 21, fontFamily: FONT, lineHeight: 1.25 }}>
              ATR (BIÊN ĐỘ)
            </div>
          </div>
          <VC at={aBtc} fs={27}>
            <Num v={2153.21} dec={2} />
          </VC>
          <VC at={aEth} fs={27}>
            <Num v={88.38} dec={2} />–<Num v={93.44} dec={2} />
          </VC>
          <VC at={aSol} fs={27}>
            <Num v={4.75} dec={2} />
          </VC>
        </div>
      </Card>
      {/* Banner đỏ kết — Slam theo 'giảm bớt' (narration: GIẢM TỶ TRỌNG) */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1290, display: "flex", justifyContent: "center" }}>
        <Slam at={aGiam} rotate={-1}>
          <div style={{ border: `3px solid ${C.red}`, outline: `1.5px solid ${C.red}`, outlineOffset: 5, borderRadius: 14, background: "rgba(248,81,73,0.10)", boxShadow: glow(C.red, 24), padding: "26px 34px", textAlign: "center", maxWidth: 920, boxSizing: "border-box" }}>
            <div style={{ color: C.red, fontWeight: 800, fontSize: 42, letterSpacing: 2, fontFamily: FONT }}>
              GIẢM BỚT CÓ KIỂM SOÁT
            </div>
            <div style={{ marginTop: 12, fontWeight: 800, fontSize: 30, letterSpacing: 1, fontFamily: FONT }}>
              <span style={{ color: C.red, opacity: lit(f, aKoBan) }}>— KHÔNG BÁN ĐUỔI,</span>{" "}
              <span style={{ color: C.red, opacity: lit(f, aKoThoat) }}>KHÔNG THOÁT HẲN</span>
            </div>
          </div>
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s08 — Lời biên tập: hai nguồn, không trộn ----------------
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const aLuuY = frameOf("s08", "lưu ý");
  const aXacMinh = frameOf("s08", "số đã xác minh");
  const aC13 = frameOf("s08", "đóng cửa mười ba tháng mười");
  const aNen14 = frameOf("s08", "nến mười bốn tháng mười");
  const aMuon = frameOf("s08", "chụp muộn");
  const aTron = frameOf("s08", "không trộn");
  const aNguong = frameOf("s08", "mọi mốc là ngưỡng điều kiện");
  const aLenh = frameOf("s08", "lệnh treo");
  const aCta = frameOf("s08", "lưu video để đối chiếu");
  const aThayDoi = frameOf("s08", "điều kiện thay đổi");
  const CW = (SAFE.w - 28) / 2;
  return (
    <AbsoluteFill>
      <Badge label="LỜI BIÊN TẬP" c={C.muted} />
      <div style={{ position: "absolute", left: SAFE.x, top: 320, width: SAFE.w, opacity: lit(f, aLuuY) }}>
        <div style={{ color: C.text, fontWeight: 800, fontSize: 38, letterSpacing: 1, fontFamily: FONT }}>
          LƯU Ý NGUỒN
        </div>
      </div>
      {/* 2 thẻ nguồn cạnh nhau */}
      <div style={{ position: "absolute", left: SAFE.x, top: 430, width: SAFE.w, display: "flex", gap: 28 }}>
        <Card style={{ width: CW, padding: "28px 22px", borderColor: "rgba(63,185,80,0.6)", textAlign: "center", opacity: lit(f, aLuuY) }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <svg width={34} height={34} viewBox="0 0 34 34">
              <polyline points="6,18 13,26 28,8" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 34, color: C.text, opacity: lit(f, aC13) }}>
            ĐÓNG CỬA {fmtVi(13, 0)}/{fmtVi(10, 0)}
          </div>
          <div style={{ marginTop: 12, fontFamily: FONT, fontWeight: 700, fontSize: 23, letterSpacing: 1, color: C.green, opacity: lit(f, aXacMinh) }}>
            NGUỒN NGÀY ĐÃ XÁC MINH
          </div>
        </Card>
        <Card style={{ width: CW, padding: "28px 22px", borderColor: "rgba(210,153,34,0.6)", textAlign: "center", opacity: lit(f, aNen14) }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, opacity: lit(f, aMuon) }}>
            <svg width={36} height={34} viewBox="0 0 36 32">
              <path d="M18 3 L33 29 L3 29 Z" fill="none" stroke={C.amber} strokeWidth={4} strokeLinejoin="round" />
              <line x1={18} y1={12} x2={18} y2={20} stroke={C.amber} strokeWidth={4} strokeLinecap="round" />
              <circle cx={18} cy={25} r={2.4} fill={C.amber} />
            </svg>
          </div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 34, color: C.text, opacity: lit(f, aNen14) }}>
            NẾN {fmtVi(14, 0)}/{fmtVi(10, 0)}
          </div>
          <div style={{ marginTop: 12, fontFamily: FONT, fontWeight: 700, fontSize: 23, letterSpacing: 1, color: C.amber, opacity: lit(f, aMuon) }}>
            NGUỒN KHÁC, CHỤP MUỘN
          </div>
        </Card>
      </div>
      {/* ✕ đỏ nối 2 thẻ — 'không trộn' */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 478, display: "flex", justifyContent: "center", opacity: lit(f, aTron) }}>
        <Slam at={aTron} rotate={0}>
          <svg width={104} height={104} viewBox="0 0 104 104" style={{ filter: `drop-shadow(0 0 16px ${C.red})` }}>
            <line x1={16} y1={16} x2={88} y2={88} stroke={C.red} strokeWidth={13} strokeLinecap="round" />
            <line x1={88} y1={16} x2={16} y2={88} stroke={C.red} strokeWidth={13} strokeLinecap="round" />
          </svg>
        </Slam>
      </div>
      {/* Banner ngưỡng điều kiện */}
      <div style={{ position: "absolute", left: SAFE.x, top: 900, width: SAFE.w, opacity: lit(f, aNguong) }}>
        <Card style={{ padding: "28px 30px", borderColor: "rgba(248,81,73,0.5)", textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 33, letterSpacing: 0.5, color: C.text }}>
            MỌI MỨC = <span style={{ color: C.amber }}>NGƯỠNG ĐIỀU KIỆN</span>
          </div>
          <div style={{ marginTop: 12, fontFamily: MONO, fontWeight: 800, fontSize: 29, color: C.red, opacity: lit(f, aLenh) }}>
            — KHÔNG PHẢI LỆNH TREO
          </div>
        </Card>
      </div>
      {/* CTA cuối */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1170, display: "flex", justifyContent: "center" }}>
        <Slam at={aCta} rotate={0}>
          <div style={{ display: "inline-flex", alignItems: "center", border: `1.5px solid ${C.text}`, borderRadius: 12, padding: "14px 24px", background: "rgba(13,17,23,0.75)", boxShadow: glow(C.text, 10) }}>
            <span style={{ color: C.text, fontWeight: 800, fontSize: 30, letterSpacing: 1, fontFamily: FONT }}>
              LƯU VIDEO ĐỂ ĐỐI CHIẾU
            </span>
            <span style={{ color: C.muted, fontWeight: 700, fontSize: 24, marginLeft: 12, fontFamily: FONT, opacity: lit(f, aThayDoi) }}>
              KHI ĐIỀU KIỆN THAY ĐỔI
            </span>
          </div>
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s09 — Lời biên tập: disclaimer + credit nhạc (giữ đến hết) ----------------
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const aCrypto = frameOf("s09", "crypto");
  const aMatVon = frameOf("s09", "mất vốn");
  const aPhanTich = frameOf("s09", "phân tích có điều kiện");
  return (
    <AbsoluteFill>
      <Badge label="LỜI BIÊN TẬP" c={C.muted} />
      <div style={{ position: "absolute", left: 0, width: 1080, top: 720, display: "flex", justifyContent: "center" }}>
        <Slam at={aCrypto} rotate={0}>
          <div style={{ maxWidth: 920, textAlign: "center", padding: "0 40px", boxSizing: "border-box" }}>
            <div style={{ color: C.red, fontWeight: 800, fontSize: 52, letterSpacing: 1, lineHeight: 1.25, fontFamily: FONT, textShadow: "0 0 26px rgba(248,81,73,0.35)" }}>
              CRYPTO BIẾN ĐỘNG MẠNH
            </div>
            <div style={{ color: C.red, fontWeight: 800, fontSize: 52, letterSpacing: 1, lineHeight: 1.25, fontFamily: FONT, marginTop: 6, opacity: lit(f, aMatVon) }}>
              CÓ THỂ GÂY MẤT VỐN
            </div>
            <div style={{ marginTop: 30, color: C.muted, fontWeight: 700, fontSize: 30, letterSpacing: 1, fontFamily: FONT, opacity: lit(f, aPhanTich) }}>
              PHÂN TÍCH CÓ ĐIỀU KIỆN — KHÔNG PHẢI KHUYẾN NGHỊ ĐẦU TƯ
            </div>
          </div>
        </Slam>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, bottom: 75, textAlign: "center", color: C.muted, fontSize: 20, fontFamily: MONO, opacity: lit(f, aPhanTich, 12) }}>
        {'"Lightless Dawn" Kevin MacLeod (incompetech.com) · CC BY 4.0'}
      </div>
    </AbsoluteFill>
  );
};

export { S07, S08, S09 };
