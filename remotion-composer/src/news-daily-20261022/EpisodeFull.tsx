// News daily 2026-10-22 — full episode (s01..s08), static camera, speech-locked
// reveals from scene_elements.json (via el() LOCAL frames). Chrome per scene:
// top-left kicker badge, bottom caption pill (canonical captions.json chunks),
// source line. Displays are whitelisted strings from scene_elements.json,
// rendered verbatim via elText().
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, FONT_MONO } from "./theme";
import {
  SCENE_TIMING,
  EPISODE_TOTAL_FRAMES,
  FPS,
  getSceneTiming,
  el,
  elText,
  captionAt,
  Spoken,
  FullSceneId,
} from "./timing";

// --- shared chrome -----------------------------------------------------------

const KICKER_TOP = 120;

const kickerBase: React.CSSProperties = {
  display: "inline-block",
  padding: "14px 26px",
  borderRadius: 12,
  fontSize: 32,
  fontWeight: 800,
  letterSpacing: 2,
};

const Kicker: React.FC<{ scene: FullSceneId; coral?: boolean }> = ({ scene, coral = false }) => (
  <div style={{ position: "absolute", left: 70, top: KICKER_TOP, zIndex: 5 }}>
    <Spoken at={el(scene, "badge").start_frame_local}>
      <div
        style={{
          ...kickerBase,
          ...(coral
            ? { border: `3px dashed ${C.coral}`, color: C.coral, background: C.surfaceCoral }
            : { border: `2px solid ${C.border}`, color: C.textSoft, background: C.surface }),
        }}
      >
        {elText(scene, "badge")}
      </div>
    </Spoken>
  </div>
);

const chipBase: React.CSSProperties = {
  display: "inline-block",
  padding: "20px 28px",
  borderRadius: 18,
  border: `2px solid ${C.border}`,
  background: C.surface,
  fontSize: 44,
  fontWeight: 600,
  lineHeight: 1.3,
  maxWidth: 860,
  boxSizing: "border-box",
};

/** Canonical caption chunk at scene-local time, within the approved two-line box. */
const CaptionBox: React.FC<{ scene: FullSceneId }> = ({ scene }) => {
  const localSec = useCurrentFrame() / FPS;
  const chunk = captionAt(scene, localSec);
  const len = chunk ? chunk.chunk_text.length : 0;
  const fontSize = Math.max(28, Math.min(48, Math.floor(2843 / Math.max(40, len))));
  const long = len > 62; // smaller padding for long chunks
  return (
    <div style={{ position: "absolute", left: 70, top: 1240, width: 860, zIndex: 5 }}>
      <div
        style={{
          background: "rgba(15, 23, 42, 0.60)",
          border: `2px solid ${C.border}`,
          borderRadius: 20,
          padding: long ? "16px 28px" : "20px 30px",
          fontSize,
          lineHeight: 1.35,
          color: C.text,
          fontWeight: 600,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {chunk ? chunk.chunk_text : ""}
      </div>
    </div>
  );
};

const SourceLine: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 70,
      top: 1488,
      width: 860,
      fontSize: 30,
      color: C.textSoft,
      zIndex: 5,
    }}
  >
    Nguồn: bản tin tổng hợp ngày 22/10/2026
  </div>
);

/** Verbatim text with one highlighted (coral) substring. */
const Hot: React.FC<{ text: string; hot: string; style?: React.CSSProperties }> = ({
  text,
  hot,
  style,
}) => {
  const i = text.indexOf(hot);
  if (i < 0) return <div style={style}>{text}</div>;
  return (
    <div style={style}>
      {text.slice(0, i)}
      <span style={{ color: C.coral }}>{hot}</span>
      {text.slice(i + hot.length)}
    </div>
  );
};

const SchematicLabel: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 70,
      top: 262,
      width: 860,
      textAlign: "right",
      fontSize: 24,
      letterSpacing: 3,
      color: "rgba(185, 196, 214, 0.55)",
      zIndex: 2,
    }}
  >
    MINH HỌA
  </div>
);

// --- s01: abstract typhoon spiral (line art, 25% stroke) behind title zone ----

const TyphoonSchematic: React.FC = () => (
  <svg
    width="860"
    height="760"
    viewBox="0 0 860 760"
    style={{ position: "absolute", left: 70, top: 240, zIndex: 1 }}
  >
    <g stroke="rgba(185, 196, 214, 0.25)" strokeWidth="3" fill="none">
      {/* expanding counterclockwise spiral (two-center arcs) */}
      <path d="M 500 380 A 70 70 0 0 0 360 380" />
      <path d="M 360 380 A 100 100 0 0 0 560 380" />
      <path d="M 560 380 A 140 140 0 0 0 280 380" />
      <path d="M 280 380 A 190 190 0 0 0 660 380" />
      {/* storm eye */}
      <circle cx="430" cy="380" r="14" />
      {/* outflow tail curving northeast */}
      <path d="M 655 350 C 720 280 790 240 830 200" />
      <path d="M 700 430 C 760 420 800 390 840 350" />
      {/* crosshair ticks */}
      <line x1="430" y1="330" x2="430" y2="300" />
      <line x1="430" y1="430" x2="430" y2="460" />
      <line x1="380" y1="380" x2="350" y2="380" />
      <line x1="480" y1="380" x2="510" y2="380" />
    </g>
  </svg>
);

