// News daily 2026-10-18 — "Tin nhanh 18/10" (atelier composition, VERTICAL 1080x1920).
// One <Sequence> per measured scene (s01..s07), with speech-locked element reveals.
// narration_full.wav plays once from global frame 0; bgm.mp3 stays at 0.16 with
// a 1s fade-in and 2s fade-out.
//
// CAMERA RULE: Backdrop scale is pinned at 1.0. Only individual elements animate.
// Canonical phrase anchors match consecutive normalized aligned words, scene-locally.
// Layout: content x 80-1000, y 260-1500; captions own the band below y 1500.
import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring,
} from "remotion";
import { C, FONT, SAFE, SPRING, TYPE, type Tone, toneText } from "./theme";
import {
  SCENE_TIMING, TOTAL_FRAMES, FPS, A, AEnd, getSceneTiming, Spoken, type SceneId,
} from "./timing";
import captionsJson from "./captions.json";

export const NEWS_20261018_TOTAL_FRAMES = TOTAL_FRAMES; // 1867
const SF = (id: SceneId): number => getSceneTiming(id).scene_frames;

// ---------------------------------------------------------------------------
// Shared primitives (17/10 machinery)
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
    <div style={{ opacity: op, transform: `scale(1)`, alignSelf: "flex-start" }}>
      <Badge tone={tone}>{children}</Badge>
    </div>
  );
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
  return { opacity: op, transform: `scale(1)` };
};

const glow = (color: string, strength: number): React.CSSProperties => ({ boxShadow: `0 0 ${strength}px ${color}` });

// ---------------------------------------------------------------------------
// S01 — HOOK: badge + date pill, then 5 preview rows slammed in at their spoken phrases
// ---------------------------------------------------------------------------
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aTitle = A("s01", "18 tháng 10");
  const rows: { at: number; tone: Tone; main: string }[] = [
    { at: A("s01", "thương mại tự do"), tone: "blue", main: "Việt Nam ký hiệp định thương mại tự do" },
    { at: A("s01", "rẻ nhất khu vực"), tone: "gold", main: "Thủ tướng: giá xăng rẻ nhất khu vực" },
    { at: A("s01", "siết chỉ tiêu"), tone: "amber", main: "Quảng Ninh siết chỉ tiêu tăng trưởng" },
    { at: A("s01", "lớn nhất năm"), tone: "red", main: "Ukraine: đòn drone lớn nhất năm" },
    { at: A("s01", "làm chậm"), tone: "violet", main: "Ba ông chủ AI kêu gọi làm chậm" },
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{
        backgroundColor: C.bgDeep,
        backgroundImage: `repeating-linear-gradient(0deg, ${C.grid} 0 1px, transparent 1px 96px), repeating-linear-gradient(90deg, ${C.grid} 0 1px, transparent 1px 96px)`,
      }} />
      <div style={{ position: "absolute", top: 280, left: SAFE.x, right: SAFE.x, display: "flex", alignItems: "center", gap: 24, ...slam(aTitle, f, fps, 1.2) }}>
        <Badge tone="amber" style={{ fontSize: 36, padding: "14px 30px" }}>TIN NHANH 18/10</Badge>
        <div style={{
          border: `1.5px solid ${C.border}`, borderRadius: 999, padding: "12px 26px",
          color: C.textSoft, fontSize: 32, fontWeight: 700, fontVariantNumeric: "tabular-nums",
        }}>18/10/2026</div>
      </div>
      <div style={{ position: "absolute", top: 450, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", gap: 22 }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            height: 160, borderRadius: 24, background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `10px solid ${toneText(r.tone)}`, display: "flex", flexDirection: "column",
            justifyContent: "center", paddingLeft: 40, paddingRight: 40, ...slam(r.at, f, fps),
          }}>
            <div style={{ color: C.text, fontSize: 46, fontWeight: 800, lineHeight: 1.08 }}>{r.main}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S02 — TIN MỘT · KINH TẾ: Việt Nam ký hiệp định VEFTA (backdrop + big card + 2 chips)
