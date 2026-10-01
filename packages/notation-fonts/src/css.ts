import type { NotationFont } from './types.js';

export interface FontFaceOptions {
  readonly display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

const FORMAT_BY_EXTENSION: Readonly<Record<string, string>> = {
  woff2: 'woff2',
  woff: 'woff',
  otf: 'opentype',
  ttf: 'truetype',
};

const FORMAT_BY_MIME: Readonly<Record<string, string>> = {
  'font/woff2': 'woff2',
  'font/woff': 'woff',
  'font/otf': 'opentype',
  'font/ttf': 'truetype',
};

function cssString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\a ')}'`;
}

function fontFormat(src: string): string | undefined {
  const mime = /^data:([^;,]+)/i.exec(src);
  if (mime) return FORMAT_BY_MIME[mime[1]!.toLowerCase()];
  const extension = /\.([a-z0-9]+)$/i.exec(src.split(/[?#]/)[0]!);
  return extension ? FORMAT_BY_EXTENSION[extension[1]!.toLowerCase()] : undefined;
}

export function fontFaceCss(fonts: NotationFont | readonly NotationFont[], options: FontFaceOptions = {}): string {
  const list: readonly NotationFont[] = Array.isArray(fonts) ? fonts : [fonts as NotationFont];
  return list
    .map((font) => {
      const format = fontFormat(font.src);
      return [
        '@font-face {',
        `  font-family: ${cssString(font.name)};`,
        `  src: url(${cssString(font.src)})${format ? ` format('${format}')` : ''};`,
        '  font-weight: normal;',
        '  font-style: normal;',
        `  font-display: ${options.display ?? 'block'};`,
        '}',
      ].join('\n');
    })
    .join('\n\n');
}
