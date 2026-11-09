import React from 'react';
import { validateSceneLayout, type SceneLayout } from './layoutGuard';

// Memoize validated scenes by CONTENT SIGNATURE, not object identity: a scene
// object mutated in place must be revalidated. Payloads are plain serializable
// data, so JSON.stringify is a sound content key.
const validatedScenes = new WeakMap<object, string>();

let unserializableCount = 0;

function sceneSignature(scene: object): string {
  try {
    const serialized = JSON.stringify(scene);
    if (typeof serialized === 'string') return serialized;
  } catch {
    // fall through to the always-different sentinel below
  }
  // Non-serializable payload -> always revalidate (fail safe).
  return 'unserializable:' + (unserializableCount += 1);
}

/**
 * Validated layout wrapper; enforces layout contract in all environments
 * including production renders (no dev-only gate).
 * Asserts fire synchronously at render time on the first frame.
 */
export function SceneLayoutValidated({ scene, children }: { scene: SceneLayout; children: React.ReactNode }): React.ReactElement {
  if (scene && typeof scene === 'object') {
    const signature = sceneSignature(scene);
    if (validatedScenes.get(scene) !== signature) {
      validateSceneLayout(scene);
      validatedScenes.set(scene, signature);
    }
  } else {
    validateSceneLayout(scene);
  }
  return <>{children}</>;
}
