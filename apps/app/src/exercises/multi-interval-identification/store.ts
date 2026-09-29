import { createResultStore } from '../shared/store.js';

export type { LessonResult } from '../shared/store.js';

const store = createResultStore('polyhymnia:e3:results');

export const getLessonResult = store.getLessonResult;
export const recordLessonResult = store.recordLessonResult;
export const allLessonResults = store.allLessonResults;
