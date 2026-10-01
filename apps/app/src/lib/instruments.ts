import type { Sample } from '@polyhymnia/audio/sampler';
import { midiOf } from '@polyhymnia/music-theory';

export const INSTRUMENTS = [
  { id: 'synth', label: 'Synth' },
  { id: 'piano', label: 'Piano' },
  { id: 'guitar', label: 'Guitar' },
  { id: 'cello', label: 'Cello' },
  { id: 'clarinet', label: 'Clarinet' },
] as const;

export type InstrumentId = (typeof INSTRUMENTS)[number]['id'];
export type SampledInstrumentId = Exclude<InstrumentId, 'synth'>;

const E2 = midiOf('E2');
const C6 = midiOf('C6');
const C7 = midiOf('C7');
const NOTE_NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

const SAMPLED_MIDI: Record<SampledInstrumentId, readonly number[]> = {
  guitar: [...range(E2, midiOf('B4')), ...['D5', 'D#5', 'E5', 'G5', 'G#5', 'C6'].map(midiOf)],
  cello: range(E2, C6),
  clarinet: range(E2, C7),
  piano: range(midiOf('D#2'), C7).filter((midi) => (midi - midiOf('D#2')) % 3 === 0),
};

export function isInstrumentId(value: unknown): value is InstrumentId {
  return INSTRUMENTS.some((instrument) => instrument.id === value);
}

export function sampleList(id: SampledInstrumentId): Sample[] {
  return SAMPLED_MIDI[id].map((midi) => ({
    midi,
    url: `${import.meta.env.BASE_URL}samples/${id}/${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}.mp3`,
  }));
}
