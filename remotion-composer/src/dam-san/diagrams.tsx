import React from "react";
import {
  D01Season3Callback,
  D02ThreeActs,
  D04DualReadings,
  D05MatrilinealChueNue,
  D06LonghouseBlueprint,
  D07ChamicLanguageMap,
  D08GongEnsembleChart,
} from "./diagrams/CulturalDiagrams";
import {
  D03TextualStratigraphy,
  D09PopulationSplit,
  D10KhoTangTreemap,
  D11SurveyParadox,
  D12HeritageTimeline,
} from "./diagrams/DataCharts";

export const DIAGRAMS: Record<string, React.FC> = {
  D01: D01Season3Callback,
  D02: D02ThreeActs,
  D03: D03TextualStratigraphy,
  D04: D04DualReadings,
  D05: D05MatrilinealChueNue,
  D06: D06LonghouseBlueprint,
  D07: D07ChamicLanguageMap,
  D08: D08GongEnsembleChart,
  D09: D09PopulationSplit,
  D10: D10KhoTangTreemap,
  D11: D11SurveyParadox,
  D12: D12HeritageTimeline,
};
