import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { SCENES } from "./registry";
import { SceneDurProvider } from "./common";
import timing from "../../public/con-rong-chau-tien/episode_timing.json";

export type EpisodeProps = {
  withMusic?: boolean;
};

export const VNMythEpisode: React.FC<EpisodeProps> = ({ withMusic = true }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {timing.timing.map((t: { sceneId: string; startFrame: number; durationInFrames: number }) => {
        const Scene = SCENES[t.sceneId];
        if (!Scene) return null;
        return (
          <Sequence
            key={t.sceneId}
            from={t.startFrame}
            durationInFrames={t.durationInFrames}
            name={t.sceneId}
          >
            <SceneDurProvider durationInFrames={t.durationInFrames}>
              <Scene durationInFrames={t.durationInFrames} />
            </SceneDurProvider>
          </Sequence>
        );
      })}
      <Audio src={staticFile("con-rong-chau-tien/narration_full.wav")} volume={1} />
      {withMusic ? (
        <Audio
          src={staticFile("con-rong-chau-tien/background_music.mp3")}
          volume={(f) =>
            // gentle duck to ~-14dB (0.2) for the whole narration span; fade in/out at tails
            Math.min(1, f / 30) * Math.min(1, (durationInFrames - f) / 90) * 0.2
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};
