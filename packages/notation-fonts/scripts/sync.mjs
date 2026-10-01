#!/usr/bin/env node
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fontsDir, packageDir } from './lib.mjs';

const packages = path.resolve(process.argv[2] ?? path.dirname(packageDir));

const FAMILIES = [
  { slug: 'polyhymnia-notation', metadata: 'metadata' },
  { slug: 'polyhymnia-mensural', metadata: 'metadata.mensural' },
];

const reactStyles = path.join(packages, 'notation-react', 'styles');
const engineFont = path.join(packages, 'notation-engine', 'src', 'font');
const engineAssets = path.join(packages, 'notation-engine', 'assets');
for (const dir of [reactStyles, engineFont, engineAssets]) mkdirSync(dir, { recursive: true });

for (const { slug, metadata } of FAMILIES) {
  const from = path.join(fontsDir, slug);
  copyFileSync(path.join(from, `${slug}.woff2`), path.join(reactStyles, `${slug}.woff2`));
  copyFileSync(path.join(from, `${slug}.woff2`), path.join(engineAssets, `${slug}.woff2`));
  copyFileSync(path.join(from, 'metadata.json'), path.join(engineFont, `${metadata}.json`));
  console.log(
    `Synced ${slug}: woff2 -> notation-react/styles, notation-engine/assets; metadata -> notation-engine/src/font/${metadata}.json`,
  );
}

copyFileSync(path.join(fontsDir, FAMILIES[0].slug, 'OFL.txt'), path.join(engineAssets, 'OFL.txt'));
writeFileSync(
  path.join(engineAssets, 'NOTICE.txt'),
  FAMILIES.map(({ slug }) => readFileSync(path.join(fontsDir, slug, 'NOTICE.txt'), 'utf8')).join('\n'),
);
console.log('Synced OFL.txt + combined NOTICE.txt -> notation-engine/assets');
