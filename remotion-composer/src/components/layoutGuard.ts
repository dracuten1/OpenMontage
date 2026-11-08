/**
 * layoutGuard — cơ chế prevent layout 9x16 (dùng chung mọi episode).
 *
 * Root-cause fix theo yêu cầu owner 11-07 (xang-dau S2 tràn card + rail):
 * - SAFE9x16: hằng số safe zone design 1080x1920.
 * - barSlots(): vị trí bar DERIVED từ container (không hand-place).
 * - assertInBounds(): throw khi con vượt cha (chạy ở MODULE SCOPE ->
 *   frame đầu tiên render fail ngay nếu vi pham).
 * - assertRailSafe(): throw khi mép phải design × camera drift max
 *   vượt contentRight (540 là tâm scale của Remotion AbsoluteFill).
 *
 * Quy ước: toạ độ DESIGN 1080x1920. camMax = mult * 1.1 (drift 1.0 -> 1.1).
 */

export const SAFE9x16 = {
  width: 1080,
  height: 1920,
  /** Mép phải content tối đa (design px) khi đã tính camera drift. */
  contentRight: 940,
  /** Rail UI TikTok bên phải @720p (625/720 ≈ 937.5 design px). */
  railStart720: 625,
  /** Mép trái content tối đa (mirror của contentRight). */
  contentLeft: 140,
  /** Tâm scale mặc định của AbsoluteFill (transformOrigin center). */
  centerX: 540,
} as const;

export interface LayoutRect { id: string; left: number; top: number; w: number; h: number }

/** Axis-aligned bounds after a center-origin scale and translation. */
export function transformedBounds(r: LayoutRect, scale = 1, dx = 0, dy = 0): LayoutRect {
  if (!r.id.trim() || ![r.left, r.top, r.w, r.h, scale, dx, dy].every(Number.isFinite) || r.w < 0 || r.h < 0 || scale < 0) {
    throw new Error(`layoutGuard: invalid rectangle '${r.id}'`);
  }
  return { ...r, left: r.left + (r.w * (1 - scale)) / 2 + dx, top: r.top + (r.h * (1 - scale)) / 2 + dy, w: r.w * scale, h: r.h * scale };
}

/** Call only for simultaneously visible siblings, in the same coordinate space. */
export function assertNoOverlap(rects: LayoutRect[], intentionalOverlaps: ReadonlySet<string> = new Set()): void {
  for (let i = 0; i < rects.length; i++) {
    const a = transformedBounds(rects[i]);
    for (let j = i + 1; j < rects.length; j++) {
      const b = transformedBounds(rects[j]);
      if (a.left < b.left + b.w && b.left < a.left + a.w && a.top < b.top + b.h && b.top < a.top + a.h) {
      const pair = [a.id, b.id].sort().join('|');
        if (intentionalOverlaps.has(pair)) continue;
        throw new Error(`layoutGuard: '${a.id}' overlaps '${b.id}'`);
      }
    }
  }
}

export interface BarSlot {
  left: number;
  width: number;
}

/**
 * Chia đều slot bar trong [containerX + margin, containerX + containerW - margin].
 * Mỗi bar được căn giữa slot của nó, width = min(maxBarW, slotW).
 * Trả về toạ độ DESIGN (đã cộng containerX).
 */
export function barSlots(o: {
  containerX: number;
  containerW: number;
  margin: number;
  count: number;
  gap: number;
  maxBarW: number;
}): BarSlot[] {
  if (![o.containerX, o.containerW, o.margin, o.count, o.gap, o.maxBarW].every(Number.isFinite) || !Number.isInteger(o.count) || o.count < 1 || o.containerW <= 0 || o.margin < 0 || o.gap < 0 || o.maxBarW <= 0) throw new Error('layoutGuard/barSlots: invalid dimensions/count');
  const usable = o.containerW - 2 * o.margin;
  const slotW = (usable - o.gap * (o.count - 1)) / o.count;
  if (slotW <= 0) {
    throw new Error(
      `layoutGuard/barSlots: slotW=${slotW.toFixed(1)} <= 0 (containerW=${o.containerW}, margin=${o.margin}, count=${o.count}, gap=${o.gap})`
    );
  }
  const width = Math.min(o.maxBarW, slotW);
  const out: BarSlot[] = [];
  for (let i = 0; i < o.count; i += 1) {
    const slotX = o.containerX + o.margin + i * (slotW + o.gap);
    out.push({
      left: Math.round(slotX + (slotW - width) / 2),
      width: Math.round(width),
    });
  }
  return out;
}

