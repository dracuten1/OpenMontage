// entry.tsx — standalone Remotion root for crypto-tradingagents-20261015.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { CryptoTradingAgents20261015 } from "./Episode";
import { TOTAL_FRAMES } from "./timing";
import { FPS } from "./theme";

registerRoot(() => (
  <Composition
    id="CryptoTradingagents20261015"
    component={CryptoTradingAgents20261015}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
));
