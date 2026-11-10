// case01 single-file inline composition (xang-dau shape)
import { MixedChart, MixedCard } from "./lib/Mixed";
interface SecDef { id: 's1' | 's2' | 's3' | 's4'; start: number; dur: number }
const TIMING: SecDef[] = [
  { id: 's1', start: 0, dur: 200 },
  { id: 's2', start: 200, dur: 240 },
  { id: 's3', start: 440, dur: 220 },
  { id: 's4', start: 660, dur: 200 },
];
const BARS2 = barSlots({ from: 0, to: 24000, slots: 2 });
const GRID2_V = [21000, 22000, 23000, 24000];
GRID2_V.forEach((v) => v > 0);

const SceneS1 = () => <div>cutout scene</div>;
const SceneS2: React.FC = () => {
  return <div><MixedChart /><MixedCard /></div>;
};
const SceneS2Unused: React.FC = () => {
  const maxValue = 24000;
  const plotHeight = 420;
  const barH = (v: number) => (v / maxValue) * plotHeight;
  return <div style={{ height: barH(21000) }}>chart</div>;
};
const SceneS3 = () => <div>countup</div>;
const SceneS4 = () => <div>cta</div>;

const SCENES: Record<string, React.FC> = {
  s1: SceneS1,
  s2: SceneS2,
  s3: SceneS3,
  s4: SceneS4,
};
