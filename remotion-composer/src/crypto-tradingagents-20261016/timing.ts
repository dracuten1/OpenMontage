// Speech-locked timing — crypto-tradingagents-20261016.
// words.json: ASR words per scene in SCENE-LOCAL seconds (pure rebase of the
// GLOBAL narration_words.json against section_offsets_final; built by
// scripts/build_timing_v2.py — no gap-heal, no auto-clamp, no proportional
// fills). 99/99 anchors pre-audited in artifacts/anchor_audit.json.
// frameOf on MISS prints console.error and returns 0 so the render gate
// fails loudly — never fake success.
import { FPS } from "./theme";
import wordsJson from "../../public/crypto-tradingagents-20261016/words.json";
import timingJson from "../../public/crypto-tradingagents-20261016/scene_timing.json";

export type SceneId =
  | "s01" | "s02" | "s03" | "s04" | "s05" | "s06" | "s07"
  | "s08" | "s09";

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
  scenes: {
    scene_id: SceneId;
    section_id: SceneId;
    start_seconds: number;
    duration_seconds: number;
    start_frame: number;
    duration_frames: number;
  }[];
  total_frames: number;
  total_duration_seconds: number;
};

export const SCENE_TIMING: SceneTiming[] = RAW.scenes.map((s) => ({
  ...s,
  end_frame: s.start_frame + s.duration_frames,
  scene_frames: s.duration_frames,
}));
export const AUDIO_SECONDS = RAW.total_duration_seconds; // 137.407
export const TOTAL_FRAMES = RAW.total_frames; // ceil(137.407*30)+30 = 4153

export const getSceneTiming = (id: SceneId): SceneTiming => {
  const t = SCENE_TIMING.find((s) => s.scene_id === id);
  if (!t) throw new Error(`Unknown scene ${id}`);
  return t;
};

const WORDS = wordsJson as unknown as Record<string, SpokenWord[]>;
export const getWords = (id: SceneId): SpokenWord[] => WORDS[id] ?? [];

const norm = (s: string): string =>
  s.normalize("NFC").toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

const stripAccents = (s: string): string =>
  norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

/** Greedy-join span match: a phrase token may consume up to 3 consecutive
 *  word slots joined without separator; pure-punctuation tokens dropped. */
const spanForParts = (
  ws: SpokenWord[],
  parts: string[],
  occurrence = 1,
): { i0: number; i1: number } | null => {
  const n = ws.length;
  let seen = 0;
  for (let i = 0; i < n; i++) {
    let k = 0;
    let j = i;
    let ok = true;
    while (k < parts.length) {
      if (j >= n) {
        ok = false;
        break;
      }
      const acc0 = parts[k];
      let acc = "";
      let m = j;
      let hit = -1;
      while (m < n && m < j + 3) {
        acc += norm(ws[m].word);
        if (acc === acc0) {
          hit = m;
          break;
        }
        m++;
      }
      if (hit < 0) {
        ok = false;
        break;
      }
      j = hit + 1;
      k++;
    }
    if (ok && k === parts.length) {
      seen++;
      if (seen === occurrence) return { i0: i, i1: j - 1 };
    }
  }
  return null;
};

export interface PhraseSpan {
  i0: number;
  i1: number;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
}

/** QC helper: full actual span for a phrase, or null (never throws). */
export const findPhraseSpan = (
  id: SceneId,
  phrase: string,
  occurrence = 1,
): PhraseSpan | null => {
  const ws = getWords(id);
  const parts = phrase.trim().split(/\s+/).map(norm).filter((p) => p.length > 0);
  let r = spanForParts(ws, parts, occurrence);
  if (!r) {
    const partsA = phrase.trim().split(/\s+/).map(stripAccents).filter((p) => p.length > 0);
    const wsA = ws.map((w) => ({ ...w, word: stripAccents(w.word) }));
    r = spanForParts(wsA, partsA, occurrence);
  }
  if (!r) return null;
  return {
    i0: r.i0,
    i1: r.i1,
    startSec: ws[r.i0].start,
    endSec: ws[r.i1].end,
    startFrame: Math.round(ws[r.i0].start * FPS),
    endFrame: Math.round(ws[r.i1].end * FPS),
  };
};

/** Local (scene) 0-based frame where the phrase starts being spoken. */
export const frameOf = (id: SceneId, phrase: string, occurrence = 1, offsetFrames = 0): number => {
  const span = findPhraseSpan(id, phrase, occurrence);
  if (!span) {
    console.error(`[timing] MISS ${id} occ${occurrence} :: ${phrase}`);
    return 0;
  }
  return Math.max(0, span.startFrame + offsetFrames);
};

export const frameOfEnd = (id: SceneId, phrase: string, occurrence = 1, offsetFrames = 0): number => {
  const span = findPhraseSpan(id, phrase, occurrence);
  if (!span) {
    console.error(`[timing] MISS ${id} occ${occurrence} :: ${phrase}`);
    return 0;
  }
  return Math.max(0, span.endFrame + offsetFrames);
};
