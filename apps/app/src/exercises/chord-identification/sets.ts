import type { ChordId } from './chords.js';

export type ChordSetId =
  | 'major-minor'
  | 'dim-aug'
  | 'triads'
  | 'sus-added'
  | 'dom-maj7'
  | 'min-minmaj7'
  | 'half-dim-dim7'
  | 'sevenths'
  | 'all';

export interface ChordSet {
  id: ChordSetId;
  title: string;
  help: string;
  chords: readonly ChordId[];
}

export const CHORD_SETS: readonly ChordSet[] = [
  {
    id: 'major-minor',
    title: 'Major and minor triads',
    help: 'Chords: major and minor. The two most common triads; they differ only in the middle note, so this is the place to start.',
    chords: ['maj', 'min'],
  },
  {
    id: 'dim-aug',
    title: 'Diminished and augmented triads',
    help: 'Chords: diminished and augmented. The tense triads: diminished squeezes the top note down, augmented stretches it up.',
    chords: ['dim', 'aug'],
  },
  {
    id: 'triads',
    title: 'All triads',
    help: 'Chords: major, minor, diminished and augmented, all mixed together.',
    chords: ['maj', 'min', 'dim', 'aug'],
  },
  {
    id: 'sus-added',
    title: 'Suspended and added-tone chords',
    help: 'Chords: suspended 2nd, suspended 4th, major 6th and minor 6th. The suspended chords replace the middle note by a 2nd or a 4th; the 6th chords add a sixth on top of a triad.',
    chords: ['sus2', 'sus4', '6', 'm6'],
  },
  {
    id: 'dom-maj7',
    title: 'Dominant and major sevenths',
    help: 'Chords: dominant 7th and major 7th. Both are a major triad with a seventh on top; the major 7th is a semitone higher and sounds sweeter, the dominant 7th sounds restless.',
    chords: ['7', 'maj7'],
  },
  {
    id: 'min-minmaj7',
    title: 'Minor and minor-major sevenths',
    help: 'Chords: minor 7th and minor-major 7th. Both are a minor triad with a seventh on top; the minor-major 7th has the higher seventh and a sharper, more mysterious colour.',
    chords: ['m7', 'm(maj7)'],
  },
  {
    id: 'half-dim-dim7',
    title: 'Half-diminished and diminished sevenths',
    help: 'Chords: half-diminished 7th and diminished 7th. Both stack a diminished triad; the diminished 7th has a seventh one semitone lower than the half-diminished 7th, and divides the octave into equal minor thirds.',
    chords: ['m7b5', 'dim7'],
  },
  {
    id: 'sevenths',
    title: 'All sevenths',
    help: 'Chords: dominant 7th, major 7th, minor 7th, minor-major 7th, half-diminished 7th, diminished 7th and augmented major 7th, all mixed together.',
    chords: ['7', 'maj7', 'm7', 'm(maj7)', 'm7b5', 'dim7', 'maj7#5'],
  },
  {
    id: 'all',
    title: 'All chords',
    help: 'Every chord of the exercise, triads, suspended, added-tone and seventh chords, all mixed together.',
    chords: [
      'maj',
      'min',
      'dim',
      'aug',
      'sus2',
      'sus4',
      '6',
      'm6',
      '7',
      'maj7',
      'm7',
      'm(maj7)',
      'm7b5',
      'dim7',
      'maj7#5',
    ],
  },
];
