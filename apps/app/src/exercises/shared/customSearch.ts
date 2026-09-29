import { normalizeQuestionCount } from './lessonFlow.js';

export type NameStyle = 'full' | 'short';
export const NAME_STYLES: readonly NameStyle[] = ['full', 'short'];

export function enumParam<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function listParam(value: unknown, fallback: readonly string[]): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback.join(',');
}

export function countParam(value: unknown, fallback: number): string {
  const n = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  return String(Number.isFinite(n) ? normalizeQuestionCount(n) : fallback);
}

export function flagParam(value: unknown): '0' | '1' {
  return String(value) === '1' ? '1' : '0';
}

export function toggleInOrder<T>(list: readonly T[], item: T, order: readonly T[]): T[] {
  const next = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  return order.filter((i) => next.includes(i));
}
