import { Easing, interpolate } from "remotion";

// ---------------------------------------------------------------------------
// rigs/types.ts — shared contracts + shared animation primitives for the
// character rigs (KawaiiRabbit, GoldenTurtle). Rig-split refactor of
// KidsStoryMultiScene.tsx: every formula, easing and constant below is moved
// VERBATIM (same numbers) — zero visual change.
// ---------------------------------------------------------------------------

// ---- shared rig types ----
export type MouthCue = { start: number; end: number; value: string };
export type VisemeTable = Record<string, { rx: number; ry: number }>;
export type SpeechLine = { start: number; dur: number }; // one dialogue line
export type CharacterCues = { mouthCues: MouthCue[]; start: number } | null;
export type Pose = "idle" | "walk" | "sleep" | "startle" | "proud" | "clap";

// CharacterSpec — common shape of every rigs/specs/*.kawaii.json. The spec
// JSON is the SINGLE source of aesthetic constants (colors, part geometry,
// stroke widths, viseme table, viseme scale); rig TSX keeps no parallel
// hardcoded copies. headRatio is descriptive metadata only (head vertical
// radius / body vertical radius), never used in rendering.
export type CharacterSpec = {
  id: string;
  outline: string; // warm dark outline color
  white: string; // shared pure-white (rim fills, glints, sheen, pages)
  headRatio?: number;
  visemes: VisemeTable; // lip-sync targets (QC-passed table)
  visemeScale?: number; // mouth size multiplier vs the viseme table
};

// ---- shared easing (original constants) ----
export const EASE_OUT_BACK = Easing.bezier(0.34, 1.56, 0.64, 1);
export const EOC = Easing.out(Easing.cubic);
export const EIC = Easing.in(Easing.cubic);
export const EIO = Easing.inOut(Easing.cubic);

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// pivot-wrap transform helper (verbatim)
export const piv = (cx: number, cy: number, deg: number, sx = 1, sy = 1) =>
  `translate(${cx} ${cy}) rotate(${deg}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`;

// ---- blink: close 80ms easeInCubic, open 120ms easeOutCubic (verbatim) ----
export const blinkFrom = (starts: number[], tt: number): number => {
  let b = 0;
  for (const s of starts) {
    const dt = tt - s;
    if (dt < 0 || dt >= 0.2) continue;
    const v = dt < 0.08 ? EIC(dt / 0.08) : 1 - EOC(clamp01((dt - 0.08) / 0.12));
    b = Math.max(b, v);
  }
  return b;
};

// smooth on/off envelope around a line (nod amplitude, head extension...) — verbatim
export const envAt = (tt: number, a0: number, a1: number, b0: number, b1: number): number =>
  interpolate(tt, [a0, a1], [0, 1], {
    easing: EOC,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) *
  interpolate(tt, [b0, b1], [1, 0], {
    easing: EOC,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// ---- viseme targets lookup (original mouthAtCues, verbatim interpolation
// contract; the viseme table itself lives in each spec JSON) ----
export const mouthAtCues = (
  cues: MouthCue[],
  tt: number,
  visemes: VisemeTable
): { rx: number; ry: number } => {
  if (!cues.length || tt < cues[0].start) return visemes.X;
  let i = -1;
  for (let j = cues.length - 1; j >= 0; j--) {
    if (cues[j].start <= tt) {
      i = j;
      break;
    }
  }
  if (i < 0) return visemes.X;
  const lastCue = cues[cues.length - 1];
  if (tt >= lastCue.end) {
    const last = visemes[lastCue.value] ?? visemes.X;
    const p = EOC(Math.min(1, (tt - lastCue.end) / 0.07));
    return { rx: lerp(last.rx, 0, p), ry: lerp(last.ry, 0, p) };
  }
  const cur = visemes[cues[i].value] ?? visemes.X;
  const since = tt - cues[i].start;
  if (since < 0.07 && i > 0) {
    const prev = visemes[cues[i - 1].value] ?? visemes.X;
    const p = EOC(clamp01(since / 0.07));
    return { rx: lerp(prev.rx, cur.rx, p), ry: lerp(prev.ry, cur.ry, p) };
  }
  return cur;
};
