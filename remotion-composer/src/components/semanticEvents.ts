import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type AlignmentWord = { start_ms: number; end_ms: number };
export type EventScene = {
  scene_id: string;
  start_frame: number;
  end_frame: number;
  words: AlignmentWord[];
  no_sfx?: boolean;
  no_sfx_reason?: string;
};
export type SemanticEvent = {
  scene_id: string; event_id: string; word_span: [number, number]; visual_onset_frame: number;
  /** Word-timeline milliseconds, same basis as scene.words (not scene-global); resolve frame/sample are relative offsets within scene. */
  contact_peak_ms: number; sfx_asset: string; audible_attack_ms: number; gain: number; duration_tail_frames: number;
};
export type EventSpec = { schema_version: number; fps: number; sample_rate: number; scenes: EventScene[]; sfx_manifest: string[]; events: SemanticEvent[] };
export type ResolvedSemanticEvent = { visualCueFrame: number; sfxCue: { asset: string; frame: number; sample: number; gain: number; durationTailFrames: number } };
export const EVENT_SCHEMA_VERSION = 1;
/** Allowed audible-attack/contact offset: 20 ms (≈0.6 frames at 30fps). */
export const CONTACT_ATTACK_TOLERANCE_MS = 20;
/** SFX overlap allowance: exactly 1 frame. Positive overlap <= 1 frame passes; >1 frame rejects. */
export const SFX_WINDOW_OVERLAP_TOLERANCE_FRAMES = 1;

