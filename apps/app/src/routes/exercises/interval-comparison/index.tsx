import { createFileRoute, Link } from '@tanstack/react-router';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEFAULT_OPTIONS, MODULES, OVERVIEW_HELP, lessonsForModule, getLessonResult } from '@/exercises/interval-comparison';
import { LessonLinkTile, ModuleCard, OverviewHelpPopover } from '@/components/lesson/LessonListParts';

export const Route = createFileRoute('/exercises/interval-comparison/')({
  component: WorkshopPage,
});

function WorkshopPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <h1 className="text-2xl font-semibold">Interval Comparison</h1>
          <OverviewHelpPopover ariaLabel="About Interval Comparison" sections={OVERVIEW_HELP} />
        </div>
        <p className="text-muted-foreground">Which interval is larger, or are they the same? No theory needed — the recommended first exercise.</p>
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
          <ModuleCard key={mod.id} title={mod.title} help={mod.help}>
            {lessonsForModule(mod.id).map((lesson) => (
              <LessonLinkTile
                key={lesson.id}
                title={lesson.title}
                result={getLessonResult(lesson.id)}
                render={(className, children) => (
                  <Link
                    to="/exercises/interval-comparison/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    className={className}
                  >
                    {children}
                  </Link>
                )}
              />
            ))}
          </ModuleCard>
        ))}
      </div>
    </div>
  );
}
