import type { PreviewNote } from '@polyhymnia/notation-engine';
import type { NoteId } from '@polyhymnia/mnx';

export interface NotationMarksProps {
  states?: Readonly<Record<NoteId, string>>;
  selection?: readonly NoteId[];
  preview?: PreviewNote | null;
}

export function MarksChild(_props: NotationMarksProps): null {
  return null;
}