// ---------------------------------------------------------------------------
const S02: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = A("s02", "Tin một");
  const aHead = A("s02", "chính thức ký");
  const aCard = A("s02", "thương mại tự do");
  const aC1 = A("s02", "Na Uy");
  const aC2 = A("s02", "Hà Nội");
  const countries = [
    { text: "Na Uy", at: A("s02", "Na Uy") },
    { text: "Thụy Sĩ", at: A("s02", "Thụy Sĩ") },
    { text: "Iceland", at: A("s02", "Iceland") },
    { text: "Liechtenstein", at: A("s02", "Liechtenstein") },
  ];
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261018/img_s02.png" sceneFrames={SF("s02")} />
      <IllustrationTag />
      <BottomCol top={680}>
        <Kicker at={aKick} tone="blue">TIN MỘT · KINH TẾ</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.12 }}>Việt Nam ký hiệp định VEFTA</div>
        </Spoken>
          <Card style={{
            padding: "28px 34px 26px", textAlign: "center", alignSelf: "center",
            opacity: interpolate(f - aCard, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            <div style={{ color: C.blue, fontSize: 120, fontWeight: 900, letterSpacing: 4, lineHeight: 1.05 }}>VEFTA</div>
            <div style={{ color: C.textSoft, fontSize: 36, fontWeight: 800, letterSpacing: 4, marginTop: 12 }}>HIỆP ĐỊNH THƯƠNG MẠI TỰ DO</div>
          </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          <Spoken at={aC1} fromX={-30} fromY={0} style={{ maxWidth: "100%" }}>
            <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ display: "block", maxWidth: "100%", boxSizing: "border-box", fontSize: 32, fontWeight: 800, lineHeight: 1.3 }}>
              {countries.map((item, i) => (
                <Spoken key={item.text} at={item.at} fromY={0} style={{ display: "inline-block", whiteSpace: "pre" }}>
                  <span>{i > 0 ? " · " : ""}{item.text}</span>
                </Spoken>
              ))}
            </Chip>
          </Spoken>
          <Spoken at={aC2} fromX={-30} fromY={0}>
            <Chip color={C.gold} fill="rgba(245,196,112,0.08)" style={{ fontSize: 36, fontWeight: 800 }}>Ký tại Hà Nội, sáng 18/10</Chip>
          </Spoken>
        </div>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S03 — TIN HAI · KINH TẾ: giá xăng dầu thấp nhất khu vực (code-only, gold)
// ---------------------------------------------------------------------------
const S03: React.FC = () => {
  const aKick = A("s03", "Tin hai");
  const aAttribution = A("s03", "Thủ tướng Lê Minh Hưng khẳng định");
  const aHead = A("s03", "thấp nhất khu vực");
  const aCard = A("s03", "thấp nhất khu vực");
  const aC1 = A("s03", "bình ổn");
  const aC2 = A("s03", "tăng mạnh");
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", top: 300, left: SAFE.x }}>
        <Kicker at={aKick} tone="gold">TIN HAI · KINH TẾ</Kicker>
      </div>
      <Spoken at={aAttribution} fromY={16} style={{ position: "absolute", top: 392, left: SAFE.x, right: SAFE.x }}>
        <div style={{ color: C.textSoft, fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>Thủ tướng Lê Minh Hưng khẳng định</div>
      </Spoken>
      <Spoken at={aHead} fromY={22} style={{ position: "absolute", top: 460, left: SAFE.x, right: SAFE.x }}>
        <div style={{ color: C.text, fontSize: 60, fontWeight: 900, lineHeight: 1.15 }}>Giá xăng dầu thấp nhất khu vực</div>
      </Spoken>
      <Spoken at={aCard} fromY={34} style={{ position: "absolute", top: 640, left: 140, right: 140 }}>
        <Card style={{ padding: "34px 30px 30px", textAlign: "center" }}>
          <div style={{ color: C.gold, fontSize: 130, fontWeight: 900, letterSpacing: 4, lineHeight: 1.05 }}>THẤP NHẤT</div>
          <div style={{ color: C.textSoft, fontSize: 38, fontWeight: 800, letterSpacing: 5, marginTop: 12 }}>KHU VỰC · THEO THỦ TƯỚNG</div>
        </Card>
      </Spoken>
      <div style={{ position: "absolute", top: 1190, left: SAFE.x, right: SAFE.x, display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center" }}>
        <Spoken at={aC1} fromY={20}>
          <Chip color={C.gold} fill="rgba(245,196,112,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Thủ tướng: bình ổn kịp thời</Chip>
        </Spoken>
        <Spoken at={aC2} fromY={20}>
          <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Giá thế giới tăng mạnh</Chip>
        </Spoken>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S04 — TIN BA · CHÍNH TRỊ: Quảng Ninh siết chỉ tiêu, ngưỡng 10% (backdrop, amber)
// ---------------------------------------------------------------------------
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = A("s04", "Tin ba");
  const aHead = A("s04", "siết quyết liệt");
  const aNum = A("s04", "10 phần trăm");
  const aNumEnd = AEnd("s04", "10 phần trăm");
  const aChip = A("s04", "kể cả");
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261018/img_s04.png" sceneFrames={SF("s04")} />
      <IllustrationTag />
      <BottomCol top={620}>
        <Kicker at={aKick} tone="amber">TIN BA · CHÍNH TRỊ</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.textSoft, fontSize: 32, fontWeight: 700, lineHeight: 1.2, marginBottom: 10 }}>Bí thư Quảng Ninh</div>
          <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.12 }}>Quảng Ninh siết chỉ tiêu tăng trưởng</div>
        </Spoken>
        <Spoken at={aNum} fromY={34}>
          <Card style={{
            padding: "26px 30px 24px", textAlign: "center", alignSelf: "center",
            ...(f >= aNumEnd ? glow("rgba(245,158,11,0.30)", 44) : {}),
          }}>
            <div style={{ color: C.textSoft, fontSize: 36, fontWeight: 800, letterSpacing: 2, lineHeight: 1.2 }}>NẾU TĂNG TRƯỞNG DƯỚI</div>
            <div style={{ color: C.amber, fontSize: 200, fontWeight: 900, lineHeight: 1, marginTop: 10 }}>10%</div>
            <div style={{ color: C.textSoft, fontSize: 36, fontWeight: 800, letterSpacing: 4, lineHeight: 1.2, marginTop: 10 }}>THÌ CÁCH CHỨC</div>
          </Card>
        </Spoken>
        <Spoken at={aChip} fromX={-30} fromY={0}>
          <Chip color={C.amber} fill="rgba(245,158,11,0.08)" style={{ fontSize: 36, fontWeight: 800, alignSelf: "flex-start" }}>Kể cả bí thư, chủ tịch</Chip>
        </Spoken>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S05 — TIN BỐN · THẾ GIỚI: Ukraine đòn drone lớn nhất năm (backdrop, red)
// ---------------------------------------------------------------------------
const S05: React.FC = () => {
  const aKick = A("s05", "Tin bốn");
  const aHead = A("s05", "lớn nhất trong năm");
  const aC1 = A("s05", "đánh cả");
  const aC2 = A("s05", "cáo buộc");
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261018/img_s05.png" sceneFrames={SF("s05")} />
      <IllustrationTag />
      <BottomCol top={800}>
        <Kicker at={aKick} tone="red">TIN BỐN · THẾ GIỚI</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 62, fontWeight: 800, lineHeight: 1.1 }}>Ukraine đánh đòn drone lớn nhất năm</div>
        </Spoken>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          <Spoken at={aC1} fromX={-30} fromY={0}>
            <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontSize: 36, fontWeight: 800 }}>Đánh cả St. Petersburg</Chip>
          </Spoken>
          <Spoken at={aC2} fromX={-30} fromY={0}>
            <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 36, fontWeight: 800 }}>Zelensky cáo buộc Nga phá lệnh ngừng bắn</Chip>
          </Spoken>
        </div>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S06 — TIN NĂM · CÔNG NGHỆ: 3 ông chủ AI kêu gọi làm chậm (backdrop, violet)
