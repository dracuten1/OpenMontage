import React from "react";
import { Composition, registerRoot } from "remotion";
import { EpisodeIntroKenhKyChuPhapLuat, TOTAL_FRAMES } from "./Episode";

const EpisodeIntroKenhKyChuPhapLuatRoot: React.FC = () => (
  <>
    <Composition
      id="intro-kenh-ky-chu-phap-luat-DRAFT"
      component={EpisodeIntroKenhKyChuPhapLuat}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ showHud: true }}
    />
    <Composition
      id="intro-kenh-ky-chu-phap-luat-FINAL"
      component={EpisodeIntroKenhKyChuPhapLuat}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ showHud: false }}
    />
  </>
);

registerRoot(EpisodeIntroKenhKyChuPhapLuatRoot);
