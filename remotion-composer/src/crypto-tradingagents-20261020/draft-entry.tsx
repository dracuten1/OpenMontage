import {registerRoot, Composition} from 'remotion';
import {FullDraft} from './FullDraft';
registerRoot(() => (
  <Composition id="Crypto1020Draft" component={FullDraft} durationInFrames={1350} fps={30} width={1080} height={1920} defaultProps={{debugHud: true}} />
));
