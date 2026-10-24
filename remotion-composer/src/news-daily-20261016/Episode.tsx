// News daily 2026-10-16 — "Tin nhanh 16/10" (atelier composition, VERTICAL 1080x1920).
// Adapted from news-20261015: same machinery (Card/Badge/Chip/Kicker/CountUp/Backdrop/
// BottomCol/IllustrationTag/SourceTag/Spoken/Captions/BGM mix), one <Sequence> per scene
// from MEASURED public/news-daily-20261016/scene_timing.json (s01..s08); narration_full.wav
// plays once from global frame 0; bgm.mp3 at 0.16 with 1s fade-in / 2s fade-out (15/10 mix).
//
// CAMERA RULE (owner veto): Backdrop zoom to=1.0 — the camera is ABSOLUTELY STATIC in-shot.
// No Ken Burns, no punch-in, no whole-frame scale/translate. Only per-element entrance
// spring/opacity, CountUp and chip reveals move; all text keeps its scale all scene.
//
// SPEECH-WINDOW GATE: every panel/card/chip/quote reveal = A("<ASR phrase>") anchored to
// SPOKEN word times in public/news-daily-20261016/words.json (scene-LOCAL seconds). ASR
// spellings are the match authority ("nã mô cầu", "bà học sinh", "LBHMZ", "11 ,3",
// "xục đổ", "bàn tin mai"...). On-screen numbers follow the whitelist exactly:
// 16/10/2026 · 3 · 1 · 11,43 · 9 · 4 · 6 · 21/10 · U17 · 2026 · tháng 11 — nothing else.
//
// Layout: content x 80-1000, y 260-1500; captions own the band below y 1500.
import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring,
} from "remotion";
import { C, FONT, SAFE, SPRING, TYPE, fmtVi, type Tone, toneText } from "./theme";
import {
  SCENE_TIMING, TOTAL_FRAMES, FPS, A, AEnd, getSceneTiming, Spoken, type SceneId,
} from "./timing";
import captionsJson from "./captions.json";

export const NEWS_20261016_TOTAL_FRAMES = TOTAL_FRAMES; // 1962
const SF = (id: SceneId): number => getSceneTiming(id).scene_frames;
const ease = (x: number): number => 1 - Math.pow(1 - x, 3);

// ---------------------------------------------------------------------------
// Shared primitives (15/10 machinery)
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
  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, color: C.muted, fontSize: TYPE.label, fontWeight: 500, lineHeight: 1.5, ...style }}>
    <span style={{ width: 10, height: 10, borderRadius: 5, background: C.border, display: "inline-block", flexShrink: 0, marginTop: 7 }} />
    <span>{children}</span>
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

/** Number count-up, speech-locked; capped at 12 frames so the FINAL value holds while the phrase is still being said. */
const CountUp: React.FC<{
  at: number; to: number; from?: number; frames?: number; decimals?: number;
  style?: React.CSSProperties; prefix?: string; suffix?: string;
}> = ({ at, to, from = 0, frames = 36, decimals = 0, style, prefix = "", suffix = "" }) => {
  const f = useCurrentFrame();
  const span = Math.min(frames, 12);
  const v = from + (to - from) * interpolate(f - at, [0, span], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease,
  });
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{f < at ? "" : `${prefix}${fmtVi(v, decimals)}${suffix}`}</span>;
};

/**
 * Full-bleed illustration + legibility gradient. CAMERA RULE: scale pinned at 1.0 for the
 * whole shot (the 15/10 Ken-Burns drift is deliberately removed — owner veto).
 */
