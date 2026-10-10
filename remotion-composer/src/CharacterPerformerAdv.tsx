import { staticFile } from "remotion";
import { CharacterPerformer, type MouthCue } from "./CharacterPerformer";
import cues from "../public/character-performer/adv_mouthcues.json";

const mouthCues = (cues as any).mouthCues as MouthCue[];

export const CharacterPerformerAdv: React.FC = () => (
  <CharacterPerformer
    frameSrcs={[
      staticFile("character-performer/adv_scene.png"),      // 0 closed
      staticFile("character-performer/v_mouthD.png"),       // 1 slight
      staticFile("character-performer/v_mouthB.png"),       // 2 half
      staticFile("character-performer/v_mouthA.png"),       // 3 wide
    ]}
    eyesClosedSrc={staticFile("character-performer/v_eyes.png")}
    audioSrc={staticFile("character-performer/adv_narration.wav")}
    mouthCues={mouthCues}
    title="An Dương Vương & Nỏ Thần — demo character-performer"
  />
);
