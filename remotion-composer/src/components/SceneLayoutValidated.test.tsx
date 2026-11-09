import React from 'react';
// @ts-expect-error react-dom types not installed in devDependencies
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SceneLayoutValidated } from './SceneLayoutValidated';
import { DEFAULT_LAYOUT_PROFILE, type SceneLayout } from './layoutGuard';

describe('SceneLayoutValidated', () => {
  it('enforces layout contract in production render and throws on violating layout', () => {
    const priorNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const violatingScene: SceneLayout = {
        id: 'violating-scene',
        state: 'active',
        profile: DEFAULT_LAYOUT_PROFILE,
        onset: 0,
        end: 100,
        activeFrames: [10],
        extremaFrames: [0, 100],
        settleFrame: 20,
        elements: [
          {
            id: 'overflow-element',
            left: 950, // exceeds safeRight: 940
            top: 100,
            w: 200,
            h: 80,
            state: 'active',
            contentId: 'c1',
            dataId: 'd1',
            unit: 'VND',
            sourceId: 's1',
            cueId: 'q1',
            startFrame: 0,
            endFrame: 100,
          },
        ],
      };
      expect(() => {
        renderToStaticMarkup(
          <SceneLayoutValidated scene={violatingScene}>
            <div>child</div>
          </SceneLayoutValidated>
        );
      }).toThrow(/layoutGuard/);
    } finally {
      process.env.NODE_ENV = priorNodeEnv;
    }
  });

  it('revalidates when an already-validated scene object is mutated in place', () => {
    const validScene: SceneLayout = {
      id: 'mutated-scene',
      state: 'active',
      profile: DEFAULT_LAYOUT_PROFILE,
      onset: 0,
      end: 100,
      activeFrames: [10],
      extremaFrames: [0, 100],
      settleFrame: 20,
      elements: [
        {
          id: 'mutating-element',
          left: 200,
          top: 100,
          w: 200,
          h: 80,
          state: 'active',
          contentId: 'c1',
          dataId: 'd1',
          unit: 'VND',
          sourceId: 's1',
          cueId: 'q1',
          startFrame: 0,
          endFrame: 100,
        },
      ],
    };

    // First render: valid layout passes and gets memoized.
    expect(() => {
      renderToStaticMarkup(
        <SceneLayoutValidated scene={validScene}>
          <div>child</div>
        </SceneLayoutValidated>
      );
    }).not.toThrow();

    // Mutate the SAME object reference in place so it now violates the contract.
    validScene.elements[0].left = 950; // exceeds safeRight: 940

    // Second render of the same reference must revalidate and throw.
    expect(() => {
      renderToStaticMarkup(
        <SceneLayoutValidated scene={validScene}>
          <div>child</div>
        </SceneLayoutValidated>
      );
    }).toThrow(/layoutGuard/);
  });
});
