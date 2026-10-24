// News daily 2026-10-21 — full episode (s01..s08), static camera, speech-locked
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
  const long = chunk ? chunk.chunk_text.length > 62 : false;
  return (
    <div style={{ position: "absolute", left: 70, top: 1240, width: 860, zIndex: 5 }}>
      <div
        style={{
          background: "rgba(15, 23, 42, 0.60)",
          border: `2px solid ${C.border}`,
          borderRadius: 20,
          padding: long ? "18px 30px" : "20px 30px",
          fontSize: long ? 42 : 48,
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
      top: 1492,
      width: 860,
      fontSize: 30,
      color: C.textSoft,
      zIndex: 5,
    }}
  >
    Nguồn: bản tin tổng hợp ngày 21/10/2026
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

// --- s01: abstract schematic (lock + network nodes, line art, 25% stroke) ----

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

const Schematic: React.FC = () => (
  <svg
    width="860"
    height="760"
    viewBox="0 0 860 760"
    style={{ position: "absolute", left: 70, top: 250, zIndex: 1 }}
  >
    <g stroke="rgba(185, 196, 214, 0.25)" strokeWidth="3" fill="none">
      {/* network nodes (upper-left cluster) */}
      <line x1="120" y1="120" x2="320" y2="70" />
      <line x1="120" y1="120" x2="90" y2="300" />
      <line x1="320" y1="70" x2="250" y2="260" />
      <line x1="90" y1="300" x2="250" y2="260" />
      <line x1="250" y1="260" x2="430" y2="150" />
      <line x1="320" y1="70" x2="430" y2="150" />
      <circle cx="120" cy="120" r="16" />
      <circle cx="320" cy="70" r="12" />
      <circle cx="90" cy="300" r="12" />
      <circle cx="250" cy="260" r="16" />
      <circle cx="430" cy="150" r="12" />
      {/* connector to padlock zone */}
      <line x1="250" y1="276" x2="410" y2="430" />
      {/* padlock (right-mid, behind title zone) */}
      <rect x="380" y="450" width="170" height="132" rx="20" />
      <path d="M 410 450 V 386 A 55 55 0 0 1 520 386 V 450" />
      <circle cx="465" cy="505" r="16" />
      <line x1="465" y1="521" x2="465" y2="548" />
      {/* lower network echo */}
      <line x1="640" y1="620" x2="780" y2="560" />
      <line x1="640" y1="620" x2="720" y2="710" />
      <circle cx="640" cy="620" r="12" />
      <circle cx="780" cy="560" r="10" />
      <circle cx="720" cy="710" r="10" />
    </g>
  </svg>
);

// --- scene bodies -------------------------------------------------------------

const S01Body: React.FC = () => (
  <>
    <Schematic />
    <SchematicLabel />
    <div style={{ position: "absolute", left: 70, top: 430, width: 860, zIndex: 2 }}>
      <Spoken at={el("s01", "title").start_frame_local}>
        <Hot
          text={elText("s01", "title")}
          hot="84"
          style={{ fontSize: 120, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}
        />
      </Spoken>
      <Spoken at={el("s01", "sub").start_frame_local}>
        <div style={{ fontSize: 54, fontWeight: 600, lineHeight: 1.35, marginTop: 46, color: C.text }}>
          {elText("s01", "sub")}
        </div>
      </Spoken>
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 20, marginTop: 56 }}>
        <Spoken at={el("s01", "chip1").start_frame_local}>
          <div style={{ ...chipBase, fontSize: 38 }}>{elText("s01", "chip1")}</div>
        </Spoken>
        <Spoken at={el("s01", "chip2").start_frame_local}>
          <div style={{ ...chipBase, fontSize: 38 }}>{elText("s01", "chip2")}</div>
        </Spoken>
      </div>
    </div>
  </>
);

const S02Body: React.FC = () => (
  <div style={{ position: "absolute", left: 70, top: 480, width: 860, zIndex: 2 }}>
    <Spoken at={el("s02", "title").start_frame_local}>
      <div
        style={{
          fontSize: 92,
          fontWeight: 800,
          lineHeight: 1.2,
          width: "fit-content",
          borderBottom: `5px solid ${C.coral}`,
          paddingBottom: 20,
        }}
      >
        {elText("s02", "title")}
      </div>
    </Spoken>
    <Spoken at={el("s02", "chip").start_frame_local}>
      <div style={{ ...chipBase, borderStyle: "dashed", marginTop: 72 }}>
        {elText("s02", "chip")}
      </div>
    </Spoken>
  </div>
);

