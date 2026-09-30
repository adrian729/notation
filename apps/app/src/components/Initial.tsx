import { cn } from '@/lib/utils';

const INITIAL = /^[A-Z]$/;

/*
 * An illuminated capital, drawn as two stacked layers of the EB Garamond
 * Initials font: Fill1 is the ornament frame, Fill2 the letter inside it. The
 * two faces share an em box and advance width, so a single grid cell registers
 * them exactly rather than relying on tuned offsets.
 *
 * The frame is decorative and hidden from assistive tech; the letter layer
 * carries the real text, so a title reads correctly and stays selectable.
 */
export function Initial({ letter, className }: { letter: string; className?: string }) {
  return (
    <span className={cn('illuminated-initial', className)}>
      <span aria-hidden="true" className="illuminated-initial-frame">
        {letter}
      </span>
      <span className="illuminated-initial-letter">{letter}</span>
    </span>
  );
}

/*
 * Splits the leading letter off a title and sets it as an initial, leaving the
 * remainder in the heading face. Anything that is not a plain capital A-Z (a
 * digit, a quote, an accented letter the subset does not carry) falls back to
 * the untouched title, so no heading can end up with a missing glyph.
 */
export function TitleText({ title }: { title: string }) {
  const letters = [...title];
  const [first, ...rest] = letters;
  if (letters.length < 2 || !INITIAL.test(first)) return <>{title}</>;
  return (
    <>
      <Initial letter={first} />
      {rest.join('')}
    </>
  );
}
