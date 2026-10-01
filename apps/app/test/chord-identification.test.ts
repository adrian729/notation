import { describe, expect, it } from 'vitest';
import { parsePitch, pitchToMidi, stepNumberOf } from '@polyhymnia/mnx';
import { CHORDS, generateQuestion, playbacksFor } from '@/exercises/chord-identification';
import { deterministicRng } from '@/exercises/shared';

const letterIndex = (token: string) => {
  const p = parsePitch(token);
  return stepNumberOf(p.step) + 7 * p.octave;
};

describe('generateQuestion chord spelling', () => {
  it('spells every chord as stacked degrees above its root on every root', () => {
    const rng = deterministicRng(11);
    for (const chord of CHORDS) {
      const options = {
        chords: [chord.id],
        range: { low: 'C3', high: 'C6' },
        playbacks: ['harmonic'],
        tempo: 'medium',
        questionCount: 10,
        autoNext: false,
      } as const;
      const roots = new Set<number>();
      for (let i = 0; i < 150; i++) {
        const q = generateQuestion(options, rng);
        const [root, ...members] = q.pitches;
        const rootMidi = pitchToMidi(parsePitch(root!));
        roots.add(rootMidi % 12);
        expect(q.quality).toBe(chord.id);
        expect(members).toHaveLength(chord.above.length);
        members.forEach((token, k) => {
          const spec = chord.above[k]!;
          const note = parsePitch(token);
          expect(letterIndex(token) - letterIndex(root!), `${chord.id} ${q.pitches.join(' ')}`).toBe(
            spec.degreeOptions[0]! - 1,
          );
          expect(pitchToMidi(note) - rootMidi).toBe(spec.semitones);
          expect(Math.abs(note.alter ?? 0)).toBeLessThanOrEqual(2);
        });
      }
      expect(roots.size, chord.id).toBe(12);
    }
  });
});

describe('playbacksFor', () => {
  it.each([
    [['harmonic'], ['asc', 'desc'], ['harmonic']],
    [['harmonic'], [], ['harmonic']],
    [['arpeggio', 'arpeggio-harmonic', 'harmonic'], ['asc'], ['arp-asc', 'arp-harmonic-asc', 'harmonic']],
    [['arpeggio-harmonic'], ['desc', 'asc'], ['arp-harmonic-asc', 'arp-harmonic-desc']],
  ] as const)('%j %j', (executions, directions, expected) => {
    expect(playbacksFor(executions, directions)).toEqual(expected);
  });
});
