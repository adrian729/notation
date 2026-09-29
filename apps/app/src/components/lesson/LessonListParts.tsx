import type { ReactNode } from 'react';
import { CircleCheck, CircleHelp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { HelpSection, LessonResult, OverviewSection } from '@/exercises/shared';

export function OverviewHelpPopover({
  ariaLabel,
  sections,
}: {
  ariaLabel: string;
  sections: readonly OverviewSection[];
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={ariaLabel}>
          <CircleHelp />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex max-h-[70vh] w-[min(28rem,calc(100vw-2rem))] flex-col overflow-y-auto text-sm leading-relaxed"
      >
        {sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-strong">{section.heading}</h3>
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
  );
}

export function ModuleHelpPopover({ ariaLabel, help }: { ariaLabel: string; help: readonly HelpSection[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={ariaLabel}>
          <CircleHelp />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-80 flex-col text-sm leading-relaxed">
        {help.map((section) => (
          <section key={section.heading} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-strong">{section.heading}</h3>
            <p>{section.text}</p>
          </section>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function ModuleCard({
  title,
  help,
  children,
}: {
  title: string;
  help: readonly HelpSection[];
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1">
          <CardTitle>{title}</CardTitle>
          <ModuleHelpPopover ariaLabel={`About ${title}`} help={help} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">{children}</CardContent>
    </Card>
  );
}

export function LessonLinkTile({
  title,
  result,
  render,
}: {
  title: string;
  result: LessonResult | undefined;
  render: (className: string, children: ReactNode) => ReactNode;
}) {
  const className = cn(
    'flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-sm',
    result?.passed ? 'border-success bg-success/25 hover:bg-success/40' : 'hover:bg-muted',
  );
  const children = (
    <>
      <span className="flex items-center gap-1.5 font-medium">
        {title}
        {result?.passed && <CircleCheck className="size-4 text-success-strong" aria-hidden />}
      </span>
      <span className={cn('text-xs', result?.passed ? 'font-medium text-success-strong' : 'text-muted-foreground')}>
        {result ? `Best: ${result.bestPercent}%${result.passed ? ' — passed' : ''}` : 'Not attempted'}
      </span>
    </>
  );
  return render(className, children);
}
