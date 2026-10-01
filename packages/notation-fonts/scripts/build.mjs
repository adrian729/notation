#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { vendorDir } from './lib.mjs';
import { addFont, describeAdd } from './add.mjs';
import { reportVerification, verifyDefaults, verifyFont } from './verify.mjs';

const SOURCE = {
  font: path.join(vendorDir, 'Bravura.otf'),
  metadata: path.join(vendorDir, 'Bravura.json'),
  licence: path.join(vendorDir, 'OFL.txt'),
  url: 'https://github.com/steinbergmedia/bravura',
};

const DEFAULT_FONTS = [
  { slug: 'polyhymnia-notation', family: 'PolyhymniaNotation', style: 'modern' },
  { slug: 'polyhymnia-mensural', family: 'PolyhymniaMensural', style: 'mensural' },
];

for (const file of [SOURCE.font, SOURCE.metadata, SOURCE.licence]) {
  if (!existsSync(file)) {
    console.error(
      `Missing ${file}. Vendor Bravura 1.482 (steinbergmedia/bravura release bravura-1.482: ` +
        'redist/otf/Bravura.otf, redist/bravura_metadata.json as Bravura.json, OFL.txt) into vendor/.',
    );
    process.exit(1);
  }
}

const reports = [];
for (const { slug, family, style } of DEFAULT_FONTS) {
  const added = addFont({
    input: SOURCE.font,
    metadata: SOURCE.metadata,
    licence: SOURCE.licence,
    sourceUrl: SOURCE.url,
    defaultsMetadata: SOURCE.metadata,
    family,
    slug,
    styles: [style],
  });
  console.log(describeAdd(added));
  reports.push(verifyFont(added.dir));
}
reports.push(verifyDefaults());
process.exit(reportVerification(...reports) ? 0 : 1);
