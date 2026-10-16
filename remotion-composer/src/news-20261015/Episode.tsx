// News 2026-10-15 — "Tin tức tiền của bạn · tối 15/10" (atelier composition, VERTICAL 1080x1920).
// One <Sequence> per scene from MEASURED public/news-20261015/scene_timing.json; narration_full.wav
// plays once from global frame 0; bgm.mp3 mirrors the news-20261006 mix (0.16, 1s fade-in / 2s fade-out).
// Every reveal/count-up is speech-locked (frameOf / frameOfEnd / <Spoken>) to SPOKEN word times in
// public/news-20261015/words.json (ASR-aligned, scene-LOCAL seconds). ASR spellings are the authority
// for matchers ("trung cư" = chung cư, "mấy lăm giờ" = 15 giờ, "yếu đại" = ưu đãi, "thận trọc"...).
// Layout: content x 80-1000, y 260-1500; captions own the band below y 1500.
import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring,
} from "remotion";
import { C, FONT, SAFE, SPRING, TYPE, fmtVi, type Tone, toneText } from "./theme";
import {
  SCENE_TIMING, TOTAL_FRAMES, FPS, frameOf, frameOfEnd, getSceneTiming, Spoken, type SceneId,
} from "./timing";
import captionsJson from "./captions.json";

export const NEWS_20261015_TOTAL_FRAMES = TOTAL_FRAMES; // 3104
const SF = (id: SceneId): number => getSceneTiming(id).scene_frames;
const ease = (x: number): number => 1 - Math.pow(1 - x, 3);

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const Card: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, ...style }}>{children}</div>
);

const Badge: React.FC<{ tone: Tone; children?: React.ReactNode; style?: React.CSSProperties }> = ({ tone, children, style }) => (
  <div style={{
    display: "inline-block",
    background: tone === "gold" ? "rgba(245,196,112,0.16)" : "rgba(255,255,255,0.06)",
    color: toneText(tone), border: `2px solid ${toneText(tone)}`, borderRadius: 999,
    padding: "10px 26px", fontSize: TYPE.label, fontWeight: 800, letterSpacing: 1.5, ...style,
  }}>{children}</div>
);

const Chip: React.FC<{
  color: string; children?: React.ReactNode; dashed?: boolean; fill?: string; style?: React.CSSProperties;
}> = ({ color, children, dashed, fill = "rgba(255,255,255,0.04)", style }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 12,
    background: fill, color, border: `1.5px ${dashed ? "dashed" : "solid"} ${color}`,
    borderRadius: 14, padding: "12px 22px", fontSize: TYPE.label, fontWeight: 600, ...style,
  }}>{children}</div>
);

const SourceTag: React.FC<{ children?: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.muted, fontSize: TYPE.label, fontWeight: 500, ...style }}>
    <span style={{ width: 10, height: 10, borderRadius: 5, background: C.border, display: "inline-block" }} />
    {children}
  </div>
);

const IllustrationTag: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{
    position: "absolute", top: 284, right: SAFE.x, background: "rgba(7,10,15,0.72)",
    border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 18px",
    color: C.textSoft, fontSize: TYPE.label, fontWeight: 600, zIndex: 5, ...style,
  }}>Hình minh họa</div>
);

/** Kicker pill that slams in at its spoken anchor. `at` = scene-local trigger frame. */
const Kicker: React.FC<{ at: number; tone: Tone; children?: React.ReactNode }> = ({ at, tone, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { ...SPRING, damping: 18 } });
  const op = interpolate(f - at, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ opacity: op, transform: `scale(${1.35 + (1 - 1.35) * p})`, alignSelf: "flex-start" }}>
      <Badge tone={tone}>{children}</Badge>
    </div>
  );
};

/** Number count-up, speech-locked. `at` = scene-local trigger frame, `frames` = spoken span. */
const CountUp: React.FC<{
  at: number; to: number; from?: number; frames?: number; decimals?: number;
  style?: React.CSSProperties; prefix?: string; suffix?: string;
}> = ({ at, to, from = 0, frames = 36, decimals = 0, style, prefix = "", suffix = "" }) => {
  const f = useCurrentFrame();
  // QC: cap count-up at 12 frames (0.4s) so the FINAL value holds for most of the
  // spoken phrase — no long window of wrong intermediate numbers on screen.
  const span = Math.min(frames, 12);
  const v = from + (to - from) * interpolate(f - at, [0, span], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease,
  });
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{f < at ? "" : `${prefix}${fmtVi(v, decimals)}${suffix}`}</span>;
};

/** Ken-Burns full-bleed illustration + legibility gradient (reference image-backdrop pattern). */
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

