// Speech-locked timing helpers for eth-tradingagents-20261009 (VERTICAL).
// words.json: canonical provider words per scene, SCENE-LOCAL seconds (built by
// projects/eth-tradingagents-20261009/scripts/build_compose_timing.py from the
// per-section GLOBAL narration_words.json + tts_batch_summary offsets; 59/59
// speech_lock anchors audited, greedy-join). scene_timing.json: MEASURED
// section offsets on narration_full.wav — authoritative, NOT the 102.3s plan.
// Helpers return SCENE-LOCAL frames comparable with useCurrentFrame() inside a
// <Sequence>. Phrase matching is GREEDY-JOIN: a phrase token may consume up to
// 3 consecutive word slots joined without separator (Ep.06 lesson), with an
// accent-stripped fallback pass.
import { FPS } from "./theme";
import wordsJson from "../../public/eth-tradingagents-20261009/words.json";
import timingJson from "../../public/eth-tradingagents-20261009/scene_timing.json";

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
  section_id: SceneId;
  start_seconds: number;
  duration_seconds: number;
  start_frame: number;
  end_frame: number;
  scene_frames: number;
}

const RAW = timingJson as unknown as {
  scenes: { scene_id: SceneId; section_id: SceneId; start_seconds: number; duration_seconds: number; start_frame: number; duration_frames: number }[];
  total_frames: number;
};
export const SCENE_TIMING: SceneTiming[] = RAW.scenes.map((s) => {
  const end_frame = s.start_frame + s.duration_frames;
  return { ...s, end_frame, scene_frames: s.duration_frames };
});
export const AUDIO_SECONDS = 118.452; // narration_full.wav (measured)
export const TOTAL_FRAMES = RAW.total_frames; // ceil(118.452*30)+30 = 3584

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

export interface WordSpan { i0: number; i1: number }

/** Greedy-join span match for a multi-word phrase. */
const spanForParts = (ws: SpokenWord[], parts: string[]): WordSpan | null => {
  const n = ws.length;
  for (let i = 0; i < n; i++) {
    let k = 0;
    let j = i;
    let ok = true;
    while (k < parts.length) {
      if (j >= n) { ok = false; break; }
      const acc0 = parts[k];
      let acc = "";
      let m = j;
      let hit = -1;
      while (m < n && m < j + 3) {
        acc += norm(ws[m].word);
        if (acc === acc0) { hit = m; break; }
        m++;
      }
      if (hit < 0) { ok = false; break; }
      j = hit + 1;
      k++;
    }
    if (ok && k === parts.length) return { i0: i, i1: j - 1 };
  }
  return null;
};

export const findWordSpan = (id: SceneId, matcher: Matcher, occurrence = 1): WordSpan => {
  const ws = getWords(id);
  if (typeof matcher === "number") {
    if (matcher < 0 || matcher >= ws.length) throw new Error(`[timing] ${id}: word index ${matcher} out of range 0..${ws.length - 1}`);
    return { i0: matcher, i1: matcher };
  }
  let result: WordSpan | null = null;
  if (typeof matcher === "string") {
    const parts = matcher.trim().split(/\s+/).map(norm);
    result = spanForParts(ws, parts);
    if (!result) {
      const partsA = matcher.trim().split(/\s+/).map(stripAccents);
      // accentless pass needs accentless joining too
      const wsA = ws.map((w) => ({ ...w, word: stripAccents(w.word) }));
      result = spanForParts(wsA, partsA);
    }
  } else {
    const test = (accentless: boolean) => {
      const f = accentless ? stripAccents : norm;
      if (matcher instanceof RegExp) return (i: number) => matcher.test(f(ws[i].word));
      return (i: number) => matcher(ws[i], i);
    };
    let seen = 0;
    for (const accentless of [false, true]) {
      const t = test(accentless);
      for (let i = 0; i < ws.length; i++) {
        if (t(i) && ++seen === occurrence) return { i0: i, i1: i };
      }
    }
  }
  if (!result) {
    throw new Error(
      `[timing] ${id}: no match for ${String(matcher)} (occurrence ${occurrence}). Words: ${ws.map((w, i) => `${i}:${norm(w.word)}`).join(" ")}`,
    );
  }
  return result;
};

export const findWordSec = (id: SceneId, matcher: Matcher, occurrence = 1): number =>
  getWords(id)[findWordSpan(id, matcher, occurrence).i0].start;

export const findWordEndSec = (id: SceneId, matcher: Matcher, occurrence = 1): number =>
  getWords(id)[findWordSpan(id, matcher, occurrence).i1].end;

export const frameOf = (id: SceneId, matcher: Matcher, occurrence = 1, offsetFrames = 0): number =>
  Math.max(0, Math.round(findWordSec(id, matcher, occurrence) * FPS) + offsetFrames);

export const frameOfEnd = (id: SceneId, matcher: Matcher, occurrence = 1, offsetFrames = 0): number =>
  Math.max(0, Math.round(findWordEndSec(id, matcher, occurrence) * FPS) + offsetFrames);
