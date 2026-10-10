// eth-tradingagents-20261009 — dark-fintech terminal theme (series genome of
// btc-tradingagents-20261008, palette from scene_plan.json metadata).
export const FPS = 30;

export const C = {
  bg: "#0D1117",
  surface: "#161B22",
  panel: "rgba(22,27,34,0.72)",
  text: "#E6EDF3",
  textSoft: "rgba(230,237,243,0.82)",
  muted: "#8B949E",
  border: "rgba(240,246,252,0.14)",
  red: "#F85149",
  green: "#3FB950",
  amber: "#D29922",
  blue: "#58A6FF",
  redFill: "rgba(248,81,73,0.10)",
  greenFill: "rgba(63,185,80,0.10)",
  amberFill: "rgba(210,153,34,0.10)",
  blueFill: "rgba(88,166,255,0.10)",
};

export const FONT =
  '-apple-system, "Segoe UI", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif';
export const MONO =
  'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

// Safe frame x 80..1000 (plan), 1080 wide.
export const SAFE = { x: 80, w: 920 };

export const SPRING = { damping: 14, stiffness: 130, mass: 0.7 };

/** vi-VN number display: 2471.91 -> "2.471,91". Deterministic (no locale). */
export const fmtVi = (n: number, decimals = 0): string => {
  const neg = n < 0;
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, dec] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "−" : ""}${grouped}${dec ? `,${dec}` : ""}`;
};
