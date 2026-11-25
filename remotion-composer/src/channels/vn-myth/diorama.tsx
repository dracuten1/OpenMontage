import React from "react";
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useChannelTheme } from "../../core/theme";

export const clampX = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const easeAt = (frame: number, dur: number, a: number, b?: number): number =>
  interpolate(frame, [a * dur, (b ?? a + 0.08) * dur], [0, 1], {
    ...clampX,
    easing: Easing.out(Easing.cubic),
  });

const CLIP_FRAMES_30FPS = 300;
const BLENDER_FRAMES = 240;
const CROSSFADE_PASS_RATE = 0.75;
const CROSSFADE_CYCLE = 400;
const CROSSFADE_OVERLAP = 24;
const CROSSFADE_STRIDE = CROSSFADE_CYCLE - CROSSFADE_OVERLAP;

export function computeTrackFrame(
  sceneFrame: number,
  dur: number,
): { blenderFrame: number; fadeOpacity: number } {
  if (dur <= 420) {
    const progress = Math.max(0, Math.min(1, sceneFrame / Math.max(1, dur - 1)));
    const bf = 1 + Math.round(progress * (BLENDER_FRAMES - 1));
    return { blenderFrame: Math.max(1, Math.min(BLENDER_FRAMES, bf)), fadeOpacity: 1 };
  }
  const passIdx = Math.floor(sceneFrame / CROSSFADE_STRIDE);
  const localInPass = sceneFrame - passIdx * CROSSFADE_STRIDE;
  const progress = Math.max(0, Math.min(1, localInPass / (CROSSFADE_CYCLE - 1)));
  const bf = 1 + Math.round(progress * (BLENDER_FRAMES - 1));

  let fadeOpacity = 1;
  if (passIdx >= 1 && localInPass < CROSSFADE_OVERLAP) {
    fadeOpacity = Math.min(fadeOpacity, localInPass / CROSSFADE_OVERLAP);
  }
  if ((passIdx + 1) * CROSSFADE_STRIDE < dur && localInPass > CROSSFADE_STRIDE - 12) {
    fadeOpacity = Math.min(fadeOpacity, Math.max(0, (CROSSFADE_STRIDE - localInPass) / 12));
  }
  return { blenderFrame: Math.max(1, Math.min(BLENDER_FRAMES, bf)), fadeOpacity };
}

const CrossfadePass: React.FC<{
  src: string;
  playbackRate: number;
  fadeInFrames: number;
}> = ({ src, playbackRate, fadeInFrames }) => {
  const f = useCurrentFrame();
  const opacity = fadeInFrames > 0 ? interpolate(f, [0, fadeInFrames], [0, 1], clampX) : 1;
  return (
    <AbsoluteFill style={{ opacity }}>
      <OffthreadVideo
        src={src}
        playbackRate={playbackRate}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

export const CrossfadeLoopVideo: React.FC<{
  src: string;
  dur: number;
}> = ({ src, dur }) => {
  if (dur <= 420) {
    const rate = Math.max(0.55, Math.min(1.15, CLIP_FRAMES_30FPS / Math.max(1, dur)));
    return (
      <OffthreadVideo
        src={src}
        playbackRate={rate}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  const passes: Array<{ from: number; len: number; fade: number }> = [];
  for (let i = 0; i * CROSSFADE_STRIDE < dur; i++) {
    const from = i * CROSSFADE_STRIDE;
    const len = Math.min(CROSSFADE_CYCLE, dur - from);
    passes.push({ from, len, fade: i >= 1 ? CROSSFADE_OVERLAP : 0 });
  }
  return (
    <AbsoluteFill>
      {passes.map((p, idx) => (
        <Sequence key={idx} from={p.from} durationInFrames={p.len}>
          <CrossfadePass src={src} playbackRate={CROSSFADE_PASS_RATE} fadeInFrames={p.fade} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export type TrackPoint = { x: number; y: number; v: boolean };
export type TracksMap = Record<string, Record<string, TrackPoint>>;
export type CalloutSpec = {
  anchor: string;
  label: string;
  accent?: string;
  dx?: number;
  dy?: number;
  startFrac?: number;
  endFrac?: number;
};

export const SceneTrackedCallouts: React.FC<{
  tracks: TracksMap;
  specs: CalloutSpec[];
}> = ({ tracks, specs }) => {
  const frame = useCurrentFrame();
  const { durationInFrames: dur, fps } = useVideoConfig();
  const theme = useChannelTheme();
  const { blenderFrame, fadeOpacity } = computeTrackFrame(frame, dur);
  const bfKey = String(blenderFrame);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {specs.map((sp, i) => {
        const pt = tracks[bfKey]?.[sp.anchor];
        if (!pt || !pt.v) return null;
        const a0 = (sp.startFrac ?? 0.0) * BLENDER_FRAMES;
        const a1 = (sp.endFrac ?? 1.0) * BLENDER_FRAMES;
        if (blenderFrame < a0 || blenderFrame > a1) return null;

        const enter = spring({
          frame: Math.max(0, Math.round(blenderFrame - a0)),
          fps,
          config: { damping: 18, stiffness: 150 },
          durationInFrames: 18,
        });
        const px = Math.max(170, Math.min(1750, pt.x + (sp.dx ?? 0)));
        const py = Math.max(210, Math.min(840, pt.y + (sp.dy ?? -36)));
        const acc = sp.accent ?? theme.colors.amber;

        return (
          <div
            key={`${sp.anchor}-${i}`}
            style={{
              position: "absolute",
              left: px,
              top: py,
              transform: `translate(-50%, -100%) scale(${interpolate(enter, [0, 1], [0.85, 1])})`,
              transformOrigin: "bottom center",
              opacity: enter * fadeOpacity,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                background: "rgba(18, 13, 10, 0.88)",
                border: `1.5px solid ${acc}`,
                borderLeft: `4px solid ${acc}`,
                borderRadius: 6,
                padding: "6px 13px",
                boxShadow: "0 8px 22px rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: 99, background: acc }} />
              <span
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 17,
                  fontWeight: 700,
                  color: theme.colors.white,
                  letterSpacing: 0.2,
                }}
              >
                {sp.label}
              </span>
            </div>
            <div style={{ width: 2, height: 22, background: acc, opacity: 0.9 }} />
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: acc,
                border: `1.5px solid ${theme.colors.white}`,
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
