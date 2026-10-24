// News daily 2026-10-23 — full episode (s01..s08), static camera, speech-locked
// reveals from scene_elements.json (via el() LOCAL frames). Chrome per scene:
// top-left kicker badge, bottom caption pill (canonical captions.json chunks),
// source line. Displays are whitelisted strings from scene_elements.json,
// rendered verbatim via elText(). Visual splits keep every character.
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

const Kicker: React.FC<{ scene: FullSceneId }> = ({ scene }) => (
  <div style={{ position: "absolute", left: 70, top: KICKER_TOP, zIndex: 5 }}>
    <Spoken at={el(scene, "badge").start_frame_local}>
      <div
        style={{
          ...kickerBase,
          border: `2px solid ${C.border}`,
          color: C.textSoft,
          background: C.surface,
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

/** Gold-bordered qualifier chip (s01 — most important caveat of this episode). */
const goldChip: React.CSSProperties = {
  border: `2px solid ${C.gold}`,
  color: C.gold,
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
    Nguồn: bản tin tổng hợp ngày 23/10/2026
  </div>
);

/** Verbatim stat row: `hot` substring rendered coral+large, rest smaller.
 *  Every character of the original display is preserved in order. */
const StatRow: React.FC<{
  text: string;
  hot: string;
  hotSize: number;
  restSize: number;
  gap?: number;
  style?: React.CSSProperties;
}> = ({ text, hot, hotSize, restSize, gap = 18, style }) => {
  const i = text.indexOf(hot);
  if (i < 0) return <div style={{ fontSize: restSize, ...style }}>{text}</div>;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        flexWrap: "wrap",
        columnGap: gap,
        rowGap: 8,
        ...style,
      }}
    >
      <span style={{ fontSize: restSize, fontWeight: 600 }}>{text.slice(0, i)}</span>
      <span style={{ fontSize: hotSize, fontWeight: 800, color: C.coral, lineHeight: 1.1 }}>
        {hot}
      </span>
      <span style={{ fontSize: restSize, fontWeight: 600 }}>{text.slice(i + hot.length)}</span>
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

// --- s02: vacant-land plot schematic (lot border + furrows + grass) -----------

const VacantLandSchematic: React.FC = () => (
  <svg
    width="860"
    height="700"
    viewBox="0 0 860 700"
    style={{ position: "absolute", left: 70, top: 250, zIndex: 1 }}
  >
    <g stroke="rgba(185, 196, 214, 0.25)" strokeWidth="3" fill="none">
      {/* surveyed lot (perspective quad) */}
      <path d="M 140 560 L 710 470 L 760 200 L 200 280 Z" />
      {/* surveyor pegs */}
      <line x1="140" y1="560" x2="140" y2="588" />
      <line x1="710" y1="470" x2="710" y2="498" />
      <line x1="760" y1="200" x2="760" y2="228" />
      <line x1="200" y1="280" x2="200" y2="308" />
      {/* inner furrow diagonals */}
      <path d="M 260 300 L 230 520" />
      <path d="M 380 284 L 350 516" />
      <path d="M 500 268 L 470 500" />
      <path d="M 620 246 L 590 486" />
      {/* overgrown grass tufts */}
      <path d="M 300 420 q 7 -16 14 0" />
      <path d="M 460 380 q 7 -16 14 0" />
      <path d="M 560 440 q 7 -16 14 0" />
      <path d="M 380 330 q 6 -13 12 0" />
      <path d="M 640 320 q 6 -13 12 0" />
      <path d="M 250 490 q 6 -13 12 0" />
    </g>
  </svg>
);

// --- s05: abstract airport terminal schematic ----------------------------------

const AirportSchematic: React.FC = () => (
  <svg
    width="860"
    height="700"
    viewBox="0 0 860 700"
    style={{ position: "absolute", left: 70, top: 250, zIndex: 1 }}
  >
    <g stroke="rgba(185, 196, 214, 0.25)" strokeWidth="3" fill="none">
      {/* terminal hall: long low arc-roof building */}
      <path d="M 90 470 L 90 400 Q 90 340 160 340 L 640 340 Q 700 340 700 400 L 700 470 Z" />
      {/* glass facade mullions */}
      <line x1="200" y1="340" x2="200" y2="470" />
      <line x1="310" y1="340" x2="310" y2="470" />
      <line x1="420" y1="340" x2="420" y2="470" />
      <line x1="530" y1="340" x2="530" y2="470" />
      {/* jet bridges */}
      <path d="M 240 470 L 240 520 L 300 520" />
      <path d="M 460 470 L 460 520 L 520 520" />
      {/* control tower */}
      <line x1="770" y1="470" x2="770" y2="240" />
      <path d="M 740 240 L 800 240 L 790 200 L 750 200 Z" />
      <line x1="750" y1="200" x2="790" y2="240" />
      {/* runway with centerline dashes */}
      <line x1="120" y1="600" x2="740" y2="600" />
      <line x1="160" y1="590" x2="220" y2="590" />
      <line x1="300" y1="590" x2="360" y2="590" />
      <line x1="440" y1="590" x2="500" y2="590" />
      <line x1="580" y1="590" x2="640" y2="590" />
      {/* climbing aircraft glyph */}
      <path d="M 620 180 L 700 180 L 720 160 L 700 158 L 660 150 L 640 158 L 600 162 Z" />
      <path d="M 655 158 L 640 130 L 660 132 L 678 152" />
    </g>
  </svg>
);

// --- scene bodies -------------------------------------------------------------

const S01Body: React.FC = () => (
  <div style={{ position: "absolute", left: 70, top: 340, width: 860, zIndex: 2 }}>
    <Spoken at={el("s01", "title").start_frame_local}>
      <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1 }}>
        {elText("s01", "title")}
      </div>
    </Spoken>
    <Spoken at={el("s01", "stat1").start_frame_local}>
      <StatRow
        text={elText("s01", "stat1")}
        hot="2 môn thi"
        hotSize={88}
        restSize={44}
        style={{ marginTop: 34 }}
      />
    </Spoken>
    <Spoken at={el("s01", "sub").start_frame_local}>
      <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.35, marginTop: 26, color: C.textSoft }}>
        {elText("s01", "sub")}
      </div>
    </Spoken>
    <Spoken at={el("s01", "chip1").start_frame_local}>
      <div style={{ ...chipBase, ...goldChip, fontSize: 40, marginTop: 34 }}>
        {elText("s01", "chip1")}
      </div>
    </Spoken>
  </div>
);

