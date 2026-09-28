import { createFileRoute, Link } from '@tanstack/react-router';
import { MODULES, OVERVIEW_HELP, lessonsForModule, getLessonResult } from '@/exercises/interval-identification';
import { LessonLinkTile, ModuleCard, OverviewHelpPopover } from '@/components/lesson/LessonListParts';

export const Route = createFileRoute('/exercises/interval-identification/')({
  component: WorkshopPage,
});

function WorkshopPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <h1 className="text-2xl font-semibold">Interval Identification</h1>
          <OverviewHelpPopover ariaLabel="About Interval Identification" sections={OVERVIEW_HELP} />
        </div>
        <p className="text-muted-foreground">Hear one interval and name it.</p>
      </div>

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
                    to="/exercises/interval-identification/lesson/$lessonId"
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
