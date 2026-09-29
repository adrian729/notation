import {
  INTERVAL_FAMILIES,
  INTERVAL_FAMILY_ORDER,
  type IntervalFamilyId,
  type IntervalId,
} from '../shared/intervals.js';
import {
  FAMILY_TITLE,
  FAMILY_HELP,
  MODE_TITLE,
  MODE_HELP,
  ALL_MODES,
  MODE_ORDER,
  rangeForFamily,
  type LessonMode,
  type HelpSection,
  type OverviewSection,
} from '../shared/families.js';
import { createCatalog } from '../shared/catalog.js';
import type { IdentificationOptions } from './options.js';

export const TASK_HELP = 'You hear one interval. Choose its name.';

export interface ModuleDef {
  id: IntervalFamilyId;
  family: IntervalFamilyId;
  title: string;
  help: readonly HelpSection[];
}

export interface LessonDef {
  id: string;
  moduleId: string;
  mode: LessonMode;
  title: string;
  options: IdentificationOptions;
}

export const MODULES: readonly ModuleDef[] = INTERVAL_FAMILY_ORDER.map((family) => ({
  id: family,
  family,
  title: FAMILY_TITLE[family],
  help: [
    { heading: 'Interval Identification', text: TASK_HELP },
    { heading: FAMILY_TITLE[family], text: FAMILY_HELP[family] },
  ],
}));

export const OVERVIEW_HELP: readonly OverviewSection[] = [
  {
    heading: 'How it works',
    intro: `${TASK_HELP} Each button is one interval of the lesson's set. Afterwards you see the interval on the staff and can listen to it again.`,
    items: [],
  },
  {
    heading: 'Interval sets',
    intro: 'Each module practises one set of intervals, from the easiest to tell apart to the hardest.',
    items: INTERVAL_FAMILY_ORDER.map((family) => ({ term: FAMILY_TITLE[family], text: FAMILY_HELP[family] })),
  },
  {
    heading: 'Playing modes',
    intro: 'Every module has one lesson for each way of playing the interval.',
    items: MODE_ORDER.map((mode) => ({ term: MODE_TITLE[mode], text: MODE_HELP[mode] })),
  },
];

export const LESSONS: readonly LessonDef[] = MODULES.flatMap((mod) =>
  MODE_ORDER.map((mode) => ({
    id: `${mod.family}-${mode}`,
    moduleId: mod.id,
    mode,
    title: MODE_TITLE[mode],
    options: {
      intervals: INTERVAL_FAMILIES[mod.family] as readonly IntervalId[],
      playingModes: mode === 'mixed' ? ALL_MODES : [mode],
      range: rangeForFamily(mod.family),
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
