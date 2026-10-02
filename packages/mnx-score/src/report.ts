import type { Diagnostic } from '@polyhymnia/mnx';

export interface Report {
  head: Diagnostic[];
  structure: Diagnostic[];
  content: Diagnostic[];
  tempo: Diagnostic[];
  playOrder: Diagnostic[];
  ties: Diagnostic[];
  fullness: Diagnostic[];
  time: Diagnostic[];
  unsupported(bucket: Diagnostic[], construct: string, measureIndex: number | undefined, consequence: string): void;
}

export function createReport(): Report {
  const seen = new Set<string>();
  return {
    head: [],
    structure: [],
    content: [],
    tempo: [],
    playOrder: [],
    ties: [],
    fullness: [],
    time: [],
    unsupported(bucket, construct, measureIndex, consequence) {
      const key = `${construct}@${measureIndex ?? ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      bucket.push(unsupportedDiagnostic(construct, measureIndex, consequence));
    },
  };
}

function unsupportedDiagnostic(construct: string, measureIndex: number | undefined, consequence: string): Diagnostic {
  const where = measureIndex === undefined ? '' : ` in measure ${measureIndex}`;
  return {
    severity: 'warning',
    code: 'mnx-unsupported',
    message: `Unsupported MNX: ${construct}${where}; ${consequence}.`,
    ...(measureIndex === undefined ? {} : { measureIndex }),
  };
}

export function ordered(report: Report): Diagnostic[] {
  return [
    ...report.head,
    ...report.structure,
    ...report.content,
    ...report.tempo,
    ...report.playOrder,
    ...report.ties,
    ...report.fullness,
    ...report.time,
  ];
}

export function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asObject(value: unknown): Record<string, any> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;
}
