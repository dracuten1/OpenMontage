// case02 scene shell 03 — references its manifest-claimed tokens so
// single-token name binding resolves to the real declaration bodies
import React from "react";
import { BarChartCountUp } from "../lib/Charts";
import { SceneTitle } from "../lib/SceneShell";

export const Scene03: React.FC = () => {
  const chart = <BarChartCountUp />;
  const shell = <SceneTitle />;
  return <div>{chart}</div>;
};
