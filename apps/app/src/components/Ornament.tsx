import fleurDeLis from '@/assets/ornaments/vectorian-006.webp';
import flourishEnd from '@/assets/ornaments/vectorian-011.webp';
import flourishStart from '@/assets/ornaments/vectorian-014.webp';
import gothicLeaf from '@/assets/ornaments/vectorian-020.webp';
import crossFleury from '@/assets/ornaments/vectorian-022.webp';
import headpiece from '@/assets/ornaments/vectorian-058.webp';
import tailpiece from '@/assets/ornaments/vectorian-066.webp';
import { cn } from '@/lib/utils';

const ORNAMENTS = {
  'fleur-de-lis': fleurDeLis,
  'gothic-leaf': gothicLeaf,
  'cross-fleury': crossFleury,
  'flourish-start': flourishStart,
  'flourish-end': flourishEnd,
  headpiece,
  tailpiece,
} as const;

export type OrnamentName = keyof typeof ORNAMENTS;

export function Ornament({ name, className }: { name: OrnamentName; className?: string }) {
  const mask = `url(${ORNAMENTS[name]})`;
  return (
    <span aria-hidden="true" className={cn('ornament', className)} style={{ maskImage: mask, WebkitMaskImage: mask }} />
  );
}

export function OrnamentRule({ name, className }: { name: OrnamentName; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center gap-base text-primary-strong', className)}>
      <span className="h-px flex-1 bg-current opacity-80" />
      <Ornament name={name} className="size-7" />
      <span className="h-px flex-1 bg-current opacity-80" />
    </div>
  );
}

export function FlourishRule({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex h-6 items-center text-primary-strong', className)}>
      <Ornament name="flourish-start" className="h-full w-11" />
      <span className="h-px flex-1 bg-current" />
      <Ornament name="flourish-end" className="h-full w-11" />
    </div>
  );
}
