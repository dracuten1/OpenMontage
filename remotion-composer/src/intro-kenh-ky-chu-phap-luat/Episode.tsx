import React from "react";
import captionsData from "../../public/intro-kenh-ky-chu-phap-luat/captions.json";
import { EpisodeShell, EpisodeSceneConfig, SceneSfxCue } from "../core/EpisodeShell";
import S01 from "./scenes/S01";
import S02 from "./scenes/S02";
import S03 from "./scenes/S03";
import S04 from "./scenes/S04";
import S05 from "./scenes/S05";
import S06 from "./scenes/S06";
import S07 from "./scenes/S07";
import { ASSET_BASE, FPS, SCENES, SCENE_ORDER, TOTAL_FRAMES } from "./timing";

export { TOTAL_FRAMES };

const SCENE_COMPONENTS: React.FC<{ showHud?: boolean }>[] = [
  S01,
  S02,
  S03,
  S04,
  S05,
  S06,
  S07,
];

const SCENE_SFX: Record<string, SceneSfxCue[]> = {
  s01: [{ src: `${ASSET_BASE}/sfx/click-camera.mp3`, delayFrames: 18, volume: 0.22 }],
  s02: [{ src: `${ASSET_BASE}/sfx/transition-snap.mp3`, delayFrames: 0, volume: 0.22 }],
  s03: [{ src: `${ASSET_BASE}/sfx/swoosh-quick.mp3`, delayFrames: 0, volume: 0.2 }],
  s04: [{ src: `${ASSET_BASE}/sfx/pop.mp3`, delayFrames: 10, volume: 0.2 }],
  s05: [{ src: `${ASSET_BASE}/sfx/transition-snap.mp3`, delayFrames: 0, volume: 0.22 }],
  s06: [{ src: `${ASSET_BASE}/sfx/impact-cine.mp3`, delayFrames: 195, volume: 0.24 }],
  s07: [{ src: `${ASSET_BASE}/sfx/click-camera.mp3`, delayFrames: 0, volume: 0.2 }],
};

interface RawCaptionChunk {
  text?: string;
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

export interface EpisodeIntroKenhKyChuPhapLuatProps {
  showHud?: boolean;
}

export const EpisodeIntroKenhKyChuPhapLuat: React.FC<EpisodeIntroKenhKyChuPhapLuatProps> = ({
  showHud = false,
}) => (
  <EpisodeShell
    scenes={EPISODE_SCENES}
    assetBase={ASSET_BASE}
    channel="ky-chu-phap-luat"
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

export default EpisodeIntroKenhKyChuPhapLuat;
