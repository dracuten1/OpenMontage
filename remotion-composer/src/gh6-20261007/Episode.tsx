// gh6-20261007 — "PhotoCraft miễn phí bằng Rust" (atelier composition, VERTICAL 1080x1920).
// One <Sequence> per scene from MEASURED scene_timing.json (116.891s). Every reveal /
// count-up / tick is speech-locked (frameOf) to SPOKEN word times in
// public/gh6-20261007/words.json (73/73 anchors audited at compose time).
// Layout per scene_plan: content x 80-1000, core y 400-1250; captions own y > 1500.
// Display forms only on screen (★ 14.095, CLEAN-ROOM, 307/309, v0.1.1…) — no respellings.
import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring,
} from "remotion";
import { C, FONT, MONO, SAFE, SPRING, fmtVi } from "./theme";
import { SCENE_TIMING, TOTAL_FRAMES, frameOf, getSceneTiming, type SceneId } from "./timing";
import captionsJson from "../../public/gh6-20261007/captions.json";

export const GH6_20261007_TOTAL_FRAMES = TOTAL_FRAMES; // 3537
const SF = (id: SceneId): number => getSceneTiming(id).scene_frames;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const lit = (f: number, at: number, k = 8): number => interpolate(f - at, [0, k], [0, 1], clamp);

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const Card: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 22, ...style }}>{children}</div>
);

const Chip: React.FC<{
  color: string; children?: React.ReactNode; dashed?: boolean; fill?: string; style?: React.CSSProperties;
}> = ({ color, children, dashed, fill = "rgba(255,255,255,0.04)", style }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 10,
    background: fill, color, border: `1.5px ${dashed ? "dashed" : "solid"} ${color}`,
    borderRadius: 12, padding: "10px 20px", fontSize: 28, fontWeight: 700, ...style,
  }}>{children}</div>
);

const slam = (at: number, frame: number, fps: number, fromScale = 1.45) => {
  const p = spring({ frame: frame - at, fps, config: { ...SPRING, damping: 18 } });
  const op = interpolate(frame - at, [0, 6], [0, 1], clamp);
  return { opacity: op, transform: `scale(${fromScale + (1 - fromScale) * p})` };
};

const glow = (color: string, strength: number): React.CSSProperties => ({ boxShadow: `0 0 ${strength}px ${color}` });

/** Number count-up, speech-locked. `at` = scene-local trigger frame. */
const CountUp: React.FC<{
  at: number; to: number; frames?: number; decimals?: number; style?: React.CSSProperties;
}> = ({ at, to, frames = 36, decimals = 0, style }) => {
  const f = useCurrentFrame();
  const eased = to * (f < at ? 0 : Math.pow(interpolate(f - at, [0, frames], [0, 1], clamp), 0.6));
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{f < at ? "" : fmtVi(eased, decimals)}</span>;
};

/** Green chip 'ảnh thật từ repo' — mandatory at first appearance of every real screenshot.
 *  fix1: no longer absolute-on-card (it covered screenshot chrome); the parent places it
 *  in its own band above / beside the card, outside the screenshot pixels. */
const RealPhotoChip: React.FC<{ at: number; style?: React.CSSProperties }> = ({ at, style }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ opacity: lit(f, at, 6), ...glow("rgba(63,185,80,0.3)", 16), borderRadius: 12, ...style }}>
      <Chip color={C.green} fill="rgba(1,4,9,0.78)" style={{ fontSize: 24 }}>ảnh thật từ repo</Chip>
    </div>
  );
};

/** Amber snapshot chip 'tính đến 07/10' — on every stat card. */
const SnapChip: React.FC = () => (
  <Chip color={C.amber} dashed fill="rgba(210,153,34,0.08)" style={{ fontSize: 24 }}>tính đến 07/10</Chip>
);

