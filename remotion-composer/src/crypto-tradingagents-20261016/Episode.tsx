// Episode.tsx — crypto-tradingagents-20261016 root composition (VERTICAL 1080x1920).
// Sequences start at measured start_frame; scene components read useCurrentFrame()
// locally. Narration 0.89; BGM loop, envelope fade-in 30f / peak 0.12 / fade-out 90f.
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SCENE_TIMING, TOTAL_FRAMES } from "./timing";
import { C, FONT, FPS } from "./theme";
import { PUB } from "./common";
import { S01, S02, S03 } from "./scenes_a";
import { S04, S05, S06 } from "./scenes_b";
import { S07, S08, S09 } from "./scenes_c";

const SCENES: Record<string, React.FC> = {
  s01: S01, s02: S02, s03: S03,
  s04: S04, s05: S05, s06: S06,
  s07: S07, s08: S08, s09: S09,
};

const Bgm: React.FC = () => {
  const f = useCurrentFrame();
  const env = interpolate(
    f,
    [0, 30, TOTAL_FRAMES - 90, TOTAL_FRAMES],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <Audio loop src={staticFile(`${PUB}/bgm.mp3`)} volume={0.12 * env} />;
};

/** Technical HUD: 'S# fGLOBAL SEC s [LOCAL/DUR]' — bottom-left, y1790, font24. */
const Hud: React.FC = () => {
  const f = useCurrentFrame();
  let cur = SCENE_TIMING[0];
  for (const t of SCENE_TIMING) {
    if (f >= t.start_frame) cur = t;
  }
  const local = f - cur.start_frame;
  const label = `S${cur.scene_id.slice(1)} f${f} ${(f / FPS).toFixed(2)}s [${local}/${cur.scene_frames}]`;
  return (
    <div
      style={{
        position: "absolute",
        left: 24,
        top: 1790,
        fontFamily: FONT,
        fontSize: 24,
        color: "#FFFFFF",
        background: "rgba(0,0,0,0.72)",
        padding: "6px 14px",
        borderRadius: 8,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {label}
    </div>
  );
};

export const Episode: React.FC<{ debugHud?: boolean }> = ({ debugHud = false }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    {SCENE_TIMING.map((t, i) => {
      const Scene = SCENES[t.scene_id];
      const dur = i === SCENE_TIMING.length - 1 ? TOTAL_FRAMES - t.start_frame : t.scene_frames;
      return (
        <Sequence key={t.scene_id} from={t.start_frame} durationInFrames={dur}>
          <Scene />
        </Sequence>
      );
    })}
    <Audio src={staticFile(`${PUB}/narration_full.wav`)} volume={0.89} />
    <Bgm />
    {debugHud ? <Hud /> : null}
  </AbsoluteFill>
);
