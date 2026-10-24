// News daily 2026-10-21 — theme. Restrained newsroom, static camera.
// Dark navy background, coral accents (NHẬN ĐỊNH shares coral, not gold),
// clean system sans (offline-safe: no remote font fetch at render time).
import type { SpringConfig } from "remotion";

export const C = {
  bgDeep: "#0F172A",
  surface: "rgba(255, 255, 255, 0.05)",
  border: "rgba(255, 255, 255, 0.12)",
  text: "#F8FAFC",
  textSoft: "#B9C4D6",
  coral: "#FF7F6E",
  coralDeep: "#E8654F",
  ink: "#0F172A",
  gold: "#F5C470", // s08 underline only
  surfaceCoral: "rgba(255, 127, 110, 0.07)",
  borderCoral: "rgba(255, 127, 110, 0.45)",
} as const;

export const FONT =
  '"Inter", "Helvetica Neue", "Segoe UI", "SF Pro Text", -apple-system, "Arial Unicode MS", sans-serif';

export const FONT_MONO =
  '"SF Mono", "Menlo", "Consolas", "Liberation Mono", monospace';

/** Subtle reveal — smooth, no bounce (newsroom restraint). */
export const SPRING_SMOOTH: Partial<SpringConfig> = { damping: 200 };
