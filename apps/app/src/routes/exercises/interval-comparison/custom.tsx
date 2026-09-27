import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  chromaticTokens,
  DEFAULT_OPTIONS,
  INTERVAL_FAMILIES,
  normalizeOptions,
  PLAYING_MODES,
  QUESTION_COUNTS,
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

export interface CustomSearch {
  intervals: string;
  modes: string;
  rel: ToneRelationship;
  low: string;
  high: string;
  tempo: Tempo;
  count: string;
  auto: '0' | '1';
}

function toRawOptions(search: CustomSearch): Partial<ExerciseOptions> {
  return {
    intervals: search.intervals.split(',').filter(Boolean) as IntervalId[],
    playingModes: search.modes.split(',').filter(Boolean) as PlayingMode[],
    toneRelationship: search.rel,
    range: { low: search.low, high: search.high },
    tempo: search.tempo,
    questionCount: (search.count === 'endless' ? 'endless' : Number(search.count)) as QuestionCount,
    autoNext: search.auto === '1',
  };
}

export const Route = createFileRoute('/exercises/interval-comparison/custom')({
  component: CustomPage,
  validateSearch: (search: Record<string, unknown>): CustomSearch => ({
    intervals: typeof search.intervals === 'string' ? search.intervals : DEFAULT_OPTIONS.intervals.join(','),
    modes: typeof search.modes === 'string' ? search.modes : DEFAULT_OPTIONS.playingModes.join(','),
    rel: (typeof search.rel === 'string' ? search.rel : DEFAULT_OPTIONS.toneRelationship) as ToneRelationship,
    low: typeof search.low === 'string' ? search.low : DEFAULT_OPTIONS.range.low,
    high: typeof search.high === 'string' ? search.high : DEFAULT_OPTIONS.range.high,
    tempo: (typeof search.tempo === 'string' ? search.tempo : DEFAULT_OPTIONS.tempo) as Tempo,
    count: typeof search.count === 'string' ? search.count : String(DEFAULT_OPTIONS.questionCount),
    auto: search.auto === '1' ? '1' : '0',
  }),
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
  const raw = toRawOptions(search);
  const validation = validateExerciseOptions(raw);
  const rawIntervals = raw.intervals ?? [];
  const rawModes = raw.playingModes ?? [];

  const update = (patch: Partial<CustomSearch>) => {
    void navigate({
      to: '/exercises/interval-comparison/custom',
      search: { ...search, ...patch },
      replace: true,
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
      <h1 className="text-2xl font-semibold">Custom exercise</h1>

      <Card>
        <CardHeader>
          <CardTitle>Intervals</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ALL_INTERVALS.map((id) => {
            const checked = rawIntervals.includes(id);
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
                {id}
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
            <select
              className="rounded-md border px-2 py-1"
              value={search.low}
              onChange={(e) => update({ low: e.target.value })}
            >
              {RANGE_TOKENS.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            High
            <select
              className="rounded-md border px-2 py-1"
              value={search.high}
              onChange={(e) => update({ high: e.target.value })}
            >
              {RANGE_TOKENS.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
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
        <CardContent className="flex flex-wrap items-center gap-3">
          {QUESTION_COUNTS.map((count) => (
            <label key={String(count)} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="count"
                checked={search.count === String(count)}
                onChange={() => update({ count: String(count) })}
              />
              {count}
            </label>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={search.auto === '1'}
              onChange={(e) => update({ auto: e.target.checked ? '1' : '0' })}
            />
            Auto new question after correct answer
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