const Backdrop: React.FC<{ src: string; sceneFrames: number }> = ({ src, sceneFrames }) => {
  const f = useCurrentFrame();
  const scale = interpolate(f, [0, sceneFrames], [1.0, 1.0], { extrapolateRight: "clamp" });
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

/** Slow 0→1 reveal ramp from a scene-local anchor frame. */
const dim = (f: number, at: number, ramp = 12): number =>
  interpolate(f - at, [0, ramp], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// ---------------------------------------------------------------------------
// S01 — HOOK: title + date pill, then 4 preview rows slammed in at their spoken phrases
// ---------------------------------------------------------------------------
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aTitle = A("s01", "tối 16 tháng 10"); // "Tin nhanh tối 16 tháng 10"
  const rows: { at: number; tone: Tone; main: string }[] = [
    { at: A("s01", "nã mô cầu"), tone: "amber", main: "Não mô cầu · TP HCM" },
    { at: A("s01", "kỷ lục"), tone: "gold", main: "Tiền gửi kỷ lục" },
    { at: A("s01", "chiến sự leo thang"), tone: "red", main: "Eo Hormuz leo thang" },
    { at: A("s01", "Đau 17 Việt Nam"), tone: "green", main: "U17 Việt Nam" },
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{
        backgroundColor: C.bgDeep,
        backgroundImage: `repeating-linear-gradient(0deg, ${C.grid} 0 1px, transparent 1px 96px), repeating-linear-gradient(90deg, ${C.grid} 0 1px, transparent 1px 96px)`,
      }} />
      <div style={{ position: "absolute", top: 280, left: SAFE.x, right: SAFE.x, display: "flex", alignItems: "center", gap: 24, ...slam(aTitle, f, fps, 1.2) }}>
        <Badge tone="amber" style={{ fontSize: 36, padding: "14px 30px" }}>TIN NHANH 16/10</Badge>
        <div style={{
          border: `1.5px solid ${C.border}`, borderRadius: 999, padding: "12px 26px",
          color: C.textSoft, fontSize: 30, fontWeight: 700, fontVariantNumeric: "tabular-nums",
        }}>16/10/2026</div>
      </div>
      <div style={{ position: "absolute", top: 450, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", gap: 22 }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            height: 195, borderRadius: 24, background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `10px solid ${toneText(r.tone)}`, display: "flex", flexDirection: "column",
            justifyContent: "center", paddingLeft: 40, paddingRight: 40, ...slam(r.at, f, fps),
          }}>
            <div style={{ color: C.text, fontSize: 50, fontWeight: 800, lineHeight: 1.08 }}>{r.main}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S02 — TIN MỘT: não mô cầu TP HCM (ảnh minh họa + chips + note card)
// ---------------------------------------------------------------------------
const S02: React.FC = () => {
  const aKick = A("s02", 0); // "Tin 1"
  const aHead = A("s02", "thành phố Chí Minh"); // "TP HCM ... não mô cầu"
  const a3 = A("s02", "bà học sinh"); // "ba học sinh"
  const a1 = A("s02", "Một em đã tử vong");
  const aXa = A("s02", "hiệu phước"); // "Hiệp Phước"
  const aNote = A("s02", "dễ nhầm về cuốn"); // "dễ nhầm với cúm"
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261016/img_s02.png" sceneFrames={SF("s02")} />
      <IllustrationTag />
      <BottomCol top={700}>
        <Kicker at={aKick} tone="amber">TIN MỘT</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.12 }}>Não mô cầu · TP HCM</div>
        </Spoken>
        <div style={{ display: "flex", gap: 18 }}>
          <Spoken at={a3} fromX={-30} fromY={0}>
            <Chip color={C.amber} fill="rgba(245,158,11,0.08)" style={{ fontSize: 36, fontWeight: 800 }}>3 học sinh mắc</Chip>
          </Spoken>
          <Spoken at={a1} fromX={-30} fromY={0}>
            <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontSize: 36, fontWeight: 800 }}>1 em tử vong</Chip>
          </Spoken>
        </div>
        <Spoken at={aXa} fromY={22}>
          <Chip color={C.textSoft} style={{ fontSize: 34, fontWeight: 700 }}>Xã Hiệp Phước</Chip>
        </Spoken>
        <Spoken at={aNote} fromY={26}>
          <Card style={{ padding: "26px 34px", border: `1.5px dashed rgba(245,158,11,0.55)` }}>
            <div style={{ color: C.text, fontSize: 44, fontWeight: 800 }}>Triệu chứng dễ nhầm với cúm</div>
          </Card>
        </Spoken>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S03 — TIN HAI: tiền gửi dân cư đạt kỷ lục 11,43 triệu tỷ đồng (code-only, gold)
