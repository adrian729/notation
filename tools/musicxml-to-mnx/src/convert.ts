import { convertMusicXML } from 'musicxml-to-mnx';

export interface ConvertWarning {
  code: string;
  message: string;
  element?: string;
  attribute?: string;
  part?: string;
  measure?: number;
  line?: number;
}

export type ConvertResult =
  { ok: true; mnx: unknown; warnings: ConvertWarning[] } | { ok: false; error: string; warnings: [] };

export function convert(musicXml: string): ConvertResult {
  try {
    const { mnx, warnings } = convertMusicXML(musicXml);
    return {
      ok: true,
      mnx,
      warnings: warnings.map((w) => ({
        code: w.code,
        message: w.message,
        ...(w.element !== undefined && { element: w.element }),
        ...(w.attribute !== undefined && { attribute: w.attribute }),
        ...(w.context.part !== undefined && { part: w.context.part }),
        ...(w.context.measure !== undefined && { measure: w.context.measure }),
        ...(w.context.line !== undefined && { line: w.context.line }),
      })),
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), warnings: [] };
  }
}
