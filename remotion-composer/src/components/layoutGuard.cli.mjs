import { readFileSync } from 'node:fs';
import { validateSceneLayout } from './layoutGuard.runtime.mjs';
const path = process.argv[2];
if (!path) { console.error('Usage: npm run validate:layout -- <scene-spec.json>'); process.exit(1); }
try { validateSceneLayout(JSON.parse(readFileSync(path, 'utf8'))); console.log(`PASS: layout valid (${path})`); }
catch (error) { console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); }
