// Shared color utilities — text ink must co-vary with the surface it is
// painted on (WCAG-driven; see tests/contracts/test_theme_text_contrast_contract.py).
//
// Two failure classes motivated these helpers (both measured in the
// eth/btc-tradingagents-20261003 renders):
//   1. Accent inks that pass on dark surfaces but fail on light ones
//      (#F59E0B 1.8-2.1:1, #10B981 2.3-2.4:1 on light cards).
//   2. Neutral text tokens paired with the wrong surface polarity
//      (#F1F5F9 on light, #1F2937 on dark -> 1.0-1.4:1, invisible).

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

export function isLightColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// Only #RGB / #RRGGBB count as knowable opaque surfaces. Anything else —
// "transparent", rgb()/rgba() strings, named colors, undefined — has a
// luminance we cannot reason about, so ink helpers must keep the authored
// ink (mirrors Explainer's 'unknowable backdrop' rule for media). Without
// this guard, hexToRgb("transparent") -> NaN -> 0,0,0, classifying a
// transparent page as BLACK and flipping already-correct dark titles to
// light ink over light gradients (~1.05:1).
export function isOpaqueHex(color: string): boolean {
  return typeof color === "string" && /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(color);
}

/** WCAG 2.x contrast ratio between two opaque hex colors. */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const lin = (c: number) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const l1 = lum(a);
  const l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Light-surface text-safe variants for accent inks whose dark-surface use
// passes (9:1) but whose light-surface use fails (<3:1). Verified ratios on
// #F9FAFB / #EAECF3: #F59E0B -> #B45309 gives 4.2-4.8:1; #10B981 -> #047857
// gives 5.2:1. Dark surfaces keep the original ink (unchanged 8-9:1).
const LIGHT_SURFACE_INKS: Record<string, string> = {
  "#F59E0B": "#B45309", // amber-500 -> amber-700
  "#10B981": "#047857", // emerald-500 -> emerald-700
};

export function lightSurfaceInk(ink: string): string {
  return LIGHT_SURFACE_INKS[ink.toUpperCase()] ?? ink;
}

// Lookup misses are how this defect class recurs: an accent that passes on
// dark surfaces silently renders sub-3:1 on light ones. Warn once per ink.
const warnedInks = new Set<string>();

/** Accent ink safe for the surface it will be painted on (text use only). */
export function inkOnSurface(ink: string, surface: string): string {
  if (!isOpaqueHex(surface) || !isLightColor(surface)) {
    return ink;
  }
  const mapped = LIGHT_SURFACE_INKS[ink.toUpperCase()];
  if (mapped) {
    return mapped;
  }
  const key = `${ink}|${surface}`;
  if (!warnedInks.has(key)) {
    warnedInks.add(key);
    console.warn(
      `[lib/color] accent ${ink} has no light-surface ink mapping and is ` +
      `rendered as-is on light surface ${surface} — verify >=3:1 contrast ` +
      `for text use.`
    );
  }
  return ink;
}

/**
 * Neutral text ink that co-varies with its surface: if the ink and surface
 * share a polarity (light-on-light / dark-on-dark), flip to the contrasting
 * neutral; otherwise keep the authored ink. Mid-tone inks are kept as-is.
 * A surface whose opacity is unknowable (transparent / non-hex) keeps the
 * authored ink.
 */
export function covaryTextInk(ink: string, surface: string): string {
  if (!isOpaqueHex(surface)) {
    return ink;
  }
  const surfaceLight = isLightColor(surface);
  const inkLight = isLightColor(ink);
  if (surfaceLight === inkLight) {
    return surfaceLight ? "#1F2937" : "#F8FAFC";
  }
  return ink;
}
