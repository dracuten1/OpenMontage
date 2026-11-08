import React, { useEffect } from 'react';
import { validateSceneLayout, type SceneLayout } from './layoutGuard';

/** Opt-in development wrapper; validates once on mount and never moves authored layout. */
export function SceneLayoutValidated({ scene, children }: { scene: SceneLayout; children: React.ReactNode }): React.ReactElement {
  useEffect(() => { if (process.env.NODE_ENV !== 'production') validateSceneLayout(scene); }, [scene]);
  return <>{children}</>;
}