/** Bottom text column shared by the backdrop headline scenes. */
const BottomCol: React.FC<{ children?: React.ReactNode; top?: number }> = ({ children, top = 760 }) => (
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

/** 0→1 reveal ramp from a scene-local anchor frame. */
const lit = (f: number, at: number): number =>
  interpolate(f - at, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// ---------------------------------------------------------------------------
// S01 — HOOK: 4 slam rows, one per spoken headline (bgDeep + subtle grid)
// ---------------------------------------------------------------------------
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aKick = frameOf("s01", "tối nay");
  const rows: { at: number; tone: Tone; label: string; main: string; sub: string }[] = [
    { at: frameOf("s01", "1 230"), tone: "green", label: "GIÁ XĂNG", main: "XĂNG −1.230 Đ/LÍT", sub: "E10 RON95 · giảm lúc 15:00" },
    { at: frameOf("s01", "chạm đáy"), tone: "blue", label: "NHÀ Ở", main: "CHUNG CƯ HÀ NỘI CHẠM ĐÁY", sub: "Q3/2026 · thấp nhất từ Q1/2024" },
    { at: frameOf("s01", "tiết kiệm"), tone: "green", label: "TIẾT KIỆM", main: "TIẾT KIỆM LÃI THẬT ~1%/NĂM", sub: "sau khi trừ lạm phát" },
    { at: frameOf("s01", "vàng giảm"), tone: "gold", label: "VÀNG", main: "VÀNG GIẢM 3 PHIÊN", sub: "thế giới ≈130 tr/lượng quy đổi" },
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{
        backgroundColor: C.bgDeep,
        backgroundImage: `repeating-linear-gradient(0deg, ${C.grid} 0 1px, transparent 1px 96px), repeating-linear-gradient(90deg, ${C.grid} 0 1px, transparent 1px 96px)`,
      }} />
      <div style={{ position: "absolute", top: 292, left: SAFE.x, right: SAFE.x, ...slam(aKick, f, fps, 1.25) }}>
        <Badge tone="amber" style={{ fontSize: 32, padding: "12px 30px" }}>TIN NHANH · TỐI 15/10</Badge>
      </div>
      <div style={{ position: "absolute", top: 420, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", gap: 20 }}>
        {rows.map((r, i) => {
          const tc = toneText(r.tone);
          return (
            <div key={i} style={{
              height: 210, borderRadius: 24, background: C.surface, border: `1px solid ${C.border}`,
              borderLeft: `10px solid ${tc}`, display: "flex", flexDirection: "column", justifyContent: "center",
              gap: 8, paddingLeft: 40, paddingRight: 40, ...slam(r.at, f, fps),
            }}>
              <div style={{ color: tc, fontSize: TYPE.label, fontWeight: 800, letterSpacing: 3 }}>{r.label}</div>
              <div style={{ color: C.text, fontSize: r.main.length > 24 ? 48 : 54, fontWeight: 800, lineHeight: 1.08 }}>{r.main}</div>
              <div style={{ color: C.textSoft, fontSize: TYPE.label, fontWeight: 600 }}>{r.sub}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S02 — TIN 1 headline: E10 RON95 giảm 1.230 còn 27.020
// ---------------------------------------------------------------------------
const S02: React.FC = () => {
  const aKick = frameOf("s02", 0); // "Tin 1"
  const aTime = frameOf("s02", "mấy lăm giờ"); // "15 giờ chiều nay"
  const aHead = frameOf("s02", "mạnh nhất");
  const aE10 = frameOf("s02", "E10");
  const aDelta = frameOf("s02", "1 230");
  const aDeltaEnd = frameOfEnd("s02", "1 230");
  const aPrice = frameOf("s02", "27 020");
  const aPriceEnd = frameOfEnd("s02", "27 020");
  return (
    <AbsoluteFill>
      <Backdrop src="news-20261015/img_s02.png" to={1.03} sceneFrames={SF("s02")} />
      <IllustrationTag />
      <BottomCol top={700}>
        <Kicker at={aKick} tone="green">TIN 1 · GIÁ XĂNG</Kicker>
        <Spoken at={aTime} fromX={-30} fromY={0}>
          <Chip color={C.amber} fill="rgba(245,158,11,0.08)" style={{ alignSelf: "flex-start" }}>15:00 · HÔM NAY 15/10</Chip>
        </Spoken>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.12 }}>
            GIẢM GIÁ XĂNG<br />LẦN MẠNH NHẤT NHIỀU KỲ QUA
          </div>
        </Spoken>
        <Spoken at={aE10} fromY={34}>
          <Card style={{ padding: "30px 36px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ color: C.textSoft, fontSize: 34, fontWeight: 800, letterSpacing: 1 }}>E10 RON95-III</div>
            <div style={{ color: C.green, fontSize: 116, fontWeight: 900, lineHeight: 1.05 }}>
              <CountUp at={aDelta} to={1230} frames={Math.max(9, aDeltaEnd - aDelta)} prefix="−" />
              <span style={{ fontSize: 44, fontWeight: 800 }}> đ/lít</span>
            </div>
            <Spoken at={aPrice} fromY={16}>
              <div style={{ color: C.textSoft, fontSize: 40, fontWeight: 700 }}>
                còn <span style={{ color: C.text, fontWeight: 900, fontSize: 52 }}><CountUp at={aPrice} to={27020} frames={Math.max(9, aPriceEnd - aPrice)} /></span> đ/lít
              </div>
            </Spoken>
          </Card>
        </Spoken>
        <SourceTag>Số liệu điều hành giá xăng dầu · 15/10</SourceTag>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S03 — TIN 1 chart: giá E10/E5 kỳ 8/10 vs 15/10, zero-based 0..30.000 đ/lít
// ---------------------------------------------------------------------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aOld = frameOf("s03", "vừa tăng"); // "Kỳ 8/10 xăng vừa tăng"
  const aNew = frameOf("s03", "sau lần giảm"); // "Sau lần giảm này"
  const aBinh = frameOf("s03", "bình xe"); // "bình xe máy 5 lít ... 6.000 đ"
  const aDiesel = frameOf("s03", "20"); // "giảm nhẹ 20 đồng" (diesel)
  const MAX = 30000;
  const y0 = 540;
  const plotH = 470;
  const barY = (v: number): number => y0 - (v / MAX) * plotH;
  const grow = (at: number): number => (f <= at ? 0 : spring({ frame: f - at, fps, config: SPRING }));
  const pOld = grow(aOld);
  const pNew = grow(aNew);
  const groups = [
    { name: "E10 RON95", xOld: 180, xNew: 296, old: 28250, new: 27020, dOld: "+1.070", dNew: "−1.230" },
    { name: "E5 RON92", xOld: 560, xNew: 676, old: 27700, new: 26970, dOld: "+1.140", dNew: "−730" },
  ];
  const BW = 92;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Card style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 300, height: 700, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: C.text, fontSize: 32, fontWeight: 800, letterSpacing: 1 }}>GIÁ XĂNG THEO KỲ ĐIỀU HÀNH (Đ/LÍT)</div>
        </div>
        <div style={{ display: "flex", gap: 26, marginTop: 12, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: C.textSoft, fontSize: TYPE.label, fontWeight: 700 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(245,158,11,0.65)", display: "inline-block" }} />kỳ 8/10 (cũ)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: C.textSoft, fontSize: TYPE.label, fontWeight: 700 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: C.greenFill, display: "inline-block" }} />15:00 hôm nay
          </span>
        </div>
        <svg width={860} height={620} viewBox="0 0 860 620" style={{ marginTop: 14 }}>
          {[0, 10000, 20000, 30000].map((t) => (
            <g key={t}>
              <line x1={90} x2={850} y1={barY(t)} y2={barY(t)} stroke={t === 0 ? C.border : C.grid} strokeWidth={t === 0 ? 3 : 1} />
              <text x={78} y={barY(t) + 10} fill={C.muted} fontSize={TYPE.label} fontWeight={600} textAnchor="end" fontFamily={FONT}>
                {t === 0 ? "0" : `${fmtVi(t / 1000)}K`}
              </text>
            </g>
          ))}
          {groups.map((g) => (
            <g key={g.name}>
              {/* OLD (kỳ 8/10 — vừa tăng) */}
              <rect x={g.xOld} y={barY(g.old * pOld)} width={BW} height={(y0 - barY(g.old)) * pOld} fill="rgba(245,158,11,0.65)" rx={8} />
              <text x={g.xOld + BW / 2} y={barY(g.old * pOld) - 14} fill={C.textSoft} fontSize={TYPE.label} fontWeight={800} textAnchor="middle" fontFamily={FONT} opacity={lit(f, aOld)}>
                {fmtVi(g.old)}
              </text>
              {/* NEW (15/10 — sau lần giảm) */}
              <rect x={g.xNew} y={barY(g.new * pNew)} width={BW} height={(y0 - barY(g.new)) * pNew} fill={C.greenFill} rx={8} />
              <text x={g.xNew + BW / 2} y={barY(g.new * pNew) - 14} fill={C.green} fontSize={TYPE.label} fontWeight={900} textAnchor="middle" fontFamily={FONT} opacity={lit(f, aNew)}>
                {fmtVi(g.new)}
              </text>
              {/* group label + delta line */}
              <text x={(g.xOld + g.xNew + BW) / 2} y={584} fill={C.text} fontSize={32} fontWeight={800} textAnchor="middle" fontFamily={FONT}>{g.name}</text>
              <text x={(g.xOld + g.xNew + BW) / 2} y={614} fill={C.green} fontSize={TYPE.label} fontWeight={800} textAnchor="middle" fontFamily={FONT} opacity={lit(f, aNew)}>
                ▼ {g.dNew} đ (trước: {g.dOld})
              </text>
            </g>
          ))}
        </svg>
      </Card>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 1030, display: "flex", gap: 20 }}>
        <Spoken at={aBinh} fromY={22}>
          <Chip color={C.green} fill="rgba(16,185,129,0.10)" style={{ fontWeight: 800 }}>Bình 5L ≈ −6.000 đ/lần đổ</Chip>
        </Spoken>
        <Spoken at={aDiesel} fromY={22}>
          <Chip color={C.textSoft}>Diesel −20 đ</Chip>
        </Spoken>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: 1140 }}>
        <SourceTag>Số liệu: VnExpress 15/10</SourceTag>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S04 — TIN 2 headline: chung cư HN Q3 chỉ ~3.900 căn
// ---------------------------------------------------------------------------
const S04: React.FC = () => {
  const aKick = frameOf("s04", 0); // "Tin 2"
  const aCtx = frameOf("s04", "Trung Cư Hà Nội");
  const aNum = frameOf("s04", "3 900"); // "khoảng 3.900"
  const aNumEnd = frameOfEnd("s04", "3 900");
  const aCan = frameOf("s04", "căn");
  const aDown = frameOf("s04", "giảm 66");
  const aLow = frameOf("s04", "thấp nhất");
  return (
    <AbsoluteFill>
      <Backdrop src="news-20261015/img_s04.png" to={1.02} sceneFrames={SF("s04")} />
      <IllustrationTag />
      <BottomCol top={680}>
        <Kicker at={aKick} tone="blue">TIN 2 · BẤT ĐỘNG SẢN HÀ NỘI · Q3</Kicker>
        <Spoken at={aCtx} fromY={20}>
          <div style={{ color: C.textSoft, fontSize: 40, fontWeight: 700 }}>Giao dịch chung cư Hà Nội Q3/2026 chỉ</div>
        </Spoken>
        <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
          <div style={{ color: C.text, fontSize: 190, fontWeight: 900, lineHeight: 1 }}>
            <CountUp at={aNum} to={3900} frames={Math.max(9, aNumEnd - aNum)} />
          </div>
          <Spoken at={aCan} fromY={18}>
            <div style={{ color: C.textSoft, fontSize: 48, fontWeight: 800 }}>căn<br />giao dịch</div>
          </Spoken>
        </div>
        <Spoken at={aDown} fromX={-30} fromY={0}>
          <div style={{ display: "flex", gap: 18 }}>
            <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontWeight: 800 }}>−66% cùng kỳ</Chip>
            <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontWeight: 800 }}>−33% quý trước</Chip>
          </div>
        </Spoken>
        <Spoken at={aLow} fromY={22}>
          <Chip color={C.amber} dashed fill="rgba(245,158,11,0.06)" style={{ fontWeight: 800 }}>THẤP NHẤT TỪ Q1/2024</Chip>
        </Spoken>
        <SourceTag>Nguồn: CBRE · Q3/2026</SourceTag>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S05 — TIN 2 chart: giá thứ cấp 60 vs sơ cấp 86 vs nội đô 102 tr/m² (0..110)
// ---------------------------------------------------------------------------
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const aThuCap = frameOf("s05", "thư cấp"); // "giá bán thứ cấp"
  const a60 = frameOf("s05", "60");
  const aGiam8 = frameOf("s05", "giảm 8");
  const aLanDau = frameOf("s05", "lần đầu");
  const a80 = frameOf("s05", "hơn 80");
  const aCung = frameOf("s05", "nguồn cung"); // sơ cấp / nội đô context
  const MAX = 110;
  const plotW = 440;
  const tick = (v: number): number => (v / MAX) * plotW;
  const bars: { name: string; v: number; color: string; txt: string; at: number; chip?: string; chipAt?: number }[] = [
    { name: "Thứ cấp (TB)", v: 60, color: C.greenFill, txt: C.green, at: a60, chip: "−8%/năm", chipAt: aGiam8 },
    { name: "Sơ cấp mới", v: 86, color: C.blueFill, txt: C.blue, at: aCung },
    { name: "Nội đô", v: 102, color: C.violetFill, txt: C.violet, at: aCung + 8 },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 296, color: C.text, fontSize: 32, fontWeight: 800, letterSpacing: 1 }}>
        GIÁ CHUNG CƯ HÀ NỘI · TR/M²
      </div>
      <Card style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 356, height: 540, padding: 30 }}>
        <Spoken at={aThuCap} fromY={14}>
          <div style={{ color: C.textSoft, fontSize: 32, fontWeight: 700, marginBottom: 18 }}>Giá bán thứ cấp trung bình</div>
        </Spoken>
        {bars.map((b, i) => {
          const p = interpolate(f - b.at, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
          return (
            <div key={b.name} style={{ marginBottom: 30, opacity: f >= b.at ? 1 : 0.25 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: C.textSoft, fontSize: TYPE.label, fontWeight: 700, marginBottom: 8 }}>
                <span>{b.name}</span>
                <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  {b.chip && b.chipAt !== undefined && f >= b.chipAt ? (
                    <span style={{ color: C.green, fontWeight: 800, border: `1.5px solid ${C.green}`, borderRadius: 10, padding: "2px 12px" }}>{b.chip}</span>
                  ) : null}
                  <span style={{ color: b.txt, fontSize: 38, fontWeight: 900 }}>{fmtVi(b.v)}</span>
                </span>
              </div>
              <div style={{ position: "relative", height: 52, marginLeft: 150, marginRight: 40 }}>
                {[0, 50, 100].map((v) => (
                  <div key={v} style={{ position: "absolute", left: `${(v / MAX) * plotW}px`, top: -6, bottom: -6, width: 1, background: v === 0 ? C.border : C.grid }} />
                ))}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: tick(b.v) * p, background: b.color, borderRadius: 10, opacity: 0.92 }} />
              </div>
            </div>
          );
        })}
        <div style={{ position: "relative", marginLeft: 150, height: 32, marginTop: -8 }}>
          {[0, 50, 100].map((v) => (
            <div key={v} style={{ position: "absolute", left: `${(v / MAX) * plotW}px`, transform: "translateX(-50%)", color: C.muted, fontSize: TYPE.label, fontWeight: 600 }}>
              {v === 0 ? "0" : fmtVi(v)}
            </div>
          ))}
        </div>
      </Card>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 930 }}>
        <Spoken at={aLanDau} fromY={20}>
          <Chip color={C.amber} dashed fill="rgba(245,158,11,0.06)" style={{ fontWeight: 800 }}>Lần đầu giảm sau 2 năm tăng nóng</Chip>
        </Spoken>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 1030 }}>
        <Spoken at={a80} fromY={26}>
          <Card style={{ padding: 30, border: `1.5px solid rgba(245,158,11,0.5)` }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: C.amber, fontSize: 34, fontWeight: 800, marginBottom: 14 }}>
              <span>&gt;80% nguồn cung mới là chung cư cao cấp</span>
              <span>80%</span>
            </div>
            <div style={{ height: 40, background: C.bgDeep, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
              <div style={{
                height: "100%", width: `${80 * interpolate(f - a80, [0, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })}%`,
                background: `linear-gradient(90deg, ${C.amberFill}, ${C.amber})`,
              }} />
            </div>
          </Card>
        </Spoken>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: 1300 }}>
        <SourceTag>Nguồn: CBRE · Thanh Niên</SourceTag>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S06 — TIN 3 headline: 3 stat card lãi suất 12 tháng (5,9 / 7,1 / 9,8)
