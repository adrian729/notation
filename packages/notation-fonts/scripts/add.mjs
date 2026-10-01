#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import path from 'node:path';
import {
  DEFAULT_FONT_SLUG,
  LICENCE_FILES,
  findSibling,
  fontjob,
  fontsDir,
  glyphsForStyles,
  isOfl,
  licenceHeader,
  readJson,
  reservedFontNames,
  slugify,
  styleNames,
} from './lib.mjs';
import { reportVerification, verifyFont } from './verify.mjs';

const FONT_EXTENSIONS = ['.otf', '.ttf', '.woff', '.woff2'];
const LICENCE_NAMES = [
  'ofl.txt',
  'ofl-1.1.txt',
  'ofl.md',
  'license',
  'license.txt',
  'license.md',
  'licence.txt',
  'licence',
];

function resolveLicence(input, explicit, embedded) {
  const file = explicit ?? findSibling(input, (entry) => LICENCE_NAMES.includes(entry));
  if (file) return { file, text: readFileSync(file, 'utf8') };
  if (embedded) return { text: `${embedded.trim()}\n` };
  throw new Error(`No licence for ${input}: none next to the font, none embedded (name ID 13). Pass --licence <file>.`);
}

function resolveMetadata(input, explicit, mapping) {
  if (explicit) return explicit;
  if (mapping) return undefined;
  return findSibling(
    input,
    (entry, stem) => entry === `${stem}.json` || entry === `${stem}_metadata.json` || entry === 'metadata.json',
  );
}

function resolveFamily(original, requested, reserved) {
  const clash = (name) => reserved.find((r) => name.toLowerCase().includes(r.toLowerCase()));
  if (reserved.length === 0) return requested ?? original;
  if (!requested) {
    throw new Error(
      `The licence reserves the font name ${reserved.map((r) => `"${r}"`).join(', ')}, and a subset may not keep it ` +
        '(OFL-FAQ 2.6). Pass --family <NewName>.',
    );
  }
  const reservedPart = clash(requested);
  if (reservedPart) throw new Error(`--family "${requested}" contains the reserved font name "${reservedPart}".`);
  return requested;
}

function firstParagraph(text) {
  return text
    .trim()
    .split(/\n\s*\n/)[0]
    .replace(/\s+/g, ' ');
}

function noticeText({ family, info, licence, licenceFile, ofl, reserved, sourceUrl, result }) {
  const original = `${info.family} ${info.version}`;
  const copyright = ofl ? firstParagraph(licenceHeader(licence.text)) : firstParagraph(info.copyright ?? '');
  const version = /Version\s+(\d+(?:\.\d+)*)/i.exec(licence.text)?.[1];
  const licenceName = ofl ? `SIL Open Font License${version ? ` ${version}` : ''}` : 'the licence';
  const upstream = sourceUrl ?? info.vendorUrl;
  const naming =
    reserved.length > 0
      ? `renamed to "${family}": the licence reserves the font name ${reserved.map((r) => `"${r}"`).join(', ')}, and a subset does not preserve Functional Equivalence, so per OFL-FAQ 2.6 the Reserved Font Name may not be kept on the modified font.`
      : family === info.family
        ? `kept its original name "${family}": the licence reserves no font name.`
        : `renamed to "${family}" (the licence reserves no font name).`;
  const lines = [
    `${family} is a modified version of the font ${original}.`,
    '',
    `Original font: ${original}`,
    ...(copyright ? [`Copyright: ${copyright}`] : []),
    ...(upstream ? [`Upstream: ${upstream}`] : []),
    `Licence: ${licenceName} (see ${licenceFile} in this directory).`,
    '',
    'Modifications:',
    `- subsetted to ${result.present.length} glyphs, the glyph tables of @polyhymnia/notation-fonts (src/styles.ts);`,
    ...(result.scale
      ? [
          `- re-encoded from its legacy codepoints to SMuFL codepoints (see mapping.json in this directory) and scaled by ${result.scale.toFixed(4)} so that noteheadBlack is one staff space tall;`,
        ]
      : []),
    `- ${naming}`,
    '- converted to WOFF2.',
  ];
  return `${lines.join('\n')}\n`;
}

