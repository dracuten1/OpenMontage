import { staticFile } from "remotion";
import { KidsLayeredPerformer, type MouthCue } from "./KidsLayeredPerformer";
import cues from "../public/character-performer/kids/k_mouthcues_v2.json";

const mouthCues = (cues as any).mouthCues as MouthCue[];

export const KidsRabbitLayered: React.FC = () => (
  <KidsLayeredPerformer
    bgSrc={staticFile("character-performer/kids/k_bg_clean.png")}
    charFrames={[
      staticFile("character-performer/kids/sprites/k_v0.png"),
      staticFile("character-performer/kids/sprites/k_base.png"),
      staticFile("character-performer/kids/sprites/k_v2.png"),
      staticFile("character-performer/kids/sprites/k_v3.png"),
    ]}
    blinkSrc={staticFile("character-performer/kids/sprites/k_blink.png")}
    audioSrc={staticFile("character-performer/kids/k_narration_v2.wav")}
    bgmSrc={staticFile("character-performer/kids/k_bgm_v2.wav")}
    mouthCues={mouthCues}
    charX={0.5} charY={0.88} charH={0.66}
    title="Rùa và Thỏ 🐰🐢"
  />
);
