# @polyhymnia/notation-fonts

SMuFL music notation fonts (woff2 + metadata) and glyph tables used by `@polyhymnia/notation-engine`, plus `fontFaceCss` to declare them in a page.

```sh
npm install @polyhymnia/notation-fonts
```

```ts
import { fontFaceCss, type NotationFont } from '@polyhymnia/notation-fonts';
import metadata from '@polyhymnia/notation-fonts/fonts/polyhymnia-notation/metadata.json' with { type: 'json' };

const font: NotationFont = { name: 'PolyhymniaNotation', metadata, src: fontUrl };
const css = fontFaceCss(font);
```

Each font keeps its own OFL licence and notice under `fonts/<name>/`.

The three playground families are `PolyhymniaNotation` (modern Bravura subset),
`PolyhymniaMensural` (Bravura early-music forms), and `PolyhymniaManuscript`
(drawn manuscript forms with Texturina lettering). Manuscript is the engine and
React renderer's default. `style: 'modern'` selects Notation. To select the original
Mensural family, supply its font data:

```ts
import mensuralMetadata from '@polyhymnia/notation-fonts/fonts/polyhymnia-mensural/metadata.json' with { type: 'json' };
import type { SmuflMetadata } from '@polyhymnia/notation-fonts';

const mensural: NotationFont = {
  name: 'PolyhymniaMensural',
  metadata: mensuralMetadata as unknown as SmuflMetadata,
  src: mensuralWoff2Url, // serve fonts/polyhymnia-mensural/polyhymnia-mensural.woff2
};
// Pass { style: 'mensural', font: mensural } as NotationOptions.
```

Manuscript includes every glyph used by both styles. Its metadata also opts into
slight pen-pressure variation for score rules; renderers honor `RectShape.outline`
when provided by the engine. The mensural style retains centered lozenge stems.
See the [drawing and rebuild notes](scripts/manuscript/README.md).

MIT licensed. Source: https://github.com/adrian729/notation
