// News daily 2026-10-20 — S1 demo timing, derived from
// projects/news-daily-20261020/audio/s1_words.json (45 aligned words, 0.0→8.52s)
// against the canonical 5-phrase narration (word-sequence match, tolerance ±0.3s).
//
// ALL anchors are speech-locked: each display label fires at its FIRST spoken
// word of the phrase that grounds it (owner standing rule, ±0.3s).
//
// FULL-EPISODE additions (TASK-2): SCENE_TIMING/TOTAL_FRAMES/A()/AEnd() built on
// public/news-daily-20261020/scene_timing.json + words.json (scene-local seconds,
// s01..s08). Greedy-join consecutive normalized-word match (1019 mechanics).
// NOTE: s04/s05 brand words are stored LITERALLY as "OpenAI"/"Qualcomm" in
// words.json — anchor phrases must use those exact tokens.

import React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import wordsJson from "../../public/news-daily-20261020/words.json";
import timingJson from "../../public/news-daily-20261020/scene_timing.json";

export const FPS = 30;
export const AUDIO_SECONDS = 8.777687;
export const TAIL_SECONDS = 0.8;
export const TOTAL_FRAMES = Math.ceil((AUDIO_SECONDS + TAIL_SECONDS) * FPS); // 288

/** Phrase word spans (seconds) from s1_words.json word-sequence match. */
export const PHRASE_SPANS = {
  p1: { start: 0.0, end: 1.8 }, // "Mười lăm ... tiết kiệm."   words 0–10
  p2: { start: 1.96, end: 3.06 }, // "Theo bản tin ... tháng mười," words 11–18 (SPOKEN-ONLY, no display)
  p3: { start: 3.42, end: 5.26 }, // "lãi suất ... sáu tháng"    words 19–27
  p4: { start: 5.26, end: 7.42 }, // "giảm không phẩy ... trăm"  words 28–38
  p5: { start: 7.42, end: 8.52 }, // "trong ngày ... tháng mười." words 39–44
} as const;

export type PhraseId = keyof typeof PHRASE_SPANS;

export const s = (sec: number): number => Math.round(sec * FPS);

/** Label reveal anchors — the spoken word that GROUNDS each whitelisted label.
 *  Spec: each phrase reveals at its REAL spoken span start ±0.3s. */
export const REVEAL_AT = {
  // P1 headline "15 ngân hàng" ← phrase starts "Mười lăm..." at 0.0
  headline15: s(PHRASE_SPANS.p1.start), // f0
  // P1 "hạ lãi suất tiết kiệm" ← "hạ" at 1.04 (still inside P1 span)
  cutLabel: s(1.04), // f31
  // P3 "kỳ hạn từ 6 tháng" ← phrase starts "lãi suất tiền gửi..." at 3.42
  termLabel: s(PHRASE_SPANS.p3.start), // f103
  // P4 "giảm 0,5–0,7 điểm phần trăm" ← phrase starts "giảm..." at 5.26
  cutChip: s(PHRASE_SPANS.p4.start), // f158
  // P5 "ngày 19/10" ← phrase starts "trong ngày..." at 7.42
  dateChip: s(PHRASE_SPANS.p5.start), // f223
} as const;

/** phrase-complete still frames: floor(span_end * 30), clamped 0..287 */
export const PHRASE_COMPLETE_FRAMES: Record<PhraseId, number> = {
  p1: Math.min(Math.floor(PHRASE_SPANS.p1.end * FPS), TOTAL_FRAMES - 1), // 54
  p2: Math.min(Math.floor(PHRASE_SPANS.p2.end * FPS), TOTAL_FRAMES - 1), // 91
  p3: Math.min(Math.floor(PHRASE_SPANS.p3.end * FPS), TOTAL_FRAMES - 1), // 157
  p4: Math.min(Math.floor(PHRASE_SPANS.p4.end * FPS), TOTAL_FRAMES - 1), // 222
  p5: Math.min(Math.floor(PHRASE_SPANS.p5.end * FPS), TOTAL_FRAMES - 1), // 255
};

// ---------------------------------------------------------------------------
// FULL EPISODE (TASK-2) — s01..s08, scene-local seconds from words.json.
// ---------------------------------------------------------------------------

export type FullSceneId = "s01" | "s02" | "s03" | "s04" | "s05" | "s06" | "s07" | "s08";

