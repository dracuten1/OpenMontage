// Episode assembly for diem-tin-20261127 (12 scenes, Daily Digest)
import React from "react";
import captionsData from "../../public/diem-tin-20261127/captions.json";
import { EpisodeShell, EpisodeSceneConfig, SceneSfxCue } from "../core/EpisodeShell";
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
import { ASSET_BASE, FPS, SCENES, SCENE_ORDER, TOTAL_FRAMES, cueFrame } from "./timing";

export { TOTAL_FRAMES };

const SCENE_COMPONENTS: React.FC<{ showHud?: boolean }>[] = [
  S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12,
];

const SCENE_SFX: Record<string, SceneSfxCue[]> = {
  s01: [{ src: `${ASSET_BASE}/sfx/impact-cine.mp3`, delayFrames: 0, volume: 0.22 }],
  s02: [{ src: `${ASSET_BASE}/sfx/swoosh-quick.mp3`, delayFrames: 0, volume: 0.2 }],
  s03: [
    { src: `${ASSET_BASE}/sfx/transition-snap.mp3`, delayFrames: 0, volume: 0.2 },
    { src: `${ASSET_BASE}/sfx/pop.mp3`, delayFrames: cueFrame("s03", "14%", 231), volume: 0.22 },
  ],
  s04: [{ src: `${ASSET_BASE}/sfx/transition-soft.mp3`, delayFrames: 0, volume: 0.2 }],
  s05: [
    { src: `${ASSET_BASE}/sfx/swoosh-quick.mp3`, delayFrames: 0, volume: 0.2 },
    { src: `${ASSET_BASE}/sfx/pop.mp3`, delayFrames: cueFrame("s05", "2320", 305), volume: 0.22 },
  ],
  s06: [{ src: `${ASSET_BASE}/sfx/transition-snap.mp3`, delayFrames: 0, volume: 0.2 }],
  s07: [
    { src: `${ASSET_BASE}/sfx/impact-cine.mp3`, delayFrames: 0, volume: 0.22 },
    { src: `${ASSET_BASE}/sfx/pop.mp3`, delayFrames: cueFrame("s07", "vượt 1.500", 227), volume: 0.22 },
  ],
  s08: [{ src: `${ASSET_BASE}/sfx/transition-soft.mp3`, delayFrames: 0, volume: 0.2 }],
  s09: [
    { src: `${ASSET_BASE}/sfx/transition-snap.mp3`, delayFrames: 0, volume: 0.2 },
    { src: `${ASSET_BASE}/sfx/pop.mp3`, delayFrames: cueFrame("s09", "611", 370), volume: 0.22 },
  ],
  s10: [{ src: `${ASSET_BASE}/sfx/pop.mp3`, delayFrames: cueFrame("s10", "136", 82), volume: 0.22 }],
  s11: [
    { src: `${ASSET_BASE}/sfx/swoosh-quick.mp3`, delayFrames: 0, volume: 0.2 },
    { src: `${ASSET_BASE}/sfx/impact-cine.mp3`, delayFrames: cueFrame("s11", "nâng kỹ", 149), volume: 0.22 },
  ],
  s12: [{ src: `${ASSET_BASE}/sfx/transition-soft.mp3`, delayFrames: 0, volume: 0.2 }],
};

interface RawCaptionChunk {
  text?: string;
  chunk_text?: string;
  start: number;
  end: number;
}

const rawCaptionsMap: Record<string, RawCaptionChunk[]> =
  (captionsData as { captions?: Record<string, RawCaptionChunk[]> }).captions ?? {};

const EPISODE_SCENES: EpisodeSceneConfig[] = SCENE_ORDER.map((sceneId, idx) => {
  const t = SCENES[sceneId];
  return {
    scene_id: t.scene_id,
    sectionId: t.sectionId,
    start_frame: t.start_frame,
    duration_frames: t.duration_frames,
    start_seconds: t.start_seconds,
    component: SCENE_COMPONENTS[idx],
  };
});

export interface EpisodeDiemTin20261127Props {
  showHud?: boolean;
}

export const EpisodeDiemTin20261127: React.FC<EpisodeDiemTin20261127Props> = ({
  showHud = false,
}) => (
  <EpisodeShell
    scenes={EPISODE_SCENES}
    assetBase={ASSET_BASE}
    channel="ky-chu-diem-tin"
    captionsBySection={rawCaptionsMap}
    sfxCues={SCENE_SFX}
    showHud={showHud}
    includeBumper={true}
    bumperAspect="9x16"
    fps={FPS}
    inlineBgm={{
      src: `${ASSET_BASE}/bgm.mp3`,
      volumeDuringSpeech: 0.22,
      volumeOnOutro: 0.38,
      loop: false,
    }}
  />
);

export default EpisodeDiemTin20261127;
