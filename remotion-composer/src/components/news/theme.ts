// Shared News Foundation theme tokens — Safe Zone v3.2 SSOT
import { loadFont as loadBeVietnam } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";

let loaded = false;

/** Idempotently load Vietnamese-safe editorial Google Fonts once per bundle. */
export function ensureFonts(): void {
  if (loaded) return;
  loadBeVietnam("normal", {
    weights: ["400", "500", "600", "700", "800"],
    subsets: ["latin", "latin-ext", "vietnamese"],
  });
  loadSpaceGrotesk("normal", {
    weights: ["500", "700"],
    subsets: ["latin", "latin-ext", "vietnamese"],
  });
  loadMono("normal", {
    weights: ["400", "600", "700", "800"],
    subsets: ["latin", "latin-ext", "vietnamese"],
  });
  loaded = true;
}

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const COLORS = {
  slate: "#12161F",
  panel: "rgba(24, 30, 40, 0.92)",
  panelDeep: "rgba(14, 18, 26, 0.90)",
  ink: "#0B0E14",
  paper: "#F8F9FA",
  text: "#F8F9FA",
  white: "#FFFFFF",
  muted: "#B4BFCC",
  textMuted: "#B4BFCC",
  crimson: "#D90429",
  accentRed: "#D90429",
  amber: "#FFBE0B",
  neonYellow: "#F7C204",
  accent: "#FFBE0B",
  ok: "#7CE38B",
  cold: "#38BDF8",
  line: "rgba(216, 222, 232, 0.24)",
  gridLine: "rgba(216, 222, 232, 0.07)",
  glowRed: "rgba(217, 4, 41, 0.45)",
  glowAmber: "rgba(255, 190, 11, 0.42)",
} as const;

export const FONTS = {
  body: "'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif",
  sans: "'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif",
  display: "'Be Vietnam Pro', 'Space Grotesk', system-ui, sans-serif",
  heading: "'Be Vietnam Pro', 'Space Grotesk', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
  kicker: "'JetBrains Mono', 'Space Grotesk', monospace",
} as const;

/**
 * Safe zone 9:16 (TikTok Safe Zone v3.2):
 * - Top kicker y=250 (>=240)
 * - Content band y=350..1420 (height 1070px; final block settles inside y=1300..1420)
 * - Subtitles bottom band y=1480..1600 (gap >=60px below content band)
 * - Right rail >=140px (x <= 940) -> left=90, width=850 (or left=60, width=880)
 */
export const SAFE = {
  kickerTop: 250,
  cardTop: 350,
  cardBottom: 1420,
  subTop: 1480,
  subBottom: 1600,
  deadZone: 1440,
  margin: 90,
  railRight: 140,
  maxW: 850,
  titleMaxWidth: 850,
  titleMinFont: 56,
  titleMaxFont: 78,
  minFont: 24,
  minLabel: 27,
} as const;

/** Safe zone constants for 16:9 (1920x1080) news variants. */
export const SAFE_16X9 = {
  width: 1920,
  height: 1080,
  marginX: 96,
  marginY: 54,
  kickerTop: 64,
  contentTop: 140,
  contentBottom: 910,
  subTop: 940,
  subBottom: 1030,
  maxW: 1728,
  subMaxW: 1600,
  minFont: 24,
} as const;

/** Damped editorial motion presets (damping >= 16; no bouncy springs). */
export const MOTION = {
  pop: { damping: 16, stiffness: 120, mass: 1 },
  settle: { damping: 20, stiffness: 140, mass: 1 },
  kenBurns: { from: 1.0, to: 1.1 },
  camera: { from: 1.0, to: 1.08 },
  fadeFrames: 12,
  settleFrames: 14,
} as const;
