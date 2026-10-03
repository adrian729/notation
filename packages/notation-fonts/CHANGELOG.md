# @polyhymnia/notation-fonts

## 0.3.0

### Minor Changes

- 81ea17f: Make Polyhymnia Manuscript the default font, with reconstructed quill music forms and embedded Texturina lettering. Preserve the mensural color palette and centered stems. Support font-driven pen outlines for stems, beams, score rules and insertion previews while preserving note placement and interaction IDs. Modern remains available through `style: 'modern'`; the original Mensural family remains available through `NotationOptions.font`.

## 0.2.0

### Minor Changes

- 10a8935: Font subsets now include the brace, articulations, fermatas, dynamics letters and grace-note slashes, ready for the upcoming grand staff, articulation, dynamics and grace-note layout.
- a83dc3b: Font subsets now include SMuFL's 23 precomposed dynamics (`dynamicPP`, `dynamicMF`, `dynamicFF`, `dynamicSforzato`, `dynamicFortePiano`, `dynamicRinforzando2`, …) as optional glyphs, so dynamics are drawn with the font's designed letter spacing.
