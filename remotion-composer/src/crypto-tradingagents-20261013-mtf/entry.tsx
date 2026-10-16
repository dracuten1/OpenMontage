// entry.tsx — crypto-tradingagents-20261013-mtf (vertical TikTok 1080x1920 @30fps).
import React from "react";
import { Composition, registerRoot } from "remotion";
import { CryptoTradingAgents20261013Mtf } from "./Episode";
import { FPS } from "./theme";
import { TOTAL_FRAMES } from "./timing";

registerRoot(() => (
  <Composition
    id="CryptoTradingagents20261013Mtf"
    component={CryptoTradingAgents20261013Mtf}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
));
