/**
 * AnimatedInfographic — narration-synced per-element donut animation (Scene 5).
 *
 * Technique: per-frame surgical SVG string rebuild. The compiled AntV chart
 * string (INFOGRAPHICS[id]) is parsed once (memoized at module scope) into its
 * donut arcs / connector polylines / % labels / legend cards; every Remotion
 * frame then rewrites those exact substrings in place:
 *   - arcs render as a faint ghost track (opacity 0.13) until their narration
 *     cue, then sweep open (~1s, cubic-out) via a regenerated partial-arc `d`
 *     (angles clockwise from 12 o'clock: pt(θ,R) = [R·sinθ, −R·cosθ]);
 *   - % labels CountUp with the sweep and pop in (spring) about their center;
 *   - connector polylines draw in via pathLength/dashoffset;
 *   - legend cards stay dim (0.35) until their cue, then slide + brighten.
 * Past settle, original bytes are restored so the final frame is
 * pixel-identical to the static AntV output. Any parse miss throws loudly —
 * never a silent fallback to the static chart.
 */
import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import {INFOGRAPHICS, InfographicId} from './infographics_data';
import {FPS} from './timing';

const R_OUT = 140;
const R_IN = 90;
const ARC_COLORS = ['FF5E5B', 'FFB703', '00F5D4']; // SVG doc order === cue order
const LABEL_TEXTS = ['56.0%', '30.0%', '14.0%']; // cue order (seg1, seg2, seg3)
const LABEL_VALUES = [56, 30, 14]; // cue order

interface ArcInfo {
  el: string; // exact original <path .../> substring
  d: string; // original path data
  theta1: number; // sweep start angle (rad, clockwise from top)
  theta2: number; // sweep end angle, normalized so theta2 > theta1
}
interface LabelInfo {
  el: string;
  transformStr: string; // exact original translate(...) substring
  x: number;
  y: number;
  text: string;
  value: number;
}
interface LegendInfo {
  el: string; // exact original opening <g transform="translate(X,Y)"> tag
  x: number;
  y: number;
}
interface Parsed {
  arcs: ArcInfo[];
  connectors: string[]; // cue order
  labels: LabelInfo[]; // cue order
  legends: LegendInfo[]; // cue order
}

const parseCache = new Map<string, Parsed>();

const r3 = (n: number): string => {
  const v = Math.round(n * 1000) / 1000;
  return Object.is(v, -0) ? '0' : String(v);
};
const thetaOf = (x: number, y: number): number => Math.atan2(x, -y);
const pt = (theta: number, r: number): string =>
  `${r3(r * Math.sin(theta))},${r3(-r * Math.cos(theta))}`;
/** Parse the three AntV donut arcs: θ1 from the first M point, θ2 from the
 *  endpoint of the `A140,140,0,…` big-arc command (each path's own endpoints,
 *  trusted fresh). */
const parseArc = (el: string): ArcInfo => {
  const dMatch = el.match(/ d="([^"]+)"/);
  if (!dMatch) throw new Error(`[AnimatedInfographic] arc path missing d: ${el.slice(0, 80)}`);
  const d = dMatch[1];
  const big = d.match(new RegExp(`A${R_OUT},${R_OUT},0,([01]),1,([^A]+?)(?=A)`));
  const m = d.match(/^M([^A]+?)A/);
  if (!m || !big) throw new Error(`[AnimatedInfographic] arc d shape unexpected: ${d.slice(0, 80)}`);
  const [x1, y1] = m[1].split(',').map(Number);
  const [x2, y2] = big[2].split(',').map(Number);
  if ([x1, y1, x2, y2].some((n) => Number.isNaN(n)))
    throw new Error(`[AnimatedInfographic] arc coords NaN: ${d.slice(0, 80)}`);
  let theta1 = thetaOf(x1, y1);
  let theta2 = thetaOf(x2, y2);
  if (theta2 < theta1) {
    // Arcs sweep clockwise (increasing θ); a wrap past θ=0 means the big-arc
    // endpoint is one revolution ahead — keep the original sweep span intact.
    const span = 2 * Math.PI - (theta1 - theta2);
    theta2 = theta1 + span;
  }
  if (!(theta2 - theta1 > 0.1) || theta2 - theta1 > 2 * Math.PI + 0.05)
    throw new Error(`[AnimatedInfographic] arc span implausible: ${theta2 - theta1}`);
  return {el, d, theta1, theta2};
};

