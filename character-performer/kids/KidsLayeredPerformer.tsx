import { AbsoluteFill, Audio, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { spring, interpolate } from "remotion";

// ---------------------------------------------------------------
// KidsLayeredPerformer v2 — PROFESSIONAL layered edition:
//   layer 0: clean background (static or slow parallax)
//   layer 1: transparent character sprite (whole-frame variants:
//            closed/smile/O/laugh + blink) — position/scale/pose
//            fully Remotion-controlled, no background to preserve
// Extra motion: walk-in entrance, hop accent per sentence,
// head-tilt on O, camera drift. Slower pacing via props.
// ---------------------------------------------------------------

export type MouthCue = { start: number; end: number; value: string };

export type KidsLayeredProps = {
  bgSrc: string;
  charFrames: string[]; // [closed, smile, O, laugh] transparent sprites
  blinkSrc: string;
  audioSrc: string;
  bgmSrc?: string;
  mouthCues: MouthCue[];
  title?: string;
  charX?: number; // 0..1 anchor on 1080 canvas
  charY?: number;
  charH?: number; // sprite height fraction
};

const CUE_TO_TIER: Record<string, number> = {
  X: 0, A: 3, B: 2, C: 2, D: 1, E: 1, F: 1, G: 2, H: 2,
};

function tierAt(cues: MouthCue[], t: number): number {
  let tier = 0;
  for (const c of cues) if (t >= c.start && t < c.end) tier = CUE_TO_TIER[c.value] ?? 1;
  return tier;
}

// sentence ends = gaps > 350ms between cues — hop moments
function sentenceEnds(cues: MouthCue[]): number[] {
  const ends: number[] = [];
  for (let i = 0; i < cues.length - 1; i++) {
    if (cues[i + 1].start - cues[i].end > 0.35) ends.push(cues[i].end);
  }
  if (cues.length) ends.push(cues[cues.length - 1].end);
  return ends;
}

export const KidsLayeredPerformer: React.FC<KidsLayeredProps> = ({
  bgSrc, charFrames, blinkSrc, audioSrc, bgmSrc, mouthCues, title,
  charX = 0.5, charY = 0.86, charH = 0.62,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const tier = tierAt(mouthCues, t);
  const src = charFrames[tier];

  // blink every ~2.8s, not while laughing
  const phase = (t % 2.8) / 2.8;
  const blink = (phase < 0.04 || (phase >= 0.075 && phase < 0.115)) && tier < 3;

  // ---- entrance: hop-walk in from left ----
  const walkIn = spring({ frame, fps, config: { damping: 14, stiffness: 60, mass: 0.8 } });
  const inX = interpolate(walkIn, [0, 1], [-0.38, 0]);
  const walkBounce = (1 - walkIn) > 0.01 ? Math.abs(Math.sin(t * 9)) * 0.02 * (1 - walkIn) : 0;

  // ---- idle: gentle breathing squash-stretch ----
  const breathe = Math.abs(Math.sin(t * 1.9));
  const scaleY = 1 + 0.014 * breathe;
  const scaleX = 1 - 0.012 * breathe;

  // ---- hop accent at each sentence end (0.35s spring) ----
  const ends = sentenceEnds(mouthCues);
  let hop = 0;
  for (const e of ends) {
    if (t > e && t < e + 0.45) {
      hop = Math.max(hop, spring({ frame: (t - e) * fps, fps, config: { damping: 11, stiffness: 120, mass: 0.5 }, durationInFrames: 14 }));
    }
  }
  const hopY = -0.05 * hop;
  const hopSquash = 1 - 0.06 * hop;

  // ---- pose tilt: head-tilt feel on O / laugh tiers ----
  const tilt = tier >= 2 ? Math.sin(t * 3.2) * 1.6 : 0;

  // ---- camera: very slow drift, breath zoom ----
  const zoom = 1.03 + 0.006 * Math.sin(t * 0.5);
  const driftX = Math.sin(t * 0.22) * 0.005 * width;

  const H = charH * height;
  const x = (charX + inX) * width;
  const y = charY * height;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* layer 0: background with slow camera */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoom.toFixed(4)}) translate(${(-driftX / zoom).toFixed(1)}px, 0px)`,
          transformOrigin: "50% 60%",
        }}
      >
        <Img src={bgSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>

      {/* layer 1: character sprite */}
      <div
        style={{
          position: "absolute",
          left: x, top: y,
          transform: `translate(-50%, -100%) scale(${(scaleX * hopSquash).toFixed(4)}, ${(scaleY * (2 - hopSquash)).toFixed(4)}) rotate(${tilt.toFixed(2)}deg) translateY(${(hopY * height).toFixed(1)}px)`,
          transformOrigin: "50% 100%",
          height: H,
          imageRendering: "auto",
        }}
      >
        <Img
          key={blink ? "b" : tier}
          src={blink ? blinkSrc : src}
          style={{ height: "100%", width: "auto", objectFit: "contain" }}
        />
      </div>

      {title && (
        <div
          style={{
            position: "absolute", left: 50, bottom: 54, right: 50, textAlign: "center",
            fontSize: 60, fontWeight: 800, color: "#FF7F50",
            WebkitTextStroke: "3px #FFFFFF", textShadow: "0 4px 10px rgba(0,0,0,0.25)",
          }}
        >
          {title}
        </div>
      )}
      {bgmSrc && <Audio src={bgmSrc} volume={0.16} />}
      <Audio src={audioSrc} />
    </AbsoluteFill>
  );
};
