import type { IntervalFamilyId } from './intervals.js';
import type { PlayingMode } from './playing.js';

export type LessonMode = PlayingMode | 'mixed';

export interface HelpSection {
  heading: string;
  text: string;
}

export interface OverviewSection {
  heading: string;
  intro: string;
  items: readonly { term: string; text: string }[];
}

export const FAMILY_TITLE: Record<IntervalFamilyId, string> = {
  perfect: 'Perfect intervals',
  imperfect: 'Imperfect consonant intervals',
  dissonant: 'Dissonant intervals',
  simple: 'All simple intervals',
  compound: 'Compound intervals',
};

export const FAMILY_HELP: Record<IntervalFamilyId, string> = {
  perfect:
    'Intervals: perfect 4th, perfect 5th and octave. These open, stable sounds are far apart in size, which makes them the easiest to start with.',
  imperfect:
    'Intervals: minor and major 3rd, minor and major 6th. Sweet, consonant sounds; the minor and major versions are only one semitone apart, so listen closely.',
  dissonant:
    'Intervals: minor and major 2nd, tritone, minor and major 7th. Tense, clashing sounds, from the smallest steps to the widest leaps below an octave.',
  simple: 'Intervals: every interval from a minor 2nd up to an octave, all mixed together.',
  compound:
    'Intervals: from a minor 9th up to two octaves. Wide leaps whose notes are far apart, so the size is harder to hear.',
};

export const ALL_MODES: readonly PlayingMode[] = ['asc', 'desc', 'harmonic'];
export const MODE_ORDER: readonly LessonMode[] = ['asc', 'desc', 'harmonic', 'mixed'];

export const MODE_TITLE: Record<LessonMode, string> = {
  asc: 'Ascending',
  desc: 'Descending',
  harmonic: 'Harmonic',
  mixed: 'Mixed',
};

export const MODE_HELP: Record<LessonMode, string> = {
  asc: 'The two notes of each interval are played one after the other, low to high.',
  desc: 'The two notes of each interval are played one after the other, high to low.',
  harmonic: 'The two notes of each interval are played together, at the same time.',
  mixed: 'Each question is ascending, descending or harmonic, chosen at random.',
};

export function rangeForFamily(family: IntervalFamilyId): { low: string; high: string } {
  return family === 'compound' ? { low: 'G2', high: 'C6' } : { low: 'C3', high: 'C6' };
}
