import { cn } from '@/lib/utils';

export function answerTileClass(state: 'idle' | 'correct' | 'wrong' | 'other'): string {
  return cn(
    'outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
    state === 'idle' && 'border-border bg-card hover:bg-muted',
    state === 'correct' && 'border-success bg-success text-success-foreground',
    state === 'wrong' && 'border-destructive bg-destructive/20 text-destructive',
    state === 'other' && 'border-border bg-card opacity-60',
  );
}

export function answerTileState<A>(
  choice: A,
  correct: A,
  selected: A | null,
  answered: boolean,
): 'idle' | 'correct' | 'wrong' | 'other' {
  if (!answered) return 'idle';
  if (choice === correct) return 'correct';
  if (choice === selected) return 'wrong';
  return 'other';
}
