import {
  ALL_MODES,
  MODE_ORDER,
  MODE_TITLE,
  type HelpSection,
  type LessonMode,
  type OverviewSection,
} from '../shared/families.js';
import { createCatalog } from '../shared/catalog.js';
import type { MultiIntervalOptions } from './options.js';
import { rangeForIntervals } from '../shared/intervals.js';
import { SETS, type SetId } from './sets.js';

export const TASK_HELP = "You hear several notes. Name each note's interval above the lowest note.";

export const MODE_HELP: Record<LessonMode, string> = {
  asc: 'The lowest note is played first, then the others upward, one after the other.',
  desc: 'The highest note is played first and the lowest note last, one after the other.',
  harmonic: 'All the notes are played together, at the same time.',
  mixed: 'Each question is ascending, descending or harmonic, chosen at random.',
};

export interface ModuleDef {
  id: SetId;
  title: string;
  help: readonly HelpSection[];
}

export interface LessonDef {
  id: string;
  moduleId: SetId;
  mode: LessonMode;
  title: string;
  options: MultiIntervalOptions;
}

export const MODULES: readonly ModuleDef[] = SETS.map((set) => ({
  id: set.id,
  title: set.title,
  help: [
    { heading: 'Multi-Note Interval Identification', text: TASK_HELP },
    { heading: set.title, text: set.help },
  ],
}));

export const OVERVIEW_HELP: readonly OverviewSection[] = [
  {
    heading: 'How it works',
    intro: `${TASK_HELP} Every interval is measured from the lowest note. Afterwards you see the notes on the staff and can listen again.`,
    items: [],
  },
  {
    heading: 'Interval sets',
    intro: 'Each module practises one set of intervals, from the easiest to tell apart to the hardest.',
    items: SETS.map((set) => ({ term: set.title, text: set.help })),
  },
  {
    heading: 'Playing modes',
    intro: 'Every module has one lesson for each way of playing the notes.',
    items: MODE_ORDER.map((mode) => ({ term: MODE_TITLE[mode], text: MODE_HELP[mode] })),
  },
];

export const LESSONS: readonly LessonDef[] = SETS.flatMap((set) =>
  MODE_ORDER.map((mode) => ({
    id: `${set.id}-${mode}`,
    moduleId: set.id,
    mode,
    title: MODE_TITLE[mode],
    options: {
      intervals: set.intervals,
      noteCounts: [3] as const,
      playingModes: mode === 'mixed' ? ALL_MODES : [mode],
      range: rangeForIntervals(set.intervals),
      tempo: 'medium' as const,
      questionCount: 10,
      autoNext: true,
    },
  })),
);

const catalog = createCatalog(MODULES, LESSONS);

export const lessonById = catalog.lessonById;
export const moduleById = catalog.moduleById;
export const lessonsForModule = catalog.lessonsForModule;
