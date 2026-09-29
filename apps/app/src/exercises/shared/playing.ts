export type PlayingMode = 'asc' | 'desc' | 'harmonic';
export interface RangeOption {
  low: string;
  high: string;
}

export type Tempo = 'slow' | 'medium' | 'fast';
export const TEMPOS: readonly Tempo[] = ['slow', 'medium', 'fast'];

export const TEMPO_NOTE_DURATION: Record<Tempo, number> = {
  slow: 1.0,
  medium: 0.7,
  fast: 0.45,
};

export const AUTO_NEXT_DELAY_MS = 1500;
