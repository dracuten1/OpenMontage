// lieu-hanh (VN-Myth S2E04) — DEMO scene sc015 (HERO "trở về").
// Visual QC build: 1 scene duyệt, KHÔNG phải final. No audio slicing — demo là
// để duyệt hình: captions + panels + anchor reveals + HUD timeline + 2s tail.
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Sc015 } from "./scenes-b";
import { AnchorProvider, SceneDurProvider } from "./common";
import { TIMING } from "./timing";
import { DraftHud } from "./draft-hud";

const T0 = TIMING.find((t) => t.sceneId === "sc015");
if (!T0) throw new Error("sc015 missing from TIMING");
export const SC015 = T0;
const TAIL = 60; // 2s tail

export const LIEU_HANH_DEMO_FRAMES = SC015.durationInFrames + TAIL;

export const LieuHanhDemo: React.FC<{ draftHud?: boolean }> = ({ draftHud = true }) => (
  <AbsoluteFill style={{ backgroundColor: "#000000" }}>
    <Sequence from={0} durationInFrames={SC015.durationInFrames} name="sc015">
      <AnchorProvider sectionId={SC015.sectionId} startFrame={SC015.startFrame}>
        <SceneDurProvider durationInFrames={SC015.durationInFrames}>
          <Sc015 durationInFrames={SC015.durationInFrames} />
        </SceneDurProvider>
      </AnchorProvider>
    </Sequence>
    {draftHud ? <DraftHud frameOffset={SC015.startFrame} /> : null}
  </AbsoluteFill>
);
