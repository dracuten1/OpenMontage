// Episode.tsx — crypto-tradingagents-20261013-mtf (VERTICAL 1080x1920 @30fps, 10 scenes).
// Bespoke dark-fintech-terminal composition, speech-locked via timing.ts frameOf().
// Series mechanics (bản sáng crypto-tradingagents-20261013): Card/Chip/slam/CountUp/
// lit, layer badge per scene, static camera (only mood-bg drift 1.0→1.03), vi-VN
// fmtVi, TSX-only data (no gen-number images). All on-screen numbers are copied
// verbatim from research_digest.numbers_allowed_on_screen (via scene_plan
// on_screen_text) — never rounded, never invented. FORMING always carries its own
// amber "FORMING" label, never mixed into closed-candle rows (d-guard).
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
import { SCENE_TIMING, TOTAL_FRAMES, frameOf, getSceneTiming } from "./timing";

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
const flashAt = (f: number, at: number) =>
  Math.max(0, Math.sin((f - at) / 4)) * 14;

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

// Mood canvas: only allowed "camera" move in the video — a slow 1.0→1.03 drift
// across the scene. Static everywhere else (no zoom/punch/Ken Burns on content).
const MoodBg: React.FC<{ src: string; frames: number }> = ({ src, frames }) => {
  const f = useCurrentFrame();
  const k = frames > 0 ? Math.min(1, f / frames) : 1;
  return (
    <AbsoluteFill>
      <img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.32,
          transform: `scale(${1 + 0.03 * k})`,
        }}
      />
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.58)" }} />
    </AbsoluteFill>
  );
};

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
          fontSize: 44,
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
  fs?: number;
}> = ({ at, c, label, labelC, fs = 26 }) => {
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
          transform: `scaleX(${k})`,
          transformOrigin: "left center",
          boxShadow: glow(c, 10),
        }}
      />
    </div>
  );
};

