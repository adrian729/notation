import { pitchToMidi } from '@polyhymnia/notation-model';
import { chordById, chordSpan, type ChordId, type ChordQuality } from './chords.js';
import type { ChordPlayback } from './playback.js';
import type { ChordOptions } from './options.js';
import { spellRelative, pitchToToken, tokenMidi, type SpelledPitch } from '../shared/spelling.js';
import { clefForMidis, midiOfToken, midiToPitch, pickOne, randomInt, type Rng } from '../shared/tones.js';

export interface Question {
  playback: ChordPlayback;
  quality: ChordId;
  pitches: readonly string[];
  noteNames: readonly string[];
  clef: 'treble' | 'bass';
}

const LOW = tokenMidi('C3')!;
const HIGH = tokenMidi('C6')!;
const MAX_ATTEMPTS = 400;

const ACCIDENTAL_GLYPH: Record<number, string> = { '-2': '𝄫', '-1': '♭', '0': '', '1': '♯', '2': '𝄪' };

function spellChord(chord: ChordQuality, root: SpelledPitch): SpelledPitch[] | undefined {
  const spelled = spellRelative(root, chord.above, 1, 2);
  return spelled && [spelled.pinned, ...spelled.members.map((member) => member.pitch)];
}

export function questionSignature(q: Question): string {
  return `${q.quality}|${midiOfToken(q.pitches[0]!)}|${q.playback}`;
}

export function generateQuestion(options: ChordOptions, rng: Rng = Math.random, last?: string): Question {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const playback = pickOne(options.playbacks, rng);
    const quality = pickOne(options.chords, rng);
    const chord = chordById(quality);

    const root = midiToPitch(randomInt(rng, LOW, HIGH - chordSpan(chord)), rng);
    const spelled = spellChord(chord, root);
    if (!spelled) continue;

    const question: Question = {
      playback,
      quality,
      pitches: spelled.map(pitchToToken),
      noteNames: spelled.map((pitch) => `${pitch.step}${ACCIDENTAL_GLYPH[pitch.alter]}`),
      clef: clefForMidis(spelled.map(pitchToMidi)),
    };
    if (last === questionSignature(question) && attempt < MAX_ATTEMPTS - 1) continue;
    return question;
  }
  throw new Error('chord-identification: could not generate a question satisfying the options');
}
