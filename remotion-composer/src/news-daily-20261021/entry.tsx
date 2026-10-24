// Isolated entry for news-daily-20261021 — own registerRoot.
// Does NOT import shared Root.tsx (concurrent lanes stay isolated).
import React from "react";
import { registerRoot, Composition } from "remotion";
import { NewsDailyFull } from "./EpisodeFull";
import { FPS, EPISODE_TOTAL_FRAMES } from "./timing";

const NewsDaily20261021Root: React.FC = () => (
  <>
    <Composition
      id="NewsDaily20261021Full"
      component={NewsDailyFull}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={EPISODE_TOTAL_FRAMES} // 1466
      defaultProps={{ hud: false }}
    />
    <Composition
      id="NewsDaily20261021Debug"
      component={NewsDailyFull}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={EPISODE_TOTAL_FRAMES}
      defaultProps={{ hud: true }}
    />
  </>
);

registerRoot(NewsDaily20261021Root);
