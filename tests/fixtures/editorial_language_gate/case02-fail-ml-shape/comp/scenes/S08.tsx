// case02 scene shell 08 — references its manifest-claimed tokens so
// single-token name binding resolves to the real declaration bodies
import React from "react";
import { HBarChartExclusive } from "../lib/Charts";
import { SceneTitle, StatChip } from "../lib/SceneShell";

export const Scene08: React.FC = () => {
  const chart = <HBarChartExclusive />;
  const shell = <SceneTitle, StatChip />;
  return <div>{chart}</div>;
};