// --- s03: strait schematic (two landmasses + channel + ship glyphs) ----------

const StraitSchematic: React.FC = () => (
  <svg
    width="860"
    height="700"
    viewBox="0 0 860 700"
    style={{ position: "absolute", left: 70, top: 230, zIndex: 1 }}
  >
    <g stroke="rgba(185, 196, 214, 0.25)" strokeWidth="3" fill="none">
      {/* left landmass */}
      <path d="M 60 210 L 250 140 L 340 250 L 310 420 L 170 490 L 40 390 Z" />
      {/* right landmass */}
      <path d="M 560 150 L 800 110 L 840 310 L 750 500 L 590 430 L 530 260 Z" />
      {/* water channel waves */}
      <path d="M 370 250 q 30 -12 60 0 q 30 12 60 0" />
      <path d="M 380 420 q 30 -12 60 0 q 30 12 60 0" />
      <path d="M 390 510 q 30 -12 60 0 q 30 12 60 0" />
      {/* ship glyph 1 */}
      <path d="M 400 310 L 452 310 L 440 332 L 412 332 Z" />
      <line x1="426" y1="310" x2="426" y2="288" />
      <line x1="426" y1="288" x2="444" y2="296" />
      {/* ship glyph 2 */}
      <path d="M 430 380 L 482 380 L 470 402 L 442 402 Z" />
      <line x1="456" y1="380" x2="456" y2="358" />
      {/* ship glyph 3 */}
      <path d="M 392 460 L 444 460 L 432 482 L 404 482 Z" />
      <line x1="418" y1="460" x2="418" y2="438" />
    </g>
  </svg>
);

// --- scene bodies -------------------------------------------------------------

const S01Body: React.FC = () => (
  <>
    <TyphoonSchematic />
    <SchematicLabel />
    <div style={{ position: "absolute", left: 70, top: 340, width: 860, zIndex: 2 }}>
      <Spoken at={el("s01", "title").start_frame_local}>
        <div style={{ fontSize: 110, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>
          {elText("s01", "title")}
        </div>
      </Spoken>
      <Spoken at={el("s01", "sub").start_frame_local}>
        <div style={{ fontSize: 54, fontWeight: 600, lineHeight: 1.35, marginTop: 30 }}>
          {elText("s01", "sub")}
        </div>
      </Spoken>
      <Spoken at={el("s01", "stat1").start_frame_local}>
        <div style={{ marginTop: 40 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
            <span style={{ fontSize: 44, fontWeight: 600, color: C.textSoft }}>Gió</span>
            <span style={{ fontSize: 96, fontWeight: 800, color: C.coral, lineHeight: 1.1 }}>
              210 km/h
            </span>
          </div>
          <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.3, marginTop: 10, color: C.textSoft }}>
            — {elText("s01", "stat1").split(" — ")[1]}
          </div>
        </div>
      </Spoken>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 30, alignItems: "flex-start" }}>
        <Spoken at={el("s01", "chip1").start_frame_local}>
          <div style={{ ...chipBase, fontSize: 38 }}>{elText("s01", "chip1")}</div>
        </Spoken>
        <Spoken at={el("s01", "chip2").start_frame_local}>
          <div style={{ ...chipBase, fontSize: 38 }}>{elText("s01", "chip2")}</div>
        </Spoken>
      </div>
      <Spoken at={el("s01", "stat2").start_frame_local}>
        <div
          style={{
            marginTop: 22,
            padding: "18px 30px",
            borderRadius: 24,
            border: `2px solid ${C.border}`,
            background: C.surface,
            fontSize: 40,
            fontWeight: 600,
            lineHeight: 1.3,
            width: 860,
            boxSizing: "border-box",
          }}
        >
          {elText("s01", "stat2")}
        </div>
      </Spoken>
    </div>
  </>
);

const statCard: React.CSSProperties = {
  padding: "26px 34px",
  borderRadius: 24,
  border: `2px solid ${C.border}`,
  background: C.surface,
  maxWidth: 860,
  boxSizing: "border-box",
};