const statCard: React.CSSProperties = {
  padding: "24px 34px",
  borderRadius: 24,
  border: `2px solid ${C.border}`,
  background: C.surface,
  maxWidth: 860,
  boxSizing: "border-box",
};

const S02Body: React.FC = () => (
  <>
    <VacantLandSchematic />
    <SchematicLabel />
    <div style={{ position: "absolute", left: 70, top: 300, width: 860, zIndex: 2 }}>
      <Spoken at={el("s02", "sub").start_frame_local}>
        <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.35, color: C.textSoft }}>
          {elText("s02", "sub")}
        </div>
      </Spoken>
      <Spoken at={el("s02", "title").start_frame_local}>
        <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.2, letterSpacing: -1, marginTop: 24 }}>
          {elText("s02", "title")}
        </div>
      </Spoken>
      <Spoken at={el("s02", "stat1").start_frame_local}>
        <div style={{ ...statCard, marginTop: 40 }}>
          <div style={{ fontSize: 110, fontWeight: 800, color: C.coral, lineHeight: 1.1 }}>
            0,2%
          </div>
          <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.3, marginTop: 10 }}>
            — {elText("s02", "stat1").split("0,2% — ")[1]}
          </div>
        </div>
      </Spoken>
      <Spoken at={el("s02", "chip1").start_frame_local}>
        <div style={{ ...chipBase, fontSize: 42, marginTop: 22 }}>{elText("s02", "chip1")}</div>
      </Spoken>
    </div>
  </>
);

