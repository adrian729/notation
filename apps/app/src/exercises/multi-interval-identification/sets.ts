import { intervalById, type IntervalId } from '@polyhymnia/music-theory';
import { INTERVAL_FAMILIES } from '../shared/intervals.js';

export type SetId =
  'core' | 'sixths' | 'sevenths' | 'simple' | 'core-compound' | 'thirteenths' | 'fourteenths' | 'compound' | 'all';

export interface IntervalSet {
  id: SetId;
  title: string;
  help: string;
  intervals: readonly IntervalId[];
}

function bySize(ids: readonly IntervalId[]): readonly IntervalId[] {
  return [...ids].sort((a, b) => intervalById(a).semitones - intervalById(b).semitones);
}

const CORE: readonly IntervalId[] = ['m3', 'M3', 'P4', 'P5', 'P8'];
const SIXTHS: readonly IntervalId[] = [...CORE, 'm6', 'M6'];
const SEVENTHS: readonly IntervalId[] = [...SIXTHS, 'm7', 'M7'];
const CORE_COMPOUND: readonly IntervalId[] = ['m10', 'M10', 'P11', 'P12', 'P15'];
const THIRTEENTHS: readonly IntervalId[] = [...CORE_COMPOUND, 'm13', 'M13'];
const FOURTEENTHS: readonly IntervalId[] = [...THIRTEENTHS, 'm14', 'M14'];

export const SETS: readonly IntervalSet[] = [
  {
    id: 'core',
    title: 'Consonant core',
    help: 'Intervals: minor and major 3rd, perfect 4th, perfect 5th and octave. The most distinct sounds, a good place to start.',
    intervals: bySize(CORE),
  },
  {
    id: 'sixths',
    title: 'Add the sixths',
    help: 'The consonant core plus the minor and major 6th.',
    intervals: bySize(SIXTHS),
  },
  {
    id: 'sevenths',
    title: 'Add the sevenths',
    help: 'Adds the minor and major 7th. The octave stops being free: a major 7th sounds close to it.',
    intervals: bySize(SEVENTHS),
  },
  {
    id: 'simple',
    title: 'Add the seconds and tritone',
    help: 'Adds the minor and major 2nd and the tritone: every interval up to an octave.',
    intervals: INTERVAL_FAMILIES.simple,
  },
  {
    id: 'core-compound',
    title: 'Consonant core, second octave',
    help: 'The consonant core an octave higher: minor and major 10th, perfect 11th, perfect 12th and double octave.',
    intervals: bySize(CORE_COMPOUND),
  },
  {
    id: 'thirteenths',
    title: 'Add the 13ths',
    help: 'The second-octave core plus the minor and major 13th.',
    intervals: bySize(THIRTEENTHS),
  },
  {
    id: 'fourteenths',
    title: 'Add the 14ths',
    help: 'Adds the minor and major 14th, so the double octave stops being free.',
    intervals: bySize(FOURTEENTHS),
  },
  {
    id: 'compound',
    title: 'Add the 9ths and the tritone',
    help: 'Adds the minor and major 9th and the augmented 11th: every interval from a minor 9th up to two octaves.',
    intervals: INTERVAL_FAMILIES.compound,
  },
  {
    id: 'all',
    title: 'All intervals',
    help: 'Every interval from a minor 2nd to two octaves. The only set that mixes simple and compound intervals in one question.',
    intervals: bySize([...INTERVAL_FAMILIES.simple, ...INTERVAL_FAMILIES.compound]),
  },
];

export function setById(id: SetId): IntervalSet {
  return SETS.find((set) => set.id === id)!;
}
