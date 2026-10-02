#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';
import { convert } from './convert.js';
import { check } from './check.js';
import { assignIds } from './ids.js';

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function main(argv: string[]): void {
  const [inputPath, outputPath] = argv;
  if (!inputPath || !outputPath) {
    fail('Usage: musicxml-to-mnx <in.musicxml|in.xml> <out.mnx.json>');
  }

  const ext = extname(inputPath).toLowerCase();
  if (ext === '.mxl') {
    fail(`${inputPath}: compressed MusicXML (.mxl) is not supported — decompress to .musicxml/.xml first.`);
  }
  if (ext !== '.musicxml' && ext !== '.xml') {
    fail(`${inputPath}: expected a .musicxml or .xml file, got "${ext}".`);
  }

  let musicXml: string;
  try {
    musicXml = readFileSync(inputPath, 'utf8');
  } catch (error) {
    fail(`${inputPath}: could not read input: ${error instanceof Error ? error.message : String(error)}`);
  }

  const converted = convert(musicXml);
  if (!converted.ok) fail(`${inputPath}: conversion failed: ${converted.error}`);
  for (const w of converted.warnings) {
    const where = [w.part && `part ${w.part}`, w.measure && `measure ${w.measure}`, w.line && `line ${w.line}`]
      .filter(Boolean)
      .join(', ');
    process.stderr.write(`${inputPath}: warning [${w.code}] ${w.message}${where ? ` (${where})` : ''}\n`);
  }

  const withIds = assignIds(converted.mnx);
  const result = check(withIds);
  if (!result.ok) {
    process.stderr.write(`${inputPath}: ${result.problems.length} problem(s):\n`);
    for (const problem of result.problems) process.stderr.write(`  [schema] ${problem}\n`);
    process.exit(1);
  }

  try {
    writeFileSync(outputPath, `${JSON.stringify(withIds, null, 2)}\n`, 'utf8');
  } catch (error) {
    fail(`${outputPath}: could not write output: ${error instanceof Error ? error.message : String(error)}`);
  }
  process.stdout.write(`${inputPath} -> ${outputPath}\n`);
}

main(process.argv.slice(2));