const S02Body: React.FC = () => (
  <div style={{ position: "absolute", left: 70, top: 300, width: 860, zIndex: 2 }}>
    <Spoken at={el("s02", "title").start_frame_local}>
      <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.2, letterSpacing: -1 }}>
        {elText("s02", "title")}
      </div>
    </Spoken>
    <Spoken at={el("s02", "sub").start_frame_local}>
      <div style={{ fontSize: 48, fontWeight: 600, lineHeight: 1.35, marginTop: 30, color: C.text }}>
        {elText("s02", "sub")}
      </div>
    </Spoken>
    <Spoken at={el("s02", "stat1").start_frame_local}>
      <div style={{ ...statCard, marginTop: 44 }}>
        <div style={{ fontSize: 88, fontWeight: 800, color: C.coral, lineHeight: 1.1 }}>Gần 100</div>
        <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.3, marginTop: 8 }}>
          {elText("s02", "stat1").replace("Gần 100 ", "")}
        </div>
      </div>
    </Spoken>
    <Spoken at={el("s02", "stat2").start_frame_local}>
      <div style={{ ...statCard, marginTop: 20 }}>
        <div style={{ fontSize: 88, fontWeight: 800, color: C.coral, lineHeight: 1.1 }}>Hơn 50.000</div>
        <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.3, marginTop: 8 }}>
          {elText("s02", "stat2").replace("Hơn 50.000 ", "")}
        </div>
      </div>
    </Spoken>
  </div>
);

const S03Body: React.FC = () => (
  <>
    <StraitSchematic />
    <SchematicLabel />
    <div style={{ position: "absolute", left: 70, top: 330, width: 860, zIndex: 2 }}>
      <Spoken at={el("s03", "title").start_frame_local}>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.2, letterSpacing: -1 }}>
          {elText("s03", "title")}
        </div>
      </Spoken>
      <Spoken at={el("s03", "sub").start_frame_local}>
        <div style={{ fontSize: 48, fontWeight: 600, lineHeight: 1.35, marginTop: 28 }}>
          {elText("s03", "sub")}
        </div>
      </Spoken>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 36, alignItems: "flex-start" }}>
        <Spoken at={el("s03", "chip1").start_frame_local}>
          <div style={{ ...chipBase, fontSize: 42 }}>{elText("s03", "chip1")}</div>
        </Spoken>
        <Spoken at={el("s03", "chip2").start_frame_local}>
          <div style={{ ...chipBase, fontSize: 42 }}>{elText("s03", "chip2")}</div>
        </Spoken>
      </div>
    </div>
  </>
);

const priceCard: React.CSSProperties = {
  padding: "22px 30px",
  borderRadius: 24,
  border: `2px solid ${C.border}`,
  background: C.surface,
  maxWidth: 860,
  boxSizing: "border-box",
};

const S04Body: React.FC = () => (
  <div style={{ position: "absolute", left: 70, top: 300, width: 860, zIndex: 2 }}>
    <Spoken at={el("s04", "title").start_frame_local}>
      <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.2, letterSpacing: -1 }}>
        {elText("s04", "title")}
      </div>
    </Spoken>
    <Spoken at={el("s04", "stat1").start_frame_local}>
      <div style={{ ...priceCard, marginTop: 46 }}>
        <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.3, color: C.textSoft }}>
          {elText("s04", "stat1").split(" 25.213 ")[0]}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 10 }}>
          <span style={{ fontSize: 84, fontWeight: 800, color: C.coral, lineHeight: 1.1 }}>25.213</span>
          <span style={{ fontSize: 40, fontWeight: 600 }}>đồng/lít</span>
        </div>
      </div>
    </Spoken>
    <Spoken at={el("s04", "stat2").start_frame_local}>
      <div style={{ ...priceCard, marginTop: 20 }}>
        <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.3, color: C.textSoft }}>
          {elText("s04", "stat2").split(" 444–1.238 ")[0]}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 10 }}>
          <span style={{ fontSize: 84, fontWeight: 800, color: C.coral, lineHeight: 1.1 }}>444–1.238</span>
          <span style={{ fontSize: 40, fontWeight: 600 }}>đồng/lít</span>
        </div>
      </div>
    </Spoken>
  </div>
);

const S05Body: React.FC = () => (
  <div style={{ position: "absolute", left: 70, top: 300, width: 860, zIndex: 2 }}>
    <Spoken at={el("s05", "title").start_frame_local}>
      <Hot
        text={elText("s05", "title")}
        hot="GẦN 2%"
        style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.2, letterSpacing: -1 }}
      />
    </Spoken>
    <Spoken at={el("s05", "chip1").start_frame_local}>
      <div style={{ ...chipBase, fontSize: 42, marginTop: 36 }}>{elText("s05", "chip1")}</div>
    </Spoken>
    <Spoken at={el("s05", "stat1").start_frame_local}>
      <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.35, marginTop: 44 }}>
        {elText("s05", "stat1")}
      </div>
    </Spoken>
    <Spoken at={el("s05", "stat2").start_frame_local}>
      <Hot
        text={elText("s05", "stat2")}
        hot="−7%"
        style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.35, marginTop: 22 }}
      />
    </Spoken>
  </div>
);

