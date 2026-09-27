import { createAudioContext, createPlayer, synthInstrument, unlockAudio } from '@polyhymnia/audio/webaudio';
import type { Playback } from '@polyhymnia/audio/webaudio';
import { midiOfPitch } from '@polyhymnia/audio';
import type { NoteEvent, PitchLike } from '@polyhymnia/audio';
import type { NoteId, TimeMap } from '@polyhymnia/notation-react';

let ctx: AudioContext | undefined;

function sharedContext(): AudioContext {
  ctx ??= createAudioContext();
  return ctx;
}

export interface Sound {
  playEvents(events: readonly NoteEvent[], lead?: number): Playback;
  playNote(midi: number | undefined, duration?: number): Playback | undefined;
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
  const sound: Sound = {
    playEvents: (events, lead) => get().play(events, lead === undefined ? undefined : { lead }),
    playNote: (midi, duration = 0.6) =>
      midi === undefined ? undefined : sound.playEvents([{ midi, start: 0, duration }], 0),
    stop: () => player?.stop(),
  };
  return sound;
}

export function unlockSound(): () => void {
  return unlockAudio(sharedContext());
}

export function midiOfId(timeMap: TimeMap | undefined, id: NoteId, pitch?: PitchLike | null): number | undefined {
  const entry = timeMap?.byId(id);
  const midi = entry?.midiNotes?.[entry.ids.indexOf(id)] ?? entry?.midi;
  if (midi !== undefined) return midi;
  return pitch ? midiOfPitch(pitch) : undefined;
}
