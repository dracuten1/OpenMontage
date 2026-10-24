import React from "react";
import { registerRoot, Composition } from "remotion";
import { News20261018 } from "./Episode";
import { TOTAL_FRAMES, FPS } from "./timing";

const News1018Root: React.FC = () => (
  <>
    <Composition
      id="News20261018"
      component={News20261018}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={TOTAL_FRAMES}
      defaultProps={{ hud: false }}
    />
    <Composition
      id="News20261018Debug"
      component={News20261018}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={TOTAL_FRAMES}
      defaultProps={{ hud: true }}
    />
  </>
);

registerRoot(News1018Root);
