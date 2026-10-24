// News daily 2026-10-20 — S1 demo theme. Restrained newsroom, static camera.
// Dark navy background, warm gold accents, clean system sans (offline-safe:
// no remote font fetch at render time — local/system stack only).
import type { SpringConfig } from "remotion";

export const C = {
  bgDeep: "#0a1428",
  bgGlow: "rgba(24, 44, 84, 0.55)",
  surface: "rgba(255, 255, 255, 0.04)",
  surfaceGold: "rgba(245, 196, 112, 0.10)",
  border: "rgba(255, 255, 255, 0.10)",
  borderGold: "rgba(245, 196, 112, 0.45)",
  text: "#f4f7fc",
  textSoft: "#a8b6cf",
  gold: "#f5c470",
  goldDeep: "#d9a441",
  ink: "#0a1428",
} as const;

export const FONT =
  '"Inter", "Helvetica Neue", "Segoe UI", "SF Pro Text", -apple-system, "Arial Unicode MS", sans-serif';

export const FONT_MONO =
  '"SF Mono", "Menlo", "Consolas", "Liberation Mono", monospace';

/** Subtle reveal — smooth, no bounce (newsroom restraint). */
export const SPRING_SMOOTH: Partial<SpringConfig> = { damping: 200 };
/** Snappy but calm for chips. */
export const SPRING_SNAPPY: Partial<SpringConfig> = { damping: 26, stiffness: 160 };
