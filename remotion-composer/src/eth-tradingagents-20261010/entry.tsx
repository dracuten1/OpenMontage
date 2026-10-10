// Probe entry — registers the eth10 composition for still-frame verification + render.
// Not wired into Root.tsx (btc08/eth09 pattern); safe to delete.
import { Composition } from "remotion";
import { registerRoot } from "remotion";
import { EthTradingAgents20261010 } from "./Episode";
import { TOTAL_FRAMES } from "./timing";
import { FPS } from "./theme";

registerRoot(() => (
  <Composition
    id="EthTradingagents20261010"
    component={EthTradingAgents20261010}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
));