// ---------------------------------------------------------------------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = frameOf("s06", 0); // "Tin 3"
  const aCtx = frameOf("s06", "12 tháng");
  const aBig = frameOf("s06", "Ngân hàng");
  const a59 = frameOf("s06", "5 9");
  const a59End = frameOfEnd("s06", "5 9");
  const aCao = frameOf("s06", "cao nhất");
  const a71 = frameOf("s06", "7 1");
  const a71End = frameOfEnd("s06", "7 1");
  const aUU = frameOf("s06", "tới 9"); // "ưu đãi tới 9,8%"
  const a98 = frameOf("s06", "9 8");
  const a98End = frameOfEnd("s06", "9 8");
  const cards = [
    { label: "Ngân hàng lớn niêm yết", num: 5.9, at: aBig, nAt: a59, nEnd: a59End, color: C.blue, fill: "rgba(37,99,235,0.10)", prefix: "~" },
    { label: "Cao nhất niêm yết", num: 7.1, at: aCao, nAt: a71, nEnd: a71End, color: C.violet, fill: "rgba(139,92,246,0.10)", prefix: "" },
    { label: "Gói ưu đãi (tới)", num: 9.8, at: aUU, nAt: a98, nEnd: a98End, color: C.gold, fill: "rgba(245,196,112,0.10)", prefix: "" },
  ];
  return (
    <AbsoluteFill>
      <Backdrop src="news-20261015/img_s06.png" to={1.02} sceneFrames={SF("s06")} />
      <IllustrationTag />
      <BottomCol top={720}>
        <Kicker at={aKick} tone="violet">TIN 3 · LÃI SUẤT TIẾT KIỆM T10</Kicker>
        <Spoken at={aCtx} fromY={16}>
          <div style={{ color: C.textSoft, fontSize: 38, fontWeight: 700 }}>Gửi tiết kiệm kỳ hạn 12 tháng — phân hóa mạnh</div>
        </Spoken>
        {cards.map((c) => (
          <Spoken key={c.label} at={c.at} fromX={-34} fromY={0}>
            <Card style={{ padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: c.fill, borderColor: "transparent" }}>
              <div style={{ color: C.textSoft, fontSize: 36, fontWeight: 800 }}>{c.label}</div>
              <div style={{ color: c.color, fontSize: 84, fontWeight: 900, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {f >= c.nAt ? `${c.prefix}${fmtVi(c.num, 1)}` : ""}
                <span style={{ fontSize: 38, fontWeight: 800 }}>%/năm</span>
              </div>
            </Card>
          </Spoken>
        ))}
        <SourceTag>Lãi suất niêm yết kỳ hạn 12 tháng · 15/10</SourceTag>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S07 — TIN 3 chart: 0..10% bars + kết quả lãi thật ≈1,2%/năm
// ---------------------------------------------------------------------------
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const aInf = frameOf("s07", "lạm phát"); // "lạm phát dự báo 4,7%"
  const aBig = frameOf("s07", "ngân hàng lớn");
  const aThat = frameOf("s07", "lãi thật");
  const a12 = frameOf("s07", "1 2");
  const a12End = frameOfEnd("s07", "1 2");
  const a98 = frameOf("s07", "lãi", 2); // "Lãi 9,8% thường kèm điều kiện"
  const plotW = 520;
  const tick = (v: number): number => (v / 10) * plotW;
  const bars: { name: string; v: number; color: string; txt: string; at: number; dashed?: boolean }[] = [
    { name: "Ngân hàng lớn", v: 5.9, color: C.blueFill, txt: C.blue, at: aBig },
    { name: "Cao nhất niêm yết", v: 7.1, color: C.violetFill, txt: C.violet, at: aBig + 10 },
    { name: "Gói ưu đãi", v: 9.8, color: C.gold, txt: C.gold, at: a98 },
    { name: "Lạm phát dự báo", v: 4.7, color: C.amberFill, txt: C.amber, at: aInf, dashed: true },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 296, color: C.text, fontSize: 32, fontWeight: 800, letterSpacing: 1 }}>
        LÃI SUẤT 12 THÁNG VS LẠM PHÁT · THANG 0–10%
      </div>
      <Card style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 356, height: 560, padding: 30 }}>
        {bars.map((b) => {
          const p = interpolate(f - b.at, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
          return (
            <div key={b.name} style={{ marginBottom: 20, opacity: f >= b.at ? 1 : 0.25 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: C.textSoft, fontSize: TYPE.label, fontWeight: 700, marginBottom: 8 }}>
                <span>{b.name}</span>
                <span style={{ color: b.txt, fontSize: 36, fontWeight: 900 }}>{fmtVi(b.v, 1)}%</span>
              </div>
              <div style={{ position: "relative", height: 46, marginLeft: 250, marginRight: 60 }}>
                {[0, 2, 4, 6, 8, 10].map((v) => (
                  <div key={v} style={{ position: "absolute", left: `${(v / 10) * plotW}px`, top: -6, bottom: -6, width: 1, background: v === 0 ? C.border : C.grid }} />
                ))}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, width: tick(b.v) * p, borderRadius: 10, opacity: 0.92,
                  background: b.dashed
                    ? `repeating-linear-gradient(45deg, ${C.amberFill} 0 12px, rgba(245,158,11,0.35) 12px 24px)`
                    : b.color,
                }} />
              </div>
            </div>
          );
        })}
        <div style={{ position: "relative", marginLeft: 250, height: 30, marginTop: -14 }}>
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <div key={v} style={{ position: "absolute", left: `${(v / 10) * plotW}px`, transform: "translateX(-50%)", color: C.muted, fontSize: TYPE.label, fontWeight: 600 }}>
              {v}%
            </div>
          ))}
        </div>
      </Card>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 936, height: 504 }}>
        <Spoken at={aThat} fromY={30} style={{ height: "100%" }}>
          <Card style={{
            height: "100%", padding: 34, display: "flex", flexDirection: "column", gap: 16,
            border: `2px solid rgba(52,211,153,0.5)`, ...(f >= aThat + 8 ? glow(C.greenFill, 22) : {}),
          }}>
            <div style={{ color: C.muted, fontSize: 32, fontWeight: 800, letterSpacing: 2 }}>GỬI NGÂN HÀNG LỚN — LÃI THẬT</div>
            <div style={{ color: C.green, fontSize: 130, fontWeight: 900, lineHeight: 1 }}>
              ≈<CountUp at={a12} to={1.2} frames={Math.max(9, a12End - a12)} decimals={1} />
              <span style={{ fontSize: 52, fontWeight: 800 }}>%/năm</span>
            </div>
            <div style={{ color: C.textSoft, fontSize: 36, fontWeight: 700 }}>
              5,9% − 4,7% (lạm phát dự báo) · <span style={{ color: C.muted, fontSize: TYPE.label }}>ước tính</span>
            </div>
            <div style={{ marginTop: "auto", color: C.muted, fontSize: TYPE.label, fontWeight: 600 }}>
              Lãi cao thường kèm điều kiện tiền gửi lớn — đọc kỹ trước khi gửi
            </div>
          </Card>
        </Spoken>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S08 — TIN 4 headline: IMF dự báo GDP +8,4% · lạm phát 4,7% → 4,9%
