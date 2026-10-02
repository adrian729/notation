import { createAudioContext, createSharedPlayer, unlockAudio } from '@polyhymnia/web-audio/webaudio';
import type { Playback, Player } from '@polyhymnia/web-audio/webaudio';
import type { NoteEvent } from '@polyhymnia/web-audio';
import { midiOf, type PitchLike } from '@polyhymnia/music-theory';
import type { NoteId } from '@polyhymnia/mnx';
import type { Timeline } from '@polyhymnia/mnx-score';

export interface Sound {
  playEvents(events: readonly NoteEvent[], lead?: number): Playback;
  playNote(midi: number | undefined, duration?: number): Playback | undefined;
  stop(): void;
}

export function createSound(): Sound {
  let player: Player | undefined;
  const get = () => (player ??= createSharedPlayer());
  const sound: Sound = {
    playEvents: (events, lead) => get().play(events, lead === undefined ? undefined : { lead }),
    playNote: (midi, duration = 0.6) =>
      midi === undefined ? undefined : sound.playEvents([{ midi, start: 0, duration }], 0),
    stop: () => player?.stop(),
  };
  return sound;
}

export function unlockSound(): () => void {
  return unlockAudio(createAudioContext());
}

export function midiOfId(timeline: Timeline | undefined, id: NoteId, pitch?: PitchLike | null): number | undefined {
  const midi = timeline?.byId(id)?.notes.find((n) => n.id === id)?.midi;
  if (midi !== undefined) return midi;
  return pitch ? midiOf(pitch) : undefined;
}
