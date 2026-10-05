// Speech-locked timing definitions and helpers for aivn-20261006.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import wordsJson from "../../public/aivn-20261006/narration_words.json";
import timingJson from "../../public/aivn-20261006/scene_timing.json";
import { SPRING } from "./theme";

export const FPS = 30;

export type SceneId =
  | "s01"
  | "s02"
  | "s03"
  | "s04"
  | "s05"
  | "s06"
  | "s07"
  | "s08"
  | "s09";

export interface SpokenWord {
  word: string;
  start: number;
  end: number;
  globalStart: number;
  globalEnd: number;
}

export interface SceneTiming {
  scene_id: string;
  script_section_id: string;
  audio_path: string;
  audio_duration: number;
  tail_duration: number;
  scene_duration: number;
  scene_frames: number;
  start_seconds: number;
  end_seconds: number;
  start_frame: number;
  end_frame: number;
}

interface RawWordItem {
  word: string;
  scene_id: string;
  script_section_id: string;
  scene_start_seconds: number;
  clip_start: number;
  clip_end: number;
  global_start: number;
  global_end: number;
}

export const SCENE_TIMING = timingJson as unknown as SceneTiming[];
export const TOTAL_FRAMES = SCENE_TIMING[SCENE_TIMING.length - 1].end_frame; // 3150 frames (105.0s @ 30fps)

// Group raw words array into scene-keyed lookup
const rawWords = wordsJson as unknown as RawWordItem[];
const WORDS_BY_SCENE: Record<string, SpokenWord[]> = {};

for (const rw of rawWords) {
  const item: SpokenWord = {
    word: rw.word,
    start: rw.clip_start,
    end: rw.clip_end,
    globalStart: rw.global_start,
    globalEnd: rw.global_end,
  };
  const sId = rw.script_section_id.toLowerCase();
  const scId = rw.scene_id.toLowerCase();

  if (!WORDS_BY_SCENE[sId]) WORDS_BY_SCENE[sId] = [];
  WORDS_BY_SCENE[sId].push(item);

  if (!WORDS_BY_SCENE[scId]) WORDS_BY_SCENE[scId] = [];
  WORDS_BY_SCENE[scId].push(item);
}

export const normalizeSceneKey = (id: string): string => {
  const lower = id.toLowerCase();
  if (lower.startsWith("s0") || lower.startsWith("s1")) return lower;
  const num = lower.replace("scene_", "");
  return `s${num.padStart(2, "0")}`;
};

export const getSceneTiming = (id: SceneId): SceneTiming => {
  const normId = normalizeSceneKey(id);
  const t = SCENE_TIMING.find(
    (s) =>
      s.script_section_id.toLowerCase() === normId ||
      normalizeSceneKey(s.scene_id) === normId
  );
  if (!t) throw new Error(`Unknown scene ${id}`);
  return t;
};

export const getWords = (id: SceneId | string): SpokenWord[] => {
  const normId = normalizeSceneKey(id);
  return WORDS_BY_SCENE[normId] ?? WORDS_BY_SCENE[id] ?? [];
};

/** lowercase, NFC, strip leading/trailing punctuation */
export const norm = (s: string): string =>
  s.normalize("NFC").toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/** Accent-insensitive variant for loose matching */
export const stripAccents = (s: string): string =>
  norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

export type Matcher = string | number | RegExp | ((w: SpokenWord, i: number) => boolean);

export const findWordIndex = (id: SceneId, matcher: Matcher, occurrence = 1): number => {
  const ws = getWords(id);
  if (ws.length === 0) return 0;

  if (typeof matcher === "number") {
    if (matcher < 0) return 0;
    if (matcher >= ws.length) return ws.length - 1;
    return matcher;
  }

  const test = (accentless: boolean) => {
    const f = accentless ? stripAccents : norm;
    if (typeof matcher === "string") {
      const parts = matcher.trim().split(/\s+/).map(f);
      return (i: number) =>
        parts.every((p, k) => ws[i + k] !== undefined && f(ws[i + k].word) === p);
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

  // Partial substring search fallback
  if (typeof matcher === "string") {
    const target = stripAccents(matcher);
    let seen = 0;
    for (let i = 0; i < ws.length; i++) {
      if (stripAccents(ws[i].word).includes(target) && ++seen === occurrence) {
        return i;
      }
    }
  }

  // Fallback to 0 rather than crashing render
  return 0;
};

export const findWordSec = (id: SceneId, matcher: Matcher, occurrence = 1): number => {
  const ws = getWords(id);
  if (!ws.length) return 0;
  const idx = findWordIndex(id, matcher, occurrence);
  return ws[idx]?.start ?? 0;
};

export const findWordEndSec = (id: SceneId, matcher: Matcher, occurrence = 1): number => {
  const ws = getWords(id);
  if (!ws.length) return 0;
  const i = findWordIndex(id, matcher, occurrence);
  const n = typeof matcher === "string" ? matcher.trim().split(/\s+/).length : 1;
  const endIdx = Math.min(ws.length - 1, i + n - 1);
  return ws[endIdx]?.end ?? 0;
};

export const frameOf = (
  id: SceneId,
  matcher: Matcher,
  occurrence = 1,
  offsetFrames = 0
): number =>
  Math.max(0, Math.round(findWordSec(id, matcher, occurrence) * FPS) + offsetFrames);

export const frameOfEnd = (
  id: SceneId,
  matcher: Matcher,
  occurrence = 1,
  offsetFrames = 0
): number =>
  Math.max(0, Math.round(findWordEndSec(id, matcher, occurrence) * FPS) + offsetFrames);

export const frameOfIndex = (id: SceneId, index: number): number =>
  frameOf(id, index);

export const toGlobalFrame = (id: SceneId, localFrame: number): number =>
  getSceneTiming(id).start_frame + localFrame;

export interface SpokenProps {
  at: number;
  children?: React.ReactNode;
  fromY?: number;
  fromX?: number;
  fromScale?: number;
  until?: number;
  outFrames?: number;
  style?: React.CSSProperties;
}

/** Reveal primitive: invisible before `at`, springs in after. */
export const Spoken: React.FC<SpokenProps> = ({
  at,
  children,
  fromY = 24,
  fromX = 0,
  fromScale = 1,
  until,
  outFrames = 8,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: SPRING });
  const opacityIn = interpolate(frame - at, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacityOut =
    until === undefined
      ? 1
      : interpolate(frame, [until, until + outFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
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
    children
  );
};
