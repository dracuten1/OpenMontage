// Theme for aivn-20261005: "Pacific Divide"
// Editorial contrast: US caution amber/red telemetry vs Vietnam growth cyan/emerald.
// Dark slate base (#0B0F19), crisp text (#F8FAFC), WCAG AAA contrast compliant.
import { loadFont } from "@remotion/google-fonts/BeVietnamPro";

export const FPS = 30;
export const W = 1920;
export const H = 1080;

const loaded = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["vietnamese", "latin", "latin-ext"],
});
export const FONT_FAMILY = loaded.fontFamily;
export const FONT = `${FONT_FAMILY}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

export const C = {
  bg: "#0B0F19", // dark slate
  bgDeep: "#05070E",
  surface: "#111827", // primary card surface
  surfaceHi: "#1E293B", // elevated card / panel
  surfaceGlass: "rgba(17, 24, 39, 0.85)",
  border: "#1E293B",
  borderHi: "#334155",
  grid: "rgba(148, 163, 184, 0.06)",

  text: "#F8FAFC", // 17.5:1 on bg
  textSoft: "#CBD5E1", // 12.2:1 on bg
  muted: "#94A3B8", // 7.1:1 on bg (high contrast secondary)

  // Pacific divide color system
  // Vietnam growth palette
  cyan: "#22D3EE", // 10.4:1 on bg (text-safe)
  cyanFill: "#06B6D4",
  emerald: "#34D399", // 11.2:1 on bg
  emeraldFill: "#10B981",

  // US caution / safety frontier palette
  amber: "#FBBF24", // 11.8:1 on bg
  amberFill: "#F59E0B",
  red: "#F87171", // 7.2:1 on bg
  redFill: "#EF4444",

  // Neutral / system accents
  blue: "#60A5FA",
  blueFill: "#2563EB",
  purple: "#C084FC",
  purpleFill: "#8B5CF6",

  white: "#FFFFFF",
  cardShadow: "0 16px 36px -8px rgba(0, 0, 0, 0.65)",
} as const;

export type Tone = "cyan" | "emerald" | "amber" | "red" | "blue" | "purple" | "neutral";

export const toneText = (t: Tone): string =>
  ({
    cyan: C.cyan,
    emerald: C.emerald,
    amber: C.amber,
    red: C.red,
    blue: C.blue,
    purple: C.purple,
    neutral: C.text,
  })[t];

export const toneFill = (t: Tone): string =>
  ({
    cyan: C.cyanFill,
    emerald: C.emeraldFill,
    amber: C.amberFill,
    red: C.redFill,
    blue: C.blueFill,
    purple: C.purpleFill,
    neutral: C.borderHi,
  })[t];

export const SAFE = {
  left: 96,
  right: 96,
  top: 64,
  bottom: 190, // reserved for Captions
  contentW: W - 96 - 96,
  contentH: H - 64 - 190,
} as const;

export const TYPE = {
  body: 34,
  label: 26,
  headline: 90,
  stat: 160,
  caption: 42,
} as const;

export const SPRING = { damping: 20, stiffness: 140, mass: 0.9 } as const;

/** Vietnamese number format: 1234.5 -> "1.234,5". */
export const fmtVi = (n: number, decimals = 0): string => {
  const neg = n < 0;
  const [i, d] = Math.abs(n).toFixed(decimals).split(".");
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-" : "") + int + (d !== undefined ? "," + d : "");
};
