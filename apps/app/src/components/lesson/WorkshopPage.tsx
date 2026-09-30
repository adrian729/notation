import type { ReactNode } from 'react';
import { Link, type LinkProps } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { InstrumentSelect } from '@/components/custom/InstrumentSelect';
import type { HelpSection, LessonResult, OverviewSection } from '@/exercises/shared';
import { TitleText } from '@/components/Initial';
import { WorkshopAside } from './WorkshopAside';
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
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-section px-base py-loose lg:grid-cols-[15rem_minmax(0,1fr)]">
      <WorkshopAside modules={modules} />

      <div className="page-column mx-auto flex w-full max-w-3xl flex-col gap-loose">
        <div className="flex flex-col gap-tight">
          <div className="flex flex-wrap items-center justify-between gap-base">
            <div className="flex min-w-0 items-center gap-1">
              <h1 className="font-display text-title text-primary-strong">
                <TitleText title={title} />
              </h1>
              <OverviewHelpPopover ariaLabel={`About ${title}`} sections={overview} />
            </div>
            <InstrumentSelect />
          </div>
          <p className="max-w-[64ch] text-body text-muted-foreground">{blurb}</p>
        </div>

        {headerAction}

        <div className="flex flex-col gap-base">
          {modules.map((mod) => (
            <ModuleCard key={mod.id} id={mod.id} title={mod.title} help={mod.help}>
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
