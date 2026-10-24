import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {FranceRiotsFullV2} from './EpisodeFullV2';
import {FPS,TOTAL_FRAMES} from './timingV2';
const RootV2:React.FC=()=><><Composition id="FranceRiots20261023V2Debug" component={FranceRiotsFullV2} width={1080} height={1920} fps={FPS} durationInFrames={TOTAL_FRAMES}/><Composition id="FranceRiots20261023V2Final" component={FranceRiotsFullV2} width={1080} height={1920} fps={FPS} durationInFrames={TOTAL_FRAMES} defaultProps={{debug:false,showCaptions:false}}/></>;
registerRoot(RootV2);