const panelStyle: React.CSSProperties = {
  position: "absolute",
  left: 70,
  top: 420,
  width: 860,
  boxSizing: "border-box",
  padding: "46px 44px",
  background: C.surfaceCoral,
  borderLeft: `8px solid ${C.coral}`,
  borderRadius: 24,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 40,
  zIndex: 2,
};

const panelBadge: React.CSSProperties = {
  color: C.coral,
  fontSize: 54,
  fontWeight: 800,
  letterSpacing: 3,
};

/** NHẬN ĐỊNH panel — badge persists whole scene, lines reveal at anchors. */
const InsightPanel: React.FC<{ scene: FullSceneId }> = ({ scene }) => (
  <div style={panelStyle}>
    <Spoken at={el(scene, "badge").start_frame_local}>
      <div style={panelBadge}>{elText(scene, "badge")}</div>
    </Spoken>
    <Spoken at={el(scene, "line1").start_frame_local}>
      <div style={{ fontSize: 48, lineHeight: 1.35, fontWeight: 600 }}>
        {elText(scene, "line1")}
      </div>
    </Spoken>
    <Spoken at={el(scene, "line2").start_frame_local}>
      <div style={{ fontSize: 48, lineHeight: 1.35, fontWeight: 600 }}>
        {elText(scene, "line2")}
      </div>
    </Spoken>
  </div>
);

const S08Body: React.FC = () => (
  <div style={{ position: "absolute", left: 70, top: 680, width: 860, textAlign: "center", zIndex: 2 }}>
    <Spoken at={el("s08", "title").start_frame_local}>
      <div style={{ fontSize: 90, fontWeight: 800, lineHeight: 1.15 }}>{elText("s08", "title")}</div>
      <div style={{ width: 140, height: 5, background: C.gold, margin: "40px auto 0" }} />
    </Spoken>
    <Spoken at={el("s08", "chip").start_frame_local}>
      <div style={{ ...chipBase, fontSize: 38, marginTop: 64 }}>{elText("s08", "chip")}</div>
    </Spoken>
  </div>
);

const KickerFor: Record<FullSceneId, React.ReactNode> = {
  s01: <Kicker scene="s01" />,
  s02: <Kicker scene="s02" />,
  s03: <Kicker scene="s03" coral />,
  s04: <Kicker scene="s04" coral />, // "HIỆU LỰC TỪ 15H HÔM NAY"
  s05: <Kicker scene="s05" />,
  s06: null, // NHẬN ĐỊNH badge lives inside the panel (scene-persistent)
  s07: null,
  s08: null, // no badge element
};

const SceneBody: React.FC<{ id: FullSceneId }> = ({ id }) => {
  switch (id) {
    case "s01": return <S01Body />;
    case "s02": return <S02Body />;
    case "s03": return <S03Body />;
    case "s04": return <S04Body />;
    case "s05": return <S05Body />;
    case "s06": return <InsightPanel scene="s06" />;
    case "s07": return <InsightPanel scene="s07" />;
    case "s08": return <S08Body />;
  }
};

// --- HUD (debug only) ---------------------------------------------------------

const Hud: React.FC<{ id: FullSceneId }> = ({ id }) => {
  const local = useCurrentFrame();
  const t = getSceneTiming(id);
  const g = t.start_frame + local;
  return (
    <div
      style={{
        position: "absolute",
        left: 32,
        top: 1570,
        fontFamily: FONT_MONO,
        fontSize: 26,
        color: C.textSoft,
        background: "rgba(15, 23, 42, 0.55)",
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "8px 14px",
        zIndex: 50,
      }}
    >
      {`S${Number(id.slice(1))} f${g} ${(g / FPS).toFixed(1)}s [${local}/${t.scene_frames}]`}
    </div>
  );
};

// --- episode ------------------------------------------------------------------

export const NewsDailyFull: React.FC<{ hud?: boolean }> = ({ hud = false }) => (
  <AbsoluteFill style={{ background: C.bgDeep, fontFamily: FONT, color: C.text }}>
    {SCENE_TIMING.map((t) => (
      <Sequence key={t.scene_id} from={t.start_frame} durationInFrames={t.scene_frames}>
        {KickerFor[t.scene_id]}
        <SceneBody id={t.scene_id} />
        <CaptionBox scene={t.scene_id} />
        <SourceLine />
        <Audio src={staticFile(`news-daily-20261022/voice_${t.scene_id}.wav`)} />
        {hud && <Hud id={t.scene_id} />}
      </Sequence>
    ))}
  </AbsoluteFill>
);
