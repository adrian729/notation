# Music fonts: modern and early (medieval / renaissance / baroque)

Research date 2026-09-30. Nothing bought, downloaded or installed.

## Current state

| Role | Font | Licence | Status |
| --- | --- | --- | --- |
| Modern notation | [Bravura](https://github.com/steinbergmedia/bravura) (SMuFL) | OFL, free | In use: `packages/notation-font` subsets Bravura 1.482 into `PolyhymniaNotation` |
| Mensural (c.1400–1550) | Bravura mensural glyphs (SMuFL) | OFL, free | In progress: `manifest.mensural.ts` → `PolyhymniaMensural` |
| Favourite early look | [Nivelle](https://casfaculty.case.edu/ross-duffin/homepage/fonts-for-early-music/) (Ross Duffin) | Paid, $50 | Candidate only; not SMuFL, web use needs permission (see notes) |

## Options

### Modern (SMuFL, drop-in)

- **[Bravura](https://github.com/steinbergmedia/bravura)** (OFL, Steinberg): classic 19th/early-20th-century European engraving; the SMuFL reference font; includes mensural and chant ranges.
- **[Leipzig](https://github.com/rism-ch/verovio/tree/develop/fonts)** (OFL, Laurent Pugin): Verovio's default; also covers early notation (Verovio renders mensural and neumes with it).
- **[Leland](https://github.com/MuseScoreFonts/Leland)** (OFL, MuseScore): modelled on SCORE output; clean, slightly lighter.
- **[Sebastian](https://github.com/fkretlow/sebastian/releases)** (OFL): general engraving font, 1200+ glyphs.
- **[Eugene](https://www.mikkopatama.com/eugenefont/)** (OFL, Mikko Patama): early-20th-century Parisian hand-engraved look; the most "old print" of the free SMuFL fonts.
- **[Finale Maestro / Engraver / Legacy](https://makemusic.zendesk.com/hc/en-us/articles/1500013053461)** (OFL, MakeMusic): SMuFL versions of Finale's fonts; Legacy = old Petrucci + Tamburo; Engraver = traditional engraved look.
- **[Petaluma](https://www.steinberg.net/dorico/)** / **Finale Ash / Finale Broadway / Finale Jazz** (OFL): handwritten / jazz copyist styles; poor fit for the manuscript theme.
- **[November 2](http://www.klemm-music.de/notation/november2/en/index.php)** (paid, Robert Piéchaud): "slightly weathered" traditional engraving with rounded terminals; nicest classic-old look among SMuFL fonts; web licence to confirm with seller.
- **[LS Iris](https://www.notationcentral.com/product/ls-iris-smufl/)**, **[Music Type Foundry](https://www.notationcentral.com/product-tag/mtf/)**, **[Norfonts](https://www.notationcentral.com/vendor/norfonts/)** (paid): calligraphic / hand-engraved styles; web licences to confirm.

### Old engraving look, not SMuFL (LilyPond fonts)

- **[Gutenberg1939](https://fonts.openlilylib.org/index.html)** (OFL): old movable-type print look.
- **[Sebastiano](https://fonts.openlilylib.org/index.html)** (OFL): LilyPond counterpart of Sebastian.
- **[Haydn, Beethoven, Profondo](https://fonts.openlilylib.org/index.html)** (licence unverified): Haydn = classic Edition Peters look.
- **Emmentaler** (OFL, LilyPond default): traditional heavy engraving.

### Early notation (medieval / renaissance / baroque)

- **[Nivelle](https://casfaculty.case.edu/ross-duffin/homepage/fonts-for-early-music/)** (paid, $50, Duffin): 15th-century mensural, upward stems; usable for black notation.
- **Other Duffin fonts** (paid, $50 each, same page):
  - **Squarcialupi**: 13th–15th-century mensural.
  - **Subtilior**: ars subtilior, supports red notation.
  - **Chigi**: 15th-century mensural, made for notation programs.
  - **Fossombrone**: early-16th-century white mensural (Petrucci prints).
  - **Marenzio**: late-16th-century (Gardano prints).
  - **Morley**: 16th–17th-century (Morley's treatise).
  - **Ravenscroft**: early 17th century, print + manuscript.
  - **Parthenia**: early-17th-century English engraved keyboard notation with ornaments.
  - **Florentius**: late-15th-century Italian treatise.
  - **Saint Gall / Dendermonde**: chant neumes, graphical placement only.
- **Bravura / Leipzig mensural ranges** (OFL): white and black mensural notes, rests, mensuration signs, ligatures in SMuFL; free route to an early look inside our engine.
- **[Gregorio fonts](https://github.com/gregorio-project/gregorio/blob/master/fonts/fonts_README.md)** (free, Gregorio project; check each font's licence): Greciliae (from Caeciliae), Gregorio, Grana Padano; Gregorian square notation.
- **Caeciliae** (free): classic square-notation chant font.
- **Volpiano** (free, licence unverified): chant font used by chant databases; letters map to pitches on a staff.

## Notes

### What fits our engine

- The engine draws SMuFL codepoints and reads Bravura's metadata JSON (bounding boxes, anchors, engraving defaults) via `packages/notation-font` (`manifest.ts`, `build.mjs`).
- **SMuFL fonts with metadata** (Leipzig, Leland, Sebastian, Eugene, Finale *, November 2): cheapest swap; same codepoints, new metadata; mostly a build/manifest change plus visual check.
- **Non-SMuFL fonts** (Duffin, LilyPond fonts, chant fonts): need a codepoint mapping to SMuFL names and hand-measured metrics/anchors per glyph; much bigger job.

### Nivelle / Duffin fonts

- $50 each; licence says the font must "not be passed along to further users". A webfont exposes the file to every visitor, so web embedding needs explicit permission from Duffin.
- Mac keyboard-mapped, no SMuFL, no metadata: needs a mapping + manual metrics (see above).
- Rebuilding the glyphs into our own subset font is modification + redistribution: also needs permission.
- Public repo: same rule as paid text fonts (`docs/fonts.md`): keep files gitignored, inject in CI.

### Paid SMuFL fonts

- November 2 and Notation Central fonts are sold mainly as desktop licences for notation software; confirm webfont / app terms before buying.

### Early-style route without paid fonts

- Bravura's mensural glyphs (already being subset) or Leipzig give early notation for free.
- Pair with an old-print modern font (Eugene, Finale Legacy/Engraver, Gutenberg1939) for the non-mensural views.
