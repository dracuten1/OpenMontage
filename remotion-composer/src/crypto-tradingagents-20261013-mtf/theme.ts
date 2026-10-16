// theme.ts — crypto-tradingagents-20261013-mtf (VERTICAL 1080x1920 @30fps).
// Copied from approved sibling crypto-tradingagents-20261013 (same series).
// Palette dark-fintech-terminal per scene_plan metadata. SAFE = x 80..1000.
export const FPS = 30;

export const C = {
  bg: "#0D1117",
  surface: "#161B22",
  border: "rgba(240,246,252,0.14)",
  text: "#E6EDF3",
  textSoft: "rgba(230,237,243,0.82)",
  muted: "#8B949E",
  red: "#F85149",
  green: "#3FB950",
  amber: "#D29922",
  blue: "#58A6FF",
  redFill: "rgba(248,81,73,0.10)",
  greenFill: "rgba(63,185,80,0.10)",
  amberFill: "rgba(210,153,34,0.10)",
  blueFill: "rgba(88,166,255,0.10)",
};

export const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
export const MONO = "'JetBrains Mono', 'SF Mono', Consolas, 'Courier New', monospace";

export const SAFE = { x: 80, w: 920 }; // safe frame x 80..1000

export const SPRING = { damping: 14, mass: 0.9, stiffness: 110 } as const;

/** vi-VN number display: 83679.47 -> "83.679,47" (U+2212 minus). Deterministic
 *  string build — never depends on renderer ICU. */
export const fmtVi = (v: number, decimals = 0): string => {
  const neg = v < 0 ? "\u2212" : "";
  const a = Math.abs(v);
  const s = a.toFixed(decimals);
  const [i, d] = s.split(".");
  const grouped = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return neg + grouped + (d ? "," + d : "");
};
