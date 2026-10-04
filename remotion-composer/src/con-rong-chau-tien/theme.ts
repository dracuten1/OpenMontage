// VN-Myth Ep.02 shared theme + scene contract.
// Every scene component: React.FC<SceneProps>. It renders at LOCAL frame 0..durationInFrames-1
// (the assembler wraps each in a <Sequence>). Express all reveal timings as FRACTIONS of
// durationInFrames (use `at(frame, durationInFrames, 0.2)` style helpers) so the assembler can retime
// scenes to real narration boundaries without breaking choreography.

export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const C = {
  bg: "#1A1714", // giấy dó sẫm
  card: "#241F1A",
  border: "#3A322A",
  cream: "#E8DCC8", // mực kem
  amber: "#D9A441", // hổ phách
  teal: "#7FD1C8", // science layer
  white: "#F5F2EA",
  warn: "#C8553D", // cảnh báo đỏ gạch
  mute: "#8A7F6E",
  sea: "#2F5D6B", // lam sẫm (Rồng)
};

export const FONT = {
  display: '"Playfair Display", "Noto Serif", Georgia, serif',
  body: '"Be Vietnam Pro", "Noto Sans", "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

export type SceneProps = {
  durationInFrames: number;
  /** optional hint for scenes that show a "diễn giải" (interpretation) flag */
  showInterpretFlag?: boolean;
};

/** 0..1 progress of `frame` between fractions a..b of the scene duration, clamped. */
export const at = (frame: number, dur: number, a: number, b?: number): number => {
  const s = a * dur;
  const e = (b ?? a + 0.08) * dur;
  return Math.max(0, Math.min(1, (frame - s) / Math.max(1, e - s)));
};

export const ease = (t: number): number => 1 - Math.pow(1 - t, 3);
