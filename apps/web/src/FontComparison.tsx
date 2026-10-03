import { FontToggle } from './font.js';

/** The font choice reaches every specimen and score on the page. */
export function FontComparison() {
  return (
    <section className="font-compare" aria-label="Font family">
      <FontToggle />
    </section>
  );
}
