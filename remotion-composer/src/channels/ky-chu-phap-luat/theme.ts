import { createChannelTheme } from "../../core/theme";

export const kyChuPhapLuatTheme = createChannelTheme("swiss-broadcast", {
  id: "ky-chu-phap-luat",
  name: "Ký Chủ Pháp Luật",
  platform: "tiktok",
  canvas: { width: 1080, height: 1920, fps: 30 },
  colors: {
    paper: "#F6F2E9",
    paperWarm: "#EBE4D5",
    surface: "#FFFDF9",
    surfaceAlt: "#EFE9DC",
    ink: "#0D1B2A",
    inkSoft: "#162A3E",
    text: "#0D1B2A",
    textOnDark: "#F6F2E9",
    muted: "#475569",
    textMuted: "#475569",
    mutedOnDark: "#9FB0C3",
    vermilion: "#145A4A",
    crimson: "#B91C1C",
    accentRed: "#B91C1C",
    accent: "#145A4A",
    highlighter: "#F2C94C",
    highlightText: "#0D1B2A",
    ochre: "#C58B16",
    amber: "#C58B16",
    neonYellow: "#F2C94C",
    ok: "#145A4A",
    cold: "#1E3A5F",
    ruleStrong: "#0D1B2A",
    line: "rgba(13, 27, 42, 0.16)",
    lineOnDark: "rgba(246, 242, 233, 0.20)",
    gridLine: "rgba(13, 27, 42, 0.05)",
    slate: "#F6F2E9",
    panel: "#FFFDF9",
    panelDeep: "#EBE4D5",
    layerA: "#145A4A",
    layerB: "#1E3A5F",
    layerC: "#C58B16",
    captionHighlight: "#F2C94C",
    card: "#FFFDF9",
    border: "rgba(13, 27, 42, 0.16)",
    cream: "#EBE4D5",
  },
  bumper: {
    enabled: true,
    frames: 90,
    video9x16: "channels/ky-chu-phap-luat/brand/kcpl_bumper_9x16.mp4",
    video16x9: null,
    sting: "channels/ky-chu-phap-luat/brand/kcpl_bumper_sting.wav",
    stingVolume: 0.55,
  },
});

export const FPS = kyChuPhapLuatTheme.canvas.fps;
export const WIDTH = kyChuPhapLuatTheme.canvas.width;
export const HEIGHT = kyChuPhapLuatTheme.canvas.height;
export const COLORS = kyChuPhapLuatTheme.colors;
export const FONTS = kyChuPhapLuatTheme.fonts;
export const SAFE = kyChuPhapLuatTheme.safe;
export const MOTION = kyChuPhapLuatTheme.motion;
export const ensureFonts = kyChuPhapLuatTheme.ensureFonts;
export const waitForFonts = kyChuPhapLuatTheme.waitForFonts;
