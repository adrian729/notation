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

MIT licensed. Source: https://github.com/adrian729/notation
