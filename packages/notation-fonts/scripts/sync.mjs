#!/usr/bin/env node
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fontsDir, packageDir } from './lib.mjs';

const packages = path.resolve(process.argv[2] ?? path.dirname(packageDir));

const SLUGS = ['polyhymnia-notation', 'polyhymnia-manuscript'];

const reactStyles = path.join(packages, 'notation-react', 'styles');
mkdirSync(reactStyles, { recursive: true });

for (const slug of SLUGS) {
  copyFileSync(path.join(fontsDir, slug, `${slug}.woff2`), path.join(reactStyles, `${slug}.woff2`));
  console.log(`Synced ${slug}: woff2 -> notation-react/styles`);
}
