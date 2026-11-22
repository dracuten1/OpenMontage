// Shared News Foundation theme tokens — Hybrid Broadcast Photojournalism × Swiss Edge-to-Edge Split + Safe Zone v3.2 SSOT
import { loadFont as loadBarlowCondensed } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadBeVietnam } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadPlusJakarta } from "@remotion/google-fonts/PlusJakartaSans";

let loaded = false;

/** Idempotently load Vietnamese-safe broadcast & Swiss editorial Google Fonts once per bundle. */
export function ensureFonts(): void {
  if (loaded) return;
  loadBarlowCondensed("normal", {
    weights: ["600", "700", "800", "900"],
    subsets: ["latin", "latin-ext", "vietnamese"],
  });
  loadPlusJakarta("normal", {
    weights: ["500", "600", "700", "800"],
    subsets: ["latin", "latin-ext", "vietnamese"],
  });
  loadBeVietnam("normal", {
    weights: ["400", "500", "600", "700", "800"],
    subsets: ["latin", "latin-ext", "vietnamese"],
  });
  loaded = true;
}

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const COLORS = {
  // Swiss Gallery & Broadcast Carbon canonical palette
  paper: "#F5F5F2",
  paperWarm: "#EAEAE5",
  surface: "#FFFFFF",
  surfaceAlt: "#EAEAE5",
  ink: "#0B0C0E",
  inkSoft: "#151821",
  text: "#0B0C0E",
  textOnDark: "#F5F5F2",
  muted: "#52565E",
  textMuted: "#52565E",
  mutedOnDark: "#A0A6B2",
  vermilion: "#E11D2E",
  crimson: "#E11D2E",
  accentRed: "#E11D2E",
  accent: "#E11D2E",
  highlighter: "#FFD100",
  highlightText: "#0B0C0E",
  ochre: "#FF5500",
  amber: "#FF5500",
  neonYellow: "#FFD100",
  ok: "#0D9488",
  cold: "#0052FF",
  ruleStrong: "#0B0C0E",
  line: "rgba(11, 12, 14, 0.16)",
  lineOnDark: "rgba(245, 245, 242, 0.18)",
  gridLine: "rgba(11, 12, 14, 0.045)",

  // Backward-compatible aliases (mapped to Swiss Gallery & Broadcast Carbon)
  slate: "#F5F5F2",
  panel: "#FFFFFF",
  panelDeep: "#EAEAE5",
  white: "#FFFFFF",
  glowRed: "transparent",
  glowAmber: "transparent",
} as const;

export const FONTS = {
  body: "'Plus Jakarta Sans', 'Be Vietnam Pro', system-ui, sans-serif",
  sans: "'Plus Jakarta Sans', 'Be Vietnam Pro', system-ui, sans-serif",
  display: "'Barlow Condensed', 'Be Vietnam Pro', sans-serif",
  heading: "'Barlow Condensed', 'Be Vietnam Pro', sans-serif",
  mono: "'Barlow Condensed', 'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif",
  kicker: "'Barlow Condensed', 'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif",
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
  titleMinFont: 58,
  titleMaxFont: 82,
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
