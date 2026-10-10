// btc-tradingagents-20261008 — theme (atelier, VERTICAL 1080x1920 @30fps).
// Dark-fintech-terminal palette per scene_plan.metadata.palette; every number
// shown on screen comes from the digest whitelist (vi-VN grouping: 82.145,70).
export const FPS = 30;
export const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
export const MONO = "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Courier New', monospace";
export const SAFE = { x: 80, w: 920 };
export const SPRING = { damping: 18, mass: 1 };

export const C = {
  bg: "#0D1117",
  bgDeep: "#010409",
  surface: "#161B22",
  text: "#E6EDF3",
  textSoft: "#C9D1D9",
  muted: "#8B949E",
  border: "rgba(240,246,252,0.14)",
  red: "#F85149",
  green: "#3FB950",
  amber: "#D29922",
  blue: "#58A6FF",
  redFill: "rgba(248,81,73,0.14)",
  greenFill: "rgba(63,185,80,0.14)",
  amberFill: "rgba(210,153,34,0.14)",
  blueFill: "rgba(88,166,255,0.12)",
};

/** Deterministic vi-VN formatting: 82145.7 → "82.145,7"; -452.36 → "-452,36". */
export const fmtVi = (n: number, decimals = 0): string => {
  const neg = n < 0;
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, dec] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-" : "") + grouped + (dec ? "," + dec : "");
};
