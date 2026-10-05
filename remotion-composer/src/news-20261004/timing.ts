// Speech-locked timing helpers for news-20261004.
// Source of truth: public/news-20261004/words.json (derived from narration_words.json, per-scene LOCAL seconds)
// and scene_timing.json. Inside a <Sequence>, useCurrentFrame() is already scene-local, so every helper here
// returns SCENE-LOCAL values (seconds or frames) that you can compare directly with useCurrentFrame().
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import wordsJson from "../../public/news-20261004/words.json";
import timingJson from "../../public/news-20261004/scene_timing.json";
import { SPRING } from "./theme";

export const FPS = 30;

export type SceneId =
  | "s01" | "s02" | "s03" | "s04" | "s05" | "s06" | "s07"
  | "s08" | "s09" | "s10" | "s11" | "s12" | "s13" | "s14";

export interface SpokenWord {
  word: string;
  /** scene-local seconds when the word starts being spoken */
  start: number;
  end: number;
}

export interface SceneTiming {
  scene_id: SceneId;
  start_frame: number;
  end_frame: number;
  scene_frames: number;
  audio_duration: number;
  scene_duration: number;
  start_seconds: number;
}

const WORDS = wordsJson as unknown as Record<string, SpokenWord[]>;
export const SCENE_TIMING = timingJson as unknown as SceneTiming[];
export const TOTAL_FRAMES = SCENE_TIMING[SCENE_TIMING.length - 1].end_frame;

export const getSceneTiming = (id: SceneId): SceneTiming => {
  const t = SCENE_TIMING.find((s) => s.scene_id === id);
  if (!t) throw new Error(`Unknown scene ${id}`);
  return t;
};

export const getWords = (id: SceneId): SpokenWord[] => WORDS[id] ?? [];

/** lowercase, NFC, strip leading/trailing punctuation ("9,95%," -> "9,95", "04/10:" -> "04/10"). */
export const norm = (s: string): string =>
  s.normalize("NFC").toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/** Accent-insensitive variant for loose matching ("đà nẵng" == "da nang"). */
export const stripAccents = (s: string): string =>
  norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

export type Matcher = string | number | RegExp | ((w: SpokenWord, i: number) => boolean);

/**
 * Index of the `occurrence`-th (1-based) match in the scene's word list.
 *  - string: normalised word equals it; multi-word strings ("lãi suất") match consecutive words, index = first word.
 *    Falls back to accent-insensitive match if exact fails.
 *  - number: literal word index (0-based), occurrence ignored.
 *  - RegExp: tested on the normalised word.  function: custom predicate.
 * Throws with a list of the scene's words if not found (fail loud at render, never silently mis-time).
 */
export const findWordIndex = (id: SceneId, matcher: Matcher, occurrence = 1): number => {
  const ws = getWords(id);
  if (typeof matcher === "number") {
    if (matcher < 0 || matcher >= ws.length) throw new Error(`[timing] ${id}: word index ${matcher} out of range 0..${ws.length - 1}`);
    return matcher;
  }
  const test = (accentless: boolean) => {
    const f = accentless ? stripAccents : norm;
    if (typeof matcher === "string") {
      const parts = matcher.trim().split(/\s+/).map(f);
      return (i: number) => parts.every((p, k) => ws[i + k] !== undefined && f(ws[i + k].word) === p);
    }
    if (matcher instanceof RegExp) return (i: number) => matcher.test(f(ws[i].word));
    return (i: number) => matcher(ws[i], i);
  };
  for (const accentless of [false, true]) {
    const t = test(accentless);
    let seen = 0;
    for (let i = 0; i < ws.length; i++) {
      if (t(i) && ++seen === occurrence) return i;
    }
  }
  throw new Error(
    `[timing] ${id}: no match for ${String(matcher)} (occurrence ${occurrence}). Words: ${ws.map((w, i) => `${i}:${norm(w.word)}`).join(" ")}`,
  );
};

/** Scene-LOCAL seconds at which the matched word STARTS being spoken. */
export const findWordSec = (id: SceneId, matcher: Matcher, occurrence = 1): number =>
  getWords(id)[findWordIndex(id, matcher, occurrence)].start;

/** Scene-LOCAL seconds at which the matched word ENDS (for multi-word strings: end of last word). */
export const findWordEndSec = (id: SceneId, matcher: Matcher, occurrence = 1): number => {
  const i = findWordIndex(id, matcher, occurrence);
  const n = typeof matcher === "string" ? matcher.trim().split(/\s+/).length : 1;
  return getWords(id)[i + n - 1].end;
};

/** Scene-LOCAL frame (round(start*30)) + optional frame offset (e.g. -3 to lead the word slightly). */
export const frameOf = (id: SceneId, matcher: Matcher, occurrence = 1, offsetFrames = 0): number =>
  Math.max(0, Math.round(findWordSec(id, matcher, occurrence) * FPS) + offsetFrames);

export const frameOfEnd = (id: SceneId, matcher: Matcher, occurrence = 1, offsetFrames = 0): number =>
  Math.max(0, Math.round(findWordEndSec(id, matcher, occurrence) * FPS) + offsetFrames);

/** Convenience: frame of the Nth word of the scene (0-based). */
export const frameOfIndex = (id: SceneId, index: number): number => frameOf(id, index);

/** Absolute (composition) frame for a scene-local frame -- for still probes only. */
export const toGlobalFrame = (id: SceneId, localFrame: number): number => getSceneTiming(id).start_frame + localFrame;

export interface SpokenState {
  /** scene-local trigger frame */
  at: number;
  /** current scene-local frame */
  frame: number;
  fired: boolean;
  /** frames since trigger (0 before) */
  since: number;
}

/** Hook: has the matched word been spoken yet? */
export const useSpoken = (id: SceneId, matcher: Matcher, occurrence = 1, offsetFrames = 0): SpokenState => {
  const frame = useCurrentFrame();
  const at = frameOf(id, matcher, occurrence, offsetFrames);
  return { at, frame, fired: frame >= at, since: Math.max(0, frame - at) };
};

export interface SpokenProps {
  /** scene-local frame (from frameOf/useSpoken) at which the element starts to appear */
  at: number;
  children?: React.ReactNode;
  /** px the element travels from. default 24 (rises up). */
  fromY?: number;
  fromX?: number;
  /** start scale (1 = none) */
  fromScale?: number;
  /** hide again at this frame (fade-out over `outFrames`) */
  until?: number;
  outFrames?: number;
  style?: React.CSSProperties;
}

/** Reveal primitive: invisible before `at`, springs in (opacity + translate + scale) after. */
export const Spoken: React.FC<SpokenProps> = ({
  at, children, fromY = 24, fromX = 0, fromScale = 1, until, outFrames = 8, style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: SPRING });
  const opacityIn = interpolate(frame - at, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacityOut = until === undefined ? 1 : interpolate(frame, [until, until + outFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = opacityIn * opacityOut;
  if (frame < at - 1 || opacity <= 0) return null;
  const scale = fromScale + (1 - fromScale) * p;
  return React.createElement(
    "div",
    {
      style: {
        opacity,
        transform: `translate(${(1 - p) * fromX}px, ${(1 - p) * fromY}px) scale(${scale})`,
        willChange: "transform, opacity",
        ...style,
      },
    },
    children,
  );
};
