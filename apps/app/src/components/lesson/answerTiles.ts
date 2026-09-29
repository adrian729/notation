import { cn } from '@/lib/utils';

export function answerTileClass(state: 'idle' | 'correct' | 'wrong' | 'other'): string {
  return cn(
    'outline-none transition-colors duration-fast focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
    state === 'idle' && 'border-border bg-card text-card-foreground hover:bg-muted',
    state === 'correct' && 'border-success-strong bg-success/12 text-success-strong',
    state === 'wrong' && 'border-destructive bg-destructive/10 text-destructive',
    state === 'other' && 'border-border bg-card text-muted-foreground opacity-70',
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
