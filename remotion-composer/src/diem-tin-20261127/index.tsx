import React from "react";
import { Composition, registerRoot } from "remotion";
import { EpisodeDiemTin20261127, TOTAL_FRAMES } from "./Episode";

const EpisodeDiemTin20261127Root: React.FC = () => (
  <>
    <Composition
      id="diem-tin-20261127-DRAFT"
      component={EpisodeDiemTin20261127}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ showHud: true }}
    />
    <Composition
      id="diem-tin-20261127-FINAL"
      component={EpisodeDiemTin20261127}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ showHud: false }}
    />
  </>
);

registerRoot(EpisodeDiemTin20261127Root);
