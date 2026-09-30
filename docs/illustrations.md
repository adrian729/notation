# Illustrations: medieval / renaissance, free

Research date 2026-09-30. Nothing downloaded. "Free" here = usable in a public repo and a possibly commercial app; non-commercial-only sources are listed separately.

## Recommended

| Use | Source | Licence |
| --- | --- | --- |
| Dividers, corners, fleurons (vector) | [svgornaments](https://github.com/cionx/svgornaments) (Vectorian ornaments) + IM Fell Flowers font | CC BY 4.0 / OFL |
| Borders, initials, marginalia (traced to SVG) | [Walters manuscripts](https://thedigitalwalters.org/01_ACCESS_WALTERS_MANUSCRIPTS.html), [Getty Open Content](https://www.getty.edu/projects/open-content-program/), The Met Open Access | CC0 |
| Musicians / instruments (figures) | [Cantigas de Santa Maria, Codex of the musicians](https://commons.wikimedia.org/wiki/Category:Codex_of_the_musicians) on Wikimedia Commons, [Codex Manesse](https://digi.ub.uni-heidelberg.de/en/bpd/glanzlichter/codex_manesse.html) | Public domain / CC BY-SA 4.0 |
| Printers' ornaments, head/tail pieces, woodcut initials | [British Library "Mechanical Curator"](https://www.flickr.com/photos/britishlibrary/albums/72157638797895895/) on Flickr Commons, Rijksmuseum | Public domain / CC0 |

## Options

### Book decoration: borders, dividers, initials, fleurons

- **[svgornaments](https://github.com/cionx/svgornaments)** (CC BY 4.0): SVG of the 196 Vectorian ornaments from LaTeX [pgfornament](https://ctan.org/pkg/pgfornament); corners, dividers, borders, fleurons; vintage rather than strictly medieval; ready to use.
- **IM Fell Flowers 1 / 2** (OFL, Google Fonts): 17th-century printers' flowers as a font; dividers and borders from repeated glyphs.
- **Unicode hedera ❦ ❧** (in Junicode, EB Garamond and many fonts): single-glyph section marks.
- **[British Library Flickr Commons](https://www.flickr.com/photos/britishlibrary/albums/72157638797895895/)** (public domain mark): ~1M images cut from 17th–19th-century books; albums [Decorations & Designs](https://www.flickr.com/photos/britishlibrary/albums/72157638797895895/) and [Illustrated Letters & Typography](https://www.flickr.com/photos/britishlibrary/albums/72157638733975756/); head/tail pieces, decorated initials; also mirrored on [Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:British_Library/Mechanical_Curator_collection).
- **[Walters manuscripts](https://thedigitalwalters.org/01_ACCESS_WALTERS_MANUSCRIPTS.html)** / [Walters Ex Libris](https://manuscripts.thewalters.org/) (CC0): ~900 illuminated manuscripts, full high-res pages; borders, initials, line fillers, grotesques.
- **[Getty Open Content](https://www.getty.edu/projects/open-content-program/)** (CC0, ~88k images): illuminated manuscripts (Flemish, French, Italian), 16th–18th-century prints; credit line requested, not required.
- **The Met Open Access** (CC0): manuscript leaves, ornament prints, woodcuts.
- **Rijksmuseum** (CC0): renaissance/baroque ornament engravings and prints.
- **Kelmscott Chaucer** (1896, public domain; scans on Wikimedia Commons / Internet Archive): William Morris borders and initials; medieval revival, very clean lines, easy to trace.
- **Incunabula (Ratdolt etc.)** (public domain; Wikimedia Commons): woodcut initials and borders from 15th-century prints; one-colour, ideal for SVG tracing.
- **[rawpixel](https://www.rawpixel.com/search/medieval%20border)** (mixed): many CC0 public-domain items, including cleaned-up illuminated borders; only items marked CC0 / public domain are free; high-res needs an account.
- **[publicdomainvectors.org](https://publicdomainvectors.org/en/free-decorative-vector-ornaments)** / Openclipart (public domain): ornament SVGs, mixed quality.

### Figures: musicians, instruments, scenes

- **[Cantigas de Santa Maria, Codex of the musicians](https://commons.wikimedia.org/wiki/Category:Codex_of_the_musicians)** (public domain, Wikimedia Commons): 13th-century miniatures of paired musicians with lutes, rebabs, vielles, psalteries, bagpipes…; best thematic fit for a music app.
- **[Codex Manesse](https://digi.ub.uni-heidelberg.de/en/bpd/glanzlichter/codex_manesse.html)** (CC BY-SA 4.0, Heidelberg): 137 portraits of Minnesänger, c.1300–1340, several with instruments.
- **Walters / Getty / Met** (CC0): music-making marginalia, angel musicians, King David with harp, psalter miniatures.
- **Renaissance/baroque prints** (CC0, Met / Rijksmuseum): instrument engravings, music-making scenes, allegories of Music (Polyhymnia herself appears in muse series).
- **[Public Domain Image Archive](https://pdimagearchive.org/)** (public domain, by The Public Domain Review): curated, cleaned selections; good for browsing.
- **[game-icons.net](https://game-icons.net)** (CC BY 3.0): SVG icons of medieval objects (quill, scroll, lute, harp, banner); icon style, not period art.

### Non-commercial only (avoid unless the app stays non-commercial)

- **Bodleian Digital**, **e-codices** (CC BY-NC).
- **Gallica (BnF)**: free for non-commercial use; commercial reuse needs a BnF licence/fee.
- **Morgan Library** online manuscripts: check per image; generally not open licence.

## Notes

### Licences

- **CC0 / public domain**: no credit required (Getty asks for "Digital image courtesy of Getty's Open Content Program" as courtesy).
- **CC BY** (svgornaments, game-icons): credit required; add a credits file, like the piano samples' `CREDITS.txt`.
- **CC BY-SA** (Heidelberg): credit required, and derived images (crops, traced SVGs) must stay CC BY-SA; does not affect app code.
- **Wikimedia Commons**: check each file's tag; photos of 2D public-domain art are usually tagged PD-Art, but some uploads carry a photographer's licence.
- Don't imply endorsement by the source institution.

### Using scans in the app

- **Line art** (woodcuts, borders, initials, BL ornaments): trace to single-colour SVG with `potrace` or `vtracer`; colour via CSS mask or `currentColor` so it follows tokens and dark mode.
- **Colour illuminations** (Walters, Getty, Cantigas): keep as images (WebP/AVIF); fine on the light theme, need a frame or reduced opacity in dark mode.
- **Size**: crop tightly, one resolution per use, lazy-load; full-page scans are several MB each.
- **Cleanup**: parchment backgrounds need removal (threshold / background knockout) before tracing or before placing on the paper texture.