// ---------------------------------------------------------------------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = A("s03", 0); // "Tin 2"
  const aHead = A("s03", "Tiên gửi dân cư"); // "Tiền gửi dân cư"
  const aKL = A("s03", "kỷ lục");
  const aNum = A("s03", "11 ,3"); // "11,43" (ASR digits)
  const aNumEnd = AEnd("s03", "11 ,3");
  const aUnit = A("s03", "triệu tỷ");
  const aCao = A("s03", "cao nhất từng ghi nhận");
  const aLS = A("s03", "lai xuất tăng mạnh"); // "lãi suất tăng mạnh"
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", top: 300, left: SAFE.x }}>
        <Kicker at={aKick} tone="gold">TIN HAI</Kicker>
      </div>
      <Spoken at={aHead} fromY={22} style={{ position: "absolute", top: 390, left: SAFE.x, right: SAFE.x }}>
        <div style={{ color: C.text, fontSize: 62, fontWeight: 900 }}>Tiền gửi dân cư</div>
      </Spoken>
      <Spoken at={aKL} fromY={18} style={{ position: "absolute", top: 505, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <Badge tone="gold" style={{ fontSize: 34, padding: "12px 32px" }}>KỶ LỤC</Badge>
      </Spoken>
      <Spoken at={aNum} fromY={34} style={{ position: "absolute", top: 610, left: 140, right: 140 }}>
        <Card style={{
          padding: "44px 30px 38px", textAlign: "center",
          ...(f >= aNumEnd ? glow("rgba(245,196,112,0.30)", 44) : {}),
        }}>
          <div style={{ color: C.gold, fontSize: 220, fontWeight: 900, lineHeight: 1 }}>
            <CountUp at={aNum} to={11.43} frames={Math.max(9, aNumEnd - aNum)} decimals={2} />
          </div>
          <Spoken at={aUnit} fromY={12}>
            <div style={{ color: C.textSoft, fontSize: 44, fontWeight: 800, letterSpacing: 6, marginTop: 14 }}>TRIỆU TỶ ĐỒNG</div>
          </Spoken>
        </Card>
      </Spoken>
      <div style={{ position: "absolute", top: 1150, left: SAFE.x, right: SAFE.x, display: "flex", gap: 18, justifyContent: "center" }}>
        <Spoken at={aCao} fromY={20}>
          <Chip color={C.amber} dashed fill="rgba(245,158,11,0.06)" style={{ fontSize: 34, fontWeight: 800 }}>Mức cao nhất từng ghi nhận</Chip>
        </Spoken>
        <Spoken at={aLS} fromY={20}>
          <Chip color={C.amber} fill="rgba(245,158,11,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Lãi suất tăng mạnh</Chip>
        </Spoken>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S04 — TIN BA: eo biển Hormuz, Iran «rất hạn chế», Houthi đánh dầu khí + sân bay Saudi
// ---------------------------------------------------------------------------
const S04: React.FC = () => {
  const aKick = A("s04", 0); // "Tin 3"
  const aHead = A("s04", "LBHMZ"); // "eo biển Hoóc-mút" (ASR)
  const aQ = A("s04", "rất hạn chế");
  const aQS = A("s04", "giám sát của quân đội");
  const aDau = A("s04", "dầu khí và sân bay");
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261016/img_s04.png" sceneFrames={SF("s04")} />
      <IllustrationTag />
      <BottomCol top={720}>
        <Kicker at={aKick} tone="red">TIN BA</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 60, fontWeight: 800, lineHeight: 1.1 }}>Eo biển Hormuz</div>
        </Spoken>
        <Spoken at={aQ} fromY={26}>
          <Card style={{ padding: "30px 36px", border: `2px solid rgba(248,113,113,0.40)` }}>
            <div style={{ color: C.text, fontSize: 52, fontWeight: 800, lineHeight: 1.2 }}>
              «Rất, rất hạn chế» <span style={{ color: C.textSoft, fontSize: 36, fontWeight: 700 }}>— Iran</span>
            </div>
          </Card>
        </Spoken>
        <Spoken at={aQS} fromX={-30} fromY={0}>
          <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Quân đội giám sát</Chip>
        </Spoken>
        <Spoken at={aDau} fromX={-30} fromY={0}>
          <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Houthi đánh dầu khí + sân bay Saudi</Chip>
        </Spoken>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S05 — TIN BỐN: Nga · Ukraine, 9 vùng không kích, ngừng bắn năng lượng sụp đổ
// ---------------------------------------------------------------------------
const S05: React.FC = () => {
  const aKick = A("s05", 0); // "Tin 4"
  const aHead = A("s05", "Nga không kích");
  const a9 = A("s05", "chính vùng"); // "chín vùng" (ASR)
  const aLuoi = A("s05", "lưới điện");
  const aSup = A("s05", "xục đổ"); // "sụp đổ" (ASR)
  const aQ = A("s05", "điều ô nhục");
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261016/img_s05.png" sceneFrames={SF("s05")} />
      <IllustrationTag />
      <BottomCol top={680}>
        <Kicker at={aKick} tone="blue">TIN BỐN</Kicker>
        <Spoken at={aHead} fromY={24}>
          <div style={{ color: C.text, fontSize: 60, fontWeight: 800, lineHeight: 1.1 }}>Nga · Ukraine</div>
        </Spoken>
        <Spoken at={a9} fromY={26}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 26 }}>
            <div style={{ color: C.red, fontSize: 220, fontWeight: 900, lineHeight: 1 }}>9</div>
            <div style={{ color: C.textSoft, fontSize: 46, fontWeight: 900, letterSpacing: 4 }}>VÙNG KHÔNG KÍCH</div>
          </div>
        </Spoken>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          <Spoken at={aLuoi} fromX={-30} fromY={0}>
            <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Đánh lưới điện trước mùa đông</Chip>
          </Spoken>
          <Spoken at={aSup} fromX={-30} fromY={0}>
            <Chip color={C.amber} dashed fill="rgba(245,158,11,0.06)" style={{ fontSize: 34, fontWeight: 800 }}>Ngừng bắn năng lượng sụp đổ</Chip>
          </Spoken>
        </div>
        <Spoken at={aQ} fromY={22}>
          <Card style={{ padding: "24px 32px", border: `1.5px solid rgba(245,196,112,0.45)` }}>
            <div style={{ color: C.text, fontSize: 46, fontWeight: 800 }}>«"Điều ô nhục" — Trump»</div>
          </Card>
        </Spoken>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S06 — TIN NĂM: trường tiểu học bang Oregon (code-only, trang trọng, reveal chậm)
