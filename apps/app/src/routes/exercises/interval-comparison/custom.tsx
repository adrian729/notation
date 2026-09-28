import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  chromaticTokens,
  DEFAULT_OPTIONS,
  INTERVAL_FAMILIES,
  intervalIdDisplayName,
  normalizeOptions,
  normalizeQuestionCount,
  PLAYING_MODES,
  QUESTION_COUNT_MAX,
  QUESTION_COUNT_MIN,
  TEMPOS,
  TONE_RELATIONSHIPS,
  tokenMidi,
  validateExerciseOptions,
  type ExerciseOptions,
  type IntervalId,
  type PlayingMode,
  type QuestionCount,
  type Tempo,
  type ToneRelationship,
} from '@/exercises/interval-comparison';
import { Runner } from './-Runner';

const ALL_INTERVALS = [...new Set(Object.values(INTERVAL_FAMILIES).flat())] as IntervalId[];
const RANGE_TOKENS = chromaticTokens(tokenMidi('E2')!, tokenMidi('C7')!);
const CUSTOM_PREFS_KEY = 'polyhymnia:e1:customOptions';

export interface CustomSearch {
  intervals: string;
  modes: string;
  rel: ToneRelationship;
  low: string;
  high: string;
  tempo: Tempo;
  count: string;
  endless: '0' | '1';
  auto: '0' | '1';
}

const DEFAULT_QUESTION_COUNT = DEFAULT_OPTIONS.questionCount === 'endless' ? 10 : DEFAULT_OPTIONS.questionCount;

export function parseCustomSearch(search: Record<string, unknown>): CustomSearch {
  const rel =
    typeof search.rel === 'string' && (TONE_RELATIONSHIPS as readonly string[]).includes(search.rel)
      ? (search.rel as ToneRelationship)
      : DEFAULT_OPTIONS.toneRelationship;
  const tempo =
    typeof search.tempo === 'string' && (TEMPOS as readonly string[]).includes(search.tempo)
      ? (search.tempo as Tempo)
      : DEFAULT_OPTIONS.tempo;
  const countRaw = typeof search.count === 'string' ? Number(search.count) : NaN;
  const count = Number.isFinite(countRaw) ? String(normalizeQuestionCount(countRaw)) : String(DEFAULT_QUESTION_COUNT);
  return {
    intervals: typeof search.intervals === 'string' ? search.intervals : DEFAULT_OPTIONS.intervals.join(','),
    modes: typeof search.modes === 'string' ? search.modes : DEFAULT_OPTIONS.playingModes.join(','),
    rel,
    low: typeof search.low === 'string' ? search.low : DEFAULT_OPTIONS.range.low,
    high: typeof search.high === 'string' ? search.high : DEFAULT_OPTIONS.range.high,
    tempo,
    count,
    endless: search.endless === '1' ? '1' : '0',
    auto: search.auto === '1' ? '1' : '0',
  };
}

const DEFAULT_SEARCH = parseCustomSearch({});

function toRawOptions(search: CustomSearch): Partial<ExerciseOptions> {
  return {
    intervals: search.intervals.split(',').filter(Boolean) as IntervalId[],
    playingModes: search.modes.split(',').filter(Boolean) as PlayingMode[],
    toneRelationship: search.rel,
    range: { low: search.low, high: search.high },
    tempo: search.tempo,
    questionCount: (search.endless === '1' ? 'endless' : Number(search.count)) as QuestionCount,
    autoNext: search.auto === '1',
  };
}

interface StoredCustomPrefs {
  search: CustomSearch;
  longNames: boolean;
}

function loadStoredCustomPrefs(): StoredCustomPrefs | undefined {
  try {
    const raw = globalThis.localStorage?.getItem(CUSTOM_PREFS_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { search?: unknown; longNames?: unknown };
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    const search = parseCustomSearch(
      typeof parsed.search === 'object' && parsed.search !== null
        ? (parsed.search as Record<string, unknown>)
        : {},
    );
    const longNames = typeof parsed.longNames === 'boolean' ? parsed.longNames : true;
    return { search, longNames };
  } catch {
    return undefined;
  }
}

function persistCustomPrefs(search: CustomSearch, longNames: boolean): void {
  try {
    globalThis.localStorage?.setItem(CUSTOM_PREFS_KEY, JSON.stringify({ search, longNames }));
  } catch {
    return;
  }
}

export const Route = createFileRoute('/exercises/interval-comparison/custom')({
  component: CustomPage,
  validateSearch: parseCustomSearch,
  errorComponent: CustomErrorFallback,
});

function CustomErrorFallback() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <p>Something went wrong setting up this exercise.</p>
      <Button asChild>
        <Link to="/exercises/interval-comparison">Back to lessons</Link>
      </Button>
    </div>
  );
}

function CustomPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [longNames, setLongNames] = useState(true);
  const [countText, setCountText] = useState(search.count);
  const initialSearchRef = useRef(search);
  const raw = toRawOptions(search);
  const validation = validateExerciseOptions(raw);
  const rawIntervals = raw.intervals ?? [];
  const rawModes = raw.playingModes ?? [];
  const endless = search.endless === '1';

  useEffect(() => {
    const isDefaultSearch = JSON.stringify(initialSearchRef.current) === JSON.stringify(DEFAULT_SEARCH);
    if (!isDefaultSearch) return;
    const saved = loadStoredCustomPrefs();
    if (!saved) return;
    setLongNames(saved.longNames);
    void navigate({
      to: '/exercises/interval-comparison/custom',
      search: saved.search,
      replace: true,
      resetScroll: false,
    });
  }, []);

  const update = (patch: Partial<CustomSearch>) => {
    const next = { ...search, ...patch };
    persistCustomPrefs(next, longNames);
    void navigate({
      to: '/exercises/interval-comparison/custom',
      search: next,
      replace: true,
      resetScroll: false,
    });
  };

  const updateLongNames = (value: boolean) => {
    setLongNames(value);
    persistCustomPrefs(search, value);
  };

  useEffect(() => {
    setCountText(search.count);
  }, [search.count]);

  const commitCount = () => {
    const n = Number(countText);
    const next = Number.isFinite(n) ? String(normalizeQuestionCount(n)) : search.count;
    setCountText(next);
    if (next !== search.count) update({ count: next });
  };

  const handleReset = () => {
    persistCustomPrefs(DEFAULT_SEARCH, true);
    setLongNames(true);
    void navigate({
      to: '/exercises/interval-comparison/custom',
      search: DEFAULT_SEARCH,
      replace: true,
      resetScroll: false,
    });
  };

  if (running) {
    return (
      <Runner
        options={normalizeOptions(raw)}
        title="Custom exercise"
        onBack={() => setRunning(false)}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Custom exercise</h1>
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset to defaults
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Intervals</CardTitle>
          <div className="flex overflow-hidden rounded-md border border-border text-sm">
            <button
              type="button"
              className={cn(
                'px-2 py-1 transition-colors',
                !longNames ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
              aria-pressed={!longNames}
              onClick={() => updateLongNames(false)}
            >
              Short
            </button>
            <button
              type="button"
              className={cn(
                'px-2 py-1 transition-colors',
                longNames ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
              aria-pressed={longNames}
              onClick={() => updateLongNames(true)}
            >
              Long
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ALL_INTERVALS.map((id) => {
            const checked = rawIntervals.includes(id);
            const label = longNames ? `${intervalIdDisplayName(id)} (${id})` : id;
            return (
              <label
                key={id}
                className={cn(
                  'cursor-pointer rounded-md border px-2 py-1 text-sm',
                  checked ? 'border-primary-strong bg-primary/10' : 'border-border',
                )}
              >
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...rawIntervals, id]
                      : rawIntervals.filter((i) => i !== id);
                    update({ intervals: next.join(',') });
                  }}
                />
                {label}
              </label>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Playing mode</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {PLAYING_MODES.map((mode) => {
            const checked = rawModes.includes(mode);
            return (
              <label key={mode} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked ? [...rawModes, mode] : rawModes.filter((m) => m !== mode);
                    update({ modes: next.join(',') });
                  }}
                />
                {mode}
              </label>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tone relationship</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {TONE_RELATIONSHIPS.map((rel) => (
            <label key={rel} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="rel"
                checked={search.rel === rel}
                onChange={() => update({ rel })}
              />
              {rel}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Range</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            Low
            <Select value={search.low} onValueChange={(low) => update({ low })}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_TOKENS.map((token) => (
                  <SelectItem key={token} value={token}>
                    {token}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            High
            <Select value={search.high} onValueChange={(high) => update({ high })}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_TOKENS.map((token) => (
                  <SelectItem key={token} value={token}>
                    {token}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tempo</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          {TEMPOS.map((tempo) => (
            <label key={tempo} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="tempo"
                checked={search.tempo === tempo}
                onChange={() => update({ tempo })}
              />
              {tempo}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col items-start gap-2">
            <label htmlFor="question-count" className="text-sm font-medium">
              Number of questions
            </label>
            <Input
              id="question-count"
              type="number"
              inputMode="numeric"
              min={QUESTION_COUNT_MIN}
              max={QUESTION_COUNT_MAX}
              value={countText}
              disabled={endless}
              className="h-10 w-32 bg-background text-center text-lg font-semibold tabular-nums"
              onChange={(e) => setCountText(e.target.value)}
              onBlur={commitCount}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
            />
            <div className="flex gap-1.5" role="group" aria-label="Adjust number of questions">
              {[-10, -1, 1, 10].map((step) => (
                <Button
                  key={step}
                  type="button"
                  variant="secondary"
                  size="xs"
                  className="min-w-10 rounded-full tabular-nums"
                  disabled={endless}
                  aria-label={`${step > 0 ? 'Add' : 'Remove'} ${Math.abs(step)} question${Math.abs(step) === 1 ? '' : 's'}`}
                  onClick={() => update({ count: String(normalizeQuestionCount(Number(search.count) + step)) })}
                >
                  {step > 0 ? `+${step}` : `−${Math.abs(step)}`}
                </Button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={endless}
              onCheckedChange={(checked) => update({ endless: checked === true ? '1' : '0' })}
            />
            Endless
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={search.auto === '1'}
              onCheckedChange={(checked) => update({ auto: checked === true ? '1' : '0' })}
            />
            Auto new question after a correct answer
          </label>
        </CardContent>
      </Card>

      {!validation.valid && (
        <ul className="text-sm text-destructive">
          {validation.errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      <Button disabled={!validation.valid} onClick={() => setRunning(true)}>
        Start
      </Button>
    </div>
  );
}
