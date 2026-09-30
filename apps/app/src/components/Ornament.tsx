import type { ReactNode } from 'react';
import fleurDeLis from '@/assets/ornaments/vectorian-006.webp';
import barSprig from '@/assets/ornaments/vectorian-010.webp';
import flourishEnd from '@/assets/ornaments/vectorian-011.webp';
import flourishStart from '@/assets/ornaments/vectorian-014.webp';
import barCap from '@/assets/ornaments/vectorian-019.webp';
import gothicLeaf from '@/assets/ornaments/vectorian-020.webp';
import crossFleury from '@/assets/ornaments/vectorian-022.webp';
import headpiece from '@/assets/ornaments/vectorian-058.webp';
import leafCornerTl from '@/assets/ornaments/vectorian-063-tl.webp';
import leafCornerTr from '@/assets/ornaments/vectorian-063-tr.webp';
import leafCornerBl from '@/assets/ornaments/vectorian-063-bl.webp';
import leafCornerBr from '@/assets/ornaments/vectorian-063-br.webp';
import tailpiece from '@/assets/ornaments/vectorian-066.webp';
import runningVine from '@/assets/ornaments/vectorian-070.webp';
import acanthusT from '@/assets/ornaments/vectorian-frame-acanthus-t.webp';
import acanthusB from '@/assets/ornaments/vectorian-frame-acanthus-b.webp';
import acanthusL from '@/assets/ornaments/vectorian-frame-acanthus-l.webp';
import acanthusR from '@/assets/ornaments/vectorian-frame-acanthus-r.webp';
import acanthusTl from '@/assets/ornaments/vectorian-frame-acanthus-tl.webp';
import acanthusTr from '@/assets/ornaments/vectorian-frame-acanthus-tr.webp';
import acanthusBl from '@/assets/ornaments/vectorian-frame-acanthus-bl.webp';
import acanthusBr from '@/assets/ornaments/vectorian-frame-acanthus-br.webp';
import { cn } from '@/lib/utils';

const ORNAMENTS = {
  'fleur-de-lis': fleurDeLis,
  'gothic-leaf': gothicLeaf,
  'cross-fleury': crossFleury,
  'flourish-start': flourishStart,
  'flourish-end': flourishEnd,
  'running-vine': runningVine,
  'bar-cap': barCap,
  'bar-sprig': barSprig,
  'acanthus-t': acanthusT,
  'acanthus-b': acanthusB,
  'acanthus-l': acanthusL,
  'acanthus-r': acanthusR,
  'acanthus-tl': acanthusTl,
  'acanthus-tr': acanthusTr,
  'acanthus-bl': acanthusBl,
  'acanthus-br': acanthusBr,
  'leaf-tl': leafCornerTl,
  'leaf-tr': leafCornerTr,
  'leaf-bl': leafCornerBl,
  'leaf-br': leafCornerBr,
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

export function BarBorder({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bar-frame', className)}>
      <span aria-hidden="true" className="bar" />
      <Ornament name="bar-cap" className="bar-cap bar-cap-top" />
      <Ornament name="bar-sprig" className="bar-sprig" />
      <Ornament name="bar-cap" className="bar-cap bar-cap-bottom" />
      <div className="bar-text">{children}</div>
    </div>
  );
}

export interface FrameCorners {
  tl: OrnamentName;
  tr: OrnamentName;
  bl: OrnamentName;
  br: OrnamentName;
}

export interface FrameSpec {
  top: OrnamentName;
  bottom: OrnamentName;
  left: OrnamentName;
  right: OrnamentName;
  corners: FrameCorners;
  inner?: FrameCorners;
}

export function FrameBorder({
  frame,
  children,
  className,
}: {
  frame: FrameSpec;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('frame-frame', className)}>
      <Ornament name={frame.top} className="frame-piece frame-piece-t" />
      <Ornament name={frame.bottom} className="frame-piece frame-piece-b" />
      <Ornament name={frame.left} className="frame-piece frame-piece-l" />
      <Ornament name={frame.right} className="frame-piece frame-piece-r" />
      <Ornament name={frame.corners.tl} className="frame-corner frame-corner-tl" />
      <Ornament name={frame.corners.tr} className="frame-corner frame-corner-tr" />
      <Ornament name={frame.corners.bl} className="frame-corner frame-corner-bl" />
      <Ornament name={frame.corners.br} className="frame-corner frame-corner-br" />
      {frame.inner ? (
        <>
          <Ornament name={frame.inner.tl} className="frame-corner frame-corner-inner frame-inner-tl" />
          <Ornament name={frame.inner.tr} className="frame-corner frame-corner-inner frame-inner-tr" />
          <Ornament name={frame.inner.bl} className="frame-corner frame-corner-inner frame-inner-bl" />
          <Ornament name={frame.inner.br} className="frame-corner frame-corner-inner frame-inner-br" />
        </>
      ) : null}
      {children}
    </div>
  );
}
