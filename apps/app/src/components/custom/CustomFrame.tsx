import { Link, type LinkProps } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseMasthead } from '@/components/lesson/ExerciseMasthead';
import { TitleText } from '@/components/Initial';

const TITLE = 'Custom exercise';

interface CustomFrameProps {
  lessonsTo: LinkProps['to'];
  help: string;
  summary: readonly string[];
  errors: readonly string[];
  onReset: () => void;
  runner: (run: { title: string; onBack: () => void }) => ReactNode;
  children: ReactNode;
}

export function CustomErrorFallback({ lessonsTo }: { lessonsTo: LinkProps['to'] }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <p>Something went wrong setting up this exercise.</p>
      <Button asChild>
        <Link to={lessonsTo}>Back to lessons</Link>
      </Button>
    </div>
  );
}

export function CustomFrame({ lessonsTo, help, summary, errors, onReset, runner, children }: CustomFrameProps) {
  const [running, setRunning] = useState(false);

  if (running) return <>{runner({ title: TITLE, onBack: () => setRunning(false) })}</>;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-8">
      <div className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb">
          <ExerciseMasthead />
        </nav>
        <div className="-ml-2.5 flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link to={lessonsTo}>
              <ArrowLeft />
              Lessons
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw />
            Reset to defaults
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold">
            <TitleText title={TITLE} />
          </h1>
          <p className="text-muted-foreground">Choose what to practise. {help}</p>
        </div>
      </div>

      {children}

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t bg-background/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        {errors.length === 0 ? (
          <p className="text-meta text-muted-foreground">{summary.join(' · ')}</p>
        ) : (
          <ul className="text-meta text-destructive" role="alert">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}
        <Button size="lg" className="px-6" disabled={errors.length > 0} onClick={() => setRunning(true)}>
          <Play />
          Start
        </Button>
      </div>
    </div>
  );
}
