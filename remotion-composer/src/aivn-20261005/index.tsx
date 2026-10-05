// aivn-20261005 -- "AI hai bờ đại dương" bespoke atelier composition (9 speech-locked scenes).
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { C } from "./theme";
import { SCENE_TIMING, TOTAL_FRAMES, normalizeSceneKey, type SceneId } from "./timing";
import S01 from "./scenes/S01";
import S02 from "./scenes/S02";
import S03 from "./scenes/S03";
import S04 from "./scenes/S04";
import S05 from "./scenes/S05";
import S06 from "./scenes/S06";
import S07 from "./scenes/S07";
import S08 from "./scenes/S08";
import S09 from "./scenes/S09";

export const AIVN_FPS = 30;
export const AIVN_TOTAL_FRAMES = TOTAL_FRAMES; // 2618 frames (87.29s @ 30fps)
export const AIVN_COMPOSITION_ID = "Aivn20261005Main";

const SCENES: Record<SceneId, React.FC> = {
  s01: S01,
  s02: S02,
  s03: S03,
  s04: S04,
  s05: S05,
  s06: S06,
  s07: S07,
  s08: S08,
  s09: S09,
};

const BGM_BASE_VOLUME = 0.14;
const BGM_FADE_IN_FRAMES = 30;
const BGM_FADE_OUT_FRAMES = 90;

export const Aivn20261005Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    {SCENE_TIMING.map((t) => {
      const normId = normalizeSceneKey(t.scene_id) as SceneId;
      const Scene = SCENES[normId];
      if (!Scene) return null;
      return (
        <Sequence
          key={t.scene_id}
          from={t.start_frame}
          durationInFrames={t.scene_frames}
          name={t.scene_id}
        >
          <Scene />
        </Sequence>
      );
    })}

    {/* Root speech-locked narration audio */}
    <Audio src={staticFile("aivn-20261005/narration_full.wav")} volume={1} />

    {/* Ambient background music with fade in/out */}
    <Audio
      src={staticFile("aivn-20261005/bgm.mp3")}
      loop
      loopVolumeCurveBehavior="extend"
      volume={(f) =>
        BGM_BASE_VOLUME *
        Math.min(1, f / BGM_FADE_IN_FRAMES) *
        Math.min(1, Math.max(0, (AIVN_TOTAL_FRAMES - f) / BGM_FADE_OUT_FRAMES))
      }
    />
  </AbsoluteFill>
);

export default Aivn20261005Main;
