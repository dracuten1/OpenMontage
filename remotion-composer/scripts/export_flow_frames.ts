// Export 8 starting frames (comp WITH characters) + 2 clean rigs sheets for Flow.
// Reuses the exact V8 comp so every shot matches the shipped video.
import { renderStill, selectComposition } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import path from "path";

const frames = [
  ["f1_greet", 45],      // 1.5s  rabbit intro (B1)
  ["f2_intro", 195],     // 6.5s  turtle intro (B2)
  ["f3_challenge", 345], // 11.5s rabbit lean-in (B3)
  ["f4_accept", 480],    // 16.0s turtle chin-up (B4)
  ["f5_dash", 615],      // 20.5s rabbit dash→nap (B5 start)
  ["f6_walk", 760],      // 25.3s turtle mid-road, rabbit naps (B5)
  ["f7_wake", 878],      // 29.3s rabbit wake shock (B6a)
  ["f8_finish", 1095],   // 36.5s celebration (B7b)
];

const run = async () => {
  const bundleLocation = await bundle({
    entryPoint: path.resolve("src/index.tsx"),
    onProgress: () => {},
    webpackOverride: (c) => c,
  });
  for (const [name, frame] of frames) {
    const comp = await selectComposition({
      serveUrl: bundleLocation,
      id: "KidsStoryEp1V8",
      inputProps: {},
    });
    await renderStill({
      composition: comp,
      serveUrl: bundleLocation,
      output: `/tmp/turtle_ref/flow_start_${name}.png`,
      frame,
      inputProps: {},
      chromiumOptions: { disableWebSecurity: true },
    });
    console.log(name, frame);
  }
};
run().catch((e) => { console.error(e); process.exit(1); });