// ---------------------------------------------------------------------------
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = frameOf("s08", 0); // "Tin 4"
  const aF = frameOf("s08", "dự báo");
  const aGdp = frameOf("s08", "tăng 8");
  const a84 = frameOf("s08", "8 4");
  const a84End = frameOfEnd("s08", "8 4");
  const aInf = frameOf("s08", "lạm phát");
  const a49 = frameOf("s08", "gần 5"); // "...và gần 5% năm sau"
  return (
    <AbsoluteFill>
      <Backdrop src="news-20261015/img_s08.png" to={1.02} sceneFrames={SF("s08")} />
      <IllustrationTag />
      <BottomCol top={720}>
        <Kicker at={aKick} tone="blue">TIN 4 · IMF DỰ BÁO</Kicker>
        <Spoken at={aF} fromY={16}>
          <Chip color={C.blue} dashed fill="rgba(37,99,235,0.08)">F = dự báo</Chip>
        </Spoken>
        <Spoken at={aGdp} fromY={28}>
          <Card style={{ padding: "30px 36px", display: "flex", flexDirection: "column", gap: 8, ...(f >= a84End ? glow(C.greenFill, 26) : {}) }}>
            <div style={{ color: C.textSoft, fontSize: 40, fontWeight: 800 }}>GDP Việt Nam 2026</div>
            <div style={{ color: C.green, fontSize: 200, fontWeight: 900, lineHeight: 1 }}>
              +<CountUp at={a84} to={8.4} frames={Math.max(9, a84End - a84)} decimals={1} />
              <span style={{ fontSize: 72, fontWeight: 900 }}>%</span>
            </div>
            <div style={{ color: C.muted, fontSize: TYPE.label, fontWeight: 600 }}>nhanh hơn năm trước</div>
          </Card>
        </Spoken>
        <Spoken at={aInf} fromY={22}>
          <div style={{ color: C.textSoft, fontSize: 44, fontWeight: 800, lineHeight: 1.3 }}>
            Lạm phát: <span style={{ color: C.amber }}>4,7%</span> (2026){" "}
            <span style={{ color: C.textSoft }}>→</span>{" "}
            <span style={{ color: C.red, opacity: interpolate(f - a49, [0, 8], [0.25, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>4,9% (2027)</span>
          </div>
        </Spoken>
        <SourceTag>Nguồn: IMF · WEO 10/2026</SourceTag>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S09 — TIN 4 chart: 3 progress bars 0..10% + lời nhắc kế hoạch chi tiêu
// ---------------------------------------------------------------------------
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const aGdp = frameOf("s09", "dự báo"); // "Đây là dự báo"
  const aInf = frameOf("s09", "tăng nhanh"); // "chi phí ... tăng nhanh hơn trước"
  const aPlan = frameOf("s09", "kế hoạch chi tiêu");
  const plotW = 560;
  const bars: { name: string; v: number; color: string; txt: string; at: number; prefix?: string }[] = [
    { name: "GDP 2026F", v: 8.4, color: C.blueFill, txt: C.blue, at: aGdp, prefix: "+" },
    { name: "Lạm phát 2026F", v: 4.7, color: C.amberFill, txt: C.amber, at: aInf },
    { name: "Lạm phát 2027F", v: 4.9, color: C.redFill, txt: C.red, at: aInf + 10 },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 296, color: C.text, fontSize: 32, fontWeight: 800, letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>DỰ BÁO IMF · THANG 0–10%</span>
        <span style={{ color: C.muted, fontSize: 27, fontWeight: 600, letterSpacing: 0, whiteSpace: "nowrap" }}>dự báo — chưa phải kết quả</span>
      </div>
      <Card style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 356, height: 520, padding: 34 }}>
        {bars.map((b) => {
          const p = interpolate(f - b.at, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
          return (
            <div key={b.name} style={{ marginBottom: 34, opacity: f >= b.at ? 1 : 0.25 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: C.textSoft, fontSize: 34, fontWeight: 700, marginBottom: 10 }}>
                <span>{b.name}</span>
                <span style={{ color: b.txt, fontSize: 44, fontWeight: 900 }}>{b.prefix ?? ""}{fmtVi(b.v, 1)}%</span>
              </div>
              <div style={{ position: "relative", height: 56, marginRight: 20 }}>
                {[0, 2, 4, 6, 8, 10].map((v) => (
                  <div key={v} style={{ position: "absolute", left: `${(v / 10) * plotW}px`, top: -6, bottom: -6, width: 1, background: v === 0 ? C.border : C.grid }} />
                ))}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: ((b.v / 10) * plotW) * p, background: b.color, borderRadius: 12, opacity: 0.92 }} />
                <div style={{ position: "absolute", left: ((b.v / 10) * plotW) * p + 12, top: 10, color: b.txt, fontSize: TYPE.label, fontWeight: 800, opacity: f >= b.at ? 1 : 0 }}>
                  {b.prefix ?? ""}{fmtVi(b.v, 1)}%
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ position: "relative", height: 30, marginTop: -18, marginRight: 20 }}>
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <div key={v} style={{ position: "absolute", left: `${(v / 10) * plotW}px`, transform: "translateX(-50%)", color: C.muted, fontSize: TYPE.label, fontWeight: 600 }}>
              {v}%
            </div>
          ))}
        </div>
      </Card>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 940 }}>
        <Spoken at={aPlan} fromY={30}>
          <div style={{
            textAlign: "center", background: "rgba(245,158,11,0.10)", border: `2px solid ${C.amberFill}`,
            borderRadius: 22, padding: "34px 30px", color: C.text, fontSize: 52, fontWeight: 800, lineHeight: 1.25,
          }}>
            Kế hoạch chi tiêu cần<br /><span style={{ color: C.amber }}>tính cả lạm phát</span>
          </div>
        </Spoken>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: 1300 }}>
        <SourceTag>Nguồn: IMF · WEO 10/2026 · F = dự báo</SourceTag>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S10 — TIN 5 headline: CPI Mỹ T9 3,7% vượt dự báo
