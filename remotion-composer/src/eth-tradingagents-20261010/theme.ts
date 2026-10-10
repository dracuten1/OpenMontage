// eth-tradingagents-20261010 — dark-fintech terminal theme (series palette).
// Palette locked by scene_plan.metadata.palette (kế thừa btc08/eth09).
export const FPS = 30;

export const FONT =
  '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif';
export const MONO =
  'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace';

// Vertical safe frame: x 80..1000
export const SAFE = { x: 80, w: 920 };

export const SPRING = { damping: 14, mass: 0.8, stiffness: 110 };

export const C = {
  bg: "#0D1117",
  surface: "#161B22",
  border: "rgba(240,246,252,0.10)",
  text: "#E6EDF3",
  textSoft: "rgba(230,237,243,0.82)",
  muted: "#8B949E",
  red: "#F85149", // phe bán / gãy
  green: "#3FB950", // phe giữ / trụ
  amber: "#D29922", // cảnh báo / caveat
  blue: "#58A6FF", // số liệu / trung lập
  redFill: "rgba(248,81,73,0.10)",
  greenFill: "rgba(63,185,80,0.10)",
  amberFill: "rgba(210,153,34,0.10)",
  blueFill: "rgba(88,166,255,0.10)",
};

/** vi-VN number display: 2.471,91 / 81.676,34 / 6,2 */
export const fmtVi = (n: number, decimals = 0): string =>
  n.toLocaleString("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
