import React, { createContext, useContext } from "react";
import { loadFont as loadBarlowCondensed } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadBeVietnam } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadPlayfairDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadPlusJakarta } from "@remotion/google-fonts/PlusJakartaSans";

export interface SpringCfg {
  damping: number;
  stiffness: number;
  mass: number;
}

export interface ChannelColors {
  paper: string;
  paperWarm: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  text: string;
  textOnDark: string;
  muted: string;
  textMuted: string;
  mutedOnDark: string;
  vermilion: string;
  crimson: string;
  accentRed: string;
  accent: string;
  highlighter: string;
  highlightText: string;
  ochre: string;
  amber: string;
  neonYellow: string;
  ok: string;
  cold: string;
  ruleStrong: string;
  line: string;
  lineOnDark: string;
  gridLine: string;
  slate: string;
  panel: string;
  panelDeep: string;
  white: string;
  glowRed: string;
  glowAmber: string;
  layerA: string;
  layerB: string;
  layerC: string;
  captionText: string;
  captionHighlight: string;
  card: string;
  border: string;
  cream: string;
}

export interface ChannelFonts {
  body: string;
  sans: string;
  display: string;
  heading: string;
  mono: string;
  kicker: string;
}

export interface ChannelSafeZone {
  kickerTop: number;
  cardTop: number;
  cardBottom: number;
  subTop: number;
  subBottom: number;
  subLeft: number;
  subWidth: number;
  deadZone: number;
  margin: number;
  railRight: number;
  maxW: number;
  titleMaxWidth: number;
  titleMinFont: number;
  titleMaxFont: number;
  minFont: number;
  minLabel: number;
}

export interface ChannelMotion {
  pop: SpringCfg;
  settle: SpringCfg;
  kenBurns: { from: number; to: number };
  camera: { from: number; to: number };
  fadeFrames: number;
  settleFrames: number;
}

export interface ChannelBackdrop {
  style: "swiss-broadcast" | "archival-diorama" | "clean-minimal";
  mastheadHeight: number;
  lowerThirdTop: number;
  grainTextures: readonly string[];
}

export interface ChannelBumper {
  enabled: boolean;
  frames: number;
  video9x16: string | null;
  video16x9: string | null;
  sting: string | null;
  stingVolume: number;
}

export interface ChannelTheme {
  id: string;
  name: string;
  platform: "tiktok" | "youtube" | "reels" | "shorts" | "custom";
  canvas: { width: number; height: number; fps: number };
  colors: ChannelColors;
  fonts: ChannelFonts;
  safe: ChannelSafeZone;
  motion: ChannelMotion;
  backdrop: ChannelBackdrop;
  bumper: ChannelBumper;
  ensureFonts: () => void;
  waitForFonts: () => Promise<void>;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (...args: never[]) => unknown
    ? T[K]
    : T[K] extends readonly unknown[]
      ? T[K]
      : T[K] extends object
        ? DeepPartial<T[K]>
        : T[K];
};

function trackFontLoad(handle: unknown, promises: Promise<unknown>[]): void {
  if (
    handle &&
    typeof handle === "object" &&
    "waitUntilDone" in handle &&
    typeof (handle as { waitUntilDone?: () => Promise<unknown> }).waitUntilDone === "function"
  ) {
    promises.push((handle as { waitUntilDone: () => Promise<unknown> }).waitUntilDone());
  }
}

let swissFontsLoaded = false;
const swissFontPromises: Promise<unknown>[] = [];

export function ensureSwissBroadcastFonts(): void {
  if (swissFontsLoaded) return;
  swissFontsLoaded = true;
  trackFontLoad(
    loadBarlowCondensed("normal", {
      weights: ["600", "700", "800", "900"],
      subsets: ["latin", "latin-ext", "vietnamese"],
    }),
    swissFontPromises,
  );
  trackFontLoad(
    loadPlusJakarta("normal", {
      weights: ["500", "600", "700", "800"],
      subsets: ["latin", "latin-ext", "vietnamese"],
    }),
    swissFontPromises,
  );
  trackFontLoad(
    loadBeVietnam("normal", {
      weights: ["400", "500", "600", "700", "800"],
      subsets: ["latin", "latin-ext", "vietnamese"],
    }),
    swissFontPromises,
  );
}

