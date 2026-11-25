// Frozen timing contract derived strictly from projects/intro-kenh-ky-chu-phap-luat/assets/scene_timing.json
import { BRAND_BUMPER_FRAMES } from "../components/news";

export const FPS = 30 as const;
export const ASSET_BASE = "intro-kenh-ky-chu-phap-luat" as const;
export const ARCHIVAL_IMG_FILTER = "contrast(1.08) brightness(0.92)" as const;

export function after(frame: number, start: number): boolean {
  return frame >= start;
}

export function between(frame: number, start: number, end: number): boolean {
  return frame >= start && frame < end;
}

export interface SceneTimingEntry {
  scene_id: string;
  sectionId: string;
  start_frame: number;
  duration_frames: number;
  start_seconds: number;
  end_seconds: number;
  speech_seconds: number;
}

export const SCENES: Record<string, SceneTimingEntry> = {
  "scene-1": { scene_id: "scene-1", sectionId: "s01", start_frame: 0, duration_frames: 219, start_seconds: 0.0, end_seconds: 7.3, speech_seconds: 7.065 },
  "scene-2": { scene_id: "scene-2", sectionId: "s02", start_frame: 219, duration_frames: 302, start_seconds: 7.3, end_seconds: 17.367, speech_seconds: 9.833 },
  "scene-3": { scene_id: "scene-3", sectionId: "s03", start_frame: 521, duration_frames: 276, start_seconds: 17.367, end_seconds: 26.567, speech_seconds: 8.955 },
  "scene-4": { scene_id: "scene-4", sectionId: "s04", start_frame: 797, duration_frames: 250, start_seconds: 26.567, end_seconds: 34.9, speech_seconds: 8.08 },
  "scene-5": { scene_id: "scene-5", sectionId: "s05", start_frame: 1047, duration_frames: 298, start_seconds: 34.9, end_seconds: 44.833, speech_seconds: 9.684 },
  "scene-6": { scene_id: "scene-6", sectionId: "s06", start_frame: 1345, duration_frames: 278, start_seconds: 44.833, end_seconds: 54.1, speech_seconds: 9.014 },
  "scene-7": { scene_id: "scene-7", sectionId: "s07", start_frame: 1623, duration_frames: 219, start_seconds: 54.1, end_seconds: 61.4, speech_seconds: 7.064 },
};

export const SCENE_ORDER = ["scene-1", "scene-2", "scene-3", "scene-4", "scene-5", "scene-6", "scene-7"] as const;
export const SCENES_END_FRAME = 1842;
export const TOTAL_FRAMES = 1932;
export { BRAND_BUMPER_FRAMES };
