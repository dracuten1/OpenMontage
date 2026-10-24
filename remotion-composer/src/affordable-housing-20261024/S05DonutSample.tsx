/**
 * S05DonutSample — 720x1280 sample of the Scene 5 narration-sync window
 * (scene-local frames 700..1142, 443 frames ≈ 14.77s) covering all three
 * donut cues (seg1 @773, seg2 @930, seg3 @1097). Renders the full 1080x1920
 * scene content scaled to 720x1280; audio trimmed to the same window.
 */
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Scene5Infographics, Caption} from './Episode';
import {C, FONT} from './theme';

const SAMPLE_FROM = 700; // scene s05 local frame at sample frame 0
const SAMPLE_FRAMES = 443; // 700..1142 inclusive

const S05DonutSample: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, fontFamily: FONT, overflow: 'hidden'}}>
      <div
        style={{
          width: 1080,
          height: 1920,
          transform: 'scale(0.6666666666666666)',
          transformOrigin: '0 0',
        }}
      >
      {/* Voice: wav is aligned to scene start — trim 700 frames so sample
          frame 0 hears scene-local frame 700. Lives OUTSIDE the Sequence so
          the trim math stays simple. */}
      <Audio
        src={staticFile('affordable-housing-20261024/voice_s05.wav')}
        startFrom={SAMPLE_FROM}
        volume={1}
      />
      {/* Negative `from`: children see scene-local frame = parentFrame + 700
          (Sequence frame math is childFrame = parentFrame - from). The window
          parent 0..442 maps to scene-local 700..1142, covering all 3 cues. */}
      <Sequence from={-SAMPLE_FROM} durationInFrames={1143}>
        <Scene5Infographics s="s05" />
        <Caption s="s05" />
      </Sequence>
      </div>
    </AbsoluteFill>
  );
};

export default S05DonutSample;
