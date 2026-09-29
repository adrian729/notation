import { createFileRoute, Link } from '@tanstack/react-router';
import { LOGO_URL } from '@/lib/logo';

export const Route = createFileRoute('/')({
  component: HomePage,
});

const DISPLAY_WONK = { fontVariationSettings: '"opsz" 144, "SOFT" 0, "WONK" 1' } as const;

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
      <div className="rubricated flex items-baseline justify-between border-b border-border pb-tight text-meta text-muted-foreground">
        <span>Polyhymnia</span>
        <span>Ear training</span>
      </div>

      <header className="-mt-loose flex flex-col items-center gap-base text-center">
        <img src={LOGO_URL} alt="" className="size-[5.75rem] sm:size-30" />
        <div className="flex flex-col items-center gap-tight">
          <h1 className="font-display text-[1.75rem] sm:text-[3rem]" style={DISPLAY_WONK}>
            Polyhymnia
          </h1>
          <p className="max-w-[52ch] text-body text-muted-foreground">
            Ear training for musicians: the difference between reading music and hearing it.
          </p>
        </div>
      </header>

      <section aria-labelledby="exercises" className="flex flex-col gap-base">
        <h2 id="exercises" className="rubricated text-subhead text-muted-foreground">
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
                  className="rubricated shrink-0 text-subhead text-muted-foreground transition-colors group-hover:text-primary-strong"
                >
                  {exercise.folio}
                </span>
                <span className="flex min-w-0 flex-col gap-tight">
                  <span
                    className="font-display text-subhead transition-colors group-hover:text-primary-strong"
                    style={DISPLAY_WONK}
                  >
                    {exercise.title}
                  </span>
                  <span className="max-w-[64ch] text-body text-muted-foreground">{exercise.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

    </div>
  );
}
