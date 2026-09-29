import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function RevealStaff({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex aspect-[65/14] min-h-0 w-full max-w-[30rem] flex-col [&_.pn-notation]:h-auto', className)}>
      {children}
    </div>
  );
}