const S03Body: React.FC = () => {
  const cards: { id: string; hot: string }[] = [
    { id: "stat1", hot: "10" },
    { id: "stat2", hot: "2" },
    { id: "stat3", hot: "3 tỷ" },
  ];
  return (
    <div style={{ position: "absolute", left: 70, top: 300, width: 860, zIndex: 2 }}>
      <Spoken at={el("s03", "title").start_frame_local}>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.2, letterSpacing: -1 }}>
          {elText("s03", "title")}
        </div>
      </Spoken>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 36, alignItems: "stretch" }}>
        {cards.map((cd, k) => (
          <Spoken key={cd.id} at={el("s03", cd.id).start_frame_local}>
            <div style={{ ...statCard, ...(k > 0 ? { marginTop: 0 } : {}) }}>
              <StatRow text={elText("s03", cd.id)} hot={cd.hot} hotSize={80} restSize={40} />
            </div>
          </Spoken>
        ))}
      </div>
    </div>
  );
};

const S04Body: React.FC = () => (
  <div style={{ position: "absolute", left: 70, top: 300, width: 860, zIndex: 2 }}>
    <Spoken at={el("s04", "title").start_frame_local}>
      <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1 }}>
        {elText("s04", "title")}
      </div>
    </Spoken>
    <Spoken at={el("s04", "sub").start_frame_local}>
      <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.35, marginTop: 26, color: C.textSoft }}>
        {elText("s04", "sub")}
      </div>
    </Spoken>
    <Spoken at={el("s04", "stat1").start_frame_local}>
      <div style={{ ...statCard, marginTop: 36 }}>
        <StatRow
          text={elText("s04", "stat1")}
          hot="32,2%"
          hotSize={88}
          restSize={40}
        />
      </div>
    </Spoken>
    <Spoken at={el("s04", "chip1").start_frame_local}>
      <div style={{ ...chipBase, fontSize: 42, marginTop: 24 }}>{elText("s04", "chip1")}</div>
    </Spoken>
  </div>
);

const S05Body: React.FC = () => (
  <>
    <AirportSchematic />
    <SchematicLabel />
    <div style={{ position: "absolute", left: 70, top: 300, width: 860, zIndex: 2 }}>
      <Spoken at={el("s05", "title").start_frame_local}>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.2, letterSpacing: -1 }}>
          {elText("s05", "title")}
        </div>
      </Spoken>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 36, alignItems: "flex-start" }}>
        <Spoken at={el("s05", "chip1").start_frame_local}>
          <div style={{ ...chipBase, fontSize: 42 }}>{elText("s05", "chip1")}</div>
        </Spoken>
        <Spoken at={el("s05", "chip2").start_frame_local}>
          <div style={{ ...chipBase, fontSize: 42 }}>{elText("s05", "chip2")}</div>
        </Spoken>
      </div>
    </div>
  </>
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

/** NHẬN ĐỊNH panel — badge persists whole scene (persist:"scene"), lines
 *  reveal at their anchors. No clamping: long lines wrap to 2 lines. */
const InsightPanel: React.FC<{ scene: FullSceneId }> = ({ scene }) => (
  <div style={panelStyle}>
    <Spoken at={el(scene, "badge").start_frame_local}>
      <div style={panelBadge}>{elText(scene, "badge")}</div>
    </Spoken>
    <Spoken at={el(scene, "line1").start_frame_local}>
      <div style={{ fontSize: 44, lineHeight: 1.35, fontWeight: 600 }}>
        {elText(scene, "line1")}
      </div>
    </Spoken>
    <Spoken at={el(scene, "line2").start_frame_local}>
      <div style={{ fontSize: 44, lineHeight: 1.35, fontWeight: 600 }}>
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
  s03: <Kicker scene="s03" />,
  s04: <Kicker scene="s04" />,
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
        <Audio src={staticFile(`news-daily-20261023/voice_${t.scene_id}.wav`)} />
        {hud && <Hud id={t.scene_id} />}
      </Sequence>
    ))}
  </AbsoluteFill>
);
