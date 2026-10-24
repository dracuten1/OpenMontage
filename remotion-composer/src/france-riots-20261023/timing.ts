// france-riots-20261023 — timing, derived from
// public/france-riots-20261023/{scene_timing,scene_elements,captions}.json
// (SSOT, lead-verified on disk; audio NOT regenerated here).
//
// reveal_local = element.start_frame (GLOBAL) - scene.start_frame.
// Static camera (standing rule) — no zoom/push/Ken Burns.

import React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import timingJson from "../../public/france-riots-20261023/scene_timing.json";
import elementsJson from "../../public/france-riots-20261023/scene_elements.json";
import captionsJson from "../../public/france-riots-20261023/captions.json";

export const FPS = 30;

export type FullSceneId =
  | "s01" | "s02" | "s03" | "s04" | "s05" | "s06" | "s07"
  | "s08" | "s09" | "s10" | "s11" | "s12" | "s13";

interface RawScene {
  scene_id: FullSceneId;
  start_frame: number;
  end_frame: number;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
}
export interface FullSceneTiming extends RawScene {
  scene_frames: number;
}

const RAW_FULL = timingJson as unknown as { fps: number; scenes: RawScene[] };

export const SCENE_TIMING: FullSceneTiming[] = RAW_FULL.scenes.map((sc) => ({
  ...sc,
  scene_frames: sc.end_frame - sc.start_frame + 1,
}));

/** Whole-episode length — from actual scene_timing (4150), not an estimate. */
export const EPISODE_TOTAL_FRAMES =
  SCENE_TIMING[SCENE_TIMING.length - 1].end_frame + 1;

export const getSceneTiming = (id: FullSceneId): FullSceneTiming => {
  const t = SCENE_TIMING.find((sc) => sc.scene_id === id);
  if (!t) throw new Error(`[france-riots/timing] unknown scene ${id}`);
  return t;
};

// --- elements ----------------------------------------------------------------

export interface SceneElement {
  scene: FullSceneId;
  id: string;
  display: string;
  anchor: string;
  start: number; // scene-local seconds
  end: number;
  start_frame: number; // GLOBAL frame
  persist?: string;
}

const ELEMENTS = (elementsJson as unknown as { scenes: SceneElement[] }).scenes;

/** Resolve one element: LOCAL reveal frame + scene-local span. */
export const el = (
  scene: FullSceneId,
  id: string,
): { start_frame_local: number; span: { start: number; end: number } } => {
  const sc = getSceneTiming(scene);
  const e = ELEMENTS.find((x) => x.scene === scene && x.id === id);
  if (!e) throw new Error(`[france-riots/timing] element not found: ${scene}/${id}`);
  const local = e.start_frame - sc.start_frame;
  if (!Number.isInteger(local) || local < 0 || local >= sc.scene_frames) {
    throw new Error(
      `[france-riots/timing] bad local reveal ${local} for ${scene}/${id} (scene_frames=${sc.scene_frames})`,
    );
  }
  return { start_frame_local: local, span: { start: e.start, end: e.end } };
};

/** Whitelisted display string, rendered verbatim. */
export const elText = (scene: FullSceneId, id: string): string => {
  const e = ELEMENTS.find((x) => x.scene === scene && x.id === id);
  if (!e) throw new Error(`[france-riots/timing] element not found: ${scene}/${id}`);
  return e.display;
};

// --- captions ----------------------------------------------------------------

export interface CaptionChunk {
  chunk_text: string;
  start: number; // scene-local seconds
  end: number;
}

const CAPTIONS = captionsJson as unknown as Record<FullSceneId, CaptionChunk[]>;

/** Caption chunk active at scene-local time `localSec` (last chunk whose start <= t). */
export const captionAt = (
  scene: FullSceneId,
  localSec: number,
): CaptionChunk | null => {
  const chunks = CAPTIONS[scene] ?? [];
  let active: CaptionChunk | null = null;
  for (const c of chunks) if (localSec >= c.start) active = c;
  return active;
};

// --- speech-locked reveal wrapper ---------------------------------------------

/** Entrance-only spring + fade from an element's LOCAL reveal frame.
 *  Static camera; stays visible through scene end (no exit fade). */
export const Spoken: React.FC<{
  at: number;
  fromX?: number;
  fromY?: number;
  cfg?: { damping: number; stiffness?: number; mass?: number };
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  at,
  fromX = 0,
  fromY = 8,
  cfg = { damping: 200, stiffness: 90, mass: 0.9 },
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - at, fps: FPS, config: cfg });
  const op = interpolate(frame - at, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return React.createElement(
    "div",
    {
      style: {
        opacity: op,
        transform: `translate(${fromX * (1 - p)}px, ${fromY * (1 - p)}px)`,
        ...style,
      },
    },
    children,
  );
};
