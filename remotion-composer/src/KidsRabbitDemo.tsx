import { staticFile } from "remotion";
import { KidsCharacterPerformer, type MouthCue } from "./KidsCharacterPerformer";
import cues from "../public/character-performer/kids/k_mouthcues.json";

const mouthCues = (cues as any).mouthCues as MouthCue[];

export const KidsRabbitDemo: React.FC = () => (
  <KidsCharacterPerformer
    frameSrcs={[
      staticFile("character-performer/kids/k_v0.png"),    // 0 closed
      staticFile("character-performer/kids/k_base.png"),  // 1 smile-open (base)
      staticFile("character-performer/kids/k_v2.png"),    // 2 O-surprise
      staticFile("character-performer/kids/k_v3.png"),    // 3 laugh
    ]}
    blinkSrc={staticFile("character-performer/kids/k_blink.png")}
    audioSrc={staticFile("character-performer/kids/k_narration.wav")}
    bgmSrc={staticFile("character-performer/kids/k_bgm.wav")}
    mouthCues={mouthCues}
    title="Thỏ Trắng kể chuyện: Rùa và Thỏ 🐰"
  />
);
