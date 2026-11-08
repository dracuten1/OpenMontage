import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';

describe('semantic event CLI', () => {
  it('prints validation failure reason to stderr', () => {
    const result = spawnSync(process.execPath, ['--experimental-strip-types', 'src/components/semanticEvents.cli.mjs', 'src/components/fixtures/semantic-events-invalid.json'], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('gain out of range');
  });
});
