import { describe, expect, it } from 'vitest';
import { applyIntent } from '../src/edit/index.js';
import { elementIds, parsePitch } from '../src/index.js';
import type { ElementPosition, MnxDocument } from '../src/index.js';
import { chord, mnx, note, rest } from './support.js';

function multiPartDocument(): MnxDocument {
  const base = mnx({ sequences: [] });
  return {
    ...base,
    parts: [
      {
        measures: [
          {
            sequences: [
              { content: [chord(['C4', 'E4'], 'q')] },
              { content: [rest('q')] },
              { content: [note('E4', 'q')] },
              { staff: 2, content: [note('F3', 'q')] },
            ],
          },
        ],
      },
      {
        measures: [{ sequences: [{ content: [note('G4', 'q')] }, { staff: 2, content: [note('A3', 'q')] }] }],
      },
    ],
  };
}

const at = (part: number, staff: number, sequenceIndex: number, note?: number): ElementPosition => ({
  part,
  staff,
  measureIndex: 0,
  sequenceIndex,
  path: [0],
  ...(note === undefined ? {} : { note }),
});

const WIDE = { parts: [0, 1], staves: [1, 2], maxVoices: Infinity };

describe('scoped elementIds', () => {
  const doc = multiPartDocument();

  it.each([
    [at(0, 1, 0), 'm0.s0.e0'],
    [at(0, 1, 0, 1), 'm0.s0.e0.n1'],
    [at(0, 1, 1), 'm0.s1.e0'],
  ])('keeps default-scope ids regardless of the requested scope (%o)', (pos, expected) => {
    expect(elementIds(doc).idAt(pos)).toBe(expected);
    expect(elementIds(doc, WIDE).idAt(pos)).toBe(expected);
  });

  it.each([
    [at(0, 1, 2), 'm0.s2.e0'],
    [at(0, 2, 3), 'st2.m0.s3.e0'],
    [at(1, 1, 0), 'p1.m0.s0.e0'],
    [at(1, 2, 1), 'p1.st2.m0.s1.e0'],
  ])('prefixes ids outside the default scope with the non-default part and staff (%o)', (pos, expected) => {
    const wide = elementIds(doc, WIDE);
    expect(wide.idAt(pos)).toBe(expected);
    expect(wide.nodeOf(expected)).toMatchObject({ part: pos.part, staff: pos.staff });
    expect(elementIds(doc).nodeOf(expected)).toBeUndefined();
  });

  it('addresses only the requested scope without changing its ids', () => {
    const partOne = elementIds(doc, { parts: [1] });
    expect(partOne.idAt(at(1, 1, 0))).toBe('p1.m0.s0.e0');
    expect(partOne.nodeOf('m0.s0.e0')).toBeUndefined();
  });
});

describe('ElementIds minting authority', () => {
  const doc = multiPartDocument();

  it('mints beams idempotently into forks of a frozen parent', () => {
    const ids = elementIds(doc);
    ids.freeze();
    expect(() => ids.mint('m0.s0.e0.beam')).toThrow();
    expect(ids.fork().mint('m0.s0.e0.beam')).toBe('m0.s0.e0.beam');
    expect(ids.fork().mint('m0.s0.e0.beam')).toBe('m0.s0.e0.beam');
  });

  it('reports an explicit id colliding with a laid-out id in the fork that registered it', () => {
    const ids = elementIds(doc);
    ids.freeze();
    const fork = ids.fork();
    expect(fork.registerExplicit('beam-1', { measureIndex: 0 })).toBe(true);
    expect(fork.registerExplicit('m0.s0.e0', { measureIndex: 0, voice: 1 })).toBe(false);
    expect(fork.diagnostics).toEqual([expect.objectContaining({ code: 'id-collision', measureIndex: 0, voice: 1 })]);
    expect(ids.diagnostics).toEqual([]);
  });
});

describe('applyIntent part index', () => {
  it('edits an event of part 1 and leaves part 0 untouched', () => {
    const doc = multiPartDocument();
    const intent = { type: 'setPitches', event: 'p1.m0.s0.e0', pitches: [parsePitch('A4')] } as const;

    const result = applyIntent(doc, intent, 1);

    expect(result.changed).toEqual(['p1.m0.s0.e0']);
    expect(result.doc.parts[0]).toBe(doc.parts[0]);
    expect((result.doc.parts[1]!.measures[0]!.sequences[0]!.content[0] as any).notes[0].pitch).toEqual(
      parsePitch('A4'),
    );
    expect(applyIntent(doc, intent).diagnostics.map((d) => d.code)).toEqual(['intent-target-missing']);
  });
});
