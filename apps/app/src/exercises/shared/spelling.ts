import {
  intervalBetween,
  intervalDisplayName,
  parsePitch,
  pitchClass as pitchClassOf,
  PREFERRED_ROOT_PITCHES,
  type SpelledPitch,
} from '@polyhymnia/music-theory';

export function writtenIntervalName(lowerToken: string, upperToken: string): string {
  const { degree, quality } = intervalBetween(parsePitch(lowerToken), parsePitch(upperToken));
  return intervalDisplayName(degree, quality);
}

export function pickPreferredRoot(pitchClass: number, octave: number, rng: () => number): SpelledPitch {
  const options = PREFERRED_ROOT_PITCHES.filter((p) => pitchClassOf(p) === pitchClass);
  const chosen = options[Math.floor(rng() * options.length)] ?? PREFERRED_ROOT_PITCHES[0]!;
  return { ...chosen, octave };
}
