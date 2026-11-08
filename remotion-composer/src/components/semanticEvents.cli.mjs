#!/usr/bin/env node
import { loadEventSpec } from './semanticEvents.ts';
const path = process.argv[2];
if (!path) { console.error('Usage: npm run validate:events -- <event-spec.json>'); process.exit(1); }
try { loadEventSpec(path); console.log(`PASS: events valid (${path})`); }
catch (error) { console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); }
