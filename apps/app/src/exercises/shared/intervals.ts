export type IntervalId =
  | 'm2' | 'M2' | 'm3' | 'M3' | 'P4' | 'TT' | 'P5' | 'm6' | 'M6' | 'm7' | 'M7' | 'P8'
  | 'm9' | 'M9' | 'm10' | 'M10' | 'P11' | 'A11' | 'P12' | 'm13' | 'M13' | 'm14' | 'M14' | 'P15';

export interface IntervalSize {
  id: IntervalId;
  semitones: number;
  degreeOptions: readonly number[];
  compound: boolean;
}

export const INTERVAL_SIZES: readonly IntervalSize[] = [
  { id: 'm2', semitones: 1, degreeOptions: [2], compound: false },
  { id: 'M2', semitones: 2, degreeOptions: [2], compound: false },
  { id: 'm3', semitones: 3, degreeOptions: [3], compound: false },
  { id: 'M3', semitones: 4, degreeOptions: [3], compound: false },
  { id: 'P4', semitones: 5, degreeOptions: [4], compound: false },
  { id: 'TT', semitones: 6, degreeOptions: [4, 5], compound: false },
  { id: 'P5', semitones: 7, degreeOptions: [5], compound: false },
  { id: 'm6', semitones: 8, degreeOptions: [6], compound: false },
  { id: 'M6', semitones: 9, degreeOptions: [6], compound: false },
  { id: 'm7', semitones: 10, degreeOptions: [7], compound: false },
  { id: 'M7', semitones: 11, degreeOptions: [7], compound: false },
  { id: 'P8', semitones: 12, degreeOptions: [8], compound: false },
  { id: 'm9', semitones: 13, degreeOptions: [9], compound: true },
  { id: 'M9', semitones: 14, degreeOptions: [9], compound: true },
  { id: 'm10', semitones: 15, degreeOptions: [10], compound: true },
  { id: 'M10', semitones: 16, degreeOptions: [10], compound: true },
  { id: 'P11', semitones: 17, degreeOptions: [11], compound: true },
  { id: 'A11', semitones: 18, degreeOptions: [11, 12], compound: true },
  { id: 'P12', semitones: 19, degreeOptions: [12], compound: true },
  { id: 'm13', semitones: 20, degreeOptions: [13], compound: true },
  { id: 'M13', semitones: 21, degreeOptions: [13], compound: true },
  { id: 'm14', semitones: 22, degreeOptions: [14], compound: true },
  { id: 'M14', semitones: 23, degreeOptions: [14], compound: true },
  { id: 'P15', semitones: 24, degreeOptions: [15], compound: true },
];

const BY_ID = new Map(INTERVAL_SIZES.map((size) => [size.id, size]));
const BY_SEMITONES = new Map(INTERVAL_SIZES.map((size) => [size.semitones, size]));

export function intervalById(id: IntervalId): IntervalSize {
  const size = BY_ID.get(id);
  if (!size) throw new RangeError(`unknown interval id: ${id}`);
  return size;
}

export function intervalBySemitones(semitones: number): IntervalSize {
  const size = BY_SEMITONES.get(semitones);
  if (!size) throw new RangeError(`unknown interval semitones: ${semitones}`);
  return size;
}

export type IntervalFamilyId = 'perfect' | 'imperfect' | 'dissonant' | 'simple' | 'compound';

export const INTERVAL_FAMILIES: Record<IntervalFamilyId, readonly IntervalId[]> = {
  perfect: ['P4', 'P5', 'P8'],
  imperfect: ['m3', 'M3', 'm6', 'M6'],
  dissonant: ['m2', 'M2', 'TT', 'm7', 'M7'],
  simple: ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
  compound: ['m9', 'M9', 'm10', 'M10', 'P11', 'A11', 'P12', 'm13', 'M13', 'm14', 'M14', 'P15'],
};

export const INTERVAL_FAMILY_ORDER: readonly IntervalFamilyId[] = [
  'perfect',
  'imperfect',
  'dissonant',
  'simple',
  'compound',
];

const DEGREE_QUALITY_NAME: Record<string, string> = {
  '2m': 'Minor 2nd', '2M': 'Major 2nd',
  '3m': 'Minor 3rd', '3M': 'Major 3rd',
  '4P': 'Perfect 4th', '4A': 'Augmented 4th',
  '5P': 'Perfect 5th', '5d': 'Diminished 5th',
  '6m': 'Minor 6th', '6M': 'Major 6th',
  '7m': 'Minor 7th', '7M': 'Major 7th',
  '8P': 'Octave',
  '9m': 'Minor 9th', '9M': 'Major 9th',
  '10m': 'Minor 10th', '10M': 'Major 10th',
  '11P': 'Perfect 11th', '11A': 'Augmented 11th',
  '12P': 'Perfect 12th', '12d': 'Diminished 12th',
  '13m': 'Minor 13th', '13M': 'Major 13th',
  '14m': 'Minor 14th', '14M': 'Major 14th',
  '15P': 'Double octave',
};

export function intervalDisplayName(degree: number, quality: 'm' | 'M' | 'P' | 'A' | 'd'): string {
  return DEGREE_QUALITY_NAME[`${degree}${quality}`] ?? `${degree}${quality}`;
}

export function intervalIdDisplayName(id: IntervalId): string {
  if (id === 'TT') return 'Tritone';
  const spec = intervalById(id);
  const quality = id[0] as 'm' | 'M' | 'P' | 'A';
  return intervalDisplayName(spec.degreeOptions[0]!, quality);
}
