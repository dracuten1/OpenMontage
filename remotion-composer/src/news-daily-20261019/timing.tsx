// timing.tsx — news-daily-20261019.
// SceneId s01..s08; measured scene windows and scene-local aligned word times.
// A/AEnd match exact consecutive normalized canonical tokens and return raw rounded
// frames, rejecting timestamps outside the scene's allowed seconds range.
// Anchor phrases use ASR spelling from anchor_report v5 (faster-whisper DTW force-align).
import React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import wordsJson from "../../public/news-daily-20261019/words.json";
import timingJson from "../../public/news-daily-20261019/scene_timing.json";
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
export const AUDIO_SECONDS = RAW.total_duration_seconds; // 96.105
/** Whole-video length incl. 1s tail hold after the audio ends. */
export const TOTAL_FRAMES = Math.ceil(AUDIO_SECONDS * FPS) + 30; // 2914

export const getSceneTiming = (id: SceneId): SceneTiming => {
  const t = SCENE_TIMING.find((s) => s.scene_id === id);
  if (!t) throw new Error(`[news-daily-20261019/timing] unknown scene ${id}`);
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

const anchorFrame = (sid: SceneId, rawSeconds: number, anchor: string): number => {
  const maxSeconds = getSceneTiming(sid).duration_seconds + 0.2;
  if (!Number.isFinite(rawSeconds) || rawSeconds < 0 || rawSeconds > maxSeconds) {
    throw new Error(
      `[news-daily-20261019/timing] invalid ${anchor} in ${sid}: ${rawSeconds}s; expected finite seconds in [0, ${maxSeconds}]`,
    );
  }
  return Math.round(rawSeconds * FPS);
};

/** Scene-local START frame of an exact spoken phrase, validated before rounding. */
export const A = (sid: SceneId, phrase: string | number, occurrence = 0): number => {
  if (typeof phrase === "number") return anchorFrame(sid, phrase / FPS, `A numeric frame ${phrase}`);
  const m = findPhrase(sid, phrase, occurrence);
  if (!m) throw new Error(`[news-daily-20261019/timing] phrase not found in ${sid}: "${phrase}" (occurrence ${occurrence})`);
  return anchorFrame(sid, m.start, `A start of "${phrase}" (occurrence ${occurrence})`);
};

/** Scene-local END frame of the phrase's last word, validated before rounding. */
export const AEnd = (sid: SceneId, phrase: string | number, occurrence = 0): number => {
  if (typeof phrase === "number") return anchorFrame(sid, phrase / FPS, `AEnd numeric frame ${phrase}`);
  const m = findPhrase(sid, phrase, occurrence);
  if (!m) throw new Error(`[news-daily-20261019/timing] phrase not found in ${sid}: "${phrase}" (occurrence ${occurrence})`);
  return anchorFrame(sid, m.end, `AEnd end of "${phrase}" (occurrence ${occurrence})`);
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
