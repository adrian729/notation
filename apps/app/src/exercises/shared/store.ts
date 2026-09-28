import { readJson, writeJson } from '../../lib/storage.js';

export interface LessonResult {
  bestPercent: number;
  passed: boolean;
  attempts: number;
}

type ResultsMap = Record<string, LessonResult>;

export function createResultStore(storageKey: string) {
  function readAll(): ResultsMap {
    const parsed = readJson(storageKey);
    return typeof parsed === 'object' && parsed !== null ? (parsed as ResultsMap) : {};
  }

  function writeAll(results: ResultsMap): void {
    writeJson(storageKey, results);
  }

  function getLessonResult(lessonId: string): LessonResult | undefined {
    return readAll()[lessonId];
  }

  function recordLessonResult(lessonId: string, percent: number, passed: boolean): LessonResult {
    const results = readAll();
    const previous = results[lessonId];
    const next: LessonResult = {
      bestPercent: Math.max(previous?.bestPercent ?? 0, percent),
      passed: (previous?.passed ?? false) || passed,
      attempts: (previous?.attempts ?? 0) + 1,
    };
    results[lessonId] = next;
    writeAll(results);
    return next;
  }

  function allLessonResults(): ResultsMap {
    return readAll();
  }

  return { getLessonResult, recordLessonResult, allLessonResults };
}
