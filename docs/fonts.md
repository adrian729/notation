# Fonts: medieval / renaissance style

Research date 2026-09-30. Nothing bought, downloaded or installed.

## Chosen

| Role | Font | Licence |
| --- | --- | --- |
| Main text | [Junicode 2](https://github.com/psb1558/Junicode-font) | OFL, free |
| Headings | [Texturina](https://fonts.google.com/specimen/Texturina) | OFL, free |
| Capitals / drop caps | [EB Garamond Initials](https://github.com/georgd/EB-Garamond-Initials) or [Kanzlei Initialen](https://www.fonts4free.net/kanzlei-initialen-font.html) | OFL / freeware |

## Options

### Main text (renaissance roman)

- **[Junicode 2](https://github.com/psb1558/Junicode-font)** (OFL): made for medievalists; full MUFI coverage (long s, ligatures, medieval characters); variable weight + width; ships WOFF2.
- **EB Garamond** (OFL, fontsource): 16th-century Garamond; already in the app as `--font-specimen`.
- **IM Fell** (English, DW Pica, Great Primer…) (OFL, Google Fonts): 17th-century Fell types, rough inky print texture; IM Fell Flowers adds ornaments.
- **Cardo** (OFL, Google Fonts): Bembo-like, made for classicists/medievalists.
- **Cormorant Garamond** (OFL, Google Fonts): elegant, high contrast; weak at small sizes.

### Blackletter (headings / short text only)

- **[Texturina](https://fonts.google.com/specimen/Texturina)** (OFL, variable): only blackletter still readable at text size.
- **[Grenze Gotisch](https://fonts.google.com/specimen/Grenze%2BGotisch)** (OFL, variable): soft, rounded blackletter.
- **[UnifrakturMaguntia](https://fonts.google.com/specimen/UnifrakturMaguntia) / [UnifrakturCook](https://fonts.google.com/specimen/UnifrakturCook)** (OFL): classic Fraktur / textura.
- **[Jacquarda Bastarda 9](https://fonts.google.com/specimen/Jacquarda+Bastarda+9)** (OFL): bastarda revival, pixel-like build.
- **[Blumen](https://creativemarket.com/kaer_cm/12762783-Blumen-blackletter-font-family)** (paid, kaer): Regular + Initials, OTF/TTF, not a color font; based on a 1683 German folio. Webfont ~$20, App ~$188. Also on [MyFonts](https://www.myfonts.com/collections/blumen-font-kaer/). The [exfont page](https://exfont.com/blumen-regular.font) is a free-for-personal-use mirror only.

### Capitals / drop caps

- **[EB Garamond Initials](https://github.com/georgd/EB-Garamond-Initials)** (OFL): three layerable fonts (Initials = full, Fill1 = ornament background, Fill2 = letter); two palette colors → illuminated look in every browser.
- **[Kanzlei Initialen](https://www.fonts4free.net/kanzlei-initialen-font.html)** (freeware, Dieter Steffmann): gothic initials.
- **[Goudy Initialen](https://www.fonts4free.net/goudy-initialen-font.html)** (freeware, Dieter Steffmann): floral framed initials.
- **[Illuminated medieval drop capitals](https://creativemarket.com/kaer_cm/291238891-Illuminated-medieval-drop-capitals)** (paid, kaer): drop caps + numbers from Ratdolt incunabula; Regular/Light, Colored/BW; OTF/TTF, 6.7 MB. Desktop $24, Webfont ~$30, App ~$416. Colored styles are OpenType-SVG (no Chrome/Edge support).
- **Other paid kaer drop caps**: [Medieval Initials Gothic](https://creativemarket.com/kaer_cm/92475468-Medieval-Initials.-Gothic-Drop-caps), [Illuminated Initials family](https://creativemarket.com/kaer_cm/13431444-Illuminated-Initials-font-family), [Woodcut Dropcaps](https://creativemarket.com/kaer_cm/282781254-Woodcut-Dropcaps), [Medieval Knots](https://creativemarket.com/kaer_cm/10995951-Medieval-Knots-Drop-caps-font), [Antoine](https://creativemarket.com/kaer_cm/14973353-Antoine-Medieval-drop-caps-font). Woodcut/knots are single color (no OpenType-SVG issue, tintable).

## Notes

### Free (OFL) vs paid

- OFL fonts can be committed to the public repo, subset, converted to WOFF2 and self-hosted freely.
- Steffmann fonts are freeware, not OFL: aggregators say free for commercial use, but check the readme in the package before committing them.
- Junicode may not be on fontsource; if not, self-host the WOFF2 from its release.

### Paid fonts (Creative Market licence tiers)

- Source: [Creative Market font licences](https://creativemarket.com/licenses/fonts).
- **Webfont** is the right tier for the app (website on GitHub Pages, `@font-face`): multiple owned sites, pageview limit chosen at checkout.
- **App** covers one native/desktop/mobile app with non-extractable embedded fonts; only needed if the app is later wrapped (Capacitor, Electron).
- **Desktop** allows web use only as rasterized images; no font files on the web.
- Terms don't mention converting to WOFF2 or subsetting: ask the seller, or check whether the webfont download includes WOFF2.
- The repo is public: committing paid font files would redistribute them. Keep them gitignored, store them as a base64 GitHub Actions secret (or in a private repo) and write them in before the Pages build; use a CSS fallback so builds without them still work. The deployed WOFF2 being fetchable is normal for webfonts.

### Color fonts

- The colored kaer drop caps are OpenType-SVG: supported by Firefox and Safari, not Chrome/Edge (they show the plain outline fallback).
- Options: BW style tinted with tokens; convert to COLRv1 (modifies the font, needs seller permission); or `@supports font-tech(color-SVG)` with BW fallback.
- EB Garamond Initials Fill1 + Fill2 layering avoids the problem entirely.

### Size and loading

- Ship only the styles used, subset capitals to A–Z, load per page with `unicode-range` and `font-display: swap`.

### App integration

- Font tokens live in `apps/app/src/styles/theme.css` (`--font-sans`, `--font-display`, `--font-specimen`, …); current fonts come from fontsource packages.
- Add `@font-face` rules + tokens (e.g. `--font-blackletter`, `--font-initial`); drop caps via `::first-letter` or an initial element in the paper styling. App CSS only, no package changes.
