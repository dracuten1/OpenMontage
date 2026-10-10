// Speech-locked timing helpers for gh6-20261007 (VERTICAL).
// words.json: canonical provider_text words aligned onto whisper time-slots (built
// at compose time by projects/gh6-20261007/scripts/build_compose_timing.py, 73/73
// anchors audited), per-scene LOCAL seconds. scene_timing.json: MEASURED TTS section
// offsets + 0.65s gaps — authoritative. Helpers return SCENE-LOCAL frames comparable
// with useCurrentFrame() inside a <Sequence>.
import { FPS } from "./theme";
import wordsJson from "../../public/gh6-20261007/words.json";
import timingJson from "../../public/gh6-20261007/scene_timing.json";

export type SceneId =
  | "s01" | "s02" | "s03" | "s04" | "s05" | "s06" | "s07"
  | "s08" | "s09" | "s10";

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
export const AUDIO_SECONDS = 116.891; // narration_full.wav (measured)
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
