// theme.ts — crypto-tradingagents-20261016 (VERTICAL 1080x1920 @30fps).
// Dark-fintech terminal palette. Arial stack + tabular numerals. All layout
// is static pixel coords — no zoom, no camera motion.
export const FPS = 30;
export const FONT = 'Arial, "Helvetica Neue", Helvetica, sans-serif';

export const C = {
  bg: "#0D1117",
  surface: "#161B22",
  text: "#E6EDF3",
  muted: "#8B949E",
  red: "#F85149",
  green: "#3FB950",
  amber: "#D29922",
  blue: "#58A6FF",
  line: "rgba(139,148,158,0.28)",
};

// Static geometry: header 130..330, content 68..980 x 390..1510,
// status 1600..1710, footer 1760.
export const LAY = {
  headerY: 130,
  titleY: 210,
  subY: 316,
  x: 68,
  w: 912,
  contentY: 390,
  statusY: 1606,
  discY: 1698,
  footerY: 1760,
  maxTextW: 840,
};

// Rough Arial width wrap (no runtime measuring): max line width 840.
export const wrap = (text: string, maxW: number, size: number, factor = 0.58): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (t.length * size * factor <= maxW || !cur) cur = t;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
};