export async function waitForSwissBroadcastFonts(): Promise<void> {
  ensureSwissBroadcastFonts();
  await Promise.all(swissFontPromises);
  if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}

let dioramaFontsLoaded = false;
const dioramaFontPromises: Promise<unknown>[] = [];

export function ensureDioramaFonts(): void {
  if (dioramaFontsLoaded) return;
  dioramaFontsLoaded = true;
  trackFontLoad(
    loadPlayfairDisplay("normal", {
      weights: ["600", "700", "800", "900"],
      subsets: ["latin", "vietnamese"],
    }),
    dioramaFontPromises,
  );
  trackFontLoad(
    loadBeVietnam("normal", {
      weights: ["400", "500", "600", "700", "800"],
      subsets: ["latin", "latin-ext", "vietnamese"],
    }),
    dioramaFontPromises,
  );
  trackFontLoad(
    loadJetBrainsMono("normal", {
      weights: ["400", "600", "700"],
      subsets: ["latin", "vietnamese"],
    }),
    dioramaFontPromises,
  );
}

export async function waitForDioramaFonts(): Promise<void> {
  ensureDioramaFonts();
  await Promise.all(dioramaFontPromises);
  if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}

let minimalFontsLoaded = false;
const minimalFontPromises: Promise<unknown>[] = [];

export function ensureMinimalFonts(): void {
  if (minimalFontsLoaded) return;
  minimalFontsLoaded = true;
  trackFontLoad(
    loadInter("normal", {
      weights: ["400", "500", "600", "700", "800"],
      subsets: ["latin", "latin-ext", "vietnamese"],
    }),
    minimalFontPromises,
  );
  trackFontLoad(
    loadJetBrainsMono("normal", {
      weights: ["400", "600", "700"],
      subsets: ["latin"],
    }),
    minimalFontPromises,
  );
}

export async function waitForMinimalFonts(): Promise<void> {
  ensureMinimalFonts();
  await Promise.all(minimalFontPromises);
  if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}

export const DEFAULT_GRAIN_TEXTURES = [
  "textures/film_grain_1.png",
  "textures/film_grain_2.png",
  "textures/film_grain_3.png",
] as const;

export const BASE_PRESETS: Record<
  "swiss-broadcast" | "archival-diorama" | "clean-minimal",
  ChannelTheme
