const STORAGE_KEY = 'polyhymnia:e1:results';

export interface LessonResult {
  bestPercent: number;
  passed: boolean;
  attempts: number;
}

type ResultsMap = Record<string, LessonResult>;

function readAll(): ResultsMap {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ResultsMap;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(results: ResultsMap): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    return;
  }
}

export function getLessonResult(lessonId: string): LessonResult | undefined {
  return readAll()[lessonId];
}

export function recordLessonResult(lessonId: string, percent: number, passed: boolean): LessonResult {
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

export function allLessonResults(): ResultsMap {
  return readAll();
}
