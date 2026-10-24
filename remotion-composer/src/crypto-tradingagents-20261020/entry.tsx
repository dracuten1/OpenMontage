import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Demo} from './Demo';

registerRoot(() => (
  <Composition
    id="Crypto1020Demo"
    component={Demo}
    durationInFrames={800}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{debugHud: true}}
  />
));
