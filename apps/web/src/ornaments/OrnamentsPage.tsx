import { useEffect, useRef, useState, type CSSProperties } from 'react';

const IMAGES = import.meta.glob<string>('./img/*.webp', { eager: true, query: '?url', import: 'default' });

function ornamentUrl(id: number | string): string {
  return IMAGES[`./img/vectorian-${String(id).padStart(3, '0')}.webp`]!;
}

interface OrnamentSpec {
  id: number;
  name: string;
}

const FLEURONS: readonly OrnamentSpec[] = [
  { id: 6, name: 'Fleur-de-lis' },
  { id: 22, name: 'Cross fleury' },
  { id: 20, name: 'Gothic leaf' },
  { id: 28, name: 'Spire' },
  { id: 67, name: 'Lily finial' },
  { id: 24, name: 'Triskele' },
  { id: 25, name: 'Knotted heart' },
];

const EMBLEMS: readonly OrnamentSpec[] = [
  { id: 7, name: 'Quatrefoil tile' },
  { id: 8, name: 'Rose' },
  { id: 19, name: 'Vine block' },
  { id: 9, name: 'Sprig' },
  { id: 10, name: 'Bloom' },
  { id: 29, name: 'Berried leaf' },
  { id: 30, name: 'Berried leaf, turned' },
  { id: 173, name: 'Harp' },
];

const HEAD_AND_TAIL: readonly OrnamentSpec[] = [
  { id: 58, name: 'Acanthus headpiece' },
  { id: 66, name: 'Tailpiece' },
  { id: 65, name: 'Pendant' },
];

interface CornerSpec extends OrnamentSpec {
  drawnAs: 'tl' | 'br';
  anchored?: boolean;
}

const CORNERS: readonly CornerSpec[] = [
  { id: 27, name: 'Vine corner', drawnAs: 'tl', anchored: true },
  { id: 53, name: 'Acanthus corner', drawnAs: 'br' },
  { id: 63, name: 'Leaf corner', drawnAs: 'tl' },
];

const CATALOGUE: readonly number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
  39, 40, 43, 44, 50, 51, 53, 54, 55, 56, 58, 59, 61, 62, 63, 64, 65, 66, 67, 69, 70, 71, 80, 81, 84, 90, 94, 131, 132,
  139, 162, 173, 176, 177, 188, 189, 194, 195, 196,
];

interface BorderSpec {
  name: string;
  edge: number | string;
  side: number | string;
  corner: number;
}

const BORDERS: readonly BorderSpec[] = [
  { name: 'Renaissance frieze, quatrefoil corners', edge: 71, side: '071-v', corner: 7 },
  { name: 'Running vine, rose corners', edge: 70, side: '070-v', corner: 8 },
];

interface FrameSpec {
  key: string;
  name: string;
  corner: string;
}

const FRAMES: readonly FrameSpec[] = [
  { key: 'quatrefoil', name: 'Quatrefoil tiles', corner: '2.75rem' },
  { key: 'arcade', name: 'Arcade', corner: '1.9rem' },
  { key: 'lily', name: 'Lily rows', corner: '3rem' },
  { key: 'cross', name: 'Crossed rules', corner: '5rem' },
  { key: 'oak', name: 'Oak branches', corner: '5rem' },
  { key: 'acanthus', name: 'Acanthus scroll', corner: '2.4rem' },
  { key: 'lattice', name: 'Lattice', corner: '2.5rem' },
  { key: 'diamond', name: 'Diamond chain', corner: '1.2rem' },
];

const FRAME_PARTS = ['tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r'] as const;

function frameUrl(key: string, part: string): string {
  return IMAGES[`./img/vectorian-frame-${key}-${part}.webp`]!;
}

const TINTS = [
  { id: 'ink', label: 'Ink' },
  { id: 'vermilion', label: 'Vermilion' },
  { id: 'azure', label: 'Azure' },
] as const;

type Tint = (typeof TINTS)[number]['id'];

function Ornament({ id, className = '', style }: { id: number | string; className?: string; style?: CSSProperties }) {
  const mask = `url(${ornamentUrl(id)})`;
  return (
    <span
      aria-hidden="true"
      className={`ornament ${className}`}
      style={{ maskImage: mask, WebkitMaskImage: mask, ...style }}
    />
  );
}

