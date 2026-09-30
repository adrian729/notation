import { createContext, use, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Notation } from '@polyhymnia/notation-react';
import type { NotationProps } from '@polyhymnia/notation-react';
import { DEFAULT_FONT, type FontFamily } from '@polyhymnia/notation-engine';

export const FAMILIES: readonly { id: FontFamily; label: string; note: string }[] = [
  {
    id: 'mensural',
    label: 'Mensural (house default)',
    note: 'breve, whole, half and quarter as white mensural lozenges — the same score in the default look',
  },
  {
    id: 'modern',
    label: 'Modern (opt-in)',
    note: 'the superseded Bravura subset, kept shipped for a future per-user style setting',
  },
];

interface FontFamilyState {
  family: FontFamily;
  setFamily: (family: FontFamily) => void;
}

const FontFamilyContext = createContext<FontFamilyState>({ family: DEFAULT_FONT, setFamily: () => {} });

export function FontFamilyProvider({ children }: { children: ReactNode }) {
  const [family, setFamily] = useState<FontFamily>(DEFAULT_FONT);
  const value = useMemo(() => ({ family, setFamily }), [family]);
  return <FontFamilyContext value={value}>{children}</FontFamilyContext>;
}

export function useFontFamily(): FontFamilyState {
  return use(FontFamilyContext);
}

/**
 * `<Notation>` with the demo's family choice folded into its options. Every example
 * on this page renders through here, so the toggle reaches all of them; nothing has
 * to remember to thread a `font` prop.
 *
 * `Interaction`/`Marks`/`Playback` are just child-prop markers, so they can be
 * re-pointed at this wrapper unchanged — that is what keeps `<FontNotation.Marks>`
 * working without every call site spelling out `<Notation.Marks>`.
 */
/** `Notation` plus the demo's page-wide family choice. */
export const FontNotation: typeof Notation & {
  Interaction: typeof Notation.Interaction;
  Marks: typeof Notation.Marks;
  Playback: typeof Notation.Playback;
} = Object.assign(
  function FontNotationWithFamily({ options, ...rest }: NotationProps) {
    const { family } = useFontFamily();
    const merged = useMemo(() => ({ ...options, font: family }), [options, family]);
    return <Notation {...rest} options={merged} />;
  },
  { Interaction: Notation.Interaction, Marks: Notation.Marks, Playback: Notation.Playback },
);

export function FontToggle() {
  const { family, setFamily } = useFontFamily();
  return (
    <div className="family-toggle" role="group" aria-label="Music font for every example on this page">
      {FAMILIES.map((f) => (
        <button key={f.id} type="button" className={f.id === family ? 'is-on' : undefined} onClick={() => setFamily(f.id)}>
          <strong>{f.label}</strong>
          <span>{f.note}</span>
        </button>
      ))}
    </div>
  );
}
