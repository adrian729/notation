import { createContext, use, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Notation } from '@polyhymnia/notation-react';
import type { NotationProps } from '@polyhymnia/notation-react';
import { DEFAULT_STYLE, type NotationOptions } from '@polyhymnia/notation-engine';
import type { NotationFont, SmuflMetadata } from '@polyhymnia/notation-fonts';
import mensuralMetadata from '@polyhymnia/notation-fonts/fonts/polyhymnia-mensural/metadata.json';
import mensuralUrl from '@polyhymnia/notation-fonts/fonts/polyhymnia-mensural/polyhymnia-mensural.woff2?url';

const MENSURAL_FONT: NotationFont = {
  name: 'PolyhymniaMensural',
  metadata: mensuralMetadata as unknown as SmuflMetadata,
  src: mensuralUrl,
};

type GlyphStyleName = NonNullable<NotationOptions['style']>;
type FontChoice = GlyphStyleName | 'manuscript';
const DEFAULT_CHOICE: FontChoice = 'manuscript';

export const STYLES: readonly { id: FontChoice; label: string; note: string }[] = [
  {
    id: 'manuscript',
    label: 'Manuscript (house default)',
    note: 'drawn quill forms, a rounded Gothic G clef, lozenges and Texturina lettering',
  },
  {
    id: 'mensural',
    label: 'Mensural',
    note: 'Bravura’s early-music forms with centered lozenge stems',
  },
  {
    id: 'modern',
    label: 'Modern (opt-in)',
    note: 'the original Bravura engraving style',
  },
];

type ChangeOptions = Required<NonNullable<NotationOptions['changes']>>;

interface GlyphStyleState {
  choice: FontChoice;
  setChoice: (choice: FontChoice) => void;
  style: GlyphStyleName;
  font?: NotationFont;
  changes: ChangeOptions;
  setChanges: (changes: ChangeOptions) => void;
}

const DEFAULT_CHANGES: ChangeOptions = {
  clefAtBarline: 'before',
  restateTimeAfterCourtesy: true,
  cancelNaturals: 'always',
};

const GlyphStyleContext = createContext<GlyphStyleState>({
  choice: DEFAULT_CHOICE,
  setChoice: () => {},
  style: DEFAULT_STYLE,
  changes: DEFAULT_CHANGES,
  setChanges: () => {},
});

export function GlyphStyleProvider({ children }: { children: ReactNode }) {
  const [choice, setSelectedChoice] = useState<FontChoice>(() => {
    const requested = new URLSearchParams(window.location.search).get('font');
    return STYLES.find(({ id }) => id === requested)?.id ?? DEFAULT_CHOICE;
  });
  const setChoice = useCallback((next: FontChoice) => {
    setSelectedChoice(next);
    const url = new URL(window.location.href);
    url.searchParams.set('font', next);
    window.history.replaceState(null, '', url);
  }, []);
  const [changes, setChanges] = useState<ChangeOptions>(DEFAULT_CHANGES);
  const value = useMemo(
    () => ({
      choice,
      setChoice,
      style: choice === 'modern' ? ('modern' as const) : ('mensural' as const),
      font: choice === 'mensural' ? MENSURAL_FONT : undefined,
      changes,
      setChanges,
    }),
    [choice, changes, setChoice],
  );
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
export const FontNotation: typeof Notation & {
  Interaction: typeof Notation.Interaction;
  Marks: typeof Notation.Marks;
  Playback: typeof Notation.Playback;
} = Object.assign(
  function FontNotationWithStyle({ options, className, ...rest }: NotationProps) {
    const { choice, style, font, changes } = useGlyphStyle();
    const merged = useMemo(
      () => ({ ...options, style, font: font ?? options?.font, changes: { ...changes, ...options?.changes } }),
      [options, style, font, changes],
    );
    return (
      <Notation
        {...rest}
        className={[className, choice === 'manuscript' && 'manuscript-score'].filter(Boolean).join(' ')}
        options={merged}
      />
    );
  },
  { Interaction: Notation.Interaction, Marks: Notation.Marks, Playback: Notation.Playback },
);

export function FontToggle() {
  const { choice, setChoice } = useGlyphStyle();
  return (
    <div className="family-toggle" role="group" aria-label="Music font for every example on this page">
      {STYLES.map((f) => (
        <button
          key={f.id}
          type="button"
          className={f.id === choice ? 'is-on' : undefined}
          aria-pressed={f.id === choice}
          onClick={() => setChoice(f.id)}
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
