import { describe, expect, it } from 'vitest';
import { validateEventSpec, resolveSemanticEvent, SFX_WINDOW_OVERLAP_TOLERANCE_FRAMES } from './semanticEvents';
import valid from './fixtures/semantic-events-valid.json';

const copy = () => structuredClone(valid) as any;
const rejects = (x: unknown, reason: string) => expect(() => validateEventSpec(x)).toThrow(reason);
describe('semantic event contract', () => {
  it('rejects unknown event fields and names allowed fields', () => {
    const x = copy(); x.events[0].contact_peak_mss = 400;
    rejects(x, 'unknown field contact_peak_mss in event tap-1; allowed fields: event_id, scene_id, word_span, visual_onset_frame, contact_peak_ms, audible_attack_ms, sfx_asset, gain, duration_tail_frames');
  });
  it('rejects unknown scene fields and names allowed fields', () => {
    const x = copy(); x.scenes[0].scene_identifier = 'scene-1';
    rejects(x, 'unknown field scene_identifier in scene scene-1; allowed fields: scene_id, start_frame, end_frame, words, no_sfx, no_sfx_reason');
  });
  it('accepts valid fixture with every legitimate event and scene field', () => {
    const x = copy();
    x.scenes[0].no_sfx = false;
    x.scenes[0].no_sfx_reason = 'SFX permitted';
    expect(validateEventSpec(x)).toBe(true);
  });
  it('validates and resolves one visual/SFX event against alignment samples', () => {
    expect(validateEventSpec(valid)).toBe(true);
    const result = resolveSemanticEvent(valid.events[0] as import('./semanticEvents').SemanticEvent, 30, 48000, valid.scenes[0].start_frame);
    expect(result.visualCueFrame).toBe(12);
    expect(result.sfxCue.sample).toBe(19200);
    expect(result.sfxCue.frame).toBe(12);
  });
  it('accepts explicitly intentional no-SFX scene with reason', () => {
    const x = copy(); x.events = []; x.scenes[0].no_sfx = true; x.scenes[0].no_sfx_reason = 'Narration-only beat';
    expect(validateEventSpec(x)).toBe(true);
  });
  it('rejects negative contact even when audible attack is valid', () => {
    const x = copy(); x.events[0].contact_peak_ms = -16.7; x.events[0].audible_attack_ms = 0;
    rejects(x, 'contact_peak_ms must be non-negative');
  });
  it('rejects same-scene SFX windows overlapping beyond tolerance and names both events', () => {
    const x = copy();
    x.scenes[0].words.push({ start_ms: 650, end_ms: 800 });
    x.events[0].duration_tail_frames = 10;
    x.events.push({ ...x.events[0], event_id: 'tap-2', word_span: [3, 4], contact_peak_ms: 650, audible_attack_ms: 650, visual_onset_frame: 20, duration_tail_frames: 10 });
    rejects(x, 'SFX windows overlap for tap-1 and tap-2');
  });
  it('accepts adjacent SFX windows without overlap', () => {
    const x = copy();
    x.scenes[0].words.push({ start_ms: 700, end_ms: 850 });
    x.events[0].duration_tail_frames = 10;
    x.events.push({ ...x.events[0], event_id: 'tap-2', word_span: [3, 4], contact_peak_ms: 700, audible_attack_ms: 700, visual_onset_frame: 22, duration_tail_frames: 10 });
    expect(validateEventSpec(x)).toBe(true);
  });
  it(`accepts overlap exactly at ${SFX_WINDOW_OVERLAP_TOLERANCE_FRAMES}-frame tolerance`, () => {
    const x = copy();
    x.scenes[0].words.push({ start_ms: 700, end_ms: 850 });
    x.events[0].duration_tail_frames = 9;
    x.events.push({ ...x.events[0], event_id: 'tap-2', word_span: [3, 4], contact_peak_ms: 700, audible_attack_ms: 700, visual_onset_frame: 22, duration_tail_frames: 10 });
    expect(validateEventSpec(x)).toBe(true);
  });
  it('rejects SFX tail extending beyond scene end anchored to resolved contact frame (reviewer repro)', () => {
    // Reviewer repro: 30fps scene, frames [0,300), visual onset frame 0, contact 9000ms (= frame 270), tail 60 frames
    // visual_onset(0) + tail(60) = 60 <= 300, BUT resolvedFrame(270) + tail(60) = 330 > 300.
    const reproSpec = {
      schema_version: 1,
      fps: 30,
      sample_rate: 48000,
      scenes: [
        {
          scene_id: 'scene-repro',
          start_frame: 0,
          end_frame: 300,
          words: [{ start_ms: 0, end_ms: 10000 }],
        },
      ],
      sfx_manifest: ['tap.wav'],
      events: [
        {
          scene_id: 'scene-repro',
          event_id: 'repro-tail-overflow',
          word_span: [0, 1] as [number, number],
          visual_onset_frame: 0,
          contact_peak_ms: 9000,
          audible_attack_ms: 9000,
          sfx_asset: 'tap.wav',
          gain: 0.8,
          duration_tail_frames: 60,
        },
      ],
    };
    expect(() => validateEventSpec(reproSpec)).toThrow(/tail beyond scene end for repro-tail-overflow/);
  });
  const invalidCases: [string, (x: any) => void, string][] = [
    ['missing onset', x => delete x.events[0].audible_attack_ms, 'audible_attack_ms required'],
    ['onset outside scene span', x => { x.events[0].visual_onset_frame = 300; }, 'visual onset outside scene span'],
    ['word span not contained', x => { x.events[0].word_span = [0, 4]; }, 'word_span not contained'],
    ['SFX asset missing from manifest', x => { x.events[0].sfx_asset = 'missing.wav'; }, 'SFX asset missing from manifest'],
    ['gain out of range', x => { x.events[0].gain = 9; }, 'gain out of range'],
    ['tail beyond scene end', x => { x.events[0].duration_tail_frames = 400; }, 'tail beyond scene end'],
    ['duplicate event IDs', x => { x.events.push({ ...x.events[0] }); }, 'duplicate event_id'],
    ['schema version mismatch', x => { x.schema_version = 99; }, 'schema_version must equal'],
    ['silent scene without explicit declaration', x => { x.events = []; }, 'has no events; set no_sfx'],
    ['no_sfx without reason', x => { x.events = []; x.scenes[0].no_sfx = true; }, 'no_sfx requires a non-empty reason'],
    ['contact before word range', x => { x.events[0].contact_peak_ms = 379; x.events[0].audible_attack_ms = 379; }, 'contact_peak_ms outside word range'],
    ['contact after word range', x => { x.events[0].contact_peak_ms = 571; x.events[0].audible_attack_ms = 571; }, 'contact_peak_ms outside word range'],
    ['contact at inclusive tolerance boundary passes', x => { x.events[0].contact_peak_ms = 380; x.events[0].audible_attack_ms = 380; }, 'NEVER'],
    ['resolved frame outside scene', x => { x.events[0].contact_peak_ms = 800; x.events[0].audible_attack_ms = 800; x.events[0].word_span = [2, 3]; x.scenes[0].words[2] = { start_ms: 800, end_ms: 900 }; x.scenes[0].end_frame = 20; }, 'resolved SFX frame outside scene span'],
    ['audible attack tolerance breach', x => { x.events[0].audible_attack_ms = 421; }, 'audible attack/contact deviation exceeds 20ms'],
    ['empty scene id', x => { x.scenes[0].scene_id = ' '; }, 'scene_id missing, empty, or duplicate'],
    ['non-monotonic words', x => { x.scenes[0].words[2].start_ms = 300; }, 'word timings are not monotonic'],
  ];
  for (const [name, mutate, reason] of invalidCases) it(`rejects ${name}`, () => {
    const x = copy(); mutate(x);
    if (reason === 'NEVER') expect(validateEventSpec(x)).toBe(true);
    else rejects(x, reason);
  });
});
