#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { allGlyphs, outDir, packageDir } from './lib.mjs';

// The only outside outlines are Texturina's lettering, licensed under the OFL.
// Cache pinned, verified sources in vendor/; subsequent builds work offline.
const texturinaCommit = '8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5';
const texturinaDir = path.join(packageDir, 'vendor/texturina');
mkdirSync(texturinaDir, { recursive: true });
for (const [file, sha] of [
  ['Texturina[opsz,wght].ttf', '478a15d7145cf94565cfc1aeb33596aeb0118c7d86a84d061ddf46de3d7dfda3'],
  ['OFL.txt', '631ba6504ec2454e472196173aea91c423295787d2128f3732e73fb07a9ea1e0'],
]) {
  const target = path.join(texturinaDir, file);
  let bytes;
  if (existsSync(target)) bytes = readFileSync(target);
  else {
    const response = await fetch(
      `https://raw.githubusercontent.com/google/fonts/${texturinaCommit}/ofl/texturina/${encodeURIComponent(file)}`,
    );
    if (!response.ok) throw new Error(`Cannot fetch Texturina ${file}: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (createHash('sha256').update(bytes).digest('hex') !== sha) throw new Error(`Texturina checksum mismatch: ${file}`);
  if (!existsSync(target)) writeFileSync(target, bytes);
}

mkdirSync(outDir, { recursive: true });
const glyphFile = path.join(outDir, 'manuscript-glyphs.json');
writeFileSync(glyphFile, JSON.stringify(allGlyphs()));
execFileSync(
  process.env.NOTATION_FONTS_PYTHON ?? path.join(packageDir, '.venv/bin/python3'),
  ['-B', path.join(packageDir, 'scripts/manuscript/build.py'), glyphFile],
  { stdio: 'inherit' },
);
// font:add alone writes fonts/**, including licences, measured metrics and the proof.
execFileSync(
  'pnpm',
  [
    '--filter',
    '@polyhymnia/notation-fonts',
    'font:add',
    path.join(outDir, 'manuscript-source/PolyhymniaManuscript.ttf'),
    '--family',
    'PolyhymniaManuscript',
    '--name',
    'polyhymnia-manuscript',
    '--style',
    'modern,mensural',
    '--source-url',
    'https://github.com/adrian729/notation/tree/development/packages/notation-fonts/scripts/manuscript',
  ],
  { cwd: packageDir, stdio: 'inherit' },
);
