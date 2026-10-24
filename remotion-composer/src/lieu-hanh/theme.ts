// VN-Myth S2E04 "Liễu Hạnh" — shared theme + scene contract.
// Season S2 ink-genome look (values copied from S2E03 chu-dong-tu — no cross-import):
// giấy dó sẫm #1A1714, mực kem #E8DCC8, hổ phách #D9A441 (bản kể / cổ thư),
// teal #3E7C7B (lớp thực hành / đền thờ), đỏ son #A63A2B (ấn triều đình / accents).
// Contrast rule (S2 standing): body text chỉ đặt trên panel đặc hoặc overlay tối
// >= 0.72 alpha; body >= 34px, labels >= 28px @1920x1080.

export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const C = {
  bg: "#1A1714", // giấy dó sẫm
  card: "#241F1A",
  border: "#3A322A",
  cream: "#E8DCC8", // mực kem
  white: "#F5F2EA",
  amber: "#D9A441", // hổ phách — bản kể / cổ thư
  teal: "#3E7C7B", // thực hành / đền thờ
  tealLight: "#7FD1C8", // nhấn đọc trên nền tối
  red: "#A63A2B", // đỏ son — ấn triều đình
  redLight: "#D96A55", // đỏ son sáng (text trên nền tối)
  mute: "#8A7F6E",
  dossier: "#3E2F1E", // hồ sơ nâu giấy dầu
};

export const FONT = {
  display: '"Playfair Display", "Noto Serif", Georgia, serif',
  body: '"Be Vietnam Pro", "Noto Sans", "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
  hanzi: '"Playfair Display", "Noto Serif SC", "Songti SC", serif',
};

export type SceneProps = {
  durationInFrames: number;
  showInterpretFlag?: boolean;
};

/** 0..1 progress of `frame` between fractions a..b of the scene duration, clamped. */
export const at = (frame: number, dur: number, a: number, b?: number): number => {
  const s = a * dur;
  const e = (b ?? a + 0.06) * dur;
  return Math.max(0, Math.min(1, (frame - s) / Math.max(1, e - s)));
};

export const ease = (t: number): number => 1 - Math.pow(1 - t, 3);
