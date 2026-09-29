import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cn, typeScale } from '@/lib/utils';

const THEME = fileURLToPath(new URL('../src/styles/theme.css', import.meta.url));

function themeTypeTokens(): string[] {
  const css = readFileSync(THEME, 'utf8');
  return [...css.matchAll(/^\s*--text-([a-z0-9]+(?:-[a-z0-9]+)*)\s*:/gm)].map((m) => m[1]);
}

describe('cn type scale', () => {
  it('knows every --text-* size token declared in theme.css', () => {
    expect([...themeTypeTokens()].sort()).toEqual([...typeScale].sort());
  });

  it('keeps a text color when a type scale size is merged after it', () => {
    expect(cn('bg-primary text-primary-foreground text-meta')).toContain('text-primary-foreground');
    expect(cn('bg-card text-card-foreground text-body')).toContain('text-card-foreground');
    expect(cn('bg-muted text-muted-foreground text-heading')).toContain('text-muted-foreground');
  });

  it('still resolves same-group conflicts in both directions', () => {
    expect(cn('text-sm text-meta')).toBe('text-meta');
    expect(cn('text-muted-foreground text-foreground')).toBe('text-foreground');
  });
});
