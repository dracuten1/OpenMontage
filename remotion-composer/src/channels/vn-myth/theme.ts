import { createChannelTheme } from "../../core/theme";

export const vnMythTheme = createChannelTheme("archival-diorama", {
  id: "vn-myth",
  name: "VN-Myth",
  platform: "youtube",
  canvas: { width: 1920, height: 1080, fps: 30 },
  bumper: {
    enabled: false,
    frames: 0,
    video9x16: null,
    video16x9: null,
    sting: null,
    stingVolume: 0.55,
  },
});

export const FPS = vnMythTheme.canvas.fps;
export const W = vnMythTheme.canvas.width;
export const H = vnMythTheme.canvas.height;
export const COLORS = vnMythTheme.colors;
export const FONTS = vnMythTheme.fonts;
export const SAFE = vnMythTheme.safe;
export const MOTION = vnMythTheme.motion;
export const ensureFonts = vnMythTheme.ensureFonts;
export const waitForFonts = vnMythTheme.waitForFonts;
