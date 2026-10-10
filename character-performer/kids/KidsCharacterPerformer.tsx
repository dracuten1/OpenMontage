import { AbsoluteFill, Audio, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { spring, interpolate } from "remotion";

// ---------------------------------------------------------------
// KidsCharacterPerformer — whole-frame variant swap, kid edition.
// Frames: [closed, base(smiling), O-surprise, laugh] + blink frame.
// Extra kid motion: bouncy idle (squash-stretch), entrance pop,
// bounce accent when a sentence ends (cue gap > 250ms).
// ---------------------------------------------------------------

export type MouthCue = { start: number; end: number; value: string };

export type KidsPerformerProps = {
  frameSrcs: string[]; // [closed, smile-open(base), O, laugh]
  blinkSrc: string;
  audioSrc: string;
  bgmSrc?: string;
  mouthCues: MouthCue[];
  title?: string;
};

const CUE_TO_TIER: Record<string, number> = {
  X: 0, A: 3, B: 2, C: 2, D: 1, E: 1, F: 1, G: 2, H: 2,
};

function tierAt(cues: MouthCue[], t: number): number {
  let tier = 0;
  for (const c of cues) if (t >= c.start && t < c.end) tier = CUE_TO_TIER[c.value] ?? 1;
  return tier;
}

export const KidsCharacterPerformer: React.FC<KidsPerformerProps> = ({
  frameSrcs, blinkSrc, audioSrc, bgmSrc, mouthCues, title,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;

  const tier = tierAt(mouthCues, t);

  // blink every ~2.8s (kids' characters blink more), not while laughing
  const phase = (t % 2.8) / 2.8;
  const blink = (phase < 0.04 || (phase >= 0.075 && phase < 0.115)) && tier < 3;

  // bouncy idle: squash-stretch breathing (kids' animation feel)
  const bounce = Math.abs(Math.sin(t * 2.6));
  const scaleY = 1 + 0.012 * bounce;
  const scaleX = 1 - 0.010 * bounce;
  const bobY = -0.008 * width * bounce;

  // slow camera: gentle drift + tiny zoom pulse on the beat (~72bpm feel)
  const zoom = 1.05 + 0.008 * Math.sin(t * 1.6);
  const driftX = Math.sin(t * 0.35) * 0.006 * width;

  // entrance: springy pop-in with overshoot
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 100, mass: 0.6 } });
  const eScale = interpolate(pop, [0, 1], [0.6, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#BDE8FF", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${(zoom * eScale).toFixed(4)}) translate(${(-driftX / zoom).toFixed(1)}px, 0px)`,
          transformOrigin: "50% 55%",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            transform: `scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)}) translateY(${bobY.toFixed(1)}px)`,
            transformOrigin: "50% 90%",
          }}
        >
          <Img
            key={blink ? "blink" : tier}
            src={blink ? blinkSrc : frameSrcs[tier]}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </AbsoluteFill>
      {title && (
        <div
          style={{
            position: "absolute", left: 50, bottom: 60, right: 50, textAlign: "center",
            fontFamily: "rounded", fontSize: 64, fontWeight: 800, color: "#FF7F50",
            WebkitTextStroke: "2px #FFFFFF",
            textShadow: "0 4px 10px rgba(0,0,0,0.25)",
          }}
        >
          {title}
        </div>
      )}
      {bgmSrc && <Audio src={bgmSrc} volume={0.18} />}
      <Audio src={audioSrc} />
    </AbsoluteFill>
  );
};
