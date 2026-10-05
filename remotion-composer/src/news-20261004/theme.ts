// news-20261004 theme: dark editorial finance desk (clean-professional playbook, dark variant).
// All text colours below were chosen to pass WCAG AA (>= 4.5:1 body, >= 3:1 large) on BG / SURFACE.
// Use `contrastRatio(fg, bg)` in a scratch script if you introduce a new colour.
import { loadFont } from "@remotion/google-fonts/BeVietnamPro";

export const FPS = 30;
export const W = 1920;
export const H = 1080;

// Be Vietnam Pro ships a full Vietnamese subset. Loaded at import; Remotion waits for it.
const loaded = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["vietnamese", "latin", "latin-ext"],
});
export const FONT_FAMILY = loaded.fontFamily;
export const FONT = `${FONT_FAMILY}, "Noto Sans", "Helvetica Neue", Arial, sans-serif`;

export const C = {
  bg: "#0D1117", // dark slate (scene_plan)
  bgDeep: "#070A0F",
  surface: "#161B22", // cards
  surfaceHi: "#1F2630", // raised cards
  border: "#30363D",
  grid: "rgba(148,163,184,0.07)",

  text: "#F0F6FC", // 16.9:1 on bg
  textSoft: "#C9D4E0", // 11.6:1 on bg
  muted: "#9AA7B8", // 7.6:1 on bg (min for secondary text)

  // Accents (text-safe lighter tints; use *Fill variants for large shapes/bars)
  blue: "#60A5FA", // 7.4:1 on bg
  green: "#34D399", // 9.6:1 growth / positive
  red: "#F87171", // 6.6:1 warning / negative
  amber: "#FBBF24", // 11:1 caution / highlight
  violet: "#A78BFA", // 6.6:1 AI / insight

  blueFill: "#2563EB", // brand primary (shapes only; white text on it = 5.2:1)
  greenFill: "#10B981",
  redFill: "#EF4444",
  amberFill: "#F59E0B",
  violetFill: "#8B5CF6",
  onFill: "#FFFFFF",
  onAmber: "#0D1117", // dark text on amber/green fills
} as const;

export type Tone = "blue" | "green" | "red" | "amber" | "violet" | "neutral";
export const toneText = (t: Tone): string =>
  ({ blue: C.blue, green: C.green, red: C.red, amber: C.amber, violet: C.violet, neutral: C.text })[t];
export const toneFill = (t: Tone): string =>
  ({ blue: C.blueFill, green: C.greenFill, red: C.redFill, amber: C.amberFill, violet: C.violetFill, neutral: C.border })[t];

/** Safe layout, in px @1920x1080. Keep content inside; captions own the bottom band. */
export const SAFE = {
  left: 96,
  right: 96,
  top: 64,
  bottom: 200, // bottom 200px reserved for Captions + SourceTag
  contentW: W - 96 - 96,
  contentH: H - 64 - 200,
} as const;

/** Minimum sizes (px) at 1920x1080 for legibility on mobile. */
export const TYPE = { body: 36, label: 28, headline: 96, stat: 168, caption: 44 } as const;

/** Spring config for reveals (snappy, no bounce overshoot beyond ~3%). */
export const SPRING = { damping: 20, stiffness: 140, mass: 0.9 } as const;

// ---- WCAG helpers ----
const lin = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
export const contrastRatio = (fg: string, bg: string): number => {
  const a = lum(fg);
  const b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

/** Vietnamese number format: 1234.5 -> "1.234,5". */
export const fmtVi = (n: number, decimals = 0): string => {
  const neg = n < 0;
  const [i, d] = Math.abs(n).toFixed(decimals).split(".");
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-" : "") + int + (d ? "," + d : "");
};
