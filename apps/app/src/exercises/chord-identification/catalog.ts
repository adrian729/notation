import { createCatalog } from '../shared/catalog.js';
import type { HelpSection, OverviewSection } from '../shared/families.js';
import type { ArpeggioDirection, ChordPlayback, Execution } from './playback.js';
import { DEFAULT_RANGE, type ChordOptions } from './options.js';
import { CHORD_SETS, type ChordSetId } from './sets.js';

export type LessonPlayback = 'asc' | 'desc' | 'harmonic' | 'mixed';

export const TASK_HELP = 'You hear one chord in root position. Choose its quality.';

export const LESSON_PLAYBACK_ORDER: readonly LessonPlayback[] = ['asc', 'desc', 'harmonic', 'mixed'];

const LESSON_PLAYBACKS: Record<LessonPlayback, readonly ChordPlayback[]> = {
  asc: ['arp-harmonic-asc'],
  desc: ['arp-harmonic-desc'],
  harmonic: ['harmonic'],
  mixed: ['arp-harmonic-asc', 'arp-harmonic-desc', 'harmonic'],
};

export const DIRECTION_TITLE: Record<ArpeggioDirection, string> = { asc: 'Ascending', desc: 'Descending' };

export const LESSON_PLAYBACK_TITLE: Record<LessonPlayback, string> = {
  asc: DIRECTION_TITLE.asc,
  desc: DIRECTION_TITLE.desc,
  harmonic: 'Harmonic',
  mixed: 'Mixed',
};

export const LESSON_PLAYBACK_HELP: Record<LessonPlayback, string> = {
  asc: 'The notes are played one after the other from the root up, then all together (harmonic). The harmonic confirms what the arpeggio suggested.',
  desc: 'The notes are played one after the other from the top note down to the root, then all together (harmonic). The chord is still in root position; it is just heard upside down first.',
  harmonic: 'All notes are played together, with no arpeggio to lean on.',
  mixed: 'Each question is ascending, descending or harmonic, chosen at random.',
};

export const EXECUTION_TITLE: Record<Execution, string> = {
  arpeggio: 'Arpeggio',
  'arpeggio-harmonic': 'Arpeggio, then harmonic',
  harmonic: 'Harmonic',
};

export const EXECUTION_HELP: Record<Execution, string> = {
  arpeggio: 'The notes are played one after the other, nothing more. The hardest way to hear a chord.',
  'arpeggio-harmonic': 'The arpeggio, a short silence, then all the notes together.',
  harmonic: 'All the notes are played together.',
};

export const DIRECTION_HELP: Record<ArpeggioDirection, string> = {
  asc: 'The arpeggio goes from the root up.',
  desc: 'The arpeggio goes from the top note down to the root. The root is still the lowest note.',
};

export interface ModuleDef {
  id: ChordSetId;
  title: string;
  help: readonly HelpSection[];
}

export interface LessonDef {
  id: string;
  moduleId: ChordSetId;
  playback: LessonPlayback;
  title: string;
  options: ChordOptions;
}

export const MODULES: readonly ModuleDef[] = CHORD_SETS.map((set) => ({
  id: set.id,
  title: set.title,
  help: [
    { heading: 'Chord Identification', text: TASK_HELP },
    { heading: set.title, text: set.help },
  ],
}));

export const OVERVIEW_HELP: readonly OverviewSection[] = [
  {
    heading: 'How it works',
    intro: `${TASK_HELP} Each button is one chord of the lesson's set; the root note is different every time and gives no clue. Afterwards you see the chord on the staff and can listen to it again.`,
    items: [],
  },
  {
    heading: 'Chord sets',
    intro: 'Each module practises one set of chords, from the easiest to tell apart to the hardest.',
    items: CHORD_SETS.map((set) => ({ term: set.title, text: set.help })),
  },
  {
    heading: 'Playbacks',
    intro: 'Every module has one lesson for each way of playing the chord.',
    items: LESSON_PLAYBACK_ORDER.map((playback) => ({
      term: LESSON_PLAYBACK_TITLE[playback],
      text: LESSON_PLAYBACK_HELP[playback],
    })),
  },
];

export const LESSONS: readonly LessonDef[] = CHORD_SETS.flatMap((set) =>
  LESSON_PLAYBACK_ORDER.map((playback) => ({
    id: `${set.id}-${playback}`,
    moduleId: set.id,
    playback,
    title: LESSON_PLAYBACK_TITLE[playback],
    options: {
      chords: set.chords,
      range: DEFAULT_RANGE,
      playbacks: LESSON_PLAYBACKS[playback],
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
