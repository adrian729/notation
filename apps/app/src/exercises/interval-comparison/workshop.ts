import { INTERVAL_FAMILIES, INTERVAL_FAMILY_ORDER, type IntervalFamilyId } from './intervals.js';
import { DEFAULT_OPTIONS, type ExerciseOptions, type PlayingMode, type ToneRelationship } from './options.js';

export interface ModuleDef {
  id: string;
  family: IntervalFamilyId;
  toneRelationship: ToneRelationship;
  title: string;
  help: readonly HelpSection[];
}

export interface HelpSection {
  heading: string;
  text: string;
}

export type LessonMode = PlayingMode | 'mixed';

export interface LessonDef {
  id: string;
  moduleId: string;
  mode: LessonMode;
  title: string;
  options: ExerciseOptions;
}

const RELATIONSHIP_ORDER: readonly ToneRelationship[] = [
  'common-first',
  'common-either',
  'nearby',
  'random',
];

const RELATIONSHIP_SLUG: Record<ToneRelationship, string> = {
  'common-first': 'common-first',
  'common-either': 'common-either',
  nearby: 'nearby',
  random: 'random',
};

export const RELATIONSHIP_TITLE: Record<ToneRelationship, string> = {
  'common-first': 'Common first tone',
  'common-either': 'Common first or second tone',
  nearby: 'Nearby first tones',
  random: 'Random first tones',
};

export const FAMILY_TITLE: Record<IntervalFamilyId, string> = {
  perfect: 'Perfect intervals',
  imperfect: 'Imperfect consonant intervals',
  dissonant: 'Dissonant intervals',
  simple: 'All simple intervals',
  compound: 'Compound intervals',
};

export const TASK_HELP =
  'You hear two intervals, A then B. Choose the larger one (the one whose two notes are further apart), or Same if they are the same size.';

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

export const RELATIONSHIP_HELP: Record<ToneRelationship, string> = {
  'common-first':
    'A and B start on the same note, so you only compare where the second note lands. This is the easiest setting.',
  'common-either':
    'A and B share one note: sometimes the first note, sometimes the second. When the second note is shared, the intervals start on different notes, which makes the comparison harder.',
  nearby:
    'A and B start on notes that are close together (at most a major 3rd apart), chosen at random. They may happen to start on the same note.',
  random:
    'A and B each start on a random note anywhere in the range, so you must judge each size on its own. This is the hardest setting.',
};

export const FIRST_NOTE_HELP = 'The first note is the one you hear first: the upper note when the interval is played descending, the lower one otherwise.';

function moduleHelp(family: IntervalFamilyId, relationship: ToneRelationship): HelpSection[] {
  const relationshipText =
    relationship === 'random' ? RELATIONSHIP_HELP[relationship] : `${RELATIONSHIP_HELP[relationship]} ${FIRST_NOTE_HELP}`;
  return [
    { heading: 'Interval Comparison', text: TASK_HELP },
    { heading: FAMILY_TITLE[family], text: FAMILY_HELP[family] },
    { heading: RELATIONSHIP_TITLE[relationship], text: relationshipText },
  ];
}

const ALL_MODES: readonly PlayingMode[] = ['asc', 'desc', 'harmonic'];
const MODE_ORDER: readonly LessonMode[] = ['asc', 'desc', 'harmonic', 'mixed'];
const MODE_SLUG: Record<LessonMode, string> = { asc: 'asc', desc: 'desc', harmonic: 'harmonic', mixed: 'mixed' };
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

export interface OverviewSection {
  heading: string;
  intro: string;
  items: readonly { term: string; text: string }[];
}

export const OVERVIEW_HELP: readonly OverviewSection[] = [
  {
    heading: 'How it works',
    intro: `${TASK_HELP} Answer with the A, Same or B button, or the A, S and B keys. Afterwards you see both intervals on the staff and can listen to them again.`,
    items: [],
  },
  {
    heading: 'Interval sets',
    intro: 'Each module practises one set of intervals, from the easiest to tell apart to the hardest.',
    items: INTERVAL_FAMILY_ORDER.map((family) => ({ term: FAMILY_TITLE[family], text: FAMILY_HELP[family] })),
  },
  {
    heading: 'Starting notes',
    intro: `How the notes of A and B relate to each other. ${FIRST_NOTE_HELP}`,
    items: RELATIONSHIP_ORDER.map((relationship) => ({
      term: RELATIONSHIP_TITLE[relationship],
      text: RELATIONSHIP_HELP[relationship],
    })),
  },
  {
    heading: 'Playing modes',
    intro: 'Every module has one lesson for each way of playing the intervals.',
    items: (['asc', 'desc', 'harmonic', 'mixed'] as const).map((mode) => ({
      term: MODE_TITLE[mode],
      text: MODE_HELP[mode],
    })),
  },
];

function rangeForFamily(family: IntervalFamilyId): { low: string; high: string } {
  return family === 'compound' ? { low: 'G2', high: 'C6' } : { low: 'C3', high: 'C6' };
}

export const MODULES: readonly ModuleDef[] = INTERVAL_FAMILY_ORDER.flatMap((family) =>
  RELATIONSHIP_ORDER.map((toneRelationship) => ({
    id: `${family}-${RELATIONSHIP_SLUG[toneRelationship]}`,
    family,
    toneRelationship,
    title: `${FAMILY_TITLE[family]} — ${RELATIONSHIP_TITLE[toneRelationship]}`,
    help: moduleHelp(family, toneRelationship),
  })),
);

export const LESSONS: readonly LessonDef[] = MODULES.flatMap((mod) =>
  MODE_ORDER.map((mode) => ({
    id: `${mod.id}-${MODE_SLUG[mode]}`,
    moduleId: mod.id,
    mode,
    title: `${MODE_TITLE[mode]}`,
    options: {
      ...DEFAULT_OPTIONS,
      intervals: INTERVAL_FAMILIES[mod.family],
      playingModes: mode === 'mixed' ? ALL_MODES : [mode],
      toneRelationship: mod.toneRelationship,
      range: rangeForFamily(mod.family),
      questionCount: 10,
      autoNext: true,
    },
  })),
);

const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]));
const MODULE_BY_ID = new Map(MODULES.map((m) => [m.id, m]));

export function lessonById(id: string): LessonDef | undefined {
  return LESSON_BY_ID.get(id);
}

export function moduleById(id: string): ModuleDef | undefined {
  return MODULE_BY_ID.get(id);
}

export function lessonsForModule(moduleId: string): readonly LessonDef[] {
  return LESSONS.filter((l) => l.moduleId === moduleId);
}
