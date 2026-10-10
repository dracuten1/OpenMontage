// News 2026-10-06 — "Tin nhanh kinh tế - tài chính" (atelier composition, VERTICAL 1080x1920).
// One <Sequence> per scene from MEASURED scene_timing.json; narration_full.wav baked per-section so
// scene audio starts exactly at each scene's start_frame. Every reveal/count-up is speech-locked
// (frameOf) to SPOKEN word times in public/news-20261006/words.json. Captions: SRT cues (verified).
// Layout per scene_plan: content x 80-1000, y 260-1500; captions own the band below y 1500.
import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring,
} from "remotion";
import { C, FONT, SAFE, SPRING, fmtVi, type Tone, toneText } from "./theme";
import { SCENE_TIMING, TOTAL_FRAMES, frameOf, frameOfEnd, getSceneTiming, type SceneId } from "./timing";
import captionsJson from "./captions.json";

export const NEWS_20261006_TOTAL_FRAMES = TOTAL_FRAMES; // 3581
const SF = (id: SceneId): number => getSceneTiming(id).scene_frames;

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const Card: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, ...style,
  }}>{children}</div>
);

const Badge: React.FC<{ tone: Tone; children?: React.ReactNode; style?: React.CSSProperties }> = ({ tone, children, style }) => (
  <div style={{
    display: "inline-block", background: tone === "gold" ? "rgba(245,196,112,0.16)" : "rgba(255,255,255,0.06)",
    color: toneText(tone), border: `2px solid ${toneText(tone)}`, borderRadius: 999,
    padding: "10px 26px", fontSize: 30, fontWeight: 800, letterSpacing: 1.5, ...style,
  }}>{children}</div>
);

const Chip: React.FC<{
  color: string; children?: React.ReactNode; dashed?: boolean; fill?: string; style?: React.CSSProperties;
}> = ({ color, children, dashed, fill = "rgba(255,255,255,0.04)", style }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 12,
    background: fill, color, border: `1.5px ${dashed ? "dashed" : "solid"} ${color}`,
    borderRadius: 14, padding: "12px 22px", fontSize: 30, fontWeight: 600, ...style,
  }}>{children}</div>
);

const SourceTag: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.muted, fontSize: 28, fontWeight: 500 }}>
    <span style={{ width: 10, height: 10, borderRadius: 5, background: C.border, display: "inline-block" }} />
    {children}
  </div>
);

const IllustrationTag: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{
    position: "absolute", top: 284, right: SAFE.x, background: "rgba(7,10,15,0.72)",
    border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 18px",
    color: C.textSoft, fontSize: 26, fontWeight: 600, zIndex: 5, ...style,
  }}>Hình minh họa</div>
);

/** Number count-up, speech-locked. `at` = scene-local trigger frame. */
const CountUp: React.FC<{
  at: number; to: number; from?: number; frames?: number; decimals?: number;
  style?: React.CSSProperties; prefix?: string; suffix?: string;
}> = ({ at, to, from = 0, frames = 36, decimals = 0, style, prefix = "", suffix = "" }) => {
  const f = useCurrentFrame();
  const v = from + (to - from) * interpolate(f - at, [0, frames], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - Math.pow(1 - x, 3),
  });
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{f < at ? "" : `${prefix}${fmtVi(v, decimals)}${suffix}`}</span>;
};

/** Ken-Burns full-bleed illustration + legibility gradient. */
const Backdrop: React.FC<{ src: string; to?: number; sceneFrames: number }> = ({ src, to = 1.03, sceneFrames }) => {
  const f = useCurrentFrame();
  const scale = interpolate(f, [0, sceneFrames], [1.0, to], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.bgDeep }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,10,15,0.42) 0%, rgba(7,10,15,0.10) 26%, rgba(7,10,15,0.62) 46%, rgba(7,10,15,0.93) 64%, #0D1117 84%)" }} />
    </AbsoluteFill>
  );
};

/** Bottom text column shared by the 5 headline (text_card) scenes. */
const BottomCol: React.FC<{ children?: React.ReactNode; top?: number }> = ({ children, top = 892 }) => (
  <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top, display: "flex", flexDirection: "column", gap: 26, zIndex: 4 }}>
    {children}
  </div>
);