/**
 * Assert con (toạ độ LOCAL trong container) nằm gọn trong container.
 * Chạy ở module scope -> lỗi tên element hiện ra ngay khi import.
 */
export function assertInBounds(e: {
  id: string;
  left: number;
  top: number;
  w: number;
  h: number;
  containerW: number;
  containerH: number;
}): void {
  if (!e.id.trim() || ![e.left, e.top, e.w, e.h, e.containerW, e.containerH].every(Number.isFinite) || e.w < 0 || e.h < 0 || e.containerW < 0 || e.containerH < 0) throw new Error(`layoutGuard: invalid bounds '${e.id}'`);
  const right = e.left + e.w;
  const bottom = e.top + e.h;
  if (
    e.left < -0.5 ||
    e.top < -0.5 ||
    right > e.containerW + 0.5 ||
    bottom > e.containerH + 0.5
  ) {
    throw new Error(
      `layoutGuard: '${e.id}' vượt container — left=${e.left} top=${e.top} right=${right} bottom=${bottom} vs container ${e.containerW}x${e.containerH}`
    );
  }
}

/**
 * Assert mép phải design (đã đặt ở toạ độ tĩnh) không tràn rail sau camera
 * drift: 540 + (rightDesign - 540) * camMax <= contentRight (9x16).
 * camMax đọc từ tham số (VD mult 1.02 -> camMax 1.122).
 */
export function assertRailSafe(e: {
  id: string;
  rightDesign: number;
  leftDesign?: number;
  camMax: number;
}): void {
  if (!e.id.trim() || !Number.isFinite(e.rightDesign) || (e.leftDesign !== undefined && !Number.isFinite(e.leftDesign)) || !Number.isFinite(e.camMax) || e.camMax < 0) throw new Error(`layoutGuard: invalid rail bounds '${e.id}'`);
  const rightCam = SAFE9x16.centerX + (e.rightDesign - SAFE9x16.centerX) * e.camMax;
  const leftCam = e.leftDesign === undefined ? rightCam : SAFE9x16.centerX + (e.leftDesign - SAFE9x16.centerX) * e.camMax;
  if (leftCam < SAFE9x16.contentLeft - 0.5) throw new Error(`layoutGuard: '${e.id}' exceeds left safe edge — left ${leftCam.toFixed(1)} < ${SAFE9x16.contentLeft}`);
  if (rightCam > SAFE9x16.contentRight + 0.5) {
    throw new Error(
      `layoutGuard: '${e.id}' tràn rail — right ${e.rightDesign} × camMax ${e.camMax} = ${rightCam.toFixed(1)} > ${SAFE9x16.contentRight} (safe @720p: rail bắt đầu ${SAFE9x16.railStart720}/720)`
    );
  }
}

