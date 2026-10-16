// VN-Myth S2E01 "Sơn Tinh – Thủy Tinh: vì sao cuộc chiến không bao giờ kết thúc?" — episode assembly.
// One Sequence per scene from TIMING (generated from artifacts/scene_timing.json),
// each wrapped with AnchorProvider (speech-lock anchors) + SceneDurProvider.
// Audio: narration_full.wav @1.0; background_music.mp3 envelope 0→0.32 (30f ramp-in),
// hold 0.32, fade to 0 over the last 90 frames — interpolated on absolute frame.
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

/** total composition length from TIMING (28050 @ fps 30) */
export const SON_TINH_THUY_TINH_FRAMES = TIMING.reduce(
  (acc, t) => Math.max(acc, t.startFrame + t.durationInFrames),
  0
);

export type EpisodeProps = {
  withMusic?: boolean;
  /** d-011 DRAFT-HUD: chỉ bật ở composition SonTinhThuyTinhDraft (duyệt draft). Default OFF. */
  draftHud?: boolean;
};

export const SonTinhThuyTinhEpisode: React.FC<EpisodeProps> = ({ withMusic = true, draftHud = false }) => {
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
      {draftHud ? <DraftHud /> : null}
      <Audio src={staticFile("son-tinh-thuy-tinh/narration_full.wav")} volume={1} />
      {withMusic ? (
        <Audio
          src={staticFile("son-tinh-thuy-tinh/background_music.mp3")}
          volume={(f) => {
            // fade-in 0→0.32 over first 30 frames; hold 0.32; fade to 0 over last 90 frames
            const fadeIn = Math.min(1, f / 30);
            const fadeOut = Math.min(1, (durationInFrames - f) / 90);
            return 0.32 * Math.min(fadeIn, fadeOut);
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
