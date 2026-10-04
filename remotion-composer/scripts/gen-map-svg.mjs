// Deterministic Vietnam map SVGs for nguon-goc-dan-toc-v2 (ink-genome identity).
// Uses d3-geo + topojson-client + world-atlas already installed in remotion-composer.
// Run from remotion-composer/: node scripts/gen-map-svg.mjs
// Outputs: public/nguon-goc-v2/map_*.svg (+ copies to project assets for the board).
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";

const W = 1920, H = 1080;
const BG = "#1A1714", TEAL = "#7FD1C8", AMBER = "#D9A441", MUT = "#9A8F7D", TXT = "#F5F2EA";
const OUT_LOCAL = "public/nguon-goc-v2";
const PROJECT = "../projects/nguon-goc-dan-toc-v2/assets/images/svg";

const world = JSON.parse(readFileSync("node_modules/world-atlas/countries-110m.json", "utf8"));
const countries = feature(world, world.objects.countries);
const byName = (frag) => countries.features.filter((f) =>
  f.properties.name && f.properties.name.toLowerCase().includes(frag));

const vn = byName("vietnam");
const cn = byName("china");
const laos = byName("laos"), kh = byName("cambodia"), th = byName("thailand");

// Region: Vietnam + south China, lon 100–118, lat 8–26
const projection = geoMercator().fitExtent(
  [[120, 90], [W - 120, H - 90]],
  { type: "FeatureCollection", features: [...vn, ...cn, ...laos, ...kh, ...th] }
);
const path = geoPath(projection);

const dOf = (f) => (Array.isArray(f) ? f.map((x) => path(x)).join(" ") : path(f));

const outline = (f, stroke, width, opacity = 1, fill = "none", fillOpacity = 0) =>
  `<path d="${dOf(f)}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${width}" stroke-opacity="${opacity}"/>`;

// Mán Bạc, Ninh Bình ≈ 20.251N 105.971E
const [mx, my] = projection([105.971, 20.251]);

// Deterministic pseudo-random 54 dots clipped to Vietnam landmass.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function dots54(count) {
  const rnd = mulberry32(20261003);
  let out = "";
  let placed = 0, guard = 0;
  while (placed < count && guard < 4000) {
    guard++;
    const lon = 102.0 + rnd() * 13.5;   // 102–115.5E
    const lat = 8.6 + rnd() * 15.2;     // 8.6–23.8N
    const [x, y] = projection([lon, lat]);
    // Deterministic scatter restricted to plausible Vietnam landmass boxes
    // (Red River delta + north, coastal strip, Mekong delta); the whole group
    // is additionally clipped to the Vietnam path below.
    const inNorth = lon > 104.4 && lon < 108.4 && lat > 18.6 && lat < 23.4 && (lon - 104.4) * 0.55 + 18.9 > lat;
    const inCoast = lon > 105.3 && lon < 110.0 && lat > 10.5 && lat < 18.6 && (109.8 - lon) * -0.9 + 22 > lat + 9.5;
    const inMekong = lon > 104.5 && lon < 107.2 && lat > 8.7 && lat < 11.0;
    if (!(inNorth || inMekong)) continue;
    if (inCoast && lat < 17.8 && !(lon > 105.5 && lon < 107.9 && lat > 12.0)) continue;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" fill="${AMBER}" opacity="0.92"/>`;
    placed++;
  }
  return `<g clip-path="url(#vnclip)">${out}</g>`;
}

function base(warm) {
  return (
    `<defs><clipPath id="vnclip"><path d="${dOf(vn)}"/></clipPath></defs>` +
    `<rect width="${W}" height="${H}" fill="${BG}"/>` +
    outline(laos, MUT, 1.2, 0.35) +
    outline(kh, MUT, 1.2, 0.35) +
    outline(th, MUT, 1.2, 0.35) +
    outline(cn, MUT, 2, 0.55) +
    (warm
      ? outline(vn, AMBER, 4, 0.9)
      : outline(vn, TEAL, 4, 1, TEAL, 0.10))
  );
}

function label(x, y, main, sub, color) {
  return (
    `<line x1="${x}" y1="${y}" x2="${x + 150}" y2="${y - 90}" stroke="${color}" stroke-width="2" opacity="0.8"/>` +
    `<circle cx="${x}" cy="${y}" r="10" fill="${color}"/>` +
    `<text x="${x + 162}" y="${y - 96}" fill="${color}" font-family="Georgia, serif" font-size="44" font-weight="700">${main}</text>` +
    `<text x="${x + 162}" y="${y - 46}" fill="${MUT}" font-family="Georgia, serif" font-size="32" font-style="italic">${sub}</text>`
  );
}

// 1) teal base (science)
let s = base(true);
writeFileSync(`${OUT_LOCAL}/map_base.svg`, wrap(s));

// 2) Mán Bạc point + halo
s = base(true) +
  `<circle cx="${mx}" cy="${my}" r="34" fill="none" stroke="${TEAL}" stroke-width="3" opacity="0.5"/>` +
  `<circle cx="${mx}" cy="${my}" r="20" fill="none" stroke="${TEAL}" stroke-width="4"/>` +
  `<circle cx="${mx}" cy="${my}" r="8" fill="${TEAL}"/>` +
  label(mx, my, "MÁN BẠC", "Ninh Bình · di chỉ khảo cổ", TXT);
writeFileSync(`${OUT_LOCAL}/map_manbac.svg`, wrap(s));

// 3) two migration flows meeting at Mán Bạc (science)
const [fx1, fy1] = projection([112.5, 26.5]);  // từ nam Trung Quốc
const [fx2, fy2] = projection([107.3, 10.2]);  // từ phía Nam
const flow = (from, color) =>
  `<path d="M ${from[0]} ${from[1]} Q ${(from[0] + mx) / 2 + 60} ${(from[1] + my) / 2} ${mx} ${my}" fill="none" stroke="${color}" stroke-width="7" opacity="0.85" stroke-dasharray="18 12"/>` +
  `<circle cx="${from[0]}" cy="${from[1]}" r="11" fill="${color}"/>`;
s = base(true) + flow([fx1, fy1], TEAL) + flow([fx2, fy2], TEAL) +
  `<circle cx="${mx}" cy="${my}" r="26" fill="none" stroke="${TEAL}" stroke-width="5"/>` +
  `<circle cx="${mx}" cy="${my}" r="10" fill="${TEAL}"/>` +
  label(mx, my, "MÁN BẠC", "hai luồng gặp nhau", TXT);
writeFileSync(`${OUT_LOCAL}/map_flows.svg`, wrap(s));

// 4-6) warm 54-dots variants (12 / 30 / 54)
for (const [n, name] of [[12, "map_54_a.svg"], [30, "map_54_b.svg"], [54, "map_54_c.svg"]]) {
  s = base(false) + dots54(n);
  writeFileSync(`${OUT_LOCAL}/${name}`, wrap(s));
}

function wrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}

mkdirSync(PROJECT, { recursive: true });
for (const f of ["map_base.svg", "map_manbac.svg", "map_flows.svg", "map_54_a.svg", "map_54_b.svg", "map_54_c.svg"]) {
  copyFileSync(`${OUT_LOCAL}/${f}`, `${PROJECT}/${f}`);
}
console.log("maps written");