/** Parse one % label: exact translate(...) + foreignObject span text. */
const parseLabel = (el: string, text: string, value: number): LabelInfo => {
  const t = el.match(/transform="translate\(([^)]+)\)"/);
  if (!t || !el.includes(`>${text}<`))
    throw new Error(`[AnimatedInfographic] % label "${text}" not found`);
  const [x, y] = t[1].split(',').map(Number);
  return {el, transformStr: t[0], x, y, text, value};
};
/** Parse one legend card: its opening <g transform="translate(X,Y)"> tag. */
const parseLegend = (el: string): LegendInfo => {
  const open = el.match(/^<g [^>]*transform="translate\(([^)]+)\)"/);
  if (!open) throw new Error(`[AnimatedInfographic] legend card not found: ${el.slice(0, 80)}`);
  const [x, y] = open[1].split(',').map(Number);
  return {el, x, y};
};

const parse = (id: InfographicId): Parsed => {
  const cached = parseCache.get(id);
  if (cached) return cached;
  const svg = INFOGRAPHICS[id];
  const parsed: Parsed = {arcs: [], connectors: [], labels: [], legends: []};

  // Arcs: doc-order path elements with the A140,140 big-arc signature.
  const arcRe = /<path [^>]*d="M[^"]*" fill="#(?:FF5E5B|FFB703|00F5D4)"[^>]*\/>/g;
  for (const el of svg.match(arcRe) ?? []) {
    if (!el.includes(`A${R_OUT},${R_OUT},0,`)) continue;
    if (parsed.arcs.length >= 3) throw new Error('[AnimatedInfographic] >3 donut arcs matched');
    parsed.arcs.push(parseArc(el));
  }

  // Connectors: cue order (seg1 coral, seg2 amber, seg3 teal) via stroke color.
  for (const c of ['FF5E5B', 'FFB703', '00F5D4']) {
    const re = new RegExp(`<path [^>]*stroke="#${c}"[^>]*stroke-opacity="0.45"[^>]*/>`);
    const m = svg.match(re);
    if (!m || !/stroke-width="2"/.test(m[0]))
      throw new Error(`[AnimatedInfographic] connector #${c} not found`);
    parsed.connectors.push(m[0]);
  }

  // % labels: each text string is unique in the SVG; cue order = value order.
  for (let i = 0; i < 3; i++) {
    const text = LABEL_TEXTS[i];
    const re = new RegExp(`<g transform="translate\\([\\d.,\\s-]+\\)"><foreignObject[^>]*>[\\s\\S]{0,600}?>${text}<`);
    const m = svg.match(re);
    if (!m) throw new Error(`[AnimatedInfographic] % label "${text}" not found`);
    parsed.labels.push(parseLabel(m[0], text, LABEL_VALUES[i]));
  }

  // Legend cards: full card groups keyed by accent-rect color, cue order
  // (seg1 #ff5e5b right card, seg2 #ffb703, seg3 #00f5d4).
  for (const c of ['ff5e5b', 'ffb703', '00f5d4']) {
    const idx = svg.indexOf(`<rect x="197" y="0" width="3" height="60" fill="#${c}"`);
    const idxLeft = svg.indexOf(`<rect x="0" y="0" width="3" height="60" fill="#${c}"`);
    const start = idx >= 0 ? idx : idxLeft;
    if (start < 0) throw new Error(`[AnimatedInfographic] legend accent #${c} not found`);
    const openStart = svg.lastIndexOf('<g transform="translate(', start);
    const openEnd = svg.indexOf('>', openStart);
    if (openStart < 0 || openEnd < 0)
      throw new Error(`[AnimatedInfographic] legend group #${c} not found`);
    parsed.legends.push(parseLegend(svg.slice(openStart, openEnd + 1)));
  }

  if (parsed.arcs.length !== 3)
    throw new Error(`[AnimatedInfographic] expected 3 arcs, found ${parsed.arcs.length}`);
  parseCache.set(id, parsed);
  return parsed;
};
/** Regenerate the partial arc `d` at progress p (0..1) for a parsed arc. */
const partialArcD = (a: ArcInfo, p: number): string => {
  const tCur = a.theta1 + (a.theta2 - a.theta1) * p;
  const large = tCur - a.theta1 > Math.PI ? 1 : 0;
  return (
    `M${pt(a.theta1, R_OUT)}` +
    `A${R_OUT},${R_OUT},0,${large},1,${pt(tCur, R_OUT)}` +
    `L${pt(tCur, R_IN)}` +
    `A${R_IN},${R_IN},0,${large},0,${pt(a.theta1, R_IN)}` +
    `Z`
  );
};

