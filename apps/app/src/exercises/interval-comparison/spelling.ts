import { parsePitch } from '@polyhymnia/notation-model';

export interface SpelledPitch {
  step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
  alter: number;
  octave: number;
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const NATURAL_SEMITONE: Record<(typeof LETTERS)[number], number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

const ACCIDENTAL_TOKEN: Record<number, string> = {
  '-2': 'bb', '-1': 'b', '0': '', '1': '#', '2': '##',
};

export const PREFERRED_ROOT_PITCHES: readonly SpelledPitch[] = [
  { step: 'C', alter: 0, octave: 0 },
  { step: 'C', alter: 1, octave: 0 },
  { step: 'D', alter: 0, octave: 0 },
  { step: 'E', alter: -1, octave: 0 },
  { step: 'E', alter: 0, octave: 0 },
  { step: 'F', alter: 0, octave: 0 },
  { step: 'F', alter: 1, octave: 0 },
  { step: 'G', alter: 0, octave: 0 },
  { step: 'A', alter: -1, octave: 0 },
  { step: 'A', alter: 0, octave: 0 },
  { step: 'B', alter: -1, octave: 0 },
  { step: 'B', alter: 0, octave: 0 },
];

const ENHARMONIC_ALTERNATE: Partial<Record<string, { step: SpelledPitch['step']; alter: number }>> = {
  'C#': { step: 'D', alter: -1 },
  'D#': { step: 'E', alter: -1 },
  'F#': { step: 'G', alter: -1 },
  'G#': { step: 'A', alter: -1 },
  'A#': { step: 'B', alter: -1 },
  Db: { step: 'C', alter: 1 },
  Eb: { step: 'D', alter: 1 },
  Gb: { step: 'F', alter: 1 },
  Ab: { step: 'G', alter: 1 },
  Bb: { step: 'A', alter: 1 },
};

function letterIndex(step: SpelledPitch['step']): number {
  return LETTERS.indexOf(step);
}

export function pitchToToken(pitch: SpelledPitch): string {
  const acc = ACCIDENTAL_TOKEN[pitch.alter];
  if (acc === undefined) throw new RangeError(`unrepresentable accidental: ${pitch.alter}`);
  return `${pitch.step}${acc}${pitch.octave}`;
}

export function pitchMidi(pitch: SpelledPitch): number {
  return 12 * (pitch.octave + 1) + NATURAL_SEMITONE[pitch.step] + pitch.alter;
}

export function tokenMidi(token: string): number | undefined {
  try {
    const p = parsePitch(token);
    return pitchMidi({ step: p.step, alter: p.alter ?? 0, octave: p.octave });
  } catch {
    return undefined;
  }
}

export function chromaticTokens(lowMidi: number, highMidi: number): string[] {
  const tokens: string[] = [];
  for (let midi = lowMidi; midi <= highMidi; midi++) {
    const pitchClass = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    tokens.push(pitchToToken({ ...PREFERRED_ROOT_PITCHES[pitchClass]!, octave }));
  }
  return tokens;
}

export function enharmonicAlternate(pitch: SpelledPitch): SpelledPitch | undefined {
  const key = `${pitch.step}${pitch.alter === 1 ? '#' : pitch.alter === -1 ? 'b' : ''}`;
  const alt = ENHARMONIC_ALTERNATE[key];
  if (!alt || pitch.alter === 0) return undefined;
  const rootMidi = pitchMidi(pitch);
  const naturalMidi = 12 * (pitch.octave + 1) + NATURAL_SEMITONE[alt.step] + alt.alter;
  const octaveShift = Math.round((rootMidi - naturalMidi) / 12);
  return { step: alt.step, alter: alt.alter, octave: pitch.octave + octaveShift };
}

function spellAtDegree(root: SpelledPitch, degree: number, semitones: number, direction: 1 | -1): SpelledPitch {
  const letterSteps = (degree - 1) * direction;
  const rootLI = letterIndex(root.step);
  const rawLI = rootLI + letterSteps;
  const targetLI = ((rawLI % 7) + 7) % 7;
  const octaveAdd = Math.floor(rawLI / 7);
  const targetLetter = LETTERS[targetLI]!;
  const targetOctave = root.octave + octaveAdd;
  const rootMidi = pitchMidi(root);
  const targetMidi = rootMidi + semitones * direction;
  const targetNatural = 12 * (targetOctave + 1) + NATURAL_SEMITONE[targetLetter];
  const alter = targetMidi - targetNatural;
  return { step: targetLetter, alter, octave: targetOctave };
}

export interface SpellIntervalResult {
  root: SpelledPitch;
  other: SpelledPitch;
  degree: number;
}

export function spellInterval(
  root: SpelledPitch,
  degreeOptions: readonly number[],
  semitones: number,
  direction: 1 | -1,
): SpellIntervalResult {
  const rootCandidates = [root, enharmonicAlternate(root)].filter((p): p is SpelledPitch => p !== undefined);
  let best: SpellIntervalResult | undefined;
  let bestScore = Infinity;
  for (const rootCandidate of rootCandidates) {
    for (const degree of degreeOptions) {
      const other = spellAtDegree(rootCandidate, degree, semitones, direction);
      const score = Math.abs(other.alter) + Math.abs(rootCandidate.alter) * 0.01;
      if (Math.abs(other.alter) <= 2 && score < bestScore) {
        bestScore = score;
        best = { root: rootCandidate, other, degree };
      }
    }
  }
  if (!best) throw new RangeError('could not spell interval without a double accidental');
  return best;
}

interface DegreeMatch {
  computed: SpelledPitch;
  degree: number;
}

function bestDegreeFor(
  pinned: SpelledPitch,
  pinnedRole: 'root' | 'other',
  degreeOptions: readonly number[],
  semitones: number,
  direction: 1 | -1,
  maxAlter: number,
): DegreeMatch | undefined {
  const effectiveDirection = pinnedRole === 'root' ? direction : ((-direction) as 1 | -1);
  let best: DegreeMatch | undefined;
  let bestAbs = Infinity;
  for (const degree of degreeOptions) {
    const computed = spellAtDegree(pinned, degree, semitones, effectiveDirection);
    if (Math.abs(computed.alter) <= maxAlter && Math.abs(computed.alter) < bestAbs) {
      bestAbs = Math.abs(computed.alter);
      best = { computed, degree };
    }
  }
  return best;
}

export interface IntervalSpec {
  degreeOptions: readonly number[];
  semitones: number;
}

export interface SharedPairResult {
  pinned: SpelledPitch;
  a: DegreeMatch;
  b: DegreeMatch;
}

export function spellSharedPair(
  pinned: SpelledPitch,
  pinnedRole: 'root' | 'other',
  specA: IntervalSpec,
  specB: IntervalSpec,
  direction: 1 | -1,
): SharedPairResult | undefined {
  const candidates = [pinned, enharmonicAlternate(pinned)].filter((p): p is SpelledPitch => p !== undefined);
  let best: SharedPairResult | undefined;
  let bestCost = Infinity;
  for (const candidate of candidates) {
    const a = bestDegreeFor(candidate, pinnedRole, specA.degreeOptions, specA.semitones, direction, 1);
    const b = a && bestDegreeFor(candidate, pinnedRole, specB.degreeOptions, specB.semitones, direction, 1);
    if (a && b) {
      const cost = Math.abs(a.computed.alter) + Math.abs(b.computed.alter) + Math.abs(candidate.alter) * 0.01;
      if (cost < bestCost) {
        bestCost = cost;
        best = { pinned: candidate, a, b };
      }
    }
  }
  return best;
}

export function qualityForIntervalId(id: string, degree: number): 'm' | 'M' | 'P' | 'A' | 'd' {
  if (id === 'TT') return degree === 4 ? 'A' : 'd';
  if (id === 'A11') return degree === 11 ? 'A' : 'd';
  const letter = id[0]!;
  return letter as 'm' | 'M' | 'P';
}

export function pickPreferredRoot(pitchClass: number, octave: number, rng: () => number): SpelledPitch {
  const options = PREFERRED_ROOT_PITCHES.filter((p) => ((pitchMidi(p) % 12) + 12) % 12 === pitchClass);
  const chosen = options[Math.floor(rng() * options.length)] ?? PREFERRED_ROOT_PITCHES[0]!;
  return { ...chosen, octave };
}
