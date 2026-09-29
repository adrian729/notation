import { createFileRoute, Link } from '@tanstack/react-router';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MODULES,
  OVERVIEW_HELP,
  lessonsForModule,
  getLessonResult,
  parseCustomSearch,
} from '@/exercises/multi-interval-identification';
import { WorkshopPage } from '@/components/lesson/WorkshopPage';

export const Route = createFileRoute('/exercises/multi-interval-identification/')({
  component: MultiIntervalWorkshop,
});

function MultiIntervalWorkshop() {
  return (
    <WorkshopPage
      title="Multi-Note Interval Identification"
      blurb="Hear a stack of notes and name every note's interval above the lowest."
      overview={OVERVIEW_HELP}
      modules={MODULES}
      lessonsForModule={lessonsForModule}
      getLessonResult={getLessonResult}
      headerAction={
        <Button asChild variant="outline" className="self-start">
          <Link to="/exercises/multi-interval-identification/custom" search={parseCustomSearch({})}>
            <SlidersHorizontal />
            Set up custom exercise
          </Link>
        </Button>
      }
      renderLessonLink={(lessonId, className, children) => (
        <Link
          to="/exercises/multi-interval-identification/lesson/$lessonId"
          params={{ lessonId }}
          className={className}
        >
          {children}
        </Link>
      )}
    />
  );
}
