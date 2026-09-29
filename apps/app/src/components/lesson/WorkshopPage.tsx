import type { ReactNode } from 'react';
import { Link, type LinkProps } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import type { HelpSection, LessonResult, OverviewSection } from '@/exercises/shared';
import { LessonLinkTile, ModuleCard, OverviewHelpPopover } from './LessonListParts';

export function WorkshopPage({
  title,
  blurb,
  overview,
  modules,
  lessonsForModule,
  getLessonResult,
  renderLessonLink,
  headerAction,
}: {
  title: string;
  blurb: string;
  overview: readonly OverviewSection[];
  modules: readonly { id: string; title: string; help: readonly HelpSection[] }[];
  lessonsForModule: (moduleId: string) => readonly { id: string; title: string }[];
  getLessonResult: (lessonId: string) => LessonResult | undefined;
  renderLessonLink: (lessonId: string, className: string, children: ReactNode) => ReactNode;
  headerAction?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <OverviewHelpPopover ariaLabel={`About ${title}`} sections={overview} />
        </div>
        <p className="text-muted-foreground">{blurb}</p>
      </div>

      {headerAction}

      <div className="flex flex-col gap-4">
        {modules.map((mod) => (
          <ModuleCard key={mod.id} title={mod.title} help={mod.help}>
            {lessonsForModule(mod.id).map((lesson) => (
              <LessonLinkTile
                key={lesson.id}
                title={lesson.title}
                result={getLessonResult(lesson.id)}
                render={(className, children) => renderLessonLink(lesson.id, className, children)}
              />
            ))}
          </ModuleCard>
        ))}
      </div>
    </div>
  );
}

export function LessonNotFound({ backTo }: { backTo: LinkProps['to'] }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <p>Lesson not found.</p>
      <Button asChild>
        <Link to={backTo}>Back to lessons</Link>
      </Button>
    </div>
  );
}
