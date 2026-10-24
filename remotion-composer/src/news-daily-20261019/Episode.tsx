// News daily 2026-10-19 — "Tin nhanh 19/10" (atelier composition, VERTICAL 1080x1920).
// One <Sequence> per measured scene (s01..s08), with speech-locked element reveals.
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

export const NEWS_20261019_TOTAL_FRAMES = TOTAL_FRAMES; // 2914
const SF = (id: SceneId): number => getSceneTiming(id).scene_frames;

// ---------------------------------------------------------------------------
// Shared primitives (18/10 machinery)
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
const Backdrop: React.FC<{ src: string; sceneFrames: number; pos?: string; topScrim?: string }> = ({ src, sceneFrames, pos = "center", topScrim }) => {
  const f = useCurrentFrame();
  const scale = interpolate(f, [0, sceneFrames], [1.0, 1.0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.bgDeep }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${scale})` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,10,15,0.42) 0%, rgba(7,10,15,0.10) 26%, rgba(7,10,15,0.62) 46%, rgba(7,10,15,0.93) 64%, #0D1117 84%)" }} />
      {topScrim ? <AbsoluteFill style={{ background: topScrim }} /> : null}
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
  const aTitle = A("s01", "19 tháng 10");
  const rows: { at: number; tone: Tone; main: string }[] = [
    { at: A("s01", "chạm mốc"), tone: "gold", main: "Nợ công Mỹ chạm mốc 40.000 tỷ USD" },
    { at: A("s01", "não mô cầu"), tone: "red", main: "Não mô cầu: 4 ca, 1 em tử vong (TP.HCM)" },
    { at: A("s01", "Tập Cận Bình"), tone: "blue", main: "Putin đề xuất thượng đỉnh với Trump, Tập Cận Bình" },
    { at: A("s01", "Bến Bạch Đằng"), tone: "violet", main: "Vòm cầu 3.400 tấn về Bến Bạch Đằng" },
    { at: A("s01", "siêu bão"), tone: "amber", main: "Siêu bão Champi mạnh cấp 16" },
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{
        backgroundColor: C.bgDeep,
        backgroundImage: `repeating-linear-gradient(0deg, ${C.grid} 0 1px, transparent 1px 96px), repeating-linear-gradient(90deg, ${C.grid} 0 1px, transparent 1px 96px)`,
      }} />
      <div style={{ position: "absolute", top: 280, left: SAFE.x, right: SAFE.x, display: "flex", alignItems: "center", gap: 24, ...slam(aTitle, f, fps, 1.2) }}>
        <Badge tone="amber" style={{ fontSize: 36, padding: "14px 30px" }}>TIN NHANH 19/10</Badge>
        <div style={{
          border: `1.5px solid ${C.border}`, borderRadius: 999, padding: "12px 26px",
          color: C.textSoft, fontSize: 32, fontWeight: 700, fontVariantNumeric: "tabular-nums",
        }}>19/10/2026</div>
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
// S02 — TIN MỘT · KINH TẾ: nợ công Mỹ 40.000 tỷ USD (backdrop + big card + 3 chips)
// ---------------------------------------------------------------------------
const S02: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = A("s02", "Tin một");
  const aHead = A("s02", "chạm mốc");
  const aCard = A("s02", "40.000 tỷ");
  const aC1 = A("s02", "giữa kỳ");
  const aC2 = A("s02", "100 triệu");
  const aC3 = A("s02", "leo thang");
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261019/img_s02.png" sceneFrames={SF("s02")} />
      <IllustrationTag />
      <BottomCol top={680}>
        <Kicker at={aKick} tone="gold">TIN MỘT · KINH TẾ</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.12 }}>Nợ công Mỹ chạm mốc 40.000 tỷ USD</div>
        </Spoken>
        <Card style={{
          padding: "28px 34px 26px", textAlign: "center", alignSelf: "center",
          opacity: interpolate(f - aCard, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ color: C.gold, fontSize: 120, fontWeight: 900, letterSpacing: 4, lineHeight: 1.05 }}>40.000 TỶ</div>
          <div style={{ color: C.textSoft, fontSize: 36, fontWeight: 800, letterSpacing: 4, marginTop: 12 }}>USD · TỔNG NỢ CÔNG MỸ</div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          <Spoken at={aC1} fromX={-30} fromY={0}>
            <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Bầu cử giữa kỳ 3/11</Chip>
          </Spoken>
          <Spoken at={aC2} fromX={-30} fromY={0}>
            <Chip color={C.gold} fill="rgba(245,196,112,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>&gt;100 triệu cử tri bỏ phiếu sớm</Chip>
          </Spoken>
          <Spoken at={aC3} fromX={-30} fromY={0}>
            <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Chi phí vay leo thang</Chip>
          </Spoken>
        </div>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S03 — TIN HAI · SỨC KHỎE: não mô cầu tại trường học TP.HCM (code-only, red)
// ---------------------------------------------------------------------------
const S03: React.FC = () => {
  const aKick = A("s03", "Tin hai");
  const aAttribution = A("s03", "Hai Bà Trưng");
  const aHead = A("s03", "não mô cầu");
  const aCard = A("s03", "một em tử vong");
  const aC1 = A("s03", "dừng bán trú");
  const aC2 = A("s03", "2.000");
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", top: 300, left: SAFE.x }}>
        <Kicker at={aKick} tone="red">TIN HAI · SỨC KHỎE</Kicker>
      </div>
      <Spoken at={aAttribution} fromY={16} style={{ position: "absolute", top: 392, left: SAFE.x, right: SAFE.x }}>
        <div style={{ color: C.textSoft, fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>Trường THCS Hai Bà Trưng (TP.HCM) ghi nhận</div>
      </Spoken>
      <Spoken at={aHead} fromY={22} style={{ position: "absolute", top: 460, left: SAFE.x, right: SAFE.x }}>
        <div style={{ color: C.text, fontSize: 60, fontWeight: 900, lineHeight: 1.15 }}>Não mô cầu: 4 ca, một em tử vong</div>
      </Spoken>
      <Spoken at={aCard} fromY={34} style={{ position: "absolute", top: 640, left: 140, right: 140 }}>
        <Card style={{ padding: "34px 30px 30px", textAlign: "center", width: "100%", boxSizing: "border-box" }}>
          <div style={{ color: C.red, fontSize: 84, fontWeight: 900, letterSpacing: 2, lineHeight: 1.05, whiteSpace: "nowrap" }}>4 CA · 1 EM TỬ VONG</div>
          <div style={{ color: C.textSoft, fontSize: 36, fontWeight: 800, letterSpacing: 3, marginTop: 12 }}>NÃO MÔ CẦU · TRƯỜNG THCS HAI BÀ TRƯNG</div>
        </Card>
      </Spoken>
      <div style={{ position: "absolute", top: 1190, left: SAFE.x, right: SAFE.x, display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center" }}>
        <Spoken at={aC1} fromY={20}>
          <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Dừng bán trú · khử khuẩn</Chip>
        </Spoken>
        <Spoken at={aC2} fromY={20}>
          <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>&gt;2.000 em uống kháng sinh dự phòng</Chip>
        </Spoken>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S04 — TIN BA · THẾ GIỚI: Putin đề xuất thượng đỉnh (backdrop, blue, 4 chips dọc)
// ---------------------------------------------------------------------------
const S04: React.FC = () => {
  const aKick = A("s04", "Tin ba");
  const aHead = A("s04", "đề xuất");
  const aC1 = A("s04", "Tập Cận Bình");
  const aC2 = A("s04", "từ chối");
  const aC3 = A("s04", "tạm dừng");
  const aC4 = A("s04", "ga dầu");
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261019/img_s04.png" sceneFrames={SF("s04")} />
      <IllustrationTag />
      <BottomCol top={640}>
        <Kicker at={aKick} tone="blue">TIN BA · THẾ GIỚI</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.12 }}>Putin đề xuất thượng đỉnh về Ukraine</div>
        </Spoken>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          <Spoken at={aC1} fromX={-30} fromY={0}>
            <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Thượng đỉnh với Trump và Tập Cận Bình</Chip>
          </Spoken>
          <Spoken at={aC2} fromX={-30} fromY={0}>
            <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Từ chối đàm phán với Zelensky</Chip>
          </Spoken>
          <Spoken at={aC3} fromX={-30} fromY={0}>
            <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Tạm dừng trừng phạt mới với Nga</Chip>
          </Spoken>
          <Spoken at={aC4} fromX={-30} fromY={0}>
            <Chip color={C.red} fill="rgba(239,68,68,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Đòn drone lớn nhất năm vào ga dầu Nga</Chip>
          </Spoken>
        </div>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S05 — TIN BỐN · ĐÔ THỊ: vòm cầu lá dừa nước 3.400 tấn (backdrop, violet)
// ---------------------------------------------------------------------------
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = A("s05", "Tin bốn");
  const aHead = A("s05", "cập Bến Bạch Đằng");
  const aCard = A("s05", "3.400 tấn");
  const aC1 = A("s05", "124 km");
  const aC2 = A("s05", "hàng giờ");
  const aC3 = A("s05", "cầu đi bộ");
  return (
    <AbsoluteFill>
      <Backdrop src="news-daily-20261019/img_s05.png" sceneFrames={SF("s05")} />
      <IllustrationTag />
      <BottomCol top={680}>
        <Kicker at={aKick} tone="violet">TIN BỐN · ĐÔ THỊ</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.12 }}>Vòm cầu 'lá dừa nước' cập Bến Bạch Đằng</div>
        </Spoken>
        <Card style={{
          padding: "28px 34px 26px", textAlign: "center", alignSelf: "center",
          opacity: interpolate(f - aCard, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ color: C.violet, fontSize: 120, fontWeight: 900, letterSpacing: 4, lineHeight: 1.05 }}>3.400 TẤN</div>
          <div style={{ color: C.textSoft, fontSize: 34, fontWeight: 800, letterSpacing: 3, marginTop: 12 }}>VÒM CẦU LÁ DỪA NƯỚC · NHỊP CHÍNH</div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          <Spoken at={aC1} fromX={-30} fromY={0}>
            <Chip color={C.violet} fill="rgba(139,92,246,0.10)" style={{ fontSize: 34, fontWeight: 800 }}>Lai dắt 124 km · hơn 30 giờ từ Vũng Tàu</Chip>
          </Spoken>
          <Spoken at={aC2} fromX={-30} fromY={0}>
            <Chip color={C.gold} fill="rgba(245,196,112,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Người dân chờ hàng giờ chiêm ngưỡng</Chip>
          </Spoken>
          <Spoken at={aC3} fromX={-30} fromY={0}>
            <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Cầu đi bộ qua sông Sài Gòn</Chip>
          </Spoken>
        </div>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S06 — TIN NĂM · THỜI TIẾT: siêu bão Champi cấp 16 (backdrop, amber)
// ---------------------------------------------------------------------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const aKick = A("s06", "Tin năm");
  const aHead = A("s06", "siêu bão");
  const aCard = A("s06", "cấp 16");
  const aC1 = A("s06", "ít khả năng");
  const aC2 = A("s06", "Đài Loan");
  return (
    <AbsoluteFill>
      <Backdrop
        src="news-daily-20261019/img_s06.png"
        sceneFrames={SF("s06")}
        pos="60% 50%"
        // Extra top scrim: the satellite storm spiral keeps bright arms at both frame
        // edges y<840; the base gradient alone leaves edge runs >8px (sweep FAIL).
        topScrim="linear-gradient(180deg, rgba(7,10,15,0.62) 0%, rgba(7,10,15,0.44) 420px, rgba(7,10,15,0.12) 840px, rgba(7,10,15,0) 1100px)"
      />
      <IllustrationTag />
      <BottomCol top={680}>
        <Kicker at={aKick} tone="amber">TIN NĂM · THỜI TIẾT</Kicker>
        <Spoken at={aHead} fromY={26}>
          <div style={{ color: C.text, fontSize: 58, fontWeight: 800, lineHeight: 1.12 }}>Siêu bão Champi mạnh cấp 16</div>
        </Spoken>
        <Card style={{
          padding: "28px 34px 26px", textAlign: "center", alignSelf: "center",
          opacity: interpolate(f - aCard, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ color: C.amber, fontSize: 160, fontWeight: 900, letterSpacing: 4, lineHeight: 1.0, marginTop: 6 }}>CẤP 16</div>
          <div style={{ color: C.textSoft, fontSize: 34, fontWeight: 800, letterSpacing: 3, marginTop: 12 }}>SÓNG BIỂN ĐÔNG CAO TRÊN 5 M</div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          <Spoken at={aC1} fromX={-30} fromY={0}>
            <Chip color={C.amber} fill="rgba(245,158,11,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Ít khả năng vào Biển Đông</Chip>
          </Spoken>
          <Spoken at={aC2} fromX={-30} fromY={0}>
            <Chip color={C.blue} fill="rgba(37,99,235,0.08)" style={{ fontSize: 34, fontWeight: 800 }}>Ảnh hưởng Đài Loan, ven biển Trung Quốc</Chip>
          </Spoken>
        </div>
      </BottomCol>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S07 — NHẬN ĐỊNH · GÓC NHÌN NGƯỜI ĐI LÀM (code-only, green — new for 19/10)
// Kicker badge + question headline, 3 rows like S01 each with a NHẬN ĐỊNH mini-pill.
// ---------------------------------------------------------------------------
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aKick = A("s07", "Nhận định");
  const aHead = A("s07", "Vay dễ nhưng trả khó");
  const aFoot = A("s07", "chi phí đi lại");
  const rows: { at: number; tone: Tone; main: string }[] = [
    { at: A("s07", "ngân sách"), tone: "gold", main: "Vay dễ, trả khó — đúng với ngân sách gia đình" },
    { at: A("s07", "thông báo"), tone: "red", main: "Cha mẹ: theo dõi thông báo từ trường" },
    { at: A("s07", "chi phí đi lại"), tone: "amber", main: "Canh chi phí đi lại khi năng lượng rung lắc" },
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{
        backgroundColor: C.bgDeep,
        backgroundImage: `repeating-linear-gradient(0deg, ${C.grid} 0 1px, transparent 1px 96px), repeating-linear-gradient(90deg, ${C.grid} 0 1px, transparent 1px 96px)`,
      }} />
      <div style={{ position: "absolute", top: 280, left: SAFE.x, right: SAFE.x }}>
        <Kicker at={aKick} tone="green">NHẬN ĐỊNH · GÓC NHÌN NGƯỜI ĐI LÀM</Kicker>
      </div>
      <Spoken at={aHead} fromY={22} style={{ position: "absolute", top: 380, left: SAFE.x, right: SAFE.x }}>
        <div style={{ color: C.text, fontSize: 56, fontWeight: 900, lineHeight: 1.15 }}>Điều này có nghĩa là gì?</div>
      </Spoken>
      <div style={{ position: "absolute", top: 540, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", gap: 22 }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            height: 160, borderRadius: 24, background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `10px solid ${toneText(r.tone)}`, display: "flex", flexDirection: "column",
            justifyContent: "center", paddingLeft: 40, paddingRight: 40, position: "relative", ...slam(r.at, f, fps),
          }}>
            <div style={{
              position: "absolute", top: -12, left: 36, background: C.bgDeep,
              border: `2px solid ${C.green}`, borderRadius: 999, padding: "2px 14px",
              color: C.green, fontSize: 22, fontWeight: 800, letterSpacing: 1,
            }}>NHẬN ĐỊNH</div>
            <div style={{ color: C.text, fontSize: 46, fontWeight: 800, lineHeight: 1.08 }}>{r.main}</div>
          </div>
        ))}
      </div>
      <div style={{
        position: "absolute", top: 1108, left: SAFE.x, right: SAFE.x, textAlign: "center",
        color: C.muted, fontSize: 26, fontWeight: 600,
        opacity: interpolate(f - aFoot, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>Nhận định chỉ diễn giải thông tin đã có trong bản tin</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S08 — OUTRO: năm tin / 19-10-2026 + CTA (code-only, green)
// ---------------------------------------------------------------------------
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const aBadge = A("s08", "Trên đây");
  const aCard = A("s08", "năm tin");
  const aCta = A("s08", "Theo dõi");
  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>
      <Spoken at={aBadge} fromY={16} style={{ position: "absolute", top: 330, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <Badge tone="green" style={{ fontSize: 32, padding: "12px 30px" }}>TIN NHANH 19/10</Badge>
      </Spoken>
      <Spoken at={aCard} fromY={34} style={{ position: "absolute", top: 560, left: 140, right: 140 }}>
        <Card style={{
          padding: "40px 30px 36px", textAlign: "center",
          ...(f >= aCard + 10 ? glow("rgba(52,211,153,0.25)", 36) : {}),
        }}>
          <div style={{ color: C.green, fontSize: 112, fontWeight: 900, letterSpacing: 2, lineHeight: 1.05 }}>5 TIN</div>
          <div style={{ color: C.textSoft, fontSize: 40, fontWeight: 800, letterSpacing: 6, marginTop: 14 }}>+ NHẬN ĐỊNH · 19/10/2026</div>
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
  s05: S05, s06: S06, s07: S07, s08: S08,
};

const BGM_VOLUME = 0.16; // reference mix (news-20261006 / 15/10 / 16/10 / 17/10 / 18/10)
const BGM_FADE_IN = 30; // 1s
const BGM_FADE_OUT = 60; // 2s

export const News20261019: React.FC<{ hud?: boolean }> = ({ hud = false }) => (
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
    <Audio src={staticFile("news-daily-20261019/narration_full.wav")} volume={1} />
    <Audio
      src={staticFile("news-daily-20261019/bgm.mp3")}
      volume={(fr) =>
        BGM_VOLUME *
        Math.min(1, fr / BGM_FADE_IN) *
        Math.min(1, Math.max(0, (TOTAL_FRAMES - fr) / BGM_FADE_OUT))
      }
    />
    {hud ? <Hud /> : null}
  </AbsoluteFill>
);