function assert(condition: unknown, reason: string): asserts condition { if (!condition) throw new Error(reason); }
export function validateEventSpec(value: unknown): value is EventSpec {
  assert(value !== null && typeof value === 'object', 'spec must be an object');
  const spec = value as EventSpec;
  const assertKnownFields = (object: object, allowed: readonly string[], label: string) => {
    for (const field of Object.keys(object)) {
      assert(allowed.includes(field), `unknown field ${field} in ${label}; allowed fields: ${allowed.join(', ')}`);
    }
  };
  assertKnownFields(spec, ['schema_version', 'fps', 'sample_rate', 'scenes', 'sfx_manifest', 'events'], 'spec');
  assert(spec.schema_version === EVENT_SCHEMA_VERSION, `schema_version must equal ${EVENT_SCHEMA_VERSION}`);
  assert(Number.isFinite(spec.fps) && spec.fps > 0, 'fps must be positive');
  assert(Number.isInteger(spec.sample_rate) && spec.sample_rate > 0, 'sample_rate must be positive integer');
  assert(Array.isArray(spec.scenes) && Array.isArray(spec.sfx_manifest) && Array.isArray(spec.events), 'scenes, sfx_manifest, events must be arrays');
  const sceneMap = new Map<string, EventScene>();
  for (const scene of spec.scenes) {
    assertKnownFields(scene, ['scene_id', 'start_frame', 'end_frame', 'words', 'no_sfx', 'no_sfx_reason'], `scene ${scene.scene_id}`);
    assert(typeof scene.scene_id === 'string' && scene.scene_id.trim().length > 0 && !sceneMap.has(scene.scene_id), 'scene_id missing, empty, or duplicate');
    assert(Number.isInteger(scene.start_frame) && Number.isInteger(scene.end_frame) && scene.start_frame < scene.end_frame, `invalid frame span for scene ${scene.scene_id}`);
    assert(Array.isArray(scene.words) && scene.words.every(w => Number.isFinite(w.start_ms) && Number.isFinite(w.end_ms) && w.start_ms <= w.end_ms), `invalid alignment words for scene ${scene.scene_id}`);
    assert(scene.words.every((w, i) => i === 0 || w.start_ms >= scene.words[i - 1].start_ms), `word timings are not monotonic for scene ${scene.scene_id}`);
    assert(typeof scene.no_sfx !== 'boolean' || !scene.no_sfx || (typeof scene.no_sfx_reason === 'string' && scene.no_sfx_reason.trim().length > 0), `no_sfx requires a non-empty reason for scene ${scene.scene_id}`);
    sceneMap.set(scene.scene_id, scene);
  }
  const eventCounts = new Map<string, number>();
  const ids = new Set<string>();
  for (const event of spec.events) {
    assertKnownFields(event, ['event_id', 'scene_id', 'word_span', 'visual_onset_frame', 'contact_peak_ms', 'audible_attack_ms', 'sfx_asset', 'gain', 'duration_tail_frames'], `event ${event.event_id}`);
    assert(typeof event.event_id === 'string' && event.event_id.length > 0 && !ids.has(event.event_id), `missing or duplicate event_id: ${event.event_id}`); ids.add(event.event_id);
    const scene = sceneMap.get(event.scene_id); assert(scene, `unknown scene ${event.scene_id}`);
    eventCounts.set(scene.scene_id, (eventCounts.get(scene.scene_id) ?? 0) + 1);
    assert(!scene.no_sfx, `scene ${scene.scene_id} is marked no_sfx but has event ${event.event_id}`);
    assert(Number.isInteger(event.visual_onset_frame) && event.visual_onset_frame >= scene.start_frame && event.visual_onset_frame < scene.end_frame, `visual onset outside scene span for ${event.event_id}`);
    assert(Array.isArray(event.word_span) && event.word_span.length === 2 && Number.isInteger(event.word_span[0]) && Number.isInteger(event.word_span[1]) && event.word_span[0] >= 0 && event.word_span[1] > event.word_span[0] && event.word_span[1] <= scene.words.length, `word_span not contained in scene words for ${event.event_id}`);
    assert(Number.isFinite(event.contact_peak_ms), `contact_peak_ms required for ${event.event_id}`);
    assert(event.contact_peak_ms >= 0, `contact_peak_ms must be non-negative for ${event.event_id}`);
    const firstWord = scene.words[event.word_span[0]];
    const lastWord = scene.words[event.word_span[1] - 1];
    // 20ms tolerance is inclusive at both word-range edges; sample/frame conversion uses this word-timeline offset basis.
    assert(event.contact_peak_ms >= firstWord.start_ms - CONTACT_ATTACK_TOLERANCE_MS && event.contact_peak_ms <= lastWord.end_ms + CONTACT_ATTACK_TOLERANCE_MS, `contact_peak_ms outside word range (±${CONTACT_ATTACK_TOLERANCE_MS}ms) for ${event.event_id}`);
    assert(Number.isFinite(event.audible_attack_ms), `audible_attack_ms required for ${event.event_id}`);
    assert(Math.abs(event.audible_attack_ms - event.contact_peak_ms) <= CONTACT_ATTACK_TOLERANCE_MS, `audible attack/contact deviation exceeds ${CONTACT_ATTACK_TOLERANCE_MS}ms for ${event.event_id}`);
    const resolvedFrame = scene.start_frame + Math.round(event.contact_peak_ms * spec.fps / 1000);
    assert(resolvedFrame >= scene.start_frame && resolvedFrame < scene.end_frame, `resolved SFX frame outside scene span for ${event.event_id}`);
    assert(typeof event.sfx_asset === 'string' && spec.sfx_manifest.includes(event.sfx_asset), `SFX asset missing from manifest for ${event.event_id}`);
    assert(Number.isFinite(event.gain) && event.gain >= 0 && event.gain <= 1, `gain out of range for ${event.event_id}`);
    assert(Number.isInteger(event.duration_tail_frames) && event.duration_tail_frames >= 0 && event.visual_onset_frame + event.duration_tail_frames <= scene.end_frame, `tail beyond scene end for ${event.event_id}`);
  }
  // TS owns SFX onset and window validation because resolver derives frame from contact_peak_ms.
  const windowsByScene = new Map<string, { eventId: string; start: number; end: number }[]>();
  for (const event of spec.events) {
    const scene = sceneMap.get(event.scene_id)!;
    const start = Math.round(event.contact_peak_ms * spec.fps / 1000);
    const windows = windowsByScene.get(event.scene_id) ?? [];
    for (const prior of windows) {
      const overlap = Math.min(prior.end, start + event.duration_tail_frames) - Math.max(prior.start, start);
      assert(overlap <= SFX_WINDOW_OVERLAP_TOLERANCE_FRAMES, `SFX windows overlap for ${prior.eventId} and ${event.event_id}`);
    }
    windows.push({ eventId: event.event_id, start, end: start + event.duration_tail_frames });
    windowsByScene.set(event.scene_id, windows);
  }
  for (const scene of spec.scenes) {
    assert((eventCounts.get(scene.scene_id) ?? 0) > 0 || scene.no_sfx === true, `scene ${scene.scene_id} has no events; set no_sfx with no_sfx_reason to declare intentional silence`);
  }
  return true;
}
export function resolveSemanticEvent(event: SemanticEvent, fps: number, sampleRate: number, sceneStartFrame = 0): ResolvedSemanticEvent {
  const frame = sceneStartFrame + Math.round(event.contact_peak_ms * fps / 1000);
  return { visualCueFrame: event.visual_onset_frame, sfxCue: { asset: event.sfx_asset, frame, sample: Math.round(event.contact_peak_ms * sampleRate / 1000), gain: event.gain, durationTailFrames: event.duration_tail_frames } };
}
export function loadEventSpec(path: string): EventSpec {
  const value: unknown = JSON.parse(readFileSync(resolve(path), 'utf8'));
  validateEventSpec(value); return value as EventSpec;
}