export function addFont(options) {
  const input = path.resolve(options.input);
  if (!existsSync(input)) throw new Error(`No such font: ${input}`);
  if (!FONT_EXTENSIONS.includes(path.extname(input).toLowerCase())) {
    throw new Error(`Unsupported font format ${path.extname(input)}: expected ${FONT_EXTENSIONS.join(', ')}.`);
  }
  const info = fontjob({ command: 'info', input });
  const mappingFile = options.mapping ? path.resolve(options.mapping) : undefined;
  const mapping = mappingFile ? readJson(mappingFile) : undefined;
  if (!mapping && info.privateUseCodepoints === 0) {
    throw new Error(`${input} has no SMuFL (private use) codepoints. A legacy font needs --mapping <mapping.json>.`);
  }
  const metadata = resolveMetadata(input, options.metadata ? path.resolve(options.metadata) : undefined, mapping);
  if (mapping && metadata) throw new Error('A legacy font (--mapping) cannot also take SMuFL metadata.');
  const licence = resolveLicence(input, options.licence ? path.resolve(options.licence) : undefined, info.licence);
  const ofl = isOfl(licence.text) || isOfl(info.licence ?? '') || isOfl(info.copyright ?? '');
  const reserved = ofl ? reservedFontNames(licence.text, info.copyright) : [];
  const family = resolveFamily(info.family, options.family, reserved);
  const slug = options.slug ?? slugify(family);
  const dir = path.join(options.outRoot ?? fontsDir, slug);
  mkdirSync(dir, { recursive: true });

  const defaults = options.defaultsMetadata ?? path.join(fontsDir, DEFAULT_FONT_SLUG, 'metadata.json');
  const result = fontjob({
    command: 'build',
    input,
    glyphs: glyphsForStyles(options.styles ?? styleNames()),
    mapping,
    family,
    reserved,
    metadata,
    defaults: existsSync(defaults) ? defaults : undefined,
    outWoff2: path.join(dir, `${slug}.woff2`),
    outMetadata: path.join(dir, 'metadata.json'),
  });

  const licenceFile = ofl ? 'OFL.txt' : 'LICENSE.txt';
  for (const name of LICENCE_FILES) rmSync(path.join(dir, name), { force: true });
  if (licence.file) copyFileSync(licence.file, path.join(dir, licenceFile));
  else writeFileSync(path.join(dir, licenceFile), licence.text);
  if (mappingFile) copyFileSync(mappingFile, path.join(dir, 'mapping.json'));
  else rmSync(path.join(dir, 'mapping.json'), { force: true });
  writeFileSync(
    path.join(dir, 'NOTICE.txt'),
    noticeText({ family, info, licence, licenceFile, ofl, reserved, sourceUrl: options.sourceUrl, result }),
  );

  return { slug, dir, family, reserved, metadata, ...result };
}

export function describeAdd(added) {
  const lines = [
    `Added ${added.family} -> ${path.relative(process.cwd(), added.dir)}/ (${added.present.length} glyphs, ${added.outline}, ${added.upem} units/em)`,
  ];
  if (added.reserved.length > 0) lines.push(`  renamed: licence reserves ${added.reserved.join(', ')}`);
  if (!added.metadata)
    lines.push('  metadata: measured from outlines (no SMuFL metadata); engraving defaults inherited');
  if (added.measured.length > 0 && added.metadata)
    lines.push(`  measured (absent from metadata): ${added.measured.join(', ')}`);
  if (added.scale) lines.push(`  calibrated: scaled by ${added.scale.toFixed(4)} on noteheadBlack`);
  if (added.unresolved.length > 0)
    lines.push(`  mapping entries not found in the font: ${added.unresolved.join(', ')}`);
  return lines.join('\n');
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      family: { type: 'string' },
      name: { type: 'string' },
      metadata: { type: 'string' },
      mapping: { type: 'string' },
      licence: { type: 'string' },
      style: { type: 'string' },
      'source-url': { type: 'string' },
    },
  });
  if (positionals.length !== 1) {
    console.error(
      'Usage: font:add <font.otf|ttf|woff|woff2> [--family Name] [--name slug] [--metadata smufl.json] ' +
        '[--mapping mapping.json] [--licence OFL.txt] [--style modern,mensural] [--source-url URL]',
    );
    process.exit(2);
  }
  try {
    const added = addFont({
      input: positionals[0],
      family: values.family,
      slug: values.name,
      metadata: values.metadata,
      mapping: values.mapping,
      licence: values.licence,
      styles: values.style?.split(',').map((s) => s.trim()),
      sourceUrl: values['source-url'],
    });
    console.log(describeAdd(added));
    process.exit(reportVerification(verifyFont(added.dir)) ? 0 : 1);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
