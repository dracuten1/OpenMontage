import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FranceRiotsFull} from './EpisodeFull';
import {FPS, EPISODE_TOTAL_FRAMES} from './timing';
const Root:React.FC=()=><>{[false,true].map(hud=><Composition key={String(hud)} id={hud?'FranceRiots20261023Debug':'FranceRiots20261023Full'} component={FranceRiotsFull} width={1080} height={1920} fps={FPS} durationInFrames={EPISODE_TOTAL_FRAMES} defaultProps={{hud}}/>)}</>;
registerRoot(Root);
