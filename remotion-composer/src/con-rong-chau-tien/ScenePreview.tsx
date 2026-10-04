import React from "react";
import { AbsoluteFill } from "remotion";
import { SCENES } from "./registry";
import { SceneDurProvider } from "./common";
import { C, FONT } from "./theme";

export type ScenePreviewProps = {
  sceneId: string;
  durationInFrames: number;
};

export const ScenePreview: React.FC<ScenePreviewProps> = ({ sceneId, durationInFrames }) => {
  const Scene = SCENES[sceneId];
  if (!Scene) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: C.bg,
          color: C.warn,
          fontFamily: FONT.mono,
          fontSize: 48,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Unknown sceneId: {sceneId}
      </AbsoluteFill>
    );
  }
  return (
    <SceneDurProvider durationInFrames={durationInFrames}>
      <Scene durationInFrames={durationInFrames} />
    </SceneDurProvider>
  );
};
