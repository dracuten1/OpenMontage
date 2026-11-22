// Shared News Foundation theme tokens — Warm Archival Print / Editorial Paper + Safe Zone v3.2 SSOT
import { loadFont as loadBeVietnam } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSourceSerif } from "@remotion/google-fonts/SourceSerif4";

let loaded = false;

/** Idempotently load Vietnamese-safe editorial Google Fonts once per bundle. */
export function ensureFonts(): void {
  if (loaded) return;
  loadSourceSerif("normal", {
    weights: ["600", "700", "800", "900"],
    subsets: ["latin", "latin-ext", "vietnamese"],
  });
  loadBeVietnam("normal", {
    weights: ["400", "500", "600", "700", "800"],
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
  // Warm Archival Print canonical palette
  paper: "#F4EFE6",
  paperWarm: "#ECE4D5",
  surface: "#FAF7F2",
  surfaceAlt: "#EFE8DB",
  ink: "#141413",
  text: "#141413",
  muted: "#5A554E",
  textMuted: "#5A554E",
  vermilion: "#C8281E",
  ochre: "#A87308",
  highlighter: "#F3D34A",
  highlightText: "#141413",
  ruleStrong: "#141413",

  // Backward-compatible aliases (mapped to Warm Archival Print so existing episodes render cleanly)
  slate: "#F4EFE6",
  panel: "#FAF7F2",
  panelDeep: "#EFE8DB",
  white: "#FAF7F2",
  crimson: "#C8281E",
  accentRed: "#C8281E",
  amber: "#A87308",
  neonYellow: "#A87308",
  accent: "#C8281E",
  ok: "#1F6E43",
  cold: "#1B5E7A",
  line: "rgba(20, 20, 19, 0.22)",
  gridLine: "rgba(20, 20, 19, 0.055)",
  glowRed: "transparent",
  glowAmber: "transparent",
} as const;

export const FONTS = {
  body: "'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif",
  sans: "'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif",
  display: "'Source Serif Four', 'Source Serif 4', 'Be Vietnam Pro', Georgia, serif",
  heading: "'Source Serif Four', 'Source Serif 4', 'Be Vietnam Pro', Georgia, serif",
  mono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
  kicker: "'JetBrains Mono', 'Be Vietnam Pro', monospace",
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
