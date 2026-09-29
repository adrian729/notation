import type { IntervalSpec } from '../shared/spelling.js';

export type ChordId =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | 'sus2'
  | 'sus4'
  | '6'
  | 'm6'
  | '7'
  | 'maj7'
  | 'm7'
  | 'm(maj7)'
  | 'm7b5'
  | 'dim7'
  | 'maj7#5';

export interface ChordQuality {
  id: ChordId;
  name: string;
  symbol: string;
  above: readonly IntervalSpec[];
}

function above(...members: readonly (readonly [degree: number, semitones: number])[]): IntervalSpec[] {
  return members.map(([degree, semitones]) => ({ degreeOptions: [degree], semitones }));
}

export const CHORDS: readonly ChordQuality[] = [
  { id: 'maj', name: 'Major', symbol: 'maj', above: above([3, 4], [5, 7]) },
  { id: 'min', name: 'Minor', symbol: 'min', above: above([3, 3], [5, 7]) },
  { id: 'dim', name: 'Diminished', symbol: 'dim', above: above([3, 3], [5, 6]) },
  { id: 'aug', name: 'Augmented', symbol: 'aug', above: above([3, 4], [5, 8]) },
  { id: 'sus2', name: 'Suspended 2nd', symbol: 'sus2', above: above([2, 2], [5, 7]) },
  { id: 'sus4', name: 'Suspended 4th', symbol: 'sus4', above: above([4, 5], [5, 7]) },
  { id: '6', name: 'Major 6th', symbol: '6', above: above([3, 4], [5, 7], [6, 9]) },
  { id: 'm6', name: 'Minor 6th', symbol: 'm6', above: above([3, 3], [5, 7], [6, 9]) },
  { id: '7', name: 'Dominant 7th', symbol: '7', above: above([3, 4], [5, 7], [7, 10]) },
  { id: 'maj7', name: 'Major 7th', symbol: 'maj7', above: above([3, 4], [5, 7], [7, 11]) },
  { id: 'm7', name: 'Minor 7th', symbol: 'm7', above: above([3, 3], [5, 7], [7, 10]) },
  { id: 'm(maj7)', name: 'Minor-major 7th', symbol: 'm(maj7)', above: above([3, 3], [5, 7], [7, 11]) },
  { id: 'm7b5', name: 'Half-diminished 7th', symbol: 'm7♭5', above: above([3, 3], [5, 6], [7, 10]) },
  { id: 'dim7', name: 'Diminished 7th', symbol: 'dim7', above: above([3, 3], [5, 6], [7, 9]) },
  { id: 'maj7#5', name: 'Augmented major 7th', symbol: 'maj7♯5', above: above([3, 4], [5, 8], [7, 11]) },
];

const BY_ID = new Map(CHORDS.map((chord) => [chord.id, chord]));

export function chordById(id: ChordId): ChordQuality {
  const chord = BY_ID.get(id);
  if (!chord) throw new RangeError(`unknown chord id: ${id}`);
  return chord;
}

export function isChordId(value: string): value is ChordId {
  return BY_ID.has(value as ChordId);
}

export function chordSpan(chord: ChordQuality): number {
  return Math.max(...chord.above.map((member) => member.semitones));
}