// ---------------------------------------------------------------------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = A("s06", 0); // "Tin 5"
  const aTr = A("s06", "trường tiểu học");
  const aOr = A("s06", "bang Oregon"); // ASR kept "Oregon"
  const aNam = A("s06", "năng thanh niên"); // "nam thanh niên" (ASR)
  const a4 = A("s06", "4 người");
  const RED_DIM = "rgba(248,113,113,0.82)";
  const opHead = dim(f, aTr, 12);
  const opOr = 0.25 + 0.75 * dim(f, aOr, 12);
  const op4 = dim(f, a4, 14);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>
      <Spoken at={aKick} fromY={16} style={{ position: "absolute", top: 330, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <Badge tone="neutral" style={{ fontSize: 32, padding: "12px 30px" }}>TIN NĂM</Badge>
      </Spoken>
      <div style={{ position: "absolute", top: 440, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: opHead }}>
        <div style={{ color: C.textSoft, fontSize: 54, fontWeight: 800, lineHeight: 1.25 }}>
          Trường tiểu học<span style={{ opacity: opOr }}> · bang Oregon · Mỹ</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 660, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: op4 }}>
        <div style={{ color: C.text, fontSize: 300, fontWeight: 900, lineHeight: 1 }}>4</div>
        <div style={{ color: RED_DIM, fontSize: 40, fontWeight: 800, letterSpacing: 10, marginTop: 26 }}>NGƯỜI THIỆT MẠNG</div>
      </div>
      <div style={{ position: "absolute", top: 1130, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: dim(f, aTr, 12) }}>
        <div style={{ width: 140, height: 2, background: C.border }} />
      </div>
      <div style={{ position: "absolute", top: 1190, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", opacity: dim(f, aNam, 12) }}>
        <div style={{
          border: `1.5px solid rgba(154,167,184,0.50)`, borderRadius: 14, padding: "16px 30px",
          color: C.textSoft, fontSize: 36, fontWeight: 700,
        }}>Nam thanh niên xả súng</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S07 — TIN CUỐI: U17 Việt Nam (tone xanh lá hy vọng)
// ---------------------------------------------------------------------------
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = A("s07", "cuối"); // "Tin cuối"
  const aHead = A("s07", "U -17 Việt Nam"); // "U17 Việt Nam" (ASR)
  const aHL = A("s07", "Hàn Quốc");
  const aVB = A("s07", "vòng bảng");
  const aQa = A("s07", "Qatar");
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261016/img_s07.png" sceneFrames={SF("s07")} />
      <IllustrationTag />
      <BottomCol top={720}>
        <Kicker at={aKick} tone="green">TIN CUỐI</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 62, fontWeight: 900 }}>
            <span style={{ color: C.green }}>U17</span> Việt Nam
          </div>
        </Spoken>
        <Spoken at={aHL} fromX={-30} fromY={0}>
          <Chip color={C.green} fill="rgba(16,185,129,0.10)" style={{ fontSize: 34, fontWeight: 800 }}>Tập huấn Hàn Quốc · UAE</Chip>
        </Spoken>
        <Spoken at={aVB} fromY={26}>
          <Card style={{
            padding: "30px 36px", border: `2px solid rgba(52,211,153,0.50)`,
            ...(f >= aVB + 8 ? glow("rgba(16,185,129,0.25)", 30) : {}),
          }}>
            <div style={{ color: C.text, fontSize: 54, fontWeight: 900, lineHeight: 1.15 }}>Vòng bảng World Cup 2026</div>
          </Card>
        </Spoken>
        <Spoken at={aQa} fromX={-30} fromY={0}>
          <Chip color={C.green} fill="rgba(16,185,129,0.10)" style={{ fontSize: 34, fontWeight: 800, color: C.text }}>
            Qatar · tháng 11
          </Chip>
        </Spoken>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S08 — OUTRO: mưa giông Nam Bộ + nguồn & nhạc nền + sign-off (+1s tail hold)
