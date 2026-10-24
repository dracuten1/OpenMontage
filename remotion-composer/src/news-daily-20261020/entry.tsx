// Isolated entry for news-daily-20261020 — own registerRoot.
// Does NOT import shared Root.tsx (crypto lane running concurrently).
import React from "react";
import { registerRoot, Composition } from "remotion";
import { NewsDailyEp } from "./NewsDailyEp";
import { TOTAL_FRAMES, FPS, EPISODE_TOTAL_FRAMES } from "./timing";
import { NewsDailyFull } from "./EpisodeFull";

const NewsDaily20261020Root: React.FC = () => (
  <>
  <Composition
    id="NewsDaily20261020Demo"
    component={NewsDailyEp}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={TOTAL_FRAMES} // 288
    defaultProps={{ draftHud: true }}
  />
  <Composition id="NewsDaily20261020Full" component={NewsDailyFull} width={1080} height={1920} fps={FPS} durationInFrames={EPISODE_TOTAL_FRAMES} defaultProps={{ hud: false }} />
  <Composition id="NewsDaily20261020FullDebug" component={NewsDailyFull} width={1080} height={1920} fps={FPS} durationInFrames={EPISODE_TOTAL_FRAMES} defaultProps={{ hud: true }} />
  </>
);

registerRoot(NewsDaily20261020Root);