// ---------------------------------------------------------------------------
const S10: React.FC = () => {
  const aKick = frameOf("s10", 0); // "Tin 5"
  const aCpi = frameOf("s10", "lạm phát mỹ");
  const a37 = frameOf("s10", "3 7");
  const a37End = frameOfEnd("s10", "3 7");
  const aVuot = frameOf("s10", "vượt");
  const aXang = frameOf("s10", "hơn 7"); // "xăng tăng hơn 7%"
  const aFed = frameOf("s10", "chắc chắn");
  return (
    <AbsoluteFill>
      <Backdrop src="news-20261015/img_s10.png" to={1.02} sceneFrames={SF("s10")} />
      <IllustrationTag />
      <BottomCol top={720}>
        <Kicker at={aKick} tone="red">TIN 5 · LẠM PHÁT MỸ · T9</Kicker>
        <Spoken at={aCpi} fromY={24}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
            <div style={{ color: C.red, fontSize: 200, fontWeight: 900, lineHeight: 1 }}>
              <CountUp at={a37} to={3.7} frames={Math.max(9, a37End - a37)} decimals={1} />
              <span style={{ fontSize: 72, fontWeight: 900 }}>%</span>
            </div>
            <div style={{ color: C.textSoft, fontSize: 40, fontWeight: 800, lineHeight: 1.2 }}>CPI<br />Mỹ · T9</div>
          </div>
        </Spoken>
        <Spoken at={aVuot} fromY={18}>
          <Chip color={C.red} fill="rgba(239,68,68,0.10)" style={{ fontSize: 38, fontWeight: 900, alignSelf: "flex-start" }}>VƯỢT DỰ BÁO</Chip>
        </Spoken>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
          <Spoken at={aXang} fromX={-30} fromY={0}>
            <Chip color={C.amber} fill="rgba(245,158,11,0.08)" style={{ fontWeight: 800 }}>Xăng Mỹ +7,1%/tháng</Chip>
          </Spoken>
          <Spoken at={aFed} fromX={-30} fromY={0}>
            <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontWeight: 800 }}>&gt;95% khả năng tăng lãi suất trước cuối năm</Chip>
          </Spoken>
        </div>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S11 — TIN 5 split: CPI Mỹ 3,7/5% + vàng 3 bậc giảm + cảnh báo
