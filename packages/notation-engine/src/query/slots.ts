import { isClefColumn } from '../layout/horizontal.js';
import type { PositionedMeasure } from '../layout/justify.js';
import type { NoteId } from '../layout/records.js';
import type { Slot } from '../layout/types.js';
import type { VerticalElement } from '../layout/vertical.js';
import type { ContentBounds } from './measures.js';

function elementIdsOf(element: VerticalElement): readonly NoteId[] {
  return element.noteheads.length > 0 ? element.noteheads.map((h) => h.id) : [element.id];
}

export function measureSlots(
  measure: PositionedMeasure,
  { contentX, contentRight }: ContentBounds,
  staffIndex: number,
  tagStaff: boolean,
): readonly Slot[] {
  const slots: Slot[] = [];
  const columns = measure.columns.filter((column) =>
    isClefColumn(column)
      ? column.clefs.some((c) => c.staffIndex === staffIndex)
      : column.elements.some((e) => e.staffIndex === staffIndex),
  );
  const staff = tagStaff ? { staff: staffIndex } : {};

  for (let i = 0; i < columns.length; i += 1) {
    const column = columns[i]!;
    if (isClefColumn(column)) continue;
    const previous = columns[i - 1];
    const next = columns[i + 1];
    const bandStart = previous && isClefColumn(previous) ? previous.xStart : column.xStart;
    const bandEnd = next ? next.xStart : contentRight;

    for (const element of column.elements) {
      if (element.staffIndex !== staffIndex) continue;
      if (element.rest?.wholeBar) {
        slots.push({
          measureIndex: measure.index,
          ...staff,
          voice: element.voice,
          tick: element.tick,
          x: contentX,
          w: contentRight - contentX,
          eventId: element.id,
          elementIds: [element.id],
        });
        continue;
      }
      slots.push({
        measureIndex: measure.index,
        ...staff,
        voice: element.voice,
        tick: element.tick,
        x: bandStart,
        w: bandEnd - bandStart,
        eventId: element.id,
        elementIds: elementIdsOf(element),
      });
    }
  }

  return slots;
}
