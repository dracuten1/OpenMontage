// entry.tsx — news-daily-20261017 compositions.
// News20261017 (hud off, the deliverable) + News20261017Debug (hud on, same component).
import React from "react";
import { Composition, registerRoot } from "remotion";
import { News20261017 } from "./Episode";
import { FPS, W, H } from "./theme";
import { TOTAL_FRAMES } from "./timing";

const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="News20261017"
      component={News20261017}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{ hud: false }}
    />
    <Composition
      id="News20261017Debug"
      component={News20261017}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{ hud: true }}
    />
  </>
);

registerRoot(RemotionRoot);
