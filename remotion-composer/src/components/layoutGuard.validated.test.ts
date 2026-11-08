import { describe, expect, it } from 'vitest';
import { layoutFlexSlots, assertNoOverlap, assertSafeZone, barSlots, DEFAULT_LAYOUT_PROFILE, estimateTextWidth, frameSpringProgress, interpolateAtFrame, layoutGridSlots, SAFE9x16, validateSceneLayout, assertInBounds, assertRailSafe, transformedBounds, transformedBoundsWithOrigin, type SceneLayout, type ValidatedElement } from './layoutGuard';

const element = (id: string, left = 150): ValidatedElement => ({ id, left, top: 100, w: 200, h: 80, state: 'active' as const, contentId: 'content-1', dataId: 'data-1', unit: 'VND', sourceId: 'source-1', cueId: 'cue-1' });
const scene = (elements = [element('a')]): SceneLayout => ({ id: 'scene', state: 'active', profile: DEFAULT_LAYOUT_PROFILE, onset: 10, end: 40, activeFrames: [20], extremaFrames: [25], settleFrame: 35, elements: elements.map(e => ({ ...e, startFrame: e.startFrame ?? 10, endFrame: e.endFrame ?? 40 })) });
describe('validated layout primitives', () => {
  it('rejects NaN/Infinity and invalid or oversized geometry', () => {
    for (const n of [NaN, Infinity, -Infinity]) expect(() => assertSafeZone({ id: 'bad', left: n, top: 0, w: 2, h: 2 })).toThrow();
    expect(() => assertSafeZone({ id: 'negative', left: 1, top: 1, w: -1, h: 2 })).toThrow();
    expect(() => assertInBounds({ id: 'nan', left: NaN, top: 0, w: 1, h: 1, containerW: 10, containerH: 10 })).toThrow();
    expect(() => assertInBounds({ id: 'negative', left: 0, top: 0, w: -1, h: 1, containerW: 10, containerH: 10 })).toThrow();
    expect(() => assertRailSafe({ id: 'infinity', rightDesign: Infinity, camMax: 1 })).toThrow();
    expect(() => assertRailSafe({ id: 'nan', rightDesign: 900, camMax: NaN })).toThrow();
    expect(() => assertSafeZone({ id: 'large', left: 0, top: 0, w: SAFE9x16.width + 1, h: 2 })).toThrow();
  });
  it('validates counts and derives flex/grid slots', () => {
    expect(() => barSlots({ containerX: 0, containerW: 100, margin: 0, count: 0, gap: 1, maxBarW: 10 })).toThrow();
    expect(() => layoutGridSlots({ containerX: 0, containerY: 0, containerW: 10, containerH: 10, columns: 0, rows: 1, gapX: 0, gapY: 0 })).toThrow();
    expect(layoutGridSlots({ containerX: 0, containerY: 0, containerW: 100, containerH: 50, columns: 2, rows: 1, gapX: 10, gapY: 0 })).toHaveLength(2);
    expect(() => layoutGridSlots({ containerX: 1070, containerY: 0, containerW: 20, containerH: 20, columns: 1, rows: 1, gapX: 0, gapY: 0 })).toThrow(/out-of-profile/);
    const flex = layoutFlexSlots({ containerX: 5, containerW: 90, gap: 10, grow: [1, 2] });
    expect(flex[0].width).toBeCloseTo(26.6667); expect(flex[1].width).toBeCloseTo(53.3333);
    expect(() => layoutFlexSlots({ containerX: 0, containerW: 100, gap: 0, grow: [1e308] })).toThrow(/<= 1e6/);
  });
  it('rejects rail drift beyond left safe edge', () => {
    expect(() => assertRailSafe({ id: 'left-drift', leftDesign: 200, rightDesign: 300, camMax: 2 })).toThrow(/left safe edge/);
    expect(() => assertRailSafe({ id: 'left-within', leftDesign: 300, rightDesign: 400, camMax: 1 })).not.toThrow();
  });
  it('rejects Vietnamese measured text overflow', () => expect(() => validateSceneLayout(scene([{ ...element('a'), text: 'Tiếng Việt dài vượt quá chiều rộng thẻ', measuredTextWidth: 250 }]))) .toThrow(/overflow/));
  it('requires all IDs, unit, and proper states', () => {
    expect(() => validateSceneLayout(scene([{ ...element('a'), contentId: '' }]))).toThrow(/required/);
    expect(() => validateSceneLayout(scene([{ ...element('a'), contentId: '   ' }]))).toThrow(/required/);
    expect(() => validateSceneLayout(scene([{ ...element('a'), dataId: '' }]))).toThrow(/required/);
    expect(() => validateSceneLayout(scene([{ ...element('a'), dataId: '   ' }]))).toThrow(/required/);
    expect(() => validateSceneLayout(scene([{ ...element('a'), sourceId: '' }]))) .toThrow(/required/);
    expect(() => validateSceneLayout(scene([{ ...element('a'), unit: '' }]))) .toThrow(/required/);
    expect(() => validateSceneLayout(scene([{ ...element('a'), cueId: '' }]))) .toThrow(/required/);
    expect(() => validateSceneLayout(scene([{ ...element('a'), state: 'hidden' as 'active' }]))).toThrow(/state/);
    expect(validateSceneLayout(scene([{ ...element('a'), state: 'settled' }, { ...element('b', 400), state: 'ghost' }]))).toBe(true);
  });
  it('rejects overlapping bars unless explicitly allowlisted', () => {
    expect(() => assertNoOverlap([element('a'), element('b', 200)])).toThrow(/overlaps/);
    expect(() => validateSceneLayout(scene([element('a'), element('b', 200)]))).toThrow(/overlaps/);
    expect(validateSceneLayout({ ...scene([element('a'), element('b', 200)]), intentionalOverlaps: ['a|b'] })).toBe(true);
  });
  it('rejects nested transforms and extrema escaping safe zone', () => {
    expect(() => validateSceneLayout(scene([{ ...element('a', 800), transforms: [{ scale: 1.2, dx: 20 }], extrema: [{ id: 'peak', left: 800, top: 100, w: 300, h: 80 }] }]))).toThrow(/safe-zone/);
    expect(() => validateSceneLayout(scene([{ ...element('a', 800), transforms: [{ scale: 1, dx: 50 }, { scale: 1.1, dx: 50 }], extrema: [{ id: 'peak', left: 800, top: 100, w: 300, h: 80 }] }]))).toThrow(/safe-zone/);
    const transformed = transformedBoundsWithOrigin({ id: 'edge', left: 900, top: 400, w: 30, h: 30 }, [{ scale: 2 }]);
    expect(transformed.left + transformed.w).toBe(945);
    expect(() => validateSceneLayout(scene([{ ...element('edge', 900), top: 400, w: 30, h: 30, transforms: [{ scale: 2 }], extrema: [{ id: 'edge-extrema', left: 900, top: 400, w: 30, h: 30 }] }]))).toThrow(/exceeds safe-zone/);
    expect(() => validateSceneLayout(scene([{ ...element('zero-scale'), transforms: [{ scale: 0 }], extrema: [{ id: 'declared', left: 150, top: 100, w: 20, h: 20 }] }]))).toThrow(/scale must be > 0/);
    expect(() => validateSceneLayout(scene([{ ...element('tight'), transforms: [{ scale: 1.5 }], extrema: [{ id: 'tight-extrema', left: 150, top: 100, w: 200, h: 80 }] }]))).toThrow(/exceeds safe-zone/);
    expect(validateSceneLayout(scene([{ ...element('honest', 300), transforms: [{ scale: 1.2 }], extrema: [{ id: 'honest-extrema', left: 270, top: 90, w: 250, h: 100 }] }]))).toBe(true);
  });
  it('rejects animated elements without extrema evidence', () => {
    expect(() => validateSceneLayout(scene([{ ...element('moving'), transforms: [{ dx: 1 }] }]))).toThrow(/requires validated extrema/);
    expect(validateSceneLayout(scene([{ ...element('moving'), transforms: [{ dx: 1 }], extrema: [{ id: 'peak', left: 151, top: 100, w: 200, h: 80 }] }]))).toBe(true);
  });
  it('rejects invalid direct-call profile edges', () => {
    expect(() => assertSafeZone({ id: 'x', left: 1, top: 1, w: 1, h: 1 }, { ...DEFAULT_LAYOUT_PROFILE, safeLeft: 1000 })).toThrow(/profile/);
  });
  it('uses Remotion center and zero transform origins', () => {
    const rect = { id: 'r', left: 200, top: 200, w: 100, h: 80 };
    const centerBounds = transformedBoundsWithOrigin(rect, [{ scale: 2, transformOrigin: 'center' }]);
    const zeroBounds = transformedBoundsWithOrigin(rect, [{ scale: 2, transformOrigin: 'zero' }]);
    expect(centerBounds).toEqual({ ...rect, left: 150, top: 160, w: 200, h: 160 });
    expect(zeroBounds).toEqual({ ...rect, left: 400, top: 400, w: 200, h: 160 });
    for (const r of [rect, { ...rect, left: -30, top: 45, w: 220, h: 60 }]) {
      for (const scale of [0.5, 1, 1.75]) for (const [dx, dy] of [[0, 0], [13, -7]] as const) {
        expect(transformedBoundsWithOrigin(r, [{ scale, dx, dy, transformOrigin: 'center' }])).toEqual(transformedBounds(r, scale, dx, dy));
      }
    }
    // Parent-box-center affine: original center=(125,125) is used in parent-local space each step.
    // Three steps: center scale 1.43, zero-origin identity, then center scale 1.4.
    // Original center=(250,225). k1=(-107.5,-96.75), k2=(0,0).
    // With a=1.43 before step 3, b1=-107.5 and b2=-107.5.
    // So k3x=(-85.85-(-107.5))/1.43=15.1398601399; since center contribution=-100,
    // dx3=115.1398601399. For y, b1=-96.75,b2=-96.75; k3y=(-90.2+96.75)/1.43=4.5804195804,
    // dy3=94.5804195804 (center contribution=-90). Then final b=(-85.85,-90.2), a=2.002.
    // Output=(200*2.002-85.85, 200*2.002-90.2, 100*2.002, 50*2.002)
    // =(314.55,310.2,200.2,100.1).
    expect(transformedBoundsWithOrigin({ id: 'three', left: 200, top: 200, w: 100, h: 50 }, [{ scale: 1.43 }, { scale: 1, transformOrigin: 'zero' }, { scale: 1.4, dx: 115.13986013986, dy: 94.58041958042 }])).toMatchObject({ left: expect.closeTo(314.55, 2), top: expect.closeTo(310.2, 2), w: expect.closeTo(200.2, 2), h: expect.closeTo(100.1, 2) });
  });
  it('rejects fractional scene and element frame boundaries', () => {
    expect(() => validateSceneLayout({ ...scene(), onset: 10.5 })).toThrow(/integer frames/);
    expect(() => validateSceneLayout({ ...scene(), end: 40.5 })).toThrow(/integer frames/);
    expect(() => validateSceneLayout({ ...scene(), settleFrame: 35.5 })).toThrow(/integer frames/);
    expect(() => validateSceneLayout(scene([{ ...element('a'), startFrame: 10.5, endFrame: 40 }]))).toThrow(/integer frames/);
    expect(() => validateSceneLayout(scene([{ ...element('a'), startFrame: 10, endFrame: 39.5 }]))).toThrow(/integer frames/);
  });
  it('rejects profile mismatch and partial/empty temporal probes', () => {
    expect(() => validateSceneLayout({ ...scene(), profile: { ...DEFAULT_LAYOUT_PROFILE, version: 2 } })).toThrow(/profile/);
    expect(() => validateSceneLayout({ ...scene(), activeFrames: [] })).toThrow(/probes/);
    expect(() => validateSceneLayout({ ...scene(), extremaFrames: [] })).toThrow(/probes/);
    expect(() => validateSceneLayout({ ...scene(), elements: [{ ...element('a'), startFrame: 15, endFrame: 35 }] })).toThrow(/coverage gap at frame 10/);
    expect(() => validateSceneLayout({ ...scene(), elements: [{ ...element('a'), startFrame: 10, endFrame: 20 }] })).toThrow(/coverage gap at frame 21/);
    expect(() => validateSceneLayout({ ...scene(), elements: [{ ...element('a'), startFrame: 10, endFrame: 30 }, { ...element('b', 400), startFrame: 32, endFrame: 40 }] })).toThrow(/coverage gap at frame 31/);
    expect(validateSceneLayout(scene([{ ...element('a'), startFrame: 10, endFrame: 20 }, { ...element('b', 400), startFrame: 21, endFrame: 40 }]))).toBe(true);
  });
  it('uses frame-driven interpolation and spring progress', () => {
    expect(interpolateAtFrame(5, [0, 10], [0, 100])).toBe(50);
    expect(interpolateAtFrame(-5, [0, 10], [0, 100])).toBe(0); expect(interpolateAtFrame(15, [0, 10], [0, 100])).toBe(100);
    expect(frameSpringProgress(-1, 0, 10)).toBe(0); expect(frameSpringProgress(11, 0, 10)).toBe(1);
    expect(estimateTextWidth('ＡＢＣ', 16)).toBeGreaterThan(estimateTextWidth('ABC', 16));
    expect(estimateTextWidth('ca\u0313\u0301t', 16)).toBe(estimateTextWidth('cát', 16));
    expect(estimateTextWidth('ca\u0313\u0301t', 16)).toBeGreaterThan(0);
    expect(frameSpringProgress(20, 10, 30)).toBeGreaterThan(0);
  });
});
