// Shared NewsEpisodeShell — removes 150 lines of Episode.tsx boilerplate per news/explainer episode.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { BRAND_BUMPER_FRAMES, BrandBumper } from "./BrandBumper";
import { CaptionLayer } from "./SceneShell";
import { COLORS, FONTS, FPS, SAFE, ensureFonts } from "./theme";

export interface EpisodeSceneConfig {
  scene_id: string;
  sectionId: string;
  start_frame: number;
  duration_frames: number;
  start_seconds: number;
  component: React.FC<{ showHud?: boolean }>;
}

export interface RawCaptionItem {
  text?: string;
  chunk_text?: string;
  start: number;
  end: number;
}

export interface NormalizedCaptionItem {
  text: string;
  start: number;
  end: number;
}

export interface SceneSfxCue {
  src: string;
  delayFrames?: number;
  volume?: number;
}

export interface InlineBgmConfig {
  src: string;
  volumeDuringSpeech?: number;
  volumeOnOutro?: number;
  loop?: boolean;
}

export interface NewsEpisodeShellProps {
  scenes: EpisodeSceneConfig[];
  assetBase: string;
  captionsBySection?: Record<string, RawCaptionItem[]>;
  sfxCues?: Record<string, SceneSfxCue[]>;
  showHud?: boolean;
  includeBumper?: boolean;
  bumperAspect?: "9x16" | "16x9";
  inlineBgm?: InlineBgmConfig;
  fps?: number;
}

export function normalizeSectionCaptions(
  rawList: RawCaptionItem[] | undefined,
  sceneStartSeconds: number,
): NormalizedCaptionItem[] {
  if (!rawList || rawList.length === 0) return [];
  const usesGlobalClock =
    sceneStartSeconds > 0.5 && rawList[0].start >= sceneStartSeconds - 0.25;
  const roundMs = (val: number) => Math.round(Math.max(0, val) * 1000) / 1000;
  return rawList.map((item) => ({
    text: item.text ?? item.chunk_text ?? "",
    start: roundMs(usesGlobalClock ? item.start - sceneStartSeconds : item.start),
    end: roundMs(usesGlobalClock ? item.end - sceneStartSeconds : item.end),
  }));
}

const SceneHudOverlay: React.FC<{ sceneId: string; fps: number }> = ({ sceneId, fps }) => {
  const localFrame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.margin,
        bottom: 96,
        zIndex: 45,
        fontFamily: FONTS.display,
        fontSize: 24,
        fontWeight: 800,
        color: COLORS.highlighter,
        letterSpacing: 1.2,
        backgroundColor: "rgba(11, 12, 14, 0.92)",
        borderLeft: `4px solid ${COLORS.vermilion}`,
        padding: "6px 14px",
        whiteSpace: "pre",
        pointerEvents: "none",
      }}
    >
      {`${sceneId} f${localFrame} ${(localFrame / fps).toFixed(2)}s`}
    </div>
  );
};

export const NewsEpisodeShell: React.FC<NewsEpisodeShellProps> = ({
  scenes,
  assetBase,
  captionsBySection = {},
  sfxCues = {},
  showHud = false,
  includeBumper = true,
  bumperAspect = "9x16",
  inlineBgm,
  fps = FPS,
}) => {
  ensureFonts();

  const scenesEndFrame = scenes.reduce(
    (maxEnd, s) => Math.max(maxEnd, s.start_frame + s.duration_frames),
    0,
  );
  const totalFrames = scenesEndFrame + (includeBumper ? BRAND_BUMPER_FRAMES : 0);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {inlineBgm ? (
        <Audio
          src={staticFile(inlineBgm.src)}
          loop={inlineBgm.loop ?? true}
          volume={(f) => {
            const speechVol = inlineBgm.volumeDuringSpeech ?? 0.22;
            const outroVol = inlineBgm.volumeOnOutro ?? 0.38;
            const fadeIn = interpolate(f, [0, 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const bedLevel =
              includeBumper && scenesEndFrame > 0
                ? interpolate(
                    f,
                    [scenesEndFrame, scenesEndFrame + 15],
                    [speechVol, outroVol],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  )
                : speechVol;
            const fadeOut = interpolate(
              f,
              [Math.max(1, totalFrames - 30), Math.max(2, totalFrames)],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return bedLevel * fadeIn * fadeOut;
          }}
        />
      ) : null}

      {scenes.map((scene) => {
        const SceneComp = scene.component;
        const captions = normalizeSectionCaptions(
          captionsBySection[scene.sectionId],
          scene.start_seconds,
        );
        const cues = sfxCues[scene.scene_id] ?? sfxCues[scene.sectionId] ?? [];
        return (
          <Sequence
            key={scene.scene_id}
            from={scene.start_frame}
            durationInFrames={scene.duration_frames}
            name={scene.scene_id}
          >
            <SceneComp showHud={false} />
            <CaptionLayer captions={captions} />
            <Audio src={staticFile(`${assetBase}/audio/voice_${scene.sectionId}.wav`)} />
            {cues.map((cue, idx) => (
              <Sequence
                key={`${scene.scene_id}-sfx-${idx}`}
                from={cue.delayFrames ?? 0}
                durationInFrames={Math.max(1, scene.duration_frames - (cue.delayFrames ?? 0))}
              >
                <Audio src={staticFile(cue.src)} volume={cue.volume ?? 0.24} />
              </Sequence>
            ))}
            {showHud ? <SceneHudOverlay sceneId={scene.scene_id} fps={fps} /> : null}
          </Sequence>
        );
      })}

      {includeBumper ? (
        <Sequence
          from={scenesEndFrame}
          durationInFrames={BRAND_BUMPER_FRAMES}
          name="BrandBumper"
        >
          <BrandBumper aspect={bumperAspect} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
