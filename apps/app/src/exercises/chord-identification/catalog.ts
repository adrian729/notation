import { createCatalog } from '../shared/catalog.js';
import type { HelpSection, OverviewSection } from '../shared/families.js';
import type { ArpeggioDirection, ChordPlayback, Execution } from './playback.js';
import type { ChordOptions } from './options.js';
import { CHORD_SETS, type ChordSetId } from './sets.js';

export type LessonPlayback = 'arp-block-asc' | 'arp-block-desc' | 'block' | 'random';

export const TASK_HELP = 'You hear one chord in root position. Choose its quality.';

export const LESSON_PLAYBACK_ORDER: readonly LessonPlayback[] = ['arp-block-asc', 'arp-block-desc', 'block', 'random'];

const LESSON_PLAYBACKS: Record<LessonPlayback, readonly ChordPlayback[]> = {
  'arp-block-asc': ['arp-block-asc'],
  'arp-block-desc': ['arp-block-desc'],
  block: ['block'],
  random: ['arp-block-asc', 'arp-block-desc', 'block'],
};

export const LESSON_PLAYBACK_TITLE: Record<LessonPlayback, string> = {
  'arp-block-asc': 'Arpeggio, then block, ascending',
  'arp-block-desc': 'Arpeggio, then block, descending',
  block: 'Block',
  random: 'Random',
};

export const LESSON_PLAYBACK_HELP: Record<LessonPlayback, string> = {
  'arp-block-asc':
    'The notes are played one after the other from the root up, then all together. The block confirms what the arpeggio suggested.',
  'arp-block-desc':
    'The notes are played one after the other from the top note down to the root, then all together. The chord is still in root position; it is just heard upside down first.',
  block: 'All notes are played together, with no arpeggio to lean on.',
  random:
    'Each question is an ascending arpeggio then block, a descending arpeggio then block, or a block, chosen at random.',
};

export const EXECUTION_TITLE: Record<Execution, string> = {
  arpeggio: 'Arpeggio',
  'arpeggio-block': 'Arpeggio, then block',
  block: 'Block',
};

export const EXECUTION_HELP: Record<Execution, string> = {
  arpeggio: 'The notes are played one after the other, nothing more. The hardest way to hear a chord.',
  'arpeggio-block': 'The arpeggio, a short silence, then all the notes together.',
  block: 'All the notes are played together.',
};

export const DIRECTION_TITLE: Record<ArpeggioDirection, string> = { asc: 'Ascending', desc: 'Descending' };

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
