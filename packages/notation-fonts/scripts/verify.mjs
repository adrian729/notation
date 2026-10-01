#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_FONT_SLUG,
  allGlyphs,
  findLicence,
  fontjob,
  fontsDir,
  glyphStyles,
  hex,
  isOfl,
  outDir,
  readJson,
  reservedFontNames,
} from './lib.mjs';
import { testSheet } from './sheet.mjs';

const DEFAULT_PAIR = { modern: 'polyhymnia-notation', mensural: 'polyhymnia-mensural' };

function list(names, limit = 12) {
  return names.length > limit ? `${names.slice(0, limit).join(', ')} … (+${names.length - limit})` : names.join(', ');
}

function nonEmpty(file) {
  return existsSync(file) && statSync(file).size > 0;
}

export function verifyFont(dir, { sheet = true } = {}) {
  const slug = path.basename(dir);
  const failures = [];
  const notes = [];
  const fail = (message) => failures.push(message);

  const woff2 = path.join(dir, `${slug}.woff2`);
  const metadataFile = path.join(dir, 'metadata.json');
  const licenceFile = findLicence(dir);
  for (const [file, label] of [
    [woff2, `${slug}.woff2`],
    [metadataFile, 'metadata.json'],
    [path.join(dir, 'NOTICE.txt'), 'NOTICE.txt'],
  ]) {
    if (!nonEmpty(file)) fail(`missing or empty ${label}`);
  }
  if (!licenceFile || !nonEmpty(licenceFile)) fail('missing licence (OFL.txt or LICENSE.txt)');
  if (failures.length > 0) return { slug, failures, notes };

  const metadata = readJson(metadataFile);
  const glyphs = allGlyphs();
  const font = fontjob({ command: 'inspect', input: woff2, codepoints: Object.values(glyphs) });
  const cmap = new Set(font.cmap);

  const inCmap = (name) => cmap.has(glyphs[name]);
  const inMetadata = (name) => name in metadata.glyphAdvanceWidths && name in metadata.glyphBBoxes;

  const cmapOnly = Object.keys(glyphs).filter((name) => inCmap(name) && !inMetadata(name));
  const metadataOnly = Object.keys(glyphs).filter((name) => !inCmap(name) && inMetadata(name));
  if (cmapOnly.length > 0) fail(`in the font but without metadata: ${list(cmapOnly)}`);
  if (metadataOnly.length > 0) fail(`in the metadata but not in the font's cmap: ${list(metadataOnly)}`);
  const unknown = Object.keys(metadata.glyphAdvanceWidths).filter((name) => !(name in glyphs));
  if (unknown.length > 0) fail(`metadata glyphs outside the style tables: ${list(unknown)}`);
  const strayAnchors = Object.keys(metadata.glyphsWithAnchors ?? {}).filter((name) => !inMetadata(name));
  if (strayAnchors.length > 0) fail(`anchors for glyphs without metrics: ${list(strayAnchors)}`);

  const covered = [];
  for (const [styleName, style] of Object.entries(glyphStyles)) {
    const missing = Object.keys(style.core).filter((name) => !inCmap(name) || !inMetadata(name));
    const optional = Object.keys(style.optional).filter(inCmap).length;
    if (missing.length === 0) covered.push(styleName);
    notes.push(
      missing.length === 0
        ? `${styleName}: core complete (${Object.keys(style.core).length}), optional ${optional}/${Object.keys(style.optional).length}`
        : `${styleName}: missing ${missing.length} core glyphs: ${list(missing)}`,
    );
  }
  if (covered.length === 0) fail('covers the core glyphs of no style');

  const noAnchors = Object.keys(glyphs).filter(
    (name) => name.startsWith('notehead') && inMetadata(name) && !metadata.glyphsWithAnchors?.[name],
  );
  if (noAnchors.length > 0)
    notes.push(`noteheads without anchors (stems fall back to the notehead edge): ${list(noAnchors)}`);

  const defaultsFile = path.join(fontsDir, DEFAULT_FONT_SLUG, 'metadata.json');
  if (existsSync(defaultsFile)) {
    const required = Object.keys(readJson(defaultsFile).engravingDefaults);
    const missing = required.filter((key) => !(key in (metadata.engravingDefaults ?? {})));
    if (missing.length > 0) fail(`engravingDefaults missing ${list(missing)}`);
  }

  if (!font.family) fail('the font has no family name (name ID 1/16)');
  else if (font.family !== metadata.fontName) {
    fail(`font family "${font.family}" differs from metadata fontName "${metadata.fontName}"`);
  }

  const licence = readFileSync(licenceFile, 'utf8');
  const notice = readFileSync(path.join(dir, 'NOTICE.txt'), 'utf8');
  const noticed = /reserves the font name ((?:"[^"]+"(?:, )?)+)/.exec(notice)?.[1] ?? '';
  const reserved = [
    ...new Set([
      ...(isOfl(licence) ? reservedFontNames(licence) : []),
      ...[...noticed.matchAll(/"([^"]+)"/g)].map((m) => m[1]),
    ]),
  ];
  const familyIds = new Set(font.familyNameIds);
  const names = [
    ...font.names.filter((r) => familyIds.has(r.nameID)).map((r) => [`name ID ${r.nameID}`, r.value]),
    ...font.cffNames.map((value) => ['CFF name', value]),
    ['metadata fontName', metadata.fontName],
  ];
  for (const r of reserved) {
    for (const [where, value] of names) {
      if (value.toLowerCase().includes(r.toLowerCase()))
        fail(`${where} "${value}" contains the reserved font name "${r}"`);
    }
  }
  notes.push(
    reserved.length > 0
      ? `licence reserves ${reserved.map((r) => `"${r}"`).join(', ')}; not used in any name`
      : `licence ${path.basename(licenceFile)} reserves no font name`,
  );

  if (sheet) {
    mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, `${slug}.html`);
    writeFileSync(file, testSheet({ slug, metadata, font, glyphs, styles: glyphStyles, hex }));
    notes.push(`test sheet: ${path.relative(process.cwd(), file)}`);
  }
  return { slug, failures, notes };
}

