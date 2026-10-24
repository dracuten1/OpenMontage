import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {VietjetFull} from './EpisodeFull';
import {VietjetFullV2} from './EpisodeFullV2';
import {FPS, EPISODE_TOTAL_FRAMES} from './timing';

const Root: React.FC = () => (
  <>
    {[false, true].map((hud) => (
      <Composition
        key={String(hud)}
        id={hud ? 'Vietjet20261023Debug' : 'Vietjet20261023Full'}
        component={VietjetFull}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={EPISODE_TOTAL_FRAMES}
        defaultProps={{hud}}
      />
    ))}
    {[false, true].map((hud) => (
      <Composition
        key={'v2' + String(hud)}
        id={hud ? 'Vietjet20261023V2Debug' : 'Vietjet20261023V2Full'}
        component={VietjetFullV2}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={EPISODE_TOTAL_FRAMES}
        defaultProps={{hud}}
      />
    ))}
  </>
);
registerRoot(Root);
