import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, EPISODE_SLUG, FONT } from "./theme";

export const clampX = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const easeAt = (frame: number, dur: number, a: number, b?: number): number =>
  interpolate(frame, [a * dur, (b ?? a + 0.08) * dur], [0, 1], { ...clampX, easing: Easing.out(Easing.cubic) });

const CLIP_FRAMES_30FPS = 300; // 10.0s @ 30fps from 240 Blender @ 24fps frames
const BLENDER_FRAMES = 240;
const CROSSFADE_PASS_RATE = 0.75;
const CROSSFADE_CYCLE = 400; // 300 / 0.75
const CROSSFADE_OVERLAP = 24;
const CROSSFADE_STRIDE = CROSSFADE_CYCLE - CROSSFADE_OVERLAP; // 376

export function computeTrackFrame(sceneFrame: number, dur: number): { blenderFrame: number; fadeOpacity: number } {
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
        const acc = sp.accent ?? C.gold;

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
              <span style={{ fontFamily: FONT.body, fontSize: 17, fontWeight: 700, color: C.white, letterSpacing: 0.2 }}>
                {sp.label}
              </span>
            </div>
            <div style={{ width: 2, height: 22, background: acc, opacity: 0.9 }} />
            <div style={{ width: 8, height: 8, borderRadius: 99, background: acc, border: `1.5px solid ${C.white}` }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const DioramaBackdrop: React.FC<{
  file: string;
  move?: "dolly_in" | "dolly_out" | "pan_left" | "pan_right" | "orbital" | "zoom_in" | "static" | "tracking_left" | "tracking_right" | "crane_up";
  dim?: number;
}> = ({ file, move = "dolly_in", dim = 0.18 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames: dur, fps } = useVideoConfig();
  const fade = spring({ frame, fps, config: { damping: 24 }, from: 0, to: 1, durationInFrames: 18 });
  const isVideo = file.endsWith(".mp4");

  const s0 = move === "dolly_out" ? 1.14 : 1.03;
  const s1 = move === "dolly_out" ? 1.03 : 1.12;
  const scale = move === "static" ? 1.05 : interpolate(frame, [0, dur], [s0, s1], clampX);

  const tx0 = move === "pan_left" || move === "tracking_left" ? 18 : move === "pan_right" || move === "tracking_right" ? -18 : 0;
  const tx1 = -tx0;
  const tx = interpolate(frame, [0, dur], [tx0, tx1], clampX);
  const ty = move === "crane_up" ? interpolate(frame, [0, dur], [12, -16], clampX) : interpolate(Math.sin(frame / 58), [-1, 1], [-3, 3]);

  return (
    <AbsoluteFill style={{ opacity: fade, backgroundColor: C.bgDeep }}>
      {isVideo ? (
        <CrossfadeLoopVideo src={staticFile(`${EPISODE_SLUG}/${file}`)} dur={dur} />
      ) : (
        <Img
          src={staticFile(`${EPISODE_SLUG}/${file}`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
          }}
        />
      )}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, rgba(16,12,10,${Math.max(0.05, dim * 0.4)}) 20%, rgba(16,12,10,${Math.min(0.88, dim + 0.34)}) 100%)`,
        }}
      />
      {/* Subtle 12fps editorial grain texture overlay */}
      <AbsoluteFill
        style={{
          opacity: 0.035,
          mixBlendMode: "overlay",
          backgroundImage: `repeating-linear-gradient(${((Math.floor(frame / 2) * 37) % 180)}deg, rgba(255,255,255,0.22) 0px, transparent 1px, transparent 4px)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const LayerStamp: React.FC<{
  layerTag: string;
  title: string;
  accent?: string;
  lightPaper?: boolean;
}> = ({ layerTag, title, accent = C.gold, lightPaper = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 20 }, from: 0, to: 1, durationInFrames: 20 });
  const ruleW = interpolate(enter, [0, 1], [0, 140]);
  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [14, 0])}px)`,
        borderTop: `2px solid ${accent}`,
        paddingTop: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 18, fontWeight: 700, letterSpacing: 2.2, color: accent }}>
          {layerTag.toUpperCase()}
        </span>
        <div style={{ width: ruleW, height: 1, background: accent, opacity: 0.6 }} />
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: FONT.display,
          fontSize: 38,
          lineHeight: 1.2,
          fontWeight: 700,
          color: lightPaper ? C.ink : C.white,
          maxWidth: 1080,
          textShadow: lightPaper ? "none" : "0 4px 20px rgba(0,0,0,0.7)",
        }}
      >
        {title}
      </div>
    </div>
  );
};

export const ArchivalPaperStage: React.FC<{
  children: React.ReactNode;
  accent?: string;
}> = ({ children, accent = C.gold }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: dur } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 20 }, from: 0.96, to: 1, durationInFrames: 22 });
  const out = interpolate(frame, [dur - 12, dur], [1, 0.97], clampX);
  return (
    <div
      style={{
        position: "absolute",
        inset: 48,
        transform: `scale(${enter * out})`,
        backgroundImage: `radial-gradient(circle at 12% 14%, rgba(212,155,56,0.10), transparent 52%), linear-gradient(155deg, ${C.bgLight}F9, ${C.cream}F4)`,
        borderLeft: `6px solid ${accent}`,
        borderRight: `1px solid ${C.border}66`,
        borderTop: `1px solid ${C.border}66`,
        borderBottom: `2px solid ${C.border}`,
        boxShadow: "0 28px 80px rgba(0,0,0,0.62)",
        padding: "36px 46px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};

export const EditorialCallout: React.FC<{
  quote: string;
  source: string;
  accent?: string;
  delay?: number;
}> = ({ quote, source, accent = C.gold, delay = 8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 18 }, from: 0, to: 1, durationInFrames: 22 });
  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [18, 0])}px)`,
        background: "rgba(20, 15, 12, 0.86)",
        borderLeft: `5px solid ${accent}`,
        padding: "22px 30px",
        maxWidth: 1020,
        boxShadow: "0 18px 48px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ fontFamily: FONT.display, fontSize: 33, lineHeight: 1.4, color: C.white }}>
        «{quote}»
      </div>
      <div style={{ marginTop: 12, fontFamily: FONT.mono, fontSize: 19, color: accent, letterSpacing: 0.6 }}>
        — {source}
      </div>
    </div>
  );
};
