import { createContext, use, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Notation } from '@polyhymnia/notation-react';
import type { NotationProps } from '@polyhymnia/notation-react';
import { DEFAULT_FONT, type NotationOptions } from '@polyhymnia/notation-engine';

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

interface GlyphStyleState {
  style: GlyphStyleName;
  setStyle: (style: GlyphStyleName) => void;
}

const GlyphStyleContext = createContext<GlyphStyleState>({ style: DEFAULT_FONT, setStyle: () => {} });

export function GlyphStyleProvider({ children }: { children: ReactNode }) {
  const [style, setStyle] = useState<GlyphStyleName>(DEFAULT_FONT);
  const value = useMemo(() => ({ style, setStyle }), [style]);
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
    const { style } = useGlyphStyle();
    const merged = useMemo(() => ({ ...options, style }), [options, style]);
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