const S03Body: React.FC = () => (
  <div style={{ position: "absolute", left: 70, top: 330, width: 860, zIndex: 2 }}>
    <Spoken at={el("s03", "brand").start_frame_local}>
      <div style={{ fontSize: 110, fontWeight: 800, lineHeight: 1.15 }}>{elText("s03", "brand")}</div>
    </Spoken>
    <div style={{ display: "flex", flexDirection: "column", gap: 44, marginTop: 80 }}>
      <Spoken at={el("s03", "stat1").start_frame_local}>
        <Hot
          text={elText("s03", "stat1")}
          hot="2,5 lần"
          style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.35 }}
        />
      </Spoken>
      <Spoken at={el("s03", "stat2").start_frame_local}>
        <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.35, color: C.textSoft }}>
          {elText("s03", "stat2")}
        </div>
      </Spoken>
      <Spoken at={el("s03", "stat3").start_frame_local}>
        <Hot
          text={elText("s03", "stat3")}
          hot="1,1 tỷ USD"
          style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.35 }}
        />
      </Spoken>
    </div>
    <Spoken at={el("s03", "chip").start_frame_local}>
      <div style={{ ...chipBase, marginTop: 84 }}>{elText("s03", "chip")}</div>
    </Spoken>
  </div>
);

const brandCard: React.CSSProperties = {
  display: "inline-block",
  padding: "24px 34px",
  borderRadius: 20,
  border: `2px solid ${C.border}`,
  background: C.surface,
  fontSize: 64,
  fontWeight: 800,
};

const statChip: React.CSSProperties = {
  display: "inline-block",
  padding: "18px 28px",
  borderRadius: 16,
  border: `2px solid ${C.borderCoral}`,
  background: C.surfaceCoral,
  color: C.coral,
  fontSize: 46,
  fontWeight: 700,
};

const S04Body: React.FC = () => (
  <div style={{ position: "absolute", left: 70, top: 360, width: 860, zIndex: 2 }}>
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 24 }}>
      <Spoken at={el("s04", "brand").start_frame_local}>
        <div style={brandCard}>{elText("s04", "brand")}</div>
      </Spoken>
      <Spoken at={el("s04", "stat1").start_frame_local}>
        <div style={statChip}>{elText("s04", "stat1")}</div>
      </Spoken>
    </div>
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 24, marginTop: 56 }}>
      <Spoken at={el("s04", "brand2").start_frame_local}>
        <div style={brandCard}>{elText("s04", "brand2")}</div>
      </Spoken>
      <Spoken at={el("s04", "brand3").start_frame_local}>
        <div style={brandCard}>{elText("s04", "brand3")}</div>
      </Spoken>
    </div>
    <Spoken at={el("s04", "stat2").start_frame_local}>
      <div style={{ ...statChip, fontSize: 50, marginTop: 56 }}>{elText("s04", "stat2")}</div>
    </Spoken>
    <div style={{ marginTop: 96, textAlign: "center" }}>
      <Spoken at={el("s04", "badge").start_frame_local}>
        <div
          style={{
            display: "inline-block",
            padding: "20px 34px",
            borderRadius: 16,
            border: `3px dashed ${C.coral}`,
            background: C.surfaceCoral,
            color: C.coral,
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          {elText("s04", "badge")}
        </div>
      </Spoken>
    </div>
  </div>
);

const S05Body: React.FC = () => (
  <div style={{ position: "absolute", left: 70, top: 440, width: 860, zIndex: 2 }}>
    <Spoken at={el("s05", "title").start_frame_local}>
      <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.25 }}>
        {elText("s05", "title")}
      </div>
    </Spoken>
    <Spoken at={el("s05", "chip").start_frame_local}>
      <div style={{ ...chipBase, fontSize: 40, marginTop: 80 }}>{elText("s05", "chip")}</div>
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

const S06Body: React.FC = () => (
  <div style={panelStyle}>
    <Spoken at={el("s06", "badge").start_frame_local}>
      <div style={panelBadge}>{elText("s06", "badge")}</div>
    </Spoken>
    <Spoken at={el("s06", "text").start_frame_local}>
      <div style={{ fontSize: 48, lineHeight: 1.35, fontWeight: 600 }}>
        {elText("s06", "text")}
      </div>
    </Spoken>
  </div>
);

const S07Body: React.FC = () => (
  <div style={panelStyle}>
    <Spoken at={el("s07", "badge").start_frame_local}>
      <div style={panelBadge}>{elText("s07", "badge")}</div>
    </Spoken>
    <Spoken at={el("s07", "text1").start_frame_local}>
      <div style={{ fontSize: 48, lineHeight: 1.35, fontWeight: 600 }}>
        {elText("s07", "text1")}
      </div>
    </Spoken>
    <Spoken at={el("s07", "text2").start_frame_local}>
      <div style={{ fontSize: 48, lineHeight: 1.35, fontWeight: 600 }}>
        {elText("s07", "text2")}
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
  s04: null, // badge placed in-scene as bottom badge
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
    case "s06": return <S06Body />;
    case "s07": return <S07Body />;
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
        bottom: 32,
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
      {`S${Number(id.slice(1))} f${g} ${Math.floor(g / FPS)}s [${local}/${t.scene_frames}]`}
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
        <Audio src={staticFile(`news-daily-20261021/voice_${t.scene_id}.wav`)} />
        {hud && <Hud id={t.scene_id} />}
      </Sequence>
    ))}
  </AbsoluteFill>
);
