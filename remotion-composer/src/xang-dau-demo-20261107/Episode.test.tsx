import React from 'react';
// @ts-expect-error react-dom types not installed in devDependencies
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { validateSceneLayout } from '../components/layoutGuard';
import { SceneLayoutValidated } from '../components/SceneLayoutValidated';
import { S1_LAYOUT, S1_PUMP_EVENT, S1_PUMP_RESOLVED } from './Episode';

describe('xang-dau-demo-20261107 wired episode contracts', () => {
  it('validates S1 layout specification against layoutGuard', () => {
    expect(validateSceneLayout(S1_LAYOUT)).toBe(true);
  });

  it('drives both visual cue and audio SFX cue from single semantic event', () => {
    expect(S1_PUMP_EVENT.visual_onset_frame).toBe(8);
    expect(S1_PUMP_RESOLVED.visualCueFrame).toBe(8);
    expect(S1_PUMP_RESOLVED.sfxCue.frame).toBe(8);
    expect(S1_PUMP_RESOLVED.sfxCue.asset).toBe('swoosh-quick.mp3');
    expect(S1_PUMP_RESOLVED.sfxCue.gain).toBe(0.398);
    expect(S1_PUMP_RESOLVED.sfxCue.durationTailFrames).toBe(10);
  });

  it('enforces layout contract through SceneLayoutValidated on render', () => {
    const invalidLayout = {
      ...S1_LAYOUT,
      elements: [
        {
          ...S1_LAYOUT.elements[0],
          left: 950, // exceeds safeRight 940
        },
      ],
    };

    expect(() => {
      renderToStaticMarkup(
        <SceneLayoutValidated scene={invalidLayout}>
          <div>violating-scene</div>
        </SceneLayoutValidated>
      );
    }).toThrow(/safe-zone/);
  });
});
