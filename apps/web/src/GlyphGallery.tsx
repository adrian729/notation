import { useState } from 'react';
import { DEFAULT_FONTS } from '@polyhymnia/notation-engine';
import { fontFaceCss, glyphStyles } from '@polyhymnia/notation-fonts';
import { useGlyphStyle } from './font.js';

const GLYPHS = Object.entries({ ...glyphStyles.modern.glyphs, ...glyphStyles.mensural.glyphs });
const GROUPS = [
  { id: 'clefs', label: 'Clefs', match: /clef/i },
  { id: 'heads', label: 'Notes & heads', match: /notehead|mensuralWhite/ },
  { id: 'flags', label: 'Stems & flags', match: /flag|CombStem|graceNote/i },
  { id: 'accidentals', label: 'Accidentals', match: /accidental/ },
  { id: 'rests', label: 'Rests', match: /rest/i },
  { id: 'meter', label: 'Meter & proportions', match: /timeSig|Prolation|Proportion|Tempus|Modus/ },
  { id: 'tuplets', label: 'Tuplet numbers', match: /tuplet/ },
  { id: 'expression', label: 'Articulations & pauses', match: /artic|fermata|breath|caesura/ },
  { id: 'dynamics', label: 'Dynamics', match: /dynamic/ },
  { id: 'other', label: 'Dots & brace', match: /./ },
] as const;

function groupOf(name: string) {
  return GROUPS.find((group) => group.match.test(name))!;
}

function labelOf(name: string): string {
  const clefs: Readonly<Record<string, string>> = {
    mensuralGclef: 'G clef · mensural',
    mensuralFclef: 'F clef · mensural',
    mensuralCclef: 'C clef · mensural',
    gClef: 'G clef · treble',
    fClef: 'F clef · bass',
    cClef: 'C clef · alto / tenor',
    gClef8va: 'G clef · octave above',
    gClef8vb: 'G clef · octave below',
    fClef8va: 'F clef · octave above',
    fClef8vb: 'F clef · octave below',
    gClefChange: 'G clef · small change',
    fClefChange: 'F clef · small change',
    cClefChange: 'C clef · small change',
    flag8thUp: 'Fusa flag · upward',
    flag8thDown: 'Fusa flag · downward',
    flag16thUp: 'Semifusa flag · upward',
    flag16thDown: 'Semifusa flag · downward',
  };
  return (
    clefs[name] ??
    name
      .replace(/^mensural/, 'Mensural · ')
      .replace(/^timeSig/, 'Meter numeral ')
      .replace(/^artic/, '')
      .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
      .replace(/^./, (letter) => letter.toUpperCase())
  );
}

/** Use the renderer's colour roles so specimens share the score palette. */
function colourRole(name: string) {
  if (/accidental/.test(name)) return 'accidental';
  if (/rest/i.test(name)) return 'rest';
  if (/dynamic/.test(name)) return 'dynamic';
  if (/fermata/.test(name)) return 'fermata';
  if (/artic|breath|caesura/.test(name)) return 'articulation';
  if (/tuplet/.test(name)) return 'tuplet-number';
  if (/Dot/.test(name)) return 'dot';
  return 'glyph';
}

export function GlyphGallery() {
  const { style, font } = useGlyphStyle();
  const face = font ?? DEFAULT_FONTS[style];
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  // Enumerate the public tables and the actual font metadata, including optional
  // glyphs. A new supported glyph appears here without a hand-maintained list.
  const available = GLYPHS.filter(([name]) => face.metadata.glyphBBoxes[name]);
  const matches = available.filter(([name]) =>
    `${name} ${labelOf(name)}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const visible = matches
    .filter(([name]) => category === 'all' || groupOf(name).id === category)
    .sort(([a], [b]) => {
      // Put the actual early-music clefs first when viewing an early family.
      if (style === 'mensural') {
        const rank = (name: string) => ['mensuralGclef', 'mensuralFclef', 'mensuralCclef'].indexOf(name);
        const ar = rank(a),
          br = rank(b);
        if (ar >= 0 || br >= 0) return (ar < 0 ? 3 : ar) - (br < 0 ? 3 : br);
      }
      return 0;
    });

  return (
    <section id="glyphs" className="glyph-gallery" aria-labelledby="glyph-heading">
      {font && <style>{fontFaceCss(font)}</style>}
      <div className="gallery-heading">
        <div>
          <h2 id="glyph-heading">Every symbol, up close</h2>
          <p className="note">
            {available.length} symbols in this font. Choose a group or show them all; search by name to find a sign.
          </p>
        </div>
        <label className="glyph-search">
          Find a symbol
          <input
            type="search"
            placeholder="F clef, flat, rest…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCategory('all');
            }}
          />
        </label>
      </div>
      <div className="gallery-filters" role="group" aria-label="Symbol groups">
        {[{ id: 'all', label: 'All symbols' }, ...GROUPS].map((group) => {
          const count = matches.filter(([name]) => group.id === 'all' || groupOf(name).id === group.id).length;
          return (
            <button
              key={group.id}
              type="button"
              aria-pressed={category === group.id}
              onClick={() => setCategory(group.id)}
            >
              {group.label} <span>{count}</span>
            </button>
          );
        })}
      </div>
      <p className="gallery-count" role="status">
        Showing {visible.length} of {available.length} symbols
      </p>
      <div className="glyph-grid">
        {visible.map(([name, codepoint]) => {
          const box = face.metadata.glyphBBoxes[name]!;
          const [left, bottom] = box.bBoxSW;
          const [right, top] = box.bBoxNE;
          const width = Math.max(9, right - left + 1.6);
          const height = Math.max(7, top - bottom + 1.6);
          const viewBox = `${(left + right - width) / 2} ${-(bottom + top + height) / 2} ${width} ${height}`;
          return (
            <figure className="glyph-card" key={name} data-glyph={name}>
              <svg className="pn-notation" data-pn-style={style} viewBox={viewBox} aria-hidden="true">
                <text x="0" y="0" fontSize="4" fontFamily={face.name} fill="currentColor" data-pn={colourRole(name)}>
                  {String.fromCodePoint(codepoint)}
                </text>
              </svg>
              <figcaption>
                <strong>{labelOf(name)}</strong>
                <code title={`U+${codepoint.toString(16).toUpperCase()}`}>{name}</code>
              </figcaption>
            </figure>
          );
        })}
      </div>
      {visible.length === 0 && <p className="note">No matching symbols. Try another name or choose All symbols.</p>}
    </section>
  );
}