interface RawWord {
  word: string;
  start: number;
  end: number;
}
interface RawScene {
  scene_id: FullSceneId;
  start_seconds: number;
  duration_seconds: number;
  end_seconds: number;
  start_frame: number;
  end_frame: number;
}
export interface FullSceneTiming extends RawScene {
  scene_frames: number;
}

const RAW_FULL = timingJson as unknown as { fps: number; scenes: RawScene[] };
const WORDS: Record<FullSceneId, RawWord[]> = wordsJson as unknown as Record<FullSceneId, RawWord[]>;

export const SCENE_TIMING: FullSceneTiming[] = RAW_FULL.scenes.map((sc) => ({
  ...sc,
  scene_frames: sc.end_frame - sc.start_frame + 1,
}));

/** Whole-episode length: last scene's end frame + 1 (scene_timing.json fps=30). */
export const EPISODE_TOTAL_FRAMES = SCENE_TIMING[SCENE_TIMING.length - 1].end_frame + 1; // 1986

export const getSceneTiming = (id: FullSceneId): FullSceneTiming => {
  const t = SCENE_TIMING.find((sc) => sc.scene_id === id);
  if (!t) throw new Error(`[news-daily-20261020/timing] unknown scene ${id}`);
  return t;
};

// --- greedy-join phrase matching (1019 mechanics) --------------------------
// Normalize: strip punctuation, lowercase, drop empty tokens (skip words that
// normalize to empty when joining, so spoken "OpenAI" matches literal token).
const PUNCT = /[,.\-–—'"«»!?;:()]/g;
const norm = (str: string): string => str.replace(PUNCT, "").trim().toLowerCase();
const tokenize = (str: string): string[] => str.split(/\s+/).map(norm).filter(Boolean);

const findPhrase = (
  sid: FullSceneId,
  phrase: string,
): { start: number; end: number } | null => {
  const words = WORDS[sid] ?? [];
  const toks = tokenize(phrase);
  if (toks.length === 0) return null;
  // Indices of words whose normalized form is non-empty, in order.
  const slots: number[] = [];
  const normed: string[] = [];
  words.forEach((w, i) => {
    const n = norm(w.word);
    if (n) {
      slots.push(i);
      normed.push(n);
    }
  });
  for (let i = 0; i + toks.length <= normed.length; i++) {
    let ok = true;
    for (let j = 0; j < toks.length; j++) {
      if (normed[i + j] !== toks[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return { start: words[slots[i]].start, end: words[slots[i + toks.length - 1]].end };
  }
  return null;
};

const anchorFrame = (sid: FullSceneId, rawSeconds: number, anchor: string): number => {
  const maxSeconds = getSceneTiming(sid).duration_seconds + 0.2;
  if (!Number.isFinite(rawSeconds) || rawSeconds < 0 || rawSeconds > maxSeconds) {
    throw new Error(
      `[news-daily-20261020/timing] invalid ${anchor} in ${sid}: ${rawSeconds}s; expected [0, ${maxSeconds}]`,
    );
  }
  return Math.round(rawSeconds * FPS);
};

/** Scene-local START frame of a spoken phrase (first word of the match). */
export const A = (sid: FullSceneId, phrase: string): number => {
  const m = findPhrase(sid, phrase);
  if (!m) throw new Error(`[news-daily-20261020/timing] phrase not found in ${sid}: "${phrase}"`);
  return anchorFrame(sid, m.start, `A start of "${phrase}"`);
};

/** Scene-local END frame of a spoken phrase (last word of the match). */
export const AEnd = (sid: FullSceneId, phrase: string): number => {
  const m = findPhrase(sid, phrase);
  if (!m) throw new Error(`[news-daily-20261020/timing] phrase not found in ${sid}: "${phrase}"`);
  return anchorFrame(sid, m.end, `AEnd end of "${phrase}"`);
};

/** Speech-locked reveal wrapper — gentle entrance-only spring + fade, static camera. */
export const Spoken: React.FC<{
  at: number;
  fromX?: number;
  fromY?: number;
  cfg?: { damping: number; stiffness?: number; mass?: number };
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ at, fromX = 0, fromY = 26, cfg = { damping: 200, stiffness: 90, mass: 0.9 }, style, children }) => {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - at, fps: FPS, config: cfg });
  const op = interpolate(frame - at, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return React.createElement("div", {
    style: { opacity: op, transform: `translate(${fromX * (1 - p)}px, ${fromY * (1 - p)}px)`, ...style },
  }, children);
};
