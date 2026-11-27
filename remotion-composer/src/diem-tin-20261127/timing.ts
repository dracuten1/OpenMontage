// Frozen timing contract derived strictly from projects/diem-tin-20261127/assets/scene_timing.json
import cuesData from "../../public/diem-tin-20261127/cues.json";
import { BRAND_BUMPER_FRAMES } from "../components/news";
import { CuesMap, resolveCueFrame } from "../core/timingCues";

export const FPS = 30 as const;
export const ASSET_BASE = "diem-tin-20261127" as const;
export const ARCHIVAL_IMG_FILTER = "contrast(1.08) brightness(0.92)" as const;

const ALIGNED_CUES: CuesMap = (cuesData as { cues?: CuesMap }).cues ?? {};

export function cueFrame(
  sectionId: string,
  phrase: string,
  fallbackFrame = 0,
  leadFrames = 3,
): number {
  return resolveCueFrame(ALIGNED_CUES, sectionId, phrase, fallbackFrame, leadFrames);
}

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
  "scene-1": { scene_id: "scene-1", sectionId: "s01", start_frame: 0, duration_frames: 361, start_seconds: 0.0, end_seconds: 12.033, speech_seconds: 11.775 },
  "scene-2": { scene_id: "scene-2", sectionId: "s02", start_frame: 361, duration_frames: 532, start_seconds: 12.033, end_seconds: 29.766, speech_seconds: 17.491 },
  "scene-3": { scene_id: "scene-3", sectionId: "s03", start_frame: 893, duration_frames: 432, start_seconds: 29.766, end_seconds: 44.166, speech_seconds: 14.152 },
  "scene-4": { scene_id: "scene-4", sectionId: "s04", start_frame: 1325, duration_frames: 385, start_seconds: 44.166, end_seconds: 56.999, speech_seconds: 12.587 },
  "scene-5": { scene_id: "scene-5", sectionId: "s05", start_frame: 1710, duration_frames: 405, start_seconds: 56.999, end_seconds: 70.499, speech_seconds: 13.253 },
  "scene-6": { scene_id: "scene-6", sectionId: "s06", start_frame: 2115, duration_frames: 383, start_seconds: 70.499, end_seconds: 83.266, speech_seconds: 12.522 },
  "scene-7": { scene_id: "scene-7", sectionId: "s07", start_frame: 2498, duration_frames: 323, start_seconds: 83.266, end_seconds: 94.033, speech_seconds: 10.528 },
  "scene-8": { scene_id: "scene-8", sectionId: "s08", start_frame: 2821, duration_frames: 377, start_seconds: 94.033, end_seconds: 106.6, speech_seconds: 12.302 },
  "scene-9": { scene_id: "scene-9", sectionId: "s09", start_frame: 3198, duration_frames: 447, start_seconds: 106.6, end_seconds: 121.5, speech_seconds: 14.665 },
  "scene-10": { scene_id: "scene-10", sectionId: "s10", start_frame: 3645, duration_frames: 350, start_seconds: 121.5, end_seconds: 133.167, speech_seconds: 11.418 },
  "scene-11": { scene_id: "scene-11", sectionId: "s11", start_frame: 3995, duration_frames: 393, start_seconds: 133.167, end_seconds: 146.267, speech_seconds: 12.852 },
  "scene-12": { scene_id: "scene-12", sectionId: "s12", start_frame: 4388, duration_frames: 184, start_seconds: 146.267, end_seconds: 152.4, speech_seconds: 5.895 },
};

export const SCENE_ORDER = ["scene-1", "scene-2", "scene-3", "scene-4", "scene-5", "scene-6", "scene-7", "scene-8", "scene-9", "scene-10", "scene-11", "scene-12"] as const;
export const SCENES_END_FRAME = 4572;
export const TOTAL_FRAMES = 4662;
export { BRAND_BUMPER_FRAMES };
