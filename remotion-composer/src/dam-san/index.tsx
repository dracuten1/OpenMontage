import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { FPS, SCENES, TOTAL_FRAMES } from "./timing";
import { GENERATED_SCENES } from "./scenes.gen";
import { ReviewCaptionLayer } from "./review-captions";
import { DraftHUD } from "./draft-hud";
import { C, EPISODE_SLUG } from "./theme";

export const DamSanFull: React.FC<{ showHud?: boolean; showCaptions?: boolean }> = ({
  showHud = false,
  showCaptions = false,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Audio src={staticFile(`${EPISODE_SLUG}/narration_full.wav`)} volume={1.0} />
      <Audio src={staticFile(`${EPISODE_SLUG}/background_music.mp3`)} volume={0.18} />

      {SCENES.map((t) => {
        const Comp = GENERATED_SCENES[t.scene];
        if (!Comp) return null;
        return (
          <Sequence
            key={t.id}
            from={t.start_frame}
            durationInFrames={t.frames}
            name={`${t.scene} (${t.id})`}
          >
            <Comp durationInFrames={t.frames} showHud={showHud} />
          </Sequence>
        );
      })}

      {showCaptions && <ReviewCaptionLayer />}
      {showHud && (
        <DraftHUD
          sceneId={EPISODE_SLUG}
          sectionId="full"
          durationInFrames={TOTAL_FRAMES}
          label="DRAFT — Sử thi Đăm Săn (S3E02)"
          layerTag="amber"
        />
      )}
    </AbsoluteFill>
  );
};

export const DamSanDraftHud: React.FC = () => <DamSanFull showHud showCaptions />;
export const DamSanPreview: React.FC = () => <DamSanFull showHud={false} showCaptions />;

export { FPS, TOTAL_FRAMES };
