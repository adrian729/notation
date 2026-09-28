import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Check, CircleHelp, Infinity, Minus, Play, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  chromaticTokens,
  DEFAULT_OPTIONS,
  FAMILY_HELP,
  FAMILY_TITLE,
  FIRST_NOTE_HELP,
  INTERVAL_FAMILIES,
  intervalIdDisplayName,
  MODE_HELP,
  MODE_TITLE,
  normalizeOptions,
  normalizeQuestionCount,
  PLAYING_MODES,
  QUESTION_COUNT_MAX,
  QUESTION_COUNT_MIN,
  RELATIONSHIP_HELP,
  RELATIONSHIP_TITLE,
  TASK_HELP,
  TEMPO_NOTE_DURATION,
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

type SetId = 'perfect' | 'imperfect' | 'dissonant' | 'simple';
const SET_ORDER: readonly SetId[] = ['perfect', 'imperfect', 'dissonant', 'simple'];
const SET_TITLE: Record<SetId, string> = {
  perfect: FAMILY_TITLE.perfect,
  imperfect: FAMILY_TITLE.imperfect,
  dissonant: FAMILY_TITLE.dissonant,
  simple: 'All intervals',
};
const SET_HELP: Record<SetId, string> = {
  perfect: FAMILY_HELP.perfect,
  imperfect: FAMILY_HELP.imperfect,
  dissonant: FAMILY_HELP.dissonant,
  simple: FAMILY_HELP.simple,
};
const SECOND_OCTAVE_HELP =
  'Adds the same intervals one octave wider, up to two octaves: a minor 3rd also brings in the minor 10th, an octave the double octave. Wide leaps are harder to hear. Sets you pick while it is on include both octaves.';
