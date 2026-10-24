// News daily 2026-10-17 — "Tin nhanh 17/10" (atelier composition, VERTICAL 1080x1920).
// Adapted from news-daily-20261016: same machinery (Card/Badge/Chip/Kicker/CountUp/
// Backdrop/BottomCol/IllustrationTag/Spoken/Captions/HUD + BGM mix), one <Sequence> per
// scene from MEASURED public/news-daily-20261017/scene_timing.json (s01..s07);
// narration_full.wav plays once from global frame 0; bgm.mp3 at 0.16 with 1s fade-in /
// 2s fade-out (16/10 mix).
//
// CAMERA RULE (owner veto): Backdrop zoom to=1.0 — the camera is ABSOLUTELY STATIC
// in-shot. No Ken Burns, no punch-in, no whole-frame scale/translate. Only per-element
// entrance spring/opacity, CountUp and chip reveals move.
//
// SPEECH-WINDOW GATE: every panel/headline/chip/stat/note/CTA reveal = A("<ASR phrase>")
// anchored to SPOKEN word times in words.json (scene-LOCAL). ASR spellings are the
// match authority ("ngộ độc trì", "tin 1", "trung thân", "miễn thuê", "Tìm bốn",
// "hoạn bộ luật", "Xi lên XKI", "Tinh năm", "cạn nhân sách", "gặp độ UA", "ASEAN
// Group"). On-screen numbers follow the whitelist exactly: 17/10 · 17/10/2026 · 247 ·
// 3 · 25 · 2027 — nothing else. CountUp ONLY for 247 (s02), 3 (s03), 25 (s06).
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

export const NEWS_20261017_TOTAL_FRAMES = TOTAL_FRAMES; // 1487
const SF = (id: SceneId): number => getSceneTiming(id).scene_frames;
const ease = (x: number): number => 1 - Math.pow(1 - x, 3);

// ---------------------------------------------------------------------------
// Shared primitives (16/10 machinery)
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
 * Full-bleed illustration + legibility gradient. CAMERA RULE: scale pinned at 1.0 for
 * the whole shot — no Ken Burns, no drift (owner veto).
 */
