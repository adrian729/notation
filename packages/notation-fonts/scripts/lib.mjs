import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { glyphStyles } from '../src/styles.ts';

export const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const fontsDir = path.join(packageDir, 'fonts');
export const vendorDir = path.join(packageDir, 'vendor');
export const outDir = path.join(packageDir, 'out');
export const DEFAULT_FONT_SLUG = 'polyhymnia-mensural';
export const LICENCE_FILES = ['OFL.txt', 'LICENSE.txt'];

export { glyphStyles };

export function styleNames() {
  return Object.keys(glyphStyles);
}

export function glyphsForStyles(names) {
  const glyphs = {};
  for (const name of names) {
    const style = glyphStyles[name];
    if (!style) throw new Error(`Unknown style "${name}". Known: ${styleNames().join(', ')}`);
    Object.assign(glyphs, style.glyphs);
  }
  return glyphs;
}

export function allGlyphs() {
  return glyphsForStyles(styleNames());
}

function pythonPath() {
  const candidate = process.env.NOTATION_FONTS_PYTHON ?? path.join(packageDir, '.venv', 'bin', 'python3');
  if (!existsSync(candidate)) {
    throw new Error(
      `Missing Python at ${candidate}. Run: python3 -m venv ${path.join(packageDir, '.venv')} && ` +
        `${path.join(packageDir, '.venv', 'bin', 'pip')} install -r ${path.join(packageDir, 'requirements.txt')}`,
    );
  }
  return candidate;
}

export function fontjob(job) {
  const output = execFileSync(pythonPath(), [path.join(packageDir, 'scripts', 'fontjob.py')], {
    input: JSON.stringify(job),
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  return JSON.parse(output);
}

export function isOfl(text) {
  return /SIL\s+Open\s+Font\s+License/i.test(text);
}

export function licenceHeader(text) {
  return text.split(/This\s+Font\s+Software\s+is\s+licensed\s+under/i)[0].trim();
}

export function reservedFontNames(...texts) {
  const names = new Set();
  for (const text of texts) {
    if (!text) continue;
    const header = licenceHeader(text).replace(/\s+/g, ' ');
    for (const match of header.matchAll(/Reserved Font Names?\s*:?\s*(.*?)(?:\.(?:\s|$)|$)/gi)) {
      const clause = match[1];
      const quoted = [...clause.matchAll(/["“”'‘’]([^"“”'‘’]+)["“”'‘’]/g)].map((m) => m[1]);
      const found = quoted.length > 0 ? quoted : clause.split(/,|\band\b/);
      for (const name of found) {
        const trimmed = name.trim().replace(/[.,;]+$/, '');
        if (trimmed) names.add(trimmed);
      }
    }
  }
  return [...names];
}

export function findLicence(dir) {
  for (const name of LICENCE_FILES) {
    const file = path.join(dir, name);
    if (existsSync(file)) return file;
  }
  return undefined;
}

export function findSibling(file, matches) {
  const dir = path.dirname(file);
  const stem = path.basename(file, path.extname(file)).toLowerCase();
  return readdirSync(dir)
    .filter((entry) => matches(entry.toLowerCase(), stem))
    .map((entry) => path.join(dir, entry))[0];
}

export function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function slugify(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function hex(cp) {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}
