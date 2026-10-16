// theme.ts — crypto-tradingagents-20261015 (VERTICAL 1080x1920 @30fps).
// Dark-fintech-terminal palette per scene_plan.metadata.palette
// (#0D1117 bg / #161B22 panel / #E6EDF3 text / #F85149 red / #3FB950 green /
// #D29922 amber / #58A6FF blue / #8B949E gray). Series engine knowledge
// inherited from btc08/eth09/eth10/cta13/cta14 — reused mechanics, not look.
export const FPS = 30;
export const FONT = '"Inter", "Helvetica Neue", Arial, sans-serif';
export const MONO = '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace';
export const SAFE = { x: 80, w: 920 };

export const C = {
  bg: "#0D1117",
  surface: "#161B22",
  text: "#E6EDF3",
  muted: "#8B949E",
  red: "#F85149",
  green: "#3FB950",
  amber: "#D29922",
  blue: "#58A6FF",
  redFill: "rgba(248,81,73,0.14)",
  greenFill: "rgba(63,185,80,0.14)",
  amberFill: "rgba(210,153,34,0.14)",
  blueFill: "rgba(88,166,255,0.14)",
};

// vi-VN number display: 81682.01 -> "81.682,01"; minus = U+2212 (series style).
export const fmtVi = (v: number, dec = 0): string => {
  const neg = v < 0;
  const [int, frac] = Math.abs(v).toFixed(dec).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "\u2212" : "") + grouped + (frac ? "," + frac : "");
};
