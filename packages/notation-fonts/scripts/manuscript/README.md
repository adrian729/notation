# Polyhymnia Manuscript

Editable sources for the third music font, `PolyhymniaManuscript`. It covers all
187 glyphs in the modern and mensural tables. Use it with the mensural style to
keep stems on the upper/lower vertices of the lozenge heads.

## Drawing decisions

The first two supplied manuscript photographs guide the pen character: unequal
lozenge edges, angled open counters, small diamond dots, narrow looped flats,
and thin ascenders with heavier turns. The G clef follows the later illuminated
manuscript supplied during review: a compact rounded bowl, pointed inner tongue,
angular crown and short upturned terminal. The third original photograph
contributes the F clef's form, clarified by the later close crop: a short cut
upper wedge returning into a long lower tongue, with unequal diamond dots.
Horizontal strokes behind that sign belong to the staff. This reference does
not supply the overall stroke style.

`outlines.py` holds the music drawings in staff-space coordinates, y upwards.
These are reconstructed vector forms from the references, not exact image
tracings. Signs absent from the photographs are drawn with the same pen while
retaining their musical distinctions. The original photos are not distributed.
No Bravura music outlines are copied into this font; the existing mensural
font supplies the starting engraving defaults and the engine's established
glyph selection and centered-stem policy remain in use.

Filled master paths define the noteheads, flats, G and F clefs and flags. Pen
trajectories define the other strokes: a broad nib, changing pressure and small
deterministic edge variations produce the outlines. Counter winding is preserved
when composing or reflecting drawings. Repeated instances use the same glyph;
there are no contextual alternate drawings.

`build.py` embeds lettering from [Texturina](https://github.com/Omnibus-Type/Texturina)
at optical size 24, weight 500: time signatures, tuplets, proportion numerals,
octave indications and dynamics. This lettering is part of the WOFF2, so these
marks do not depend on a second font loading in the browser. General text and
lyrics are outside the current renderer's scope; this is a SMuFL music font,
not a replacement for a separate Texturina text font.

`pen.py` holds normalized pen-edge studies. The stem's narrow entry, pressure
changes and slight lean are reconstructed from the second photograph, ignoring
the staff where it crosses the shaft. Both complete-note font glyphs and
variable-length score stems use this master. Connected modern beams are not
clearly shown in the references; their edge treatment adapts the broader nib
strokes of the noteheads. Flags have separately drawn shoulders and cut tips.

The metadata's `strokeVariation: 0.022` retains subtle pressure variation on
horizontal ruling and ledgers. Barline sweep remains `strokeWander: 0.18`;
the separate `stemStroke` and `beamStroke` outlines limit their sweep to 0.025
staff spaces, so pen thickness and taper carry most of their character.
Rule bounds contain the displaced ink; note placement, connections and hit
targets are preserved. Beam levels share one profile, and stem tips are seated
inside their outlines. Insertion-preview ledgers follow the ruling policy.
Slurs and ties retain their existing geometry. These optional fields extend
`engravingDefaults`; other fonts do not opt into them.

## Rebuild

From the repository root, after installing workspace dependencies:

```sh
python3 -m venv packages/notation-fonts/.venv
packages/notation-fonts/.venv/bin/python3 -m pip install -r packages/notation-fonts/requirements.txt
pnpm --filter @polyhymnia/notation-fonts font:manuscript
pnpm --filter @polyhymnia/notation-fonts font:verify polyhymnia-manuscript
```

The first build downloads Texturina and its OFL from the pinned Google Fonts
commit `8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5`. Both files are checked against
SHA-256 hashes in `../manuscript.mjs` and cached in ignored `vendor/texturina/`.
Later builds can run offline. `NOTATION_FONTS_PYTHON` can select another Python
environment with the same requirements installed.

The builder writes an intermediate TTF and metadata to ignored
`out/manuscript-source/`, then invokes the existing **`font:add`** command to
measure the compiled outlines, subset and write `fonts/polyhymnia-manuscript/`.
Never edit that directory directly. Timestamps, drawing variation and Texturina
inputs are fixed so rebuilding with the pinned toolchain is reproducible.

Review `out/polyhymnia-manuscript.html` for all glyphs and select **Manuscript**
in the playground to inspect real engraving, clef changes and answer entry.
Both the original music drawings and the embedded Texturina lettering are
distributed under the SIL Open Font License; the generated font includes its
copyright, OFL and source notice.