const Backdrop: React.FC<{ src: string; sceneFrames: number; pos?: string }> = ({ src, sceneFrames, pos = "center" }) => {
  const f = useCurrentFrame();
  const scale = interpolate(f, [0, sceneFrames], [1.0, 1.0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.bgDeep }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${scale})` }} />
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

// ---------------------------------------------------------------------------
// S01 — HOOK: badge + date pill, then 4 preview rows slammed in at their spoken phrases
// ---------------------------------------------------------------------------
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aTitle = A("s01", "17 tháng 10"); // "Tin nhanh ngày 17 tháng 10"
  const rows: { at: number; tone: Tone; main: string }[] = [
    { at: A("s01", "ngộ độc trì"), tone: "amber", main: "Chung thân vụ ngộ độc chì" },
    { at: A("s01", "miễn thuế"), tone: "gold", main: "Miễn thuế doanh nghiệp nhỏ" },
    { at: A("s01", "hạ nhiệt"), tone: "blue", main: "Chung cư, đất nền hạ nhiệt" },
    { at: A("s01", "Trump hoãn trừng phạt Nga"), tone: "red", main: "Trump hoãn trừng phạt Nga" },
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{
        backgroundColor: C.bgDeep,
        backgroundImage: `repeating-linear-gradient(0deg, ${C.grid} 0 1px, transparent 1px 96px), repeating-linear-gradient(90deg, ${C.grid} 0 1px, transparent 1px 96px)`,
      }} />
      <div style={{ position: "absolute", top: 280, left: SAFE.x, right: SAFE.x, display: "flex", alignItems: "center", gap: 24, ...slam(aTitle, f, fps, 1.2) }}>
        <Badge tone="amber" style={{ fontSize: 36, padding: "14px 30px" }}>TIN NHANH 17/10</Badge>
        <div style={{
          border: `1.5px solid ${C.border}`, borderRadius: 999, padding: "12px 26px",
          color: C.textSoft, fontSize: 30, fontWeight: 700, fontVariantNumeric: "tabular-nums",
        }}>17/10/2026</div>
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
// S02 — TIN MỘT · PHÁP LUẬT: chung thân vụ ngộ độc chì (backdrop + CountUp 247)
// ---------------------------------------------------------------------------
const S02: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = A("s02", "tin 1"); // "Tin một"
  const aHead = A("s02", "pha sơn vào thức ăn");
  const aNum = A("s02", "247");
  const aNumEnd = AEnd("s02", "247");
  const aNote = A("s02", "vừa bị");
  const aChip = A("s02", "trung thân"); // "chung thân"
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261017/img_s02.png" sceneFrames={SF("s02")} />
      <IllustrationTag />
      <BottomCol top={690}>
        <Kicker at={aKick} tone="amber">TIN MỘT · PHÁP LUẬT</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.12 }}>Chung thân vụ ngộ độc chì</div>
        </Spoken>
        <Spoken at={aNum} fromY={34}>
          <Card style={{
            padding: "26px 30px 24px", textAlign: "center", alignSelf: "center",
            ...(f >= aNumEnd ? glow("rgba(245,158,11,0.30)", 44) : {}),
          }}>
            <div style={{ color: C.amber, fontSize: 200, fontWeight: 900, lineHeight: 1 }}>
              <CountUp at={aNum} to={247} frames={Math.max(9, aNumEnd - aNum)} />
            </div>
            <div style={{ color: C.textSoft, fontSize: 40, fontWeight: 800, letterSpacing: 5, marginTop: 10 }}>TRẺ NHIỄM ĐỘC CHÌ</div>
          </Card>
        </Spoken>
        <Spoken at={aNote} fromY={26}>
          <Card style={{ padding: "24px 34px", border: `1.5px dashed rgba(245,158,11,0.55)` }}>
            <div style={{ color: C.text, fontSize: 44, fontWeight: 800 }}>Sơn pha vào thức ăn</div>
          </Card>
        </Spoken>
        <Spoken at={aChip} fromX={-30} fromY={0}>
          <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontSize: 36, fontWeight: 800, alignSelf: "flex-start" }}>Tù chung thân</Chip>
        </Spoken>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S03 — TIN HAI · KINH TẾ: miễn thuế 3 năm cho DNNVV (code-only, gold)
// ---------------------------------------------------------------------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = A("s03", "tin 2"); // "Tin hai" (ASR digit)
  const aHead = A("s03", "miễn thuê"); // "miễn thuế"
  const aNum = A("s03", "3 năm");
  const aNumEnd = AEnd("s03", "3 năm");
  const aC1 = A("s03", "có lãi");
  const aC2 = A("s03", "quốc hội");
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", top: 300, left: SAFE.x }}>
        <Kicker at={aKick} tone="gold">TIN HAI · KINH TẾ</Kicker>
      </div>
      <Spoken at={aHead} fromY={22} style={{ position: "absolute", top: 392, left: SAFE.x, right: SAFE.x }}>
        <div style={{ color: C.text, fontSize: 60, fontWeight: 900, lineHeight: 1.15 }}>Miễn thuế 3 năm cho doanh nghiệp nhỏ và vừa</div>
      </Spoken>
      <Spoken at={aNum} fromY={34} style={{ position: "absolute", top: 640, left: 140, right: 140 }}>
        <Card style={{
          padding: "40px 30px 34px", textAlign: "center",
          ...(f >= aNumEnd ? glow("rgba(245,196,112,0.30)", 44) : {}),
        }}>
          <div style={{ color: C.gold, fontSize: 220, fontWeight: 900, lineHeight: 1 }}>
            <CountUp at={aNum} to={3} frames={Math.max(9, aNumEnd - aNum)} />
          </div>
          <div style={{ color: C.textSoft, fontSize: 44, fontWeight: 800, letterSpacing: 6, marginTop: 12 }}>NĂM MIỄN THUẾ</div>
        </Card>
      </Spoken>
      <div style={{ position: "absolute", top: 1190, left: SAFE.x, right: SAFE.x, display: "flex", gap: 18, justifyContent: "center" }}>
        <Spoken at={aC1} fromY={20}>
          <Chip color={C.gold} dashed fill="rgba(245,196,112,0.06)" style={{ fontSize: 34, fontWeight: 800 }}>Tính từ khi có lãi</Chip>
        </Spoken>
        <Spoken at={aC2} fromY={20}>
          <Chip color={C.gold} fill="rgba(245,196,112,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Đang trình Quốc hội</Chip>
        </Spoken>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S04 — TIN BA · NHÀ Ở: chung cư, đất nền hạ nhiệt (backdrop)
// ---------------------------------------------------------------------------
const S04: React.FC = () => {
  const aKick = A("s04", "Tin ba");
  const aHead = A("s04", "hạ nhiệt");
  const aC1 = A("s04", "khắp cả nước");
  const aC2 = A("s04", "nhu cầu thực");
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261017/img_s04.png" sceneFrames={SF("s04")} />
      <IllustrationTag />
      <BottomCol top={800}>
        <Kicker at={aKick} tone="blue">TIN BA · NHÀ Ở</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 62, fontWeight: 800, lineHeight: 1.1 }}>Chung cư, đất nền hạ nhiệt</div>
        </Spoken>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          <Spoken at={aC1} fromX={-30} fromY={0}>
            <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 36, fontWeight: 800 }}>Hạ nhiệt toàn quốc</Chip>
          </Spoken>
          <Spoken at={aC2} fromX={-30} fromY={0}>
            <Chip color={C.green} fill="rgba(16,185,129,0.10)" style={{ fontSize: 36, fontWeight: 800 }}>Cơ hội cho người mua thật</Chip>
          </Spoken>
        </div>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S05 — TIN BỐN · THẾ GIỚI: Trump hoãn trừng phạt Nga (backdrop, violet)
// ---------------------------------------------------------------------------
const S05: React.FC = () => {
  const aKick = A("s05", "Tìm bốn"); // "Tin bốn"
  const aHead = A("s05", "hoạn bộ luật"); // "hoãn bộ luật"
  const aC1 = A("s05", "vốn do chính ông");
  const aC2 = A("s05", "Xi lên XKI"); // "Zelensky"
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261017/img_s05.png" sceneFrames={SF("s05")} />
      <IllustrationTag />
      <BottomCol top={780}>
        <Kicker at={aKick} tone="violet">TIN BỐN · THẾ GIỚI</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 62, fontWeight: 800, lineHeight: 1.1 }}>Trump hoãn trừng phạt Nga</div>
        </Spoken>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          <Spoken at={aC1} fromX={-30} fromY={0}>
            <Chip color={C.violet} fill="rgba(139,92,246,0.10)" style={{ fontSize: 36, fontWeight: 800 }}>Lệnh do chính ông Trump ký</Chip>
          </Spoken>
          <Spoken at={aC2} fromX={-30} fromY={0}>
            <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 36, fontWeight: 800 }}>Zelensky: tiếp tục trừng phạt</Chip>
          </Spoken>
        </div>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S06 — TIN NĂM · THẾ GIỚI: Mỹ đánh trúng dầu khí Iran (backdrop + CountUp 25)
// ---------------------------------------------------------------------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = A("s06", "Tinh năm"); // "Tin năm"
  const aHead = A("s06", "quân đội Mỹ");
  const aNum = A("s06", "25");
  const aNumEnd = AEnd("s06", "25");
  const aChip = A("s06", "cạn nhân sách"); // "cạn ngân sách"
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261017/img_s06.png" sceneFrames={SF("s06")} pos="32% 50%" />
      <IllustrationTag />
      <BottomCol top={700}>
        <Kicker at={aKick} tone="red">TIN NĂM · THẾ GIỚI</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.12 }}>Mỹ đánh trúng dầu khí Iran</div>
        </Spoken>
        <Spoken at={aNum} fromY={34}>
          <Card style={{
            padding: "30px 34px 26px", textAlign: "center", alignSelf: "center",
            ...(f >= aNumEnd ? glow("rgba(248,113,113,0.30)", 44) : {}),
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 24, justifyContent: "center" }}>
              <div style={{ color: C.red, fontSize: 200, fontWeight: 900, lineHeight: 1 }}>
                <CountUp at={aNum} to={25} frames={Math.max(9, aNumEnd - aNum)} />
              </div>
              <div style={{ color: C.textSoft, fontSize: 38, fontWeight: 900, letterSpacing: 3, lineHeight: 1.25 }}>TỶ USD<br />DOANH THU DẦU KHÍ</div>
            </div>
          </Card>
        </Spoken>
        <Spoken at={aChip} fromX={-30} fromY={0}>
          <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontSize: 36, fontWeight: 800, alignSelf: "flex-start" }}>Iran cạn ngân sách</Chip>
        </Spoken>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S07 — TIN CUỐI · THỂ THAO + CTA: Việt Nam gặp UAE, ASIAN CUP 2027 (code-only green)
// ---------------------------------------------------------------------------
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = A("s07", "Tin cuối cùng");
  const aHead = A("s07", "gặp độ UA"); // "gặp đội UAE"
  const aBadge = A("s07", "ASEAN Group"); // "A-xi-an Cúp"
  const aCta = A("s07", "theo dõi");
  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>
      <Spoken at={aKick} fromY={16} style={{ position: "absolute", top: 330, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <Badge tone="green" style={{ fontSize: 32, padding: "12px 30px" }}>TIN CUỐI · THỂ THAO</Badge>
      </Spoken>
      <Spoken at={aHead} fromY={26} style={{ position: "absolute", top: 440, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <div style={{ color: C.text, fontSize: 66, fontWeight: 900 }}>
          Việt Nam gặp <span style={{ color: C.green }}>UAE</span>
        </div>
      </Spoken>
      <Spoken at={aBadge} fromY={34} style={{ position: "absolute", top: 650, left: 140, right: 140 }}>
        <Card style={{
          padding: "40px 30px 36px", textAlign: "center",
          ...(f >= aBadge + 10 ? glow("rgba(52,211,153,0.25)", 36) : {}),
        }}>
          <div style={{ color: C.text, fontSize: 96, fontWeight: 900, letterSpacing: 2, lineHeight: 1.1 }}>
            ASIAN CUP <span style={{ color: C.green }}>2027</span>
          </div>
          <div style={{ color: C.textSoft, fontSize: 38, fontWeight: 800, letterSpacing: 6, marginTop: 14 }}>TUYỂN VIỆT NAM</div>
        </Card>
      </Spoken>
      <Spoken at={aCta} fromY={26} style={{ position: "absolute", top: 1130, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center" }}>
        <Chip color={C.green} fill="rgba(16,185,129,0.14)" style={{ fontSize: 40, fontWeight: 900, padding: "18px 34px" }}>
          ▶ Theo dõi để xem tin ngày mai
        </Chip>
      </Spoken>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Captions — rebuilt by scripts/build_captions.py (canonical text, digit-free)
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
// HUD (debug) — overlay only when the `hud` input prop is true
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
  s05: S05, s06: S06, s07: S07,
};

const BGM_VOLUME = 0.16; // reference mix (news-20261006 / 15/10 / 16/10)
const BGM_FADE_IN = 30; // 1s
const BGM_FADE_OUT = 60; // 2s

export const News20261017: React.FC<{ hud?: boolean }> = ({ hud = false }) => (
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
    <Audio src={staticFile("news-daily-20261017/narration_full.wav")} volume={1} />
    <Audio
      src={staticFile("news-daily-20261017/bgm.mp3")}
      volume={(fr) =>
        BGM_VOLUME *
        Math.min(1, fr / BGM_FADE_IN) *
        Math.min(1, Math.max(0, (TOTAL_FRAMES - fr) / BGM_FADE_OUT))
      }
    />
    {hud ? <Hud /> : null}
  </AbsoluteFill>
);
