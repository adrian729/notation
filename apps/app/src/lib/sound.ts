import { createAudioContext, createSharedPlayer, defaultInstrument, unlockAudio } from '@polyhymnia/web-audio/webaudio';
import type { Playback, Player } from '@polyhymnia/web-audio/webaudio';
import { loadSampler } from '@polyhymnia/web-audio/sampler';
import type { Instrument, NoteEvent } from '@polyhymnia/web-audio';
import { isInstrumentId, sampleList, type InstrumentId } from './instruments';
import { readJson, writeJson } from './storage';

const STORAGE_KEY = 'polyhymnia:instrument';

export interface Sound {
  playEvents(events: readonly NoteEvent[], lead?: number): Playback;
  stop(): void;
}

let choice: InstrumentId = 'synth';
let sampled: Instrument | undefined;
const listeners = new Set<() => void>();

export function getInstrument(): InstrumentId {
  return choice;
}

export function subscribeInstrument(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setInstrument(id: InstrumentId): void {
  choice = id;
  writeJson(STORAGE_KEY, id);
  listeners.forEach((listener) => listener());
  if (id === 'synth') {
    sampled = undefined;
    return;
  }
  const ctx = createAudioContext();
  loadSampler(ctx, { out: ctx.destination, samples: sampleList(id) }).then(
    (instrument) => {
      if (choice === id) sampled = instrument;
    },
    () => {},
  );
}

const stored = readJson(STORAGE_KEY);
if (isInstrumentId(stored) && stored !== 'synth') setInstrument(stored);

function currentInstrument(ctx: AudioContext): Instrument {
  const synth = defaultInstrument(ctx);
  const active = () => sampled ?? synth;
  return {
    noteOn: (...args) => active().noteOn(...args),
    stopAll: () => active().stopAll(),
  };
}

export function createSound(): Sound {
  let player: Player | undefined;
  const get = () => (player ??= createSharedPlayer(currentInstrument));
  return {
    playEvents: (events, lead) => get().play(events, lead === undefined ? undefined : { lead }),
    stop: () => player?.stop(),
  };
}

export function unlockSound(): () => void {
  return unlockAudio(createAudioContext());
}
