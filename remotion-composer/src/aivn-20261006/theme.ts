// Theme for aivn-20261006: "AI 125B trên PC gaming cá nhân" (Qwen 3.8 Flash-Next + Strata)
// Clean-professional dark palette with high WCAG contrast and vivid tech accents.
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
export const MONO_FONT = `"JetBrains Mono", "Fira Code", Menlo, Monaco, Consolas, monospace`;

export const C = {
  bg: "#0B0F19", // deep slate navy
  bgDeep: "#05070E",
  surface: "#161E2E", // primary surface cards
  surfaceHi: "#1E293B", // elevated panels
  surfaceGlass: "rgba(22, 30, 46, 0.88)",
  border: "#334155", // slate border
  borderSubtle: "rgba(51, 65, 85, 0.6)",
  borderHi: "#475569",
  grid: "rgba(148, 163, 184, 0.05)",

  text: "#F8FAFC", // white
  textSoft: "#CBD5E1", // slate 300
  muted: "#94A3B8", // slate 400

  // Brand / Category accents
  blue: "#3B82F6", // primary accent light
  blueFill: "#2563EB", // vibrant blue
  emerald: "#34D399", // secondary accent light
  emeraldFill: "#10B981", // emerald green
  amber: "#FBBF24", // highlight / warning light
  amberFill: "#F59E0B", // amber gold
  red: "#F87171", // danger / alert light
  redFill: "#EF4444", // coral red
  purple: "#C084FC",
  purpleFill: "#8B5CF6",

  white: "#FFFFFF",
  cardShadow: "0 16px 36px -8px rgba(0, 0, 0, 0.7), 0 0 24px rgba(37, 99, 235, 0.08)",
  glowBlue: "rgba(37, 99, 235, 0.25)",
  glowEmerald: "rgba(16, 185, 129, 0.22)",
  glowAmber: "rgba(245, 158, 11, 0.22)",
} as const;

export type Tone = "blue" | "emerald" | "amber" | "red" | "purple" | "neutral";

export const toneText = (t: Tone): string => {
  switch (t) {
    case "blue":
      return C.blue;
    case "emerald":
      return C.emerald;
    case "amber":
      return C.amber;
    case "red":
      return C.red;
    case "purple":
      return C.purple;
    default:
      return C.text;
  }
};

export const toneFill = (t: Tone): string => {
  switch (t) {
    case "blue":
      return C.blueFill;
    case "emerald":
      return C.emeraldFill;
    case "amber":
      return C.amberFill;
    case "red":
      return C.redFill;
    case "purple":
      return C.purpleFill;
    default:
      return C.borderHi;
  }
};

export const SAFE = {
  left: 96,
  right: 96,
  top: 64,
  bottom: 190, // reserved for Captions
  contentW: W - 96 - 96,
  contentH: H - 64 - 190,
} as const;

export const TYPE = {
  body: 32,
  label: 24,
  headline: 82,
  stat: 140,
  caption: 40,
} as const;

export const SPRING = { damping: 18, stiffness: 130, mass: 0.9 } as const;

/** Vietnamese number format: 12499 -> "12.499", 62.5 -> "62,5". */
export const fmtVi = (n: number, decimals = 0): string => {
  const neg = n < 0;
  const [i, d] = Math.abs(n).toFixed(decimals).split(".");
  const withDots = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const res = d !== undefined && decimals > 0 ? `${withDots},${d}` : withDots;
  return neg ? `-${res}` : res;
};