const slam = (at: number, frame: number, fps: number, fromScale = 1.45) => {
  const p = spring({ frame: frame - at, fps, config: { ...SPRING, damping: 18 } });
  const op = interpolate(frame - at, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { opacity: op, transform: `scale(${fromScale + (1 - fromScale) * p})` };
};

const glow = (color: string, strength: number): React.CSSProperties => ({ boxShadow: `0 0 ${strength}px ${color}` });

// ---------------------------------------------------------------------------
// S01 — HOOK: kinetic typography, 3 slam lines + question + ticker
// ---------------------------------------------------------------------------
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a1 = frameOf("s01", "một nghìn đồng");
  const a2 = frameOf("s01", "vượt tám phần trăm");
  const a3 = frameOf("s01", "mười tám điểm");
  const a4 = frameOf("s01", "túi tiền");
  const pulse = 1 + 0.04 * Math.sin((f / 30) * Math.PI * 2);
  const rows: { at: number; tone: Tone; label: string; main: string; sub?: React.ReactNode }[] = [
    { at: a1, tone: "amber", label: "TIN 1", main: "XĂNG +1.000đ/LÍT", sub: <span>E5 · E10 — <b style={{ color: C.amber }}>KỲ 8/10</b></span> },
    { at: a2, tone: "green", label: "TIN 2", main: "LÃI TIẾT KIỆM LẦN ĐẦU >8%" },
    { at: a3, tone: "blue", label: "TIN 3", main: "VN-INDEX LỘI NGƯỢC DÒNG" },
  ];
  const tickItems = ["E5 26.569đ", "LÃI >8%", "SJC 143,5tr", "VN-INDEX +5,88", "KỲ ĐIỀU HÀNH 8/10"];
  const copyW = tickItems.length * 364; // fixed-width cells keep the marquee loop deterministic
  const tx = -((f * 2.4) % copyW);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{
        backgroundColor: C.bg,
        backgroundImage: `repeating-linear-gradient(0deg, ${C.grid} 0 1px, transparent 1px 96px), repeating-linear-gradient(90deg, ${C.grid} 0 1px, transparent 1px 96px)`,
      }} />
      <div style={{ position: "absolute", top: 292, left: SAFE.x, right: SAFE.x, display: "flex", gap: 18, alignItems: "center" }}>
        <div style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 999, padding: "10px 24px", color: C.textSoft, fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
          TIN NHANH KINH TẾ — TÀI CHÍNH
        </div>
        <div style={{ background: C.amberFill, color: C.onAmber, borderRadius: 999, padding: "10px 26px", fontSize: 30, fontWeight: 800, transform: `scale(${pulse})` }}>
          6/10
        </div>
      </div>
      <div style={{ position: "absolute", top: 430, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", gap: 24 }}>
        {rows.map((r, i) => {
          const tc = toneText(r.tone);
          return (
            <div key={i} style={{
              height: 240, borderRadius: 24, background: C.surface, border: `1px solid ${C.border}`,
              borderLeft: `10px solid ${tc}`, display: "flex", flexDirection: "column", justifyContent: "center",
              gap: 10, paddingLeft: 40, paddingRight: 40, ...slam(r.at, f, fps),
            }}>
              <div style={{ color: tc, fontSize: 28, fontWeight: 800, letterSpacing: 3 }}>{r.label}</div>
              <div style={{ color: C.text, fontSize: r.main.length > 22 ? 50 : 58, fontWeight: 800, lineHeight: 1.08 }}>{r.main}</div>
              {r.sub ? <div style={{ color: C.textSoft, fontSize: 32, fontWeight: 600 }}>{r.sub}</div> : null}
              {i === 2 ? (
                <svg width={140} height={54} viewBox="0 0 140 54" style={{ position: "absolute", right: 44, bottom: 24 }}>
                  <polyline points="4,8 52,44 92,26 136,6" fill="none" stroke={C.blue} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </div>
          );
        })}
      </div>
      <div style={{
        position: "absolute", top: 1236, left: SAFE.x, right: SAFE.x, borderRadius: 20,
        border: `2px dashed ${C.amber}`, background: "rgba(245,158,11,0.08)",
        padding: "26px 30px", textAlign: "center", color: C.text, fontSize: 46, fontWeight: 800,
        opacity: interpolate(f - a4, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        transform: `translateY(${interpolate(f - a4, [0, 10], [26, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
      }}>
        HÔM NAY TÚI TIỀN BẠN ĐỨNG Ở ĐÂU?
      </div>
      <div style={{ position: "absolute", top: 1408, left: 0, right: 0, height: 66, overflow: "hidden", background: C.bgDeep, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "row", whiteSpace: "nowrap", transform: `translateX(${tx}px)`, fontSize: 34, fontWeight: 700, color: C.textSoft }}>
          {[0, 1].map((k) => (
            <span key={k} style={{ display: "flex" }}>
              {tickItems.map((t, j) => (
                <span key={j} style={{ width: 364, textAlign: "center", color: j % 2 ? C.amber : C.textSoft }}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S02 — TIN 1 headline: dầu giảm, xăng sắp tăng (DỰ BÁO chip)
// ---------------------------------------------------------------------------
const S02: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aBadge = frameOf("s02", "xả kho dự trữ");
  const aFc = frameOf("s02", "doanh nghiệp dự báo");
  const aNum = frameOf("s02", "một nghìn một trăm");
  const numGlow = interpolate(f - aNum, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Backdrop src="news-20261006/images/img_s02.png" to={1.03} sceneFrames={SF("s02")} />
      <IllustrationTag />
      <BottomCol>
        <div style={{ ...slam(aBadge, f, fps), alignSelf: "flex-start" }}><Badge tone="amber">XĂNG DẦU</Badge></div>
        <div style={{ color: C.text, fontSize: 60, fontWeight: 800, lineHeight: 1.1 }}>DẦU GIẢM — XĂNG SẮP TĂNG</div>
        <div style={{ color: C.textSoft, fontSize: 40, fontWeight: 600, lineHeight: 1.3 }}>
          E5/E10 <span style={{ color: numGlow > 0 ? C.amber : C.text, textShadow: numGlow > 0 ? `0 0 ${18 * numGlow}px ${C.amberFill}` : "none", fontWeight: 800 }}>+1.000-1.100đ/lít</span> · kỳ điều hành 8/10
        </div>
        <div style={{
          opacity: interpolate(f - aFc, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(f - aFc, [0, 8], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
        }}>
          <Chip color={C.amber} dashed fill="rgba(245,158,11,0.06)">DỰ BÁO DOANH NGHIỆP — chưa phải quyết định điều hành</Chip>
        </div>
        <SourceTag>Lao Động · Thanh Niên</SourceTag>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S03 — TIN 1 diagram: bình quân trượt giá 10 ngày + giá E5 zero-based bar
// ---------------------------------------------------------------------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const aPrice = frameOf("s03", "hai mươi sáu nghìn");
  const aWin = frameOf("s03", "bình quân trượt giá");
  const aFund = frameOf("s03", "Quỹ bình ổn");
  const oil = [78, 77.2, 77.6, 76.1, 74.6, 75.1, 73.6, 73.1, 73.9, 72.6];
  const px = (i: number) => 40 + (i / (oil.length - 1)) * 780;
  const py = (v: number) => 200 - ((v - 72) / (78.5 - 72)) * 150;
  const winX = interpolate(f - aWin, [0, 42], [0, 780 - 170], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const barMax = 30000;
  const cur = interpolate(f - aPrice, [0, 40], [0, 26569], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fundLit = f >= aFund;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F172A" }}>
      <Card style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 300, height: 470, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: C.text, fontSize: 32, fontWeight: 800, letterSpacing: 1 }}>BÌNH QUÂN TRƯỢT GIÁ 10 NGÀY</div>
          <div style={{ color: C.muted, fontSize: 26, fontWeight: 600 }}>giá dầu thế giới · tuần qua</div>
        </div>
        <svg width={860} height={220} viewBox="0 0 860 220" style={{ marginTop: 26 }}>
          {[0, 1, 2, 3].map((k) => (
            <line key={k} x1={40} x2={820} y1={50 + k * 50} y2={50 + k * 50} stroke={C.border} strokeWidth={1} />
          ))}
          <polyline points={oil.map((v, i) => `${px(i)},${py(v)}`).join(" ")} fill="none" stroke={C.red} strokeWidth={5} strokeLinejoin="round" />
          <rect x={40 + winX} y={40} width={170} height={170} fill="rgba(96,165,250,0.14)" stroke={C.blue} strokeWidth={2} rx={8} />
          <line x1={820} x2={820} y1={40} y2={210} stroke={C.amber} strokeWidth={3} strokeDasharray="8 6" />
          <text x={812} y={30} fill={C.amber} fontSize={24} fontWeight={700} textAnchor="end" fontFamily={FONT}>kỳ 8/10</text>
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 30, paddingRight: 40, color: C.muted, fontSize: 24 }}>
          <span>10 ngày trước</span><span>hôm nay</span>
        </div>
        <div style={{ position: "absolute", right: 28, bottom: 24, opacity: fundLit ? 1 : 0.28, ...(fundLit ? glow(C.blue, 22) : {}), borderRadius: 14 }}>
          <Chip color={fundLit ? C.blue : C.muted} fill="rgba(96,165,250,0.10)">QUỸ BÌNH ỔN GIÁ</Chip>
        </div>
      </Card>
      <Card style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 812, height: 660, padding: 32 }}>
        <div style={{ color: C.muted, fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>GIÁ HIỆN HÀNH</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 6 }}>
          <div style={{ color: C.textSoft, fontSize: 44, fontWeight: 700 }}>E5 RON92</div>
          <div style={{ color: C.text, fontSize: 110, fontWeight: 800 }}>
            <CountUp at={aPrice} to={26569} />
          </div>
          <div style={{ color: C.textSoft, fontSize: 40, fontWeight: 700 }}>đ/lít</div>
        </div>
        <div style={{ marginTop: 34, marginLeft: 8, marginRight: 8 }}>
          <div style={{ position: "relative", height: 74 }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(cur / barMax) * 100}%`, background: C.blueFill, borderRadius: "12px 0 0 12px" }} />
            <div style={{ position: "absolute", left: `${(26569 / barMax) * 100}%`, top: 0, bottom: 0, width: `${(1000 / barMax) * 100}%`, background: "repeating-linear-gradient(45deg, rgba(245,158,11,0.75) 0 10px, rgba(245,158,11,0.25) 10px 20px)", borderRadius: "0 12px 12px 0" }} />
          </div>
          <div style={{ position: "relative", height: 44, marginTop: 10 }}>
            {[0, 10000, 20000, 30000].map((t) => (
              <div key={t} style={{ position: "absolute", left: `${(t / barMax) * 100}%`, transform: "translateX(-50%)", color: C.muted, fontSize: 26, fontWeight: 600 }}>
                <div style={{ width: 2, height: 12, background: C.border, margin: "0 auto 4px" }} />
                {t === 0 ? "0" : `${fmtVi(t / 1000)}k`}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 18 }}>
            <Chip color={C.blue} fill="rgba(37,99,235,0.10)">hiện hành 26.569đ</Chip>
            <Chip color={C.amber} dashed fill="rgba(245,158,11,0.06)">DỰ BÁO +1.000đ</Chip>
          </div>
        </div>
        <div style={{ marginTop: 26, color: C.muted, fontSize: 28, fontWeight: 500 }}>Giá lẻ theo bình quân 10 ngày — chưa giảm ngay theo dầu</div>
        <div style={{ position: "absolute", bottom: 26, left: 32 }}><SourceTag>Lao Động</SourceTag></div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S04 — TIN 2 headline: lãi thực nhận >8% vs Big4
// ---------------------------------------------------------------------------
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aBadge = frameOf("s04", "thực nhận");
  const aHi = frameOf("s04", "chín phẩy sáu");
  const aBig = frameOf("s04", "bích bốn");
  const uw = interpolate(f - aBadge, [6, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Backdrop src="news-20261006/images/img_s04.png" to={1.02} sceneFrames={SF("s04")} />
      <IllustrationTag />
      <BottomCol top={860}>
        <div style={{ ...slam(aBadge, f, fps), alignSelf: "flex-start" }}><Badge tone="green">TIẾT KIỆM</Badge></div>
        <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.14 }}>
          LÃI{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            THỰC NHẬN
            <div style={{ position: "absolute", left: 0, right: 0, bottom: -4, height: 8, background: C.amber, borderRadius: 4, transformOrigin: "left", transform: `scaleX(${uw})` }} />
          </span>{" "}
          LẦN ĐẦU VƯỢT 8%
        </div>
        <div style={{ color: C.textSoft, fontSize: 36, fontWeight: 600, lineHeight: 1.35 }}>Ưu đãi khách mới · gửi online — lãi niêm yết thấp hơn</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
          <div style={{ opacity: interpolate(f - aHi, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), transform: `translateX(${interpolate(f - aHi, [0, 8], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)` }}>
            <Chip color={C.green} fill="rgba(16,185,129,0.12)" style={{ fontSize: 34, fontWeight: 800 }}>8,3-9,6%/năm · ngân hàng số/TMCP</Chip>
          </div>
          <div style={{ opacity: interpolate(f - aBig, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), transform: `translateX(${interpolate(f - aBig, [0, 8], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)` }}>
            <Chip color={C.blue} fill="rgba(37,99,235,0.10)" style={{ fontSize: 34, fontWeight: 800 }}>Big4 chỉ 5,9-6,0%</Chip>
          </div>
        </div>
        <SourceTag>Tạp chí Kinh tế Tài chính</SourceTag>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S05 — TIN 2 payload: zero-based bar chart + phép tính 100 triệu
// ---------------------------------------------------------------------------
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const aOpen = frameOf("s05", "một trăm triệu");
  const aL = frameOf("s05", "chín phẩy sáu triệu");
  const aR = frameOf("s05", "sáu triệu");
  const aW = frameOf("s05", "điều kiện khách mới");
  const growA = spring({ frame: f - 2, fps: 30, config: SPRING });
  const growB = spring({ frame: f - 10, fps: 30, config: SPRING });
  const plotW = 560; // px for 0-10% (card inner 860 − 130 label col − label room)
  const tick = (v: number) => (v / 10) * plotW;
  const blink = f > aW ? (0.7 + 0.3 * Math.abs(Math.sin(((f - aW) / 45) * Math.PI))) : 1;
  const lit = (a: number) => interpolate(f - a, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 292, color: C.text, fontSize: 34, fontWeight: 800, letterSpacing: 1 }}>LÃI SUẤT TIỀT KIỆM 12 THÁNG — 0 ĐẾN 10%</div>
      <Card style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 356, height: 440, padding: 30 }}>
        {[
          { name: "NGÂN HÀNG SỐ / TMCP", lo: 8.3, hi: 9.6, color: C.greenFill, txt: C.green, g: growA, lab: "8,3-9,6%" },
          { name: "BIG4", lo: 5.9, hi: 6.0, color: C.blueFill, txt: C.blue, g: growB, lab: "5,9-6,0%" },
        ].map((b, i) => (
          <div key={i} style={{ marginBottom: 34 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: C.textSoft, fontSize: 30, fontWeight: 700, marginBottom: 10 }}>
              <span>{b.name}</span><span style={{ color: b.txt }}>{b.lab}</span>
            </div>
            <div style={{ position: "relative", height: 58, marginLeft: 130, marginRight: 100 }}>
              {[0, 2, 4, 6, 8, 10].map((v) => (
                <div key={v} style={{ position: "absolute", left: `${(v / 10) * plotW}px`, top: -6, bottom: -6, width: 1, background: v === 0 ? C.border : C.grid }} />
              ))}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: tick(b.hi) * b.g, background: b.color, borderRadius: 10, opacity: 0.92 }} />
              <div style={{ position: "absolute", left: tick(b.lo) * b.g, top: 0, bottom: 0, width: Math.max(0, tick(b.hi - b.lo) * b.g), border: `3px solid ${C.bg}`, borderRadius: 8 }} />
              <div style={{ position: "absolute", left: tick(b.hi) * b.g + 12, top: 8, color: b.txt, fontSize: 30, fontWeight: 800, opacity: b.g }}>{b.lab}</div>
            </div>
          </div>
        ))}
        <div style={{ position: "relative", marginLeft: 130, height: 30 }}>
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <div key={v} style={{ position: "absolute", left: `${(v / 10) * plotW}px`, transform: "translateX(-50%)", color: C.muted, fontSize: 24, fontWeight: 600 }}>
              {v}%
            </div>
          ))}
        </div>
      </Card>
      <Card style={{
        position: "absolute", left: SAFE.x, right: SAFE.x, top: 830, bottom: 60,
        padding: 34, display: "flex", flexDirection: "column", gap: 22,
        opacity: interpolate(f - aOpen, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        transform: `translateY(${interpolate(f - aOpen, [0, 10], [36, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
      }}>
        <div style={{ alignSelf: "flex-start" }}><Chip color={C.amber} dashed fill="rgba(245,158,11,0.06)">TÍNH TOÁN</Chip></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, opacity: 0.35 + 0.65 * lit(aL), ...(lit(aL) > 0.5 ? glow(C.greenFill, 18) : {}) as React.CSSProperties, borderRadius: 18, padding: 8 }}>
          <div style={{ color: C.textSoft, fontSize: 38, fontWeight: 700 }}>100 triệu × <span style={{ color: C.green }}>9,6%</span> =</div>
          <div style={{ color: C.green, fontSize: 74, fontWeight: 800, lineHeight: 1 }}>
            <CountUp at={aL} to={9.6} decimals={1} /> triệu<span style={{ fontSize: 40, color: C.textSoft }}>/năm</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, opacity: 0.35 + 0.65 * lit(aR), borderRadius: 18, padding: 8 }}>
          <div style={{ color: C.textSoft, fontSize: 38, fontWeight: 700 }}>100 triệu × <span style={{ color: C.blue }}>6,0%</span> =</div>
          <div style={{ color: C.blue, fontSize: 74, fontWeight: 800, lineHeight: 1 }}>
            <CountUp at={aR} to={6.0} decimals={1} /> triệu<span style={{ fontSize: 40, color: C.textSoft }}>/năm</span>
          </div>
        </div>
        <div style={{ textAlign: "center", background: "rgba(245,158,11,0.10)", border: `2px solid ${C.amberFill}`, borderRadius: 18, padding: "20px 10px", color: C.amber, fontSize: 52, fontWeight: 800 }}>
          CHÊNH <CountUp at={aR + 18} to={3.6} decimals={1} /> TRIỆU/NĂM
        </div>
        <div style={{ textAlign: "center", opacity: interpolate(f - aW, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <Chip color={C.amber} fill="rgba(245,158,11,0.08)" style={{ fontSize: 32, opacity: blink }}>⚠ Lãi cao nhất kèm điều kiện khách mới</Chip>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S06 — TIN 3 headline: VN-Index rơi 18 điểm rồi đảo chiều
// ---------------------------------------------------------------------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aFlash = frameOf("s06", "mười tám điểm");
  const aDip = frameOf("s06", "bắt đáy");
  const aClose = frameOf("s06", "năm phẩy tám tám");
  const flash = interpolate(f - aFlash, [0, 5, 20], [0, 1, 0.18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Backdrop src="news-20261006/images/img_s06.png" to={1.02} sceneFrames={SF("s06")} />
      <IllustrationTag />
      <BottomCol top={880}>
        <div style={{ ...slam(2, f, fps), alignSelf: "flex-start" }}><Badge tone="blue">CHỨNG KHOÁN</Badge></div>
        <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.14 }}>
          VN-INDEX{" "}
          <span style={{ background: `rgba(239,68,68,${0.32 * flash})`, color: C.red, borderRadius: 10, padding: "0 10px", fontWeight: 800 }}>RƠI 18 ĐIỂM</span>{" "}
          RỒI ĐẢO CHIỀU
        </div>
        <div style={{ color: C.textSoft, fontSize: 38, fontWeight: 600 }}>
          Dòng tiền nội vào{" "}
          <span style={{ color: f >= aDip ? C.green : C.textSoft, fontWeight: 800 }}>bắt đáy</span> — đóng cửa tăng
        </div>
        <div style={{ opacity: interpolate(f - aClose, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), transform: `scale(${interpolate(f - aClose, [0, 8], [0.7, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`, ...(f >= aClose ? glow(C.greenFill, 26) : {}), borderRadius: 16, alignSelf: "flex-start" }}>
          <div style={{ background: C.greenFill, color: C.onFill, borderRadius: 14, padding: "14px 26px", fontSize: 38, fontWeight: 800 }}>+5,88 điểm @ 1.759,08</div>
        </div>
        <SourceTag>Nhân Dân</SourceTag>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S07 — TIN 3 diagram: line chart phiên + thanh khoản & dòng tiền
// ---------------------------------------------------------------------------
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const aLiq = frameOf("s07", "hai mươi mốt nghìn tỷ");
  const aOut = frameOf("s07", "bán ròng");
  const aIn = frameOf("s07", "tiền nội");
  const aLesson = frameOf("s07", "thanh khoản", 2);
  const draw = interpolate(f, [0, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pts: [number, number][] = [[0, 1757], [0.12, 1752], [0.25, 1745], [0.38, 1738], [0.5, 1734], [0.62, 1737], [0.75, 1744], [0.88, 1752], [1, 1759.08]];
  const X = (t: number) => 50 + t * 730;
  const Y = (v: number) => 200 - ((v - 1730) / (1766 - 1730)) * 165;
  const lowLit = draw > 0.52;
  const closeLit = draw >= 0.99;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Card style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 292, height: 490, padding: 28 }}>
        <div style={{ color: C.text, fontSize: 32, fontWeight: 800 }}>VN-INDEX · PHIÊN 6/10</div>
        <svg width={860} height={250} viewBox="0 0 860 250" style={{ marginTop: 20 }}>
          {[1730, 1740, 1750, 1760].map((v) => (
            <g key={v}>
              <line x1={50} x2={790} y1={Y(v)} y2={Y(v)} stroke={C.border} strokeWidth={1} />
              <text x={798} y={Y(v) + 8} fill={C.muted} fontSize={24} fontFamily={FONT}>{fmtVi(v)}</text>
            </g>
          ))}
          <path d={`M ${pts.slice(0, 5).map(([t, v]) => `${X(t)},${Y(v)}`).join(" L ")}`} fill="none" stroke={C.red} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, draw / 0.55)} />
          <path d={`M ${pts.slice(4).map(([t, v]) => `${X(t)},${Y(v)}`).join(" L ")}`} fill="none" stroke={C.green} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, Math.max(0, (draw - 0.55) / 0.45))} />
          <circle cx={X(0.5)} cy={Y(1734)} r={9} fill={C.red} opacity={lowLit ? 1 : 0} />
          <circle cx={X(1)} cy={Y(1759.08)} r={9} fill={C.green} opacity={closeLit ? 1 : 0} />
        </svg>
        <div style={{ display: "flex", gap: 18, marginTop: 6 }}>
          <div style={{ opacity: lowLit ? 1 : 0.25 }}><Chip color={C.red} fill="rgba(239,68,68,0.08)">VÙNG ĐÁY 1.734</Chip></div>
          <div style={{ opacity: closeLit ? 1 : 0.25 }}><Chip color={C.green} fill="rgba(16,185,129,0.10)">+5,88 @ 1.759,08</Chip></div>
        </div>
      </Card>
      <Card style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 812, bottom: 44, padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <div style={{ color: C.muted, fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>TOÀN THỊ TRƯỜNG · 1 PHIÊN</div>
          <div style={{ color: C.text, fontSize: 88, fontWeight: 800, lineHeight: 1.05 }}>
            &gt;<CountUp at={aLiq} to={21000} frames={40} /> <span style={{ fontSize: 44, color: C.textSoft }}>tỷ đồng</span>
          </div>
          <div style={{ color: C.textSoft, fontSize: 32, fontWeight: 600 }}>HOSE khớp lệnh &gt;19.579 tỷ</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: interpolate(f - aOut, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            <span style={{ color: C.red, fontSize: 44, fontWeight: 800 }}>←</span>
            <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontSize: 32, fontWeight: 800 }}>KHỐI NGOẠI BÁN RÒNG</Chip>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: interpolate(f - aIn, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), ...(f >= aIn + 6 ? glow(C.greenFill, 22) : {}), borderRadius: 14, alignSelf: "flex-start" }}>
            <Chip color={C.green} fill="rgba(16,185,129,0.12)" style={{ fontSize: 32, fontWeight: 800 }}>LỰC MUA LÀ TIỀN NỘI</Chip>
            <span style={{ color: C.green, fontSize: 44, fontWeight: 800 }}>→</span>
          </div>
        </div>
        <div style={{ marginTop: "auto", opacity: interpolate(f - aLesson, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), borderLeft: `6px solid ${C.violet}`, paddingLeft: 22, color: C.textSoft, fontSize: 34, fontWeight: 700, lineHeight: 1.3 }}>
          Bài học: đọc phiên bằng <span style={{ color: C.violet }}>thanh khoản</span>, không chỉ bằng điểm
        </div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S08 — TIN 4 headline: bảng giá vàng SJC
// ---------------------------------------------------------------------------
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const aRing = frameOf("s08", "bốn mươi ba triệu");
  const aRingBuy = frameOf("s08", "một trăm bốn mươi triệu");
  const aBar = frameOf("s08", "bốn mươi ba phẩy năm");
  const hl = { color: C.gold, background: "rgba(245,196,112,0.14)", borderRadius: 10, padding: "2px 12px" };
  const dim = { color: C.text };
  const cell = (lit: boolean, txt: string): React.CSSProperties => (lit ? hl : dim);
  return (
    <AbsoluteFill>
      <Backdrop src="news-20261006/images/img_s08.png" to={1.0} sceneFrames={SF("s08")} />
      <IllustrationTag />
      <BottomCol top={870}>
        <div style={{ alignSelf: "flex-start" }}><Badge tone="gold">VÀNG</Badge></div>
        <div style={{ color: C.text, fontSize: 56, fontWeight: 800, lineHeight: 1.12 }}>SJC CHỐT QUANH 143 TRIỆU/LƯỢNG</div>
        <Card style={{ padding: "10px 30px", background: "rgba(22,27,34,0.94)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", color: C.muted, fontSize: 28, fontWeight: 700, padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
            <span>Loại</span><span style={{ textAlign: "center" }}>Mua vào</span><span style={{ textAlign: "right" }}>Bán ra</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", fontSize: 40, fontWeight: 800, padding: "22px 0" }}>
            <span style={{ color: C.textSoft, fontSize: 34 }}>Nhẫn SJC</span>
            <span style={{ textAlign: "center", ...cell(f >= aRingBuy, "140") }}>140</span>
            <span style={{ textAlign: "right", ...cell(f >= aRing, "143") }}>143</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", fontSize: 40, fontWeight: 800, padding: "22px 0", borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.textSoft, fontSize: 34 }}>Miếng SJC</span>
            <span style={{ textAlign: "center", ...cell(f >= aRingBuy, "140,5") }}>140,5</span>
            <span style={{ textAlign: "right", ...cell(f >= aBar, "143,5") }}>143,5</span>
          </div>
          <div style={{ color: C.muted, fontSize: 26, fontWeight: 600, paddingBottom: 12 }}>đơn vị: triệu đồng/lượng</div>
        </Card>
        <div style={{ display: "flex", gap: 18 }}>
          <Chip color={C.gold} fill="rgba(245,196,112,0.08)">Chốt phiên 6/10</Chip>
        </div>
        <SourceTag>VietnamNet · Lao Động</SourceTag>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S09 — TIN 4 diagram: thang giá dọc + spread 3 triệu + cảnh báo FOMO
// ---------------------------------------------------------------------------
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aSpread = frameOf("s09", "ba triệu");
  const aLoss = frameOf("s09", "mất ngay");
  const aTick = frameOf("s09", "hai trăm đến năm trăm nghìn");
  const aFomo = frameOf("s09", "đừng mua đuổi");
  const top = 470, bot = 1250, lo = 140, hi = 143.5;
  const Y = (v: number) => bot - ((v - lo) / (hi - lo)) * (bot - top);
  const blink = f > aLoss ? 0.55 + 0.45 * Math.abs(Math.sin(((f - aLoss) / 40) * Math.PI)) : 1;
  const ticks = ["DOJI -500k", "Phú Quý -300k", "BTMC -200k"];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", top: 300, left: SAFE.x, right: SAFE.x, color: C.text, fontSize: 34, fontWeight: 800, letterSpacing: 1, textAlign: "center" }}>
        CHÊNH MUA — BÁN SJC MIẾNG (TRIỆU/LƯỢNG)
      </div>
      <div style={{ position: "absolute", top: 352, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", ...slam(aFomo, f, fps, 1.7), zIndex: 6 }}>
        <div style={{ background: C.redFill, color: C.onFill, borderRadius: 16, padding: "16px 30px", fontSize: 44, fontWeight: 900, letterSpacing: 1, boxShadow: `0 0 40px ${C.redFill}` }}>
          ĐỪNG FOMO ĐỈNH
        </div>
      </div>
      <svg width={920} height={820} viewBox="0 0 920 820" style={{ position: "absolute", left: SAFE.x, top: 430 }}>
        <line x1={330} x2={330} y1={40} y2={820} stroke={C.border} strokeWidth={4} />
        {[140, 141, 142, 143].map((v) => (
          <g key={v}>
            <line x1={318} x2={342} y1={Y(v) - 430} y2={Y(v) - 430} stroke={C.border} strokeWidth={3} />
            <text x={300} y={Y(v) - 430 + 9} fill={C.muted} fontSize={26} textAnchor="end" fontFamily={FONT}>{fmtVi(v)}</text>
          </g>
        ))}
        {/* spread zone */}
        <rect x={356} y={Y(143.5) - 430} width={70} height={Y(140.5) - Y(143.5)} fill="rgba(239,68,68,0.20)" stroke={C.red} strokeWidth={2.5} strokeDasharray="10 8" rx={10}
          opacity={interpolate(f - aSpread, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      </svg>
      <div style={{ position: "absolute", left: 480, top: Y(142.1), opacity: interpolate(f - aSpread, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, opacity: blink }}>
          <div style={{ color: C.red, fontSize: 54, fontWeight: 900 }}>SPREAD 3 TRIỆU/LƯỢNG</div>
          <div style={{ color: C.textSoft, fontSize: 34, fontWeight: 700 }}>chi phí mất ngay nếu bán nhanh ở đỉnh</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: Y(140.5) - 24 }}>
        <Chip color={C.blue} fill="rgba(37,99,235,0.12)" style={{ fontSize: 38, fontWeight: 800 }}>MUA 140,5</Chip>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: Y(143.5) - 24 }}>
        <Chip color={C.gold} fill="rgba(245,196,112,0.12)" style={{ fontSize: 38, fontWeight: 800 }}>BÁN 143,5</Chip>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 1330, display: "flex", gap: 18, justifyContent: "center" }}>
        {ticks.map((t, i) => (
          <div key={t} style={{ opacity: interpolate(f - aTick - i * 6, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), transform: `translateY(${interpolate(f - aTick - i * 6, [0, 8], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)` }}>
            <Chip color={C.red} fill="rgba(239,68,68,0.08)">{t}</Chip>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 60, left: SAFE.x }}>
        <SourceTag>Vàng nhẫn giảm 200-500k tại chuỗi vàng lớn</SourceTag>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S10 — TIN 5 headline: 4.000 mạo danh CCCD
// ---------------------------------------------------------------------------
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aNum = frameOf("s10", "bốn nghìn");
  const aBadge = frameOf("s10", "mạo danh");
  const aKt = frameOf("s10", "kê thuế");
  const aTt = frameOf("s10", "truy thu");
  return (
    <AbsoluteFill>
      <Backdrop src="news-20261006/images/img_s10.png" to={1.02} sceneFrames={SF("s10")} />
      <IllustrationTag />
      <BottomCol top={860}>
        <div style={{ ...slam(aBadge, f, fps), alignSelf: "flex-start" }}><Badge tone="red">RỦI RO PHÁP LÝ</Badge></div>
        <div style={{ color: C.text, fontSize: 54, fontWeight: 800, lineHeight: 1.14 }}>
          <span style={{ color: C.red, fontSize: 84, fontWeight: 900 }}><CountUp at={aNum} to={4000} /></span>{" "}
          TRƯỜNG HỢP MẠO DANH CCCD MỞ DOANH NGHIỆP
        </div>
        <div style={{ color: C.textSoft, fontSize: 36, fontWeight: 600, lineHeight: 1.35 }}>Bộ Tài chính đang xác minh — người bị mạo danh có thể bị:</div>
        <div style={{ display: "flex", gap: 20 }}>
          {[{ t: "KÊ THUẾ", at: aKt }, { t: "TRUY THU", at: aTt }].map((c) => (
            <div key={c.t} style={{ opacity: interpolate(f - c.at, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), ...(f >= c.at ? glow(C.redFill, 24) : {}), borderRadius: 14 }}>
              <div style={{ border: `2.5px solid ${C.red}`, color: C.red, borderRadius: 14, padding: "16px 34px", fontSize: 40, fontWeight: 900, background: "rgba(239,68,68,0.10)" }}>{c.t}</div>
            </div>
          ))}
        </div>
        <SourceTag>Họp báo Q3-2026 · Bộ Tài chính</SourceTag>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S11 — TIN 5 CTA: tra tên tối nay + mock tra cứu
// ---------------------------------------------------------------------------
const S11: React.FC = () => {
  const f = useCurrentFrame();
  const aCta = frameOf("s11", "tối nay");
  const aSearch = frameOf("s11", "tra tên bạn");
  const aUrl = frameOf("s11", "đăng ký kinh doanh", 2);
  const aTick = frameOf("s11", "mạo danh");
  const sweep = interpolate(f - aUrl, [0, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const part = (i: number) => (f >= aUrl + i * 8 ? C.amber : C.textSoft);
  const caret = f % 30 < 15 ? 1 : 0.1;
  const tickDraw = interpolate(f - aTick, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F172A" }}>
      <div style={{ position: "absolute", top: 330, left: SAFE.x, right: SAFE.x, textAlign: "center", color: C.muted, fontSize: 34, fontWeight: 700 }}>
        ~<CountUp at={2} to={4000} frames={30} style={{ color: C.textSoft }} /> trường hợp đang rà soát
      </div>
      <Card style={{
        position: "absolute", left: SAFE.x, right: SAFE.x, top: 470, padding: 40, textAlign: "center",
        opacity: interpolate(f - aCta, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        transform: `translateY(${interpolate(f - aCta, [0, 10], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
        ...(f >= aCta + 10 ? glow("rgba(96,165,250,0.5)", 30) : {}),
      }}>
        <div style={{ color: C.blue, fontSize: 34, fontWeight: 800, letterSpacing: 3 }}>VIỆC TỐI NAY</div>
        <div style={{ color: C.text, fontSize: 72, fontWeight: 900, marginTop: 8 }}>TRA TÊN BẠN</div>
        <div style={{ marginTop: 26, fontFamily: FONT, fontWeight: 800, fontSize: 56 }}>
          <span style={{ color: part(0) }}>dangky</span>
          <span style={{ color: part(1) }}>kinhdoanh</span>
          <span style={{ color: part(2) }}>.gov</span>
          <span style={{ color: part(3) }}>.vn</span>
        </div>
        <div style={{ height: 8, background: C.border, borderRadius: 4, marginTop: 14, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${sweep * 100}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.amber})` }} />
        </div>
        <div style={{ color: C.muted, fontSize: 28, fontWeight: 600, marginTop: 14 }}>Cổng thông tin quốc gia về đăng ký kinh doanh</div>
      </Card>
      <div style={{ position: "absolute", left: 120, right: 120, top: 1090 }}>
        <div style={{ position: "absolute", top: -52, right: 0, background: "rgba(7,10,15,0.72)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 16px", color: C.textSoft, fontSize: 24, fontWeight: 600 }}>Hình minh họa</div>
        <Card style={{ padding: 34, display: "flex", flexDirection: "column", gap: 22, opacity: interpolate(f - aSearch, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, background: C.bgDeep, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "18px 24px" }}>
            <svg width={38} height={38} viewBox="0 0 38 38"><circle cx={16} cy={16} r={11} fill="none" stroke={C.muted} strokeWidth={4} /><line x1={24} y1={24} x2={34} y2={34} stroke={C.muted} strokeWidth={4} strokeLinecap="round" /></svg>
            <span style={{ color: C.textSoft, fontSize: 36, fontWeight: 600 }}>Họ và tên của bạn</span>
            <span style={{ width: 4, height: 40, background: C.blue, display: "inline-block", opacity: f >= aSearch ? caret : 0 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: f >= aTick ? 1 : 0.15 }}>
            <svg width={56} height={56} viewBox="0 0 56 56">
              <circle cx={28} cy={28} r={25} fill="none" stroke={C.green} strokeWidth={4} opacity={Math.min(1, tickDraw * 2)} />
              <path d="M 16 29 L 25 38 L 41 20" fill="none" stroke={C.green} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tickDraw} />
            </svg>
            <span style={{ color: C.green, fontSize: 42, fontWeight: 900 }}>KHÔNG PHÁT HIỆN</span>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S12 — Nhận định 1: đọc tít vs hiểu cơ chế + túi tiền 5 biến số
// ---------------------------------------------------------------------------
const S12: React.FC = () => {
  const f = useCurrentFrame();
  const aDots = frameOf("s12", "năm biến số");
  const aPulse = frameOf("s12", "một ngày");
  const aRight = frameOf("s12", "hiểu cơ chế");
  const aDim = frameOf("s12", "đọc tít");
  const dots = ["đi lại", "tiền gửi", "danh mục", "vàng", "danh tính"];
  const dim = interpolate(f - aDim, [0, 12], [1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = interpolate(f - aPulse, [0, 7, 14], [1, 1.07, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glowR = f >= aRight ? `0 0 36px rgba(52,211,153,0.35)` : "none";
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", top: 310, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center" }}>
        <Badge tone="gold" style={{ fontSize: 34, padding: "14px 36px" }}>NHẬN ĐỊNH BIÊN TẬP</Badge>
      </div>
      <div style={{ position: "absolute", top: 430, left: SAFE.x, right: SAFE.x, height: 660, display: "flex", gap: 30 }}>
        <Card style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column", gap: 20, opacity: dim }}>
          <div style={{ color: C.muted, fontSize: 34, fontWeight: 800 }}>AI CHỈ ĐỌC TÍT</div>
          <div style={{ width: 120, height: 90, borderRadius: 8, border: `3px solid ${C.muted}`, display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
            <div style={{ height: 10, width: "80%", background: C.border }} />
            <div style={{ height: 8, width: "100%", background: C.border }} />
            <div style={{ height: 8, width: "90%", background: C.border }} />
            <div style={{ height: 8, width: "60%", background: C.border }} />
          </div>
          {["Xăng tăng", "Lãi >8%", "Vàng đỉnh"].map((t) => (
            <div key={t} style={{ alignSelf: "flex-start" }}><Chip color={C.muted} fill="rgba(255,255,255,0.03)" style={{ fontSize: 28 }}>{t}</Chip></div>
          ))}
        </Card>
        <Card style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column", gap: 20, border: `2px solid ${C.green}`, boxShadow: glowR as string }}>
          <div style={{ color: C.green, fontSize: 34, fontWeight: 800 }}>AI HIỂU CƠ CHẾ</div>
          {["Trượt giá 10 ngày", "Điều kiện ưu đãi lãi suất", "Spread mua-bán vàng"].map((t) => (
            <div key={t} style={{ alignSelf: "flex-start" }}><Chip color={C.green} fill="rgba(16,185,129,0.10)" style={{ fontSize: 28, fontWeight: 700 }}>{t}</Chip></div>
          ))}
          <div style={{ marginTop: "auto", textAlign: "center", color: C.green, fontSize: 44, fontWeight: 900 }}>▼</div>
        </Card>
      </div>
      <div style={{ position: "absolute", top: 1140, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center" }}>
        <Card style={{ padding: "28px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, transform: `scale(${pulse})` }}>
          <div style={{ color: C.text, fontSize: 36, fontWeight: 800 }}>TÚI TIỀN CỦA BẠN — 5 BIẾN SỐ/1 NGÀY</div>
          <div style={{ display: "flex", gap: 34 }}>
            {dots.map((d, i) => {
              const lit = f >= aDots + i * 5;
              return (
                <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: lit ? 1 : 0.25 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 13, background: lit ? C.green : C.border, boxShadow: lit ? `0 0 16px ${C.green}` : "none" }} />
                  <div style={{ color: lit ? C.text : C.muted, fontSize: 26, fontWeight: 700 }}>{d}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S13 — Nhận định 2: rủi ro giá cả vs rủi ro pháp lý
// ---------------------------------------------------------------------------
const S13: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aBadge = frameOf("s13", "danh tính");
  const aNum = frameOf("s13", "bốn nghìn");
  const aKnow = frameOf("s13", "không hề biết");
  const aLaw = frameOf("s13", "pháp lý");
  const pulse = f > aKnow && f < aKnow + 90 ? 0.5 + 0.5 * Math.abs(Math.sin(((f - aKnow) / 30) * Math.PI)) : 0;
  const raise = spring({ frame: f - aLaw, fps, config: SPRING });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", top: 310, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", ...slam(aBadge, f, fps, 1.25) }}>
        <Badge tone="red" style={{ fontSize: 32 }}>NHẬN ĐỊNH — RỦI RO DANH TÍNH</Badge>
      </div>
      <div style={{ position: "absolute", top: 430, left: SAFE.x, right: SAFE.x, height: 680, display: "flex", gap: 30, alignItems: "stretch" }}>
        <Card style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column", gap: 22, opacity: interpolate(f - aLaw, [0, 20], [1, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <div style={{ color: C.amber, fontSize: 36, fontWeight: 800 }}>RỦI RO GIÁ CẢ</div>
          <div style={{ alignSelf: "flex-start" }}><Chip color={C.amber} fill="rgba(245,158,11,0.08)" style={{ fontSize: 28, fontWeight: 700 }}>Xăng +1.000đ <span style={{ color: C.muted, fontWeight: 600 }}>(dự báo)</span></Chip></div>
          <div style={{ alignSelf: "flex-start" }}><Chip color={C.amber} fill="rgba(245,158,11,0.08)" style={{ fontSize: 28, fontWeight: 700 }}>Vàng spread 3 triệu</Chip></div>
          <div style={{ marginTop: "auto", color: C.muted, fontSize: 26, fontWeight: 600 }}>thấy được mỗi ngày trên bảng giá</div>
        </Card>
        <Card style={{
          flex: 1, padding: 30, display: "flex", flexDirection: "column", gap: 18,
          border: `2.5px solid ${C.red}`, transform: `translateY(${(raise - 1) * -28}px) scale(${1 + (raise - 1) * 0.04})`,
          boxShadow: `0 0 ${24 + 40 * pulse}px rgba(239,68,68,${0.25 + 0.5 * pulse})`,
        }}>
          <div style={{ color: C.red, fontSize: 36, fontWeight: 900 }}>RỦI RO PHÁP LÝ</div>
          <div style={{ width: 130, height: 92, borderRadius: 10, border: `3px solid ${C.red}`, position: "relative" }}>
            <div style={{ position: "absolute", left: 10, top: 10, width: 40, height: 70, borderRadius: 6, background: "rgba(239,68,68,0.25)" }} />
            <div style={{ position: "absolute", left: 62, top: 16, width: 52, height: 8, background: "rgba(239,68,68,0.5)" }} />
            <div style={{ position: "absolute", left: 62, top: 34, width: 52, height: 8, background: "rgba(239,68,68,0.5)" }} />
            <div style={{ position: "absolute", left: 62, top: 52, width: 34, height: 8, background: "rgba(239,68,68,0.5)" }} />
          </div>
          <div style={{ color: C.text, fontSize: 62, fontWeight: 900, lineHeight: 1 }}>
            <CountUp at={aNum} to={4000} style={{ color: C.red }} />
          </div>
          <div style={{ color: C.text, fontSize: 34, fontWeight: 800, lineHeight: 1.2 }}>người <span style={{ color: C.red }}>KHÔNG HỀ BIẾT</span> mình bị mạo danh</div>
          <div style={{ marginTop: "auto", position: "relative" }}>
            <div style={{ width: 150, height: 96, borderRadius: 10, border: `3px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 34, height: 3, background: C.border }} />
              <div style={{ position: "absolute", left: 30, top: 8, width: 90, height: 22, borderRadius: 4, border: `2px solid ${C.border}` }} />
              <div style={{ position: "absolute", left: 12, top: 48, width: 126, height: 6, background: C.border }} />
              <div style={{ position: "absolute", left: 12, top: 62, width: 90, height: 6, background: C.border }} />
            </div>
            <div style={{ position: "absolute", right: 0, bottom: -2, color: C.muted, fontSize: 22, fontWeight: 600 }}>Hình minh họa</div>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S14 — Gói hành động tối nay (checklist) + outro
// ---------------------------------------------------------------------------
const S14: React.FC = () => {
  const f = useCurrentFrame();
  const tick1 = frameOf("s14", "đối chiếu");
  const tick2 = frameOf("s14", "mùng tám");
  const r3 = frameOf("s14", "ba") + 5;
  const tick3 = frameOfEnd("s14", "đỉnh");
  const r4 = frameOf("s14", "bốn") + 5;
  const tick4 = frameOfEnd("s14", "thanh khoản");
  const tick5 = frameOf("s14", "đăng ký kinh doanh");
  const aOutro = frameOf("s14", "cập bến");
  const items: { at: number; tick: number; n: string; text: React.ReactNode }[] = [
    { at: 6, tick: tick1, n: "1", text: "Đối chiếu lãi suất ngân hàng đang gửi" },
    { at: 14, tick: tick2, n: "2", text: "Đổ xăng trước 8/10 nếu bình gần cạn" },
    { at: r3, tick: tick3, n: "3", text: <>Không FOMO vàng đỉnh — <b style={{ color: C.amber }}>spread 3 triệu</b></> },
    { at: r4, tick: tick4, n: "4", text: "Đọc phiên đảo chiều bằng thanh khoản" },
    { at: frameOf("s14", "năm"), tick: tick5, n: "5", text: <><span style={{ color: f >= tick5 ? C.amber : C.text }}>dangkykinhdoanh.gov.vn</span></> },
  ];
  const shrink = interpolate(f - aOutro, [0, 20], [1, 0.86], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lift = interpolate(f - aOutro, [0, 20], [0, -90], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(f - aOutro, [0, 20], [1, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{
        position: "absolute", left: SAFE.x, right: SAFE.x, top: 60, bottom: 0,
        transform: `scale(${shrink}) translateY(${lift}px)`, opacity: fade, transformOrigin: "top center",
      }}>
        <div style={{ marginTop: 250, textAlign: "center", color: C.text, fontSize: 52, fontWeight: 900, letterSpacing: 1 }}>
          GÓI HÀNH ĐỘNG <span style={{ color: C.gold }}>TỐI NAY</span>
        </div>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((it) => {
            const shown = f >= it.at;
            const done = f >= it.tick;
            const draw = interpolate(f - it.tick, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <Card key={it.n} style={{
                padding: "26px 30px", display: "flex", alignItems: "center", gap: 24,
                opacity: shown ? (done ? 1 : 0.75) : 0.12,
                transform: `translateX(${interpolate(f - it.at, [0, 10], [-40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
                border: done ? `1.5px solid rgba(52,211,153,0.55)` : `1px solid ${C.border}`,
              }}>
                <div style={{ width: 56, height: 56, borderRadius: 28, border: `2.5px solid ${done ? C.green : C.border}`, color: done ? C.green : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900, flexShrink: 0 }}>{it.n}</div>
                <div style={{ color: C.text, fontSize: 38, fontWeight: 700, lineHeight: 1.2, flex: 1 }}>{it.text}</div>
                <svg width={54} height={54} viewBox="0 0 54 54" style={{ flexShrink: 0 }}>
                  <circle cx={27} cy={27} r={24} fill="rgba(16,185,129,0.15)" stroke={C.green} strokeWidth={3} opacity={draw > 0 ? 1 : 0.15} />
                  <path d="M 15 28 L 24 37 L 40 19" fill="none" stroke={C.green} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
                </svg>
              </Card>
            );
          })}
        </div>
      </div>
      <div style={{
        position: "absolute", left: SAFE.x, right: SAFE.x, top: 520, bottom: 420, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30,
        opacity: interpolate(f - aOutro, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        transform: `translateY(${interpolate(f - aOutro, [0, 18], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
        border: `2px solid rgba(245,196,112,0.35)`, borderRadius: 28, background: "rgba(245,196,112,0.04)",
      }}>
        <div style={{ color: C.textSoft, fontSize: 34, fontWeight: 800, letterSpacing: 6 }}>TIN NHANH KINH TẾ — TÀI CHÍNH</div>
        <div style={{ width: 120, height: 3, background: C.gold }} />
        <div style={{ color: C.gold, fontSize: 76, fontWeight: 900, textAlign: "center", lineHeight: 1.15 }}>TÚI TIỀN<br />LUÔN CẬP BẾN</div>
        <div style={{ color: C.textSoft, fontSize: 34, fontWeight: 600 }}>Theo dõi bản tin mỗi ngày · 6/10</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Captions — SRT cues (verified), burned at the bottom safe band
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
        background: "rgba(7,10,15,0.84)", border: "1px solid rgba(240,246,252,0.16)", borderRadius: 18,
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
  s08: S08, s09: S09, s10: S10, s11: S11, s12: S12, s13: S13, s14: S14,
};

const BGM_VOLUME = 0.16;
const BGM_FADE_IN = 30; // 1s
const BGM_FADE_OUT = 60; // 2s

export const News20261006: React.FC = () => (
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
    <Audio src={staticFile("news-20261006/narration_full.wav")} volume={1} />
    <Audio
      src={staticFile("news-20261006/bgm.mp3")}
      volume={(fr) =>
        BGM_VOLUME *
        Math.min(1, fr / BGM_FADE_IN) *
        Math.min(1, Math.max(0, (TOTAL_FRAMES - fr) / BGM_FADE_OUT))
      }
    />
  </AbsoluteFill>
);
