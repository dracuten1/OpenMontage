// timing.ts — news-daily-20261016 (adapted from news-20261015).
// SceneId s01..s08; scene windows from MEASURED public/news-daily-20261016/scene_timing.json
// (TTS + 0.65s gaps). Anchor helpers A/AEnd (15/10-compatible aliases frameOf/frameOfEnd,
// plus useA) match a phrase against CONSECUTIVE ASR words in
// public/news-daily-20261016/words.json (scene-LOCAL seconds) — ASR spellings are the
// authority ("nã mô cầu", "bà học sinh", "LBHMZ", "11 ,3", "xục đổ", "bàn tin mai"...).
// Results are scene-local frames CLAMPED into the scene window, so nothing reveals before
// its phrase or runs past the cut.
import React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import wordsJson from "../../public/news-daily-20261016/words.json";
import timingJson from "../../public/news-daily-20261016/scene_timing.json";
import { SPRING } from "./theme";

export const FPS = 30;

export type SceneId = "s01" | "s02" | "s03" | "s04" | "s05" | "s06" | "s07" | "s08";

interface RawWord { word: string; start: number; end: number }
interface RawScene {
  scene_id: SceneId; start_seconds: number; duration_seconds: number;
  start_frame: number; end_frame: number;
}
export interface SceneTiming extends RawScene { scene_frames: number }

const RAW = timingJson as unknown as { total_duration_seconds: number; scenes: RawScene[] };
const WORDS: Record<SceneId, RawWord[]> = wordsJson as unknown as Record<SceneId, RawWord[]>;

export const SCENE_TIMING: SceneTiming[] = RAW.scenes.map((s) => ({
  ...s,
  scene_frames: s.end_frame - s.start_frame + 1,
}));

/** Measured narration length (seconds). */
export const AUDIO_SECONDS = RAW.total_duration_seconds; // 64.397
/** Whole-video length incl. 1s tail hold after the audio ends. */
export const TOTAL_FRAMES = Math.ceil(AUDIO_SECONDS * FPS) + 30; // 1962

export const getSceneTiming = (id: SceneId): SceneTiming => {
  const t = SCENE_TIMING.find((s) => s.scene_id === id);
  if (!t) throw new Error(`[news-20261016/timing] unknown scene ${id}`);
  return t;
};

// --- phrase matching --------------------------------------------------------
// Normalize exactly like scripts/ audit (python): drop punctuation, lowercase, split spaces.
const PUNCT = /[,.\-–—'"«»!?;:()]/g;
const norm = (s: string): string => s.replace(PUNCT, "").trim().toLowerCase();
const tokenize = (s: string): string[] => s.split(/\s+/).map(norm).filter(Boolean);

const findPhrase = (
  sid: SceneId, phrase: string, occurrence: number,
): { start: number; end: number } | null => {
  const words = WORDS[sid] ?? [];
  const toks = tokenize(phrase);
  if (toks.length === 0) return null;
  const normed = words.map((w) => norm(w.word));
  let hits = 0;
  for (let i = 0; i + toks.length <= normed.length; i++) {
    let ok = true;
    for (let j = 0; j < toks.length; j++) {
      if (normed[i + j] !== toks[j]) { ok = false; break; }
    }
    if (ok) {
      if (hits === occurrence) return { start: words[i].start, end: words[i + toks.length - 1].end };
      hits++;
    }
  }
  return null;
};

const clampIn = (sid: SceneId, fr: number): number =>
  Math.min(Math.max(fr, 0), getSceneTiming(sid).scene_frames - 1);

/**
 * Anchor: scene-local START frame of a spoken phrase (ASR words), clamped into the scene
 * window. A number passthrough returns that raw scene-local frame (e.g. kicker at 0).
 */
export const A = (sid: SceneId, phrase: string | number, occurrence = 0): number => {
  if (typeof phrase === "number") return clampIn(sid, phrase);
  const m = findPhrase(sid, phrase, occurrence);
  if (!m) throw new Error(`[news-20261016/timing] phrase not found in ${sid}: "${phrase}"`);
  return clampIn(sid, Math.round(m.start * FPS));
};

/** End anchor: scene-local END frame of the phrase's last spoken word (clamped). */
export const AEnd = (sid: SceneId, phrase: string, occurrence = 0): number => {
  const m = findPhrase(sid, phrase, occurrence);
  if (!m) throw new Error(`[news-20261016/timing] phrase not found in ${sid}: "${phrase}"`);
  return clampIn(sid, Math.round(m.end * FPS));
};

// 15/10-compatible names. useA is the same pure static lookup — safe inside any component.
export const frameOf = A;
export const frameOfEnd = AEnd;
export const useA = A;

/** Speech-locked reveal wrapper — gentle entrance-only spring + fade (camera stays static). */
export const Spoken: React.FC<{
  at: number; fromX?: number; fromY?: number; style?: React.CSSProperties; children?: React.ReactNode;
}> = ({ at, fromX = 0, fromY = 26, style, children }) => {
  const f = useCurrentFrame();
  const p = spring({ frame: f - at, fps: FPS, config: { damping: 200, stiffness: 90, mass: 0.9 } });
  const op = interpolate(f - at, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ opacity: op, transform: `translate(${fromX * (1 - p)}px, ${fromY * (1 - p)}px)`, ...style }}>
      {children}
    </div>
  );
};
