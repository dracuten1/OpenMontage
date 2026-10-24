// news-daily-20261019 theme: dark editorial finance desk, VERTICAL 1080x1920 (TikTok 9:16).
// Copied verbatim from news-daily-20261018 (same palette family as news-daily-20261017 /
// news-20261016 / news-20261015 / news-20261006, WCAG-checked tints); safe area: x 80-1000,
// y 260-1500; captions own y > 1500.
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

export const C = {
  bg: "#0D1117",
  bgDeep: "#070A0F",
  surface: "#161B22",
  surfaceHi: "#1F2630",
  border: "#30363D",
  grid: "rgba(148,163,184,0.07)",

  text: "#F0F6FC",
  textSoft: "#C9D4E0",
  muted: "#9AA7B8",

  blue: "#60A5FA",
  green: "#34D399",
  red: "#F87171",
  amber: "#FBBF24",
  gold: "#F5C470",
  violet: "#A78BFA",

  blueFill: "#2563EB",
  greenFill: "#10B981",
  redFill: "#EF4444",
  amberFill: "#F59E0B",
  violetFill: "#8B5CF6",
  onFill: "#FFFFFF",
  onAmber: "#0D1117",
} as const;

export type Tone = "blue" | "green" | "red" | "amber" | "gold" | "violet" | "neutral";
export const toneText = (t: Tone): string =>
  ({ blue: C.blue, green: C.green, red: C.red, amber: C.amber, gold: C.gold, violet: C.violet, neutral: C.text })[t];

/** Safe layout, in px @1080x1920. Keep content inside; captions own y > 1500. */
export const SAFE = {
  left: 80,
  right: 80,
  top: 260,
  bottom: 420, // y 1500 .. captions band below
  x: 80,
  w: 920, // content width 80..1000
} as const;

/** Minimum sizes (px) at 1080x1920 for legibility on mobile. */
export const TYPE = { body: 40, label: 30, headline: 62, stat: 104, caption: 42 } as const;

export const SPRING = { damping: 20, stiffness: 140, mass: 0.9 } as const;

/** Vietnamese number format: 1234.5 -> "1.234,5". */
export const fmtVi = (n: number, decimals = 0): string => {
  const neg = n < 0;
  const [i, d] = Math.abs(n).toFixed(decimals).split(".");
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-" : "") + int + (d ? "," + d : "");
};