/** Versioned layout contract; coordinates remain explicit and are never migrated. */
export interface AspectLayoutProfile { id: string; version: number; width: number; height: number; safeLeft: number; safeTop: number; safeRight: number; safeBottom: number }
export const DEFAULT_LAYOUT_PROFILE: AspectLayoutProfile = { id: '9x16', version: 1, width: SAFE9x16.width, height: SAFE9x16.height, safeLeft: SAFE9x16.contentLeft, safeTop: 0, safeRight: SAFE9x16.contentRight, safeBottom: SAFE9x16.height };
export type ElementState = 'active' | 'settled' | 'ghost';
export interface TransformStep { scale?: number; dx?: number; dy?: number; transformOrigin?: 'center' | 'zero' }
export interface ValidatedElement { startFrame?: number; endFrame?: number; id: string; left: number; top: number; w: number; h: number; state: ElementState; contentId: string; dataId: string; unit: string; sourceId: string; cueId: string; text?: string; measuredTextWidth?: number; transforms?: TransformStep[]; extrema?: LayoutRect[] }
export interface SceneLayout { id: string; state: ElementState; profile: AspectLayoutProfile; onset: number; end: number; activeFrames: number[]; extremaFrames: number[]; settleFrame: number; elements: ValidatedElement[]; intentionalOverlaps?: string[] }
/** Linear interpolation clamps to output endpoints outside input frame range. */
export function interpolateAtFrame(frame: number, input: [number, number], output: [number, number]): number {
  if (![frame, ...input, ...output].every(Number.isFinite) || input[1] <= input[0]) throw new Error('layoutGuard: invalid frame interpolation');
  const t = Math.max(0, Math.min(1, (frame - input[0]) / (input[1] - input[0]))); return output[0] + t * (output[1] - output[0]);
}
/** Spring progress clamps to [0,1] at onset/settle; overshoot is intentionally suppressed. */
export function frameSpringProgress(frame: number, onset: number, settle: number): number {
  if (![frame, onset, settle].every(Number.isFinite) || settle <= onset) throw new Error('layoutGuard: invalid spring frames');
  const t = Math.max(0, Math.min(1, (frame - onset) / (settle - onset)));
  return Math.max(0, Math.min(1, 1 - Math.exp(-6 * t) * Math.cos(8 * t)));
}
export function layoutGridSlots(o: { containerX: number; containerY: number; containerW: number; containerH: number; columns: number; rows: number; gapX: number; gapY: number }, profile: AspectLayoutProfile = DEFAULT_LAYOUT_PROFILE): LayoutRect[] {
  validateProfile(profile);
  if (![o.containerX, o.containerY, o.containerW, o.containerH, o.columns, o.rows, o.gapX, o.gapY].every(Number.isFinite) || o.containerX < 0 || o.containerY < 0 || o.containerX + o.containerW > profile.width || o.containerY + o.containerH > profile.height || !Number.isInteger(o.columns) || !Number.isInteger(o.rows) || o.columns < 1 || o.rows < 1 || o.containerW <= 0 || o.containerH <= 0 || o.gapX < 0 || o.gapY < 0) throw new Error('layoutGuard/gridSlots: invalid or out-of-profile container/count');
  const w = (o.containerW - o.gapX * (o.columns - 1)) / o.columns, h = (o.containerH - o.gapY * (o.rows - 1)) / o.rows;
  if (w <= 0 || h <= 0) throw new Error('layoutGuard: grid gaps exceed container');
  return Array.from({ length: o.columns * o.rows }, (_, i) => ({ id: `grid_${i}`, left: o.containerX + (i % o.columns) * (w + o.gapX), top: o.containerY + Math.floor(i / o.columns) * (h + o.gapY), w, h }));
}
export function assertSafeZone(rect: LayoutRect, profile: AspectLayoutProfile = DEFAULT_LAYOUT_PROFILE): void {
  if (!rect.id.trim() || ![rect.left, rect.top, rect.w, rect.h].every(Number.isFinite) || rect.w < 0 || rect.h < 0) throw new Error(`layoutGuard: invalid rectangle '${rect.id}'`);
  validateProfile(profile);
  if (rect.left < profile.safeLeft || rect.top < profile.safeTop || rect.left + rect.w > profile.safeRight || rect.top + rect.h > profile.safeBottom) throw new Error(`layoutGuard: '${rect.id}' exceeds safe-zone edges`);
}
function validateProfile(p: AspectLayoutProfile): void {
  if (!p || !p.id?.trim() || !Number.isInteger(p.version) || p.version < 1 || ![p.width,p.height,p.safeLeft,p.safeTop,p.safeRight,p.safeBottom].every(Number.isFinite) || p.width <= 0 || p.height <= 0 || p.safeLeft < 0 || p.safeTop < 0 || p.safeRight > p.width || p.safeBottom > p.height || p.safeLeft > p.safeRight || p.safeTop > p.safeBottom) throw new Error(`layoutGuard: invalid profile '${p?.id}'`);
}
export function transformedBoundsWithOrigin(rect: LayoutRect, chain: TransformStep[]): LayoutRect {
  /** Parent-box-center affine contract: each transform composes in parent-local
   * space about the PARENT box center. The origin comes from the ORIGINAL rect
   * each step, expressed in parent-local space. For kx=ox*(1-scale)+dx,
   * composition updates new_a=a*scale and new_b=a*kx+b (same for y).
   */
  let a = 1, b = 0, c = 1, d = 0;
  for (const t of chain) {
    const scale = t.scale ?? 1, tx = t.dx ?? 0, ty = t.dy ?? 0;
    if (scale === 0) throw new Error(`layoutGuard: compound transform '${rect.id}' scale must be > 0`);
    if (![scale, tx, ty].every(Number.isFinite) || scale < 0) throw new Error(`layoutGuard: invalid compound transform '${rect.id}'`);
    const ox = t.transformOrigin === 'zero' ? 0 : rect.left + rect.w / 2;
    const oy = t.transformOrigin === 'zero' ? 0 : rect.top + rect.h / 2;
    const kx = ox * (1 - scale) + tx;
    const ky = oy * (1 - scale) + ty;
    b = a * kx + b;
    d = c * ky + d;
    a *= scale; c *= scale;
  }
  return { ...rect, left: rect.left * a + b, top: rect.top * c + d, w: rect.w * a, h: rect.h * c };
}
function transformedByChain(rect: LayoutRect, chain: TransformStep[]): LayoutRect { return transformedBoundsWithOrigin(rect, chain); }
/** Pure opt-in validation; measured text dimensions must be supplied by caller. */
export function estimateTextWidth(text: string, fontSize: number): number {
  if (!Number.isFinite(fontSize) || fontSize <= 0) throw new Error('layoutGuard: invalid font size');
  // Heuristic em-widths: Vietnamese Latin .58, wide CJK .95, narrow punctuation .32; combining marks are zero-width.
  return Array.from(text).reduce((sum, ch) => sum + (/\p{Mark}/u.test(ch) ? 0 : fontSize * (/[\uFF01-\uFF5E]/u.test(ch) ? 1 : /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u.test(ch) ? 0.95 : /[ilI.,'’!|]/u.test(ch) ? 0.32 : 0.58)), 0);
}
export function validateSceneLayout(scene: SceneLayout): true {
  const stateOk = (s: string): boolean => ['active', 'settled', 'ghost'].includes(s);
  if (!scene.id?.trim() || !stateOk(scene.state)) throw new Error('layoutGuard: missing scene ID or invalid state');
  validateProfile(scene.profile);
  if (scene.profile.id !== DEFAULT_LAYOUT_PROFILE.id || scene.profile.version !== DEFAULT_LAYOUT_PROFILE.version) throw new Error('layoutGuard: incompatible layout profile version/id');
  if (![scene.onset, scene.end, scene.settleFrame].every(Number.isFinite) || !Number.isInteger(scene.onset) || !Number.isInteger(scene.end) || !Number.isInteger(scene.settleFrame) || scene.end <= scene.onset || scene.settleFrame < scene.onset || scene.settleFrame > scene.end) throw new Error('layoutGuard: scene onset, end, and settleFrame must be integer frames with a valid interval');
  const probes = [scene.onset - 1, scene.onset, ...scene.activeFrames, ...scene.extremaFrames, scene.settleFrame, scene.end];
  if (!scene.activeFrames.length || !scene.extremaFrames.length || !probes.every(Number.isFinite) || [...scene.activeFrames, ...scene.extremaFrames].some(f => f < scene.onset || f > scene.end)) throw new Error('layoutGuard: incomplete temporal probes');
  for (const e of scene.elements) {
    if (e.startFrame !== undefined || e.endFrame !== undefined) {
      if (!Number.isInteger(e.startFrame) || !Number.isInteger(e.endFrame)) throw new Error(`layoutGuard: element '${e.id}' startFrame and endFrame must be integer frames`);
      if (!Number.isFinite(e.startFrame) || !Number.isFinite(e.endFrame) || e.startFrame! < scene.onset || e.endFrame! > scene.end || e.startFrame! > e.endFrame!) throw new Error(`layoutGuard: invalid element interval '${e.id}'`);
    }
  }
  for (let f = scene.onset; f <= scene.end; f += 1) if (!scene.elements.some(e => e.startFrame !== undefined && e.endFrame !== undefined && e.startFrame <= f && e.endFrame >= f)) throw new Error(`layoutGuard: temporal coverage gap at frame ${f}`);
  if (!scene.elements.length) throw new Error('layoutGuard: scene has no elements');
  const seen = new Set<string>();
  for (const e of scene.elements) {
    if (!e.id?.trim() || seen.has(e.id) || !stateOk(e.state) || ![e.contentId, e.dataId, e.unit, e.sourceId, e.cueId].every(v => typeof v === 'string' && v.trim())) throw new Error(`layoutGuard: missing required ID/unit or invalid state '${e.id}'`);
    seen.add(e.id);
    const computed = transformedBoundsWithOrigin({ id: e.id, left: e.left, top: e.top, w: e.w, h: e.h }, e.transforms ?? []);
    assertSafeZone(computed, scene.profile);
    if (e.transforms?.length) {
      const declared = e.extrema?.[0];
      if (!declared) throw new Error(`layoutGuard: animated element '${e.id}' requires validated extrema`);
      assertSafeZone(declared, scene.profile);
      const encloses = declared.left <= computed.left && declared.top <= computed.top && declared.left + declared.w >= computed.left + computed.w && declared.top + declared.h >= computed.top + computed.h;
      if (!encloses) throw new Error(`layoutGuard: '${e.id}' computed bounds ${JSON.stringify(computed)} exceed declared extrema ${JSON.stringify(declared)}`);
    }
    if (e.text !== undefined) {
      const width = e.measuredTextWidth ?? estimateTextWidth(e.text, 16);
      if (!Number.isFinite(width) || width < 0 || width > e.w) throw new Error(`layoutGuard: measured text overflow '${e.id}'`);
    }
    for (const r of e.extrema ?? []) assertSafeZone(r, scene.profile);
  }
  const allow = new Set(scene.intentionalOverlaps ?? []);
  assertNoOverlap(scene.elements.map(e => ({ id: e.id, left: e.left, top: e.top, w: e.w, h: e.h })), allow);
  return true;
}

export interface FlexSlot { left: number; width: number }
/** Horizontal flex slots; leftover width distributed by positive grow weights. */
export function layoutFlexSlots(o: { containerX: number; containerW: number; gap: number; grow: number[] }): FlexSlot[] {
  if (!o.grow.length || o.grow.some(g => !Number.isFinite(g) || g <= 0 || g > 1e6)) throw new Error('layoutGuard/flexSlots: grow weights must be finite, >0, and <= 1e6');
  if (![o.containerX, o.containerW, o.gap].every(Number.isFinite) || o.containerW <= 0 || o.gap < 0) throw new Error('layoutGuard/flexSlots: invalid container dimensions');
  const available = o.containerW - o.gap * (o.grow.length - 1), total = o.grow.reduce((a,b) => a+b, 0);
  if (available <= 0) throw new Error('layoutGuard/flexSlots: gaps exceed container');
  let left = o.containerX;
  return o.grow.map(weight => { const width = available * weight / total; const slot = { left, width }; left += width + o.gap; return slot; });
}
