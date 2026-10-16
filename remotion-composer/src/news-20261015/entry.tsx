// entry.tsx — standalone Remotion root for news-20261015.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { News20261015 } from "./Episode";
import { TOTAL_FRAMES } from "./timing";
import { FPS } from "./theme";

registerRoot(() => (
  <Composition
    id="News20261015"
    component={News20261015}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
));
