// Episode.tsx — crypto-tradingagents-20261015 root composition (VERTICAL 1080x1920).
// Scenes speech-locked via SCENE_TIMING (measured offsets on narration_full.wav);
// captions burn from captions.json global cues; narration + BGM envelope mix.
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import captionsJson from "../../public/crypto-tradingagents-20261015/captions.json";
import { SCENE_TIMING, TOTAL_FRAMES } from "./timing";
import { C, FONT, FPS } from "./theme";
import { S01, S02, S03 } from "./scenes_a";
import { S04, S05, S06 } from "./scenes_b";
import { S07, S08, S09 } from "./scenes_c";

const CAPS = captionsJson as unknown;
const CUES: { start: number; end: number; text: string }[] = Array.isArray(CAPS)
  ? CAPS
  : ((CAPS as { cues?: { start: number; end: number; text: string }[] }).cues ?? []);

const Caption: React.FC<{ start: number; end: number; text: string }> = ({ start, end, text }) => (
  <Sequence
    from={Math.round(start * FPS)}
    durationInFrames={Math.max(1, Math.round(end * FPS) - Math.round(start * FPS))}
    layout="none"
  >
    <div
      style={{
        position: "absolute",
        left: 80,
        width: 920,
        top: 1615,
        height: 150,
        boxSizing: "border-box",
        padding: "12px 20px",
        borderRadius: 14,
        background: "rgba(13,17,23,0.92)",
        border: "1px solid rgba(139,148,158,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <span
        style={{
          color: "#FFFFFF",
          fontWeight: 800,
          fontSize: 32,
          fontFamily: FONT,
          lineHeight: 1.3,
          whiteSpace: "pre-line",
          textShadow:
            "-2px 0 0 #000, 2px 0 0 #000, 0 -2px 0 #000, 0 2px 0 #000, 0 4px 10px rgba(0,0,0,0.85)",
        }}
      >
        {text}
      </span>
    </div>
  </Sequence>
);

// BGM bed 0.12 with 30f fade-in / 90f fade-out envelope.
const Bgm: React.FC = () => {
  const f = useCurrentFrame();
  const env = interpolate(
    f,
    [0, 30, TOTAL_FRAMES - 90, TOTAL_FRAMES],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <Audio src={staticFile("crypto-tradingagents-20261015/bgm.mp3")} volume={0.12 * env} />;
};

const SCENES: Record<string, React.FC> = {
  s01: S01, s02: S02, s03: S03,
  s04: S04, s05: S05, s06: S06,
  s07: S07, s08: S08, s09: S09,
};

export const CryptoTradingAgents20261015: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    {SCENE_TIMING.map((t, i) => {
      const Scene = SCENES[t.scene_id];
      const dur = i === SCENE_TIMING.length - 1 ? TOTAL_FRAMES - t.start_frame : t.scene_frames;
      return (
        <Sequence key={t.scene_id} from={t.start_frame} durationInFrames={dur}>
          <Scene />
        </Sequence>
      );
    })}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(0,0,0,0.45) 100%)" }} />
    {CUES.map((c, i) => (
      <Caption key={i} start={c.start} end={c.end} text={c.text} />
    ))}
    <Audio src={staticFile("crypto-tradingagents-20261015/narration_full.wav")} volume={0.89} />
    <Bgm />
  </AbsoluteFill>
);
