// News 2026-10-04 -- "Bản tin tài chính thực chiến" (atelier composition, 14 speech-locked scenes).
// One composition: a <Sequence> per scene (from scene_timing.json) + root-level narration_full.wav and bgm.mp3.
// Scene audio is baked into narration_full.wav so scene i's WAV starts exactly at scene i's start_frame.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { C } from "./theme";
import { SCENE_TIMING, TOTAL_FRAMES, type SceneId } from "./timing";
import S01 from "./scenes/S01";
import S02 from "./scenes/S02";
import S03 from "./scenes/S03";
import S04 from "./scenes/S04";
import S05 from "./scenes/S05";
import S06 from "./scenes/S06";
import S07 from "./scenes/S07";
import S08 from "./scenes/S08";
import S09 from "./scenes/S09";
import S10 from "./scenes/S10";
import S11 from "./scenes/S11";
import S12 from "./scenes/S12";
import S13 from "./scenes/S13";
import S14 from "./scenes/S14";

export const NEWS_FPS = 30;
export const NEWS_TOTAL_FRAMES = TOTAL_FRAMES; // 3361
export const NEWS_COMPOSITION_ID = "News20261004";

const SCENES: Record<SceneId, React.FC> = {
  s01: S01, s02: S02, s03: S03, s04: S04, s05: S05, s06: S06, s07: S07,
  s08: S08, s09: S09, s10: S10, s11: S11, s12: S12, s13: S13, s14: S14,
};

const BGM_VOLUME = 0.13;
const BGM_FADE_IN = 30;
const BGM_FADE_OUT = 90;

export const News20261004: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    {SCENE_TIMING.map((t) => {
      const Scene = SCENES[t.scene_id];
      return (
        <Sequence key={t.scene_id} from={t.start_frame} durationInFrames={t.scene_frames} name={t.scene_id}>
          <Scene />
        </Sequence>
      );
    })}
    <Audio src={staticFile("news-20261004/narration_full.wav")} volume={1} />
    <Audio
      src={staticFile("news-20261004/bgm.mp3")}
      loop
      loopVolumeCurveBehavior="extend"
      volume={(f) =>
        BGM_VOLUME *
        Math.min(1, f / BGM_FADE_IN) *
        Math.min(1, Math.max(0, (NEWS_TOTAL_FRAMES - f) / BGM_FADE_OUT))
      }
    />
  </AbsoluteFill>
);
