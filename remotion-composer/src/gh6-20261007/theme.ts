// gh6-20261007 theme: GitHub-dark editorial, VERTICAL 1080x1920 (TikTok 9:16).
// Palette from scene_plan metadata: base #0D1117 / panel #161B22 · blue #58A6FF ·
// green #3FB950 · red #F85149 · amber #D29922 · text #E6EDF3. Safe area x 80-1000,
// core content y 400-1250; captions own the band below y 1500.
import { loadFont } from "@remotion/google-fonts/BeVietnamPro";

export const FPS = 30;
export const W = 1080;
export const H = 1920;

const loaded = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["vietnamese", "latin", "latin-ext"],
});
export const FONT_FAMILY = loaded.fontFamily;
export const FONT = `${FONT_FAMILY}, "Noto Sans", "Helvetica Neue", Arial, sans-serif`;
export const MONO = `"JetBrains Mono", "SFMono-Regular", ui-monospace, Menlo, monospace`;

export const C = {
  bg: "#0D1117",
  bgDeep: "#010409",
  surface: "#161B22",
  surfaceHi: "#21262D",
  border: "#30363D",
  grid: "rgba(139,148,158,0.08)",

  text: "#E6EDF3",
  textSoft: "#C9D1D9",
  muted: "#8B949E",

  blue: "#58A6FF",
  green: "#3FB950",
  red: "#F85149",
  amber: "#D29922",

  blueFill: "rgba(88,166,255,0.14)",
  greenFill: "rgba(63,185,80,0.14)",
  redFill: "rgba(248,81,73,0.14)",
  amberFill: "rgba(210,153,34,0.14)",
} as const;

/** Safe layout, in px @1080x1920. Content x 80..1000; captions own y > 1500. */
export const SAFE = {
  left: 80,
  right: 80,
  top: 260,
  bottom: 420,
  x: 80,
  w: 920,
} as const;

export const SPRING = { damping: 20, stiffness: 140, mass: 0.9 } as const;

/** Vietnamese number format: 1234.5 -> "1.234,5". */
export const fmtVi = (n: number, decimals = 0): string => {
  const neg = n < 0;
  const [i, d] = Math.abs(n).toFixed(decimals).split(".");
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-" : "") + int + (d ? "," + d : "");
};
