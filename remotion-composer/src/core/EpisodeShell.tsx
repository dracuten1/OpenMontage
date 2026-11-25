// Shared theme-aware EpisodeShell — wraps scenes in ChannelThemeProvider and handles audio/captions/bumper.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { getChannelTheme } from "../channels/registry";
import { BRAND_BUMPER_FRAMES, BrandBumper } from "./BrandBumper";
import { CaptionLayer } from "./SceneShell";
import { ChannelTheme, ChannelThemeProvider } from "./theme";

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

export interface EpisodeShellProps {
  scenes: EpisodeSceneConfig[];
  assetBase: string;
  channel?: string;
  theme?: ChannelTheme;
  captionsBySection?: Record<string, RawCaptionItem[]>;
  sfxCues?: Record<string, SceneSfxCue[]>;
  showHud?: boolean;
  includeBumper?: boolean;
  bumperAspect?: "9x16" | "16x9";
  inlineBgm?: InlineBgmConfig;
  fps?: number;
}

export type NewsEpisodeShellProps = EpisodeShellProps;

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

const SceneHudOverlay: React.FC<{
  sceneId: string;
  fps: number;
  theme: ChannelTheme;
}> = ({ sceneId, fps, theme }) => {
  const localFrame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: theme.safe.margin,
        bottom: 96,
        zIndex: 45,
        fontFamily: theme.fonts.display,
        fontSize: 24,
        fontWeight: 800,
        color: theme.colors.highlighter,
        letterSpacing: 1.2,
        backgroundColor: "rgba(11, 12, 14, 0.92)",
        borderLeft: `4px solid ${theme.colors.vermilion}`,
        padding: "6px 14px",
        whiteSpace: "pre",
        pointerEvents: "none",
      }}
    >
      {`${sceneId} f${localFrame} ${(localFrame / fps).toFixed(2)}s`}
    </div>
  );
};

export const EpisodeShell: React.FC<EpisodeShellProps> = ({
  scenes,
  assetBase,
  channel,
  theme,
  captionsBySection = {},
  sfxCues = {},
  showHud = false,
  includeBumper,
  bumperAspect,
  inlineBgm,
  fps,
}) => {
  const resolvedTheme = theme ?? getChannelTheme(channel);
  resolvedTheme.ensureFonts();

  const resolvedFps = fps ?? resolvedTheme.canvas.fps;
  const resolvedBumperEnabled =
    includeBumper ?? (channel || theme ? resolvedTheme.bumper.enabled : true);
  const resolvedAspect =
    bumperAspect ??
    (resolvedTheme.canvas.width < resolvedTheme.canvas.height ? "9x16" : "16x9");
  const bumperFrames = resolvedTheme.bumper.frames || BRAND_BUMPER_FRAMES;

  const scenesEndFrame = scenes.reduce(
    (maxEnd, s) => Math.max(maxEnd, s.start_frame + s.duration_frames),
    0,
  );
  const totalFrames = scenesEndFrame + (resolvedBumperEnabled ? bumperFrames : 0);

  return (
    <ChannelThemeProvider theme={resolvedTheme}>
      <AbsoluteFill style={{ backgroundColor: resolvedTheme.colors.paper }}>
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
                resolvedBumperEnabled && scenesEndFrame > 0
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
              {showHud ? (
                <SceneHudOverlay sceneId={scene.scene_id} fps={resolvedFps} theme={resolvedTheme} />
              ) : null}
            </Sequence>
          );
        })}

        {resolvedBumperEnabled ? (
          <Sequence
            from={scenesEndFrame}
            durationInFrames={bumperFrames}
            name="BrandBumper"
          >
            <BrandBumper aspect={resolvedAspect} />
          </Sequence>
        ) : null}
      </AbsoluteFill>
    </ChannelThemeProvider>
  );
};

export const NewsEpisodeShell = EpisodeShell;