// ---------------------------------------------------------------------------
// S01 — HOOK: kinetic title + star hint + ★14.095 stat + 7 NGÀY + promise
// ---------------------------------------------------------------------------
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aKinetic = frameOf("s01", "viết lại miễn phí");       // kinetic hit
  const aStat = frameOf("s01", "hơn mười bốn nghìn");          // stat card CountUp
  const aSeven = frameOf("s01", "bảy ngày");                    // '7 NGÀY' block
  const aOpen = frameOf("s01", "mã nguồn mở");                  // open-source chip + repo chip
  const aPromise = frameOf("s01", "Rít-mi không khoe");         // promise line
  const starDrift = interpolate(f, [0, SF("s01")], [0, -26], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* gen hero as dim canvas backdrop + readability gradient (focal-visual: base layer) */}
      <Img src={staticFile("gh6-20261007/img_s01_hero.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.30 * lit(f, 2, 14) }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,17,23,0.82) 0%, rgba(13,17,23,0.55) 30%, rgba(13,17,23,0.94) 62%, #0D1117 100%)" }} />
      {/* star chart hint silhouette (no numbers legible — dim, drifting) */}
      <div style={{ position: "absolute", top: 262, left: SAFE.x, width: SAFE.w, height: 150, overflow: "hidden", opacity: 0.20 }}>
        <Img src={staticFile("gh6-20261007/star_history.svg")} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom", transform: `translateY(${starDrift}px)` }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,17,23,0.9), transparent 45%, rgba(13,17,23,0.75))" }} />
      </div>
      {/* kinetic title */}
      <div style={{ position: "absolute", top: 452, left: SAFE.x, right: SAFE.x, textAlign: "center", lineHeight: 1.04 }}>
        <div style={{ color: C.textSoft, fontSize: 58, fontWeight: 800, letterSpacing: 2, opacity: lit(f, 2, 8) }}>PHOTOSHOP</div>
        <div style={{ color: C.text, fontSize: 96, fontWeight: 900, letterSpacing: 1, ...slam(aKinetic, f, fps, 1.4) }}>BỊ VIẾT LẠI</div>
        <div style={{ marginTop: 10, ...slam(aKinetic + 8, f, fps, 1.55) }}>
          <span style={{ color: C.green, fontSize: 108, fontWeight: 900, textShadow: "0 0 40px rgba(63,185,80,0.45)" }}>MIỄN PHÍ</span>
          <span style={{ marginLeft: 22, verticalAlign: "middle" }}>
            <Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 34, fontWeight: 900 }}>RUST</Chip>
          </span>
        </div>
      </div>
      {/* stat card — ★ CountUp 0→14.095 at 'hơn mười bốn nghìn' */}
      <div style={{
        position: "absolute", top: 852, left: SAFE.x, right: SAFE.x,
        opacity: lit(f, aStat, 10), transform: `translateY(${interpolate(f - aStat, [0, 12], [46, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "24px 32px", display: "flex", alignItems: "center", gap: 26, ...(f >= aStat ? glow("rgba(63,185,80,0.25)", 22) : {}) }}>
          <div style={{ color: C.green, fontSize: 92, fontWeight: 900, lineHeight: 1, fontFamily: FONT }}>
            ★ <CountUp at={aStat} to={14095} frames={40} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div style={{ color: C.textSoft, fontSize: 32, fontWeight: 700 }}>
              fork <span style={{ color: C.text, fontWeight: 800 }}>1.862</span>
            </div>
            <div style={{ color: C.muted, fontSize: 28, fontWeight: 600, fontFamily: MONO }}>tạo 30/09/2026</div>
          </div>
          <SnapChip />
        </Card>
      </div>
      {/* '7 NGÀY' block + open-source chip (ordinal per narration) */}
      <div style={{ position: "absolute", top: 1042, left: SAFE.x, right: SAFE.x, display: "flex", gap: 20, justifyContent: "center", alignItems: "center" }}>
        <div style={{ ...slam(aSeven, f, fps, 1.5) }}>
          <div style={{ background: C.blueFill, border: `2.5px solid ${C.blue}`, color: C.blue, borderRadius: 16, padding: "14px 30px", fontSize: 52, fontWeight: 900, letterSpacing: 2, ...(f >= aSeven ? glow("rgba(88,166,255,0.3)", 20) : {}) }}>7 NGÀY</div>
        </div>
        <div style={{ opacity: lit(f, aOpen, 8), transform: `translateY(${interpolate(f - aOpen, [0, 10], [20, 0], clamp)}px)` }}>
          <Chip color={C.green} fill={C.greenFill} style={{ fontSize: 28 }}>MIỄN PHÍ • MÃ NGUỒN MỞ</Chip>
        </div>
      </div>
      {/* repo chip (recurring element) */}
      <div style={{
        position: "absolute", top: 1160, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
        opacity: lit(f, aOpen + 8, 10), transform: `translateX(${interpolate(f - aOpen - 8, [0, 12], [-60, 0], clamp)}px)`,
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, background: "rgba(88,166,255,0.10)", border: `1.5px solid ${C.blue}`, borderRadius: 999, padding: "10px 26px", color: C.blue, fontFamily: MONO, fontSize: 28, fontWeight: 600 }}>
          <span style={{ width: 13, height: 13, borderRadius: 7, background: C.blue, display: "inline-block" }} />
          github.com/storytold/photocraft
        </div>
      </div>
      {/* promise line — closes the loop at s09 */}
      <div style={{
        position: "absolute", top: 1246, left: SAFE.x, right: SAFE.x, textAlign: "center",
        opacity: lit(f, aPromise, 12), transform: `translateY(${interpolate(f - aPromise, [0, 12], [22, 0], clamp)}px)`,
      }}>
        <span style={{ color: C.amber, fontSize: 36, fontWeight: 700, opacity: 0.92 }}>và một điều README không khoe</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S02 — BẢN CHẤT: classification cards + clean-room definition + chips
// ---------------------------------------------------------------------------
const S02: React.FC = () => {
  const f = useCurrentFrame();
  const aTitle = frameOf("s02", "Phô-tô");
  const a100 = frameOf("s02", "một trăm phần trăm");
  const aClean = frameOf("s02", "clin-rum");
  const aCode = frameOf("s02", "không code");
  const aFork = frameOf("s02", "Không phải fork Gimp");
  const aCrack = frameOf("s02", "Không phải crack");
  const a24 = frameOf("s02", "hai mươi bốn mô-đun");
  const strike = (at: number): React.CSSProperties => ({
    position: "absolute", left: -8, right: -8, top: "50%", height: 6, background: C.red, borderRadius: 3,
    transformOrigin: "left", transform: `scaleX(${interpolate(f - at, [0, 10], [0, 1], clamp)})`, boxShadow: "0 0 14px rgba(248,81,73,0.5)",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* title */}
      <div style={{ position: "absolute", top: 382, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aTitle, 10) }}>
        <div style={{ color: C.text, fontSize: 74, fontWeight: 900, letterSpacing: 2 }}>PHOTOCRAFT</div>
        <div style={{ color: C.textSoft, fontSize: 34, fontWeight: 700, marginTop: 6 }}>bản viết lại mã nguồn mở kiểu Photoshop</div>
      </div>
      {/* classification cards: dim backdrop first, ticks/strikes per narration */}
      <div style={{ position: "absolute", top: 552, left: SAFE.x, right: SAFE.x, display: "flex", gap: 18 }}>
        {[
          { t: "FORK GIMP", at: aFork, good: false },
          { t: "CRACK", at: aCrack, good: false },
          { t: "CLEAN-ROOM REIMPLEMENTATION", at: aClean, good: true },
        ].map((c, i) => {
          const on = f >= c.at;
          return (
            <div key={i} style={{
              flex: 1, position: "relative", padding: "26px 14px", borderRadius: 16, textAlign: "center",
              background: on ? (c.good ? C.greenFill : C.redFill) : C.surface,
              border: `2px solid ${on ? (c.good ? C.green : C.red) : C.border}`,
              opacity: f >= aTitle + 8 ? (on ? 1 : 0.45) : 0,
              ...(on ? glow(c.good ? "rgba(63,185,80,0.25)" : "rgba(248,81,73,0.25)", 18) : {}),
            }}>
              <div style={{ color: on ? (c.good ? C.green : C.red) : C.muted, fontSize: 58, fontWeight: 900, lineHeight: 1 }}>{c.good ? "✓" : "✗"}</div>
              <div style={{ color: C.text, fontSize: 25, fontWeight: 800, marginTop: 10, lineHeight: 1.2, position: "relative" }}>
                {c.t}
                {!c.good ? <div style={strike(c.at)} /> : null}
              </div>
            </div>
          );
        })}
      </div>
      {/* clean-room definition card — ticks line by line */}
      <div style={{
        position: "absolute", top: 812, left: SAFE.x, right: SAFE.x,
        opacity: lit(f, aClean, 10), transform: `translateY(${interpolate(f - aClean, [0, 10], [26, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "30px 36px", border: `2px solid ${C.blue}`, ...(f >= aClean ? glow("rgba(88,166,255,0.22)", 20) : {}) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ color: C.blue, fontSize: 34, fontWeight: 900 }}>✓</span>
            <span style={{ color: C.blue, fontSize: 34, fontWeight: 800 }}>CLEAN-ROOM — nghĩa là</span>
          </div>
          <div style={{ color: C.text, fontSize: 36, fontWeight: 700, lineHeight: 1.35, opacity: lit(f, aClean + 6, 8) }}>
            từ đặc tả công khai + hành vi quan sát được
          </div>
          <div style={{ color: C.textSoft, fontSize: 32, fontWeight: 700, marginTop: 10, opacity: lit(f, aCode, 8) }}>
            không code · không shader · không asset của Adobe
          </div>
        </Card>
      </div>
      {/* chips row: 100% RUST (early) + engine-first cluster (late) */}
      <div style={{ position: "absolute", top: 1128, left: SAFE.x, right: SAFE.x, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        <div style={{ opacity: lit(f, a100, 8), ...(f >= a100 ? glow("rgba(210,153,34,0.3)", 16) : {}), borderRadius: 12 }}>
          <Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 30, fontWeight: 900 }}>100% RUST</Chip>
        </div>
        {["ENGINE-FIRST", "24 CRATES", "THIN EGUI UI"].map((t, i) => (
          <div key={t} style={{ opacity: lit(f, a24 + i * 5, 8), transform: `translateY(${interpolate(f - a24 - i * 5, [0, 10], [18, 0], clamp)}px)` }}>
            <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 28 }}>{t}</Chip>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S03 — BẰNG CHỨNG: hero real screenshot + panel callouts + stamp
// ---------------------------------------------------------------------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aCard = frameOf("s03", "Giao diện như Phô-tố-sốp");
  const aLayers = frameOf("s03", "lay-ơ");
  const aMasks = frameOf("s03", "mask");
  const aCurves = frameOf("s03", "Cừ-vờ");
  const aHist = frameOf("s03", "hi-xtô-gram");
  const aStamp = frameOf("s03", "ảnh thật của ứng dụng");
  const aMock = frameOf("s03", "không phải mốc-áp");
  const pan = interpolate(f, [aCard, SF("s03")], [-22, 22], clamp);
  const zoom = interpolate(f, [aCard, SF("s03")], [1.06, 1.1], clamp);
  const callouts = [
    { t: "LAYERS", at: aLayers }, { t: "MASKS", at: aMasks },
    { t: "CURVES", at: aCurves }, { t: "HISTOGRAM", at: aHist },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* fix1 stacked bands: badge band ABOVE → screenshot card in its OWN band (native
          8:5 → 920×575, aspect preserved, no text over it) → panels band BELOW → stamp band */}
      <div style={{ position: "absolute", top: 340, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "flex-end" }}>
        <RealPhotoChip at={aCard} />
      </div>
      <div style={{ position: "absolute", top: 424, left: SAFE.x, width: SAFE.w, height: 575, ...slam(aCard, f, fps, 1.12) }}>
        {/* letterbox frame; image aspect preserved (contain), slow pan L→R + zoom 1.06→1.10 */}
        <div style={{ position: "absolute", inset: 0, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 20, overflow: "hidden" }}>
          <Img src={staticFile("gh6-20261007/photocraft-demo.jpg")} style={{ width: "100%", height: "100%", objectFit: "contain", transform: `translateX(${pan}px) scale(${zoom})` }} />
        </div>
      </div>
      {/* panel callouts band — pop in narration order, BELOW the card, never on the screenshot */}
      <div style={{ position: "absolute", top: 1036, left: SAFE.x, right: SAFE.x, display: "flex", gap: 14, justifyContent: "center" }}>
        {callouts.map((c) => (
          <div key={c.t} style={{ display: "flex", alignItems: "center", gap: 8, opacity: lit(f, c.at, 6) }}>
            <span style={{ width: 34, height: 3, background: C.blue, display: "inline-block", borderRadius: 2 }} />
            <span style={{ background: "rgba(1,4,9,0.82)", border: `1.5px solid ${C.blue}`, color: C.blue, borderRadius: 8, padding: "6px 14px", fontSize: 24, fontWeight: 800, fontFamily: MONO }}>{c.t}</span>
          </div>
        ))}
      </div>
      {/* verdict stamp band */}
      <div style={{ position: "absolute", top: 1174, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, ...slam(aStamp, f, fps, 1.5) }}>
          <span style={{ border: `3px solid ${C.green}`, color: C.green, borderRadius: 12, padding: "12px 26px", fontSize: 40, fontWeight: 900, letterSpacing: 1, background: "rgba(1,4,9,0.6)", ...(f >= aStamp ? glow("rgba(63,185,80,0.4)", 24) : {}) }}>ẢNH THẬT CỦA APP</span>
          <span style={{ color: C.red, fontSize: 40, fontWeight: 900, opacity: lit(f, aMock, 6), transform: `scale(${interpolate(f - aMock, [0, 8], [0.6, 1], clamp)})` }}>— KHÔNG PHẢI MOCKUP</span>
        </div>
        <div style={{ marginTop: 14, color: C.muted, fontSize: 27, fontWeight: 600, fontFamily: MONO, opacity: lit(f, aMock + 4, 8) }}>render offscreen qua control channel</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S04 — TÍNH NĂNG: real screenshot + CountUps 34/16 + brush cluster + ticker
// ---------------------------------------------------------------------------
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const aCard = frameOf("s04", "Tính năng thật");
  const a34 = frameOf("s04", "ba mươi bốn");
  const aLa = frameOf("s04", "La-xô");
  const aMW = frameOf("s04", "Mê-jích Uân");
  const aCl = frameOf("s04", "Clôn");
  const aHB = frameOf("s04", "Hi-ling Brớ");
  const a16 = frameOf("s04", "Mười sáu a-giút-men");
  const aPress = frameOf("s04", "lực bút");
  const aTilt = frameOf("s04", "nghiêng bút");
  const aRot = frameOf("s04", "xoay bút");
  const aType = frameOf("s04", "xmát-ốp-chét");
  const aSF = frameOf("s04", "xmát-phin-tơ");
  const zoom = interpolate(f, [aCard, SF("s04")], [1.06, 1.1], clamp);
  const typeFade = interpolate(f, [aType, aType + 14], [0, 1], clamp);
  const tools = [
    { t: "Lasso", at: aLa }, { t: "Magic Wand", at: aMW }, { t: "Clone Stamp", at: aCl }, { t: "Healing Brush", at: aHB },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* fix1 stacked bands: title+badge band ABOVE → screenshot card in its OWN band
          (native 8:5 → 920×575, aspect preserved) → stats → brush → ticker bands BELOW */}
      <div style={{ position: "absolute", top: 336, left: SAFE.x, right: SAFE.x, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: C.text, fontSize: 42, fontWeight: 900, letterSpacing: 1, opacity: lit(f, aCard, 8) }}>TÍNH NĂNG THẬT</div>
        <RealPhotoChip at={aCard} />
      </div>
      <div style={{ position: "absolute", top: 424, left: SAFE.x, width: SAFE.w, height: 575, borderRadius: 20, overflow: "hidden", border: `1.5px solid ${C.border}`, background: C.surface, opacity: lit(f, aCard, 10) }}>
        <Img src={staticFile("gh6-20261007/photocraft-adjustments.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", transform: `scale(${zoom})`, opacity: 1 - typeFade }} />
        <Img src={staticFile("gh6-20261007/photocraft-type.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", transform: `scale(${zoom})`, opacity: typeFade }} />
      </div>
      {/* CountUp pair band */}
      <div style={{ position: "absolute", top: 1036, left: SAFE.x, right: SAFE.x, display: "flex", gap: 18 }}>
        <Card style={{ flex: 1, padding: "20px 28px", opacity: lit(f, a34, 8), ...(f >= a34 ? glow("rgba(88,166,255,0.22)", 18) : {}) }}>
          <div style={{ color: C.blue, fontSize: 66, fontWeight: 900, lineHeight: 1 }}><CountUp at={a34} to={34} frames={26} /></div>
          <div style={{ color: C.textSoft, fontSize: 28, fontWeight: 800, marginTop: 4 }}>TOOLS</div>
        </Card>
        <Card style={{ flex: 1.25, padding: "20px 28px", opacity: lit(f, a16, 8), ...(f >= a16 ? glow("rgba(88,166,255,0.22)", 18) : {}) }}>
          <div style={{ color: C.blue, fontSize: 66, fontWeight: 900, lineHeight: 1 }}><CountUp at={a16} to={16} frames={26} /> <span style={{ fontSize: 34 }}>ADJ. LAYERS</span></div>
          <div style={{ color: C.muted, fontSize: 25, fontWeight: 700, marginTop: 4 }}>Curves per-channel · Levels live histogram</div>
        </Card>
      </div>
      {/* brush engine cluster band */}
      <div style={{ position: "absolute", top: 1246, left: SAFE.x, right: SAFE.x, display: "flex", gap: 16, justifyContent: "center", alignItems: "center", opacity: lit(f, aPress, 10) }}>
        <svg width={54} height={54} viewBox="0 0 54 54">
          <path d="M 33 7 L 47 21 L 21 47 L 8 49 L 10 36 Z" fill="none" stroke={C.green} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M 10 36 L 18 44" stroke={C.green} strokeWidth={3.5} />
        </svg>
        {[
          { t: "PRESSURE", at: aPress }, { t: "TILT", at: aTilt }, { t: "ROTATION", at: aRot },
        ].map((b) => (
          <span key={b.t} style={{
            border: `2px solid ${f >= b.at ? C.green : C.border}`, color: f >= b.at ? C.green : C.muted,
            background: f >= b.at ? C.greenFill : "transparent", borderRadius: 10, padding: "10px 18px",
            fontSize: 27, fontWeight: 900, fontFamily: MONO,
          }}>{b.t}</span>
        ))}
      </div>
      {/* tool ticker cascade + smart chips band */}
      <div style={{ position: "absolute", top: 1338, left: SAFE.x, right: SAFE.x, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        {tools.map((t) => (
          <div key={t.t} style={{ opacity: lit(f, t.at, 6), transform: `translateY(${interpolate(f - t.at, [0, 8], [16, 0], clamp)}px)` }}>
            <Chip color={C.textSoft} fill="rgba(255,255,255,0.05)" style={{ fontSize: 25, fontFamily: MONO }}>{t.t}</Chip>
          </div>
        ))}
        <div style={{ opacity: lit(f, aSF, 6) }}>
          <Chip color={C.green} fill={C.greenFill} style={{ fontSize: 25 }}>SMART OBJECTS + SMART FILTERS</Chip>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S05 — PSD: 307/309 fraction hero on dimmed real backdrops + format chips
// ---------------------------------------------------------------------------
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aTitle = frameOf("s05", "chuẩn trao đổi với khách hàng");
  const aFrac = frameOf("s05", "ba trăm linh bảy");
  const aPSB = frameOf("s05", "Pi-ét-bi");
  const a16b = frameOf("s05", "mười sáu bit");
  const aCMYK = frameOf("s05", "xi-em-ai-kờ");
  const aLAB = frameOf("s05", "Láp");
  const aDirect = frameOf("s05", "mở trực tiếp");
  const bgFade = interpolate(f, [aDirect, aDirect + 15], [0, 1], clamp);
  const bgPan = interpolate(f, [0, SF("s05")], [-16, 16], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* fix1: repo screenshots as ≤15% dimmed BACKGROUND fill (allowed alternative) —
          no card anymore, so text bands can never collide with the screenshot UI */}
      <Img src={staticFile("gh6-20261007/photocraft-layer-styles.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: (1 - bgFade) * 0.14, transform: `translateX(${bgPan}px) scale(1.05)` }} />
      <Img src={staticFile("gh6-20261007/photocraft-masks.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bgFade * 0.14, transform: `translateX(${-bgPan}px) scale(1.05)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,17,23,0.35) 0%, rgba(13,17,23,0.55) 55%, #0D1117 100%)" }} />
      {/* badge band — own row above the title band */}
      <div style={{ position: "absolute", top: 340, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "flex-end" }}>
        <RealPhotoChip at={aTitle} />
      </div>
      {/* foreground content */}
      <div style={{ position: "absolute", top: 420, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aTitle, 10) }}>
        <span style={{ color: C.blue, fontSize: 44, fontWeight: 900, letterSpacing: 1 }}>PSD — CHUẨN TRAO ĐỔI VỚI KHÁCH HÀNG</span>
      </div>
      {/* the fraction — most important visual of the video */}
      <div style={{ position: "absolute", top: 540, left: SAFE.x, right: SAFE.x, textAlign: "center", ...slam(aFrac, f, fps, 1.35) }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 20, fontFamily: FONT, fontWeight: 900, lineHeight: 1 }}>
          <span style={{ color: C.green, fontSize: 220, textShadow: "0 0 60px rgba(63,185,80,0.35)" }}><CountUp at={aFrac} to={307} frames={40} /></span>
          <span style={{ color: C.muted, fontSize: 140 }}>/</span>
          <span style={{ color: C.text, fontSize: 140 }}><CountUp at={aFrac} to={309} frames={40} /></span>
        </div>
        <div style={{ color: C.textSoft, fontSize: 30, fontWeight: 700, marginTop: 14, opacity: lit(f, aFrac + 10, 10) }}>
          tự đo trên corpus psd-tools · mở → lưu lại · render giống hệt
        </div>
      </div>
      {/* format chip grid */}
      <div style={{ position: "absolute", top: 986, left: SAFE.x, right: SAFE.x, display: "flex", gap: 16, justifyContent: "center" }}>
        {[
          { t: "PSB", at: aPSB }, { t: "16-BIT", at: a16b }, { t: "CMYK", at: aCMYK }, { t: "LAB", at: aLAB },
        ].map((c) => (
          <div key={c.t} style={{
            border: `2px solid ${f >= c.at ? C.blue : C.border}`, color: f >= c.at ? C.blue : C.muted,
            background: f >= c.at ? C.blueFill : "transparent", borderRadius: 12, padding: "12px 22px",
            fontSize: 30, fontWeight: 900, fontFamily: MONO, opacity: f >= c.at ? 1 : 0.4,
            transform: `scale(${f >= c.at ? 1 : 0.9})`,
          }}>{c.t}</div>
        ))}
      </div>
      {/* MỞ TRỰC TIẾP */}
      <div style={{ position: "absolute", top: 1118, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", opacity: lit(f, aDirect, 8), transform: `translateY(${interpolate(f - aDirect, [0, 10], [22, 0], clamp)}px)` }}>
        <Chip color={C.green} fill={C.greenFill} style={{ fontSize: 34, fontWeight: 900, ...(f >= aDirect ? glow("rgba(63,185,80,0.3)", 18) : {}) as React.CSSProperties }}>
          ✓ MỞ TRỰC TIẾP
        </Chip>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S06 — ENGINE: compositor pair + 1.700+ tests + 256² tile grid + WASM chip
// ---------------------------------------------------------------------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const aPair = frameOf("s06", "cặp com-positor");
  const aCross = frameOf("s06", "test chéo với nhau");
  const a17 = frameOf("s06", "hơn một nghìn bảy trăm");
  const a256 = frameOf("s06", "hai trăm năm mươi sáu bình phương");
  const aUndo = frameOf("s06", "undo rẻ");
  const aCanvas = frameOf("s06", "canvas khổng lồ");
  const aWasm = frameOf("s06", "chạy trong trình duyệt");
  const pingPong = f >= aCross ? 0.5 + 0.5 * Math.sin(((f - aCross) / 14) * Math.PI) : 0;
  const tileProg = interpolate(f - a256, [0, 30], [0, 1], clamp);
  const tileCount = Math.floor(tileProg * 24);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* compositor pair */}
      <div style={{ position: "absolute", top: 418, left: SAFE.x, right: SAFE.x, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, opacity: lit(f, aPair, 10) }}>
        <div style={{ width: 330, padding: "24px 18px", borderRadius: 16, textAlign: "center", background: C.surface, border: `2px solid ${C.textSoft}` }}>
          <div style={{ color: C.text, fontSize: 40, fontWeight: 900, fontFamily: MONO }}>CPU</div>
          <div style={{ color: C.textSoft, fontSize: 25, fontWeight: 700, marginTop: 6 }}>REFERENCE ORACLE</div>
        </div>
        {/* ping-pong arrows 'TEST CHÉO' */}
        <div style={{ width: 240, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <svg width={220} height={96} viewBox="0 0 220 96">
            <path d="M 8 30 H 200" stroke={C.blue} strokeWidth={5} opacity={f >= aCross ? 0.35 + 0.65 * pingPong : 0.25} markerEnd="url(#ah)" />
            <path d="M 212 66 H 20" stroke={C.blue} strokeWidth={5} opacity={f >= aCross ? 1 - 0.65 * pingPong : 0.25} markerEnd="url(#ah)" />
            <defs>
              <marker id="ah" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <path d="M 0 0 L 9 4.5 L 0 9 Z" fill={C.blue} />
              </marker>
            </defs>
          </svg>
          <div style={{ color: f >= aCross ? C.blue : C.muted, fontSize: 27, fontWeight: 900, letterSpacing: 1, ...(f >= aCross ? glow("rgba(88,166,255,0.35)", 18) : {}) }}>TEST CHÉO</div>
        </div>
        <div style={{ width: 330, padding: "24px 18px", borderRadius: 16, textAlign: "center", background: C.surface, border: `2px solid ${C.green}` }}>
          <div style={{ color: C.green, fontSize: 40, fontWeight: 900, fontFamily: MONO }}>wgpu</div>
          <div style={{ color: C.textSoft, fontSize: 25, fontWeight: 700, marginTop: 6 }}>GPU CANVAS</div>
        </div>
      </div>
      {/* 1.700+ tests */}
      <div style={{ position: "absolute", top: 700, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, a17, 10), ...(f >= a17 ? glow("rgba(88,166,255,0.2)", 20) : {}) }}>
        <span style={{ color: C.blue, fontSize: 96, fontWeight: 900, fontFamily: FONT }}>
          <CountUp at={a17} to={1700} frames={40} /><span style={{ fontSize: 60 }}>+</span> <span style={{ fontSize: 60 }}>TESTS</span>
        </span>
        <div style={{ color: C.muted, fontSize: 27, fontWeight: 700, marginTop: 8, fontFamily: MONO }}>PSD round trips · compositor oracles · multi-depth</div>
      </div>
      {/* 256² tile grid + copy-on-write + undo */}
      <div style={{ position: "absolute", top: 906, left: SAFE.x, right: SAFE.x, display: "flex", alignItems: "center", justifyContent: "center", gap: 26 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 40px)", gridAutoRows: "40px", gap: 5 }}>
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} style={{
              borderRadius: 5, border: `1.5px solid ${i === 10 && f >= aUndo ? C.green : C.border}`,
              background: i < tileCount ? (i === 10 ? "rgba(63,185,80,0.75)" : "rgba(88,166,255,0.22)") : "rgba(139,148,158,0.06)",
              opacity: i < tileCount ? 1 : 0.5,
              boxShadow: i === 10 && f >= aUndo ? "0 0 16px rgba(63,185,80,0.6)" : "none",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
          <div style={{ color: C.text, fontSize: 31, fontWeight: 800, opacity: lit(f, a256, 8) }}>
            <span style={{ color: C.blue, fontFamily: MONO }}>256²</span> TILES · COPY-ON-WRITE
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: lit(f, aUndo, 8) }}>
            <span style={{ color: C.green, fontSize: 44, fontWeight: 900 }}>⟲</span>
            <span style={{ color: C.green, fontSize: 31, fontWeight: 900 }}>UNDO RẺ</span>
          </div>
          <div style={{ color: C.textSoft, fontSize: 27, fontWeight: 700, opacity: lit(f, aCanvas, 8) }}>CANVAS KHỔNG LỒ NHẸ</div>
        </div>
      </div>
      {/* WASM pipeline chip */}
      <div style={{ position: "absolute", top: 1150, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", opacity: lit(f, aWasm, 10), transform: `translateY(${interpolate(f - aWasm, [0, 12], [24, 0], clamp)}px)` }}>
        <Chip color={C.green} fill={C.greenFill} style={{ fontSize: 30, fontWeight: 800, gap: 14, ...(f >= aWasm ? glow("rgba(63,185,80,0.3)", 20) : {}) as React.CSSProperties }}>
          <svg width={36} height={36} viewBox="0 0 36 36">
            <circle cx={18} cy={18} r={14} fill="none" stroke={C.green} strokeWidth={3} />
            <ellipse cx={18} cy={18} rx={6.5} ry={14} fill="none" stroke={C.green} strokeWidth={2.4} />
            <path d="M 4 18 H 32 M 6.5 10 H 29.5 M 6.5 26 H 29.5" stroke={C.green} strokeWidth={2.4} />
          </svg>
          ENGINE + UI → WebAssembly → TRÌNH DUYỆT
        </Chip>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S07 — AUTOMATION: root diagram 500+ → UI/CLI/MCP + robot caption + terminal
// ---------------------------------------------------------------------------
const S07: React.FC = () => {
  const f = useCurrentFrame();
  const a500 = frameOf("s07", "hơn năm trăm lệnh");
  const aUI = frameOf("s07", "giao diện");
  const aCLI = frameOf("s07", "dòng lệnh");
  const aMCP = frameOf("s07", "máy chủ Em-xi-pi");
  const aSame = frameOf("s07", "gọi cùng một nguồn");
  const aRobot = frameOf("s07", "a-gent ây-ai");
  const aTerm = frameOf("s07", "không cần mở cửa sổ");
  const aFolder = frameOf("s07", "cả thư mục ảnh");
  const TERM = "$ photocraft-cli --headless";
  const typed = Math.floor(interpolate(f, [aTerm, aTerm + 54], [0, TERM.length], clamp));
  const caret = f % 30 < 15 ? 1 : 0.15;
  const roots = [
    { t: "UI", at: aUI, x: 130 }, { t: "CLI", at: aCLI, x: 400 }, { t: "MCP SERVER", at: aMCP, x: 670 },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* root diagram */}
      <div style={{ position: "absolute", top: 400, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", opacity: lit(f, a500, 10) }}>
        <div style={{
          border: `2.5px solid ${C.blue}`, background: C.blueFill, borderRadius: 18, padding: "18px 40px",
          ...(f >= aSame ? glow("rgba(88,166,255,0.45)", 30) : glow("rgba(88,166,255,0.18)", 16)),
        }}>
          <span style={{ color: C.blue, fontSize: 74, fontWeight: 900, fontFamily: FONT }}>
            <CountUp at={a500} to={500} frames={34} /><span style={{ fontSize: 46 }}>+</span> <span style={{ fontSize: 46 }}>COMMANDS</span>
          </span>
        </div>
      </div>
      <svg width={920} height={190} viewBox="0 0 920 190" style={{ position: "absolute", left: SAFE.x, top: 560 }}>
        {roots.map((r) => {
          const on = f >= r.at;
          const hot = f >= aSame;
          return (
            <g key={r.t}>
              <line x1={460} y1={0} x2={r.x + 90} y2={120} stroke={on ? (hot ? C.blue : C.border) : C.border} strokeWidth={hot && on ? 5 : 3} opacity={on ? 1 : 0.4} />
              <rect x={r.x} y={120} width={180} height={62} rx={14} fill={on ? C.blueFill : C.surface} stroke={on ? C.blue : C.border} strokeWidth={2.5} opacity={on ? 1 : 0.45} />
              <text x={r.x + 90} y={158} textAnchor="middle" fill={on ? C.blue : C.muted} fontSize={27} fontWeight={800} fontFamily={FONT}>{r.t}</text>
            </g>
          );
        })}
      </svg>
      {/* robot + AUTOMATION caption */}
      <div style={{ position: "absolute", top: 772, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", gap: 18, alignItems: "center", opacity: lit(f, aRobot, 10) }}>
        <svg width={62} height={62} viewBox="0 0 62 62">
          <line x1={31} y1={4} x2={31} y2={14} stroke={C.amber} strokeWidth={3} />
          <circle cx={31} cy={4} r={3.5} fill={C.amber} />
          <rect x={12} y={14} width={38} height={32} rx={9} fill="none" stroke={C.amber} strokeWidth={3.5} />
          <circle cx={24} cy={28} r={4.5} fill={C.amber} />
          <circle cx={38} cy={28} r={4.5} fill={C.amber} />
          <path d="M 24 38 Q 31 43 38 38" fill="none" stroke={C.amber} strokeWidth={3} strokeLinecap="round" />
        </svg>
        <div style={{ border: `2.5px solid ${C.amber}`, background: C.amberFill, color: C.amber, borderRadius: 14, padding: "14px 24px", fontSize: 29, fontWeight: 900, letterSpacing: 0.5, ...(f >= aRobot ? glow("rgba(210,153,34,0.35)", 22) : {}) }}>
          AUTOMATION — AI GỌI LỆNH CÓ THẬT, KHÔNG TỰ VẼ ẢNH
        </div>
      </div>
      {/* terminal card */}
      <div style={{ position: "absolute", top: 942, left: SAFE.x, right: SAFE.x, opacity: lit(f, aTerm, 8), ...(f >= aTerm ? glow("rgba(63,185,80,0.16)", 24) : {}) }}>
        <div style={{ background: C.bgDeep, border: `1.5px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 20px", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
            {["#F85149", "#D29922", "#3FB950"].map((c) => (
              <span key={c} style={{ width: 15, height: 15, borderRadius: 8, background: c, display: "inline-block" }} />
            ))}
            <span style={{ color: C.muted, fontFamily: MONO, fontSize: 23, marginLeft: 10 }}>headless</span>
          </div>
          <div style={{ padding: "38px 32px", fontFamily: MONO, fontSize: 42, fontWeight: 600, lineHeight: 1.5, minHeight: 200 }}>
            <div>
              <span style={{ color: C.green }}>$ </span>
              <span style={{ color: C.text }}>{TERM.slice(0, typed)}</span>
              <span style={{ display: "inline-block", width: 21, height: 44, background: C.green, verticalAlign: "text-bottom", opacity: caret }} />
            </div>
            <div style={{ color: C.textSoft, fontSize: 32, marginTop: 14, opacity: lit(f, aFolder, 8) }}>
              → áp chuỗi action lên cả thư mục ảnh
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S08 — TỐC ĐỘ: release timeline + star chart + 23 installers + ~2.000/ngày
// ---------------------------------------------------------------------------
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aV1 = frameOf("s08", "vê không chấm một chấm một");
  const aV2 = frameOf("s08", "vê không chấm ba chấm không");
  const a5 = frameOf("s08", "năm ngày");
  const a23 = frameOf("s08", "hai mươi ba");
  const a2k = frameOf("s08", "hai nghìn sao mỗi ngày");
  const aWm = frameOf("s08", "con số kênh tự tính");
  const bar = interpolate(f - a5, [0, 26], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* release timeline */}
      <div style={{ position: "absolute", top: 428, left: SAFE.x + 30, right: SAFE.x + 30, height: 200 }}>
        <div style={{ position: "absolute", top: 96, left: 0, right: 0, height: 6, background: C.border, borderRadius: 3 }} />
        <div style={{ position: "absolute", top: 96, left: 0, width: `${bar * 100}%`, height: 6, background: C.blue, borderRadius: 3, boxShadow: "0 0 16px rgba(88,166,255,0.5)" }} />
        {f >= a5 + 8 ? (
          <div style={{ position: "absolute", top: 40, left: `${bar * 100}%`, transform: "translateX(-50%)", opacity: lit(f, a5 + 8, 6) }}>
            <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 28, fontWeight: 900 }}>5 NGÀY</Chip>
          </div>
        ) : null}
        <div style={{ position: "absolute", top: 74, left: 0, ...slam(aV1, f, fps, 1.4) }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ width: 26, height: 26, borderRadius: 13, background: C.blue, border: `3px solid ${C.bg}`, boxShadow: `0 0 18px rgba(88,166,255,0.6)` }} />
            <span style={{ color: C.text, fontSize: 33, fontWeight: 900, fontFamily: MONO }}>v0.1.1</span>
            <span style={{ color: C.muted, fontSize: 26, fontWeight: 700, fontFamily: MONO }}>02/10</span>
          </div>
        </div>
        <div style={{ position: "absolute", top: 74, right: 0, ...slam(aV2, f, fps, 1.4) }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ width: 26, height: 26, borderRadius: 13, background: C.green, border: `3px solid ${C.bg}`, boxShadow: "0 0 18px rgba(63,185,80,0.6)" }} />
            <span style={{ color: C.text, fontSize: 33, fontWeight: 900, fontFamily: MONO }}>v0.3.0</span>
            <span style={{ color: C.muted, fontSize: 26, fontWeight: 700, fontFamily: MONO }}>07/10</span>
          </div>
        </div>
      </div>
      {/* star chart — closes the loop with the s01 hint */}
      <div style={{ position: "absolute", top: 668, left: SAFE.x, width: SAFE.w, height: 250, borderRadius: 18, overflow: "hidden", border: `1px solid ${C.border}`, background: C.surface, opacity: lit(f, aWm, 12) }}>
        <Img src={staticFile("gh6-20261007/star_history.svg")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      {/* 23 installers */}
      <div style={{ position: "absolute", top: 958, left: SAFE.x, right: SAFE.x, opacity: lit(f, a23, 8) }}>
        <Card style={{ padding: "18px 30px", display: "flex", alignItems: "center", gap: 22, ...(f >= a23 ? glow("rgba(88,166,255,0.2)", 16) : {}) }}>
          <span style={{ color: C.blue, fontSize: 64, fontWeight: 900, lineHeight: 1 }}><CountUp at={a23} to={23} frames={24} /></span>
          <span style={{ color: C.text, fontSize: 34, fontWeight: 800 }}>INSTALLERS</span>
          <span style={{ color: C.muted, fontSize: 26, fontWeight: 700, fontFamily: MONO, flex: 1, textAlign: "right" }}>macOS / Windows / Linux / web</span>
        </Card>
      </div>
      {/* ~2.000 SAO/NGÀY + channel watermark */}
      <div style={{ position: "absolute", top: 1094, left: SAFE.x, right: SAFE.x, opacity: lit(f, a2k, 10) }}>
        <Card style={{ padding: "26px 34px", position: "relative", ...(f >= a2k ? glow("rgba(210,153,34,0.25)", 20) : {}) }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, justifyContent: "center" }}>
            <span style={{ color: C.amber, fontSize: 84, fontWeight: 900, lineHeight: 1 }}>~<CountUp at={a2k} to={2000} frames={36} /></span>
            <span style={{ color: C.text, fontSize: 44, fontWeight: 900 }}>SAO/NGÀY</span>
          </div>
          <div style={{
            position: "absolute", top: "38%", left: 0, right: 0, textAlign: "center", pointerEvents: "none",
            opacity: 0.92 * lit(f, aWm, 8), transform: "rotate(-5deg)",
          }}>
            <span style={{
              display: "inline-block", border: `3px solid ${C.amber}`, color: C.amber,
              padding: "8px 24px", borderRadius: 12, fontSize: 32, fontWeight: 900, letterSpacing: 1,
              background: "rgba(1,4,9,0.55)", boxShadow: "0 0 24px rgba(210,153,34,0.3)",
            }}>TÍNH TOÁN CỦA KÊNH — 14.095 ÷ 7 NGÀY · TÍNH ĐẾN 07/10</span>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S09 — ĐIỀU README KHÔNG KHOE: red banner + 3 caveat cards + conclusion
// ---------------------------------------------------------------------------
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aBanner = frameOf("s09", "Điều Rít-mi không khoe");
  const aAlpha = frameOf("s09", "early an-pha");
  const aT1 = frameOf("s09", "không liên kết");
  const aT2 = frameOf("s09", "không tài trợ");
  const aT3 = frameOf("s09", "không xác nhận từ A-đô-bi");
  const aC3 = frameOf("s09", "chưa mô hình hóa hết");
  const aCarry = frameOf("s09", "giữ nguyên chứ không bỏ");
  const aByte = frameOf("s09", "không giữ nguyên từng byte");
  const aDone = frameOf("s09", "hoàn chỉnh");
  const shrunk = f >= aDone;
  const cardShrink: React.CSSProperties = shrunk
    ? { transform: `scale(${interpolate(f - aDone, [0, 12], [1, 0.88], clamp)})`, opacity: interpolate(f - aDone, [0, 12], [1, 0.45], clamp) }
    : {};
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* red banner — the s01 promise closes here */}
      <div style={{ position: "absolute", top: 366, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", ...slam(aBanner, f, fps, 1.3) }}>
        <div style={{
          background: C.redFill, border: `2.5px solid ${C.red}`, color: C.red,
          borderRadius: 14, padding: "14px 36px", fontSize: 44, fontWeight: 900, letterSpacing: 3,
          ...(f >= aBanner ? glow("rgba(248,81,73,0.4)", 26) : {}),
        }}>ĐIỀU README KHÔNG KHOE</div>
      </div>
      {/* card 1 — early alpha (verbatim badge) */}
      <div style={{ position: "absolute", top: 496, left: SAFE.x, right: SAFE.x, opacity: lit(f, aAlpha, 10), ...cardShrink, transformOrigin: "top center" }}>
        <Card style={{ padding: "22px 30px", border: `2px solid ${C.amber}`, display: "flex", alignItems: "center", gap: 22 }}>
          <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: C.amber, background: "rgba(210,153,34,0.12)", border: `1.5px solid ${C.amber}`, borderRadius: 8, padding: "8px 16px" }}>status: early alpha</span>
          <span style={{ color: C.textSoft, fontSize: 32, fontWeight: 800 }}>VẪN ĐANG PHÁT TRIỂN SỚM</span>
        </Card>
      </div>
      {/* card 2 — independence from Adobe + verbatim EN quote */}
      <div style={{ position: "absolute", top: 668, left: SAFE.x, right: SAFE.x, opacity: lit(f, aT1, 10), ...cardShrink, transformOrigin: "top center" }}>
        <Card style={{ padding: "20px 30px", border: `2px solid ${C.red}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <span style={{ color: C.red, fontSize: 34, fontWeight: 900 }}>ĐỘC LẬP</span>
            {[
              { t: "không liên kết", at: aT1 }, { t: "không tài trợ", at: aT2 }, { t: "không xác nhận", at: aT3 },
            ].map((t) => (
              <span key={t.t} style={{
                border: `1.5px solid ${f >= t.at ? C.red : C.border}`, color: f >= t.at ? C.red : C.muted,
                background: f >= t.at ? C.redFill : "transparent", borderRadius: 9, padding: "6px 13px",
                fontSize: 25, fontWeight: 800, opacity: f >= t.at ? 1 : 0.45,
              }}>{t.t}</span>
            ))}
          </div>
          <div style={{ color: C.muted, fontSize: 24, fontWeight: 600, fontStyle: "italic", opacity: lit(f, aT3 + 4, 10), fontFamily: MONO }}>
            "not affiliated with, sponsored by or endorsed by Adobe"
          </div>
        </Card>
      </div>
      {/* card 3 — carry-over + not byte-identical */}
      <div style={{ position: "absolute", top: 856, left: SAFE.x, right: SAFE.x, opacity: lit(f, aC3, 10), ...cardShrink, transformOrigin: "top center" }}>
        <Card style={{ padding: "20px 30px" }}>
          <div style={{ color: C.text, fontSize: 32, fontWeight: 800 }}>PSD PHỨC TẠP — CHƯA MODEL HẾT</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12 }}>
            <span style={{ color: C.green, fontSize: 34, fontWeight: 900, opacity: lit(f, aCarry, 6) }}>→</span>
            <span style={{ color: C.green, fontSize: 29, fontWeight: 800, opacity: lit(f, aCarry, 6) }}>CARRY-OVER: GIỮ NGUYÊN, KHÔNG DROP</span>
          </div>
          <div style={{ position: "relative", display: "inline-block", marginTop: 12, opacity: lit(f, aByte, 6) }}>
            <span style={{ color: C.red, fontSize: 31, fontWeight: 900 }}>FILE LƯU LẠI ≠ BYTE-IDENTICAL</span>
            <div style={{ position: "absolute", left: -6, right: -6, bottom: -6, height: 5, background: C.red, borderRadius: 3, transformOrigin: "left", transform: `scaleX(${interpolate(f - aByte, [0, 10], [0, 1], clamp)})` }} />
          </div>
        </Card>
      </div>
      {/* conclusion */}
      <div style={{
        position: "absolute", top: 1122, left: SAFE.x, right: SAFE.x, textAlign: "center",
        opacity: lit(f, aDone, 12), transform: `translateY(${interpolate(f - aDone, [0, 12], [26, 0], clamp)}px)`,
      }}>
        <span style={{ color: C.text, fontSize: 52, fontWeight: 900, letterSpacing: 1, textShadow: "0 0 36px rgba(230,237,243,0.25)" }}>CHƯA PHẢI BẢN THAY PHOTOSHOP HOÀN CHỈNH</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S10 — OUTRO: soft CTA question + license/repo/browser chips + comment box
// ---------------------------------------------------------------------------
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aQ = frameOf("s10", "bạn sẽ thử");
  const aLic = frameOf("s10", "theo giấy phép");
  const aRepo = frameOf("s10", "Ri-po ở chip dưới màn hình");
  const aSnap = frameOf("s10", "ảnh chụp");
  const aCmt = frameOf("s10", "kể mình nghe nhé");
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #0D1117 0%, #161B22 100%)" }} />
      {/* big question */}
      <div style={{ position: "absolute", top: 512, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <div style={{ color: C.text, fontSize: 96, fontWeight: 900, lineHeight: 1.1, letterSpacing: 1, ...slam(aQ, f, fps, 1.5), ...(f >= aQ ? { textShadow: "0 0 44px rgba(88,166,255,0.4)" } : {}) }}>
          BẠN SẼ THỬ<br />THAY PHOTOSHOP?
        </div>
      </div>
      {/* license chip */}
      <div style={{ position: "absolute", top: 856, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", opacity: lit(f, aLic, 10), transform: `translateY(${interpolate(f - aLic, [0, 10], [20, 0], clamp)}px)` }}>
        <Chip color={C.amber} fill={C.amberFill} style={{ fontSize: 30, fontWeight: 800 }}>MIỄN PHÍ · THEO GIẤY PHÉP MIT/APACHE-2.0</Chip>
      </div>
      {/* repo chip + browser chip */}
      <div style={{ position: "absolute", top: 972, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: lit(f, aRepo, 10) }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 14, background: "rgba(88,166,255,0.10)",
          border: `1.5px solid ${C.blue}`, borderRadius: 999, padding: "12px 30px",
          color: C.blue, fontFamily: MONO, fontSize: 32, fontWeight: 600,
          transform: `translateX(${interpolate(f - aRepo, [0, 12], [-60, 0], clamp)}px)`,
        }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: C.blue, display: "inline-block" }} />
          github.com/storytold/photocraft
        </div>
        <div style={{ opacity: lit(f, aRepo + 8, 8), transform: `translateY(${interpolate(f - aRepo - 8, [0, 10], [18, 0], clamp)}px)` }}>
          <Chip color={C.green} fill={C.greenFill} style={{ fontSize: 29, fontWeight: 900, ...(f >= aRepo + 8 ? glow("rgba(63,185,80,0.28)", 18) : {}) as React.CSSProperties }}>THỬ NGAY TRONG TRÌNH DUYỆT</Chip>
        </div>
      </div>
      {/* snapshot footer */}
      <div style={{ position: "absolute", top: 1172, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, aSnap, 10) }}>
        <span style={{ color: C.amber, fontSize: 28, fontWeight: 800, letterSpacing: 1, opacity: 0.92 }}>SỐ LIỆU: SNAPSHOT 07/10</span>
      </div>
      {/* comment invitation box */}
      <div style={{ position: "absolute", top: 1218, left: SAFE.x + 60, right: SAFE.x + 60, opacity: lit(f, aCmt, 10) }}>
        <div style={{
          border: `2px dashed ${C.border}`, borderRadius: 16, padding: "18px 24px",
          display: "flex", alignItems: "center", gap: 14, color: C.muted, fontSize: 30, fontWeight: 700,
          background: "rgba(255,255,255,0.02)",
        }}>
          <span style={{ display: "inline-flex" }}>
            <svg width={38} height={38} viewBox="0 0 38 38">
              <path d="M 6 8 Q 6 4 10 4 H 28 Q 32 4 32 8 V 22 Q 32 26 28 26 H 16 L 8 33 V 26 Q 6 26 6 22 Z" fill="none" stroke={C.blue} strokeWidth={3} strokeLinejoin="round" />
              <circle cx={14} cy={15} r={2.4} fill={C.blue} />
              <circle cx={19} cy={15} r={2.4} fill={C.blue} />
              <circle cx={24} cy={15} r={2.4} fill={C.blue} />
            </svg>
          </span>
          kể mình nghe nhé
          <span style={{ display: "inline-block", width: 18, height: 36, background: C.muted, opacity: f % 30 < 15 ? 0.9 : 0.15, verticalAlign: "middle" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Captions — canonical script text cues (57), burned at the bottom safe band
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
        background: "rgba(1,4,9,0.84)", border: "1px solid rgba(240,246,252,0.16)", borderRadius: 18,
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
  s08: S08, s09: S09, s10: S10,
};

const BGM_VOLUME = 0.16;
const BGM_FADE_IN = 30; // 1s
const BGM_FADE_OUT = 60; // 2s

export const Gh620261007: React.FC = () => (
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
    <Audio src={staticFile("gh6-20261007/narration_full.wav")} volume={1} />
    <Audio
      src={staticFile("gh6-20261007/bgm.mp3")}
      volume={(fr) =>
        BGM_VOLUME *
        Math.min(1, fr / BGM_FADE_IN) *
        Math.min(1, Math.max(0, (TOTAL_FRAMES - fr) / BGM_FADE_OUT))
      }
    />
  </AbsoluteFill>
);
