const PX_PER_SPACE = 14;

const SPECIMEN = {
  modern: [
    ['gClef', 1],
    ['timeSig4', 3],
    ['timeSig4', 1],
    ['noteheadDoubleWhole', 2],
    ['noteheadWhole', 2],
    ['noteheadHalf', 2.5],
    ['accidentalSharp', 2],
    ['noteheadBlack', 2],
    ['augmentationDot', 2.5],
    ['restWhole', 3],
    ['restHalf', 2],
    ['restQuarter', 2],
    ['rest8th', 2],
    ['fClef', 3],
    ['cClef', 2],
  ],
  mensural: [
    ['gClef', 1],
    ['timeSigCutCommon', 2],
    ['mensuralWhiteBrevis', 2],
    ['mensuralWhiteSemibrevis', 2],
    ['mensuralNoteheadMinimaWhite', 2.5],
    ['accidentalFlat', 2],
    ['mensuralNoteheadSemiminimaWhite', 2],
    ['mensuralRestLongaPerfecta', 2],
    ['mensuralRestSemibrevis', 2],
    ['mensuralRestMinima', 2],
    ['mensuralRestSemiminima', 2],
    ['mensuralRestFusa', 2],
  ],
};

function escape(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function glyphPath(font, cp, x, y) {
  const glyph = font.glyphs[String(cp)];
  if (!glyph) return '';
  const s = 4 / font.upem;
  return `<path d="${glyph.d}" transform="translate(${x} ${-y}) scale(${s} ${-s})"/>`;
}

function staffSpecimen(styleName, { metadata, font, glyphs }) {
  const sequence = SPECIMEN[styleName] ?? [];
  const thickness = metadata.engravingDefaults?.staffLineThickness ?? 0.13;
  let x = 1;
  const marks = [];
  for (const [name, y] of sequence) {
    if (!(name in metadata.glyphAdvanceWidths)) continue;
    marks.push(glyphPath(font, glyphs[name], x, y));
    x += metadata.glyphAdvanceWidths[name] + 0.8;
  }
  const width = x + 1;
  const lines = [0, 1, 2, 3, 4]
    .map((line) => `<rect class="staff" x="0" y="${-line - thickness / 2}" width="${width}" height="${thickness}"/>`)
    .join('');
  return `<svg viewBox="0 -7 ${width} 10" width="${width * PX_PER_SPACE}" height="${10 * PX_PER_SPACE}">${lines}${marks.join('')}</svg>`;
}

function glyphCell(name, cp, kind, { metadata, font, hex }) {
  const bbox = metadata.glyphBBoxes[name];
  const advance = metadata.glyphAdvanceWidths[name];
  const present = font.glyphs[String(cp)] !== undefined;
  const label = `<div class="label"><b>${escape(name)}</b><span>${hex(cp)} · ${kind}</span></div>`;
  if (!present || !bbox) return `<div class="cell missing">${label}<div class="none">missing</div></div>`;
  const [neX, neY] = bbox.bBoxNE;
  const [swX, swY] = bbox.bBoxSW;
  const minX = Math.min(0, swX) - 0.5;
  const maxX = Math.max(advance, neX) + 0.5;
  const minY = Math.min(0, swY) - 0.5;
  const maxY = Math.max(0, neY) + 0.5;
  const w = maxX - minX;
  const h = maxY - minY;
  const anchors = Object.entries(metadata.glyphsWithAnchors?.[name] ?? {})
    .map(
      ([anchor, [ax, ay]]) =>
        `<circle class="anchor" cx="${ax}" cy="${-ay}" r="0.08"><title>${escape(anchor)}</title></circle>`,
    )
    .join('');
  return [
    `<div class="cell">${label}`,
    `<svg viewBox="${minX} ${-maxY} ${w} ${h}" width="${w * PX_PER_SPACE * 2}" height="${h * PX_PER_SPACE * 2}">`,
    `<line class="axis" x1="${minX}" x2="${maxX}" y1="0" y2="0"/>`,
    `<line class="advance" x1="${advance}" x2="${advance}" y1="${-maxY}" y2="${-minY}"/>`,
    `<rect class="bbox" x="${swX}" y="${-neY}" width="${neX - swX}" height="${neY - swY}"/>`,
    glyphPath(font, cp, 0, 0),
    anchors,
    '</svg></div>',
  ].join('');
}

export function testSheet(context) {
  const { slug, metadata, styles } = context;
  const sections = Object.entries(styles).map(([styleName, style]) => {
    const cells = [
      ...Object.entries(style.core).map(([name, cp]) => glyphCell(name, cp, 'core', context)),
      ...Object.entries(style.optional).map(([name, cp]) => glyphCell(name, cp, 'optional', context)),
    ];
    return `<section><h2>${escape(styleName)}</h2>${staffSpecimen(styleName, context)}<div class="grid">${cells.join('')}</div></section>`;
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(metadata.fontName)} test sheet</title>
<style>
body { font: 13px system-ui, sans-serif; margin: 16px; background: #eff1f5; color: #4c4f69; }
.grid { display: flex; flex-wrap: wrap; gap: 8px; }
.cell { background: #fff; border: 1px solid #ccd0da; padding: 6px; min-width: 120px; }
.cell.missing { border-color: #d20f39; }
.label { display: flex; flex-direction: column; margin-bottom: 4px; }
.label span { color: #7c7f93; }
.none { color: #d20f39; }
svg { display: block; overflow: visible; }
path { fill: #4c4f69; }
.staff { fill: #8c8fa1; }
.axis, .advance { stroke: #9ca0b0; stroke-width: 0.02; }
.bbox { fill: none; stroke: #1e66f5; stroke-width: 0.02; stroke-dasharray: 0.08 0.06; }
.anchor { fill: #ea76cb; }
</style>
</head>
<body>
<h1>${escape(metadata.fontName)} <small>(${escape(slug)}, version ${escape(metadata.fontVersion)})</small></h1>
<p>Outlines drawn from the font; dashed boxes are the metadata bounding boxes, vertical lines the advance widths, dots the anchors.</p>
${sections.join('\n')}
</body>
</html>
`;
}
