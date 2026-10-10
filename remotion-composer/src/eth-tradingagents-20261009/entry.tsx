// Probe entry — registers the eth09 composition for still-frame verification + render.
// Not wired into Root.tsx (btc08 pattern); safe to delete.
import { Composition } from "remotion";
import { registerRoot } from "remotion";
import { EthTradingAgents20261009 } from "./Episode";
import { TOTAL_FRAMES } from "./timing";
import { FPS } from "./theme";

registerRoot(() => (
  <Composition
    id="EthTradingagents20261009"
    component={EthTradingAgents20261009}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
));
