import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';
import timingJson from '../../public/affordable-housing-20261024/scene_timing.json';
import elementsJson from '../../public/affordable-housing-20261024/scene_elements.json';
import captionsJson from '../../public/affordable-housing-20261024/captions.json';
import wordsJson from '../../public/affordable-housing-20261024/words.json';

export const FPS = 30;

export type SceneId =
  | 's01'
  | 's02'
  | 's03'
  | 's04'
  | 's05'
  | 's06'
  | 's07'
  | 's08';

interface RawScene {
  scene_id: SceneId;
  section_id: string;
  start_frame: number;
  end_frame: number;
  duration_frames: number;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
  voice_seconds: number;
}

export interface SceneTiming extends RawScene {
  scene_frames: number;
}

const RAW_TIMING = timingJson as unknown as {fps: number; scenes: RawScene[]};

export const SCENE_TIMING: SceneTiming[] = RAW_TIMING.scenes.map((sc) => ({
  ...sc,
  scene_frames: sc.end_frame - sc.start_frame + 1,
}));

export const EPISODE_TOTAL_FRAMES =
  SCENE_TIMING[SCENE_TIMING.length - 1].end_frame + 1;

export const getSceneTiming = (id: SceneId): SceneTiming => {
  const t = SCENE_TIMING.find((sc) => sc.scene_id === id);
  if (!t) throw new Error(`[affordable-housing/timing] unknown scene ${id}`);
  return t;
};

export interface SceneElement {
  scene: SceneId;
  id: string;
  display: string;
  anchor: string;
  start: number;
  end: number;
  start_frame: number;
  persist?: string;
}

const ELEMENTS = (elementsJson as unknown as {scenes: SceneElement[]}).scenes;

export const el = (
  scene: SceneId,
  id: string,
): {start_frame_local: number; span: {start: number; end: number}} => {
  const sc = getSceneTiming(scene);
  const e = ELEMENTS.find((x) => x.scene === scene && x.id === id);
  if (!e)
    throw new Error(`[affordable-housing/timing] element not found: ${scene}/${id}`);
  const local = Math.max(0, Math.min(sc.scene_frames - 1, e.start_frame - sc.start_frame));
  return {start_frame_local: local, span: {start: e.start, end: e.end}};
};

export const elText = (scene: SceneId, id: string): string => {
  const e = ELEMENTS.find((x) => x.scene === scene && x.id === id);
  if (!e)
    throw new Error(`[affordable-housing/timing] element not found: ${scene}/${id}`);
  return e.display;
};

export interface CaptionChunk {
  chunk_text: string;
  start: number;
  end: number;
  anchor_start_word?: number;
  anchor_end_word?: number;
}

const CAPTIONS = captionsJson as unknown as Record<SceneId, CaptionChunk[]>;

export const captionAt = (
  scene: SceneId,
  localSec: number,
): CaptionChunk | null => {
  const chunks = CAPTIONS[scene] ?? [];
  let active: CaptionChunk | null = null;
  for (const c of chunks) {
    if (localSec >= c.start - 0.08) active = c;
  }
  return active;
};

export interface WordEntry {
  word: string;
  start: number;
  end: number;
}

export const WORDS = wordsJson as unknown as Record<SceneId, WordEntry[]>;

export const Spoken: React.FC<{
  at: number;
  fromX?: number;
  fromY?: number;
  scaleFrom?: number;
  cfg?: {damping: number; stiffness?: number; mass?: number};
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  at,
  fromX = 0,
  fromY = 14,
  scaleFrom = 0.94,
  cfg = {damping: 16, stiffness: 120, mass: 0.8},
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const p = spring({frame: frame - at, fps: FPS, config: cfg});
  const op = interpolate(frame - at, [0, 7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sc = scaleFrom + (1 - scaleFrom) * p;
  return React.createElement(
    'div',
    {
      style: {
        opacity: op,
        transform: `translate(${fromX * (1 - p)}px, ${fromY * (1 - p)}px) scale(${sc})`,
        ...style,
      },
    },
    children,
  );
};