> = {
  "swiss-broadcast": {
    id: "swiss-broadcast",
    name: "Swiss Broadcast",
    platform: "tiktok",
    canvas: { width: 1080, height: 1920, fps: 30 },
    colors: {
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
      slate: "#F5F5F2",
      panel: "#FFFFFF",
      panelDeep: "#EAEAE5",
      white: "#FFFFFF",
      glowRed: "transparent",
      glowAmber: "transparent",
      layerA: "#E11D2E",
      layerB: "#0052FF",
      layerC: "#FFD100",
      captionText: "#FFFFFF",
      captionHighlight: "#FFD100",
      card: "#FFFFFF",
      border: "rgba(11, 12, 14, 0.16)",
      cream: "#EAEAE5",
    },
    fonts: {
      body: "'Plus Jakarta Sans', 'Be Vietnam Pro', system-ui, sans-serif",
      sans: "'Plus Jakarta Sans', 'Be Vietnam Pro', system-ui, sans-serif",
      display: "'Barlow Condensed', 'Be Vietnam Pro', sans-serif",
      heading: "'Barlow Condensed', 'Be Vietnam Pro', sans-serif",
      mono: "'Barlow Condensed', 'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif",
      kicker: "'Barlow Condensed', 'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif",
    },
    safe: {
      kickerTop: 250,
      cardTop: 350,
      cardBottom: 1420,
      subTop: 1480,
      subBottom: 1600,
      subLeft: 60,
      subWidth: 880,
      deadZone: 1440,
      margin: 90,
      railRight: 140,
      maxW: 850,
      titleMaxWidth: 850,
      titleMinFont: 58,
      titleMaxFont: 82,
      minFont: 24,
      minLabel: 27,
    },
    motion: {
      pop: { damping: 16, stiffness: 120, mass: 1 },
      settle: { damping: 20, stiffness: 140, mass: 1 },
      kenBurns: { from: 1.0, to: 1.1 },
      camera: { from: 1.0, to: 1.08 },
      fadeFrames: 12,
      settleFrames: 14,
    },
    backdrop: {
      style: "swiss-broadcast",
      mastheadHeight: 332,
      lowerThirdTop: 1444,
      grainTextures: DEFAULT_GRAIN_TEXTURES,
    },
    bumper: {
      enabled: false,
      frames: 90,
      video9x16: null,
      video16x9: null,
      sting: null,
      stingVolume: 0.55,
    },
    ensureFonts: ensureSwissBroadcastFonts,
    waitForFonts: waitForSwissBroadcastFonts,
  },
  "archival-diorama": {
    id: "archival-diorama",
    name: "Archival Diorama",
    platform: "youtube",
    canvas: { width: 1920, height: 1080, fps: 30 },
    colors: {
      paper: "#F2EAD8",
      paperWarm: "#EDE2CE",
      surface: "#251D18",
      surfaceAlt: "#1A1512",
      ink: "#1A1512",
      inkSoft: "#221914",
      text: "#221914",
      textOnDark: "#FAF5EB",
      muted: "#594336",
      textMuted: "#594336",
      mutedOnDark: "#96897B",
      vermilion: "#9E3B24",
      crimson: "#C95439",
      accentRed: "#9E3B24",
      accent: "#D49B38",
      highlighter: "#D49B38",
      highlightText: "#100C0A",
      ochre: "#C76B3E",
      amber: "#D49B38",
      neonYellow: "#D49B38",
      ok: "#38665E",
      cold: "#659C92",
      ruleStrong: "#6B4226",
      line: "rgba(107, 66, 38, 0.28)",
      lineOnDark: "rgba(237, 226, 206, 0.22)",
      gridLine: "rgba(107, 66, 38, 0.08)",
      slate: "#1A1512",
      panel: "#251D18",
      panelDeep: "#100C0A",
      white: "#FAF5EB",
      glowRed: "transparent",
      glowAmber: "transparent",
      layerA: "#9E3B24",
      layerB: "#38665E",
      layerC: "#D49B38",
      captionText: "#FAF5EB",
      captionHighlight: "#D49B38",
      card: "#251D18",
      border: "#6B4226",
      cream: "#EDE2CE",
    },
    fonts: {
      body: '"Be Vietnam Pro", "Noto Sans", "Helvetica Neue", Arial, sans-serif',
      sans: '"Be Vietnam Pro", "Noto Sans", "Helvetica Neue", Arial, sans-serif',
      display: '"Playfair Display", "Noto Serif", Georgia, serif',
      heading: '"Playfair Display", "Noto Serif", Georgia, serif',
      mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
      kicker: '"JetBrains Mono", "SF Mono", Menlo, monospace',
    },
    safe: {
      kickerTop: 64,
      cardTop: 140,
      cardBottom: 910,
      subTop: 940,
      subBottom: 1030,
      subLeft: 160,
      subWidth: 1600,
      deadZone: 940,
      margin: 96,
      railRight: 96,
      maxW: 1728,
      titleMaxWidth: 1440,
      titleMinFont: 48,
      titleMaxFont: 76,
      minFont: 24,
      minLabel: 24,
    },
    motion: {
      pop: { damping: 18, stiffness: 120, mass: 1 },
      settle: { damping: 22, stiffness: 130, mass: 1 },
      kenBurns: { from: 1.03, to: 1.12 },
      camera: { from: 1.0, to: 1.08 },
      fadeFrames: 18,
      settleFrames: 20,
    },
    backdrop: {
      style: "archival-diorama",
      mastheadHeight: 0,
      lowerThirdTop: 940,
      grainTextures: DEFAULT_GRAIN_TEXTURES,
    },
    bumper: {
      enabled: false,
      frames: 0,
      video9x16: null,
      video16x9: null,
      sting: null,
      stingVolume: 0.55,
    },
    ensureFonts: ensureDioramaFonts,
    waitForFonts: waitForDioramaFonts,
  },
  "clean-minimal": {
    id: "clean-minimal",
    name: "Clean Minimal",
    platform: "youtube",
    canvas: { width: 1920, height: 1080, fps: 30 },
    colors: {
      paper: "#FAFAFA",
      paperWarm: "#F4F4F5",
      surface: "#FFFFFF",
      surfaceAlt: "#F4F4F5",
      ink: "#111827",
      inkSoft: "#1F2937",
      text: "#111827",
      textOnDark: "#F9FAFB",
      muted: "#6B7280",
      textMuted: "#6B7280",
      mutedOnDark: "#9CA3AF",
      vermilion: "#2563EB",
      crimson: "#DC2626",
      accentRed: "#DC2626",
      accent: "#2563EB",
      highlighter: "#F59E0B",
      highlightText: "#111827",
      ochre: "#F59E0B",
      amber: "#F59E0B",
      neonYellow: "#F59E0B",
      ok: "#10B981",
      cold: "#2563EB",
      ruleStrong: "#111827",
      line: "rgba(17, 24, 39, 0.14)",
      lineOnDark: "rgba(249, 250, 251, 0.18)",
      gridLine: "rgba(17, 24, 39, 0.04)",
      slate: "#FAFAFA",
      panel: "#FFFFFF",
      panelDeep: "#F4F4F5",
      white: "#FFFFFF",
      glowRed: "transparent",
      glowAmber: "transparent",
      layerA: "#2563EB",
      layerB: "#10B981",
      layerC: "#F59E0B",
      captionText: "#FFFFFF",
      captionHighlight: "#F59E0B",
      card: "#FFFFFF",
      border: "rgba(17, 24, 39, 0.14)",
      cream: "#F4F4F5",
    },
    fonts: {
      body: "'Inter', system-ui, sans-serif",
      sans: "'Inter', system-ui, sans-serif",
      display: "'Inter', system-ui, sans-serif",
      heading: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
      kicker: "'Inter', system-ui, sans-serif",
    },
    safe: {
      kickerTop: 64,
      cardTop: 140,
      cardBottom: 910,
      subTop: 940,
      subBottom: 1030,
      subLeft: 160,
      subWidth: 1600,
      deadZone: 940,
      margin: 96,
      railRight: 96,
      maxW: 1728,
      titleMaxWidth: 1440,
      titleMinFont: 48,
      titleMaxFont: 76,
      minFont: 24,
      minLabel: 24,
    },
    motion: {
      pop: { damping: 20, stiffness: 120, mass: 1 },
      settle: { damping: 22, stiffness: 140, mass: 1 },
      kenBurns: { from: 1.0, to: 1.08 },
      camera: { from: 1.0, to: 1.06 },
      fadeFrames: 12,
      settleFrames: 14,
    },
    backdrop: {
      style: "clean-minimal",
      mastheadHeight: 0,
      lowerThirdTop: 940,
      grainTextures: DEFAULT_GRAIN_TEXTURES,
    },
    bumper: {
      enabled: false,
      frames: 0,
      video9x16: null,
      video16x9: null,
      sting: null,
      stingVolume: 0.55,
    },
    ensureFonts: ensureMinimalFonts,
    waitForFonts: waitForMinimalFonts,
  },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  overrides?: DeepPartial<T>,
): T {
  if (!overrides) return { ...base };
  const result: Record<string, unknown> = { ...base };
  for (const [key, val] of Object.entries(overrides)) {
    if (val === undefined) continue;
    const baseVal = result[key];
    if (isPlainObject(baseVal) && isPlainObject(val)) {
      result[key] = deepMerge(baseVal, val as DeepPartial<Record<string, unknown>>);
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

export function createChannelTheme(
  basePreset: keyof typeof BASE_PRESETS,
  overrides: DeepPartial<ChannelTheme>,
): ChannelTheme {
  const base = BASE_PRESETS[basePreset];
  return deepMerge(
    base as unknown as Record<string, unknown>,
    overrides as unknown as DeepPartial<Record<string, unknown>>,
  ) as unknown as ChannelTheme;
}

export const ChannelThemeContext = createContext<ChannelTheme>(
  BASE_PRESETS["swiss-broadcast"],
);

export const ChannelThemeProvider: React.FC<{
  theme: ChannelTheme;
  children: React.ReactNode;
}> = ({ theme, children }) =>
  React.createElement(ChannelThemeContext.Provider, { value: theme }, children);

export function useChannelTheme(): ChannelTheme {
  return useContext(ChannelThemeContext);
}
