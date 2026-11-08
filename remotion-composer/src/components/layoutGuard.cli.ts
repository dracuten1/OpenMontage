import { readFileSync } from 'node:fs';
import { validateSceneLayout, type SceneLayout } from './layoutGuard';

const specPath = process.argv[2];
if (!specPath) { console.error('Usage: npm run validate:layout -- <scene-spec.json>'); process.exit(1); }
try {
  const scene = JSON.parse(readFileSync(specPath, 'utf8')) as SceneLayout;
  validateSceneLayout(scene);
  console.log(`PASS: layout valid (${specPath})`);
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
