#!/usr/bin/env node
// Build-time guard for the two families. The OFL rename is asserted inside
// rename_and_compress.py; this checks the things that would silently degrade
// engraving if a manifest drifted — a family that loses a glyph the other one has,
// or shared glyphs whose metrics stop matching, so switching family would start
// reflowing the music instead of only reshaping it.
//
// Run directly to re-check dist/ without rebuilding: node verify.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

const BASE = './manifest.ts';
const FULL = './manifest.mensural.ts';

const read = (slug) => JSON.parse(readFileSync(path.join(here, 'dist', slug, 'metadata.json'), 'utf8'));
const base = read('polyhymnia-notation');
const full = read('polyhymnia-mensural');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

check(
  JSON.stringify(base.engravingDefaults) === JSON.stringify(full.engravingDefaults),
  'engraving defaults differ between families — shared staff geometry must match',
);

const missing = Object.keys(base.glyphAdvanceWidths).filter((g) => !(g in full.glyphAdvanceWidths));
check(missing.length === 0, `${FULL} is missing glyphs ${BASE} has: ${missing.join(', ')}`);

const differs = (section) =>
  Object.keys(base[section])
    .filter((g) => g in full[section])
    .filter((g) => JSON.stringify(base[section][g]) !== JSON.stringify(full[section][g]));

for (const section of ['glyphAdvanceWidths', 'glyphBBoxes', 'glyphsWithAnchors']) {
  const drifted = differs(section);
  check(drifted.length === 0, `${section} differ for shared glyphs: ${drifted.join(', ')}`);
}

for (const [label, meta] of [
  ['polyhymnia-notation', base],
  ['polyhymnia-mensural', full],
]) {
  check(!/bravura/i.test(meta.fontName), `${label} metadata fontName still reads "${meta.fontName}"`);
}

if (failures.length > 0) {
  console.error('Font verification failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `Verified: ${Object.keys(full.glyphAdvanceWidths).length} mensural glyphs superset the ` +
    `${Object.keys(base.glyphAdvanceWidths).length} modern ones, shared metrics identical, no "Bravura" in names.`,
);