// ---------------------------------------------------------------------------
const S11: React.FC = () => {
  const f = useCurrentFrame();
  const aOpen = frameOf("s11", "thế giới"); // "Vàng thế giới..."
  const a3Phien = frameOf("s11", "giảm 3 phiên");
  const a130 = frameOf("s11", "130");
  const aVn = frameOf("s11", "trong nước");
  const aWarn = frameOf("s11", "tích"); // "tích lũy vàng cần thận trọng"
  const stepAt = (i: number): number => a3Phien + i * 8;
  const stepOp = (i: number): number => interpolate(f - stepAt(i), [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const warnDraw = interpolate(f - aWarn, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 300, display: "flex", gap: 30, height: 620 }}>
        {/* LEFT — CPI Mỹ recap */}
        <Spoken at={aOpen} fromY={24} style={{ flex: 1 }}>
          <Card style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>
            <div style={{ color: C.red, fontSize: 34, fontWeight: 800 }}>CPI MỸ · T9</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ color: C.red, fontSize: 110, fontWeight: 900, lineHeight: 1 }}>3,7%</div>
              <svg width={52} height={64} viewBox="0 0 52 64">
                <line x1={26} y1={58} x2={26} y2={12} stroke={C.red} strokeWidth={7} strokeLinecap="round" />
                <polyline points="10,26 26,8 42,26" fill="none" stroke={C.red} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ height: 44, background: C.bgDeep, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, position: "relative" }}>
              <div style={{ height: "100%", width: `${(3.7 / 5) * 100}%`, background: C.redFill, opacity: 0.9 }} />
              <div style={{ position: "absolute", left: `${(3.7 / 5) * 100}%`, top: -4, bottom: -4, width: 4, background: C.red, borderRadius: 2 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: C.muted, fontSize: TYPE.label, fontWeight: 600 }}>
              <span>0</span><span>thang 0–5%</span><span>5%</span>
            </div>
            <div style={{ marginTop: "auto", color: C.textSoft, fontSize: TYPE.label, fontWeight: 700 }}>vượt dự báo · thang 5%</div>
          </Card>
        </Spoken>
        {/* RIGHT — vàng thế giới 3 bậc giảm */}
        <Spoken at={a3Phien} fromY={24} style={{ flex: 1 }}>
          <Card style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
            <div style={{ color: C.gold, fontSize: 34, fontWeight: 800 }}>VÀNG THẾ GIỚI</div>
            <svg width={400} height={330} viewBox="0 0 400 330" style={{ marginTop: 6 }}>
              {[
                { x: 30, h: 170 }, { x: 160, h: 120 }, { x: 290, h: 78 },
              ].map((s, i) => (
                <g key={i} opacity={stepOp(i)}>
                  <rect x={s.x} y={280 - s.h} width={80} height={s.h} rx={10} fill={i === 2 ? C.gold : "rgba(245,196,112,0.45)"} />
                  {i < 2 ? (
                    <text x={s.x + 118} y={280 - (s.h + [120, 78][i]) / 2} fill={C.gold} fontSize={38} fontWeight={900} textAnchor="middle" fontFamily={FONT}>▼</text>
                  ) : null}
                </g>
              ))}
              <line x1={20} x2={380} y1={280} y2={280} stroke={C.border} strokeWidth={3} />
            </svg>
            <div style={{ color: C.textSoft, fontSize: TYPE.label, fontWeight: 700 }}>giảm 3 phiên liên tiếp</div>
          </Card>
        </Spoken>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 970, display: "flex", gap: 20 }}>
        <Spoken at={a130} fromY={20}>
          <Chip color={C.gold} fill="rgba(245,196,112,0.10)" style={{ fontWeight: 800 }}>TG ≈130 tr/lượng quy đổi</Chip>
        </Spoken>
        <Spoken at={aVn} fromY={20}>
          <Chip color={C.gold} fill="rgba(245,196,112,0.10)" style={{ fontWeight: 800 }}>VN −1 tr/lượng · sáng 15/10</Chip>
        </Spoken>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 1090 }}>
        <Spoken at={aWarn} fromY={26}>
          <div style={{
            display: "flex", alignItems: "center", gap: 24,
            background: "rgba(245,158,11,0.10)", border: `2px solid ${C.amberFill}`, borderRadius: 22, padding: "28px 32px",
          }}>
            <svg width={64} height={58} viewBox="0 0 64 58">
              <path d="M 32 4 L 60 54 L 4 54 Z" fill="none" stroke={C.amber} strokeWidth={5} strokeLinejoin="round" />
              <line x1={32} y1={22} x2={32} y2={38} stroke={C.amber} strokeWidth={6} strokeLinecap="round" opacity={warnDraw} />
              <circle cx={32} cy={47} r={3.5} fill={C.amber} opacity={warnDraw} />
            </svg>
            <div style={{ color: C.text, fontSize: 46, fontWeight: 800 }}>Tích lũy vàng cần <span style={{ color: C.amber }}>thận trọng</span></div>
          </div>
        </Spoken>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, top: 1310 }}>
        <SourceTag>Nguồn: CNBC/Reuters · 15/10</SourceTag>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S12 — OUTRO: checklist 3 điều + nguồn & nhạc nền (+1s tail hold trong TOTAL_FRAMES)
