import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelpItem, HelpPopover, Section, SetChip, SubHeading } from '@/components/custom/CustomParts';
import {
  FAMILY_HELP,
  FAMILY_TITLE,
  INTERVAL_FAMILIES,
  intervalById,
  intervalBySemitones,
  intervalIdDisplayName,
  type IntervalId,
} from '@/exercises/shared';

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
  INTERVAL_FAMILIES.simple.map((id) => [id, intervalBySemitones(intervalById(id).semitones + 12).id]),
);
const INTERVAL_ORDER: readonly IntervalId[] = [...INTERVAL_FAMILIES.simple, ...INTERVAL_FAMILIES.compound];

export function IntervalPicker({
  description,
  selected,
  onChange,
  longNames,
  onLongNamesChange,
}: {
  description: string;
  selected: readonly IntervalId[];
  onChange: (intervals: IntervalId[]) => void;
  longNames: boolean;
  onLongNamesChange: (long: boolean) => void;
}) {
  const selectedIntervals = new Set(selected);
  const secondOctave = INTERVAL_FAMILIES.compound.some((id) => selectedIntervals.has(id));
  const hasFirstOctave = INTERVAL_FAMILIES.simple.some((id) => selectedIntervals.has(id));

  const setMembers = (family: SetId): IntervalId[] => {
    const firstOctave = INTERVAL_FAMILIES[family];
    return secondOctave ? [...firstOctave, ...firstOctave.map((id) => SECOND_OCTAVE[id]!)] : [...firstOctave];
  };

  const setActive = (family: SetId) => setMembers(family).every((id) => selectedIntervals.has(id));

  const commitIntervals = (next: Set<IntervalId>) => onChange(INTERVAL_ORDER.filter((id) => next.has(id)));

  const toggleInterval = (id: IntervalId) => {
    const next = new Set(selectedIntervals);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    commitIntervals(next);
  };

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
    <Section
      title="Intervals"
      description={description}
      action={
        <div className="flex rounded-lg border border-border p-0.5 text-xs" role="group" aria-label="Interval names">
          {([false, true] as const).map((long) => (
            <button
              key={String(long)}
              type="button"
              aria-pressed={longNames === long}
              onClick={() => onLongNamesChange(long)}
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
          <SetChip active={secondOctave} disabled={!secondOctave && !hasFirstOctave} onClick={toggleSecondOctave}>
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
  );
}
