// entry.tsx — news-daily-20261016 compositions.
// News20261016 (hud off, the deliverable) + News20261016Debug (hud on, same component).
import React from "react";
import { Composition, registerRoot } from "remotion";
import { News20261016 } from "./Episode";
import { FPS, W, H } from "./theme";
import { TOTAL_FRAMES } from "./timing";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="News20261016"
      component={News20261016}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{ hud: false }}
    />
    <Composition
      id="News20261016Debug"
      component={News20261016}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{ hud: true }}
    />
  </>
);

registerRoot(RemotionRoot);