// Each name chip reveals at its own exact spoken name phrase.
// ---------------------------------------------------------------------------
const S06: React.FC = () => {
  const aKick = A("s06", "Tin năm");
  const aHead = A("s06", "kêu gọi");
  const aC1 = A("s06", "rủi ro");
  const aC2 = A("s06", "trượt dốc");
  const names = [
    { text: "Altman · OpenAI", at: A("s06", "Altman của OpenAI") },
    { text: "Musk · xAI", at: A("s06", "Musk của xAI") },
    { text: "Amodei · Anthropic", at: A("s06", "Amodei của Anthropic") },
  ];
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261018/img_s06.png" sceneFrames={SF("s06")} />
      <IllustrationTag />
      <BottomCol top={700}>
        <Kicker at={aKick} tone="violet">TIN NĂM · CÔNG NGHỆ</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.12 }}>Ba ông chủ AI kêu gọi làm chậm AI</div>
        </Spoken>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
          {names.map((item) => (
            <Spoken key={item.text} at={item.at} fromX={-30} fromY={0}>
              <Chip color={C.violet} fill="rgba(139,92,246,0.10)" style={{ fontSize: 36, fontWeight: 800 }}>{item.text}</Chip>
            </Spoken>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
          <Spoken at={aC1} fromX={-30} fromY={0}>
            <Chip color={C.amber} fill="rgba(245,158,11,0.08)" style={{ fontSize: 36, fontWeight: 800 }}>Cảnh báo rủi ro nghiêm trọng</Chip>
          </Spoken>
          <Spoken at={aC2} fromX={-30} fromY={0}>
            <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontSize: 36, fontWeight: 800 }}>Cổ phiếu công nghệ trượt dốc</Chip>
          </Spoken>
        </div>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S07 — OUTRO: năm tin / 18-10-2026 + CTA (code-only, green)
// ---------------------------------------------------------------------------
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const aBadge = A("s07", "Trên đây");
  const aCard = A("s07", "năm tin");
  const aCta = A("s07", "Theo dõi");
  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>
      <Spoken at={aBadge} fromY={16} style={{ position: "absolute", top: 330, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <Badge tone="green" style={{ fontSize: 32, padding: "12px 30px" }}>TIN NHANH 18/10</Badge>
      </Spoken>
      <Spoken at={aCard} fromY={34} style={{ position: "absolute", top: 560, left: 140, right: 140 }}>
        <Card style={{
          padding: "40px 30px 36px", textAlign: "center",
          ...(f >= aCard + 10 ? glow("rgba(52,211,153,0.25)", 36) : {}),
        }}>
          <div style={{ color: C.text, fontSize: 112, fontWeight: 900, letterSpacing: 2, lineHeight: 1.05 }}>
            <span style={{ color: C.green }}>NĂM TIN</span>
          </div>
          <div style={{ color: C.textSoft, fontSize: 40, fontWeight: 800, letterSpacing: 6, marginTop: 14 }}>18/10/2026</div>
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
// Captions — canonical scene-local cues from real forced-alignment
// ---------------------------------------------------------------------------
interface Cue { start: number; end: number; text: string }
const CUES = captionsJson as unknown as Record<SceneId, Cue[]>;

const Captions: React.FC = () => (
  <>
    {SCENE_TIMING.flatMap(t => (CUES[t.scene_id] ?? []).map((c, i) => {
      const from = t.start_frame + Math.round(c.start * FPS);
      const end = t.start_frame + Math.round(c.end * FPS);
      const dur = end - from;
      if (dur <= 0) throw Error(`Invalid caption duration for ${t.scene_id}-${i + 1}: ${dur} frames`);
      return (
        <Sequence key={`${t.scene_id}-${i}`} from={from} durationInFrames={dur} name={`cap-${t.scene_id}-${i + 1}`}>
          <CaptionCue text={c.text} />
        </Sequence>
      );
    }))}
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
  const first = SCENE_TIMING[0];
  let sid: SceneId = first.scene_id;
  let rel = f - first.start_frame;
  let frames = (SCENE_TIMING[1]?.start_frame ?? TOTAL_FRAMES) - first.start_frame;
  for (let i = 0; i < SCENE_TIMING.length; i++) {
    const t = SCENE_TIMING[i];
    if (f < t.start_frame) break; // inter-scene gap → previous scene still owns the frame
    sid = t.scene_id;
    rel = f - t.start_frame;
    frames = (SCENE_TIMING[i + 1]?.start_frame ?? TOTAL_FRAMES) - t.start_frame;
  }
  return (
    <div style={{
      position: "absolute", left: 40, top: 1848, zIndex: 60,
      background: "rgba(0,0,0,0.6)", borderRadius: 10, padding: "8px 16px",
      color: "#FBBF24", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 32, fontWeight: 600, lineHeight: 1.2, whiteSpace: "nowrap",
    }}>
      S{Number(sid.slice(1))} f{f} {sec.toFixed(1)}s [{rel}/{frames}]
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

const BGM_VOLUME = 0.16; // reference mix (news-20261006 / 15/10 / 16/10 / 17/10)
const BGM_FADE_IN = 30; // 1s
const BGM_FADE_OUT = 60; // 2s

export const News20261018: React.FC<{ hud?: boolean }> = ({ hud = false }) => (
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
    <Audio src={staticFile("news-daily-20261018/narration_full.wav")} volume={1} />
    <Audio
      src={staticFile("news-daily-20261018/bgm.mp3")}
      volume={(fr) =>
        BGM_VOLUME *
        Math.min(1, fr / BGM_FADE_IN) *
        Math.min(1, Math.max(0, (TOTAL_FRAMES - fr) / BGM_FADE_OUT))
      }
    />
    {hud ? <Hud /> : null}
  </AbsoluteFill>
);
