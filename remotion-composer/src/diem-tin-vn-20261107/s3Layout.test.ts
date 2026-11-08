import { strict as assert } from 'node:assert';
import { test } from 'vitest';
import { assertNoOverlap, transformedBounds } from '../components/layoutGuard';
import { S3_BLOCKS, S3_ROW_RECTS, S3_ROW_CONTENT_RECTS, assertS3Rows } from './s3Layout';

test('S3 rows/content bounds and deliberate collisions', () => {
  assertNoOverlap(S3_BLOCKS);
  assertS3Rows(S3_ROW_RECTS, S3_ROW_CONTENT_RECTS);
  assert.equal(S3_ROW_RECTS.length, 3);
  assert.equal(S3_ROW_CONTENT_RECTS.length, 3);
  assert.throws(() => assertS3Rows(S3_ROW_RECTS, S3_ROW_CONTENT_RECTS.map((r, i) => i === 0 ? { ...r, h: S3_ROW_RECTS[0].h + 1 } : r)), /s3_row_content_0/);
  assert.throws(() => assertS3Rows(S3_ROW_RECTS.map((r, i) => i === 1 ? { ...r, top: S3_ROW_RECTS[0].top + 1 } : r), S3_ROW_CONTENT_RECTS), /overlaps/);
  const moved = transformedBounds({ id: 'moving', left: 0, top: 0, w: 100, h: 100 }, 1, 0, 24);
  assert.throws(() => assertNoOverlap([moved, { id: 'other', left: 0, top: 110, w: 100, h: 20 }]), /overlaps/);
  assert.throws(() => assertNoOverlap([S3_BLOCKS[0], { ...S3_BLOCKS[1], top: 700 }]), /overlaps/);
});
