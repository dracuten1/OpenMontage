#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import SSR from remotion-composer's node_modules
const composerNodeModules = path.resolve(__dirname, '../remotion-composer/node_modules');
const ssrPath = path.join(composerNodeModules, '@antv/infographic/esm/ssr/index.js');

let renderToString;
try {
  const ssr = await import(ssrPath);
  renderToString = ssr.renderToString;
} catch (e) {
  console.error("Failed to import @antv/infographic/ssr:", e.message);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node tools/render_infographic.mjs <input.info | inline_dsl> <output.svg> [theme_options_json]");
  process.exit(1);
}

const input = args[0];
const outputFile = path.resolve(args[1]);

let dsl = '';
if (fs.existsSync(input)) {
  dsl = fs.readFileSync(input, 'utf-8');
} else {
  dsl = input;
}

try {
  console.log(`Rendering infographic to ${outputFile}...`);
  const svg = await renderToString(dsl);
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, svg, 'utf-8');
  console.log(`Success! Rendered ${svg.length} bytes SVG to ${outputFile}`);
} catch (err) {
  console.error("Render failed:", err);
  process.exit(1);
}
