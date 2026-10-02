import { createContext, use, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Notation } from '@polyhymnia/notation-react';
import type { NotationProps } from '@polyhymnia/notation-react';
import { DEFAULT_STYLE, type NotationOptions } from '@polyhymnia/notation-engine';

type GlyphStyleName = NonNullable<NotationOptions['style']>;

export const STYLES: readonly { id: GlyphStyleName; label: string; note: string }[] = [
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

type ChangeOptions = Required<NonNullable<NotationOptions['changes']>>;

interface GlyphStyleState {
  style: GlyphStyleName;
  setStyle: (style: GlyphStyleName) => void;
  changes: ChangeOptions;
  setChanges: (changes: ChangeOptions) => void;
}

const DEFAULT_CHANGES: ChangeOptions = {
  clefAtBarline: 'before',
  restateTimeAfterCourtesy: true,
  cancelNaturals: 'always',
};

const GlyphStyleContext = createContext<GlyphStyleState>({
  style: DEFAULT_STYLE,
  setStyle: () => {},
  changes: DEFAULT_CHANGES,
  setChanges: () => {},
});

export function GlyphStyleProvider({ children }: { children: ReactNode }) {
  const [style, setStyle] = useState<GlyphStyleName>(DEFAULT_STYLE);
  const [changes, setChanges] = useState<ChangeOptions>(DEFAULT_CHANGES);
  const value = useMemo(() => ({ style, setStyle, changes, setChanges }), [style, changes]);
  return <GlyphStyleContext value={value}>{children}</GlyphStyleContext>;
}

export function useGlyphStyle(): GlyphStyleState {
  return use(GlyphStyleContext);
}

/**
 * `<Notation>` with the demo's style choice folded into its options. Every example
 * on this page renders through here, so the toggle reaches all of them; nothing has
 * to remember to thread a `style` prop.
 *
 * `Interaction`/`Marks`/`Playback` are just child-prop markers, so they can be
 * re-pointed at this wrapper unchanged — that is what keeps `<FontNotation.Marks>`
 * working without every call site spelling out `<Notation.Marks>`.
 */
/** `Notation` plus the demo's page-wide style choice. */
export const FontNotation: typeof Notation & {
  Interaction: typeof Notation.Interaction;
  Marks: typeof Notation.Marks;
  Playback: typeof Notation.Playback;
} = Object.assign(
  function FontNotationWithStyle({ options, ...rest }: NotationProps) {
    const { style, changes } = useGlyphStyle();
    const merged = useMemo(
      () => ({ ...options, style, changes: { ...changes, ...options?.changes } }),
      [options, style, changes],
    );
    return <Notation {...rest} options={merged} />;
  },
  { Interaction: Notation.Interaction, Marks: Notation.Marks, Playback: Notation.Playback },
);

export function FontToggle() {
  const { style, setStyle } = useGlyphStyle();
  return (
    <div className="family-toggle" role="group" aria-label="Music font for every example on this page">
      {STYLES.map((f) => (
        <button
          key={f.id}
          type="button"
          className={f.id === style ? 'is-on' : undefined}
          onClick={() => setStyle(f.id)}
        >
          <strong>{f.label}</strong>
          <span>{f.note}</span>
        </button>
      ))}
    </div>
  );
}

export function ChangesToggle() {
  const { changes, setChanges } = useGlyphStyle();
  return (
    <div className="family-toggle" role="group" aria-label="Clef and courtesy options for every example on this page">
      <label>
        <input
          type="checkbox"
          checked={changes.clefAtBarline === 'after'}
          onChange={(e) => setChanges({ ...changes, clefAtBarline: e.target.checked ? 'after' : 'before' })}
        />{' '}
        Full-size clef after the barline
      </label>
      <label>
        <input
          type="checkbox"
          checked={changes.restateTimeAfterCourtesy}
          onChange={(e) => setChanges({ ...changes, restateTimeAfterCourtesy: e.target.checked })}
        />{' '}
        Repeat the time signature after a courtesy
      </label>
      <label>
        <input
          type="checkbox"
          checked={changes.cancelNaturals === 'same-type-only'}
          onChange={(e) => setChanges({ ...changes, cancelNaturals: e.target.checked ? 'same-type-only' : 'always' })}
        />{' '}
        Skip naturals on a sharps↔flats key change
      </label>
    </div>
  );
}
