# Audio

`packages/web-audio` (`@polyhymnia/web-audio`) makes sound for ear-training exercises. It has no workspace dependencies: it takes MIDI numbers and seconds, never MNX, pitch strings, timelines or React. Score sound comes from the `@polyhymnia/mnx-score` timeline: `performance(timeline, {tempo?})` returns `{id, midi, startSeconds, durationSeconds, velocity?}` events, `durationSeconds` and `tickAtSeconds`; the app maps them to `NoteEvent`s, passing `velocity` through (`playback.md` "Dynamics and articulations"). Rules live in `AGENTS.md` under "Audio".

## Entries

- `@polyhymnia/web-audio` (pure, no DOM, no Web Audio): `NoteEvent`, `Clip`, `midiToFrequency`, `melodic`, `harmonic`, `shift`, `concat`, `transpose`, and type `Instrument`.
- `@polyhymnia/web-audio/webaudio` (DOM lib): `synthInstrument`, `createPlayer`, `createAudioContext`, `unlockAudio`, `createSharedPlayer`, `defaultInstrument`, and types `Player`, `Playback`, `PlayResult`.
- `@polyhymnia/web-audio/sampler` (DOM lib): `loadSampler(ctx, { out, samples: { midi, url }[] })` resolves to an `Instrument`, and type `Sample`.

## Events and clips

```ts
interface NoteEvent { id?: string; midi: number; start: number; duration: number; velocity?: number }
interface Clip { events: readonly NoteEvent[]; durationSeconds: number }
performance(timeline, { tempo?: TempoOverride }): { events, durationSeconds, tickAtSeconds }   // @polyhymnia/mnx-score — the source of score events; events carry velocity? (omitted at 0.8)
```

Which timeline to use: `layout.timeline` (or `handle.getTimeline()`) for a laid-out score, so the cursor and the sound share ids and one clock; `buildTimeline(doc, {scope: 'all'})` for whole-score playback of every part, staff and voice. Ids inside the default scope are identical in both, so notes outside the layout simply get no highlight or cursor.

Times are seconds from clip start. `midi` may be fractional; `id` is an MNX note id (synthesized positional ids for id-less notes). Builders (`melodic`, `harmonic`) produce events without ids; they take MIDI numbers only: `melodic(midis, {noteDuration, gap})`, `harmonic(midis, {duration})`. Callers convert pitches with `@polyhymnia/music-theory` (`midiOf`); audio never parses pitch strings. Interval and scale naming belongs to the exercise layer. `concat` starts each list where the previous one's last note ends; a list's trailing gap is not included (add a rest-length `shift` if needed). `Player.play` throws `RangeError` on non-finite input.

`performance` merges tied notes per voice, then walks the timeline's play-order segments: each segment is offset by the summed seconds of the earlier segments (same `tempo` override throughout), takes merged notes starting in `[fromTick, toTick)`, clamps each duration to `toTick` (a tie straddling a repeat barline is clipped, and re-attacks on the next pass), skips rests and spaces, and emits one event per chord member with that note's own id and midi. Dynamics and accents set each event's `velocity` (omitted at the 0.8 default) and staccato/staccatissimo shorten its duration (`playback.md`). `tickAtSeconds(s)` is the timeline's `secondsToWrittenTick` under the same tempo, so the sound and the cursor share one clock mapping: feed it `playback.time()` and pass the result to `handle.setPlaybackTick`.

## Player

`createPlayer(ctx, instrument).play(events, { lead? })` returns `{ time(), stop(), finished }`.

- A new `play` stops the previous one (`stopAll`); to layer, use a second player with its own `synthInstrument` (`stopAll` is per instrument; `synthInstrument` has no dispose, drop the references), or to keep owners from cutting each other; the web app gives each component its own via `createSound()`.
- `ctx.resume()` is called synchronously at the top of `play`, so it must run inside a user gesture. `play` validates all events first and throws `RangeError` before scheduling anything. If the context is not running after `resume()` and `navigator.userActivation.hasBeenActive` is false (no gesture yet), nothing is scheduled and `finished` resolves `'blocked'`; with prior activation it schedules normally. `'blocked'` also settles if `resume()` rejects and the context is still not running. Without `userActivation` support, only the rejection path applies.
- `time()` = seconds since clip start minus `outputLatency ?? baseLatency`, clamped at 0; frozen at its final value once `finished` settles.
- `lead` defaults to 60 ms; pass 0 for hover-to-hear.
- `finished` resolves `'ended' | 'stopped' | 'blocked'` from a silent source's `onended`, which fires at last note end + output latency + 0.1 s, so cursor and highlight outlast the last audible note. The package has no timers and no rAF.
- Everything is scheduled up front; there is no look-ahead.

`synthInstrument(ctx, { out })` is oscillators plus ADSR through a master gain and compressor; `stopAll` ramps sounding voices out in about 25 ms and silences not-yet-started voices immediately. Attack and decay shrink for notes shorter than 0.11 s. `createAudioContext()` is a singleton (sets `audioSession` to `playback` where available); `unlockAudio(ctx?)` resumes it (when not running) on `pointerdown`, `pointerup`, `click`, `touchend` and `keydown` until the returned remover is called. `createAudioContext()` recreates the context if the shared one is closed and throws if `AudioContext` is missing.

`createSharedPlayer(makeInstrument?)` is the one-liner an app's own `createSound()` wraps: it calls `createAudioContext()` (already a singleton, so callers never need their own context cache) and builds a `Player` against it with `makeInstrument` (default: `defaultInstrument`, i.e. `synthInstrument(ctx, { out: ctx.destination })`). Each `createSound()` call still keeps its own lazily-created `Player` — so independent owners don't stop each other's playback — while sharing the one underlying `AudioContext`.

## Extension seam

`Instrument { noteOn(midi, when, duration, velocity?), stopAll() }` is DOM-free. `loadSampler` is the sample-player implementation: it fetches and decodes every sample up front (rejecting if any fails), trims leading silence and peak-normalizes at decode time, and `noteOn` plays the nearest sample repitched by `playbackRate`, fading out over 80 ms at note end. Drones or per-voice instruments are new `Instrument` implementations behind their own entry, pinned, with permission to install any dependency. Deferred: seek/slice/loop, count-in, metronome, MIDI export, grace notes, tempo ramps, fermata holds.

## App responsibilities

- Own the UI clock: a rAF hook calls `handle.setPlaybackTick(performed.tickAtSeconds(playback.time()))`.
- Call `stop()` on exercise unmount.
- Keep quiz data about notes in the app, keyed by note id.
- Hover-to-hear on score notes resolves midi from `timeline.byId(id)` (the entry's `notes[]` carry `{id, midi}`), falling back to the hit's `pitch` when the id is not in the timeline (app helper `midiOfId`).
