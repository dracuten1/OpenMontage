import { AbsoluteFill, Audio, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { spring } from "remotion";

// ---------------------------------------------------------------
// CharacterPerformer v3 — WHOLE-FRAME variant swap (classic 2D
// animation). 4 full frames from the same img2img lineage:
//   [closed, slight, half, wide] + an eyes-closed frame.
// No patches, no masks, no seams possible. Remotion does the rest:
//   cue->frame timing, blink timing, breathing/sway/zoom transforms,
//   audio mux, 30fps encode.
// ---------------------------------------------------------------

export type MouthCue = { start: number; end: number; value: string };

export type CharacterPerformerProps = {
  frameSrcs: string[]; // [closed, slight, half, wide] — full frames
  eyesClosedSrc: string; // full frame, eyes closed
  audioSrc: string;
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

export const CharacterPerformer: React.FC<CharacterPerformerProps> = ({
  frameSrcs, eyesClosedSrc, audioSrc, mouthCues, title,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;

  const tier = tierAt(mouthCues, t);
  const src = frameSrcs[tier];

  // blink every ~3.4s (skip while mouth wide open — natural)
  const phase = (t % 3.4) / 3.4;
  const blink = (phase < 0.045 || (phase >= 0.085 && phase < 0.13)) && tier < 3;

  // body + camera motion (Remotion transform layer)
  const bobY = Math.sin(t * 2.1) * 0.005 * width;
  const swayX = Math.sin(t * 0.7) * 0.003 * width;
  const zoom = 1.045 + Math.sin(t * 0.23) * 0.012;
  const driftX = Math.sin(t * 0.31) * 0.008 * width;
  const entrance = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#F7F0E1", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${(zoom * (0.98 + entrance * 0.02)).toFixed(4)}) translate(${(-driftX / zoom).toFixed(1)}px, 0px)`,
          transformOrigin: "50% 60%",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            transform: `translate(${swayX.toFixed(1)}px, ${bobY.toFixed(1)}px)`,
            transformOrigin: "50% 100%",
          }}
        >
          <Img
            key={blink ? "blink" : tier}
            src={blink ? eyesClosedSrc : src}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </AbsoluteFill>
      {title && (
        <div style={{ position: "absolute", left: 60, bottom: 48, right: 60, textAlign: "center",
          fontFamily: "serif", fontSize: 54, fontWeight: 700, color: "#5A3A1E",
          textShadow: "0 2px 8px rgba(255,255,255,0.8)" }}>
          {title}
        </div>
      )}
      <Audio src={audioSrc} />
    </AbsoluteFill>
  );
};