// ---------------------------------------------------------------------------
const S08: React.FC = () => {
  const aMua = A("s08", "Bộ mưa dòng"); // "Nam Bộ mưa giông" (ASR)
  const aNgay = A("s08", "ít nhất 6 ngày");
  const aNgap = A("s08", "ngập úng");
  const aSrc = A("s08", "nguồn tin");
  const aBgm = A("s08", "nhạc niềm"); // "nhạc nền" (ASR)
  const aBye = A("s08", "bàn tin mai"); // "bản tin mai" (ASR)
  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>
      <div style={{ position: "absolute", top: 340, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-start" }}>
        <Spoken at={aMua} fromX={-30} fromY={0}>
          <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 36, fontWeight: 800 }}>Mưa giông Nam Bộ</Chip>
        </Spoken>
        <Spoken at={aNgay} fromX={-30} fromY={0}>
          <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 36, fontWeight: 800 }}>Ít nhất 6 ngày · đến hết 21/10</Chip>
        </Spoken>
        <Spoken at={aNgap} fromX={-30} fromY={0}>
          <Chip color={C.amber} fill="rgba(245,158,11,0.08)" style={{ fontSize: 36, fontWeight: 800 }}>Đề phòng ngập úng</Chip>
        </Spoken>
      </div>
      <div style={{ position: "absolute", top: 690, left: SAFE.x, right: SAFE.x }}>
        <Spoken at={aSrc} fromY={26}>
          <Card style={{
            padding: "30px 34px", border: `1.5px solid rgba(245,196,112,0.35)`, background: "rgba(245,196,112,0.04)",
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <SourceTag>Nguồn: VnExpress · Dân Trí · Thanh Niên · Reuters · AP · CNN · BBC — bản tin 16/10/2026</SourceTag>
            <Spoken at={aBgm} fromY={10}>
              <SourceTag>{'BGM "Fearless First" — Kevin MacLeod (incompetech.com) · CC BY 4.0'}</SourceTag>
            </Spoken>
          </Card>
        </Spoken>
      </div>
      <div style={{ position: "absolute", top: 1240, left: SAFE.x, right: SAFE.x }}>
        <Spoken at={aBye} fromY={18}>
          <div style={{ textAlign: "center", color: C.textSoft, fontSize: 46, fontWeight: 800, letterSpacing: 2 }}>
            Hẹn gặp lại ở bản tin mai
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
// HUD (draft) — debug overlay, only when the `hud` input prop is true
// ---------------------------------------------------------------------------
const Hud: React.FC = () => {
  const f = useCurrentFrame(); // rendered at root scope → global frame
  const sec = f / FPS;
  let sid: SceneId = SCENE_TIMING[0].scene_id;
  let rel = f;
  let frames = SCENE_TIMING[0].scene_frames;
  for (let i = 0; i < SCENE_TIMING.length; i++) {
    const t = SCENE_TIMING[i];
    if (f < t.start_frame) break; // inter-scene gap → previous scene still owns the frame
    sid = t.scene_id;
    rel = f - t.start_frame;
    frames = i === SCENE_TIMING.length - 1 ? TOTAL_FRAMES - t.start_frame : t.scene_frames;
  }
  rel = Math.min(rel, frames);
  return (
    <div style={{
      position: "absolute", left: 40, top: 1848, zIndex: 60,
      background: "rgba(0,0,0,0.6)", borderRadius: 10, padding: "8px 16px",
      color: "#FBBF24", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 26, fontWeight: 600, lineHeight: 1.2, whiteSpace: "nowrap",
    }}>
      S{sid} f{f} {sec.toFixed(1)}s [{rel}/{frames}]
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root composition
// ---------------------------------------------------------------------------
const SCENES: Record<SceneId, React.FC> = {
  s01: S01, s02: S02, s03: S03, s04: S04,
  s05: S05, s06: S06, s07: S07, s08: S08,
};

const BGM_VOLUME = 0.16; // reference mix (news-20261006 / 15/10)
const BGM_FADE_IN = 30; // 1s
const BGM_FADE_OUT = 60; // 2s

export const News20261016: React.FC<{ hud?: boolean }> = ({ hud = false }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: FONT }}>
    {SCENE_TIMING.map((t, i) => {
      const Scene = SCENES[t.scene_id];
      // Hold each scene's final state through the inter-scene gap (audio tail → next cut):
      // sequence spans to the NEXT scene's start_frame; last scene still runs to TOTAL_FRAMES.
      const frames = i === SCENE_TIMING.length - 1 ? TOTAL_FRAMES - t.start_frame : SCENE_TIMING[i + 1].start_frame - t.start_frame;
      return (
        <Sequence key={t.scene_id} from={t.start_frame} durationInFrames={frames} name={t.scene_id}>
          <Scene />
        </Sequence>
      );
    })}
    <Captions />
    <Audio src={staticFile("news-daily-20261016/narration_full.wav")} volume={1} />
    <Audio
      src={staticFile("news-daily-20261016/bgm.mp3")}
      volume={(fr) =>
        BGM_VOLUME *
        Math.min(1, fr / BGM_FADE_IN) *
        Math.min(1, Math.max(0, (TOTAL_FRAMES - fr) / BGM_FADE_OUT))
      }
    />
    {hud ? <Hud /> : null}
  </AbsoluteFill>
);