// ---------------- s01 — HOOK: hai verdict trong một ngày (hero #1) ----------------
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const aBuy = frameOf("s01", "khuyến nghị mua Bitcoin");
  const aSell = frameOf("s01", "hạ tỷ trọng");
  const aOk = frameOf("s01", "cả hai lần nó đều đúng");
  const aQ = frameOf("s01", "Chuyện gì đã đổi quyết định");
  const nFrames = getSceneTiming("s01").scene_frames;
  const pulseG = flashAt(f, aOk + 6);
  const pulseA = flashAt(f, aOk + 9);
  const arrowRot = interpolate(f, [aSell, aSell + 12], [0, 180], clampX);
  const arrowC = interpolateColors(lit(f, aSell, 10), [0, 1], [C.green, C.amber]);
  return (
    <AbsoluteFill>
      <MoodBg src="crypto-tradingagents-20261013-mtf/hero_s01_mood.png" frames={nFrames} />
      <Badge label="QUAN SÁT" c={C.blue} />
      {/* Chip AI đỉnh khung */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 250, display: "flex", justifyContent: "center" }}>
        <Slam at={aBuy}>
          <Chip t="AI" c={C.blue} bg={C.blueFill} fs={36} style={{ fontFamily: MONO, padding: "12px 34px" }} />
        </Slam>
      </div>
      {/* Card TRÁI — SÁNG · MUA */}
      <Card
        style={{
          position: "absolute",
          left: SAFE.x,
          top: 420,
          width: 440,
          height: 560,
          padding: 30,
          opacity: lit(f, aBuy),
          borderColor: "rgba(63,185,80,0.5)",
          boxShadow: glow(C.green, pulseG),
        }}
      >
        <div style={{ color: C.green, fontWeight: 800, fontSize: 34, letterSpacing: 1 }}>
          SÁNG 13/10 · MUA
        </div>
        <div style={{ marginTop: 34, color: C.muted, fontWeight: 700, fontSize: 26 }}>
          Entry
        </div>
        <div style={{ color: C.green, fontWeight: 800, fontSize: 46, opacity: lit(f, aBuy + 6) }}>
          83.679,47
        </div>
        <div style={{ marginTop: 22, color: C.muted, fontWeight: 700, fontSize: 26 }}>SL</div>
        <div style={{ color: C.green, fontWeight: 800, fontSize: 46, opacity: lit(f, aBuy + 12) }}>
          82.722,11
        </div>
      </Card>
      {/* Card PHẢI — TỐI · HẠ TỶ TRỌNG */}
      <Card
        style={{
          position: "absolute",
          left: 560,
          top: 420,
          width: 440,
          height: 560,
          padding: 30,
          opacity: lit(f, aSell),
          borderColor: "rgba(210,153,34,0.55)",
          boxShadow: glow(C.amber, pulseA),
        }}
      >
        <div style={{ color: C.amber, fontWeight: 800, fontSize: 34, letterSpacing: 1 }}>
          TỐI 19:53 · HẠ TỶ TRỌNG
        </div>
        <div style={{ marginTop: 44, color: C.text, fontWeight: 800, fontSize: 48, fontFamily: MONO, opacity: lit(f, aSell + 8) }}>
          ≤50%
        </div>
        <div style={{ color: C.amber, fontWeight: 700, fontSize: 30, marginTop: 10, opacity: lit(f, aSell + 8) }}>
          PHÂN BỔ CHUẨN
        </div>
      </Card>
      {/* Mũi tên giữa đảo chiều MUA→HẠ */}
      <div
        style={{
          position: "absolute",
          left: 516,
          top: 620,
          width: 48,
          height: 200,
          opacity: lit(f, aBuy + 4),
        }}
      >
        <svg width={48} height={200} viewBox="0 0 48 200" style={{ transform: `rotate(${arrowRot}deg)`, transformOrigin: "24px 100px" }}>
          <line x1={24} y1={188} x2={24} y2={26} stroke={arrowC} strokeWidth={7} strokeLinecap="round" />
          <polyline points="8,44 24,20 40,44" fill="none" stroke={arrowC} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {/* Chip ĐÚNG CẢ HAI LẦN */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1080, display: "flex", justifyContent: "center" }}>
        <Slam at={aOk}>
          <Chip t="ĐÚNG CẢ HAI LẦN" c={C.blue} bg={C.blueFill} fs={34} style={{ boxShadow: glow(C.blue, 16) }} />
        </Slam>
      </div>
      {/* Câu hỏi mở */}
      <div style={{ position: "absolute", left: SAFE.x, width: SAFE.w, top: 1300 }}>
        <Slam at={aQ + 2}>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 40, textAlign: "center", lineHeight: 1.4 }}>
            CHUYỆN GÌ ĐÃ ĐỔI QUYẾT ĐỊNH CỦA NÓ,
            <br />
            CHỈ TRONG MỘT NGÀY?
          </div>
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s02 — Chương 1: quyết định sáng trên dữ liệu cũ ----------------
const S02: React.FC = () => {
  const f = useCurrentFrame();
  const aH = frameOf("s02", "rất cụ thể");
  const aEnt = frameOf("s02", "tám mươi ba nghìn sáu trăm bảy mươi chín");
  const aSl = frameOf("s02", "tám mươi hai nghìn bảy trăm hai mươi hai");
  const aTL = frameOf("s02", "nến ngày mười một tháng mười");
  const a13 = frameOf("s02", "hôm nay đã là mười ba");
  const aTr = frameOf("s02", "trễ hai phiên");
  const blink = 0.55 + 0.45 * Math.max(0, Math.sin((f - a13) / 5));
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      <Header at={aH} t="CHƯƠNG 1 · BUỔI SÁNG" />
      {/* 2 stat card CountUp */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 420, width: 440, height: 300, padding: 30, opacity: lit(f, aEnt - 4), borderColor: "rgba(63,185,80,0.4)" }}>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 28 }}>ENTRY</div>
        <div style={{ color: C.green, fontWeight: 800, fontSize: 54, marginTop: 22 }}>
          <CountUp at={aEnt} to={83679.47} dec={2} />
        </div>
        <div style={{ color: C.green, fontWeight: 700, fontSize: 26, marginTop: 14 }}>USD</div>
      </Card>
      <Card style={{ position: "absolute", left: 560, top: 420, width: 440, height: 300, padding: 30, opacity: lit(f, aSl - 4), borderColor: "rgba(248,81,73,0.4)" }}>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 28 }}>STOP LOSS</div>
        <div style={{ color: C.red, fontWeight: 800, fontSize: 54, marginTop: 22 }}>
          <CountUp at={aSl} to={82722.11} dec={2} />
        </div>
        <div style={{ color: C.red, fontWeight: 700, fontSize: 26, marginTop: 14 }}>USD</div>
      </Card>
      {/* Chip MUA 2 đợt */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 770, display: "flex", justifyContent: "center" }}>
        <Slam at={aSl + 10}>
          <Chip t="MUA — GIẢI NGÂN 2 ĐỢT" c={C.green} bg={C.greenFill} fs={28} />
        </Slam>
      </div>
      {/* Timeline 3 nút */}
      <div style={{ position: "absolute", left: SAFE.x, top: 980, width: SAFE.w, opacity: lit(f, aTL) }}>
        <svg width={SAFE.w} height={70} viewBox={`0 0 ${SAFE.w} 70`}>
          <line x1={100} y1={35} x2={100 + 360 * lit(f, aTL, 12)} y2={35} stroke={C.green} strokeWidth={5} strokeLinecap="round" />
          <line x1={460} y1={35} x2={460 + 360 * lit(f, aTL + 6, 12)} y2={35} stroke="#30363D" strokeWidth={5} strokeDasharray="10 12" />
          <circle cx={100} cy={35} r={14} fill={C.green} opacity={lit(f, aTL)} />
          <circle cx={460} cy={35} r={12} fill="#30363D" />
          <circle cx={820} cy={35} r={14} fill={C.blue} opacity={lit(f, a13) * blink} />
        </svg>
        <div style={{ position: "relative", height: 120 }}>
          <div style={{ position: "absolute", left: 100, transform: "translateX(-50%)", top: 0, color: C.green, fontWeight: 700, fontSize: 30, fontFamily: MONO, textAlign: "center" }}>
            11/10
            <div style={{ fontSize: 19, color: C.muted, fontWeight: 700 }}>NGUỒN CUỐI</div>
          </div>
          <div style={{ position: "absolute", left: 460, transform: "translateX(-50%)", top: 0, color: "rgba(139,148,158,0.6)", fontWeight: 700, fontSize: 30, fontFamily: MONO }}>
            12/10
          </div>
          <div style={{ position: "absolute", left: 820, transform: "translateX(-50%)", top: 0, color: C.blue, fontWeight: 700, fontSize: 30, fontFamily: MONO, textAlign: "center", opacity: lit(f, a13) }}>
            13/10
            <div style={{ fontSize: 19, color: C.blue, fontWeight: 800, opacity: blink }}>HÔM NAY</div>
          </div>
        </div>
      </div>
      {/* Chip TRỄ 2 PHIÊN */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1260, display: "flex", justifyContent: "center" }}>
        <Slam at={aTr}>
          <Chip t="TRỄ 2 PHIÊN" c={C.red} bg={C.redFill} fs={32} style={{ boxShadow: glow(C.red, 16) }} />
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s03 — Chương 2: Close > High (vô lý hình học nến) ----------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const aH = frameOf("s03", "lộ điều vô lý");
  const aClose = frameOf("s03", "tám mươi ba nghìn chín trăm hai mươi mốt");
  const aHigh = frameOf("s03", "tám mươi ba nghìn tám trăm năm mươi tám");
  const aStale = frameOf("s03", "giá đang chạy");
  const aForm = frameOf("s03", "chưa đóng");
  const aBang = frameOf("s03", "không tin được");
  // Shared bar scale (geometry only — displayed numbers stay verbatim strings):
  const x0 = 300;
  const wOf = (v: number) => ((v - 83800) / 121.21) * 600;
  const wClose = wOf(83921.21);
  const wHigh = wOf(83858.1);
  const breachFlash = flashAt(f, aHigh + 8);
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      <Header at={aH} t="CHƯƠNG 2 · PHÁT HIỆN" />
      <div style={{ position: "absolute", left: 0, width: 1080, top: 392, display: "flex", justifyContent: "center", opacity: lit(f, aH + 6) }}>
        <Chip t="YAHOO · NGÀY 13/10" c={C.blue} bg={C.blueFill} fs={26} />
      </div>
      {/* Hàng CLOSE */}
      <div style={{ position: "absolute", left: SAFE.x, top: 540, width: SAFE.w }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 30, fontFamily: MONO }}>CLOSE</span>
          <span style={{ color: C.red, fontWeight: 800, fontSize: 46, fontFamily: MONO, opacity: lit(f, aClose) }}>83.921,21</span>
          <svg width={30} height={30} viewBox="0 0 30 30" style={{ opacity: lit(f, aClose + 10) }}>
            <polyline points="6,24 15,8 24,24" fill="none" stroke={C.red} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ position: "relative", height: 44, marginTop: 14 }}>
          <div style={{ position: "absolute", left: x0, top: 8, width: wClose * lit(f, aClose, 12), height: 28, background: C.red, borderRadius: 6, boxShadow: glow(C.red, 14) }} />
          {/* Vùng vượt mép High */}
          <div style={{ position: "absolute", left: x0 + wHigh, top: 8, width: Math.max(0, wClose - wHigh) * lit(f, aHigh, 10), height: 28, background: C.red, borderRadius: 6, boxShadow: glow(C.red, 10 + breachFlash) }} />
        </div>
      </div>
      {/* Hàng HIGH */}
      <div style={{ position: "absolute", left: SAFE.x, top: 760, width: SAFE.w }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ color: C.muted, fontWeight: 800, fontSize: 30, fontFamily: MONO }}>HIGH</span>
          <span style={{ color: C.muted, fontWeight: 800, fontSize: 46, fontFamily: MONO, opacity: lit(f, aHigh) }}>83.858,10</span>
          <span style={{ opacity: lit(f, aStale) }}>
            <Chip t="STALE — DỮ LIỆU CŨ" c={C.muted} fs={24} />
          </span>
        </div>
        <div style={{ position: "relative", height: 44, marginTop: 14 }}>
          <div style={{ position: "absolute", left: x0, top: 8, width: wHigh * lit(f, aHigh, 12), height: 28, background: "rgba(139,148,158,0.55)", borderRadius: 6 }} />
        </div>
      </div>
      {/* Vạch so sánh tại mép High (nét đứt, kéo qua 2 hàng) */}
      <div
        style={{
          position: "absolute",
          left: SAFE.x + x0 + wHigh,
          top: 540,
          width: 0,
          height: 380,
          borderLeft: `3px dashed ${C.text}`,
          opacity: 0.7 * lit(f, aHigh + 6),
        }}
      />
      {/* Badge FORMING (nhãn vàng riêng — không trộn hàng nến đóng) */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1080, display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
        <Slam at={aForm}>
          <div
            style={{
              border: `3px solid ${C.amber}`,
              borderRadius: 12,
              padding: "18px 30px",
              background: "rgba(13,17,23,0.8)",
              color: C.text,
              fontWeight: 800,
              fontSize: 32,
              letterSpacing: 1,
              textAlign: "center",
            }}
          >
            NẾN HÔM NAY CHƯA ĐÓNG — <span style={{ color: C.amber }}>FORMING</span>
          </div>
        </Slam>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            border: `3px solid ${C.red}`,
            color: C.red,
            fontWeight: 800,
            fontSize: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: lit(f, aBang),
            transform: `scale(${1 + 0.3 * flashAt(f, aBang) / 14})`,
            boxShadow: glow(C.red, 16),
          }}
        >
          !
        </div>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, width: SAFE.w, top: 1250, display: "flex", justifyContent: "center", opacity: lit(f, aForm + 8) }}>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 27 }}>
          Close = giá live · High = stale
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s04 — Chương 2b: hai nguồn, từ chối trộn ----------------
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const aH = frameOf("s04", "hai câu chuyện");
  const aY = frameOf("s04", "tám mươi ba nghìn hai trăm hai mươi hai");
  const aB = frameOf("s04", "tám mươi mốt nghìn tám trăm năm mươi");
  const aTwo = frameOf("s04", "hai nguồn");
  const aStamp = frameOf("s04", "từ chối trộn");
  const pulseB = flashAt(f, aTwo + 4);
  const pulseA = flashAt(f, aTwo + 7);
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      <Header at={aH} t="HAI NGUỒN GIÁ" />
      {/* Panel YAHOO */}
      <Card style={{ position: "absolute", left: SAFE.x, top: 420, width: 440, height: 560, padding: 30, opacity: lit(f, aH + 4), borderColor: "rgba(88,166,255,0.5)", boxShadow: glow(C.blue, pulseB) }}>
        <div style={{ color: C.blue, fontWeight: 700, fontSize: 26, fontFamily: MONO, lineHeight: 1.4 }}>
          YAHOO
          <br />
          SNAPSHOT 13/10
        </div>
        <div style={{ color: C.blue, fontWeight: 800, fontSize: 58, marginTop: 60 }}>
          <CountUp at={aY} to={83222.01} dec={2} />
        </div>
      </Card>
      {/* Panel BINANCE */}
      <Card style={{ position: "absolute", left: 560, top: 420, width: 440, height: 560, padding: 30, opacity: lit(f, aH + 4), borderColor: "rgba(210,153,34,0.55)", boxShadow: glow(C.amber, pulseA) }}>
        <div style={{ color: C.amber, fontWeight: 700, fontSize: 26, fontFamily: MONO, lineHeight: 1.4 }}>
          BINANCE
          <br />
          NẾN 1D ĐÃ ĐÓNG 12/10
        </div>
        <div style={{ color: C.amber, fontWeight: 800, fontSize: 58, marginTop: 60 }}>
          <CountUp at={aB} to={81850} dec={0} />
        </div>
      </Card>
      {/* Vạch so sánh nối 2 số */}
      <div
        style={{
          position: "absolute",
          left: SAFE.x,
          top: 700,
          width: SAFE.w,
          height: 0,
          borderTop: `3px dashed ${C.muted}`,
          opacity: 0.6 * lit(f, aB + 4),
        }}
      />
      {/* Stamp TỪ CHỐI TRỘN NGUỒN */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1130, display: "flex", justifyContent: "center" }}>
        <Slam at={aStamp} rotate={-6}>
          <div
            style={{
              border: `3px solid ${C.red}`,
              outline: `1.5px solid ${C.red}`,
              outlineOffset: 5,
              borderRadius: 10,
              padding: "16px 32px",
              color: C.text,
              fontWeight: 800,
              fontSize: 34,
              letterSpacing: 2,
              background: "rgba(13,17,23,0.78)",
              boxShadow: glow(C.red, 16),
            }}
          >
            TỪ CHỐI TRỘN NGUỒN
          </div>
        </Slam>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1340, display: "flex", justifyContent: "center", opacity: lit(f, aStamp + 6) }}>
        <Chip t="KHÔNG BỊA SỐ ĐIỀU HÒA" c={C.muted} fs={26} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s05 — Chương 3: nâng cấp pipeline ----------------
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const aH = frameOf("s05", "nâng cấp trong chiều");
  const aTool = frameOf("s05", "Công cụ mới");
  const aSpot = frameOf("s05", "cùng lúc bốn khung");
  const a1h = frameOf("s05", "một giờ");
  const a4h = frameOf("s05", "bốn giờ");
  const a12h = frameOf("s05", "mười hai giờ");
  const a1d = frameOf("s05", "một ngày");
  const aR1 = frameOf("s05", "chỉ tính trên nến đã đóng");
  const aR2 = frameOf("s05", "dán nhãn riêng");
  const a91 = frameOf("s05", "phần trăm thời gian đã trôi");
  const aDeb = frameOf("s05", "hai vòng");
  const TOOL = "get_multi_timeframe_snapshot";
  const typed = TOOL.slice(0, Math.floor(lit(f, aTool, 28) * TOOL.length));
  const cursor = Math.floor(f / 8) % 2 === 0 ? "▌" : " ";
  const frames = [
    { at: a1h, t: "1H" },
    { at: a4h, t: "4H" },
    { at: a12h, t: "12H" },
    { at: a1d, t: "1D" },
  ];
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      <Header at={aH} t="CHƯƠNG 3 · NÂNG CẤP" />
      {/* Code chip gõ kiểu terminal */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 420, display: "flex", justifyContent: "center", opacity: lit(f, aTool) }}>
        <div
          style={{
            background: "#010409",
            border: "1.5px solid #30363D",
            borderRadius: 14,
            padding: "20px 30px",
            color: C.green,
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: 1,
          }}
        >
          {typed}
          <span style={{ color: C.text }}>{cursor}</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 566, display: "flex", justifyContent: "center", opacity: lit(f, aSpot) }}>
        <div style={{ color: C.muted, fontWeight: 700, fontSize: 24, fontFamily: MONO, letterSpacing: 3 }}>BINANCE SPOT</div>
      </div>
      {/* 4 chip khung */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 690, display: "flex", justifyContent: "center", gap: 26 }}>
        {frames.map((fr, i) => (
          <div key={i} style={{ transform: `scale(${sp(f, fr.at)})` }}>
            <Chip t={fr.t} c={C.blue} bg={C.blueFill} fs={38} style={{ padding: "14px 30px", fontFamily: MONO }} />
          </div>
        ))}
      </div>
      {/* 2 rule card */}
      <div style={{ position: "absolute", left: SAFE.x, top: 880, width: SAFE.w, opacity: lit(f, aR1) }}>
        <Card style={{ padding: "24px 30px", borderColor: "rgba(63,185,80,0.5)" }}>
          <div style={{ color: C.green, fontWeight: 800, fontSize: 29, textAlign: "center" }}>
            CHỈ BÁO: CHỈ TÍNH TRÊN NẾN ĐÃ ĐÓNG
          </div>
        </Card>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: 1010, width: SAFE.w, opacity: lit(f, aR2) }}>
        <Card style={{ padding: "24px 30px", borderColor: "rgba(210,153,34,0.55)", display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 27, textAlign: "center" }}>
            NẾN <span style={{ color: C.amber }}>FORMING</span> → DÁN NHÃN RIÊNG + % THỜI GIAN ĐÃ TRÔI
          </div>
          <div style={{ opacity: lit(f, a91) }}>
            <Chip t="91,2%" c={C.amber} bg={C.amberFill} fs={30} style={{ fontFamily: MONO }} />
          </div>
        </Card>
      </div>
      {/* Chip tranh luận 2 vòng */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1240, display: "flex", justifyContent: "center" }}>
        <Slam at={aDeb}>
          <Chip t="TRANH LUẬN ×2 VÒNG — PHE BÒ ↔ PHE GẤU · BỘ BA RỦI RO" c={C.blue} bg={C.blueFill} fs={26} />
        </Slam>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1350, display: "flex", justifyContent: "center", opacity: lit(f, aDeb + 4) }}>
        <svg width={180} height={54} viewBox="0 0 180 54">
          <path d="M 20 40 A 60 34 0 0 1 160 40" fill="none" stroke={C.blue} strokeWidth={5} strokeLinecap="round" />
          <polyline points="150,26 164,42 146,48" fill="none" stroke={C.blue} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 160 14 A 60 34 0 0 1 20 14" fill="none" stroke={C.blue} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
          <polyline points="34,28 18,12 36,6" fill="none" stroke={C.blue} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s06 — Chương 4a: bảng MTF 4 hàng (trung tâm dữ liệu) ----------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const aH = frameOf("s06", "không đồng thuận");
  const a1h = frameOf("s06", "một giờ");
  const a11 = frameOf("s06", "mười một giờ");
  const aC1 = frameOf("s06", "tám mươi ba nghìn ba trăm sáu mươi");
  const aBar1 = frameOf("s06", "chín mươi ba phẩy bảy chín");
  const a4h = frameOf("s06", "dương nhẹ");
  const a12h = frameOf("s06", "đã âm");
  const a1d = frameOf("s06", "âm sâu");
  const aF = frameOf("s06", "Khung nhỏ");
  const aK = frameOf("s06", "không đủ đồng thuận");
  // Polarity bar geometry (display strings stay verbatim):
  const BAR = { x0: 440, maxPx: 250 };
  const pxOf = (v: number) => (Math.abs(v) / 577.16) * BAR.maxPx;
  const pulseD = flashAt(f, a1d + 10);
  const rows = [
    { at: a1h, vAt: aC1, barAt: aBar1, tf: "1H", close: "83.360,01", time: "11:00 UTC", hist: "+93,79", rsi: "52,74", barC: C.green, px: pxOf(93.79), pos: true, strong: false },
    { at: a4h, vAt: a4h + 4, barAt: a4h + 4, tf: "4H", close: "", time: "", hist: "+45,24", rsi: "50,84", barC: "rgba(63,185,80,0.62)", px: pxOf(45.24), pos: true, strong: false },
    { at: a12h, vAt: a12h + 4, barAt: a12h + 4, tf: "12H", close: "", time: "", hist: "−148,50", rsi: "49,08", barC: "rgba(248,81,73,0.62)", px: pxOf(148.5), pos: false, strong: false },
    { at: a1d, vAt: a1d + 4, barAt: a1d + 4, tf: "1D", close: "", time: "", hist: "−577,16", rsi: "47,16", barC: C.red, px: pxOf(577.16), pos: false, strong: true },
  ];
  return (
    <AbsoluteFill>
      <Badge label="QUAN SÁT" c={C.blue} />
      <Header at={aH} t="ĐA KHUNG · BINANCE · NẾN ĐÓNG" />
      {/* 4 hàng nến đóng */}
      <div style={{ position: "absolute", left: SAFE.x, top: 420, width: SAFE.w }}>
        {rows.map((r, i) => (
          <div key={i} style={{ height: 196, position: "relative", opacity: lit(f, r.at) }}>
            {/* Cột khung + close */}
            <div style={{ position: "absolute", left: 0, top: 26 }}>
              <div style={{ color: C.text, fontWeight: 800, fontSize: 40, fontFamily: MONO }}>{r.tf}</div>
              {r.time ? (
                <div style={{ color: C.muted, fontWeight: 700, fontSize: 20, fontFamily: MONO, marginTop: 4, opacity: lit(f, a11) }}>
                  {r.time}
                </div>
              ) : null}
              {r.close ? (
                <div style={{ color: C.text, fontWeight: 700, fontSize: 26, fontFamily: MONO, marginTop: 6, opacity: lit(f, aC1 + 6) }}>
                  {r.close}
                </div>
              ) : null}
            </div>
            {/* Trục 0 + thanh polarity */}
            <div style={{ position: "absolute", left: 0, top: 90, width: 620, height: 40 }}>
              <div style={{ position: "absolute", left: BAR.x0, top: 0, width: 2, height: 40, background: "#30363D" }} />
              <div
                style={{
                  position: "absolute",
                  left: r.pos ? BAR.x0 : BAR.x0 - r.px * lit(f, r.barAt, 12),
                  top: 8,
                  width: r.px * lit(f, r.barAt, 12),
                  height: 24,
                  background: r.barC,
                  borderRadius: 5,
                  boxShadow: r.strong ? glow(C.red, 10 + pulseD) : "none",
                }}
              />
            </div>
            {/* Giá trị + RSI */}
            <div style={{ position: "absolute", left: 660, top: 26, textAlign: "right" }}>
              <div style={{ color: r.pos ? C.green : C.red, fontWeight: 800, fontSize: 36, fontFamily: MONO, opacity: lit(f, r.vAt + 4) }}>
                MACD-H {r.hist}
              </div>
              <div style={{ color: C.muted, fontWeight: 700, fontSize: 26, fontFamily: MONO, marginTop: 10, opacity: lit(f, r.vAt + 10) }}>
                RSI {r.rsi}
              </div>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: "rgba(48,54,61,0.6)" }} />
          </div>
        ))}
      </div>
      {/* Hàng FORMING tách vạch — nhãn vàng riêng, không thuộc bảng nến đóng */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1276, width: SAFE.w, opacity: lit(f, aF) }}>
        <div
          style={{
            border: `2px dashed ${C.amber}`,
            borderRadius: 14,
            background: C.amberFill,
            padding: "18px 26px",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <span style={{ color: C.amber, fontWeight: 800, fontSize: 32, fontFamily: MONO, letterSpacing: 1 }}>FORMING</span>
          <span style={{ color: C.text, fontWeight: 700, fontSize: 25, fontFamily: MONO }}>
            · 12:00 UTC · C(live) 83.302,03 · 91,2% ELAPSED — KHÔNG DÙNG LÀM NẾN CUỐI
          </span>
        </div>
      </div>
      {/* Chip chốt */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1460, display: "flex", justifyContent: "center" }}>
        <Slam at={aK}>
          <Chip t="KHÔNG ĐỒNG THUẬN" c={C.red} bg={C.redFill} fs={36} style={{ boxShadow: glow(C.red, 18), letterSpacing: 2 }} />
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s07 — Chương 4b: verdict 19:53 UNDERWEIGHT (hero #2) ----------------
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const aT = frameOf("s07", "Mười chín giờ năm mươi ba");
  const aV = frameOf("s07", "hạ tỷ trọng");
  const a50 = frameOf("s07", "năm mươi phần trăm");
  const aG = frameOf("s07", "giảm dần");
  const aN1 = frameOf("s07", "không bán");
  const aN2 = frameOf("s07", "không đòn");
  const aTrio = frameOf("s07", "quản trị rủi ro");
  const aSell = frameOf("s07", "hai phiếu bán");
  const aNeu = frameOf("s07", "phiếu trung tính");
  const aPlan = frameOf("s07", "một kế hoạch");
  const nFrames = getSceneTiming("s07").scene_frames;
  const votes = [
    { t: "BÁN", c: C.red, at: aSell },
    { t: "BÁN", c: C.red, at: aSell + 4 },
    { t: "TRUNG TÍNH", c: C.muted, at: aNeu },
  ];
  return (
    <AbsoluteFill>
      <MoodBg src="crypto-tradingagents-20261013-mtf/hero_s07_mood.png" frames={nFrames} />
      <Badge label="NHẬN ĐỊNH" c={C.amber} />
      {/* Timestamp */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 290, display: "flex", justifyContent: "center" }}>
        <Slam at={aT}>
          <Chip t="19:53" c={C.muted} fs={32} style={{ fontFamily: MONO, letterSpacing: 3 }} />
        </Slam>
      </div>
      {/* Verdict card */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 420, display: "flex", justifyContent: "center" }}>
        <Slam at={aV}>
          <div
            style={{
              border: `3px solid ${C.amber}`,
              borderRadius: 22,
              background: "rgba(13,17,23,0.72)",
              padding: "38px 54px",
              textAlign: "center",
              boxShadow: glow(C.amber, 26),
            }}
          >
            <div style={{ color: C.amber, fontWeight: 800, fontSize: 66, letterSpacing: 2 }}>UNDERWEIGHT</div>
            <div style={{ color: C.text, fontWeight: 800, fontSize: 42, marginTop: 10 }}>— HẠ TỶ TRỌNG —</div>
          </div>
        </Slam>
      </div>
      {/* Counter 50% */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 780, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 14, opacity: lit(f, a50) }}>
        <span style={{ color: C.text, fontWeight: 800, fontSize: 32 }}>TỐI ĐA</span>
        <span style={{ color: C.amber, fontWeight: 800, fontSize: 64 }}>
          <CountUp at={a50} to={50} dec={0} />%
        </span>
        <span style={{ color: C.amber, fontWeight: 800, fontSize: 32 }}>PHÂN BỔ CHUẨN</span>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 900, display: "flex", justifyContent: "center", opacity: lit(f, aG) }}>
        <Chip t="GIẢM DẦN · VÀI TUẦN" c={C.muted} fs={28} />
      </div>
      {/* 2 chip phủ — gõ búa */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 990, display: "flex", justifyContent: "center", gap: 30 }}>
        <Slam at={aN1} rotate={-2}>
          <Chip t="KHÔNG BÁN KHỐNG" c={C.red} bg={C.redFill} fs={30} style={{ boxShadow: glow(C.red, 14) }} />
        </Slam>
        <Slam at={aN2} rotate={2}>
          <Chip t="KHÔNG ĐÒN BẨY" c={C.red} bg={C.redFill} fs={30} style={{ boxShadow: glow(C.red, 14) }} />
        </Slam>
      </div>
      {/* Bộ ba rủi ro */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1130, display: "flex", justifyContent: "center", opacity: lit(f, aTrio) }}>
        <div style={{ color: C.muted, fontWeight: 800, fontSize: 28, letterSpacing: 2 }}>BỘ BA RỦI RO</div>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: 1200, width: SAFE.w, display: "flex", justifyContent: "space-between" }}>
        {votes.map((v, i) => (
          <Card key={i} style={{ width: 286, height: 130, display: "flex", alignItems: "center", justifyContent: "center", opacity: lit(f, v.at), borderColor: `${v.c}88`, boxShadow: v.c === C.red ? glow(C.red, 12) : "none" }}>
            <div style={{ color: v.c, fontWeight: 800, fontSize: v.t.length > 4 ? 26 : 34, letterSpacing: 1 }}>{v.t}</div>
          </Card>
        ))}
      </div>
      {/* Mũi tên hội tụ + chip 1 KẾ HOẠCH */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1360, width: SAFE.w, display: "flex", justifyContent: "center", alignItems: "center", gap: 24 }}>
        <svg width={120} height={54} viewBox="0 0 120 54" style={{ opacity: lit(f, aPlan) }}>
          <line x1={6} y1={8} x2={60} y2={42} stroke={C.green} strokeWidth={5} strokeLinecap="round" />
          <line x1={114} y1={8} x2={60} y2={42} stroke={C.green} strokeWidth={5} strokeLinecap="round" />
          <line x1={60} y1={6} x2={60} y2={42} stroke={C.green} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
          <polyline points="50,34 60,48 70,34" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Slam at={aPlan}>
          <Chip t="1 KẾ HOẠCH" c={C.green} bg={C.greenFill} fs={34} style={{ boxShadow: glow(C.green, 16) }} />
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s08 — Kịch bản: thang kích hoạt 3 bậc nến đóng ----------------
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const aH = frameOf("s08", "tính bằng nến đóng");
  const a1 = frameOf("s08", "tám mươi mốt nghìn một trăm");
  const a25 = frameOf("s08", "hai mươi lăm phần trăm");
  const a2 = frameOf("s08", "tám mươi nghìn");
  const a3f = frameOf("s08", "muốn tăng lại");
  const a3 = frameOf("s08", "tám mươi tư nghìn năm trăm");
  const aVol = frameOf("s08", "khối lượng xác nhận");
  const volPulse = flashAt(f, aVol + 2);
  return (
    <AbsoluteFill>
      <Badge label="KỊCH BẢN" c={C.text} />
      <Header at={aH} t="KỊCH BẢN CÓ ĐIỀU KIỆN · NẾN ĐÓNG" />
      {/* Bậc 1 */}
      <div style={{ position: "absolute", left: SAFE.x, top: 420, width: SAFE.w, opacity: lit(f, a1) }}>
        <Card style={{ padding: "26px 32px", display: "flex", alignItems: "center", gap: 22, borderColor: "rgba(248,81,73,0.55)" }}>
          <div style={{ color: C.red, fontWeight: 800, fontSize: 32, fontFamily: MONO, minWidth: 420 }}>
            ĐÓNG CỬA NGÀY &lt; <CountUp at={a1} to={81100} dec={0} />
          </div>
          <svg width={54} height={30} viewBox="0 0 54 30">
            <line x1={4} y1={15} x2={42} y2={15} stroke={C.muted} strokeWidth={5} strokeLinecap="round" />
            <polyline points="34,5 48,15 34,25" fill="none" stroke={C.muted} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ color: C.red, fontWeight: 800, fontSize: 30, whiteSpace: "nowrap", opacity: lit(f, a25) }}>
            HẠ TRẦN CÒN <span style={{ fontSize: 38 }}>25%</span>
          </div>
        </Card>
      </div>
      {/* Bậc 2 */}
      <div style={{ position: "absolute", left: SAFE.x, top: 700, width: SAFE.w, opacity: lit(f, a2) }}>
        <Card style={{ padding: "26px 32px", display: "flex", alignItems: "center", gap: 18, border: `3px solid rgba(248,81,73,0.75)` }}>
          <div style={{ color: C.red, fontWeight: 800, fontSize: 34, fontFamily: MONO, minWidth: 320 }}>
            &lt; <CountUp at={a2} to={80000} dec={0} />
          </div>
          <svg width={54} height={30} viewBox="0 0 54 30">
            <line x1={4} y1={15} x2={42} y2={15} stroke={C.muted} strokeWidth={5} strokeLinecap="round" />
            <polyline points="34,5 48,15 34,25" fill="none" stroke={C.muted} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ color: C.red, fontWeight: 800, fontSize: 24, whiteSpace: "nowrap" }}>
            THOÁT PHẦN VỊ THẾ GIAO DỊCH
          </div>
        </Card>
      </div>
      {/* Bậc 3 — ngược màu, mũi tên lên */}
      <div style={{ position: "absolute", left: SAFE.x, top: 980, width: SAFE.w }}>
        <Card
          style={{
            padding: "26px 32px",
            display: "flex",
            alignItems: "center",
            gap: 22,
            opacity: 0.35 * lit(f, a3f) + 0.65 * lit(f, a3),
            borderColor: "rgba(63,185,80,0.6)",
          }}
        >
          <div style={{ color: C.green, fontWeight: 800, fontSize: 32, fontFamily: MONO, minWidth: 420 }}>
            &gt; <CountUp at={a3} to={84500} dec={0} />
          </div>
          <svg width={30} height={54} viewBox="0 0 30 54" style={{ opacity: lit(f, a3) }}>
            <line x1={15} y1={50} x2={15} y2={12} stroke={C.green} strokeWidth={5} strokeLinecap="round" />
            <polyline points="5,22 15,8 25,22" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Chip t="KHỐI LƯỢNG XÁC NHẬN" c={C.green} fs={24} style={{ boxShadow: glow(C.green, volPulse) }} />
            <div style={{ color: C.green, fontWeight: 800, fontSize: 30, whiteSpace: "nowrap", opacity: lit(f, a3) }}>
              CÂN NHẮC TĂNG LẠI
            </div>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s09 — Nhận định: vì sao không bán hết ----------------
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const aH = frameOf("s09", "cấu trúc dài hạn chưa gãy");
  const aP = frameOf("s09", "tám mươi ba nghìn hai trăm hai mươi hai");
  const a50n = frameOf("s09", "tám mươi mốt nghìn một trăm bảy");
  const a200n = frameOf("s09", "bảy mươi hai nghìn một trăm hai mươi chín");
  const aPanel = frameOf("s09", "chưa xác nhận");
  const aM = frameOf("s09", "âm năm trăm mười bảy");
  const aA = frameOf("s09", "hai phẩy sáu phần trăm");
  const aChip = aA + 45;
  return (
    <AbsoluteFill>
      <Badge label="NHẬN ĐỊNH" c={C.amber} />
      <Header at={aH} t="VÌ SAO KHÔNG BÁN HẾT?" />
      {/* Thang GIÁ → SMA50 → SMA200 */}
      <div style={{ position: "absolute", left: SAFE.x, top: 450, width: SAFE.w }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: lit(f, aP) }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: C.green, boxShadow: glow(C.green, 20) }} />
          <span style={{ color: C.text, fontWeight: 800, fontSize: 34, fontFamily: MONO }}>
            GIÁ <CountUp at={aP} to={83222.01} dec={2} />
          </span>
        </div>
        <div style={{ marginTop: 8, opacity: lit(f, aP + 8) }}>
          <Chip t="YAHOO · SNAPSHOT 13/10" c={C.blue} bg={C.blueFill} fs={22} />
        </div>
        <div style={{ marginLeft: 90, marginTop: 26 }}>
          <Rule at={a50n} c="rgba(63,185,80,0.55)" label="SMA50 · 81.107" labelC={C.green} fs={28} />
        </div>
        <div style={{ marginLeft: 180, marginTop: 8 }}>
          <Rule at={a200n} c="rgba(63,185,80,0.4)" label="SMA200 · 72.129" labelC={C.green} fs={28} />
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center", opacity: lit(f, a200n + 6) }}>
          <Chip t="CẤU TRÚC DÀI HẠN CHƯA GÃY" c={C.green} bg={C.greenFill} fs={30} />
        </div>
      </div>
      {/* Panel động lượng ngày 4 ô */}
      <div style={{ position: "absolute", left: SAFE.x, top: 1100, width: SAFE.w, display: "flex", flexWrap: "wrap", gap: 18, opacity: lit(f, aPanel) }}>
        <Card style={{ width: 444, height: 140, padding: 22, display: "flex", alignItems: "center", borderColor: "rgba(248,81,73,0.5)" }}>
          <div style={{ color: C.red, fontWeight: 800, fontSize: 31, fontFamily: MONO, opacity: lit(f, aM) }}>
            MACD-H −517,08 <span style={{ fontSize: 24 }}>(ÂM)</span>
          </div>
        </Card>
        <Card style={{ width: 444, height: 140, padding: 22, display: "flex", alignItems: "center", opacity: lit(f, aPanel + 6) }}>
          <div style={{ color: C.muted, fontWeight: 800, fontSize: 31, fontFamily: MONO }}>RSI 52,29</div>
        </Card>
        <Card style={{ width: 444, height: 140, padding: 22, display: "flex", alignItems: "center", borderColor: "rgba(210,153,34,0.5)" }}>
          <div style={{ color: C.amber, fontWeight: 800, fontSize: 30, fontFamily: MONO, opacity: lit(f, aA) }}>
            ATR 2.136,27 ≈ 2,6%
          </div>
        </Card>
        <Card style={{ width: 444, height: 140, padding: 22, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, opacity: lit(f, aA + 4) }}>
          <div style={{ color: C.muted, fontWeight: 800, fontSize: 27, fontFamily: MONO }}>BB 81.464 – 83.949</div>
          <div style={{ height: 6, background: "rgba(139,148,158,0.45)", borderRadius: 3, transform: `scaleX(${lit(f, aA + 4, 12)})`, transformOrigin: "left center" }} />
        </Card>
      </div>
      {/* Chip chốt */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1470, display: "flex", justifyContent: "center" }}>
        <Slam at={aChip}>
          <Chip t="GIỮ LẠI MỘT NỬA — ĐÚNG ĐỊNH NGHĨA UNDERWEIGHT" c={C.amber} bg={C.amberFill} fs={28} />
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- s10 — Lời biên tập: caveat + disclosure giữ đến hết ----------------
const Bookmark: React.FC = () => (
  <svg width={34} height={42} viewBox="0 0 34 42">
    <path d="M 6 4 H 28 V 38 L 17 29 L 6 38 Z" fill="none" stroke={C.blue} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

const S10: React.FC = () => {
  const f = useCurrentFrame();
  const aB = frameOf("s10", "tính theo nến đã đóng");
  const aB2 = frameOf("s10", "không bao giờ");
  const aD = frameOf("s10", "lời khuyên đầu tư");
  const aC = frameOf("s10", "đối chiếu");
  const hl = lit(f, aB2, 10);
  return (
    <AbsoluteFill>
      <Badge label="LỜI BIÊN TẬP" c={C.muted} />
      {/* Banner caveat nến đóng */}
      <div style={{ position: "absolute", left: SAFE.x, top: 480, width: SAFE.w, opacity: lit(f, aB, 12) }}>
        <Card style={{ padding: "36px 36px", borderColor: C.amber }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 32, textAlign: "center", lineHeight: 1.5 }}>
            MỌI MỨC TÍNH THEO NẾN ĐÃ ĐÓNG (UTC) ·{" "}
            <span style={{ color: interpolateColors(hl, [0, 1], [C.muted, C.amber]), fontWeight: 800 }}>
              NẾN FORMING KHÔNG DÙNG LÀM NẾN CUỐI
            </span>
          </div>
        </Card>
      </div>
      {/* Banner disclosure — GIỮ ĐẾN HẾT, không fade out */}
      <div style={{ position: "absolute", left: SAFE.x, top: 800, width: SAFE.w, opacity: lit(f, aD, 12) }}>
        <Card style={{ padding: "36px 36px" }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 32, textAlign: "center", lineHeight: 1.5 }}>
            PHÂN TÍCH TỰ ĐỘNG —{" "}
            <span style={{ fontWeight: 800, borderBottom: `4px solid ${C.amber}` }}>KHÔNG PHẢI LỜI KHUYẾN NGHỊ ĐẦU TƯ</span>
          </div>
        </Card>
      </div>
      {/* CTA */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1120, display: "flex", justifyContent: "center" }}>
        <Slam at={aC}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 16 }}>
            <Bookmark />
            <Chip t="LƯU LẠI — ĐỐI CHIẾU KHI ĐIỀU KIỆN THAY ĐỔI" c={C.blue} bg={C.blueFill} fs={30} style={{ boxShadow: glow(C.blue, 14) }} />
          </div>
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC> = {
  s01: S01, s02: S02, s03: S03, s04: S04, s05: S05,
  s06: S06, s07: S07, s08: S08, s09: S09, s10: S10,
};

export const CryptoTradingAgents20261013Mtf: React.FC = () => {
  const f = useCurrentFrame();
  const bgmVol = Math.min(
    interpolate(f, [0, 30], [0, 0.12], clampX),
    interpolate(f, [TOTAL_FRAMES - 90, TOTAL_FRAMES], [0.12, 0], clampX),
  );
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <Audio src={staticFile("crypto-tradingagents-20261013-mtf/narration_full.wav")} volume={1} />
      <Audio src={staticFile("crypto-tradingagents-20261013-mtf/bgm.mp3")} volume={bgmVol} />
      {SCENE_TIMING.map((t) => (
        <Sequence key={t.scene_id} from={t.start_frame} durationInFrames={t.scene_frames}>
          {SCENES[t.scene_id] ? <>{React.createElement(SCENES[t.scene_id])}</> : null}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
