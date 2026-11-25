import { createChannelTheme } from "../../core/theme";

export const kyChuDiemTinTheme = createChannelTheme("swiss-broadcast", {
  id: "ky-chu-diem-tin",
  name: "Ký Chủ Điểm Tin",
  platform: "tiktok",
  canvas: { width: 1080, height: 1920, fps: 30 },
  bumper: {
    enabled: true,
    frames: 90,
    video9x16: "brand/kcdt_bumper_9x16.mp4",
    video16x9: "brand/kcdt_bumper_16x9.mp4",
    sting: "brand/kcdt_bumper_sting.wav",
    stingVolume: 0.55,
  },
});

export const FPS = kyChuDiemTinTheme.canvas.fps;
export const WIDTH = kyChuDiemTinTheme.canvas.width;
export const HEIGHT = kyChuDiemTinTheme.canvas.height;
export const COLORS = kyChuDiemTinTheme.colors;
export const FONTS = kyChuDiemTinTheme.fonts;
export const SAFE = kyChuDiemTinTheme.safe;
export const MOTION = kyChuDiemTinTheme.motion;
export const ensureFonts = kyChuDiemTinTheme.ensureFonts;
export const waitForFonts = kyChuDiemTinTheme.waitForFonts;

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
