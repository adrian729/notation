import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DEFAULT_OPTIONS, MODULES, lessonsForModule, getLessonResult } from '@/exercises/interval-comparison';

export const Route = createFileRoute('/exercises/interval-comparison/')({
  component: WorkshopPage,
});

function WorkshopPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Interval Comparison</h1>
        <p className="text-muted-foreground">Which interval is larger? No theory needed — the recommended first exercise.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom exercise</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link
              to="/exercises/interval-comparison/custom"
              search={{
                intervals: DEFAULT_OPTIONS.intervals.join(','),
                modes: DEFAULT_OPTIONS.playingModes.join(','),
                rel: DEFAULT_OPTIONS.toneRelationship,
                low: DEFAULT_OPTIONS.range.low,
                high: DEFAULT_OPTIONS.range.high,
                tempo: DEFAULT_OPTIONS.tempo,
                count: String(DEFAULT_OPTIONS.questionCount),
                auto: DEFAULT_OPTIONS.autoNext ? '1' : '0',
              }}
            >
              Set up custom exercise
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {MODULES.map((mod) => (
          <Card key={mod.id}>
            <CardHeader>
              <CardTitle>{mod.title}</CardTitle>
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
                      result?.passed && 'border-green-400',
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
