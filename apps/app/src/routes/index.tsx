import { createFileRoute, Link } from '@tanstack/react-router';
import { Notation } from '@polyhymnia/notation-react';
import type { MnxDocument } from '@polyhymnia/notation-model';
import { LOGO_URL } from '@/lib/logo';
import { TitleText } from '@/components/Initial';
import saltarello from '@/assets/scores/saltarello.mnx.json';

export const Route = createFileRoute('/')({
  component: HomePage,
});

const SALTARELLO = saltarello as MnxDocument;

const EXERCISES = [
  {
    folio: '01',
    title: 'Interval Comparison',
    description:
      'Hear two intervals and say which is wider, or whether they match. No note names, nothing to read.',
    to: '/exercises/interval-comparison' as const,
  },
  {
    folio: '02',
    title: 'Interval Identification',
    description: 'Hear one interval and name it, from perfect 4ths and 5ths up to compound intervals.',
    to: '/exercises/interval-identification' as const,
  },
  {
    folio: '03',
    title: 'Multi-Note Interval Identification',
    description: 'Hear a stack of three to five notes and name every note’s interval above the lowest.',
    to: '/exercises/multi-interval-identification' as const,
  },
  {
    folio: '04',
    title: 'Chord Identification',
    description: 'Hear one chord and name its quality, from major and minor up to seventh chords.',
    to: '/exercises/chord-identification' as const,
  },
];

function HomePage() {
  return (
    <div className="page-column mx-auto flex w-full max-w-3xl flex-col gap-section px-base pt-base pb-section">
      <div className="rubricated font-specimen flex items-baseline justify-between border-b border-border pb-tight text-meta text-muted-foreground">
        <span>Polyhymnia</span>
        <span>Ear training</span>
      </div>

      <header className="-mt-loose flex flex-col items-center gap-base text-center">
        <img src={LOGO_URL} alt="" className="size-[5.75rem] sm:size-30" />
        <div className="flex flex-col items-center gap-tight">
          <h1 className="font-display text-title sm:text-display">
            <TitleText title="Polyhymnia" />
          </h1>
          <p className="max-w-[52ch] text-body text-muted-foreground">
            Ear training for musicians: the difference between reading music and hearing it.
          </p>
        </div>
      </header>

      <section aria-labelledby="exercises" className="flex flex-col gap-base">
        <h2 id="exercises" className="rubricated font-specimen text-subhead text-muted-foreground">
          Exercises
        </h2>
        <ol className="flex flex-col divide-y divide-border border-y border-border">
          {EXERCISES.map((exercise) => (
            <li key={exercise.to}>
              <Link
                to={exercise.to}
                className="group flex cursor-pointer gap-base py-base transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
              >
                <span
                  aria-hidden="true"
                  className="rubricated font-specimen shrink-0 text-subhead text-muted-foreground transition-colors group-hover:text-primary-strong"
                >
                  {exercise.folio}
                </span>
                <span className="flex min-w-0 flex-col gap-tight">
                  <span className="font-display text-heading text-primary-strong">
                    <TitleText title={exercise.title} />
                  </span>
                  <span className="max-w-[64ch] text-body text-muted-foreground">{exercise.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <footer aria-hidden="true" className="pt-base">
        <Notation score={SALTARELLO} />
      </footer>
    </div>
  );
}
