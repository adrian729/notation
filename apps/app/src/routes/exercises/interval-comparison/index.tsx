import { createFileRoute, Link } from '@tanstack/react-router';
import { CircleHelp, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DEFAULT_OPTIONS, MODULES, OVERVIEW_HELP, lessonsForModule, getLessonResult } from '@/exercises/interval-comparison';

export const Route = createFileRoute('/exercises/interval-comparison/')({
  component: WorkshopPage,
});

function WorkshopPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <h1 className="text-2xl font-semibold">Interval Comparison</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="About Interval Comparison">
                <CircleHelp />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="flex max-h-[70vh] w-[min(28rem,calc(100vw-2rem))] flex-col overflow-y-auto text-sm leading-relaxed"
            >
              {OVERVIEW_HELP.map((section) => (
                <section key={section.heading} className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-strong">
                    {section.heading}
                  </h3>
                  <p>{section.intro}</p>
                  {section.items.length > 0 && (
                    <dl className="mt-1 flex flex-col gap-3 border-l-2 border-border pl-3">
                      {section.items.map((item) => (
                        <div key={item.term} className="flex flex-col gap-0.5">
                          <dt className="font-medium">{item.term}</dt>
                          <dd className="text-muted-foreground">{item.text}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </section>
              ))}
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-muted-foreground">Which interval is larger? No theory needed — the recommended first exercise.</p>
      </div>

      <Button asChild variant="outline" className="self-start">
        <Link
          to="/exercises/interval-comparison/custom"
          search={{
            intervals: DEFAULT_OPTIONS.intervals.join(','),
            modes: DEFAULT_OPTIONS.playingModes.join(','),
            rel: DEFAULT_OPTIONS.toneRelationship,
            low: DEFAULT_OPTIONS.range.low,
            high: DEFAULT_OPTIONS.range.high,
            tempo: DEFAULT_OPTIONS.tempo,
            count: String(DEFAULT_OPTIONS.questionCount === 'endless' ? 10 : DEFAULT_OPTIONS.questionCount),
            endless: DEFAULT_OPTIONS.questionCount === 'endless' ? '1' : '0',
            auto: DEFAULT_OPTIONS.autoNext ? '1' : '0',
          }}
        >
          <SlidersHorizontal />
          Set up custom exercise
        </Link>
      </Button>

      <div className="flex flex-col gap-4">
        {MODULES.map((mod) => (
          <Card key={mod.id}>
            <CardHeader>
              <div className="flex items-center gap-1">
                <CardTitle>{mod.title}</CardTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon-xs" aria-label={`About ${mod.title}`}>
                      <CircleHelp />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="flex w-80 flex-col text-sm leading-relaxed">
                    {mod.help.map((section) => (
                      <section key={section.heading} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-strong">
                          {section.heading}
                        </h3>
                        <p>{section.text}</p>
                      </section>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {lessonsForModule(mod.id).map((lesson) => {
                const result = getLessonResult(lesson.id);
                return (
                  <Link
                    key={lesson.id}
                    to="/exercises/interval-comparison/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-muted',
                      result?.passed && 'border-success',
                    )}
                  >
                    <span className="font-medium">{lesson.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {result ? `Best: ${result.bestPercent}%${result.passed ? ' — passed' : ''}` : 'Not attempted'}
                    </span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