const SECOND_OCTAVE: Partial<Record<IntervalId, IntervalId>> = Object.fromEntries(
  INTERVAL_FAMILIES.simple.map((id, i) => [id, INTERVAL_FAMILIES.compound[i]!]),
);
const COUNT_PRESETS = ['10', '20', '30', '50'] as const;
const INTERVAL_ORDER: readonly IntervalId[] = [...INTERVAL_FAMILIES.simple, ...INTERVAL_FAMILIES.compound];
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
  const countRaw = typeof search.count === 'string' || typeof search.count === 'number' ? Number(search.count) : NaN;
  const count = Number.isFinite(countRaw) ? String(normalizeQuestionCount(countRaw)) : String(DEFAULT_QUESTION_COUNT);
  return {
    intervals: typeof search.intervals === 'string' ? search.intervals : DEFAULT_OPTIONS.intervals.join(','),
    modes: typeof search.modes === 'string' ? search.modes : DEFAULT_OPTIONS.playingModes.join(','),
    rel,
    low: typeof search.low === 'string' ? search.low : DEFAULT_OPTIONS.range.low,
    high: typeof search.high === 'string' ? search.high : DEFAULT_OPTIONS.range.high,
    tempo,
    count,
    endless: String(search.endless) === '1' ? '1' : '0',
    auto: String(search.auto) === '1' ? '1' : '0',
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
  const countValue = Number(search.count);
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

  const toggleInterval = (id: IntervalId) => {
    const next = rawIntervals.includes(id) ? rawIntervals.filter((i) => i !== id) : [...rawIntervals, id];
    update({ intervals: next.join(',') });
  };

  const toggleMode = (mode: PlayingMode) => {
    const next = rawModes.includes(mode) ? rawModes.filter((m) => m !== mode) : [...rawModes, mode];
    update({ modes: next.join(',') });
  };

  const selectedIntervals = new Set(rawIntervals);
  const secondOctave = INTERVAL_FAMILIES.compound.some((id) => selectedIntervals.has(id));
  const hasFirstOctave = INTERVAL_FAMILIES.simple.some((id) => selectedIntervals.has(id));

  const setMembers = (family: SetId): IntervalId[] => {
    const firstOctave = INTERVAL_FAMILIES[family];
    return secondOctave ? [...firstOctave, ...firstOctave.map((id) => SECOND_OCTAVE[id]!)] : [...firstOctave];
  };

  const setActive = (family: SetId) => setMembers(family).every((id) => selectedIntervals.has(id));

  const commitIntervals = (selected: Set<IntervalId>) =>
    update({ intervals: INTERVAL_ORDER.filter((id) => selected.has(id)).join(',') });

  const toggleSet = (family: SetId) => {
    const next = new Set(selectedIntervals);
    const active = setActive(family);
    for (const id of setMembers(family)) {
      if (active) next.delete(id);
      else next.add(id);
    }
    commitIntervals(next);
  };

  const toggleSecondOctave = () => {
    const next = new Set(selectedIntervals);
    if (secondOctave) {
      for (const id of INTERVAL_FAMILIES.compound) next.delete(id);
    } else {
      for (const id of INTERVAL_FAMILIES.simple) if (selectedIntervals.has(id)) next.add(SECOND_OCTAVE[id]!);
    }
    commitIntervals(next);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-8">
      <div className="flex flex-col gap-3">
        <div className="-ml-2.5 flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link to="/exercises/interval-comparison">
              <ArrowLeft />
              Lessons
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw />
            Reset to defaults
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Custom exercise</h1>
          <p className="text-muted-foreground">Choose what to practise. {TASK_HELP}</p>
        </div>
      </div>

      <Section
        title="Intervals"
        description="The interval sizes that can be compared. Pick at least two, one by one or a set at a time."
        action={
          <div className="flex rounded-lg border border-border p-0.5 text-xs" role="group" aria-label="Interval names">
            {([false, true] as const).map((long) => (
              <button
                key={String(long)}
                type="button"
                aria-pressed={longNames === long}
                onClick={() => updateLongNames(long)}
                className={cn(
                  'rounded-md px-2 py-1 font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                  longNames === long ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {long ? 'Full names' : 'Short'}
              </button>
            ))}
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <SubHeading>Interval sets</SubHeading>
            <HelpPopover label="About the interval sets">
              {SET_ORDER.map((family) => (
                <HelpItem key={family} term={SET_TITLE[family]} text={SET_HELP[family]} />
              ))}
              <HelpItem term="Second octave" text={SECOND_OCTAVE_HELP} />
            </HelpPopover>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SET_ORDER.map((family) => (
              <SetChip key={family} active={setActive(family)} onClick={() => toggleSet(family)}>
                {SET_TITLE[family]}
              </SetChip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <SetChip
              active={secondOctave}
              disabled={!secondOctave && !hasFirstOctave}
              onClick={toggleSecondOctave}
            >
              <Plus className="size-3" />
              Second octave
            </SetChip>
            <span className="text-xs text-muted-foreground">The selected intervals one octave wider too</span>
          </div>
        </div>
        {(['simple', 'compound'] as const).map((group) => (
          <div key={group} className="flex flex-col gap-2">
            <SubHeading>{group === 'simple' ? 'Up to an octave' : 'Beyond an octave'}</SubHeading>
            <div className={cn('grid gap-1.5', longNames ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-4 sm:grid-cols-6')}>
              {INTERVAL_FAMILIES[group].map((id) => {
                const checked = selectedIntervals.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={checked}
                    aria-label={intervalIdDisplayName(id)}
                    onClick={() => toggleInterval(id)}
                    className={cn(
                      'rounded-lg border px-2 py-1.5 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                      checked
                        ? 'border-primary-strong bg-primary/15 font-medium text-primary-strong'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {longNames ? intervalIdDisplayName(id) : id}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">{selectedIntervals.size} selected</p>
      </Section>

      <Section title="Playing mode" description="How the two notes of each interval are played. Pick one or more; each question uses one of them at random.">
        <div className="grid gap-2 sm:grid-cols-3">
          {PLAYING_MODES.map((mode) => (
            <OptionCard
              key={mode}
              kind="checkbox"
              checked={rawModes.includes(mode)}
              title={MODE_TITLE[mode]}
              text={MODE_HELP[mode]}
              onSelect={() => toggleMode(mode)}
            />
          ))}
        </div>
      </Section>

      <Section title="Starting notes" description={`How the notes of A and B relate to each other. ${FIRST_NOTE_HELP}`}>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Starting notes">
          {TONE_RELATIONSHIPS.map((rel) => (
            <OptionCard
              key={rel}
              kind="radio"
              checked={search.rel === rel}
              title={RELATIONSHIP_TITLE[rel]}
              text={RELATIONSHIP_HELP[rel]}
              onSelect={() => update({ rel })}
            />
          ))}
        </div>
      </Section>

      <div className="grid gap-6 sm:grid-cols-2">
        <Section title="Range" description="Every note of both intervals stays between these two notes.">
          <div className="grid grid-cols-2 gap-3">
            {(['low', 'high'] as const).map((end) => (
              <div key={end} className="flex flex-col gap-1.5">
                <label id={`range-${end}`} className="text-xs font-medium text-muted-foreground">
                  {end === 'low' ? 'Lowest note' : 'Highest note'}
                </label>
                <Select value={search[end]} onValueChange={(value) => update({ [end]: value })}>
                  <SelectTrigger className="w-full" aria-labelledby={`range-${end}`}>
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
              </div>
            ))}
          </div>
        </Section>

        <Section title="Tempo" description="How long each note sounds.">
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1" role="radiogroup" aria-label="Tempo">
            {TEMPOS.map((tempo) => (
              <button
                key={tempo}
                type="button"
                role="radio"
                aria-checked={search.tempo === tempo}
                onClick={() => update({ tempo })}
                className={cn(
                  'flex flex-col items-center rounded-md px-2 py-1.5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                  search.tempo === tempo ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                <span className="text-sm font-medium">{TEMPO_TITLE[tempo]}</span>
                <span className={cn('text-xs tabular-nums', search.tempo === tempo ? 'opacity-80' : 'text-muted-foreground')}>
                  {TEMPO_NOTE_DURATION[tempo]} s
                </span>
              </button>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Questions" description="How long the session lasts and what happens after a correct answer.">
        <div className="flex flex-col gap-3">
          <SubHeading>Number of questions</SubHeading>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div
              className={cn(
                'flex h-10 items-stretch overflow-hidden rounded-lg border border-input bg-background focus-within:ring-3 focus-within:ring-ring/50',
                endless && 'opacity-50',
              )}
            >
              <button
                type="button"
                aria-label="One question fewer"
                disabled={endless || countValue <= QUESTION_COUNT_MIN}
                onClick={() => update({ count: String(normalizeQuestionCount(countValue - 1)) })}
                className="flex w-10 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <input
                id="question-count"
                type="text"
                inputMode="numeric"
                aria-label="Number of questions"
                aria-describedby="question-count-help"
                disabled={endless}
                value={endless ? '∞' : countText}
                onChange={(e) => setCountText(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={commitCount}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                className="w-14 border-x border-input bg-transparent text-center text-base font-semibold tabular-nums outline-none"
              />
              <button
                type="button"
                aria-label="One question more"
                disabled={endless || countValue >= QUESTION_COUNT_MAX}
                onClick={() => update({ count: String(normalizeQuestionCount(countValue + 1)) })}
                className="flex w-10 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Quick picks">
              {COUNT_PRESETS.map((preset) => (
                <SetChip
                  key={preset}
                  active={!endless && search.count === preset}
                  onClick={() => update({ endless: '0', count: preset })}
                >
                  {preset}
                </SetChip>
              ))}
              <span aria-hidden className="mx-1 h-5 w-px bg-border" />
              <SetChip active={endless} onClick={() => update({ endless: endless ? '0' : '1' })}>
                <Infinity className="size-3.5" />
                Endless
              </SetChip>
            </div>
          </div>
          <p id="question-count-help" className="min-h-[2lh] text-xs text-muted-foreground sm:min-h-0">
            {endless
              ? 'No question limit. Keep going until you press Finish.'
              : `The session ends after ${countValue} question${countValue === 1 ? '' : 's'} and shows your score. Any number from ${QUESTION_COUNT_MIN} to ${QUESTION_COUNT_MAX}.`}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <SubHeading>After a correct answer</SubHeading>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="After a correct answer">
            <OptionCard
              kind="radio"
              checked={search.auto !== '1'}
              title="Wait for me"
              text="Stay on the answer until you press Next question."
              onSelect={() => update({ auto: '0' })}
            />
            <OptionCard
              kind="radio"
              checked={search.auto === '1'}
              title="Continue automatically"
              text="The next question starts after a short pause. Press Stay to remain on the answer."
              onSelect={() => update({ auto: '1' })}
            />
          </div>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t bg-background/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        {validation.valid ? (
          <p className="text-sm text-muted-foreground">
            {selectedIntervals.size} intervals · {rawModes.map((m) => MODE_TITLE[m].toLowerCase()).join(', ')} ·{' '}
            {endless ? 'endless' : `${search.count} question${search.count === '1' ? '' : 's'}`}
          </p>
        ) : (
          <ul className="text-sm text-destructive" role="alert">
            {validation.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}
        <Button size="lg" className="px-6" disabled={!validation.valid} onClick={() => setRunning(true)}>
          <Play />
          Start
        </Button>
      </div>
    </div>
  );
}

const TEMPO_TITLE: Record<Tempo, string> = { slow: 'Slow', medium: 'Medium', fast: 'Fast' };

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

function SetChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        active ? 'border-primary-strong bg-primary/15 text-primary-strong' : 'border-border hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-strong">{children}</h3>;
}

function HelpPopover({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={label}>
          <CircleHelp />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 text-sm leading-relaxed">
        {children}
      </PopoverContent>
    </Popover>
  );
}

function HelpItem({ term, text }: { term: string; text: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-l-2 border-border pl-3">
      <span className="font-medium">{term}</span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}

function OptionCard({
  kind,
  checked,
  title,
  text,
  onSelect,
}: {
  kind: 'checkbox' | 'radio';
  checked: boolean;
  title: string;
  text: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role={kind}
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
        checked ? 'border-primary-strong bg-primary/10' : 'border-border hover:bg-muted',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center border transition-colors',
          kind === 'radio' ? 'rounded-full' : 'rounded-[4px]',
          checked ? 'border-primary-strong bg-primary-strong text-primary-foreground' : 'border-input bg-background',
        )}
      >
        {checked && (kind === 'radio' ? <span className="size-1.5 rounded-full bg-primary-foreground" /> : <Check className="size-3" />)}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{text}</span>
      </span>
    </button>
  );
}
