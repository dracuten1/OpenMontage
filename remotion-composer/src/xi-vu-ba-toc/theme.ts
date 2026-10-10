// VN-Myth Ep.05 "Bách Việt: một trăm nước đã biến mất đâu?" — shared theme + scene contract.
// Architecture follows co-loa-no-than (Ep.04) / vua-hung-trong-dong (Ep.03) — ink-genome
// series look: giấy dó sẫm, mực kem, hổ phách (cổ thư), teal (khoa học), đỏ đèn (survivor).
// Contrast rule (branch fix/explainer-text-contrast): body text chỉ đặt trên panel đặc
// hoặc overlay tối >= 0.72 alpha; body >= 34px, labels >= 28px @1920x1080.

export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const C = {
  bg: "#1A1714", // giấy dó sẫm
  bgMuseum: "#14110D", // tối bảo tàng
  card: "#241F1A",
  border: "#3A322A",
  cream: "#E8DCC8", // mực kem
  white: "#F5F2EA",
  amber: "#D9A441", // hổ phách — cổ thư / truyền thuyết
  teal: "#7FD1C8", // khoa học / kỹ thuật
  warn: "#C8553D", // đỏ gạch — phủ định
  lampRed: "#E85A4F", // đèn survivor — đỏ ấm rực
  lampGlow: "#F2B45C", // quầng đèn vàng ấm
  mute: "#8A7F6E",
  earth: "#8A5A33", // đất nâu (nền đất)
  earthDeep: "#5C3D22",
  earthGlow: "#C98F4E", // ánh đồng trong đất
  bronze: "#C98F4E", // ánh đồng
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
