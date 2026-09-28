import { createAudioContext, createSharedPlayer, unlockAudio } from '@polyhymnia/audio/webaudio';
import type { Playback, Player } from '@polyhymnia/audio/webaudio';
import type { NoteEvent } from '@polyhymnia/audio';

export interface Sound {
  playEvents(events: readonly NoteEvent[], lead?: number): Playback;
  stop(): void;
}

export function createSound(): Sound {
  let player: Player | undefined;
  const get = () => (player ??= createSharedPlayer());
  return {
    playEvents: (events, lead) => get().play(events, lead === undefined ? undefined : { lead }),
    stop: () => player?.stop(),
  };
}

export function unlockSound(): () => void {
  return unlockAudio(createAudioContext());
}
