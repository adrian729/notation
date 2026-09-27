import { INTERVAL_FAMILIES, INTERVAL_FAMILY_ORDER, type IntervalFamilyId } from './intervals.js';
import { DEFAULT_OPTIONS, type ExerciseOptions, type PlayingMode, type ToneRelationship } from './options.js';

export interface ModuleDef {
  id: string;
  family: IntervalFamilyId;
  toneRelationship: ToneRelationship;
  title: string;
}

export interface LessonDef {
  id: string;
  moduleId: string;
  mode: PlayingMode;
  title: string;
  options: ExerciseOptions;
}

const RELATIONSHIP_ORDER: readonly ToneRelationship[] = [
  'common-first',
  'common-either',
  'nearby',
  'no-common',
];

const RELATIONSHIP_SLUG: Record<ToneRelationship, string> = {
  'common-first': 'common-first',
  'common-either': 'common-either',
  nearby: 'nearby',
  'no-common': 'no-common',
};

const RELATIONSHIP_TITLE: Record<ToneRelationship, string> = {
  'common-first': 'Common first tone',
  'common-either': 'Common first or second tone',
  nearby: 'Nearby first tones',
  'no-common': 'No common tones',
};

const FAMILY_TITLE: Record<IntervalFamilyId, string> = {
  perfect: 'Perfect intervals',
  imperfect: 'Imperfect consonant intervals',
  dissonant: 'Dissonant intervals',
  simple: 'All simple intervals',
  compound: 'Compound intervals',
};

const MODE_ORDER: readonly PlayingMode[] = ['asc', 'desc', 'harmonic'];
const MODE_SLUG: Record<PlayingMode, string> = { asc: 'asc', desc: 'desc', harmonic: 'harmonic' };
const MODE_TITLE: Record<PlayingMode, string> = {
  asc: 'Ascending',
  desc: 'Descending',
  harmonic: 'Harmonic',
};

function rangeForFamily(family: IntervalFamilyId): { low: string; high: string } {
  return family === 'compound' ? { low: 'G2', high: 'C6' } : { low: 'C3', high: 'C6' };
}

export const MODULES: readonly ModuleDef[] = INTERVAL_FAMILY_ORDER.flatMap((family) =>
  RELATIONSHIP_ORDER.map((toneRelationship) => ({
    id: `${family}-${RELATIONSHIP_SLUG[toneRelationship]}`,
    family,
    toneRelationship,
    title: `${FAMILY_TITLE[family]} — ${RELATIONSHIP_TITLE[toneRelationship]}`,
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
      playingModes: [mode],
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
