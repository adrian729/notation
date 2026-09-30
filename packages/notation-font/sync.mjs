#!/usr/bin/env node
// Copy built font assets from dist/<slug>/ into the packages that consume them.
//
// Only assets with a current consumer are synced. The engine's metrics are
// compiled into its layout code, so a family with no engine glyph mapping yet
// stays in dist/ until one exists — see font.md.
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
const packages = path.dirname(here);

// `metadata` also writes the engine's compiled-in metrics sidecar, since
// metadata.ts imports that JSON as a module.
const families = [
  { slug: 'polyhymnia-notation', metadata: 'metadata' },
  { slug: 'polyhymnia-mensural', metadata: 'metadata.mensural' },
];

for (const { slug, metadata } of families) {
  const from = path.join(dist, slug);
  const reactStyles = path.join(packages, 'notation-react', 'styles');
  mkdirSync(reactStyles, { recursive: true });

  copyFileSync(path.join(from, `${slug}.woff2`), path.join(reactStyles, `${slug}.woff2`));
  console.log(`Synced ${slug}.woff2 -> ${path.relative(packages, reactStyles)}/`);

  if (metadata) {
    const engineFont = path.join(packages, 'notation-engine', 'src', 'font');
    copyFileSync(path.join(from, 'metadata.json'), path.join(engineFont, `${metadata}.json`));
    copyFileSync(path.join(from, `${slug}.woff2`), path.join(packages, 'notation-engine', 'assets', `${slug}.woff2`));
    for (const file of ['OFL.txt', 'NOTICE.txt']) {
      copyFileSync(path.join(from, file), path.join(packages, 'notation-engine', 'assets', file));
    }
    console.log(`Synced ${slug}/metadata.json -> ${path.relative(packages, engineFont)}/${metadata}.json`);
    console.log(`Synced ${slug}.woff2 + OFL.txt + NOTICE.txt -> ${path.relative(packages, path.join(packages, 'notation-engine', 'assets'))}/`);
  }
}