function Tiles({ items }: { items: readonly OrnamentSpec[] }) {
  return (
    <div className="tiles">
      {items.map((item) => (
        <figure key={item.id} className="tile">
          <Ornament id={item.id} className="tile-art" />
          <figcaption>
            {item.name} <span className="num">#{item.id}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function Catalogue({ ids }: { ids: readonly number[] }) {
  return (
    <div className="catalogue">
      {ids.map((id) => (
        <figure key={id} className="catalogue-item">
          <Ornament id={id} className="catalogue-art" />
          <figcaption className="num">#{id}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function RuleDivider({ id }: { id: number }) {
  return (
    <div className="divider">
      <span className="rule" />
      <Ornament id={id} className="divider-mark" />
      <span className="rule" />
    </div>
  );
}

function Corners({ id, drawnAs = 'tl', anchored = false }: { id: number; drawnAs?: 'tl' | 'br'; anchored?: boolean }) {
  const extra = `drawn-${drawnAs}${anchored ? ' corner-anchored' : ''}`;
  return (
    <>
      <Ornament id={id} className={`corner corner-tl ${extra}`} />
      <Ornament id={id} className={`corner corner-tr ${extra}`} />
      <Ornament id={id} className={`corner corner-bl ${extra}`} />
      <Ornament id={id} className={`corner corner-br ${extra}`} />
    </>
  );
}

function BandBorder({ border }: { border: BorderSpec }) {
  return (
    <figure className="band-frame">
      <Ornament id={border.edge} className="band band-top" />
      <Ornament id={border.edge} className="band band-bottom" />
      <Ornament id={border.side} className="band band-side band-left" />
      <Ornament id={border.side} className="band band-side band-right" />
      <Ornament id={border.corner} className="band-corner band-corner-tl" />
      <Ornament id={border.corner} className="band-corner band-corner-tr" />
      <Ornament id={border.corner} className="band-corner band-corner-bl" />
      <Ornament id={border.corner} className="band-corner band-corner-br" />
      <figcaption>{border.name}</figcaption>
    </figure>
  );
}

const RATIOS = new Map<string, Promise<number>>();

function imageRatio(url: string): Promise<number> {
  let ratio = RATIOS.get(url);
  if (!ratio) {
    ratio = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
      img.src = url;
    });
    RATIOS.set(url, ratio);
  }
  return ratio;
}

function FramePiece({ url, part }: { url: string; part: (typeof FRAME_PARTS)[number] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const horizontal = part === 't' || part === 'b';
  const edge = horizontal || part === 'l' || part === 'r';

  useEffect(() => {
    const el = ref.current;
    if (!el || !edge) return;
    let ratio = 0;
    let live = true;
    const fit = () => {
      if (!ratio) return;
      const { width, height } = el.getBoundingClientRect();
      const along = horizontal ? width : height;
      const natural = horizontal ? height * ratio : width / ratio;
      const tile = along / Math.max(1, Math.round(along / natural));
      const size = horizontal ? `${tile}px 100%` : `100% ${tile}px`;
      el.style.setProperty('mask-size', size);
      el.style.setProperty('-webkit-mask-size', size);
    };
    void imageRatio(url).then((r) => {
      if (!live) return;
      ratio = r;
      fit();
    });
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [url, edge, horizontal]);

  const mask = `url(${url})`;
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`ornament piece piece-${part}`}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    />
  );
}

function FrameBorder({ frame }: { frame: FrameSpec }) {
  return (
    <figure className="piece-frame" style={{ '--corner': frame.corner } as CSSProperties}>
      {FRAME_PARTS.map((part) => (
        <FramePiece key={part} url={frameUrl(frame.key, part)} part={part} />
      ))}
      <figcaption>{frame.name}</figcaption>
    </figure>
  );
}

function BarBorder() {
  return (
    <figure className="bar-frame">
      <span className="bar" />
      <Ornament id={19} className="bar-cap bar-cap-top" />
      <Ornament id={10} className="bar-sprig" />
      <Ornament id={19} className="bar-cap bar-cap-bottom" />
      <div className="bar-text">
        <p>
          <span className="initial">B</span>ar border, as in a book of hours: a coloured bar down the margin, sprouting
          vines at its ends and a flower at its middle.
        </p>
      </div>
    </figure>
  );
}

export function OrnamentsPage() {
  const [tint, setTint] = useState<Tint>('vermilion');
  const [dark, setDark] = useState(false);

  return (
    <div className="page" data-tint={tint} data-theme={dark ? 'dark' : 'light'}>
      <main>
        <p className="back">
          <a href="./">← Notation gallery</a>
        </p>
        <h1>Ornaments — a study</h1>
        <p className="lede">
          A selection from the free <a href="https://www.vectorian.net/free-vintage-vectors.html">Vectorian</a>{' '}
          ornaments, chosen against its{' '}
          <a href="https://www.vectorian.net/vintage-style-guide.html">vintage style guide</a> for a mostly medieval
          book with a hint of the Renaissance. Kept: <strong>Arts &amp; Crafts</strong> (the medieval revival: woodcut
          weight, fleurons, vines, heraldry) and <strong>Renaissance Revival</strong> (dense acanthus headpieces,
          corners, friezes). Left out: Penmanship, Aesthetic, Art Nouveau, Art Deco, Neoclassical and Baroque Revival,
          all flourishes of later centuries. Every piece is a raster mask, so it takes any colour from the page.
        </p>

        <div className="controls" role="group" aria-label="Ornament colour">
          {TINTS.map((option) => (
            <button key={option.id} type="button" aria-pressed={tint === option.id} onClick={() => setTint(option.id)}>
              <span className={`swatch swatch-${option.id}`} />
              {option.label}
            </button>
          ))}
          <button type="button" aria-pressed={dark} onClick={() => setDark(!dark)}>
            Dark page
          </button>
        </div>

        <h2>In use</h2>
        <article className="folio">
          <Corners id={27} anchored />
          <Ornament id={58} className="headpiece" />
          <p className="folio-kicker">Folio I</p>
          <h3 className="folio-title">Of the comparing of intervals</h3>
          <p>
            <span className="initial">H</span>ear two intervals, one after the other, and say which is the wider, or
            whether they are the same. No note names are asked and nothing is to be read: the ear alone is the judge.
          </p>
          <RuleDivider id={22} />
          <p>
            Begin with the fourth and the fifth, which lie close and are easily confused; then the octave, and so onward
            to the compound intervals, as the ear grows sure.
          </p>
          <Ornament id={66} className="tailpiece" />
        </article>

        <h2>Fleurons and section marks</h2>
        <p className="note">Single marks between paragraphs, before headings, as list bullets or in a rule.</p>
        <Tiles items={FLEURONS} />

        <h2>Dividers</h2>
        <p className="note">A rule broken by a fleuron, a Renaissance frieze, and paired leaves closing a rule.</p>
        <div className="divider-list">
          <RuleDivider id={6} />
          <RuleDivider id={20} />
          <Ornament id={71} className="frieze" />
          <div className="divider">
            <Ornament id={17} className="divider-end" />
            <span className="rule" />
            <Ornament id={18} className="divider-end" />
          </div>
          <Ornament id={81} className="thin-divider" />
          <Ornament id={84} className="thin-divider" />
        </div>

        <h2>Borders</h2>
        <p className="note">
          A band repeated along each edge (rounded to whole motifs), closed by a corner piece; and a manuscript bar
          border.
        </p>
        <div className="borders">
          {BORDERS.map((border) => (
            <BandBorder key={border.name} border={border} />
          ))}
          <BarBorder />
        </div>

        <h2>Frames</h2>
        <p className="note">
          The decorative borders of the free Vectorian pack, cut into four corners and four edges; each edge repeats
          whole motifs, so a frame fits any box.
        </p>
        <div className="borders">
          {FRAMES.map((frame) => (
            <FrameBorder key={frame.key} frame={frame} />
          ))}
        </div>

        <h2>Headpieces and tailpieces</h2>
        <p className="note">Above a chapter title and at the end of a section.</p>
        <Tiles items={HEAD_AND_TAIL} />

        <h2>Corners</h2>
        <p className="note">One ornament mirrored into four corners of a frame.</p>
        <div className="frames">
          {CORNERS.map((corner) => (
            <figure key={corner.id} className="frame">
              <Corners id={corner.id} drawnAs={corner.drawnAs} anchored={corner.anchored} />
              <figcaption>
                {corner.name} <span className="num">#{corner.id}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <h2>Emblems</h2>
        <p className="note">Woodcut-weight spot pieces: tiles, flowers, heraldry, and a harp for the music.</p>
        <Tiles items={EMBLEMS} />

        <h2>Catalogue</h2>
        <p className="note">
          Every Vectorian ornament that fits a medieval page with a Renaissance hint ({CATALOGUE.length} of 196), by
          number. Left out: pen flourishes, animals and portraits, Americana, everyday objects and Victorian scrollwork.
        </p>
        <Catalogue ids={CATALOGUE} />

        <p className="credit">
          Ornaments © Vectorian, used under its Standard License (raster only; see{' '}
          <code>src/ornaments/img/CREDITS.txt</code>
          ). Numbers follow the{' '}
          <a href="https://mirrors.ctan.org/macros/latex/contrib/tkz/pgfornament/doc/ornaments.pdf">
            pgfornament catalogue
          </a>
          .
        </p>
      </main>
    </div>
  );
}
