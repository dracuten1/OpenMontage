// VN-Myth S2E04 "Liễu Hạnh" — episode assembly.
// One Sequence per scene from TIMING (generated from artifacts/scene_timing.json),
// each wrapped with AnchorProvider (speech-lock anchors) + SceneDurProvider.
// Audio: narration_full.wav @1.0; background_music.mp3 envelope 0→0.32 (30f ramp-in),
// fade to 0 over the last 90 frames — interpolated on absolute frame.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import * as groupA from "./scenes-a";
import * as groupB from "./scenes-b";
import * as groupC from "./scenes-c";
import * as groupD from "./scenes-d";
import * as groupE from "./scenes-e";
import * as groupF from "./scenes-f";
import { AnchorProvider, SceneDurProvider } from "./common";
import { TIMING } from "./timing";
import { SceneProps } from "./theme";
import { DraftHud } from "./draft-hud";

type SceneComponent = React.FC<SceneProps>;

const keyOf = (exportName: string): string | null => {
  const m = /^Sc(\d{2,})$/.exec(exportName);
  return m ? `sc${m[1].padStart(3, "0")}` : null;
};

const SCENES: Record<string, SceneComponent> = {};
for (const group of [groupA, groupB, groupC, groupD, groupE, groupF]) {
  for (const [name, Comp] of Object.entries(group)) {
    const sceneId = keyOf(name);
    if (sceneId && typeof Comp === "function") {
      SCENES[sceneId] = Comp as SceneComponent;
    }
  }
}

/** total composition length from TIMING */
export const LIEU_HANH_FRAMES = TIMING.reduce(
  (acc, t) => Math.max(acc, t.startFrame + t.durationInFrames),
  0
);

export type EpisodeProps = {
  withMusic?: boolean;
  /** DRAFT-HUD: chỉ bật ở composition LieuHanhDraft (duyệt draft). Default OFF. */
  draftHud?: boolean;
};

export const LieuHanhEpisode: React.FC<EpisodeProps> = ({ withMusic = true, draftHud = false }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {TIMING.map((t) => {
        const Scene = SCENES[t.sceneId];
        if (!Scene) return null;
        return (
          <Sequence
            key={t.sceneId}
            from={t.startFrame}
            durationInFrames={t.durationInFrames}
            name={t.sceneId}
          >
            <AnchorProvider sectionId={t.sectionId} startFrame={t.startFrame}>
              <SceneDurProvider durationInFrames={t.durationInFrames}>
                <Scene durationInFrames={t.durationInFrames} />
              </SceneDurProvider>
            </AnchorProvider>
          </Sequence>
        );
      })}
      <Audio src={staticFile("lieu-hanh/narration_full.wav")} volume={1} />
      {withMusic ? (
        <Audio
          src={staticFile("lieu-hanh/background_music.mp3")}
          volume={(f) => {
            const fadeIn = Math.min(1, f / 30);
            const fadeOut = Math.min(1, (durationInFrames - f) / 90);
            return 0.32 * Math.min(fadeIn, fadeOut);
          }}
        />
      ) : null}
      {draftHud ? <DraftHud /> : null}
    </AbsoluteFill>
  );
};
