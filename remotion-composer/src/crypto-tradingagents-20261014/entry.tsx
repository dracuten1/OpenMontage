// Probe entry — registers the crypto-tradingagents-20261014 composition for
// still-frame verification + render. Not wired into Root.tsx (btc08/eth09/
// eth10/cta13 pattern); Root.tsx untouched.
import { Composition } from "remotion";
import { registerRoot } from "remotion";
import { CryptoTradingAgents20261014 } from "./Episode";
import { TOTAL_FRAMES } from "./timing";
import { FPS } from "./theme";

registerRoot(() => (
  <Composition
    id="CryptoTradingagents20261014"
    component={CryptoTradingAgents20261014}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
));
