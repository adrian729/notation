import type { NotationOptions } from '../options.js';
import { DEFAULT_OPTIONS } from '../options.js';
import type { Diagnostic } from '@polyhymnia/mnx';
import type { NormalizedScore, NoteId, StaffPitch } from './records.js';
import { accidentalGlyph, keyAlterations } from './staff.js';
import { elementsByStaffMeasureKey, indexElementsByStaffMeasure } from './temporal.js';
import type { TemporalScore } from './temporal.js';

export interface ResolvedAccidental {
  alter: -2 | -1 | 0 | 1 | 2;
  glyph: string | null;
  parenthesized: boolean;
}

export interface AccidentalScore {
  byNote: ReadonlyMap<NoteId, ResolvedAccidental>;
  diagnostics: readonly Diagnostic[];
}

const NONE: ResolvedAccidental = { alter: 0, glyph: null, parenthesized: false };

export function accidentals(
  normalized: NormalizedScore,
  score: TemporalScore,
  options?: NotationOptions,
): AccidentalScore {
  const courtesyPolicy = options?.accidentals?.courtesyPolicy ?? DEFAULT_OPTIONS.accidentals.courtesyPolicy;
  const parenthesize =
    options?.accidentals?.parenthesizeCautionary ?? DEFAULT_OPTIONS.accidentals.parenthesizeCautionary;

  const byNote = new Map<NoteId, ResolvedAccidental>();
  const diagnostics: Diagnostic[] = [];
  const elementIndex = indexElementsByStaffMeasure(score);

  for (const staff of normalized.staves) {
    const openTies = new Set<string>();
    let carriedAlterations = new Map<string, number>();

    for (const measure of staff.measures) {
      const key = keyAlterations(measure.key);
      const state = new Map<string, number>();
      const writtenHere = new Map<string, number>();
      const elements = elementIndex.get(elementsByStaffMeasureKey(staff.index, measure.index)) ?? [];
      const notesAtTick = new Map<number, { pitch: StaffPitch }[]>();
      for (const el of elements) {
        notesAtTick.set(el.tick, [...(notesAtTick.get(el.tick) ?? []), ...el.notes]);
      }

      for (const el of elements) {
        for (const note of el.notes) {
          const { pitch } = note;
          const slot = `${pitch.step}:${pitch.octave}`;
          const effective = state.get(slot) ?? key.get(pitch.step) ?? 0;
          const policy = note.accidentalPolicy ?? 'auto';

          const tieSlot = tieKey(pitch);
          const tiedIn = (note.tie === 'stop' || note.tie === 'continue') && openTies.has(tieSlot);

          let written = false;
          let parenthesized = false;
          if (policy === 'never') {
            written = false;
          } else if (policy === 'always') {
            written = true;
          } else if (policy === 'cautionary') {
            written = true;
            parenthesized = parenthesize;
          } else {
            written = pitch.alter !== effective || sharesPositionWithOtherAlter(notesAtTick.get(el.tick)!, pitch);
            if (!written && courtesyPolicy !== 'none' && carriedAlterations.has(slot)) {
              const carried = carriedAlterations.get(slot)!;
              if (carried !== pitch.alter) {
                written = true;
                parenthesized = parenthesize;
              }
            }
          }

          if (tiedIn && policy !== 'always' && policy !== 'cautionary') written = false;

          byNote.set(note.id, {
            alter: pitch.alter,
            glyph: written ? accidentalGlyph(pitch.alter) : null,
            parenthesized: written && parenthesized,
          });

          state.set(slot, pitch.alter);
          if (pitch.alter !== (key.get(pitch.step) ?? 0)) writtenHere.set(slot, pitch.alter);
          else writtenHere.delete(slot);
          carriedAlterations.delete(slot);

          if (note.tie === 'start' || note.tie === 'continue') openTies.add(tieSlot);
          else openTies.delete(tieSlot);
        }
      }

      if (courtesyPolicy === 'next-measure') {
        carriedAlterations = new Map(writtenHere);
      } else if (courtesyPolicy === 'always') {
        for (const [slot, alter] of writtenHere) carriedAlterations.set(slot, alter);
      }
    }
  }

  return { byNote, diagnostics };
}

export function accidentalOf(resolved: AccidentalScore, id: NoteId): ResolvedAccidental {
  return resolved.byNote.get(id) ?? NONE;
}

function sharesPositionWithOtherAlter(notes: readonly { pitch: StaffPitch }[], pitch: StaffPitch): boolean {
  return notes.some(
    (other) =>
      other.pitch.step === pitch.step && other.pitch.octave === pitch.octave && other.pitch.alter !== pitch.alter,
  );
}

function tieKey(p: StaffPitch): string {
  return `${p.step}:${p.alter}:${p.octave}`;
}
