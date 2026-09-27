import { createAudioContext, createPlayer, synthInstrument, unlockAudio } from '@polyhymnia/audio/webaudio';
import type { Playback } from '@polyhymnia/audio/webaudio';
import type { NoteEvent } from '@polyhymnia/audio';

let ctx: AudioContext | undefined;

function sharedContext(): AudioContext {
  ctx ??= createAudioContext();
  return ctx;
}

export interface Sound {
  playEvents(events: readonly NoteEvent[], lead?: number): Playback;
  stop(): void;
}

export function createSound(): Sound {
  let player: ReturnType<typeof createPlayer> | undefined;
  const get = () => {
    if (!player) {
      const c = sharedContext();
      player = createPlayer(c, synthInstrument(c, { out: c.destination }));
    }
    return player;
  };
  return {
    playEvents: (events, lead) => {
      player?.stop();
      return get().play(events, lead === undefined ? undefined : { lead });
    },
    stop: () => player?.stop(),
  };
}

export function unlockSound(): () => void {
  return unlockAudio(sharedContext());
}