/** Arc rewrite: ghost track before cue, sweep during, original after. */
const arcAt = (svg: string, a: ArcInfo, cue: number, frame: number): string => {
  const t = frame - cue;
  if (t < 0) {
    return svg.replace(a.el, a.el.replace(/\/>$/, ' opacity="0.13" />'));
  }
  const p = interpolate(t, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  if (p >= 1) return svg; // original bytes — pixel-identical settle
  if (p <= 0.001) {
    return svg.replace(a.el, a.el.replace(/\/>$/, ' opacity="0.13" />'));
  }
  const op = interpolate(t, [0, 4], [0.13, 1], {extrapolateRight: 'clamp'});
  return svg.replace(
    a.el,
    a.el.replace(` d="${a.d}" `, ` d="${partialArcD(a, p)}" opacity="${r3(op)}" `),
  );
};

/** % label rewrite: hidden before cue, CountUp text + fade/pop about center. */
const labelAt = (svg: string, l: LabelInfo, cue: number, frame: number): string => {
  const t = frame - cue;
  if (t < 0) {
    return svg.replace(l.transformStr, `${l.transformStr} opacity="0"`);
  }
  const p = interpolate(t, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const s = spring({frame: t, fps: FPS, config: {damping: 14}});
  const op = interpolate(t, [2, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (p >= 1 && op >= 1) return svg; // original bytes (exact `56.0%` etc.)
  const scale = 0.7 + 0.3 * s;
  const cx = l.x + 25 - 25 * scale; // foreignObject is 50x20: keep center fixed
  const cy = l.y + 10 - 10 * scale;
  const text = p >= 1 ? l.text : `${(p * l.value).toFixed(1)}%`;
  return svg
    .replace(l.transformStr, `transform="translate(${r3(cx)},${r3(cy)}) scale(${r3(scale)})" opacity="${r3(op)}"`)
    .replace(`>${l.text}<`, `>${text}<`);
};
/** Connector rewrite: invisible before cue, dash draw-in over 12 frames. */
const connectorAt = (svg: string, c: string, cue: number, frame: number): string => {
  const t = frame - cue;
  if (t < 0) {
    return svg.replace(c, c.replace('stroke-opacity="0.45"', 'stroke-opacity="0"'));
  }
  const q = interpolate(t, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  if (q >= 1) return svg; // original bytes
  return svg.replace(
    c,
    c.replace(/\/>$/, ` pathLength="1" stroke-dasharray="1" stroke-dashoffset="${r3(1 - q)}" />`),
  );
};

/** Legend card rewrite: dim before cue, slide-in + brighten from cue.
 *  Splice by index — the card bodies contain characters special to
 *  String.replace ($, etc.) so plain replace is unsafe here. */
const legendAt = (svg: string, g: LegendInfo, cue: number, frame: number): string => {
  const t = frame - cue;
  if (t < 0) {
    const idx = svg.indexOf(g.el);
    return (
      svg.slice(0, idx) +
      `<g transform="translate(${r3(g.x)},${r3(g.y)})" opacity="0.35">` +
      svg.slice(idx + g.el.length)
    );
  }
  const e = spring({frame: t, fps: FPS, config: {damping: 16}});
  const op = interpolate(t, [0, 6], [0.35, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (op >= 1) return svg; // original bytes
  const idx = svg.indexOf(g.el);
  return (
    svg.slice(0, idx) +
    `<g transform="translate(${r3(g.x - 10 * (1 - e))},${r3(g.y)})" opacity="${r3(op)}">` +
    svg.slice(idx + g.el.length)
  );
};

// =============================================================================
// Generic per-element engine for the remaining six infographics (s02, s03,
// s04, s06, s07, s08). Same philosophy as the s05 donut path above: parse the
// compiled AntV SVG string ONCE (memoized), then per frame emit byte-range
// Edits against the ORIGINAL string and splice them in start-descending order
// (index arithmetic only — String.replace with computed replacements is
// forbidden here because of `$`-pattern hazards and duplicate substrings).
// Ghost/dim state before the narration cue, spring/eased motion at the cue,
// NO edit after settle → original bytes → pixel-identical to static AntV.
// Any parse miss throws loudly; there is no static fallback.
// =============================================================================

interface Edit {
  start: number; // byte offset into the ORIGINAL svg string
  end: number; // exclusive
  text: string; // replacement
}

interface TagSpan {
  start: number;
  end: number; // exclusive, covers the full opening tag (or full self-closing tag)
  text: string; // exact original bytes
  x: number; // parsed translate x (0 when the group has no transform)
  y: number;
}

interface CardEl {
  open: TagSpan; // card/row/step group opening tag
  valueOpen: TagSpan | null; // nested <g transform="translate(0, 21)"> value line, if any
}

interface BarEl {
  rect: TagSpan; // full <rect ... /> tag
  widthStart: number; // byte range of the width VALUE inside the rect tag
  widthEnd: number;
  w: number;
  wStr: string;
  labelOpen: TagSpan; // <g transform="translate(LX, LY)"> wrapping the <text>VAL</text>
  textStart: number; // byte range of VAL inside <text>VAL</text>
  textEnd: number;
  valText: string;
  value: number;
  decimals: number;
}

interface ArrowEl {
  tag: TagSpan; // full <polygon ... /> tag
  x: number; // arrow translate x
}

type GenericParsed =
  | {kind: 'compareBinary'; cards: [CardEl, CardEl, CardEl, CardEl]} // doc order: left-top, left-bottom, right-top, right-bottom
  | {kind: 'waterfallRows'; rows: CardEl[]}
  | {kind: 'hbars'; bars: BarEl[]}
  | {kind: 'steps'; steps: CardEl[]; arrows: ArrowEl[]};

const genericCache = new Map<string, GenericParsed>();

const clampOpts = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const findOpen = (svg: string, sig: string, what: string): TagSpan => {
  const start = svg.indexOf(sig);
  if (start < 0) throw new Error(`[AnimatedInfographic] ${what} not found: ${sig}`);
  const end = svg.indexOf('>', start);
  if (end < 0) throw new Error(`[AnimatedInfographic] ${what} tag unterminated`);
  const text = svg.slice(start, end + 1);
  const m = text.match(/translate\((-?[\d.]+), ?(-?[\d.]+)\)/);
  return {start, end: end + 1, text, x: m ? Number(m[1]) : 0, y: m ? Number(m[2]) : 0};
};

/** Ghost/hide/dim an opening tag by appending an opacity attribute. */
const withOpacity = (tag: TagSpan, op: number | string): string =>
  tag.text.replace(/>$/, `" opacity="${typeof op === 'number' ? r3(op) : op}">`);

/** Find the card's value-line group `<g transform="translate(0, 21)">` whose
 *  bytes must lie between this card's opening tag and `bound`. */
const findValueOpen = (svg: string, open: TagSpan, bound: number): TagSpan | null => {
  const sig = '<g transform="translate(0, 21)">';
  const idx = svg.indexOf(sig, open.end);
  if (idx < 0 || idx >= bound) return null;
  return {start: idx, end: idx + sig.length, text: sig, x: 0, y: 21};
};

const parseCompareBinary = (svg: string): GenericParsed => {
  // VS divider group must exist (left untouched — static).
  if (!svg.includes('<g transform="translate(245, 60)">'))
    throw new Error('[AnimatedInfographic] VS divider group not found');
  const sigs = [
    '<g transform="translate(25, 20)">',
    '<g transform="translate(25, 120)">',
    '<g transform="translate(365, 20)">',
    '<g transform="translate(365, 120)">',
  ];
  const opens = sigs.map((sig, i) => findOpen(svg, sig, `compare card #${i}`));
  // Doc order must be ascending; each card's value group lives before the next card.
  const cards: CardEl[] = opens.map((open, i) => ({
    open,
    valueOpen: findValueOpen(svg, open, i + 1 < opens.length ? opens[i + 1].start : svg.length),
  }));
  for (const c of cards)
    if (!c.valueOpen)
      throw new Error('[AnimatedInfographic] compare card value line not found');
  return {kind: 'compareBinary', cards: [cards[0], cards[1], cards[2], cards[3]]};
};

const parseWaterfallRows = (svg: string): GenericParsed => {
  // Row 1 (green) is a BARE <g> — anchor on the rect that follows it.
  const g1 = svg.indexOf('<g><rect x="0" y="0" width="200" height="80" fill="#10b98133"');
  if (g1 < 0) throw new Error('[AnimatedInfographic] waterfall row 1 (bare <g>) not found');
  const opens = [
    {start: g1, end: g1 + 3, text: '<g>', x: 0, y: 0},
    findOpen(svg, '<g transform="translate(220, 40)">', 'waterfall row 2'),
    findOpen(svg, '<g transform="translate(440, 80)">', 'waterfall row 3'),
  ];
  const rows: CardEl[] = opens.map((open, i) => ({
    open,
    valueOpen: findValueOpen(svg, open, i + 1 < opens.length ? opens[i + 1].start : svg.length),
  }));
  for (const r of rows) if (!r.valueOpen)
    throw new Error('[AnimatedInfographic] waterfall row value line not found');
  return {kind: 'waterfallRows', rows};
};

const parseHbars = (svg: string, expected: number): GenericParsed => {
  const rectRe =
    /<rect x="160" y="(\d+)" width="([\d.]+)" height="28" fill="#([0-9A-F]{6})" rx="6" ry="6" \/>/g;
  const bars: BarEl[] = [];
  for (const m of svg.matchAll(rectRe)) {
    const y = Number(m[1]);
    const wStr = m[2];
    const fill = m[3];
    const rectStart = m.index;
    const rectEnd = rectStart + m[0].length;
    const wAttr = `width="${wStr}"`;
    const widthStart = rectStart + m[0].indexOf(wAttr) + 7;
    const value = Number(wStr);
    if (!Number.isFinite(value) || value <= 0)
      throw new Error(`[AnimatedInfographic] implausible bar width ${wStr}`);
    // Value label: translate(LX, y+14) group whose <text> fill matches the bar.
    const labelRe = new RegExp(
      `<g transform="translate\\(([\\d.]+), ${y + 14}\\)"><text [^>]*fill="#${fill}"[^>]*>([\\d.]+)</text>`,
    );
    const lm = svg.slice(rectEnd, rectEnd + 4000).match(labelRe);
    if (!lm || lm.index === undefined)
      throw new Error(`[AnimatedInfographic] value label for bar #${fill} y=${y} not found`);
    const labelStart = rectEnd + lm.index;
    const labelOpenEnd = svg.indexOf('>', labelStart) + 1;
    const labelOpen: TagSpan = {
      start: labelStart,
      end: labelOpenEnd,
      text: svg.slice(labelStart, labelOpenEnd),
      x: Number(lm[1]),
      y: y + 14,
    };
    const valText = lm[2];
    const valIdx = svg.indexOf(`>${valText}<`, labelOpenEnd - 1);
    if (valIdx < 0 || valIdx > labelOpenEnd + 400)
      throw new Error(`[AnimatedInfographic] bar value text "${valText}" not located`);
    bars.push({
      rect: {start: rectStart, end: rectEnd, text: m[0], x: 160, y},
      widthStart,
      widthEnd: widthStart + wStr.length,
      w: value,
      wStr,
      labelOpen,
      textStart: valIdx + 1,
      textEnd: valIdx + 1 + valText.length,
      valText,
      value: Number(valText),
      decimals: valText.includes('.') ? 1 : 0,
    });
  }
  if (bars.length !== expected)
    throw new Error(`[AnimatedInfographic] expected ${expected} bars, found ${bars.length}`);
  return {kind: 'hbars', bars};
};

const parseSteps = (svg: string): GenericParsed => {
  const opens = [
    findOpen(svg, '<g transform="translate(0, 40)">', 'step 1'),
    findOpen(svg, '<g transform="translate(240, 40)">', 'step 2'),
    findOpen(svg, '<g transform="translate(480, 40)">', 'step 3'),
  ];
  const arrows: ArrowEl[] = [];
  for (const ax of ['207.5', '447.5']) {
    const sig = `<polygon x="${ax}"`;
    const start = svg.indexOf(sig);
    if (start < 0) throw new Error(`[AnimatedInfographic] arrow x=${ax} not found`);
    const end = svg.indexOf('/>', start);
    if (end < 0) throw new Error('[AnimatedInfographic] arrow tag unterminated');
    arrows.push({
      tag: {start, end: end + 2, text: svg.slice(start, end + 2), x: Number(ax), y: 67.5},
      x: Number(ax),
    });
  }
  return {kind: 'steps', steps: opens.map((open) => ({open, valueOpen: null})), arrows};
};

const genericParse = (id: Exclude<InfographicId, 's05_cashflow'>): GenericParsed => {
  const cached = genericCache.get(id);
  if (cached) return cached;
  const svg = INFOGRAPHICS[id];
  let parsed: GenericParsed;
  switch (id) {
    case 's02_horea':
    case 's06_interest_shock':
      parsed = parseCompareBinary(svg);
      break;
    case 's03_missing_middle':
      parsed = parseWaterfallRows(svg);
      break;
    case 's04_cost_breakdown':
      parsed = parseHbars(svg, 4);
      break;
    case 's07_numbeo':
      parsed = parseHbars(svg, 3);
      break;
    case 's08_tod_metro':
      parsed = parseSteps(svg);
      break;
    default:
      throw new Error(`[AnimatedInfographic] no generic spec for ${id}`);
  }
  genericCache.set(id, parsed);
  return parsed;
};

/** Splice all edits into the original string, start-descending; overlap = bug. */
const applyEdits = (svg: string, edits: Edit[]): string => {
  if (edits.length === 0) return svg;
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i - 1].start < sorted[i].end)
      throw new Error('[AnimatedInfographic] overlapping edits — parser bug');
  let out = svg;
  for (const e of sorted) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
};

// --- compareBinary (s02, s06): side cards pop at their cue, staggered 12f ---
const compareBinaryEdits = (
  P: Extract<GenericParsed, {kind: 'compareBinary'}>,
  cues: number[],
  frame: number,
): Edit[] => {
  const edits: Edit[] = [];
  const sides: Array<[[number, number], [number, number]]> = [
    [[0, 0], [1, 12]], // left column: card indices + cue offsets
    [[2, 0], [3, 12]], // right column
  ];
  sides.forEach((side, s) => {
    const cue = cues[s];
    side.forEach(([cardIdx, lag], i) => {
      const card = P.cards[cardIdx];
      const c = cue + lag;
      const t = frame - c;
      if (t < 0) {
        edits.push({start: card.open.start, end: card.open.end, text: withOpacity(card.open, 0.3)});
      } else {
        const sp = spring({frame: t, fps: FPS, config: {damping: 15}});
        const sc = 0.9 + 0.1 * sp;
        const op = interpolate(t, [0, 6], [0, 1], clampOpts);
        if (t <= 45 || op < 1) {
          edits.push({
            start: card.open.start,
            end: card.open.end,
            text:
              `<g transform="translate(${r3(card.open.x + 100 * (1 - sc))},` +
              `${r3(card.open.y + 40 * (1 - sc))}) scale(${r3(sc)})" opacity="${r3(op)}">`,
          });
        }
      }
      const v = card.valueOpen!;
      const t2 = frame - (c + 6 + i * 12);
      if (t2 < 0) {
        edits.push({start: v.start, end: v.end, text: withOpacity(v, 0)});
      } else {
        const e = spring({frame: t2, fps: FPS, config: {damping: 16}});
        const op = interpolate(t2, [0, 5], [0, 1], clampOpts);
        if (t2 <= 30 || op < 1) {
          edits.push({
            start: v.start,
            end: v.end,
            text: `<g transform="translate(0, ${r3(21 - 8 * (1 - e))})" opacity="${r3(op)}">`,
          });
        }
      }
    });
  });
  return edits;
};

// --- waterfallRows (s03): rows slide in at cue; earlier rows dim when the
//     next row (in narration time) appears — dim persists to scene end ---
const waterfallRowsEdits = (
  P: Extract<GenericParsed, {kind: 'waterfallRows'}>,
  cues: number[],
  frame: number,
): Edit[] => {
  const edits: Edit[] = [];
  P.rows.forEach((row, i) => {
    const cue = cues[i];
    const laterCues = cues.filter((c, j) => j !== i && c > cue);
    const dimCue = laterCues.length ? Math.min(...laterCues) : Infinity;
    const dim =
      frame >= dimCue ? interpolate(frame - dimCue, [0, 8], [1, 0.62], clampOpts) : 1;
    const t = frame - cue;
    if (t < 0) {
      edits.push({start: row.open.start, end: row.open.end, text: withOpacity(row.open, 0.28)});
    } else {
      const e = spring({frame: t, fps: FPS, config: {damping: 16, stiffness: 110}});
      const op = interpolate(t, [0, 6], [0.28, 1], clampOpts) * dim;
      if (t <= 40 || op < 1 || dim < 1) {
        edits.push({
          start: row.open.start,
          end: row.open.end,
          text:
            `<g transform="translate(${r3(row.open.x - 16 * (1 - e))},${r3(row.open.y)})"` +
            ` opacity="${r3(op)}">`,
        });
      }
    }
    const v = row.valueOpen!;
    const t2 = frame - (cue + 5);
    if (t2 < 0) {
      edits.push({start: v.start, end: v.end, text: withOpacity(v, 0)});
    } else {
      const e2 = spring({frame: t2, fps: FPS, config: {damping: 16}});
      const op2 = interpolate(t2, [0, 5], [0, 1], clampOpts);
      if (t2 <= 30 || op2 < 1) {
        edits.push({
          start: v.start,
          end: v.end,
          text: `<g transform="translate(0, ${r3(21 + 6 * (1 - e2))})" opacity="${r3(op2)}">`,
        });
      }
    }
  });
  return edits;
};

// --- hbars (s04, s07): bars grow from width 0; label rides the tip + count-up ---
const hbarEdits = (
  P: Extract<GenericParsed, {kind: 'hbars'}>,
  cues: number[],
  frame: number,
): Edit[] => {
  const edits: Edit[] = [];
  P.bars.forEach((bar, i) => {
    const t = frame - cues[i];
    if (t < 0) {
      edits.push({start: bar.widthStart, end: bar.widthEnd, text: '0'});
      edits.push({start: bar.labelOpen.start, end: bar.labelOpen.end, text: withOpacity(bar.labelOpen, 0)});
      return;
    }
    const p = interpolate(t, [0, 26], [0, 1], {
      ...clampOpts,
      easing: Easing.out(Easing.cubic),
    });
    const lop = interpolate(t, [0, 5], [0, 1], clampOpts);
    const settled = p >= 1 && lop >= 1;
    if (settled) return; // original bytes
    if (p < 1) edits.push({start: bar.widthStart, end: bar.widthEnd, text: String(bar.w * p)});
    const x = 160 + bar.w * p + (bar.labelOpen.x - 160 - bar.w);
    edits.push({
      start: bar.labelOpen.start,
      end: bar.labelOpen.end,
      text: `<g transform="translate(${r3(x)}, ${bar.labelOpen.y})" opacity="${r3(lop)}">`,
    });
    edits.push({
      start: bar.textStart,
      end: bar.textEnd,
      text: (bar.value * p).toFixed(bar.decimals),
    });
  });
  return edits;
};

// --- steps (s08): cards pop sequentially; arrows arrive with the next step ---
const stepsEdits = (
  P: Extract<GenericParsed, {kind: 'steps'}>,
  cues: number[],
  frame: number,
): Edit[] => {
  const edits: Edit[] = [];
  P.steps.forEach((st, i) => {
    const t = frame - cues[i];
    if (t < 0) {
      edits.push({start: st.open.start, end: st.open.end, text: withOpacity(st.open, 0.28)});
      return;
    }
    const sp = spring({frame: t, fps: FPS, config: {damping: 15}});
    const sc = 0.88 + 0.12 * sp;
    const op = interpolate(t, [0, 6], [0, 1], clampOpts);
    if (t <= 45 || op < 1) {
      edits.push({
        start: st.open.start,
        end: st.open.end,
        text:
          `<g transform="translate(${r3(st.open.x + 100 * (1 - sc))},` +
          `${r3(st.open.y + 40 * (1 - sc))}) scale(${r3(sc)})" opacity="${r3(op)}">`,
      });
    }
  });
  P.arrows.forEach((ar, k) => {
    const t = frame - cues[k + 1];
    if (t < 0) {
      edits.push({
        start: ar.tag.start,
        end: ar.tag.end,
        text: ar.tag.text.replace(/\/>$/, ' opacity="0" />'),
      });
      return;
    }
    const e = spring({frame: t, fps: FPS, config: {damping: 16}});
    const op = interpolate(t, [0, 6], [0, 1], clampOpts);
    if (t <= 40 || op < 1) {
      const oldTr = `translate(${ar.x}, 67.5)rotate(0 12.5 12.5)`;
      const newTr = `translate(${r3(ar.x - 10 * (1 - e))}, 67.5)rotate(0 12.5 12.5)`;
      edits.push({
        start: ar.tag.start,
        end: ar.tag.end,
        text: ar.tag.text.replace(oldTr, newTr).replace(/\/>$/, ` opacity="${r3(op)}" />`),
      });
    }
  });
  return edits;
};

const EXPECTED_CUES: Record<Exclude<InfographicId, 's05_cashflow'>, number> = {
  s02_horea: 2,
  s03_missing_middle: 3,
  s04_cost_breakdown: 4,
  s06_interest_shock: 2,
  s07_numbeo: 3,
  s08_tod_metro: 3,
};

const genericFrame = (
  id: Exclude<InfographicId, 's05_cashflow'>,
  cues: number[],
  frame: number,
): string => {
  const P = genericParse(id);
  let edits: Edit[];
  switch (P.kind) {
    case 'compareBinary':
      edits = compareBinaryEdits(P, cues, frame);
      break;
    case 'waterfallRows':
      edits = waterfallRowsEdits(P, cues, frame);
      break;
    case 'hbars':
      edits = hbarEdits(P, cues, frame);
      break;
    case 'steps':
      edits = stepsEdits(P, cues, frame);
      break;
  }
  return applyEdits(INFOGRAPHICS[id], edits);
};

export interface AnimatedInfographicViewProps {
  id: InfographicId;
  at?: number; // container entry frame (default 0)
  scale?: number; // default 1
  width?: number | string; // default '100%'
  arcCues?: number[]; // s05_cashflow only: one per arc IN SVG DOC ORDER [seg1, seg2, seg3]
  cues?: number[]; // all other ids: scene-local frames per animated element group
  style?: React.CSSProperties;
}

export const AnimatedInfographicView: React.FC<AnimatedInfographicViewProps> = ({
  id,
  at = 0,
  scale = 1,
  width = '100%',
  arcCues,
  cues,
  style,
}) => {
  const frame = useCurrentFrame();

  // Rewrites below use exact byte-range edits on the ORIGINAL svg string,
  // applied start-descending (see applyEdits) — duplicate substrings and
  // `$`-pattern hazards are thereby avoided.
  let html: string;
  if (id === 's05_cashflow') {
    if (!arcCues || arcCues.length !== 3) {
      throw new Error('[AnimatedInfographic] arcCues must have exactly 3 entries');
    }
    const P = parse(id);
    html = INFOGRAPHICS[id];
    for (let i = 0; i < arcCues.length; i++) {
      // NOTE: useCurrentFrame() here is SCENE-local (the enclosing Sequence starts
      // at the scene boundary), and cues are scene-local word-cue frames — so
      // compare directly. `at` only drives the cosmetic container entry spring
      // above; subtracting it here would start every sweep 0.5s before the word.
      const c = arcCues[i];
      html = arcAt(html, P.arcs[i], c, frame);
      html = labelAt(html, P.labels[i], c, frame);
      html = connectorAt(html, P.connectors[i], c, frame);
      html = legendAt(html, P.legends[i], c, frame);
    }
  } else {
    const expected = EXPECTED_CUES[id];
    if (!cues || cues.length !== expected) {
      throw new Error(`[AnimatedInfographic] cues must have exactly ${expected} entries for ${id}`);
    }
    html = genericFrame(id, cues, frame);
  }

  const origin = spring({
  frame: frame - at,
  fps: FPS,
  config: {damping: 15, stiffness: 120, mass: 0.8},
});
const entryOpacity = interpolate(frame - at, [0, 8], [0, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
const currentScale = scale * (0.92 + 0.08 * origin);
const translateY = 18 * (1 - origin);

return (
  <div
    style={{
      width,
      opacity: entryOpacity,
      transform: `translateY(${translateY}px) scale(${currentScale})`,
      transformOrigin: 'center center',
      filter: 'drop-shadow(0 12px 36px rgba(0,0,0,0.65))',
      ...style,
    }}
    dangerouslySetInnerHTML={{__html: html}}
  />
);
};
