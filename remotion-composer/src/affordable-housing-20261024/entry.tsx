import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {AffordableHousingEpisode} from './Episode';
import {
  AffordableHousingThumbnail,
  AffordableHousingThumbnailLandscape,
} from './Thumbnail';
import {FPS, EPISODE_TOTAL_FRAMES} from './timing';

const Root: React.FC = () => {
  return (
    <>
      {/* Draft Composition with HUD diagnostic overlay */}
      <Composition
        id="AffordableHousingDraft"
        component={AffordableHousingEpisode}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={EPISODE_TOTAL_FRAMES}
        defaultProps={{hud: true}}
      />

      {/* Production Full Composition without HUD */}
      <Composition
        id="AffordableHousingFull"
        component={AffordableHousingEpisode}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={EPISODE_TOTAL_FRAMES}
        defaultProps={{hud: false}}
      />

      {/* Standalone Thumbnail Still Composition (Topic Hook: 60-70 tr/m2) */}
      <Composition
        id="AffordableHousingThumbnail"
        component={AffordableHousingThumbnail}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={1}
        defaultProps={{headlineType: 'topic'}}
      />

      {/* Standalone Thumbnail Still Composition (Salary Hook: Lương 50 triệu) */}
      <Composition
        id="AffordableHousingThumbnailSalary"
        component={AffordableHousingThumbnail}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={1}
        defaultProps={{headlineType: 'salary'}}
      />

      {/* Landscape Thumbnail for YouTube (1280x720) */}
      <Composition
        id="AffordableHousingThumbnailYouTube"
        component={AffordableHousingThumbnailLandscape}
        width={1280}
        height={720}
        fps={FPS}
        durationInFrames={1}
      />
    </>
  );
};

registerRoot(Root);