// ---------------------------------------------------------------------------
const S12: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aTitle = frameOf("s12", "nhớ 3");
  const aSrc = frameOf("s12", "nguồn và nhạc");
  const aBye = frameOf("s12", "Hẹn");
  const items: { at: number; tickAt: number; text: string; sub: string }[] = [
    { at: frameOf("s12", "đổ sang"), tickAt: frameOfEnd("s12", "rẻ hơn"), text: "Đổ xăng ngày mai rẻ hơn", sub: "E10 RON95 −1.230 đ/lít" },
    { at: frameOf("s12", "đừng chỉ"), tickAt: frameOfEnd("s12", "nhìn"), text: "Đừng chỉ nhìn lãi niêm yết", sub: "lãi thật ≈1,2%/năm" },
    { at: frameOf("s12", "vàng đang"), tickAt: frameOfEnd("s12", "giao động"), text: "Vàng đang dao động mạnh", sub: "TG −3 phiên · VN −1 tr/lượng" },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>
      <div style={{ position: "absolute", top: 296, left: SAFE.x, right: SAFE.x, textAlign: "center", ...slam(aTitle, f, fps, 1.3) }}>
        <span style={{ color: C.text, fontSize: 64, fontWeight: 900, letterSpacing: 1 }}>GHI NHỚ <span style={{ color: C.gold }}>TỐI NAY</span></span>
      </div>
      <div style={{ position: "absolute", top: 400, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", gap: 18 }}>
        {items.map((it) => {
          const shown = f >= it.at;
          const draw = interpolate(f - it.tickAt, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const done = draw > 0;
          return (
            <Card key={it.text} style={{
              padding: "24px 30px", display: "flex", alignItems: "center", gap: 24,
              opacity: shown ? (done ? 1 : 0.8) : 0.1,
              transform: `translateX(${interpolate(f - it.at, [0, 10], [-40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
              border: done ? `1.5px solid rgba(52,211,153,0.55)` : `1px solid ${C.border}`,
            }}>
              <svg width={54} height={54} viewBox="0 0 54 54" style={{ flexShrink: 0 }}>
                <circle cx={27} cy={27} r={24} fill="rgba(16,185,129,0.15)" stroke={C.green} strokeWidth={3} opacity={draw > 0 ? 1 : 0.15} />
                <path d="M 15 28 L 24 37 L 40 19" fill="none" stroke={C.green} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.text, fontSize: 44, fontWeight: 800, lineHeight: 1.2 }}>{it.text}</div>
                <div style={{ color: C.muted, fontSize: TYPE.label, fontWeight: 600, marginTop: 4 }}>{it.sub}</div>
              </div>
            </Card>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 1030 }}>
        <Spoken at={aSrc} fromY={26}>
          <Card style={{
            padding: "26px 30px", border: `1.5px solid rgba(245,196,112,0.35)`, background: "rgba(245,196,112,0.04)",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div style={{ color: C.gold, fontSize: TYPE.label, fontWeight: 800, letterSpacing: 2 }}>NGUỒN &amp; NHẠC NỀN</div>
            <div style={{ color: C.muted, fontSize: 24, fontWeight: 500, lineHeight: 1.5 }}>
              Nguồn: VnExpress · CBRE/Thanh Niên · Batdongsan.com.vn · Vietstock · IMF WEO 10/2026 · CNBC/Reuters · PetroTimes (14–15/10/2026)
            </div>
            <div style={{ color: C.muted, fontSize: 24, fontWeight: 500 }}>Số liệu do nguồn nêu trên công bố</div>
            <div style={{ color: C.muted, fontSize: 24, fontWeight: 500 }}>
              Nhạc nền: "Wallpaper" — Kevin MacLeod (incompetech.com) · CC BY 4.0
            </div>
          </Card>
        </Spoken>
      </div>
      <div style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 1380 }}>
        <Spoken at={aBye} fromY={18}>
          <div style={{ textAlign: "center", color: C.textSoft, fontSize: 40, fontWeight: 800, letterSpacing: 2 }}>
            HẸN GẶP LẠI · TIN NHANH TỐI 15/10
          </div>
        </Spoken>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Captions — verified cue band at the bottom (below y 1500)
// ---------------------------------------------------------------------------
interface Cue { start: number; end: number; text: string }
const CUES = captionsJson as unknown as Cue[];

const Captions: React.FC = () => (
  <>
    {CUES.map((c, i) => {
      const from = Math.round(c.start * FPS);
      const dur = Math.max(9, Math.round((c.end - c.start) * FPS));
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
        padding: "16px 30px", color: C.text, fontSize: TYPE.caption, fontWeight: 600, textAlign: "center",
        lineHeight: 1.3, maxWidth: 940, fontFamily: FONT,
      }}>{text}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root composition
// ---------------------------------------------------------------------------
const SCENES: Record<SceneId, React.FC> = {
  s01: S01, s02: S02, s03: S03, s04: S04, s05: S05, s06: S06,
  s07: S07, s08: S08, s09: S09, s10: S10, s11: S11, s12: S12,
};

const BGM_VOLUME = 0.16; // reference mix (news-20261006)
const BGM_FADE_IN = 30; // 1s
const BGM_FADE_OUT = 60; // 2s

export const News20261015: React.FC = () => (
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
    <Audio src={staticFile("news-20261015/narration_full.wav")} volume={1} />
    <Audio
      src={staticFile("news-20261015/bgm.mp3")}
      volume={(fr) =>
        BGM_VOLUME *
        Math.min(1, fr / BGM_FADE_IN) *
        Math.min(1, Math.max(0, (TOTAL_FRAMES - fr) / BGM_FADE_OUT))
      }
    />
  </AbsoluteFill>
);
