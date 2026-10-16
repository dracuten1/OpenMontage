// Probe entry — registers the crypto-tradingagents-20261013 composition for
// still-frame verification + render. Not wired into Root.tsx (btc08/eth09/
// eth10 pattern); Root.tsx untouched.
import { Composition } from "remotion";
import { registerRoot } from "remotion";
import { CryptoTradingAgents20261013 } from "./Episode";
import { TOTAL_FRAMES } from "./timing";
import { FPS } from "./theme";

registerRoot(() => (
  <Composition
    id="CryptoTradingagents20261013"
    component={CryptoTradingAgents20261013}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
));
