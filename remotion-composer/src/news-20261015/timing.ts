// Speech-locked timing helpers for news-20261015 (VERTICAL).
// words.json: per-scene LOCAL seconds (ASR-aligned); scene_timing.json: MEASURED TTS
// section offsets + 0.65s gaps. Helpers return SCENE-LOCAL values for use inside <Sequence>.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import wordsJson from "../../public/news-20261015/words.json";
import timingJson from "../../public/news-20261015/scene_timing.json";
import { SPRING } from "./theme";

export const FPS = 30;

export type SceneId =
  | "s01" | "s02" | "s03" | "s04" | "s05" | "s06" | "s07"
  | "s08" | "s09" | "s10" | "s11" | "s12";

export interface SpokenWord {
  word: string;
  start: number;
  end: number;
}

export interface SceneTiming {
  scene_id: SceneId;
  start_seconds: number;
  duration_seconds: number;
  start_frame: number;
  end_frame: number;
  scene_frames: number;
}

const RAW = timingJson as unknown as { scenes: { scene_id: SceneId; start_seconds: number; duration_seconds: number }[] };
export const SCENE_TIMING: SceneTiming[] = RAW.scenes.map((s) => {
  const start_frame = Math.round(s.start_seconds * FPS);
  const end_frame = Math.round((s.start_seconds + s.duration_seconds) * FPS);
  return { ...s, start_frame, end_frame, scene_frames: end_frame - start_frame };
});
export const AUDIO_SECONDS = 102.466; // narration_full.wav (measured)
export const TOTAL_FRAMES = Math.ceil(AUDIO_SECONDS * FPS) + 30; // +1s tail for outro hold + BGM fade

export const getSceneTiming = (id: SceneId): SceneTiming => {
  const t = SCENE_TIMING.find((s) => s.scene_id === id);
  if (!t) throw new Error(`Unknown scene ${id}`);
  return t;
};

const WORDS = wordsJson as unknown as Record<string, SpokenWord[]>;
export const getWords = (id: SceneId): SpokenWord[] => WORDS[id] ?? [];

export const norm = (s: string): string =>
  s.normalize("NFC").toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

export const stripAccents = (s: string): string =>
  norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

export type Matcher = string | number | RegExp | ((w: SpokenWord, i: number) => boolean);

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
    if (matcher instanceof RegExp) return (i: number) => regexpTest(matcher, f(ws[i].word));
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
    `[timing] ${id}: no match for ${String(matcher)} (occurrence ${occurrence}). Words: ${ws.map((w, i) => `${i}:${norm(w.word)}`).join(" ")}`
  );
};

// safe RegExp test on pre-normalized strings
const regexpTest = (re: RegExp, s: string): boolean => new RegExp(re.source, re.flags).test(s);

export const findWordSec = (id: SceneId, matcher: Matcher, occurrence = 1): number =>
  getWords(id)[findWordIndex(id, matcher, occurrence)].start;

export const findWordEndSec = (id: SceneId, matcher: Matcher, occurrence = 1): number => {
  const i = findWordIndex(id, matcher, occurrence);
  const n = typeof matcher === "string" ? matcher.trim().split(/\s+/).length : 1;
  return getWords(id)[i + n - 1].end;
};

export const frameOf = (id: SceneId, matcher: Matcher, occurrence = 1, offsetFrames = 0): number =>
  Math.max(0, Math.round(findWordSec(id, matcher, occurrence) * FPS) + offsetFrames);

export const frameOfEnd = (id: SceneId, matcher: Matcher, occurrence = 1, offsetFrames = 0): number =>
  Math.max(0, Math.round(findWordEndSec(id, matcher, occurrence) * FPS) + offsetFrames);

export const toGlobalFrame = (id: SceneId, localFrame: number): number => getSceneTiming(id).start_frame + localFrame;

export interface SpokenState {
  at: number;
  frame: number;
  fired: boolean;
  since: number;
}

export const useSpoken = (id: SceneId, matcher: Matcher, occurrence = 1, offsetFrames = 0): SpokenState => {
  const frame = useCurrentFrame();
  const at = frameOf(id, matcher, occurrence, offsetFrames);
  return { at, frame, fired: frame >= at, since: Math.max(0, frame - at) };
};

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
