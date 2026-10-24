// entry.tsx — registers the standalone composition for crypto-tradingagents-20261016.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { Episode } from "./Episode";
import { TOTAL_FRAMES } from "./timing";
import { FPS } from "./theme";

registerRoot(() => (
  <Composition
    id="CryptoTradingagents20261016"
    component={Episode}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
    defaultProps={{ debugHud: false }}
  />
));