export function verifyDefaults() {
  const failures = [];
  const read = (slug) => readJson(path.join(fontsDir, slug, 'metadata.json'));
  const base = read(DEFAULT_PAIR.modern);
  const full = read(DEFAULT_PAIR.mensural);
  if (JSON.stringify(base.engravingDefaults) !== JSON.stringify(full.engravingDefaults)) {
    failures.push('engraving defaults differ between the default fonts; shared staff geometry must match');
  }
  const missing = Object.keys(base.glyphAdvanceWidths).filter((g) => !(g in full.glyphAdvanceWidths));
  if (missing.length > 0)
    failures.push(`${DEFAULT_PAIR.mensural} lacks glyphs ${DEFAULT_PAIR.modern} has: ${list(missing)}`);
  for (const section of ['glyphAdvanceWidths', 'glyphBBoxes', 'glyphsWithAnchors']) {
    const drifted = Object.keys(base[section])
      .filter((g) => g in full[section])
      .filter((g) => JSON.stringify(base[section][g]) !== JSON.stringify(full[section][g]));
    if (drifted.length > 0) failures.push(`${section} differ for shared glyphs: ${list(drifted)}`);
  }
  return { slug: 'default fonts (shared metrics)', failures, notes: [] };
}

export function reportVerification(...reports) {
  let ok = true;
  for (const { slug, failures, notes } of reports) {
    console.log(`${failures.length === 0 ? 'ok  ' : 'FAIL'} ${slug}`);
    for (const note of notes) console.log(`     ${note}`);
    for (const failure of failures) console.log(`   ✗ ${failure}`);
    ok &&= failures.length === 0;
  }
  return ok;
}

function fontDirs(args) {
  if (args.length > 0) return args.map((arg) => (existsSync(arg) ? path.resolve(arg) : path.join(fontsDir, arg)));
  return readdirSync(fontsDir)
    .map((entry) => path.join(fontsDir, entry))
    .filter((entry) => statSync(entry).isDirectory());
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const reports = fontDirs(args).map((dir) => verifyFont(dir));
  const defaultsPresent = Object.values(DEFAULT_PAIR).every((slug) =>
    existsSync(path.join(fontsDir, slug, 'metadata.json')),
  );
  if (args.length === 0 && defaultsPresent) reports.push(verifyDefaults());
  process.exit(reportVerification(...reports) ? 0 : 1);
}
