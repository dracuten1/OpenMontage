// TEMP probe entry — registers the btc08 composition for still-frame verification.
// Not wired into Root.tsx; safe to delete.
import { Composition } from "remotion";
import { registerRoot } from "remotion";
import { BtcTradingAgents20261008 } from "./Episode";
import { TOTAL_FRAMES } from "./timing";
import { FPS } from "./theme";

registerRoot(() => (
  <Composition
    id="BtcTradingagents20261008"
    component={BtcTradingAgents20261008}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
));
